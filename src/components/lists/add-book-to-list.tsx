'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { addBookToReadingList } from '@/features/lists/actions';

export function AddBookToList({ bookId, lists }: { bookId: string; lists: { id: string; title: string }[] }) {
  const [listId, setListId] = useState(lists[0]?.id ?? '');
  const [feedback, setFeedback] = useState('');
  const [busy, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await addBookToReadingList({ listId, bookId });
      setFeedback(result.message);
    });
  }
  if (!lists.length) return <p className="field-hint" style={{ marginTop: 12 }}>Quer guardar este livro? <Link className="text-link" href="/listas">Crie uma lista privada →</Link></p>;
  return <form className="add-book-list" onSubmit={submit}><label htmlFor="book-list-select">Guardar em</label><div><select id="book-list-select" className="field" value={listId} onChange={(event) => setListId(event.target.value)}><option value="" disabled>Escolha uma lista</option>{lists.map((list) => <option key={list.id} value={list.id}>{list.title}</option>)}</select><button className="button button-quiet button-small" type="submit" disabled={busy || !listId}>{busy ? 'Salvando…' : 'Adicionar'}</button></div>{feedback && <p className="action-feedback" role="status">{feedback}</p>}</form>;
}
