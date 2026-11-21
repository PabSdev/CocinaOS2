'use client';

import {
  DEFAULT_PRODUCT_CATEGORIES,
  ProductThumbnail,
  updateProduct,
  type Product,
} from '@/entities/product';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@/shared/ui';
import {
  Cancel01Icon,
  Delete02Icon,
  Edit02Icon,
  ImageAdd01Icon,
  Loading03Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCategories?: string[];
  onUpdated?: (product: Product) => void;
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
  availableCategories = [...DEFAULT_PRODUCT_CATEGORIES],
  onUpdated,
}: EditProductDialogProps) {
  const [loadedProduct, setLoadedProduct] = useState(product);
  const [nombre, setNombre] = useState(product?.nombre ?? '');
  const [categoria, setCategoria] = useState(product?.categoria ?? 'Bebidas');
  const [precio, setPrecio] = useState(product ? product.precio.toString() : '');
  const [precioCompra, setPrecioCompra] = useState(
    product ? product.precio_compra.toString() : '',
  );
  const [stock, setStock] = useState(product ? product.stock.toString() : '0');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    nombre?: string;
    categoria?: string;
    precio?: string;
    precioCompra?: string;
    stock?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (product !== loadedProduct) {
    setLoadedProduct(product);
    setNombre(product?.nombre ?? '');
    setCategoria(product?.categoria ?? 'Bebidas');
    setPrecio(product ? product.precio.toString() : '');
    setPrecioCompra(product ? product.precio_compra.toString() : '');
    setStock(product ? product.stock.toString() : '0');
    setPhotoFile(null);
    setPreviewUrl(null);
    setRemoveExistingPhoto(false);
    setErrors({});
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Formato no compatible. Usa JPG, PNG o WebP.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('La imagen no puede superar 10 MB.');
        return;
      }
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveExistingPhoto(false);
    }
  };

  const handleClearSelectedPhoto = () => {
    setPhotoFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const nextErrors: {
      nombre?: string;
      categoria?: string;
      precio?: string;
      precioCompra?: string;
      stock?: string;
    } = {};

    if (!nombre.trim()) {
      nextErrors.nombre = 'Introduce el nombre del producto.';
    }

    if (!categoria.trim()) {
      nextErrors.categoria = 'Selecciona o escribe una categoría.';
    }

    const parsedPrecio = Number.parseFloat(precio.replace(',', '.').replace(/[^0-9.-]/g, ''));
    if (!precio.trim() || Number.isNaN(parsedPrecio) || parsedPrecio < 0) {
      nextErrors.precio = 'Introduce un precio válido.';
    }

    const parsedPrecioCompra = Number.parseFloat(
      precioCompra.replace(',', '.').replace(/[^0-9.-]/g, ''),
    );
    if (
      !precioCompra.trim() ||
      Number.isNaN(parsedPrecioCompra) ||
      parsedPrecioCompra < 0
    ) {
      nextErrors.precioCompra = 'Introduce un precio de compra válido.';
    }

    const numericStock = Number.parseInt(stock, 10);
    if (Number.isNaN(numericStock) || numericStock < 0) {
      nextErrors.stock = 'Introduce una cantidad válida (0 o mayor).';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('nombre', nombre.trim());
      formData.append('categoria', categoria.trim());
      formData.append('precio', parsedPrecio.toString());
      formData.append('precio_compra', parsedPrecioCompra.toString());
      formData.append('stock', numericStock.toString());

      if (photoFile) {
        formData.append('foto', photoFile);
      } else if (removeExistingPhoto) {
        formData.append('removeFoto', 'true');
      }

      const res = await updateProduct(product.$id, formData);

      if (res.success && res.data) {
        toast.success(`Producto "${res.data.nombre}" actualizado.`);
        onUpdated?.(res.data);
        onOpenChange(false);
      } else {
        toast.error(res.error || 'No se pudo actualizar el producto.');
      }
    } catch {
      toast.error('Error al actualizar el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  const hasCurrentPhoto = Boolean(product.foto && !removeExistingPhoto);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="rounded-[20px] border border-[#dce3e9] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(17,39,71,0.22)] sm:max-w-lg"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#dce3e9] bg-[#eff4f8] text-[#112747]">
              <HugeiconsIcon icon={Edit02Icon} className="size-4" strokeWidth={2} />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-[-0.02em] text-[#142238]">
                Editar producto
              </DialogTitle>
              <DialogDescription className="text-xs text-[#55667e]">
                Actualiza categoría, precio, unidades y fotografía del producto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isSubmitting}
          className="space-y-4 pt-2"
        >
          {/* Nombre */}
          <div className="space-y-1.5">
            <label htmlFor="edit-product-name" className="text-xs font-semibold text-[#142238]">
              Nombre del producto <span className="text-[#962b29]">*</span>
            </label>
            <Input
              id="edit-product-name"
              name="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: undefined }));
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.nombre)}
              className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
              required
            />
            {errors.nombre ? (
              <p role="alert" className="text-xs font-medium text-[#962b29]">
                {errors.nombre}
              </p>
            ) : null}
          </div>

          {/* Categoría híbrida */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-product-category"
                className="text-xs font-semibold text-[#142238]"
              >
                Categoría <span className="text-[#962b29]">*</span>
              </label>
              <span className="text-[11px] text-[#64748b]">Elige una o escribe una nueva</span>
            </div>
            <Input
              id="edit-product-category"
              name="categoria"
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                if (errors.categoria) setErrors((prev) => ({ ...prev, categoria: undefined }));
              }}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.categoria)}
              className="h-10 rounded-xl border-[#cbd7e3] bg-white text-[13px]"
              required
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {availableCategories.map((cat) => {
                const isSelected =
                  categoria.trim().toLocaleLowerCase('es') === cat.toLocaleLowerCase('es');
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoria(cat);
                      if (errors.categoria)
                        setErrors((prev) => ({ ...prev, categoria: undefined }));
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
                );
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
              <label htmlFor="edit-product-price" className="text-xs font-semibold text-[#142238]">
                Precio (€) <span className="text-[#962b29]">*</span>
              </label>
              <Input
                id="edit-product-price"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={precio}
                onChange={(e) => {
                  setPrecio(e.target.value);
                  if (errors.precio) setErrors((prev) => ({ ...prev, precio: undefined }));
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
              <label htmlFor="edit-product-purchase-price" className="text-xs font-semibold text-[#142238]">
                Precio de compra (€) <span className="text-[#962b29]">*</span>
              </label>
              <Input
                id="edit-product-purchase-price"
                name="precio_compra"
                type="number"
                min="0"
                step="0.01"
                value={precioCompra}
                onChange={(e) => {
                  setPrecioCompra(e.target.value);
                  if (errors.precioCompra)
                    setErrors((prev) => ({ ...prev, precioCompra: undefined }));
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
              <label htmlFor="edit-product-stock" className="text-xs font-semibold text-[#142238]">
                Cantidad disponible <span className="text-[#962b29]">*</span>
              </label>
              <Input
                id="edit-product-stock"
                name="stock"
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => {
                  setStock(e.target.value);
                  if (errors.stock) setErrors((prev) => ({ ...prev, stock: undefined }));
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
              Fotografía del producto
            </span>
            <input
              ref={fileInputRef}
              type="file"
              id="edit-product-photo"
              name="foto"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handlePhotoSelect}
              className="sr-only"
              disabled={isSubmitting}
            />

            {previewUrl ? (
              <div className="flex items-center gap-3 rounded-2xl border border-[#dce3e9] bg-[#eff4f8]/65 p-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-[#dce3e9] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Nueva previsualización"
                    className="size-full object-cover object-center"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[#142238]">
                    Nueva foto seleccionada
                  </p>
                  <p className="text-xs text-[#55667e]">{photoFile?.name}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleClearSelectedPhoto}
                  disabled={isSubmitting}
                  className="size-8 rounded-full text-[#55667e] hover:bg-[#fdebec] hover:text-[#962b29]"
                  title="Descartar nueva foto"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
                </Button>
              </div>
            ) : hasCurrentPhoto ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce3e9] bg-[#eff4f8]/65 p-3">
                <div className="flex items-center gap-3">
                  <ProductThumbnail fotoId={product.foto} alt={product.nombre} size="md" />
                  <div>
                    <p className="text-xs font-semibold text-[#142238]">Foto actual vinculada</p>
                    <p className="text-xs text-[#55667e]">Almacenada en Appwrite Storage</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="h-8 rounded-full border-[#cbd7e3] bg-white px-3 text-xs font-medium text-[#1e324a] hover:bg-[#eff4f8]"
                  >
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setRemoveExistingPhoto(true)}
                    disabled={isSubmitting}
                    className="size-8 rounded-full text-[#55667e] hover:bg-[#fdebec] hover:text-[#962b29]"
                    title="Eliminar foto"
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="edit-product-photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#cbd7e3] bg-[#eff4f8]/45 px-4 py-5 text-center transition-colors hover:border-[#112747]/40 hover:bg-[#eff4f8] focus-within:border-[#112747]"
              >
                <div className="flex size-9 items-center justify-center rounded-full border border-[#dce3e9] bg-white text-[#112747]">
                  <HugeiconsIcon icon={ImageAdd01Icon} className="size-4" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#142238]">
                    Subir una foto para este producto
                  </p>
                  <p className="mt-0.5 text-xs text-[#55667e]">JPG, PNG o WebP hasta 10 MB</p>
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
                'Guardar cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
