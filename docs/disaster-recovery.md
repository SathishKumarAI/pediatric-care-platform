# Disaster Recovery & Backup

> **Today there is almost nothing to lose.** State is in-memory (`app/services/store.py`) and the dataset is deterministically regenerable (`scripts/generate_data.py`, fixed `SEED=42`). DR is therefore *trivial now* and *gets real once persistence lands*. This doc covers both.
>
> Synthetic data only — no real PHI, so no regulatory recovery obligations yet. That changes the moment real records are accepted; revisit RPO/RTO and add encrypted backups then.

## What state exists

| State | Where | Persisted? | Recoverable by |
|---|---|---|---|
| Synthetic symptom dataset | `data/symptom_disease.csv` | On disk / baked into Docker image | **Regenerate** — `python scripts/generate_data.py` (deterministic) |
| Knowledge graph | In-memory, built from the CSV at startup (`knowledge_graph.py`) | No | Rebuilt automatically on restart from the CSV |
| Doctors / appointments / records | In-memory `Store` (seeded at startup) | **No — lost on restart** | Re-seeded fresh; user-entered data is **not** durable today |
| Relational DB (`DATABASE_URL`) | SQLite path configured but store is in-memory | Not used yet | n/a |
| Neo4j graph (optional) | External Neo4j if `NEO4J_URI` set | Yes (in Neo4j) | Neo4j backup/restore |
| Desktop client data | none (no local persistence) | No | n/a |

## Backup strategy

| Asset | Now | When persistence lands (planned) |
|---|---|---|
| Records DB (SQLite→Postgres) | Nothing to back up (in-memory) | Daily automated dump (`pg_dump` / SQLite file copy), retained ≥30 days, stored off-host (encrypted) |
| Knowledge graph (Neo4j) | Regenerate from CSV; or rely on Neo4j if used | `neo4j-admin database dump` on a schedule; or treat as derived and rebuild from CSV |
| Synthetic dataset | Not backed up — **regenerate** | Same (derived artifact, never back up generated data) |
| Config / secrets | `.env` (git-ignored) | Store in a secret manager; back up the *config inventory*, not the secrets |

> Rule: **never back up derived/regenerable data.** The CSV and the in-memory graph are derived from `generate_data.py` + the CSV — recreate, don't restore.

## RPO / RTO targets

| Phase | RPO (max data loss) | RTO (max downtime) | Rationale |
|---|---|---|---|
| Today (in-memory, synthetic) | N/A — no durable data | Minutes — restart container, dataset rebuilds | Nothing to lose; recovery = restart |
| With persistent records (planned) | ≤ 24 h (daily backup) — tighten to ≤ 1 h with WAL/streaming for real PHI | ≤ 1 h to restore service | Health records warrant low loss tolerance |

## Restore procedures

### Today — full service rebuild
```bash
# Backend from scratch
docker build -t pcp-backend .     # regenerates data/ at build time
docker run -p 8000:8000 pcp-backend
# or locally:
python scripts/generate_data.py   # rebuild dataset
make dev                          # graph rebuilds in-memory on startup
```
Verify: `GET /health` → `graph_loaded: true`, `diseases: 10`.

### Regenerate the dataset (deterministic)
```bash
python scripts/generate_data.py            # default 80 rows/disease, SEED=42
python scripts/generate_data.py 200        # optional: rows per disease
```
Same seed ⇒ byte-identical CSV ⇒ identical graph and eval results. This is the canonical recovery path for all derived state.

### With persistence (planned)
1. Provision fresh DB / Neo4j.
2. Restore latest dump (`pg_restore` / `neo4j-admin database load`).
3. Set `DATABASE_URL` / `NEO4J_URI` in env.
4. Start backend; confirm `/health` and a record read (`GET /records/{subject}`).
5. Knowledge graph rebuilds from CSV automatically (or restore Neo4j).

## Dependency: LLM provider availability

| Scenario | Behaviour | DR action |
|---|---|---|
| Ollama / Claude unreachable, timeout, or `429` | **Already handled** — `app/providers.py` catches all errors and returns a templated explanation; the API stays up | None — degradation is by design |
| `ANTHROPIC_API_KEY` missing with `PROVIDER=claude` | Raises internally → caught → fallback explanation | Set key, or switch `PROVIDER=ollama` |
| Want predictions without any LLM | Call `POST /predict` with `explain=false` | No provider needed; predictor is fully local |

> Core prediction/triage logic does **not** depend on any external service. Only the plain-language *explanation* uses the LLM, and that path degrades gracefully. The platform never goes down because a provider is down.

## Desktop-client considerations
- No local data persistence today → nothing to recover on the client; reinstalling the app is a complete "restore."
- The desktop app is a thin shell over the backend API; its disaster posture is **"can it reach a healthy backend?"** — so backend DR is the real concern.
- If a future bundled-sidecar build (see `docs/deployment.md`) gives the desktop app its own local DB, add per-machine backup/export to this doc.
