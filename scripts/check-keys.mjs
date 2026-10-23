const keys = [...new Set([...(process.env.GEMINI_API_KEYS ?? '').split(','), process.env.GEMINI_API_KEY ?? ''].map((key) => key.trim()).filter(Boolean))];
const model = (process.env.GEMINI_MODELS ?? 'gemini-2.5-flash').split(',')[0].trim();
if (!keys.length) { console.error('No GEMINI_API_KEYS or GEMINI_API_KEY value was found.'); process.exit(1); }
const results = await Promise.all(keys.map(async (key, index) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Ping' }] }], generationConfig: { maxOutputTokens: 1 } }),
    });
    return { key: `Key ${index + 1} (…${key.slice(-4)})`, status: response.ok ? 'OK' : `HTTP ${response.status}` };
  } catch { return { key: `Key ${index + 1} (…${key.slice(-4)})`, status: 'TIMEOUT/NETWORK' }; }
}));
console.table(results);
if (results.every((result) => result.status !== 'OK')) process.exitCode = 1;
