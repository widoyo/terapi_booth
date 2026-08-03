// src/hooks.server.ts
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { validateAdminSession } from '$lib/server/db/queries';

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Hanya periksa jika akses menuju rute /admin
  if (path.startsWith('/admin')) {
    const sessionToken = event.cookies.get('admin_session');
    let isAuthorized = false;

    if (sessionToken) {
      const session = await validateAdminSession(db, sessionToken);
      if (session) {
        event.locals.adminUser = session.username;
        isAuthorized = true;
      }
    }

    // Jika mencoba akses /admin/login tapi SUDAH login -> lempar ke /admin
    if (path === '/admin/login' && isAuthorized) {
      throw redirect(303, '/admin');
    }

    // Jika mencoba akses /admin/* (selain /admin/login) tapi BELUM login -> lempar ke /admin/login
    if (path !== '/admin/login' && !isAuthorized) {
      throw redirect(303, '/admin/login');
    }
  }

  return resolve(event);
};