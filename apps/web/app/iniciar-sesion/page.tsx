import { AuthPage } from '@/_pages/auth';
import { getLoggedInUser, getUserDestination } from '@/entities/session';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Iniciar sesión | CocinaOS',
  description: 'Accede a tu panel de inventario, escandallos y control de mermas en CocinaOS.',
};

export default async function IniciarSesionRoute() {
  const user = await getLoggedInUser();
  if (user) {
    redirect(getUserDestination(user));
  }
  return <AuthPage defaultMode="login" />;
}
