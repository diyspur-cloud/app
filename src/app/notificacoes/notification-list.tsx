'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { presentNotification } from '@/features/notifications/presentation';
import {
  markNotificationRead,
  saveNotificationPreferences,
  type NotificationActionState,
} from './actions';
import type { NotificationPreferencesData, NotificationRow } from './queries';

const initialNotificationActionState: NotificationActionState = {
  status: 'idle',
  message: '',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function ActionFeedback({ state }: { state: NotificationActionState }) {
  if (state.status === 'idle') return null;
  return (
    <div
      role={state.status === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className="notice"
    >
      <p>{state.message}</p>
      {state.status === 'login' && (
        <p className="field-hint">
          <Link className="text-link" href="/entrar?redirect=%2Fnotificacoes">
            Entrar novamente →
          </Link>
        </p>
      )}
    </div>
  );
}

export function NotificationList({
  notifications,
  preferences,
  error,
}: {
  notifications: NotificationRow[];
  preferences?: NotificationPreferencesData;
  error: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    markNotificationRead,
    initialNotificationActionState,
  );
  const [prefState, prefFormAction, isPrefPending] = useActionState(
    saveNotificationPreferences,
    initialNotificationActionState,
  );

  if (error) {
    return (
      <div className="notice" role="alert">
        Não foi possível carregar suas notificações agora. Tente atualizar a página.
      </div>
    );
  }

  const hasUnread = notifications.some((n) => n.read_at === null);

  return (
    <>
      <ActionFeedback state={state} />
      {hasUnread && (
        <form action={formAction} style={{ marginBottom: '1rem' }}>
          <input type="hidden" name="markAll" value="true" />
          <button className="btn btn-secondary btn-sm" type="submit" disabled={isPending}>
            {isPending ? 'Atualizando…' : 'Marcar todas como lidas'}
          </button>
        </form>
      )}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">
            ◌
          </div>
          <h2>Por enquanto, tudo tranquilo.</h2>
          <p>Quando houver uma novidade sobre suas leituras ou encontros, ela aparecerá aqui.</p>
          <div className="empty-actions">
            <Link className="button button-small" href="/livros">
              Encontrar uma leitura
            </Link>
          </div>
        </div>
      ) : (
        <ol aria-label="Suas notificações" className="notification-list">
          {notifications.map((notification) => {
            const view = presentNotification(notification);

            return (
              <li key={notification.id}>
                <article className={`notification-card ${view.unread ? 'is-unread' : ''}`}>
                  <div className="notification-head">
                    <div>
                      <p className="eyebrow">{view.kindLabel}</p>
                      <h2>{view.title}</h2>
                    </div>
                    <span
                      className={`notification-badge ${view.unread ? 'unread' : 'read'}`}
                      aria-label={view.unread ? 'Não lida' : 'Lida'}
                    >
                      {view.unread ? 'Nova' : 'Lida'}
                    </span>
                  </div>
                  {view.description && <p>{view.description}</p>}
                  <p className="field-hint">{formatDate(view.createdAt)}</p>
                  <div className="action-row" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {view.href && view.href !== '/notificacoes' && (
                      <Link className="button button-small button-secondary" href={view.href}>
                        Abrir contexto →
                      </Link>
                    )}
                    {view.unread && (
                      <form action={formAction}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <button
                          className="button button-small"
                          type="submit"
                          disabled={isPending}
                        >
                          {isPending ? 'Atualizando…' : 'Marcar como lida'}
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}

      {preferences && (
        <section
          aria-labelledby="notification-prefs-heading"
          className="member-card"
          style={{ marginTop: '2rem' }}
        >
          <span className="eyebrow">Preferências</span>
          <h2 id="notification-prefs-heading">O que você deseja receber</h2>
          <p className="field-hint">
            Notificações de canais e encontros nunca incluem trechos com spoilers no alerta.
          </p>
          <ActionFeedback state={prefState} />
          <form action={prefFormAction} className="stack-sm" style={{ marginTop: '1rem' }}>
            <label className="checkbox-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" name="replies" defaultChecked={preferences.replies} />
              <span>Respostas às minhas mensagens nos clubes</span>
            </label>
            <label className="checkbox-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input type="checkbox" name="mentions" defaultChecked={preferences.mentions} />
              <span>Menções diretas (@usuario) nas conversas</span>
            </label>
            <label className="checkbox-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="meetingReminders"
                defaultChecked={preferences.meetingReminders}
              />
              <span>Lembretes e alterações de encontros com RSVP</span>
            </label>
            <label className="checkbox-row" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="channelActivity"
                defaultChecked={preferences.channelActivity}
              />
              <span>Novas conversas em canais que eu sigo</span>
            </label>
            <div style={{ marginTop: '0.75rem' }}>
              <button className="button button-small" type="submit" disabled={isPrefPending}>
                {isPrefPending ? 'Salvando…' : 'Salvar preferências'}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
