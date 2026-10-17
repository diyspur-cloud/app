import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';

export type BookRankingTab = 'mais-lidos' | 'lendo' | 'concluidos' | 'desistencias';

export interface RankedBookItem {
  bookId: string;
  slug: string;
  title: string;
  authorName: string;
  coverUrl: string | null;
  startedReaders: number;
  activeReaders: number;
  completedReaders: number;
  dnfReaders: number;
  readingAudience: number;
  participants: number;
  dnfRate: number | null;
  rankPosition: number;
  activeRankPosition: number;
  completedRankPosition: number;
  dnfRankPosition: number;
  updatedAt: string | null;
}

const columnsByTab = {
  'mais-lidos': 'reading_audience',
  lendo: 'active_readers',
  concluidos: 'completed_readers',
  desistencias: 'dnf_readers',
} as const;

export async function getBooksReadingRanking(
  tab: BookRankingTab = 'mais-lidos',
  page = 1,
  pageSize = 25,
): Promise<{ items: RankedBookItem[]; hasNext: boolean }> {
  try {
    const supabase = await createServerSupabase();
    const safePage = Math.min(Math.max(Math.floor(page) || 1, 1), 1000);
    const start = (safePage - 1) * pageSize;
    const metric = columnsByTab[tab];

    const { data: stats, error } = await supabase
      .from('v_book_reading_stats')
      .select(
        'book_id,started_readers,active_readers,completed_readers,dnf_readers,reading_audience,participants,dnf_rate,rank_position,active_rank_position,completed_rank_position,dnf_rank_position,updated_at',
      )
      .gt(metric, 0)
      .order(metric, { ascending: false })
      .order('book_id', { ascending: true })
      .range(start, start + pageSize);

    if (error || !stats?.length) {
      return { items: [], hasNext: false };
    }

    const hasNext = stats.length > pageSize;
    const selectedStats = stats.slice(0, pageSize);
    const bookIds = selectedStats.map((s) => s.book_id).filter((id): id is string => Boolean(id));

    const { data: booksRows } = await supabase
      .from('books')
      .select('id,slug,title,cover_url,authors(name)')
      .in('id', bookIds);

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
    for (const row of selectedStats) {
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
        dnfReaders: row.dnf_readers ?? 0,
        readingAudience: row.reading_audience ?? 0,
        participants: row.participants ?? 0,
        dnfRate: row.dnf_rate ?? null,
        rankPosition: row.rank_position ?? items.length + 1,
        activeRankPosition: row.active_rank_position ?? items.length + 1,
        completedRankPosition: row.completed_rank_position ?? items.length + 1,
        dnfRankPosition: row.dnf_rank_position ?? items.length + 1,
        updatedAt: row.updated_at ?? null,
      });
    }

    return { items, hasNext };
  } catch {
    return { items: [], hasNext: false };
  }
}
