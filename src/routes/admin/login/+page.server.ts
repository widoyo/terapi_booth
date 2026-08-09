import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { createAdminSession, getUserByUsername, verifyPassword } from '$lib/server/db/queries';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString().trim().toLowerCase();
    const password = data.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { message: 'Username dan password wajib diisi.' });
    }

    // 1. Ambil data user dari database
    const user = await getUserByUsername(db, username);
    if (!user) {
      return fail(401, { message: 'Username atau password salah.' });
    }

    // 2. Verifikasi hash password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return fail(401, { message: 'Username atau password salah.' });
    }

    // 3. Buat sesi di SQLite DB
    const token = await createAdminSession(db, user.username);

    // 4. Simpan token di HTTP-Only Cookie
    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 1 hari
    });

    throw redirect(303, '/admin');
  }
};