'use client';

import { ProductThumbnail } from '@/entities/product';
import { Button, Input } from '@/shared/ui';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface ProductPhotoUrlFieldProps {
  fotoUrl: string;
  alt: string;
  error?: string;
  disabled: boolean;
  onFotoUrlChange: (value: string) => void;
  onClearFoto: () => void;
}

export function ProductPhotoUrlField({
  fotoUrl,
  alt,
  error,
  disabled,
  onFotoUrlChange,
  onClearFoto,
}: ProductPhotoUrlFieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="edit-product-photo-url"
        className="block text-xs font-semibold text-[#142238]"
      >
        URL de fotografía (opcional)
      </label>
      <div className="flex items-center gap-3">
        <ProductThumbnail fotoId={fotoUrl.trim() || null} alt={alt} size="md" />
        <div className="relative flex-1">
          <Input
            id="edit-product-photo-url"
            name="foto"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg (opcional)"
            value={fotoUrl}
            onChange={(e) => onFotoUrlChange(e.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className="h-10 rounded-xl border-[#cbd7e3] bg-white pr-9 text-[13px]"
          />
          {fotoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClearFoto}
              disabled={disabled}
              className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 rounded-full text-[#55667e] hover:bg-[#fdebec] hover:text-[#962b29]"
              title="Quitar URL de foto"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-[11px] text-[#64748b]">
        Deja este campo vacío para guardar el producto sin fotografía.
      </p>
      {error ? (
        <p role="alert" className="text-xs font-medium text-[#962b29]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
