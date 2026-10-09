import type { Metadata } from 'next';
import Link from 'next/link';

import { NotificationList } from './notification-list';
import { getNotificationsPageData } from './queries';

export const metadata: Metadata = {
  title: 'Notificações',
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const { userId, notifications, error } = await getNotificationsPageData();

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Seu espaço, suas escolhas</span>
        <h1>Fique perto do que importa.</h1>
        <p>Atualizações sobre as histórias, conversas e encontros que fazem parte do seu caminho.</p>
      </header>

      {!userId ? (
        <div className="member-card" role={error ? 'alert' : undefined}>
          <h2>Entre para ver suas notificações</h2>
          <p>Este espaço é pessoal. Faça login para consultar apenas as atualizações da sua conta.</p>
          <div style={{ marginTop: 20 }}>
            <Link className="button button-dark button-small" href="/entrar?redirect=%2Fnotificacoes">
              Entrar na comunidade
            </Link>
          </div>
        </div>
      ) : (
        <section aria-labelledby="notifications-heading" className="section" style={{ paddingTop: 10 }}>
          <div className="section-head">
            <div>
              <span className="eyebrow">Atualizações recentes</span>
              <h2 id="notifications-heading">Suas notificações</h2>
            </div>
          </div>
          <NotificationList notifications={notifications} error={error} />
        </section>
      )}
    </section>
  );
}
