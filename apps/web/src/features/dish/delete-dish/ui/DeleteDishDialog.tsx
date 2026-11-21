'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from '@/shared/ui'
import { deleteDish, type Dish, DishThumbnail } from '@/entities/dish'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Loading03Icon } from '@hugeicons/core-free-icons'

interface DeleteDishDialogProps {
  dish: Dish | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (id: string) => void
}

export function DeleteDishDialog({
  dish,
  open,
  onOpenChange,
  onDeleted,
}: DeleteDishDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!dish) return

    setIsDeleting(true)
    try {
      const res = await deleteDish(dish.$id)
      if (res.success) {
        toast.success(`Plato "${dish.nombre}" eliminado.`)
        onDeleted?.(dish.$id)
        onOpenChange(false)
      } else {
        toast.error(res.error || 'No se pudo eliminar el plato.')
      }
    } catch {
      toast.error('Ocurrió un error al eliminar el plato.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!dish) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="rounded-[20px] border border-[#dce3e9] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(17,39,71,0.22)] sm:max-w-md"
        showCloseButton={!isDeleting}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#962b29]/15 bg-[#fdebec] text-[#962b29]">
              <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-[#142238]">
                Eliminar plato
              </DialogTitle>
              <DialogDescription className="text-xs text-[#55667e]">
                Esta acción no se puede deshacer. Se eliminará el plato y su fotografía asociada de la cocina.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-2 flex items-center gap-3 rounded-2xl border border-[#dce3e9] bg-[#eff4f8]/65 p-3.5">
          <DishThumbnail fotoId={dish.foto} alt={dish.nombre} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-[#142238]">{dish.nombre}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                dish.precio
                  ? 'border-[#dce3e9] bg-white text-[#142238]'
                  : 'border-dashed border-[#cbd7e3] bg-white text-[#55667e]'
              }`}>
                {dish.precio || 'Sin PVP'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-white px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-[#55667e]">
                {dish.stock} {dish.stock === 1 ? 'ración' : 'raciones'}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-3 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-10 rounded-full border-[#cbd7e3] bg-white px-5 text-xs font-medium text-[#1e324a] hover:bg-[#eff4f8]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-10 rounded-full bg-[#962b29] px-5 text-xs font-medium text-white hover:bg-[#7d2220]"
          >
            {isDeleting ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar plato'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
