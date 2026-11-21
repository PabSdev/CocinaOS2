import { describe, expect, it, vi } from 'vitest';

const mockRedirect = vi.fn();
const mockGetLoggedInUser = vi.fn();

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}));

vi.mock('@/entities/session', () => ({
  getLoggedInUser: () => mockGetLoggedInUser(),
  getUserDestination: () => '/clientes',
}));

vi.mock('@/widgets/sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar" />,
  MobileSidebar: () => <div data-testid="mobile-sidebar" />,
}));

vi.mock('@/shared/ui', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

import { AppLayout } from './AppLayout';

describe('AppLayout authentication guard', () => {
  it('redirects to /iniciar-sesion when user is not authenticated', async () => {
    mockGetLoggedInUser.mockResolvedValue(null);
    mockRedirect.mockImplementationOnce(() => { throw new Error('redirect'); });

    await expect(AppLayout({ children: <div>Contenido Privado</div> })).rejects.toThrow('redirect');

    expect(mockRedirect).toHaveBeenCalledWith('/iniciar-sesion');
  });

  it('redirects clients away from the kitchen', async () => {
    mockGetLoggedInUser.mockResolvedValue({ role: 'cliente' });
    mockRedirect.mockImplementationOnce(() => { throw new Error('redirect'); });

    await expect(AppLayout({ children: <div>Contenido Privado</div> })).rejects.toThrow('redirect');

    expect(mockRedirect).toHaveBeenCalledWith('/clientes');
  });

  it('renders layout and children when user is authenticated', async () => {
    mockGetLoggedInUser.mockResolvedValue({
      $id: 'user-1',
      email: 'chef@cocinaos.es',
      name: 'Chef Ejecutivo',
      role: 'cocinero',
    });

    const result = await AppLayout({ children: <div>Contenido Privado</div> });

    expect(result).toBeDefined();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
