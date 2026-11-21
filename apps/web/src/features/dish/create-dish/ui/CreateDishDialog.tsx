'use client'

import * as React from 'react'
import { useState, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/shared/ui'
import { createDish, type Dish } from '@/entities/dish'
import type { Ingredient } from '@/entities/ingredient'
import {
  DishRecipeBuilder,
  DishProfitabilityTab,
  computeDraftEscandallo,
  setDishRecipe,
  validateAndBuildRecipePayload,
  type DraftDishRecipeLine,
  type RecipeItem,
} from '@/entities/recipe'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Loading03Icon,
  ImageAdd01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'

interface CreateDishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients?: Ingredient[]
  onCreated?: (dish: Dish, recipeItems: RecipeItem[]) => void
}

export function CreateDishDialog({
  open,
  onOpenChange,
  ingredients = [],
  onCreated,
}: CreateDishDialogProps) {
  const [activeTab, setActiveTab] = useState<string>('general')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('0')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [recipeLines, setRecipeLines] = useState<DraftDishRecipeLine[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    nombre?: string
    precio?: string
    stock?: string
    receta?: string
  }>({})

  const nombreInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const escandallo = useMemo(() => {
    return computeDraftEscandallo(recipeLines, ingredients, precio)
  }, [recipeLines, ingredients, precio])

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato no compatible. Usa JPG o PNG.')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('La imagen no puede superar 10 MB.')
        return
      }
      setPhotoFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleClearPhoto = () => {
    setPhotoFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: {
      nombre?: string
      precio?: string
      stock?: string
      receta?: string
    } = {}

    if (!nombre.trim()) {
      nextErrors.nombre = 'Introduce el nombre del plato.'
    }

    const numericStock = parseInt(stock, 10)
    if (isNaN(numericStock) || numericStock < 0) {
      nextErrors.stock = 'Introduce un stock válido (0 o mayor).'
    }

    const recipeValidation = validateAndBuildRecipePayload(recipeLines)
    if (!recipeValidation.valid) {
      nextErrors.receta = recipeValidation.error
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      if (nextErrors.nombre || nextErrors.stock) {
        setActiveTab('general')
        if (nextErrors.nombre) nombreInputRef.current?.focus()
      } else if (nextErrors.receta) {
        setActiveTab('receta')
      }
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombre.trim())
      formData.append('precio', precio.trim())
      formData.append('stock', numericStock.toString())
      if (photoFile) {
        formData.append('foto', photoFile)
      }

      const res = await createDish(formData)

      if (res.success && res.data) {
        let savedRecipeItems: RecipeItem[] = []
        if (recipeValidation.payload.length > 0) {
          const recipeRes = await setDishRecipe(res.data.$id, recipeValidation.payload)
          if (recipeRes.success && recipeRes.data) {
            savedRecipeItems = recipeRes.data
          } else {
            toast.error(
              recipeRes.error ||
                'El plato se creó, pero hubo un problema al vincular su receta.'
            )
          }
        }

        toast.success(`Plato "${res.data.nombre}" creado con su receta.`)
        onCreated?.(res.data, savedRecipeItems)
        setNombre('')
        setPrecio('')
        setStock('0')
        setRecipeLines([])
        handleClearPhoto()
        setActiveTab('general')
        onOpenChange(false)
      } else {
        toast.error(res.error || 'No se pudo crear el plato.')
      }
    } catch {
      toast.error('Ocurrió un error inesperado al crear el plato.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          if (!nextOpen) handleClearPhoto()
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto rounded-[24px] border border-[#dce3e9] bg-white p-6 shadow-2xl sm:max-w-2xl"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold tracking-[-0.02em] text-[#142238]">
            Nuevo plato
          </DialogTitle>
          <DialogDescription className="text-xs text-[#55667e]">
            Configura los datos del plato, los ingredientes de 1 ración y analiza su rentabilidad.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4 pt-1">
          {/* Navegación por pestañas */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-fit">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="receta">
                Receta
                {recipeLines.length > 0 && (
                  <span className="ml-1.5 rounded-full border border-current/15 bg-black/5 px-2 py-0.5 text-[10px] font-bold group-data-[selected]/trigger:border-white/20 group-data-[selected]/trigger:bg-white/20 group-data-[selected]/trigger:text-white group-aria-selected/trigger:border-white/20 group-aria-selected/trigger:bg-white/20 group-aria-selected/trigger:text-white">
                    {recipeLines.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="rentabilidad">Rentabilidad</TabsTrigger>
            </TabsList>

            {/* Pestaña: General */}
            <TabsContent value="general" className="space-y-4 pt-2">
              {/* Nombre */}
              <div className="space-y-1.5">
                <label htmlFor="create-dish-name" className="text-xs font-semibold text-[#142238]">
                  Nombre del plato <span className="text-[#962b29]">*</span>
                </label>
                <Input
                  ref={nombreInputRef}
                  id="create-dish-name"
                  name="nombre"
                  placeholder="Ej. Solomillo al punto con salsa de boletus"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value)
                    if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }))
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.nombre)}
                  className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
                  autoFocus
                  required
                />
                {errors.nombre && (
                  <p role="alert" className="text-xs font-medium text-[#962b29]">
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Precio */}
                <div className="space-y-1.5">
                  <label htmlFor="create-dish-price" className="text-xs font-semibold text-[#142238]">
                    Precio en carta (PVP) <span className="font-normal text-[#55667e]">(opcional)</span>
                  </label>
                  <Input
                    id="create-dish-price"
                    name="precio"
                    placeholder="Ej. 18,50 €"
                    value={precio}
                    onChange={(e) => {
                      setPrecio(e.target.value)
                      if (errors.precio) setErrors((prev) => ({ ...prev, precio: undefined }))
                    }}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.precio)}
                    className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px] tabular-nums"
                  />
                  {errors.precio && (
                    <p role="alert" className="text-xs font-medium text-[#962b29]">
                      {errors.precio}
                    </p>
                  )}
                </div>

                {/* Stock / Raciones */}
                <div className="space-y-1.5">
                  <label htmlFor="create-dish-stock" className="text-xs font-semibold text-[#142238]">
                    Raciones disponibles <span className="text-[#962b29]">*</span>
                  </label>
                  <Input
                    id="create-dish-stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => {
                      setStock(e.target.value)
                      if (errors.stock) setErrors((prev) => ({ ...prev, stock: undefined }))
                    }}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.stock)}
                    className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px] tabular-nums"
                    required
                  />
                  {errors.stock && (
                    <p role="alert" className="text-xs font-medium text-[#962b29]">
                      {errors.stock}
                    </p>
                  )}
                </div>
              </div>

              {/* Fotografía */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-[#142238]">
                  Fotografía del plato (opcional)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="create-dish-photo"
                  name="foto"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                  disabled={isSubmitting}
                />

                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border border-[#cbd7e3] bg-[#f8fafc]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Vista previa del plato"
                      className="h-40 w-full object-cover"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full bg-white/90 p-1.5 text-xs text-[#142238] shadow-sm backdrop-blur-xs hover:bg-white cursor-pointer"
                        title="Cambiar imagen"
                      >
                        <HugeiconsIcon icon={ImageAdd01Icon} className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        className="rounded-full bg-white/90 p-1.5 text-xs text-[#962b29] shadow-sm backdrop-blur-xs hover:bg-white cursor-pointer"
                        title="Eliminar imagen"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#cbd7e3] bg-[#f8fafc] p-6 text-center transition-colors hover:border-[#8ca1b8] hover:bg-[#f1f5f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#112747]"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#55667e] shadow-2xs">
                      <HugeiconsIcon icon={ImageAdd01Icon} className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#142238]">
                        Haz clic para subir una foto
                      </p>
                      <p className="text-[11px] text-[#55667e]">JPG, PNG o WEBP (máx. 10 MB)</p>
                    </div>
                  </button>
                )}
              </div>
            </TabsContent>

            {/* Pestaña: Receta */}
            <TabsContent value="receta" className="pt-2">
              <DishRecipeBuilder
                ingredients={ingredients}
                lines={recipeLines}
                onChange={(next) => {
                  setRecipeLines(next)
                  if (errors.receta) setErrors((prev) => ({ ...prev, receta: undefined }))
                }}
                disabled={isSubmitting}
                onGoToProfitability={() => setActiveTab('rentabilidad')}
              />
              {errors.receta && (
                <p role="alert" className="mt-2 text-xs font-medium text-[#962b29]">
                  {errors.receta}
                </p>
              )}
            </TabsContent>

            {/* Pestaña: Rentabilidad */}
            <TabsContent value="rentabilidad" className="pt-2">
              <DishProfitabilityTab
                escandallo={escandallo}
                dishPriceGross={precio}
                onApplyPrice={(suggested) => {
                  setPrecio(suggested)
                  if (errors.precio) setErrors((prev) => ({ ...prev, precio: undefined }))
                  toast.success(`Precio actualizado a ${suggested} en la pestaña General`)
                }}
                linesCount={recipeLines.length}
              />
            </TabsContent>
          </Tabs>

          {/* Footer Unificado */}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-full border-slate-200 px-5 text-xs font-semibold text-[#142238]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-full bg-[#142238] px-6 text-xs font-semibold text-white shadow-xs hover:bg-[#1f304c]"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
                  Creando plato...
                </>
              ) : (
                'Crear plato'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
