'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui'
import { StockBadge } from '@/entities/ingredient'
import {
  ProductThumbnail,
  ProductCategoryBadge,
  formatProductPrice,
  type Product,
} from '@/entities/product'
import { ProductRowActions, formatDate } from './ProductRowActions'

interface ProductDesktopRowProps {
  product: Product
  isPending: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductDesktopRow({
  product,
  isPending,
  onEdit,
  onDelete,
}: ProductDesktopRowProps) {
  const isLow = product.stock <= 5

  return (
    <TableRow
      className={`border-[#edf1f5] transition-colors ${
        isLow
          ? 'bg-[#fffcf5] hover:bg-[#fbf3db]/45'
          : 'bg-white hover:bg-[#f7f9fb]'
      }`}
    >
      <TableCell className="py-3 pl-6">
        <ProductThumbnail fotoId={product.foto} alt={product.nombre} size="md" />
      </TableCell>
      <TableCell className="min-w-0 py-3.5">
        <p className="truncate text-[13.5px] font-semibold text-[#142238]">
          {product.nombre}
        </p>
      </TableCell>
      <TableCell>
        <ProductCategoryBadge categoria={product.categoria} />
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#eff4f8] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#142238]">
          {formatProductPrice(product.precio)}
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#fafbfc] px-2.5 py-0.5 text-xs font-medium tabular-nums text-[#55667e]">
          {formatProductPrice(product.precio_compra)}
        </span>
      </TableCell>
      <TableCell>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[13.5px] font-semibold tabular-nums text-[#142238]">
            {product.stock}
          </span>
          <span className="rounded-md bg-[#eff4f8] px-1.5 py-0.5 text-[11px] font-medium text-[#55667e]">
            {product.stock === 1 ? 'ud.' : 'uds.'}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <StockBadge stock={product.stock} />
      </TableCell>
      <TableCell className="hidden text-xs text-[#64748b] lg:table-cell">
        {formatDate(product.$updatedAt || product.$createdAt)}
      </TableCell>
      <TableCell className="pr-5 text-right">
        <ProductRowActions
          product={product}
          disabled={isPending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  )
}

interface ProductsDesktopTableProps {
  products: Product[]
  isPending: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductsDesktopTable({
  products,
  isPending,
  onEdit,
  onDelete,
}: ProductsDesktopTableProps) {
  return (
    <Table className="hidden sm:table">
      <TableHeader>
        <TableRow className="border-[#edf1f5] bg-[#fafbfc] hover:bg-[#fafbfc]">
          <TableHead className="w-16 pl-6 text-xs font-semibold text-[#55667e]">Foto</TableHead>
          <TableHead className="w-[26%] text-xs font-semibold text-[#55667e]">Producto</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Categoría</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Precio</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Precio compra</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Cantidad</TableHead>
          <TableHead className="text-xs font-semibold text-[#55667e]">Estado</TableHead>
          <TableHead className="hidden text-xs font-semibold text-[#55667e] lg:table-cell">
            Actualizado
          </TableHead>
          <TableHead className="w-16 pr-5 text-right text-xs font-semibold text-[#55667e]">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <ProductDesktopRow
            key={product.$id}
            product={product}
            isPending={isPending}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </Table>
  )
}
