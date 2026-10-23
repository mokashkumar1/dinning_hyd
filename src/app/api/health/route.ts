import { geminiHealth, startGeminiValidation } from '@/lib/gemini';

export async function GET() {
  const pingOk = await startGeminiValidation();
  return Response.json({ ok: pingOk, gemini: geminiHealth(), ping: pingOk ? 'ok' : 'unavailable' }, { status: pingOk ? 200 : 503 });
}
