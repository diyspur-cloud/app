'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { saveChapterProgress } from '@/features/chapters/actions';

export interface ChapterProgressProps {
  chapterId: string;
  signedIn: boolean;
  initialPercent: number;
  status?: string;
  onProgressUpdated?: (notice: string) => void;
}

export function ChapterProgress({
  chapterId,
  signedIn,
  initialPercent,
  status,
  onProgressUpdated,
}: ChapterProgressProps) {
  const router = useRouter();
  const [percent, setPercent] = useState(initialPercent);
  const [busy, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function updateProgress(nextStatus: 'reading' | 'read') {
    startTransition(async () => {
      const result = await saveChapterProgress({
        chapterId,
        status: nextStatus,
        percent: nextStatus === 'read' ? 100 : percent,
      });
      const msg = result.ok ? result.message ?? 'Progresso salvo.' : result.message;
      setNotice(msg);
      if (onProgressUpdated) onProgressUpdated(msg);
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
        {notice && (
          <p className="field-hint" role="status" style={{ marginTop: '0.25rem' }}>
            {notice}
          </p>
        )}
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
