"""AI intelligence endpoints (from Medical-Research): symptom checker +
knowledge-graph queries."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..providers import explain
from ..schemas import (
    DiseasePrediction,
    GraphNeighbors,
    SymptomRequest,
    SymptomResponse,
)
from ..services.knowledge_graph import get_graph
from ..services.predictor import predict

router = APIRouter(tags=["intelligence"])


@router.post("/predict", response_model=SymptomResponse)
def predict_symptoms(req: SymptomRequest) -> SymptomResponse:
    if not req.symptoms:
        raise HTTPException(status_code=422, detail="No symptoms provided")
    predictions, triage = predict(req.symptoms, req.age_months)
    explanation = ""
    if req.explain and predictions:
        top = predictions[0]
        prompt = (
            f"A child{f' aged {req.age_months} months' if req.age_months else ''} has "
            f"symptoms: {', '.join(req.symptoms)}. The decision-support model ranks "
            f"'{top['disease']}' most likely (confidence {top['confidence']}). "
            f"In 2-3 plain sentences for a worried parent, explain what this could mean "
            f"and what to do next. Do not diagnose."
        )
        explanation = explain(prompt)
    return SymptomResponse(
        predictions=[DiseasePrediction(**p) for p in predictions],
        triage=triage,
        explanation=explanation,
    )


@router.get("/graph/{node}", response_model=GraphNeighbors)
def graph_neighbors(node: str) -> GraphNeighbors:
    related = get_graph().neighbors(node)
    if not related:
        raise HTTPException(status_code=404, detail=f"No graph node for '{node}'")
    return GraphNeighbors(node=node, related=related)
