'use server';

import { revalidatePath } from 'next/cache';
import { isReadOnlyPreview, READ_ONLY_PREVIEW_MESSAGE } from '@/lib/actions/read-only';
import { createServerSupabase } from '@/lib/supabase/clients';

export type NotificationActionState = {
  status: 'idle' | 'success' | 'error' | 'login';
  message: string;
};

export async function markNotificationRead(
  _previousState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  if (isReadOnlyPreview()) return { status: 'error', message: READ_ONLY_PREVIEW_MESSAGE };
  const notificationId = formData.get('notificationId');
  const markAll = formData.get('markAll') === 'true';

  if (!markAll && (typeof notificationId !== 'string' || notificationId.trim().length === 0 || notificationId.length > 200)) {
    return { status: 'error', message: 'Não foi possível identificar esta notificação.' };
  }

  try {
    const client = await createServerSupabase();
    const { data: claimsData, error: claimsError } = await client.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return { status: 'login', message: 'Sua sessão expirou. Entre novamente para atualizar notificações.' };
    }

    const { error } = await client.rpc('mark_my_notifications_read', {
      p_ids: !markAll && typeof notificationId === 'string' ? [notificationId.trim()] : null,
      p_before: markAll ? new Date().toISOString() : null,
    });

    if (error) {
      return { status: 'error', message: 'Não foi possível atualizar esta notificação. Tente novamente.' };
    }

    revalidatePath('/notificacoes');
    return {
      status: 'success',
      message: markAll ? 'Todas as notificações foram marcadas como lidas.' : 'Notificação marcada como lida.',
    };
  } catch {
    return { status: 'error', message: 'Não foi possível atualizar esta notificação. Tente novamente.' };
  }
}

export async function saveNotificationPreferences(
  _previousState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  if (isReadOnlyPreview()) return { status: 'error', message: READ_ONLY_PREVIEW_MESSAGE };

  const replies = formData.get('replies') === 'on';
  const mentions = formData.get('mentions') === 'on';
  const meetingReminders = formData.get('meetingReminders') === 'on';
  const channelActivity = formData.get('channelActivity') === 'on';

  try {
    const client = await createServerSupabase();
    const { data: claimsData, error: claimsError } = await client.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return { status: 'login', message: 'Sua sessão expirou. Entre novamente para salvar preferências.' };
    }

    const { error } = await client.rpc('set_my_notification_preferences', {
      p_replies: replies,
      p_mentions: mentions,
      p_meeting_reminders: meetingReminders,
      p_channel_activity: channelActivity,
    });

    if (error) {
      return { status: 'error', message: 'Não foi possível salvar suas preferências agora.' };
    }

    revalidatePath('/notificacoes');
    return { status: 'success', message: 'Preferências de notificação atualizadas.' };
  } catch {
    return { status: 'error', message: 'Não foi possível salvar suas preferências agora.' };
  }
}
