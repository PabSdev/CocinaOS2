import { DEFAULT_PRODUCT_CATEGORIES, type Product } from '@/entities/product'

export function computeAvailableCategories(products: Product[]) {
  const map = new Map<string, string>()
  for (const base of DEFAULT_PRODUCT_CATEGORIES) {
    map.set(base.toLocaleLowerCase('es'), base)
  }
  for (const product of products) {
    const clean = product.categoria.trim()
    if (clean) {
      const key = clean.toLocaleLowerCase('es')
      if (!map.has(key)) {
        map.set(key, clean)
      }
    }
  }
  return Array.from(map.values())
}

export function filterAndSortProducts(
  products: Product[],
  deferredSearch: string,
  selectedCategory: string,
  lowStockOnly: boolean
) {
  const query = deferredSearch.trim().toLocaleLowerCase('es')
  const categoryKey = selectedCategory.toLocaleLowerCase('es')

  const filtered = products.filter((product) => {
    const matchesSearch =
      !query ||
      product.nombre.toLocaleLowerCase('es').includes(query) ||
      product.categoria.toLocaleLowerCase('es').includes(query)

    const matchesCategory =
      selectedCategory === 'ALL' ||
      product.categoria.trim().toLocaleLowerCase('es') === categoryKey

    const matchesStock = !lowStockOnly || product.stock <= 5

    return matchesSearch && matchesCategory && matchesStock
  })

  return lowStockOnly ? filtered.sort((a, b) => a.stock - b.stock) : filtered
}

export function computeProductsMetrics(products: Product[]) {
  let lowStock = 0
  let latestUpdate = ''
  const activeCategories = new Set<string>()

  for (const product of products) {
    if (product.stock <= 5) lowStock += 1
    if (product.categoria.trim()) {
      activeCategories.add(product.categoria.trim().toLocaleLowerCase('es'))
    }
    const timestamp = product.$updatedAt || product.$createdAt || ''
    if (timestamp > latestUpdate) latestUpdate = timestamp
  }

  return {
    total: products.length,
    categoriesCount: activeCategories.size,
    lowStock,
    latestUpdate,
  }
}
