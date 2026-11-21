import { describe, expect, it } from 'vitest'
import {
  computeDraftEscandallo,
  recipeItemsToDraftLines,
  validateAndBuildRecipePayload,
  type DraftDishRecipeLine,
  type RecipeIngredient,
} from './recipe-draft'
import type { RecipeItem } from './types'

describe('recipe-draft model', () => {
  describe('recipeItemsToDraftLines', () => {
    it('transforma items de receta persistidos a líneas de borrador editables', () => {
      const items: RecipeItem[] = [
        {
          $id: 'item-1',
          $createdAt: '2026-01-01',
          $updatedAt: '2026-01-01',
          plato_id: 'dish-1',
          ingrediente_id: 'ing-1',
          cantidad: 250,
          unidad: 'G',
          merma_ingrediente_receta: 10,
        },
        {
          $id: 'item-2',
          $createdAt: '2026-01-01',
          $updatedAt: '2026-01-01',
          plato_id: 'dish-1',
          ingrediente_id: 'ing-2',
          cantidad: 0.5,
          unidad: 'L',
          merma_ingrediente_receta: null,
        },
      ]

      const lines = recipeItemsToDraftLines(items)

      expect(lines).toEqual([
        {
          localId: 'item-1',
          ingrediente_id: 'ing-1',
          cantidad: '250',
          unidad: 'G',
          merma_override: '10',
        },
        {
          localId: 'item-2',
          ingrediente_id: 'ing-2',
          cantidad: '0.5',
          unidad: 'L',
          merma_override: '',
        },
      ])
    })
  })

  describe('validateAndBuildRecipePayload', () => {
    it('valida correctamente líneas con punto y coma decimal', () => {
      const lines: DraftDishRecipeLine[] = [
        {
          localId: '1',
          ingrediente_id: 'ing-1',
          cantidad: '150,5',
          unidad: 'G',
          merma_override: '12,5',
        },
        {
          localId: '2',
          ingrediente_id: 'ing-2',
          cantidad: '0.75',
          unidad: 'KG',
          merma_override: '',
        },
      ]

      const res = validateAndBuildRecipePayload(lines)

      expect(res.valid).toBe(true)
      expect(res.error).toBeUndefined()
      expect(res.payload).toEqual([
        {
          ingrediente_id: 'ing-1',
          cantidad: 150.5,
          unidad: 'G',
          merma_ingrediente_receta: 12.5,
        },
        {
          ingrediente_id: 'ing-2',
          cantidad: 0.75,
          unidad: 'KG',
          merma_ingrediente_receta: null,
        },
      ])
    })

    it.each(['0', '-1', 'abc', '   ', '0,00'])(
      'rechaza cantidad no positiva o no numérica: %s',
      (qty) => {
        const lines: DraftDishRecipeLine[] = [
          {
            localId: '1',
            ingrediente_id: 'ing-1',
            cantidad: qty,
            unidad: 'G',
            merma_override: '',
          },
        ]

        const res = validateAndBuildRecipePayload(lines)
        expect(res.valid).toBe(false)
        expect(res.error).toBe('Todas las cantidades útiles de la receta deben ser mayores que 0.')
        expect(res.payload).toEqual([])
      }
    )

    it.each(['-0.1', '100', '105', 'inválido'])(
      'rechaza porcentaje de merma fuera del rango [0, 100): %s',
      (merma) => {
        const lines: DraftDishRecipeLine[] = [
          {
            localId: '1',
            ingrediente_id: 'ing-1',
            cantidad: '100',
            unidad: 'G',
            merma_override: merma,
          },
        ]

        const res = validateAndBuildRecipePayload(lines)
        expect(res.valid).toBe(false)
        expect(res.error).toBe('El porcentaje de merma en la receta debe estar entre 0 % y 99,99 %.')
        expect(res.payload).toEqual([])
      }
    )
  })

  describe('computeDraftEscandallo', () => {
    const ingredients: RecipeIngredient[] = [
      {
        $id: 'patata',
        nombre: 'Patata Monalisa',
        descripcion: 'Patata limpia',
        stock: 50,
        unidad_de_masa: 'KG',
        precio_compra: 1.5,
        merma_habitual: 10,
      },
      {
        $id: 'aceite',
        nombre: 'Aceite de Oliva',
        descripcion: null,
        stock: 20,
        unidad_de_masa: 'L',
        precio_compra: 8.0,
        merma_habitual: 0,
      },
    ]

    it('calcula el escandallo en borrador vinculando los ingredientes del catálogo', () => {
      const lines: DraftDishRecipeLine[] = [
        {
          localId: 'line-1',
          ingrediente_id: 'patata',
          cantidad: '200',
          unidad: 'G',
          merma_override: '20', // override merma habitual
        },
        {
          localId: 'line-2',
          ingrediente_id: 'aceite',
          cantidad: '20',
          unidad: 'ML',
          merma_override: '',
        },
      ]

      const escandallo = computeDraftEscandallo(lines, ingredients, '12,00 €')

      expect(escandallo.lines).toHaveLength(2)
      expect(escandallo.lines[0].nombre).toBe('Patata Monalisa')
      expect(escandallo.lines[0].mermaAplicadaPct).toBe(20)
      expect(escandallo.costeTotalRacion).toBeGreaterThan(0)
      expect(escandallo.foodCostPct).not.toBeNull()
    })

    it('gestiona ingredientes no encontrados en catálogo asignando nombre por defecto', () => {
      const lines: DraftDishRecipeLine[] = [
        {
          localId: 'line-1',
          ingrediente_id: 'ing-desconocido',
          cantidad: '100',
          unidad: 'G',
          merma_override: '',
        },
      ]

      const escandallo = computeDraftEscandallo(lines, [])
      expect(escandallo.lines[0].nombre).toBe('Ingrediente')
      expect(escandallo.lines[0].warnings).toContain('SIN_PRECIO')
    })
  })
})
