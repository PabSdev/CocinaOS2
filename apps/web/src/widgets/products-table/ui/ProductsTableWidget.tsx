'use client'

import { useDeferredValue, useMemo, useState, useTransition } from 'react'
import { getProducts, type Product } from '@/entities/product'
import { CreateProductDialog } from '@/features/product/create-product'
import { EditProductDialog } from '@/features/product/edit-product'
import { DeleteProductDialog } from '@/features/product/delete-product'
import { toast } from 'sonner'
import { ProductsMetricsGrid } from './components/ProductsMetricsGrid'
import { ProductsEmptyState, ProductsTableHeader } from './components/ProductsTableStates'
import { ProductsDesktopTable } from './components/ProductDesktopRow'
import { ProductMobileCard } from './components/ProductMobileCard'
import {
  computeAvailableCategories,
  computeProductsMetrics,
  filterAndSortProducts,
} from './components/productsTable.helpers'

interface ProductsTableWidgetProps {
  initialProducts: Product[]
  initialLoadFailed?: boolean
}

export function ProductsTableWidget({
  initialProducts,
  initialLoadFailed = false,
}: ProductsTableWidgetProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loadFailed, setLoadFailed] = useState(initialLoadFailed)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  // Combina las categorías base (Bebidas, Salsas, etc.) con las nuevas que el usuario vaya creando
  const availableCategories = useMemo(() => computeAvailableCategories(products), [products])
  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, deferredSearch, selectedCategory, lowStockOnly),
    [deferredSearch, lowStockOnly, products, selectedCategory]
  )
  const metrics = useMemo(() => computeProductsMetrics(products), [products])

  const handleRefresh = () => {
    startTransition(async () => {
      const response = await getProducts()
      if (response.success && response.data) {
        setProducts(response.data)
        setLoadFailed(false)
        toast.success('Catálogo de productos actualizado.')
        return
      }
      setLoadFailed(true)
      toast.error('No se pudo actualizar el catálogo de productos. Inténtalo de nuevo.')
    })
  }

  const handleCreated = (product: Product) => setProducts((current) => [product, ...current])
  const handleUpdated = (updated: Product) =>
    setProducts((current) => current.map((product) => (product.$id === updated.$id ? updated : product)))
  const handleDeleted = (deletedId: string) =>
    setProducts((current) => current.filter((product) => product.$id !== deletedId))

  const resetFilters = () => { setSearch(''); setSelectedCategory('ALL'); setLowStockOnly(false) }
  const hasFilters = search.trim() !== '' || selectedCategory !== 'ALL' || lowStockOnly
  const searchIsPending = search !== deferredSearch
  const productsUnavailable = loadFailed && products.length === 0

  return (
    <section className="space-y-4" aria-busy={isPending || searchIsPending}>
      <ProductsMetricsGrid
        metrics={metrics}
        productsUnavailable={productsUnavailable}
        availableCategories={availableCategories}
        lowStockOnly={lowStockOnly}
        onToggleLowStock={() => setLowStockOnly((active) => !active)}
      />

      <div className="overflow-hidden rounded-[20px] border border-[#cbd7e3] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <ProductsTableHeader
          filteredCount={filteredProducts.length}
          productsUnavailable={productsUnavailable}
          latestUpdate={metrics.latestUpdate}
          isPending={isPending}
          loadFailed={loadFailed}
          hasProducts={products.length > 0}
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          availableCategories={availableCategories}
          lowStockOnly={lowStockOnly}
          onLowStockChange={setLowStockOnly}
          onRefresh={handleRefresh}
          onOpenCreate={() => setCreateOpen(true)}
        />

        {filteredProducts.length === 0 ? (
          <ProductsEmptyState
            loadFailed={loadFailed}
            productsUnavailable={productsUnavailable}
            isEmpty={products.length === 0}
            isPending={isPending}
            onRefresh={handleRefresh}
            onOpenCreate={() => setCreateOpen(true)}
            onResetFilters={resetFilters}
          />
        ) : (
          <>
            <ProductsDesktopTable products={filteredProducts} isPending={isPending} onEdit={setEditingProduct} onDelete={setDeletingProduct} />
            <ul className="divide-y divide-[#edf1f5] sm:hidden" aria-label="Productos en catálogo">
              {filteredProducts.map((product) => (
                <ProductMobileCard key={product.$id} product={product} isPending={isPending} onEdit={setEditingProduct} onDelete={setDeletingProduct} />
              ))}
            </ul>
          </>
        )}

        {filteredProducts.length > 0 ? (
          <div className="flex items-center justify-between border-t border-[#edf1f5] bg-[#fafbfc] px-5 py-3 text-xs text-[#64748b] sm:px-6">
            <span>
              Mostrando <strong className="font-semibold text-[#142238]">{filteredProducts.length}</strong> de{' '}
              <strong className="font-semibold text-[#142238]">{products.length}</strong> productos
            </span>
            {hasFilters ? (
              <button type="button" onClick={resetFilters} className="font-medium text-[#112747] underline-offset-4 hover:underline">
                Restablecer vista
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <CreateProductDialog open={createOpen} onOpenChange={setCreateOpen} availableCategories={availableCategories} onCreated={handleCreated} />
      <EditProductDialog product={editingProduct} open={Boolean(editingProduct)} onOpenChange={(open) => { if (!open) setEditingProduct(null) }} availableCategories={availableCategories} onUpdated={handleUpdated} />
      <DeleteProductDialog product={deletingProduct} open={Boolean(deletingProduct)} onOpenChange={(open) => { if (!open) setDeletingProduct(null) }} onDeleted={handleDeleted} />
    </section>
  )
}
