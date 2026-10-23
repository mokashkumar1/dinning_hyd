/** Server-only Gemini gateway. Do not import this module into Client Components. */
type KeyState = 'healthy' | 'cooldown' | 'disabled' | 'unknown';
type KeyRecord = { value: string; state: KeyState; cooldownUntil?: number };

export class GeminiRequestError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

export type GeminiRequest = { body: Record<string, unknown>; models?: string[]; cacheKey?: string; cacheTtlMs?: number };
type CachedValue = { value: unknown; expiresAt: number };
type GatewayResult<T> = { data: T; model: string; cached: boolean };

const DEFAULT_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS_PER_KEY_MODEL = 3;
const CACHE_MAX_ENTRIES = 100;
const cache = new Map<string, CachedValue>();
const inFlight = new Map<string, Promise<GatewayResult<unknown>>>();
const requestWindows = new Map<string, number[]>();
let keyRecords: KeyRecord[] | undefined;
let nextKeyIndex = 0;
let activeModel: string | null = null;
let startupValidation: Promise<boolean> | undefined;

function loadKeys(): KeyRecord[] {
  if (keyRecords) return keyRecords;
  const keys = [...(process.env.GEMINI_API_KEYS ?? '').split(','), process.env.GEMINI_API_KEY ?? '']
    .map((key) => key.trim()).filter(Boolean);
  keyRecords = [...new Set(keys)].map((value) => ({ value, state: 'unknown' }));
  return keyRecords;
}

function configuredModels(): string[] {
  const models = (process.env.GEMINI_MODELS ?? '').split(',').map((model) => model.trim()).filter(Boolean);
  return models.length ? [...new Set(models)] : DEFAULT_MODELS;
}

function maskedKey(key: string) { return `…${key.slice(-4)}`; }
function nextUtcDay() { const date = new Date(); date.setUTCHours(24, 0, 0, 0); return date.getTime(); }

function classifyFailure(status: number | undefined, body: string): 'retry' | 'cooldown' | 'daily-quota' | 'disable' | 'other' {
  const text = body.toLowerCase();
  // A bad request can be caused by a model or payload mismatch. Only disable a
  // key when Gemini explicitly identifies the credential as invalid.
  if (status === 401 || status === 403 || (status === 400 && /api key.*(invalid|not valid)|invalid api key|key.*not valid/.test(text))) return 'disable';
  if (status === 429 && /(daily|per day|quota)/.test(text)) return 'daily-quota';
  if (status === 429 || status === 503 || /resource_exhausted|unavailable|timeout|timed out/.test(text)) return 'cooldown';
  if (!status || status >= 500) return 'retry';
  return 'other';
}

function healthyKeys(): KeyRecord[] {
  const now = Date.now();
  return loadKeys().filter((record) => {
    if (record.state === 'disabled') return false;
    if (record.cooldownUntil && record.cooldownUntil > now) return false;
    if (record.cooldownUntil) { record.cooldownUntil = undefined; record.state = 'unknown'; }
    return true;
  });
}

function roundRobinKeys(): KeyRecord[] {
  const records = healthyKeys();
  if (!records.length) return [];
  const start = nextKeyIndex % records.length;
  nextKeyIndex = (start + 1) % records.length;
  return [...records.slice(start), ...records.slice(0, start)];
}

function setCache(key: string, value: unknown, ttl: number) {
  if (cache.size >= CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value as string);
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

function delay(attempt: number) { return new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt + Math.floor(Math.random() * 250))); }

async function callGemini(model: string, key: KeyRecord, body: Record<string, unknown>): Promise<unknown> {
  let lastError: GeminiRequestError | undefined;
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_KEY_MODEL; attempt += 1) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key.value },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), body: JSON.stringify(body),
      });
      if (response.ok) { key.state = 'healthy'; return response.json(); }
      const responseText = await response.text();
      const failure = classifyFailure(response.status, responseText);
      if (failure === 'disable') {
        key.state = 'disabled';
        console.warn(`[Gemini] disabled invalid key ${maskedKey(key.value)} (HTTP ${response.status}).`);
        throw new GeminiRequestError('Gemini key is invalid.', response.status);
      }
      if (failure === 'cooldown' || failure === 'daily-quota') {
        key.state = 'cooldown';
        key.cooldownUntil = failure === 'daily-quota' ? nextUtcDay() : Date.now() + 60_000;
        throw new GeminiRequestError('Gemini capacity is temporarily unavailable.', response.status);
      }
      lastError = new GeminiRequestError('Gemini request failed.', response.status);
    } catch (error) {
      if (error instanceof GeminiRequestError && [400, 401, 403, 429, 503].includes(error.status ?? 0)) throw error;
      lastError = error instanceof GeminiRequestError ? error : new GeminiRequestError('Gemini request timed out.');
    }
    if (attempt < MAX_ATTEMPTS_PER_KEY_MODEL - 1) await delay(attempt);
  }
  throw lastError ?? new GeminiRequestError('Gemini request failed.');
}

async function executeRequest<T>(request: GeminiRequest): Promise<GatewayResult<T>> {
  const keys = roundRobinKeys();
  if (!keys.length) throw new GeminiRequestError('No healthy Gemini API keys are available.');
  let lastError: GeminiRequestError | undefined;
  for (const model of (request.models?.length ? request.models : configuredModels())) {
    for (const key of keys) {
      try {
        const data = await callGemini(model, key, request.body) as T;
        activeModel = model;
        return { data, model, cached: false };
      } catch (error) {
        lastError = error instanceof GeminiRequestError ? error : new GeminiRequestError('Gemini request failed.');
      }
    }
  }
  throw lastError ?? new GeminiRequestError('All Gemini models are unavailable.');
}

export async function generateGemini<T>(request: GeminiRequest): Promise<GatewayResult<T>> {
  const cacheKey = request.cacheKey;
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return { data: cached.value as T, model: activeModel ?? configuredModels()[0], cached: true };
    if (cached) cache.delete(cacheKey);
    const existing = inFlight.get(cacheKey);
    if (existing) return existing as Promise<GatewayResult<T>>;
  }
  const operation = executeRequest<T>(request).then((result) => {
    if (cacheKey) setCache(cacheKey, result.data, request.cacheTtlMs ?? 5 * 60_000);
    return result;
  }).finally(() => { if (cacheKey) inFlight.delete(cacheKey); });
  if (cacheKey) inFlight.set(cacheKey, operation as Promise<GatewayResult<unknown>>);
  return operation;
}

export function detectUrdu(text: string) { return /[\u0600-\u06FF]/.test(text); }
export function geminiHealth() { const records = loadKeys(); return { keysLoaded: records.length, healthyKeys: healthyKeys().length, activeModel: activeModel ?? configuredModels()[0] }; }

export async function validateGeminiKeys(): Promise<boolean> {
  let hasHealthyKey = false;
  await Promise.all(loadKeys().map(async (record, index) => {
    try {
      await callGemini(configuredModels()[0], record, { contents: [{ role: 'user', parts: [{ text: 'Ping' }] }], generationConfig: { maxOutputTokens: 1 } });
      hasHealthyKey = true;
      console.info(`[Gemini] Key ${index + 1}: OK (${maskedKey(record.value)})`);
    } catch (error) {
      const status = error instanceof GeminiRequestError ? error.status : undefined;
      const label = [400, 401, 403].includes(status ?? 0) ? 'INVALID' : status === 429 ? 'QUOTA' : 'UNAVAILABLE';
      console.warn(`[Gemini] Key ${index + 1}: ${label} (${maskedKey(record.value)})`);
    }
  }));
  return hasHealthyKey;
}

export function startGeminiValidation() { if (!startupValidation) startupValidation = validateGeminiKeys(); return startupValidation; }

export function allowApiRequest(request: Request, route: string, limit = 12, windowMs = 60_000): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const key = `${route}:${ip}`; const now = Date.now();
  const hits = (requestWindows.get(key) ?? []).filter((time) => time > now - windowMs);
  if (hits.length >= limit) return false;
  hits.push(now); requestWindows.set(key, hits); return true;
}
