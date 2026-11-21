import type { Dish } from '@/entities/dish';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteDishDialog } from './DeleteDishDialog';

const { mockDeleteDish } = vi.hoisted(() => ({
  mockDeleteDish: vi.fn(),
}));

vi.mock('@/entities/dish', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/dish')>();
  return {
    ...actual,
    deleteDish: mockDeleteDish,
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('DeleteDishDialog', () => {
  const mockDish: Dish = {
    $id: 'dish-123',
    nombre: 'Arroz Negro',
    precio: '14.50 €',
    stock: 5,
    foto: 'foto-123',
    $createdAt: '2026-01-01',
    $updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si dish es null', () => {
    const { container } = render(
      <DeleteDishDialog dish={null} open={true} onOpenChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza la información del plato cuando open es true', () => {
    render(<DeleteDishDialog dish={mockDish} open={true} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Eliminar plato/i })).toBeDefined();
    expect(screen.getByText('Arroz Negro')).toBeDefined();
    expect(screen.getByText('14.50 €')).toBeDefined();
    expect(screen.getByText('5 raciones')).toBeDefined();
  });

  it('cierra el diálogo al pulsar el botón Cancelar', () => {
    const onOpenChange = vi.fn();
    render(<DeleteDishDialog dish={mockDish} open={true} onOpenChange={onOpenChange} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('ejecuta deleteDish y notifica éxito al confirmar la eliminación', async () => {
    mockDeleteDish.mockResolvedValueOnce({ success: true });
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();

    render(
      <DeleteDishDialog
        dish={mockDish}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /Eliminar plato/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteDish).toHaveBeenCalledWith('dish-123');
      expect(toast.success).toHaveBeenCalledWith('Plato "Arroz Negro" eliminado.');
      expect(onDeleted).toHaveBeenCalledWith('dish-123');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('muestra toast de error si la acción deleteDish falla', async () => {
    mockDeleteDish.mockResolvedValueOnce({ success: false, error: 'Fallo al borrar' });
    const onOpenChange = vi.fn();
    const onDeleted = vi.fn();

    render(
      <DeleteDishDialog
        dish={mockDish}
        open={true}
        onOpenChange={onOpenChange}
        onDeleted={onDeleted}
      />,
    );

    const confirmBtn = screen.getByRole('button', { name: /Eliminar plato/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteDish).toHaveBeenCalledWith('dish-123');
      expect(toast.error).toHaveBeenCalledWith('Fallo al borrar');
      expect(onDeleted).not.toHaveBeenCalled();
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});
