import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listMemberships, createMembership, get, cookie } = vi.hoisted(() => ({
  listMemberships: vi.fn(), createMembership: vi.fn(), get: vi.fn(), cookie: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: async () => ({ get: cookie }) }));
vi.mock('./db', () => ({
  teams: { listMemberships, createMembership },
  Query: { equal: (_key: string, value: string) => value },
  getAuthCookieName: () => 'session',
  createSessionAccountClient: () => ({ get }),
}));

import { ensureClientMembership, getUserRole, requireKitchenAccess } from './access';

describe('control de acceso por equipo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listMemberships.mockResolvedValue({ memberships: [] });
  });

  it('solo concede cocina si la membresía está confirmada', async () => {
    cookie.mockReturnValue({ value: 'secret' });
    get.mockResolvedValue({ $id: 'user', status: true });
    listMemberships.mockResolvedValue({ memberships: [{ confirm: false, roles: ['admin'] }] });
    await expect(requireKitchenAccess()).rejects.toThrow('Acceso no autorizado');
    listMemberships.mockResolvedValue({ memberships: [{ confirm: true, roles: ['admin'] }] });
    await expect(getUserRole('user')).resolves.toBe('admin');
    await expect(requireKitchenAccess()).resolves.toBeUndefined();
  });

  it('crea cliente y no lo duplica al reintentar', async () => {
    await ensureClientMembership('user');
    expect(createMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ['cliente'],
        userId: 'user',
      }),
    );
    listMemberships.mockResolvedValueOnce({ memberships: [] })
      .mockResolvedValueOnce({ memberships: [{ confirm: true, roles: ['cliente'] }] });
    await ensureClientMembership('user');
    expect(createMembership).toHaveBeenCalledTimes(1);
  });

  it('no asigna clientes a miembros de cocina y propaga fallos', async () => {
    listMemberships.mockResolvedValueOnce({ memberships: [{ confirm: true, roles: [] }] });
    await ensureClientMembership('chef');
    expect(createMembership).not.toHaveBeenCalled();
    createMembership.mockRejectedValue(new Error('Appwrite no disponible'));
    await expect(ensureClientMembership('user')).rejects.toThrow('Appwrite no disponible');
  });
});
