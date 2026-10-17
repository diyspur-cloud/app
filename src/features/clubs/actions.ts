'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { mapDatabaseError } from '@/lib/actions/database-errors';
import { isReadOnlyPreview, READ_ONLY_PREVIEW_MESSAGE } from '@/lib/actions/read-only';
import { requireSession } from '@/lib/auth/session';
import { clubIdSchema, updateClubSchema } from './schemas';

type Result =
  | { ok: true; message: string; data?: { id?: string; version?: number } }
  | { ok: false; message: string; code?: string };

export async function createClub(): Promise<Result> {
  return {
    ok: false,
    message: 'A criação de clubes avulsos foi descontinuada. Todo clube no DIYSPUR é vinculado oficialmente a um livro através do catálogo.',
    code: 'deprecated',
  };
}

export async function joinClub(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = clubIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Clube inválido.', code: 'validation' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para participar.', code: 'unauthenticated' };

  const { error } = await session.client.rpc('join_user_club', { p_club: parsed.data.clubId });
  if (error) return { ok: false, ...mapDatabaseError(error.code, error.message) };
  revalidatePath('/clubes');
  revalidatePath(`/clubes/${parsed.data.clubId}`);
  return { ok: true, message: 'Você entrou no clube.' };
}

export async function leaveClub(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = clubIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Clube inválido.', code: 'validation' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para sair.', code: 'unauthenticated' };

  const { error } = await session.client.rpc('leave_user_club', { p_club: parsed.data.clubId });
  if (error) return { ok: false, ...mapDatabaseError(error.code, error.message) };
  revalidatePath('/clubes');
  revalidatePath(`/clubes/${parsed.data.clubId}`);
  return { ok: true, message: 'Você saiu do clube.' };
}

export async function updateClub(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = updateClubSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Revise os campos.', code: 'validation' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para editar.', code: 'unauthenticated' };

  const { data, error } = await session.client.rpc('update_user_club', {
    p_club: parsed.data.clubId,
    p_version: parsed.data.version,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_private: parsed.data.isPrivate,
    p_season_id: parsed.data.seasonId ?? null,
  });
  if (error) return { ok: false, ...mapDatabaseError(error.code, error.message) };
  revalidatePath('/clubes');
  revalidatePath(`/clubes/${parsed.data.slug}`);
  revalidatePath(`/clubes/${parsed.data.slug}/configuracoes`);
  return { ok: true, message: 'Clube atualizado.', data: { version: data } };
}

const invitationSchema = z
  .object({
    clubId: z.string().uuid(),
    invitedUserId: z.string().uuid(),
    expiresAt: z.string().datetime(),
  })
  .strict();

export async function inviteUser(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = invitationSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      message: 'Informe um usuário válido e uma data de expiração.',
      code: 'validation',
    };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para convidar.', code: 'unauthenticated' };

  const { error } = await session.client.rpc('invite_user_to_club', {
    p_club: parsed.data.clubId,
    p_invited_user: parsed.data.invitedUserId,
    p_expires_at: parsed.data.expiresAt,
  });
  if (error) return { ok: false, ...mapDatabaseError(error.code, error.message) };
  revalidatePath('/clubes');
  return { ok: true, message: 'Convite criado.' };
}

export async function inviteByUsername(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = z
    .object({
      clubId: z.string().uuid(),
      username: z
        .string()
        .trim()
        .transform((v) => v.replace(/^@/, '').toLowerCase())
        .pipe(z.string().regex(/^[a-z0-9_]{3,24}$/)),
    })
    .strict()
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Informe um nome de usuário válido (@leitor).' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para convidar leitores.' };
  const { data: reader, error } = await session.client
    .from('v_profiles_public')
    .select('id')
    .eq('username', parsed.data.username)
    .maybeSingle();

  if (error || !reader?.id) return { ok: false, message: 'Não foi possível localizar esse leitor.' };

  return inviteUser({
    clubId: parsed.data.clubId,
    invitedUserId: reader.id,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
}

export async function revokeInvitation(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = z.object({ invitationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Convite inválido.', code: 'validation' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para revogar.', code: 'unauthenticated' };

  const { data, error } = await session.client.rpc('revoke_club_invitation', {
    p_invitation: parsed.data.invitationId,
  });
  if (error || data !== true) return { ok: false, message: 'Não foi possível revogar o convite.' };
  revalidatePath('/clubes');
  return { ok: true, message: 'Convite revogado.' };
}

export async function acceptInvitation(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = z.object({ invitationId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Convite inválido.', code: 'validation' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para aceitar.', code: 'unauthenticated' };

  const { data, error } = await session.client.rpc('accept_club_invitation', {
    p_invitation: parsed.data.invitationId,
  });
  if (error || data !== true) return { ok: false, message: 'Não foi possível aceitar o convite.' };
  revalidatePath('/clubes');
  revalidatePath('/notificacoes');
  return { ok: true, message: 'Convite aceito.' };
}

export async function removeMember(input: unknown): Promise<Result> {
  if (isReadOnlyPreview()) return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  const parsed = z
    .object({ clubId: z.string().uuid(), memberId: z.string().uuid() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Membro inválido.', code: 'validation' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para administrar.', code: 'unauthenticated' };

  const { data, error } = await session.client.rpc('remove_club_member', {
    p_club: parsed.data.clubId,
    p_member: parsed.data.memberId,
  });
  if (error || data !== true) return { ok: false, message: 'Não foi possível remover o membro.' };
  revalidatePath('/clubes');
  return { ok: true, message: 'Membro removido.' };
}
