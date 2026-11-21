import { getDishes } from '@/entities/dish'
import { getIngredients } from '@/entities/ingredient'
import { getRecipeItems } from '@/entities/recipe'
import { DishesTableWidget } from '@/widgets/dishes-table'

export async function DishesPage() {
  const [dishesRes, ingredientsRes, recipesRes] = await Promise.all([
    getDishes(),
    getIngredients(),
    getRecipeItems(),
  ])

  const initialDishes = dishesRes.success && dishesRes.data ? dishesRes.data : []
  const initialIngredients =
    ingredientsRes.success && ingredientsRes.data ? ingredientsRes.data : []
  const initialRecipeItems = recipesRes.success && recipesRes.data ? recipesRes.data : []

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-[#dfe8f0] bg-[#eff4f8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#112747]">
          Carta activa
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#142238] sm:text-4xl">
          Platos
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#55667e] sm:text-base">
          Gestiona las elaboraciones culinarias de tu carta, vincula los ingredientes de su receta
          por ración y controla su coste en tiempo real.
        </p>
      </div>

      <DishesTableWidget
        initialDishes={initialDishes}
        initialIngredients={initialIngredients}
        initialRecipeItems={initialRecipeItems}
        initialLoadFailed={!dishesRes.success}
      />
    </div>
  )
}
