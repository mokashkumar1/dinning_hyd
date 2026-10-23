'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sun,
  Moon,
  FileText,
  Compass,
  Menu,
  X,
  PhoneCall,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { Language } from '@/types';
import { translations } from '@/lib/i18n/translations';
import { createClient } from '@/lib/supabase/client';

interface HeaderProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLanguageChange,
  isDark,
  onThemeToggle,
}) => {
  const t = translations[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCoordinator, setIsCoordinator] = useState(false);

  useEffect(() => {
    const client = createClient();
    const refreshRole = async () => {
      const { data: { user } } = await client.auth.getUser();
      setIsCoordinator(user?.app_metadata.role === 'coordinator');
    };
    const initialLoadTimer = window.setTimeout(() => void refreshRole(), 0);
    const { data: { subscription } } = client.auth.onAuthStateChange(() => {
      window.setTimeout(() => void refreshRole(), 0);
    });

    return () => {
      window.clearTimeout(initialLoadTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await createClient().auth.signOut();
    setMobileMenuOpen(false);
  };

  return (
    <header className="shifa-header sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto flex h-[4.5rem] items-center justify-between gap-3 px-4 sm:px-6">

        {/* Brand Logo & Title */}
        <div className="flex min-w-0 items-center gap-3">
          <a href="#" className="group flex min-w-0 items-center gap-3" aria-label="ShifaAI home">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-sm border border-slate-200/90 transition-transform duration-200 group-hover:scale-105 dark:border-slate-700/80 dark:bg-white flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="ShifaAI Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div className="flex min-w-0 flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  ShifaAI
                </span>
                <span className="rounded-md bg-teal-100 px-1.5 py-1 text-[10px] font-bold leading-none text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  شفا
                </span>
              </div>
              <span className="mt-1 hidden text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:inline">
                Prescription & care guidance
              </span>
            </div>
          </a>

          {/* Quick anchor nav (Desktop) */}
          <nav className="ml-2 hidden items-center gap-1 border-l border-slate-200 pl-3 text-xs font-semibold dark:border-slate-800 xl:flex">
            <a
              href="#rx-scanner"
              className="shifa-nav-link flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              {t.navPrescription}
            </a>
            <a
              href="#bed-grid"
              className="shifa-nav-link flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-rose-500" />
              {t.navBedGrid}
            </a>
          </nav>
        </div>

        {/* Right Action Cluster */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

          {/* Emergency 1122 Direct Hotline */}
          <a
            href="tel:1122"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            aria-label="Call Emergency 1122"
          >
            <PhoneCall className="w-3.5 h-3.5 animate-pulse text-white" />
            <span className="hidden sm:inline">Emergency</span>
            <span className="num font-black">1122</span>
          </a>

          {isCoordinator ? (
            <button onClick={() => void signOut()} className="hidden min-h-[38px] items-center gap-1.5 rounded-lg border border-teal-300 px-3 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-950/40 md:inline-flex" aria-label="Sign out coordinator">
              <ShieldCheck className="h-3.5 w-3.5" /> Coordinator <LogOut className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link href="/coordinator" className="hidden min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 md:inline-flex">
              <LogIn className="h-3.5 w-3.5" /> Coordinator
            </Link>
          )}

          {/* Trilingual Selector */}
          <div className="relative hidden items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold dark:border-slate-800 dark:bg-slate-900 lg:flex">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-2 py-1 rounded transition-colors ${
                lang === 'en'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => onLanguageChange('ur')}
              className={`px-2 py-1 rounded transition-colors ${
                lang === 'ur'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              اردو
            </button>
            <button
              onClick={() => onLanguageChange('sd')}
              className={`px-2 py-1 rounded transition-colors ${
                lang === 'sd'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              سنڌي
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onThemeToggle}
            aria-label="Toggle Theme"
            aria-pressed={isDark}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 xl:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="flex flex-col gap-2 border-b border-slate-200 bg-white px-4 pt-2 pb-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950 xl:hidden">
          <a
            href="tel:1122"
            className="flex items-center justify-center gap-2 rounded-lg bg-rose-600 text-white py-2 px-3 text-xs font-bold shadow-sm"
          >
            <PhoneCall className="w-4 h-4 animate-pulse" />
            <span>Direct Call Emergency 1122</span>
          </a>
          {isCoordinator ? (
            <button onClick={() => void signOut()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/30">
              <LogOut className="h-4 w-4" /> Sign out coordinator
            </button>
          ) : (
            <Link href="/coordinator" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
              <LogIn className="h-4 w-4 text-teal-600" /> Coordinator sign-in
            </Link>
          )}
          <a
            href="#rx-scanner"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-teal-600" />
            {t.navPrescription}
          </a>
          <a
            href="#bed-grid"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
          >
            <Compass className="w-4 h-4 text-rose-500" />
            {t.navBedGrid}
          </a>
          <div className="flex items-center gap-2 border-t border-slate-200 pt-3 text-xs dark:border-slate-800">
            <span className="text-slate-500">Language</span>
            {(['en', 'ur', 'sd'] as const).map((option) => (
              <button
                key={option}
                onClick={() => onLanguageChange(option)}
                className={`rounded-md px-2 py-1.5 ${lang === option ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {option === 'en' ? 'EN' : option === 'ur' ? 'اردو' : 'سنڌي'}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
