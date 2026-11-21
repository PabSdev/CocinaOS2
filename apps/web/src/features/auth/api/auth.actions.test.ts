import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetCookie = vi.fn();
const mockDeleteCookie = vi.fn();
const mockCreateUser = vi.fn();
const mockCreateEmailPasswordSession = vi.fn();
const mockDeleteSession = vi.fn();
const mockRedirect = vi.fn();
const mockEnsureClient = vi.fn();

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    set: mockSetCookie,
    delete: mockDeleteCookie,
  })),
  headers: vi.fn(async () => ({
    get: vi.fn((header: string) => (header === 'x-forwarded-for' ? '192.168.1.100' : null)),
  })),
}));

vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

vi.mock('@/entities/session', () => ({
  getAdminAccount: vi.fn(() => ({
    create: mockCreateUser,
    createEmailPasswordSession: mockCreateEmailPasswordSession,
  })),
  getAuthCookieName: vi.fn(() => 'a_session_project123'),
  getSessionAccount: vi.fn(async () => ({
    deleteSession: mockDeleteSession,
  })),
  getUserDestination: vi.fn(() => '/clientes'),
}));

vi.mock('@/shared/api', () => ({
  ID: {
    unique: vi.fn(() => 'unique-user-id'),
  },
  ensureClientMembership: (...args: unknown[]) => mockEnsureClient(...args),
  getUserRole: vi.fn(async () => 'cliente'),
  createSessionAccountClient: vi.fn(() => ({ deleteSession: mockDeleteSession })),
  AppwriteException: class AppwriteException extends Error {
    code: number;
    type: string;
    constructor(message: string, code: number, type: string) {
      super(message);
      this.code = code;
      this.type = type;
    }
  },
}));

import { AppwriteException } from '@/shared/api';
import { mapAppwriteAuthError } from '../model/error-mapper';
import { clearAllLoginAttempts } from '../model/login-rate-limit';
import { loginAction, logoutAction, registerAction } from './auth.actions';

describe('auth.actions & error-mapper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearAllLoginAttempts();
    mockRedirect.mockImplementation(() => { throw new Error('NEXT_REDIRECT'); });
  });

  describe('loginAction', () => {
    it('returns validation error when email or password are invalid', async () => {
      const formData = new FormData();
      formData.set('email', 'correo-invalido');
      formData.set('password', '123');

      const result = await loginAction({ success: false }, formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.email).toBe('Introduce un correo electrónico válido.');
      expect(result.fieldErrors?.password).toBe('La contraseña debe tener al menos 8 caracteres.');
      expect(mockCreateEmailPasswordSession).not.toHaveBeenCalled();
    });

    it('creates session and sets canonical Appwrite cookie on valid login', async () => {
      mockCreateEmailPasswordSession.mockResolvedValue({
        $id: 'sess-1',
        userId: 'user-1',
        secret: 'session-secret-token',
        expire: '2026-12-08T18:00:00.000Z',
      });

      const formData = new FormData();
      formData.set('email', '  Chef@CocinaOS.es ');
      formData.set('password', 'CocinaSegura2026');

      await expect(loginAction({ success: false }, formData)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockEnsureClient).toHaveBeenCalledWith('user-1');
      expect(mockCreateEmailPasswordSession).toHaveBeenCalledWith({
        email: 'chef@cocinaos.es',
        password: 'CocinaSegura2026',
      });
      expect(mockSetCookie).toHaveBeenCalledWith(
        'a_session_project123',
        'session-secret-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          expires: new Date('2026-12-08T18:00:00.000Z'),
        }),
      );
    });

    it('maps 401 invalid credentials error cleanly in Spanish', async () => {
      mockCreateEmailPasswordSession.mockRejectedValue(
        new AppwriteException('Invalid credentials', 401, 'user_invalid_credentials'),
      );

      const formData = new FormData();
      formData.set('email', 'chef@cocinaos.es');
      formData.set('password', 'ClaveErronea123');

      const result = await loginAction({ success: false }, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Credenciales incorrectas. Verifica tu correo y contraseña.');
      expect(result.remainingAttempts).toBe(2);
    });

    it('locks out after 3 failed attempts and blocks subsequent requests immediately', async () => {
      mockCreateEmailPasswordSession.mockRejectedValue(
        new AppwriteException('Invalid credentials', 401, 'user_invalid_credentials'),
      );

      const formData = new FormData();
      formData.set('email', 'chef@cocinaos.es');
      formData.set('password', 'ClaveErronea123');

      // Intento 1
      const res1 = await loginAction({ success: false }, formData);
      expect(res1.remainingAttempts).toBe(2);
      expect(res1.lockedUntil).toBeUndefined();

      // Intento 2
      const res2 = await loginAction({ success: false }, formData);
      expect(res2.remainingAttempts).toBe(1);
      expect(res2.lockedUntil).toBeUndefined();

      // Intento 3 -> Bloqueo
      const res3 = await loginAction({ success: false }, formData);
      expect(res3.remainingAttempts).toBe(0);
      expect(res3.lockedUntil).toBeDefined();
      expect(res3.error).toContain('Has superado los 3 intentos permitidos');

      // Intento 4 -> Ni siquiera llama a Appwrite porque está bloqueado
      mockCreateEmailPasswordSession.mockClear();
      const res4 = await loginAction({ success: false }, formData);
      expect(res4.remainingAttempts).toBe(0);
      expect(res4.lockedUntil).toBeDefined();
      expect(res4.error).toContain('Has superado los 3 intentos permitidos');
      expect(mockCreateEmailPasswordSession).not.toHaveBeenCalled();
    });

    it('does not count server authorization errors as failed attempts', async () => {
      mockCreateEmailPasswordSession.mockRejectedValue(
        new AppwriteException('Missing scope', 401, 'general_unauthorized_scope'),
      );
      const formData = new FormData();
      formData.set('email', 'cliente@cocinaos.es');
      formData.set('password', 'ClaveSegura123');

      for (let attempt = 0; attempt < 4; attempt++) {
        const result = await loginAction({ success: false }, formData);
        expect(result.error).not.toContain('Credenciales incorrectas');
        expect(result.remainingAttempts).toBeUndefined();
        expect(result.lockedUntil).toBeUndefined();
      }
      expect(mockCreateEmailPasswordSession).toHaveBeenCalledTimes(4);
      expect(mockSetCookie).not.toHaveBeenCalled();
    });

    it('revokes the new session when assigning the client team fails', async () => {
      mockCreateEmailPasswordSession.mockResolvedValue({ userId: 'user-1', secret: 'secret' });
      mockEnsureClient.mockRejectedValue(
        new AppwriteException('Missing scope', 401, 'general_unauthorized_scope'),
      );
      mockDeleteSession.mockResolvedValue(undefined);
      const formData = new FormData();
      formData.set('email', 'cliente@cocinaos.es');
      formData.set('password', 'ClaveSegura123');

      const result = await loginAction({ success: false }, formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No se ha podido completar el acceso');
      expect(result.remainingAttempts).toBeUndefined();
      expect(mockDeleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
      expect(mockSetCookie).not.toHaveBeenCalled();
    });

    it('does not redirect or set an empty cookie when Appwrite omits the session secret', async () => {
      mockCreateEmailPasswordSession.mockResolvedValue({ userId: 'user-1', secret: '' });
      const formData = new FormData();
      formData.set('email', 'cliente@cocinaos.es');
      formData.set('password', 'ClaveSegura123');

      const result = await loginAction({ success: false }, formData);

      expect(result.success).toBe(false);
      expect(mockSetCookie).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe('registerAction', () => {
    it('rejects short password or missing name', async () => {
      const formData = new FormData();
      formData.set('name', '');
      formData.set('email', 'nuevo@cocinaos.es');
      formData.set('password', '1234567');

      const result = await registerAction({ success: false }, formData);

      expect(result.success).toBe(false);
      expect(result.fieldErrors?.name).toBe('Introduce tu nombre o cargo en cocina.');
      expect(result.fieldErrors?.password).toBe(
        'La contraseña debe tener un mínimo de 8 caracteres.',
      );
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('creates user, logs in immediately and sets session cookie', async () => {
      mockCreateUser.mockResolvedValue({
        $id: 'unique-user-id',
        email: 'martin@cocinaos.es',
        name: 'Martín Berasategui',
      });
      mockCreateEmailPasswordSession.mockResolvedValue({
        $id: 'sess-new',
        secret: 'new-user-secret',
        expire: '2026-12-08T18:00:00.000Z',
      });

      const formData = new FormData();
      formData.set('name', 'Martín Berasategui');
      formData.set('email', 'martin@cocinaos.es');
      formData.set('password', 'EstrellaMichelin2026');

      await expect(registerAction({ success: false }, formData)).rejects.toThrow('NEXT_REDIRECT');
      expect(mockEnsureClient).toHaveBeenCalledWith('unique-user-id');
      expect(mockCreateUser).toHaveBeenCalledWith({
        userId: 'unique-user-id',
        email: 'martin@cocinaos.es',
        password: 'EstrellaMichelin2026',
        name: 'Martín Berasategui',
      });
      expect(mockCreateEmailPasswordSession).toHaveBeenCalledWith({
        email: 'martin@cocinaos.es',
        password: 'EstrellaMichelin2026',
      });
      expect(mockSetCookie).toHaveBeenCalledWith(
        'a_session_project123',
        'new-user-secret',
        expect.any(Object),
      );
    });

    it('maps 409 user_already_exists error in Spanish', async () => {
      mockCreateUser.mockRejectedValue(
        new AppwriteException('User already exists', 409, 'user_already_exists'),
      );

      const formData = new FormData();
      formData.set('name', 'Elena Arzak');
      formData.set('email', 'elena@cocinaos.es');
      formData.set('password', 'CocinaVasca2026');

      const result = await registerAction({ success: false }, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ya existe una cuenta vinculada a este correo electrónico.');
    });

    it('explains how to recover if account creation succeeded but team assignment fails', async () => {
      mockCreateUser.mockResolvedValue({ $id: 'user-1' });
      mockEnsureClient.mockRejectedValue(new Error('Appwrite no disponible'));
      const formData = new FormData();
      formData.set('name', 'Elena');
      formData.set('email', 'elena@cocinaos.es');
      formData.set('password', 'CocinaVasca2026');

      const result = await registerAction({ success: false }, formData);
      expect(result.error).toContain('Intenta iniciar sesión');
      expect(mockSetCookie).not.toHaveBeenCalled();
    });
  });

  describe('logoutAction', () => {
    it('deletes current session in Appwrite, clears cookie and redirects to /iniciar-sesion', async () => {
      await expect(logoutAction()).rejects.toThrow('NEXT_REDIRECT');

      expect(mockDeleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
      expect(mockDeleteCookie).toHaveBeenCalledWith('a_session_project123');
      expect(mockRedirect).toHaveBeenCalledWith('/iniciar-sesion');
    });
  });

  describe('mapAppwriteAuthError', () => {
    it('maps rate limit (429) and pwned passwords (400)', () => {
      const rateLimitErr = new AppwriteException(
        'Rate limit',
        429,
        'general_rate_limit_exceeded',
      );
      expect(mapAppwriteAuthError(rateLimitErr)).toBe(
        'Demasiados intentos seguidos. Espera unos minutos antes de reintentar.',
      );

      const pwnedErr = new AppwriteException('Pwned', 400, 'password_pwned');
      expect(mapAppwriteAuthError(pwnedErr)).toBe(
        'Esta contraseña ha sido expuesta en filtraciones públicas. Elige otra más segura.',
      );
    });
  });
});
