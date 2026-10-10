'use client';
import { useState, useTransition } from 'react';
import { joinClub, leaveClub } from '@/features/clubs/actions';
export function ClubMembershipActions({ clubId, isMember, isOwner, isPrivate }: { clubId: string; isMember: boolean; isOwner: boolean; isPrivate: boolean }) {
  const [busy, startTransition] = useTransition(); const [feedback, setFeedback] = useState('');
  if (isOwner) return <p className="field-hint">Você administra este clube.</p>;
  function run(action: typeof joinClub | typeof leaveClub) { startTransition(async () => { const result = await action({ clubId }); setFeedback(result.message); if (result.ok) window.location.reload(); }); }
  return <div className="chapter-progress-actions">{isMember ? <button className="button button-quiet button-small" type="button" disabled={busy} onClick={() => run(leaveClub)}>Sair do clube</button> : <button className="button button-small" type="button" disabled={busy || isPrivate} onClick={() => run(joinClub)}>{isPrivate ? 'Somente por convite' : busy ? 'Entrando…' : 'Entrar no clube'}</button>}{feedback && <span className="field-hint" role="status">{feedback}</span>}</div>;
}
