import { redirect } from 'next/navigation';
import StaffPortal from './staff-portal';
import { getStaffSession } from '@/lib/staff/auth';

export default async function StaffPage() {
  const { user, role } = await getStaffSession();
  if (!user || !role) return <StaffPortal />;
  redirect(`/staff/${role}`);
}
