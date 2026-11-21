'use client';

export type AuthMode = 'login' | 'register';

interface AuthFormTabsProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

export function AuthFormTabs({ mode, onModeChange }: AuthFormTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Modo de acceso"
      className="grid grid-cols-2 rounded-full border border-[#dce3e9] bg-[#eff4f8] p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'login'}
        onClick={() => onModeChange('login')}
        className={`h-10 rounded-full text-sm font-semibold transition-all duration-150 ${
          mode === 'login'
            ? 'bg-[#112747] text-white shadow-xs'
            : 'text-[#55667e] hover:text-[#142238]'
        }`}
      >
        Iniciar sesión
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        onClick={() => onModeChange('register')}
        className={`h-10 rounded-full text-sm font-semibold transition-all duration-150 ${
          mode === 'register'
            ? 'bg-[#112747] text-white shadow-xs'
            : 'text-[#55667e] hover:text-[#142238]'
        }`}
      >
        Crear cuenta
      </button>
    </div>
  );
}
