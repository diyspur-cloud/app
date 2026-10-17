import { z } from 'zod';

export const groupEntryContextSchema = z.object({
  livro: z.string().uuid(),
  capitulo: z.string().uuid().optional(),
}).strict();

export function groupEntryHref(input: {
  bookId: string;
  chapterId?: string;
  create?: boolean;
}) {
  const parsed = groupEntryContextSchema.parse({
    livro: input.bookId,
    capitulo: input.chapterId,
  });
  const params = new URLSearchParams({ livro: parsed.livro });
  if (parsed.capitulo) params.set('capitulo', parsed.capitulo);
  return `${input.create ? '/clubes/novo' : '/clubes'}?${params.toString()}`;
}
