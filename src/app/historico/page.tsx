import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getReadingHistory, type ReadingHistoryItem } from '@/features/profile/queries';

export const metadata: Metadata = { title: 'Minha leitura', robots: { index: false, follow: false } };

function formatDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

function statusLabel(status: ReadingHistoryItem['status']): string {
  const labels: Record<ReadingHistoryItem['status'], string> = {
    want_to_read: 'Quero ler',
    reading: 'Em andamento',
    read: 'Concluído',
    dnf: 'Pausado',
  };
  return labels[status];
}

function HistoryRow({ item }: { item: ReadingHistoryItem }) {
  const updatedDate = formatDate(item.updatedAt);
  const hasProgress = typeof item.percent === 'number';

  return (
    <article className="timeline-row">
      <div>
        <h3><Link href={`/capitulos/${item.chapter.id}`}>{item.chapter.title}</Link></h3>
        <p>
          <Link className="text-link" href={`/livros/${item.book.slug}`}>{item.book.title}</Link>
          {' · '}
          <Link className="text-link" href={`/temporadas/${item.season.slug}`}>{item.season.title}</Link>
          {' · capítulo '}{item.chapter.number}
        </p>
        <p>
          {hasProgress && `${item.percent}% lido`}
          {hasProgress && item.quiz ? ' · ' : ''}
          {item.quiz && `Quiz: ${item.quiz.score}/${item.quiz.total}`}
          {(hasProgress || item.quiz) && updatedDate ? ' · ' : ''}
          {updatedDate && <time dateTime={item.updatedAt}>Atualizado em {updatedDate}</time>}
        </p>
      </div>
      <span className={`status-pill${item.status === 'read' ? '' : ' neutral'}`}>{statusLabel(item.status)}</span>
    </article>
  );
}

function HistorySection({ id, eyebrow, title, items }: { id: string; eyebrow: string; title: string; items: ReadingHistoryItem[] }) {
  if (!items.length) return null;
  return (
    <section className="section" style={{ paddingBlock: 28 }} aria-labelledby={id}>
      <div className="section-head" style={{ marginBottom: 16 }}>
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2 id={id}>{title}</h2>
        </div>
      </div>
      <div className="timeline">
        {items.map((item) => <HistoryRow item={item} key={item.id} />)}
      </div>
    </section>
  );
}

export default async function HistoryPage() {
  const history = await getReadingHistory();
  if (history === null) redirect('/entrar?redirect=/historico');

  const inProgress = history.filter((item) => item.status === 'reading');
  const completed = history.filter((item) => item.status === 'read');
  const other = history.filter((item) => item.status !== 'reading' && item.status !== 'read');

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Histórico de leitura</span>
        <h1>O que você está lendo.</h1>
        <p>Seus capítulos e descobertas, organizados no seu ritmo.</p>
      </header>
      <div className="member-grid">
        <nav className="member-nav" aria-label="Área pessoal">
          <Link href="/perfil">Visão geral</Link>
          <Link href="/historico" aria-current="page">Minha leitura</Link>
          <Link href="/desafios">Desafios</Link>
          <Link href="/ranking">Ranking</Link>
          <Link href="/notificacoes">Notificações</Link>
        </nav>
        <main className="member-card">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-mark" aria-hidden="true">⌁</div>
              <h2>Nenhuma leitura registrada ainda</h2>
              <p>Quando você começar um capítulo, seu andamento aparecerá aqui.</p>
              <div className="empty-actions">
                <Link className="button button-dark button-small" href="/livros">Explorar livros</Link>
              </div>
            </div>
          ) : (
            <>
              <HistorySection id="in-progress-title" eyebrow="Agora" title="Em andamento" items={inProgress} />
              <HistorySection id="completed-title" eyebrow="Concluídos" title="Leituras concluídas" items={completed} />
              <HistorySection id="other-reading-title" eyebrow="Outros registros" title="Outras marcações" items={other} />
            </>
          )}
        </main>
      </div>
    </section>
  );
}
