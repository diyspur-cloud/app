'use client';

import { useRouter } from 'next/navigation';
import {
  presentNotification,
  type NotificationItemRecord,
} from '@/features/notifications/presentation';

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Agora';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface NotificationItemProps {
  notification: NotificationItemRecord;
  onMarkRead: (id: string) => Promise<void>;
  onNavigate?: () => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onNavigate,
}: NotificationItemProps) {
  const router = useRouter();
  const view = presentNotification(notification);

  const handleOpen = async () => {
    if (view.unread) {
      await onMarkRead(view.id);
    }
    onNavigate?.();
    router.push(view.href);
  };

  return (
    <li className={`notification-popover-item ${view.unread ? 'is-unread' : ''}`}>
      <div className="notification-popover-row">
        <button
          type="button"
          className="notification-popover-link"
          onClick={() => void handleOpen()}
        >
          <span className="notification-popover-meta">
            <span className="eyebrow">{view.kindLabel}</span>
            <span className="notification-popover-time">{formatRelativeDate(view.createdAt)}</span>
          </span>
          <strong className="notification-popover-title">{view.title}</strong>
          {view.description && (
            <span className="notification-popover-desc">{view.description}</span>
          )}
        </button>
        {view.unread && (
          <button
            type="button"
            className="notification-mark-btn"
            onClick={() => void onMarkRead(view.id)}
            aria-label={`Marcar "${view.title}" como lida`}
            title="Marcar como lida"
          >
            <span className="notification-unread-dot" aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  );
}
