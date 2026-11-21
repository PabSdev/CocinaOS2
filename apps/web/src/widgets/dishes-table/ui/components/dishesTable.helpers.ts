import { type Ingredient } from '@/entities/ingredient'
import { type Dish } from '@/entities/dish'
import {
  calculateRecipeEscandallo,
  type EscandalloLineInput,
  type RecipeItem,
} from '@/entities/recipe'
import { type PhotoFilter } from '@/features/dish/filter-dishes'

export function buildEscandalloByDishId(
  dishes: Dish[],
  ingredientMap: Map<string, Ingredient>,
  recipeByDishMap: Map<string, RecipeItem[]>
) {
  const map = new Map<string, ReturnType<typeof calculateRecipeEscandallo>>()
  for (const dish of dishes) {
    const items = recipeByDishMap.get(dish.$id) ?? []
    const lines: EscandalloLineInput[] = items.map((item) => {
      const ing = ingredientMap.get(item.ingrediente_id) ?? item.ingrediente
      return {
        id: item.$id,
        ingredienteId: item.ingrediente_id,
        nombre: ing?.nombre ?? 'Ingrediente',
        cantidadUtil: item.cantidad,
        unidadReceta: item.unidad,
        unidadCompra: ing?.unidad_de_masa ?? item.unidad,
        precioCompraUnitario: ing?.precio_compra ?? null,
        mermaHabitualPct: ing?.merma_habitual ?? null,
        mermaRecetaPct: item.merma_ingrediente_receta ?? null,
        stockActual: ing?.stock ?? 0,
      }
    })

    map.set(
      dish.$id,
      calculateRecipeEscandallo({
        lines,
        dishPriceGross: dish.precio,
        vatRatePct: 10,
      })
    )
  }
  return map
}

export function filterAndSortDishes(
  dishes: Dish[],
  deferredSearch: string,
  photoFilter: PhotoFilter,
  lowStockOnly: boolean
) {
  const query = deferredSearch.trim().toLocaleLowerCase('es')
  const filtered = dishes.filter((dish) => {
    const matchesSearch =
      !query ||
      dish.nombre.toLocaleLowerCase('es').includes(query) ||
      (dish.precio ?? '').toLocaleLowerCase('es').includes(query)

    const matchesPhoto =
      photoFilter === 'all' ||
      (photoFilter === 'with-photo' && Boolean(dish.foto)) ||
      (photoFilter === 'without-photo' && !dish.foto)

    const matchesStock = !lowStockOnly || dish.stock <= 5

    return matchesSearch && matchesPhoto && matchesStock
  })

  return lowStockOnly ? filtered.sort((a, b) => a.stock - b.stock) : filtered
}

export function computeDishesMetrics(dishes: Dish[]) {
  let lowStock = 0
  let withPhoto = 0
  let latestUpdate = ''

  for (const dish of dishes) {
    if (dish.stock <= 5) lowStock += 1
    if (dish.foto) withPhoto += 1
    const timestamp = dish.$updatedAt || dish.$createdAt || ''
    if (timestamp > latestUpdate) latestUpdate = timestamp
  }

  return { total: dishes.length, lowStock, withPhoto, latestUpdate }
}
