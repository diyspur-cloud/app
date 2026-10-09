import { z } from 'zod';

export const pollVoteInputSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
}).strict();

export type PollVoteInput = z.infer<typeof pollVoteInputSchema>;

export type PollVoteParseResult =
  | { success: true; data: PollVoteInput }
  | { success: false; message: string };

export function parsePollVoteInput(input: unknown): PollVoteParseResult {
  const parsed = pollVoteInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: 'A enquete ou a opção selecionada não é válida.' };
  }
  return { success: true, data: parsed.data };
}
