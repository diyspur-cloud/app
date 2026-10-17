import Link from 'next/link';
import { DiscussionEntryButton } from '@/components/discussions/discussion-entry-button';
import {
  buildClubChannelHref,
  buildClubHref,
  buildEventHref,
} from '@/lib/community-navigation';

interface BookCommunityPanelProps {
  bookId: string;
  bookTitle: string;
  officialClub: {
    id: string;
    slug: string;
    name: string;
    memberCount: number;
  } | null;
  channelsCount: number;
  upcomingMeetings: {
    id: string;
    title: string;
    scheduledAt: string;
    kind: string;
    chapterId: string | null;
  }[];
}

function formatMeetingDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function BookCommunityPanel({
  bookId,
  bookTitle,
  officialClub,
  channelsCount,
  upcomingMeetings,
}: BookCommunityPanelProps) {
  return (
    <section
      className="section book-community-panel"
      aria-labelledby="book-community-hub-heading"
    >
      <div className="member-card">
        <div className="section-head">
          <div>
            <span className="eyebrow">Grupo Oficial de Leitura</span>
            <h2 id="book-community-hub-heading">
              Converse sobre {bookTitle} com outros leitores
            </h2>
            <p className="field-hint">
              Canais organizados sem spoilers, por capítulo desbloqueado e discussão completa da
              obra.
            </p>
          </div>
          {officialClub && (
            <span className="pill">
              {officialClub.memberCount}{' '}
              {officialClub.memberCount === 1 ? 'participante' : 'participantes'} ·{' '}
              {Math.max(channelsCount, 2)} canais
            </span>
          )}
        </div>

        <div
          className="action-row"
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}
        >
          <DiscussionEntryButton
            mode="book"
            bookId={bookId}
            channelSlug="sem-spoilers"
            label="Entrar no canal #sem-spoilers"
            className="btn btn-primary"
          />
          {officialClub ? (
            <>
              <Link
                href={buildClubChannelHref({
                  clubSlug: officialClub.slug,
                  channelSlug: 'spoilers-completos',
                })}
                className="btn btn-secondary"
              >
                Canal #spoilers-completos
              </Link>
              <Link href={buildClubHref(officialClub.slug)} className="btn btn-ghost">
                Ver todos os canais do grupo →
              </Link>
            </>
          ) : (
            <DiscussionEntryButton
              mode="book"
              bookId={bookId}
              channelSlug="spoilers-completos"
              label="Abrir canal #spoilers-completos"
              className="btn btn-secondary"
            />
          )}
        </div>

        {upcomingMeetings.length > 0 && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <span className="eyebrow">Agenda do livro</span>
            <h3 style={{ margin: '0.25rem 0 0.75rem' }}>Próximos encontros sobre esta obra</h3>
            <div className="grid-2">
              {upcomingMeetings.map((m) => (
                <article key={m.id} className="card" style={{ padding: '1rem' }}>
                  <p className="eyebrow">{formatMeetingDate(m.scheduledAt)}</p>
                  <h4 style={{ margin: '0.25rem 0 0.5rem' }}>{m.title}</h4>
                  <Link href={buildEventHref(m.id)} className="text-link">
                    Ver detalhes e confirmar presença →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
