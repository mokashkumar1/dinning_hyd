import { notFound } from 'next/navigation';
import { getStaffSession, type StaffRole } from '@/lib/staff/auth';
import Dashboard from '../dashboard';

export default async function RoleDashboard({ params }: { params: Promise<{ role: string }> }) {
  const { role: requested } = await params;
  const { user, role } = await getStaffSession();
  if (!user || !role) return <Dashboard role={null} name="" />;
  if (!['admin', 'coordinator', 'staff'].includes(requested)) notFound();
  if (requested !== role) return <Dashboard role={null} name={user.user_metadata?.full_name ?? user.email ?? ''} forbidden />;
  return <Dashboard role={role as StaffRole} name={user.user_metadata?.full_name ?? user.email ?? ''} />;
}
