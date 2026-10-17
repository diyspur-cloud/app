import { describe, expect, it } from 'vitest';
import {
  acceptChannelSpoilersSchema,
  createTopicChannelSchema,
  sendClubMessageSchema,
  setChannelPreferenceSchema,
} from '@/features/discussions/schemas';

describe('Discussion Schemas Validation (SDD 12.2 & 12.3)', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const clientMsgId = '987fcdeb-51a2-43f7-9876-543210987654';

  describe('sendClubMessageSchema', () => {
    it('accepts valid message with client_message_id', () => {
      const parsed = sendClubMessageSchema.safeParse({
        channelId: validUUID,
        content: 'Olá a todos! Adorei o desfecho deste capítulo.',
        clientMessageId: clientMsgId,
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects empty or whitespace-only messages', () => {
      const parsed = sendClubMessageSchema.safeParse({
        channelId: validUUID,
        content: '   \n\t  ',
        clientMessageId: clientMsgId,
      });

      expect(parsed.success).toBe(false);
    });

    it('rejects messages longer than 4000 characters', () => {
      const parsed = sendClubMessageSchema.safeParse({
        channelId: validUUID,
        content: 'A'.repeat(4001),
        clientMessageId: clientMsgId,
      });

      expect(parsed.success).toBe(false);
    });

    it('accepts valid replyToId and videoSec', () => {
      const parsed = sendClubMessageSchema.safeParse({
        channelId: validUUID,
        content: 'Respondendo ao seu ponto',
        clientMessageId: clientMsgId,
        replyToId: validUUID,
        videoSec: 145,
      });

      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.videoSec).toBe(145);
      }
    });
  });

  describe('acceptChannelSpoilersSchema', () => {
    it('accepts valid consent input', () => {
      const parsed = acceptChannelSpoilersSchema.safeParse({
        channelId: validUUID,
        rulesVersion: 1,
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects negative or zero rulesVersion', () => {
      const parsed = acceptChannelSpoilersSchema.safeParse({
        channelId: validUUID,
        rulesVersion: 0,
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('setChannelPreferenceSchema', () => {
    it('accepts valid preference modes', () => {
      for (const mode of ['muted', 'mentions', 'following'] as const) {
        const parsed = setChannelPreferenceSchema.safeParse({
          channelId: validUUID,
          mode,
        });
        expect(parsed.success).toBe(true);
      }
    });

    it('rejects invalid preference mode', () => {
      const parsed = setChannelPreferenceSchema.safeParse({
        channelId: validUUID,
        mode: 'always_ring',
      });

      expect(parsed.success).toBe(false);
    });
  });

  describe('createTopicChannelSchema', () => {
    it('accepts valid topic channel', () => {
      const parsed = createTopicChannelSchema.safeParse({
        clubId: validUUID,
        slug: 'teorias-finais',
        name: 'Teorias Finais e Pontas Soltas',
        spoilerPolicy: 'whole_book',
        requestId: validUUID,
      });

      expect(parsed.success).toBe(true);
    });

    it('rejects slug with invalid characters', () => {
      const parsed = createTopicChannelSchema.safeParse({
        clubId: validUUID,
        slug: 'teorias FINAIS!',
        name: 'Teorias Finais',
        spoilerPolicy: 'none',
        requestId: validUUID,
      });

      expect(parsed.success).toBe(false);
    });
  });
});
