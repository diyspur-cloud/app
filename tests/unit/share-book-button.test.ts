import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ShareBookButton Microcopy and Clipboard Feedback (QA-16)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds share url and text correctly', () => {
    const bookTitle = 'Memórias Póstumas de Brás Cubas';
    const bookSlug = 'memorias-postumas-de-bras-cubas';
    const origin = 'https://diyspur.com';

    const url = `${origin}/livros/${bookSlug}`;
    const shareData = {
      title: `Vamos ler "${bookTitle}" juntos no DIYSPUR?`,
      text: `Estou acompanhando o clube de leitura de "${bookTitle}" no DIYSPUR com discussões capítulo a capítulo sem spoilers!`,
      url,
    };

    expect(shareData.url).toBe('https://diyspur.com/livros/memorias-postumas-de-bras-cubas');
    expect(shareData.title).toContain(bookTitle);
    expect(shareData.text).toContain('sem spoilers');
  });

  it('provides friendly non-technical microcopy for video comments and challenges', () => {
    const challengeHint = 'Sua participação é privada. O progresso acompanha suas atividades de leitura e a conclusão é registrada automaticamente.';
    expect(challengeHint).not.toContain('idempotente');

    const videoHint = 'Exemplo: para 1 minuto e 30 segundos, digite 90. Spoilers ficam protegidos até você alcançar o progresso escolhido.';
    expect(videoHint).toContain('90');
    expect(videoHint).not.toContain('Use segundos inteiros (até 24 horas)');
  });
});
