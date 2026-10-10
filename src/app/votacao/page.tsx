import type { Metadata } from 'next';
import Link from 'next/link';
import { PollCard } from '@/components/polls/poll-card';
import { getClosedPolls, getPublicPolls } from '@/features/polls/queries';

export const metadata: Metadata = {
  title: 'Votação',
  description: 'Ajude a escolher a próxima leitura da comunidade DIYSPUR.',
};

export const dynamic = 'force-dynamic';

export default async function VotingPage() {
  const [polls, closedPolls] = await Promise.all([getPublicPolls(), getClosedPolls()]);

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Escolha coletiva</span>
        <h1>Qual história<br /><em style={{ color: 'var(--color-primary)' }}>vem a seguir?</em></h1>
        <p>As próximas leituras são escolhidas por quem vive o clube. Vote uma vez em cada enquete aberta e acompanhe a decisão depois que ela terminar.</p>
      </header>

      {polls.length > 0 ? (
        <div className="season-list" style={{ paddingBottom: '20px' }}>
          {polls.map((poll) => <PollCard key={poll.id} poll={poll} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">✦</div>
          <h2>Nenhuma votação aberta agora</h2>
          <p>Quando uma nova escolha estiver disponível, ela aparece aqui. Enquanto isso, entre para receber as próximas histórias do clube.</p>
          <div className="empty-actions">
            <Link className="button button-small" href={{ pathname: '/cadastro', query: { redirect: '/votacao' } }}>Fazer parte do clube</Link>
            <Link className="button button-small button-quiet" href={{ pathname: '/entrar', query: { redirect: '/votacao' } }} style={{ marginLeft: '8px' }}>Já tenho conta</Link>
          </div>
        </div>
      )}
      {closedPolls.length > 0 && <section className="season-list section" style={{ paddingTop: 20 }} aria-labelledby="poll-results-title"><div className="section-head"><div><span className="eyebrow">Decisões do clube</span><h2 id="poll-results-title">Votações encerradas</h2></div></div>{closedPolls.map((poll) => <PollCard key={poll.id} poll={poll} />)}</section>}
    </section>
  );
}
