import { describe, it, expect, vi } from 'vitest';
import robots from '../../src/app/robots';
import sitemap from '../../src/app/sitemap';

vi.mock('../../src/lib/supabase/clients', () => ({
  createServerSupabase: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'books') {
        return {
          select: () => ({
            order: () => ({
              limit: async () => ({
                data: [
                  { id: 'b1', slug: 'dom-casmurro', updated_at: '2026-05-01T10:00:00Z' },
                ],
              }),
            }),
          }),
        };
      }
      if (table === 'seasons') {
        return {
          select: () => ({
            in: () => ({
              limit: async () => ({
                data: [
                  { id: 's1', slug: 'temporada-machado', status: 'active', created_at: '2026-05-01T10:00:00Z' },
                ],
              }),
            }),
          }),
        };
      }
      if (table === 'chapters') {
        return {
          select: () => ({
            in: () => ({
              eq: () => ({
                or: () => ({
                  limit: async () => ({
                    data: [
                      { id: 'c1', season_id: 's1', published_at: '2026-05-02T10:00:00Z', is_draft: false },
                    ],
                  }),
                }),
                not: () => ({
                  lte: () => ({
                    limit: async () => ({
                      data: [
                        { id: 'c1', season_id: 's1', published_at: '2026-05-02T10:00:00Z', is_draft: false },
                      ],
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          limit: async () => ({ data: [] }),
        }),
      };
    },
  })),
}));

describe('SEO Routes and Sitemap Validation', () => {
  it('robots() bloqueia rotas administrativas e privadas e aponta para o sitemap', () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;

    expect(rules?.allow).toBe('/');
    expect(rules?.disallow).toContain('/admin/');
    expect(rules?.disallow).toContain('/api/');
    expect(rules?.disallow).toContain('/ranking');
    expect(rules?.disallow).toContain('/perfil');
    expect(config.sitemap).toContain('/sitemap.xml');
  });

  it('sitemap() não inclui a rota privada ranking', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((url) => url.endsWith('/ranking'))).toBe(false);
  });

  it('sitemap() inclui rotas públicas com URLs absolutas válidas', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.some((url) => url.endsWith('/livros'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/calendario'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/comunidade'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/privacidade'))).toBe(true);
    expect(urls.some((url) => url.endsWith('/termos'))).toBe(true);
    expect(urls.some((url) => url.includes('/livros/dom-casmurro'))).toBe(true);
    expect(urls.some((url) => url.includes('/temporadas/temporada-machado'))).toBe(true);
    expect(urls.some((url) => url.includes('/capitulos/c1'))).toBe(true);
  });

  it('rotas fixas não inventam lastModified falso', async () => {
    const entries = await sitemap();
    const livrosEntry = entries.find((e) => e.url.endsWith('/livros'));

    expect(livrosEntry?.lastModified).toBeUndefined();
  });
});
