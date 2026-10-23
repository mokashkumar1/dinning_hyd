import { hyderabadHospitals } from '@/lib/data/hospitals';
import { createClient } from '@/lib/supabase/server';
import type { HospitalBedData } from '@/types';

type HospitalRow = {
  id: string; name_en: string; name_ur: string; name_sd: string; area: string; category: HospitalBedData['category'];
  distance_km: number; eta_mins: number; emergency_phone: string; latitude: number; longitude: number;
  total_beds: number; available_beds: number; total_icu: number; available_icu: number; total_vents: number;
  available_vents: number; oxygen_beds: number; trauma_level: 1 | 2 | 3; specialties: string[]; reported_ago_mins: number;
  match_score: number; score_clinical_fit: number; score_travel_proximity: number; score_bed_capacity_ratio: number;
  score_specialty_match: number; score_total: number; recommendation_reason_en: string; recommendation_reason_ur: string;
  recommendation_reason_sd: string;
};

function toHospital(row: HospitalRow): HospitalBedData {
  return {
    id: row.id, nameEn: row.name_en, nameUr: row.name_ur, nameSd: row.name_sd, area: row.area, category: row.category,
    distanceKm: Number(row.distance_km), etaMins: row.eta_mins, emergencyPhone: row.emergency_phone,
    coordinates: { lat: Number(row.latitude), lng: Number(row.longitude) }, totalBeds: row.total_beds,
    availableBeds: row.available_beds, totalIcu: row.total_icu, availableIcu: row.available_icu,
    totalVents: row.total_vents, availableVents: row.available_vents, oxygenBeds: row.oxygen_beds,
    traumaLevel: row.trauma_level, specialties: row.specialties, reportedAgoMins: row.reported_ago_mins,
    matchScore: row.match_score,
    scoreBreakdown: {
      clinicalFit: row.score_clinical_fit, travelProximity: row.score_travel_proximity,
      bedCapacityRatio: row.score_bed_capacity_ratio, specialtyMatch: row.score_specialty_match, total: row.score_total,
    },
    recommendationReasonEn: row.recommendation_reason_en, recommendationReasonUr: row.recommendation_reason_ur,
    recommendationReasonSd: row.recommendation_reason_sd,
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('hospitals').select('*').order('updated_at', { ascending: false });
    if (error || !data?.length) throw error ?? new Error('No hospitals are available.');
    return Response.json({ hospitals: (data as HospitalRow[]).map(toHospital), source: 'supabase' });
  } catch {
    // Development remains usable before the migration and seed data are deployed.
    return Response.json({ hospitals: hyderabadHospitals, source: 'local-fallback' });
  }
}
