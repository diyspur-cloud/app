import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/clients';
import { escapeIcs, foldIcsLine, sanitizeCalendarUrl } from '@/lib/calendar-links';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ meetingId: string }> },
) {
  const { meetingId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(meetingId)) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const client = await createServerSupabase();
  const { data, error } = await client
    .from('meetings')
    .select('id,title,status,scheduled_at,duration_min,agenda,location,meeting_url,version,updated_at')
    .eq('id', meetingId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const start = new Date(data.scheduled_at);
  if (!Number.isFinite(start.getTime())) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const end = new Date(start.getTime() + (data.duration_min ?? 60) * 60_000);
  const fmt = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const cancelled = data.status === 'cancelled';
  const safeMeetingUrl = sanitizeCalendarUrl(data.meeting_url);
  const locationText = safeMeetingUrl || data.location || 'Online (DIYSPUR)';
  const lastModDate = data.updated_at ? new Date(data.updated_at) : new Date();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DIYSPUR//Reading Club//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${data.id}@diyspur`,
    `DTSTAMP:${fmt(new Date())}`,
    `LAST-MODIFIED:${fmt(lastModDate)}`,
    `SEQUENCE:${data.version ?? (cancelled ? 1 : 0)}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    `SUMMARY:${escapeIcs(data.title)}`,
    `LOCATION:${escapeIcs(locationText)}`,
    ...(safeMeetingUrl ? [`URL:${safeMeetingUrl}`] : []),
    ...(data.agenda ? [`DESCRIPTION:${escapeIcs(data.agenda)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const foldedBody = lines.map(foldIcsLine).join('\r\n') + '\r\n';

  return new Response(foldedBody, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="diyspur-${data.id}.ics"`,
      'cache-control': 'private, no-store',
    },
  });
}
