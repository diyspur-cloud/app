import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/clients';

export async function GET() {
  const client = await createServerSupabase();
  const { data, error } = await client.auth.getClaims();
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;

  if (error || !userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const [profileRes, journalRes, listsRes, progressRes, rsvpsRes, clubsRes] = await Promise.all([
      client.from('profiles').select('id,username,display_name,bio,created_at').eq('id', userId).maybeSingle(),
      client.from('reading_journal_entries').select('id,book_id,title,body,entry_date,minutes_read,page_from,page_to,is_spoiler,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
      client.from('reading_lists').select('id,slug,title,description,visibility,is_collaborative,created_at').eq('owner_id', userId).limit(50),
      client.from('user_progress').select('chapter_id,percent,updated_at').eq('user_id', userId).limit(200),
      client.from('meeting_rsvps').select('meeting_id,attending,created_at').eq('user_id', userId).limit(100),
      client.from('user_club_members').select('club_id,role,joined_at').eq('user_id', userId).limit(50),
    ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        id: userId,
        profile: profileRes.data ?? null,
      },
      journalEntries: journalRes.data ?? [],
      readingLists: listsRes.data ?? [],
      readingProgress: progressRes.data ?? [],
      meetingRsvps: rsvpsRes.data ?? [],
      clubMemberships: clubsRes.data ?? [],
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': 'attachment; filename="diyspur-data-export.json"',
        'cache-control': 'private, no-store, max-age=0',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'failed_to_export' }, { status: 500 });
  }
}
