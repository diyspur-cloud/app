'use client';

import Link from 'next/link';

export default function ClubChannelError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container section" role="alert">
      <div className="member-card">
        <span className="eyebrow">Ops, algo falhou</span>
        <h1>Não foi possível carregar este canal agora</h1>
        <p>Tente recarregar a conversa ou volte para a página de clubes.</p>
        <div className="empty-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => reset()}>
            Tentar novamente
          </button>
          <Link href="/clubes" className="btn btn-secondary btn-sm">
            Voltar para clubes
          </Link>
        </div>
      </div>
    </div>
  );
}
