'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { createChapterComment, deleteChapterComment, editChapterComment, saveChapterProgress } from '@/features/chapters/actions';

type VisibleComment = { id: string; user_id: string; content: string | null; is_spoiler: boolean; is_locked: boolean; created_at: string };

export function ChapterInteractions({ chapterId, signedIn, viewerId, progress, comments }: {
  chapterId: string;
  signedIn: boolean;
  viewerId: string | null;
  progress: { status: string; percent: number | null } | null;
  comments: VisibleComment[];
}) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [notice, setNotice] = useState('');
  const [percent, setPercent] = useState(progress?.percent ?? 0);
  const [spoiler, setSpoiler] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function updateProgress(status: 'reading' | 'read') {
    setNotice('');
    startTransition(async () => {
      const result = await saveChapterProgress({ chapterId, status, percent: status === 'read' ? 100 : percent });
      setNotice(result.ok ? result.message ?? 'Progresso salvo.' : result.message);
      if (result.ok) router.refresh();
    });
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = String(new FormData(form).get('content') ?? '');
    const minPercentRaw = String(new FormData(form).get('minPercent') ?? '100');
    setNotice('');
    startTransition(async () => {
      const result = await createChapterComment({ chapterId, content, isSpoiler: spoiler, minPercent: spoiler ? Number(minPercentRaw) : 0 });
      setNotice(result.ok ? result.message ?? 'Comentário publicado.' : result.message);
      if (result.ok) { form.reset(); setSpoiler(false); router.refresh(); }
    });
  }

  function saveEdit(commentId: string) {
    setNotice('');
    startTransition(async () => {
      const result = await editChapterComment({ commentId, chapterId, content: editText });
      setNotice(result.ok ? 'Comentário atualizado.' : result.message);
      if (result.ok) { setEditingId(null); router.refresh(); }
    });
  }

  function removeComment(commentId: string) {
    setNotice('');
    startTransition(async () => {
      const result = await deleteChapterComment({ commentId, chapterId });
      setNotice(result.ok ? 'Comentário removido.' : result.message);
      if (result.ok) router.refresh();
    });
  }

  return <>
    <section className="chapter-progress" aria-labelledby="progress-heading">
      <div><span className="eyebrow">Seu ritmo</span><h2 id="progress-heading">Progresso deste capítulo</h2><p>{progress?.status === 'read' ? 'Você marcou este capítulo como concluído.' : progress?.status === 'reading' ? `Este capítulo está em andamento (${percent}%).` : 'Seu progresso fica visível apenas para você.'}</p>{signedIn && progress?.status !== 'read' && <label className="progress-slider" htmlFor="chapter-percent"><span>Avanço estimado: {percent}%</span><input id="chapter-percent" type="range" min="0" max="99" step="1" value={percent} onChange={(event) => setPercent(Number(event.target.value))} onMouseUp={() => updateProgress('reading')} onTouchEnd={() => updateProgress('reading')} /></label>}</div>
      {signedIn ? <div className="chapter-progress-actions"><button className="button button-quiet button-small" type="button" disabled={busy} onClick={() => updateProgress('reading')}>Estou lendo</button><button className="button button-small" type="button" disabled={busy} onClick={() => updateProgress('read')}>Concluir capítulo</button></div> : <Link className="button button-small" href={`/entrar?redirect=${encodeURIComponent(`/capitulos/${chapterId}`)}`}>Entre para salvar</Link>}
    </section>
    <section className="chapter-discussion" aria-labelledby="discussion-heading">
      <div className="section-head"><div><span className="eyebrow">Juntos na leitura</span><h2 id="discussion-heading">O que ficou com você?</h2></div></div>
      {comments.length ? <ul className="comment-list">{comments.map((comment) => <li className="comment-card" key={comment.id}>
        {comment.is_locked || comment.content === null ? <p className="spoiler-locked">Este comentário tem spoiler. Marque progresso suficiente no capítulo para revelar o texto.</p> : comment.is_spoiler ? <details><summary className="text-link">Revelar comentário com spoiler</summary><p>{comment.content}</p></details> : <p>{comment.content}</p>}
        <span className="field-hint">{comment.is_spoiler ? 'Comentário marcado com spoiler' : 'Conversa da comunidade'} · {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(comment.created_at))}</span>
        {signedIn && viewerId === comment.user_id && <div className="comment-actions">
          {editingId === comment.id ? <div className="comment-edit"><label htmlFor={`edit-${comment.id}`}>Editar seu comentário</label><textarea id={`edit-${comment.id}`} value={editText} maxLength={4000} onChange={(event) => setEditText(event.target.value)} /><div className="chapter-progress-actions"><button className="button button-small" type="button" disabled={busy} onClick={() => saveEdit(comment.id)}>Salvar edição</button><button className="button button-quiet button-small" type="button" onClick={() => setEditingId(null)}>Cancelar</button></div></div> : <><button className="button button-quiet button-small" type="button" disabled={busy} onClick={() => { setEditingId(comment.id); setEditText(comment.content ?? ''); }}>Editar</button><button className="button button-quiet button-small" type="button" disabled={busy} onClick={() => removeComment(comment.id)}>Remover</button></>}
        </div>}
      </li>)}</ul> : <div className="empty-state"><h3>A conversa começa com uma leitura</h3><p>Seja a primeira pessoa a compartilhar uma impressão sobre este capítulo.</p></div>}
      {signedIn ? <form className="comment-composer" onSubmit={postComment}>
        <label htmlFor="chapter-comment">Seu comentário</label><textarea id="chapter-comment" name="content" required maxLength={4000} rows={4} placeholder="Compartilhe uma ideia, pergunta ou trecho que marcou você…" />
        <label className="checkbox-line"><input type="checkbox" checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} /> Este comentário contém spoiler</label>
        {spoiler && <div className="field"><label htmlFor="spoiler-percent">Mostrar quando o progresso chegar a</label><select id="spoiler-percent" name="minPercent" defaultValue="100"><option value="25">25%</option><option value="50">50%</option><option value="75">75%</option><option value="100">100% do capítulo</option></select><span className="field-hint">A proteção é aplicada pelo banco, não apenas pela interface.</span></div>}
        <button className="button button-small" disabled={busy} type="submit">{busy ? 'Salvando…' : 'Publicar comentário'}</button>
      </form> : <div className="empty-actions"><Link className="button button-dark button-small" href={`/entrar?redirect=${encodeURIComponent(`/capitulos/${chapterId}`)}`}>Entre para participar</Link></div>}
      <p className="action-feedback" role="status" aria-live="polite">{notice}</p>
    </section>
  </>;
}
