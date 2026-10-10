import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/clients';

export const metadata: Metadata = { title: 'Administração', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const client = await createServerSupabase();
  const { data: claims } = await client.auth.getClaims();
  if (typeof claims?.claims?.sub !== 'string') redirect('/entrar?redirect=/admin');
  const { data: authorized, error } = await client.rpc('is_admin');
  if (error || authorized !== true) return <section className="container"><header className="page-intro"><span className="eyebrow">Área restrita</span><h1>Acesso somente para a equipe.</h1></header><div className="notice">Seu perfil não possui autorização administrativa. O acesso foi negado no servidor.</div></section>;
  return <section className="container"><header className="page-intro"><span className="eyebrow">Equipe editorial</span><h1>Painel de administração</h1></header><div className="notice">Gerenciamento editorial requer operações administrativas no backend; nenhum privilégio de escrita é concedido pelo cliente público.</div></section>;
}
