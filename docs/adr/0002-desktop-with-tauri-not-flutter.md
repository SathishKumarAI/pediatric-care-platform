# ADR 0002 — Desktop app with Tauri v2, not Flutter mobile

**Status:** Accepted

## Context

The Pediatrics parent shipped as a **Flutter mobile app**. The merged product's
target is a **clinician/parent desktop workstation experience**, not a phone app.
We also wanted one frontend skill set shared with the web stack and a typed
client that stays in lockstep with the FastAPI contract (`app/schemas.py`).

Options had to deliver: desktop distribution, web reuse, a single typed API
client, and small footprint — without committing to mobile or a heavyweight
runtime.

## Decision

Build the frontend as **Next.js 15 / React 19 / Tailwind 4 / TypeScript**, and
wrap it as a desktop app with **Tauri v2** (`web/src-tauri/`). Drop the Flutter
mobile app entirely; mobile is out of scope.

The same web codebase serves both the browser dev experience (`make web`) and
the packaged desktop shell (`make desktop`), with one typed client
(`web/lib/api.ts`).

## Consequences

**Positive**
- One codebase, one language (TS/React) for web and desktop.
- Tauri's Rust core + system WebView yields a far smaller binary than Electron.
- Typed React client mirrors the Pydantic API contract directly.
- Aligns with the rest of the stack and team skills.

**Negative / costs**
- Loses the existing Flutter screens (rebuilt as Next.js pages).
- WebView behaviour varies across OSes — cross-platform QA needed.
- No mobile target; if mobile returns it's a separate decision.
- Tauri's Rust toolchain is an extra build dependency.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep Flutter mobile | Wrong target (desktop), separate stack from web, no API-client reuse |
| Electron | Much larger footprint; bundles Chromium; heavier than Tauri |
| PWA only (no native shell) | Weaker desktop integration/distribution than Tauri |
| Flutter desktop | Still a separate language/stack from the web frontend; less web reuse |
