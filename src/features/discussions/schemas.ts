import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ensureOfficialBookGroupSchema = z.object({
  bookId: z.string().regex(UUID_REGEX, 'Livro inválido.'),
});

export const ensureChapterDiscussionSchema = z.object({
  chapterId: z.string().regex(UUID_REGEX, 'Capítulo inválido.'),
  videoSec: z.number().int().min(0).max(86400).nullable().optional(),
});

export const sendClubMessageSchema = z.object({
  channelId: z.string().regex(UUID_REGEX, 'Canal inválido.'),
  clientMessageId: z.string().regex(UUID_REGEX, 'Identificador de mensagem inválido.'),
  content: z
    .string()
    .trim()
    .min(1, 'Escreva uma mensagem antes de enviar.')
    .max(4000, 'A mensagem deve ter no máximo 4000 caracteres.'),
  replyToId: z.string().regex(UUID_REGEX, 'Resposta inválida.').nullable().optional(),
  videoSec: z.number().int().min(0).max(86400).nullable().optional(),
});

export const editClubMessageSchema = z.object({
  messageId: z.string().regex(UUID_REGEX, 'Mensagem inválida.'),
  version: z.number().int().min(1),
  content: z
    .string()
    .trim()
    .min(1, 'A mensagem não pode ficar vazia.')
    .max(4000, 'A mensagem deve ter no máximo 4000 caracteres.'),
});

export const deleteClubMessageSchema = z.object({
  messageId: z.string().regex(UUID_REGEX, 'Mensagem inválida.'),
  version: z.number().int().min(1),
});

export const acceptChannelSpoilersSchema = z.object({
  channelId: z.string().regex(UUID_REGEX, 'Canal inválido.'),
  rulesVersion: z.number().int().min(1),
});

export const revokeChannelSpoilersSchema = z.object({
  channelId: z.string().regex(UUID_REGEX, 'Canal inválido.'),
});

export const setChannelPreferenceSchema = z.object({
  channelId: z.string().regex(UUID_REGEX, 'Canal inválido.'),
  mode: z.enum(['muted', 'mentions', 'following']),
});

export const createTopicChannelSchema = z.object({
  clubId: z.string().regex(UUID_REGEX, 'Clube inválido.'),
  name: z
    .string()
    .trim()
    .min(2, 'O nome do canal deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome do canal deve ter no máximo 80 caracteres.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/,
      'Use apenas letras minúsculas, números e hífens (3 a 64 caracteres).',
    ),
  spoilerPolicy: z.enum(['none', 'whole_book']),
  requestId: z.string().regex(UUID_REGEX, 'Identificador de requisição inválido.'),
});

export const blockCommunityUserSchema = z.object({
  targetUserId: z.string().regex(UUID_REGEX, 'Usuário inválido.'),
});

export const applyClubSanctionSchema = z.object({
  clubId: z.string().regex(UUID_REGEX, 'Clube inválido.'),
  userId: z.string().regex(UUID_REGEX, 'Usuário inválido.'),
  kind: z.enum(['mute', 'ban']),
  reason: z.string().trim().min(3, 'Informe um motivo (mínimo 3 caracteres).').max(500),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export const setClubMemberRoleSchema = z.object({
  clubId: z.string().regex(UUID_REGEX, 'Clube inválido.'),
  memberId: z.string().regex(UUID_REGEX, 'Membro inválido.'),
  role: z.enum(['moderator', 'member']),
});
