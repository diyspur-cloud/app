'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { mapDatabaseError } from '@/lib/actions/database-errors';
import { isReadOnlyPreview, READ_ONLY_PREVIEW_MESSAGE } from '@/lib/actions/read-only';
import { requireSession } from '@/lib/auth/session';
import { sanitizeInternalHref } from '@/lib/community-navigation';

const reportSchema = z
  .object({
    contentType: z.enum(['comment', 'timed_comment', 'journal', 'post', 'club_message']),
    contentId: z.string().uuid(),
    reason: z.string().trim().min(3).max(500),
    path: z.string().startsWith('/'),
  })
  .strict();

const moderateReportSchema = z
  .object({
    reportId: z.string().uuid(),
    action: z.enum(['dismiss', 'resolve', 'hide_content', 'mute_member', 'ban_member']),
    note: z.string().trim().max(500).optional(),
    sanctionExpiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export async function reportContent(input: unknown): Promise<{ ok: boolean; message: string }> {
  if (isReadOnlyPreview()) {
    return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  }
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Explique brevemente o motivo da denúncia.' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para denunciar conteúdo.' };
  const { error } = await session.client.rpc('report_content', {
    p_content_type: parsed.data.contentType,
    p_content_id: parsed.data.contentId,
    p_reason: parsed.data.reason,
  });
  if (error) {
    const mapped = mapDatabaseError(error.code, error.message);
    return { ok: false, message: mapped.message };
  }
  revalidatePath(sanitizeInternalHref(parsed.data.path, '/'));
  return { ok: true, message: 'Denúncia registrada. Obrigado por cuidar da comunidade.' };
}

export async function moderateContentReportAction(
  input: unknown,
): Promise<{ ok: boolean; message: string }> {
  if (isReadOnlyPreview()) {
    return { ok: false, message: READ_ONLY_PREVIEW_MESSAGE };
  }
  const parsed = moderateReportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: 'Ação de moderação inválida.' };
  }
  const session = await requireSession();
  if (!session) {
    return { ok: false, message: 'Entre para moderar conteúdo.' };
  }
  const { error } = await session.client.rpc('moderate_content_report', {
    p_report: parsed.data.reportId,
    p_action: parsed.data.action,
    p_note: parsed.data.note ?? null,
    p_sanction_expires_at: parsed.data.sanctionExpiresAt ?? null,
  });
  if (error) {
    const mapped = mapDatabaseError(error.code, error.message);
    return { ok: false, message: mapped.message };
  }
  revalidatePath('/admin/moderation');
  return { ok: true, message: 'Ação de moderação aplicada.' };
}
