import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabase } from '@/lib/supabase/clients';

function allowedAmazonUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!/(^|\.)amazon\.com\.br$|(^|\.)amazon\.com$/.test(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
}

function sanitizeReferrer(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    return url.toString().slice(0, 300);
  } catch {
    return null;
  }
}

function sanitizeUserAgent(raw: string | null): string | null {
  if (!raw) return null;
  return raw.slice(0, 150);
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await createServerSupabase();
  const { data: book, error } = await client
    .from('books')
    .select('id,amazon_url')
    .eq('slug', slug)
    .maybeSingle();

  const destination = allowedAmazonUrl(book?.amazon_url ?? null);
  if (error || !book || !destination) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  try {
    const { data: claims } = await client.auth.getClaims();
    const userId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;

    await client.from('affiliate_clicks').insert({
      book_id: book.id,
      user_id: userId,
      target_url: destination.origin + destination.pathname,
      tag: 'amazon',
      referrer: sanitizeReferrer(request.headers.get('referer')),
      user_agent: sanitizeUserAgent(request.headers.get('user-agent')),
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { service: 'affiliate-tracking' },
    });
  }

  return NextResponse.redirect(destination, 302);
}
