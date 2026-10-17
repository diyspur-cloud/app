import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getBooksReadingRanking, type BookRankingTab } from '@/features/rankings/queries';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ranking de Livros | DIYSPUR',
  description: 'Os livros mais lidos, em andamento e com maiores taxas de conclusão e desistência na comunidade.',
};

const labels: Record<BookRankingTab, string> = {
  'mais-lidos': 'Mais lidos',
  lendo: 'Lendo agora',
  concluidos: 'Concluídos',
  desistencias: 'Desistências',
};

function readTab(value: string | undefined): BookRankingTab {
  return value === 'lendo' || value === 'concluidos' || value === 'desistencias'
    ? value
    : 'mais-lidos';
}

export default async function BooksRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; pagina?: string }>;
}) {
  const params = await searchParams;
  const tab = readTab(params.aba);
  const parsedPage = Number(params.pagina ?? 1);
  const page = Number.isFinite(parsedPage) ? Math.min(Math.max(Math.floor(parsedPage), 1), 1000) : 1;
  const { items, hasNext } = await getBooksReadingRanking(tab, page);

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Leituras da comunidade</span>
        <h1>Ranking de livros</h1>
        <p>
          Mais lidos reúne leitores que marcaram <em>Estou lendo</em> ou <em>Já li</em>. Cada pessoa conta
          uma única vez por livro.
        </p>
        <p className="field-hint" style={{ marginTop: '0.25rem' }}>
          As estatísticas são sincronizadas periodicamente.
        </p>

        <nav className="ranking-tabs" aria-label="Abas do ranking de livros">
          {(Object.keys(labels) as BookRankingTab[]).map((key) => (
            <Link
              key={key}
              href={`/ranking/livros?aba=${key}`}
              aria-current={tab === key ? 'page' : undefined}
            >
              {labels[key]}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: '8px' }}>
          <Link href="/ranking" className="text-link">
            ← Ver ranking de XP da temporada
          </Link>
        </div>
      </header>

      {!items.length ? (
        <div className="empty-state">
          <h2>Ainda não há leituras nesta seleção</h2>
          <p>Atualize <em>Sua leitura</em> na ficha de um livro para participar das estatísticas da comunidade.</p>
          <div style={{ marginTop: '16px' }}>
            <Link className="button button-dark button-small" href="/livros">
              Explorar livros do clube
            </Link>
          </div>
        </div>
      ) : (
        <ol className="book-ranking-list" aria-label={labels[tab]}>
          {items.map((row) => {
            const position =
              tab === 'desistencias'
                ? row.dnfRankPosition
                : tab === 'concluidos'
                  ? row.completedRankPosition
                  : tab === 'lendo'
                    ? row.activeRankPosition
                    : row.rankPosition;

            return (
              <li className="book-ranking-row" key={row.bookId}>
                <span className="ranking-pos" aria-label={`Posição ${position}`}>
                  {position}
                </span>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {row.coverUrl ? (
                    <Image
                      src={row.coverUrl}
                      alt={row.title}
                      width={48}
                      height={72}
                      style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 72,
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      Capa
                    </div>
                  )}
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 'var(--text-body)' }}>
                      <Link href={`/livros/${encodeURIComponent(row.slug)}`}>{row.title}</Link>
                    </h3>
                    <p className="field-hint" style={{ margin: 0 }}>
                      por {row.authorName} · {row.completedReaders} já leram · {row.activeReaders} lendo agora
                    </p>
                    {tab === 'desistencias' && (
                      <p className="field-hint" style={{ color: 'var(--color-danger, #d9534f)', marginTop: '2px' }}>
                        {row.dnfReaders} desistências entre {row.participants} leitores
                        {row.dnfRate !== null ? ` (${row.dnfRate}%)` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <nav className="action-row" style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
        {page > 1 && (
          <Link className="button button-quiet button-small" href={`/ranking/livros?aba=${tab}&pagina=${page - 1}`}>
            Anterior
          </Link>
        )}
        {hasNext && (
          <Link className="button button-dark button-small" href={`/ranking/livros?aba=${tab}&pagina=${page + 1}`}>
            Próxima
          </Link>
        )}
      </nav>
    </section>
  );
}
