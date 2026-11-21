'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import {
  StockBadge,
  formatPurchasePrice,
  type Ingredient,
} from '@/entities/ingredient'
import {
  IngredientRowActions,
  formatDate,
  formatNumber,
} from './IngredientRowActions'

interface IngredientDesktopRowProps {
  ingredient: Ingredient
  isPending: boolean
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
}

export function IngredientDesktopRow({
  ingredient,
  isPending,
  onEdit,
  onDelete,
}: IngredientDesktopRowProps) {
  const isLow = ingredient.stock <= 5

  return (
    <TableRow
      className={`border-[#edf1f5] transition-colors ${
        isLow
          ? 'bg-[#fffcf5] hover:bg-[#fbf3db]/45'
          : 'hover:bg-[#eff4f8]/50'
      }`}
    >
      <TableCell className="min-w-0 py-3.5 pl-6">
        <p className="truncate text-sm font-semibold text-[#142238]">
          {ingredient.nombre}
        </p>
        {ingredient.descripcion ? (
          <p className="mt-0.5 max-w-sm truncate text-xs text-[#55667e]">
            {ingredient.descripcion}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="py-3.5">
        <div className="inline-flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums text-[#142238]">
            {formatNumber(ingredient.stock)}
          </span>
          <span className="rounded-full border border-[#e1e9f0] bg-[#eff4f8] px-2.5 py-0.5 text-[11px] font-semibold text-[#465870]">
            {ingredient.unidad_de_masa}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-3.5">
        <StockBadge stock={ingredient.stock} />
      </TableCell>
      <TableCell className="py-3.5 text-right text-sm tabular-nums text-[#142238]">
        {formatPurchasePrice(ingredient.precio_compra, ingredient.unidad_de_masa)}
      </TableCell>
      <TableCell className="hidden py-3.5 text-xs tabular-nums text-[#55667e] lg:table-cell">
        {formatDate(ingredient.$updatedAt || ingredient.$createdAt)}
      </TableCell>
      <TableCell className="py-3.5 pr-5 text-right">
        <IngredientRowActions
          ingredient={ingredient}
          disabled={isPending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  )
}

interface IngredientsDesktopTableProps {
  ingredients: Ingredient[]
  isPending: boolean
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
}

export function IngredientsDesktopTable({
  ingredients,
  isPending,
  onEdit,
  onDelete,
}: IngredientsDesktopTableProps) {
  return (
    <Table className="hidden sm:table">
      <TableHeader>
        <TableRow className="border-[#dce3e9] bg-white hover:bg-white">
          <TableHead className="h-11 w-[30%] pl-6 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Ingrediente
          </TableHead>
          <TableHead className="h-11 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Stock disponible
          </TableHead>
          <TableHead className="h-11 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            Estado
          </TableHead>
          <TableHead className="h-11 text-right text-xs font-medium text-[#55667e]">
            Compra sin IVA
          </TableHead>
          <TableHead className="hidden h-11 text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e] lg:table-cell">
            Actualizado
          </TableHead>
          <TableHead className="h-11 w-16 pr-5 text-right text-[11px] font-bold uppercase tracking-[0.05em] text-[#55667e]">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ingredient) => (
          <IngredientDesktopRow
            key={ingredient.$id}
            ingredient={ingredient}
            isPending={isPending}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  )
}
