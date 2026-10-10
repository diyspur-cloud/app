import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/clients';

export const metadata: Metadata = { title: 'Ranking', robots: { index: false, follow: false } };

type RankingRow = { user_id: string | null; display_name: string | null; username: string | null; avatar_url: string | null; season_xp: number | null; position: number | null };

export default async function RankingPage() {
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  const viewerId = typeof claims?.claims?.sub === 'string' ? claims.claims.sub : null;
  if (!viewerId) redirect('/entrar?redirect=/ranking');
  const { data: season } = await client.from('seasons').select('id,title').eq('status', 'active').order('number', { ascending: true }).limit(1).maybeSingle();
  const { data: ranking, error } = season ? await client.from('v_season_ranking').select('user_id,display_name,username,avatar_url,season_xp,position').eq('season_id', season.id).order('position', { ascending: true }).limit(50) : { data: [], error: null };
  const rows = (ranking ?? []) as RankingRow[];
  return <section className="container"><header className="page-intro"><span className="eyebrow">Leitores em movimento</span><h1>O ranking começa<br /><em style={{ color: 'var(--color-primary)' }}>com a leitura.</em></h1><p>{season ? `${season.title} · XP por quiz, progresso e participação autorizada.` : 'O próximo ranking será aberto junto com uma temporada ativa.'}</p></header>{error ? <div className="notice" role="alert">Não foi possível carregar o ranking agora. Tente atualizar a página.</div> : rows.length ? <ol className="ranking-list" aria-label="Ranking da temporada">{rows.map((row, index) => <li className={`ranking-row${row.user_id === viewerId ? ' ranking-row-current' : ''}`} key={row.user_id ?? `rank-${index}`}><span className="ranking-position">{row.position ?? index + 1}</span><div className="ranking-person"><strong>{row.display_name || row.username || 'Leitor(a)'}</strong>{row.username && <span className="field-hint">@{row.username}</span>}</div><span className="status-pill">{row.season_xp ?? 0} XP</span></li>)}</ol> : <div className="empty-state"><div className="empty-state-mark" aria-hidden="true">✦</div><h2>Ainda não há posições</h2><p>As posições aparecem quando a temporada registrar as primeiras atividades de leitura.</p><div className="empty-actions"><a className="button button-dark button-small" href="/livros">Escolher uma leitura</a></div></div>}</section>;
}
