import { samplePrescriptions } from '@/lib/data/sampleScenarios';
import type { PrescriptionScenario } from '@/types';
import { allowApiRequest, detectUrdu, generateGemini, startGeminiValidation } from '@/lib/gemini';
import { createHash } from 'node:crypto';

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

function fallbackResponse(reason: 'missing-key' | 'capacity' | 'upstream') {
  return Response.json(fallbackPrescription(), {
    headers: {
      'X-OCR-Source': 'fallback',
      'X-OCR-Fallback-Reason': reason,
    },
  });
}

function parseStructuredPrescription(text: string): PrescriptionScenario {
  try {
    return JSON.parse(text) as PrescriptionScenario;
  } catch {
    // Gemini occasionally returns literal line breaks inside a JSON string field such as
    // rawHandwrittenSnippet. Escape only those control characters, then parse again.
    let repaired = '';
    let inString = false;
    let escaped = false;

    for (const character of text) {
      if (inString && !escaped && character === '\n') {
        repaired += '\\n';
      } else if (inString && !escaped && character === '\r') {
        repaired += '\\r';
      } else if (inString && !escaped && character === '\t') {
        repaired += '\\t';
      } else {
        repaired += character;
      }

      if (character === '"' && !escaped) inString = !inString;
      escaped = character === '\\' && !escaped;
      if (character !== '\\') escaped = false;
    }

    return JSON.parse(repaired) as PrescriptionScenario;
  }
}

export async function POST(request: Request) {
  startGeminiValidation();
  if (!allowApiRequest(request, 'ocr', 8)) {
    return fallbackResponse('capacity');
  }
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

  try {
    const base64Image = Buffer.from(await image.arrayBuffer()).toString('base64');
    const requestedLanguage = formData.get('language');
    const urduMode = requestedLanguage === 'ur' || (typeof requestedLanguage === 'string' && detectUrdu(requestedLanguage));
    const prompt = `${urduMode ? 'Respond ONLY in Urdu using proper Urdu Nastaliq-compatible script (اردو), not Roman Urdu and not Hindi/Devanagari. Use natural, correct grammar. Keep numbers, brand names and code in their original form. ' : ''}Transcribe this handwritten prescription. Return only the requested JSON. Keep rawHandwrittenSnippet as one compact line with semicolons, never line breaks or quotation marks. Include no more than three clearly readable medicines. Preserve uncertainty in warnings, do not invent medicines, and include a clear emergency-care warning when handwriting or dosage is unclear.`;
    const { data: payload } = await generateGemini<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> }; finishReason?: string }>;
    }>({
      cacheKey: `ocr:${createHash('sha256').update(base64Image).update(image.type).update(String(requestedLanguage ?? '')).digest('hex')}`,
      body: {
          contents: [{
            role: 'user',
            parts: [
              { inlineData: { mimeType: image.type, data: base64Image } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: prescriptionJsonSchema,
            // Flash's default dynamic thinking budget counts against maxOutputTokens.
            // OCR is an extraction task, so reserving the full response budget for the
            // schema prevents handwritten prescriptions from being cut off mid-JSON.
            thinkingConfig: { thinkingBudget: 0 },
            maxOutputTokens: 4096,
            temperature: 0.1,
          },
      },
    });
    const candidate = payload.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const text = parts.find((part) => !part.thought && part.text)?.text;
    if (!text) throw new Error('Gemini returned no structured content.');

    try {
      return Response.json(parseStructuredPrescription(text), { headers: { 'X-OCR-Source': 'gemini' } });
    } catch (error) {
      console.error('Gemini structured output was incomplete:', {
        finishReason: candidate?.finishReason,
        parts: parts.map((part) => ({ thought: part.thought === true, textLength: part.text?.length ?? 0 })),
      });
      throw error;
    }
  } catch (error) {
    console.error('Gemini prescription analysis failed:', error);
    return fallbackResponse('upstream');
  }
}
