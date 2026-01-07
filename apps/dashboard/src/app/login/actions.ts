'use server';

import { queryOne, type User } from '@/lib/db';
import { login, logout } from '@/lib/auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const user = await queryOne<User>(`SELECT * FROM users WHERE email = $1`, [email]);

    if (!user) {
        // Dummy check
        await bcrypt.compare(password, '$2a$10$abcdefghijklmnopqrstuvwxyzABC'); 
        return { error: 'Invalid credentials' };
    }

    if (!user.is_active) {
        return { error: 'Account is disabled' };
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return { error: 'Invalid credentials' };
    }

    await queryOne(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);

    await login({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role
    });

  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred' };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}
