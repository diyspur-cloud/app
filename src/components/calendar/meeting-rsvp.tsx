'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { setMeetingRsvp } from '@/features/meetings/rsvp-actions';

type Feedback = { ok: boolean; message: string } | null;

export type MeetingRsvpProps = {
  meetingId: string;
  /** Server-provided value for this user; null means no response (or no session). */
  initialAttending: boolean | null;
  /** Optional so a server page can avoid showing RSVP controls to signed-out visitors. */
  signedIn?: boolean;
};

export function MeetingRsvp({ meetingId, initialAttending, signedIn = true }: MeetingRsvpProps) {
  const [attending, setAttending] = useState(initialAttending);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAttending(initialAttending);
  }, [initialAttending]);

  function chooseRsvp(nextAttending: boolean) {
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await setMeetingRsvp({ meetingId, attending: nextAttending });
        if (result.ok) setAttending(result.attending);
        setFeedback({ ok: result.ok, message: result.message });
      } catch {
        setFeedback({ ok: false, message: 'Não foi possível salvar sua resposta agora. Tente novamente.' });
      }
    });
  }

  return (
    <section className="meeting-rsvp" aria-labelledby={`meeting-rsvp-${meetingId}`}>
      <span className="eyebrow">Sua presença</span>
      <h4 id={`meeting-rsvp-${meetingId}`}>Você vai participar?</h4>
      <p className="field-hint">
        {attending === true
          ? 'Você confirmou presença neste encontro.'
          : attending === false
            ? 'Sua presença está cancelada.'
            : 'Responda para confirmar ou cancelar sua presença.'}
      </p>

      {signedIn ? (
        <div role="group" aria-label="Resposta para o encontro" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          <button
            className="button button-small"
            type="button"
            aria-pressed={attending === true}
            disabled={isPending}
            onClick={() => chooseRsvp(true)}
          >
            {isPending && attending !== true ? 'Salvando…' : 'Aceitar'}
          </button>
          <button
            className="button button-quiet button-small"
            type="button"
            aria-pressed={attending === false}
            disabled={isPending}
            onClick={() => chooseRsvp(false)}
          >
            {isPending && attending !== false ? 'Salvando…' : 'Cancelar'}
          </button>
        </div>
      ) : (
        <Link className="button button-small" href={`/entrar?redirect=${encodeURIComponent('/calendario')}`}>
          Entre para responder
        </Link>
      )}

      {feedback && (
        <p className="action-feedback" role={feedback.ok ? 'status' : 'alert'} aria-live="polite">
          {feedback.message}
        </p>
      )}
    </section>
  );
}
