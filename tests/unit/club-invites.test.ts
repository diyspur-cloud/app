import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inviteByUsername } from '@/features/clubs/actions';
import * as sessionModule from '@/lib/auth/session';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('club invitation by username', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid username format', async () => {
    const res = await inviteByUsername({
      clubId: '550e8400-e29b-41d4-a716-446655440000',
      username: 'a', // too short
    });
    expect(res.ok).toBe(false);
    expect(res.message).toBe('Informe um nome de usuário válido (@leitor).');
  });

  it('rejects unauthenticated user', async () => {
    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue(null as any);
    const res = await inviteByUsername({
      clubId: '550e8400-e29b-41d4-a716-446655440000',
      username: '@maria_leitora',
    });
    expect(res.ok).toBe(false);
    expect(res.message).toBe('Entre para convidar leitores.');
  });

  it('returns friendly message when reader is not found', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'user-owner',
      client: { from: fromMock } as any,
    } as any);

    const res = await inviteByUsername({
      clubId: '550e8400-e29b-41d4-a716-446655440000',
      username: '@usuario_inexistente',
    });

    expect(res.ok).toBe(false);
    expect(res.message).toBe('Não foi possível localizar esse leitor.');
    expect(fromMock).toHaveBeenCalledWith('v_profiles_public');
  });

  it('invites successfully when reader is found', async () => {
    const readerUuid = '550e8400-e29b-41d4-a716-446655440001';
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { id: readerUuid },
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });
    const rpcMock = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(sessionModule, 'requireSession').mockResolvedValue({
      userId: 'user-owner',
      client: { from: fromMock, rpc: rpcMock } as any,
    } as any);

    const res = await inviteByUsername({
      clubId: '550e8400-e29b-41d4-a716-446655440000',
      username: '@leitor_valido',
    });

    expect(res.ok).toBe(true);
    expect(res.message).toBe('Convite criado.');
    expect(rpcMock).toHaveBeenCalledWith(
      'invite_user_to_club',
      expect.objectContaining({
        p_club: '550e8400-e29b-41d4-a716-446655440000',
        p_invited_user: readerUuid,
      })
    );
  });
});
