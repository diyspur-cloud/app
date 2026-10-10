import Link from 'next/link';

import type { ChallengeRow, UserChallengeRow } from './queries';
import { EnrollButton } from './enroll-button';

function safeProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

function progressByChallenge(rows: UserChallengeRow[]): Map<string, UserChallengeRow> {
  return new Map(rows.map((row) => [row.challenge_id, row]));
}

export function ChallengeList({
  challenges,
  progress,
  challengesError,
  progressError,
  signedIn,
}: {
  challenges: ChallengeRow[];
  progress: UserChallengeRow[];
  challengesError: boolean;
  progressError: boolean;
  signedIn: boolean;
}) {
  if (challengesError) {
    return (
      <div className="notice" role="alert">
        <p>Não foi possível carregar os desafios agora. Tente atualizar a página.</p>
        {!signedIn && (
          <p style={{ marginTop: 9 }}>
            <Link className="text-link" href="/entrar?redirect=%2Fdesafios">Entrar para tentar novamente →</Link>
          </p>
        )}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-mark" aria-hidden="true">✳</div>
        <h2>Um novo desafio está a caminho.</h2>
        <p>Os desafios publicados aparecerão aqui quando o próximo ciclo de leitura começar.</p>
        <div className="empty-actions">
          <Link className="button button-small" href="/livros">Explorar leituras</Link>
        </div>
      </div>
    );
  }

  const progressMap = progressByChallenge(progress);

  return (
    <>
      {progressError && signedIn && (
        <div className="notice" role="status" style={{ marginBottom: 18 }}>
          Os desafios estão disponíveis, mas não foi possível carregar sua inscrição e seu progresso agora.
        </div>
      )}
      <div style={{ display: 'grid', gap: 14 }}>
        {challenges.map((challenge) => {
          const enrollment = progressMap.get(challenge.id);
          const progressValue = enrollment ? safeProgress(enrollment.progress) : null;
          const completed = Boolean(enrollment?.completed_at);

          return (
            <article className="member-card" key={challenge.id}>
              <div style={{ alignItems: 'start', display: 'flex', gap: 14, justifyContent: 'space-between' }}>
                <div>
                  <p className="eyebrow">{challenge.year ? `Ciclo ${challenge.year}` : 'Desafio publicado'}</p>
                  <h2 style={{ fontSize: 24, marginTop: 6 }}>{challenge.title}</h2>
                </div>
                {completed && (
                  <span
                    aria-label="Desafio concluído"
                    style={{
                      background: 'color-mix(in srgb, var(--color-success) 18%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--color-success) 42%, transparent)',
                      borderRadius: 'var(--radius-pill)',
                      color: 'var(--color-success)',
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '5px 9px',
                    }}
                  >
                    Concluído
                  </span>
                )}
              </div>
              {challenge.description && <p style={{ marginTop: 10 }}>{challenge.description}</p>}
              <p className="field-hint" style={{ marginTop: 12 }}>Publicado em {formatDate(challenge.created_at)}</p>

              {enrollment && progressValue !== null ? (
                <div aria-label={`Progresso: ${progressValue}%`} style={{ marginTop: 18 }}>
                  <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span className="field-hint">Seu progresso</span>
                    <strong>{progressValue}%</strong>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{ background: 'var(--color-border-strong)', borderRadius: 'var(--radius-pill)', height: 8, marginTop: 8, overflow: 'hidden' }}
                  >
                    <div style={{ background: 'var(--gradient-brand)', borderRadius: 'inherit', height: '100%', width: `${progressValue}%` }} />
                  </div>
                  {enrollment.completed_at && (
                    <p className="field-hint" style={{ marginTop: 8 }}>Concluído em {formatDate(enrollment.completed_at)}</p>
                  )}
                </div>
              ) : progressError ? (
                <p className="field-hint" style={{ marginTop: 16 }}>Seu progresso não está disponível no momento.</p>
              ) : signedIn ? (
                <>
                  <p className="field-hint" style={{ marginTop: 16 }}>Você ainda não está inscrito neste desafio.</p>
                  <EnrollButton challengeId={challenge.id} />
                </>
              ) : (
                <p style={{ marginTop: 16 }}><Link className="text-link" href="/entrar?redirect=%2Fdesafios">Entre para acompanhar seu progresso →</Link></p>
              )}
            </article>
          );
        })}
      </div>
      <div className="notice" style={{ marginTop: 20 }}>
        <strong>Seu progresso é atualizado pelas atividades do clube.</strong>
        <p style={{ marginTop: 7 }}>A inscrição é privada e idempotente; a conclusão não pode ser marcada manualmente.</p>
      </div>
    </>
  );
}
