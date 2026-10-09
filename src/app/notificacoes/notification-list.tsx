'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { markNotificationRead, type NotificationActionState } from './actions';
import type { NotificationRow } from './queries';

const initialNotificationActionState: NotificationActionState = {
  status: 'idle',
  message: '',
};

const kindLabels: Record<NotificationRow['kind'], string> = {
  new_chapter: 'Novo capítulo',
  meeting_reminder: 'Lembrete de encontro',
  reply: 'Resposta à sua conversa',
  mention: 'Você foi mencionado(a)',
  badge_unlocked: 'Conquista desbloqueada',
  poll_open: 'Enquete aberta',
};

function isPayloadObject(payload: NotificationRow['payload']): payload is { [key: string]: NotificationRow['payload'] | undefined } {
  return typeof payload === 'object' && payload !== null && !Array.isArray(payload);
}

function payloadText(notification: NotificationRow, key: string): string | null {
  if (!isPayloadObject(notification.payload)) return null;
  const value = notification.payload[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

function ActionFeedback({ state }: { state: NotificationActionState }) {
  if (state.status === 'idle') return null;
  return (
    <div
      role={state.status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className="notice"
      style={{ marginBottom: 18 }}
    >
      <p>{state.message}</p>
      {state.status === 'login' && (
        <p style={{ marginTop: 9 }}>
          <Link className="text-link" href="/entrar?redirect=%2Fnotificacoes">
            Entrar novamente →
          </Link>
        </p>
      )}
    </div>
  );
}

export function NotificationList({ notifications, error }: { notifications: NotificationRow[]; error: boolean }) {
  const [state, formAction, isPending] = useActionState(markNotificationRead, initialNotificationActionState);

  if (error) {
    return (
      <div className="notice" role="alert">
        Não foi possível carregar suas notificações agora. Tente atualizar a página.
      </div>
    );
  }

  return (
    <>
      <ActionFeedback state={state} />
      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">◌</div>
          <h2>Por enquanto, tudo tranquilo.</h2>
          <p>Quando houver uma novidade sobre suas leituras ou encontros, ela aparecerá aqui.</p>
          <div className="empty-actions">
            <Link className="button button-small" href="/livros">Encontrar uma leitura</Link>
          </div>
        </div>
      ) : (
        <ol aria-label="Suas notificações" style={{ display: 'grid', gap: 12, listStyle: 'none', margin: 0, padding: 0 }}>
          {notifications.map((notification) => {
            const title = payloadText(notification, 'title') ?? kindLabels[notification.kind];
            const message = payloadText(notification, 'message') ?? payloadText(notification, 'body');
            const unread = notification.read_at === null;

            return (
              <li key={notification.id}>
                <article
                  className="member-card"
                  style={{
                    borderColor: unread ? 'var(--color-border-strong)' : 'var(--color-border)',
                    boxShadow: unread ? 'var(--glow-primary)' : 'none',
                  }}
                >
                  <div style={{ alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between' }}>
                    <div>
                      <p className="eyebrow">{kindLabels[notification.kind]}</p>
                      <h2 style={{ fontSize: 20, marginTop: 6 }}>{title}</h2>
                    </div>
                    <span
                      aria-label={unread ? 'Não lida' : 'Lida'}
                      style={{
                        background: unread ? 'var(--color-primary)' : 'var(--color-border-strong)',
                        borderRadius: 'var(--radius-pill)',
                        color: unread ? 'var(--color-on-primary)' : 'var(--color-muted)',
                        flexShrink: 0,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '5px 9px',
                      }}
                    >
                      {unread ? 'Nova' : 'Lida'}
                    </span>
                  </div>
                  {message && <p style={{ marginTop: 9 }}>{message}</p>}
                  <p className="field-hint" style={{ marginTop: 12 }}>{formatDate(notification.created_at)}</p>
                  {unread && (
                    <form action={formAction} style={{ marginTop: 16 }}>
                      <input type="hidden" name="notificationId" value={notification.id} />
                      <button className="button button-dark button-small" type="submit" disabled={isPending}>
                        {isPending ? 'Atualizando…' : 'Marcar como lida'}
                      </button>
                    </form>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
