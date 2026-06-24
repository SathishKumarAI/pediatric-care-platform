"""Symptom -> disease predictor.

MVP scoring is transparent and explainable (weighted symptom overlap over the
knowledge graph), which is the right default for clinical decision support.
The interface is model-agnostic: swap in the GNN / sklearn model from the
Medical-Research notebooks behind `predict()` without touching callers.
"""
from __future__ import annotations

from .knowledge_graph import KnowledgeGraph, _norm, get_graph

# Symptoms that escalate triage regardless of disease ranking.
URGENT_SYMPTOMS = {
    "difficulty_breathing", "chest_pain", "seizure", "unresponsive",
    "blue_lips", "stiff_neck", "severe_dehydration",
}


def predict(symptoms: list[str], age_months: int | None = None,
            graph: KnowledgeGraph | None = None, top_k: int = 3):
    graph = graph or get_graph()
    reported = {_norm(s) for s in symptoms}

    scored: list[tuple[str, float, list[str]]] = []
    for disease in graph.diseases:
        weights = graph.symptoms_of(disease)
        if not weights:
            continue
        matched = [s for s in reported if s in weights]
        if not matched:
            continue
        # confidence = matched weight mass / total weight mass of the disease
        score = sum(weights[s] for s in matched) / sum(weights.values())
        scored.append((disease, round(score, 3), matched))

    scored.sort(key=lambda x: -x[1])
    predictions = [
        {"disease": d, "confidence": c, "matched_symptoms": [m.replace("_", " ") for m in ms]}
        for d, c, ms in scored[:top_k]
    ]
    return predictions, _triage(reported, predictions)


def _triage(reported: set[str], predictions: list[dict]) -> str:
    if reported & URGENT_SYMPTOMS:
        return "urgent"
    if predictions and predictions[0]["confidence"] >= 0.5:
        return "see-doctor"
    return "self-care"
