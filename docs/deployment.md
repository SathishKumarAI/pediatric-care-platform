# Deployment

> Two deliverables ship independently: the **desktop app** (Tauri shell + static Next.js UI) and the **backend service** (FastAPI). The desktop app talks to the backend over HTTP. Decide *where the backend runs* (hosted vs bundled-as-sidecar) before you cut a release — it changes the whole topology.
>
> Synthetic data only. **Not a medical device.** Do not point this at real PHI without first implementing the controls in `app/security.py` (currently placeholders).

## The two deliverables at a glance

| Deliverable | What it is | Built by | Output | Runs on |
|---|---|---|---|---|
| Desktop app | Native window (Tauri v2) loading a static Next.js export | `npm run tauri build` | Per-OS installer | User's Linux / Windows / macOS |
| Backend service | FastAPI + uvicorn, port 8000 | `docker build` / Dockerfile | Container image | Any container host (or sidecar) |

## Topology: where does the backend live?

| Option | How | Why / when | Status |
|---|---|---|---|
| **Hosted backend** | Run the Docker image on a server; desktop apps point at its URL | Shared data, central updates, multiple clients | Supported today (in-memory store ⇒ data is per-process, not shared/persisted) |
| **Local backend, separate process** | User runs `make docker` or `uvicorn` on `localhost:8000`; desktop app connects | Dev, demos, single-machine use | Supported today |
| **Bundled sidecar** | Ship the FastAPI process *inside* the Tauri bundle as a [Tauri sidecar](https://tauri.app/develop/sidecar/) so the app is fully self-contained | Offline desktop product, no server to operate | **Planned** — not wired. Requires packaging a Python runtime (e.g. PyInstaller) + registering it in `tauri.conf.json` |

The desktop app's CSP already allows `connect-src` to `http://localhost:8000` / `127.0.0.1:8000` (`web/src-tauri/tauri.conf.json`). A hosted backend URL must be added there and to `CORS_ORIGINS`.

---

## (a) Desktop app

### Prerequisites
| Need | Why |
|---|---|
| Node 22+ / npm | Build the Next.js static export |
| Rust toolchain (`rustup`) + Tauri v2 system deps | Compile the native shell. Per-OS: `webkit2gtk`/`libgtk` (Linux), MSVC + WebView2 (Windows), Xcode CLT (macOS) — see [Tauri prerequisites](https://tauri.app/start/prerequisites/) |
| `@tauri-apps/cli` (dev dep) | Drives the build |

### How Tauri produces installers
`bundle.targets: "all"` in `tauri.conf.json` ⇒ Tauri emits every native installer the build host supports. **You must build on each target OS** (no cross-compile for installers).

| Host OS | Artifacts | Output dir (under `web/src-tauri/target/release/bundle/`) |
|---|---|---|
| Linux | `.AppImage`, `.deb` | `appimage/`, `deb/` |
| Windows | `.msi` (and/or `.exe` NSIS) | `msi/`, `nsis/` |
| macOS | `.app`, `.dmg` | `macos/`, `dmg/` |

### Build & release steps (per OS)
```bash
# from repo root
cd web
npm install
npm run build            # Next static export -> web/out  (beforeBuildCommand runs this too)
npm run tauri build      # compiles Rust shell, bundles installers
# artifacts in web/src-tauri/target/release/bundle/<target>/
```
Then attach the artifacts to a GitHub Release (see `docs/release-process.md`). CI builds installers on Linux/Windows/macOS runners — **planned** (current `web` CI job only runs `npm run build`).

### Local dev (not a release)
```bash
make desktop        # = cd web && npm install && npm run tauri dev
```
Loads `http://localhost:3000` live (`devUrl`), hot-reloads. Start the backend separately (`make dev`).

### Signing, notarization, auto-update — all PLANNED
| Item | Why it matters | Status |
|---|---|---|
| macOS notarization + Apple Developer signing | Gatekeeper blocks unsigned `.dmg` | Planned — needs Apple cert + `tauri.conf.json` signing config |
| Windows code signing | SmartScreen warns on unsigned `.msi` | Planned — needs Authenticode cert |
| Linux signing | AppImage GPG / repo signing | Planned |
| Auto-update | Ship patches without reinstall | Planned — `tauri-plugin-updater` + signed update manifest + an endpoint to host it |

Until signing lands, distribute installers with install instructions and expect OS security warnings.

---

## (b) Backend service

### Prerequisites
Python 3.12 (container uses `python:3.12-slim`) or Docker. No secrets required for the default `ollama` provider.

### Build & run (Docker)
```bash
docker build -t pcp-backend .
docker run -p 8000:8000 --env-file .env pcp-backend
# or:
make docker            # = docker compose up --build
```
The Dockerfile runs `scripts/generate_data.py` at build time, so the synthetic dataset is baked into the image (`data/symptom_disease.csv`). OpenAPI at `/docs`, health at `/health`.

### Local dev (no container)
```bash
make setup     # venv + deps + generate data  (first time)
make dev       # uvicorn app.main:app --reload -> localhost:8000
```

### Environment variables
| Var | Default | Purpose | Tag |
|---|---|---|---|
| `PROVIDER` | `ollama` | LLM backend: `ollama` (local, free) or `claude` | Core |
| `OLLAMA_MODEL` | `llama3.1:8b` | Model id when `PROVIDER=ollama` | Core |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama endpoint | Core |
| `CLAUDE_MODEL` | `claude-opus-4-8` | Model id when `PROVIDER=claude` | Growing |
| `ANTHROPIC_API_KEY` | — | **Required only when `PROVIDER=claude`** | Growing |
| `DATABASE_URL` | `sqlite:///./data/pcp.db` | Relational store target (in-memory store ignores this today) | Growing |
| `NEO4J_URI` | — | Enable Neo4j knowledge graph; falls back to in-memory when unset | Heavy |
| `NEO4J_USER` / `NEO4J_PASSWORD` | `neo4j` / — | Neo4j credentials | Heavy |
| `CORS_ORIGINS` | `http://localhost:3000,tauri://localhost` | Allowed browser/desktop origins — **add your hosted backend's client origins in prod** | Core |
| `SYMPTOM_DATASET` | `data/symptom_disease.csv` | Dataset path backing predictor + graph | Core |

> LLM failure never breaks the API — `app/providers.py` degrades to a templated explanation. So a missing/unreachable provider is non-fatal.

### Where it can run
Any container host: a VM with Docker, ECS/Fargate, Cloud Run, Fly.io, Kubernetes, etc. Stateless today (in-memory store) — horizontal scaling means **data is not shared between replicas**. Add a persistent store before scaling out (see `docs/disaster-recovery.md`).

### Production hardening (before real traffic)
| Concern | Today | Production target |
|---|---|---|
| TLS | none (HTTP) | Terminate TLS at a reverse proxy / load balancer |
| Auth | none | AuthN/AuthZ required before any PHI (see `app/security.py` TODOs) |
| Persistence | in-memory | Postgres + Neo4j |
| Secrets | `.env` file | Secret manager, never commit `.env` |

---

## Rollback

| Deliverable | Rollback |
|---|---|
| Backend | Redeploy the previous image tag (`docker run pcp-backend:<prev-tag>`). Stateless ⇒ instant, no data migration. Once persistence lands, also follow `docs/disaster-recovery.md`. |
| Desktop | Re-publish the previous release's installers; users reinstall. With auto-update (planned), point the update manifest back to the prior version. No client data migration today (no local persistence). |

Pin image tags to git tags/versions so rollback is unambiguous (see `docs/release-process.md`).
