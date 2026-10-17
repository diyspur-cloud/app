'use server';

import { revalidatePath } from 'next/cache';
import { mapDatabaseError } from '@/lib/actions/database-errors';
import { isReadOnlyPreview, READ_ONLY_PREVIEW_MESSAGE } from '@/lib/actions/read-only';
import { createServerSupabase } from '@/lib/supabase/clients';
import {
  markNotificationsReadSchema,
  notificationPreferencesSchema,
  type MarkNotificationsReadInput,
  type NotificationPreferencesInput,
} from './schemas';

export async function markNotificationsReadAction(input: MarkNotificationsReadInput): Promise<{
  ok: boolean;
  updatedCount: number;
  message?: string;
}> {
  if (isReadOnlyPreview()) {
    return { ok: false, updatedCount: 0, message: READ_ONLY_PREVIEW_MESSAGE };
  }

  const parsed = markNotificationsReadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      updatedCount: 0,
      message: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
    };
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc('mark_my_notifications_read', {
      p_ids: parsed.data.ids ?? null,
      p_before: parsed.data.before ?? null,
    });

    if (error) {
      const mapped = mapDatabaseError(error.code, error.message);
      return { ok: false, updatedCount: 0, message: mapped.message };
    }

    revalidatePath('/notificacoes');
    return { ok: true, updatedCount: typeof data === 'number' ? data : 0 };
  } catch {
    return {
      ok: false,
      updatedCount: 0,
      message: 'Não foi possível atualizar as notificações agora.',
    };
  }
}

export async function updateNotificationPreferencesAction(
  input: NotificationPreferencesInput,
): Promise<{ ok: boolean; message: string }> {
  if (isReadOnlyPreview()) {
    return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  }

  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? 'Preferências inválidas.',
    };
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc('set_my_notification_preferences', {
      p_replies: parsed.data.replies,
      p_mentions: parsed.data.mentions,
      p_meeting_reminders: parsed.data.meetingReminders,
      p_channel_activity: parsed.data.channelActivity,
    });

    if (error) {
      const mapped = mapDatabaseError(error.code, error.message);
      return { ok: false, message: mapped.message };
    }

    revalidatePath('/notificacoes');
    return { ok: true, message: 'Preferências de notificação salvas.' };
  } catch {
    return { ok: false, message: 'Não foi possível salvar suas preferências agora.' };
  }
}
