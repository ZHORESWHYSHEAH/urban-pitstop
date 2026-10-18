import { UserProfile, UserRole } from '../types';
import { logAuthEvent } from './auditLogger';

const STORAGE_KEY_AUTH = 'urban_pitstop_auth_user_v1';

export interface DemoAccountInfo extends UserProfile {
  passwords: string[];
  description: string;
}

export const DEMO_ACCOUNTS: Record<Exclude<UserRole, 'guest'>, DemoAccountInfo> = {
  worker: {
    id: 'usr-worker-01',
    name: 'Kiran Swaminathan',
    email: 'rider@urbanpitstop.com',
    passwords: ['Worker@2026', 'rider123'],
    role: 'worker',
    organization: 'Swiggy Delivery Fleet',
    workerType: 'delivery_rider',
    verifiedBadge: true,
    avatar: '🛵',
    token: 'token_worker_swiggy_01',
    description: 'Outdoor delivery rider with verified partner credential and arrival check-in privileges.',
  },
  operator: {
    id: 'usr-operator-01',
    name: 'Suresh Patil',
    email: 'operator@urbanpitstop.com',
    passwords: ['Operator@2026', 'operator123'],
    role: 'operator',
    organization: 'Indian Oil & Metro Utilities',
    assignedFacilityIds: ['blr-fac-01', 'blr-fac-03', 'blr-fac-04'],
    verifiedBadge: true,
    avatar: '⛽',
    token: 'token_operator_iocl_01',
    description: 'Station manager controlling live operational availability for fuel & public facilities.',
  },
  admin: {
    id: 'usr-admin-01',
    name: 'Ayesha Rahman',
    email: 'admin@urbanpitstop.com',
    passwords: ['Admin@2026', 'admin123'],
    role: 'admin',
    organization: 'Urban Pitstop Core Operations',
    verifiedBadge: true,
    avatar: '🛡️',
    token: 'token_admin_ops_01',
    description: 'Platform administrator overseeing the QA verification queue and Gemini contradiction triage.',
  },
};

export const GUEST_USER: UserProfile = {
  id: 'usr-guest-00',
  name: 'Guest User',
  email: 'guest@urbanpitstop.com',
  role: 'guest',
  organization: 'Public / Outdoor Commuter',
  verifiedBadge: false,
  avatar: '🚶',
};

export function getCurrentUser(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed reading auth from storage', e);
  }
  return GUEST_USER;
}

export function saveCurrentUser(user: UserProfile) {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
  } catch (e) {
    console.warn('Failed saving user to storage', e);
  }
}

/**
 * Validates manual email & password credentials strictly.
 * Logs event in the audit trail.
 */
export async function loginWithCredentials(email: string, password: string): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // Try backend auth if reachable
  const endpoints = ['/api/auth/login', 'http://127.0.0.1:8000/api/auth/login'];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const serverUser = await res.json();
        saveCurrentUser(serverUser);
        logAuthEvent(
          'LOGIN_SUCCESS',
          { email: serverUser.email, name: serverUser.name, role: serverUser.role },
          `Authenticated successfully via server API as ${serverUser.role.toUpperCase()} (${serverUser.name}).`
        );
        return serverUser;
      } else {
        const errData = await res.json().catch(() => null);
        if (errData && errData.detail) {
          // Log failed attempt
          logAuthEvent(
            'LOGIN_FAILED',
            { email: cleanEmail, name: 'Login Attempt', role: 'guest' },
            `Authentication rejected by server: ${errData.detail}`,
            'warning'
          );
          throw new Error(errData.detail);
        }
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('pending') || e.message.includes('Invalid password') || e.message.includes('suspended'))) {
        throw e;
      }
      console.debug(`Backend auth endpoint ${ep} unavailable, trying fallback:`, e);
    }
  }

  // Helper to ensure operator has their facilities bound
  const enrichOperatorProfile = (prof: UserProfile): UserProfile => {
    if (prof.role !== 'operator') return prof;
    const org = (prof.organization || '').toLowerCase().trim();
    const name = (prof.name || '').toLowerCase().trim();
    const email = (prof.email || '').toLowerCase().trim();
    const assigned = new Set(prof.assignedFacilityIds || []);

    try {
      const facsRaw = localStorage.getItem('urban_pitstop_facilities_v1');
      if (facsRaw) {
        const facs = JSON.parse(facsRaw);
        for (const f of facs) {
          const fOp = (f.operatorName || '').toLowerCase().trim();
          const fName = (f.name || '').toLowerCase().trim();
          const fEmail = (f.operatorEmail || '').toLowerCase().trim();
          if ((org && (fOp === org || fName.includes(org))) || (name && fOp === name) || (email && fEmail === email)) {
            assigned.add(f.id);
          }
        }
      }
    } catch (e) {
      console.debug('Error enriching operator facilities:', e);
    }
    prof.assignedFacilityIds = Array.from(assigned);
    return prof;
  };

  // Backend login success enrichment
  // (already called above if server returned 200, but let's handle local paths)

  // Local accounts check: 1. DEMO_ACCOUNTS
  for (const roleKey of ['worker', 'operator', 'admin'] as const) {
    const acc = DEMO_ACCOUNTS[roleKey];
    if (acc.email.toLowerCase() === cleanEmail) {
      if (acc.passwords.includes(cleanPassword)) {
        const { passwords: _, description: __, ...rawProfile } = acc;
        const profile = enrichOperatorProfile(rawProfile);
        saveCurrentUser(profile);
        logAuthEvent(
          'LOGIN_SUCCESS',
          { email: profile.email, name: profile.name, role: profile.role },
          `User authenticated manually via credentials as ${profile.role.toUpperCase()} (${profile.name}).`
        );
        return profile;
      } else {
        logAuthEvent(
          'LOGIN_FAILED',
          { email: cleanEmail, name: 'Unknown Attempt', role: roleKey },
          `Incorrect password entered for account ${cleanEmail}. Access rejected.`,
          'warning'
        );
        throw new Error('Invalid password for this account. Please verify your credentials.');
      }
    }
  }

  // Local accounts check: 2. Stored user accounts (from Admin User Management or approved operators)
  try {
    const rawUsers = localStorage.getItem('urban_pitstop_user_accounts_v1');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const matched = users.find((u: any) => u.email && u.email.toLowerCase() === cleanEmail);
      if (matched) {
        if (matched.status === 'pending_approval') {
          throw new Error('Your account is currently pending administrator verification. Please check back shortly.');
        }
        if (matched.status === 'suspended') {
          throw new Error('This account has been suspended by platform administration.');
        }
        const validPasswords = matched.passwords || [matched.password];
        if (validPasswords.includes(cleanPassword)) {
          const rawProfile: UserProfile = {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role,
            organization: matched.organization,
            assignedFacilityIds: matched.assignedFacilityIds,
            verifiedBadge: true,
            avatar: matched.avatar || (matched.role === 'admin' ? '🛡️' : (matched.role === 'operator' ? '⛽' : '🛵')),
            workerType: matched.workerType
          };
          const profile = enrichOperatorProfile(rawProfile);
          saveCurrentUser(profile);
          logAuthEvent(
            'LOGIN_SUCCESS',
            { email: profile.email, name: profile.name, role: profile.role },
            `User authenticated locally as ${profile.role.toUpperCase()} (${profile.name}).`
          );
          return profile;
        } else {
          throw new Error('Invalid password for this account. Please verify your credentials.');
        }
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('pending') || err.message.includes('Invalid password') || err.message.includes('suspended'))) {
      throw err;
    }
  }

  // Local accounts check: 3. Operator registrations queue
  try {
    const rawOps = localStorage.getItem('urban_pitstop_operator_requests_v1');
    if (rawOps) {
      const ops = JSON.parse(rawOps);
      const matchedOp = ops.find((o: any) => o.email && o.email.toLowerCase() === cleanEmail);
      if (matchedOp) {
        if (matchedOp.status === 'pending') {
          throw new Error('Your operator registration is currently pending administrator review. Please check back shortly.');
        }
        if (matchedOp.status === 'rejected') {
          throw new Error('This operator application was rejected. Please contact support.');
        }
        if (matchedOp.status === 'approved') {
          if (matchedOp.password === cleanPassword) {
            const rawProfile: UserProfile = {
              id: `usr-op-${matchedOp.id}`,
              name: matchedOp.operatorName,
              email: matchedOp.email,
              role: 'operator',
              organization: matchedOp.organization || matchedOp.facilityName,
              assignedFacilityIds: matchedOp.facilityId ? [matchedOp.facilityId] : [],
              verifiedBadge: true,
              avatar: '⛽'
            };
            const profile = enrichOperatorProfile(rawProfile);
            saveCurrentUser(profile);
            logAuthEvent(
              'LOGIN_SUCCESS',
              { email: profile.email, name: profile.name, role: 'operator' },
              `Approved operator authenticated as OPERATOR (${profile.name}).`
            );
            return profile;
          } else {
            throw new Error('Invalid password for this account. Please verify your credentials.');
          }
        }
      }
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('pending') || err.message.includes('Invalid password') || err.message.includes('rejected'))) {
      throw err;
    }
  }

  // If email was completely unrecognized
  logAuthEvent(
    'LOGIN_FAILED',
    { email: cleanEmail, name: 'Unknown User', role: 'guest' },
    `Login rejected for unrecognized email address: ${cleanEmail}.`,
    'warning'
  );
  throw new Error('No registered account found with that email address.');
}

export function logoutUser(): UserProfile {
  const prevUser = getCurrentUser();
  saveCurrentUser(GUEST_USER);
  logAuthEvent(
    'LOGOUT',
    { email: prevUser.email, name: prevUser.name, role: prevUser.role },
    `User ${prevUser.name} (${prevUser.role}) signed out. Active session reverted to Guest.`
  );
  return GUEST_USER;
}

export function isAuthorized(user: UserProfile, allowedRoles: UserRole[]): boolean {
  if (allowedRoles.includes('guest')) return true;
  return allowedRoles.includes(user.role);
}
