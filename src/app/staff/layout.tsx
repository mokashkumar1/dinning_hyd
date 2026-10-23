'use client';

import { createContext, Suspense, useContext, useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { Language } from '@/types';

const StaffLanguageContext = createContext<Language>('en');
export const useStaffLanguage = () => useContext(StaffLanguageContext);

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const [isDark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.classList.toggle('dark', isDark);
  }, [lang, isDark]);
  return <StaffLanguageContext.Provider value={lang}><div className={`flex min-h-screen flex-col ${lang === 'en' ? '' : 'font-arabic'}`}><Header lang={lang} onLanguageChange={setLang} isDark={isDark} onThemeToggle={() => setDark((value) => !value)} /><Suspense fallback={<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10"><div className="h-96 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-900" /></main>}>{children}</Suspense><Footer lang={lang} /></div></StaffLanguageContext.Provider>;
}
