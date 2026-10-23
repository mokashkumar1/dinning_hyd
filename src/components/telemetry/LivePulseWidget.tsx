'use client';

import React from 'react';
import { Ambulance, Clock, Wind, Building2 } from 'lucide-react';
import { Language } from '@/types';
import { translations } from '@/lib/i18n/translations';

interface LivePulseWidgetProps {
  lang: Language;
}

export const LivePulseWidget: React.FC<LivePulseWidgetProps> = ({ lang }) => {
  const t = translations[lang];

  // Live telemetry figures for Hyderabad region
  const reportingHospitals = 6;
  const regionalIcuLoad = 74; // %
  const activeAmbulances = 9;
  const avgResponseTimeMins = 14;
  const availableVentilators = 25;

  return (
    <section className="w-full my-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm p-4 sm:p-6 card-hover">
        
        {/* Header row with pulsing live indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 relative" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t.telemetryTitle}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Live Feed Active
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected to LUMHS, Liaquat Jamshoro, St. Elizabeth, Rajputana & Red Crescent
              </p>
            </div>
          </div>

          {/* Capacity Progress Bar (from Website C) */}
          <div className="sm:w-64 flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Regional ICU Load:</span>
              <span className="font-bold num text-amber-600 dark:text-amber-400">{regionalIcuLoad}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-700"
                style={{ width: `${regionalIcuLoad}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 text-right">Moderate Rush Flow · Beds Reserved</span>
          </div>
        </div>

        {/* 4-Item Telemetry Grid with tabular numerals (.num) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          
          <div className="pt-2 sm:pt-0 sm:px-3 first:pl-0 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t.totalHospitals}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold num text-slate-900 dark:text-white">{reportingHospitals}</span>
              <span className="text-xs text-slate-500">Centers</span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">100% Telemetry Online</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Wind className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{t.ventilatorsAvailable}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold num text-slate-900 dark:text-white">{availableVentilators}</span>
              <span className="text-xs text-slate-500">Units Ready</span>
            </div>
            <span className="text-[11px] text-teal-600 dark:text-teal-400 mt-0.5">Across 6 Facilities</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Ambulance className="w-3.5 h-3.5 text-rose-500" />
              <span>{t.ambulancesActive}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold num text-slate-900 dark:text-white">{activeAmbulances}</span>
              <span className="text-xs text-slate-500">Fleet Dispatched</span>
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">Rescue 1122 + Edhi</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3 flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.avgResponseLatency}</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold num text-slate-900 dark:text-white">~{avgResponseTimeMins}</span>
              <span className="text-xs text-slate-500">Mins</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Within Hyderabad City</span>
          </div>

        </div>

      </div>
    </section>
  );
};
