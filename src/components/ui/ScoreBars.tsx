'use client';

import React from 'react';

interface Segment {
  label: string;
  value: number; // e.g. 0 - 100 or relative value
  max?: number;
  colorClass: string;
}

interface ScoreBarsProps {
  title?: string;
  totalScore: number;
  segments: Segment[];
  showLabels?: boolean;
}

export const ScoreBars: React.FC<ScoreBarsProps> = ({
  title,
  totalScore,
  segments,
  showLabels = true,
}) => {
  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        {title && <span className="font-semibold text-slate-700 dark:text-slate-300">{title}</span>}
        <span className="font-bold num text-teal-700 dark:text-teal-400">
          {totalScore}% <span className="text-slate-400 font-normal">Score</span>
        </span>
      </div>

      {/* Multi-segment proportional stacked progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800 flex gap-0.5 p-0.5">
        {segments.map((seg, idx) => {
          return (
            <div
              key={idx}
              title={`${seg.label}: ${seg.value}%`}
              className={`h-full rounded-full transition-all duration-500 ${seg.colorClass}`}
              style={{ width: `${100 / segments.length}%` }}
            />
          );
        })}
      </div>

      {/* Breakdown chips */}
      {showLabels && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          {segments.map((seg, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-2 py-1 rounded bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-[11px]"
            >
              <span className="text-slate-600 dark:text-slate-400 truncate mr-1">{seg.label}</span>
              <span className="font-bold num text-slate-800 dark:text-slate-200">{seg.value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
