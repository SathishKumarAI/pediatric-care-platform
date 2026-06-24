"""Central configuration. Everything env-switchable, sane local defaults.

No secrets in code. Copy `.env.example` -> `.env` to override.
"""
from __future__ import annotations

import os
from functools import lru_cache

from pydantic import BaseModel, Field


class Settings(BaseModel):
    # --- LLM provider (env-switchable, like the rag-project kit) ---
    provider: str = os.getenv("PROVIDER", "ollama")  # "ollama" | "claude"
    ollama_model: str = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    claude_model: str = os.getenv("CLAUDE_MODEL", "claude-opus-4-8")
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")

    # --- Knowledge graph (Neo4j) — optional; falls back to in-memory graph ---
    neo4j_uri: str = os.getenv("NEO4J_URI", "")
    neo4j_user: str = os.getenv("NEO4J_USER", "neo4j")
    neo4j_password: str = os.getenv("NEO4J_PASSWORD", "")

    # --- Relational store (FHIR-mapped records). SQLite local default. ---
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./data/pcp.db")

    # --- Auth enforcement (RBAC). Off for the open demo; production sets true. ---
    # default_factory so a cleared cache re-reads the env at instantiation (toggleable).
    require_auth: bool = Field(
        default_factory=lambda: os.getenv("REQUIRE_AUTH", "false").lower() in ("1", "true", "yes")
    )

    # --- Service ---
    app_name: str = "Pediatric Care Platform"
    cors_origins: list[str] = os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,tauri://localhost"
    ).split(",")
    # Synthetic dataset that backs the symptom predictor.
    symptom_dataset: str = os.getenv("SYMPTOM_DATASET", "data/symptom_disease.csv")

    @property
    def use_neo4j(self) -> bool:
        return bool(self.neo4j_uri)


@lru_cache
def get_settings() -> Settings:
    return Settings()
