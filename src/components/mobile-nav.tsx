'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { memberLinks } from '@/lib/member-navigation';

export interface NavSection {
  title: string;
  items: { href: string; label: string }[];
}

const defaultSections: NavSection[] = [
  {
    title: 'Explorar',
    items: [
      { href: '/livros', label: 'Explorar livros' },
    ],
  },
  {
    title: 'Comunidade',
    items: [
      { href: '/comunidade', label: 'Clubes e Conversas' },
      { href: '/calendario', label: 'Encontros ao vivo' },
      { href: '/votacao', label: 'Votação do próximo livro' },
    ],
  },
  {
    title: 'Pessoal',
    items: memberLinks.map((link) => ({ href: link.href, label: link.label })),
  },
];

interface MobileNavProps {
  signedIn?: boolean;
}

export function MobileNav({ signedIn = false }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    if (open) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Move focus to first interactive link inside panel
      const timer = window.setTimeout(() => {
        const firstFocusable = panelRef.current?.querySelector<HTMLElement>('a[href], button');
        firstFocusable?.focus();
      }, 50);

      return () => {
        window.clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [open]);

  return (
    <>
      <button
        ref={toggleButtonRef}
        type="button"
        className="mobile-nav-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        )}
      </button>

      <div
        className={`nav-mobile-backdrop ${open ? 'open' : ''}`}
        onClick={() => {
          setOpen(false);
          toggleButtonRef.current?.focus();
        }}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        id="mobile-nav-panel"
        hidden={!open}
        className={`nav-mobile-panel ${open ? 'open' : ''}`}
        role={open ? 'dialog' : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Menu móvel de navegação"
      >
        <div className="nav-mobile-scroll" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 140px)', paddingRight: '4px' }}>
          {defaultSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '20px' }}>
              <span className="eyebrow" style={{ display: 'block', marginBottom: '8px', paddingLeft: '8px' }}>
                {section.title}
              </span>
              <nav className="nav-mobile-links" aria-label={`Seção ${section.title}`}>
                {section.items.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`nav-mobile-link ${isActive ? 'active' : ''}`}
                      onClick={() => setOpen(false)}
                    >
                      <span>{link.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="nav-mobile-actions">
          {signedIn ? (
            <>
              <Link
                href="/perfil"
                className="btn btn-secondary btn-block"
                onClick={() => setOpen(false)}
              >
                Meu espaço
              </Link>
              <Link
                href="/notificacoes"
                className="btn btn-ghost btn-block"
                onClick={() => setOpen(false)}
              >
                Central de notificações
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/cadastro"
                className="btn btn-primary btn-block"
                onClick={() => setOpen(false)}
              >
                Fazer parte do clube ↗
              </Link>
              <Link
                href="/entrar"
                className="btn btn-secondary btn-block"
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
