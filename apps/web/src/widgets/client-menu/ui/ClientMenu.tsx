'use client';

import { useMemo, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PackageIcon } from '@hugeicons/core-free-icons';
import type { MenuItem } from '@/entities/client-menu';
import { useClientCart } from '@/features/client-cart';
import { Button } from '@/shared/ui';
import { ClienteMenuHeader } from './ClienteMenuHeader';
import { ClientMenuFilters, type FilterValue } from './ClientMenuFilters';
import { ClientMenuCatalog } from './ClientMenuCatalog';

type CatalogSection = { data: MenuItem[] | null };
type ClientUser = { name?: string; email?: string };

const priceFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function ClientMenu({ dishes, products, user }: {
  dishes: CatalogSection;
  products: CatalogSection;
  user?: ClientUser;
}) {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('todo');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useClientCart();
  const dishItems = useMemo(() => dishes.data ?? [], [dishes.data]);
  const productItems = useMemo(() => products.data ?? [], [products.data]);
  const allItems = useMemo(() => [...dishItems, ...productItems], [dishItems, productItems]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of allItems) {
      if (!item.category) continue;
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    return allItems.filter(item => {
      if (activeFilter === 'platos' && item.type !== 'plato') return false;
      if (activeFilter === 'productos' && item.type !== 'producto') return false;
      if (activeFilter.startsWith('cat:') && item.category !== activeFilter.slice(4)) return false;
      if (onlyAvailable && (item.availability === 'agotado' || item.price === null)) return false;
      if (!query) return true;
      return (
        item.name.toLocaleLowerCase('es').includes(query) ||
        (item.category?.toLocaleLowerCase('es').includes(query) ?? false)
      );
    });
  }, [allItems, activeFilter, onlyAvailable, search]);

  const hasSectionError = dishes.data === null || products.data === null;
  const hasActiveFilters = Boolean(search.trim()) || activeFilter !== 'todo' || onlyAvailable;

  return (
    <div className="relative min-h-screen pb-24 sm:pb-10">
      <ClienteMenuHeader search={search} setSearch={setSearch} user={user} cart={cart} cartOpen={cartOpen} setCartOpen={setCartOpen} />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-[#112747] sm:text-3xl">
            Nuestra carta
          </h1>
          <p className="text-sm tabular-nums text-[#55667e]">
            {filteredItems.length === 1 ? '1 artículo' : `${filteredItems.length} artículos`}
          </p>
        </div>
        <ClientMenuFilters
          allCount={allItems.length}
          dishCount={dishItems.length}
          productCount={productItems.length}
          categories={categories}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          onlyAvailable={onlyAvailable}
          setOnlyAvailable={setOnlyAvailable}
        />
        <ClientMenuCatalog
          filteredItems={filteredItems}
          hasSectionError={hasSectionError}
          hasActiveFilters={hasActiveFilters}
          clearFilters={() => { setSearch(''); setActiveFilter('todo'); setOnlyAvailable(false); }}
          cart={cart}
        />
      </main>

      {cart.count > 0 && !cartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
          <Button
            className="min-h-12 w-full rounded-full bg-[#112747] text-white shadow-xl hover:bg-[#1a3860]"
            onClick={() => setCartOpen(true)}
            aria-label={`Abrir carrito (${cart.count}) · ${priceFormatter.format(cart.total / 100)}`}
          >
            <HugeiconsIcon icon={PackageIcon} data-icon="inline-start" strokeWidth={1.8} className="size-5" />
            <span>Ver carrito</span>
            <span aria-live="polite" className="ml-1 tabular-nums">
              ({cart.count}) · {priceFormatter.format(cart.total / 100)}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
