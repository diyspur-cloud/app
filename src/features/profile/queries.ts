import { createServerSupabase } from '@/lib/supabase/clients';
import type { Tables } from '@/types/database';

type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>;
type ProfileRow = Pick<Tables<'profiles'>, 'username' | 'display_name' | 'avatar_url' | 'bio' | 'level'>;
type OverviewRow = Tables<'v_user_reading_overview'>;
type ProgressRow = Pick<Tables<'user_progress'>, 'id' | 'chapter_id' | 'finished_at' | 'percent' | 'started_at' | 'status' | 'updated_at'>;
type XpRow = Pick<Tables<'user_xp'>, 'season_id' | 'season_xp' | 'total_xp'>;
type QuizAverageRow = Pick<Tables<'user_quiz_averages'>, 'attempts_total' | 'average_percent' | 'best_percent' | 'last_attempt_at'>;
type StreakRow = Pick<Tables<'user_streaks'>, 'current_streak' | 'last_activity_at' | 'longest_streak'>;
type UserAchievementRow = Pick<Tables<'user_achievements'>, 'achievement_id' | 'unlocked_at'>;
type AchievementRow = Pick<Tables<'achievements'>, 'id' | 'title' | 'description' | 'icon_url' | 'xp_reward'>;
type QuizAttemptRow = Pick<Tables<'quiz_attempts'>, 'chapter_id' | 'created_at' | 'score' | 'total'>;
type ChapterRow = Pick<Tables<'chapters'>, 'id' | 'number' | 'season_id' | 'title'>;
type SeasonRow = Pick<Tables<'seasons'>, 'book_id' | 'id' | 'number' | 'slug' | 'title'>;
type BookRow = Pick<Tables<'books'>, 'id' | 'slug' | 'title'>;

export type ProgressStatus = Tables<'user_progress'>['status'];

export type Achievement = AchievementRow & { unlockedAt: string };

export type ReadingHistoryItem = {
  id: string;
  status: ProgressStatus;
  percent: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  updatedAt: string;
  chapter: ChapterRow;
  season: SeasonRow;
  book: BookRow;
  quiz: { score: number; total: number; createdAt: string } | null;
};

export type ProfileOverviewData = {
  profile: ProfileRow | null;
  overview: OverviewRow | null;
  xp: XpRow | null;
  streak: StreakRow | null;
  quizAverage: QuizAverageRow | null;
  achievements: Achievement[];
  recentHistory: ReadingHistoryItem[];
};

type QueryResponse<T> = {
  data: T | null;
  error: { code?: string | null } | null;
};

function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : 'unknown';
  }
  return 'unknown';
}

async function readOrNull<T>(query: PromiseLike<QueryResponse<T>>, label: string): Promise<T | null> {
  try {
    const result = await query;
    if (result.error) {
      console.error(`[profile] ${label} query failed`, errorCode(result.error));
      return null;
    }
    return result.data ?? null;
  } catch (error) {
    console.error(`[profile] ${label} query failed`, errorCode(error));
    return null;
  }
}

async function getSessionContext(): Promise<{ client: ServerSupabase; userId: string } | null> {
  try {
    const client = await createServerSupabase();
    const { data } = await client.auth.getClaims();
    const subject = data?.claims?.sub;
    if (typeof subject !== 'string' || !subject) return null;
    return { client, userId: subject };
  } catch (error) {
    console.error('[profile] auth lookup failed', errorCode(error));
    return null;
  }
}

async function loadAchievements(client: ServerSupabase, userId: string): Promise<Achievement[]> {
  const unlocked = await readOrNull<UserAchievementRow[]>(
    client
      .from('user_achievements')
      .select('achievement_id,unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })
      .limit(12),
    'user achievements',
  );

  if (!unlocked?.length) return [];

  const achievementIds = [...new Set(unlocked.map((item) => item.achievement_id))];
  const achievements = await readOrNull<AchievementRow[]>(
    client.from('achievements').select('id,title,description,icon_url,xp_reward').in('id', achievementIds),
    'achievements',
  );
  if (!achievements?.length) return [];

  const byId = new Map(achievements.map((achievement) => [achievement.id, achievement]));
  return unlocked.flatMap((item) => {
    const achievement = byId.get(item.achievement_id);
    return achievement ? [{ ...achievement, unlockedAt: item.unlocked_at }] : [];
  });
}

async function loadReadingHistory(
  client: ServerSupabase,
  userId: string,
  limit = 100,
): Promise<ReadingHistoryItem[]> {
  const progress = await readOrNull<ProgressRow[]>(
    client
      .from('user_progress')
      .select('id,chapter_id,finished_at,percent,started_at,status,updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit),
    'user progress',
  );
  if (!progress?.length) return [];

  const chapterIds = [...new Set(progress.map((item) => item.chapter_id))];
  const chapters = await readOrNull<ChapterRow[]>(
    client.from('chapters').select('id,number,season_id,title').in('id', chapterIds),
    'chapters for history',
  );
  if (!chapters?.length) return [];

  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const seasonIds = [...new Set(chapters.map((chapter) => chapter.season_id))];
  const seasons = await readOrNull<SeasonRow[]>(
    client.from('seasons').select('id,book_id,number,slug,title').in('id', seasonIds),
    'seasons for history',
  );
  if (!seasons?.length) return [];

  const seasonById = new Map(seasons.map((season) => [season.id, season]));
  const bookIds = [...new Set(seasons.map((season) => season.book_id))];
  const books = await readOrNull<BookRow[]>(
    client.from('books').select('id,slug,title').in('id', bookIds),
    'books for history',
  );
  if (!books?.length) return [];

  const bookById = new Map(books.map((book) => [book.id, book]));
  const quizAttempts = await readOrNull<QuizAttemptRow[]>(
    client
      .from('quiz_attempts')
      .select('chapter_id,created_at,score,total')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(300),
    'quiz attempts',
  );
  const latestQuizByChapter = new Map<string, QuizAttemptRow>();
  for (const attempt of quizAttempts ?? []) {
    if (!latestQuizByChapter.has(attempt.chapter_id)) latestQuizByChapter.set(attempt.chapter_id, attempt);
  }

  return progress.flatMap((item) => {
    const chapter = chapterById.get(item.chapter_id);
    const season = chapter ? seasonById.get(chapter.season_id) : undefined;
    const book = season ? bookById.get(season.book_id) : undefined;
    if (!chapter || !season || !book) return [];

    const quiz = latestQuizByChapter.get(chapter.id);
    return [{
      id: item.id,
      status: item.status,
      percent: typeof item.percent === 'number' ? item.percent : null,
      startedAt: item.started_at,
      finishedAt: item.finished_at,
      updatedAt: item.updated_at,
      chapter,
      season,
      book,
      quiz: quiz ? { score: quiz.score, total: quiz.total, createdAt: quiz.created_at } : null,
    }];
  });
}

export async function getProfileOverview(): Promise<ProfileOverviewData | null> {
  const context = await getSessionContext();
  if (!context) return null;

  const { client, userId } = context;
  const [profile, overview, xp, streak, quizAverage] = await Promise.all([
    readOrNull<ProfileRow>(
      client.from('profiles').select('username,display_name,avatar_url,bio,level').eq('id', userId).maybeSingle(),
      'profile',
    ),
    readOrNull<OverviewRow>(
      client
        .from('v_user_reading_overview')
        .select('user_id,books_read,books_reading,books_want,books_dnf,read_today,reading_days,total_minutes')
        .eq('user_id', userId)
        .maybeSingle(),
      'reading overview',
    ),
    readOrNull<XpRow>(
      client.from('user_xp').select('season_id,season_xp,total_xp').eq('user_id', userId).maybeSingle(),
      'user xp',
    ),
    readOrNull<StreakRow>(
      client.from('user_streaks').select('current_streak,last_activity_at,longest_streak').eq('user_id', userId).maybeSingle(),
      'user streak',
    ),
    readOrNull<QuizAverageRow>(
      client.from('user_quiz_averages').select('attempts_total,average_percent,best_percent,last_attempt_at').eq('user_id', userId).maybeSingle(),
      'quiz average',
    ),
  ]);

  const [achievements, recentHistory] = await Promise.all([
    loadAchievements(client, userId),
    loadReadingHistory(client, userId, 5),
  ]);

  return { profile, overview, xp, streak, quizAverage, achievements, recentHistory };
}

export async function getReadingHistory(): Promise<ReadingHistoryItem[] | null> {
  const context = await getSessionContext();
  if (!context) return null;
  return loadReadingHistory(context.client, context.userId);
}
