import { describe, expect, it } from 'vitest';
import {
  buildChapterVideoHref,
  buildClubChannelHref,
  buildClubHref,
  buildClubNewEventHref,
  buildClubSettingsHref,
  buildEventHref,
  formatVideoTimestamp,
  sanitizeInternalHref,
} from '@/lib/community-navigation';

describe('Community Navigation Utilities', () => {
  describe('sanitizeInternalHref (Open Redirect & Injection Protection)', () => {
    it('allows valid internal paths', () => {
      expect(sanitizeInternalHref('/clubes/ficcao')).toBe('/clubes/ficcao');
      expect(sanitizeInternalHref('/livros/o-massacre?tab=ranking')).toBe('/livros/o-massacre?tab=ranking');
      expect(sanitizeInternalHref('/eventos/12345')).toBe('/eventos/12345');
    });

    it('rejects external protocol URLs and returns fallback', () => {
      expect(sanitizeInternalHref('https://attacker.com', '/fallback')).toBe('/fallback');
      expect(sanitizeInternalHref('http://malicious.org', '/fallback')).toBe('/fallback');
      expect(sanitizeInternalHref('ftp://evil.com', '/fallback')).toBe('/fallback');
    });

    it('rejects javascript: and data: schemes', () => {
      expect(sanitizeInternalHref('javascript:alert(1)', '/fallback')).toBe('/fallback');
      expect(sanitizeInternalHref('data:text/html,<script>alert(1)</script>', '/fallback')).toBe('/fallback');
    });

    it('rejects protocol-relative URLs (//)', () => {
      expect(sanitizeInternalHref('//attacker.com', '/fallback')).toBe('/fallback');
      expect(sanitizeInternalHref('///attacker.com', '/fallback')).toBe('/fallback');
    });

    it('rejects null, undefined, and non-string inputs', () => {
      expect(sanitizeInternalHref(null, '/fallback')).toBe('/fallback');
      expect(sanitizeInternalHref(undefined, '/fallback')).toBe('/fallback');
      expect(sanitizeInternalHref('', '/fallback')).toBe('/fallback');
    });
  });

  describe('Route builders', () => {
    it('builds club URLs with sanitization', () => {
      expect(buildClubHref('ficcao-cientifica')).toBe('/clubes/ficcao-cientifica');
      expect(buildClubSettingsHref('ficcao-cientifica')).toBe('/clubes/ficcao-cientifica/configuracoes');
      expect(buildClubNewEventHref('ficcao-cientifica')).toBe('/clubes/ficcao-cientifica/eventos/novo');
    });

    it('builds event and channel URLs', () => {
      expect(buildEventHref('m-123')).toBe('/eventos/m-123');
      expect(buildClubChannelHref({ clubSlug: 'ficcao', channelSlug: 'capitulo-1' })).toBe(
        '/clubes/ficcao/canais/capitulo-1',
      );
      expect(buildClubChannelHref({ clubSlug: 'ficcao', channelSlug: 'capitulo-1', messageId: 'msg-456' })).toBe(
        '/clubes/ficcao/canais/capitulo-1?msg=msg-456',
      );
    });

    it('builds chapter video URL with timestamp', () => {
      expect(buildChapterVideoHref('ch-1')).toBe('/capitulos/ch-1');
      expect(buildChapterVideoHref('ch-1', 125)).toBe('/capitulos/ch-1?t=125');
    });

    it('formats video timestamps correctly', () => {
      expect(formatVideoTimestamp(45)).toBe('00:45');
      expect(formatVideoTimestamp(75)).toBe('01:15');
      expect(formatVideoTimestamp(3665)).toBe('1:01:05');
    });
  });
});
