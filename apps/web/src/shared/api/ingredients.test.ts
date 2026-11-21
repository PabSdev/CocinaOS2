import { beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  listRows: vi.fn(),
  createRow: vi.fn(),
  updateRow: vi.fn(),
  deleteRow: vi.fn(),
}))

vi.mock('./db', () => ({
  tablesDB: db,
  DATABASE_ID: 'test-db',
  TABLE_INGREDIENTES_ID: 'test-ingredientes',
  ID: { unique: () => 'generated-id' },
  Query: {
    orderDesc: vi.fn((field) => `orderDesc(${field})`),
    limit: vi.fn((limit) => `limit(${limit})`),
    offset: vi.fn((offset) => `offset(${offset})`),
  },
}))

import { ingredientDb } from './ingredients'

describe('ingredientDb repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('pagina automáticamente hasta recuperar todos los registros si hay más de 100', async () => {
      // Simula primera página llena (100 elementos) y segunda página con 25 elementos
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        $id: `ing-${i}`,
        $createdAt: '2026-01-01',
        $updatedAt: '2026-01-01',
        nombre: `Ingrediente ${i}`,
        descripcion: null,
        stock: 10,
        unidad_de_masa: 'KG' as const,
        precio_compra: 2.5,
        merma_habitual: 5,
      }))
      const page2 = Array.from({ length: 25 }, (_, i) => ({
        $id: `ing-${100 + i}`,
        $createdAt: '2026-01-01',
        $updatedAt: '2026-01-01',
        nombre: `Ingrediente ${100 + i}`,
        descripcion: 'Especial',
        stock: 5,
        unidad_de_masa: 'L' as const,
        precio_compra: null,
        merma_habitual: null,
      }))

      db.listRows
        .mockResolvedValueOnce({ rows: page1 })
        .mockResolvedValueOnce({ rows: page2 })

      const result = await ingredientDb.list()

      expect(db.listRows).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(125)
      expect(result[0].nombre).toBe('Ingrediente 0')
      expect(result[100].unidad_de_masa).toBe('L')
      expect(result[100].precio_compra).toBeNull()
    })

    it('devuelve array vacío si no hay filas registradas', async () => {
      db.listRows.mockResolvedValueOnce({ rows: [] })

      const result = await ingredientDb.list()

      expect(db.listRows).toHaveBeenCalledOnce()
      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('crea y serializa un nuevo ingrediente usando ID único', async () => {
      const input = {
        nombre: 'Cebolla Morada',
        descripcion: 'Malla 5 kg',
        stock: 20,
        unidad_de_masa: 'KG' as const,
        precio_compra: 1.2,
        merma_habitual: 15,
      }

      db.createRow.mockResolvedValueOnce({
        $id: 'generated-id',
        $createdAt: '2026-02-01',
        $updatedAt: '2026-02-01',
        ...input,
      })

      const created = await ingredientDb.create(input)

      expect(db.createRow).toHaveBeenCalledWith({
        databaseId: 'test-db',
        tableId: 'test-ingredientes',
        rowId: 'generated-id',
        data: input,
      })
      expect(created.$id).toBe('generated-id')
      expect(created.nombre).toBe('Cebolla Morada')
      expect(created.merma_habitual).toBe(15)
    })
  })

  describe('update', () => {
    it('actualiza los datos y devuelve el ingrediente serializado', async () => {
      db.updateRow.mockResolvedValueOnce({
        $id: 'ing-1',
        $createdAt: '2026-01-01',
        $updatedAt: '2026-02-02',
        nombre: 'Cebolla Dulce',
        descripcion: null,
        stock: 25,
        unidad_de_masa: 'KG',
        precio_compra: 1.4,
        merma_habitual: null,
      })

      const updated = await ingredientDb.update('ing-1', {
        nombre: 'Cebolla Dulce',
        stock: 25,
      })

      expect(db.updateRow).toHaveBeenCalledWith({
        databaseId: 'test-db',
        tableId: 'test-ingredientes',
        rowId: 'ing-1',
        data: { nombre: 'Cebolla Dulce', stock: 25 },
      })
      expect(updated.nombre).toBe('Cebolla Dulce')
      expect(updated.stock).toBe(25)
    })
  })

  describe('delete', () => {
    it('invoca deleteRow con el ID especificado', async () => {
      db.deleteRow.mockResolvedValueOnce({})

      await ingredientDb.delete('ing-123')

      expect(db.deleteRow).toHaveBeenCalledWith({
        databaseId: 'test-db',
        tableId: 'test-ingredientes',
        rowId: 'ing-123',
      })
    })
  })
})
