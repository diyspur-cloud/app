import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Administração', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  if (typeof claims?.claims?.sub !== 'string') redirect('/entrar?redirect=/admin');
  const { data: authorized, error } = await client.rpc('is_admin');
  if (error || authorized !== true) return <section className="container"><header className="page-intro"><span className="eyebrow">Área restrita</span><h1>Acesso somente para a equipe.</h1></header><div className="notice">Seu perfil não possui autorização administrativa. O acesso foi negado no servidor.</div></section>;
  return <section className="container"><header className="page-intro"><span className="eyebrow">Equipe editorial</span><h1>Painel de administração</h1><p>Conteúdo, comunidade e agenda em um único lugar, com autorização no servidor.</p></header><div className="season-list"><Link className="member-card" href="/admin/books"><h2>Livros</h2><p>Ficha, sinopse, capa e paginação.</p></Link><Link className="member-card" href="/admin/moderation"><h2>Moderação</h2><p>Denúncias, ocultação e histórico de revisão.</p></Link><p className="notice">Abra uma temporada pelo editor para publicar capítulos, agendar replay e revisar o conteúdo antes de colocá-lo no ar.</p></div></section>;
}
