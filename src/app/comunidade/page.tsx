import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createServerSupabase } from '@/lib/supabase/clients';

export const metadata: Metadata = {
  title: 'Comunidade de Leitura | DIYSPUR',
  description: 'Lista de todos os clubes e grupos oficiais de leitura organizados por livro.',
  alternates: { canonical: '/comunidade' },
};

export default async function CommunityPage() {
  let clubs: Array<{
    id: string;
    slug: string;
    name: string;
    official_book_id: string | null;
    books?: {
      id: string;
      slug: string;
      title: string;
      cover_url: string | null;
      synopsis: string | null;
    } | null;
  }> = [];
  let hasError = false;

  try {
    const client = await createServerSupabase();
    const { data, error } = await client
      .from('user_clubs')
      .select('id,slug,name,official_book_id,books!user_clubs_official_book_id_fkey(id,slug,title,cover_url,synopsis)')
      .eq('kind', 'official')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(36);

    if (error) {
      console.error('Community directory query failed', error.code);
      hasError = true;
    } else {
      clubs = (data ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        official_book_id: c.official_book_id,
        books: Array.isArray(c.books) ? c.books[0] : c.books,
      }));
    }
  } catch (error) {
    console.error('Community directory unavailable', error instanceof Error ? error.name : 'unknown_error');
    hasError = true;
  }

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Comunidade DIYSPUR</span>
        <h1>Clubes e Grupos de Leitura</h1>
        <p>
          Cada livro tem seu grupo oficial no DIYSPUR. Entre para conversar nos canais <em>sem-spoilers</em>, 
          debater capítulos específicos ou acompanhar os encontros do livro.
        </p>
      </header>

      {hasError ? (
        <div className="notice" role="alert" style={{ marginBlock: '24px' }}>
          Não foi possível carregar a lista de clubes no momento. Tente novamente mais tarde.
        </div>
      ) : clubs.length === 0 ? (
        <div className="empty-state">
          <h2>Nenhum clube oficial aberto ainda.</h2>
          <p>Escolha um livro do catálogo para abrir o primeiro grupo de leitura da comunidade.</p>
          <div style={{ marginTop: '16px' }}>
            <Link className="button button-dark button-small" href="/livros">
              Explorar catálogo de livros
            </Link>
          </div>
        </div>
      ) : (
        <div className="catalog-grid" style={{ marginTop: '32px' }}>
          {clubs.map((club) => {
            const book = club.books;
            return (
              <article className="book-card" key={club.id}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  {book?.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      width={70}
                      height={105}
                      style={{ borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 70,
                        height: 105,
                        background: 'var(--surface-2)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      Capa
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <span className="eyebrow">Clube oficial</span>
                    <h3 style={{ margin: '4px 0 6px' }}>
                      <Link href={`/clubes/${club.slug}`}>{club.name}</Link>
                    </h3>
                    {book && (
                      <p className="field-hint" style={{ margin: 0 }}>
                        Livro: <Link className="text-link" href={`/livros/${book.slug}`}>{book.title}</Link>
                      </p>
                    )}
                    {book?.synopsis && (
                      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        {book.synopsis.slice(0, 110)}…
                      </p>
                    )}
                    <div style={{ marginTop: '12px' }}>
                      <Link className="button button-small button-dark" href={`/clubes/${club.slug}`}>
                        Entrar no clube
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
