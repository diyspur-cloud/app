import { createServerSupabase } from '@/lib/supabase/clients';
import type { Database } from '@/types/database';

type PollRow = Database['public']['Tables']['book_polls']['Row'];
type PollOptionRow = Database['public']['Tables']['book_poll_options']['Row'];

type PublicPollOption = Pick<PollOptionRow, 'id' | 'poll_id' | 'proposal' | 'votes_count'>;

export type PublicPoll = Pick<PollRow, 'id' | 'title' | 'opens_at' | 'closes_at' | 'status'> & {
  options: PublicPollOption[];
  closed?: boolean;
};

const pollColumns = 'id,title,opens_at,closes_at,status';
const optionColumns = 'id,poll_id,proposal,votes_count';

export function isPollInWindow(poll: Pick<PollRow, 'status' | 'opens_at' | 'closes_at'>, now = new Date()): boolean {
  const opensAt = new Date(poll.opens_at).getTime();
  const closesAt = new Date(poll.closes_at).getTime();
  const currentTime = now.getTime();
  return poll.status === 'open'
    && Number.isFinite(opensAt)
    && Number.isFinite(closesAt)
    && opensAt <= currentTime
    && currentTime <= closesAt;
}

export async function getPublicPolls(now = new Date()): Promise<PublicPoll[]> {
  try {
    const supabase = await createServerSupabase();
    const nowIso = now.toISOString();
    const { data: polls, error: pollsError } = await supabase
      .from('book_polls')
      .select(pollColumns)
      .eq('status', 'open')
      .lte('opens_at', nowIso)
      .gte('closes_at', nowIso)
      .order('opens_at', { ascending: false })
      .limit(12);

    if (pollsError || !polls?.length) {
      if (pollsError) console.error('Public polls query failed', pollsError.code);
      return [];
    }

    const activePolls = polls.filter((poll) => isPollInWindow(poll, now));
    if (!activePolls.length) return [];

    const pollIds = activePolls.map((poll) => poll.id);
    const { data: options, error: optionsError } = await supabase
      .from('book_poll_options')
      .select(optionColumns)
      .in('poll_id', pollIds)
      .order('id', { ascending: true });

    if (optionsError) {
      console.error('Public poll options query failed', optionsError.code);
      return [];
    }

    const optionsByPoll = new Map<string, PublicPollOption[]>();
    for (const option of options ?? []) {
      const pollOptions = optionsByPoll.get(option.poll_id) ?? [];
      pollOptions.push(option);
      optionsByPoll.set(option.poll_id, pollOptions);
    }

    return activePolls
      .map((poll) => ({ ...poll, options: optionsByPoll.get(poll.id) ?? [] }))
      .filter((poll) => poll.options.length > 0);
  } catch (cause) {
    console.error('Public polls unavailable', cause instanceof Error ? cause.name : 'unknown_error');
    return [];
  }
}

export async function getClosedPolls(now = new Date()): Promise<PublicPoll[]> {
  try {
    const supabase = await createServerSupabase();
    const { data: polls, error } = await supabase.from('book_polls').select(pollColumns).eq('status', 'closed').lte('closes_at', now.toISOString()).order('closes_at', { ascending: false }).limit(12);
    if (error || !polls?.length) return [];
    const { data: options, error: optionsError } = await supabase.from('book_poll_options').select(optionColumns).in('poll_id', polls.map((poll) => poll.id)).order('id', { ascending: true });
    if (optionsError) return [];
    const byPoll = new Map<string, PublicPollOption[]>();
    for (const option of options ?? []) byPoll.set(option.poll_id, [...(byPoll.get(option.poll_id) ?? []), option]);
    return polls.map((poll) => ({ ...poll, closed: true, options: byPoll.get(poll.id) ?? [] })).filter((poll) => poll.options.length > 0);
  } catch (cause) {
    console.error('Closed polls unavailable', cause instanceof Error ? cause.name : 'unknown_error');
    return [];
  }
}
