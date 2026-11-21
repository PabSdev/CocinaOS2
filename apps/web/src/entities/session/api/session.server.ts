import {
  adminAccount,
  createSessionAccountClient,
  getAuthCookieName,
  getUserRole,
  type UserRole,
  type Models,
} from '@/shared/api';
import { cookies } from 'next/headers';
import type { SessionUser } from '../model/types';

export function mapAppwriteUserToSessionUser(
  user: Models.User<Models.Preferences>,
  role: UserRole,
): SessionUser {
  return {
    $id: user.$id,
    email: user.email,
    name: user.name,
    status: user.status,
    $createdAt: user.$createdAt,
    role,
  };
}

export function getAdminAccount() {
  return adminAccount;
}

export async function getSessionAccount() {
  const cookieStore = await cookies();
  const cookieName = getAuthCookieName();
  const sessionCookie = cookieStore.get(cookieName);

  if (!sessionCookie?.value) {
    return null;
  }

  return createSessionAccountClient(sessionCookie.value);
}

export async function getLoggedInUser(): Promise<SessionUser | null> {
  try {
    const account = await getSessionAccount();
    if (!account) {
      return null;
    }

    const user = await account.get();
    if (!user.status) return null;
    return mapAppwriteUserToSessionUser(user, await getUserRole(user.$id));
  } catch {
    return null;
  }
}

export function getUserDestination(user: Pick<SessionUser, 'role'>): string {
  return user.role === 'cliente' ? '/clientes' : '/ingredientes';
}

export { getAuthCookieName };
