# Operational Runbook

> Practical, command-level operations. For "what to build" see `docs/monitoring-observability.md`; for releases see `docs/release-process.md`. Synthetic data, not a medical device — operations are low-risk today.

## Services & ports

| Service | Start | URL | Notes |
|---|---|---|---|
| Backend (FastAPI) | `make dev` (dev) / `make docker` (container) | `http://localhost:8000`, docs `/docs`, health `/health` | uvicorn `app.main:app` |
| Web (Next.js dev) | `make web` | `http://localhost:3000` | live dev server |
| Desktop (Tauri) | `make desktop` | native window | loads web dev URL; start backend too |

## Common tasks

### Start / stop
```bash
make dev                     # backend dev (Ctrl-C to stop)
make docker                  # backend in container (docker compose up --build)
docker compose down          # stop container stack
make web                     # web dev server
make desktop                 # desktop app (Tauri dev)
```

### Regenerate synthetic data
```bash
python scripts/generate_data.py        # rewrites data/symptom_disease.csv (SEED=42, deterministic)
# restart backend so the in-memory graph reloads from the new CSV
```

### Switch LLM provider
```bash
# .env
PROVIDER=ollama                        # local, free, no key
# or:
PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-...           # required for claude
CLAUDE_MODEL=claude-opus-4-8
```
Restart backend. Confirm with `GET /health` → `"provider"`. Predictions work even if the provider is unreachable (templated fallback).

### Point at Neo4j (optional graph backend)
```bash
# .env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=...
```
Restart. Unset `NEO4J_URI` to fall back to the in-memory graph. (docker-compose has a commented `neo4j` service to uncomment.)

### Rotate keys / secrets
```bash
# 1. Issue new ANTHROPIC_API_KEY in the Anthropic console; revoke the old one.
# 2. Update .env (or your secret manager) — never commit it.
# 3. Restart backend so config reloads (get_settings is cached per-process).
```
Neo4j password: change in Neo4j, update `NEO4J_PASSWORD`, restart.

### Health check
```bash
curl -s localhost:8000/health
# {"status":"ok","version":"0.1.0","provider":"ollama","graph_loaded":true,"diseases":10}
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Backend unreachable | Not running / wrong port / crashed | `curl localhost:8000/health`; restart `make dev`; check logs in terminal/container |
| LLM timeout / slow `/predict` | Provider slow or down (60 s client timeout in `providers.py`) | Expected to **auto-fallback** to templated text — service stays up. Use `explain=false` for instant predictions. Verify Ollama/Claude reachable. |
| Explanation looks generic/templated | Provider unreachable → fallback engaged | Check `OLLAMA_HOST`/Ollama running, or `ANTHROPIC_API_KEY` set for `claude` |
| Graph empty (`graph_loaded:false`, `diseases:0`) | Dataset missing/empty | `python scripts/generate_data.py`, restart backend; check `SYMPTOM_DATASET` path |
| `409` on `POST /appointments` | Appointment overlaps an existing one (conflict detection) | Expected — choose a non-overlapping slot. Not an error to escalate. |
| `422` on `POST /predict` | No symptoms provided | Send a non-empty `symptoms` list |
| `422` on `GET /stages/{age_months}` | `age_months` out of supported range | Use a valid age in months |
| `404` on `GET /graph/{node}` | Node not a known symptom/disease | Use a node from the dataset (normalize spacing/underscores) |
| CORS error in browser/desktop | Origin not in `CORS_ORIGINS` | Add the origin (e.g. `tauri://localhost`, your prod web origin) and restart |
| Web can't reach API | Wrong API base URL, backend down, or CSP blocks it | Confirm backend up; check Tauri CSP `connect-src` allows the host (`tauri.conf.json`); check `web/.env.example` API URL |
| Lost appointments/records after restart | In-memory store — **not persisted** (by design today) | Expected. Re-enter, or wait for persistent store (planned, see CHANGELOG) |

## On-call basics

| Step | Action |
|---|---|
| 1. Confirm scope | `GET /health` — up? which provider? graph loaded? |
| 2. Triage | Is it a 5xx (real failure) or expected 4xx (`409`/`422`/`404`)? Only 5xx / unreachable is an incident. |
| 3. Common quick wins | Restart service; regenerate data if graph empty; switch `PROVIDER=ollama` if Claude key/billing issue |
| 4. Provider issues | Remember: LLM down ≠ outage. Predictions still work. Don't panic-page on fallback. |
| 5. Rollback | Redeploy previous image tag (stateless) — see `docs/deployment.md` |
| 6. Record | Note cause/fix; if recurring, file an issue (incident review process is **planned**) |
