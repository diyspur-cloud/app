const ALLOWED_INTERNAL_PREFIXES = [
  '/livros',
  '/temporadas',
  '/capitulos',
  '/clubes',
  '/comunidade',
  '/calendario',
  '/eventos',
  '/ranking',
  '/perfil',
  '/historico',
  '/notificacoes',
  '/estante',
  '/listas',
  '/diario',
  '/leituras-conjuntas',
  '/desafios',
  '/newsletter',
] as const;

export function sanitizeInternalHref(href: unknown, fallback = '/notificacoes'): string {
  if (typeof href !== 'string') return fallback;
  const trimmed = href.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }
  const hasControlChars = /[\u0000-\u001F\u007F]/.test(trimmed);
  if (hasControlChars) return fallback;
  const pathPart = trimmed.split(/[?#]/)[0] ?? '';
  const isAllowed =
    pathPart === '/' ||
    ALLOWED_INTERNAL_PREFIXES.some(
      (prefix) => pathPart === prefix || pathPart.startsWith(`${prefix}/`),
    );
  return isAllowed ? trimmed : fallback;
}

export function buildClubHref(slug: string): string {
  return `/clubes/${encodeURIComponent(slug)}`;
}

export function buildClubSettingsHref(slug: string): string {
  return `/clubes/${encodeURIComponent(slug)}/configuracoes`;
}

export function buildClubNewEventHref(slug: string): string {
  return `/clubes/${encodeURIComponent(slug)}/eventos/novo`;
}

export function buildEventHref(eventId: string): string {
  return `/eventos/${encodeURIComponent(eventId)}`;
}

export function buildClubChannelHref(params: {
  clubSlug: string;
  channelSlug: string;
  replyToId?: string | null;
  messageId?: string | null;
  videoSec?: number | null;
}): string {
  const base = `/clubes/${encodeURIComponent(params.clubSlug)}/canais/${encodeURIComponent(params.channelSlug)}`;
  const search = new URLSearchParams();
  if (params.replyToId) {
    search.set('replyTo', params.replyToId);
  }
  if (params.messageId) {
    search.set('msg', params.messageId);
  }
  if (typeof params.videoSec === 'number' && Number.isFinite(params.videoSec) && params.videoSec >= 0) {
    search.set('videoSec', String(Math.floor(params.videoSec)));
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export function buildChapterVideoHref(chapterId: string, videoSec?: number | null): string {
  const base = `/capitulos/${encodeURIComponent(chapterId)}`;
  if (typeof videoSec === 'number' && Number.isFinite(videoSec) && videoSec >= 0) {
    return `${base}?t=${Math.floor(videoSec)}`;
  }
  return base;
}

export function formatVideoTimestamp(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
