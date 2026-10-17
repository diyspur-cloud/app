import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getBooksReadingRanking } from '@/features/rankings/queries';
import { createServerSupabase } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ranking da Comunidade | DIYSPUR',
  description: 'Acompanhe o ranking de XP da temporada e a lista dos livros mais lidos pelos membros do DIYSPUR.',
  robots: { index: false, follow: false },
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
  const isBooksTab = tipo === 'livros';

  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  const viewerId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;
  if (!viewerId) redirect('/entrar?redirect=/ranking');

  const { data: season } = await client
    .from('seasons')
    .select('id,title')
    .eq('status', 'active')
    .order('number', { ascending: true })
    .limit(1)
    .maybeSingle();

  const [rankingResult, rankedBooks] = await Promise.all([
    !isBooksTab && season
      ? client
          .from('v_season_ranking')
          .select('user_id,display_name,username,avatar_url,season_xp,position')
          .eq('season_id', season.id)
          .order('position', { ascending: true })
          .limit(50)
      : Promise.resolve({ data: [] as RankingRow[], error: null }),
    isBooksTab ? getBooksReadingRanking(50) : Promise.resolve([]),
  ]);

  const rows = (rankingResult.data ?? []) as RankingRow[];
  const error = rankingResult.error;

  return (
    <section className="container">
      <header className="page-intro">
        <span className="eyebrow">Comunidade DIYSPUR</span>
        <h1>
          Rankings da<br />
          <em>comunidade.</em>
        </h1>
        <p>
          {isBooksTab
            ? 'Os livros mais lidos, em andamento e debatidos pelos membros do clube.'
            : season
              ? `${season.title} · XP por quiz, progresso e participação autorizada.`
              : 'O próximo ranking de membros será aberto junto com uma temporada ativa.'}
        </p>

        {/* Abas de Navegação do Ranking */}
        <nav
          className="tabs-nav flex gap-2 border-b border-border mt-6"
          role="tablist"
          aria-label="Tipo de ranking"
        >
          <Link
            href="/ranking"
            role="tab"
            aria-selected={!isBooksTab}
            className={`tab-item px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              !isBooksTab
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            ✦ XP da Temporada
          </Link>
          <Link
            href="/ranking?tipo=livros"
            role="tab"
            aria-selected={isBooksTab}
            className={`tab-item px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              isBooksTab
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            📖 Livros Mais Lidos
          </Link>
        </nav>
      </header>

      {isBooksTab ? (
        rankedBooks.length ? (
          <ol className="ranking-list mt-6" aria-label="Ranking de livros mais lidos">
            {rankedBooks.map((book) => (
              <li className="ranking-row" key={book.bookId}>
                <span className="ranking-position">{book.rankPosition}</span>
                {book.coverUrl ? (
                  <div className="w-10 h-14 relative flex-shrink-0 rounded overflow-hidden">
                    <Image
                      src={book.coverUrl}
                      alt={`Capa de ${book.title}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-14 bg-muted flex items-center justify-center text-xs rounded text-muted-foreground flex-shrink-0">
                    📖
                  </div>
                )}
                <div className="ranking-person flex-1 min-w-0">
                  <Link
                    href={`/livros/${book.slug}`}
                    className="font-semibold text-foreground hover:underline truncate block"
                  >
                    {book.title}
                  </Link>
                  <span className="field-hint text-xs">{book.authorName}</span>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="status-pill">{book.completedReaders} leitores</span>
                  <span className="field-hint text-muted-foreground">
                    {book.activeReaders} lendo agora
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state">
            <div className="empty-state-mark" aria-hidden="true">📖</div>
            <h2>Ainda não há livros no ranking</h2>
            <p>Conforme os leitores marcarem suas leituras na página dos livros, o ranking será computado.</p>
            <div className="empty-actions">
              <Link className="button button-dark button-small" href="/livros">
                Explorar catálogo de leituras
              </Link>
            </div>
          </div>
        )
      ) : error ? (
        <div className="notice" role="alert">
          Não foi possível carregar o ranking agora. Tente atualizar a página.
        </div>
      ) : rows.length ? (
        <ol className="ranking-list mt-6" aria-label="Ranking da temporada">
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
          <h2>Ainda não há posições</h2>
          <p>As posições aparecem quando a temporada registrar as primeiras atividades de leitura.</p>
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
