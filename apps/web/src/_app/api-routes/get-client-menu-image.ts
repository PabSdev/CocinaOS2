import { getLoggedInUser } from '@/entities/session';
import {
  BUCKET_FOTOS_ID, DATABASE_ID, Query, storage, TABLE_PLATOS_ID,
  TABLE_PRODUCTOS_ID, tablesDB,
} from '@/shared/api';
import type { NextRequest } from 'next/server';

export async function getClientMenuImage(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const user = await getLoggedInUser();
  if (!user || user.role !== 'cliente') return new Response('Acceso restringido', { status: 403 });

  const { type, id } = await context.params;
  if (!id || (type !== 'plato' && type !== 'producto')) {
    return new Response('Imagen no encontrada', { status: 404 });
  }

  try {
    const column = type === 'plato' ? 'foto' : 'fotos';
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: type === 'plato' ? TABLE_PLATOS_ID : TABLE_PRODUCTOS_ID,
      rowId: id,
      queries: [Query.select([column])],
    });
    const fileId = row[column];
    if (typeof fileId !== 'string' || !fileId) {
      return new Response('Imagen no encontrada', { status: 404 });
    }
    const [metadata, buffer] = await Promise.all([
      storage.getFile({ bucketId: BUCKET_FOTOS_ID, fileId }),
      storage.getFileView({ bucketId: BUCKET_FOTOS_ID, fileId }),
    ]);
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(metadata.mimeType)) {
      return new Response('Imagen no encontrada', { status: 404 });
    }
    return new Response(buffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Imagen no encontrada', { status: 404 });
  }
}
