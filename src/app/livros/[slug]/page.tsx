import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '@/features/catalog/queries';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);
  const description = book?.synopsis?.slice(0, 160) ?? (book ? `Conheça ${book.title} no clube de leitura DIYSPUR.` : undefined);
  return book
    ? { title: book.title, description, openGraph: { title: book.title, description, images: book.cover_url ? [book.cover_url] : undefined } }
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

  return (
    <div className="container">
      <header className="detail-head">
        <nav className="breadcrumbs" aria-label="Trilha de navegação">
          <Link href="/">Início</Link><span aria-hidden="true">/</span>
          <Link href="/livros">Livros</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{book.title}</span>
        </nav>
        <div className="book-detail">
          <div className="book-detail-cover">
            {book.cover_url
              ? <Image src={book.cover_url} alt={`Capa de ${book.title}`} width={480} height={696} unoptimized priority />
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
            {safeExternal ? <a className="button button-small" href={book.amazon_url!} target="_blank" rel="sponsored noopener noreferrer">Encontrar o livro <span aria-hidden="true">↗</span></a> : null}
          </div>
        </div>
      </header>
      <section className="section" style={{ paddingTop: 16 }}>
        <div className="section-head">
          <div><span className="eyebrow">No seu ritmo</span><h2>Temporadas e capítulos</h2></div>
        </div>
        {book.seasons.length ? (
          <div className="season-list">
            {book.seasons.map((season) => (
              <Link className="season-row" href={`/temporadas/${encodeURIComponent(season.slug)}`} key={season.id}>
                <div>
                  <h3>{season.title}</h3>
                  <p>{season.description ?? `Temporada ${season.number}`} · {season.starts_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(`${season.starts_at}T00:00:00`)) : 'Acompanhe a programação'}</p>
                </div>
                <span className={`status-pill ${season.status === 'active' ? '' : 'neutral'}`}>
                  {season.status === 'active' ? 'Em andamento' : season.status === 'finished' ? 'Concluída' : 'Em breve'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><h3>Esta leitura ainda não tem temporada aberta</h3><p>Volte em breve para acompanhar capítulos e encontros do clube.</p></div>
        )}
      </section>
    </div>
  );
}
