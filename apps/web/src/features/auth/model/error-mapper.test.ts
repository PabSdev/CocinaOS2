import { describe, expect, it } from 'vitest';
import { mapAppwriteAuthError } from './error-mapper';

describe('mapAppwriteAuthError', () => {
  it('maps known error types directly', () => {
    expect(mapAppwriteAuthError({ type: 'user_already_exists' })).toBe(
      'Ya existe una cuenta vinculada a este correo electrónico.',
    );
    expect(mapAppwriteAuthError({ type: 'user_email_already_exists' })).toBe(
      'Ya existe una cuenta vinculada a este correo electrónico.',
    );
    expect(mapAppwriteAuthError({ type: 'user_blocked' })).toBe(
      'Tu cuenta ha sido desactivada. Contacta al administrador.',
    );
    expect(mapAppwriteAuthError({ type: 'user_invalid_credentials' })).toBe(
      'Credenciales incorrectas. Verifica tu correo y contraseña.',
    );
    expect(mapAppwriteAuthError({ type: 'password_pwned' })).toBe(
      'Esta contraseña ha sido expuesta en filtraciones públicas. Elige otra más segura.',
    );
    expect(mapAppwriteAuthError({ type: 'password_recently_used' })).toBe(
      'Por seguridad, elige una contraseña que no incluya tus datos personales.',
    );
    expect(mapAppwriteAuthError({ type: 'password_personal_data' })).toBe(
      'Por seguridad, elige una contraseña que no incluya tus datos personales.',
    );
    expect(mapAppwriteAuthError({ type: 'password_invalid' })).toBe(
      'La contraseña debe tener al menos 8 caracteres.',
    );
    expect(mapAppwriteAuthError({ type: 'user_email_invalid' })).toBe(
      'El formato del correo electrónico no es válido.',
    );
    expect(mapAppwriteAuthError({ type: 'general_rate_limit_exceeded' })).toBe(
      'Demasiados intentos seguidos. Espera unos minutos antes de reintentar.',
    );
    expect(mapAppwriteAuthError({ type: 'general_argument_invalid' })).toBe(
      'Los datos introducidos no son válidos. Revisa el formulario.',
    );
  });

  it('prioritizes specific type over status code', () => {
    // user_blocked with code 401 should return blocked message, not generic credentials error
    expect(mapAppwriteAuthError({ code: 401, type: 'user_blocked' })).toBe(
      'Tu cuenta ha sido desactivada. Contacta al administrador.',
    );
    // password_pwned with code 400 returns pwned message, not generic invalid data
    expect(mapAppwriteAuthError({ code: 400, type: 'password_pwned' })).toBe(
      'Esta contraseña ha sido expuesta en filtraciones públicas. Elige otra más segura.',
    );
  });

  it('falls back to status code when type is missing or unknown', () => {
    expect(mapAppwriteAuthError({ code: 409 })).toBe(
      'Ya existe una cuenta vinculada a este correo electrónico.',
    );
    expect(mapAppwriteAuthError({ code: 429 })).toBe(
      'Demasiados intentos seguidos. Espera unos minutos antes de reintentar.',
    );
    expect(mapAppwriteAuthError({ code: 400 })).toBe(
      'Los datos introducidos no son válidos. Revisa el formulario.',
    );
    expect(mapAppwriteAuthError({ code: 400, type: 'unknown_argument_error' })).toBe(
      'Los datos introducidos no son válidos. Revisa el formulario.',
    );
  });

  it('returns default fallback message for unknown or non-object errors', () => {
    const defaultMsg = 'Ha ocurrido un error al procesar la solicitud. Inténtalo de nuevo.';
    expect(mapAppwriteAuthError(null)).toBe(defaultMsg);
    expect(mapAppwriteAuthError(undefined)).toBe(defaultMsg);
    expect(mapAppwriteAuthError('string error')).toBe(defaultMsg);
    expect(mapAppwriteAuthError(500)).toBe(defaultMsg);
    expect(mapAppwriteAuthError({})).toBe(defaultMsg);
    expect(mapAppwriteAuthError({ code: 401 })).toBe(defaultMsg);
    expect(mapAppwriteAuthError({ code: 503 })).toBe(defaultMsg);
  });
});
