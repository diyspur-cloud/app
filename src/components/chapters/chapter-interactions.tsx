'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import {
  createChapterComment,
  deleteChapterComment,
  editChapterComment,
  getOwnChapterCommentForEdit,
  saveChapterProgress,
} from '@/features/chapters/actions';
import { ReportButton } from '@/components/moderation/report-button';
import { CommentSpoilerCard } from '@/components/comments/comment-spoiler-card';

export type VisibleComment = {
  id: string;
  user_id: string;
  content: string | null;
  is_spoiler: boolean;
  is_locked: boolean;
  created_at: string;
  author?: { display_name: string | null; username: string | null } | null;
};

// 1. Subcomponente: Progresso de leitura do capítulo
function ChapterProgressSection({
  chapterId,
  signedIn,
  initialPercent,
  status,
  onProgressUpdated,
}: {
  chapterId: string;
  signedIn: boolean;
  initialPercent: number;
  status?: string;
  onProgressUpdated: (notice: string) => void;
}) {
  const router = useRouter();
  const [percent, setPercent] = useState(initialPercent);
  const [busy, startTransition] = useTransition();

  function updateProgress(nextStatus: 'reading' | 'read') {
    startTransition(async () => {
      const result = await saveChapterProgress({
        chapterId,
        status: nextStatus,
        percent: nextStatus === 'read' ? 100 : percent,
      });
      onProgressUpdated(result.ok ? result.message ?? 'Progresso salvo.' : result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="chapter-progress" aria-labelledby="progress-heading">
      <div>
        <span className="eyebrow">Seu ritmo</span>
        <h2 id="progress-heading">Progresso deste capítulo</h2>
        <p>
          {status === 'read'
            ? 'Você marcou este capítulo como concluído.'
            : status === 'reading'
              ? `Este capítulo está em andamento (${percent}%).`
              : 'Seu progresso fica visível apenas para você.'}
        </p>
        {signedIn && status !== 'read' && (
          <label className="progress-slider" htmlFor="chapter-percent">
            <span>Avanço estimado: {percent}%</span>
            <input
              id="chapter-percent"
              type="range"
              min="0"
              max="99"
              step="1"
              value={percent}
              onChange={(event) => setPercent(Number(event.target.value))}
              onMouseUp={() => updateProgress('reading')}
              onTouchEnd={() => updateProgress('reading')}
              onKeyUp={(event) => {
                if (event.key === 'Enter' || event.key === ' ') updateProgress('reading');
              }}
            />
          </label>
        )}
      </div>

      {signedIn ? (
        <div className="chapter-progress-actions">
          {status !== 'read' ? (
            <>
              <button
                className="button button-quiet button-small"
                type="button"
                disabled={busy}
                onClick={() => updateProgress('reading')}
              >
                Salvar progresso
              </button>
              <button
                className="button button-small"
                type="button"
                disabled={busy}
                onClick={() => updateProgress('read')}
              >
                Concluir capítulo
              </button>
            </>
          ) : (
            <span className="button button-quiet button-small" style={{ cursor: 'default', opacity: 0.85 }}>
              ✓ Capítulo concluído
            </span>
          )}
        </div>
      ) : (
        <Link
          className="button button-small"
          href={`/entrar?redirect=${encodeURIComponent(`/capitulos/${chapterId}`)}`}
        >
          Entre para salvar
        </Link>
      )}
    </section>
  );
}

// 2. Subcomponente: Card individual de comentário com edição inline
function ChapterCommentCard({
  comment,
  chapterId,
  signedIn,
  viewerId,
  onCommentAction,
}: {
  comment: VisibleComment;
  chapterId: string;
  signedIn: boolean;
  viewerId: string | null;
  onCommentAction: (notice: string) => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [busy, startTransition] = useTransition();

  const isAuthor = signedIn && viewerId === comment.user_id;

  function beginEdit() {
    startTransition(async () => {
      const result = await getOwnChapterCommentForEdit({ commentId: comment.id, chapterId });
      if (result.ok) {
        setEditText(result.content);
        setEditing(true);
      } else {
        onCommentAction(result.message);
      }
    });
  }

  function saveEdit() {
    startTransition(async () => {
      const result = await editChapterComment({ commentId: comment.id, chapterId, content: editText });
      onCommentAction(result.ok ? 'Comentário atualizado.' : result.message);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function removeComment() {
    startTransition(async () => {
      const result = await deleteChapterComment({ commentId: comment.id, chapterId });
      onCommentAction(result.ok ? 'Comentário removido.' : result.message);
      if (result.ok) router.refresh();
    });
  }

  return (
    <li className="comment-card">
      <CommentSpoilerCard
        content={comment.content}
        isSpoiler={comment.is_spoiler}
        isLocked={comment.is_locked}
      />
      <span className="field-hint">
        {comment.author?.display_name ??
          (comment.author?.username ? `@${comment.author.username}` : 'Leitor da comunidade')}{' '}
        · {comment.is_spoiler ? 'Comentário marcado com spoiler' : 'Conversa da comunidade'} ·{' '}
        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(comment.created_at))}
      </span>

      {isAuthor && (
        <div className="comment-actions">
          {editing ? (
            <div className="comment-edit">
              <label htmlFor={`edit-${comment.id}`}>Editar seu comentário</label>
              <textarea
                id={`edit-${comment.id}`}
                value={editText}
                maxLength={4000}
                onChange={(event) => setEditText(event.target.value)}
              />
              <div className="chapter-progress-actions">
                <button className="button button-small" type="button" disabled={busy} onClick={saveEdit}>
                  Salvar edição
                </button>
                <button className="button button-quiet button-small" type="button" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="button button-quiet button-small" type="button" disabled={busy} onClick={beginEdit}>
                Editar
              </button>
              <button className="button button-quiet button-small" type="button" disabled={busy} onClick={removeComment}>
                Remover
              </button>
            </>
          )}
        </div>
      )}

      {signedIn && !isAuthor && (
        <ReportButton contentType="comment" contentId={comment.id} path={`/capitulos/${chapterId}`} />
      )}
    </li>
  );
}

// 3. Subcomponente: Composer de novos comentários
function ChapterCommentComposer({
  chapterId,
  signedIn,
  onCommentCreated,
}: {
  chapterId: string;
  signedIn: boolean;
  onCommentCreated: (notice: string) => void;
}) {
  const router = useRouter();
  const [spoiler, setSpoiler] = useState(false);
  const [busy, startTransition] = useTransition();

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get('content') ?? '');
    const minPercentRaw = String(new FormData(form).get('minPercent') ?? '100');

    startTransition(async () => {
      const result = await createChapterComment({
        chapterId,
        content,
        isSpoiler: spoiler,
        minPercent: spoiler ? Number(minPercentRaw) : 0,
      });
      onCommentCreated(result.ok ? result.message ?? 'Comentário publicado.' : result.message);
      if (result.ok) {
        form.reset();
        setSpoiler(false);
        router.refresh();
      }
    });
  }

  if (!signedIn) {
    return (
      <div className="empty-actions">
        <Link
          className="button button-dark button-small"
          href={`/entrar?redirect=${encodeURIComponent(`/capitulos/${chapterId}`)}`}
        >
          Entre para participar
        </Link>
      </div>
    );
  }

  return (
    <form className="comment-composer" onSubmit={postComment}>
      <label htmlFor="chapter-comment">Seu comentário</label>
      <textarea
        id="chapter-comment"
        name="content"
        required
        maxLength={4000}
        rows={4}
        placeholder="Compartilhe uma ideia, pergunta ou trecho que marcou você…"
      />
      <label className="checkbox-line">
        <input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />
        Este comentário contém spoiler
      </label>
      {spoiler && (
        <div className="field">
          <label htmlFor="spoiler-percent">Mostrar quando o progresso chegar a</label>
          <select id="spoiler-percent" name="minPercent" defaultValue="100">
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100% do capítulo</option>
          </select>
          <span className="field-hint">A proteção é aplicada pelo banco, não apenas pela interface.</span>
        </div>
      )}
      <button className="button button-small" disabled={busy} type="submit">
        {busy ? 'Salvando…' : 'Publicar comentário'}
      </button>
    </form>
  );
}

// Componente Principal de Orquestração
export function ChapterInteractions({
  chapterId,
  signedIn,
  viewerId,
  progress,
  comments,
}: {
  chapterId: string;
  signedIn: boolean;
  viewerId: string | null;
  progress: { status: string; percent: number | null } | null;
  comments: VisibleComment[];
}) {
  const [notice, setNotice] = useState('');

  return (
    <>
      <ChapterProgressSection
        chapterId={chapterId}
        signedIn={signedIn}
        initialPercent={progress?.percent ?? 0}
        status={progress?.status}
        onProgressUpdated={setNotice}
      />

      <section className="chapter-discussion" aria-labelledby="discussion-heading">
        <div className="section-head">
          <div>
            <span className="eyebrow">Juntos na leitura</span>
            <h2 id="discussion-heading">O que ficou com você?</h2>
          </div>
        </div>

        {comments.length ? (
          <ul className="comment-list">
            {comments.map((comment) => (
              <ChapterCommentCard
                key={comment.id}
                comment={comment}
                chapterId={chapterId}
                signedIn={signedIn}
                viewerId={viewerId}
                onCommentAction={setNotice}
              />
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <h3>A conversa começa com uma leitura</h3>
            <p>Seja a primeira pessoa a compartilhar uma impressão sobre este capítulo.</p>
          </div>
        )}

        <ChapterCommentComposer
          chapterId={chapterId}
          signedIn={signedIn}
          onCommentCreated={setNotice}
        />

        {notice && (
          <p className="action-feedback" role="status" aria-live="polite">
            {notice}
          </p>
        )}
      </section>
    </>
  );
}
