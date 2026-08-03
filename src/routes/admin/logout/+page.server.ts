// src/routes/admin/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { deleteAdminSession } from '$lib/server/db/queries';

export const actions: Actions = {
  default: async ({ cookies }) => {
    const token = cookies.get('admin_session');
    if (token) {
      await deleteAdminSession(db, token);
    }

    cookies.delete('admin_session', { path: '/' });
    throw redirect(303, '/admin/login');
  }
};