import { Facility, AvailabilityStatus, EvidenceRecord, FacilityCategory } from '../types';

export interface FreshnessCalculation {
  status: AvailabilityStatus;
  confidenceScore: number;
  freshnessLabel: string;
  hasConflict: boolean;
  conflictReason?: string;
}

// Volatility decay policies per category in hours
const DECAY_THRESHOLDS_HOURS: Record<FacilityCategory, { recent: number; moderate: number; stale: number }> = {
  toilets: { recent: 2.5, moderate: 6, stale: 10 },
  charging: { recent: 2.5, moderate: 6, stale: 10 },
  water: { recent: 4, moderate: 8, stale: 14 },
  shade: { recent: 8, moderate: 18, stale: 28 },
  break: { recent: 6, moderate: 12, stale: 20 },
  all: { recent: 3, moderate: 7, stale: 12 },
};

export function formatTimeAgo(isoTimestamp: string, now: Date = new Date()): string {
  const past = new Date(isoTimestamp).getTime();
  const current = now.getTime();
  const diffMs = current - past;
  
  if (isNaN(past) || diffMs < 0) return 'Just now';
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function evaluateFacilityReliability(
  facility: Facility,
  currentTime: Date = new Date()
): FreshnessCalculation {
  const evidenceList = facility.evidenceHistory || [];
  if (evidenceList.length === 0) {
    return {
      status: 'unknown',
      confidenceScore: 20,
      freshnessLabel: 'Availability unknown — no recent reports',
      hasConflict: false,
    };
  }

  // Sort evidence newest first
  const sorted = [...evidenceList].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const newest = sorted[0];
  const nowMs = currentTime.getTime();
  const newestMs = new Date(newest.timestamp).getTime();
  const hoursSinceNewest = Math.max(0, (nowMs - newestMs) / (1000 * 60 * 60));
  const timeAgoStr = formatTimeAgo(newest.timestamp, currentTime);

  // Check for conflicting evidence within the last 3 hours
  const recentWindowMs = 3.5 * 60 * 60 * 1000;
  const recentEvidence = sorted.filter(e => (nowMs - new Date(e.timestamp).getTime()) <= recentWindowMs);

  const recentAvailable = recentEvidence.filter(e => e.status === 'available');
  const recentUnavailable = recentEvidence.filter(
    e => e.status === 'unavailable' || e.status === 'access_denied'
  );

  // Contradiction detection: both positive and negative within 3.5 hours
  if (recentAvailable.length > 0 && recentUnavailable.length > 0) {
    const unavailReason = recentUnavailable[0].issueType?.replace('_', ' ') || 'problem';
    return {
      status: 'conflicting',
      confidenceScore: 35,
      freshnessLabel: `Conflicting reports: 1 confirmed, 1 reported ${unavailReason} (${formatTimeAgo(recentUnavailable[0].timestamp, currentTime)})`,
      hasConflict: true,
      conflictReason: `Conflicting reports within 3 hours. Needs verification.`,
    };
  }

  // If the newest report is negative (operator or community reported unavailable)
  if (newest.status === 'unavailable' || newest.status === 'access_denied') {
    const issueText = newest.issueType 
      ? newest.issueType.replace('_', ' ') 
      : 'unavailable';
    return {
      status: 'reported_unavailable',
      confidenceScore: 10,
      freshnessLabel: `Reported unavailable ${timeAgoStr} (${issueText})`,
      hasConflict: false,
    };
  }

  // Newest report is positive: evaluate decay based on category threshold
  const thresholds = DECAY_THRESHOLDS_HOURS[facility.category] || DECAY_THRESHOLDS_HOURS.all;
  const reporterText = newest.reporterRole || (newest.source === 'operator' ? 'Operator' : 'Visitor');

  if (hoursSinceNewest <= thresholds.recent) {
    // Recent direct confirmation
    const weight = newest.source === 'operator' ? 98 : (newest.source === 'community_visitor' ? 90 : 75);
    return {
      status: 'recently_confirmed',
      confidenceScore: weight,
      freshnessLabel: `Confirmed available ${timeAgoStr} by ${reporterText}`,
      hasConflict: false,
    };
  } else if (hoursSinceNewest <= thresholds.moderate) {
    // Moderate age
    return {
      status: 'reported_available',
      confidenceScore: 65,
      freshnessLabel: `Reported available ${timeAgoStr} by ${reporterText}`,
      hasConflict: false,
    };
  } else {
    // Stale
    return {
      status: 'stale',
      confidenceScore: 30,
      freshnessLabel: `Status may be outdated (last confirmed ${timeAgoStr})`,
      hasConflict: false,
    };
  }
}

/**
 * Calculates straight line / walking distance in meters between two lat/lng coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Estimate realistic walking minutes at average urban walking speed (~4.5 km/h = 75 m/min)
 */
export function estimateWalkingMinutes(distanceMeters: number): number {
  return Math.max(1, Math.round(distanceMeters / 75));
}
