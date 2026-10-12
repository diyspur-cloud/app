'use client';

import { useState, useTransition } from 'react';
import { createBook, hideReportedContent, reviewReport, updateBook, updateChapter, updateMeeting, updatePoll, updateSeason, type AdminResult } from '@/app/admin/actions';

function Feedback({ result }: { result: AdminResult | null }) { return result ? <p className={result.ok ? 'action-feedback' : 'action-feedback'} role="status">{result.message}</p> : null; }

export function BookCreator({ authors }: { authors: Array<{ id: string; name: string }> }) {
  const [result, setResult] = useState<AdminResult | null>(null);
  const [busy, start] = useTransition();

  return (
    <form
      className="member-card auth-form"
      style={{ marginBottom: '24px' }}
      action={(data) => {
        start(async () => {
          setResult(
            await createBook({
              title: data.get('title'),
              slug: data.get('slug'),
              authorId: data.get('authorId'),
              synopsis: data.get('synopsis'),
              coverUrl: data.get('coverUrl') || '',
              totalPages: data.get('totalPages') ? Number(data.get('totalPages')) : null,
            })
          );
        });
      }}
    >
      <h2>Cadastrar novo livro</h2>
      <label>
        Título
        <input className="field" name="title" required placeholder="Ex.: O massacre da família Hope" />
      </label>
      <label>
        Slug (URL)
        <input className="field" name="slug" required placeholder="Ex.: o-massacre-da-familia-hope" />
      </label>
      <label>
        Autor(a)
        <select className="field" name="authorId" required defaultValue="">
          <option value="" disabled>Selecione um autor...</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sinopse
        <textarea className="field" name="synopsis" rows={4} placeholder="Breve apresentação da obra..." />
      </label>
      <label>
        Capa (URL HTTPS)
        <input className="field" name="coverUrl" type="url" placeholder="https://..." />
      </label>
      <label>
        Páginas
        <input className="field" name="totalPages" type="number" min="1" placeholder="Ex.: 400" />
      </label>
      <button className="button button-small" disabled={busy}>
        {busy ? 'Cadastrando…' : 'Cadastrar livro'}
      </button>
      <Feedback result={result} />
    </form>
  );
}
export function BookEditor({ book }: { book: { id: string; title: string; synopsis: string | null; cover_url: string | null; total_pages: number | null } }) {
  const [result, setResult] = useState<AdminResult | null>(null); const [busy, start] = useTransition();
  return <form className="member-card auth-form" action={(data) => { start(async () => setResult(await updateBook({ id: book.id, title: data.get('title'), synopsis: data.get('synopsis'), coverUrl: data.get('coverUrl'), totalPages: data.get('totalPages') || null }))); }}><h2>{book.title}</h2><label>Título<input className="field" name="title" defaultValue={book.title} /></label><label>Sinopse<textarea className="field" name="synopsis" rows={4} defaultValue={book.synopsis ?? ''} /></label><label>Capa (URL)<input className="field" name="coverUrl" type="url" defaultValue={book.cover_url ?? ''} /></label><label>Páginas<input className="field" name="totalPages" type="number" min="0" defaultValue={book.total_pages ?? ''} /></label><button className="button button-small" disabled={busy}>{busy ? 'Salvando…' : 'Salvar livro'}</button><Feedback result={result} /></form>;
}
export function SeasonEditor({ season }: { season: { id: string; title: string; description: string | null; status: 'planned'|'enrolling'|'active'|'finished' } }) {
  const [result, setResult] = useState<AdminResult | null>(null); const [busy, start] = useTransition();
  return <form className="member-card auth-form" action={(data) => { start(async () => setResult(await updateSeason({ id: season.id, title: data.get('title'), description: data.get('description'), status: data.get('status') }))); }}><h2>{season.title}</h2><label>Título<input className="field" name="title" defaultValue={season.title} /></label><label>Descrição<textarea className="field" name="description" rows={4} defaultValue={season.description ?? ''} /></label><label>Status<select className="field" name="status" defaultValue={season.status}><option value="planned">Planejada</option><option value="enrolling">Inscrições</option><option value="active">Ativa</option><option value="finished">Finalizada</option></select></label><button className="button button-small" disabled={busy}>{busy ? 'Salvando…' : 'Salvar temporada'}</button><Feedback result={result} /></form>;
}
export function toLocalDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ChapterEditor({ chapter }: { chapter: { id: string; title: string; reading_range: string | null; summary: string | null; youtube_url: string | null; published_at: string | null } }) {
  const [result, setResult] = useState<AdminResult | null>(null); const [busy, start] = useTransition();
  return <form className="member-card auth-form" action={(data) => { start(async () => setResult(await updateChapter({ id: chapter.id, title: data.get('title'), readingRange: data.get('readingRange'), summary: data.get('summary'), youtubeUrl: data.get('youtubeUrl'), publishedAt: data.get('publishedAt') ? new Date(String(data.get('publishedAt'))).toISOString() : null }))); }}><h3>{chapter.title}</h3><label>Título<input className="field" name="title" defaultValue={chapter.title} /></label><label>Leitura<input className="field" name="readingRange" defaultValue={chapter.reading_range ?? ''} /></label><label>Resumo<textarea className="field" name="summary" rows={3} defaultValue={chapter.summary ?? ''} /></label><label>Replay (URL)<input className="field" name="youtubeUrl" type="url" defaultValue={chapter.youtube_url ?? ''} /></label><label>Publicar em<input className="field" name="publishedAt" type="datetime-local" defaultValue={toLocalDateTime(chapter.published_at)} /></label><button className="button button-small" disabled={busy}>{busy ? 'Salvando…' : 'Salvar capítulo'}</button><Feedback result={result} /></form>;
}
export function StatusControl({ kind, id, status }: { kind: 'meeting'|'poll'; id: string; status: string }) {
  const [result, setResult] = useState<AdminResult | null>(null); const [busy, start] = useTransition();
  const options = kind === 'meeting' ? [['scheduled','Agendado'],['live','Ao vivo'],['done','Encerrado'],['cancelled','Cancelado']] : [['open','Aberta'],['closed','Fechada']];
  return <div className="admin-inline-control"><select className="field" defaultValue={status} onChange={(e) => start(async () => setResult(kind === 'meeting' ? await updateMeeting({ id, status: e.target.value }) : await updatePoll({ id, status: e.target.value })))} disabled={busy}>{options.map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select><Feedback result={result} /></div>;
}
export function ReportControl({ id }: { id: string }) { const [result, setResult] = useState<AdminResult | null>(null); const [busy, start] = useTransition(); return <div className="chapter-progress-actions"><button className="button button-small" disabled={busy} onClick={() => start(async () => setResult(await hideReportedContent({ id })))}>Ocultar e resolver</button><button className="button button-quiet button-small" disabled={busy} onClick={() => start(async () => setResult(await reviewReport({ id, status: 'resolved' })))}>Resolver</button><button className="button button-quiet button-small" disabled={busy} onClick={() => start(async () => setResult(await reviewReport({ id, status: 'dismissed' })))}>Dispensar</button><Feedback result={result} /></div>; }
