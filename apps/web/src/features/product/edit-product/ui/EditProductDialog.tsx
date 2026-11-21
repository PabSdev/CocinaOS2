'use client';

import {
  DEFAULT_PRODUCT_CATEGORIES,
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
} from '@/shared/ui';
import { Edit02Icon, Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  buildEditProductFormData,
  createInitialFormValues,
  getDisplayedCategories,
  validateEditProductForm,
  type EditProductFormErrors,
  type EditProductFormValues,
} from '../model/edit-product.form';
import { ProductIdentityFields } from './components/ProductIdentityFields';
import { ProductPhotoUrlField } from './components/ProductPhotoUrlField';
import { ProductPricingStockFields } from './components/ProductPricingStockFields';

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
  const [values, setValues] = useState<EditProductFormValues>(() =>
    createInitialFormValues(product),
  );
  const [errors, setErrors] = useState<EditProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (product !== loadedProduct) {
    setLoadedProduct(product);
    setValues(createInitialFormValues(product));
    setErrors({});
  }

  const displayedCategories = getDisplayedCategories(availableCategories);

  const updateField = <K extends keyof EditProductFormValues>(
    field: K,
    value: EditProductFormValues[K],
    errorKey?: keyof EditProductFormErrors,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errorKey && errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const { errors: nextErrors, parsed } = validateEditProductForm(values);
    if (!parsed) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const formData = buildEditProductFormData(values, parsed);
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
          <ProductIdentityFields
            nombre={values.nombre}
            categoria={values.categoria}
            categories={displayedCategories}
            errors={errors}
            disabled={isSubmitting}
            onNombreChange={(val) => updateField('nombre', val, 'nombre')}
            onCategoriaChange={(val) => updateField('categoria', val, 'categoria')}
          />

          <ProductPricingStockFields
            precio={values.precio}
            precioCompra={values.precioCompra}
            stock={values.stock}
            errors={errors}
            disabled={isSubmitting}
            onPrecioChange={(val) => updateField('precio', val, 'precio')}
            onPrecioCompraChange={(val) => updateField('precioCompra', val, 'precioCompra')}
            onStockChange={(val) => updateField('stock', val, 'stock')}
          />

          <ProductPhotoUrlField
            fotoUrl={values.fotoUrl}
            alt={values.nombre.trim() || product.nombre}
            error={errors.foto}
            disabled={isSubmitting}
            onFotoUrlChange={(val) => {
              setValues((prev) => ({
                ...prev,
                fotoUrl: val,
                removeExistingPhoto: val.trim() === '',
              }));
              if (errors.foto) setErrors((prev) => ({ ...prev, foto: undefined }));
            }}
            onClearFoto={() => {
              setValues((prev) => ({
                ...prev,
                fotoUrl: '',
                removeExistingPhoto: true,
              }));
              if (errors.foto) setErrors((prev) => ({ ...prev, foto: undefined }));
            }}
          />

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
