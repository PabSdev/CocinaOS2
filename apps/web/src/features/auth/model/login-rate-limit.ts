export const MAX_LOGIN_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutos

interface AttemptRecord {
  attempts: number;
  lockedUntil?: number;
  updatedAt: number;
}

const attemptsStore = new Map<string, AttemptRecord>();

export function buildLoginAttemptKey(email: string, ip: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIp = ip.trim().toLowerCase() || 'unknown';
  return `${normalizedEmail}|${normalizedIp}`;
}

export interface LoginLockStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockedUntil?: number;
}

export function getLoginLockStatus(key: string, now = Date.now()): LoginLockStatus {
  const record = attemptsStore.get(key);
  if (!record) {
    return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  if (record.lockedUntil) {
    if (record.lockedUntil > now) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockedUntil: record.lockedUntil,
      };
    }
    // El bloqueo de 5 minutos ya ha transcurrido: se limpia el historial
    attemptsStore.delete(key);
    return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Si los intentos anteriores ocurrieron hace más de la duración de bloqueo, expiran
  if (now - record.updatedAt > LOCKOUT_DURATION_MS) {
    attemptsStore.delete(key);
    return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - record.attempts);
  return { isLocked: false, remainingAttempts: remaining };
}

export function recordFailedLoginAttempt(key: string, now = Date.now()): LoginLockStatus {
  const current = getLoginLockStatus(key, now);

  if (current.isLocked && current.lockedUntil) {
    return current;
  }

  const existingRecord = attemptsStore.get(key);
  const currentAttempts = existingRecord && !existingRecord.lockedUntil ? existingRecord.attempts : 0;
  const newAttempts = currentAttempts + 1;

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    attemptsStore.set(key, {
      attempts: newAttempts,
      lockedUntil,
      updatedAt: now,
    });
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockedUntil,
    };
  }

  attemptsStore.set(key, {
    attempts: newAttempts,
    updatedAt: now,
  });

  return {
    isLocked: false,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - newAttempts,
  };
}

export function resetLoginAttempts(key: string): void {
  attemptsStore.delete(key);
}

export function clearAllLoginAttempts(): void {
  attemptsStore.clear();
}
