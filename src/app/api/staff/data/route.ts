import { NextResponse } from 'next/server';
import { getAdminClient, getStaffSession, isDemoMode } from '@/lib/staff/auth';

const demoCases = [
  { id: 'demo-case-1', reference: 'SHIFA-8F2A1C', patient_name: 'Patient A · 62', condition: 'Acute chest pain · suspected STEMI', priority: 'Critical', status: 'dispatched', facility: 'Civil Hospital Hyderabad' },
  { id: 'demo-case-2', reference: 'SHIFA-49B0E3', patient_name: 'Patient B · 28', condition: 'Road traffic injury · leg trauma', priority: 'Urgent', status: 'in_care', facility: 'Liaquat University Hospital' },
  { id: 'demo-case-3', reference: 'SHIFA-72C9D0', patient_name: 'Patient C · 45', condition: 'Breathing difficulty · oxygen support', priority: 'Urgent', status: 'new', facility: 'Civil Hospital Hyderabad' },
];

export async function GET() {
  const { user, role } = await getStaffSession();
  if (!user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  if (!role) return NextResponse.json({ error: 'Your account is pending Admin approval.' }, { status: 403 });
  try {
    const admin = getAdminClient();
    const [cases, users] = await Promise.all([
      admin.from('emergency_cases').select('*').order('created_at', { ascending: false }),
      role === 'admin' || role === 'coordinator' ? admin.auth.admin.listUsers({ perPage: 200 }) : Promise.resolve(null),
    ]);
    if (cases.error) throw cases.error;
    const visibleCases = role === 'staff' ? (cases.data ?? []).filter((item) => item.assigned_to === user.id) : cases.data ?? [];
    return NextResponse.json({ cases: visibleCases, users: users?.data.users.map((person) => ({ id: person.id, email: person.email, name: person.user_metadata?.full_name ?? person.email, role: person.app_metadata.role ?? 'pending', requestedRole: person.user_metadata?.requested_role })) ?? [] });
  } catch {
    if (!isDemoMode()) return NextResponse.json({ error: 'Staff workspace is not configured. Apply the staff migration and set the Supabase service role key.' }, { status: 503 });
    const admin = getAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    const visibleCases = demoCases.map((item) => ({ ...item, assigned_to: role === 'staff' ? user.id : null }));
    return NextResponse.json({ cases: visibleCases, users: (data?.users ?? []).map((person) => ({ id: person.id, email: person.email, name: person.user_metadata?.full_name ?? person.email, role: person.app_metadata.role ?? 'pending', requestedRole: person.user_metadata?.requested_role })), demoFallback: true });
  }
}

export async function PATCH(request: Request) {
  const { user, role } = await getStaffSession();
  if (!user) return NextResponse.json({ error: 'Sign in is required.' }, { status: 401 });
  if (!role) return NextResponse.json({ error: 'Admin approval is required.' }, { status: 403 });
  const body = await request.json().catch(() => null);
  try {
    const admin = getAdminClient();
    if (body?.action === 'user-role' && role === 'admin' && typeof body.userId === 'string' && ['admin', 'coordinator', 'staff', 'pending'].includes(body.role)) {
      const { error } = await admin.auth.admin.updateUserById(body.userId, { app_metadata: { role: body.role } });
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body?.action === 'case-status' && ['admin', 'coordinator', 'staff'].includes(role) && typeof body.caseId === 'string' && ['new', 'dispatched', 'in_care', 'closed'].includes(body.status)) {
      const { data: item, error: readError } = await admin.from('emergency_cases').select('assigned_to').eq('id', body.caseId).single();
      if (readError) throw readError;
      if (role === 'staff' && item.assigned_to !== user.id) return NextResponse.json({ error: 'This case is not assigned to you.' }, { status: 403 });
      const { error } = await admin.from('emergency_cases').update({ status: body.status }).eq('id', body.caseId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    if (body?.action === 'assign-case' && ['admin', 'coordinator'].includes(role) && typeof body.caseId === 'string' && typeof body.userId === 'string') {
      const { data: selected, error: userError } = await admin.auth.admin.getUserById(body.userId);
      if (userError || selected.user.app_metadata.role !== 'staff') return NextResponse.json({ error: 'Cases can only be assigned to an approved Staff account.' }, { status: 400 });
      const { error } = await admin.from('emergency_cases').update({ assigned_to: body.userId }).eq('id', body.caseId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'You are not authorized to perform this action.' }, { status: 403 });
  } catch {
    if (isDemoMode() && ((body?.action === 'case-status' && ['admin', 'coordinator', 'staff'].includes(role)) || (body?.action === 'assign-case' && ['admin', 'coordinator'].includes(role)))) {
      return NextResponse.json({ ok: true, demoFallback: true });
    }
    return NextResponse.json({ error: 'Unable to update staff workspace.' }, { status: 503 });
  }
}
