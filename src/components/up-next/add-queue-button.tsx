'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { addToUpNext } from '@/features/up-next/actions';

export function AddQueueButton({ bookId }: { bookId: string }) {
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <div className="add-queue-wrapper" style={{ display: 'inline-flex', flexDirection: 'column', gap: '6px' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        disabled={busy}
        onClick={() => {
          startTransition(async () => {
            const result = await addToUpNext(bookId);
            setFeedback(result.message);
          });
        }}
        aria-label="Adicionar este livro à minha fila de prioridade"
      >
        <span aria-hidden="true">📑</span>{' '}
        {busy ? 'Guardando…' : 'Adicionar à minha fila'}
      </button>
      {feedback && (
        <p role="status" className="field-hint" style={{ margin: 0, fontSize: 'var(--text-caption)' }}>
          {feedback}{' '}
          <Link className="text-link" href="/minha-fila">
            Ver fila →
          </Link>
        </p>
      )}
    </div>
  );
}
