'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { setMyBookReadingAction } from '@/features/reading/actions';
import type { MyBookReadingState } from '@/features/reading/queries';
import {
  isValidReadingStatusTransition,
  type BookReadingStatus,
} from '@/features/reading/schemas';

const STATUS_OPTIONS: { value: BookReadingStatus; label: string }[] = [
  { value: 'want_to_read', label: 'Quero ler' },
  { value: 'reading', label: 'Estou lendo' },
  { value: 'read', label: 'Já li' },
  { value: 'dnf', label: 'Abandonei' },
];

interface BookReadingControlProps {
  bookId: string;
  bookSlug: string;
  initialState: MyBookReadingState | null;
  signedIn: boolean;
}

export function BookReadingControl({
  bookId,
  bookSlug,
  initialState,
  signedIn,
}: BookReadingControlProps) {
  const [state, setState] = useState<MyBookReadingState | null>(initialState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <div className="book-reading-control">
        <span className="eyebrow">Sua leitura</span>
        <p className="field-hint" style={{ margin: '0.25rem 0 0.75rem' }}>
          Entre para registrar se você quer ler, está lendo ou já concluiu esta obra.
        </p>
        <Link
          className="btn btn-secondary btn-sm"
          href={`/entrar?redirect=${encodeURIComponent(`/livros/${bookSlug}`)}`}
        >
          Entrar para marcar leitura
        </Link>
      </div>
    );
  }

  const currentStatus = state?.status ?? null;
  const currentVersion = state?.version ?? 0;

  const handleSelectStatus = (nextStatus: BookReadingStatus) => {
    if (nextStatus === currentStatus) return;

    if (!isValidReadingStatusTransition(currentStatus, nextStatus)) {
      setIsError(true);
      setFeedback('Inicie a leitura ("Estou lendo") antes de marcar como lido ou abandonado.');
      return;
    }

    setIsError(false);
    setFeedback(null);
    const requestId = crypto.randomUUID();

    startTransition(async () => {
      const res = await setMyBookReadingAction({
        bookId,
        bookSlug,
        status: nextStatus,
        version: currentVersion,
        requestId,
      });

      if (res.ok && res.state) {
        setState(res.state);
        setIsError(false);
        setFeedback(res.message);
      } else {
        setIsError(true);
        setFeedback(res.message);
      }
    });
  };

  return (
    <div className="book-reading-control" aria-label="Status de leitura do livro">
      <div className="book-reading-control-head">
        <span className="eyebrow">Sua leitura</span>
        {currentStatus && (
          <span className="book-reading-source-badge">
            {state?.source === 'verified_book_completion'
              ? 'Verificado pela temporada'
              : 'No seu histórico'}
          </span>
        )}
      </div>

      <div className="book-reading-pills" role="group" aria-label="Escolher status de leitura">
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = currentStatus === opt.value;
          const allowed = isValidReadingStatusTransition(currentStatus, opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              className={`book-reading-pill ${isSelected ? 'active' : ''}`}
              aria-pressed={isSelected}
              disabled={isPending || (!allowed && !isSelected)}
              title={
                !allowed && !isSelected
                  ? 'Marque "Estou lendo" primeiro para liberar esta opção'
                  : undefined
              }
              onClick={() => handleSelectStatus(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {feedback && (
        <p
          className="field-hint"
          role={isError ? 'alert' : 'status'}
          aria-live="polite"
          style={{ marginTop: '0.5rem' }}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
