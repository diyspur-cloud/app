import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BookEditor, BookCreator } from '@/components/admin/admin-controls';
import { createServerSupabase } from '@/lib/supabase/clients';

export const metadata: Metadata = { title: 'Livros · Administração', robots: { index: false, follow: false } };

export default async function AdminBooksPage() {
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  if (typeof claims?.claims?.sub !== 'string') redirect('/entrar?redirect=/admin/books');

  const { data: authorized } = await client.rpc('is_admin');
  if (authorized !== true) {
    return (
      <section className="container">
        <div className="notice">Acesso restrito à equipe editorial.</div>
      </section>
    );
  }

  const [booksResult, authorsResult] = await Promise.all([
    client.from('books').select('id,title,synopsis,cover_url,total_pages').order('updated_at', { ascending: false }).limit(100),
    client.from('authors').select('id,name').order('name'),
  ]);

  const books = booksResult.data ?? [];
  const authors = authorsResult.data ?? [];

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Equipe editorial</span>
        <h1>Livros</h1>
        <p>Cadastre novos títulos ou revise ficha, sinopse, capa e paginação sem SQL manual.</p>
      </header>

      <BookCreator authors={authors} />

      {booksResult.error ? (
        <div className="notice" role="alert">Não foi possível carregar os livros agora.</div>
      ) : books.length ? (
        <div className="timeline">
          {books.map((book) => (
            <BookEditor key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Nenhum livro cadastrado</h2>
        </div>
      )}
    </section>
  );
}
