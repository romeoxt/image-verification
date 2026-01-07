import { queryMany, type User } from "@/lib/db";
import UsersClientPage from "./client-page";

export const dynamic = 'force-dynamic';

async function getUsers() {
  try {
    return await queryMany<User>(`
      SELECT id, email, full_name, role, created_at, last_login_at
      FROM users
      ORDER BY created_at DESC
    `);
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function Page() {
  const users = await getUsers();
  // Safe cast since queryMany returns type T but fields might be missing/null in strict mode?
  // Our interface matches DB columns except password_hash which we excluded in select
  return <UsersClientPage users={users as any} />;
}

