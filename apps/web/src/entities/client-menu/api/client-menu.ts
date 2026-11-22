import 'server-only';

import { platosGetPlatos, productosGetProductos } from '@/shared/api';
import type { ClientMenu, MenuItem } from '../model/types';

function price(value: string | number | null | undefined): number | null {
  if (value == null || (typeof value === 'string' && !value.trim())) return null;
  const normalized = typeof value === 'string' ? value.replace(/[€$\s]/g, '').replace(',', '.') : value;
  if (normalized === '') return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function availability(stock: number | null | undefined): MenuItem['availability'] {
  const value = Number(stock);
  if (!Number.isFinite(value) || value <= 0) return 'agotado';
  return value <= 5 ? 'bajo' : 'disponible';
}

async function dishes(): Promise<MenuItem[]> {
  const response = await platosGetPlatos();
  if (response.status !== 200) {
    throw new Error('No se pudo cargar la carta de platos.');
  }
  return response.data.map((row) => ({
    id: row.id,
    type: 'plato',
    name: row.nombre?.trim() || 'Plato sin nombre',
    price: price(row.precio),
    category: null,
    photo: Boolean(row.foto?.trim()),
    availability: availability(row.stock),
  }));
}

async function products(): Promise<MenuItem[]> {
  const response = await productosGetProductos();
  if (response.status !== 200) {
    throw new Error('No se pudo cargar la carta de productos.');
  }
  return response.data.map((row) => ({
    id: String(row.id),
    type: 'producto',
    name: row.nombre?.trim() || 'Producto sin nombre',
    price: price(row.precio),
    category: row.categoria?.trim() || null,
    photo: Boolean(row.foto?.trim()),
    availability: availability(row.stock),
  }));
}

export async function getClientMenu(): Promise<ClientMenu> {
  const [dishResult, productResult] = await Promise.allSettled([dishes(), products()]);
  if (dishResult.status === 'rejected') console.error('No se pudo cargar la carta de platos.', dishResult.reason);
  if (productResult.status === 'rejected') console.error('No se pudo cargar la carta de productos.', productResult.reason);
  return {
    dishes: { data: dishResult.status === 'fulfilled' ? dishResult.value : null },
    products: { data: productResult.status === 'fulfilled' ? productResult.value : null },
  };
}
