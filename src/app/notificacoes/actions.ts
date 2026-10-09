'use server';

import { revalidatePath } from 'next/cache';

import { createServerSupabase } from '@/lib/supabase/clients';

export type NotificationActionState = {
  status: 'idle' | 'success' | 'error' | 'login';
  message: string;
};

export async function markNotificationRead(
  _previousState: NotificationActionState,
  formData: FormData,
): Promise<NotificationActionState> {
  if (process.env.DIYSPUR_READ_ONLY_PREVIEW === '1') return { status: 'error', message: 'A prévia pública está em modo somente leitura.' };
  const notificationId = formData.get('notificationId');

  if (typeof notificationId !== 'string' || notificationId.trim().length === 0 || notificationId.length > 200) {
    return { status: 'error', message: 'Não foi possível identificar esta notificação.' };
  }

  try {
    const client = await createServerSupabase();
    const { data: claimsData, error: claimsError } = await client.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return { status: 'login', message: 'Sua sessão expirou. Entre novamente para atualizar notificações.' };
    }

    const { data: updatedNotification, error } = await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id')
      .maybeSingle();

    if (error || !updatedNotification) {
      return { status: 'error', message: 'Não foi possível atualizar esta notificação. Tente novamente.' };
    }

    revalidatePath('/notificacoes');
    return { status: 'success', message: 'Notificação marcada como lida.' };
  } catch {
    return { status: 'error', message: 'Não foi possível atualizar esta notificação. Tente novamente.' };
  }
}
