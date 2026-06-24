"""End-to-end API tests covering both merged layers."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_graph_loaded():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["graph_loaded"] is True
    assert body["diseases"] >= 5


def test_predict_ranks_and_triages():
    r = client.post("/predict", json={
        "symptoms": ["fever", "cough", "difficulty breathing"],
        "age_months": 18, "explain": False,
    })
    assert r.status_code == 200
    body = r.json()
    assert body["predictions"]
    assert body["triage"] == "urgent"  # difficulty_breathing is a red flag
    assert 0 <= body["predictions"][0]["confidence"] <= 1


def test_predict_empty_symptoms_422():
    assert client.post("/predict", json={"symptoms": []}).status_code == 422


def test_graph_node_neighbors():
    r = client.get("/graph/croup")
    assert r.status_code == 200
    assert any(n["name"] == "cough" for n in r.json()["related"])


def test_graph_unknown_node_404():
    assert client.get("/graph/not_a_real_node").status_code == 404


def test_appointment_conflict():
    slot = {"patient_id": "p1", "doctor_id": "doc-1", "start": "2030-01-01T09:00:00Z"}
    assert client.post("/appointments", json=slot).status_code == 201
    dup = {**slot, "patient_id": "p2"}
    assert client.post("/appointments", json=dup).status_code == 409


def test_doctors_seeded():
    docs = client.get("/doctors").json()
    assert len(docs) >= 2


def test_stages_milestones_and_redflags():
    r = client.get("/stages/12")
    assert r.status_code == 200
    body = r.json()
    assert body["stage"] == "Toddler"
    assert body["expected"]
    assert body["red_flags"]


def test_stages_out_of_range_422():
    assert client.get("/stages/999").status_code == 422


def test_records_add_and_list_by_subject():
    rec = {
        "id": "rec-test-1", "subject": "patient-xyz",
        "recorded": "2026-06-24T10:00:00Z", "note": "First visit — mild cough",
        "attachments": [],
    }
    assert client.post("/records", json=rec).status_code == 201
    listed = client.get("/records/patient-xyz").json()
    assert any(r["id"] == "rec-test-1" for r in listed)
    assert all(r["subject"] == "patient-xyz" for r in listed)


def test_records_empty_for_unknown_subject():
    assert client.get("/records/nobody-here").json() == []


def test_persistence_survives_store_restart():
    """A record written to the SQLite store is still there after the in-process
    singleton is rebuilt (simulating a service restart)."""
    from app.services import store as store_mod

    rec = {
        "id": "rec-persist-1", "subject": "patient-persist",
        "recorded": "2026-06-24T11:00:00Z", "note": "persist me", "attachments": [],
    }
    assert client.post("/records", json=rec).status_code == 201
    # simulate a restart: drop the cached store so it reconnects to the same DB
    store_mod._STORE = None
    again = client.get("/records/patient-persist").json()
    assert any(r["id"] == "rec-persist-1" for r in again)
