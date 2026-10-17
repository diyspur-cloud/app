import { NextResponse, type NextRequest } from 'next/server';
import { getNotificationFeed } from '@/features/notifications/queries';
import { notificationCursorSchema } from '@/features/notifications/schemas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawInput = {
    beforeCreatedAt: searchParams.get('beforeCreatedAt') ?? undefined,
    beforeId: searchParams.get('beforeId') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    unreadOnly: searchParams.get('unreadOnly') ?? undefined,
  };

  const parsed = notificationCursorSchema.safeParse(rawInput);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Parâmetros inválidos.' },
      {
        status: 400,
        headers: { 'Cache-Control': 'private, no-store' },
      },
    );
  }

  const feed = await getNotificationFeed(parsed.data);
  return NextResponse.json(feed, {
    status: 200,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
