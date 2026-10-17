import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';
import type { Database } from '@/types/database';

export type NotificationRow = Pick<
  Database['public']['Tables']['notifications']['Row'],
  'id' | 'kind' | 'payload' | 'created_at' | 'read_at'
>;

export type NotificationPreferencesData = {
  replies: boolean;
  mentions: boolean;
  meetingReminders: boolean;
  channelActivity: boolean;
};

export type NotificationsPageData = {
  userId: string | null;
  notifications: NotificationRow[];
  invitations: { id: string; club_id: string; expires_at: string; created_at: string }[];
  preferences: NotificationPreferencesData;
  error: boolean;
};

const DEFAULT_PREFS: NotificationPreferencesData = {
  replies: true,
  mentions: true,
  meetingReminders: true,
  channelActivity: false,
};

export async function getNotificationsPageData(): Promise<NotificationsPageData> {
  try {
    const client = await createServerSupabase();
    const { data: claimsData, error: claimsError } = await client.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return {
        userId: null,
        notifications: [],
        invitations: [],
        preferences: DEFAULT_PREFS,
        error: Boolean(claimsError),
      };
    }

    const [{ data, error }, { data: invitations }, { data: prefRow }] = await Promise.all([
      client
        .from('notifications')
        .select('id,kind,payload,created_at,read_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(50),
      client
        .from('user_club_invitations')
        .select('id,club_id,expires_at,created_at')
        .eq('invited_user_id', userId)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20),
      client
        .from('user_notification_preferences')
        .select('replies,mentions,meeting_reminders,channel_activity')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    return {
      userId,
      notifications: (data ?? []) as NotificationRow[],
      invitations: invitations ?? [],
      preferences: prefRow
        ? {
            replies: prefRow.replies,
            mentions: prefRow.mentions,
            meetingReminders: prefRow.meeting_reminders,
            channelActivity: prefRow.channel_activity,
          }
        : DEFAULT_PREFS,
      error: Boolean(error),
    };
  } catch {
    return {
      userId: null,
      notifications: [],
      invitations: [],
      preferences: DEFAULT_PREFS,
      error: true,
    };
  }
}
