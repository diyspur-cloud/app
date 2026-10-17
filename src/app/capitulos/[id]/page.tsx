import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterInteractions } from '@/components/chapters/chapter-interactions';
import { QuizPanel } from '@/components/quiz/quiz-panel';
import { YouTubeFacade } from '@/components/youtube-facade';
import { TimedCommentList } from '@/components/video/timed-comment-list';
import { HostPrompt } from '@/components/chapters/host-prompt';
import { DiscussionEntryButton } from '@/components/discussions/discussion-entry-button';
import { getChapters } from '@/features/catalog/queries';
import { getTimedComments } from '@/features/video-comments/queries';
import type { Metadata } from 'next';
import { createServerSupabase } from '@/lib/supabase/clients';
import { chapterLabel, cleanChapterTitle } from '@/lib/chapter-label';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getChapters(id);
  if (!result) return { title: 'Capítulo não encontrado' };
  if ('locked' in result) {
    return {
      title: `${result.access.chapter_title} · Capítulo bloqueado`,
      robots: { index: false, follow: false },
    };
  }
  return {
    title: chapterLabel(result.chapter.title, result.chapter.number),
    description: result.chapter.summary ?? `Leitura guiada de ${chapterLabel(result.chapter.title, result.chapter.number)}.`,
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getChapters(id);
  if (!result) notFound();

  if ('locked' in result) {
    return (
      <section className="container">
        <header className="page-intro">
          <span className="eyebrow">Leitura em sequência</span>
          <h1>{result.access.chapter_title}</h1>
          <p>
            Este capítulo é liberado depois da tentativa do quiz anterior, para manter a conversa
            sem spoilers.
          </p>
        </header>
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">
            ▣
          </div>
          <h2>
            {result.signedIn
              ? 'Complete o capítulo anterior primeiro'
              : 'Entre para continuar a leitura'}
          </h2>
          <p>
            {result.signedIn
              ? 'Responda ao quiz do capítulo anterior. A tentativa fica registrada no seu histórico e libera o próximo passo.'
              : 'Crie uma conta ou entre para guardar seu progresso e desbloquear a sequência do clube.'}
          </p>
          <div className="empty-actions">
            <Link
              className="button button-small"
              href={
                result.signedIn
                  ? `/temporadas/${result.access.season_slug}`
                  : `/entrar?redirect=${encodeURIComponent(`/capitulos/${id}`)}`
              }
            >
              {result.signedIn ? 'Voltar à temporada' : 'Entrar para continuar'}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const {
    chapter,
    season,
    book,
    comments,
    progress,
    previous,
    next,
    meeting,
    questions,
    hostPrompt,
    hostPromptResult,
    hostPromptVote,
    signedIn,
    viewerId,
  } = result;

  const profileClient = await createServerSupabase();
  const authorIds = [...new Set(comments.map((comment) => comment.user_id))];
  const { data: authorRows } = authorIds.length
    ? await profileClient
        .from('v_profiles_public')
        .select('id,display_name,username')
        .in('id', authorIds)
    : { data: [] };
  const authors = new Map((authorRows ?? []).map((author) => [author.id, author]));
  const commentsWithAuthors = comments.map((comment) => ({
    ...comment,
    author: authors.get(comment.user_id) ?? null,
  }));
  const timedComments = await getTimedComments(chapter.id);
  const { data: chapterChannel } = await profileClient
    .from('club_channels')
    .select('id, slug, club_id, user_clubs!inner(slug)')
    .eq('chapter_id', chapter.id)
    .maybeSingle();

  const clubSlug = (chapterChannel?.user_clubs as unknown as { slug: string } | undefined)?.slug ?? null;

  const meetingDate = meeting?.scheduled_at
    ? `${new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Sao_Paulo',
      }).format(new Date(meeting.scheduled_at))} · horário de Brasília`
    : null;
  const safeMeetingUrl =
    meeting?.meeting_url && /^https:\/\//i.test(meeting.meeting_url)
      ? meeting.meeting_url
      : null;

  return (
    <div className="container">
      <header className="page-intro chapter-intro">
        <nav className="breadcrumbs" aria-label="Trilha de navegação">
          <Link href="/livros">Livros</Link>
          {book && (
            <>
              <span>/</span>
              <Link href={`/livros/${book.slug}`}>{book.title}</Link>
            </>
          )}
          {season && (
            <>
              <span>/</span>
              <Link href={`/temporadas/${season.slug}`}>{season.title}</Link>
            </>
          )}
          <span>/</span>
          <span>Capítulo {chapter.number}</span>
        </nav>
        <span className="eyebrow">Capítulo {chapter.number}</span>
        <h1>{cleanChapterTitle(chapter.title, chapter.number)}</h1>
        <p>{chapter.reading_range ?? 'Um novo capítulo, uma nova conversa.'}</p>
      </header>

      <div className="chapter-layout">
        <section className="chapter-main">
          <YouTubeFacade videoUrl={chapter.youtube_url} title={chapter.title} />
          <TimedCommentList
            comments={timedComments}
            chapterId={chapter.id}
            signedIn={signedIn}
            videoUrl={chapter.youtube_url}
          />
          {chapter.summary && (
            <section className="section chapter-summary">
              <h2>Sobre este capítulo</h2>
              <p>{chapter.summary}</p>
            </section>
          )}
          <ChapterInteractions
            chapterId={chapter.id}
            signedIn={signedIn}
            viewerId={viewerId}
            progress={
              progress ? { status: progress.status, percent: progress.percent } : null
            }
            comments={commentsWithAuthors}
          />
          {hostPrompt && hostPrompt.options.length > 0 && (
            <HostPrompt
              prompt={hostPrompt}
              results={hostPromptResult}
              selectedOption={hostPromptVote}
              signedIn={signedIn}
              chapterId={chapter.id}
            />
          )}
          <QuizPanel chapterId={chapter.id} questions={questions} signedIn={signedIn} />
          <nav className="chapter-navigation" aria-label="Navegação de capítulos">
            {previous ? (
              <Link className="chapter-nav-link" href={`/capitulos/${previous.id}`}>
                <span>← Capítulo anterior</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              next.canOpen ? (
                <Link
                  className="chapter-nav-link chapter-nav-next"
                  href={`/capitulos/${next.id}`}
                >
                  <span>Próximo capítulo →</span>
                  <strong>{next.title}</strong>
                </Link>
              ) : (
                <Link
                  className="chapter-nav-link chapter-nav-next"
                  href={`/temporadas/${season.slug}`}
                >
                  <span>Próximo capítulo bloqueado</span>
                  <strong>{next.title}</strong>
                  <small>Complete o quiz anterior para continuar</small>
                </Link>
              )
            ) : (
              <span className="field-hint">
                Você chegou ao capítulo mais recente desta temporada.
              </span>
            )}
          </nav>
        </section>

        <aside className="chapter-aside">
          <h2>Ao lado da leitura</h2>
          <p>
            {book ? <>Você está lendo “{book.title}”. </> : null}
            {season ? (
              <>
                {season.title} · capítulo {chapter.number}.{' '}
              </>
            ) : null}
            Continue no seu ritmo.
          </p>
          {book && (
            <p className="aside-link">
              <Link className="text-link" href={`/livros/${book.slug}`}>
                Sobre o livro →
              </Link>
            </p>
          )}
          {chapterChannel && clubSlug ? (
            <div className="aside-channel my-3">
              <span className="eyebrow block mb-1">Debate deste capítulo</span>
              <DiscussionEntryButton
                mode="chapter"
                chapterId={chapter.id}
                label={`Entrar no debate do Cap. ${chapter.number}`}
              />
            </div>
          ) : (
            <p className="aside-link">
              <Link className="text-link" href="/comunidade">
                Ir para as conversas →
              </Link>
            </p>
          )}
          {meeting && (
            <section className="meeting-card">
              <span className="eyebrow">Encontro associado</span>
              <h3>
                <Link href={`/eventos/${meeting.id}`} className="hover:underline">
                  {meeting.title}
                </Link>
              </h3>
              {meetingDate && <p>{meetingDate}</p>}
              {meeting.duration_min && <p>{meeting.duration_min} minutos</p>}
              {meeting.status && (
                <p className="field-hint">
                  {meeting.status === 'scheduled'
                    ? 'Encontro agendado'
                    : meeting.status === 'live'
                      ? 'Ao vivo agora'
                      : meeting.status === 'done'
                        ? 'Encontro encerrado'
                        : 'Encontro cancelado'}
                </p>
              )}
              <div className="flex flex-col gap-1 mt-2">
                <Link href={`/eventos/${meeting.id}`} className="text-link text-sm font-medium">
                  Ver detalhes e confirmar presença &rarr;
                </Link>
                {safeMeetingUrl && (
                  <a
                    className="text-link text-sm"
                    href={safeMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir transmissão ↗
                  </a>
                )}
              </div>
            </section>
          )}
          <div className="notice">
            Seu progresso e suas respostas ficam privados por padrão, e o resultado é conferido
            antes de ser salvo.
          </div>
        </aside>
      </div>
    </div>
  );
}
