'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireSession } from '@/lib/auth/session';
import { mapDatabaseError } from '@/lib/actions/database-errors';
const schema = z.object({ bookId: z.string().uuid(), chapterId: z.string().uuid().nullable(), entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), title: z.string().trim().max(160), body: z.string().trim().min(1).max(20000), pageFrom: z.coerce.number().int().positive().nullable(), pageTo: z.coerce.number().int().positive().nullable(), percentAt: z.coerce.number().min(0).max(100).nullable(), minutesRead: z.coerce.number().int().min(0).max(1440).nullable(), isSpoiler: z.boolean() }).strict();
export async function createJournalEntry(input: unknown) {
  const parsed = schema.safeParse(input); if (!parsed.success) return { ok: false, message: 'Confira o livro, a data e o texto do registro.', code: 'validation' as const };
  if (parsed.data.pageFrom && parsed.data.pageTo && parsed.data.pageTo < parsed.data.pageFrom) return { ok: false, message: 'A página final precisa ser maior ou igual à inicial.', code: 'validation' as const };
  const session = await requireSession(); if (!session) return { ok: false, message: 'Entre para escrever no seu diário.', code: 'unauthenticated' as const };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (session.client as any).from('reading_journal_entries').insert({ user_id: session.userId, book_id: parsed.data.bookId, chapter_id: parsed.data.chapterId, entry_date: parsed.data.entryDate, title: parsed.data.title || null, body: parsed.data.body, page_from: parsed.data.pageFrom, page_to: parsed.data.pageTo, percent_at: parsed.data.percentAt, minutes_read: parsed.data.minutesRead ?? 0, is_spoiler: parsed.data.isSpoiler, visibility: 'private' });
  if (error) return { ok: false, ...mapDatabaseError(error.code) };
  revalidatePath('/diario'); return { ok: true, message: 'Registro salvo no seu diário.' };
}
