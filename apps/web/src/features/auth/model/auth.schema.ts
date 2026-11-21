export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  fieldErrors?: {
    name?: string;
    email?: string;
    password?: string;
  };
  error?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginInput(raw: {
  email?: unknown;
  password?: unknown;
}): ValidationResult<LoginInput> {
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw.password === 'string' ? raw.password : '';
  const fieldErrors: { email?: string; password?: string } = {};

  if (!email) {
    fieldErrors.email = 'Introduce tu correo electrónico.';
  } else if (!EMAIL_REGEX.test(email)) {
    fieldErrors.email = 'Introduce un correo electrónico válido.';
  }

  if (!password) {
    fieldErrors.password = 'Introduce tu contraseña.';
  } else if (password.length < 8) {
    fieldErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      fieldErrors,
      error: Object.values(fieldErrors)[0],
    };
  }

  return {
    valid: true,
    data: { email, password },
  };
}

export function validateRegisterInput(raw: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}): ValidationResult<RegisterInput> {
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
  const password = typeof raw.password === 'string' ? raw.password : '';
  const fieldErrors: { name?: string; email?: string; password?: string } = {};

  if (!name) {
    fieldErrors.name = 'Introduce tu nombre o cargo en cocina.';
  } else if (name.length < 2 || name.length > 128) {
    fieldErrors.name = 'El nombre debe tener al menos 2 caracteres y no superar los 128.';
  } 

  if (!email || !EMAIL_REGEX.test(email)) {
    fieldErrors.email = 'Introduce tu correo electrónico.';
  }

  if (!password) {
    fieldErrors.password = 'Crea una contraseña para tu cuenta.';
  } else if (password.length < 8) {
    fieldErrors.password = 'La contraseña debe tener un mínimo de 8 caracteres.';
  } else if (password.length > 256) {
    fieldErrors.password = 'La contraseña no puede superar los 256 caracteres.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      valid: false,
      fieldErrors,
      error: Object.values(fieldErrors)[0],
    };
  }

  return {
    valid: true,
    data: { name, email, password },
  };
}
