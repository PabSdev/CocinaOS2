'use client';

import { Input } from '@/shared/ui';

interface ProductIdentityFieldsProps {
  nombre: string;
  categoria: string;
  categories: string[];
  errors: {
    nombre?: string;
    categoria?: string;
  };
  disabled: boolean;
  onNombreChange: (value: string) => void;
  onCategoriaChange: (value: string) => void;
}

export function ProductIdentityFields({
  nombre,
  categoria,
  categories,
  errors,
  disabled,
  onNombreChange,
  onCategoriaChange,
}: ProductIdentityFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="edit-product-name" className="text-xs font-semibold text-[#142238]">
          Nombre del producto <span className="text-[#962b29]">*</span>
        </label>
        <Input
          id="edit-product-name"
          name="nombre"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          disabled={disabled}
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span
            id="edit-product-category-label"
            className="text-xs font-semibold text-[#142238]"
          >
            Categoría <span className="text-[#962b29]">*</span>
          </span>
          <span className="text-[11px] text-[#64748b]">Elige una categoría oficial</span>
        </div>
        <div
          role="group"
          aria-labelledby="edit-product-category-label"
          className="flex flex-wrap items-center gap-1.5 pt-0.5"
        >
          {categories.map((cat) => {
            const isSelected =
              categoria.trim().toLocaleLowerCase('es') === cat.toLocaleLowerCase('es');
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onCategoriaChange(cat)}
                disabled={disabled}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
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
    </>
  );
}
