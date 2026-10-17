import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const createMeetingSchema = z.object({
  clubId: z.string().regex(UUID_REGEX, 'Clube inválido.'),
  bookId: z.string().regex(UUID_REGEX, 'Livro inválido.'),
  chapterId: z.string().regex(UUID_REGEX, 'Capítulo inválido.').nullable().optional(),
  title: z
    .string()
    .trim()
    .min(3, 'O título do encontro deve ter pelo menos 3 caracteres.')
    .max(120, 'O título do encontro deve ter no máximo 120 caracteres.'),
  kind: z.enum(['online', 'in_person', 'hybrid']).default('online'),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMin: z.coerce.number().int().min(15).max(480).default(60),
  meetingUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida.')
    .startsWith('https://', 'O link do encontro deve usar HTTPS.')
    .max(500)
    .nullable()
    .optional(),
  location: z.string().trim().max(250).nullable().optional(),
  agenda: z.string().trim().max(2000).nullable().optional(),
  spoilerPolicy: z.enum(['none', 'chapter', 'whole_book']).default('none'),
  requestId: z.string().regex(UUID_REGEX, 'Identificador de requisição inválido.'),
});

export const updateMeetingSchema = z.object({
  meetingId: z.string().regex(UUID_REGEX, 'Encontro inválido.'),
  version: z.number().int().min(1),
  chapterId: z.string().regex(UUID_REGEX, 'Capítulo inválido.').nullable().optional(),
  title: z
    .string()
    .trim()
    .min(3, 'O título do encontro deve ter pelo menos 3 caracteres.')
    .max(120, 'O título do encontro deve ter no máximo 120 caracteres.'),
  kind: z.enum(['online', 'in_person', 'hybrid']).default('online'),
  scheduledAt: z.string().datetime({ offset: true }),
  durationMin: z.coerce.number().int().min(15).max(480).default(60),
  meetingUrl: z
    .string()
    .trim()
    .url('Informe uma URL válida.')
    .startsWith('https://', 'O link do encontro deve usar HTTPS.')
    .max(500)
    .nullable()
    .optional(),
  location: z.string().trim().max(250).nullable().optional(),
  agenda: z.string().trim().max(2000).nullable().optional(),
  spoilerPolicy: z.enum(['none', 'chapter', 'whole_book']).default('none'),
});

export const cancelMeetingSchema = z.object({
  meetingId: z.string().regex(UUID_REGEX, 'Encontro inválido.'),
  version: z.number().int().min(1),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type CancelMeetingInput = z.infer<typeof cancelMeetingSchema>;
