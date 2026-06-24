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
    # 2030-01-04 is a Friday — doc-1 works Mon/Wed/Fri.
    slot = {"patient_id": "p1", "doctor_id": "doc-1", "start": "2030-01-04T09:00:00Z"}
    assert client.post("/appointments", json=slot).status_code == 201
    dup = {**slot, "patient_id": "p2"}
    assert client.post("/appointments", json=dup).status_code == 409


def test_appointment_rejected_on_unavailable_day():
    # 2030-01-01 is a Tuesday — doc-1 does not work Tuesdays.
    r = client.post("/appointments", json={
        "patient_id": "p1", "doctor_id": "doc-1", "start": "2030-01-01T09:00:00Z",
    })
    assert r.status_code == 409
    assert "not available" in r.json()["detail"].lower()


def test_appointment_cancel_frees_slot():
    slot = {"patient_id": "p9", "doctor_id": "doc-1", "start": "2030-01-11T10:00:00Z"}  # Friday
    appt = client.post("/appointments", json=slot).json()
    cancelled = client.patch(f"/appointments/{appt['id']}", json={"status": "cancelled"})
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    # slot is free again
    assert client.post("/appointments", json=slot).status_code == 201


def test_appointment_reschedule_and_conflict():
    a = client.post("/appointments", json={
        "patient_id": "p10", "doctor_id": "doc-2", "start": "2030-01-08T09:00:00Z",  # Tuesday, doc-2 works Tue/Thu
    }).json()
    moved = client.patch(f"/appointments/{a['id']}", json={"start": "2030-01-10T09:00:00Z"})  # Thursday
    assert moved.status_code == 200
    assert moved.json()["start"].startswith("2030-01-10")
    # booking the now-vacated original slot works
    assert client.post("/appointments", json={
        "patient_id": "p11", "doctor_id": "doc-2", "start": "2030-01-08T09:00:00Z",
    }).status_code == 201


def test_appointment_update_unknown_404_and_empty_422():
    assert client.patch("/appointments/appt-nope", json={"status": "cancelled"}).status_code == 404
    assert client.patch("/appointments/appt-anything", json={}).status_code == 422


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


def test_patient_create_list_get_and_age():
    r = client.post("/patients", json={
        "name": "Baby Tan", "birth_date": "2025-06-24", "sex": "female",
    })
    assert r.status_code == 201
    pat = r.json()
    assert pat["id"].startswith("pat-")
    assert pat["age_months"] >= 0  # computed from birth_date
    assert any(p["id"] == pat["id"] for p in client.get("/patients").json())
    assert client.get(f"/patients/{pat['id']}").json()["name"] == "Baby Tan"


def test_patient_unknown_404():
    assert client.get("/patients/pat-nope").status_code == 404


def test_patient_missing_fields_422():
    assert client.post("/patients", json={"name": "No DOB"}).status_code == 422


def test_auth_signup_login_me_flow():
    s = client.post("/auth/signup", json={"email": "Parent@Example.com", "password": "s3cret!"})
    assert s.status_code == 201
    body = s.json()
    assert body["token"]
    assert body["user"]["email"] == "parent@example.com"  # normalized
    assert body["user"]["role"] == "guardian"  # default

    # duplicate email
    assert client.post("/auth/signup", json={"email": "parent@example.com", "password": "x123456"}).status_code == 409

    # login
    li = client.post("/auth/login", json={"email": "parent@example.com", "password": "s3cret!"})
    assert li.status_code == 200
    token = li.json()["token"]

    # wrong password
    assert client.post("/auth/login", json={"email": "parent@example.com", "password": "nope"}).status_code == 401

    # me with + without token
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200 and me.json()["email"] == "parent@example.com"
    assert client.get("/auth/me").status_code == 401
    assert client.get("/auth/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_auth_password_not_stored_plaintext():
    from app.services.auth import get_auth
    client.post("/auth/signup", json={"email": "hash@example.com", "password": "plaintextpw"})
    row = get_auth().conn.execute("SELECT password_hash FROM users WHERE email=?", ("hash@example.com",)).fetchone()
    assert "plaintextpw" not in row["password_hash"]
    assert "$" in row["password_hash"]  # salt$hash format


def test_auth_signup_validation_422():
    assert client.post("/auth/signup", json={"email": "a@b.co", "password": "short"}).status_code == 422


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
