import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/clients';
/** Fields safe for this public list; ownership and counters are not needed by the UI. */
export type PublicTimedComment = { id: string; chapter_id: string; video_sec: number; content: string | null; is_spoiler: boolean; is_locked: boolean; created_at: string } & {
  comment_count: number;
  distinct_commenters: number;
};
export type TimedComment = PublicTimedComment;

const chapterIdSchema = z.string().uuid();
export const DEFAULT_TIMED_COMMENT_LIMIT = 50;
export const MAX_TIMED_COMMENT_LIMIT = 100;

function safeLimit(limit: number): number {
  return Number.isInteger(limit) && limit > 0
    ? Math.min(limit, MAX_TIMED_COMMENT_LIMIT)
    : DEFAULT_TIMED_COMMENT_LIMIT;
}

/**
 * Reads through the publishable server client so Postgres RLS remains the final
 * authority. The chapter predicate is deliberately explicit even though the
 * table policy also applies to the request.
 */
export async function getTimedComments(chapterId: string, limit = DEFAULT_TIMED_COMMENT_LIMIT): Promise<PublicTimedComment[]> {
  if (!chapterIdSchema.safeParse(chapterId).success) return [];

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc('get_visible_video_timed_comments', { p_chapter: chapterId, p_limit: safeLimit(limit) });

    if (error) {
      console.error('Timed comments query failed', error.code);
      return [];
    }

    const { data: stats, error: statsError } = await supabase
      .from('v_video_timed_comment_stats')
      .select('chapter_id,video_sec,comment_count,distinct_commenters')
      .eq('chapter_id', chapterId)
      .limit(safeLimit(limit));
    if (statsError) console.error('Timed comment stats query failed', statsError.code);
    const statsBySecond = new Map((stats ?? []).map((row) => [`${row.chapter_id}:${row.video_sec}`, row]));
    const visibleComments = (data ?? []) as PublicTimedComment[];
    return visibleComments.map((comment) => {
      const aggregate = statsBySecond.get(`${comment.chapter_id}:${comment.video_sec}`);
      return {
        ...(comment as Omit<PublicTimedComment, 'comment_count' | 'distinct_commenters'>),
        comment_count: aggregate?.comment_count ?? 1,
        distinct_commenters: aggregate?.distinct_commenters ?? 1,
      };
    });
  } catch (cause) {
    console.error('Timed comments unavailable', cause instanceof Error ? cause.name : 'unknown_error');
    return [];
  }
}

export const getVideoTimedComments = getTimedComments;
