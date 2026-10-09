import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';
import type { Database } from '@/types/database';

export type NotificationRow = Pick<
  Database['public']['Tables']['notifications']['Row'],
  'id' | 'kind' | 'payload' | 'created_at' | 'read_at'
>;

export type NotificationsPageData = {
  userId: string | null;
  notifications: NotificationRow[];
  error: boolean;
};

export async function getNotificationsPageData(): Promise<NotificationsPageData> {
  try {
    const client = await createServerSupabase();
    const { data: claimsData, error: claimsError } = await client.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return { userId: null, notifications: [], error: Boolean(claimsError) };
    }

    const { data, error } = await client
      .from('notifications')
      .select('id,kind,payload,created_at,read_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    return {
      userId,
      notifications: (data ?? []) as NotificationRow[],
      error: Boolean(error),
    };
  } catch {
    return { userId: null, notifications: [], error: true };
  }
}
