// src/routes/admin/login/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { createAdminSession } from '$lib/server/db/queries';
import { env } from '$env/dynamic/private'; // Atau dari platform.env

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const username = data.get('username')?.toString().trim();
    const password = data.get('password')?.toString();

    if (!username || !password) {
      return fail(400, { message: 'Username dan password wajib diisi.' });
    }

    // Validasi sederhana (Ganti dengan kredensial/hash asli Anda dari DB / Env)
    const validUsername = env?.ADMIN_USER || 'admin';
    const validPassword = env?.ADMIN_PASS || 'admin123';

    if (username !== validUsername || password !== validPassword) {
      return fail(401, { message: 'Username atau password salah.' });
    }

    // Buat sesi di D1 DB
    const token = await createAdminSession(db, username);

    // Simpan token di HTTP-Only Cookie
    cookies.set('admin_session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      maxAge: 60 * 60 * 24 // 1 hari
    });

    throw redirect(303, '/admin');
  }
};