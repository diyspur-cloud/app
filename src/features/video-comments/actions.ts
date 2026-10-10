'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/clients';
import { createTimedCommentSchema, type TimedCommentActionResult } from './schemas';

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;

type AuthenticatedContext = {
  supabase: ServerSupabase;
  userId: string;
};

async function authenticatedContext(): Promise<AuthenticatedContext | null> {
  const supabase = await createServerSupabase();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  // The id used for INSERT comes only from verified claims, never from input.
  if (sessionError || claimsError || !sessionData.session || typeof userId !== 'string' || sessionData.session.user.id !== userId) {
    return null;
  }

  return { supabase, userId };
}

async function chapterIsAccessible(supabase: ServerSupabase, chapterId: string): Promise<boolean> {
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('id,season_id,published_at')
    .eq('id', chapterId)
    .maybeSingle();

  if (chapterError || !chapter || (chapter.published_at && Date.parse(chapter.published_at) > Date.now())) return false;

  const { data: season, error: seasonError } = await supabase
    .from('seasons')
    .select('status')
    .eq('id', chapter.season_id)
    .maybeSingle();

  return !seasonError && Boolean(season && ['active', 'finished'].includes(season.status));
}

export async function createTimedComment(input: unknown): Promise<TimedCommentActionResult> {
  if (process.env.DIYSPUR_READ_ONLY_PREVIEW === '1') return { ok: false, message: 'A prévia pública está em modo somente leitura.' };
  const parsed = createTimedCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Confira os dados do comentário.' };
  }

  const auth = await authenticatedContext();
  if (!auth) return { ok: false, message: 'Entre na sua conta para comentar no vídeo.' };

  const { chapterId, videoSec, content, isSpoiler, minPercent } = parsed.data;
  if (!await chapterIsAccessible(auth.supabase, chapterId)) {
    return { ok: false, message: 'Este capítulo ainda não está disponível para comentários.' };
  }

  const { error } = await auth.supabase.from('video_timed_comments').insert({
    chapter_id: chapterId,
    user_id: auth.userId,
    video_sec: videoSec,
    content,
    is_spoiler: isSpoiler,
    min_percent: isSpoiler ? minPercent : 0,
  });

  if (error) {
    console.error('Timed comment write failed', error.code);
    return { ok: false, message: error.code === '42501' ? 'Sua sessão não permite publicar este comentário.' : 'Não foi possível publicar agora. Tente novamente.' };
  }

  revalidatePath(`/capitulos/${chapterId}`);
  return { ok: true };
}

export const createVideoTimedComment = createTimedComment;
