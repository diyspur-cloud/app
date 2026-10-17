'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cancelClubMeetingAction } from '@/features/meetings/actions';
import type { MeetingDetailView } from '@/features/meetings/queries';
import { MeetingForm } from './meeting-form';

export interface MeetingManageActionsProps {
  meeting: MeetingDetailView;
  chapters?: Array<{ id: string; number: number; title: string }>;
}

export function MeetingManageActions({ meeting, chapters = [] }: MeetingManageActionsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  function handleCancelMeeting() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await cancelClubMeetingAction({
        meetingId: meeting.id,
        version: meeting.version,
      });

      if (!res.ok) {
        setErrorMsg(res.message);
      } else {
        setShowConfirmCancel(false);
        router.refresh();
      }
    });
  }

  if (meeting.status === 'cancelled') {
    return (
      <div className="callout callout-warning">
        <p className="font-semibold">Este encontro foi cancelado pela moderação.</p>
      </div>
    );
  }

  return (
    <div className="meeting-manage-panel card p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold">Painel da Moderação</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as informações ou o status deste encontro.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="button button-small button-outline"
            onClick={() => setIsEditing(!isEditing)}
            disabled={isPending}
          >
            {isEditing ? 'Fechar edição' : 'Editar encontro'}
          </button>
          {!showConfirmCancel ? (
            <button
              type="button"
              className="button button-small button-danger"
              onClick={() => setShowConfirmCancel(true)}
              disabled={isPending}
            >
              Cancelar encontro
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="button button-small button-danger"
                onClick={handleCancelMeeting}
                disabled={isPending}
              >
                {isPending ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
              <button
                type="button"
                className="button button-small button-outline"
                onClick={() => setShowConfirmCancel(false)}
                disabled={isPending}
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMsg ? (
        <div role="alert" className="error-banner mb-4">
          {errorMsg}
        </div>
      ) : null}

      {isEditing ? (
        <div className="mt-4 border-t pt-4">
          <MeetingForm
            mode="edit"
            clubId={meeting.club?.id ?? ''}
            bookId={meeting.book.id}
            bookTitle={meeting.book.title}
            chapters={chapters}
            initialData={{
              id: meeting.id,
              title: meeting.title,
              kind: meeting.kind,
              scheduledAt: meeting.scheduledAt,
              durationMin: meeting.durationMin,
              meetingUrl: meeting.meetingUrl,
              location: meeting.location,
              agenda: meeting.agenda,
              spoilerPolicy: meeting.spoilerPolicy,
              chapterId: meeting.chapter?.id ?? null,
              version: meeting.version,
            }}
            onSuccessRedirectHref={`/eventos/${meeting.id}`}
          />
        </div>
      ) : null}
    </div>
  );
}
