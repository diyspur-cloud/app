import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getBooks } from '@/features/catalog/queries';
import { BookCard } from '@/components/book-card';
import { BookSearch } from '@/components/catalog/book-search';
import { JsonLd } from '@/components/json-ld';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Livros',
  description: 'Explore histórias e leituras compartilhadas pela comunidade DIYSPUR.',
  alternates: { canonical: '/livros' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Como funciona o clube de leitura DIYSPUR?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'O DIYSPUR organiza leituras em temporadas, com capítulos liberados progressivamente, quizzes e discussões em comunidade.',
      },
    },
  ],
};

export default async function BooksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const books = await getBooks(q);

  return (
    <section className="container">
      <JsonLd data={faqSchema} />
      <header className="page-intro">
        <span className="eyebrow">A biblioteca do clube</span>
        <h1>Uma boa história<br/><em>chama outra.</em></h1>
        <p>Descubra a seleção de leituras DIYSPUR e encontre sua próxima conversa favorita.</p>
        <Suspense
          fallback={
            <form className="search-form" action="/livros" method="get">
              <label className="sr-only" htmlFor="book-query-fallback">Buscar livros por título</label>
              <input className="field" id="book-query-fallback" type="search" name="q" defaultValue={q} placeholder="Buscar por título…" />
              <button className="button button-small" type="submit">Buscar</button>
            </form>
          }
        >
          <BookSearch initialQuery={q} />
        </Suspense>
        {q && <p className="field-hint">Resultados para “{q}” · <Link className="text-link" href="/livros">Limpar busca</Link></p>}
      </header>
      {books.length ? (
        <div className="book-grid section">
          {books.map((book) => <BookCard key={book.id} book={book}/>)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">⌕</div>
          <h2>{q ? 'Nenhum título por aqui ainda' : 'A próxima leitura está sendo escolhida'}</h2>
          <p>{q ? 'Tente outra busca ou confira novamente mais tarde.' : 'O catálogo do clube será atualizado em breve. Descubra enquanto isso as conversas da comunidade.'}</p>
          <div className="empty-actions">
            <Link className="button button-small" href={q ? '/livros' : '/comunidade'}>
              {q ? 'Ver catálogo' : 'Ir para a comunidade'}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
