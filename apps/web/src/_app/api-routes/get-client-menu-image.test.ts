import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  row: vi.fn(),
  file: vi.fn(),
  view: vi.fn(),
  productById: vi.fn(),
}));
vi.mock('@/entities/session', () => ({ getLoggedInUser: mocks.user }));
vi.mock('@/shared/api', () => ({
  DATABASE_ID: 'db',
  TABLE_PLATOS_ID: 'platos',
  BUCKET_FOTOS_ID: 'fotos',
  Query: { select: (fields: string[]) => fields.join(',') },
  tablesDB: { getRow: mocks.row },
  storage: { getFile: mocks.file, getFileView: mocks.view },
  productosGetProductoById: mocks.productById,
}));

import { getClientMenuImage } from './get-client-menu-image';

const request = {} as NextRequest;
const context = (type = 'plato', id = 'item') => ({ params: Promise.resolve({ type, id }) });

describe('foto de la carta', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('rechaza usuarios no autorizados antes de consultar datos', async () => {
    mocks.user.mockResolvedValue(null);
    expect((await getClientMenuImage(request, context())).status).toBe(403);
    mocks.user.mockResolvedValue({ role: 'cocinero' });
    expect((await getClientMenuImage(request, context())).status).toBe(403);
    expect(mocks.row).not.toHaveBeenCalled();
    expect(mocks.productById).not.toHaveBeenCalled();
  });

  it('sirve la foto de un plato desde Appwrite Storage', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    mocks.row.mockResolvedValue({ foto: 'foto-real' });
    mocks.file.mockResolvedValue({ mimeType: 'image/png' });
    mocks.view.mockResolvedValue(new ArrayBuffer(4));
    const response = await getClientMenuImage(request, context('plato', 'dish-1'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.row).toHaveBeenCalledWith(expect.objectContaining({ tableId: 'platos', rowId: 'dish-1' }));
    expect(mocks.view).toHaveBeenCalledWith({ bucketId: 'fotos', fileId: 'foto-real' });
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
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(mocks.productById).toHaveBeenCalledWith(1);
    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/agua.png');
  });

  it('rechaza tipos desconocidos, IDs inválidos y artículos sin foto', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    expect((await getClientMenuImage(request, context('ingrediente'))).status).toBe(404);
    expect((await getClientMenuImage(request, context('producto', 'abc'))).status).toBe(404);
    expect(mocks.row).not.toHaveBeenCalled();
    expect(mocks.productById).not.toHaveBeenCalled();

    mocks.row.mockResolvedValue({ foto: null });
    expect((await getClientMenuImage(request, context('plato', 'dish-1'))).status).toBe(404);
    expect(mocks.view).not.toHaveBeenCalled();

    mocks.productById.mockResolvedValue({ status: 200, data: { id: 1, foto: '' }, headers: {} });
    expect((await getClientMenuImage(request, context('producto', '1'))).status).toBe(404);
  });
});
