import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';
import type { NotificationItemRecord } from './presentation';
import type { NotificationCursorInput } from './schemas';

export interface NotificationFeedResult {
  authenticated: boolean;
  userId: string | null;
  unreadCount: number;
  items: NotificationItemRecord[];
  nextCursor: { beforeCreatedAt: string; beforeId: string } | null;
  preferences: {
    replies: boolean;
    mentions: boolean;
    meetingReminders: boolean;
    channelActivity: boolean;
  };
}

const DEFAULT_PREFERENCES = {
  replies: true,
  mentions: true,
  meetingReminders: true,
  channelActivity: false,
};

export async function getNotificationFeed(
  cursor?: Partial<NotificationCursorInput>,
): Promise<NotificationFeedResult> {
  const limit = Math.min(Math.max(cursor?.limit ?? 15, 1), 30);
  try {
    const supabase = await createServerSupabase();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub ?? null;

    if (claimsError || !userId) {
      return {
        authenticated: false,
        userId: null,
        unreadCount: 0,
        items: [],
        nextCursor: null,
        preferences: DEFAULT_PREFERENCES,
      };
    }

    let listQuery = supabase
      .from('notifications')
      .select('id,kind,payload,created_at,read_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (cursor?.unreadOnly) {
      listQuery = listQuery.is('read_at', null);
    }

    if (cursor?.beforeCreatedAt && cursor?.beforeId) {
      listQuery = listQuery.or(
        `created_at.lt.${cursor.beforeCreatedAt},and(created_at.eq.${cursor.beforeCreatedAt},id.lt.${cursor.beforeId})`,
      );
    }

    const [{ data: rows }, { count: unreadCount }, { data: prefRow }] = await Promise.all([
      listQuery,
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null),
      supabase
        .from('user_notification_preferences')
        .select('replies,mentions,meeting_reminders,channel_activity')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const allRows = (rows ?? []) as NotificationItemRecord[];
    const hasMore = allRows.length > limit;
    const items = hasMore ? allRows.slice(0, limit) : allRows;
    const lastItem = items[items.length - 1];

    return {
      authenticated: true,
      userId,
      unreadCount: unreadCount ?? 0,
      items,
      nextCursor:
        hasMore && lastItem
          ? { beforeCreatedAt: lastItem.created_at, beforeId: lastItem.id }
          : null,
      preferences: prefRow
        ? {
            replies: prefRow.replies,
            mentions: prefRow.mentions,
            meetingReminders: prefRow.meeting_reminders,
            channelActivity: prefRow.channel_activity,
          }
        : DEFAULT_PREFERENCES,
    };
  } catch {
    return {
      authenticated: false,
      userId: null,
      unreadCount: 0,
      items: [],
      nextCursor: null,
      preferences: DEFAULT_PREFERENCES,
    };
  }
}
