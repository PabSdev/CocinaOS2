import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getLoggedInUser, getUserDestination } from '@/entities/session';
import { Sidebar, MobileSidebar } from '@/widgets/sidebar';
import { Toaster } from '@/shared/ui';

interface AppLayoutProps {
  children: ReactNode;
}

export async function AppLayout({ children }: AppLayoutProps) {
  const user = await getLoggedInUser();

  if (!user) {
    redirect('/iniciar-sesion');
  }

  if (user.role === 'cliente') {
    redirect(getUserDestination(user));
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8f7] bg-[radial-gradient(circle_at_50%_0%,rgba(75,137,216,0.05),transparent_48%)] text-[#142238] antialiased">
      {/* Desktop Persistent Sidebar */}
      <Sidebar isAdmin={user.role === 'admin'} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile Top Bar & Drawer */}
        <MobileSidebar isAdmin={user.role === 'admin'} />

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>

      <Toaster richColors position="top-right" />
    </div>
  );
}
