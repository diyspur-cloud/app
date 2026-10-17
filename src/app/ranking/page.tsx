import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ranking da Temporada | DIYSPUR',
  description: 'Acompanhe o ranking de XP da temporada e a evolução da comunidade de leitores DIYSPUR.',
};

type RankingRow = {
  user_id: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  season_xp: number | null;
  position: number | null;
};

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  if (tipo === 'livros') {
    redirect('/ranking/livros');
  }

  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  const viewerId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;

  const { data: season } = await client
    .from('seasons')
    .select('id,title')
    .eq('status', 'active')
    .order('number', { ascending: true })
    .limit(1)
    .maybeSingle();

  const rankingResult = season
    ? await client
        .from('v_season_ranking')
        .select('user_id,display_name,username,avatar_url,season_xp,position')
        .eq('season_id', season.id)
        .order('position', { ascending: true })
        .limit(50)
    : { data: [] as RankingRow[], error: null };

  const rows = (rankingResult.data ?? []) as RankingRow[];
  const error = rankingResult.error;

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Comunidade DIYSPUR</span>
        <h1>
          Ranking da<br />
          <em>temporada.</em>
        </h1>
        <p>
          {season
            ? `${season.title} · XP por quiz, progresso e participação autorizada.`
            : 'O ranking de membros é computado a partir das atividades na temporada ativa.'}
        </p>

        {/* Regras de Concessão de XP */}
        <div
          style={{
            marginBlock: '16px',
            padding: '16px',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: 'var(--text-body-sm)',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px' }}>Como ganhar XP na temporada:</strong>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)' }}>
            <li><strong>Concluir um capítulo:</strong> 20 XP por capítulo.</li>
            <li><strong>Participar da discussão do capítulo:</strong> 30 XP por mensagem no canal.</li>
            <li><strong>Responder ao quiz:</strong> 50 XP, uma vez por capítulo.</li>
            <li><strong>Bônus diário de atividade:</strong> 25 XP, mediante leitura ou participação real registrada.</li>
            <li><strong>Presença confirmada em encontro:</strong> 30 XP, após confirmação da moderação.</li>
          </ul>
        </div>

        {/* Abas do Ranking */}
        <nav className="ranking-tabs" aria-label="Navegação entre rankings">
          <Link href="/ranking" aria-current="page">
            ✦ XP da Temporada
          </Link>
          <Link href="/ranking/livros">
            📖 Rankings de Livros (Mais lidos & Desistências)
          </Link>
        </nav>
      </header>

      {!viewerId && (
        <div className="notice" style={{ marginBlock: '16px' }}>
          Você está visualizando o ranking como visitante.{' '}
          <Link href="/entrar?redirect=/ranking" className="text-link">
            Faça login para acumular XP e ver sua posição
          </Link>.
        </div>
      )}

      {error ? (
        <div className="notice" role="alert">
          Não foi possível carregar o ranking no momento. Tente atualizar a página.
        </div>
      ) : rows.length ? (
        <ol className="ranking-list" aria-label="Ranking da temporada">
          {rows.map((row, index) => (
            <li
              className={`ranking-row${row.user_id === viewerId ? ' ranking-row-current' : ''}`}
              key={row.user_id ?? `rank-${index}`}
            >
              <span className="ranking-position">{row.position ?? index + 1}</span>
              <div className="ranking-person">
                <strong>{row.display_name || row.username || 'Leitor(a)'}</strong>
                {row.username && <span className="field-hint">@{row.username}</span>}
              </div>
              <span className="status-pill">{row.season_xp ?? 0} XP</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-state">
          <div className="empty-state-mark" aria-hidden="true">✦</div>
          <h2>Ainda não há posições registradas</h2>
          <p>As posições aparecem quando a temporada registrar as primeiras atividades de leitura e quiz.</p>
          <div className="empty-actions">
            <Link className="button button-dark button-small" href="/livros">
              Escolher uma leitura
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
