import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DishFilters } from './DishFilters'

describe('DishFilters component', () => {
  it('renderiza el input de búsqueda y los filtros de foto y stock', () => {
    render(
      <DishFilters
        search=""
        onSearchChange={vi.fn()}
        photoFilter="all"
        onPhotoFilterChange={vi.fn()}
        lowStockOnly={false}
        onLowStockChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/Buscar platos/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /^Todos$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Con foto$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /^Sin foto$/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /Solo stock bajo/i })).toBeDefined()
    expect(screen.queryByRole('button', { name: /Limpiar todos los filtros/i })).toBeNull()
  })

  it('emite onSearchChange cuando el usuario escribe en el input', () => {
    const onSearchChange = vi.fn()
    render(
      <DishFilters
        search=""
        onSearchChange={onSearchChange}
        photoFilter="all"
        onPhotoFilterChange={vi.fn()}
        lowStockOnly={false}
        onLowStockChange={vi.fn()}
      />
    )

    const input = screen.getByLabelText(/Buscar platos/i)
    fireEvent.change(input, { target: { value: 'Risotto' } })

    expect(onSearchChange).toHaveBeenCalledWith('Risotto')
  })

  it('conmuta la opción de fotografía al hacer click', () => {
    const onPhotoFilterChange = vi.fn()
    render(
      <DishFilters
        search=""
        onSearchChange={vi.fn()}
        photoFilter="all"
        onPhotoFilterChange={onPhotoFilterChange}
        lowStockOnly={false}
        onLowStockChange={vi.fn()}
      />
    )

    const withPhotoBtn = screen.getByRole('button', { name: /^Con foto$/i })
    fireEvent.click(withPhotoBtn)

    expect(onPhotoFilterChange).toHaveBeenCalledWith('with-photo')
  })

  it('muestra el botón "Limpiar filtros" si hay filtros activos y los resetea al pulsar', () => {
    const onSearchChange = vi.fn()
    const onPhotoFilterChange = vi.fn()
    const onLowStockChange = vi.fn()

    render(
      <DishFilters
        search="Paella"
        onSearchChange={onSearchChange}
        photoFilter="with-photo"
        onPhotoFilterChange={onPhotoFilterChange}
        lowStockOnly={true}
        onLowStockChange={onLowStockChange}
      />
    )

    const clearBtn = screen.getByRole('button', { name: /Limpiar todos los filtros/i })
    expect(clearBtn).toBeDefined()

    fireEvent.click(clearBtn)

    expect(onSearchChange).toHaveBeenCalledWith('')
    expect(onPhotoFilterChange).toHaveBeenCalledWith('all')
    expect(onLowStockChange).toHaveBeenCalledWith(false)
  })
})
