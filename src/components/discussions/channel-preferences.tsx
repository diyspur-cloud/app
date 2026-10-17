'use client';

import { useState, useTransition } from 'react';
import { setChannelPreferenceAction } from '@/features/discussions/actions';
import type { ChannelPreferenceMode } from '@/features/discussions/types';

const MODE_LABELS: Record<ChannelPreferenceMode, string> = {
  muted: 'Silenciado',
  mentions: 'Apenas menções e respostas',
  following: 'Todas as atividades',
};

interface ChannelPreferencesProps {
  channelId: string;
  clubSlug: string;
  channelSlug: string;
  initialMode: ChannelPreferenceMode;
}

export function ChannelPreferencesControl({
  channelId,
  clubSlug,
  channelSlug,
  initialMode,
}: ChannelPreferencesProps) {
  const [mode, setMode] = useState<ChannelPreferenceMode>(initialMode);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (nextMode: ChannelPreferenceMode) => {
    setMode(nextMode);
    setFeedback(null);
    startTransition(async () => {
      const res = await setChannelPreferenceAction({
        channelId,
        mode: nextMode,
        clubSlug,
        channelSlug,
      });
      if (!res.ok) {
        setMode(initialMode);
        setFeedback(res.message ?? 'Erro ao salvar.');
      } else {
        setFeedback('Salvo');
      }
    });
  };

  return (
    <div className="channel-pref-control">
      <label htmlFor={`channel-pref-${channelId}`} className="field-hint">
        Alertas deste canal:
      </label>
      <select
        id={`channel-pref-${channelId}`}
        className="channel-pref-select"
        value={mode}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as ChannelPreferenceMode)}
      >
        {(Object.keys(MODE_LABELS) as ChannelPreferenceMode[]).map((key) => (
          <option key={key} value={key}>
            {MODE_LABELS[key]}
          </option>
        ))}
      </select>
      {feedback && (
        <span className="field-hint" role="status" aria-live="polite">
          {feedback}
        </span>
      )}
    </div>
  );
}
