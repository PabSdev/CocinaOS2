interface AppwriteErrorLike {
  code?: number;
  type?: string;
  message?: string;
}

const AUTH_ERROR_BY_TYPE: Record<string, string> = {
  user_already_exists: 'Ya existe una cuenta vinculada a este correo electrónico.',
  user_email_already_exists: 'Ya existe una cuenta vinculada a este correo electrónico.',
  user_blocked: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
  user_invalid_credentials: 'Credenciales incorrectas. Verifica tu correo y contraseña.',
  password_pwned: 'Esta contraseña ha sido expuesta en filtraciones públicas. Elige otra más segura.',
  password_recently_used: 'Por seguridad, elige una contraseña que no incluya tus datos personales.',
  password_personal_data: 'Por seguridad, elige una contraseña que no incluya tus datos personales.',
  password_invalid: 'La contraseña debe tener al menos 8 caracteres.',
  user_email_invalid: 'El formato del correo electrónico no es válido.',
  general_rate_limit_exceeded: 'Demasiados intentos seguidos. Espera unos minutos antes de reintentar.',
  general_argument_invalid: 'Los datos introducidos no son válidos. Revisa el formulario.',
};

const AUTH_ERROR_BY_CODE: Record<number, string> = {
  409: 'Ya existe una cuenta vinculada a este correo electrónico.',
  429: 'Demasiados intentos seguidos. Espera unos minutos antes de reintentar.',
  400: 'Los datos introducidos no son válidos. Revisa el formulario.',
};

const DEFAULT_AUTH_ERROR = 'Ha ocurrido un error al procesar la solicitud. Inténtalo de nuevo.';

export function mapAppwriteAuthError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as AppwriteErrorLike;

    if (err.type && AUTH_ERROR_BY_TYPE[err.type]) {
      return AUTH_ERROR_BY_TYPE[err.type];
    }

    if (typeof err.code === 'number' && AUTH_ERROR_BY_CODE[err.code]) {
      return AUTH_ERROR_BY_CODE[err.code];
    }
  }

  return DEFAULT_AUTH_ERROR;
}
