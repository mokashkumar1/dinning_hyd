import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { isDemoMode } from '@/lib/staff/auth';

export async function GET() {
  await headers();
  if (!isDemoMode()) return NextResponse.json({ accounts: [] }, { status: 404 });
  return NextResponse.json({ accounts: [
    { role: 'Admin', email: 'admin.demo@shifaai.app', password: 'Demo@1234', description: 'Manage staff access, review requests, and see all care activity.' },
    { role: 'Coordinator', email: 'coordinator.demo@shifaai.app', password: 'Demo@1234', description: 'Coordinate emergency cases, dispatch care, and assign staff.' },
    { role: 'Staff', email: 'staff.demo@shifaai.app', password: 'Demo@1234', description: 'View assigned cases and update their care status.' },
  ] }, { headers: { 'Cache-Control': 'no-store' } });
}
