'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type CoordinatorState = 'loading' | 'signed-out' | 'coordinator' | 'not-authorized';

export default function CoordinatorPage() {
  const [state, setState] = useState<CoordinatorState>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const client = createClient();
    const refreshUser = async () => {
      const { data: { user } } = await client.auth.getUser();
      setState(user?.app_metadata.role === 'coordinator' ? 'coordinator' : user ? 'not-authorized' : 'signed-out');
    };

    const initialLoadTimer = window.setTimeout(() => {
      void refreshUser();
    }, 0);
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      window.setTimeout(() => void refreshUser(), 0);
    });

    return () => {
      window.clearTimeout(initialLoadTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice(null);

    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    if (error) {
      setNotice('Unable to sign in with those credentials.');
      return;
    }
    setPassword('');
    setNotice('Signed in. Your coordinator access is being verified.');
  };

  const signOut = async () => {
    setIsSubmitting(true);
    await createClient().auth.signOut();
    setIsSubmitting(false);
    setNotice('You have been signed out.');
  };

  const isSignedIn = state === 'coordinator' || state === 'not-authorized';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Link href="/" className="mb-7 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-700 dark:hover:text-teal-300">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to ShifaAI
        </Link>

        <div className="mb-6 flex items-start gap-3">
          <span className="rounded-xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">Coordinator access</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">For authorised emergency-care coordinators only.</p>
          </div>
        </div>

        {state === 'loading' ? (
          <p className="rounded-xl bg-slate-100 px-3 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">Checking your secure session…</p>
        ) : isSignedIn ? (
          <div className={`rounded-xl border p-4 text-sm ${state === 'coordinator' ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200' : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200'}`}>
            <div className="flex items-center gap-2 font-bold">
              <UserRound className="h-4 w-4" />
              {state === 'coordinator' ? 'Signed in as coordinator' : 'Signed in, but coordinator permission is required'}
            </div>
            <p className="mt-2 text-xs leading-relaxed">{state === 'coordinator' ? 'You can now return to care availability and create referral holds when appropriate.' : 'Ask the project administrator to assign protected coordinator access to this account.'}</p>
            <div className="mt-4 flex gap-2">
              {state === 'coordinator' && <Link href="/#bed-grid" className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900">Open care availability</Link>}
              <button type="button" onClick={() => void signOut()} disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-lg border border-current px-3 py-2 text-xs font-bold disabled:opacity-60"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
            </div>
          </div>
        ) : (
          <form onSubmit={signIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Coordinator email</label>
              <input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Password</label>
              <input id="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
            <button type="submit" disabled={isSubmitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"><LogIn className="h-4 w-4" />{isSubmitting ? 'Signing in…' : 'Sign in securely'}</button>
            <p className="text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">Patient and family features do not require an account. Coordinator accounts are issued privately; there is no public sign-up.</p>
          </form>
        )}

        {notice && <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">{notice}</p>}
      </section>
    </main>
  );
}
