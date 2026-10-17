import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MeetingManageActions } from '@/components/calendar/meeting-manage-actions';
import { MeetingRsvp } from '@/components/calendar/meeting-rsvp';
import { JsonLd } from '@/components/json-ld';
import { getMeetingDetail } from '@/features/meetings/queries';
import { getGoogleCalendarUrl, getMeetingEventSchema, sanitizeCalendarUrl } from '@/lib/calendar-links';
import { createServerSupabase } from '@/lib/supabase/clients';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const meeting = await getMeetingDetail(id);
  if (!meeting) {
    return { title: 'Encontro não encontrado | DIYSPUR' };
  }
  return {
    title: `${meeting.title} — Encontros | DIYSPUR`,
    description: `Participe do debate sobre "${meeting.book.title}". Horário de Brasília, confirmação de presença e links para Google Agenda e ICS.`,
    alternates: { canonical: `/eventos/${id}` },
  };
}

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meeting = await getMeetingDetail(id);

  if (!meeting) {
    notFound();
  }

  // Se o encontro estiver associado a um livro, busca capítulos da temporada para edição
  let chapters: Array<{ id: string; number: number; title: string }> = [];
  if (meeting.canManage && meeting.book.id) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase
        .from('chapters')
        .select('id, number, title, seasons!inner(book_id)')
        .eq('seasons.book_id', meeting.book.id)
        .order('number');
      if (data) {
        chapters = data.map((ch) => ({
          id: ch.id,
          number: ch.number,
          title: ch.title,
        }));
      }
    } catch {
      chapters = [];
    }
  }

  const startDate = new Date(meeting.scheduledAt);
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(startDate);

  const safeMeetingUrl = sanitizeCalendarUrl(meeting.meetingUrl);

  const googleCalUrl = getGoogleCalendarUrl({
    id: meeting.id,
    title: meeting.title,
    scheduled_at: meeting.scheduledAt,
    duration_min: meeting.durationMin,
    agenda: meeting.agenda,
    location: meeting.location,
    meeting_url: meeting.meetingUrl,
    status: meeting.status,
    version: meeting.version,
    updated_at: meeting.updatedAt,
  });

  const eventSchema = getMeetingEventSchema({
    id: meeting.id,
    title: meeting.title,
    scheduled_at: meeting.scheduledAt,
    duration_min: meeting.durationMin,
    agenda: meeting.agenda,
    location: meeting.location,
    meeting_url: meeting.meetingUrl,
    status: meeting.status,
    version: meeting.version,
    updated_at: meeting.updatedAt,
  });

  const spoilerPolicyLabels: Record<string, string> = {
    none: 'Livre de Spoilers',
    chapter: meeting.chapter ? `Spoilers até o Capítulo ${meeting.chapter.number}` : 'Spoilers por capítulo',
    whole_book: 'Livro Completo (Spoilers liberados)',
  };

  const statusLabels: Record<string, { label: string; class: string }> = {
    scheduled: { label: 'Agendado', class: 'badge-scheduled' },
    live: { label: 'AO VIVO', class: 'badge-live' },
    done: { label: 'Concluído', class: 'badge-done' },
    cancelled: { label: 'Cancelado', class: 'badge-cancelled' },
  };

  const currentStatus = statusLabels[meeting.status] ?? {
    label: meeting.status,
    class: 'badge-scheduled',
  };

  return (
    <main id="main-content" className="shell-container page-stack">
      <JsonLd data={eventSchema as unknown as Record<string, unknown>} />

      <nav aria-label="Navegação estrutural" className="breadcrumbs-nav mb-4">
        <Link href="/calendario" className="text-sm text-muted-foreground hover:underline">
          &larr; Voltar para o Calendário
        </Link>
      </nav>

      <header className="meeting-detail-header card p-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`status-badge ${currentStatus.class}`}>
            {currentStatus.label}
          </span>
          <span className="badge badge-outline">
            {meeting.kind === 'online'
              ? 'Online'
              : meeting.kind === 'in_person'
                ? 'Presencial'
                : 'Híbrido'}
          </span>
          <span className="badge badge-outline">
            {spoilerPolicyLabels[meeting.spoilerPolicy] ?? meeting.spoilerPolicy}
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">{meeting.title}</h1>

        <p className="text-lg text-primary font-medium mb-4">
          <time dateTime={meeting.scheduledAt}>{formattedDate}</time> (Horário de Brasília)
          <span className="text-muted-foreground font-normal ml-2">
            &bull; Duração: {meeting.durationMin} min
          </span>
        </p>

        <div className="flex flex-wrap gap-4 text-sm border-t pt-4">
          <div>
            <span className="text-muted-foreground block text-xs uppercase font-semibold">
              Livro
            </span>
            {meeting.book.slug ? (
              <Link
                href={`/livros/${meeting.book.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {meeting.book.title}
              </Link>
            ) : (
              <span className="font-medium">{meeting.book.title}</span>
            )}
          </div>

          {meeting.club ? (
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">
                Clube
              </span>
              <Link
                href={`/clubes/${meeting.club.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {meeting.club.name}
              </Link>
            </div>
          ) : null}

          {meeting.chapter ? (
            <div>
              <span className="text-muted-foreground block text-xs uppercase font-semibold">
                Capítulo em foco
              </span>
              <Link
                href={`/capitulos/${meeting.chapter.id}`}
                className="font-medium text-primary hover:underline"
              >
                Cap. {meeting.chapter.number}: {meeting.chapter.title}
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        <div className="md:col-span-2 space-y-6">
          <article className="card p-6">
            <h2 className="text-xl font-semibold mb-3">Sobre o Encontro</h2>
            {meeting.agenda ? (
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                {meeting.agenda}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                Nenhuma pauta ou observação cadastrada para este encontro.
              </p>
            )}

            {safeMeetingUrl ? (
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-2">Acesso à Transmissão Online</h3>
                <a
                  href={safeMeetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary inline-flex items-center gap-2"
                >
                  Entrar na chamada de vídeo &rarr;
                </a>
              </div>
            ) : null}

            {meeting.location ? (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-sm font-semibold mb-1">Localização Física</h3>
                <p className="text-muted-foreground">{meeting.location}</p>
              </div>
            ) : null}
          </article>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <MeetingRsvp
              meetingId={meeting.id}
              initialAttending={meeting.userRsvp}
              signedIn={Boolean(meeting.viewerId)}
              disabled={meeting.status === 'cancelled' || meeting.status === 'done'}
            />
            <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
              <strong>{meeting.attendeesCount}</strong> participante(s) confirmaram presença.
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-base font-semibold mb-3">Adicionar à sua Agenda</h3>
            <div className="flex flex-col gap-2">
              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline text-center"
              >
                Google Agenda
              </a>
              <a
                href={`/api/ics/${meeting.id}`}
                download={`${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`}
                className="button button-outline text-center"
              >
                Baixar .ICS (Apple / Outlook)
              </a>
            </div>
          </div>
        </aside>
      </section>

      {meeting.canManage ? (
        <MeetingManageActions meeting={meeting} chapters={chapters} />
      ) : null}
    </main>
  );
}
