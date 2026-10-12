import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';
import type { Database } from '@/types/database';

export type ChallengeRow = Pick<
  Database['public']['Tables']['challenges']['Row'],
  'id' | 'title' | 'description' | 'year' | 'created_at'
>;

export type UserChallengeRow = Pick<
  Database['public']['Tables']['user_challenges']['Row'],
  'challenge_id' | 'progress' | 'completed_at'
>;

export type ChallengesPageData = {
  userId: string | null;
  challenges: ChallengeRow[];
  progress: UserChallengeRow[];
  challengesError: boolean;
  progressError: boolean;
};

export async function getChallengesPageData(): Promise<ChallengesPageData> {
  try {
    const client = await createServerSupabase();

    const challengesPromise = client
      .from('challenges')
      .select('id,title,description,year,created_at')
      .order('created_at', { ascending: false })
      .limit(36);

    const [claimsResult, challengesResult] = await Promise.all([
      client.auth.getClaims(),
      challengesPromise,
    ]);

    const userId = claimsResult.data?.claims?.sub ?? null;
    const progressResult = userId
      ? await client
          .from('user_challenges')
          .select('challenge_id,progress,completed_at')
          .eq('user_id', userId)
          .limit(100)
      : { data: [], error: null };

    return {
      userId,
      challenges: (challengesResult.data ?? []) as ChallengeRow[],
      progress: (progressResult.data ?? []) as UserChallengeRow[],
      challengesError: Boolean(challengesResult.error),
      progressError: Boolean(progressResult.error),
    };
  } catch {
    return {
      userId: null,
      challenges: [],
      progress: [],
      challengesError: true,
      progressError: false,
    };
  }
}
