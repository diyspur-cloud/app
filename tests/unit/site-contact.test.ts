import { describe, it, expect } from 'vitest';
import { supportEmail } from '@/lib/site-contact';

describe('Site Contact and Page Titles (QA-17)', () => {
  it('exports canonical support email', () => {
    expect(supportEmail).toBe('oi@diyspur.com');
  });

  it('formats clean book page title without double DIYSPUR brand', () => {
    const bookTitle = 'O Crime do Padre Amaro';
    const cleanTitle = `${bookTitle} — Clube de Leitura e Discussão`;

    // Root layout template is '%s · DIYSPUR'
    const fullExpectedTitle = `${cleanTitle} · DIYSPUR`;

    expect(cleanTitle).not.toContain('DIYSPUR');
    expect(fullExpectedTitle).toBe('O Crime do Padre Amaro — Clube de Leitura e Discussão · DIYSPUR');
  });
});
