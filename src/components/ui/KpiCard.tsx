'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  trend?: 'up' | 'down' | 'neutral';
  tone?: 'normal' | 'ok' | 'warn' | 'bad' | 'tactical';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  icon: Icon,
  badge,
  tone = 'normal',
}) => {
  const toneClasses = {
    normal: 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900',
    ok: 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100',
    warn: 'border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100',
    bad: 'border-rose-300 dark:border-rose-800/60 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100',
    tactical: 'border-lime-300 dark:border-lime-800/60 bg-lime-50/40 dark:bg-lime-950/20',
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-all card-hover ${toneClasses[tone]}`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="uppercase tracking-wider text-[10px] font-bold">{label}</span>
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight num text-slate-900 dark:text-slate-50">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
