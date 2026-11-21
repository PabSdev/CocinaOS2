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
import {
  createProduct,
  DEFAULT_PRODUCT_CATEGORIES,
  ProductThumbnail,
  type Product,
} from '@/entities/product'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Cancel01Icon, Loading03Icon } from '@hugeicons/core-free-icons'

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableCategories?: string[]
  onCreated?: (product: Product) => void
}

function isValidOptionalPhotoUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function CreateProductDialog({
  open,
  onOpenChange,
  availableCategories = [...DEFAULT_PRODUCT_CATEGORIES],
  onCreated,
}: CreateProductDialogProps) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState<string>(DEFAULT_PRODUCT_CATEGORIES[0])
  const [precio, setPrecio] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [stock, setStock] = useState('0')
  const [fotoUrl, setFotoUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{
    nombre?: string
    categoria?: string
    precio?: string
    precioCompra?: string
    stock?: string
    foto?: string
  }>({})

  const nombreInputRef = useRef<HTMLInputElement>(null)
  const officialCategories: readonly string[] = DEFAULT_PRODUCT_CATEGORIES
  const categoryOptions = availableCategories.filter((cat) =>
    officialCategories.some((official) => official.toLocaleLowerCase('es') === cat.toLocaleLowerCase('es')),
  )
  const displayedCategories =
    categoryOptions.length > 0 ? categoryOptions : [...DEFAULT_PRODUCT_CATEGORIES]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: {
      nombre?: string
      categoria?: string
      precio?: string
      precioCompra?: string
      stock?: string
      foto?: string
    } = {}

    if (!nombre.trim()) {
      nextErrors.nombre = 'Introduce el nombre del producto.'
    }

    const isOfficialCategory = officialCategories.some(
      (cat) => cat.toLocaleLowerCase('es') === categoria.trim().toLocaleLowerCase('es'),
    )
    if (!categoria.trim() || !isOfficialCategory) {
      nextErrors.categoria = 'Selecciona una categoría válida.'
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

    if (!isValidOptionalPhotoUrl(fotoUrl)) {
      nextErrors.foto = 'Introduce una URL válida (http://, https:// o /...).'
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
      formData.append('foto', fotoUrl.trim())

      const res = await createProduct(formData)

      if (res.success && res.data) {
        toast.success(`Producto "${res.data.nombre}" añadido al catálogo.`)
        onCreated?.(res.data)
        setNombre('')
        setCategoria(DEFAULT_PRODUCT_CATEGORIES[0])
        setPrecio('')
        setPrecioCompra('')
        setStock('0')
        setFotoUrl('')
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
          if (!nextOpen) {
            setErrors({})
          }
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

          {/* Categoría (solo píldoras oficiales del contrato) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span id="create-product-category-label" className="text-xs font-semibold text-[#142238]">
                Categoría <span className="text-[#962b29]">*</span>
              </span>
              <span className="text-[11px] text-[#64748b]">
                Elige una categoría oficial
              </span>
            </div>
            <div
              role="group"
              aria-labelledby="create-product-category-label"
              className="flex flex-wrap items-center gap-1.5 pt-0.5"
            >
              {displayedCategories.map((cat) => {
                const isSelected =
                  categoria.trim().toLocaleLowerCase('es') === cat.toLocaleLowerCase('es')
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      setCategoria(cat)
                      if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: undefined }))
                    }}
                    disabled={isSubmitting}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
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

          {/* Fotografía (URL opcional) */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-product-photo-url"
              className="block text-xs font-semibold text-[#142238]"
            >
              URL de fotografía (opcional)
            </label>
            <div className="flex items-center gap-3">
              <ProductThumbnail
                fotoId={fotoUrl.trim() || null}
                alt={nombre.trim() || 'Previsualización del producto'}
                size="md"
              />
              <div className="relative flex-1">
                <Input
                  id="create-product-photo-url"
                  name="foto"
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg (opcional)"
                  value={fotoUrl}
                  onChange={(e) => {
                    setFotoUrl(e.target.value)
                    if (errors.foto) setErrors((prev) => ({ ...prev, foto: undefined }))
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.foto)}
                  className="h-10 rounded-xl border-[#cbd7e3] bg-white pr-9 text-[13px]"
                />
                {fotoUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setFotoUrl('')
                      if (errors.foto) setErrors((prev) => ({ ...prev, foto: undefined }))
                    }}
                    disabled={isSubmitting}
                    className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 rounded-full text-[#55667e] hover:bg-[#fdebec] hover:text-[#962b29]"
                    title="Quitar URL de foto"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Deja este campo vacío si el producto no tiene fotografía.
            </p>
            {errors.foto ? (
              <p role="alert" className="text-xs font-medium text-[#962b29]">
                {errors.foto}
              </p>
            ) : null}
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
