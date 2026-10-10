'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import type { PublicTimedComment } from '@/features/video-comments/queries';
import { createTimedComment } from '@/features/video-comments/actions';

type TimedCommentListProps = {
  comments: readonly PublicTimedComment[];
  chapterId: string;
  signedIn: boolean;
  videoUrl?: string | null;
  heading?: string;
};

function youtubeVideoId(videoUrl: string): string | null {
  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.toLowerCase();
    const isYouTube = hostname === 'youtube.com' || hostname === 'www.youtube.com' || hostname === 'm.youtube.com';
    const isShortYouTube = hostname === 'youtu.be';
    if (url.protocol !== 'https:' || (!isYouTube && !isShortYouTube)) return null;

    const candidate = isShortYouTube
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1];
    return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function timestampUrl(videoUrl: string | null | undefined, seconds: number): string | null {
  if (!videoUrl) return null;
  const videoId = youtubeVideoId(videoUrl);
  if (!videoId) return null;
  const url = new URL('https://www.youtube.com/watch');
  url.searchParams.set('v', videoId);
  url.searchParams.set('t', String(seconds));
  return url.toString();
}

function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const minutePart = String(minutes).padStart(2, '0');
  const secondPart = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${minutePart}:${secondPart}` : `${minutes}:${secondPart}`;
}

export function TimedCommentList({ comments, chapterId, signedIn, videoUrl, heading = 'Comentários no vídeo' }: TimedCommentListProps) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const videoSec = Number(form.get('videoSec'));
    const content = String(form.get('content') ?? '');
    startTransition(async () => {
      const result = await createTimedComment({ chapterId, videoSec, content });
      setFeedback({ ok: result.ok, message: result.ok ? 'Comentário publicado.' : result.message });
      if (result.ok) {
        formElement.reset();
        router.refresh();
      }
    });
  }

  return <section className="chapter-discussion timed-comment-list" aria-labelledby="timed-comments-heading">
    <div className="section-head">
      <div>
        <span className="eyebrow">Conversa sincronizada</span>
        <h2 id="timed-comments-heading">{heading}</h2>
      </div>
    </div>
    {signedIn ? <form className="comment-composer" onSubmit={submitComment}>
      <label className="field-group"><span>Segundo do vídeo</span><input className="field" name="videoSec" type="number" min="0" max="86400" step="1" required aria-describedby="timed-comment-hint" /></label>
      <label className="field-group"><span>Seu comentário</span><textarea className="field" name="content" minLength={1} maxLength={2000} rows={3} required aria-describedby="timed-comment-hint" placeholder="Compartilhe uma ideia sobre este momento…" /></label>
      <p className="field-hint" id="timed-comment-hint">Use segundos inteiros (até 24 horas). O link do momento abre o vídeo em uma nova aba.</p>
      <button className="button button-small" type="submit" disabled={busy}>{busy ? 'Publicando…' : 'Comentar neste momento'}</button>
      {feedback && <p className={feedback.ok ? 'action-feedback' : 'action-feedback'} role={feedback.ok ? 'status' : 'alert'}>{feedback.message}</p>}
    </form> : <p className="notice">Entre para comentar sobre um momento do vídeo. <a className="text-link" href={`/entrar?redirect=${encodeURIComponent(`/capitulos/${chapterId}`)}`}>Entrar →</a></p>}
    {comments.length > 0 ? <ol className="comment-list" aria-label="Comentários ordenados pelo momento do vídeo">
      {comments.map((comment) => {
        const label = formatTimestamp(comment.video_sec);
        const href = timestampUrl(videoUrl, comment.video_sec);
        return <li className="comment-card timed-comment-card" key={comment.id}>
          {href ? <a className="text-link timed-comment-timestamp" href={href} target="_blank" rel="noopener noreferrer">{label}</a> : <span className="field-hint timed-comment-timestamp">{label}</span>}
          <p>{comment.content}</p>
          <span className="field-hint">Comentário sobre este momento · {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(comment.created_at))}</span>
        </li>;
      })}
    </ol> : <div className="empty-state">
      <div className="empty-state-mark" aria-hidden="true">◷</div>
      <h3>Ainda não há comentários no vídeo</h3>
      <p>As conversas sobre cada momento da gravação aparecerão aqui.</p>
    </div>}
  </section>;
}

export default TimedCommentList;
