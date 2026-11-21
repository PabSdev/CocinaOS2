'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui'
import { StockBadge } from '@/entities/ingredient'
import { DishThumbnail, type Dish } from '@/entities/dish'
import { type calculateRecipeEscandallo } from '@/entities/recipe'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { CURRENCY_2, DishRowActions, formatDate } from './DishRowActions'

export type DishEscandalloSummary = ReturnType<typeof calculateRecipeEscandallo>

interface DishDesktopRowProps {
  dish: Dish
  dishEscandallo?: DishEscandalloSummary
  isPending: boolean
  onEdit: (dish: Dish) => void
  onDelete: (dish: Dish) => void
}

export function DishDesktopRow({ dish, dishEscandallo, isPending, onEdit, onDelete }: DishDesktopRowProps) {
  const isLow = dish.stock <= 5
  const ingCount = dishEscandallo?.lines.length ?? 0

  return (
    <TableRow className={`border-[#edf1f5] transition-colors ${isLow ? 'bg-[#fffcf5] hover:bg-[#fbf3db]/45' : 'bg-white hover:bg-[#f7f9fb]'}`}>
      <TableCell className="py-3 pl-6">
        <DishThumbnail fotoId={dish.foto} alt={dish.nombre} size="md" />
      </TableCell>
      <TableCell className="min-w-0 py-3.5">
        <p className="truncate text-[13.5px] font-semibold text-[#142238]">{dish.nombre}</p>
      </TableCell>
      <TableCell>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
          dish.precio ? 'border-[#dce3e9] bg-[#eff4f8] text-[#142238]' : 'border-dashed border-[#cbd7e3] bg-white text-[#55667e]'
        }`}>
          {dish.precio || 'Sin PVP'}
        </span>
      </TableCell>
      <TableCell>
        {ingCount === 0 ? (
          <button
            type="button"
            onClick={() => onEdit(dish)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#cbd7e3] bg-[#eff4f8]/60 px-2.5 py-0.5 text-xs font-medium text-[#55667e] hover:border-[#112747] hover:text-[#112747]"
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3" />
            Vincular receta
          </button>
        ) : (
          <button type="button" onClick={() => onEdit(dish)} className="inline-flex flex-wrap items-center gap-1.5 text-left">
            <span className="text-xs font-semibold tabular-nums text-[#142238]">
              {CURRENCY_2.format(dishEscandallo?.costeTotalRacionRedondeado ?? 0)}
            </span>
            <span className="rounded-md bg-[#eff4f8] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[#55667e]">
              {ingCount} {ingCount === 1 ? 'ingr.' : 'ingr.'}
            </span>
            {dishEscandallo?.foodCostPct != null ? (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                dishEscandallo.foodCostPct <= 30
                  ? 'border-[#26592b]/14 bg-[#edf3ec] text-[#26592b]'
                  : dishEscandallo.foodCostPct <= 35
                    ? 'border-[#8a5700]/16 bg-[#fbf3db] text-[#8a5700]'
                    : 'border-[#962b29]/15 bg-[#fdebec] text-[#962b29]'
              }`}>
                {dishEscandallo.foodCostPct.toLocaleString('es-ES')} % FC
              </span>
            ) : null}
          </button>
        )}
      </TableCell>
      <TableCell>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[13.5px] font-semibold tabular-nums text-[#142238]">{dish.stock}</span>
          <span className="rounded-md bg-[#eff4f8] px-1.5 py-0.5 text-[11px] font-medium text-[#55667e]">
            {dish.stock === 1 ? 'ración' : 'raciones'}
          </span>
        </div>
      </TableCell>
      <TableCell><StockBadge stock={dish.stock} /></TableCell>
      <TableCell className="hidden text-xs text-[#64748b] lg:table-cell">
        {formatDate(dish.$updatedAt || dish.$createdAt)}
      </TableCell>
      <TableCell className="pr-5 text-right">
        <DishRowActions dish={dish} disabled={isPending} onEdit={onEdit} onDelete={onDelete} />
      </TableCell>
    </TableRow>
  )
}

interface DishesDesktopTableProps {
  dishes: Dish[]
  escandalloByDishId: Map<string, DishEscandalloSummary>
  isPending: boolean
  onEdit: (dish: Dish) => void
  onDelete: (dish: Dish) => void
}

export function DishesDesktopTable({ dishes, escandalloByDishId, isPending, onEdit, onDelete }: DishesDesktopTableProps) {
  return (
    <Table className="hidden sm:table">
      <TableHeader>
        <TableRow className="border-[#edf1f5] bg-[#fafbfc] hover:bg-[#fafbfc]">
          <TableHead className="w-16 pl-6 text-xs font-semibold text-[#55667e]">Foto</TableHead>
          <TableHead className="w-[26%] text-xs font-semibold text-[#55667e]">Plato</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Precio</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Receta y coste (1 ración)</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Raciones</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Estado</TableHead>
          <TableHead className="hidden text-xs font-semibold text-[#55667e] lg:table-cell">Actualizado</TableHead>
          <TableHead className="w-16 pr-5 text-right text-xs font-semibold text-[#55667e]">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dishes.map((dish) => (
          <DishDesktopRow
            key={dish.$id}
            dish={dish}
            dishEscandallo={escandalloByDishId.get(dish.$id)}
            isPending={isPending}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  )
}
