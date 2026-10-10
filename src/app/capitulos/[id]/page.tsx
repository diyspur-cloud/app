import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChapterInteractions } from '@/components/chapters/chapter-interactions';
import { QuizPanel } from '@/components/quiz/quiz-panel';
import { YouTubeFacade } from '@/components/youtube-facade';
import { TimedCommentList } from '@/components/video/timed-comment-list';
import { getChapters } from '@/features/catalog/queries';
import { getTimedComments } from '@/features/video-comments/queries';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getChapters(id);
  if (!result) return { title: 'Capítulo não encontrado' };
  if ('locked' in result) return { title: `${result.access.chapter_title} · Capítulo bloqueado`, robots: { index: false, follow: false } };
  return { title: result.chapter.title, description: result.chapter.summary ?? `Leitura guiada de ${result.chapter.title}.` };
}

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getChapters(id);
  if (!result) notFound();
  if ('locked' in result) return <section className="container"><header className="page-intro"><span className="eyebrow">Leitura em sequência</span><h1>{result.access.chapter_title}</h1><p>Este capítulo é liberado depois da tentativa do quiz anterior, para manter a conversa sem spoilers.</p></header><div className="empty-state"><div className="empty-state-mark" aria-hidden="true">▣</div><h2>{result.signedIn ? 'Complete o capítulo anterior primeiro' : 'Entre para continuar a leitura'}</h2><p>{result.signedIn ? 'Responda ao quiz do capítulo anterior. A tentativa fica registrada no seu histórico e libera o próximo passo.' : 'Crie uma conta ou entre para guardar seu progresso e desbloquear a sequência do clube.'}</p><div className="empty-actions"><Link className="button button-small" href={result.signedIn ? `/temporadas/${result.access.season_slug}` : `/entrar?redirect=${encodeURIComponent(`/capitulos/${id}`)}`}>{result.signedIn ? 'Voltar à temporada' : 'Entrar para continuar'}</Link></div></div></section>;
  const { chapter, season, book, comments, progress, previous, next, meeting, questions, signedIn, viewerId } = result;
  const timedComments = await getTimedComments(chapter.id);
  const meetingDate = meeting?.scheduled_at ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(meeting.scheduled_at)) : null;
  const safeMeetingUrl = meeting?.meeting_url && /^https:\/\//i.test(meeting.meeting_url) ? meeting.meeting_url : null;

  return <div className="container">
    <header className="page-intro chapter-intro">
      <nav className="breadcrumbs" aria-label="Trilha de navegação"><Link href="/livros">Livros</Link>{book && <><span>/</span><Link href={`/livros/${book.slug}`}>{book.title}</Link></>}{season && <><span>/</span><Link href={`/temporadas/${season.slug}`}>{season.title}</Link></>}<span>/</span><span>Capítulo {chapter.number}</span></nav>
      <span className="eyebrow">Capítulo {chapter.number}</span><h1>{chapter.title}</h1><p>{chapter.reading_range ?? 'Um novo capítulo, uma nova conversa.'}</p>
    </header>
    <div className="chapter-layout">
      <section className="chapter-main">
        <YouTubeFacade videoUrl={chapter.youtube_url} title={chapter.title} />
        <TimedCommentList comments={timedComments} chapterId={chapter.id} signedIn={signedIn} videoUrl={chapter.youtube_url} />
        {chapter.summary && <section className="section chapter-summary"><h2>Sobre este capítulo</h2><p>{chapter.summary}</p></section>}
        <ChapterInteractions chapterId={chapter.id} signedIn={signedIn} viewerId={viewerId} progress={progress ? { status: progress.status, percent: progress.percent } : null} comments={comments} />
        <QuizPanel chapterId={chapter.id} questions={questions} signedIn={signedIn} />
        <nav className="chapter-navigation" aria-label="Navegação de capítulos">
          {previous ? <Link className="chapter-nav-link" href={`/capitulos/${previous.id}`}><span>← Capítulo anterior</span><strong>{previous.title}</strong></Link> : <span />}
          {next ? <Link className="chapter-nav-link chapter-nav-next" href={`/capitulos/${next.id}`}><span>Próximo capítulo →</span><strong>{next.title}</strong></Link> : <span className="field-hint">Você chegou ao capítulo mais recente desta temporada.</span>}
        </nav>
      </section>
      <aside className="chapter-aside">
        <h2>Ao lado da leitura</h2><p>{book ? <>Você está lendo “{book.title}”. </> : null}{season ? <>{season.title} · capítulo {chapter.number}. </> : null}Continue no seu ritmo.</p>
        {book && <p className="aside-link"><Link className="text-link" href={`/livros/${book.slug}`}>Sobre o livro →</Link></p>}
        <p className="aside-link"><Link className="text-link" href="/comunidade">Ir para as conversas →</Link></p>
        {meeting && <section className="meeting-card"><span className="eyebrow">Encontro associado</span><h3>{meeting.title}</h3>{meetingDate && <p>{meetingDate}</p>}{meeting.duration_min && <p>{meeting.duration_min} minutos</p>}{meeting.status && <p className="field-hint">Status: {meeting.status}</p>}{safeMeetingUrl && <a className="text-link" href={safeMeetingUrl} target="_blank" rel="noopener noreferrer">Abrir encontro ↗</a>}</section>}
        <div className="notice">Seu progresso e suas respostas são privados por padrão. O servidor valida permissões e gabaritos.</div>
      </aside>
    </div>
  </div>;
}
