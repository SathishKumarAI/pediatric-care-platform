"""Logging + lightweight in-process metrics (PCP-15).

Stdlib only. Real Prometheus/OTel export is a later swap; this gives request
timing logs, per-route counters, and a `/metrics` endpoint in Prometheus text
format so the shape is already right.
"""
from __future__ import annotations

import logging
import time
from collections import defaultdict

logger = logging.getLogger("pcp.request")


def configure_logging(level: str = "INFO") -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


class Metrics:
    """Per-route request counts, error counts, and summed latency."""

    def __init__(self) -> None:
        self.requests: dict[str, int] = defaultdict(int)
        self.errors: dict[str, int] = defaultdict(int)
        self.latency_ms: dict[str, float] = defaultdict(float)

    def record(self, method: str, route: str, status: int, dur_ms: float) -> None:
        key = f"{method} {route}"
        self.requests[key] += 1
        self.latency_ms[key] += dur_ms
        if status >= 500:
            self.errors[key] += 1

    def prometheus(self) -> str:
        lines = [
            "# HELP pcp_requests_total Total requests per route.",
            "# TYPE pcp_requests_total counter",
        ]
        for key, n in sorted(self.requests.items()):
            method, _, route = key.partition(" ")
            lines.append(f'pcp_requests_total{{method="{method}",route="{route}"}} {n}')
        lines += ["# HELP pcp_errors_total 5xx responses per route.",
                  "# TYPE pcp_errors_total counter"]
        for key, n in sorted(self.errors.items()):
            method, _, route = key.partition(" ")
            lines.append(f'pcp_errors_total{{method="{method}",route="{route}"}} {n}')
        lines += ["# HELP pcp_latency_ms_sum Summed response latency (ms) per route.",
                  "# TYPE pcp_latency_ms_sum counter"]
        for key, ms in sorted(self.latency_ms.items()):
            method, _, route = key.partition(" ")
            lines.append(f'pcp_latency_ms_sum{{method="{method}",route="{route}"}} {ms:.1f}')
        return "\n".join(lines) + "\n"


metrics = Metrics()


def now_ms() -> float:
    return time.perf_counter() * 1000
