'use client';

import { useState, useTransition } from 'react';
import { acceptInvitation, joinClub, leaveClub } from '@/features/clubs/actions';

export function ClubMembershipActions({
  clubId,
  isMember,
  isOwner,
  isPrivate,
  pendingInvitationId,
}: {
  clubId: string;
  isMember: boolean;
  isOwner: boolean;
  isPrivate: boolean;
  pendingInvitationId?: string | null;
}) {
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState('');

  if (isOwner) {
    return (
      <span className="field-hint" style={{ margin: 0, fontWeight: 'var(--weight-medium)' }}>
        Você administra este clube.
      </span>
    );
  }

  function run(action: typeof joinClub | typeof leaveClub) {
    startTransition(async () => {
      const result = await action({ clubId });
      setFeedback(result.message);
      if (result.ok) window.location.reload();
    });
  }

  function handleAcceptInvite(invitationId: string) {
    startTransition(async () => {
      const result = await acceptInvitation({ invitationId });
      setFeedback(result.message);
      if (result.ok) window.location.reload();
    });
  }

  return (
    <div className="club-membership-actions">
      <div className="club-membership-buttons">
        {isMember ? (
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            disabled={busy}
            onClick={() => run(leaveClub)}
          >
            {busy ? 'Saindo…' : 'Sair do clube'}
          </button>
        ) : pendingInvitationId ? (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={busy}
            onClick={() => handleAcceptInvite(pendingInvitationId)}
          >
            {busy ? 'Aceitando…' : 'Aceitar convite do clube'}
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            disabled={busy || isPrivate}
            onClick={() => run(joinClub)}
          >
            {isPrivate ? 'Somente por convite' : busy ? 'Entrando…' : 'Entrar no clube'}
          </button>
        )}
      </div>
      {feedback && (
        <span className="field-hint" role="status">
          {feedback}
        </span>
      )}
    </div>
  );
}
