.PHONY: setup data dev test eval lint web desktop docker clean

setup:            ## create venv + install backend deps + generate data
	python -m venv .venv
	. .venv/bin/activate && pip install -r requirements-dev.txt
	. .venv/bin/activate && python scripts/generate_data.py

data:             ## (re)generate the synthetic symptom dataset
	. .venv/bin/activate && python scripts/generate_data.py

dev:              ## run the FastAPI backend (http://localhost:8000, docs at /docs)
	. .venv/bin/activate && uvicorn app.main:app --reload

test:             ## run backend tests
	. .venv/bin/activate && pytest

eval:             ## run the symptom-predictor accuracy eval
	. .venv/bin/activate && python eval/run_eval.py

lint:             ## ruff + mypy
	. .venv/bin/activate && ruff check app eval scripts tests && mypy app

web:              ## run the Next.js frontend in the browser (http://localhost:3000)
	cd web && npm install && npm run dev

desktop:          ## run the Tauri desktop app
	cd web && npm install && npm run tauri dev

docker:           ## run backend via docker-compose
	docker compose up --build

clean:
	rm -rf .venv web/node_modules web/.next web/out web/src-tauri/target
