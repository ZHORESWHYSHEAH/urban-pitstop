import { 
  Facility, 
  FacilityCategory, 
  AccessCondition, 
  EvidenceRecord, 
  UserVisitHistory, 
  UserReportHistory,
  SmartConstraintResult,
  OperatorRegistrationRequest,
  FieldInspectionReport,
  UserAccount,
  AdminPlaceReport
} from '../types';
import { SEED_FACILITIES } from '../data/seedFacilities';
import { 
  evaluateFacilityReliability, 
  calculateDistanceMeters, 
  estimateWalkingMinutes 
} from './trustEngine';

const STORAGE_KEY_FACILITIES = 'urban_pitstop_facilities_v1';
const STORAGE_KEY_FAVORITES = 'urban_pitstop_favorites_v1';
const STORAGE_KEY_VISITS = 'urban_pitstop_visits_v1';
const STORAGE_KEY_REPORTS = 'urban_pitstop_reports_v1';
const STORAGE_KEY_OUTBOX = 'urban_pitstop_outbox_v1';

// Initialize localStorage with seed data if not present
function initializeStorage(): Facility[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FACILITIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading facilities from storage, resetting to seed data', e);
  }

  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(SEED_FACILITIES));
  } catch (e) {
    console.warn('Could not persist seed facilities to localStorage', e);
  }
  return SEED_FACILITIES;
}

let inMemoryFacilities: Facility[] = initializeStorage();

export function saveFacilitiesToStorage(facilities: Facility[]) {
  inMemoryFacilities = facilities;
  try {
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(facilities));
  } catch (e) {
    console.warn('Could not persist to localStorage', e);
  }
}

export interface FetchFacilitiesParams {
  userLocation: [number, number];
  category?: FacilityCategory;
  searchQuery?: string;
  smartConstraints?: SmartConstraintResult;
  sortBy?: 'reliability' | 'distance' | 'open_now';
}

export async function fetchFacilities(params: FetchFacilitiesParams): Promise<Facility[]> {
  const [userLat, userLng] = params.userLocation;
  const now = new Date();

  // Try fetching from backend API if available
  try {
    const response = await fetch(
      `/api/facilities?lat=${userLat}&lng=${userLng}&category=${params.category || 'all'}`,
      { signal: AbortSignal.timeout(1500) }
    );
    if (response.ok) {
      const serverFacilities = await response.json();
      if (Array.isArray(serverFacilities) && serverFacilities.length > 0) {
        // Update in-memory cache
        inMemoryFacilities = serverFacilities;
        saveFacilitiesToStorage(serverFacilities);
      }
    }
  } catch (err) {
    // Graceful offline fallback
    console.debug('Operating in local-first offline/client mode:', err);
  }

  // Calculate distance, walking time, and re-evaluate freshness with Trust Engine
  let list = inMemoryFacilities.map(f => {
    const dist = calculateDistanceMeters(userLat, userLng, f.latitude, f.longitude);
    const walkMins = estimateWalkingMinutes(dist);
    const reliability = evaluateFacilityReliability(f, now);

    return {
      ...f,
      distanceMeters: dist,
      walkingMinutes: walkMins,
      status: reliability.status,
      confidenceScore: reliability.confidenceScore,
      lastStatusNote: reliability.freshnessLabel,
    };
  });

  // Apply Category Filter
  if (params.category && params.category !== 'all') {
    list = list.filter(f => 
      f.category === params.category || 
      (f.secondaryCategories && f.secondaryCategories.includes(params.category!))
    );
  }

  // Apply Smart Constraints from natural language search if present
  if (params.smartConstraints) {
    const { categories, accessConditionsAllowed, maxWalkMinutes, singleStopRequired } = params.smartConstraints;
    
    // Filter by categories
    if (categories && categories.length > 0 && !categories.includes('all')) {
      if (singleStopRequired) {
        // Must satisfy all requested categories
        list = list.filter(f => {
          const allCats = [f.category, ...(f.secondaryCategories || [])];
          return categories.every(reqCat => allCats.includes(reqCat));
        });
      } else {
        // Can satisfy any of the requested categories
        list = list.filter(f => {
          const allCats = [f.category, ...(f.secondaryCategories || [])];
          return categories.some(reqCat => allCats.includes(reqCat));
        });
      }
    }

    // Filter by access conditions
    if (accessConditionsAllowed && accessConditionsAllowed.length > 0) {
      list = list.filter(f => accessConditionsAllowed.includes(f.accessCondition));
    }

    // Filter by max walking time
    if (maxWalkMinutes && maxWalkMinutes > 0) {
      list = list.filter(f => (f.walkingMinutes || 0) <= maxWalkMinutes);
    }
  }

  // Apply raw search query if provided
  if (params.searchQuery && params.searchQuery.trim().length > 0) {
    const q = params.searchQuery.toLowerCase();
    list = list.filter(f => 
      f.name.toLowerCase().includes(q) ||
      f.area.toLowerCase().includes(q) ||
      f.address.toLowerCase().includes(q) ||
      (f.accessNotes && f.accessNotes.toLowerCase().includes(q))
    );
  }

  // Ranking & Sorting: "Reliability before proximity"
  const sortBy = params.sortBy || 'reliability';
  if (sortBy === 'reliability') {
    list.sort((a, b) => {
      // 1. Reported unavailable or conflicting sink to the bottom unless explicitly searched
      const isUnavailA = a.status === 'reported_unavailable';
      const isUnavailB = b.status === 'reported_unavailable';
      if (isUnavailA && !isUnavailB) return 1;
      if (!isUnavailA && isUnavailB) return -1;

      // 2. High confidence recently confirmed places take priority within a reasonable walk (under 1.5 km)
      const walkBonusA = (a.distanceMeters || 0) < 1200 ? 20 : 0;
      const walkBonusB = (b.distanceMeters || 0) < 1200 ? 20 : 0;
      const effectiveScoreA = a.confidenceScore + walkBonusA - ((a.distanceMeters || 0) / 100);
      const effectiveScoreB = b.confidenceScore + walkBonusB - ((b.distanceMeters || 0) / 100);

      return effectiveScoreB - effectiveScoreA;
    });
  } else if (sortBy === 'distance') {
    list.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
  }

  return list;
}

export async function submitArrivalConfirmation(
  facilityId: string,
  outcome: 'available' | 'unavailable' | 'access_denied',
  role: string = 'Worker / Commuter',
  note?: string
): Promise<Facility> {
  const facilities = [...inMemoryFacilities];
  let idx = facilities.findIndex(f => f.id === facilityId);
  if (idx === -1) {
    idx = facilities.findIndex(f => f.name.toLowerCase().includes(facilityId.toLowerCase()));
  }
  if (idx === -1 && facilities.length > 0) {
    idx = 0;
  }
  if (idx === -1) throw new Error('Facility not found');

  const now = new Date();
  const newEvidence: EvidenceRecord = {
    id: 'ev-' + Date.now(),
    facilityId,
    timestamp: now.toISOString(),
    source: outcome === 'available' ? 'community_visitor' : 'community_failure',
    status: outcome,
    note: note || (outcome === 'available' ? 'Confirmed usable by visitor' : 'Reported issue at location'),
    reporterRole: role,
    confidenceWeight: 0.90,
  };

  const updatedFacility = {
    ...facilities[idx],
    evidenceHistory: [newEvidence, ...(facilities[idx].evidenceHistory || [])],
    lastConfirmedAt: now.toISOString(),
    lastConfirmedBy: role,
  };

  // Re-calculate with trust engine
  const reliability = evaluateFacilityReliability(updatedFacility, now);
  updatedFacility.status = reliability.status;
  updatedFacility.confidenceScore = reliability.confidenceScore;
  updatedFacility.lastStatusNote = reliability.freshnessLabel;

  facilities[idx] = updatedFacility;
  saveFacilitiesToStorage(facilities);

  // Record to local activity history
  recordUserVisit({
    facilityId,
    facilityName: updatedFacility.name,
    category: updatedFacility.category,
    visitedAt: now.toISOString(),
    outcome: outcome === 'available' ? 'successful' : outcome,
  });

  // Attempt background sync to server
  try {
    await fetch(`http://127.0.0.1:8000/api/facilities/${facilityId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome, role, note }),
      signal: AbortSignal.timeout(2000),
    });
  } catch (err) {
    try {
      await fetch(`/api/facilities/${facilityId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome, role, note }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      queueOfflineSubmission({
        type: 'confirmation',
        facilityId,
        payload: { outcome, role, note },
      });
    }
  }

  return updatedFacility;
}

export async function submitProblemReport(
  facilityId: string,
  issueType: 'closed' | 'no_water' | 'toilet_unavailable' | 'access_denied' | 'incorrect_location' | 'other',
  note?: string,
  role: string = 'Field Worker'
): Promise<Facility> {
  const facilities = [...inMemoryFacilities];
  let idx = facilities.findIndex(f => f.id === facilityId);
  if (idx === -1) {
    idx = facilities.findIndex(f => f.name.toLowerCase().includes(facilityId.toLowerCase()));
  }
  if (idx === -1 && facilities.length > 0) {
    idx = 0;
  }
  if (idx === -1) throw new Error('Facility not found');

  const now = new Date();
  const newEvidence: EvidenceRecord = {
    id: 'ev-prob-' + Date.now(),
    facilityId,
    timestamp: now.toISOString(),
    source: 'community_failure',
    status: 'unavailable',
    issueType,
    note: note || `Reported problem: ${issueType.replace('_', ' ')}`,
    reporterRole: role,
    confidenceWeight: 0.85,
  };

  const updatedFacility = {
    ...facilities[idx],
    evidenceHistory: [newEvidence, ...(facilities[idx].evidenceHistory || [])],
    lastConfirmedAt: now.toISOString(),
    lastConfirmedBy: role,
    flaggedForReview: true,
    flagReason: `Problem reported: ${issueType.replace('_', ' ')}`,
  };

  const reliability = evaluateFacilityReliability(updatedFacility, now);
  updatedFacility.status = reliability.status;
  updatedFacility.confidenceScore = reliability.confidenceScore;
  updatedFacility.lastStatusNote = reliability.freshnessLabel;

  facilities[idx] = updatedFacility;
  saveFacilitiesToStorage(facilities);

  // Record in user report history
  recordUserReport({
    id: 'rep-' + Date.now(),
    facilityId,
    facilityName: updatedFacility.name,
    timestamp: now.toISOString(),
    type: 'problem',
    status: 'submitted',
    summary: `Problem reported: ${issueType.replace('_', ' ')}`,
  });

  // Also cache in platform-wide admin and operator reports
  const adminRep: AdminPlaceReport = {
    id: 'rep-' + Date.now(),
    facilityId,
    facilityName: updatedFacility.name,
    reporterName: role,
    reporterRole: role.toLowerCase().includes('worker') || role.toLowerCase().includes('rider') ? 'worker' : 'guest',
    issueType,
    severity: issueType === 'no_water' || issueType === 'toilet_unavailable' ? 'high' : 'medium',
    note: note || `Reported problem: ${issueType.replace('_', ' ')}`,
    status: 'pending',
    timestamp: now.toISOString(),
    clientIp: '127.0.0.1',
    suggestedAction: 'Needs operator or municipal inspection.'
  };
  try {
    const rawAdm = localStorage.getItem('urban_pitstop_admin_reports_v1');
    const admList: AdminPlaceReport[] = rawAdm ? JSON.parse(rawAdm) : [];
    admList.unshift(adminRep);
    localStorage.setItem('urban_pitstop_admin_reports_v1', JSON.stringify(admList));
  } catch (e) {
    console.debug('Error writing admin report locally:', e);
  }

  try {
    await fetch(`http://127.0.0.1:8000/api/facilities/${facilityId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueType, note, role }),
      signal: AbortSignal.timeout(2000),
    });
  } catch (err) {
    try {
      await fetch(`/api/facilities/${facilityId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueType, note, role }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      queueOfflineSubmission({
        type: 'problem',
        facilityId,
        payload: { issueType, note, role },
      });
    }
  }

  return updatedFacility;
}

export async function addNewFacility(
  newPlace: Omit<Facility, 'id' | 'status' | 'confidenceScore' | 'lastConfirmedAt' | 'lastConfirmedBy' | 'evidenceHistory' | 'operatorClaimed'>
): Promise<Facility> {
  const now = new Date();
  const id = 'fac-user-' + Date.now();
  
  const facility: Facility = {
    ...newPlace,
    id,
    status: 'reported_available',
    confidenceScore: 70,
    lastConfirmedAt: now.toISOString(),
    lastConfirmedBy: 'Community Contributor',
    operatorClaimed: false,
    verifiedByAdmin: false,
    flaggedForReview: true,
    flagReason: 'New community suggested place — awaiting verification',
    evidenceHistory: [
      {
        id: 'ev-new-' + Date.now(),
        facilityId: id,
        timestamp: now.toISOString(),
        source: 'community_visitor',
        status: 'available',
        note: 'Initial community submission',
        reporterRole: 'Community Contributor',
        confidenceWeight: 0.70,
      }
    ]
  };

  const facilities = [facility, ...inMemoryFacilities];
  saveFacilitiesToStorage(facilities);

  recordUserReport({
    id: 'rep-add-' + Date.now(),
    facilityId: id,
    facilityName: facility.name,
    timestamp: now.toISOString(),
    type: 'new_place',
    status: 'submitted',
    summary: `Suggested new place: ${facility.name} (${facility.category})`,
  });

  try {
    await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facility),
      signal: AbortSignal.timeout(2000),
    });
  } catch (err) {
    queueOfflineSubmission({
      type: 'new_place',
      payload: facility,
    });
  }

  return facility;
}

export async function operatorToggleStatus(
  facilityId: string,
  isAvailable: boolean,
  operatorName: string,
  note?: string
): Promise<Facility> {
  const facilities = [...inMemoryFacilities];
  const idx = facilities.findIndex(f => f.id === facilityId);
  if (idx === -1) throw new Error('Facility not found');

  const now = new Date();
  const newEvidence: EvidenceRecord = {
    id: 'ev-op-' + Date.now(),
    facilityId,
    timestamp: now.toISOString(),
    source: 'operator',
    status: isAvailable ? 'available' : 'unavailable',
    note: note || (isAvailable ? 'Operator confirmed available now' : 'Operator marked temporarily unavailable'),
    reporterRole: operatorName || 'Verified Operator',
    confidenceWeight: 0.99,
  };

  const updatedFacility = {
    ...facilities[idx],
    operatorClaimed: true,
    operatorName: operatorName || facilities[idx].operatorName,
    evidenceHistory: [newEvidence, ...(facilities[idx].evidenceHistory || [])],
    lastConfirmedAt: now.toISOString(),
    lastConfirmedBy: `Operator (${operatorName || 'Manager'})`,
    status: isAvailable ? ('recently_confirmed' as const) : ('reported_unavailable' as const),
    confidenceScore: isAvailable ? 98 : 10,
    lastStatusNote: isAvailable 
      ? `Confirmed available now by operator (${operatorName})`
      : `Operator marked temporarily unavailable: ${note || 'Maintenance'}`
  };

  facilities[idx] = updatedFacility;
  saveFacilitiesToStorage(facilities);

  return updatedFacility;
}

export async function operatorUpdateFacilityDetails(
  facilityId: string,
  updates: Partial<Facility>
): Promise<Facility> {
  const facilities = [...inMemoryFacilities];
  const idx = facilities.findIndex(f => f.id === facilityId);
  if (idx === -1) throw new Error('Facility not found');

  const current = facilities[idx];
  const updatedFacility: Facility = {
    ...current,
    ...updates,
    operatingHours: updates.operatingHours
      ? { ...current.operatingHours, ...updates.operatingHours }
      : current.operatingHours,
    accessibility: updates.accessibility
      ? { ...current.accessibility, ...updates.accessibility }
      : current.accessibility,
  };

  facilities[idx] = updatedFacility;
  inMemoryFacilities = facilities;
  saveFacilitiesToStorage(facilities);

  try {
    await fetch(`http://127.0.0.1:8000/api/facilities/${facilityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFacility),
    });
  } catch (err) {
    console.debug('Failed to sync facility update to backend, updated locally:', err);
  }

  return updatedFacility;
}

export async function adminResolveReview(
  facilityId: string,
  action: 'verify' | 'mark_stale' | 'resolve_conflict' | 'dismiss_spam'
): Promise<Facility> {
  try {
    await fetch(`http://127.0.0.1:8000/api/admin/facilities/${facilityId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  } catch (err) {
    console.debug('Backend offline for admin action, applying locally:', err);
  }

  const facilities = [...inMemoryFacilities];
  const idx = facilities.findIndex(f => f.id === facilityId);
  if (idx === -1) throw new Error('Facility not found');

  const target = { ...facilities[idx] };
  target.flaggedForReview = false;
  target.flagReason = undefined;

  if (action === 'verify') {
    target.verifiedByAdmin = true;
    target.status = 'recently_confirmed';
    target.confidenceScore = 98;
    target.lastStatusNote = 'Approved & verified by Platform Administrator';
  } else if (action === 'mark_stale') {
    target.status = 'stale';
    target.confidenceScore = 25;
    target.lastStatusNote = 'Flagged as stale by Administrator pending re-inspection';
  } else if (action === 'resolve_conflict') {
    target.status = 'recently_confirmed';
    target.confidenceScore = 93;
    target.lastStatusNote = 'Conflict resolved by Platform Administrator inspection';
  } else if (action === 'dismiss_spam') {
    facilities.splice(idx, 1);
    inMemoryFacilities = facilities;
    saveFacilitiesToStorage(facilities);
    return target;
  }

  facilities[idx] = target;
  inMemoryFacilities = facilities;
  saveFacilitiesToStorage(facilities);
  return target;
}

export async function adminCreateFacility(data: Partial<Facility>): Promise<Facility> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      inMemoryFacilities.unshift(created);
      saveFacilitiesToStorage(inMemoryFacilities);
      return created;
    }
  } catch (err) {
    console.debug('Using local-first create facility:', err);
  }
  const newId = `fac-adm-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const created: Facility = {
    id: newId,
    name: data.name || 'New Facility Space',
    category: data.category || 'water',
    secondaryCategories: data.secondaryCategories || [],
    latitude: data.latitude || 12.9784,
    longitude: data.longitude || 77.6408,
    address: data.address || '',
    area: data.area || 'Indiranagar Corridor',
    accessCondition: data.accessCondition || 'public',
    accessNotes: data.accessNotes || 'Verified facility managed by platform partner.',
    fee: data.fee || 'Free',
    accessibility: data.accessibility || { wheelchairAccessible: true, coveredShade: true },
    operatingHours: data.operatingHours || { is24x7: false, openTime: '06:00', closeTime: '22:00', daysNote: 'Daily' },
    status: 'recently_confirmed',
    confidenceScore: 95,
    lastConfirmedAt: nowIso,
    lastConfirmedBy: 'Platform Admin',
    lastStatusNote: 'Added to verified directory by Platform Staff',
    evidenceHistory: [],
    operatorClaimed: data.operatorClaimed ?? false,
    operatorName: data.operatorName,
    verifiedByAdmin: true,
  };
  inMemoryFacilities.unshift(created);
  saveFacilitiesToStorage(inMemoryFacilities);
  return created;
}

export async function adminUpdateFacility(facility: Facility): Promise<Facility> {
  try {
    await fetch(`http://127.0.0.1:8000/api/facilities/${facility.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(facility),
    });
  } catch (err) {
    console.debug('Using local update:', err);
  }
  const idx = inMemoryFacilities.findIndex(f => f.id === facility.id);
  if (idx !== -1) {
    inMemoryFacilities[idx] = facility;
    saveFacilitiesToStorage(inMemoryFacilities);
  }
  return facility;
}

export async function adminDeleteFacility(facilityId: string): Promise<void> {
  try {
    await fetch(`http://127.0.0.1:8000/api/facilities/${facilityId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.debug('Using local delete:', err);
  }
  inMemoryFacilities = inMemoryFacilities.filter(f => f.id !== facilityId);
  saveFacilitiesToStorage(inMemoryFacilities);
}

const STORAGE_KEY_OPERATOR_REQUESTS = 'urban_pitstop_operator_requests_v1';

export async function submitOperatorRegistration(req: OperatorRegistrationRequest): Promise<any> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/operator/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Saving operator registration locally:', err);
  }
  const raw = localStorage.getItem(STORAGE_KEY_OPERATOR_REQUESTS);
  const requests: OperatorRegistrationRequest[] = raw ? JSON.parse(raw) : [];
  requests.unshift(req);
  localStorage.setItem(STORAGE_KEY_OPERATOR_REQUESTS, JSON.stringify(requests));
  return { message: 'Operator registration submitted locally', registration: req };
}

export async function getOperatorRequests(): Promise<OperatorRegistrationRequest[]> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/admin/operator-requests');
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Fetching operator requests locally:', err);
  }
  const raw = localStorage.getItem(STORAGE_KEY_OPERATOR_REQUESTS);
  return raw ? JSON.parse(raw) : [
    {
      id: 'op-req-101',
      operatorName: 'Ramesh Naidu',
      email: 'ramesh.cafe@greenpitstop.in',
      password: 'Partner@2026',
      phone: '+91 98450 12345',
      organization: 'Green Tree Cafe & Express Pitstop',
      facilityName: 'Green Tree Cafe — Rider Water & Rest Porch',
      category: 'water',
      address: '45, 12th Main Road, HAL 2nd Stage, Indiranagar',
      area: 'Indiranagar 12th Main',
      latitude: 12.9728,
      longitude: 77.6432,
      accessCondition: 'public',
      fee: 'Free for outdoor workers and commuters',
      operatingHours: { is24x7: false, openTime: '07:00', closeTime: '23:00', daysNote: 'Daily' },
      accessibility: { wheelchairAccessible: true, drinkingWaterType: 'RO Filtered Dispenser', hasSeating: true, hasCharging: true, coveredShade: true },
      status: 'pending',
      submittedAt: new Date(Date.now() - 3 * 3600000).toISOString()
    }
  ];
}

export async function adminApproveOperator(requestId: string): Promise<any> {
  let createdFac: any = null;
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/operator-requests/${requestId}/approve`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      createdFac = data.facility;
    }
  } catch (err) {
    console.debug('Approving locally:', err);
  }
  const requests = await getOperatorRequests();
  const target = requests.find(r => r.id === requestId);
  if (target) {
    target.status = 'approved';
    if (!createdFac) {
      createdFac = await adminCreateFacility({
        name: target.facilityName,
        category: target.category,
        address: target.address,
        area: target.area,
        latitude: target.latitude,
        longitude: target.longitude,
        fee: target.fee,
        accessCondition: target.accessCondition,
        operatorClaimed: true,
        operatorName: target.organization,
        verifiedByAdmin: true,
      });
    }
    (target as any).facilityId = createdFac.id;
    localStorage.setItem(STORAGE_KEY_OPERATOR_REQUESTS, JSON.stringify(requests));

    // Ensure the operator user account exists and has assignedFacilityIds
    try {
      const users = await getAllUsers();
      let user = users.find(u => u.email.toLowerCase() === target.email.toLowerCase());
      if (user) {
        user.status = 'active';
        user.assignedFacilityIds = [createdFac.id];
        user.organization = target.organization;
      } else {
        user = {
          id: `usr-op-${Date.now()}`,
          name: target.operatorName,
          email: target.email,
          passwords: [target.password],
          role: 'operator',
          organization: target.organization,
          phone: target.phone,
          status: 'active',
          createdAt: new Date().toISOString(),
          assignedFacilityIds: [createdFac.id],
          verifiedBadge: true,
          avatar: '⛽',
        };
        users.push(user);
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.debug('Error updating operator user in storage:', e);
    }
  }
  return { message: 'Operator approved', facility: createdFac };
}

export async function adminRejectOperator(requestId: string, reason?: string): Promise<any> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/operator-requests/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Rejecting locally:', err);
  }
  const requests = await getOperatorRequests();
  const target = requests.find(r => r.id === requestId);
  if (target) {
    target.status = 'rejected';
    target.rejectionReason = reason;
    localStorage.setItem(STORAGE_KEY_OPERATOR_REQUESTS, JSON.stringify(requests));
  }
  return { message: 'Operator rejected' };
}

const STORAGE_KEY_USERS = 'urban_pitstop_user_accounts_v1';

export async function getAllUsers(): Promise<UserAccount[]> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/admin/users');
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Fetching users locally:', err);
  }
  const raw = localStorage.getItem(STORAGE_KEY_USERS);
  if (raw) return JSON.parse(raw);
  return [
    {
      id: 'usr-admin-01',
      name: 'Ayesha Rahman',
      email: 'admin@urbanpitstop.com',
      role: 'admin',
      organization: 'Urban Pitstop Core Operations',
      status: 'active',
      createdAt: '2026-01-15T09:00:00Z',
    },
    {
      id: 'usr-operator-01',
      name: 'Suresh Patil',
      email: 'operator@urbanpitstop.com',
      role: 'operator',
      organization: 'Indian Oil & Metro Utilities',
      status: 'active',
      assignedFacilityIds: ['blr-fac-01', 'blr-fac-03', 'blr-fac-04'],
      createdAt: '2026-02-01T10:00:00Z',
    },
    {
      id: 'usr-worker-01',
      name: 'Kiran Swaminathan',
      email: 'rider@urbanpitstop.com',
      role: 'worker',
      organization: 'Swiggy Delivery Fleet',
      status: 'active',
      createdAt: '2026-02-10T14:30:00Z',
    }
  ];
}

export async function adminCreateUser(user: Partial<UserAccount>): Promise<UserAccount> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Creating user locally:', err);
  }
  const users = await getAllUsers();
  const created: UserAccount = {
    id: `usr-${user.role}-${Date.now()}`,
    name: user.name || 'New User',
    email: user.email || '',
    role: user.role || 'worker',
    organization: user.organization || 'Urban Pitstop Fleet',
    status: 'active',
    createdAt: new Date().toISOString(),
    assignedFacilityIds: user.assignedFacilityIds || [],
  };
  users.push(created);
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  return created;
}

export async function adminToggleUserStatus(userId: string, newStatus: 'active' | 'suspended'): Promise<void> {
  try {
    await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  } catch (err) {
    console.debug('Toggling user status locally:', err);
  }
  const users = await getAllUsers();
  const target = users.find(u => u.id === userId);
  if (target) {
    target.status = newStatus;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }
}

export async function submitFieldInspection(report: FieldInspectionReport): Promise<Facility> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/facilities/${report.facilityId}/inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.facility) {
        const idx = inMemoryFacilities.findIndex(f => f.id === report.facilityId);
        if (idx !== -1) {
          inMemoryFacilities[idx] = data.facility;
          saveFacilitiesToStorage(inMemoryFacilities);
        }
        return data.facility;
      }
    }
  } catch (err) {
    console.debug('Submitting field inspection locally:', err);
  }

  const facilities = [...inMemoryFacilities];
  const idx = facilities.findIndex(f => f.id === report.facilityId);
  if (idx === -1) throw new Error('Facility not found');

  const nowIso = new Date().toISOString();
  const target = { ...facilities[idx] };
  const isGood = report.hygieneRating >= 3 && (report.cleanlinessStatus === 'spotless' || report.cleanlinessStatus === 'clean');
  
  target.status = isGood ? 'recently_confirmed' : 'conflicting';
  target.confidenceScore = Math.min(99, 70 + (report.hygieneRating * 6));
  target.lastConfirmedAt = nowIso;
  target.lastConfirmedBy = `Field Inspector (${report.workerName})`;
  target.lastStatusNote = `Inspected by field worker: ${report.hygieneRating}★ cleanliness. ${report.suppliesPresent ? 'Supplies present' : 'Supplies low'}.`;

  const ev: EvidenceRecord = {
    id: `ev-insp-${Date.now()}`,
    facilityId: report.facilityId,
    timestamp: nowIso,
    source: 'community_visitor',
    status: isGood ? 'available' : 'unavailable',
    note: `Field Inspection: ${report.hygieneRating} Stars. Cleanliness: ${report.cleanlinessStatus}. ${report.notes || ''}`.trim(),
    reporterRole: `Field Inspector (${report.workerName})`,
    confidenceWeight: 0.98
  };
  target.evidenceHistory = [ev, ...(target.evidenceHistory || [])];
  facilities[idx] = target;
  inMemoryFacilities = facilities;
  saveFacilitiesToStorage(facilities);

  // Store in inspection history
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
    const list: FieldInspectionReport[] = raw ? JSON.parse(raw) : [];
    list.unshift(report);
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(list));
  } catch (e) {
    console.debug('Error caching inspection:', e);
  }

  return target;
}

const STORAGE_KEY_INSPECTIONS = 'urban_pitstop_inspections_v1';

export async function getFacilityInspections(facilityId?: string): Promise<FieldInspectionReport[]> {
  try {
    const url = facilityId 
      ? `http://127.0.0.1:8000/api/facilities/${facilityId}/inspections`
      : 'http://127.0.0.1:8000/api/inspections';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.debug('Fetching inspections from local storage fallback:', err);
  }

  const raw = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
  let list: FieldInspectionReport[] = raw ? JSON.parse(raw) : [];
  if (list.length === 0) {
    list = [
      {
        id: 'insp-01',
        facilityId: 'blr-fac-02',
        facilityName: 'Indian Oil Swastik Station — Pitstop & Washroom',
        workerId: 'usr-worker-01',
        workerName: 'Kiran Swaminathan (Swiggy Fleet)',
        hygieneRating: 5,
        waterQualityStatus: 'potable_clean',
        cleanlinessStatus: 'spotless',
        suppliesPresent: true,
        safetyRating: 'very_safe',
        notes: 'Washrooms recently sanitized, hand soap dispenser refilled, high water pressure, clean tiled floor. Free air & water point operational.',
        inspectedAt: new Date(Date.now() - 2.5 * 3600000).toISOString()
      },
      {
        id: 'insp-02',
        facilityId: 'blr-fac-01',
        facilityName: 'Indiranagar Metro Station — Water & Rest Hub',
        workerId: 'usr-worker-02',
        workerName: 'Prakash Nair (Zomato Partner)',
        hygieneRating: 5,
        waterQualityStatus: 'potable_clean',
        cleanlinessStatus: 'clean',
        suppliesPresent: true,
        safetyRating: 'very_safe',
        notes: 'RO dispenser running chilled water, clean filters, power sockets active at bench.',
        inspectedAt: new Date(Date.now() - 5.5 * 3600000).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(list));
  }

  if (facilityId) {
    return list.filter(i => i.facilityId === facilityId);
  }
  return list;
}

// Activity & Privacy Helpers
export function getUserFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleUserFavorite(facilityId: string): boolean {
  const favs = getUserFavorites();
  const exists = favs.includes(facilityId);
  const updated = exists ? favs.filter(id => id !== facilityId) : [...favs, facilityId];
  try {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return !exists;
}

export function recordUserVisit(visit: UserVisitHistory) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITS);
    const visits: UserVisitHistory[] = raw ? JSON.parse(raw) : [];
    visits.unshift(visit);
    localStorage.setItem(STORAGE_KEY_VISITS, JSON.stringify(visits.slice(0, 30)));
  } catch (e) {
    console.warn(e);
  }
}

export function getUserVisits(): UserVisitHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VISITS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordUserReport(report: UserReportHistory) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    const reports: UserReportHistory[] = raw ? JSON.parse(raw) : [];
    reports.unshift(report);
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports.slice(0, 30)));
  } catch (e) {
    console.warn(e);
  }
}

export function getUserReports(): UserReportHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const STORAGE_KEY_ADMIN_REPORTS = 'urban_pitstop_admin_reports_v1';

export async function getAdminReports(): Promise<AdminPlaceReport[]> {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/admin/reports');
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Fetching admin reports locally:', err);
  }
  const raw = localStorage.getItem(STORAGE_KEY_ADMIN_REPORTS);
  if (raw) return JSON.parse(raw);
  const baseline: AdminPlaceReport[] = [
    {
      id: 'rep-guest-001',
      facilityId: 'blr-fac-02',
      facilityName: 'BDA Complex Indiranagar — Public Washrooms',
      reporterName: 'Guest Commuter',
      reporterRole: 'guest',
      issueType: 'door_lock_broken',
      severity: 'high',
      note: "Men's second cubicle door lock is broken from outside. Tap is leaking water continuously onto the floor.",
      status: 'pending',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      clientIp: '127.0.0.1',
      suggestedAction: 'Dispatch municipal maintenance crew to replace door latch and repair washer.'
    },
    {
      id: 'rep-guest-002',
      facilityId: 'blr-fac-06',
      facilityName: '100ft Road Metro Pillar 140 — E-Toilet',
      reporterName: 'Kiran Swaminathan',
      reporterRole: 'worker',
      issueType: 'no_water',
      severity: 'high',
      note: 'Coin slot swallowed 5 rupee coin but the automated solenoid water valve did not activate. Basin dry.',
      status: 'pending',
      timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
      clientIp: '127.0.0.1',
      suggestedAction: 'Reset automated control unit and verify main BBMP inlet pressure.'
    },
    {
      id: 'rep-guest-003',
      facilityId: 'blr-fac-05',
      facilityName: 'Domlur Flyover Shaded Waiting Bay',
      reporterName: 'Delivery Rider',
      reporterRole: 'worker',
      issueType: 'other',
      severity: 'low',
      note: 'Large fallen tree branch partially blocking east resting bench after thunderstorm.',
      status: 'investigating',
      timestamp: new Date(Date.now() - 140 * 60000).toISOString(),
      clientIp: '127.0.0.1',
      suggestedAction: 'BBMP horticulture team notified for branch clearance.'
    },
    {
      id: 'rep-guest-004',
      facilityId: 'blr-fac-15',
      facilityName: 'Ather Grid Fast Charger — 100ft Road',
      reporterName: 'Guest EV Rider',
      reporterRole: 'guest',
      issueType: 'access_denied',
      severity: 'medium',
      note: 'Security guard stated universal 3-pin plug was reserved for employees only.',
      status: 'resolved',
      adminResolution: 'Spoke to partner manager. Guard briefed on public accessibility policy.',
      timestamp: new Date(Date.now() - 300 * 60000).toISOString(),
      clientIp: '127.0.0.1',
      suggestedAction: 'Resolved.'
    }
  ];
  localStorage.setItem(STORAGE_KEY_ADMIN_REPORTS, JSON.stringify(baseline));
  return baseline;
}

export async function adminReportAction(
  reportId: string,
  action: 'resolve' | 'investigate' | 'dismiss',
  notes?: string
): Promise<any> {
  try {
    const res = await fetch(`http://127.0.0.1:8000/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes }),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.debug('Applying report action locally:', err);
  }
  const reports = await getAdminReports();
  const target = reports.find(r => r.id === reportId);
  if (target) {
    target.status = action === 'resolve' ? 'resolved' : (action === 'investigate' ? 'investigating' : 'dismissed');
    if (action === 'resolve') target.adminResolution = notes || 'Resolved by administrator.';
    if (action === 'investigate') target.suggestedAction = notes || 'Investigating with on-site worker.';
    localStorage.setItem(STORAGE_KEY_ADMIN_REPORTS, JSON.stringify(reports));
  }
  return target;
}

export async function adminDeleteReport(reportId: string): Promise<void> {
  try {
    await fetch(`http://127.0.0.1:8000/api/admin/reports/${reportId}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.debug('Deleting report locally:', err);
  }
  const reports = (await getAdminReports()).filter(r => r.id !== reportId);
  localStorage.setItem(STORAGE_KEY_ADMIN_REPORTS, JSON.stringify(reports));
}

export function clearUserActivityHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY_VISITS);
    localStorage.removeItem(STORAGE_KEY_REPORTS);
    localStorage.removeItem(STORAGE_KEY_FAVORITES);
  } catch (e) {
    console.warn(e);
  }
}

// Offline queue helpers
function queueOfflineSubmission(item: { type: string; facilityId?: string; payload: any }) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OUTBOX);
    const outbox = raw ? JSON.parse(raw) : [];
    outbox.push({ ...item, timestamp: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_OUTBOX, JSON.stringify(outbox));
  } catch (e) {
    console.warn('Failed to queue offline submission', e);
  }
}

export function getOfflineQueueCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OUTBOX);
    return raw ? JSON.parse(raw).length : 0;
  } catch {
    return 0;
  }
}

export function resetDemoData() {
  localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(SEED_FACILITIES));
  inMemoryFacilities = [...SEED_FACILITIES];
}
