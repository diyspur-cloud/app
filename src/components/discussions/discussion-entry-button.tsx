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
      channelSlug?: string;
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
      if (props.mode === 'book') {
        const res = await openOfficialBookGroupAction({
          bookId: props.bookId,
          channelSlug: props.channelSlug,
        });
        if (res.ok && res.href) {
          router.push(res.href);
        } else {
          setErrorMessage(res.message ?? 'Não foi possível abrir o grupo do livro.');
        }
      } else {
        const res = await openChapterDiscussionAction({
          chapterId: props.chapterId,
          videoSec: props.videoSec ?? null,
        });
        if (res.ok && res.href) {
          router.push(res.href);
        } else {
          setErrorMessage(res.message ?? 'Não foi possível abrir a discussão deste capítulo.');
        }
      }
    });
  };

  const defaultLabel =
    props.mode === 'book' ? 'Participar da discussão do livro' : 'Discutir este capítulo no grupo';

  return (
    <div className="discussion-entry-wrap">
      <button
        type="button"
        className={props.className ?? 'btn btn-primary'}
        onClick={handleClick}
        disabled={isPending}
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
