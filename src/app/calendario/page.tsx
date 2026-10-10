import type { Metadata } from 'next';
import Link from 'next/link';

import { MeetingRsvp } from '@/components/calendar/meeting-rsvp';
import { createServerSupabase } from '@/lib/supabase/clients';
import { getMeetings } from '@/features/catalog/queries';
import { getMeetingRsvpMap } from '@/features/meetings/rsvp-actions';

export const metadata: Metadata = {
  title: 'Encontros',
  description: 'Acompanhe a agenda dos encontros DIYSPUR.',
};

export default async function CalendarPage() {
  const meetings = await getMeetings();
  let signedIn = false;
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase.auth.getClaims();
    signedIn = typeof data?.claims?.sub === 'string';
  } catch {
    signedIn = false;
  }
  const rsvps = signedIn ? await getMeetingRsvpMap(meetings.map((meeting) => meeting.id)) : {};
  const now = Date.now();
  const getState = (meeting: typeof meetings[number]) => {
    const start = new Date(meeting.scheduled_at).getTime();
    const end = start + (meeting.duration_min ?? 60) * 60_000;
    if (meeting.status === 'cancelled') return 'cancelled';
    if (meeting.status === 'live' || (start <= now && now < end)) return 'live';
    if (end <= now || meeting.status === 'done') return 'finished';
    return 'upcoming';
  };
  const upcoming = meetings.filter((meeting) => ['live', 'upcoming'].includes(getState(meeting)));
  const finished = meetings.filter((meeting) => getState(meeting) === 'finished');
  const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(date);
  const renderMeeting = (meeting: typeof meetings[number]) => {
    const date = new Date(meeting.scheduled_at);
    const state = getState(meeting);
    const label = state === 'live' ? 'AO VIVO' : state === 'finished' ? 'ENCERRADO' : state === 'cancelled' ? 'CANCELADO' : 'PRÓXIMO';
    return <article className="meeting-row calendar-card" key={meeting.id}>
      <div className="calendar-date"><strong>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: 'America/Sao_Paulo' }).format(date)}</strong><span>{new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' }).format(date)}</span></div>
      <div style={{ flex: 1 }}><h3>{meeting.title}</h3><p>{formatDate(date)}{meeting.duration_min ? ` · ${meeting.duration_min} min` : ''}</p>{meeting.agenda && <p>{meeting.agenda}</p>}{meeting.location && <p>{meeting.location}</p>}{meeting.meeting_url && /^https:\/\//i.test(meeting.meeting_url) && state !== 'finished' && <p><a className="text-link" href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">Abrir encontro ↗</a></p>}<MeetingRsvp meetingId={meeting.id} initialAttending={rsvps[meeting.id] ?? null} signedIn={signedIn} /></div>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}><span className={`status-pill${state === 'finished' ? ' neutral' : ''}`}>{label}</span><a className="text-link" href={`/api/ics/${meeting.id}`}>Adicionar à agenda ↓</a></div>
    </article>;
  };

  return <section className="container">
    <header className="page-intro">
      <span className="eyebrow">Ler é o começo</span>
      <h1>Tem conversa<br/><em style={{ color: 'var(--color-primary)' }}>marcada.</em></h1>
      <p>Encontros para dividir impressões, ouvir outros pontos de vista e descobrir novas camadas das histórias.</p>
    </header>
    {upcoming.length ? <section className="meeting-list section" style={{ paddingTop: 10 }} aria-labelledby="upcoming-meetings"><div className="section-head"><div><span className="eyebrow">Agenda</span><h2 id="upcoming-meetings">Próximos encontros</h2></div></div>{upcoming.map(renderMeeting)}</section> : <div className="empty-state">
      <div className="empty-state-mark" aria-hidden="true">◷</div>
      <h2>Os próximos encontros estão sendo combinados</h2>
      <p>Quando a próxima data for confirmada, você encontra tudo aqui — livro, horário e como participar.</p>
      <div className="empty-actions"><Link className="button button-dark button-small" href="/livros">Ver leituras do clube</Link></div>
    </div>}
    {finished.length > 0 && <section className="meeting-list section" style={{ paddingTop: 10 }} aria-labelledby="finished-meetings"><div className="section-head"><div><span className="eyebrow">Memória do clube</span><h2 id="finished-meetings">Encontros encerrados</h2></div></div>{finished.map(renderMeeting)}</section>}
  </section>;
}
