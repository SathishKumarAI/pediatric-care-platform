# ADR 0003 — Env-switchable LLM provider abstraction

**Status:** Accepted

## Context

The symptom checker offers **natural-language explanations** of its
predictions. This requires an LLM — but we have competing needs:

- **Local dev / zero cost / privacy** — run offline with no API key or spend.
- **Higher-quality prose** — use a hosted model when warranted.
- **Safety** — explanations are a *nice-to-have*; the app must never break if
  the LLM is unavailable. Predictions and triage come from the deterministic
  predictor, not the LLM.

Hard-coding one provider would force a cost/quality/privacy trade-off on
everyone and make the LLM a single point of failure.

## Decision

Put the LLM behind a **provider abstraction in `app/providers.py`**, selected by
the `PROVIDER` environment variable:

| `PROVIDER` | Model | Use |
|------------|-------|-----|
| `ollama` (**default**) | `llama3.1:8b`, local | Free, offline, private — default |
| `claude` | `claude-opus-4-8` (needs `ANTHROPIC_API_KEY`) | Higher-quality explanations |

The LLM is used for `explanation` text **only**. If the provider is unreachable
or unset, the call **degrades gracefully** — predictions, triage, and the
disclaimer are unaffected.

## Consequences

**Positive**
- Default works with zero infra/cost/keys (Ollama local).
- Switch to Claude with one env var when quality matters.
- LLM is never on the critical path — graceful degradation keeps the app up.
- Adding a third provider means one new adapter behind the same interface.

**Negative / costs**
- Two providers to test; explanation prose varies by provider.
- `claude` path needs a real key and incurs cost/network.
- Local Ollama needs the model pulled and the daemon running.

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Hard-code Claude | Cost + key required for all dev; not offline/private |
| Hard-code Ollama | Caps explanation quality; no hosted option |
| No LLM (template strings) | Loses the natural-language value the feature exists for |
| Make predictions LLM-driven | Breaks transparency/determinism — see [ADR 0004](0004-in-memory-knowledge-graph-fallback.md) and the predictor's model-agnostic, explainable interface |
