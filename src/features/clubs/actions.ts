'use server';
import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { mapDatabaseError } from '@/lib/actions/database-errors';
import { createClubSchema, updateClubSchema, clubIdSchema } from './schemas';

type Result = { ok: true; message: string; data?: { id?: string; version?: number } } | { ok: false; message: string; code?: string };
export async function createClub(input: unknown): Promise<Result> {
  const parsed = createClubSchema.safeParse(input); if (!parsed.success) return { ok: false, message: 'Revise nome, descrição e privacidade.', code: 'validation' };
  const session = await requireSession(); if (!session) return { ok: false, message: 'Entre para criar um clube.', code: 'unauthenticated' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (session.client as any).rpc('create_user_club', { p_name: parsed.data.name, p_description: parsed.data.description, p_private: parsed.data.isPrivate, p_request_id: parsed.data.requestId });
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/clubes'); return { ok: true, message: 'Clube criado.', data: { id: data } };
}
export async function joinClub(input: unknown): Promise<Result> {
  const parsed = clubIdSchema.safeParse(input); if (!parsed.success) return { ok: false, message: 'Clube inválido.', code: 'validation' };
  const session = await requireSession(); if (!session) return { ok: false, message: 'Entre para participar.', code: 'unauthenticated' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (session.client as any).rpc('join_user_club', { p_club: parsed.data.clubId });
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/clubes'); revalidatePath(`/clubes/${parsed.data.clubId}`); return { ok: true, message: 'Você entrou no clube.' };
}
export async function leaveClub(input: unknown): Promise<Result> {
  const parsed = clubIdSchema.safeParse(input); if (!parsed.success) return { ok: false, message: 'Clube inválido.', code: 'validation' };
  const session = await requireSession(); if (!session) return { ok: false, message: 'Entre para sair.', code: 'unauthenticated' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (session.client as any).rpc('leave_user_club', { p_club: parsed.data.clubId });
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/clubes'); revalidatePath(`/clubes/${parsed.data.clubId}`); return { ok: true, message: 'Você saiu do clube.' };
}
export async function updateClub(input: unknown): Promise<Result> {
  const parsed = updateClubSchema.safeParse(input); if (!parsed.success) return { ok: false, message: 'Revise os campos.', code: 'validation' };
  const session = await requireSession(); if (!session) return { ok: false, message: 'Entre para editar.', code: 'unauthenticated' };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (session.client as any).rpc('update_user_club', { p_club: parsed.data.clubId, p_version: parsed.data.version, p_name: parsed.data.name, p_description: parsed.data.description, p_private: parsed.data.isPrivate });
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/clubes'); revalidatePath(`/clubes/${parsed.data.clubId}`); return { ok: true, message: 'Clube atualizado.', data: { version: data } };
}
