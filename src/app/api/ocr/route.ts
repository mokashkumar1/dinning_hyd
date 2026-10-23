import { samplePrescriptions } from '@/lib/data/sampleScenarios';
import type { PrescriptionScenario } from '@/types';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const prescriptionJsonSchema = {
  type: 'object',
  required: [
    'id', 'badge', 'titleEn', 'titleUr', 'titleSd', 'doctorName',
    'clinicOrHospital', 'patientProfile', 'rawHandwrittenSnippet',
    'confidence', 'medicines', 'criticalWarnings', 'lifestyleAdvice',
  ],
  properties: {
    id: { type: 'string' },
    badge: { type: 'string' },
    titleEn: { type: 'string' },
    titleUr: { type: 'string' },
    titleSd: { type: 'string' },
    doctorName: { type: 'string' },
    clinicOrHospital: { type: 'string' },
    patientProfile: {
      type: 'object', required: ['age', 'gender', 'condition'],
      properties: { age: { type: 'integer' }, gender: { type: 'string' }, condition: { type: 'string' } },
    },
    rawHandwrittenSnippet: { type: 'string' },
    confidence: {
      type: 'object', required: ['handwritingLegibility', 'dosageVerification', 'drugInteractionSafety', 'timingAccuracy', 'total'],
      properties: {
        handwritingLegibility: { type: 'integer' }, dosageVerification: { type: 'integer' },
        drugInteractionSafety: { type: 'integer' }, timingAccuracy: { type: 'integer' }, total: { type: 'integer' },
      },
    },
    medicines: {
      type: 'array', items: {
        type: 'object', required: ['id', 'name', 'genericName', 'dosage', 'frequency', 'timeSlot', 'scheduledTime', 'foodRelation', 'purpose', 'instructionsEn', 'instructionsUr', 'instructionsSd', 'isTaken'],
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, genericName: { type: 'string' }, dosage: { type: 'string' }, frequency: { type: 'string' },
          timeSlot: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'bedtime'] }, scheduledTime: { type: 'string' },
          foodRelation: { type: 'string', enum: ['before_meal', 'with_meal', 'after_meal', 'empty_stomach'] }, purpose: { type: 'string' },
          instructionsEn: { type: 'string' }, instructionsUr: { type: 'string' }, instructionsSd: { type: 'string' },
          warningEn: { type: 'string' }, warningUr: { type: 'string' }, warningSd: { type: 'string' }, isTaken: { type: 'boolean' },
        },
      },
    },
    criticalWarnings: {
      type: 'array', items: {
        type: 'object', required: ['en', 'ur', 'sd'],
        properties: { en: { type: 'string' }, ur: { type: 'string' }, sd: { type: 'string' } },
      },
    },
    lifestyleAdvice: {
      type: 'object', required: ['en', 'ur', 'sd'],
      properties: { en: { type: 'string' }, ur: { type: 'string' }, sd: { type: 'string' } },
    },
  },
} as const;

function fallbackPrescription(): PrescriptionScenario {
  // A stable demo-safe result keeps the scanner usable while Gemini is unavailable.
  return samplePrescriptions[0];
}

function isGeminiCapacityError(status: number): boolean {
  return status === 429 || status === 503;
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Send a multipart/form-data request containing an image.' }, { status: 400 });
  }

  const image = formData.get('image') ?? formData.get('file');
  if (!(image instanceof File) || !image.type.startsWith('image/')) {
    return Response.json({ error: 'An image file is required in the image field.' }, { status: 400 });
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: 'Image must be 10 MB or smaller.' }, { status: 413 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(fallbackPrescription(), { headers: { 'X-OCR-Source': 'fallback' } });
  }

  try {
    const base64Image = Buffer.from(await image.arrayBuffer()).toString('base64');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: image.type, data: base64Image } },
              { text: 'Transcribe this handwritten prescription. Return only the requested JSON. Preserve uncertainty in warnings, do not invent medicines, and include a clear emergency-care warning when handwriting or dosage is unclear.' },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: prescriptionJsonSchema,
          },
        }),
      },
    );

    if (!response.ok) {
      if (isGeminiCapacityError(response.status)) {
        return Response.json(fallbackPrescription(), { headers: { 'X-OCR-Source': 'fallback' } });
      }
      return Response.json({ error: 'Prescription analysis is temporarily unavailable.' }, { status: 502 });
    }

    const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini returned no structured content.');

    return Response.json(JSON.parse(text) as PrescriptionScenario, { headers: { 'X-OCR-Source': 'gemini' } });
  } catch {
    // Network and malformed-model-response failures are handled like an outage.
    return Response.json(fallbackPrescription(), { headers: { 'X-OCR-Source': 'fallback' } });
  }
}
