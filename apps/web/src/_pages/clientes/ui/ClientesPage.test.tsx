import { describe, expect, it, vi } from 'vitest';

const getUser = vi.fn();
const redirect = vi.fn((_url: string) => { throw new Error('redirect'); });

vi.mock('next/navigation', () => ({ redirect: (url: string) => redirect(url) }));
vi.mock('@/entities/session', () => ({
  getLoggedInUser: () => getUser(),
  getUserDestination: () => '/ingredientes',
}));
vi.mock('@/features/auth', () => ({ LogoutButton: () => null }));
vi.mock('@/entities/client-menu', () => ({
  getClientMenu: vi.fn(async () => ({ dishes: { data: [] }, products: { data: [] } })),
}));
vi.mock('./ClientMenu', () => ({ ClientMenu: () => null }));

import { ClientesPage } from './ClientesPage';

describe('ClientesPage', () => {
  it('requires a session', async () => {
    getUser.mockResolvedValueOnce(null);
    await expect(ClientesPage()).rejects.toThrow('redirect');
    expect(redirect).toHaveBeenLastCalledWith('/iniciar-sesion');
  });

  it('redirects kitchen users to their space', async () => {
    getUser.mockResolvedValueOnce({ role: 'cocinero' });
    await expect(ClientesPage()).rejects.toThrow('redirect');
    expect(redirect).toHaveBeenLastCalledWith('/ingredientes');
  });

  it('renders the menu for clients', async () => {
    getUser.mockResolvedValueOnce({ role: 'cliente' });
    expect(await ClientesPage()).toBeDefined();
  });
});
