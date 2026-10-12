import { describe, expect, it } from 'vitest';
import { mapDatabaseError } from '../../src/lib/actions/database-errors';

describe('mapDatabaseError', () => {
  it('mapeia conflito de concorrência ou chave duplicada (40001, 23505)', () => {
    expect(mapDatabaseError('40001')).toEqual({
      code: 'conflict',
      message: 'Os dados mudaram. Atualize a página e tente novamente.',
    });
    expect(mapDatabaseError('23505')).toEqual({
      code: 'conflict',
      message: 'Os dados mudaram. Atualize a página e tente novamente.',
    });
  });

  it('mapeia violação de permissão RLS (42501)', () => {
    expect(mapDatabaseError('42501')).toEqual({
      code: 'forbidden',
      message: 'Você não tem permissão para esta alteração.',
    });
  });

  it('mapeia registro não encontrado (P0002)', () => {
    expect(mapDatabaseError('P0002')).toEqual({
      code: 'not_found',
      message: 'Registro não encontrado.',
    });
  });

  it('mapeia violação de constraint de check (23514)', () => {
    expect(mapDatabaseError('23514')).toEqual({
      code: 'validation',
      message: 'Confira os campos informados.',
    });
  });

  it('retorna indisponível seguro para erros não mapeados ou indefinidos sem vazar detalhes', () => {
    expect(mapDatabaseError(undefined)).toEqual({
      code: 'unavailable',
      message: 'Não foi possível salvar agora. Tente novamente.',
    });
    expect(mapDatabaseError('58000')).toEqual({
      code: 'unavailable',
      message: 'Não foi possível salvar agora. Tente novamente.',
    });
  });
});
