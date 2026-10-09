'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/clients';
import { parsePollVoteInput } from './schemas';

export type PollActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; requiresAuth?: boolean };

async function getVerifiedSession() {
  const supabase = await createServerSupabase();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || typeof userId !== 'string') return null;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken || sessionData.session?.user.id !== userId) return null;

  return { supabase, accessToken };
}

export async function castPollVote(input: unknown): Promise<PollActionResult> {
  if (process.env.DIYSPUR_READ_ONLY_PREVIEW === '1') return { ok: false, message: 'A prévia pública está em modo somente leitura.' };
  const parsed = parsePollVoteInput(input);
  if (!parsed.success) return { ok: false, message: parsed.message };

  let session: Awaited<ReturnType<typeof getVerifiedSession>>;
  try {
    session = await getVerifiedSession();
  } catch (cause) {
    console.error('Poll session check failed', cause instanceof Error ? cause.name : 'unknown_error');
    return { ok: false, message: 'Entre na sua conta para votar.', requiresAuth: true };
  }

  if (!session) return { ok: false, message: 'Entre na sua conta para votar.', requiresAuth: true };

  try {
    const { error } = await session.supabase.functions.invoke('vote-next-book', {
      body: {
        poll_id: parsed.data.pollId,
        option_id: parsed.data.optionId,
      },
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (error) {
      console.error('Poll vote failed', error.name ?? 'invoke_error');
      return { ok: false, message: 'Não foi possível registrar seu voto agora. Tente novamente.' };
    }
  } catch (cause) {
    console.error('Poll vote unavailable', cause instanceof Error ? cause.name : 'unknown_error');
    return { ok: false, message: 'Não foi possível registrar seu voto agora. Tente novamente.' };
  }

  revalidatePath('/votacao');
  return { ok: true, message: 'Seu voto foi registrado.' };
}
