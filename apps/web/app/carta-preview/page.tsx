import { ClientMenu } from '@/_pages/clientes/ui/ClientMenu';
import type { MenuItem } from '@/entities/client-menu';

const dishes: MenuItem[] = [
  { id: '1', type: 'plato', name: 'Tortilla de patata', price: 8.5, photo: false, category: null, availability: 'disponible' },
  { id: '2', type: 'plato', name: 'Ensalada de temporada', price: 9, photo: false, category: null, availability: 'bajo' },
  { id: '3', type: 'plato', name: 'Arroz con verduras', price: 12, photo: false, category: null, availability: 'agotado' },
];
const products: MenuItem[] = [
  { id: '4', type: 'producto', name: 'Agua mineral', price: 2, photo: false, category: 'Bebidas', availability: 'disponible' },
  { id: '5', type: 'producto', name: 'Flan casero', price: 4.5, photo: false, category: 'Postres', availability: 'disponible' },
];

export default function Preview() {
  return (
    <div className="min-h-screen bg-[#f7f8f7] text-[#142238]">
      <ClientMenu
        dishes={{ data: dishes }}
        products={{ data: products }}
        user={{ name: 'María García', email: 'maria.garcia@ejemplo.es' }}
      />
    </div>
  );
}
