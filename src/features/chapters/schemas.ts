import { z } from 'zod';

export const progressSchema = z.object({
  chapterId: z.string().uuid(),
  status: z.enum(['reading', 'read']),
  percent: z.coerce.number().int().min(0).max(100).optional(),
});

export const commentSchema = z.object({
  chapterId: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
  isSpoiler: z.boolean().default(false),
  minPercent: z.coerce.number().int().min(0).max(100).optional(),
});

export type ChapterActionResult = { ok: true; message?: string } | { ok: false; message: string };
