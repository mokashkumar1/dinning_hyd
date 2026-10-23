'use client';

import { AlertTriangle } from 'lucide-react';
import { Language } from '@/types';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = () => (
  <footer className="mt-16 w-full border-t border-slate-200 bg-slate-100/60 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr]">
      <div>
        <p className="font-display text-base font-extrabold text-slate-900 dark:text-white">ShifaAI · شفا</p>
        <p className="mt-2 max-w-md leading-relaxed">
          Clear prescription guidance and care availability, designed to help people make the next step easier to understand.
        </p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Important
        </p>
        <p className="mt-2 leading-relaxed">
          ShifaAI supports—not replaces—professional medical advice. Confirm prescriptions with a licensed pharmacist or clinician, and contact local emergency services for urgent care.
        </p>
      </div>
    </div>
  </footer>
);
