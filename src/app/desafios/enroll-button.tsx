'use client';

import { useState, useTransition } from 'react';
import { joinChallenge } from './actions';

export function EnrollButton({ challengeId }: { challengeId: string }) {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 16 }}>
      <button
        className="button button-small"
        type="button"
        disabled={busy}
        onClick={() => startTransition(async () => {
          const result = await joinChallenge(challengeId);
          setMessage(result.message);
        })}
      >
        {busy ? 'Inscrevendo…' : 'Participar do desafio'}
      </button>
      {message && <p className="field-hint" role="status" style={{ marginTop: 8 }}>{message}</p>}
    </div>
  );
}
