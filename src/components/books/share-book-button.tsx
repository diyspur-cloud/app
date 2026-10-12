'use client';

import { useState } from 'react';

interface ShareBookButtonProps {
  bookTitle: string;
  bookSlug: string;
}

export function ShareBookButton({ bookTitle, bookSlug }: ShareBookButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  async function handleShare() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/livros/${bookSlug}` : `/livros/${bookSlug}`;
    const shareData = {
      title: `Vamos ler "${bookTitle}" juntos no DIYSPUR?`,
      text: `Estou acompanhando o clube de leitura de "${bookTitle}" no DIYSPUR com discussões capítulo a capítulo sem spoilers!`,
      url,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setStatus('copied');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleShare}
        aria-label={`Convidar amigos para ler ${bookTitle} juntos`}
      >
        <span aria-hidden="true">🤝</span>{' '}
        Convidar amigo para ler junto
      </button>
      {status === 'copied' && (
        <span className="field-hint" role="status" style={{ color: 'var(--positive-text)' }}>
          ✓ Link copiado para a área de transferência!
        </span>
      )}
      {status === 'error' && (
        <span className="field-hint" role="alert" style={{ color: 'var(--color-danger, #d32f2f)' }}>
          Não foi possível copiar automaticamente. Acesse a barra de endereço para compartilhar.
        </span>
      )}
    </div>
  );
}
