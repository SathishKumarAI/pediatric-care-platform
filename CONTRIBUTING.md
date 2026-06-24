# Contributing

Thanks for contributing. This is a synthetic-data prototype — never commit real PHI or secrets. Read the [Security & disclaimer](README.md#security--disclaimer) section first.

## Dev setup

**Backend**
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
python scripts/generate_data.py
uvicorn app.main:app --reload        # http://localhost:8000, docs at /docs
```

**Frontend**
```bash
cd web && npm install && npm run dev   # http://localhost:3000
```

**Desktop**
```bash
cd web && npm run tauri dev
```

`Makefile` targets wrap the common flows — check it before scripting anything by hand.

## Tests, lint, types

| Task | Command |
|------|---------|
| Run tests | `pytest` |
| Run one test | `pytest tests/test_predict.py::test_urgent_triage` |
| Lint | `ruff check .` |
| Auto-fix lint | `ruff check --fix .` |
| Format | `ruff format .` |
| Type-check | `mypy app` |
| Pre-commit (all hooks) | `pre-commit run --all-files` |

Install the git hooks once so checks run on every commit:
```bash
pre-commit install
```

CI mirrors these (see `.github/`). A PR must pass `ruff`, `mypy`, and `pytest` to merge.

## Conventions

- **Python**: 3.12, Pydantic 2, typed throughout (`mypy` clean). Business logic lives in `app/services/`; routers stay thin. New data sources go behind the repository interface in `store.py`; new LLM backends behind the provider abstraction in `providers.py`.
- **TypeScript**: all backend calls go through `web/lib/api.ts` — keep it the single typed client; don't `fetch` the API directly from pages.
- **Tests**: add a `pytest` test for every new endpoint and every behavior change. Keep fixtures synthetic.
- **No secrets, no real PHI** in code, tests, fixtures, or commits.

## Branches & PRs

- Branch off `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`, `chore/<short-name>`.
- One logical change per PR; keep diffs focused.
- PR description: what changed, why, how it was tested. Link any related issue.
- Update `CHANGELOG.md` (under `[Unreleased]`) and `FEATURES.md` when behavior or feature status changes.
- All checks green before requesting review.

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`.

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`, `build`, `ci`.

```
feat(predict): escalate triage to urgent on seizure red-flag
fix(appointments): return 409 when slots overlap exactly at the boundary
docs(readme): add desktop quick-start
```

Subject in the imperative mood, ≤ 72 chars, no trailing period. Add a body only when the *why* isn't obvious from the subject.
