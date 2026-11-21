import { getRecipeSheet, getRecipeSheetDishes } from '@/entities/recipe';
import { getIngredients } from '@/entities/ingredient';
import { RecipeSheetEditor } from '@/features/recipe/edit-recipe-sheet';
import { Alert02Icon, Dish01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

async function loadPage(plato?: string) {
  const dishes = await getRecipeSheetDishes();
  const selected = dishes.find((dish) => dish.$id === plato) ?? dishes[0];
  if (!selected) return { empty: true } as const;

  const [sheet, ingredients] = await Promise.all([
    getRecipeSheet(selected.$id),
    getIngredients(),
  ]);
  if (!ingredients.success || !ingredients.data) throw new Error(ingredients.error);
  return { dishes, sheet, ingredients: ingredients.data };
}

export async function EscandalloPage({
  searchParams,
}: {
  searchParams: Promise<{ plato?: string }>;
}) {
  const { plato } = await searchParams;
  const data = await loadPage(plato).catch((error: unknown) => {
    console.error('Error cargando el escandallo', error);
    return null;
  });

  if (data && !data.empty) {
    return <RecipeSheetEditor key={`${data.sheet.dish.$id}:${data.sheet.version}`} {...data} />;
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="max-w-2xl">
        <span className="inline-flex items-center rounded-full border border-[#dfe8f0] bg-[#eff4f8] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#112747]">
          Gestión Culinaria
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#142238] sm:text-4xl">
          Escandallos y recetas
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#55667e] sm:text-base">
          Ficha técnica y cálculo de costes por ración.
        </p>
      </div>

      {data ? (
        <div className="rounded-[20px] border border-[#dce3e9] bg-white p-8 text-center sm:py-14 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-[#dce3e9] bg-[#eff4f8] text-[#112747]">
            <HugeiconsIcon icon={Dish01Icon} className="size-6" strokeWidth={1.8} />
          </div>
          <h2 className="mt-4 text-base font-semibold tracking-[-0.02em] text-[#142238]">
            Aún no hay platos en la carta
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-[#55667e]">
            Crea tu primer plato para preparar su receta, vincular materias primas y calcular el
            coste por ración.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/platos"
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#112747] px-5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(17,39,71,0.18)] hover:bg-[#19355e]"
            >
              Ir a Platos
            </Link>
          </div>
        </div>
      ) : (
        <div
          className="rounded-[20px] border border-[#962b29]/20 bg-[#fdebec] p-6 text-center text-[#962b29] shadow-2xs"
          role="alert"
        >
          <HugeiconsIcon icon={Alert02Icon} className="mx-auto size-6" strokeWidth={2} />
          <p className="mt-2 font-semibold">No se pudo cargar el escandallo</p>
          <p className="mt-1 text-xs">Recarga la página para volver a intentarlo.</p>
        </div>
      )}
    </div>
  );
}
