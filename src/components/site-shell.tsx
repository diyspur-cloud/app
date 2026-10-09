import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/clients';

const links = [{ href: '/livros', label: 'Explorar livros' }, { href: '/calendario', label: 'Encontros' }, { href: '/comunidade', label: 'Comunidade' }, { href: '/votacao', label: 'Votação' }];

export async function SiteHeader() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try { const supabase = await createServerSupabase(); const { data } = await supabase.auth.getClaims(); signedIn = Boolean(data?.claims); }
    catch { signedIn = false; }
  }
  return <header className="site-header"><div className="nav-wrap"><Link href="/" className="wordmark" aria-label="DIYSPUR — início"><span className="wordmark-icon" aria-hidden="true">d</span><span>diyspur<span className="wordmark-period">.</span></span></Link><nav className="nav-links" aria-label="Navegação principal">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav><div className="nav-actions">{signedIn ? <><Link className="nav-member" href="/perfil">Meu espaço</Link><form action="/auth/signout" method="post"><button className="button button-quiet button-small" type="submit">Sair</button></form></> : <><Link className="nav-signin" href="/entrar">Entrar</Link><Link className="button button-small" href="/cadastro">Fazer parte <span aria-hidden="true">↗</span></Link></>}</div></div><nav className="mobile-nav" aria-label="Navegação móvel">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav></header>;
}

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-inner"><Link href="/" className="wordmark"><span className="wordmark-icon" aria-hidden="true">d</span><span>diyspur<span className="wordmark-period">.</span></span></Link><p>Histórias ficam melhores quando são compartilhadas.</p><div className="footer-links"><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></div><span className="footer-year">© {new Date().getFullYear()} DIYSPUR</span></div></footer>;
}
