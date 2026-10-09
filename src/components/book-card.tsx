import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/features/catalog/queries';

export function BookCard({ book }: { book: Book }) {
  return <Link className="book-card" href={`/livros/${encodeURIComponent(book.slug)}`} aria-label={`${book.title}, ${book.authors?.name ?? 'autor(a) desconhecido'}`}><div className="book-card-cover">{book.cover_url ? <Image src={book.cover_url} alt={`Capa de ${book.title}`} width={400} height={560} unoptimized loading="lazy" decoding="async"/> : <span className="book-card-title-cover">{book.title}</span>}</div><h3>{book.title}</h3><p>{book.authors?.name ?? 'Autor(a) convidado(a)'}</p>{book.tags?.length ? <span className="book-card-tags">{book.tags.slice(0,2).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</span> : null}</Link>;
}
