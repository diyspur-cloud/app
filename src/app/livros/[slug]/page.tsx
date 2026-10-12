import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '@/features/catalog/queries';
import { AddBookToList } from '@/components/lists/add-book-to-list';
import { AddQueueButton } from '@/components/up-next/add-queue-button';
import { ShareBookButton } from '@/components/books/share-book-button';
import { JsonLd } from '@/components/json-ld';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  const authorName = book?.authors?.name ? ` por ${book.authors.name}` : '';
  const title = book ? `${book.title} — Clube de Leitura e Discussão` : 'Livro não encontrado';
  const description = book?.synopsis
    ? `Participe do clube de leitura de ${book.title}${authorName}. Cronograma de capítulos, avisos de conteúdo e debates ao vivo sem spoilers no DIYSPUR.`
    : (book ? `Conheça ${book.title} no clube de leitura DIYSPUR.` : undefined);

  return book
    ? {
        title,
        description,
        alternates: { canonical: `/livros/${encodeURIComponent(book.slug)}` },
        openGraph: {
          title,
          description,
          images: book.cover_url ? [book.cover_url] : undefined,
        },
      }
    : { title: 'Livro não encontrado' };
}

export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getBook(slug);
  if (!book) notFound();

  const safeExternal = book.amazon_url && /^https:\/\//i.test(book.amazon_url);
  const authorWebsite = book.authors?.website_url && /^https:\/\//i.test(book.authors.website_url) ? book.authors.website_url : null;
  const authorInstagram = book.authors?.instagram && /^https:\/\//i.test(book.authors.instagram) ? book.authors.instagram : null;
  const publicationDate = book.publication_date
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${book.publication_date}T00:00:00.000Z`))
    : null;
  const dimensions = book.width_mm && book.height_mm && book.depth_mm
    ? `${(book.width_mm / 10).toLocaleString('pt-BR')} × ${(book.height_mm / 10).toLocaleString('pt-BR')} × ${(book.depth_mm / 10).toLocaleString('pt-BR')} cm`
    : null;
  const editionDetails = [
    { label: 'Editora', value: book.publisher },
    { label: 'Tradução', value: book.translator },
    { label: 'Lançamento', value: publicationDate },
    { label: 'Edição', value: book.edition_number ? `${book.edition_number}ª edição` : null },
    { label: 'Formato', value: book.format },
    { label: 'Dimensões', value: dimensions },
    { label: 'Classificação indicativa', value: book.content_rating },
    { label: 'Idioma', value: book.language === 'pt-BR' ? 'Português (Brasil)' : book.language },
    { label: 'ISBN-13', value: book.isbn13 },
  ].filter((detail) => detail.value !== null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://diyspur.vercel.app';
  const bookUrl = `${siteUrl}/livros/${encodeURIComponent(book.slug)}`;
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${bookUrl}#book`,
    name: book.title,
    url: bookUrl,
    ...(book.synopsis ? { description: book.synopsis } : {}),
    ...(book.authors?.name ? { author: { '@type': 'Person', name: book.authors.name } } : {}),
    ...(book.cover_url ? { image: book.cover_url } : {}),
    ...(book.isbn13 ? { isbn: book.isbn13 } : {}),
    ...(book.total_pages ? { numberOfPages: book.total_pages } : {}),
    ...(book.publisher ? { publisher: { '@type': 'Organization', name: book.publisher } } : {}),
    inLanguage: book.language ?? 'pt-BR',
  };

  return (
    <div className="container">
      <JsonLd data={bookSchema} />

      <header className="detail-head">
        <nav className="breadcrumbs" aria-label="Trilha de navegação">
          <Link href="/">Início</Link><span aria-hidden="true">/</span>
          <Link href="/livros">Livros</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{book.title}</span>
        </nav>
        <div className="book-detail">
          <div className="book-detail-cover">
            {book.cover_url
              ? <Image src={book.cover_url} alt={`Capa de ${book.title}`} width={480} height={696} priority />
              : <span className="cover-placeholder">{book.title}</span>}
          </div>
          <div>
            <span className="eyebrow">Leitura do clube</span>
            <h1>{book.title}</h1>
            <p className="author">
              {book.authors?.name ?? 'Autor(a) convidado(a)'}{book.publication_year ? ` · ${book.publication_year}` : ''}
            </p>
            {book.authors?.bio ? <p className="author-bio">{book.authors.bio}</p> : null}
            {authorWebsite || authorInstagram ? (
              <div className="author-links">
                {authorWebsite ? <a href={authorWebsite} target="_blank" rel="noopener noreferrer">Site oficial da autora ↗</a> : null}
                {authorInstagram ? <a href={authorInstagram} target="_blank" rel="noopener noreferrer">Instagram ↗</a> : null}
              </div>
            ) : null}
            {book.tags?.length ? <div className="detail-pills">{book.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div> : null}
            <p className="synopsis">{book.synopsis ?? 'Uma nova leitura começa por aqui. Em breve, mais detalhes sobre esta história.'}</p>
            <div className="detail-pills">
              {book.total_pages ? <span className="tag">{book.total_pages} páginas</span> : null}
              {book.total_chapters ? <span className="tag">{book.total_chapters} capítulos</span> : null}
            </div>
            {editionDetails.length ? (
              <dl className="book-edition-details" aria-label={`Dados editoriais de ${book.title}`}>
                {editionDetails.map(({ label, value }) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            ) : null}
            {book.warnings?.length ? (
              <section className="book-warnings" aria-labelledby="content-warnings-title">
                <h2 id="content-warnings-title">Avisos de conteúdo</h2>
                <ul>
                  {book.warnings.map((warning) => (
                    <li key={`${warning.label}-${warning.severity}`}>
                      <strong>{warning.label}</strong>
                      <span>
                        {warning.severity === 'graphic'
                          ? 'Intenso'
                          : warning.severity === 'moderate'
                            ? 'Moderado'
                            : 'Leve'}
                        {warning.is_community
                          ? ' · sinalizado pela comunidade'
                          : ' · revisão editorial'}
                      </span>
                      {warning.description && <p>{warning.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Seção Onde Comprar & Compartilhar Leitura (MON-01 & SOCIAL-01) */}
            <div className="book-purchasing-panel" style={{ marginTop: '24px', padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <span className="eyebrow">Acompanhe a leitura</span>
              <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: '4px 0 14px' }}>
                Tenha seu exemplar físico ou digital (Kindle/e-Reader) para participar das conversas capítulo a capítulo.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                {safeExternal ? (
                  <a
                    className="btn btn-primary btn-sm"
                    href={`/api/affiliate/${encodeURIComponent(book.slug)}`}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                  >
                    Comprar exemplar na Amazon <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
                <ShareBookButton bookTitle={book.title} bookSlug={book.slug} />
                {safeExternal ? (
                  <p className="field-hint" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', margin: '8px 0 0', width: '100%' }}>
                    * Como participante do Programa de Associados da Amazon, o DIYSPUR pode receber uma comissão por compras qualificadas, sem nenhum custo extra para você.
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {book.signedIn ? (
                <AddQueueButton bookId={book.id} />
              ) : (
                <Link
                  className="btn btn-secondary btn-sm"
                  href={`/entrar?redirect=${encodeURIComponent(`/livros/${book.slug}`)}`}
                >
                  Entrar para guardar na fila
                </Link>
              )}
              {book.readerLists ? (
                <AddBookToList bookId={book.id} lists={book.readerLists} />
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">No seu ritmo</span>
            <h2>Temporadas e capítulos</h2>
          </div>
        </div>
        {book.seasons.length ? (
          <div className="season-list">
            {book.seasons.map((season) => (
              <Link
                className="season-row"
                href={`/temporadas/${encodeURIComponent(season.slug)}`}
                key={season.id}
              >
                <div>
                  <h3>{season.title}</h3>
                  <p>
                    {season.description ?? `Temporada ${season.number}`} ·{' '}
                    {season.starts_at
                      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(
                          new Date(`${season.starts_at}T00:00:00`)
                        )
                      : 'Acompanhe a programação'}
                  </p>
                </div>
                <span className={`status-pill ${season.status === 'active' ? '' : 'neutral'}`}>
                  {season.status === 'active'
                    ? 'Em andamento'
                    : season.status === 'finished'
                      ? 'Concluída'
                      : 'Em breve'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Esta leitura ainda não tem temporada aberta</h3>
            <p>Volte em breve para acompanhar capítulos e encontros do clube.</p>
          </div>
        )}
      </section>
    </div>
  );
}
