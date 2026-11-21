vi.mock('@/shared/api', () => ({ requireKitchenAccess: vi.fn().mockResolvedValue(undefined) }))
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRecipeSheet, getRecipeSheetDishes, saveRecipeSheet } from './recipe-sheet.actions'

const { save, listDishes, get, revalidatePath } = vi.hoisted(() => ({
  save: vi.fn(),
  listDishes: vi.fn(),
  get: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath }))
vi.mock('./recipe-sheet.repository', () => ({
  recipeSheetDb: { save, listDishes, get },
}))

const input = { dishId: 'plato', price: '6,50', version: 'v1', lines: [] }

describe('acciones de escandallos', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
  })

  it('obtiene los platos de escandallo delegando en recipeSheetDb.listDishes', async () => {
    const dishes = [{ $id: 'p1', nombre: 'Pizza' }]
    listDishes.mockResolvedValueOnce(dishes)

    const result = await getRecipeSheetDishes()
    expect(result).toBe(dishes)
    expect(listDishes).toHaveBeenCalledOnce()
  })

  it('obtiene la ficha técnica delegando en recipeSheetDb.get', async () => {
    const sheet = { dish: { $id: 'p1' }, lines: [], version: '1' }
    get.mockResolvedValueOnce(sheet)

    const result = await getRecipeSheet('p1')
    expect(result).toBe(sheet)
    expect(get).toHaveBeenCalledWith('p1')
  })

  describe('acción de guardado de escandallos', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
  })

  it.each(['production', 'development'])('guarda en %s y actualiza escandallos y platos', async (env) => {
    vi.stubEnv('NODE_ENV', env)
    save.mockResolvedValue({})

    expect(await saveRecipeSheet(input)).toEqual({})
    expect(save).toHaveBeenCalledExactlyOnceWith(input)
    expect(revalidatePath.mock.calls).toEqual([['/escandallos'], ['/platos']])
  })

  it('conserva el error de guardado sin actualizar la vista', async () => {
    save.mockResolvedValue({ error: 'Conflicto de edición' })

    expect(await saveRecipeSheet(input)).toEqual({ error: 'Conflicto de edición' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('devuelve un error comprensible si falla la persistencia', async () => {
    save.mockRejectedValue(new Error('write failed'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(await saveRecipeSheet(input)).toEqual({
        error: 'No se pudo confirmar el guardado. El borrador sigue disponible.',
      })
      expect(revalidatePath).not.toHaveBeenCalled()
    } finally {
      log.mockRestore()
    }
  })
})
})

