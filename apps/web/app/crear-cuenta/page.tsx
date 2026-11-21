import { AuthPage } from '@/_pages/auth';
import { getLoggedInUser, getUserDestination } from '@/entities/session';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Crear cuenta | CocinaOS',
  description: 'Registra tu cocina u obrador en CocinaOS y controla tus existencias y costes.',
};

export default async function CrearCuentaRoute() {
  const user = await getLoggedInUser();
  if (user) {
    redirect(getUserDestination(user));
  }
  return <AuthPage defaultMode="register" />;
}
