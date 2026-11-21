import { getLoggedInUser, getUserDestination } from '@/entities/session';
import { redirect } from 'next/navigation';
import { getClientMenu } from '@/entities/client-menu';
import { ClientMenu } from './ClientMenu';

export async function ClientesPage() {
  const user = await getLoggedInUser();

  if (!user) redirect('/iniciar-sesion');
  if (user.role !== 'cliente') redirect(getUserDestination(user));

  const menu = await getClientMenu();

  return (
    <div className="min-h-screen bg-[#f7f8f7] text-[#142238]">
      <ClientMenu {...menu} user={{ name: user.name, email: user.email }} />
    </div>
  );
}
