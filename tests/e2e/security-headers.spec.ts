import { expect, test } from '@playwright/test';

test.describe('Headers de Segurança e SEO Técnico', () => {
  test('resposta pública contém headers defensivos e CSP report-only', async ({ request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();

    const headers = response.headers();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['content-security-policy-report-only']).toBeTruthy();
    expect(headers['x-powered-by']).toBeUndefined();
  });

  test('robots.txt desabilita indexação de rotas privadas', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toContain('Disallow: /admin/');
    expect(text).toContain('Disallow: /perfil');
    expect(text).toContain('Disallow: /diario');
  });

  test('sitemap.xml não expõe rotas privadas ou drafts', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    expect(xml).not.toContain('/ranking');
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/perfil');
  });
});
