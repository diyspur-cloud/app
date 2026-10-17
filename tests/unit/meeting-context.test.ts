import { describe, expect, it } from 'vitest';
import {
  cancelMeetingSchema,
  createMeetingSchema,
  updateMeetingSchema,
} from '@/features/meetings/schemas';

describe('Meeting & Events Validation & Security (SDD 9 & 12.6)', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  describe('createMeetingSchema', () => {
    it('accepts valid online meeting input', () => {
      const parsed = createMeetingSchema.safeParse({
        clubId: validUUID,
        bookId: validUUID,
        title: 'Discussão dos Capítulos 1 a 3',
        kind: 'online',
        scheduledAt: '2026-10-25T20:00:00.000Z',
        durationMin: 90,
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        spoilerPolicy: 'chapter',
        requestId: validUUID,
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects non-HTTPS meeting URL (security requirement)', () => {
      const parsed = createMeetingSchema.safeParse({
        clubId: validUUID,
        bookId: validUUID,
        title: 'Discussão dos Capítulos 1 a 3',
        kind: 'online',
        scheduledAt: '2026-10-25T20:00:00.000Z',
        meetingUrl: 'http://meet.google.com/insecure',
        requestId: validUUID,
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain('HTTPS');
      }
    });

    it('rejects duration outside allowable range (15 to 480 min)', () => {
      const tooShort = createMeetingSchema.safeParse({
        clubId: validUUID,
        bookId: validUUID,
        title: 'Curto demais',
        scheduledAt: '2026-10-25T20:00:00.000Z',
        durationMin: 5,
        requestId: validUUID,
      });
      expect(tooShort.success).toBe(false);

      const tooLong = createMeetingSchema.safeParse({
        clubId: validUUID,
        bookId: validUUID,
        title: 'Longo demais',
        scheduledAt: '2026-10-25T20:00:00.000Z',
        durationMin: 600,
        requestId: validUUID,
      });
      expect(tooLong.success).toBe(false);
    });
  });

  describe('updateMeetingSchema & cancelMeetingSchema', () => {
    it('requires optimistic concurrency version >= 1', () => {
      const validUpdate = updateMeetingSchema.safeParse({
        meetingId: validUUID,
        version: 1,
        title: 'Novo Título do Encontro',
        scheduledAt: '2026-10-25T20:00:00.000Z',
      });
      expect(validUpdate.success).toBe(true);

      const invalidVersion = updateMeetingSchema.safeParse({
        meetingId: validUUID,
        version: 0,
        title: 'Novo Título do Encontro',
        scheduledAt: '2026-10-25T20:00:00.000Z',
      });
      expect(invalidVersion.success).toBe(false);
    });

    it('validates cancellation schema', () => {
      const validCancel = cancelMeetingSchema.safeParse({
        meetingId: validUUID,
        version: 2,
      });
      expect(validCancel.success).toBe(true);
    });
  });
});
