import { createServerSupabase } from '@/lib/supabase/clients';

type Club = { id: string; owner_id: string; name: string; slug: string; description: string | null; is_private: boolean; version: number; archived_at: string | null; created_at: string; current_book_id?: string | null; current_season_id?: string | null };
type Member = { user_id: string; role: string; joined_at: string };

export async function getClubPage(slug: string) {
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  const userId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;
  // The generated contract predates the additive lifecycle columns; keep the boundary explicit until regeneration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = client as any;
  const { data: club, error } = await db.from('user_clubs').select('id,owner_id,name,slug,description,is_private,version,archived_at,created_at,current_book_id,current_season_id').eq('slug', slug).maybeSingle() as { data: Club | null; error: { message: string } | null };
  if (error || !club) return { userId, club: null, members: [] as Member[], isMember: false };
  const { data: members } = await db.from('user_club_members').select('user_id,role,joined_at').eq('club_id', club.id).limit(100) as { data: Member[] | null };
  const memberRows = members ?? [];
  return { userId, club, members: memberRows, isMember: Boolean(userId && memberRows.some((m: Member) => m.user_id === userId)) };
}

export async function getVisibleClubs() {
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  const userId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (client as any).from('user_clubs').select('id,owner_id,name,slug,description,is_private,version,archived_at,created_at').order('created_at', { ascending: false }).limit(24) as { data: Club[] | null; error: { message: string } | null };
  return { userId, clubs: data ?? [], error: error?.message ?? null };
}
