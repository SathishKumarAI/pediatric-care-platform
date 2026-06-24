"""SQLite connection + schema for the persistent store.

Stdlib only (sqlite3). Lists are stored as JSON text. This is the local /
single-node persistence layer; the same schema maps cleanly to Postgres later
(see docs/data-model.md).
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    available_days TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    start TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'booked'
);
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'guardian',
    created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    sex TEXT NOT NULL DEFAULT 'unknown',
    guardian_name TEXT
);
CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    recorded TEXT NOT NULL,
    note TEXT NOT NULL,
    attachments TEXT NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_start ON appointments(doctor_id, start);
CREATE INDEX IF NOT EXISTS idx_records_subject ON records(subject);
"""


def sqlite_path(database_url: str) -> str:
    """Extract a filesystem path from a sqlite URL (sqlite:///./data/pcp.db)."""
    return database_url.removeprefix("sqlite:///")


def connect(path: str) -> sqlite3.Connection:
    if path not in (":memory:", ""):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    conn.commit()
    return conn
