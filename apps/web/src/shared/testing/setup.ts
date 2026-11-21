import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Variables de entorno mínimas para evitar fallos de inicialización de Appwrite en tests
process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1'
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project'
process.env.APPWRITE_API_KEY = 'test-api-key'
process.env.APPWRITE_DATABASE_ID = 'test-db'

afterEach(() => {
  cleanup()
})
