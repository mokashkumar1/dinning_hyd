import { NextResponse } from 'next/server';
import { getAdminClient, isDemoMode } from '@/lib/staff/auth';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';
  const requestedRole = body?.requestedRole;
  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || password !== confirmPassword || !['staff', 'coordinator'].includes(requestedRole)) {
    return NextResponse.json({ error: 'Enter a valid name and email, a password of at least 10 characters, matching confirmation, and a requested role.' }, { status: 400 });
  }
  try {
    const admin = getAdminClient();
    const role = isDemoMode() ? 'staff' : 'pending';
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, requested_role: requestedRole }, app_metadata: { role } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: isDemoMode() ? 'Your Staff account is ready. Sign in to continue.' : 'Your request is pending Admin approval.', userId: data.user.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create account.' }, { status: 503 });
  }
}
