import type { Language } from '@/types';
import { allowApiRequest, generateGemini, startGeminiValidation } from '@/lib/gemini';
import { createHash } from 'node:crypto';

const MAX_SCRIPT_LENGTH = 6_000;
const SUPPORTED_LANGUAGES = new Set<Language>(['en', 'ur', 'sd']);
// Gemini 3.8 is the currently reliable REST TTS option for Urdu and Sindhi.
// Main text/OCR generation remains Gemini 2.5 Flash in the central gateway.
const DEFAULT_TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-2.5-flash-preview-tts'];
type SpeechRequest = { text?: unknown; lang?: unknown };
type GeminiSpeechResponse = { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }> } }> };

function cleanSpeechText(text: string): string {
  return text.replace(/```[\s\S]*?```/g, ' ').replace(/[*_~`>#\[\]()]/g, ' ')
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
}

function ttsModels(): string[] {
  const configured = (process.env.GEMINI_TTS_MODELS ?? '').split(',').map((model) => model.trim()).filter(Boolean);
  return configured.length ? [...new Set(configured)] : DEFAULT_TTS_MODELS;
}

export async function POST(request: Request) {
  startGeminiValidation();
  if (!allowApiRequest(request, 'speech', 10)) return Response.json({ error: 'Audio is busy right now. Please use the browser voice and try again shortly.' }, { status: 429 });
  let body: SpeechRequest;
  try { body = await request.json() as SpeechRequest; } catch { return Response.json({ error: 'Send a valid speech request.' }, { status: 400 }); }
  if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > MAX_SCRIPT_LENGTH || typeof body.lang !== 'string' || !SUPPORTED_LANGUAGES.has(body.lang as Language)) {
    return Response.json({ error: 'The spoken transcript is invalid.' }, { status: 400 });
  }

  const text = cleanSpeechText(body.text);
  if (!text) return Response.json({ error: 'There is no speakable text.' }, { status: 400 });
  const languageInstruction = body.lang === 'ur'
    ? 'Speak only in natural Urdu for Pakistan (ur-PK), with clear Urdu pronunciation and a calm, reassuring pace.'
    : body.lang === 'sd' ? 'Speak naturally in Sindhi for Pakistan, clearly and slowly.' : 'Speak in clear, calm English at a reassuring pace.';
  try {
    const { data: payload } = await generateGemini<GeminiSpeechResponse>({
      models: ttsModels(),
      cacheKey: `speech:${createHash('sha256').update(`${body.lang}:${text}`).digest('hex')}`,
      cacheTtlMs: 10 * 60_000,
      body: {
        contents: [{ role: 'user', parts: [{ text, speech_metadata: { style: `${languageInstruction} Read the supplied transcript verbatim; do not add commentary.` } }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { voice: 'Kore' } } },
      },
    });
    const audio = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!audio?.data) throw new Error('Gemini returned no audio data.');
    return new Response(Buffer.from(audio.data, 'base64'), { headers: { 'Content-Type': audio.mimeType ?? 'audio/wav', 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Gemini speech generation failed:', error);
    return Response.json({ error: 'Cloud audio is temporarily unavailable. Your browser voice will be used instead.' }, { status: 503 });
  }
}
