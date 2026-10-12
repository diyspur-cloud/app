import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToUpNext, removeFromUpNext } from '@/features/up-next/actions';
import * as sessionModule from '@/lib/auth/session';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('up-next actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid uuid', async () => {
    const res = await addToUpNext('not-a-uuid');
    expect(res.ok).toBe(false);
    expect(res.message).toBe('Livro inválido.');
  });

  it('rejects unauthenticated user', async () => {
    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue(null as any);
    const res = await addToUpNext('550e8400-e29b-41d4-a716-446655440000');
    expect(res.ok).toBe(false);
    expect(res.message).toBe('Entre para adicionar livros à sua fila.');
  });

  it('handles queue_full error properly', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'queue_full', code: 'P0001' },
    });
    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'user-1',
      client: { rpc: rpcMock } as any,
    } as any);

    const res = await addToUpNext('550e8400-e29b-41d4-a716-446655440000');
    expect(res.ok).toBe(false);
    expect(res.message).toContain('Sua fila já tem cinco livros');
  });

  it('returns success message on valid add', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: 1,
      error: null,
    });
    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'user-1',
      client: { rpc: rpcMock } as any,
    } as any);

    const res = await addToUpNext('550e8400-e29b-41d4-a716-446655440000');
    expect(res.ok).toBe(true);
    expect(res.message).toBe('Livro guardado na sua fila.');
    expect(rpcMock).toHaveBeenCalledWith('add_to_up_next_atomic', {
      p_book: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('validates uuid on removeFromUpNext', async () => {
    const res = await removeFromUpNext('invalid');
    expect(res.ok).toBe(false);
    expect(res.message).toBe('Livro inválido.');
  });
});
