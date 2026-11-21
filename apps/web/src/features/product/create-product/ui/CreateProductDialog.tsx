'use client'

import * as React from 'react'
import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@/shared/ui'
import { createProduct, DEFAULT_PRODUCT_CATEGORIES, type Product } from '@/entities/product'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  Loading03Icon,
  ImageAdd01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons'

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableCategories?: string[]
  onCreated?: (product: Product) => void
}

export function CreateProductDialog({
  open,
  onOpenChange,
  availableCategories = [...DEFAULT_PRODUCT_CATEGORIES],
  onCreated,
}: CreateProductDialogProps) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('Bebidas')
  const [precio, setPrecio] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [stock, setStock] = useState('0')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    nombre?: string
    categoria?: string
    precio?: string
    precioCompra?: string
    stock?: string
  }>({})

  const nombreInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato no compatible. Usa JPG, PNG o WebP.')
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
      categoria?: string
      precio?: string
      precioCompra?: string
      stock?: string
    } = {}

    if (!nombre.trim()) {
      nextErrors.nombre = 'Introduce el nombre del producto.'
    }

    if (!categoria.trim()) {
      nextErrors.categoria = 'Selecciona o escribe una categoría.'
    }

    const parsedPrecio = Number.parseFloat(precio.replace(',', '.').replace(/[^0-9.-]/g, ''))
    if (!precio.trim() || Number.isNaN(parsedPrecio) || parsedPrecio < 0) {
      nextErrors.precio = 'Introduce un precio válido (ej. 2.50).'
    }

    const parsedPrecioCompra = Number.parseFloat(
      precioCompra.replace(',', '.').replace(/[^0-9.-]/g, ''),
    )
    if (
      !precioCompra.trim() ||
      Number.isNaN(parsedPrecioCompra) ||
      parsedPrecioCompra < 0
    ) {
      nextErrors.precioCompra = 'Introduce un precio de compra válido (ej. 1.20).'
    }

    const numericStock = Number.parseInt(stock, 10)
    if (Number.isNaN(numericStock) || numericStock < 0) {
      nextErrors.stock = 'Introduce una cantidad válida (0 o mayor).'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      nombreInputRef.current?.focus()
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('nombre', nombre.trim())
      formData.append('categoria', categoria.trim())
      formData.append('precio', parsedPrecio.toString())
      formData.append('precio_compra', parsedPrecioCompra.toString())
      formData.append('stock', numericStock.toString())
      if (photoFile) {
        formData.append('foto', photoFile)
      }

      const res = await createProduct(formData)

      if (res.success && res.data) {
        toast.success(`Producto "${res.data.nombre}" añadido al catálogo.`)
        onCreated?.(res.data)
        setNombre('')
        setCategoria('Bebidas')
        setPrecio('')
        setPrecioCompra('')
        setStock('0')
        handleClearPhoto()
        onOpenChange(false)
      } else {
        toast.error(res.error || 'No se pudo crear el producto.')
      }
    } catch {
      toast.error('Ocurrió un error inesperado al crear el producto.')
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
        className="rounded-[20px] border border-[#dce3e9] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(17,39,71,0.22)] sm:max-w-lg"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dce3e9] bg-[#eff4f8] text-[#112747]">
              <HugeiconsIcon icon={Add01Icon} className="size-4" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-[#142238]">
                Nuevo producto
              </DialogTitle>
              <DialogDescription className="text-xs text-[#55667e]">
                Registra bebidas, salsas o artículos listos para servicio.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting} className="space-y-4 pt-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <label htmlFor="create-product-name" className="text-xs font-semibold text-[#142238]">
              Nombre del producto <span className="text-[#962b29]">*</span>
            </label>
            <Input
              ref={nombreInputRef}
              id="create-product-name"
              name="nombre"
              placeholder="Ej. Coca-Cola Zero 33cl, Salsa Brava Casera..."
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
            {errors.nombre ? (
              <p role="alert" className="text-xs font-medium text-[#962b29]">
                {errors.nombre}
              </p>
            ) : null}
          </div>

          {/* Categoría híbrida (Píldoras sugeridas + Input libre para nuevas categorías) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="create-product-category" className="text-xs font-semibold text-[#142238]">
                Categoría <span className="text-[#962b29]">*</span>
              </label>
              <span className="text-[11px] text-[#64748b]">
                Elige una o escribe una nueva
              </span>
            </div>
            <Input
              id="create-product-category"
              name="categoria"
              placeholder="Ej. Bebidas, Salsas, Cafés, Vinos..."
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value)
                if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: undefined }))
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.categoria)}
              className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
              required
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {availableCategories.map((cat) => {
                const isSelected =
                  categoria.trim().toLocaleLowerCase('es') === cat.toLocaleLowerCase('es')
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoria(cat)
                      if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: undefined }))
                    }}
                    disabled={isSubmitting}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'border-[#112747] bg-[#112747] text-white'
                        : 'border-[#dce3e9] bg-[#eff4f8] text-[#55667e] hover:border-[#cbd7e3] hover:text-[#112747]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
            {errors.categoria ? (
              <p role="alert" className="text-xs font-medium text-[#962b29]">
                {errors.categoria}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Precio */}
            <div className="space-y-1.5">
              <label htmlFor="create-product-price" className="text-xs font-semibold text-[#142238]">
                Precio (€) <span className="text-[#962b29]">*</span>
              </label>
              <Input
                id="create-product-price"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 2.50"
                value={precio}
                onChange={(e) => {
                  setPrecio(e.target.value)
                  if (errors.precio) setErrors((prev) => ({ ...prev, precio: undefined }))
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.precio)}
                className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
                required
              />
              {errors.precio ? (
                <p role="alert" className="text-xs font-medium text-[#962b29]">
                  {errors.precio}
                </p>
              ) : null}
            </div>

            {/* Precio de compra */}
            <div className="space-y-1.5">
              <label htmlFor="create-product-purchase-price" className="text-xs font-semibold text-[#142238]">
                Precio de compra (€) <span className="text-[#962b29]">*</span>
              </label>
              <Input
                id="create-product-purchase-price"
                name="precio_compra"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 1.20"
                value={precioCompra}
                onChange={(e) => {
                  setPrecioCompra(e.target.value)
                  if (errors.precioCompra) setErrors((prev) => ({ ...prev, precioCompra: undefined }))
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.precioCompra)}
                className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
                required
              />
              {errors.precioCompra ? (
                <p role="alert" className="text-xs font-medium text-[#962b29]">
                  {errors.precioCompra}
                </p>
              ) : null}
            </div>

            {/* Cantidad / Stock */}
            <div className="space-y-1.5">
              <label htmlFor="create-product-stock" className="text-xs font-semibold text-[#142238]">
                Cantidad disponible <span className="text-[#962b29]">*</span>
              </label>
              <Input
                id="create-product-stock"
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
                className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
                required
              />
              {errors.stock ? (
                <p role="alert" className="text-xs font-medium text-[#962b29]">
                  {errors.stock}
                </p>
              ) : null}
            </div>
          </div>

          {/* Fotografía */}
          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-[#142238]">
              Fotografía del producto (opcional)
            </span>
            <input
              ref={fileInputRef}
              type="file"
              id="create-product-photo"
              name="foto"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handlePhotoSelect}
              className="sr-only"
              disabled={isSubmitting}
            />

            {previewUrl ? (
              <div className="relative flex items-center gap-3 rounded-2xl border border-[#dce3e9] bg-[#eff4f8]/65 p-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-[#dce3e9] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Previsualización del producto"
                    className="size-full object-cover object-center"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#142238]">
                    {photoFile?.name}
                  </p>
                  <p className="text-xs text-[#55667e]">
                    {photoFile ? `${(photoFile.size / 1024).toFixed(1)} KB` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClearPhoto}
                  disabled={isSubmitting}
                  className="size-8 rounded-full text-[#55667e] hover:bg-[#fdebec] hover:text-[#962b29]"
                  title="Quitar foto"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </Button>
              </div>
            ) : (
              <label
                htmlFor="create-product-photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#cbd7e3] bg-[#eff4f8]/45 px-4 py-5 text-center transition-colors hover:border-[#112747]/40 hover:bg-[#eff4f8] focus-within:border-[#112747]"
              >
                <div className="flex size-9 items-center justify-center rounded-full border border-[#dce3e9] bg-white text-[#112747]">
                  <HugeiconsIcon icon={ImageAdd01Icon} className="size-4" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#142238]">
                    Haz clic para subir una imagen
                  </p>
                  <p className="mt-0.5 text-xs text-[#55667e]">
                    JPG, PNG o WebP hasta 10 MB
                  </p>
                </div>
              </label>
            )}
          </div>

          <DialogFooter className="gap-2 pt-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="h-10 rounded-full border-[#cbd7e3] bg-white px-5 text-xs font-medium text-[#1e324a] hover:bg-[#eff4f8]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-full bg-[#112747] px-5 text-xs font-medium text-white hover:bg-[#19355e]"
            >
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Crear producto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
