import { describe, it, expect } from 'vitest';
import { memberLinks } from '@/lib/member-navigation';

describe('Member Navigation Links', () => {
  it('contains exactly all 10 unified personal destinations', () => {
    expect(memberLinks).toHaveLength(10);
    const hrefs = memberLinks.map((link) => link.href);

    expect(hrefs).toEqual([
      '/perfil',
      '/historico',
      '/diario',
      '/metas',
      '/minha-fila',
      '/listas',
      '/leituras-compartilhadas',
      '/desafios',
      '/ranking',
      '/notificacoes',
    ]);
  });

  it('has descriptive non-empty Portuguese labels for every link', () => {
    for (const link of memberLinks) {
      expect(link.label.length).toBeGreaterThan(2);
      expect(link.href.startsWith('/')).toBe(true);
    }
  });
});
