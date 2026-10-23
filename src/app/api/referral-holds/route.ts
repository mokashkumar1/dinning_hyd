import { createClient } from '@/lib/supabase/server';

type HoldRequest = {
  hospitalId?: string;
  patientName?: string;
  condition?: string;
  priorityTriage?: 'RED_CRITICAL' | 'YELLOW_URGENT' | 'GREEN_STANDARD';
};

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null) as HoldRequest | null;
  if (!payload?.hospitalId || !payload.patientName?.trim() || !payload.condition?.trim()) {
    return Response.json({ error: 'Hospital, patient reference, and condition are required.' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Coordinator sign-in is required.' }, { status: 401 });
  if (!['admin', 'coordinator'].includes(user.app_metadata.role)) {
    return Response.json({ error: 'An Admin or Coordinator account is required to create a referral hold.' }, { status: 403 });
  }

  const totalHoldSeconds = 45 * 60;
  const expiresAt = new Date(Date.now() + totalHoldSeconds * 1000).toISOString();
  const passCode = `SHIFA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data, error } = await supabase.from('referral_holds').insert({
    pass_code: passCode,
    patient_name: payload.patientName.trim(),
    condition: payload.condition.trim(),
    hospital_id: payload.hospitalId,
    expires_at: expiresAt,
    total_hold_seconds: totalHoldSeconds,
    priority_triage: payload.priorityTriage ?? 'YELLOW_URGENT',
    created_by: user.id,
  }).select('id, pass_code, expires_at, total_hold_seconds').single();

  if (error) return Response.json({ error: 'Unable to create the referral hold.' }, { status: 500 });
  return Response.json({ hold: data }, { status: 201 });
}
