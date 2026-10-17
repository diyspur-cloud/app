import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { getUserUpNext } from '@/features/up-next/queries';
import { RemoveQueueButton } from '@/components/up-next/remove-queue-button';

export const metadata: Metadata = {
  title: 'Minha fila de leitura',
  description: 'Seus próximos livros priorizados para leitura no DIYSPUR.',
};

export default async function UpNextPage() {
  const session = await requireSession();
  if (!session) redirect('/entrar?redirect=/minha-fila');

  const items = await getUserUpNext(session.userId);

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Planejamento</span>
        <h1>
          Minha fila: <em>o que ler a seguir.</em>
        </h1>
        <p>Organize os próximos títulos que você quer acompanhar junto com o clube ou no seu próprio ritmo.</p>
      </header>

      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Prioridade</span>
            <h2>Livros na sua fila ({items.length})</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link className="text-link" href="/listas">
              Organizar em listas de leitura →
            </Link>
            <Link className="text-link" href="/livros">
              Explorar catálogo →
            </Link>
          </div>
        </div>

        {items.length ? (
          <div className="timeline">
            {items.map((item, index) => {
              const book = item.book;
              if (!book) return null;
              return (
                <article className="member-card" key={item.book_id}>
                  <div className="section-head">
                    <div>
                      <span className="eyebrow">Posição #{index + 1}</span>
                      <h3>
                        <Link href={`/livros/${book.slug}`} className="text-link">
                          {book.title}
                        </Link>
                      </h3>
                    </div>
                    <RemoveQueueButton bookId={book.id} />
                  </div>
                  {book.synopsis && <p style={{ marginTop: '8px' }}>{book.synopsis}</p>}
                  <p className="field-hint" style={{ marginTop: '12px' }}>
                    {book.total_pages ? `${book.total_pages} páginas` : 'Páginas não informadas'} · Adicionado em{' '}
                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(item.added_at))}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-mark" aria-hidden="true">📚</div>
            <h2>Sua fila está vazia</h2>
            <p>Navegue pelo catálogo e escolha as histórias que você quer ler a seguir.</p>
            <div className="empty-actions">
              <Link className="button button-small" href="/livros">
                Descobrir livros
              </Link>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
