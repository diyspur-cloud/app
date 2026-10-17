import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ReportControl } from '@/components/admin/admin-controls';
import { createServerSupabase } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Moderação · Administração', robots: { index: false, follow: false } };
export default async function ModerationPage() {
  const client = await createServerSupabase(); const { data: claims } = await client.auth.getClaims(); if (typeof claims?.claims?.sub !== 'string') redirect('/entrar?redirect=/admin/moderation');
  const { data: authorized } = await client.rpc('is_admin'); if (authorized !== true) return <section className="container"><div className="notice">Acesso restrito à equipe editorial.</div></section>;
  const { data: reports, error } = await client.from('content_reports').select('id,content_type,content_id,reason,status,created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(100);
  return <section className="container"><header className="page-intro"><span className="eyebrow">Cuidado com a comunidade</span><h1>Fila de moderação</h1><p>Veja o motivo da denúncia, resolva ou dispense cada caso e mantenha o histórico no banco.</p></header>{error ? <div className="notice" role="alert">Não foi possível carregar a fila agora.</div> : reports?.length ? <div className="timeline">{reports.map((report) => <article className="member-card" key={report.id}><span className="eyebrow">{report.content_type} · {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(report.created_at))}</span><h2>Denúncia {report.content_id}</h2><p>{report.reason}</p><ReportControl id={report.id} /></article>)}</div> : <div className="empty-state"><h2>Fila limpa</h2><p>Não há denúncias pendentes.</p></div>}</section>;
}
