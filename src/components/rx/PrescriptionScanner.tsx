'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  FastForward, 
  Sliders, 
  QrCode, 
  Check,
  User,
  HeartPulse
} from 'lucide-react';
import { Language, PrescriptionScenario, MedicineItem } from '@/types';
import { translations } from '@/lib/i18n/translations';
import { samplePrescriptions } from '@/lib/data/sampleScenarios';
import { ScoreBars } from '@/components/ui/ScoreBars';
import { ttsService, TTSState } from '@/lib/speech/tts';

interface PrescriptionScannerProps {
  lang: Language;
}

export const PrescriptionScanner: React.FC<PrescriptionScannerProps> = ({ lang }) => {
  const t = translations[lang];
  const [selectedScenario, setSelectedScenario] = useState<PrescriptionScenario>(samplePrescriptions[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [ttsState, setTtsState] = useState<TTSState>({ isPlaying: false, activeLanguage: null, currentText: null });
  const [simulatedHourOffset, setSimulatedHourOffset] = useState<number>(0);
  const [medicines, setMedicines] = useState<MedicineItem[]>(samplePrescriptions[0].medicines);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [wakeHour, setWakeHour] = useState(7); // 7:00 AM
  const [lunchHour, setLunchHour] = useState(13); // 1:00 PM
  const [dinnerHour, setDinnerHour] = useState(20); // 8:00 PM
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to TTS state
  useEffect(() => {
    const unsub = ttsService.subscribe(setTtsState);
    return () => unsub();
  }, []);

  // Handle Scenario Selection with simulated scanner radar
  const handleSelectScenario = (scenario: PrescriptionScenario) => {
    ttsService.stop();
    setIsScanning(true);
    setTimeout(() => {
      setSelectedScenario(scenario);
      setMedicines(scenario.medicines);
      setIsScanning(false);
    }, 600);
  };

  const handleImageScan = async (file: File) => {
    setIsScanning(true);
    setScanMessage(null);
    ttsService.stop();

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/ocr', { method: 'POST', body: formData });
      const result = await response.json() as PrescriptionScenario | { error: string };
      if (!response.ok || 'error' in result) throw new Error('error' in result ? result.error : 'Unable to read this prescription.');

      const scenario = result as PrescriptionScenario;
      setSelectedScenario(scenario);
      setMedicines(scenario.medicines);
      setSimulatedHourOffset(0);
      setScanMessage(response.headers.get('X-OCR-Source') === 'fallback'
        ? 'Demo guidance is shown while AI analysis is unavailable. Please verify with a clinician.'
        : 'Prescription decoded. Please verify all medicine details with a pharmacist or clinician.');
    } catch (error) {
      setScanMessage(error instanceof Error ? error.message : 'Unable to read this prescription.');
    } finally {
      setIsScanning(false);
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  };

  // Voice playback trigger
  const handlePlayVoice = (targetLang: Language) => {
    if (ttsState.isPlaying && ttsState.activeLanguage === targetLang) {
      ttsService.stop();
      return;
    }

    // Build spoken script
    let speechText = '';
    if (targetLang === 'ur') {
      const medList = medicines
        .map((m, idx) => `دوائی نمبر ${idx + 1}: ${m.name}۔ ${m.instructionsUr}`)
        .join(' ');
      speechText = `شفا اے آئی نسخہ کی تفصیل: مریض ${selectedScenario.patientProfile.condition}۔ ${medList}۔ احتیاط: ${selectedScenario.criticalWarnings[0]?.ur || ''}`;
    } else if (targetLang === 'sd') {
      const medList = medicines
        .map((m, idx) => `دوا نمبر ${idx + 1}: ${m.name}۔ ${m.instructionsSd}`)
        .join(' ');
      speechText = `شفا اي آءِ نسخو: مريض جي بيماري ${selectedScenario.patientProfile.condition}۔ ${medList}۔ پرهيز: ${selectedScenario.criticalWarnings[0]?.sd || ''}`;
    } else {
      const medList = medicines
        .map((m, idx) => `Medication ${idx + 1}: ${m.name}. ${m.instructionsEn}`)
        .join(' ');
      speechText = `ShifaAI Prescription Guide: Patient treated for ${selectedScenario.patientProfile.condition}. ${medList}. Warning: ${selectedScenario.criticalWarnings[0]?.en || ''}`;
    }

    ttsService.speak(speechText, targetLang);
  };

  // Toggle medicine taken status
  const toggleMedicineTaken = (id: string) => {
    setMedicines(prev => prev.map(m => m.id === id ? { ...m, isTaken: !m.isTaken } : m));
  };

  // Time Machine: Skip +6 Hours
  const handleSkipTime = () => {
    const nextOffset = (simulatedHourOffset + 6) % 24;
    setSimulatedHourOffset(nextOffset);

    // Auto mark earlier items as taken for realistic demonstration
    setMedicines(prev => prev.map((m, idx) => {
      if (nextOffset >= 6 && idx === 0) return { ...m, isTaken: true };
      if (nextOffset >= 12 && idx <= 1) return { ...m, isTaken: true };
      if (nextOffset >= 18 && idx <= 2) return { ...m, isTaken: true };
      return m;
    }));
  };

  // Dynamic Routine Slider calculation for medicine schedule times
  const formatTimeSlot = (slot: string) => {
    if (slot === 'morning') return `${wakeHour.toString().padStart(2, '0')}:30 AM`;
    if (slot === 'afternoon') return `${(lunchHour > 12 ? lunchHour - 12 : lunchHour).toString().padStart(2, '0')}:30 PM`;
    if (slot === 'evening') return `${(dinnerHour - 2 > 12 ? dinnerHour - 14 : dinnerHour - 2).toString().padStart(2, '0')}:00 PM`;
    return `${(dinnerHour > 12 ? dinnerHour - 12 : dinnerHour).toString().padStart(2, '0')}:45 PM`;
  };

  const completedCount = medicines.filter(m => m.isTaken).length;
  const adherencePercentage = Math.round((completedCount / (medicines.length || 1)) * 100);

  return (
    <section id="rx-scanner" className="w-full scroll-mt-20 my-8">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Multimodal Vision OCR + Spoken Voice</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
            {t.rxModuleTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            {t.rxModuleSubtitle}
          </p>
        </div>

        {/* Tactical Time Machine Button: Only ONE key action with --tactical styling */}
        <div className="flex items-center gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImageScan(file);
            }}
          />
          <button
            type="button"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isScanning}
            className="min-h-[44px] rounded-lg border border-teal-300 bg-white px-3 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-50 disabled:cursor-wait disabled:opacity-60 dark:border-teal-800 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-teal-950"
          >
            <Upload className="mr-1.5 inline h-4 w-4" />
            {isScanning ? 'Reading…' : 'Upload prescription'}
          </button>
          <button
            onClick={handleSkipTime}
            title="Simulate the passage of 6 hours to test medication adherence and next dosage schedule"
            className="btn-tactical text-xs gap-2 shadow-md active:scale-95"
          >
            <FastForward className="w-4 h-4" />
            <span>{t.timeMachineCTA}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/15 font-mono">
              +{simulatedHourOffset}h
            </span>
          </button>
        </div>
      </div>

      {scanMessage && (
        <p className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">
          {scanMessage}
        </p>
      )}

      {/* Clinical sample presets */}
      <div className="mb-6">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          {t.selectSample}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {samplePrescriptions.map((scenario) => {
            const isSelected = selectedScenario.id === scenario.id;
            return (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                    {scenario.badge}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                    {lang === 'ur' ? scenario.titleUr : lang === 'sd' ? scenario.titleSd : scenario.titleEn}
                  </h4>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="truncate">{scenario.patientProfile.condition}</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400 num shrink-0">
                    {scenario.confidence.total}% AI
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Grid: Prescription Scanner & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Prescription Card + Raw Handwritten Snippet + Confidence ScoreBars */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Handwritten Prescription Simulation Card */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm overflow-hidden">
            
            {/* Radar scan animation beam */}
            {isScanning && <div className="scanner-radar-line" />}

            {/* Doctor & Clinic Header */}
            <div className="pb-3 border-b border-dashed border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  {selectedScenario.doctorName}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedScenario.clinicOrHospital}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                OPD Rx #8821
              </span>
            </div>

            {/* Patient Details */}
            <div className="py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Age: <strong className="num">{selectedScenario.patientProfile.age}</strong> yrs ({selectedScenario.patientProfile.gender})
                </span>
              </div>
              <span className="font-semibold text-teal-700 dark:text-teal-400">
                {selectedScenario.patientProfile.condition}
              </span>
            </div>

            {/* Messy Doctor Handwriting Visual Card (Paper effect) */}
            <div className="mt-2 p-4 rounded-xl bg-amber-50/50 dark:bg-slate-950/80 border border-amber-200/60 dark:border-slate-800 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-300 shadow-inner select-none relative">
              <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1 flex items-center justify-between">
                <span>Handwritten Medical Script (Decoded)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">OCR Verified ✓</span>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-5 italic">
                {selectedScenario.rawHandwrittenSnippet}
              </pre>
            </div>

            {/* Explainable AI Confidence Breakdown (ScoreBars) */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <ScoreBars
                title={t.scoreBreakdownTitle}
                totalScore={selectedScenario.confidence.total}
                segments={[
                  { label: t.legibilityScore, value: selectedScenario.confidence.handwritingLegibility, colorClass: 'bg-teal-500' },
                  { label: t.dosageScore, value: selectedScenario.confidence.dosageVerification, colorClass: 'bg-emerald-500' },
                  { label: t.interactionScore, value: selectedScenario.confidence.drugInteractionSafety, colorClass: 'bg-cyan-500' },
                  { label: t.timingScore, value: selectedScenario.confidence.timingAccuracy, colorClass: 'bg-amber-500' },
                ]}
              />
            </div>

            {/* Action Bar: Re-scan / QR Pass */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setQrModalOpen(true)}
                className="flex-1 min-h-[44px] px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Pharmacy QR Pass</span>
              </button>
            </div>

          </div>

          {/* Routine Adjuster Sliders: Dynamic wake-up & meal times */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Dynamic Daily Routine Sliders
              </h4>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">Auto-Reschedules</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>Wake-up / Breakfast Time:</span>
                  <span className="font-bold num">{wakeHour}:00 AM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="10"
                  value={wakeHour}
                  onChange={(e) => setWakeHour(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>Lunch / Mid-day Meal:</span>
                  <span className="font-bold num">{lunchHour > 12 ? lunchHour - 12 : lunchHour}:00 PM</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="16"
                  value={lunchHour}
                  onChange={(e) => setLunchHour(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                  <span>Dinner / Sleep Time:</span>
                  <span className="font-bold num">{dinnerHour > 12 ? dinnerHour - 12 : dinnerHour}:00 PM</span>
                </div>
                <input
                  type="range"
                  min="19"
                  max="23"
                  value={dinnerHour}
                  onChange={(e) => setDinnerHour(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols): Spoken Audio Controls + Medication Timeline */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* Spoken Audio Banner (Urdu / Sindhi / English) */}
          <div className="rounded-2xl border border-teal-200 dark:border-teal-900 bg-gradient-to-br from-teal-500/10 via-teal-500/5 to-transparent p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-teal-600 dark:text-teal-400 animate-pulse" />
                  Spoken Voice Instructions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Listen to when and how to take each medication in your mother tongue
                </p>
              </div>

              {/* Animated Waveform if playing */}
              {ttsState.isPlaying && (
                <div className="flex items-center gap-1 h-7 px-3 rounded-lg bg-teal-100 dark:bg-teal-950">
                  <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 mr-1.5 uppercase">
                    Playing
                  </span>
                  <span className="w-1 bg-teal-600 dark:bg-teal-400 rounded-full wave-bar" />
                  <span className="w-1 bg-teal-600 dark:bg-teal-400 rounded-full wave-bar" />
                  <span className="w-1 bg-teal-600 dark:bg-teal-400 rounded-full wave-bar" />
                  <span className="w-1 bg-teal-600 dark:bg-teal-400 rounded-full wave-bar" />
                  <span className="w-1 bg-teal-600 dark:bg-teal-400 rounded-full wave-bar" />
                </div>
              )}
            </div>

            {/* 3 Language Audio Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              <button
                onClick={() => handlePlayVoice('ur')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  ttsState.isPlaying && ttsState.activeLanguage === 'ur'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-95'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-500'
                }`}
              >
                <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.listenUrdu}</span>
              </button>

              <button
                onClick={() => handlePlayVoice('sd')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  ttsState.isPlaying && ttsState.activeLanguage === 'sd'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-95'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-500'
                }`}
              >
                <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.listenSindhi}</span>
              </button>

              <button
                onClick={() => handlePlayVoice('en')}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-all ${
                  ttsState.isPlaying && ttsState.activeLanguage === 'en'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-95'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-teal-500'
                }`}
              >
                <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{t.listenEnglish}</span>
              </button>
            </div>

            {ttsState.isPlaying && (
              <button
                onClick={() => ttsService.stop()}
                className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1"
              >
                <VolumeX className="w-3.5 h-3.5" />
                {t.stopAudio}
              </button>
            )}
          </div>

          {/* Adherence Progress Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {t.adherenceBadge}:
              </span>
              <span className="font-bold num text-emerald-600 dark:text-emerald-400">
                {completedCount} of {medicines.length} Doses Taken ({adherencePercentage}%)
              </span>
            </div>
            <div className="w-24 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${adherencePercentage}%` }} 
              />
            </div>
          </div>

          {/* Decoded Medication Timeline Cards */}
          <div className="space-y-3">
            {medicines.map((med) => {
              const scheduledDisplay = formatTimeSlot(med.timeSlot);
              return (
                <div
                  key={med.id}
                  className={`rounded-xl border p-4 transition-all card-hover ${
                    med.isTaken
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {med.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {med.dosage}
                        </span>
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                          ({med.genericName})
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold text-teal-700 dark:text-teal-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="num">{scheduledDisplay}</span> ({med.timeSlot})
                        </span>
                        <span>•</span>
                        <span>{med.frequency}</span>
                      </div>

                      {/* Instructions in active language */}
                      <p className="mt-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        {lang === 'ur' ? med.instructionsUr : lang === 'sd' ? med.instructionsSd : med.instructionsEn}
                      </p>

                      {/* Warnings if any */}
                      {(med.warningEn || med.warningUr) && (
                        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{lang === 'ur' ? med.warningUr : lang === 'sd' ? med.warningSd : med.warningEn}</span>
                        </div>
                      )}
                    </div>

                    {/* Mark Taken Button (Minimum 44px touch target) */}
                    <button
                      onClick={() => toggleMedicineTaken(med.id)}
                      className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                        med.isTaken
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-800'
                      }`}
                    >
                      {med.isTaken ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>{t.pillTaken}</span>
                        </>
                      ) : (
                        <span>{t.markTaken}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Critical Safety Notice & Dietary Advice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs">
              <h5 className="font-bold text-rose-800 dark:text-rose-300 mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                {t.criticalWarningsTitle}
              </h5>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {lang === 'ur'
                  ? selectedScenario.criticalWarnings[0]?.ur
                  : lang === 'sd'
                  ? selectedScenario.criticalWarnings[0]?.sd
                  : selectedScenario.criticalWarnings[0]?.en}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 text-xs">
              <h5 className="font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                {t.lifestyleAdviceTitle}
              </h5>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {lang === 'ur'
                  ? selectedScenario.lifestyleAdvice.ur
                  : lang === 'sd'
                  ? selectedScenario.lifestyleAdvice.sd
                  : selectedScenario.lifestyleAdvice.en}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* QR Code Prescription Pass Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center">
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
              Digital Prescription Pass
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Scan at any pharmacy in Hyderabad for instant medication dispensing
            </p>

            {/* Scannable Barcode / QR Simulation */}
            <div className="my-6 mx-auto w-44 h-44 rounded-xl border-2 border-dashed border-teal-500/60 p-3 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
              <QrCode className="w-32 h-32 text-slate-900 dark:text-white" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 mt-1">
                #SHIFA-RX-8821
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 mb-4 bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg">
              <p><strong>Patient:</strong> {selectedScenario.patientProfile.condition}</p>
              <p><strong>Doctor:</strong> {selectedScenario.doctorName}</p>
            </div>

            <button
              onClick={() => setQrModalOpen(false)}
              className="w-full min-h-[44px] py-2.5 rounded-xl font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

    </section>
  );
};
