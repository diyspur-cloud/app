'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: 'global' },
      extra: { nextDigest: error.digest },
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main>
          <h1>Não foi possível abrir o DIYSPUR agora.</h1>
          <p>Tente novamente. Se o problema continuar, fale com o suporte.</p>
          <button type="button" onClick={() => reset()}>
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
