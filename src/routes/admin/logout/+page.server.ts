// src/routes/admin/logout/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getDb } from '$lib/server/db';
import { deleteAdminSession } from '$lib/server/db/queries';

export const actions: Actions = {
  default: async ({ cookies, platform }) => {
    const token = cookies.get('admin_session');
    if (token && platform?.env?.DB) {
      const db = getDb(platform.env.DB);
      await deleteAdminSession(db, token);
    }

    cookies.delete('admin_session', { path: '/' });
    throw redirect(303, '/admin/login');
  }
};