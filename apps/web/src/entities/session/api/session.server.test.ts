import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCookie = vi.fn();
const mockGetAccount = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: mockGetCookie,
  })),
}));

vi.mock('@/shared/api', () => ({
  adminAccount: {},
  getAuthCookieName: vi.fn(() => 'a_session_test_project'),
  createSessionAccountClient: vi.fn(() => ({
    get: mockGetAccount,
  })),
  getUserRole: vi.fn(async () => 'cocinero'),
}));

import { getLoggedInUser, getSessionAccount } from './session.server';

describe('session.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null from getSessionAccount when session cookie is missing', async () => {
    mockGetCookie.mockReturnValue(undefined);
    const result = await getSessionAccount();
    expect(result).toBeNull();
  });

  it('returns mapped SessionUser when session cookie is valid', async () => {
    mockGetCookie.mockReturnValue({ value: 'secret-token-123' });
    mockGetAccount.mockResolvedValue({
      $id: 'user-1',
      email: 'chef@cocinaos.es',
      name: 'Jefe de Cocina',
      status: true,
      $createdAt: '2026-11-08T10:00:00.000Z',
    });

    const user = await getLoggedInUser();
    expect(user).toEqual({
      $id: 'user-1',
      email: 'chef@cocinaos.es',
      name: 'Jefe de Cocina',
      status: true,
      $createdAt: '2026-11-08T10:00:00.000Z',
      role: 'cocinero',
    });
  });

  it('returns null from getLoggedInUser if account.get() throws (expired session)', async () => {
    mockGetCookie.mockReturnValue({ value: 'expired-secret' });
    mockGetAccount.mockRejectedValue(new Error('Unauthorized'));

    const user = await getLoggedInUser();
    expect(user).toBeNull();
  });
});
