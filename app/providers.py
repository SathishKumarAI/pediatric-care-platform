"""LLM provider abstraction — env-switchable, same pattern as the rag kit.

`PROVIDER=ollama` (default, free, no keys) or `PROVIDER=claude`.
Used to turn a structured prediction into a plain-language explanation.
Degrades gracefully to a templated string if no LLM is reachable.
"""
from __future__ import annotations

import httpx

from .config import Settings, get_settings


def explain(prompt: str, settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    try:
        if settings.provider == "claude":
            return _claude(prompt, settings)
        return _ollama(prompt, settings)
    except Exception:  # noqa: BLE001 — never let LLM failure break the API
        return _fallback(prompt)


def _ollama(prompt: str, s: Settings) -> str:
    r = httpx.post(
        f"{s.ollama_host}/api/generate",
        json={"model": s.ollama_model, "prompt": prompt, "stream": False},
        timeout=60,
    )
    r.raise_for_status()
    return r.json()["response"].strip()


def _claude(prompt: str, s: Settings) -> str:
    if not s.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY not set")
    r = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": s.anthropic_api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": s.claude_model,
            "max_tokens": 512,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=60,
    )
    r.raise_for_status()
    return r.json()["content"][0]["text"].strip()


def _fallback(prompt: str) -> str:
    return (
        "Based on the reported symptoms, the most likely conditions are listed "
        "above with their confidence. This is automated decision support only — "
        "please confirm with a pediatrician."
    )
