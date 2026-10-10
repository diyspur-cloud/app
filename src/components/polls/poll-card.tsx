'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';
import { castPollVote } from '@/features/polls/actions';
import type { PublicPoll } from '@/features/polls/queries';

function formatCloseDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function PollCard({ poll }: { poll: PublicPoll }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; ok: boolean; requiresAuth?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasVoted = feedback?.ok === true;

  function submitVote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!selectedOption) {
      setFeedback({ message: 'Escolha uma opção antes de votar.', ok: false });
      return;
    }

    startTransition(async () => {
      try {
        const result = await castPollVote({ pollId: poll.id, optionId: selectedOption });
        setFeedback({ message: result.message, ok: result.ok, requiresAuth: result.ok ? undefined : result.requiresAuth });
      } catch {
        setFeedback({ message: 'Não foi possível registrar seu voto agora. Tente novamente.', ok: false });
      }
    });
  }

  if (poll.closed) {
    const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes_count ?? 0), 0);
    return <article className="member-card" aria-labelledby={`poll-title-${poll.id}`}><span className="eyebrow">Resultado da comunidade</span><h2 id={`poll-title-${poll.id}`} style={{ marginTop: '12px', font: '400 28px/1.15 var(--font-serif)' }}>{poll.title}</h2><p className="field-hint" style={{ marginTop: '10px' }}>Votação encerrada · {totalVotes} voto{totalVotes === 1 ? '' : 's'}</p><div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>{poll.options.map((option, index) => { const votes = option.votes_count ?? 0; const percentage = totalVotes ? Math.round((votes / totalVotes) * 100) : 0; return <div key={option.id}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}><strong>{option.proposal?.trim() || `Opção ${index + 1}`}</strong><span className="field-hint">{percentage}% · {votes}</span></div><div aria-hidden="true" style={{ height: '8px', marginTop: '6px', borderRadius: '999px', background: 'var(--color-overlay)', overflow: 'hidden' }}><div style={{ width: `${percentage}%`, height: '100%', background: 'var(--color-primary)' }} /></div></div>; })}</div></article>;
  }

  return (
    <article className="member-card" aria-labelledby={`poll-title-${poll.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <span className="eyebrow">Enquete aberta</span>
          <h2 id={`poll-title-${poll.id}`} style={{ marginTop: '12px', font: '400 28px/1.15 var(--font-serif)' }}>{poll.title}</h2>
        </div>
        <span className="status-pill">Aberta</span>
      </div>
      <p className="field-hint" style={{ marginTop: '10px' }}>Você pode escolher uma opção até {formatCloseDate(poll.closes_at)}.</p>
      {!hasVoted && <p className="field-hint" style={{ marginTop: '7px' }}>Já faz parte do clube? <Link className="text-link" href={{ pathname: '/entrar', query: { redirect: '/votacao' } }}>Entre para votar</Link>.</p>}

      <form onSubmit={submitVote} style={{ marginTop: '22px' }}>
        <fieldset disabled={isPending || hasVoted} style={{ border: 0, margin: 0, padding: 0 }}>
          <legend className="sr-only">Opções para {poll.title}</legend>
          <div style={{ display: 'grid', gap: '10px' }}>
            {poll.options.map((option, index) => {
              const inputId = `poll-${poll.id}-option-${option.id}`;
              return (
                <label
                  htmlFor={inputId}
                  key={option.id}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 15px', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--color-elevated)', cursor: hasVoted ? 'default' : 'pointer' }}
                >
                  <input
                    id={inputId}
                    name={`poll-${poll.id}`}
                    type="radio"
                    value={option.id}
                    checked={selectedOption === option.id}
                    onChange={() => setSelectedOption(option.id)}
                    style={{ accentColor: 'var(--color-primary)', marginTop: '4px' }}
                  />
                  <span>
                    <strong style={{ display: 'block', fontSize: '14px', fontWeight: 600 }}>{option.proposal?.trim() || `Opção ${index + 1}`}</strong>
                    <span className="field-hint">Uma escolha da comunidade</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginTop: '18px' }}>
          <button className="button button-small" type="submit" disabled={isPending || hasVoted}>
            {isPending ? 'Registrando…' : hasVoted ? 'Voto registrado' : 'Votar nesta opção'}
          </button>
          <span className="field-hint">O resultado aparece só depois do encerramento.</span>
        </div>
      </form>

      {feedback && (
        <div className={`notice${feedback.ok ? ' auth-success' : ''}`} role={feedback.ok ? 'status' : 'alert'} style={{ marginTop: '17px' }}>
          <p>{feedback.message}</p>
          {feedback.requiresAuth && (
            <p style={{ marginTop: '8px' }}>
              <Link className="text-link" href={{ pathname: '/entrar', query: { redirect: '/votacao' } }}>Entrar para votar</Link>
              {' · '}
              <Link className="text-link" href={{ pathname: '/cadastro', query: { redirect: '/votacao' } }}>Criar uma conta</Link>
            </p>
          )}
        </div>
      )}
    </article>
  );
}
