'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Application error:', error); }, [error]);
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-slate-50 p-6 font-sans text-slate-900">
        <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-teal-700">ShifaAI is still here</p>
          <h1 className="mt-2 text-xl font-bold">Something needs another try.</h1>
          <p className="mt-2 text-sm text-slate-600">Your information has not been lost. Please retry, or refresh the page if this continues.</p>
          <button type="button" onClick={reset} className="mt-5 min-h-11 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800">Try again</button>
        </main>
      </body>
    </html>
  );
}
