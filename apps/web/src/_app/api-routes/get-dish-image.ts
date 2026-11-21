import { NextRequest, NextResponse } from 'next/server'
import { storage, BUCKET_FOTOS_ID, requireKitchenAccess } from '@/shared/api'

export async function getDishImage(
  _request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    await requireKitchenAccess()
  } catch {
    return new NextResponse('Acceso restringido', { status: 403 })
  }
  try {
    const { fileId } = await context.params

    if (!fileId || typeof fileId !== 'string') {
      return new NextResponse('File ID required', { status: 400 })
    }

    const [fileMeta, fileBuffer] = await Promise.all([
      storage.getFile({
        bucketId: BUCKET_FOTOS_ID,
        fileId,
      }),
      storage.getFileView({
        bucketId: BUCKET_FOTOS_ID,
        fileId,
      }),
    ])

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': fileMeta.mimeType || 'image/jpeg',
        'Cache-Control': 'private, no-store',
        'Content-Length': fileMeta.sizeOriginal.toString(),
      },
    })
  } catch (error: unknown) {
    console.error('Error fetching dish image from storage:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}
