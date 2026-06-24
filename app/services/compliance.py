"""Compliance store (PCP-14b): append-only audit log + consent capture.

Both are HIPAA/GDPR prerequisites (see docs/privacy-compliance.md). The audit
log is append-only by contract (no update/delete methods exposed).
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from ..config import get_settings
from ..schemas import AuditEntry, Consent
from . import db


def _now() -> str:
    return datetime.now(UTC).isoformat()


class ComplianceStore:
    def __init__(self, path: str) -> None:
        self.conn = db.connect(path)

    # --- audit log (append-only) ---
    def record_audit(self, actor: str, action: str, resource: str, status: int) -> None:
        self.conn.execute(
            "INSERT INTO audit_log (id, ts, actor, action, resource, status) VALUES (?,?,?,?,?,?)",
            (f"aud-{uuid.uuid4().hex[:10]}", _now(), actor, action, resource, status),
        )
        self.conn.commit()

    def list_audit(self, limit: int = 100) -> list[AuditEntry]:
        rows = self.conn.execute(
            "SELECT * FROM audit_log ORDER BY ts DESC LIMIT ?", (limit,)
        ).fetchall()
        return [
            AuditEntry(id=r["id"], ts=r["ts"], actor=r["actor"], action=r["action"],
                       resource=r["resource"], status=r["status"])
            for r in rows
        ]

    # --- consent ---
    def add_consent(self, subject: str, consent_type: str, granted: bool) -> Consent:
        c = Consent(id=f"con-{uuid.uuid4().hex[:8]}", subject=subject,
                    consent_type=consent_type, granted=granted, ts=datetime.now(UTC))
        self.conn.execute(
            "INSERT INTO consents (id, subject, consent_type, granted, ts) VALUES (?,?,?,?,?)",
            (c.id, subject, consent_type, int(granted), c.ts.isoformat()),
        )
        self.conn.commit()
        return c

    def list_consents(self, subject: str) -> list[Consent]:
        rows = self.conn.execute(
            "SELECT * FROM consents WHERE subject=? ORDER BY ts DESC", (subject,)
        ).fetchall()
        return [
            Consent(id=r["id"], subject=r["subject"], consent_type=r["consent_type"],
                    granted=bool(r["granted"]), ts=r["ts"])
            for r in rows
        ]


_COMPLIANCE: ComplianceStore | None = None


def get_compliance() -> ComplianceStore:
    global _COMPLIANCE
    if _COMPLIANCE is None:
        url = get_settings().database_url
        path = db.sqlite_path(url) if url.startswith("sqlite:///") else ":memory:"
        _COMPLIANCE = ComplianceStore(path)
    return _COMPLIANCE
