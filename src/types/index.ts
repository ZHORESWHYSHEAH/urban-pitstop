export type FacilityCategory = 'water' | 'toilets' | 'shade' | 'charging' | 'break' | 'all';

export type AccessCondition = 'public' | 'customers_only' | 'permission_required' | 'unknown';

export type AvailabilityStatus = 
  | 'recently_confirmed'     // Confirmed recently (< 3-6h depending on facility type)
  | 'reported_available'     // Confirmed 3-8h ago
  | 'stale'                  // Older than freshness threshold
  | 'conflicting'            // Contradictory reports in current window
  | 'reported_unavailable'   // Confirmed closed, broken, out of water, or denied entry
  | 'unknown';               // No recent reports

export type EvidenceSource = 
  | 'operator' 
  | 'community_visitor' 
  | 'community_failure' 
  | 'imported';

export type IssueType = 
  | 'closed' 
  | 'no_water' 
  | 'toilet_unavailable' 
  | 'access_denied' 
  | 'incorrect_location' 
  | 'other';

export interface EvidenceRecord {
  id: string;
  facilityId: string;
  timestamp: string; // ISO format
  source: EvidenceSource;
  status: 'available' | 'unavailable' | 'access_denied' | 'maintenance';
  issueType?: IssueType;
  note?: string;
  reporterRole?: string; // e.g. "Delivery Rider", "Field Worker", "Commuter", "Operator"
  confidenceWeight: number; // 0.0 - 1.0
  photoUrl?: string;
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean;
  drinkingWaterType?: 'RO Filtered Dispenser' | 'Cold Water Cooler' | 'Municipal Tap' | 'Bottled Refill';
  hasSeating?: boolean;
  hasCharging?: boolean;
  genderNeutralToilet?: boolean;
  coveredShade?: boolean;
  powerSocketType?: 'Standard 3-pin' | 'USB Hub' | 'High Power Fast Charge';
}

export interface OperatingHours {
  is24x7: boolean;
  openTime: string; // e.g. "06:00"
  closeTime: string; // e.g. "23:00"
  daysNote: string; // e.g. "Daily", "Mon-Sat"
}

export interface Facility {
  id: string;
  name: string;
  category: FacilityCategory;
  secondaryCategories?: FacilityCategory[];
  latitude: number;
  longitude: number;
  address: string;
  area: string;
  accessCondition: AccessCondition;
  accessNotes?: string;
  fee: string; // e.g. "Free", "Free for delivery partners", "₹5 for facility upkeep"
  accessibility: AccessibilityFeatures;
  operatingHours: OperatingHours;
  status: AvailabilityStatus;
  confidenceScore: number; // 0 - 100
  lastConfirmedAt: string; // ISO format
  lastConfirmedBy: string; // e.g. "Swiggy Delivery Partner", "Verified Operator", "Recent Visitor"
  lastStatusNote?: string;
  evidenceHistory: EvidenceRecord[];
  operatorClaimed: boolean;
  operatorName?: string;
  verifiedByAdmin?: boolean;
  distanceMeters?: number;
  walkingMinutes?: number;
  photoUrl?: string;
  flaggedForReview?: boolean;
  flagReason?: string;
}

export interface SmartConstraintResult {
  categories: FacilityCategory[];
  maxWalkMinutes?: number;
  accessConditionsAllowed: AccessCondition[];
  singleStopRequired: boolean;
  timeSensitivity: 'immediate' | 'soon' | 'planned';
  detectedIntent: string;
  explanation: string;
  clarificationPrompt?: {
    question: string;
    optionA: {
      label: string;
      patch: Partial<SmartConstraintResult>;
    };
    optionB: {
      label: string;
      patch: Partial<SmartConstraintResult>;
    };
  };
}

export interface UserVisitHistory {
  facilityId: string;
  facilityName: string;
  category: FacilityCategory;
  visitedAt: string;
  outcome: 'successful' | 'unavailable' | 'access_denied';
}

export interface UserReportHistory {
  id: string;
  facilityId: string;
  facilityName: string;
  timestamp: string;
  type: 'confirmation' | 'problem' | 'new_place';
  status: 'submitted' | 'accepted' | 'resolved' | 'queued_offline';
  summary: string;
}

export interface PilotArea {
  id: string;
  name: string;
  city: string;
  country: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  description: string;
}

export type UserRole = 'guest' | 'worker' | 'operator' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  workerType?: 'delivery_rider' | 'street_vendor' | 'field_worker' | 'driver' | 'commuter';
  assignedFacilityIds?: string[];
  verifiedBadge?: boolean;
  avatar?: string;
  token?: string;
  status?: 'active' | 'pending_approval' | 'suspended';
}

export interface OperatorRegistrationRequest {
  id: string;
  operatorName: string;
  email: string;
  password: string;
  phone: string;
  organization: string;
  facilityName: string;
  category: FacilityCategory;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  accessCondition: AccessCondition;
  fee: string;
  operatingHours: OperatingHours;
  accessibility: AccessibilityFeatures;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  rejectionReason?: string;
}

export interface FieldInspectionReport {
  id: string;
  facilityId: string;
  facilityName: string;
  workerId: string;
  workerName: string;
  hygieneRating: number; // 1 to 5 stars
  waterQualityStatus?: 'potable_clean' | 'low_pressure' | 'dry' | 'not_applicable';
  cleanlinessStatus: 'spotless' | 'clean' | 'needs_attention' | 'unsanitary';
  suppliesPresent: boolean;
  safetyRating: 'very_safe' | 'acceptable' | 'poor_lighting';
  notes?: string;
  inspectedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwords?: string[];
  role: UserRole;
  organization: string;
  phone?: string;
  status: 'active' | 'pending_approval' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  assignedFacilityIds?: string[];
  verifiedBadge?: boolean;
  notes?: string;
  avatar?: string;
}

export interface AdminPlaceReport {
  id: string;
  facilityId: string;
  facilityName: string;
  reporterName: string;
  reporterRole: 'guest' | 'worker' | 'operator' | 'admin';
  issueType: string;
  severity: 'low' | 'medium' | 'high';
  note: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  timestamp: string;
  clientIp?: string;
  suggestedAction?: string;
  adminResolution?: string;
}

