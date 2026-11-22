import {
  Account,
  AppwriteException,
  Client,
  ID,
  type Models,
  Query,
  Storage,
  TablesDB,
  Teams,
} from 'node-appwrite';

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || '';
const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '';
const apiKey = process.env.APPWRITE_API_KEY || '';
const databaseId = process.env.APPWRITE_DATABASE_ID || '';

// Initialize admin server client
const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export const adminAccount = new Account(client);
export const teams = new Teams(client);

export function createSessionAccountClient(sessionSecret: string): Account {
  const sessionClient = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(sessionSecret);
  return new Account(sessionClient);
}

export function getAuthCookieName(): string {
  const currentProjectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || 'default';
  return `a_session_${currentProjectId}`;
}

export const DATABASE_ID = databaseId;
export const BUCKET_FOTOS_ID = process.env.APPWRITE_BUCKET_FOTOS_ID || '';

export function createSessionTablesDBClient(sessionSecret: string): TablesDB {
  return new TablesDB(new Client().setEndpoint(endpoint).setProject(projectId).setSession(sessionSecret));
}

export const TABLE_PRODUCTOS_ID = process.env.APPWRITE_TABLE_PRODUCTOS_ID || '';

export const TABLE_PEDIDOS_ID = process.env.APPWRITE_TABLE_PEDIDOS_ID || 'pedidos';
export const TABLE_LINEAS_PEDIDO_ID = process.env.APPWRITE_TABLE_LINEAS_PEDIDO_ID || 'lineas_pedido';
export const TABLE_PAGOS_CLIENTE_ID = process.env.APPWRITE_TABLE_PAGOS_CLIENTE_ID || 'pagos_cliente';

export { AppwriteException, ID, Query, type Models };
