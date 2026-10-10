import type { MetadataRoute } from 'next';
import { getBooks } from '@/features/catalog/queries';
import { createServerSupabase } from '@/lib/supabase/clients';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diyspur.vercel.app';
  const fixed = ['', 'livros', 'calendario', 'comunidade', 'privacidade', 'termos'].map((path) => ({ url: new URL(path, base).toString(), changeFrequency: 'weekly' as const, priority: path === '' ? 1 : .7 }));
  const books = await getBooks();
  const client = await createServerSupabase();
  const { data: seasons } = await client.from('seasons').select('id,slug,status').in('status', ['active', 'finished']).limit(36);
  const { data: chapters } = seasons?.length ? await client.from('chapters').select('id,season_id,published_at').in('season_id', seasons.map((season) => season.id)).or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`).limit(200) : { data: [] };
  return [...fixed, ...books.map((book) => ({ url: new URL(`livros/${encodeURIComponent(book.slug)}`, base).toString(), changeFrequency: 'monthly' as const, priority: .6 })), ...(seasons ?? []).map((season) => ({ url: new URL(`temporadas/${encodeURIComponent(season.slug)}`, base).toString(), changeFrequency: 'weekly' as const, priority: .65 })), ...(chapters ?? []).map((chapter) => ({ url: new URL(`capitulos/${chapter.id}`, base).toString(), changeFrequency: 'weekly' as const, priority: .55 }))];
}
