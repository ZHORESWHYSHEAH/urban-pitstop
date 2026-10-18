export type AuthEventType = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED' 
  | 'LOGOUT' 
  | 'ACCESS_DENIED' 
  | 'ROLE_SWITCH_REQUEST'
  | 'OPERATOR_AVAILABILITY_CHANGE'
  | 'ADMIN_MODERATION_ACTION';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO
  eventType: AuthEventType;
  actorEmail: string;
  actorName: string;
  actorRole: string;
  clientIp?: string;
  userAgent?: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

const STORAGE_KEY_AUDIT_LOGS = 'urban_pitstop_audit_logs_v1';

function initializeAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn(e);
  }

  // Baseline seed audit records for realism
  const now = new Date();
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

  const baseline: AuditLogEntry[] = [
    {
      id: 'aud-seed-01',
      timestamp: minsAgo(120),
      eventType: 'LOGIN_SUCCESS',
      actorEmail: 'admin@urbanpitstop.com',
      actorName: 'Ayesha Rahman',
      actorRole: 'admin',
      clientIp: '192.168.1.104',
      details: 'Platform Admin authenticated via secure credentials form.',
      severity: 'info',
    },
    {
      id: 'aud-seed-02',
      timestamp: minsAgo(85),
      eventType: 'OPERATOR_AVAILABILITY_CHANGE',
      actorEmail: 'operator@urbanpitstop.com',
      actorName: 'Suresh Patil',
      actorRole: 'operator',
      clientIp: '192.168.1.142',
      details: 'Changed status of blr-fac-03 (IOCL Station) to AVAILABLE_NOW.',
      severity: 'info',
    },
    {
      id: 'aud-seed-03',
      timestamp: minsAgo(40),
      eventType: 'ACCESS_DENIED',
      actorEmail: 'guest@urbanpitstop.com',
      actorName: 'Anonymous Guest',
      actorRole: 'guest',
      clientIp: '192.168.1.205',
      details: 'Unauthorized attempt to access Admin Dashboard without required administrator credentials.',
      severity: 'warning',
    },
    {
      id: 'aud-seed-04',
      timestamp: minsAgo(15),
      eventType: 'LOGIN_SUCCESS',
      actorEmail: 'rider@urbanpitstop.com',
      actorName: 'Kiran Swaminathan',
      actorRole: 'worker',
      clientIp: '10.0.4.12',
      details: 'Delivery Partner authenticated with verified badge status.',
      severity: 'info',
    }
  ];

  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(baseline));
  } catch {}
  return baseline;
}

let inMemoryAuditLogs: AuditLogEntry[] = initializeAuditLogs();

export function logAuthEvent(
  eventType: AuthEventType,
  actor: { email: string; name: string; role: string },
  details: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    eventType,
    actorEmail: actor.email,
    actorName: actor.name,
    actorRole: actor.role,
    clientIp: '127.0.0.1 (Local Client)',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    details,
    severity,
  };

  inMemoryAuditLogs.unshift(newEntry);
  // Cap at 100 entries
  if (inMemoryAuditLogs.length > 100) {
    inMemoryAuditLogs = inMemoryAuditLogs.slice(0, 100);
  }

  try {
    localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(inMemoryAuditLogs));
  } catch (e) {
    console.warn('Failed saving audit logs to localStorage', e);
  }

  // Attempt sync to server
  try {
    fetch('/api/auth/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
      signal: AbortSignal.timeout(1500),
    }).catch(() => {});
  } catch {}

  return newEntry;
}

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return inMemoryAuditLogs;
}

export function clearAuditLogs() {
  inMemoryAuditLogs = [];
  try {
    localStorage.removeItem(STORAGE_KEY_AUDIT_LOGS);
  } catch {}
}
