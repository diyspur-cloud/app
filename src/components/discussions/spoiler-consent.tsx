'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  acceptChannelSpoilersAction,
  revokeChannelSpoilersAction,
} from '@/features/discussions/actions';

interface SpoilerConsentGateProps {
  channelId: string;
  channelName: string;
  rulesVersion: number;
  clubSlug: string;
  channelSlug: string;
}

export function SpoilerConsentGate({
  channelId,
  channelName,
  rulesVersion,
  clubSlug,
  channelSlug,
}: SpoilerConsentGateProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await acceptChannelSpoilersAction({
        channelId,
        rulesVersion,
        clubSlug,
        channelSlug,
      });
      if (res.ok) {
        router.refresh();
      } else {
        setErrorMessage(res.message ?? 'Não foi possível liberar o canal.');
      }
    });
  };

  return (
    <div className="member-card spoiler-consent-card" role="region" aria-labelledby="spoiler-gate-title">
      <span className="eyebrow">Aviso de Spoilers</span>
      <h2 id="spoiler-gate-title">O canal #{channelName} permite spoilers completos</h2>
      <p>
        Aqui os leitores conversam livremente sobre toda a obra, reviravoltas e desfechos sem
        máscara de spoiler. Para proteger sua experiência de leitura, confirme que deseja visualizar
        as mensagens deste canal.
      </p>
      {errorMessage && (
        <p className="field-hint" role="alert">
          {errorMessage}
        </p>
      )}
      <div className="empty-actions" style={{ marginTop: '1rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAccept}
          disabled={isPending}
        >
          {isPending ? 'Liberando canal…' : 'Entendi, mostrar conversas com spoilers'}
        </button>
      </div>
    </div>
  );
}

export function RevokeSpoilerConsentButton({
  channelId,
  clubSlug,
  channelSlug,
}: {
  channelId: string;
  clubSlug: string;
  channelSlug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    startTransition(async () => {
      const res = await revokeChannelSpoilersAction({
        channelId,
        clubSlug,
        channelSlug,
      });
      if (res.ok) {
        router.refresh();
      }
    });
  };

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={handleRevoke}
      disabled={isPending}
    >
      {isPending ? 'Ocultando…' : 'Ocultar spoilers novamente'}
    </button>
  );
}
