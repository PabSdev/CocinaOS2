'use server';

import {
  type AuthActionState,
  getAdminAccount,
  getAuthCookieName,
  getSessionAccount,
  getUserDestination,
} from '@/entities/session';
import { createSessionAccountClient, ensureClientMembership, getUserRole, ID, type Models } from '@/shared/api';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateLoginInput, validateRegisterInput } from '../model/auth.schema';
import { mapAppwriteAuthError } from '../model/error-mapper';
import {
  buildLoginAttemptKey,
  getLoginLockStatus,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from '../model/login-rate-limit';

async function getClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwardedFor = headerStore.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = headerStore.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Fallback si headers() no está disponible en el contexto actual
  }
  return 'unknown';
}

async function setSessionCookie(secret: string, expireIso: string) {
  if (!secret) throw new Error('Appwrite no ha devuelto el secreto de sesión.');

  const cookieStore = await cookies();
  const cookieName = getAuthCookieName();

  cookieStore.set(cookieName, secret, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expireIso),
  });
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateLoginInput({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validation.valid || !validation.data) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  const clientIp = await getClientIp();
  const attemptKey = buildLoginAttemptKey(validation.data.email, clientIp);
  const lockStatus = getLoginLockStatus(attemptKey);

  if (lockStatus.isLocked && lockStatus.lockedUntil) {
    return {
      success: false,
      error:
        'Has superado los 3 intentos permitidos. El acceso está bloqueado temporalmente durante 5 minutos.',
      remainingAttempts: 0,
      lockedUntil: lockStatus.lockedUntil,
    };
  }

  let session: Models.Session;
  try {
    session = await getAdminAccount().createEmailPasswordSession({
      email: validation.data.email,
      password: validation.data.password,
    });
  } catch (error: unknown) {
    const isInvalidCredentials =
      typeof error === 'object' && error !== null && 'type' in error &&
      error.type === 'user_invalid_credentials';

    if (isInvalidCredentials) {
      const updatedLock = recordFailedLoginAttempt(attemptKey);
      if (updatedLock.isLocked && updatedLock.lockedUntil) {
        return {
          success: false,
          error:
            'Has superado los 3 intentos permitidos. El acceso está bloqueado temporalmente durante 5 minutos.',
          remainingAttempts: 0,
          lockedUntil: updatedLock.lockedUntil,
        };
      }
      return {
        success: false,
        error: mapAppwriteAuthError(error),
        remainingAttempts: updatedLock.remainingAttempts,
      };
    }

    return {
      success: false,
      error: mapAppwriteAuthError(error),
    };
  }

  resetLoginAttempts(attemptKey);
  let destination: string;
  try {
    await ensureClientMembership(session.userId);
    const role = await getUserRole(session.userId);
    destination = getUserDestination({ role });
    await setSessionCookie(session.secret, session.expire);
  } catch {
    if (session.secret) {
      await createSessionAccountClient(session.secret).deleteSession({ sessionId: 'current' }).catch(() => {});
    }
    return {
      success: false,
      error: 'No se ha podido completar el acceso. Inténtalo de nuevo o contacta con el administrador.',
    };
  }
  redirect(destination);
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const validation = validateRegisterInput({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validation.valid || !validation.data) {
    return {
      success: false,
      error: validation.error,
      fieldErrors: validation.fieldErrors,
    };
  }

  let destination: string;
  let created = false;
  try {
    const account = getAdminAccount();

    const user = await account.create({
      userId: ID.unique(),
      email: validation.data.email,
      password: validation.data.password,
      name: validation.data.name,
    });
    created = true;
    await ensureClientMembership(user.$id);

    const session = await account.createEmailPasswordSession({
      email: validation.data.email,
      password: validation.data.password,
    });

    await setSessionCookie(session.secret, session.expire);
    destination = '/clientes';
  } catch (error: unknown) {
    return {
      success: false,
      error: created
        ? 'Tu cuenta se ha creado, pero no se ha podido completar el acceso. Intenta iniciar sesión.'
        : mapAppwriteAuthError(error),
    };
  }
  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = getAuthCookieName();

  try {
    const sessionAccount = await getSessionAccount();
    if (sessionAccount) {
      await sessionAccount.deleteSession({ sessionId: 'current' });
    }
  } catch {
    // Session may already be expired on Appwrite; still clear the local cookie
  }

  cookieStore.delete(cookieName);
  redirect('/iniciar-sesion');
}
