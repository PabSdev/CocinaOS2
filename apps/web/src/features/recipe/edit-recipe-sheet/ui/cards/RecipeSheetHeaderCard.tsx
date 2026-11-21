import { DishThumbnail, type Dish } from '@/entities/dish'
import {
  Button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui'
import { RecipeSheetInformationCalculation } from './RecipeSheetInformationCalculation';

interface RecipeSheetHeaderCardProps {
  dish: Dish
  dishOptions: { value: string; label: string }[]
  dirty: boolean
  pending: boolean
  linesCount: number
  error: string
  onSelectDish: (id: string) => void
  onDiscard: () => void
}

export function RecipeSheetHeaderCard({
  dish,
  dishOptions,
  dirty,
  pending,
  linesCount,
  error,
  onSelectDish,
  onDiscard,
}: RecipeSheetHeaderCardProps) {
  return (
    <section
      aria-label="Paso 1: Plato activo y acciones"
      className="rounded-xl border border-[#dce3e9] bg-white p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Foto, selector de plato y pills de estado */}
        <div className="flex min-w-0 flex-[1_1_22rem] items-center gap-3.5">
          <DishThumbnail
            fotoId={dish.foto}
            alt={dish.nombre}
            size="md"
            className="rounded-2xl shrink-0"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* Dropdown que se estira dentro de la card del plato */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="recipe-dish"
                className="shrink-0 text-xs font-bold text-[#142238]"
              >
                Plato:
              </label>
              <div className="min-w-0 flex-1 max-w-lg">
                <Select
                  items={dishOptions}
                  value={dish.$id}
                  disabled={pending}
                  onValueChange={(id) => {
                    if (!id || id === dish.$id) return
                    onSelectDish(id)
                  }}
                >
                  <SelectTrigger
                    id="recipe-dish"
                    aria-label="Plato activo"
                    className="h-9 w-full rounded-full border-[#cbd7e3] bg-white font-semibold text-[#142238] shadow-none"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-[#dce3e9]">
                    <SelectGroup>
                      {dishOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pills de información debajo del selector de plato */}
            <div className="flex flex-wrap items-center gap-2">
              {dirty ? (
                <span className="inline-flex items-center rounded-full border border-[#8a5700]/16 bg-[#fbf3db] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a5700]">
                  Cambios sin guardar
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2.5 py-0.5 text-[11px] font-semibold text-[#26592b]">
                  Ficha guardada
                </span>
              )}
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#eff4f8] px-2.5 py-0.5 text-[11px] font-medium text-[#55667e]">
                {linesCount} {linesCount === 1 ? 'ingrediente' : 'ingredientes'}
              </span>
            </div>
          </div>
        </div>

        {/* Controles de guardado */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty || pending}
            onClick={onDiscard}
            className="h-9 rounded-full border-[#cbd7e3] bg-white px-4 text-xs font-medium text-[#1e324a] shadow-none hover:bg-[#eff4f8]"
          >
            Descartar
          </Button>
          <Button
            type="submit"
            disabled={!dirty || pending}
            className="h-9 rounded-full bg-[#112747] px-5 text-xs font-semibold text-white shadow-[0_1px_2px_rgba(17,39,71,0.18)] hover:bg-[#19355e]"
          >
            {pending ? 'Guardando…' : 'Guardar escandallo'}
          </Button>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-[#962b29]">{error}</p>}
      <RecipeSheetInformationCalculation />
    </section>
  )
}
