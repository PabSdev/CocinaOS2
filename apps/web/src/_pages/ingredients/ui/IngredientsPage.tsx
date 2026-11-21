import { getIngredients } from '@/entities/ingredient'
import { IngredientsTableWidget } from '@/widgets/ingredients-table'

export async function IngredientsPage() {
  const response = await getIngredients()
  const initialIngredients = response.success && response.data ? response.data : []

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-[#dfe8f0] bg-[#eff4f8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#112747]">
          Almacén principal
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#142238] sm:text-4xl">
          Ingredientes
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#55667e] sm:text-base">
          Revisa existencias con sus unidades, detecta faltantes a tiempo y mantén actualizado el
          registro de materias primas.
        </p>
      </div>

      <IngredientsTableWidget
        initialIngredients={initialIngredients}
        initialLoadFailed={!response.success}
      />
    </div>
  )
}
