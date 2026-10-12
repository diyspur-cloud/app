import { describe, expect, it } from 'vitest';
import { escapeIcs, getGoogleCalendarUrl, getMeetingEventSchema } from '../../src/lib/calendar-links';

describe('escapeIcs', () => {
  it('escapa barras invertidas, quebras de linha, vírgulas e pontos-e-vírgula', () => {
    const input = 'Texto com \\ barra, vírgula, e ponto; e vírgula.\nNova linha\r\nSegunda linha';
    const result = escapeIcs(input);

    expect(result).toBe('Texto com \\\\ barra\\, vírgula\\, e ponto\\; e vírgula.\\nNova linha\\nSegunda linha');
  });

  it('remove caracteres de controle ASCII perigosos sem alterar texto normal', () => {
    const input = 'Título\u0000com\u0007caracteres\u001Finvisíveis';
    const result = escapeIcs(input);

    expect(result).toBe('Títulocomcaracteresinvisíveis');
  });
});

describe('getGoogleCalendarUrl', () => {
  it('gera URL correta do Google Calendar com parâmetros formatados', () => {
    const meeting = {
      id: 'm-1',
      title: 'Debate Capítulo 1 — Verity',
      scheduled_at: '2026-10-15T23:00:00.000Z',
      duration_min: 90,
      agenda: 'Discussão sobre as primeiras impressões.',
      meeting_url: 'https://meet.google.com/abc-defg-hij',
    };

    const url = getGoogleCalendarUrl(meeting);
    expect(url).toContain('https://calendar.google.com/calendar/render?');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('text=Debate+Cap%C3%ADtulo+1+%E2%80%94+Verity');
    expect(url).toContain('dates=20261015T230000Z%2F20261016T003000Z');
    expect(url).toContain('location=https%3A%2F%2Fmeet.google.com%2Fabc-defg-hij');
  });

  it('usa duração padrão de 60 minutos se ausente', () => {
    const meeting = {
      id: 'm-2',
      title: 'Encontro Rápido',
      scheduled_at: '2026-10-20T20:00:00.000Z',
    };

    const url = getGoogleCalendarUrl(meeting);
    expect(url).toContain('dates=20261020T200000Z%2F20261020T210000Z');
  });
});

describe('getMeetingEventSchema', () => {
  it('gera estrutura compatível com Schema.org Event', () => {
    const meeting = {
      id: 'm-1',
      title: 'Debate Capítulo 1',
      scheduled_at: '2026-10-15T20:00:00.000Z',
      duration_min: 60,
    };

    const schema = getMeetingEventSchema(meeting);
    expect(schema['@type']).toBe('Event');
    expect(schema.name).toBe('Debate Capítulo 1');
    expect(schema.eventAttendanceMode).toBe('https://schema.org/OnlineEventAttendanceMode');
    expect(schema.organizer.name).toBe('DIYSPUR');
  });
});
