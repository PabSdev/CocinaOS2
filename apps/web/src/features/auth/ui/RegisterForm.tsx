'use client';

import type { AuthActionState } from '@/entities/session';
import {
  Alert02Icon,
  ArrowRight01Icon,
  Loading03Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useActionState, useState } from 'react';
import { registerAction } from '../api/auth.actions';

const initialState: AuthActionState = {
  success: false,
};

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-[12px] border border-[#f2c6c5] bg-[#fdebec] px-3.5 py-3 text-sm font-medium text-[#962b29]"
        >
          <HugeiconsIcon
            icon={Alert02Icon}
            size={18}
            strokeWidth={1.9}
            className="mt-0.5 shrink-0"
          />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="register-name" className="block text-sm font-medium text-[#142238]">
          Nombre y apellidos o cargo
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Ej. Carlos Mendoza, Jefe de partida"
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className="h-11 w-full rounded-[12px] border border-[#dce3e9] bg-[#ffffff] px-3.5 text-sm text-[#142238] placeholder:text-[#7c8ea3] transition-colors outline-none focus:border-[#112747] focus:ring-2 focus:ring-[#112747]/15"
        />
        {state.fieldErrors?.name && (
          <p className="text-xs font-medium text-[#962b29]">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="register-email" className="block text-sm font-medium text-[#142238]">
          Correo electrónico profesional
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="operaciones@obrador.es"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className="h-11 w-full rounded-[12px] border border-[#dce3e9] bg-[#ffffff] px-3.5 text-sm text-[#142238] placeholder:text-[#7c8ea3] transition-colors outline-none focus:border-[#112747] focus:ring-2 focus:ring-[#112747]/15"
        />
        {state.fieldErrors?.email && (
          <p className="text-xs font-medium text-[#962b29]">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="register-password" className="block text-sm font-medium text-[#142238]">
            Contraseña
          </label>
          <span className="text-xs font-medium text-[#55667e]">8 caracteres como mínimo</span>
        </div>
        <div className="relative">
          <input
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Crea una contraseña segura"
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className="h-11 w-full rounded-[12px] border border-[#dce3e9] bg-[#ffffff] pr-10 pl-3.5 text-sm text-[#142238] placeholder:text-[#7c8ea3] transition-colors outline-none focus:border-[#112747] focus:ring-2 focus:ring-[#112747]/15"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#55667e] transition-colors hover:text-[#142238]"
          >
            <HugeiconsIcon
              icon={showPassword ? ViewOffSlashIcon : ViewIcon}
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p className="text-xs font-medium text-[#962b29]">{state.fieldErrors.password}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#112747] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#193865] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <HugeiconsIcon
              icon={Loading03Icon}
              size={18}
              strokeWidth={2}
              className="animate-spin"
            />
            <span>Creando tu cuenta...</span>
          </>
        ) : (
          <>
            <span>Crear cuenta y entrar</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={1.9} />
          </>
        )}
      </button>

      {onSwitchToLogin && (
        <div className="pt-2 text-center text-sm text-[#55667e]">
          <span>¿Ya dispones de acceso a CocinaOS? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#112747] underline-offset-4 hover:underline"
          >
            Iniciar sesión
          </button>
        </div>
      )}
    </form>
  );
}
