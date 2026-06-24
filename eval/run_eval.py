"""Symptom-predictor quality eval: top-1 and top-3 accuracy over labeled cases.

Stdlib-only YAML-lite parser so the eval runs without extra deps.
Usage: python eval/run_eval.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.predictor import predict  # noqa: E402


def load_cases(path: str = "eval/cases.yaml"):
    cases, cur = [], None
    for raw in Path(path).read_text().splitlines():
        line = raw.split("#")[0].rstrip()
        if not line.strip():
            continue
        if line.lstrip().startswith("- symptoms:"):
            if cur:
                cases.append(cur)
            cur = {"symptoms": _list(line), "expect": []}
        elif "expect:" in line:
            cur["expect"] = _list(line)
    if cur:
        cases.append(cur)
    return cases


def _list(line: str) -> list[str]:
    inside = line[line.index("[") + 1 : line.rindex("]")]
    return [x.strip() for x in inside.split(",") if x.strip()]


def main() -> int:
    cases = load_cases()
    top1 = top3 = 0
    for c in cases:
        preds, triage = predict(c["symptoms"])
        names = [p["disease"] for p in preds]
        ok1 = names and names[0] in c["expect"]
        ok3 = bool(set(names) & set(c["expect"]))
        top1 += ok1
        top3 += ok3
        mark = "✓" if ok1 else ("~" if ok3 else "✗")
        print(f"{mark} {c['symptoms']} -> {names[:3]} (triage={triage})")
    n = len(cases)
    print(f"\nTop-1 accuracy: {top1}/{n} = {top1/n:.0%}")
    print(f"Top-3 accuracy: {top3}/{n} = {top3/n:.0%}")
    return 0 if top3 == n else 1


if __name__ == "__main__":
    raise SystemExit(main())
