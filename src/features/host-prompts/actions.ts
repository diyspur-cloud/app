'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/clients';

const inputSchema = z.object({ promptId: z.string().uuid(), optionIdx: z.number().int().min(0).max(2) }).strict();
export type HostPromptActionResult = { ok: true; message: string } | { ok: false; message: string; requiresAuth?: boolean };

export async function saveHostPromptVote(input: unknown): Promise<HostPromptActionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Escolha uma resposta válida.' };
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (typeof userId !== 'string') return { ok: false, message: 'Entre para responder à pergunta do anfitrião.', requiresAuth: true };
  const { data: prompt, error: promptError } = await client.from('host_prompts').select('id,options,chapter_id').eq('id', parsed.data.promptId).maybeSingle();
  const options = Array.isArray(prompt?.options) ? prompt.options : [];
  if (promptError || !prompt || parsed.data.optionIdx >= options.length) return { ok: false, message: 'Esta pergunta não está mais disponível.' };
  const { error } = await client.from('host_prompt_votes').upsert({ prompt_id: prompt.id, user_id: userId, option_idx: parsed.data.optionIdx }, { onConflict: 'prompt_id,user_id' });
  if (error) {
    console.error('Host prompt vote failed', error.code);
    return { ok: false, message: 'Não foi possível registrar sua resposta agora.' };
  }
  revalidatePath(`/capitulos/${prompt.chapter_id}`);
  return { ok: true, message: 'Resposta registrada. O resultado é agregado e não identifica leitores.' };
}
