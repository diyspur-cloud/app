import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { getUserReadingGoal } from '@/features/goals/queries';
import { GoalForm } from '@/components/goals/goal-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Metas de leitura',
  description: 'Defina e acompanhe seus objetivos anuais de leitura.',
};

export default async function GoalsPage() {
  const session = await requireSession();
  if (!session) redirect('/entrar?redirect=/metas');

  const currentYear = new Date().getFullYear();
  const { goal, progress, error } = await getUserReadingGoal(session.userId, currentYear);

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Objetivos</span>
        <h1>
          Seu ritmo de leitura em <em>{currentYear}.</em>
        </h1>
        <p>Defina metas para orientar seu ano e acompanhe o progresso derivado das suas leituras e diários.</p>
      </header>

      {error && (
        <div className="notice" role="alert" style={{ marginBottom: '20px' }}>
          Não foi possível carregar o progresso anual no momento.
        </div>
      )}

      <div className="member-grid">
        <section aria-labelledby="goals-config-heading" className="member-card">
          <div className="section-head">
            <div>
              <span className="eyebrow">Configuração</span>
              <h2 id="goals-config-heading">Metas do ano {currentYear}</h2>
            </div>
          </div>
          <GoalForm goal={goal} year={currentYear} />
        </section>

        <aside className="chapter-aside" aria-labelledby="goals-progress-heading">
          <h2 id="goals-progress-heading">Progresso em {currentYear}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="member-card" style={{ padding: '16px' }}>
              <span className="eyebrow">Livros concluídos</span>
              {progress ? (
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: '4px 0' }}>
                  {progress.books_done} {goal?.target_books ? `/ ${goal.target_books}` : 'livros'}
                </p>
              ) : (
                <p className="field-hint" style={{ margin: '6px 0 0' }}>
                  {goal ? 'O progresso anual ainda não está disponível.' : 'Defina uma meta para acompanhar seu progresso anual.'}
                </p>
              )}
              {goal?.target_books && progress ? (
                <div style={{ background: 'var(--surface-3)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--brand)',
                      height: '100%',
                      width: `${Math.min(100, Math.round((progress.books_done / goal.target_books) * 100))}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="member-card" style={{ padding: '16px' }}>
              <span className="eyebrow">Páginas lidas</span>
              {progress ? (
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: '4px 0' }}>
                  {progress.pages_done} {goal?.target_pages ? `/ ${goal.target_pages}` : 'páginas'}
                </p>
              ) : (
                <p className="field-hint" style={{ margin: '6px 0 0' }}>
                  {goal ? 'O progresso anual ainda não está disponível.' : 'Defina uma meta para acompanhar seu progresso anual.'}
                </p>
              )}
              {goal?.target_pages && progress ? (
                <div style={{ background: 'var(--surface-3)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--brand)',
                      height: '100%',
                      width: `${Math.min(100, Math.round((progress.pages_done / goal.target_pages) * 100))}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            <div className="member-card" style={{ padding: '16px' }}>
              <span className="eyebrow">Tempo dedicado</span>
              {progress ? (
                <p style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', margin: '4px 0' }}>
                  {progress.minutes_done} {goal?.target_minutes ? `/ ${goal.target_minutes}` : 'minutos'}
                </p>
              ) : (
                <p className="field-hint" style={{ margin: '6px 0 0' }}>
                  {goal ? 'O progresso anual ainda não está disponível.' : 'Defina uma meta para acompanhar seu progresso anual.'}
                </p>
              )}
              {goal?.target_minutes && progress ? (
                <div style={{ background: 'var(--surface-3)', height: '6px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--brand)',
                      height: '100%',
                      width: `${Math.min(100, Math.round((progress.minutes_done / goal.target_minutes) * 100))}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>

            <p className="field-hint">
              O progresso é atualizado automaticamente ao concluir ciclos de leitura e registrar sessões no{' '}
              <Link className="text-link" href="/diario">diário</Link>.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
