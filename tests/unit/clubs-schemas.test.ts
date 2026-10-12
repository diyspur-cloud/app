import { describe, expect, it } from 'vitest';
import { createClubSchema, updateClubSchema, clubIdSchema } from '../../src/features/clubs/schemas';

const validUuid = '7b4c0dd1-f73a-4db4-9ab7-8a79f2ad4533';

describe('createClubSchema', () => {
  it('valida payload correto de criação de clube', () => {
    const valid = {
      requestId: validUuid,
      name: 'Clube dos Clássicos',
      description: 'Espaço para debate de ficção clássica.',
      isPrivate: false,
    };
    const result = createClubSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejeita nome menor que 3 caracteres ou maior que 80', () => {
    const tooShort = {
      requestId: validUuid,
      name: 'Oi',
      description: 'Descrição',
      isPrivate: false,
    };
    expect(createClubSchema.safeParse(tooShort).success).toBe(false);

    const tooLong = {
      requestId: validUuid,
      name: 'A'.repeat(81),
      description: 'Descrição',
      isPrivate: false,
    };
    expect(createClubSchema.safeParse(tooLong).success).toBe(false);
  });

  it('rejeita campos não esperados por ser estrito (.strict())', () => {
    const withExtra = {
      requestId: validUuid,
      name: 'Clube Teste',
      description: 'Descrição',
      isPrivate: false,
      role: 'admin',
    };
    expect(createClubSchema.safeParse(withExtra).success).toBe(false);
  });
});

describe('updateClubSchema', () => {
  it('valida atualização correta com versão positiva', () => {
    const valid = {
      clubId: validUuid,
      slug: 'clube-dos-classicos',
      version: 2,
      name: 'Clube dos Clássicos Atualizado',
      description: 'Nova descrição.',
      isPrivate: true,
      seasonId: null,
    };
    const result = updateClubSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejeita versão não positiva', () => {
    const invalidVersion = {
      clubId: validUuid,
      slug: 'clube-dos-classicos',
      version: 0,
      name: 'Clube dos Clássicos',
      description: 'Descrição',
      isPrivate: false,
    };
    expect(updateClubSchema.safeParse(invalidVersion).success).toBe(false);
  });
});

describe('clubIdSchema', () => {
  it('valida UUID válido e rejeita strings arbitrárias', () => {
    expect(clubIdSchema.safeParse({ clubId: validUuid }).success).toBe(true);
    expect(clubIdSchema.safeParse({ clubId: 'not-a-uuid' }).success).toBe(false);
  });
});
