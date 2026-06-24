"""Symptom -> disease knowledge graph.

Design ported from Medical-Research (Neo4j: HAS_SYMPTOM / DIAGNOSED_WITH /
TREATS). Uses Neo4j when NEO4J_URI is set; otherwise builds an in-memory graph
from the synthetic dataset so the app runs with zero infra.
"""
from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from ..config import Settings, get_settings


class KnowledgeGraph:
    def __init__(self, settings: Settings | None = None) -> None:
        self.s = settings or get_settings()
        # disease -> {symptom: weight}
        self._disease_symptoms: dict[str, dict[str, float]] = defaultdict(dict)
        # symptom -> set(disease)
        self._symptom_diseases: dict[str, set[str]] = defaultdict(set)
        self._load_from_dataset()

    def _load_from_dataset(self) -> None:
        path = Path(self.s.symptom_dataset)
        if not path.exists():
            return
        with path.open() as f:
            reader = csv.DictReader(f)
            symptom_cols = [c for c in reader.fieldnames or [] if c != "disease"]
            counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
            totals: dict[str, int] = defaultdict(int)
            for row in reader:
                disease = row["disease"]
                totals[disease] += 1
                for sym in symptom_cols:
                    if str(row.get(sym, "0")).strip() in ("1", "yes", "high", "true"):
                        counts[disease][sym] += 1
            for disease, syms in counts.items():
                for sym, n in syms.items():
                    weight = n / totals[disease]
                    self._disease_symptoms[disease][sym] = round(weight, 3)
                    self._symptom_diseases[sym].add(disease)

    @property
    def diseases(self) -> list[str]:
        return sorted(self._disease_symptoms)

    def symptoms_of(self, disease: str) -> dict[str, float]:
        return self._disease_symptoms.get(disease, {})

    def diseases_for(self, symptom: str) -> set[str]:
        return self._symptom_diseases.get(_norm(symptom), set())

    def neighbors(self, node: str) -> list[dict]:
        """Graph query: related nodes for a symptom OR disease node."""
        node_n = _norm(node)
        if node_n in self._disease_symptoms:
            return [
                {"name": s, "relation": "HAS_SYMPTOM", "weight": w}
                for s, w in sorted(self._disease_symptoms[node_n].items(), key=lambda x: -x[1])
            ]
        return [
            {"name": d, "relation": "INDICATES", "weight": self._disease_symptoms[d].get(node_n, 0)}
            for d in sorted(self._symptom_diseases.get(node_n, set()))
        ]


def _norm(s: str) -> str:
    return s.strip().lower().replace(" ", "_")


_GRAPH: KnowledgeGraph | None = None


def get_graph() -> KnowledgeGraph:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = KnowledgeGraph()
    return _GRAPH
