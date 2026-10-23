'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Eye, EyeOff, Copy, Check, UserRound, ClipboardList, Truck } from 'lucide-react';
import { useStaffLanguage } from './layout';
import { translations } from '@/lib/i18n/translations';

type DemoAccount = { role: string; email: string; password: string; description: string };

const DEFAULT_DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'Admin', email: 'admin.demo@shifaai.app', password: 'Demo@1234', description: 'Manage staff access, review requests, and see all care activity.' },
  { role: 'Coordinator', email: 'coordinator.demo@shifaai.app', password: 'Demo@1234', description: 'Coordinate emergency cases, dispatch care, and assign staff.' },
  { role: 'Staff', email: 'staff.demo@shifaai.app', password: 'Demo@1234', description: 'View assigned cases and update their care status.' },
];

export default function StaffPortal() {
  const router = useRouter();
  const t = translations[useStaffLanguage()];
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', requestedRole: 'staff' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [copied, setCopied] = useState('');
  const [accounts, setAccounts] = useState<DemoAccount[]>(DEFAULT_DEMO_ACCOUNTS);
  useEffect(() => { 
    void fetch('/api/staff/demo')
      .then(async (response) => response.ok ? response.json() : { accounts: DEFAULT_DEMO_ACCOUNTS })
      .then((data) => {
        if (data.accounts?.length) setAccounts(data.accounts);
      })
      .catch(() => {
        setAccounts(DEFAULT_DEMO_ACCOUNTS);
      });
  }, []);
  const demoMode = true;

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const signIn = async (email = form.email, password = form.password) => {
    setBusy(true); setNotice(null);
    const { data, error } = await createClient().auth.signInWithPassword({ email, password });
    if (error || !data.user) { setNotice({ text: error?.message ?? 'Sign in failed. Check your credentials.', error: true }); setBusy(false); return; }
    const role = data.user.app_metadata.role;
    if (!['admin', 'coordinator', 'staff'].includes(role)) {
      await createClient().auth.signOut(); setNotice({ text: 'Your account is pending Admin approval. Please check back after your request is reviewed.', error: true }); setBusy(false); return;
    }
    router.push(`/staff/${role}`);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (tab === 'signin') { await signIn(); return; }
    if (form.password.length < 10 || form.password !== form.confirmPassword) { setNotice({ text: 'Use at least 10 characters and make sure both passwords match.', error: true }); return; }
    setBusy(true); setNotice(null);
    try {
      const response = await fetch('/api/staff/signup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      setNotice({ text: response.ok ? result.message : result.error, error: !response.ok });
      if (response.ok && demoMode) { setTab('signin'); update('email', form.email); update('password', form.password); }
    } catch { setNotice({ text: 'Could not reach the sign-up service.', error: true }); }
    setBusy(false);
  };
  const fill = (account: (typeof accounts)[number]) => { setTab('signin'); setForm((old) => ({ ...old, email: account.email, password: account.password })); };
  const copy = async (account: (typeof accounts)[number]) => { await navigator.clipboard.writeText(`${account.email} / ${account.password}`); setCopied(account.role); window.setTimeout(() => setCopied(''), 1600); };

  return <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)] lg:items-start sm:px-6">
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
      <Link href="/" className="text-sm font-semibold text-teal-800 hover:underline dark:text-teal-300">← Back to ShifaAI</Link>
      <div className="mt-7 flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300"><ShieldCheck /></span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-teal-800 dark:text-teal-300">ShifaAI staff portal</p><h1 className="text-3xl font-black tracking-tight">{t.staffAccessTitle}</h1></div></div>
      <p className="mt-3 text-slate-600 dark:text-slate-300">{t.staffAccessSubtitle}</p>
      <div role="tablist" aria-label="Staff account access" className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button role="tab" aria-selected={tab === 'signin'} onClick={() => { setTab('signin'); setNotice(null); }} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${tab === 'signin' ? 'bg-white text-slate-950 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t.signIn}</button><button role="tab" aria-selected={tab === 'signup'} onClick={() => { setTab('signup'); setNotice(null); }} className={`rounded-lg px-4 py-2.5 text-sm font-bold ${tab === 'signup' ? 'bg-white text-slate-950 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{t.signUp}</button></div>
      <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
        {tab === 'signup' && <label className="block text-sm font-semibold">Full name<input required minLength={2} autoComplete="name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>}
        <label className="block text-sm font-semibold">Email address<input required type="email" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
        <label className="block text-sm font-semibold">Password<span className="relative mt-1.5 block"><input required minLength={tab === 'signup' ? 10 : 1} type={showPassword ? 'text' : 'password'} autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => update('password', e.target.value)} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 pe-12 dark:border-slate-700 dark:bg-slate-950" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 end-3 text-slate-500">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
        {tab === 'signup' && <><label className="block text-sm font-semibold">Confirm password<input required type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label><label className="block text-sm font-semibold">Requested role<select value={form.requestedRole} onChange={(e) => update('requestedRole', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"><option value="staff">Staff</option><option value="coordinator">Coordinator</option></select></label></>}
        {notice && <p role="status" className={`rounded-xl p-3 text-sm ${notice.error ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'}`}>{notice.text}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-teal-800 px-4 py-3.5 font-bold text-white shadow transition hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500">{busy ? 'Please wait…' : tab === 'signin' ? 'Sign in securely' : 'Create staff account'}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">Patient and family features do not require an account.</p>
    </section>
    {demoMode && <section className="rounded-3xl border border-teal-200 bg-teal-50/70 p-5 dark:border-teal-900 dark:bg-teal-950/30 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-teal-800 dark:text-teal-300">Hackathon preview</p><h2 className="mt-1 text-2xl font-black">{t.staffDemoAccess}</h2></div><span className="rounded-full bg-teal-800 px-3 py-1 text-xs font-bold text-white">Demo mode</span></div><div className="mt-5 space-y-3">{accounts.map((account) => <article key={account.role} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">{iconForRole(account.role)}</span><div className="min-w-0 flex-1"><h3 className="font-extrabold">{account.role === 'Admin' ? t.adminRole : account.role === 'Coordinator' ? t.coordinatorRole : t.staffRole}</h3><p className="text-xs text-slate-600 dark:text-slate-300">{account.description}</p></div><button onClick={() => void copy(account)} aria-label={`Copy ${account.role} credentials`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{copied === account.role ? <Check size={17} /> : <Copy size={17} />}</button></div><p className="mt-3 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs dark:bg-slate-950">{account.email} / {account.password}</p><div className="mt-3 flex gap-2"><button onClick={() => fill(account)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">Use this account</button><button onClick={() => void signIn(account.email, account.password)} disabled={busy} className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800 dark:bg-white dark:text-slate-950">{t.signIn} as {account.role}</button></div></article>)}</div></section>}
    {!demoMode && <aside className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><UserRound className="mb-3 text-teal-700" /><h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Secure staff access</h2><p className="mt-2">Staff accounts are reviewed by an Admin before access is granted.</p></aside>}
  </main>;
}
function iconForRole(role: string) { return role === 'Admin' ? <ShieldCheck size={20} /> : role === 'Coordinator' ? <ClipboardList size={20} /> : <Truck size={20} />; }
