import { sanitizeInternalHref } from '@/lib/community-navigation';
import type { Database } from '@/types/database';

export type NotificationKind = Database['public']['Enums']['notification_kind'];

export type NotificationItemRecord = Pick<
  Database['public']['Tables']['notifications']['Row'],
  'id' | 'kind' | 'payload' | 'created_at' | 'read_at'
>;

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  new_chapter: 'Novo capítulo',
  meeting_reminder: 'Lembrete de encontro',
  reply: 'Resposta à sua conversa',
  mention: 'Você foi mencionado(a)',
  badge_unlocked: 'Conquista desbloqueada',
  poll_open: 'Enquete aberta',
  channel_activity: 'Atividade no canal',
  meeting_updated: 'Encontro atualizado',
  meeting_cancelled: 'Encontro cancelado',
  club_invitation: 'Convite para clube',
};

function isPayloadObject(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}

function getStringField(payload: Record<string, unknown>, key: string): string | null {
  const val = payload[key];
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : null;
}

export interface NotificationPresentation {
  id: string;
  kind: NotificationKind;
  kindLabel: string;
  title: string;
  description: string | null;
  href: string;
  unread: boolean;
  createdAt: string;
}

export function presentNotification(notification: NotificationItemRecord): NotificationPresentation {
  const payload = isPayloadObject(notification.payload) ? notification.payload : {};
  const kindLabel = NOTIFICATION_KIND_LABELS[notification.kind] ?? 'Atualização';
  const rawTitle = getStringField(payload, 'title');
  const rawMessage = getStringField(payload, 'message') ?? getStringField(payload, 'body');
  const clubName = getStringField(payload, 'club_name');
  const channelName = getStringField(payload, 'channel_name');

  let defaultTitle = kindLabel;
  let defaultDescription: string | null = rawMessage;

  switch (notification.kind) {
    case 'reply':
      defaultTitle = rawTitle ?? 'Nova resposta na discussão';
      if (!defaultDescription && clubName && channelName) {
        defaultDescription = `Em ${clubName} · #${channelName}`;
      }
      break;
    case 'mention':
      defaultTitle = rawTitle ?? 'Você foi mencionado(a) em uma conversa';
      if (!defaultDescription && clubName && channelName) {
        defaultDescription = `Em ${clubName} · #${channelName}`;
      }
      break;
    case 'channel_activity':
      defaultTitle = rawTitle ?? 'Nova conversa em canal acompanhado';
      if (!defaultDescription && clubName && channelName) {
        defaultDescription = `${clubName} · #${channelName}`;
      }
      break;
    case 'meeting_reminder':
      defaultTitle = rawTitle ?? 'Encontro se aproximando';
      break;
    case 'meeting_updated':
      defaultTitle = rawTitle ?? 'Horário ou detalhes de encontro atualizados';
      break;
    case 'meeting_cancelled':
      defaultTitle = rawTitle ?? 'Um encontro agendado foi cancelado';
      break;
    case 'club_invitation':
      defaultTitle = rawTitle ?? 'Você recebeu um convite para um clube de leitura';
      if (!defaultDescription && clubName) {
        defaultDescription = `Clube: ${clubName}`;
      }
      break;
    default:
      defaultTitle = rawTitle ?? kindLabel;
      break;
  }

  const rawHref = getStringField(payload, 'href');
  const fallbackHref =
    notification.kind === 'club_invitation'
      ? '/notificacoes'
      : notification.kind === 'meeting_reminder' ||
          notification.kind === 'meeting_updated' ||
          notification.kind === 'meeting_cancelled'
        ? '/calendario'
        : '/notificacoes';

  return {
    id: notification.id,
    kind: notification.kind,
    kindLabel,
    title: defaultTitle,
    description: defaultDescription,
    href: rawHref ? sanitizeInternalHref(rawHref, fallbackHref) : fallbackHref,
    unread: notification.read_at === null,
    createdAt: notification.created_at,
  };
}
