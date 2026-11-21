import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  user: vi.fn(), row: vi.fn(), file: vi.fn(), view: vi.fn(),
}));
vi.mock('@/entities/session', () => ({ getLoggedInUser: mocks.user }));
vi.mock('@/shared/api', () => ({
  DATABASE_ID: 'db', TABLE_PLATOS_ID: 'platos', TABLE_PRODUCTOS_ID: 'productos',
  BUCKET_FOTOS_ID: 'fotos', Query: { select: (fields: string[]) => fields.join(',') },
  tablesDB: { getRow: mocks.row }, storage: { getFile: mocks.file, getFileView: mocks.view },
}));

import { getClientMenuImage } from './get-client-menu-image';

const request = {} as NextRequest;
const context = (type = 'plato', id = 'item') => ({ params: Promise.resolve({ type, id }) });

describe('foto de la carta', () => {
  beforeEach(() => vi.resetAllMocks());

  it('rechaza usuarios no autorizados antes de consultar datos', async () => {
    mocks.user.mockResolvedValue(null);
    expect((await getClientMenuImage(request, context())).status).toBe(403);
    mocks.user.mockResolvedValue({ role: 'cocinero' });
    expect((await getClientMenuImage(request, context())).status).toBe(403);
    expect(mocks.row).not.toHaveBeenCalled();
  });

  it('sirve solo la foto asociada al artículo solicitado', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    mocks.row.mockResolvedValue({ fotos: 'foto-real' });
    mocks.file.mockResolvedValue({ mimeType: 'image/png' });
    mocks.view.mockResolvedValue(new ArrayBuffer(4));
    const response = await getClientMenuImage(request, context('producto'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(mocks.row).toHaveBeenCalledWith(expect.objectContaining({ tableId: 'productos', rowId: 'item' }));
    expect(mocks.view).toHaveBeenCalledWith({ bucketId: 'fotos', fileId: 'foto-real' });
  });

  it('rechaza tipos desconocidos y artículos sin foto', async () => {
    mocks.user.mockResolvedValue({ role: 'cliente' });
    expect((await getClientMenuImage(request, context('ingrediente'))).status).toBe(404);
    expect(mocks.row).not.toHaveBeenCalled();
    mocks.row.mockResolvedValue({ foto: null });
    expect((await getClientMenuImage(request, context())).status).toBe(404);
    expect(mocks.view).not.toHaveBeenCalled();
  });
});
