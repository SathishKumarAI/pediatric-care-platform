"""Security & compliance helpers (from Medical-Research HIPAA/GDPR notes).

MVP scope: this is a local decision-support tool with synthetic data. The hooks
below are placeholders that document where PHI controls MUST live before any
real patient data is accepted.
"""
from __future__ import annotations

import logging

audit_log = logging.getLogger("pcp.audit")


def record_access(actor: str, resource: str, action: str) -> None:
    """Append-only audit trail. Required for HIPAA before real PHI."""
    audit_log.info("actor=%s action=%s resource=%s", actor, action, resource)


# TODO(compliance, before real PHI): consent capture, field-level encryption,
# data-retention policy, role-based access enforcement, right-to-erasure (GDPR).
