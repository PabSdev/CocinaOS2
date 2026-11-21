import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ClientMenu } from './ClientMenu';

describe('ClientMenu', () => {
  it('filtra la carta por nombre y comunica los errores de carga', async () => {
    const user = userEvent.setup();
    render(<ClientMenu dishes={{ data: [{ id: '1', type: 'plato', name: 'Tortilla', price: 12.5, category: null, photo: false, availability: 'bajo' }] }} products={{ data: null }} />);
    expect(screen.getByText('Tortilla')).toBeTruthy();
    expect(screen.getByText('Últimas unidades')).toBeTruthy();
    expect(screen.getByText('No se ha podido cargar esta sección.')).toBeTruthy();
    await user.type(screen.getByRole('searchbox', { name: 'Buscar en la carta' }), 'sopa');
    expect(screen.queryByText('Tortilla')).toBeNull();
    expect(screen.getByText('No hay resultados para tu búsqueda.')).toBeTruthy();
  });

  it('abre y cierra el carrito con el teclado', async () => {
    const user = userEvent.setup();
    render(<ClientMenu dishes={{ data: [] }} products={{ data: [] }} />);
    const trigger = screen.getByRole('button', { name: /^Carrito/ });
    await user.click(trigger);
    expect(await screen.findByRole('dialog', { name: 'Tu carrito' })).toBeTruthy();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Tu carrito' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('gestiona cantidades y calcula el subtotal sin mezclar tipos', async () => {
    const user = userEvent.setup();
    const item = { id: '1', name: 'Tortilla', price: 0.1, category: null, photo: false, availability: 'disponible' as const };
    render(<ClientMenu dishes={{ data: [{ ...item, type: 'plato' }] }} products={{ data: [{ ...item, name: 'Agua', type: 'producto', price: 0.2 }] }} />);
    await user.click(screen.getByRole('button', { name: 'Añadir Tortilla' }));
    await user.click(screen.getByRole('button', { name: 'Añadir Agua' }));
    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad de Tortilla' }));
    expect(screen.getByLabelText('Cantidad de Tortilla').textContent).toBe('2');
    expect(screen.getByRole('button', { name: /Carrito.*0,40/ })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Carrito.*0,40/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Tu carrito' });
    expect(dialog).toBeTruthy();
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar Agua' }));
    await user.click(within(dialog).getByRole('button', { name: 'Reducir cantidad de Tortilla' }));
    expect(screen.getByRole('button', { name: /Carrito.*0,10/ })).toBeTruthy();
  });

  it('permite interactuar con la carta mientras el carrito está abierto en vivo', async () => {
    const user = userEvent.setup();
    const item = { id: '1', type: 'plato' as const, name: 'Tortilla', price: 5, category: null, photo: false, availability: 'disponible' as const };
    render(<ClientMenu dishes={{ data: [item] }} products={{ data: [] }} />);

    await user.click(screen.getByRole('button', { name: 'Añadir Tortilla' }));
    const trigger = screen.getByRole('button', { name: /Carrito.*5,00/ });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Tu carrito' });
    expect(dialog).toBeTruthy();

    // Comprobamos que sin cerrar el carrito podemos seguir añadiendo desde la tarjeta de la carta
    const articleCard = screen.getByRole('article');
    await user.click(within(articleCard).getByRole('button', { name: 'Aumentar cantidad de Tortilla' }));

    // El contador de la tarjeta, el del trigger y el del interior del carrito reflejan 2 unidades inmediatamente
    expect(within(articleCard).getByLabelText('Cantidad de Tortilla').textContent).toBe('2');
    expect(within(dialog).getByLabelText('Cantidad de Tortilla').textContent).toBe('2');
    expect(screen.getByRole('button', { name: /Carrito.*10,00/ })).toBeTruthy();
  });

  it('permite ajustar y quitar unidades directamente desde las tarjetas de la carta', async () => {
    const user = userEvent.setup();
    const item = { id: '1', type: 'plato' as const, name: 'Tortilla', price: 5, category: null, photo: false, availability: 'disponible' as const };
    render(<ClientMenu dishes={{ data: [item] }} products={{ data: [] }} />);

    await user.click(screen.getByRole('button', { name: 'Añadir Tortilla' }));
    expect(screen.getByLabelText('Cantidad de Tortilla').textContent).toBe('1');
    expect(screen.getByRole('button', { name: /Carrito.*5,00/ })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Aumentar cantidad de Tortilla' }));
    expect(screen.getByLabelText('Cantidad de Tortilla').textContent).toBe('2');
    expect(screen.getByRole('button', { name: /Carrito.*10,00/ })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Reducir cantidad de Tortilla' }));
    expect(screen.getByLabelText('Cantidad de Tortilla').textContent).toBe('1');

    await user.click(screen.getByRole('button', { name: 'Reducir cantidad de Tortilla' }));
    expect(screen.getByRole('button', { name: 'Añadir Tortilla' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Carrito.*0,00/ })).toBeTruthy();
  });

  it('muestra platos y productos juntos y permite filtrarlos desde la barra de filtros', async () => {
    const user = userEvent.setup();
    render(
      <ClientMenu
        dishes={{
          data: [
            { id: '1', type: 'plato', name: 'Tortilla', price: 8, category: null, photo: false, availability: 'disponible' },
            { id: '2', type: 'plato', name: 'Paella', price: 14, category: null, photo: false, availability: 'agotado' },
          ],
        }}
        products={{
          data: [
            { id: '3', type: 'producto', name: 'Agua mineral', price: 2, category: 'Bebidas', photo: false, availability: 'disponible' },
          ],
        }}
      />
    );

    expect(screen.getByText('Tortilla')).toBeTruthy();
    expect(screen.getByText('Paella')).toBeTruthy();
    expect(screen.getByText('Agua mineral')).toBeTruthy();

    const toolbar = screen.getByRole('toolbar', { name: 'Filtrar artículos de la carta' });
    await user.click(within(toolbar).getByRole('button', { name: /^Productos/ }));
    expect(screen.queryByText('Tortilla')).toBeNull();
    expect(screen.getByText('Agua mineral')).toBeTruthy();

    await user.click(within(toolbar).getByRole('button', { name: /^Platos/ }));
    expect(screen.getByText('Tortilla')).toBeTruthy();
    expect(screen.getByText('Paella')).toBeTruthy();
    expect(screen.queryByText('Agua mineral')).toBeNull();

    await user.click(within(toolbar).getByRole('button', { name: 'Solo disponibles' }));
    expect(screen.getByText('Tortilla')).toBeTruthy();
    expect(screen.queryByText('Paella')).toBeNull();

    await user.click(within(toolbar).getByRole('button', { name: /^Bebidas/ }));
    expect(screen.queryByText('Tortilla')).toBeNull();
    expect(screen.getByText('Agua mineral')).toBeTruthy();
  });

  it('abre el desplegable de perfil en la cabecera con los datos del cliente y cerrar sesión', async () => {
    const user = userEvent.setup();
    render(
      <ClientMenu
        dishes={{ data: [] }}
        products={{ data: [] }}
        user={{ name: 'María García', email: 'maria@ejemplo.es' }}
      />
    );

    const profileTrigger = screen.getByRole('button', { name: 'Menú de perfil' });
    await user.click(profileTrigger);

    expect(await screen.findByText('María García')).toBeTruthy();
    expect(screen.getByText('maria@ejemplo.es')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();
  });

  it('expande, limpia y cierra el buscador móvil devolviendo el foco al disparador', async () => {
    const user = userEvent.setup();
    render(
      <ClientMenu
        dishes={{
          data: [
            { id: '1', type: 'plato', name: 'Tortilla', price: 12.5, category: null, photo: false, availability: 'disponible' },
            { id: '2', type: 'plato', name: 'Gazpacho', price: 8, category: null, photo: false, availability: 'disponible' },
          ],
        }}
        products={{ data: [] }}
      />
    );

    const searchTrigger = screen.getByRole('button', { name: 'Abrir buscador' });
    await user.click(searchTrigger);

    const searchInput = screen.getByRole('searchbox', { name: 'Buscar en la carta' });
    expect(document.activeElement).toBe(searchInput);

    await user.type(searchInput, 'sopa');
    expect(screen.getByText('No hay resultados para tu búsqueda.')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    expect((searchInput as HTMLInputElement).value).toBe('');
    expect(document.activeElement).toBe(searchInput);
    expect(screen.getByText('Tortilla')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(document.activeElement).toBe(searchTrigger);
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();

    await user.click(searchTrigger);
    expect(document.activeElement).toBe(searchInput);
    await user.keyboard('{Escape}');
    expect(document.activeElement).toBe(searchTrigger);
  });

  it('oculta la barra flotante al abrir el carrito en móvil y permite cerrarlo tocando el fondo', async () => {
    const user = userEvent.setup();
    const item = { id: '1', type: 'plato' as const, name: 'Tortilla', price: 5, category: null, photo: false, availability: 'disponible' as const };
    render(<ClientMenu dishes={{ data: [item] }} products={{ data: [] }} />);

    await user.click(screen.getByRole('button', { name: 'Añadir Tortilla' }));
    const mobileBarButton = screen.getByRole('button', { name: /Abrir carrito/ });
    await user.click(mobileBarButton);

    expect(await screen.findByRole('dialog', { name: 'Tu carrito' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Abrir carrito/ })).toBeNull();

    await user.click(screen.getByTestId('cart-backdrop'));
    expect(screen.queryByRole('dialog', { name: 'Tu carrito' })).toBeNull();
    expect(screen.getByRole('button', { name: /Abrir carrito/ })).toBeTruthy();
  });

});
