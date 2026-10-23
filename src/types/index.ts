export type Language = 'en' | 'ur' | 'sd';
export type UserRole = 'patient' | 'coordinator';

export interface ScoreBreakdown {
  handwritingLegibility: number;  // 0 - 100
  dosageVerification: number;     // 0 - 100
  drugInteractionSafety: number;  // 0 - 100
  timingAccuracy: number;         // 0 - 100
  total: number;
}

export type DoseTimeSlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  timeSlot: DoseTimeSlot;
  scheduledTime: string; // e.g. "08:00 AM"
  foodRelation: 'before_meal' | 'with_meal' | 'after_meal' | 'empty_stomach';
  purpose: string;
  instructionsEn: string;
  instructionsUr: string;
  instructionsSd: string;
  warningEn?: string;
  warningUr?: string;
  warningSd?: string;
  isTaken: boolean;
}

export interface PrescriptionScenario {
  id: string;
  badge: string;
  titleEn: string;
  titleUr: string;
  titleSd: string;
  doctorName: string;
  clinicOrHospital: string;
  patientProfile: {
    age: number;
    gender: string;
    condition: string;
  };
  rawHandwrittenSnippet: string;
  confidence: ScoreBreakdown;
  medicines: MedicineItem[];
  criticalWarnings: {
    en: string;
    ur: string;
    sd: string;
  }[];
  lifestyleAdvice: {
    en: string;
    ur: string;
    sd: string;
  };
}

export interface HospitalScoreBreakdown {
  clinicalFit: number;      // 0 - 40
  travelProximity: number;  // 0 - 30
  bedCapacityRatio: number; // 0 - 20
  specialtyMatch: number;   // 0 - 10
  total: number;            // 0 - 100
}

export interface HospitalBedData {
  id: string;
  nameEn: string;
  nameUr: string;
  nameSd: string;
  area: string;
  category: 'Govt Tertiary' | 'Academic Teaching' | 'Private/Charitable' | 'Specialized Center';
  distanceKm: number;
  etaMins: number;
  emergencyPhone: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  totalBeds: number;
  availableBeds: number;
  totalIcu: number;
  availableIcu: number;
  totalVents: number;
  availableVents: number;
  oxygenBeds: number;
  traumaLevel: 1 | 2 | 3;
  specialties: string[];
  reportedAgoMins: number;
  matchScore: number;
  scoreBreakdown: HospitalScoreBreakdown;
  recommendationReasonEn: string;
  recommendationReasonUr: string;
  recommendationReasonSd: string;
}

export interface ReferralHoldPass {
  id: string;
  passCode: string;
  patientName: string;
  condition: string;
  hospital: HospitalBedData;
  expiresInSeconds: number;
  totalHoldSeconds: number;
  createdAt: string;
  priorityTriage: 'RED_CRITICAL' | 'YELLOW_URGENT' | 'GREEN_STANDARD';
}

export interface RegionalPulseTelemetry {
  totalReportingHospitals: number;
  overallIcuLoadPercentage: number;
  activeAmbulancesInTransit: number;
  avgRegionalResponseLatencyMins: number;
  totalAvailableVentilators: number;
  peakHourStatus: 'STABLE' | 'ELEVATED' | 'CRITICAL_SURGE';
}
