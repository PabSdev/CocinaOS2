import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { NextRequest } from 'next/server'

const mockStorage = vi.hoisted(() => ({
  getFile: vi.fn(),
  getFileView: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  requireKitchenAccess: vi.fn().mockResolvedValue(undefined),
  storage: mockStorage,
  BUCKET_FOTOS_ID: 'photos-bucket',
}))

import { getDishImage } from './get-dish-image'

describe('getDishImage route handler', () => {
  const dummyRequest = {} as NextRequest

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 400 si fileId no está presente en los parámetros de ruta', async () => {
    const response = await getDishImage(dummyRequest, {
      params: Promise.resolve({ fileId: '' }),
    })

    expect(response.status).toBe(400)
    expect(await response.text()).toBe('File ID required')
    expect(mockStorage.getFile).not.toHaveBeenCalled()
  })

  it('devuelve 200 con el buffer de imagen y cabeceras de caché cuando existe', async () => {
    const fakeBuffer = new ArrayBuffer(8)
    mockStorage.getFile.mockResolvedValueOnce({
      mimeType: 'image/png',
      sizeOriginal: 1024,
    })
    mockStorage.getFileView.mockResolvedValueOnce(fakeBuffer)

    const response = await getDishImage(dummyRequest, {
      params: Promise.resolve({ fileId: 'foto-123' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store'
    )
    expect(response.headers.get('Content-Length')).toBe('1024')
    expect(mockStorage.getFile).toHaveBeenCalledWith({
      bucketId: 'photos-bucket',
      fileId: 'foto-123',
    })
    expect(mockStorage.getFileView).toHaveBeenCalledWith({
      bucketId: 'photos-bucket',
      fileId: 'foto-123',
    })
  })

  it('utiliza image/jpeg como fallback si mimeType no viene especificado', async () => {
    mockStorage.getFile.mockResolvedValueOnce({
      mimeType: '',
      sizeOriginal: 512,
    })
    mockStorage.getFileView.mockResolvedValueOnce(new ArrayBuffer(4))

    const response = await getDishImage(dummyRequest, {
      params: Promise.resolve({ fileId: 'foto-456' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
  })

  it('devuelve 404 si el almacenamiento de Appwrite arroja un error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockStorage.getFile.mockRejectedValueOnce(new Error('Storage file not found'))

    const response = await getDishImage(dummyRequest, {
      params: Promise.resolve({ fileId: 'inexistente' }),
    })

    expect(response.status).toBe(404)
    expect(await response.text()).toBe('Image not found')
    consoleSpy.mockRestore()
  })
})

 it('rechaza solicitudes sin acceso a cocina antes de leer imágenes', async () => {
  const { requireKitchenAccess } = await import('@/shared/api')
  vi.mocked(requireKitchenAccess).mockRejectedValueOnce(new Error('Acceso restringido'))
  mockStorage.getFile.mockClear()
  const response = await getDishImage({} as NextRequest, { params: Promise.resolve({ fileId: 'privada' }) })
  expect(response.status).toBe(403)
  expect(mockStorage.getFile).not.toHaveBeenCalled()
 })
