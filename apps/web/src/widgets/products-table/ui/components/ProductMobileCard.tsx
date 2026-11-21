'use client'

import { StockBadge } from '@/entities/ingredient'
import {
  ProductThumbnail,
  ProductCategoryBadge,
  formatProductPrice,
  type Product,
} from '@/entities/product'
import { ProductRowActions } from './ProductRowActions'

interface ProductMobileCardProps {
  product: Product
  isPending: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductMobileCard({
  product,
  isPending,
  onEdit,
  onDelete,
}: ProductMobileCardProps) {
  const isLow = product.stock <= 5

  return (
    <li className={`p-4 ${isLow ? 'bg-[#fffcf5]' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <ProductThumbnail fotoId={product.foto} alt={product.nombre} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold text-[#142238]">
                {product.nombre}
              </p>
              <div className="mt-1">
                <ProductCategoryBadge categoria={product.categoria} />
              </div>
            </div>
            <ProductRowActions
              product={product}
              disabled={isPending}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#eff4f8] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#142238]">
                {formatProductPrice(product.precio)}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#fafbfc] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#55667e]">
                Compra: {formatProductPrice(product.precio_compra)}
              </span>
              <span className="rounded-md bg-[#eff4f8] px-2 py-0.5 text-xs font-medium text-[#55667e]">
                {product.stock} {product.stock === 1 ? 'ud.' : 'uds.'}
              </span>
            </div>
            <StockBadge stock={product.stock} />
          </div>
        </div>
      </div>
    </li>
  )
}
