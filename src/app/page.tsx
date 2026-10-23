'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Compass, ArrowRight } from 'lucide-react';
import { Language } from '@/types';
import { translations } from '@/lib/i18n/translations';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LivePulseWidget } from '@/components/telemetry/LivePulseWidget';
import { PrescriptionScanner } from '@/components/rx/PrescriptionScanner';
import { BedGridSection } from '@/components/bedgrid/BedGridSection';

export default function Home() {
  const [lang, setLang] = useState<Language>('en');
  const [isDark, setIsDark] = useState<boolean>(false);

  const t = translations[lang];
  const isRtl = lang === 'ur' || lang === 'sd';

  // Synchronize document direction and theme class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [lang, isDark, isRtl]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`min-h-screen flex flex-col ${isRtl ? 'font-arabic' : ''}`}>
      <Header
        lang={lang}
        onLanguageChange={setLang}
        isDark={isDark}
        onThemeToggle={toggleTheme}
      />

      {/* Hero Section */}
      <section className="shifa-hero relative w-full overflow-hidden border-b border-slate-200/80 py-12 dark:border-slate-800 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column (7 Cols): Headline & Value Prop */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-100 text-teal-900 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{t.heroBadge}</span>
              </div>

              <h1 className="hero-title text-slate-900 dark:text-white">
                {t.heroTitle}
              </h1>

              {/* Subtitle */}
              <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {t.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <a
                  href="#rx-scanner"
                  className="btn-tactical text-sm px-6 py-3 shadow-lg hover:shadow-xl gap-2 font-bold"
                >
                  <FileText className="w-4 h-4" />
                  <span>{t.scanPrescriptionCTA}</span>
                  <ArrowRight className="w-4 h-4 icon-flip" />
                </a>

                <a
                  href="#bed-grid"
                  className="min-h-[44px] px-5 py-3 rounded-lg text-sm font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-xs"
                >
                  <Compass className="w-4 h-4 text-rose-500" />
                  <span>{t.findBedCTA}</span>
                </a>
              </div>

            </div>

            {/* Right Column (5 Cols): Live Interactive Telemetry Card (Hero Graphic) */}
            <div className="lg:col-span-5">
              <div className="command-card relative rounded-2xl border border-slate-200 p-6 dark:border-slate-800 card-hover">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Care availability snapshot
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 num">
                    Recently verified
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">ICU-capable beds</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 num">8 available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Ventilator-ready units</span>
                    <span className="text-xl font-black text-teal-600 dark:text-teal-400 num">5 available</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Estimated travel time</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 num">~9 minutes</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  Compare care options by urgency, distance, and available capacity.
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6">
        {/* Module A: Intelligent Prescription Scanner (نسخہ اسکینر) */}
        <PrescriptionScanner lang={lang} />

        <LivePulseWidget lang={lang} />

        <BedGridSection lang={lang} />

      </main>

      <Footer lang={lang} />

    </div>
  );
}
