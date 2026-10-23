import { HospitalBedData } from '@/types';
import { hyderabadHospitals } from '@/lib/data/hospitals';

export interface TriageWeights {
  urgencyWeight: number;      // 0 - 100 (Default 40)
  proximityWeight: number;    // 0 - 100 (Default 30)
  capacityWeight: number;     // 0 - 100 (Default 20)
  specialtyWeight: number;    // 0 - 100 (Default 10)
}

export const defaultTriageWeights: TriageWeights = {
  urgencyWeight: 40,
  proximityWeight: 30,
  capacityWeight: 20,
  specialtyWeight: 10,
};

export function filterAndRankHospitals(
  query: string,
  requiredFilter: 'all' | 'icu' | 'vent' | 'cardiac' | 'trauma',
  weights: TriageWeights = defaultTriageWeights,
  hospitals: HospitalBedData[] = hyderabadHospitals
): HospitalBedData[] {
  const normalizedQuery = query.toLowerCase().trim();

  // Detect condition intent
  const isCardiac = normalizedQuery.includes('heart') || normalizedQuery.includes('chest') || normalizedQuery.includes('cardiac') || normalizedQuery.includes('attack') || normalizedQuery.includes('دل') || normalizedQuery.includes('سینہ');
  const isTrauma = normalizedQuery.includes('accident') || normalizedQuery.includes('trauma') || normalizedQuery.includes('fracture') || normalizedQuery.includes('blood') || normalizedQuery.includes('حادثہ') || normalizedQuery.includes('زخم');
  const isPediatric = normalizedQuery.includes('child') || normalizedQuery.includes('baby') || normalizedQuery.includes('infant') || normalizedQuery.includes('pediatric') || normalizedQuery.includes('بچہ') || normalizedQuery.includes('نومولود');
  const isRespiratory = normalizedQuery.includes('breath') || normalizedQuery.includes('oxygen') || normalizedQuery.includes('asthma') || normalizedQuery.includes('ventilator') || normalizedQuery.includes('سانس');

  return hospitals
    .filter((hosp) => {
      if (requiredFilter === 'icu' && hosp.availableIcu <= 0) return false;
      if (requiredFilter === 'vent' && hosp.availableVents <= 0) return false;
      if (requiredFilter === 'cardiac' && !hosp.specialties.some(s => s.toLowerCase().includes('cardiac') || s.toLowerCase().includes('cath'))) return false;
      if (requiredFilter === 'trauma' && hosp.traumaLevel !== 1) return false;
      return true;
    })
    .map((hosp) => {
      // Proximity score (Max 30)
      const maxDistance = 20; // 20km
      const proxRatio = Math.max(0, 1 - hosp.distanceKm / maxDistance);
      const proximityScore = Math.round(proxRatio * (weights.proximityWeight / 100) * 100);

      // Capacity ratio score (Max 20)
      const icuRatio = hosp.totalIcu > 0 ? hosp.availableIcu / hosp.totalIcu : 0;
      const ventRatio = hosp.totalVents > 0 ? hosp.availableVents / hosp.totalVents : 0;
      const capacityScore = Math.round(((icuRatio * 0.6) + (ventRatio * 0.4)) * (weights.capacityWeight / 100) * 100);

      // Clinical fit score (Max 40)
      let clinicalFitScore = 20;
      if (isCardiac && hosp.specialties.some(s => s.toLowerCase().includes('cardiac'))) {
        clinicalFitScore += 20;
      } else if (isTrauma && hosp.traumaLevel === 1) {
        clinicalFitScore += 20;
      } else if (isPediatric && hosp.specialties.some(s => s.toLowerCase().includes('pediatric') || s.toLowerCase().includes('nicu'))) {
        clinicalFitScore += 20;
      } else if (isRespiratory && hosp.availableVents >= 4) {
        clinicalFitScore += 18;
      } else {
        clinicalFitScore += Math.min(18, hosp.availableIcu * 2);
      }
      clinicalFitScore = Math.round((clinicalFitScore / 40) * (weights.urgencyWeight / 100) * 100);

      // Specialty score (Max 10)
      const specialtyScore = Math.round((hosp.specialties.length / 5) * (weights.specialtyWeight / 100) * 100);

      const totalScore = Math.min(100, Math.max(40, clinicalFitScore + proximityScore + capacityScore + specialtyScore));

      return {
        ...hosp,
        matchScore: totalScore,
        scoreBreakdown: {
          clinicalFit: clinicalFitScore,
          travelProximity: proximityScore,
          bedCapacityRatio: capacityScore,
          specialtyMatch: specialtyScore,
          total: totalScore,
        },
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
