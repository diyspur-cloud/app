import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clientsModule from '@/lib/supabase/clients';

describe('Upcoming Meetings and Cycle Context (QA-14)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('queries meetings with scheduled/live status and future scheduled_at', async () => {
    const mockMeetings = [
      {
        id: 'm-1',
        chapter_id: 'c-1',
        title: 'Discussão Cap 1',
        status: 'scheduled',
        kind: 'live',
        scheduled_at: '2026-10-15T20:00:00Z',
        duration_min: 60,
        meeting_url: 'https://meet.google.com/abc',
        location: null,
        agenda: null,
      },
    ];

    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockMeetings, error: null }),
    };

    const supabaseMock = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };

    vi.spyOn(clientsModule, 'createServerSupabase').mockResolvedValue(supabaseMock as any);

    const { getUpcomingMeetings } = await import('@/features/catalog/queries');
    const result = await getUpcomingMeetings(2);

    expect(supabaseMock.from).toHaveBeenCalledWith('meetings');
    expect(queryBuilder.select).toHaveBeenCalledWith(
      'id,chapter_id,title,status,kind,scheduled_at,duration_min,meeting_url,location,agenda'
    );
    expect(queryBuilder.in).toHaveBeenCalledWith('status', ['scheduled', 'live']);
    expect(queryBuilder.gte).toHaveBeenCalledWith('scheduled_at', expect.any(String));
    expect(queryBuilder.order).toHaveBeenCalledWith('scheduled_at', { ascending: true });
    expect(queryBuilder.limit).toHaveBeenCalledWith(2);
    expect(result).toEqual(mockMeetings);
  });

  it('returns empty array when upcoming meetings query fails', async () => {
    const queryBuilder: any = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST100' } }),
    };

    const supabaseMock = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };

    vi.spyOn(clientsModule, 'createServerSupabase').mockResolvedValue(supabaseMock as any);

    const { getUpcomingMeetings } = await import('@/features/catalog/queries');
    const result = await getUpcomingMeetings();

    expect(result).toEqual([]);
  });
});
