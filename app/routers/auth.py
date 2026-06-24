"""Auth endpoints (PCP-8): signup, login, me, logout.

`get_current_user` is a reusable dependency other routers can adopt for RBAC
in PCP-14.
"""
from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from ..schemas import AuthToken, LoginRequest, UserCreate, UserPublic
from ..services.auth import get_auth

router = APIRouter(prefix="/auth", tags=["auth"])


def _bearer(authorization: str | None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def get_current_user(authorization: str | None = Header(default=None)) -> UserPublic:
    token = _bearer(authorization)
    user = get_auth().user_for_token(token) if token else None
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post("/signup", response_model=AuthToken, status_code=201)
def signup(data: UserCreate) -> AuthToken:
    try:
        user, token = get_auth().signup(data.email, data.password, data.role)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    return AuthToken(token=token, user=user)


@router.post("/login", response_model=AuthToken)
def login(data: LoginRequest) -> AuthToken:
    try:
        user, token = get_auth().login(data.email, data.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e
    return AuthToken(token=token, user=user)


@router.get("/me", response_model=UserPublic)
def me(authorization: str | None = Header(default=None)) -> UserPublic:
    return get_current_user(authorization)


@router.post("/logout", status_code=204)
def logout(authorization: str | None = Header(default=None)) -> None:
    token = _bearer(authorization)
    if token:
        get_auth().logout(token)
