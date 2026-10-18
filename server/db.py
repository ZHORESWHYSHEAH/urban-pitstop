import os
import json
import sqlite3
from typing import List, Dict, Any, Optional

DB_PATH = os.environ.get("DATABASE_PATH", os.path.join(os.path.dirname(__file__), "urban_pitstop.db"))

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_tables():
    with get_connection() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS facilities (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            secondary_categories TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            address TEXT NOT NULL,
            area TEXT NOT NULL,
            access_condition TEXT NOT NULL,
            access_notes TEXT,
            fee TEXT,
            accessibility TEXT,
            operating_hours TEXT,
            status TEXT NOT NULL,
            confidence_score INTEGER NOT NULL,
            last_confirmed_at TEXT,
            last_confirmed_by TEXT,
            last_status_note TEXT,
            evidence_history TEXT,
            operator_claimed INTEGER DEFAULT 0,
            operator_name TEXT,
            operator_email TEXT,
            verified_by_admin INTEGER DEFAULT 0,
            flagged_for_review INTEGER DEFAULT 0,
            flag_reason TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            passwords TEXT,
            role TEXT NOT NULL,
            organization TEXT,
            phone TEXT,
            worker_type TEXT,
            status TEXT DEFAULT 'active',
            assigned_facility_ids TEXT,
            verified_badge INTEGER DEFAULT 1,
            avatar TEXT,
            token TEXT,
            created_at TEXT,
            last_login_at TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS operator_registrations (
            id TEXT PRIMARY KEY,
            operator_name TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT,
            phone TEXT,
            organization TEXT,
            facility_name TEXT NOT NULL,
            category TEXT NOT NULL,
            address TEXT,
            area TEXT,
            latitude REAL,
            longitude REAL,
            access_condition TEXT,
            fee TEXT,
            operating_hours TEXT,
            accessibility TEXT,
            status TEXT DEFAULT 'pending',
            submitted_at TEXT,
            rejection_reason TEXT,
            facility_id TEXT
        );

        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            facility_id TEXT NOT NULL,
            facility_name TEXT NOT NULL,
            reporter_name TEXT,
            reporter_role TEXT,
            issue_type TEXT NOT NULL,
            severity TEXT DEFAULT 'medium',
            note TEXT,
            status TEXT DEFAULT 'pending',
            timestamp TEXT NOT NULL,
            client_ip TEXT,
            suggested_action TEXT,
            admin_resolution TEXT
        );

        CREATE TABLE IF NOT EXISTS inspections (
            id TEXT PRIMARY KEY,
            facility_id TEXT NOT NULL,
            facility_name TEXT NOT NULL,
            worker_id TEXT NOT NULL,
            worker_name TEXT NOT NULL,
            hygiene_rating INTEGER NOT NULL,
            water_quality_status TEXT,
            cleanliness_status TEXT,
            supplies_present INTEGER DEFAULT 1,
            safety_rating TEXT,
            notes TEXT,
            inspected_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            actor_email TEXT,
            actor_name TEXT,
            actor_role TEXT,
            client_ip TEXT,
            details TEXT,
            severity TEXT DEFAULT 'info'
        );
        """)

# --- Mapping Helpers ---

def row_to_facility(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "name": r["name"],
        "category": r["category"],
        "secondaryCategories": json.loads(r["secondary_categories"] or "[]"),
        "latitude": r["latitude"],
        "longitude": r["longitude"],
        "address": r["address"],
        "area": r["area"],
        "accessCondition": r["access_condition"],
        "accessNotes": r["access_notes"] or "",
        "fee": r["fee"] or "Free",
        "accessibility": json.loads(r["accessibility"] or "{}"),
        "operatingHours": json.loads(r["operating_hours"] or "{}"),
        "status": r["status"],
        "confidenceScore": r["confidence_score"],
        "lastConfirmedAt": r["last_confirmed_at"],
        "lastConfirmedBy": r["last_confirmed_by"],
        "lastStatusNote": r["last_status_note"] or "",
        "evidenceHistory": json.loads(r["evidence_history"] or "[]"),
        "operatorClaimed": bool(r["operator_claimed"]),
        "operatorName": r["operator_name"],
        "operatorEmail": r["operator_email"],
        "verifiedByAdmin": bool(r["verified_by_admin"]),
        "flaggedForReview": bool(r["flagged_for_review"]),
        "flagReason": r["flag_reason"]
    }

def row_to_user(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "name": r["name"],
        "email": r["email"],
        "passwords": json.loads(r["passwords"] or "[]"),
        "role": r["role"],
        "organization": r["organization"] or "",
        "phone": r["phone"] or "",
        "workerType": r["worker_type"],
        "status": r["status"],
        "assignedFacilityIds": json.loads(r["assigned_facility_ids"] or "[]"),
        "verifiedBadge": bool(r["verified_badge"]),
        "avatar": r["avatar"] or "👤",
        "token": r["token"] or "",
        "createdAt": r["created_at"],
        "lastLoginAt": r["last_login_at"],
        "notes": r["notes"] or ""
    }

def row_to_operator_reg(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "operatorName": r["operator_name"],
        "email": r["email"],
        "password": r["password"] or "",
        "phone": r["phone"] or "",
        "organization": r["organization"] or "",
        "facilityName": r["facility_name"],
        "category": r["category"],
        "address": r["address"] or "",
        "area": r["area"] or "",
        "latitude": r["latitude"],
        "longitude": r["longitude"],
        "accessCondition": r["access_condition"] or "public",
        "fee": r["fee"] or "Free",
        "operatingHours": json.loads(r["operating_hours"] or "{}"),
        "accessibility": json.loads(r["accessibility"] or "{}"),
        "status": r["status"],
        "submittedAt": r["submitted_at"],
        "rejectionReason": r["rejection_reason"],
        "facilityId": r["facility_id"]
    }

def row_to_report(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "facilityId": r["facility_id"],
        "facilityName": r["facility_name"],
        "reporterName": r["reporter_name"] or "Anonymous",
        "reporterRole": r["reporter_role"] or "guest",
        "issueType": r["issue_type"],
        "severity": r["severity"] or "medium",
        "note": r["note"] or "",
        "status": r["status"] or "pending",
        "timestamp": r["timestamp"],
        "clientIp": r["client_ip"] or "127.0.0.1",
        "suggestedAction": r["suggested_action"] or "",
        "adminResolution": r["admin_resolution"]
    }

def row_to_inspection(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "facilityId": r["facility_id"],
        "facilityName": r["facility_name"],
        "workerId": r["worker_id"],
        "workerName": r["worker_name"],
        "hygieneRating": r["hygiene_rating"],
        "waterQualityStatus": r["water_quality_status"],
        "cleanlinessStatus": r["cleanliness_status"],
        "suppliesPresent": bool(r["supplies_present"]),
        "safetyRating": r["safety_rating"],
        "notes": r["notes"] or "",
        "inspectedAt": r["inspected_at"]
    }

def row_to_audit_log(r: sqlite3.Row) -> Dict[str, Any]:
    return {
        "id": r["id"],
        "timestamp": r["timestamp"],
        "eventType": r["event_type"],
        "actorEmail": r["actor_email"],
        "actorName": r["actor_name"],
        "actorRole": r["actor_role"],
        "clientIp": r["client_ip"],
        "details": r["details"],
        "severity": r["severity"]
    }

# --- Facilities CRUD ---

def get_all_facilities() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM facilities ORDER BY id ASC").fetchall()
        return [row_to_facility(r) for r in rows]

def get_facility_by_id(facility_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        r = conn.execute("SELECT * FROM facilities WHERE id = ?", (facility_id,)).fetchone()
        return row_to_facility(r) if r else None

def save_facility(f: Dict[str, Any]) -> Dict[str, Any]:
    with get_connection() as conn:
        conn.execute("""
        INSERT OR REPLACE INTO facilities (
            id, name, category, secondary_categories, latitude, longitude,
            address, area, access_condition, access_notes, fee, accessibility,
            operating_hours, status, confidence_score, last_confirmed_at,
            last_confirmed_by, last_status_note, evidence_history,
            operator_claimed, operator_name, operator_email,
            verified_by_admin, flagged_for_review, flag_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            f["id"],
            f.get("name", "Unnamed Facility"),
            f.get("category", "water"),
            json.dumps(f.get("secondaryCategories", [])),
            float(f.get("latitude", 0.0)),
            float(f.get("longitude", 0.0)),
            f.get("address", ""),
            f.get("area", ""),
            f.get("accessCondition", "public"),
            f.get("accessNotes", ""),
            f.get("fee", "Free"),
            json.dumps(f.get("accessibility", {})),
            json.dumps(f.get("operatingHours", {})),
            f.get("status", "recently_confirmed"),
            int(f.get("confidenceScore", 85)),
            f.get("lastConfirmedAt"),
            f.get("lastConfirmedBy"),
            f.get("lastStatusNote", ""),
            json.dumps(f.get("evidenceHistory", [])),
            1 if f.get("operatorClaimed") else 0,
            f.get("operatorName"),
            f.get("operatorEmail"),
            1 if f.get("verifiedByAdmin") else 0,
            1 if f.get("flaggedForReview") else 0,
            f.get("flagReason")
        ))
        conn.commit()
    return f

def delete_facility(facility_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM facilities WHERE id = ?", (facility_id,))
        conn.commit()
        return cur.rowcount > 0

# --- Users CRUD ---

def get_all_users() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall()
        return [row_to_user(r) for r in rows]

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        r = conn.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),)).fetchone()
        return row_to_user(r) if r else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        r = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return row_to_user(r) if r else None

def save_user(u: Dict[str, Any]) -> Dict[str, Any]:
    with get_connection() as conn:
        passwords = u.get("passwords", [])
        if not passwords and u.get("password"):
            passwords = [u["password"]]
        conn.execute("""
        INSERT OR REPLACE INTO users (
            id, name, email, passwords, role, organization, phone,
            worker_type, status, assigned_facility_ids, verified_badge,
            avatar, token, created_at, last_login_at, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            u["id"],
            u.get("name", "User"),
            u["email"].strip().lower(),
            json.dumps(passwords),
            u.get("role", "guest"),
            u.get("organization", ""),
            u.get("phone", ""),
            u.get("workerType"),
            u.get("status", "active"),
            json.dumps(u.get("assignedFacilityIds", [])),
            1 if u.get("verifiedBadge", True) else 0,
            u.get("avatar", "👤"),
            u.get("token", ""),
            u.get("createdAt"),
            u.get("lastLoginAt"),
            u.get("notes", "")
        ))
        conn.commit()
    return u

# --- Operator Registrations CRUD ---

def get_all_operator_requests() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM operator_registrations ORDER BY submitted_at DESC").fetchall()
        return [row_to_operator_reg(r) for r in rows]

def get_operator_request_by_id(req_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        r = conn.execute("SELECT * FROM operator_registrations WHERE id = ?", (req_id,)).fetchone()
        return row_to_operator_reg(r) if r else None

def save_operator_request(r: Dict[str, Any]) -> Dict[str, Any]:
    with get_connection() as conn:
        conn.execute("""
        INSERT OR REPLACE INTO operator_registrations (
            id, operator_name, email, password, phone, organization,
            facility_name, category, address, area, latitude, longitude,
            access_condition, fee, operating_hours, accessibility,
            status, submitted_at, rejection_reason, facility_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r["id"],
            r.get("operatorName", ""),
            r.get("email", "").strip().lower(),
            r.get("password", ""),
            r.get("phone", ""),
            r.get("organization", ""),
            r.get("facilityName", ""),
            r.get("category", "water"),
            r.get("address", ""),
            r.get("area", ""),
            float(r.get("latitude", 0.0)),
            float(r.get("longitude", 0.0)),
            r.get("accessCondition", "public"),
            r.get("fee", "Free"),
            json.dumps(r.get("operatingHours", {})),
            json.dumps(r.get("accessibility", {})),
            r.get("status", "pending"),
            r.get("submittedAt"),
            r.get("rejectionReason"),
            r.get("facilityId")
        ))
        conn.commit()
    return r

# --- Reports CRUD ---

def get_all_reports() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM reports ORDER BY timestamp DESC").fetchall()
        return [row_to_report(r) for r in rows]

def get_report_by_id(report_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        r = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        return row_to_report(r) if r else None

def save_report(r: Dict[str, Any]) -> Dict[str, Any]:
    with get_connection() as conn:
        conn.execute("""
        INSERT OR REPLACE INTO reports (
            id, facility_id, facility_name, reporter_name, reporter_role,
            issue_type, severity, note, status, timestamp, client_ip,
            suggested_action, admin_resolution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            r["id"],
            r.get("facilityId", ""),
            r.get("facilityName", ""),
            r.get("reporterName", "Anonymous"),
            r.get("reporterRole", "guest"),
            r.get("issueType", "other"),
            r.get("severity", "medium"),
            r.get("note", ""),
            r.get("status", "pending"),
            r.get("timestamp"),
            r.get("clientIp", "127.0.0.1"),
            r.get("suggestedAction", ""),
            r.get("adminResolution")
        ))
        conn.commit()
    return r

def delete_report(report_id: str) -> bool:
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        conn.commit()
        return cur.rowcount > 0

# --- Inspections CRUD ---

def get_all_inspections() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM inspections ORDER BY inspected_at DESC").fetchall()
        return [row_to_inspection(r) for r in rows]

def save_inspection(i: Dict[str, Any]) -> Dict[str, Any]:
    with get_connection() as conn:
        conn.execute("""
        INSERT OR REPLACE INTO inspections (
            id, facility_id, facility_name, worker_id, worker_name,
            hygiene_rating, water_quality_status, cleanliness_status,
            supplies_present, safety_rating, notes, inspected_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            i["id"],
            i.get("facilityId", ""),
            i.get("facilityName", ""),
            i.get("workerId", ""),
            i.get("workerName", ""),
            int(i.get("hygieneRating", 5)),
            i.get("waterQualityStatus", "potable_clean"),
            i.get("cleanlinessStatus", "clean"),
            1 if i.get("suppliesPresent", True) else 0,
            i.get("safetyRating", "very_safe"),
            i.get("notes", ""),
            i.get("inspectedAt")
        ))
        conn.commit()
    return i

# --- Audit Logs CRUD ---

def get_all_audit_logs(limit: int = 100) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,)).fetchall()
        return [row_to_audit_log(r) for r in rows]

def save_audit_log(log: Dict[str, Any]) -> Dict[str, Any]:
    with get_connection() as conn:
        conn.execute("""
        INSERT OR REPLACE INTO audit_logs (
            id, timestamp, event_type, actor_email, actor_name,
            actor_role, client_ip, details, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            log["id"],
            log.get("timestamp"),
            log.get("eventType", "SYSTEM_EVENT"),
            log.get("actorEmail", ""),
            log.get("actorName", ""),
            log.get("actorRole", "guest"),
            log.get("clientIp", "127.0.0.1"),
            log.get("details", ""),
            log.get("severity", "info")
        ))
        conn.commit()
    return log

# --- Database Seeder ---

def seed_database_if_empty(
    seed_facilities: List[Dict[str, Any]],
    seed_users: List[Dict[str, Any]],
    seed_operator_requests: List[Dict[str, Any]],
    seed_reports: List[Dict[str, Any]],
    seed_inspections: List[Dict[str, Any]],
    seed_audit_logs: List[Dict[str, Any]]
):
    init_tables()
    with get_connection() as conn:
        fac_count = conn.execute("SELECT COUNT(*) FROM facilities").fetchone()[0]
        if fac_count == 0:
            for f in seed_facilities:
                save_facility(f)

        usr_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if usr_count == 0:
            for u in seed_users:
                save_user(u)

        op_count = conn.execute("SELECT COUNT(*) FROM operator_registrations").fetchone()[0]
        if op_count == 0:
            for o in seed_operator_requests:
                save_operator_request(o)

        rep_count = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
        if rep_count == 0:
            for r in seed_reports:
                save_report(r)

        insp_count = conn.execute("SELECT COUNT(*) FROM inspections").fetchone()[0]
        if insp_count == 0:
            for i in seed_inspections:
                save_inspection(i)

        aud_count = conn.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0]
        if aud_count == 0:
            for a in seed_audit_logs:
                save_audit_log(a)
