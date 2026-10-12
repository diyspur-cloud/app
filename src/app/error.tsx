'use client';

import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: { boundary: 'app-route' },
      extra: { nextDigest: error.digest },
    });
  }, [error]);

  return (
    <section className="container section">
      <div className="empty-state">
        <span className="eyebrow">Algo saiu do roteiro</span>
        <h1 className="display-title">
          Vamos tentar <em>de novo.</em>
        </h1>
        <p>Não foi possível carregar esta página agora. Tente novamente em instantes.</p>
        <div className="empty-actions">
          <button className="button" onClick={() => reset()}>
            Tentar novamente
          </button>
          <Link className="button button-quiet" href="mailto:suporte@diyspur.com">
            Falar com o suporte
          </Link>
        </div>
      </div>
    </section>
  );
}
