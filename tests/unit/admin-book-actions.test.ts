import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBook, updateBook } from '@/app/admin/actions';
import * as sessionModule from '@/lib/auth/session';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('admin book actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects createBook with invalid slug', async () => {
    const res = await createBook({
      title: 'Livro Teste',
      slug: 'Slug Invalido Com Espacos',
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      synopsis: 'Sinopse',
      coverUrl: '',
      totalPages: 100,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('validation');
  });

  it('rejects createBook if user is not admin', async () => {
    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'user-1',
      client: {
        rpc: vi.fn().mockResolvedValue({ data: false, error: null }),
      } as any,
    } as any);

    const res = await createBook({
      title: 'Livro Teste',
      slug: 'livro-teste',
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      synopsis: 'Sinopse',
      coverUrl: '',
      totalPages: 100,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe('forbidden');
  });

  it('calls create_editorial_book when admin session is valid', async () => {
    const rpcMock = vi.fn((fnName) => {
      if (fnName === 'is_admin') return Promise.resolve({ data: true, error: null });
      if (fnName === 'create_editorial_book') return Promise.resolve({ data: 'new-id', error: null });
      return Promise.resolve({ data: null, error: null });
    });

    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'admin-1',
      client: { rpc: rpcMock } as any,
    } as any);

    const res = await createBook({
      title: 'Livro Teste',
      slug: 'livro-teste',
      authorId: '550e8400-e29b-41d4-a716-446655440000',
      synopsis: 'Sinopse',
      coverUrl: '',
      totalPages: 100,
    });
    expect(res.ok).toBe(true);
    expect(res.message).toBe('Livro cadastrado com sucesso.');
    expect(rpcMock).toHaveBeenCalledWith('create_editorial_book', {
      p_title: 'Livro Teste',
      p_slug: 'livro-teste',
      p_author: '550e8400-e29b-41d4-a716-446655440000',
      p_synopsis: 'Sinopse',
      p_cover: null,
      p_pages: 100,
    });
  });

  it('returns not_found in updateBook when book does not exist', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqMock = vi.fn().mockReturnValue({ select: selectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'admin-1',
      client: {
        rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
        from: vi.fn().mockReturnValue({ update: updateMock }),
      } as any,
    } as any);

    const res = await updateBook({
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Livro Inexistente',
      synopsis: 'Sinopse',
      coverUrl: '',
      totalPages: 100,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.code).toBe('not_found');
      expect(res.message).toBe('O livro não foi encontrado.');
    }
  });
});
