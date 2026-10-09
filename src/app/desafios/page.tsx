import type { Metadata } from 'next';
import Link from 'next/link';

import { ChallengeList } from './challenge-list';
import { getChallengesPageData } from './queries';

export const metadata: Metadata = {
  title: 'Desafios',
  robots: { index: false, follow: false },
};

export default async function ChallengesPage() {
  const { userId, challenges, progress, challengesError, progressError } = await getChallengesPageData();

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Desafios de leitura</span>
        <h1>Pequenos passos, grandes histórias.</h1>
        <p>Escolha um ritmo, descubra uma nova forma de ler e acompanhe o caminho junto com a comunidade.</p>
      </header>

      {!userId && (
        <div className="notice" style={{ marginBottom: 22 }}>
          <p>Os desafios publicados podem aparecer aqui. Entre para ver sua inscrição e seu progresso pessoal.</p>
          <p style={{ marginTop: 9 }}>
            <Link className="button button-dark button-small" href="/entrar?redirect=%2Fdesafios">Entrar na comunidade</Link>
          </p>
        </div>
      )}

      <section aria-labelledby="challenges-heading" className="section" style={{ paddingTop: 10 }}>
        <div className="section-head">
          <div>
            <span className="eyebrow">Ciclos publicados</span>
            <h2 id="challenges-heading">Desafios disponíveis</h2>
          </div>
        </div>
        <p className="field-hint" style={{ marginBottom: 18 }}>A lista é limitada no servidor aos desafios que a policy de leitura autoriza.</p>
        <ChallengeList
          challenges={challenges}
          progress={progress}
          challengesError={challengesError}
          progressError={progressError}
          signedIn={Boolean(userId)}
        />
      </section>
    </section>
  );
}
