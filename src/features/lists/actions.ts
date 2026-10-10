'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/clients';

const createSchema = z.object({ title: z.string().trim().min(1, 'Dê um nome para sua lista.').max(80), description: z.string().trim().max(500).optional() }).strict();
const addSchema = z.object({ listId: z.string().uuid(), bookId: z.string().uuid() }).strict();
export type ListActionResult = { ok: true; message: string } | { ok: false; message: string; requiresAuth?: boolean };

async function sessionContext() {
  const client = await createServerSupabase();
  const { data, error } = await client.auth.getClaims();
  const userId = data?.claims?.sub;
  return !error && typeof userId === 'string' ? { client, userId } : null;
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'lista';
}

export async function createReadingList(input: unknown): Promise<ListActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Confira o nome da lista.' };
  const session = await sessionContext();
  if (!session) return { ok: false, message: 'Entre para criar uma lista.', requiresAuth: true };
  const slug = `${slugify(parsed.data.title)}-${crypto.randomUUID().slice(0, 8)}`;
  const { error } = await session.client.from('reading_lists').insert({ owner_id: session.userId, slug, title: parsed.data.title, description: parsed.data.description || null, visibility: 'private', is_collaborative: false });
  if (error) { console.error('List create failed', error.code); return { ok: false, message: 'Não foi possível criar a lista agora.' }; }
  revalidatePath('/listas');
  return { ok: true, message: 'Lista criada.' };
}

export async function addBookToReadingList(input: unknown): Promise<ListActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: 'Livro ou lista inválidos.' };
  const session = await sessionContext();
  if (!session) return { ok: false, message: 'Entre para salvar este livro.', requiresAuth: true };
  const { data: list, error: listError } = await session.client.from('reading_lists').select('id').eq('id', parsed.data.listId).eq('owner_id', session.userId).maybeSingle();
  if (listError || !list) return { ok: false, message: 'Você não pode alterar esta lista.' };
  const { data: existing } = await session.client.from('reading_list_items').select('id').eq('list_id', list.id).eq('book_id', parsed.data.bookId).limit(1);
  if (existing?.length) return { ok: true, message: 'Este livro já está na lista.' };
  const { data: last } = await session.client.from('reading_list_items').select('position').eq('list_id', list.id).order('position', { ascending: false }).limit(1).maybeSingle();
  const { error } = await session.client.from('reading_list_items').insert({ list_id: list.id, book_id: parsed.data.bookId, kind: 'book', added_by: session.userId, position: (last?.position ?? -1) + 1 });
  if (error) { console.error('List item create failed', error.code); return { ok: false, message: 'Não foi possível adicionar o livro agora.' }; }
  revalidatePath('/listas');
  return { ok: true, message: 'Livro adicionado à lista.' };
}
