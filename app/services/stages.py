"""Pediatric growth & developmental stages.

Fills the empty `stages/` stub from the Pediatrics app with milestone data
modeled on CDC/WHO developmental checklists (abbreviated reference set).
"""
from __future__ import annotations

from ..schemas import Milestone, StageResponse

# (age_months, domain, milestone)
_MILESTONES: list[tuple[int, str, str]] = [
    (2, "social", "Smiles at people"),
    (2, "motor", "Holds head up during tummy time"),
    (4, "language", "Babbles / coos"),
    (6, "motor", "Sits without support"),
    (9, "cognitive", "Looks for hidden objects"),
    (12, "language", "Says first words (mama/dada)"),
    (12, "motor", "Pulls to stand / cruises"),
    (18, "social", "Points to show interest"),
    (24, "language", "Two-word phrases"),
    (36, "motor", "Runs and climbs"),
    (48, "cognitive", "Names some colors"),
    (60, "social", "Plays cooperatively with others"),
]

_RED_FLAGS: dict[int, list[str]] = {
    6: ["No smiles", "Poor head control"],
    12: ["No babbling", "Not sitting", "No response to name"],
    24: ["No words", "Loss of skills", "No walking"],
    36: ["No two-word phrases", "Frequent falling"],
}


def _stage_label(age_months: int) -> str:
    if age_months < 12:
        return "Infant"
    if age_months < 36:
        return "Toddler"
    if age_months < 60:
        return "Preschool"
    return "School-age"


def stage_for(age_months: int) -> StageResponse:
    expected = [
        Milestone(age_months=a, domain=d, milestone=m)
        for a, d, m in _MILESTONES
        if a <= age_months + 2  # milestones reached by ~now
    ]
    # nearest red-flag checkpoint <= age
    checkpoint = max((k for k in _RED_FLAGS if k <= age_months), default=6)
    return StageResponse(
        age_months=age_months,
        stage=_stage_label(age_months),
        expected=expected,
        red_flags=_RED_FLAGS.get(checkpoint, []),
    )
