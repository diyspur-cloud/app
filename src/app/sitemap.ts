import type { MetadataRoute } from 'next';
import * as Sentry from '@sentry/nextjs';
import { createServerSupabase } from '@/lib/supabase/clients';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diyspur.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ['', 'livros', 'calendario', 'comunidade', 'clubes', 'privacidade', 'termos'];
  const fixed: MetadataRoute.Sitemap = routes.map((route) => ({
    url: new URL(route, siteUrl).toString(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.7,
  }));

  try {
    const client = await createServerSupabase();
    const { data: books } = await client
      .from('books')
      .select('id,slug,updated_at')
      .order('created_at', { ascending: false })
      .limit(100);

    const { data: seasons } = await client
      .from('seasons')
      .select('id,slug,status,created_at')
      .in('status', ['active', 'finished'])
      .limit(36);

    const now = new Date().toISOString();
    const seasonIds = (seasons ?? []).map((s) => s.id);
    const { data: chapters } = seasonIds.length
      ? await client
          .from('chapters')
          .select('id,season_id,published_at,is_draft')
          .in('season_id', seasonIds)
          .eq('is_draft', false)
          .or(`published_at.is.null,published_at.lte.${now}`)
          .limit(200)
      : { data: [] };

    const bookRoutes: MetadataRoute.Sitemap = (books ?? []).map((book) => ({
      url: new URL(`livros/${encodeURIComponent(book.slug)}`, siteUrl).toString(),
      ...(book.updated_at ? { lastModified: new Date(book.updated_at) } : {}),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    const seasonRoutes: MetadataRoute.Sitemap = (seasons ?? []).map((season) => ({
      url: new URL(`temporadas/${encodeURIComponent(season.slug)}`, siteUrl).toString(),
      ...(season.created_at ? { lastModified: new Date(season.created_at) } : {}),
      changeFrequency: 'weekly',
      priority: 0.65,
    }));

    const chapterRoutes: MetadataRoute.Sitemap = (chapters ?? []).map((chapter) => ({
      url: new URL(`capitulos/${chapter.id}`, siteUrl).toString(),
      ...(chapter.published_at ? { lastModified: new Date(chapter.published_at) } : {}),
      changeFrequency: 'weekly',
      priority: 0.55,
    }));

    return [...fixed, ...bookRoutes, ...seasonRoutes, ...chapterRoutes];
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'sitemap' },
    });
    return fixed;
  }
}
