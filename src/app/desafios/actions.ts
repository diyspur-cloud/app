'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/clients';

const challengeIdSchema = z.string().uuid();

export type ChallengeActionResult = { ok: true; message: string } | { ok: false; message: string };

export async function joinChallenge(challengeId: string): Promise<ChallengeActionResult> {
  const parsed = challengeIdSchema.safeParse(challengeId);
  if (!parsed.success) return { ok: false, message: 'Desafio inválido.' };
  const client = await createServerSupabase();
  const { data: claims, error: claimsError } = await client.auth.getClaims();
  const userId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;
  if (claimsError || !userId) return { ok: false, message: 'Entre na sua conta para participar.' };

  const { data: challenge, error: challengeError } = await client.from('challenges').select('id').eq('id', parsed.data).maybeSingle();
  if (challengeError || !challenge) return { ok: false, message: 'Este desafio não está disponível.' };

  const { error } = await client.from('user_challenges').upsert(
    { user_id: userId, challenge_id: parsed.data, progress: 0, completed_at: null },
    { onConflict: 'user_id,challenge_id', ignoreDuplicates: true },
  );
  if (error) {
    console.error('Challenge enrollment failed', error.code);
    return { ok: false, message: 'Não foi possível registrar sua inscrição agora.' };
  }
  revalidatePath('/desafios');
  return { ok: true, message: 'Inscrição registrada.' };
}
