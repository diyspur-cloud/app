import { createServerSupabase } from '@/lib/supabase/clients';

export type Book = {
  id: string; title: string; slug: string; author_id: string; cover_url: string | null;
  synopsis: string | null; total_chapters: number | null; total_pages: number | null;
  publication_year: number | null; tags: string[] | null; amazon_url: string | null;
  authors?: { name: string } | null;
};
export type Season = { id: string; number: number; title: string; slug: string; book_id: string; status: string; description: string | null; starts_at: string | null; ends_at: string | null; cover_url: string | null };
export type Chapter = { id: string; season_id: string; number: number; title: string; reading_range: string | null; youtube_url: string | null; summary: string | null; published_at: string | null };
export type Meeting = { id: string; chapter_id: string; title: string; status: string; scheduled_at: string; duration_min: number | null; meeting_url: string | null; agenda: string | null };

export async function getBooks(search?: string): Promise<Book[]> {
  const client = await createServerSupabase();
  let query = client.from('books').select('id,title,slug,author_id,cover_url,synopsis,total_chapters,total_pages,publication_year,tags,amazon_url').order('created_at', { ascending: false }).limit(36);
  const term = search?.trim().replace(/[%,()]/g, '');
  if (term) query = query.ilike('title', `%${term}%`);
  const { data, error } = await query;
  if (error) { console.error('Catalog query failed', error.code); return []; }
  const books = (data ?? []) as Book[];
  if (!books.length) return [];
  const authors = await client.from('authors').select('id,name').in('id', books.map((book) => book.author_id));
  const byId = new Map((authors.data ?? []).map((author) => [author.id, author.name]));
  return books.map((book) => ({ ...book, authors: { name: byId.get(book.author_id) ?? 'Autor(a)' } }));
}

export async function getBook(slug: string) {
  const client = await createServerSupabase();
  const { data, error } = await client.from('books').select('id,title,slug,author_id,cover_url,synopsis,total_chapters,total_pages,publication_year,tags,amazon_url').eq('slug', slug).maybeSingle();
  if (error || !data) return null;
  const book = data as Book;
  const [author, seasons] = await Promise.all([
    client.from('authors').select('name').eq('id', book.author_id).maybeSingle(),
    client.from('seasons').select('id,number,title,slug,book_id,status,description,starts_at,ends_at,cover_url').eq('book_id', book.id).order('number', { ascending: true }),
  ]);
  return { ...book, authors: author.data, seasons: (seasons.data ?? []) as Season[] };
}

export async function getSeason(slug: string) {
  const client = await createServerSupabase();
  const { data: season, error } = await client.from('seasons').select('id,number,title,slug,book_id,status,description,starts_at,ends_at,cover_url').eq('slug', slug).maybeSingle();
  if (error || !season) return null;
  const [book, chapters] = await Promise.all([
    client.from('books').select('id,title,slug,cover_url,author_id').eq('id', season.book_id).maybeSingle(),
    client.from('chapters').select('id,season_id,number,title,reading_range,youtube_url,summary,published_at').eq('season_id', season.id).order('number', { ascending: true }),
  ]);
  return { season: season as Season, book: book.data, chapters: (chapters.data ?? []) as Chapter[] };
}

export async function getMeetings(): Promise<Meeting[]> {
  const client = await createServerSupabase();
  const { data, error } = await client.from('meetings').select('id,chapter_id,title,status,scheduled_at,duration_min,meeting_url,agenda').gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(20);
  if (error) { console.error('Meetings query failed', error.code); return []; }
  return (data ?? []) as Meeting[];
}

export async function getChapters(id: string) {
  const client = await createServerSupabase();
  const { data, error } = await client.from('chapters').select('id,season_id,number,title,reading_range,youtube_url,summary,published_at').eq('id', id).maybeSingle();
  if (error || !data) return null;
  const [season, comments] = await Promise.all([
    client.from('seasons').select('id,title,slug,book_id').eq('id', data.season_id).maybeSingle(),
    client.from('v_comments_visible').select('id,chapter_id,user_id,content,is_spoiler,created_at').eq('chapter_id', id).order('created_at').limit(50),
  ]);
  const book = season.data ? await client.from('books').select('id,title,slug,cover_url,author_id').eq('id', season.data.book_id).maybeSingle() : { data: null };
  return { chapter: data as Chapter, season: season.data, book: book.data, comments: comments.data ?? [] };
}
