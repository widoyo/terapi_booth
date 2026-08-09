import { getAllTenants } from '$lib/server/db/queries';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const tenantList = await getAllTenants();
  return { tenants: tenantList };
};