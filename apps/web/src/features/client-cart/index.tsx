'use client';

import { useState } from 'react';
import type { MenuItem } from '@/entities/client-menu';
import { Button } from '@/shared/ui';

type Line = { item: MenuItem; quantity: number };
const format = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const same = (a: MenuItem, b: MenuItem) => a.type === b.type && a.id === b.id;

export function useClientCart() {
  const [lines, setLines] = useState<Line[]>([]);
  function add(item: MenuItem) {
    if (item.price === null || item.availability === 'agotado') return;
    setLines(current => current.some(line => same(line.item, item))
      ? current.map(line => same(line.item, item) ? { ...line, quantity: line.quantity + 1 } : line)
      : [...current, { item, quantity: 1 }]);
  }
  function change(item: MenuItem, amount: number) {
    setLines(current => current.map(line => same(line.item, item) ? { ...line, quantity: line.quantity + amount } : line).filter(line => line.quantity > 0));
  }
  function remove(item: MenuItem) {
    setLines(current => current.filter(line => !same(line.item, item)));
  }
  function getQuantity(item: MenuItem) {
    return lines.find(line => same(line.item, item))?.quantity ?? 0;
  }
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + Math.round((line.item.price ?? 0) * 100) * line.quantity, 0);
  return { lines, count, total, add, change, remove, getQuantity };
}

export function CartContent({ cart }: { cart: ReturnType<typeof useClientCart> }) {
  if (cart.lines.length === 0) {
    return (
      <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-5">
        <div className="rounded-[12px] bg-[#eff4f8]/70 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-[#112747]">Tu carrito está vacío</p>
          <p className="mt-1 text-xs text-[#55667e]">
            Añade platos o productos de la carta para armar tu selección.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="max-h-[min(24rem,50dvh)] divide-y divide-[#dce3e9] overflow-y-auto overscroll-contain px-5 py-1">
        {cart.lines.map(({ item, quantity }) => (
          <li key={`${item.type}-${item.id}`} className="py-3.5 first:pt-2 last:pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-[#112747]">{item.name}</p>
                <p className="mt-0.5 text-xs tabular-nums text-[#55667e]">
                  {format.format(item.price ?? 0)} / ud
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums whitespace-nowrap text-[#112747]">
                {format.format(Math.round((item.price ?? 0) * 100) * quantity / 100)}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="inline-flex items-center rounded-full border border-[#dce3e9] bg-[#eff4f8] p-0.5">
                <Button
                  variant="ghost"
                  className="size-7 rounded-full p-0 text-base font-semibold text-[#112747] hover:bg-white"
                  aria-label={`Reducir cantidad de ${item.name}`}
                  onClick={() => cart.change(item, -1)}
                >
                  −
                </Button>
                <span
                  className="min-w-6 text-center text-xs font-semibold tabular-nums text-[#112747]"
                  aria-label={`Cantidad de ${item.name}`}
                >
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  className="size-7 rounded-full p-0 text-base font-semibold text-[#112747] hover:bg-white"
                  aria-label={`Aumentar cantidad de ${item.name}`}
                  onClick={() => cart.change(item, 1)}
                >
                  +
                </Button>
              </div>
              <Button
                variant="ghost"
                className="h-7 rounded-full px-2.5 text-xs font-medium text-[#962b29] hover:bg-[#fdebec]"
                aria-label={`Eliminar ${item.name}`}
                onClick={() => cart.remove(item)}
              >
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#dce3e9] bg-[#f7f8f7] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:rounded-b-[20px] sm:pb-4">
        <div className="flex items-baseline justify-between text-[#112747]">
          <span className="text-sm font-semibold">Subtotal</span>
          <span className="text-lg font-bold tabular-nums" aria-live="polite">
            {format.format(cart.total / 100)}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-[#55667e]">
          Selección provisional. Los pedidos estarán disponibles próximamente.
        </p>
      </div>
    </div>
  );
}
