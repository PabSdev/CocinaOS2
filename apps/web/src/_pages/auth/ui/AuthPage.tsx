'use client';

import { AuthFormTabs, type AuthMode, LoginForm, RegisterForm } from '@/features/auth';
import { Toaster } from '@/shared/ui';
import Link from 'next/link';
import { useState } from 'react';
import { AuthEditorialPanel } from './AuthEditorialPanel';

interface AuthPageProps {
  defaultMode?: AuthMode;
}

export function AuthPage({ defaultMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    if (typeof window !== 'undefined') {
      const targetPath = nextMode === 'login' ? '/iniciar-sesion' : '/crear-cuenta';
      window.history.replaceState(null, '', targetPath);
    }
  };

  return (
    <div className="grid min-h-screen w-full bg-[#f7f8f7] text-[#142238] lg:grid-cols-2">
      {/* Mitad izquierda: Frase empresarial e identidad culinaria */}
      <AuthEditorialPanel />

      {/* Mitad derecha: Contenedor del formulario unificado */}
      <main className="flex flex-col justify-between px-4 py-8 sm:px-8 md:px-12 lg:px-16">
        {/* Cabecera visible en móvil/tablet y acceso de retorno */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-bold tracking-tight text-[#112747] lg:invisible"
          >
            <span className="inline-flex h-7 w-7 flex-col items-start justify-center gap-0.5 rounded-[8px] bg-[#112747] px-1.5">
              <span className="h-0.5 w-3.5 rounded-full bg-white" />
              <span className="h-0.5 w-2.5 rounded-full bg-[#8ab8e6]" />
              <span className="h-0.5 w-3 rounded-full bg-white" />
            </span>
            <span>
              Cocina<span className="text-[#3e81d0]">OS</span>
            </span>
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[#dce3e9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#142238] transition-colors hover:bg-[#eff4f8]"
          >
            Volver a portada
          </Link>
        </div>

        {/* Isla central de autenticación */}
        <div className="mx-auto my-8 w-full max-w-[440px]">
          <div className="rounded-[20px] border border-[#dce3e9] bg-white p-6 sm:p-8">
            <div className="mb-6 space-y-2">
              <span className="inline-flex items-center rounded-full bg-[#eff4f8] px-3 py-1 text-xs font-semibold text-[#112747]">
                {mode === 'login' ? 'Acceso operativo' : 'Alta de nueva cuenta'}
              </span>
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#112747] sm:text-[28px]">
                {mode === 'login'
                  ? 'Inicia sesión en tu cocina'
                  : 'Crea tu cuenta en CocinaOS'}
              </h1>
              <p className="text-sm text-[#55667e]">
                {mode === 'login'
                  ? 'Accede a tu inventario, fichas técnicas y control de costes.'
                : 'Crea tu cuenta para acceder a tu espacio de cliente.'}
              </p>
            </div>

            <div className="mb-6">
              <AuthFormTabs mode={mode} onModeChange={handleModeChange} />
            </div>

            {mode === 'login' ? (
              <LoginForm onSwitchToRegister={() => handleModeChange('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => handleModeChange('login')} />
            )}
          </div>

          {/* Cita compacta sólo para móvil */}
          <div className="mt-6 rounded-[16px] border border-[#dce3e9] bg-[#eff4f8] p-4 lg:hidden">
            <p className="text-xs leading-relaxed font-medium text-[#112747]">
              «La rentabilidad de una cocina no se adivina en el cierre de mes; se
              defiende servicio a servicio, gramo a gramo.»
            </p>
          </div>
        </div>

        {/* Pie legal limpio */}
        <footer className="text-center text-xs text-[#55667e]">
          Protegido mediante sesiones cifradas HTTP-Only con Appwrite Cloud.
        </footer>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}
