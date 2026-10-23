import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const STAFF_ROLES = ['admin', 'coordinator', 'staff'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: unknown): role is StaffRole {
  return typeof role === 'string' && STAFF_ROLES.includes(role as StaffRole);
}

export async function getStaffSession() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, role: null, supabase };
  const role = isStaffRole(user.app_metadata.role) ? user.app_metadata.role : null;
  return { user, role, supabase };
}

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Staff administration requires Supabase URL and service role key.');
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function isDemoMode() {
  return process.env.DEMO_MODE !== 'false' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
}
