import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecipeSheetEditor } from './RecipeSheetEditor'
import { toast } from 'sonner'
import type { Dish } from '@/entities/dish'
import type { Ingredient } from '@/entities/ingredient'
import type { RecipeSheet } from '@/entities/recipe'

const { mockSaveRecipeSheet, mockPush } = vi.hoisted(() => ({
  mockSaveRecipeSheet: vi.fn(),
  mockPush: vi.fn(),
}))

vi.mock('@/entities/recipe', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/recipe')>()
  return {
    ...actual,
    saveRecipeSheet: mockSaveRecipeSheet,
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('RecipeSheetEditor', () => {
  const mockDishes: Dish[] = [
    {
      $id: 'dish-1',
      nombre: 'Arroz con Pollo',
      precio: '12,00',
      stock: 10,
      foto: null,
      $createdAt: '2026-01-01',
      $updatedAt: '2026-01-01',
    },
  ]

  const mockIngredients: Ingredient[] = [
    {
      $id: 'ing-1',
      nombre: 'Arroz Bomba',
      descripcion: null,
      unidad_de_masa: 'KG',
      merma_habitual: 0,
      precio_compra: 3.5,
      stock: 50,
      $createdAt: '2026-01-01',
      $updatedAt: '2026-01-01',
    },
    {
      $id: 'ing-2',
      nombre: 'Pechuga de Pollo',
      descripcion: null,
      unidad_de_masa: 'KG',
      merma_habitual: 10,
      precio_compra: 8.0,
      stock: 20,
      $createdAt: '2026-01-01',
      $updatedAt: '2026-01-01',
    },
  ]

  const mockSheet: RecipeSheet = {
    dish: mockDishes[0],
    version: '2026-01-01T00:00:00.000Z',
    lines: [
      {
        $id: 'line-1',
        plato_id: 'dish-1',
        ingrediente_id: 'ing-1',
        cantidad: 150,
        unidad: 'G',
        merma_ingrediente_receta: null,
        $createdAt: '2026-01-01',
        $updatedAt: '2026-01-01',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza la cabecera, ingredientes y estado inicial no modificado', () => {
    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    expect(screen.getByRole('heading', { name: /Escandallos y recetas/i })).toBeDefined()
    expect(screen.getByText('Ficha guardada')).toBeDefined()
    expect(screen.getAllByText('Arroz Bomba').length).toBeGreaterThan(0)

    const saveBtn = screen.getByRole('button', { name: /Guardar escandallo/i })
    const discardBtn = screen.getByRole('button', { name: /Descartar/i })

    expect(saveBtn).toHaveProperty('disabled', true)
    expect(discardBtn).toHaveProperty('disabled', true)
  })

  it('detecta estado modificado (dirty) al alterar el PVP', () => {
    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    const pvpInput = screen.getByLabelText(/PVP fijado en carta con IVA/i)
    fireEvent.change(pvpInput, { target: { value: '14,50' } })

    expect(screen.getByText('Cambios sin guardar')).toBeDefined()

    const saveBtn = screen.getByRole('button', { name: /Guardar escandallo/i })
    const discardBtn = screen.getByRole('button', { name: /Descartar/i })

    expect(saveBtn).toHaveProperty('disabled', false)
    expect(discardBtn).toHaveProperty('disabled', false)
  })

  it('permite descartar las modificaciones volviendo al estado original', () => {
    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    const pvpInput = screen.getByLabelText(/PVP fijado en carta con IVA/i)
    fireEvent.change(pvpInput, { target: { value: '18,00' } })
    expect(screen.getByText('Cambios sin guardar')).toBeDefined()

    const discardBtn = screen.getByRole('button', { name: /Descartar/i })
    fireEvent.click(discardBtn)

    expect(screen.getByText('Ficha guardada')).toBeDefined()
    expect((pvpInput as HTMLInputElement).value).toBe('12,00')
  })

  it('guarda el escandallo con éxito y notifica mediante toast', async () => {
    mockSaveRecipeSheet.mockResolvedValueOnce({ success: true })

    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    const pvpInput = screen.getByLabelText(/PVP fijado en carta con IVA/i)
    fireEvent.change(pvpInput, { target: { value: '15,00' } })

    const saveBtn = screen.getByRole('button', { name: /Guardar escandallo/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockSaveRecipeSheet).toHaveBeenCalledWith(
        expect.objectContaining({
          dishId: 'dish-1',
          price: '15,00',
          version: '2026-01-01T00:00:00.000Z',
        })
      )
      expect(toast.success).toHaveBeenCalledWith('Escandallo guardado correctamente.')
    })
  })

  it('muestra mensaje de alerta si la acción saveRecipeSheet devuelve error', async () => {
    mockSaveRecipeSheet.mockResolvedValueOnce({
      error: 'La versión de la ficha está desactualizada.',
    })

    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    const pvpInput = screen.getByLabelText(/PVP fijado en carta con IVA/i)
    fireEvent.change(pvpInput, { target: { value: '16,00' } })

    const saveBtn = screen.getByRole('button', { name: /Guardar escandallo/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockSaveRecipeSheet).toHaveBeenCalled()
      expect(screen.getByRole('alert')).toBeDefined()
      expect(screen.getByText('La versión de la ficha está desactualizada.')).toBeDefined()
    })
  })

  it('aplica el PVP recomendado al campo de carta al pulsar "Aplicar a carta"', () => {
    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    const applyBtn = screen.getByRole('button', { name: /Aplicar a carta/i })
    expect(applyBtn).toHaveProperty('disabled', false)

    fireEvent.click(applyBtn)

    expect(toast.success).toHaveBeenCalledWith('PVP recomendado aplicado al campo de carta.')
    const pvpInput = screen.getByLabelText(/PVP fijado en carta con IVA/i) as HTMLInputElement
    expect(pvpInput.value).not.toBe('12,00')
    expect(screen.getByText('Cambios sin guardar')).toBeDefined()
  })

  it('permite cambiar el tipo de IVA a 21 %, 10 % y 4 % recalculando la base imponible y cuota', () => {
    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    // Por defecto inicia en 10 % (Hostelería)
    expect(screen.getByText(/Ingreso neto sin IVA \(10 %\):/i)).toBeDefined()

    // Cambiar a 21 % (General)
    const vat21Btn = screen.getByRole('button', { name: /21 %/i })
    fireEvent.click(vat21Btn)
    expect(screen.getByText(/Ingreso neto sin IVA \(21 %\):/i)).toBeDefined()
    expect(screen.getByText(/Cuota IVA \(21 %\):/i)).toBeDefined()

    // Cambiar a 4 % (Superreducido)
    const vat4Btn = screen.getByRole('button', { name: /4 %/i })
    fireEvent.click(vat4Btn)
    expect(screen.getByText(/Ingreso neto sin IVA \(4 %\):/i)).toBeDefined()
    expect(screen.getByText(/Cuota IVA \(4 %\):/i)).toBeDefined()
  })

  it('renderiza la explicación de cálculos arriba y confirma que la card de impacto ha sido eliminada', () => {
    render(
      <RecipeSheetEditor
        dishes={mockDishes}
        sheet={mockSheet}
        ingredients={mockIngredients}
      />
    )

    // Cómo se calculan arriba
    expect(screen.getByText(/Cómo se calculan las cantidades, mermas y rentabilidad/i)).toBeDefined()
    // La card de impacto está eliminada del panel lateral
    expect(screen.queryByText(/Impacto de materias primas/i)).toBeNull()
    expect(screen.queryByText(/Impacto por ingrediente/i)).toBeNull()
  })
})
