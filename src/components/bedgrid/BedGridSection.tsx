'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { 
  Search, 
  MapPin, 
  PhoneCall, 
  ShieldCheck, 
  Activity, 
  Wind, 
  Heart, 
  AlertOctagon, 
  Clock, 
  Sparkles,
  List,
  Map,
  AlertTriangle,
  RefreshCw,
  SearchX,
  RotateCcw,
  WifiOff
} from 'lucide-react';
import { Language, HospitalBedData } from '@/types';
import { translations } from '@/lib/i18n/translations';
import { hyderabadHospitals } from '@/lib/data/hospitals';
import { filterAndRankHospitals, defaultTriageWeights } from '@/lib/triage/matchEngine';
import { ScoreBars } from '@/components/ui/ScoreBars';
import { BedHoldPassModal } from './BedHoldPassModal';
import { createClient } from '@/lib/supabase/client';

const HyderabadGISMap = dynamic(
  () => import('@/components/map/HyderabadGISMap').then((module) => module.HyderabadGISMap),
  {
    ssr: false,
    loading: () => <div className="h-[440px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />,
  },
);

interface BedGridSectionProps {
  lang: Language;
}

export const BedGridSection: React.FC<BedGridSectionProps> = ({ lang }) => {
  const t = translations[lang];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'icu' | 'vent' | 'cardiac' | 'trauma'>('all');
  const [selectedHospitalForHold, setSelectedHospitalForHold] = useState<HospitalBedData | null>(null);
  const [hospitals, setHospitals] = useState<HospitalBedData[]>(hyderabadHospitals);
  const [dataSource, setDataSource] = useState<'supabase' | 'local-fallback'>('local-fallback');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(true);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [dataNotice, setDataNotice] = useState<string | null>(null);

  const loadHospitals = useCallback(async () => {
    setIsLoading(true);
    setHasConnectionError(false);
    try {
      const response = await fetch('/api/hospitals');
      if (!response.ok) throw new Error('Hospital data is temporarily unavailable.');
      const payload = await response.json() as { hospitals?: HospitalBedData[]; source?: 'supabase' | 'local-fallback' };
      if (payload.hospitals?.length) {
        setHospitals(payload.hospitals);
        setDataSource(payload.source ?? 'local-fallback');
        setDataNotice(payload.source === 'local-fallback' ? t.sampleCapacityNotice : null);
      }
    } catch {
      setHasConnectionError(true);
      setDataNotice(t.lastAvailableNotice);
    } finally {
      setIsLoading(false);
    }
  }, [t.sampleCapacityNotice, t.lastAvailableNotice]);

  useEffect(() => {
    let mounted = true;
    const initialLoadTimer = window.setTimeout(() => {
      void loadHospitals();
    }, 0);

    const supabase = createClient();
    const channel = supabase.channel('hospital-capacity-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, () => {
        if (mounted) void loadHospitals();
      })
      .subscribe();

    return () => {
      mounted = false;
      window.clearTimeout(initialLoadTimer);
      void supabase.removeChannel(channel);
    };
  }, [loadHospitals]);

  // Quick triage symptom prompts
  const samplePrompts = [
    { label: 'Chest Pain / Cardiac', query: 'Severe retrosternal chest pain with diaphoresis' },
    { label: 'Highway Trauma / Fracture', query: 'Motorcycle collision with open femur fracture' },
    { label: 'Pediatric Respiratory', query: 'Child with acute asthma and stridor' },
    { label: 'Elderly ICU Distress', query: 'Septic shock requiring ventilator support' },
  ];

  // Algorithmic hospital ranking
  const rankedHospitals = useMemo(() => {
    return filterAndRankHospitals(searchQuery, activeFilter, defaultTriageWeights, hospitals);
  }, [searchQuery, activeFilter, hospitals]);

  return (
    <section id="bed-grid" className="w-full scroll-mt-20 my-10">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 mb-2">
            <Activity className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Care availability</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            {t.bedModuleTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {t.bedModuleSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">
            <strong className="text-slate-900 dark:text-white num">{hospitals.length} facilities</strong>
            {isLoading ? (
              <span className="ml-1 text-teal-600 dark:text-teal-400">· {t.checkingLiveData}</span>
            ) : dataSource === 'local-fallback' ? (
              <span className="ml-1 text-amber-700 dark:text-amber-300">· sample data</span>
            ) : null}
          </span>
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900" aria-label="Care availability view">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-bold transition-colors ${viewMode === 'list' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              aria-pressed={viewMode === 'map'}
              className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2.5 text-[11px] font-bold transition-colors ${viewMode === 'map' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Map className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Live Data Connection Error Alert with Retry Action */}
      {hasConnectionError && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{t.connectionError} {dataNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadHospitals()}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.retryConnection}</span>
          </button>
        </div>
      )}

      {/* Fallback Sample Data Informational Notice */}
      {!hasConnectionError && dataNotice && (
        <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{dataNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => void loadHospitals()}
            disabled={isLoading}
            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{t.retryConnection}</span>
          </button>
        </div>
      )}

      {/* Triage Search Bar & Natural Language Input */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-6">
        
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.triageSearchPlaceholder}
            className="w-full pl-11 pr-28 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Suggestion Symptom Chips */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400">Quick Scenarios:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSearchQuery(p.query)}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {t.allSpecialties}
          </button>

          <button
            onClick={() => setActiveFilter('icu')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'icu'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            {t.filterIcu}
          </button>

          <button
            onClick={() => setActiveFilter('vent')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'vent'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            {t.filterVent}
          </button>

          <button
            onClick={() => setActiveFilter('cardiac')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'cardiac'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            {t.filterCardiac}
          </button>

          <button
            onClick={() => setActiveFilter('trauma')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'trauma'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {t.filterTrauma}
          </button>
        </div>

      </div>

      {viewMode === 'map' ? (
        <div className="mb-6">
          <HyderabadGISMap hospitals={rankedHospitals} />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Color-coded ICU capacity pins for the same filtered facilities shown in the list.</p>
        </div>
      ) : isLoading && hospitals.length === 0 ? (
        /* Loading Skeleton State */
        <div className="space-y-4" aria-label="Loading hospital data">
          {[1, 2, 3].map((skeletonIdx) => (
            <div
              key={skeletonIdx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse"
            >
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-6 w-3/5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-4 w-2/5 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                    <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                    <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                    <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                  </div>
                </div>
                <div className="lg:w-48 space-y-2">
                  <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rankedHospitals.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-10 text-center my-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {t.noMatchingHospitals}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
            {t.noMatchingHospitalsDesc}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveFilter('all');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-teal-700 dark:hover:bg-slate-100 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clearFilters}</span>
          </button>
        </div>
      ) : (
      <div className="space-y-4">
        {rankedHospitals.map((hospital, index) => {
          const isTopRanked = index === 0;
          const isNeedsConfirmation = hospital.reportedAgoMins > 60;

          return (
            <div
              key={hospital.id}
              className={`rounded-2xl border p-5 transition-all card-hover ${
                isTopRanked
                  ? 'border-teal-500 dark:border-teal-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-teal-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                
                {/* Hospital Core Metadata */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {isTopRanked && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-600 text-white flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        #1 Best Match
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {hospital.category}
                    </span>

                    {/* Freshness Badge */}
                    {isNeedsConfirmation ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80">
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>{t.dataNeedsConfirmation}</span>
                        <span className="opacity-75 num text-[9px]">
                          ({hospital.reportedAgoMins > 60 ? `${Math.floor(hospital.reportedAgoMins / 60)}h ago` : `${hospital.reportedAgoMins}m`})
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="num">{t.updatedAgo} {hospital.reportedAgoMins} {t.minAgo}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    {lang === 'ur' ? hospital.nameUr : lang === 'sd' ? hospital.nameSd : hospital.nameEn}
                  </h3>

                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {hospital.area}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 num">
                      {hospital.distanceKm} {t.kmAway}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="num">~{hospital.etaMins} Mins</span> {t.etaDrive}
                    </span>
                  </div>

                  {/* Bed Telemetry Metric Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                        {t.freeIcu}
                      </span>
                      <span className="text-base font-extrabold num text-emerald-700 dark:text-emerald-400">
                        {hospital.availableIcu} <span className="text-[10px] font-normal text-slate-500">/ {hospital.totalIcu}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/60">
                      <span className="text-[10px] uppercase font-bold text-teal-800 dark:text-teal-300 block">
                        {t.freeVents}
                      </span>
                      <span className="text-base font-extrabold num text-teal-700 dark:text-teal-400">
                        {hospital.availableVents} <span className="text-[10px] font-normal text-slate-500">/ {hospital.totalVents}</span>
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
                        Oxygen Beds
                      </span>
                      <span className="text-base font-extrabold num text-slate-800 dark:text-slate-200">
                        {hospital.oxygenBeds}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 block">
                        {t.totalCapacity}
                      </span>
                      <span className="text-base font-extrabold num text-slate-800 dark:text-slate-200">
                        {hospital.availableBeds} <span className="text-[10px] font-normal text-slate-500">free</span>
                      </span>
                    </div>
                  </div>

                  {/* NEO Algorithmic Justification Text */}
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-teal-700 dark:text-teal-300 block mb-0.5">
                      {t.whyThisHospital}:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                      {lang === 'ur'
                        ? hospital.recommendationReasonUr
                        : lang === 'sd'
                        ? hospital.recommendationReasonSd
                        : hospital.recommendationReasonEn}
                    </p>
                  </div>

                  {/* Transparent ScoreBars Component */}
                  <div className="mt-3">
                    <ScoreBars
                      totalScore={hospital.matchScore}
                      segments={[
                        { label: 'Clinical Fit', value: hospital.scoreBreakdown.clinicalFit, colorClass: 'bg-teal-500' },
                        { label: 'Proximity', value: hospital.scoreBreakdown.travelProximity, colorClass: 'bg-emerald-500' },
                        { label: 'Capacity', value: hospital.scoreBreakdown.bedCapacityRatio, colorClass: 'bg-cyan-500' },
                        { label: 'Specialty', value: hospital.scoreBreakdown.specialtyMatch, colorClass: 'bg-amber-500' },
                      ]}
                    />
                  </div>

                </div>

                {/* Right Action Cluster */}
                <div className="lg:w-48 flex flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                  <button
                    onClick={() => setSelectedHospitalForHold(hospital)}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-teal-700 dark:hover:bg-teal-400 dark:hover:text-slate-950 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-400 dark:text-teal-700" />
                    <span>{t.holdBedBtn}</span>
                  </button>

                  <a
                    href={`tel:${hospital.emergencyPhone}`}
                    className="w-full min-h-[44px] py-2.5 px-3 rounded-xl font-bold text-xs border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 hover:bg-rose-100 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                    <span>{hospital.emergencyPhone}</span>
                  </a>
                </div>

              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Bed Hold Pass Modal */}
      {selectedHospitalForHold && (
        <BedHoldPassModal
          hospital={selectedHospitalForHold}
          lang={lang}
          onClose={() => setSelectedHospitalForHold(null)}
        />
      )}

    </section>
  );
};
