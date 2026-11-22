import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  file: vi.fn(),
  view: vi.fn(),
  dishById: vi.fn(),
  productById: vi.fn(),
}));
vi.mock('@/entities/session', () => ({ getLoggedInUser: mocks.user }));
vi.mock('@/shared/api', () => ({
  BUCKET_FOTOS_ID: 'fotos',
  storage: { getFile: mocks.file, getFileView: mocks.view },
  platosGetPlatoById: mocks.dishById,
  productosGetProductoById: mocks.productById,
}));

import { getClientMenuImage } from './get-client-menu-image';

const DISH_ID = '11111111-1111-4111-8111-111111111111';
const request = {} as NextRequest;
const context = (type = 'plato', id = DISH_ID) => ({ params: Promise.resolve({ type, id }) });

describe('foto de la carta', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('rechaza usuarios no autorizados antes de consultar datos', async () => {
    mocks.user.mockResolvedValue(null);
    expect((await getClientMenuImage(request, context())).status).toBe(403);
    mocks.user.mockResolvedValue({ role: 'cocinero' });
    expect((await getClientMenuImage(request, context())).status).toBe(403);
    expect(mocks.dishById).not.toHaveBeenCalled();
    expect(mocks.productById).not.toHaveBeenCalled();
  });

  it('sirve la foto de un plato desde la URL almacenada en FastAPI', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    mocks.dishById.mockResolvedValue({
      status: 200,
      data: { id: DISH_ID, foto: 'https://cdn.example.com/tortilla.png' },
      headers: {},
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await getClientMenuImage(request, context('plato', DISH_ID));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.dishById).toHaveBeenCalledWith(DISH_ID);
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/tortilla.png');
  });

  it('sirve la foto de un producto desde la URL almacenada en FastAPI', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    mocks.productById.mockResolvedValue({
      status: 200,
      data: { id: 1, foto: 'https://cdn.example.com/agua.png' },
      headers: {},
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3, 4]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await getClientMenuImage(request, context('producto', '1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/png');
    expect(mocks.productById).toHaveBeenCalledWith(1);
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/agua.png');
  });

  it('rechaza tipos desconocidos, IDs inválidos y artículos sin foto', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    expect((await getClientMenuImage(request, context('ingrediente'))).status).toBe(404);
    expect((await getClientMenuImage(request, context('plato', 'not-a-uuid'))).status).toBe(404);
    expect((await getClientMenuImage(request, context('producto', 'abc'))).status).toBe(404);
    expect(mocks.dishById).not.toHaveBeenCalled();
    expect(mocks.productById).not.toHaveBeenCalled();

    mocks.dishById.mockResolvedValue({ status: 200, data: { id: DISH_ID, foto: null }, headers: {} });
    expect((await getClientMenuImage(request, context('plato', DISH_ID))).status).toBe(404);

    mocks.productById.mockResolvedValue({ status: 200, data: { id: 1, foto: '' }, headers: {} });
    expect((await getClientMenuImage(request, context('producto', '1'))).status).toBe(404);
  });
});
