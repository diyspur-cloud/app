import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const bookReadingStatusSchema = z.enum([
  'want_to_read',
  'reading',
  'read',
  'dnf',
]);

export type BookReadingStatus = z.infer<typeof bookReadingStatusSchema>;

export const setBookReadingSchema = z.object({
  bookId: z.string().regex(UUID_REGEX, 'Livro inválido.'),
  bookSlug: z.string().trim().min(1).max(160).optional(),
  status: bookReadingStatusSchema,
  version: z.number().int().min(0),
  requestId: z.string().regex(UUID_REGEX, 'Identificador de requisição inválido.'),
});

export function isValidReadingStatusTransition(
  currentStatus: BookReadingStatus | null,
  nextStatus: BookReadingStatus,
): boolean {
  if (currentStatus === null || currentStatus === 'want_to_read') {
    return nextStatus === 'want_to_read' || nextStatus === 'reading';
  }
  return true;
}
