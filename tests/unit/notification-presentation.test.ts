import { describe, expect, it } from 'vitest';
import { presentNotification } from '@/features/notifications/presentation';

describe('Notification Presentation Logic (SDD 10 & 12.1)', () => {
  it('formats mention notifications with safe links and custom payload title', () => {
    const presented = presentNotification({
      id: 'n-1',
      kind: 'mention',
      read_at: null,
      created_at: '2026-10-17T12:00:00Z',
      payload: {
        title: 'Ana mencionou você em #capitulo-1',
        club_name: 'Ficção',
        channel_name: 'capitulo-1',
        href: '/clubes/ficcao/canais/capitulo-1#msg-m-99',
      },
    });

    expect(presented.kind).toBe('mention');
    expect(presented.title).toBe('Ana mencionou você em #capitulo-1');
    expect(presented.unread).toBe(true);
    expect(presented.href).toBe('/clubes/ficcao/canais/capitulo-1#msg-m-99');
  });

  it('formats badge_unlocked notifications', () => {
    const presented = presentNotification({
      id: 'n-2',
      kind: 'badge_unlocked',
      read_at: '2026-10-17T12:05:00Z',
      created_at: '2026-10-17T12:00:00Z',
      payload: {
        title: 'Conquista desbloqueada: Primeiro Debate',
        body: 'Participou do primeiro debate no canal',
        href: '/perfil',
      },
    });

    expect(presented.kind).toBe('badge_unlocked');
    expect(presented.title).toBe('Conquista desbloqueada: Primeiro Debate');
    expect(presented.description).toBe('Participou do primeiro debate no canal');
    expect(presented.unread).toBe(false);
    expect(presented.href).toBe('/perfil');
  });

  it('formats meeting_updated and meeting_cancelled notifications', () => {
    const updated = presentNotification({
      id: 'n-3',
      kind: 'meeting_updated',
      read_at: null,
      created_at: '2026-10-17T12:00:00Z',
      payload: {
        title: 'Encontro atualizado: Debate Capítulo 3',
        href: '/eventos/meet-1',
      },
    });

    expect(updated.title).toBe('Encontro atualizado: Debate Capítulo 3');
    expect(updated.href).toBe('/eventos/meet-1');

    const cancelled = presentNotification({
      id: 'n-4',
      kind: 'meeting_cancelled',
      read_at: null,
      created_at: '2026-10-17T12:00:00Z',
      payload: {
        title: 'Encontro cancelado: Debate Capítulo 3',
        href: '/eventos/meet-1',
      },
    });

    expect(cancelled.title).toBe('Encontro cancelado: Debate Capítulo 3');
    expect(cancelled.href).toBe('/eventos/meet-1');
  });

  it('formats club_invitation notifications', () => {
    const invited = presentNotification({
      id: 'n-5',
      kind: 'club_invitation',
      read_at: null,
      created_at: '2026-10-17T12:00:00Z',
      payload: {
        title: 'Você foi convidado(a) para o clube Ficção Hardcore',
        club_name: 'Ficção Hardcore',
        href: '/clubes/ficcao-hard',
      },
    });

    expect(invited.title).toBe('Você foi convidado(a) para o clube Ficção Hardcore');
    expect(invited.href).toBe('/clubes/ficcao-hard');
  });

  it('handles empty or missing payload gracefully with safe fallback', () => {
    const fallback = presentNotification({
      id: 'n-6',
      kind: 'mention',
      read_at: '2026-10-17T12:05:00Z',
      created_at: '2026-10-17T12:00:00Z',
      payload: null,
    });

    expect(fallback.title).toBe('Você foi mencionado(a) em uma conversa');
    expect(fallback.href).toBe('/notificacoes');
  });
});
