import type { Language } from '@/types';

const MAX_SCRIPT_LENGTH = 6_000;
const SUPPORTED_LANGUAGES = new Set<Language>(['en', 'ur', 'sd']);

type SpeechRequest = {
  text?: unknown;
  lang?: unknown;
};

type GeminiSpeechResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          data?: string;
          mimeType?: string;
        };
      }>;
    };
  }>;
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Spoken audio is temporarily unavailable.' }, { status: 503 });
  }

  let body: SpeechRequest;
  try {
    body = await request.json() as SpeechRequest;
  } catch {
    return Response.json({ error: 'Send a valid speech request.' }, { status: 400 });
  }

  if (
    typeof body.text !== 'string' ||
    !body.text.trim() ||
    body.text.length > MAX_SCRIPT_LENGTH ||
    typeof body.lang !== 'string' ||
    !SUPPORTED_LANGUAGES.has(body.lang as Language)
  ) {
    return Response.json({ error: 'The spoken transcript is invalid.' }, { status: 400 });
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{
              text: body.text,
              speech_metadata: {
                style: 'Speak clearly, slowly, and reassuringly for a patient following medicine instructions.',
              },
            }],
          }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { voice: 'Kore' },
            },
          },
        }),
      },
    );

    if (!response.ok) {
      console.error('Gemini speech generation failed:', response.status);
      return Response.json({ error: 'Spoken audio is temporarily unavailable. Please try again.' }, { status: 502 });
    }

    const payload = await response.json() as GeminiSpeechResponse;
    const audio = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!audio?.data) throw new Error('Gemini returned no audio data.');

    return new Response(Buffer.from(audio.data, 'base64'), {
      headers: {
        'Content-Type': audio.mimeType ?? 'audio/wav',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Gemini speech generation failed:', error);
    return Response.json({ error: 'Spoken audio is temporarily unavailable. Please try again.' }, { status: 502 });
  }
}
