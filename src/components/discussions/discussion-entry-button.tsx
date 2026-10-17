'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  openChapterDiscussionAction,
  openOfficialBookGroupAction,
} from '@/features/discussions/actions';

type DiscussionEntryProps =
  | {
      mode: 'book';
      bookId: string;
      bookSlug: string;
      destination?: 'hub' | 'safe' | 'spoilers';
      label?: string;
      className?: string;
    }
  | {
      mode: 'chapter';
      chapterId: string;
      videoSec?: number | null;
      label?: string;
      className?: string;
    };

export function DiscussionEntryButton(props: DiscussionEntryProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        const res =
          props.mode === 'book'
            ? await openOfficialBookGroupAction({
                bookId: props.bookId,
                bookSlug: props.bookSlug,
                destination: props.destination ?? 'hub',
              })
            : await openChapterDiscussionAction({
                chapterId: props.chapterId,
                videoSec: props.videoSec ?? null,
              });

        if (res.ok) {
          router.push(res.href);
          return;
        }

        if (res.code === 'unauthenticated' && res.loginHref) {
          router.push(res.loginHref);
          return;
        }

        setErrorMessage(res.message);
      } catch {
        setErrorMessage('Não foi possível abrir a conversa no momento. Tente novamente.');
      }
    });
  };

  const defaultLabel =
    props.mode === 'book' ? 'Grupo do livro' : 'Comentar no grupo';

  return (
    <div className="discussion-entry-wrap">
      <button
        type="button"
        className={props.className ?? 'btn btn-primary'}
        onClick={handleClick}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? 'Abrindo conversa…' : (props.label ?? defaultLabel)}
      </button>
      {errorMessage && (
        <p className="field-hint" role="alert" style={{ marginTop: '0.35rem' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
