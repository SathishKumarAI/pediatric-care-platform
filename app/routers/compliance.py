"""Compliance endpoints (PCP-14b): audit log + consent."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from ..schemas import AuditEntry, Consent, ConsentCreate, Role
from ..services.compliance import get_compliance
from .auth import require_roles

router = APIRouter(tags=["compliance"])

_admin_only = Depends(require_roles(Role.admin))
_auth_any = Depends(require_roles())


@router.get("/audit", response_model=list[AuditEntry])
def audit(limit: int = 100, _=_admin_only) -> list[AuditEntry]:
    return get_compliance().list_audit(limit)


@router.post("/consent", response_model=Consent, status_code=201)
def add_consent(data: ConsentCreate, _=_auth_any) -> Consent:
    return get_compliance().add_consent(data.subject, data.consent_type, data.granted)


@router.get("/consent/{subject}", response_model=list[Consent])
def consents(subject: str, _=_auth_any) -> list[Consent]:
    return get_compliance().list_consents(subject)
