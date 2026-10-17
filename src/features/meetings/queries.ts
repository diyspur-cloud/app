import 'server-only';

import { createServerSupabase } from '@/lib/supabase/clients';

export interface MeetingDetailView {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  kind: 'online' | 'in_person' | 'hybrid';
  status: 'scheduled' | 'live' | 'done' | 'cancelled';
  location: string | null;
  meetingUrl: string | null;
  agenda: string | null;
  slidesUrl: string | null;
  spoilerPolicy: string;
  version: number;
  updatedAt: string;
  createdBy: string | null;
  book: { id: string; slug: string; title: string; coverUrl: string | null };
  club: { id: string; slug: string; name: string; isPrivate: boolean; kind: string } | null;
  chapter: { id: string; number: number; title: string } | null;
  attendeesCount: number;
  userRsvp: boolean | null;
  canManage: boolean;
  viewerId: string | null;
}

export async function getMeetingDetail(meetingId: string): Promise<MeetingDetailView | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: claimsData } = await supabase.auth.getClaims();
    const viewerId = claimsData?.claims?.sub ?? null;

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(
        'id,title,scheduled_at,duration_min,kind,status,location,meeting_url,agenda,slides_url,spoiler_policy,version,updated_at,created_by,book_id,club_id,chapter_id,books(id,slug,title,cover_url),user_clubs(id,slug,name,is_private,kind),chapters(id,number,title)',
      )
      .eq('id', meetingId)
      .maybeSingle();

    if (error || !meeting) return null;

    const [{ count: attendeesCount }, { data: rsvpRow }, { data: isAdminData }] =
      await Promise.all([
        supabase
          .from('meeting_rsvps')
          .select('user_id', { count: 'exact', head: true })
          .eq('meeting_id', meetingId)
          .eq('attending', true),
        viewerId
          ? supabase
              .from('meeting_rsvps')
              .select('attending')
              .eq('meeting_id', meetingId)
              .eq('user_id', viewerId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        viewerId ? supabase.rpc('is_admin') : Promise.resolve({ data: false }),
      ]);

    let isClubManager = false;
    if (viewerId && meeting.club_id) {
      const { data: member } = await supabase
        .from('user_club_members')
        .select('role')
        .eq('club_id', meeting.club_id)
        .eq('user_id', viewerId)
        .maybeSingle();
      if (member?.role === 'owner' || member?.role === 'moderator') {
        isClubManager = true;
      }
    }

    const rawBook = (Array.isArray(meeting.books) ? meeting.books[0] : meeting.books) as
      | { id: string; slug: string; title: string; cover_url: string | null }
      | undefined
      | null;
    const rawClub = (Array.isArray(meeting.user_clubs) ? meeting.user_clubs[0] : meeting.user_clubs) as
      | { id: string; slug: string; name: string; is_private: boolean; kind: string }
      | undefined
      | null;
    const rawChapter = (Array.isArray(meeting.chapters) ? meeting.chapters[0] : meeting.chapters) as
      | { id: string; number: number; title: string }
      | undefined
      | null;

    const book = rawBook
      ? {
          id: rawBook.id,
          slug: rawBook.slug,
          title: rawBook.title,
          coverUrl: rawBook.cover_url ?? null,
        }
      : { id: meeting.book_id, slug: '', title: 'Livro associado', coverUrl: null };

    const club = rawClub
      ? {
          id: rawClub.id,
          slug: rawClub.slug,
          name: rawClub.name,
          isPrivate: rawClub.is_private,
          kind: rawClub.kind,
        }
      : null;

    const chapter = rawChapter
      ? {
          id: rawChapter.id,
          number: rawChapter.number,
          title: rawChapter.title,
        }
      : null;

    const canManage =
      Boolean(isAdminData) ||
      (viewerId && meeting.created_by === viewerId) ||
      isClubManager;

    return {
      id: meeting.id,
      title: meeting.title,
      scheduledAt: meeting.scheduled_at,
      durationMin: meeting.duration_min ?? 60,
      kind: meeting.kind,
      status: meeting.status,
      location: meeting.location,
      meetingUrl: meeting.meeting_url,
      agenda: meeting.agenda,
      slidesUrl: meeting.slides_url,
      spoilerPolicy: meeting.spoiler_policy,
      version: meeting.version,
      updatedAt: meeting.updated_at,
      createdBy: meeting.created_by,
      book,
      club,
      chapter,
      attendeesCount: attendeesCount ?? 0,
      userRsvp: rsvpRow?.attending ?? null,
      canManage: Boolean(canManage),
      viewerId,
    };
  } catch {
    return null;
  }
}
