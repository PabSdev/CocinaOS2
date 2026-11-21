'use client';

import { Logout01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useTransition } from 'react';
import { logoutAction } from '../api/auth.actions';

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

export function LogoutButton({ className, showText = false }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await logoutAction();
        });
      }}
      className="inline-flex"
    >
      <button
        type="submit"
        disabled={isPending}
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        className={
          className ||
          'inline-flex items-center gap-2 rounded-full border border-[#dce3e9] bg-white px-3 py-1.5 text-xs font-semibold text-[#55667e] transition-colors hover:border-[#f2c6c5] hover:bg-[#fdebec] hover:text-[#962b29] disabled:opacity-50'
        }
      >
        <HugeiconsIcon icon={Logout01Icon} size={15} strokeWidth={1.8} />
        {showText && <span>Cerrar sesión</span>}
      </button>
    </form>
  );
}
