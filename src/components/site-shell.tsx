import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/clients';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav } from '@/components/desktop-nav';
import { MobileNav } from '@/components/mobile-nav';

export async function SiteHeader() {
  let signedIn = false;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = await createServerSupabase();
      const { data } = await supabase.auth.getClaims();
      signedIn = Boolean(data?.claims);
    } catch {
      signedIn = false;
    }
  }

  return (
    <header className="site-header" id="site-nav">
      <div className="nav-wrap">
        <Link href="/" className="wordmark" aria-label="DIYSPUR — início">
          <span className="wordmark-icon" aria-hidden="true">d</span>
          <span className="wordmark-text">diyspur<span className="wordmark-period">.</span></span>
        </Link>
        <DesktopNav signedIn={signedIn} />
        <div className="nav-actions">
          <ThemeToggle />
          {signedIn ? (
            <>
              <Link className="nav-signin" href="/perfil">Meu espaço</Link>
              <form action="/auth/signout" method="post">
                <button className="btn btn-ghost btn-sm" type="submit">Sair</button>
              </form>
            </>
          ) : (
            <>
              <Link className="nav-signin" href="/entrar">Entrar</Link>
              <Link className="btn btn-primary btn-sm nav-cta" href="/cadastro">
                Fazer parte <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
          <MobileNav signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Link href="/" className="wordmark" aria-label="DIYSPUR — início">
          <span className="wordmark-icon" aria-hidden="true">d</span>
          <span className="wordmark-text">diyspur<span className="wordmark-period">.</span></span>
        </Link>
        <p>Histórias ficam melhores quando são compartilhadas.</p>
        <div className="footer-links">
          <Link href="/privacidade">Privacidade</Link>
          <Link href="/termos">Termos</Link>
          <a href="mailto:oi@diyspur.com">Suporte</a>
        </div>
        <p className="footer-affiliate-note" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', margin: '8px 0 0', textAlign: 'center', maxWidth: '580px' }}>
          O DIYSPUR participa do Programa de Associados da Amazon. Compras qualificadas geram comissão que apoia a manutenção do clube sem custo adicional para o leitor.
        </p>
        <span className="footer-year">© {new Date().getFullYear()} DIYSPUR</span>
      </div>
    </footer>
  );
}
