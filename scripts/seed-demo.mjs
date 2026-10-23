import { createClient } from '@supabase/supabase-js';

const enabled = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
if (!enabled) {
  console.log('Demo seeding skipped (set DEMO_MODE=true to enable judge accounts).');
  process.exit(0);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.warn('Demo seeding skipped because Supabase URL or service role key is not available in this environment.');
  process.exit(0);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const password = 'Demo@1234';
const accountData = [
  { email: 'admin.demo@shifaai.app', name: 'Demo Admin', role: 'admin' },
  { email: 'coordinator.demo@shifaai.app', name: 'Demo Coordinator', role: 'coordinator' },
  { email: 'staff.demo@shifaai.app', name: 'Demo Staff', role: 'staff' },
];
const users = {};
for (const account of accountData) {
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find((user) => user.email?.toLowerCase() === account.email);
  const result = existing
    ? await supabase.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { full_name: account.name }, app_metadata: { role: account.role } })
    : await supabase.auth.admin.createUser({ email: account.email, password, email_confirm: true, user_metadata: { full_name: account.name }, app_metadata: { role: account.role } });
  if (result.error) throw result.error;
  users[account.role] = result.data.user.id;
  console.log(`Ready: ${account.role} account`);
}

const demoCases = [
  { reference: 'SHIFA-8F2A1C', patient_name: 'Patient A · 62', condition: 'Acute chest pain · suspected STEMI', priority: 'Critical', status: 'dispatched', facility: 'Civil Hospital Hyderabad', assigned_to: users.staff },
  { reference: 'SHIFA-49B0E3', patient_name: 'Patient B · 28', condition: 'Road traffic injury · leg trauma', priority: 'Urgent', status: 'in_care', facility: 'Liaquat University Hospital', assigned_to: users.staff },
  { reference: 'SHIFA-72C9D0', patient_name: 'Patient C · 45', condition: 'Breathing difficulty · oxygen support', priority: 'Urgent', status: 'new', facility: 'Civil Hospital Hyderabad', assigned_to: users.staff },
];
for (const item of demoCases) {
  const { error } = await supabase.from('emergency_cases').upsert(item, { onConflict: 'reference' });
  if (error) throw error;
}
console.log('Demo emergency cases are ready.');
