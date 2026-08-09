// src/hooks.server.ts
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { validateAdminSession } from '$lib/server/db/queries';
import { initMqtt } from '$lib/server/mqtt';

// Inisialisasi koneksi MQTT saat server start
initMqtt();

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  if (path.startsWith('/admin')) {
    const sessionToken = event.cookies.get('admin_session');
    let isAuthorized = false;

    if (sessionToken) {
      const session = await validateAdminSession(db, sessionToken);
      if (session) {
        // Simpan objek berisi username dan role
        event.locals.user = {
          username: session.username,
          role: session.role,
          tenantId: session.tenantId // Tambahkan tenantId ke locals
        };
        isAuthorized = true;
      }
    }

    if (path === '/admin/login' && isAuthorized) {
      throw redirect(303, '/admin');
    }

    if (path !== '/admin/login' && !isAuthorized) {
      throw redirect(303, '/admin/login');
    }
  }

  return resolve(event);
};