import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';

export interface RankedBookItem {
  bookId: string;
  slug: string;
  title: string;
  authorName: string;
  coverUrl: string | null;
  startedReaders: number;
  activeReaders: number;
  completedReaders: number;
  newReaders30d: number;
  completedReaders30d: number;
  rankPosition: number;
}

export async function getBooksReadingRanking(limit = 50): Promise<RankedBookItem[]> {
  try {
    const supabase = await createServerSupabase();
    const [{ data: statsRows }, { data: booksRows }] = await Promise.all([
      supabase
        .from('v_book_reading_stats')
        .select(
          'book_id,started_readers,active_readers,completed_readers,new_readers_30d,completed_readers_30d,rank_position',
        )
        .order('rank_position', { ascending: true })
        .limit(limit),
      supabase
        .from('books')
        .select('id,slug,title,cover_url,authors(name)')
        .order('title', { ascending: true }),
    ]);

    const booksMap = new Map<
      string,
      { slug: string; title: string; authorName: string; coverUrl: string | null }
    >();

    for (const b of booksRows ?? []) {
      const authorRel = b.authors as { name?: string } | { name?: string }[] | null;
      const authorName = Array.isArray(authorRel)
        ? (authorRel[0]?.name ?? 'Autoria editorial')
        : (authorRel?.name ?? 'Autoria editorial');
      booksMap.set(b.id, {
        slug: b.slug,
        title: b.title,
        authorName,
        coverUrl: b.cover_url,
      });
    }

    const items: RankedBookItem[] = [];
    for (const row of statsRows ?? []) {
      if (!row.book_id) continue;
      const meta = booksMap.get(row.book_id);
      if (!meta) continue;
      items.push({
        bookId: row.book_id,
        slug: meta.slug,
        title: meta.title,
        authorName: meta.authorName,
        coverUrl: meta.coverUrl,
        startedReaders: row.started_readers ?? 0,
        activeReaders: row.active_readers ?? 0,
        completedReaders: row.completed_readers ?? 0,
        newReaders30d: row.new_readers_30d ?? 0,
        completedReaders30d: row.completed_readers_30d ?? 0,
        rankPosition: row.rank_position ?? items.length + 1,
      });
    }

    return items;
  } catch {
    return [];
  }
}
