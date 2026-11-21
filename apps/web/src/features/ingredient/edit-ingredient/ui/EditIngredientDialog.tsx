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
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/shared/ui'
import { updateIngredient, IngredientPurchasePriceField, isPurchasePrice, parsePurchasePrice, roundPurchasePrice, type UnidadDeMasa, type Ingredient } from '@/entities/ingredient'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit02Icon, Loading03Icon } from '@hugeicons/core-free-icons'

interface EditIngredientDialogProps {
  ingredient: Ingredient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: (updated: Ingredient) => void
}

export function EditIngredientDialog({
  ingredient,
  open,
  onOpenChange,
  onUpdated,
}: EditIngredientDialogProps) {
  const [loadedIngredient, setLoadedIngredient] = useState(ingredient)
  const [nombre, setNombre] = useState(ingredient?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(ingredient?.descripcion ?? '')
  const [stock, setStock] = useState(ingredient?.stock.toString() ?? '0')
  const [unidad, setUnidad] = useState<UnidadDeMasa>(ingredient?.unidad_de_masa ?? 'KG')
  const [precioCompra, setPrecioCompra] = useState(ingredient?.precio_compra?.toString() ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ nombre?: string; stock?: string; precio_compra?: string }>({})
  const nombreInputRef = React.useRef<HTMLInputElement>(null)
  const stockInputRef = React.useRef<HTMLInputElement>(null)
  const priceInputRef = React.useRef<HTMLInputElement>(null)

  if (ingredient !== loadedIngredient) {
    setLoadedIngredient(ingredient)
    setNombre(ingredient?.nombre ?? '')
    setDescripcion(ingredient?.descripcion ?? '')
    setStock(ingredient?.stock.toString() ?? '0')
    setUnidad(ingredient?.unidad_de_masa ?? 'KG')
    setPrecioCompra(ingredient?.precio_compra?.toString() ?? '')
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ingredient) return

    const nextErrors: { nombre?: string; stock?: string; precio_compra?: string } = {}

    if (!nombre.trim()) nextErrors.nombre = 'Introduce el nombre del ingrediente.'

    const numericStock = parseFloat(stock)
    if (isNaN(numericStock) || numericStock < 0) {
      nextErrors.stock = 'Introduce un número igual o mayor que 0.'
    }

    const numericPrice = parsePurchasePrice(precioCompra)
    if (numericPrice !== null && !isPurchasePrice(numericPrice)) {
      nextErrors.precio_compra = 'Introduce un precio igual o mayor que 0.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      const firstInvalidInput = nextErrors.nombre ? nombreInputRef : nextErrors.stock ? stockInputRef : priceInputRef
      firstInvalidInput.current?.focus()
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      const res = await updateIngredient(ingredient.$id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        stock: numericStock,
        unidad_de_masa: unidad,
        precio_compra: numericPrice === null ? null : roundPurchasePrice(numericPrice),
      })

      if (res.success && res.data) {
        toast.success(`Ingrediente "${res.data.nombre}" actualizado correctamente.`)
        onUpdated?.(res.data)
        onOpenChange(false)
      } else {
        toast.error('No se pudo actualizar el ingrediente. Inténtalo de nuevo.')
      }
    } catch {
      toast.error('No se pudo actualizar el ingrediente. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!ingredient) return null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        className="rounded-[20px] border-[#cbd7e3] bg-white shadow-[0_24px_56px_-20px_rgba(17,39,71,0.22)] sm:max-w-lg"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#e1e9f0] bg-[#eff4f8] text-[#112747]">
              <HugeiconsIcon icon={Edit02Icon} className="size-4.5" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-[#142238]">
                Editar ingrediente
              </DialogTitle>
              <DialogDescription className="text-sm text-[#55667e]">
                Actualiza los datos y las existencias disponibles en almacén.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="edit-ingredient-name" className="block text-sm font-medium text-[#142238]">
              Nombre del ingrediente <span className="text-[#962b29]">*</span>
            </label>
            <Input
              ref={nombreInputRef}
              id="edit-ingredient-name"
              name="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value)
                if (errors.nombre) setErrors((current) => ({ ...current, nombre: undefined }))
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.nombre)}
              aria-describedby={errors.nombre ? 'edit-ingredient-name-error' : undefined}
              className="min-h-11 rounded-xl border-[#cbd7e3] bg-white text-[#142238]"
              required
            />
            {errors.nombre ? (
              <p id="edit-ingredient-name-error" role="alert" className="text-xs font-medium text-[#962b29]">
                {errors.nombre}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="edit-ingredient-stock" className="block text-sm font-medium text-[#142238]">
                Stock actual <span className="text-[#962b29]">*</span>
              </label>
              <Input
                ref={stockInputRef}
                id="edit-ingredient-stock"
                name="stock"
                type="number"
                step="any"
                min="0"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value)
                  if (errors.stock) setErrors((current) => ({ ...current, stock: undefined }))
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.stock)}
                aria-describedby={errors.stock ? 'edit-ingredient-stock-error' : undefined}
                className="min-h-11 rounded-xl border-[#cbd7e3] bg-white tabular-nums text-[#142238]"
                required
              />
              {errors.stock ? (
                <p id="edit-ingredient-stock-error" role="alert" className="text-xs font-medium text-[#962b29]">
                  {errors.stock}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-ingredient-unit" className="block text-sm font-medium text-[#142238]">
                Unidad de medida <span className="text-[#962b29]">*</span>
              </label>
              <Select
                value={unidad}
                onValueChange={(val) => setUnidad(val as UnidadDeMasa)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="edit-ingredient-unit"
                  className="min-h-11 w-full rounded-xl border-[#cbd7e3] bg-white text-[#142238]"
                >
                  <SelectValue placeholder="Selecciona unidad" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#cbd7e3]">
                  <SelectItem value="KG">Kilogramos (KG)</SelectItem>
                  <SelectItem value="G">Gramos (G)</SelectItem>
                  <SelectItem value="L">Litros (L)</SelectItem>
                  <SelectItem value="ML">Mililitros (ML)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <IngredientPurchasePriceField
            key={`${ingredient.$id}-${open}-${unidad}`}
            id="edit-ingredient-price"
            value={precioCompra}
            onChange={(value) => {
              setPrecioCompra(value)
              if (errors.precio_compra) setErrors((current) => ({ ...current, precio_compra: undefined }))
            }}
            unit={unidad}
            disabled={isSubmitting}
            error={errors.precio_compra}
            inputRef={priceInputRef}
          />

          <div className="space-y-2">
            <label htmlFor="edit-ingredient-description" className="block text-sm font-medium text-[#142238]">
              Descripción o notas (opcional)
            </label>
            <Textarea
              id="edit-ingredient-description"
              name="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="rounded-xl border-[#cbd7e3] bg-white text-[#142238]"
            />
          </div>

          <DialogFooter className="gap-2 pt-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="min-h-10 rounded-full border-[#cbd7e3] bg-white px-5 text-xs font-semibold text-[#112747] hover:bg-[#eff4f8] active:scale-[0.98]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-h-10 rounded-full bg-[#112747] px-5 text-xs font-semibold text-white hover:bg-[#1d3b66] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} data-icon="inline-start" className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
