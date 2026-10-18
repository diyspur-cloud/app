import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/clients';
import { ThemeToggle } from '@/components/theme-toggle';
import { DesktopNav } from '@/components/desktop-nav';
import { MobileNav } from '@/components/mobile-nav';
import { NotificationHeader } from '@/components/notifications/notification-header';
import { supportEmail } from '@/lib/site-contact';

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
              <Link className="nav-signin nav-signin-desktop" href="/perfil">Meu espaço</Link>
              <NotificationHeader />
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

        {/* Links institucionais com ícones */}
        <div className="footer-links">
          <Link href="/privacidade" className="footer-link">
            <svg className="footer-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            <span>Privacidade</span>
          </Link>
          <Link href="/termos" className="footer-link">
            <svg className="footer-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>Termos</span>
          </Link>
          <a href={`mailto:${supportEmail}`} className="footer-link">
            <svg className="footer-link-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Suporte</span>
          </a>
        </div>

        {/* Redes Sociais com ícones animados */}
        <div className="footer-social-links" aria-label="Redes sociais do DIYSPUR">
          <a
            href="https://www.instagram.com/diyspur/?hl=en"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn footer-social-instagram"
            aria-label="Instagram DIYSPUR"
          >
            <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
            <span className="social-label">Instagram</span>
          </a>
          <a
            href="https://www.tiktok.com/@diyspur"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn footer-social-tiktok"
            aria-label="TikTok DIYSPUR"
          >
            <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
            </svg>
            <span className="social-label">TikTok</span>
          </a>
          <a
            href="https://www.youtube.com/channel/UC71Z6wmNZSuuMbC0_mHm6iw"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-btn footer-social-youtube"
            aria-label="YouTube DIYSPUR"
          >
            <svg className="social-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/>
            </svg>
            <span className="social-label">YouTube</span>
          </a>
        </div>

        <p className="footer-affiliate-note" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', margin: '8px 0 0', textAlign: 'center', maxWidth: '580px' }}>
          O DIYSPUR participa do Programa de Associados da Amazon. Compras qualificadas geram comissão que apoia a manutenção do clube sem custo adicional para o leitor.
        </p>
        <span className="footer-year">© {new Date().getFullYear()} DIYSPUR</span>
      </div>
    </footer>
  );
}
