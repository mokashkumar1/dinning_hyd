import { geminiHealth, startGeminiValidation } from '@/lib/gemini';

export async function GET() {
  const pingOk = await startGeminiValidation();
  const gemini = geminiHealth();
  // A key can be in a short or daily cooldown while other keys remain able to
  // serve requests. Readiness reflects usable capacity, not one validation run.
  const ready = gemini.healthyKeys > 0;
  return Response.json({ ok: ready, gemini, ping: pingOk ? 'ok' : ready ? 'deferred' : 'unavailable' }, { status: ready ? 200 : 503 });
}
