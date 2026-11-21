import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Dish01Icon, PackageIcon } from '@hugeicons/core-free-icons';
import type { MenuItem } from '@/entities/client-menu';
import { useClientCart } from '@/features/client-cart';
import { Badge, Button } from '@/shared/ui';

const priceFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const availability = {
  disponible: { label: 'Disponible', className: 'bg-[#edf3ec] text-[#26592b]' },
  bajo: { label: 'Últimas unidades', className: 'bg-[#fbf3db] text-[#8a5700]' },
  agotado: { label: 'Agotado', className: 'bg-[#fdebec] text-[#962b29]' },
};

function ItemCard({
  item,
  quantity,
  add,
  change,
}: {
  item: MenuItem;
  quantity: number;
  add: (item: MenuItem) => void;
  change: (item: MenuItem, amount: number) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const state = availability[item.availability];
  const isAvailable = item.availability !== 'agotado' && item.price !== null;

  return (
    <article className="flex flex-col overflow-hidden rounded-[20px] border border-[#dce3e9] bg-white transition-shadow hover:shadow-xs">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#eff4f8] text-[#8495a8]">
        {item.photo && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/clientes/carta/${item.type}/${encodeURIComponent(item.id)}/foto`}
            alt={item.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="size-full object-cover"
          />
        ) : (
          <HugeiconsIcon
            icon={item.type === 'plato' ? Dish01Icon : PackageIcon}
            size={38}
            strokeWidth={1.3}
            aria-label={`Sin foto: ${item.name}`}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-[#55667e]">
            {item.category || (item.type === 'plato' ? 'Plato' : 'Producto')}
          </span>
          <Badge className={`shrink-0 ${state.className}`}>{state.label}</Badge>
        </div>
        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-[#112747]">{item.name}</h3>
        <p className="mt-1 text-base font-semibold tabular-nums text-[#112747]">
          {item.price === null ? 'Precio no disponible' : priceFormatter.format(item.price)}
        </p>
        <div className="mt-auto pt-4">
          {quantity === 0 ? (
            <Button
              className="min-h-11 w-full rounded-full bg-[#112747] text-white hover:bg-[#1a3860]"
              disabled={!isAvailable}
              onClick={() => add(item)}
              aria-label={`Añadir ${item.name}`}
            >
              Añadir
            </Button>
          ) : (
            <div className="flex min-h-11 w-full items-center justify-between rounded-full border border-[#112747] bg-[#112747] px-1 text-white">
              <Button
                variant="ghost"
                className="size-9 rounded-full p-0 text-lg font-bold text-white hover:bg-white/20"
                aria-label={`Reducir cantidad de ${item.name}`}
                onClick={() => change(item, -1)}
              >
                −
              </Button>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <span className="tabular-nums" aria-label={`Cantidad de ${item.name}`}>{quantity}</span>
                <span className="text-xs font-normal text-white/80">en carrito</span>
              </div>
              <Button
                variant="ghost"
                className="size-9 rounded-full p-0 text-lg font-bold text-white hover:bg-white/20"
                aria-label={`Aumentar cantidad de ${item.name}`}
                onClick={() => change(item, 1)}
              >
                +
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}


export function ClientMenuCatalog({ filteredItems, hasSectionError, hasActiveFilters, clearFilters, cart }: {
  filteredItems: MenuItem[];
  hasSectionError: boolean;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  cart: ReturnType<typeof useClientCart>;
}) {
  return (
    <>
        {hasSectionError && (
          <div
            role="status"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#dce3e9] bg-white px-5 py-4 text-sm text-[#55667e]"
          >
            <p>No se ha podido cargar esta sección.</p>
            <a
              href="/clientes"
              className="font-semibold text-[#112747] underline underline-offset-4"
            >
              Reintentar
            </a>
          </div>
        )}

        <section aria-label="Artículos de la carta" className="mt-6">
          {filteredItems.length === 0 ? (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[#dce3e9] bg-white p-6 text-sm text-[#55667e]"
            >
              <p>
                {hasActiveFilters
                  ? 'No hay resultados para tu búsqueda.'
                  : 'Todavía no hay artículos en la carta.'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="rounded-full border-[#dce3e9] text-[#112747]"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map(item => (
                <ItemCard
                  key={`${item.type}-${item.id}`}
                  item={item}
                  quantity={cart.getQuantity(item)}
                  add={cart.add}
                  change={cart.change}
                />
              ))}
            </div>
          )}
        </section>
    </>
  );
}
