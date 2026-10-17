'use client';

import { useState, useTransition } from 'react';
import { formatVideoTimestamp } from '@/lib/community-navigation';
import { sendClubMessageAction } from '@/features/discussions/actions';
import type { ClubMessageView } from '@/features/discussions/types';

interface MessageComposerProps {
  channelId: string;
  replyToMessage: ClubMessageView | null;
  initialVideoSec?: number | null;
  onClearReply: () => void;
  onMessageSent: (sent: ClubMessageView) => void;
}

export function MessageComposer({
  channelId,
  replyToMessage,
  initialVideoSec,
  onClearReply,
  onMessageSent,
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [videoSec, setVideoSec] = useState<number | null>(
    typeof initialVideoSec === 'number' && initialVideoSec >= 0 ? initialVideoSec : null,
  );
  const [clientMessageId, setClientMessageId] = useState<string>(() => crypto.randomUUID());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleContentChange = (value: string) => {
    setContent(value);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) {
      setErrorMessage('Escreva uma mensagem antes de enviar.');
      return;
    }

    const activeClientId = clientMessageId;
    startTransition(async () => {
      const res = await sendClubMessageAction({
        channelId,
        clientMessageId: activeClientId,
        content: trimmed,
        replyToId: replyToMessage?.id ?? null,
        videoSec,
      });

      if (res.ok && res.sent) {
        setContent('');
        setVideoSec(null);
        setClientMessageId(crypto.randomUUID());
        setErrorMessage(null);
        onClearReply();
        onMessageSent(res.sent);
      } else {
        setErrorMessage(res.message ?? 'Não foi possível enviar sua mensagem.');
      }
    });
  };

  return (
    <form className="club-message-composer" onSubmit={handleSubmit}>
      {(replyToMessage || videoSec !== null) && (
        <div className="composer-context-bar">
          {replyToMessage && (
            <div className="composer-context-chip">
              <span>
                Respondendo a <strong>{replyToMessage.authorName}</strong>:{' '}
                {replyToMessage.content.slice(0, 60)}
                {replyToMessage.content.length > 60 ? '…' : ''}
              </span>
              <button
                type="button"
                className="composer-chip-close"
                onClick={onClearReply}
                aria-label="Cancelar resposta"
              >
                ✕
              </button>
            </div>
          )}
          {videoSec !== null && (
            <div className="composer-context-chip">
              <span>Trecho do vídeo: {formatVideoTimestamp(videoSec)}</span>
              <button
                type="button"
                className="composer-chip-close"
                onClick={() => setVideoSec(null)}
                aria-label="Remover marcação de tempo do vídeo"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      <div className="composer-input-row">
        <label htmlFor={`composer-textarea-${channelId}`} className="sr-only">
          Sua mensagem para o canal
        </label>
        <textarea
          id={`composer-textarea-${channelId}`}
          className="composer-textarea"
          rows={3}
          maxLength={4000}
          placeholder="Compartilhe sua reflexão, dúvida ou destaque da leitura…"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          disabled={isPending}
          required
        />
      </div>

      {errorMessage && (
        <p className="field-hint" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="composer-footer-row">
        <span className="field-hint">{content.length}/4000 caracteres</span>
        <button type="submit" className="btn btn-primary btn-sm" disabled={isPending}>
          {isPending ? 'Enviando…' : 'Enviar mensagem'}
        </button>
      </div>
    </form>
  );
}
