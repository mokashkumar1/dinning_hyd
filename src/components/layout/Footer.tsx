'use client';

import React from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  PhoneCall,
  ShieldCheck,
  FileText,
  Compass,
  Activity
} from 'lucide-react';
import { Language } from '@/types';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  return (
    <footer className="mt-20 w-full border-t border-slate-200 bg-slate-50/90 text-slate-600 transition-colors dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      {/* Top Banner: Emergency Life Safety Strip */}
      <div className="border-b border-rose-200/60 bg-rose-50/70 px-4 py-3 dark:border-rose-950/60 dark:bg-rose-950/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs sm:px-6">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
            <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            <span className="font-bold">
              {lang === 'ur'
                ? 'ہنگامی صورتحال میں تاخیر نہ کریں: فوری طور پر ریسکیو 1122 ڈائل کریں'
                : lang === 'sd'
                ? 'هنگامي حالت ۾ دير نه ڪريو: ترت ريسڪيو 1122 ڊائل ڪريو'
                : 'Life-critical Emergency? Do not wait: call Rescue 1122 dispatch directly.'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="tel:1122"
              className="inline-flex items-center gap-1.5 font-bold text-rose-700 hover:underline dark:text-rose-300 num"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Rescue 1122 Sindh</span>
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a
              href="tel:115"
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:underline dark:text-slate-300 num"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Edhi Ambulance 115</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">

          {/* Brand & Mission Column (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white p-1 shadow-sm border border-slate-200/90 dark:border-slate-700/80 dark:bg-white flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="ShifaAI Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    ShifaAI
                  </span>
                  <span className="rounded-md bg-teal-100 px-1.5 py-1 text-[10px] font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    شفا
                  </span>
                </div>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Prescription & Emergency Care Network
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-md">
              {lang === 'ur'
                ? 'ڈاکٹر کے ہاتھ سے لکھے گئے نسخوں کو خودکار طریقے سے اردو اور سندھی آواز میں سمجھیں اور حیدرآباد کے تمام بڑے ہسپتالوں میں آئی سی یو اور وینٹی لیٹر بیڈز کی فوری دستیابی معلوم کریں۔'
                : lang === 'sd'
                ? 'ڊاڪٽر جي هٿ سان لکيل نسخن کي سنڌي ۽ اردو آواز ۾ سمجهو ۽ حيدرآباد جي وڏن اسپتالن ۾ آءِ سي يو ۽ وينٽيليٽر بيڊز جي لائيو صورتحال ڏسو.'
                : 'Deciphering handwritten prescriptions into structured medication timelines with spoken Urdu & Sindhi audio, and coordinating verified emergency bed capacity across Hyderabad, Sindh.'}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-800 dark:border-teal-900/60 dark:bg-teal-950/60 dark:text-teal-300">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                AI-assisted guidance
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Facility status labelled
              </span>
            </div>
          </div>

          {/* Quick Links Column (2 Cols) */}
          <div className="lg:col-span-2">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a
                  href="#rx-scanner"
                  className="flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                  Prescription Scanner
                </a>
              </li>
              <li>
                <a
                  href="#bed-grid"
                  className="flex items-center gap-1.5 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5 text-rose-500" />
                  Care availability
                </a>
              </li>
              <li>
                <a
                  href="#rx-scanner"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Voice Instructions (اردو / سنڌي)
                </a>
              </li>
            </ul>
          </div>

          {/* Regional Healthcare Helplines (2 Cols) */}
          <div className="lg:col-span-2">
            <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Emergency Hotlines
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <a href="tel:1122" className="flex items-center justify-between hover:text-rose-600 dark:hover:text-rose-400">
                  <span>Rescue 1122</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 num">1122</span>
                </a>
              </li>
              <li>
                <a href="tel:115" className="flex items-center justify-between hover:text-slate-900 dark:hover:text-white">
                  <span>Edhi Ambulance</span>
                  <span className="font-mono font-bold num">115</span>
                </a>
              </li>
              <li>
                <a href="tel:0229210207" className="flex items-center justify-between hover:text-slate-900 dark:hover:text-white">
                  <span>Civil Hospital Hyd</span>
                  <span className="font-mono text-[11px] num">022-9210207</span>
                </a>
              </li>
              <li>
                <a href="tel:0223812200" className="flex items-center justify-between hover:text-slate-900 dark:hover:text-white">
                  <span>Liaquat University</span>
                  <span className="font-mono text-[11px] num">022-3812200</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Clinical & Safety Column (3 Cols) */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
              <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                Clinical Notice
              </p>
              <p className="mt-2 text-[11px] leading-relaxed">
                ShifaAI is an AI-assisted patient support tool and does not provide formal medical diagnoses. Always verify dosages with a certified doctor or registered pharmacist.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Attribution & Regional Network Strip */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row dark:border-slate-800 dark:text-slate-400">
          <p>
            © 2026–2027 <strong className="font-semibold text-slate-700 dark:text-slate-200">ShifaAI</strong>. Built for Sindh Healthcare & DITE Hackathon.
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Facility status shown per listing
            </span>
            <span>•</span>
            <span className="text-slate-400">English · اردو · سنڌي</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
