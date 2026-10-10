import { z } from 'zod';

/**
 * Input accepted by the server action. The user id is intentionally absent:
 * it is always derived from the verified Supabase claims on the server.
 */
export const createTimedCommentSchema = z.object({
  chapterId: z.string().uuid('O capítulo informado não é válido.'),
  videoSec: z.number().int('O timestamp deve ser um número inteiro.').min(0, 'O timestamp não pode ser negativo.').max(86400, 'O timestamp deve ser de até 24 horas.'),
  content: z.string().trim().min(1, 'Escreva um comentário.').max(2000, 'O comentário deve ter até 2.000 caracteres.'),
  isSpoiler: z.boolean().default(false),
  minPercent: z.number().min(0).max(100).default(100),
}).strict();

/** Backwards-friendly name for callers that refer to the feature as video timed comments. */
export const videoTimedCommentSchema = createTimedCommentSchema;
export const timedCommentSchema = createTimedCommentSchema;

export type CreateTimedCommentInput = z.infer<typeof createTimedCommentSchema>;
export type TimedCommentActionResult = { ok: true } | { ok: false; message: string };
export type VideoTimedCommentActionResult = TimedCommentActionResult;
