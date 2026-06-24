# Documentation Catalog

Every doc for the Pediatric Care Platform, grouped by job and priority tier.
**Tiers:** **Core** (needed even solo, heading to prod) · **Growing** (real users / a team) · **Heavy** (regulated / high-stakes — this is a *pediatric health* app, so these matter).

> Read order for a new contributor: [`../README.md`](../README.md) → [`../CLAUDE.md`](../CLAUDE.md) → [`architecture.md`](architecture.md) → [`../GLOSSARY.md`](../GLOSSARY.md) → the spec for your feature.

## Steer the agent / contributor
| Doc | What it's for | Tier |
|---|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Persistent agent memory: stack, conventions, safety, commands | Core |
| [`../GLOSSARY.md`](../GLOSSARY.md) | Domain terms (triage, KG relations, FHIR subject, milestones) | Core |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Dev setup, tests, lint, branch/PR + commit conventions | Core |

## Define the work
| Doc | What it's for | Tier |
|---|---|---|
| [`PRD.md`](PRD.md) | Product requirements: vision, personas, journeys, scope, metrics | Growing |
| [`roadmap.md`](roadmap.md) | Phased path v0.1 → v1.0 with exit criteria | Core |
| [`feature-backlog.md`](feature-backlog.md) | Exhaustive granular feature inventory (origin/priority/status) | Core |
| [`original-repo-parity.md`](original-repo-parity.md) | Full field + feature parity vs the original Pediatrics/Medical-Research repos | Core |
| [`ui-ux-spec.md`](ui-ux-spec.md) | Design system, screen + component inventory, UX flows, a11y, UI backlog | Core |
| [`merge-rationale.md`](merge-rationale.md) | Why/how the two parent projects were merged | Core |
| [`adr/`](adr/) | Architecture Decision Records (the 4 hard choices) | Growing |
| [`../specs/`](../specs/) | One Feature Spec per feature (behaviour + acceptance criteria) | Core |

### Feature specs
| Spec | Feature |
|---|---|
| [`../specs/symptom-checker.md`](../specs/symptom-checker.md) | AI symptom checker + triage |
| [`../specs/knowledge-graph.md`](../specs/knowledge-graph.md) | Symptom↔disease knowledge graph |
| [`../specs/appointments.md`](../specs/appointments.md) | Booking + conflict detection |
| [`../specs/doctors.md`](../specs/doctors.md) | Doctor directory |
| [`../specs/medical-records.md`](../specs/medical-records.md) | Patient records |
| [`../specs/growth-stages.md`](../specs/growth-stages.md) | Developmental milestones + red flags |

### ADRs
| ADR | Decision |
|---|---|
| [`adr/0001`](adr/0001-merge-medical-research-and-pediatrics.md) | Merge the two projects into one product |
| [`adr/0002`](adr/0002-desktop-with-tauri-not-flutter.md) | Desktop via Tauri, not the old Flutter mobile app |
| [`adr/0003`](adr/0003-llm-provider-abstraction.md) | Env-switchable LLM provider (Ollama/Claude) |
| [`adr/0004`](adr/0004-in-memory-knowledge-graph-fallback.md) | In-memory KG fallback, Neo4j optional |

## Make "done" measurable
| Doc | What it's for | Tier |
|---|---|---|
| [`architecture.md`](architecture.md) | System design, data flow, swap-in guides | Core |
| [`data-model.md`](data-model.md) | Entities, FHIR mapping, persistence roadmap (ER diagram) | Core |
| [`api-reference.md`](api-reference.md) | Full REST reference + curl examples | Core |
| [`test-strategy.md`](test-strategy.md) | Test pyramid, current vs target coverage, prod gates | Core |
| [`definition-of-done.md`](definition-of-done.md) | Tiered DoD checklist (evidence required) | Core |

## Enforce safety (Heavy — pediatric health data)
| Doc | What it's for | Tier |
|---|---|---|
| [`../SECURITY.md`](../SECURITY.md) | Security policy, vuln reporting, secrets policy | Growing |
| [`threat-model.md`](threat-model.md) | STRIDE model, attack surface, abuse cases | Heavy |
| [`privacy-compliance.md`](privacy-compliance.md) | HIPAA / GDPR / COPPA control matrix + gaps | Heavy |
| [`incident-response.md`](incident-response.md) | SEV classification + NIST IR runbook | Heavy |

## Operate it
| Doc | What it's for | Tier |
|---|---|---|
| [`deployment.md`](deployment.md) | Build/release: desktop installers + backend container | Growing |
| [`release-process.md`](release-process.md) | SemVer, version-bump locations, CI gates, checklist | Growing |
| [`runbook.md`](runbook.md) | Day-2 ops + troubleshooting table | Growing |
| [`monitoring-observability.md`](monitoring-observability.md) | Current vs target logging/metrics/SLOs | Growing |
| [`disaster-recovery.md`](disaster-recovery.md) | Backup, RPO/RTO, restore | Heavy |
| [`accessibility.md`](accessibility.md) | WCAG 2.1 AA target + current gaps | Growing |

---
⚠️ **Reminder:** decision-support prototype on **synthetic data** — not a medical device, not for diagnosis. The Heavy-tier controls above are **prerequisites before any real patient data**.
