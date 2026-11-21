import { getLoggedInUser } from '@/entities/session';
import {
  BUCKET_FOTOS_ID,
  DATABASE_ID,
  productosGetProductoById,
  Query,
  storage,
  TABLE_PLATOS_ID,
  tablesDB,
} from '@/shared/api';
import type { NextRequest } from 'next/server';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function notFoundResponse() {
  return new Response('Imagen no encontrada', { status: 404 });
}

async function getProductImage(id: string): Promise<Response> {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return notFoundResponse();
  }

  const res = await productosGetProductoById(numericId);
  if (res.status !== 200) {
    return notFoundResponse();
  }

  const foto = res.data.foto?.trim();
  if (!foto || (!foto.startsWith('http://') && !foto.startsWith('https://'))) {
    return notFoundResponse();
  }

  const imageResponse = await fetch(foto);
  if (!imageResponse.ok) {
    return notFoundResponse();
  }

  const contentType =
    imageResponse.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? '';
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType)) {
    return notFoundResponse();
  }

  const buffer = await imageResponse.arrayBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function getClientMenuImage(
  _request: NextRequest,
  context: { params: Promise<{ type: string; id: string }> },
) {
  const user = await getLoggedInUser();
  if (!user || user.role !== 'cliente') return new Response('Acceso restringido', { status: 403 });

  const { type, id } = await context.params;
  if (!id || (type !== 'plato' && type !== 'producto')) {
    return notFoundResponse();
  }

  try {
    if (type === 'producto') {
      return await getProductImage(id);
    }

    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PLATOS_ID,
      rowId: id,
      queries: [Query.select(['foto'])],
    });
    const fileId = row.foto;
    if (typeof fileId !== 'string' || !fileId) {
      return notFoundResponse();
    }
    const [metadata, buffer] = await Promise.all([
      storage.getFile({ bucketId: BUCKET_FOTOS_ID, fileId }),
      storage.getFileView({ bucketId: BUCKET_FOTOS_ID, fileId }),
    ]);
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(metadata.mimeType)) {
      return notFoundResponse();
    }
    return new Response(buffer, {
      headers: {
        'Content-Type': metadata.mimeType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return notFoundResponse();
  }
}
