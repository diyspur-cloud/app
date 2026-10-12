'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/session';

const reportSchema = z.object({
  contentType: z.enum(['comment', 'timed_comment', 'journal', 'post']),
  contentId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
  path: z.string().startsWith('/'),
}).strict();

export async function reportContent(input: unknown): Promise<{ ok: boolean; message: string }> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Explique brevemente o motivo da denúncia.' };
  const session = await requireSession();
  if (!session) return { ok: false, message: 'Entre para denunciar conteúdo.' };
  const { error } = await session.client.rpc('report_content', {
    p_content_type: parsed.data.contentType,
    p_content_id: parsed.data.contentId,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, message: 'Não foi possível registrar a denúncia agora.' };
  revalidatePath(parsed.data.path);
  return { ok: true, message: 'Denúncia registrada. Obrigado por cuidar da comunidade.' };
}
