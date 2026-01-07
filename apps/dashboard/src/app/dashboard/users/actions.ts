'use server';

import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function createUser(formData: FormData) {
  const email = formData.get('email') as string;
  const fullName = formData.get('fullName') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await queryOne(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4)
    `, [email, hash, fullName, role]);

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (e: any) {
    if (e.code === '23505') { // Unique violation
        return { error: 'User with this email already exists' };
    }
    console.error(e);
    return { error: 'Failed to create user' };
  }
}

export async function deleteUser(id: string) {
  try {
    // Prevent deleting self? Ideally yes, but keeping simple for now.
    // Also prevent deleting the last admin?
    await query(`DELETE FROM users WHERE id = $1`, [id]);
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to delete user' };
  }
}

