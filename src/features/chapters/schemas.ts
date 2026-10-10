import { z } from 'zod';

export const commentSchema = z.object({
  chapterId: z.string().uuid(),
  content: z.string().trim().min(1, 'Escreva um comentário.').max(4000, 'O comentário deve ter até 4.000 caracteres.'),
  isSpoiler: z.boolean(),
  minPercent: z.coerce.number().int().min(0).max(100).optional(),
});

export const progressSchema = z.object({
  chapterId: z.string().uuid(),
  status: z.enum(['reading', 'read']),
  percent: z.coerce.number().int().min(0).max(100).optional(),
});

export type ChapterActionResult = { ok: true; message?: string } | { ok: false; message: string };
