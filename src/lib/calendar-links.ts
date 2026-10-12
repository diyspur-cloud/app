export interface CalendarMeeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_min?: number | null;
  agenda?: string | null;
  location?: string | null;
  meeting_url?: string | null;
}

function toGoogleDateString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Gera URL direta para adicionar o evento ao Google Agenda na Web (CAL-01).
 */
export function getGoogleCalendarUrl(meeting: CalendarMeeting): string {
  const start = new Date(meeting.scheduled_at);
  const durationMs = (meeting.duration_min || 60) * 60 * 1000;
  const end = new Date(start.getTime() + durationMs);

  const startStr = toGoogleDateString(start);
  const endStr = toGoogleDateString(end);

  const details = [
    meeting.agenda ?? 'Encontro do clube de leitura DIYSPUR.',
    meeting.meeting_url ? `Link da transmissão: ${meeting.meeting_url}` : null,
    'Horário de Brasília (America/Sao_Paulo).',
  ]
    .filter(Boolean)
    .join('\n\n');

  const location = meeting.meeting_url || meeting.location || 'Online (DIYSPUR)';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: meeting.title,
    dates: `${startStr}/${endStr}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera objeto Schema.org para marcação rica de Eventos / Encontros Virtuais (SEO-01).
 */
export function getMeetingEventSchema(meeting: CalendarMeeting) {
  const start = new Date(meeting.scheduled_at);
  const durationMin = meeting.duration_min || 60;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  return {
    '@type': 'Event',
    name: meeting.title,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    description: meeting.agenda ?? 'Encontro do clube de leitura DIYSPUR.',
    location: {
      '@type': 'VirtualLocation',
      url: meeting.meeting_url ?? 'https://diyspur.vercel.app/calendario',
    },
    organizer: {
      '@type': 'Organization',
      name: 'DIYSPUR',
      url: 'https://diyspur.vercel.app',
    },
  };
}

/**
 * Escapa texto de acordo com a especificação RFC 5545 para arquivos iCalendar (.ics).
 */
export function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

