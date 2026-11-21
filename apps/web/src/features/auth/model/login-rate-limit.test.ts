import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildLoginAttemptKey,
  clearAllLoginAttempts,
  getLoginLockStatus,
  LOCKOUT_DURATION_MS,
  MAX_LOGIN_ATTEMPTS,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from './login-rate-limit';

describe('login-rate-limit', () => {
  const email = 'chef@cocinaos.es';
  const ip = '192.168.1.50';
  const key = buildLoginAttemptKey(email, ip);

  beforeEach(() => {
    clearAllLoginAttempts();
  });

  it('normalizes email and ip correctly in key builder', () => {
    expect(buildLoginAttemptKey('  CHEF@CocinaOS.es ', ' 10.0.0.1 ')).toBe('chef@cocinaos.es|10.0.0.1');
    expect(buildLoginAttemptKey('test@example.com', '')).toBe('test@example.com|unknown');
  });

  it('initializes with MAX_LOGIN_ATTEMPTS and unlocked state', () => {
    const status = getLoginLockStatus(key);
    expect(status.isLocked).toBe(false);
    expect(status.remainingAttempts).toBe(MAX_LOGIN_ATTEMPTS);
    expect(status.lockedUntil).toBeUndefined();
  });

  it('decrements remaining attempts on failure and locks on the 3rd failure', () => {
    const now = 1_000_000;

    // Primer fallo -> 2 restantes
    const attempt1 = recordFailedLoginAttempt(key, now);
    expect(attempt1.isLocked).toBe(false);
    expect(attempt1.remainingAttempts).toBe(2);

    // Segundo fallo -> 1 restante
    const attempt2 = recordFailedLoginAttempt(key, now + 1000);
    expect(attempt2.isLocked).toBe(false);
    expect(attempt2.remainingAttempts).toBe(1);

    // Tercer fallo -> 0 restantes y bloqueo por 5 minutos
    const attempt3 = recordFailedLoginAttempt(key, now + 2000);
    expect(attempt3.isLocked).toBe(true);
    expect(attempt3.remainingAttempts).toBe(0);
    expect(attempt3.lockedUntil).toBe(now + 2000 + LOCKOUT_DURATION_MS);

    // Si consulta el estado durante el bloqueo, sigue bloqueado
    const statusWhileLocked = getLoginLockStatus(key, now + 3000);
    expect(statusWhileLocked.isLocked).toBe(true);
    expect(statusWhileLocked.remainingAttempts).toBe(0);
    expect(statusWhileLocked.lockedUntil).toBe(now + 2000 + LOCKOUT_DURATION_MS);
  });

  it('isolates different combinations of email and ip', () => {
    const keyUser1 = buildLoginAttemptKey('chef1@cocinaos.es', ip);
    const keyUser2 = buildLoginAttemptKey('chef2@cocinaos.es', ip);
    const keyUser1OtherIp = buildLoginAttemptKey('chef1@cocinaos.es', '185.20.1.2');

    recordFailedLoginAttempt(keyUser1);
    recordFailedLoginAttempt(keyUser1);
    recordFailedLoginAttempt(keyUser1); // Bloquea chef1 en esa IP

    expect(getLoginLockStatus(keyUser1).isLocked).toBe(true);
    // chef2 en la misma IP no está bloqueado
    expect(getLoginLockStatus(keyUser2).isLocked).toBe(false);
    expect(getLoginLockStatus(keyUser2).remainingAttempts).toBe(3);
    // chef1 desde otra IP no está bloqueado
    expect(getLoginLockStatus(keyUser1OtherIp).isLocked).toBe(false);
    expect(getLoginLockStatus(keyUser1OtherIp).remainingAttempts).toBe(3);
  });

  it('automatically unlocks after LOCKOUT_DURATION_MS has elapsed', () => {
    const now = 1_000_000;
    recordFailedLoginAttempt(key, now);
    recordFailedLoginAttempt(key, now);
    const locked = recordFailedLoginAttempt(key, now);
    expect(locked.isLocked).toBe(true);

    // Tras pasar exactamente 5 minutos + 1ms
    const afterLockout = now + LOCKOUT_DURATION_MS + 1;
    const status = getLoginLockStatus(key, afterLockout);
    expect(status.isLocked).toBe(false);
    expect(status.remainingAttempts).toBe(MAX_LOGIN_ATTEMPTS);
    expect(status.lockedUntil).toBeUndefined();
  });

  it('resets attempts completely when resetLoginAttempts is called on success', () => {
    recordFailedLoginAttempt(key);
    recordFailedLoginAttempt(key);
    expect(getLoginLockStatus(key).remainingAttempts).toBe(1);

    resetLoginAttempts(key);
    expect(getLoginLockStatus(key).remainingAttempts).toBe(MAX_LOGIN_ATTEMPTS);
  });
});
