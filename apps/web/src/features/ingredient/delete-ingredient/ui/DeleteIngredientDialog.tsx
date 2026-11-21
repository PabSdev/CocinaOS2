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
import { deleteIngredient, type Ingredient } from '@/entities/ingredient'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, Loading03Icon } from '@hugeicons/core-free-icons'

interface DeleteIngredientDialogProps {
  ingredient: Ingredient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: (id: string) => void
}

export function DeleteIngredientDialog({
  ingredient,
  open,
  onOpenChange,
  onDeleted,
}: DeleteIngredientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!ingredient) return

    setIsDeleting(true)
    try {
      const res = await deleteIngredient(ingredient.$id)
      if (res.success) {
        toast.success(`Ingrediente "${ingredient.nombre}" eliminado.`)
        onDeleted?.(ingredient.$id)
        onOpenChange(false)
      } else {
        toast.error('No se pudo eliminar el ingrediente. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo eliminar el ingrediente. Inténtalo de nuevo.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!ingredient) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="rounded-[20px] border-[#cbd7e3] bg-white shadow-[0_24px_56px_-20px_rgba(17,39,71,0.22)] sm:max-w-md"
        showCloseButton={!isDeleting}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#962b29]/15 bg-[#fdebec] text-[#962b29]">
              <HugeiconsIcon icon={Delete02Icon} className="size-4.5" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-[#142238]">
                Eliminar ingrediente
              </DialogTitle>
              <DialogDescription className="text-sm text-[#55667e]">
                Esta acción no se puede deshacer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border border-[#dce3e9] bg-[#f7f8f7] p-3.5 text-sm text-[#55667e]">
          ¿Seguro que quieres eliminar permanentemente{' '}
          <strong className="font-semibold text-[#142238]">&quot;{ingredient.nombre}&quot;</strong>{' '}
          del inventario?
        </div>

        <DialogFooter className="gap-2 pt-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="min-h-10 rounded-full border-[#cbd7e3] bg-white px-5 text-xs font-semibold text-[#112747] hover:bg-[#eff4f8] active:scale-[0.98]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="min-h-10 rounded-full bg-[#962b29] px-5 text-xs font-semibold text-white hover:bg-[#7d2220] active:scale-[0.98]"
          >
            {isDeleting ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} data-icon="inline-start" className="animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar ingrediente'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
