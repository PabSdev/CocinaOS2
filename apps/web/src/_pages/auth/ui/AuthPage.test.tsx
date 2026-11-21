import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/features/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/auth')>();
  return {
    ...actual,
    loginAction: vi.fn(async () => ({ success: false })),
    registerAction: vi.fn(async () => ({ success: false })),
  };
});

describe('AuthPage unified split-screen', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders login form by default and editorial quote on the split panel', () => {
    render(<AuthPage defaultMode="login" />);

    expect(
      screen.getByRole('heading', { name: 'Inicia sesión en tu cocina' }),
    ).toBeDefined();
    expect(screen.getByLabelText('Correo electrónico')).toBeDefined();
    expect(screen.getByRole('button', { name: /Acceder a CocinaOS/i })).toBeDefined();
    expect(
      screen.getAllByText(/La rentabilidad de una cocina no se adivina en el cierre de mes/i)
        .length,
    ).toBeGreaterThan(0);
  });

  it('switches between Iniciar sesión and Crear cuenta on the same screen', () => {
    render(<AuthPage defaultMode="login" />);

    const registerTab = screen.getByRole('tab', { name: 'Crear cuenta' });
    fireEvent.click(registerTab);

    expect(
      screen.getByRole('heading', { name: 'Crea tu cuenta en CocinaOS' }),
    ).toBeDefined();
    expect(screen.getByLabelText('Nombre y apellidos o cargo')).toBeDefined();
    expect(
      screen.getByRole('button', { name: /Crear cuenta y entrar/i }),
    ).toBeDefined();

    const loginTab = screen.getByRole('tab', { name: 'Iniciar sesión' });
    fireEvent.click(loginTab);

    expect(
      screen.getByRole('heading', { name: 'Inicia sesión en tu cocina' }),
    ).toBeDefined();
  });
});
