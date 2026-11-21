import type { Metadata } from 'next'
import { getProducts } from '@/entities/product'
import { ProductsTableWidget } from '@/widgets/products-table'
import { HugeiconsIcon } from '@hugeicons/react'
import { PackageIcon } from '@hugeicons/core-free-icons'

export const metadata: Metadata = {
  title: 'Productos y Bebidas | CocinaOS',
  description: 'Control de stock, precios y categorías de bebidas, salsas y referencias de cocina.',
}

export async function ProductsPage() {
  const response = await getProducts()
  const products = response.success && response.data ? response.data : []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#dce3e9] bg-[#eff4f8] px-3 py-1 text-xs font-semibold text-[#112747]">
            <HugeiconsIcon icon={PackageIcon} className="size-3.5" strokeWidth={2} />
            <span>Catálogo operativo</span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#142238] sm:text-[30px]">
            Productos y Bebidas
          </h1>
          <p className="mt-1 text-sm text-[#55667e]">
            Gestiona bebidas, salsas, conservas y referencias listas para servicio con sus categorías y existencias.
          </p>
        </div>
      </header>

      <ProductsTableWidget
        initialProducts={products}
        initialLoadFailed={!response.success}
      />
    </div>
  )
}
