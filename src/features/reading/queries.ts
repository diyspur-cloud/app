import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';
import type { BookReadingStatus } from './schemas';

export interface MyBookReadingState {
  bookId: string;
  status: BookReadingStatus;
  source: string;
  firstStartedAt: string | null;
  firstCompletedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  version: number;
}

export interface BookReadingStatsView {
  bookId: string;
  startedReaders: number;
  activeReaders: number;
  completedReaders: number;
  newReaders30d: number;
  completedReaders30d: number;
  rankPosition: number | null;
  updatedAt: string | null;
}

export async function getMyBookReadingState(
  bookId: string,
): Promise<MyBookReadingState | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub ?? null;
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_book_readings')
      .select(
        'book_id,status,source,first_started_at,first_completed_at,completed_at,updated_at,version',
      )
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      bookId: data.book_id,
      status: data.status,
      source: data.source,
      firstStartedAt: data.first_started_at,
      firstCompletedAt: data.first_completed_at,
      completedAt: data.completed_at,
      updatedAt: data.updated_at,
      version: data.version,
    };
  } catch {
    return null;
  }
}

export async function getBookReadingStats(bookId: string): Promise<BookReadingStatsView> {
  const empty: BookReadingStatsView = {
    bookId,
    startedReaders: 0,
    activeReaders: 0,
    completedReaders: 0,
    newReaders30d: 0,
    completedReaders30d: 0,
    rankPosition: null,
    updatedAt: null,
  };

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('v_book_reading_stats')
      .select(
        'book_id,started_readers,active_readers,completed_readers,new_readers_30d,completed_readers_30d,rank_position,updated_at',
      )
      .eq('book_id', bookId)
      .maybeSingle();

    if (error || !data) return empty;

    return {
      bookId: data.book_id ?? bookId,
      startedReaders: data.started_readers ?? 0,
      activeReaders: data.active_readers ?? 0,
      completedReaders: data.completed_readers ?? 0,
      newReaders30d: data.new_readers_30d ?? 0,
      completedReaders30d: data.completed_readers_30d ?? 0,
      rankPosition: data.rank_position,
      updatedAt: data.updated_at,
    };
  } catch {
    return empty;
  }
}
