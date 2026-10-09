import { describe, expect, it } from 'vitest';
import { safeLocalRedirect } from '../../src/lib/safe-redirect';

describe('safeLocalRedirect', () => {
  it('permite somente caminhos locais e mantém query e fragmento', () => expect(safeLocalRedirect('/historico?q=livro#top')).toBe('/historico?q=livro#top'));
  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '', undefined])('rejeita URL externa ou ausente: %s', (value) => expect(safeLocalRedirect(value)).toBe('/perfil'));
  it('aceita fallback explicitamente local', () => expect(safeLocalRedirect('//evil.example', '/')).toBe('/'));
});
