"""Accounts + sessions (PCP-8).

Stdlib-only: PBKDF2-HMAC-SHA256 password hashing + opaque random session tokens
stored in the `sessions` table. No external auth deps, no JWT secret to leak.
Route-level RBAC enforcement is a separate ticket (PCP-14).
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
import uuid
from datetime import UTC, datetime

from ..config import get_settings
from ..schemas import Role, UserPublic
from . import db

_ITERATIONS = 100_000


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITERATIONS)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(stored, hash_password(password, salt))


class AuthService:
    def __init__(self, path: str) -> None:
        self.conn = db.connect(path)

    def signup(self, email: str, password: str, role: Role) -> tuple[UserPublic, str]:
        email = email.strip().lower()
        exists = self.conn.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone()
        if exists:
            raise ValueError("Email already registered")
        uid = f"usr-{uuid.uuid4().hex[:8]}"
        self.conn.execute(
            "INSERT INTO users (id, email, password_hash, role, created) VALUES (?,?,?,?,?)",
            (uid, email, hash_password(password), role.value, datetime.now(UTC).isoformat()),
        )
        self.conn.commit()
        return UserPublic(id=uid, email=email, role=role), self._new_session(uid)

    def login(self, email: str, password: str) -> tuple[UserPublic, str]:
        email = email.strip().lower()
        r = self.conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if r is None or not verify_password(password, r["password_hash"]):
            raise ValueError("Invalid email or password")
        return UserPublic(id=r["id"], email=r["email"], role=r["role"]), self._new_session(r["id"])

    def _new_session(self, user_id: str) -> str:
        token = secrets.token_urlsafe(32)
        self.conn.execute(
            "INSERT INTO sessions (token, user_id, created) VALUES (?,?,?)",
            (token, user_id, datetime.now(UTC).isoformat()),
        )
        self.conn.commit()
        return token

    def user_for_token(self, token: str) -> UserPublic | None:
        r = self.conn.execute(
            "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token=?",
            (token,),
        ).fetchone()
        return UserPublic(id=r["id"], email=r["email"], role=r["role"]) if r else None

    def logout(self, token: str) -> None:
        self.conn.execute("DELETE FROM sessions WHERE token=?", (token,))
        self.conn.commit()


_AUTH: AuthService | None = None


def get_auth() -> AuthService:
    global _AUTH
    if _AUTH is None:
        url = get_settings().database_url
        path = db.sqlite_path(url) if url.startswith("sqlite:///") else ":memory:"
        _AUTH = AuthService(path)
    return _AUTH
