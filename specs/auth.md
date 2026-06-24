# Feature Spec — Auth & Accounts

## Summary
Account signup/login with hashed passwords and bearer-token sessions, plus a
role on each user. Establishes identity; route-level enforcement (RBAC) is a
separate ticket (PCP-14).

## Problem / why
The app is currently open. Before any real data, users need accounts and the
system needs to know who is calling and in what role.

## Users & context
Guardians (default role), doctors, admins, researchers.

## Behaviour (acceptance criteria)
- WHEN signing up with a new email + password THEN create the user (password stored hashed, never plaintext) and return a session token + the user (no hash).
- WHEN signing up with an existing email THEN respond 409.
- WHEN logging in with correct credentials THEN return a token + user.
- WHEN logging in with a wrong password or unknown email THEN respond 401.
- WHEN calling `GET /auth/me` with a valid `Authorization: Bearer <token>` THEN return the current user.
- WHEN calling `GET /auth/me` without/with an invalid token THEN respond 401.
- WHEN signing up without a role THEN default to `guardian`.

## Rules / logic (the real logic)
- Passwords hashed with PBKDF2-HMAC-SHA256 (stdlib), per-user random salt, stored as `salt$hash`; verified in constant time.
- Tokens are opaque random strings mapped to a user in a `sessions` table; no secret-bearing JWT for now.
- Role is one of the `Role` enum values.

## Out of scope (for now)
- RBAC enforcement on clinical routes (PCP-14).
- Patient↔guardian ownership, OAuth/social login, password reset, email verification, refresh tokens, token expiry.

## Data touched
- Reads/Writes: `users`, `sessions` tables.
- Client: localStorage `pcp.token`.

## Edge cases
- Empty email/password → 422. · Duplicate email → 409. · Token for a deleted session → 401.

## Done when
- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` behave per acceptance criteria (backend tests).
- Login/signup page stores the token; the client sends it; the sidebar shows the logged-in user + logout.
