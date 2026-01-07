import { queryMany, type ApiKey } from "@/lib/db";
import ClientPage from "./client-page";

export const dynamic = 'force-dynamic';

async function getApiKeys() {
  try {
    return await queryMany<ApiKey>(`
      SELECT id, key_prefix, name, is_active, created_at, last_used_at, scopes
      FROM api_keys
      ORDER BY created_at DESC
    `);
  } catch (e) {
    // If table doesn't exist, return empty
    console.error(e);
    return [];
  }
}

export default async function ApiKeysPage() {
  const keys = await getApiKeys();
  return <ClientPage initialKeys={keys} />;
}

