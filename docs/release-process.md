# Release Process

> One version number for the whole platform (backend + web + desktop), released together. SemVer + Conventional Commits → Keep a Changelog. CI must be green before tagging.

## Versioning

| Rule | Detail |
|---|---|
| Scheme | [Semantic Versioning](https://semver.org) `MAJOR.MINOR.PATCH` (currently `0.1.0` — pre-1.0, minor bumps may break) |
| Commits | [Conventional Commits](https://www.conventionalcommits.org): `feat:` → minor, `fix:` → patch, `feat!:`/`BREAKING CHANGE` → major |
| Changelog | [Keep a Changelog](https://keepachangelog.com) — already followed in `CHANGELOG.md` (move items from `[Unreleased]` into the new version section) |

## Version bump locations

> All must match the release version. There is no single source of truth yet — update every one.

| File | Field |
|---|---|
| `pyproject.toml` | `version` |
| `app/__init__.py` | `__version__` (surfaced by `GET /health` and FastAPI title) |
| `web/package.json` | `version` |
| `web/src-tauri/tauri.conf.json` | `version` (drives installer/app version) |
| `CHANGELOG.md` | New `## [x.y.z] — YYYY-MM-DD` section |

## CI gates (must pass before release)

From `.github/workflows/ci.yml` — runs on push to `main` and PRs:

| Job | Steps | Why it gates release |
|---|---|---|
| `backend` | `generate_data.py` → `ruff check` → `pytest` → `python eval/run_eval.py` | Lint + tests + **prediction-accuracy eval** must pass — a worse model must not ship |
| `web` | `npm install` → `npm run build` | Static export must build clean |

Desktop installer builds on Linux/Windows/macOS runners are **planned** (not in CI today — build installers manually per `docs/deployment.md`).

## Release steps

```bash
# 1. Branch
git checkout -b release/x.y.z

# 2. Bump versions in the 4 files above; update CHANGELOG.md
#    (move [Unreleased] items into [x.y.z], add the date)

# 3. Verify locally
make lint && make test && make eval        # backend gates
cd web && npm run build && cd ..           # web gate

# 4. PR -> merge to main (CI must be green)

# 5. Tag the merge commit
git tag -a vx.y.z -m "Release x.y.z"
git push origin vx.y.z

# 6. Build desktop installers on each OS (see docs/deployment.md)
#    cd web && npm run tauri build
#    artifacts: web/src-tauri/target/release/bundle/<target>/

# 7. Create GitHub Release from the tag; attach installers; paste CHANGELOG section

# 8. Build & push backend image tagged to the version
docker build -t pcp-backend:x.y.z . && docker push <registry>/pcp-backend:x.y.z
```

## Artifacts per release

| Artifact | Source | Where it goes |
|---|---|---|
| Backend image | `docker build` | Container registry, tagged `:x.y.z` |
| Linux installers | `.AppImage`, `.deb` | GitHub Release assets |
| Windows installer | `.msi` | GitHub Release assets |
| macOS installer | `.dmg` | GitHub Release assets (signing/notarization **planned**) |
| Changelog entry | `CHANGELOG.md` | Release notes body |

## Release checklist

- [ ] All four version fields bumped and identical
- [ ] `CHANGELOG.md` updated: `[Unreleased]` items moved into `[x.y.z]` with date
- [ ] CI green on `main` (`backend` lint+test+eval, `web` build)
- [ ] Eval accuracy not regressed vs prior release
- [ ] Tag `vx.y.z` pushed
- [ ] Desktop installers built on Linux / Windows / macOS
- [ ] Backend image built & pushed, tagged to version
- [ ] GitHub Release created with notes + installer assets
- [ ] `GET /health` on the deployed backend reports the new `version`
- [ ] Rollback plan confirmed (previous image tag available — see `docs/deployment.md`)
