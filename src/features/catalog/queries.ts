import { createServerSupabase } from '@/lib/supabase/clients';

export type Book = {
  id: string; title: string; slug: string; author_id: string; cover_url: string | null;
  isbn13: string | null; language: string | null;
  synopsis: string | null; total_chapters: number | null; total_pages: number | null;
  publication_year: number | null; tags: string[] | null; amazon_url: string | null;
  publisher: string | null; translator: string | null; publication_date: string | null;
  content_rating: string | null; edition_number: number | null; format: string | null;
  width_mm: number | null; height_mm: number | null; depth_mm: number | null;
  authors?: { name: string; bio?: string | null; website_url?: string | null; instagram?: string | null } | null;
};
export type Season = { id: string; number: number; title: string; slug: string; book_id: string; status: string; description: string | null; starts_at: string | null; ends_at: string | null; cover_url: string | null };
export type Chapter = { id: string; season_id: string; number: number; title: string; reading_range: string | null; youtube_url: string | null; summary: string | null; published_at: string | null };
export type Meeting = { id: string; chapter_id: string; title: string; status: string; kind: string; scheduled_at: string; duration_min: number | null; meeting_url: string | null; location: string | null; agenda: string | null };

export async function getBooks(search?: string): Promise<Book[]> {
  const client = await createServerSupabase();
  let query = client.from('books').select('id,title,slug,author_id,cover_url,isbn13,language,synopsis,total_chapters,total_pages,publication_year,tags,amazon_url,publisher,translator,publication_date,content_rating,edition_number,format,width_mm,height_mm,depth_mm').order('created_at', { ascending: false }).limit(36);
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
  const { data, error } = await client.from('books').select('id,title,slug,author_id,cover_url,isbn13,language,synopsis,total_chapters,total_pages,publication_year,tags,amazon_url,publisher,translator,publication_date,content_rating,edition_number,format,width_mm,height_mm,depth_mm').eq('slug', slug).maybeSingle();
  if (error || !data) return null;
  const book = data as Book;
  const [author, seasons] = await Promise.all([
    client.from('authors').select('name,bio,website_url,instagram').eq('id', book.author_id).maybeSingle(),
    client.from('seasons').select('id,number,title,slug,book_id,status,description,starts_at,ends_at,cover_url').eq('book_id', book.id).order('number', { ascending: true }),
  ]);
  return { ...book, authors: author.data, seasons: (seasons.data ?? []) as Season[] };
}

export async function getSeason(slug: string) {
  const client = await createServerSupabase();
  const { data: season, error } = await client.from('seasons').select('id,number,title,slug,book_id,status,description,starts_at,ends_at,cover_url').eq('slug', slug).maybeSingle();
  if (error || !season || !['active', 'finished'].includes(season.status)) return null;
  const [book, chapterResult] = await Promise.all([
    client.from('books').select('id,title,slug,cover_url,author_id').eq('id', season.book_id).maybeSingle(),
    client.from('chapters').select('id,season_id,number,title,reading_range,youtube_url,summary,published_at').eq('season_id', season.id).or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`).order('number', { ascending: true }),
  ]);
  return { season: season as Season, book: book.data, chapters: (chapterResult.data ?? []) as Chapter[] };
}

export async function getMeetings(): Promise<Meeting[]> {
  const client = await createServerSupabase();
  const { data, error } = await client.from('meetings').select('id,chapter_id,title,status,kind,scheduled_at,duration_min,meeting_url,location,agenda').order('scheduled_at').limit(36);
  if (error) { console.error('Meetings query failed', error.code); return []; }
  return (data ?? []) as Meeting[];
}

export async function getChapters(id: string) {
  const client = await createServerSupabase();
  const [{ data: chapter, error }, { data: claims }] = await Promise.all([
    client.from('chapters').select('id,season_id,number,title,reading_range,youtube_url,summary,published_at').eq('id', id).maybeSingle(),
    client.auth.getClaims(),
  ]);
  if (error || !chapter || (chapter.published_at && Date.parse(chapter.published_at) > Date.now())) {
    const { data: access } = await client.rpc('get_chapter_access', { p_chapter: id });
    const locked = access?.[0];
    if (locked && locked.requires_quiz && !locked.can_open) return { locked: true as const, access: locked, signedIn: typeof claims?.claims?.sub === 'string' };
    return null;
  }
  const [season, comments, progress, chapterList, meetings, questions] = await Promise.all([
    client.from('seasons').select('id,title,slug,book_id,status').eq('id', chapter.season_id).maybeSingle(),
    client.from('v_comments_visible').select('id,chapter_id,user_id,content,is_spoiler,is_locked,created_at').eq('chapter_id', id).order('created_at', { ascending: true }).limit(50),
    claims?.claims?.sub ? client.from('user_progress').select('status,percent').eq('user_id', String(claims.claims.sub)).eq('chapter_id', id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    client.from('chapters').select('id,number,title,published_at').eq('season_id', chapter.season_id).or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`).order('number', { ascending: true }),
    client.from('meetings').select('id,chapter_id,title,status,scheduled_at,duration_min,meeting_url,agenda').eq('chapter_id', id).order('scheduled_at', { ascending: false }).limit(1).maybeSingle(),
    claims?.claims?.sub ? client.from('v_quiz_questions_public').select('id,chapter_id,position,question,options').eq('chapter_id', id).order('position', { ascending: true }).limit(50) : Promise.resolve({ data: [], error: null }),
  ]);
  if (!season.data || !['active', 'finished'].includes(season.data.status)) return null;
  const book = season.data ? await client.from('books').select('id,title,slug,cover_url,author_id').eq('id', season.data.book_id).maybeSingle() : { data: null };
  const ordered = (chapterList.data ?? []).filter((item) => !item.published_at || Date.parse(item.published_at) <= Date.now());
  const index = ordered.findIndex((item) => item.id === chapter.id);
  return {
    chapter: chapter as Chapter,
    season: season.data,
    book: book.data,
    comments: comments.data ?? [],
    progress: progress.data,
    previous: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
    meeting: meetings.data,
    questions: questions.data ?? [],
    signedIn: typeof claims?.claims?.sub === 'string',
    viewerId: typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null,
  };
}
