import type { Metadata } from 'next';
import Link from 'next/link';
import { getVisibleClubs } from '@/features/clubs/queries';

type ClubCard = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_private: boolean;
};

export const metadata: Metadata = {
  title: 'Clubes de leitura',
  description: 'Encontre ou crie um clube para ler acompanhado.',
  alternates: { canonical: '/clubes' },
};

export default async function ClubsPage() {
  const { clubs, error, userId } = await getVisibleClubs();

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Leitura compartilhada</span>
        <h1>
          Clubes para<br />
          <em>ler junto.</em>
        </h1>
        <p>
          Crie um espaço para sua turma ou entre em um clube público. Dados privados só aparecem para membros autorizados.
        </p>
        <div className="hero-actions">
          <Link
            className="button button-small"
            href={userId ? '/clubes/novo' : '/entrar?redirect=/clubes/novo'}
          >
            Criar um clube
          </Link>
        </div>
      </header>

      {error ? (
        <div className="notice" role="alert">
          Não foi possível carregar os clubes agora.
        </div>
      ) : clubs.length ? (
        <div className="section" style={{ paddingTop: 12 }}>
          <div className="timeline">
            {clubs.map((club: ClubCard) => (
              <Link className="member-card" href={`/clubes/${club.slug}`} key={club.id}>
                <div className="section-head" style={{ marginBottom: 8 }}>
                  <div>
                    <span className="eyebrow">{club.is_private ? 'Privado' : 'Público'}</span>
                    <h2>{club.name}</h2>
                  </div>
                  <span className="status-pill neutral">Abrir →</span>
                </div>
                {club.description && <p>{club.description}</p>}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">◌</div>
          <h2>Nenhum clube público ainda</h2>
          <p>Você pode inaugurar a primeira conversa.</p>
        </div>
      )}
    </section>
  );
}
