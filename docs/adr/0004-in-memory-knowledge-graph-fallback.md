# ADR 0004 — In-memory knowledge-graph fallback (Neo4j optional)

**Status:** Accepted

## Context

The symptom checker reasons over a **symptom→disease knowledge graph**. A graph
database (Neo4j) is the natural home for this, but requiring it everywhere has
real costs:

- **Onboarding** — a new contributor would need a running Neo4j just to start
  the app or run tests.
- **CI** — every pipeline run would need a graph DB service.
- **Scale** — the current graph is small (10 synthetic diseases from
  `data/symptom_disease.csv`); a full graph DB is overkill at this size.

We want the app to run with **zero infrastructure** by default, while keeping
Neo4j available when the graph grows.

## Decision

Load the knowledge graph **in memory from `data/symptom_disease.csv`** by
default (`app/services/knowledge_graph.py`). Use **Neo4j only when `NEO4J_URI`
is set**; otherwise fall back to the in-memory graph automatically.

The predictor consumes the graph through a stable interface, so the storage
choice is invisible to the rest of the system. CSV is generated deterministically
by `scripts/generate_data.py` (seeded), keeping the graph reproducible and the
predictor eval (`eval/run_eval.py`) stable.

## Consequences

**Positive**
- `git clone` → run, with **no database** required. Tests and CI need no service.
- Deterministic, reproducible graph from versioned CSV — eval stays stable.
- Neo4j is a drop-in upgrade via `NEO4J_URI` when the graph outgrows memory.
- Mirrors the store's in-memory→Postgres path (see [data-model.md](../data-model.md)).

**Negative / costs**
- In-memory graph doesn't scale to a large graph or rich graph queries.
- Two code paths (CSV vs Neo4j) to keep behaviourally equivalent and tested.
- CSV is loaded per process — fine now, not a shared/persistent store.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Require Neo4j always | Kills zero-infra onboarding and simple CI; overkill at current scale |
| SQLite for the graph | Graph traversal is awkward in relational; CSV is simpler at this size |
| Hard-code the graph in Python | Not data-driven; loses the deterministic synthetic-data pipeline |
| Skip the graph (flat lookup) | Loses the relation/weight model the predictor's transparency depends on |
