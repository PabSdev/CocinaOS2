'use client';

import { Input } from '@/shared/ui';

interface ProductPricingStockFieldsProps {
  precio: string;
  precioCompra: string;
  stock: string;
  errors: {
    precio?: string;
    precioCompra?: string;
    stock?: string;
  };
  disabled: boolean;
  onPrecioChange: (value: string) => void;
  onPrecioCompraChange: (value: string) => void;
  onStockChange: (value: string) => void;
}

export function ProductPricingStockFields({
  precio,
  precioCompra,
  stock,
  errors,
  disabled,
  onPrecioChange,
  onPrecioCompraChange,
  onStockChange,
}: ProductPricingStockFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          onChange={(e) => onPrecioChange(e.target.value)}
          disabled={disabled}
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

      <div className="space-y-1.5">
        <label
          htmlFor="edit-product-purchase-price"
          className="text-xs font-semibold text-[#142238]"
        >
          Precio de compra (€) <span className="text-[#962b29]">*</span>
        </label>
        <Input
          id="edit-product-purchase-price"
          name="precio_compra"
          type="number"
          min="0"
          step="0.01"
          value={precioCompra}
          onChange={(e) => onPrecioCompraChange(e.target.value)}
          disabled={disabled}
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
          onChange={(e) => onStockChange(e.target.value)}
          disabled={disabled}
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
  );
}
