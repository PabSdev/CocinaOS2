'use client';

import type { AuthActionState } from '@/entities/session';
import {
  Alert02Icon,
  ArrowRight01Icon,
  Loading03Icon,
  Time02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useActionState, useEffect, useState } from 'react';
import { loginAction } from '../api/auth.actions';

const initialState: AuthActionState = {
  success: false,
};

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!state.lockedUntil) {
      setRemainingSeconds(0);
      return;
    }

    const calculateRemaining = () => {
      const diffMs = state.lockedUntil! - Date.now();
      return Math.max(0, Math.ceil(diffMs / 1000));
    };

    const initialDiff = calculateRemaining();
    setRemainingSeconds(initialDiff);

    if (initialDiff <= 0) return;

    const timer = setInterval(() => {
      const nextDiff = calculateRemaining();
      setRemainingSeconds(nextDiff);
      if (nextDiff <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [state.lockedUntil]);

  const isLocked = remainingSeconds > 0;
  const minutes = Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  const countdownFormatted = `${minutes}:${seconds}`;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.error && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-[12px] border border-[#f2c6c5] bg-[#fdebec] p-3.5 text-sm font-medium text-[#962b29]"
        >
          <div className="flex items-start gap-2.5">
            <HugeiconsIcon
              icon={isLocked ? Time02Icon : Alert02Icon}
              size={18}
              strokeWidth={1.9}
              className="mt-0.5 shrink-0"
            />
            <span className="flex-1">{state.error}</span>
          </div>

          {!isLocked && state.remainingAttempts !== undefined && state.remainingAttempts > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-[#f5dfa2] bg-[#fbf3db] px-2.5 py-0.5 text-xs font-semibold text-[#8a5700] tabular-nums">
                {state.remainingAttempts === 1
                  ? '1 intento restante antes de bloqueo'
                  : `${state.remainingAttempts} intentos restantes antes de bloqueo`}
              </span>
            </div>
          )}

          {isLocked && (
            <div className="flex items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-[#f2c6c5] bg-[#ffffff] px-2.5 py-0.5 text-xs font-semibold text-[#962b29] tabular-nums">
                Tiempo de espera activo: {countdownFormatted}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-medium text-[#142238]">
          Correo electrónico
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending || isLocked}
          placeholder="chef@restaurante.es"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className="h-11 w-full rounded-[12px] border border-[#dce3e9] bg-[#ffffff] px-3.5 text-sm text-[#142238] placeholder:text-[#7c8ea3] transition-colors outline-none focus:border-[#112747] focus:ring-2 focus:ring-[#112747]/15 disabled:cursor-not-allowed disabled:bg-[#f1f4f7] disabled:text-[#7c8ea3]"
        />
        {state.fieldErrors?.email && (
          <p className="text-xs font-medium text-[#962b29]">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-sm font-medium text-[#142238]">
            Contraseña
          </label>
          <span className="text-xs font-medium text-[#55667e]">Mínimo 8 caracteres</span>
        </div>
        <div className="relative">
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            minLength={8}
            disabled={isPending || isLocked}
            placeholder="Introduce tu contraseña"
            aria-invalid={Boolean(state.fieldErrors?.password)}
            className="h-11 w-full rounded-[12px] border border-[#dce3e9] bg-[#ffffff] pr-10 pl-3.5 text-sm text-[#142238] placeholder:text-[#7c8ea3] transition-colors outline-none focus:border-[#112747] focus:ring-2 focus:ring-[#112747]/15 disabled:cursor-not-allowed disabled:bg-[#f1f4f7] disabled:text-[#7c8ea3]"
          />
          <button
            type="button"
            disabled={isPending || isLocked}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-[#55667e] transition-colors hover:text-[#142238] disabled:cursor-not-allowed disabled:opacity-40"
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
        disabled={isPending || isLocked}
        className="inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-full bg-[#112747] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#193865] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <HugeiconsIcon
              icon={Loading03Icon}
              size={18}
              strokeWidth={2}
              className="animate-spin"
            />
            <span>Accediendo al panel...</span>
          </>
        ) : isLocked ? (
          <>
            <HugeiconsIcon icon={Time02Icon} size={18} strokeWidth={2} />
            <span>
              Acceso bloqueado (
              <span className="tabular-nums font-mono">{countdownFormatted}</span>)
            </span>
          </>
        ) : (
          <>
            <span>Acceder a CocinaOS</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={1.9} />
          </>
        )}
      </button>

      {onSwitchToRegister && (
        <div className="pt-2 text-center text-sm text-[#55667e]">
          <span>¿Todavía no tienes cuenta en CocinaOS? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-[#112747] underline-offset-4 hover:underline"
          >
            Crear cuenta nueva
          </button>
        </div>
      )}
    </form>
  );
}
