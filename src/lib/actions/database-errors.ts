export type ActionCode = 'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'unavailable';
export function mapDatabaseError(code?: string) {
  if (code === '40001' || code === '23505') return { code: 'conflict' as const, message: 'Os dados mudaram. Atualize a página e tente novamente.' };
  if (code === '42501') return { code: 'forbidden' as const, message: 'Você não tem permissão para esta alteração.' };
  if (code === 'P0002') return { code: 'not_found' as const, message: 'Registro não encontrado.' };
  if (code === '23514') return { code: 'validation' as const, message: 'Confira os campos informados.' };
  return { code: 'unavailable' as const, message: 'Não foi possível salvar agora. Tente novamente.' };
}
