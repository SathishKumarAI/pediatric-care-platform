# Feature Spec — Knowledge Graph

## Summary
A symptom↔disease graph built from the dataset at load. Query a node's
neighbors via `GET /graph/{node}`, and supply symptom weights to the symptom
predictor. In-memory CSV by default; Neo4j optional.

## Problem / why
The symptom checker needs structured, weighted relations between symptoms and
diseases to rank conditions transparently. This is that backbone — and it's
inspectable on its own, so the reasoning isn't a black box.

## Users & context
The symptom predictor (primary consumer); developers/clinicians inspecting why a
condition was suggested.

## Behaviour (acceptance criteria)
- WHEN the app loads THEN build the graph from `data/symptom_disease.csv` with HAS_SYMPTOM (disease→symptom) and INDICATES (symptom→disease) edges.
- WHEN `GET /graph/{node}` is called for a known node THEN return `{node, related[{name, relation, weight}]}`.
- WHEN the node is a disease THEN `related` lists its symptoms (HAS_SYMPTOM); WHEN the node is a symptom THEN `related` lists the diseases it indicates (INDICATES).
- WHEN the node is unknown THEN respond 404.
- WHEN the predictor scores a disease THEN it uses this graph's symptom weights.

## Rules / logic (the real logic)
- Nodes are normalized before lookup: lowercase, spaces→underscores.
- `weight` = prevalence of a symptom within a disease (share of that disease's cases showing the symptom), learned from the dataset at load.
- Edges are bidirectional in meaning but typed by direction: HAS_SYMPTOM from disease, INDICATES from symptom.
- Backend is swappable: in-memory CSV when `NEO4J_URI` is unset; Neo4j behind the same interface otherwise.

## Out of scope (for now)
- Neo4j-backed persistence (interface ready, not the default path).
- Graph editing UI (build is dataset-driven, read-only at runtime).
- Treatment / medication relations (symptom↔disease only).

## Data touched
- Reads: `data/symptom_disease.csv` (or Neo4j when configured).
- Writes: none at runtime (graph built in memory at load).

## Edge cases
- Unknown node → 404. · Node with mixed casing/spaces → normalized then matched. · Symptom with no diseases → 404 (not present as a node). · Empty dataset → empty graph, every lookup 404.

## Done when
- `GET /graph/{node}` returns correct neighbors + weights for a seeded symptom and a seeded disease; unknown node → 404.
- The predictor's confidence uses these weights (mirrors `symptom-checker.md`).
- `tests/test_api.py::test_graph_*` pass.
