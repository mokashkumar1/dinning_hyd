'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  PhoneCall, 
  X 
} from 'lucide-react';
import { HospitalBedData, Language } from '@/types';
import { translations } from '@/lib/i18n/translations';
import { createClient } from '@/lib/supabase/client';

interface BedHoldPassModalProps {
  hospital: HospitalBedData;
  lang: Language;
  onClose: () => void;
}

export const BedHoldPassModal: React.FC<BedHoldPassModalProps> = ({
  hospital,
  lang,
  onClose,
}) => {
  const t = translations[lang];
  const [secondsRemaining, setSecondsRemaining] = useState(45 * 60); // 45 minutes
  const [copied, setCopied] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [condition, setCondition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passCode, setPassCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    if (!passCode) return;
    navigator.clipboard.writeText(passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createHold = async () => {
    setIsSubmitting(true);
    setNotice(null);
    try {
      const response = await fetch('/api/referral-holds', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalId: hospital.id, patientName, condition, priorityTriage: 'YELLOW_URGENT' }),
      });
      const result = await response.json() as { hold?: { pass_code: string }; error?: string };
      if (!response.ok || !result.hold) throw new Error(result.error ?? 'Unable to create the referral hold.');
      setPassCode(result.hold.pass_code);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Unable to create the referral hold.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const signInCoordinator = async () => {
    setIsSubmitting(true);
    setNotice(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setIsSubmitting(false);
    setNotice(error ? error.message : 'Signed in. Create the referral hold to continue.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with verified badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              {t.passModalTitle}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Referral Hold
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          {t.passModalNotice}
        </p>

        {!passCode ? (
          <div className="my-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-950">
            <p className="font-bold text-slate-900 dark:text-white">Create a coordinator referral hold</p>
            <input value={patientName} onChange={(event) => setPatientName(event.target.value)} placeholder="Patient reference" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <input value={condition} onChange={(event) => setCondition(event.target.value)} placeholder="Urgent condition" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <button onClick={() => void createHold()} disabled={isSubmitting} className="w-full rounded-lg bg-slate-900 px-3 py-2 font-bold text-white disabled:opacity-60 dark:bg-white dark:text-slate-900">{isSubmitting ? 'Creating…' : 'Create 45-minute hold'}</button>
            <details className="border-t border-slate-200 pt-3 dark:border-slate-800">
              <summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-300">Coordinator sign-in</summary>
              <div className="mt-3 space-y-2">
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Coordinator email" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                <button onClick={() => void signInCoordinator()} disabled={isSubmitting} className="w-full rounded-lg border border-teal-300 px-3 py-2 font-bold text-teal-800 dark:border-teal-800 dark:text-teal-300">Sign in as coordinator</button>
              </div>
            </details>
            {notice && <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">{notice}</p>}
          </div>
        ) : (
          <>
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-800/60 text-center my-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
            {t.passExpiresIn}
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold num text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCountdown(secondsRemaining)}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Ward staff notified · Ambulance priority dispatch active
          </span>
        </div>

        {/* QR Code and Pass Code */}
        <div className="flex flex-col items-center justify-center my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <QrCode className="w-28 h-28 text-slate-900 dark:text-white" />
          
          <div className="mt-3 flex items-center gap-2">
            <span className="font-mono text-base font-black tracking-widest text-slate-900 dark:text-white num">
              {passCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
          {copied && <span className="text-[10px] font-bold text-emerald-600 mt-1">{t.passCopied}</span>}
        </div>
          </>
        )}

        {/* Destination Facility Summary */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t.destinationHospital}:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
              {lang === 'ur' ? hospital.nameUr : lang === 'sd' ? hospital.nameSd : hospital.nameEn}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Reserved Unit:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">1x ICU Bed + Ventilator Ready</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Direct Triage Extension:</span>
            <a href={`tel:${hospital.emergencyPhone}`} className="font-bold text-rose-600 hover:underline flex items-center gap-1">
              <PhoneCall className="w-3 h-3" />
              {hospital.emergencyPhone}
            </a>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <a
            href={`tel:${hospital.emergencyPhone}`}
            className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Receiving Ward</span>
          </a>

          <button
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50"
          >
            {t.closeModal}
          </button>
        </div>

      </div>
    </div>
  );
};
