'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/session';
import { mapDatabaseError } from '@/lib/actions/database-errors';
import { createServerSupabase } from '@/lib/supabase/clients';

import { isReadOnlyPreview } from '@/lib/actions/read-only';

const uuid = z.string().uuid();
const bookSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1).max(200),
  synopsis: z.string().trim().max(20000),
  coverUrl: z.string().url().refine((v) => v.startsWith('https://'), 'URL da capa deve usar HTTPS.').or(z.literal('')),
  totalPages: z.coerce.number().int().nonnegative().nullable(),
}).strict();

const seasonSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(20000),
  status: z.enum(['planned', 'enrolling', 'active', 'finished']),
}).strict();

const chapterSchema = z.object({
  id: uuid,
  title: z.string().trim().min(1).max(200),
  readingRange: z.string().trim().max(500),
  summary: z.string().trim().max(20000),
  youtubeUrl: z.string().url().or(z.literal('')),
  publishedAt: z.string().datetime().nullable(),
  isDraft: z.boolean().optional(),
}).strict();

const meetingSchema = z.object({
  id: uuid,
  status: z.enum(['scheduled', 'live', 'done', 'cancelled']),
}).strict();

const pollSchema = z.object({
  id: uuid,
  status: z.enum(['open', 'closed']),
}).strict();

export type AdminResult = { ok: true; message: string } | { ok: false; message: string; code?: string };

async function adminContext() {
  if (isReadOnlyPreview()) return null;
  const session = await requireSession();
  if (!session) return null;
  const { data, error } = await session.client.rpc('is_admin');
  return !error && data === true ? session : null;
}

async function audit(
  client: Awaited<ReturnType<typeof createServerSupabase>>,
  actorId: string,
  entityType: string,
  entityId: string,
  action: string,
  changes: Record<string, unknown>,
) {
  const { error } = await client.from('editorial_audit_log').insert({ actor_id: actorId, entity_type: entityType, entity_id: entityId, action, changes });
  if (error) console.error('Editorial audit log write failed', entityType, action, error.code);
}

const createBookSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(200),
  authorId: uuid,
  synopsis: z.string().trim().max(20000),
  coverUrl: z.string().url().refine((v) => v.startsWith('https://')).or(z.literal('')),
  totalPages: z.coerce.number().int().positive().nullable(),
}).strict();

export async function createBook(input: unknown): Promise<AdminResult> {
  const parsed = createBookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Confira os dados do livro.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { title, slug, authorId, synopsis, coverUrl, totalPages } = parsed.data;

  const { error } = await session.client.rpc('create_editorial_book', {
    p_title: title,
    p_slug: slug,
    p_author: authorId,
    p_synopsis: synopsis || null,
    p_cover: coverUrl || null,
    p_pages: totalPages,
  });

  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/admin/books');
  revalidatePath('/livros');
  return { ok: true, message: 'Livro cadastrado com sucesso.' };
}

export async function updateBook(input: unknown): Promise<AdminResult> {
  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Confira os dados do livro.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { id, title, synopsis, coverUrl, totalPages } = parsed.data;

  const { data: saved, error } = await session.client
    .from('books')
    .update({ title, synopsis: synopsis || null, cover_url: coverUrl || null, total_pages: totalPages })
    .eq('id', id)
    .select('id,slug')
    .maybeSingle();

  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  if (!saved) return { ok: false, code: 'not_found', message: 'O livro não foi encontrado.' };

  await audit(session.client, session.userId, 'book', id, 'update', { title, synopsis, cover_url: coverUrl || null, total_pages: totalPages });
  revalidatePath('/admin/books');
  revalidatePath('/livros');
  revalidatePath(`/livros/${saved.slug}`);
  return { ok: true, message: 'Livro salvo.' };
}

export async function updateSeason(input: unknown): Promise<AdminResult> {
  const parsed = seasonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Confira os dados da temporada.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { id, title, description, status } = parsed.data;
  const { error } = await session.client.from('seasons').update({ title, description: description || null, status }).eq('id', id);
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  await audit(session.client, session.userId, 'season', id, 'update', { title, description, status });
  revalidatePath(`/admin/seasons/${id}`);
  revalidatePath('/temporadas');
  return { ok: true, message: 'Temporada salva.' };
}

export async function updateChapter(input: unknown): Promise<AdminResult> {
  const parsed = chapterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Confira os dados do capítulo.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { id, title, readingRange, summary, youtubeUrl, publishedAt, isDraft } = parsed.data;

  const shouldPublish = !isDraft && Boolean(publishedAt);

  if (shouldPublish) {
    if (!youtubeUrl || !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(youtubeUrl)) {
      return { ok: false, message: 'Adicione um replay válido do YouTube antes de publicar.', code: 'validation' };
    }
    const { data: questions, error: questionsError } = await session.client
      .from('quiz_questions')
      .select('options,correct_idx,chapter_reference')
      .eq('chapter_id', id);

    if (questionsError) {
      return { ok: false, message: 'Não foi possível verificar as perguntas antes da publicação.', code: 'unavailable' };
    }

    if (!questions || questions.length !== 5) {
      return {
        ok: false,
        message: 'Publique exatamente cinco perguntas revisadas para este capítulo.',
        code: 'validation',
      };
    }

    if (
      questions.some(
        (question) =>
          !Array.isArray(question.options) ||
          question.options.length < 2 ||
          typeof question.correct_idx !== 'number' ||
          question.correct_idx < 0 ||
          question.correct_idx >= question.options.length ||
          !question.chapter_reference,
      )
    ) {
      return { ok: false, message: 'Revise as perguntas e a referência de leitura antes de publicar.', code: 'validation' };
    }
  }

  const effectiveDraft = isDraft ?? !publishedAt;

  const { error } = await session.client
    .from('chapters')
    .update({
      title,
      reading_range: readingRange || null,
      summary: summary || null,
      youtube_url: youtubeUrl || null,
      published_at: publishedAt,
      is_draft: effectiveDraft,
    })
    .eq('id', id);

  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  await audit(session.client, session.userId, 'chapter', id, shouldPublish ? 'publish_or_schedule' : 'save_draft', {
    title,
    published_at: publishedAt,
    is_draft: effectiveDraft,
  });
  revalidatePath(`/capitulos/${id}`);
  revalidatePath('/admin');
  return { ok: true, message: shouldPublish ? 'Capítulo publicado/agendado.' : 'Rascunho salvo.' };
}

export async function updateMeeting(input: unknown): Promise<AdminResult> {
  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Estado de encontro inválido.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { error } = await session.client.from('meetings').update({ status: parsed.data.status }).eq('id', parsed.data.id);
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  await audit(session.client, session.userId, 'meeting', parsed.data.id, 'status_change', { status: parsed.data.status });
  revalidatePath('/calendario');
  return { ok: true, message: 'Encontro atualizado.' };
}

export async function updatePoll(input: unknown): Promise<AdminResult> {
  const parsed = pollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Estado de votação inválido.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { error } = await session.client.from('book_polls').update({ status: parsed.data.status }).eq('id', parsed.data.id);
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  await audit(session.client, session.userId, 'poll', parsed.data.id, 'status_change', { status: parsed.data.status });
  revalidatePath('/votacao');
  return { ok: true, message: 'Votação atualizada.' };
}

export async function reviewReport(input: unknown): Promise<AdminResult> {
  const parsed = z.object({ id: uuid, status: z.enum(['resolved', 'dismissed']) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Revisão inválida.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { error } = await session.client.rpc('review_content_report', { p_report: parsed.data.id, p_status: parsed.data.status });
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/admin/moderation');
  return { ok: true, message: 'Denúncia revisada.' };
}

export async function hideReportedContent(input: unknown): Promise<AdminResult> {
  const parsed = z.object({ id: uuid }).safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Denúncia inválida.', code: 'validation' };
  const session = await adminContext();
  if (!session) return { ok: false, message: 'Acesso restrito à equipe editorial.', code: 'forbidden' };
  const { data, error } = await session.client.rpc('hide_reported_content', { p_report: parsed.data.id });
  if (error || data !== true) return { ok: false, ...mapDatabaseError(error?.code) };
  revalidatePath('/admin/moderation');
  return { ok: true, message: 'Conteúdo ocultado e denúncia resolvida.' };
}
