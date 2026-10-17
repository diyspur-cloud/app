export type ActionCode = 'validation' | 'unauthenticated' | 'forbidden' | 'not_found' | 'conflict' | 'unavailable';
export function mapDatabaseError(code?: string, message?: string) {
  if (code === '28000') return { code: 'unauthenticated' as const, message: 'Faça login para continuar.' };
  if (code === '40001' || code === '23505') return { code: 'conflict' as const, message: 'Os dados mudaram. Atualize a página e tente novamente.' };
  if (code === '42501') {
    if (message?.includes('rate_limit_exceeded')) {
      return { code: 'forbidden' as const, message: 'Muitas mensagens seguidas. Aguarde alguns segundos e tente novamente.' };
    }
    if (message?.includes('edit_window_expired')) {
      return { code: 'forbidden' as const, message: 'O prazo de 15 minutos para editar esta mensagem expirou.' };
    }
    return { code: 'forbidden' as const, message: 'Você não tem permissão para esta alteração.' };
  }
  if (code === 'P0002') return { code: 'not_found' as const, message: 'Registro não encontrado.' };
  if (code === '23514' || code === '22023') {
    if (message?.includes('invalid_book_reading_transition')) {
      return { code: 'validation' as const, message: 'Inicie a leitura antes de marcar o livro como lido ou abandonado.' };
    }
    return { code: 'validation' as const, message: 'Confira os campos informados.' };
  }
  return { code: 'unavailable' as const, message: 'Não foi possível salvar agora. Tente novamente.' };
}

