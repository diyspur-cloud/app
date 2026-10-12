import { describe, it, expect, vi } from 'vitest';
import SignupPage from '@/app/cadastro/page';
import SigninPage from '@/app/entrar/page';
import * as sessionModule from '@/lib/auth/session';

vi.mock('@/lib/auth/session', () => ({
  requireSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

describe('Home and Auth CTA / Redirects (QA-08 & QA-09)', () => {
  it('redirects authenticated user from /cadastro to /perfil by default', async () => {
    vi.mocked(sessionModule.requireSession).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'test@diyspur.com' },
    } as any);

    await expect(SignupPage({})).rejects.toThrow('NEXT_REDIRECT:/perfil');
  });

  it('redirects authenticated user from /cadastro to safe redirect target', async () => {
    vi.mocked(sessionModule.requireSession).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'test@diyspur.com' },
    } as any);

    await expect(
      SignupPage({ searchParams: Promise.resolve({ redirect: '/livros/dom-casmurro' }) })
    ).rejects.toThrow('NEXT_REDIRECT:/livros/dom-casmurro');
  });

  it('redirects authenticated user from /entrar to /perfil', async () => {
    vi.mocked(sessionModule.requireSession).mockResolvedValueOnce({
      user: { id: 'user-123', email: 'test@diyspur.com' },
    } as any);

    await expect(SigninPage({})).rejects.toThrow('NEXT_REDIRECT:/perfil');
  });

  it('computes dynamic CTA href and label based on auth status', () => {
    const getHeroCta = (signedIn: boolean) => ({
      href: signedIn ? '/perfil' : '/cadastro',
      label: signedIn ? 'Continuar minha leitura' : 'Entrar no clube gratuitamente',
    });

    expect(getHeroCta(true)).toEqual({
      href: '/perfil',
      label: 'Continuar minha leitura',
    });

    expect(getHeroCta(false)).toEqual({
      href: '/cadastro',
      label: 'Entrar no clube gratuitamente',
    });
  });

  it('computes dynamic voting link label based on poll availability', () => {
    const getVotingLinkLabel = (activePoll: { id: string } | null) =>
      activePoll ? 'Votar na próxima leitura →' : 'Ver resultados anteriores →';

    expect(getVotingLinkLabel({ id: 'poll-1' })).toBe('Votar na próxima leitura →');
    expect(getVotingLinkLabel(null)).toBe('Ver resultados anteriores →');
  });
});
