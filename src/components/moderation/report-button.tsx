'use client';

import { useState, useTransition } from 'react';
import { reportContent } from '@/features/moderation/actions';

export function ReportButton({
  contentType,
  contentId,
  path,
}: {
  contentType: 'comment' | 'timed_comment' | 'journal' | 'post' | 'club_message';
  contentId: string;
  path: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [busy, start] = useTransition();

  return (
    <div className="comment-actions">
      <button
        className="button button-quiet button-small"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        Denunciar
      </button>
      {open && (
        <form
          className="comment-edit"
          onSubmit={(event) => {
            event.preventDefault();
            start(async () => {
              const result = await reportContent({ contentType, contentId, reason, path });
              setMessage(result.message);
              if (result.ok) {
                setOpen(false);
                setReason('');
              }
            });
          }}
        >
          <label htmlFor={`report-${contentId}`}>Motivo</label>
          <textarea
            id={`report-${contentId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            minLength={3}
            maxLength={500}
            required
            placeholder="O que precisa da atenção da equipe?"
          />
          <button className="button button-small" disabled={busy}>
            {busy ? 'Enviando…' : 'Enviar denúncia'}
          </button>
        </form>
      )}
      {message && (
        <span className="field-hint" role="status">
          {message}
        </span>
      )}
    </div>
  );
}
