import { cookies } from 'next/headers';
import { env } from 'process';
import { createSessionAccountClient, getAuthCookieName, Query, teams } from './db';

const KITCHEN_TEAM = env.KITCHEN_TEAM || '';
const CLIENTS_TEAM = env.CLIENTS_TEAM || '';

export type UserRole = 'cliente' | 'cocinero' | 'admin';

async function membership(teamId: string, userId: string) {
  const result = await teams.listMemberships({
    teamId,
    queries: [Query.equal('userId', userId)],
  });
  return result.memberships.find((member) => member.confirm);
}

export async function getUserRole(userId: string): Promise<UserRole> {
  const kitchen = await membership(KITCHEN_TEAM, userId);
  if (kitchen) return kitchen.roles.includes('admin') ? 'admin' : 'cocinero';
  if (await membership(CLIENTS_TEAM, userId)) return 'cliente';
  throw new Error('El usuario no pertenece a ningún equipo autorizado.');
}

export async function ensureClientMembership(userId: string): Promise<void> {
  if ((await membership(KITCHEN_TEAM, userId)) || (await membership(CLIENTS_TEAM, userId))) return;
  try {
    await teams.createMembership({ teamId: CLIENTS_TEAM, roles: ['cliente'], userId });
  } catch (error) {
    // A concurrent login may have created the membership first.
    if (!(await membership(CLIENTS_TEAM, userId))) throw error;
  }
}

export async function requireKitchenAccess(): Promise<void> {
  const secret = (await cookies()).get(getAuthCookieName())?.value;
  if (!secret) throw new Error('Acceso no autorizado.');
  const user = await createSessionAccountClient(secret).get();
  if (!user.status || !(await membership(KITCHEN_TEAM, user.$id))) {
    throw new Error('Acceso no autorizado.');
  }
}
