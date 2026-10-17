export interface CalendarMeeting {
  id: string;
  title: string;
  scheduled_at: string;
  duration_min?: number | null;
  agenda?: string | null;
  location?: string | null;
  meeting_url?: string | null;
  status?: string | null;
  version?: number | null;
  updated_at?: string | null;
}

function toGoogleDateString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function sanitizeCalendarUrl(rawUrl?: string | null): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed.startsWith('https://')) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
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
  const safeMeetingUrl = sanitizeCalendarUrl(meeting.meeting_url);

  const details = [
    meeting.agenda ?? 'Encontro do clube de leitura DIYSPUR.',
    safeMeetingUrl ? `Link da transmissão: ${safeMeetingUrl}` : null,
    'Horário de Brasília (America/Sao_Paulo).',
  ]
    .filter(Boolean)
    .join('\n\n');

  const location = safeMeetingUrl || meeting.location || 'Online (DIYSPUR)';

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
  const safeMeetingUrl = sanitizeCalendarUrl(meeting.meeting_url);

  return {
    '@type': 'Event',
    name: meeting.title,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    eventAttendanceMode: meeting.location && !safeMeetingUrl
      ? 'https://schema.org/OfflineEventAttendanceMode'
      : safeMeetingUrl && meeting.location
        ? 'https://schema.org/MixedEventAttendanceMode'
        : 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus:
      meeting.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    description: meeting.agenda ?? 'Encontro do clube de leitura DIYSPUR.',
    location: {
      '@type': 'VirtualLocation',
      url: safeMeetingUrl ?? 'https://diyspur.vercel.app/calendario',
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

/**
 * Dobra linhas longas de acordo com o RFC 5545 (max 75 octetos por linha física).
 */
export function foldIcsLine(line: string): string {
  const MAX_LEN = 75;
  if (Buffer.byteLength(line, 'utf-8') <= MAX_LEN) return line;

  const result: string[] = [];
  let current = '';
  for (const char of line) {
    const candidate = current + char;
    if (Buffer.byteLength(candidate, 'utf-8') > MAX_LEN) {
      result.push(current);
      current = ' ' + char;
    } else {
      current = candidate;
    }
  }
  if (current) result.push(current);
  return result.join('\r\n');
}
