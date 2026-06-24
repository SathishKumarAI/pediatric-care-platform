# Feature Backlog — Prototype → Production

**Purpose:** the exhaustive, granular inventory of *every* feature (including small ones) needed to take this from prototype to a production pediatric care platform.

**Legend**
- **Priority:** `Core` (must-have) · `Growing` (strong value, fast-follow) · `Heavy` (large/expensive, deferred)
- **Status:** `done` (built + tested) · `stub` (scaffold/hook present, not implemented) · `planned` (not started)
- **Origin:** `MR` = Medical-Research · `PED` = Pediatrics · `NEW` = added in the merged platform

> Accuracy note: only items marked `done`/`stub` exist in code today; everything else is `planned`.

---

## MVP vs production gap (summary)

| Domain | Done today | Biggest production gap |
|--------|-----------|------------------------|
| Auth & accounts | nothing (no login) | entire identity layer — signup, login, roles, sessions |
| Symptom checker | `/predict` rule-based + triage + explanation | free-text NLP, history, save-to-record, calibration |
| Knowledge graph | in-memory CSV + `/graph/{node}` (Neo4j path optional) | Neo4j load, admin UI, disease/treatment content |
| AI/ML | transparent weighted-overlap predictor + eval harness | real trained model, versioning, eval dashboard, feedback loop |
| Appointments | book + list + 409 conflict | cancel/reschedule, availability, reminders, calendar |
| Doctors | seeded list | profiles, search/filter, schedules, ratings |
| Medical records | add/list (FHIR-style fields) | persistence, attachments, FHIR I/O, timeline, sharing |
| Growth stages | milestones + red flags by age | per-child tracking, percentile charts, vaccinations |
| Persistence | in-memory store (repository pattern) | Postgres + migrations |
| Compliance | hooks only (`app/security.py`) | consent, encryption, audit, RBAC, retention, erasure |
| Notifications / messaging / payments | none | all planned |
| Platform (i18n, a11y, offline, telemetry) | none | all planned |

---

## 1. Auth & accounts

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Signup | Create account (email + password) | NEW | Core | planned | persistence |
| Login | Credential auth, issue session/token | NEW | Core | planned | signup |
| Logout | End session | NEW | Core | planned | login |
| Session management | Token issue/refresh/expiry | NEW | Core | planned | login |
| Password reset | Email-based reset flow | NEW | Core | planned | email, login |
| Email verification | Confirm address on signup | NEW | Core | planned | email |
| Role model | patient / guardian / doctor / admin / researcher | NEW | Core | stub | persistence |
| RBAC enforcement | Gate endpoints/pages by role | MR | Core | stub | role model |
| OAuth / SSO | Google/Apple sign-in | NEW | Growing | planned | login |
| Account deletion | Self-service delete (GDPR-aligned) | MR | Growing | planned | login, erasure |
| Profile management | Edit name, contact, password | NEW | Growing | planned | login |
| Multi-child / dependents under one guardian | Link children to a guardian account | PED | Growing | planned | role model |
| MFA / 2FA | Second factor at login | NEW | Heavy | planned | login |

## 2. Symptom checker

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Symptom-overlap prediction | Weighted overlap over knowledge graph → ranked diseases | MR | Core | done | knowledge graph |
| Triage classification | self-care / see-doctor / urgent | MR | Core | done | prediction |
| Red-flag escalation | Force `urgent` on danger symptoms | MR | Core | done | triage |
| Matched-symptoms transparency | Show which symptoms drove each prediction | MR | Core | done | prediction |
| Plain-language explanation | LLM-generated; graceful no-LLM fallback | MR | Core | done | provider abstraction |
| Disclaimer on every result | "Decision support, not diagnosis" | MR | Core | done | — |
| Age-aware weighting | Optional `age_months` informs results | MR | Growing | done (basic) | prediction |
| Structured symptom picker | Select from known symptom list | NEW | Core | planned | web UI |
| Symptom search / autocomplete | Type-ahead over symptom vocabulary | NEW | Growing | planned | symptom list |
| Free-text NLP entry | Parse natural-language complaints into symptoms | MR | Growing | planned | NLP model |
| Severity / duration inputs | Capture how bad / how long | NEW | Growing | planned | symptom picker |
| Check history | Past checks per user/child | NEW | Growing | planned | persistence, auth |
| Save check to record | Persist result into medical record | NEW | Growing | planned | records, persistence |
| Confidence calibration | Calibrate scores to real likelihoods | MR | Heavy | planned | real model, eval |
| Body-map UI | Tap body region to add symptoms | NEW | Heavy | planned | symptom picker |
| Multi-language symptom entry | Localized symptom vocabulary | NEW | Heavy | planned | i18n |

## 3. Knowledge graph

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| In-memory graph from CSV | Load `data/symptom_disease.csv` | MR | Core | done | — |
| Neighbor query API | `GET /graph/{node}` → related nodes + weights | MR | Core | done | graph load |
| HAS_SYMPTOM / INDICATES relations | Typed symptom↔disease edges | MR | Core | done | graph load |
| Neo4j backend | Activate when `NEO4J_URI` set; CSV fallback | MR | Growing | stub (optional path) | — |
| Relationship-weight editor | Admin UI to tune edge weights | NEW | Growing | planned | graph admin, RBAC |
| Graph admin UI | Browse/add/edit nodes & edges | NEW | Growing | planned | admin dashboard |
| Disease info pages | Human-readable disease detail | MR | Growing | planned | content |
| Treatment links | Link diseases to guidance/treatment refs | MR | Heavy | planned | content, compliance |

## 4. AI / ML

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Model-agnostic predictor interface | Swap implementations without API change | MR | Core | done | — |
| Synthetic data pipeline | Generate `symptom_disease.csv` (10 diseases) | MR | Core | done | — |
| Eval harness | `make eval` accuracy run | MR | Core | done (baseline) | dataset |
| Provider abstraction (ollama/claude) | `PROVIDER` env switch; explanations only | MR | Core | done | — |
| Real trained model (GNN) | Replace rule-based behind interface | MR | Heavy | planned | dataset, eval |
| Model versioning | Track/serve model versions | NEW | Growing | planned | real model |
| Eval dashboard | Visualize accuracy/metrics over time | NEW | Growing | planned | eval harness |
| Explainability surface | Expose feature/edge attributions in UI | MR | Growing | planned | real model |
| AI guardrails / disclaimers review | Safety review of generated text | MR | Core | planned | — |
| Feedback loop | Capture user "was this helpful" → improve | NEW | Growing | planned | auth, persistence |
| RAG over clinical guidelines | Vector DB (Chroma) reserved, not wired | MR | Heavy | planned | content |

## 5. Appointments

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Book appointment | `POST /appointments` → 201 | PED | Core | done | doctors, store |
| Conflict detection | Overlapping slot → 409 | PED | Core | done | book |
| List appointments | `GET /appointments?patient_id=` | PED | Core | done | store |
| Appointment status model | booked / cancelled / fulfilled | PED | Core | done (schema) | — |
| Cancel appointment | Set status cancelled | PED | Core | planned | persistence |
| Reschedule appointment | Move to new slot w/ conflict check | PED | Core | planned | book |
| Doctor availability / working hours | Bookable windows per doctor | PED | Core | planned | doctor schedules |
| Calendar view | Visual schedule (day/week) | NEW | Growing | planned | web UI |
| Appointment reminders | Notify before visit | NEW | Growing | planned | notifications |
| Recurring appointments | Repeat series | NEW | Growing | planned | book |
| Waitlist | Queue for full slots | NEW | Growing | planned | availability |
| Telehealth / video visit | In-app video appointment | NEW | Heavy | planned | media infra, compliance |

## 6. Doctors

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Doctors directory | `GET /doctors` (seeded) | PED | Core | done | store |
| Doctor profiles | Bio, specialty, photo, credentials | PED | Growing | planned | persistence |
| Search / filter by specialty | Find doctors by criteria | NEW | Growing | planned | profiles |
| Schedule management | Doctor sets own availability | PED | Core | planned | availability |
| Ratings / reviews | Patient feedback on doctors | NEW | Heavy | planned | auth, persistence |

## 7. Medical records

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Add record | `POST /records` → 201 | PED | Core | done | store |
| List records by subject | `GET /records/{subject}` (FHIR-style) | PED | Core | done | store |
| Persisted records | Survive restart | PED | Core | planned | persistence |
| Attachments / file upload | Lab results, images, docs | PED | Growing | planned | storage, persistence |
| Timeline view | Chronological record feed | NEW | Growing | planned | persistence, web UI |
| FHIR import/export | Interop with EHR systems | MR | Growing | planned | persistence |
| Sharing / consent controls | Share record w/ consent | MR | Heavy | planned | consent, RBAC |
| Growth charts in record | Embed percentile charts | PED | Growing | planned | growth tracking |
| Immunization tracker | Vaccine history per child | PED | Growing | planned | persistence |
| Prescriptions | Record/manage prescriptions | PED | Heavy | planned | persistence, compliance |

## 8. Growth stages

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Stage + milestones by age | `GET /stages/{age_months}` (motor/language/social/cognitive) | PED+MR | Core | done | — |
| Red flags by stage | Warning signs per age | PED | Core | done | stages |
| Milestone timeline chart | SVG timeline of milestones by age + now-marker (PCP-11) | NEW | Growing | done | stages |
| Per-child growth tracking | Track each child over time | PED | Core | planned | persistence, auth |
| Percentile charts (PCP-18) | Height/weight/head-circ percentiles | PED | Growing | planned | measurements + reference data |
| ↳ Measurement capture | Add height/weight/head-circ to a child over time | NEW | Growing | planned | per-child tracking |
| ↳ WHO/CDC reference curves | Bundle WHO 0–24mo + CDC 2–20y LMS percentile tables; plot child vs P3–P97 | NEW | Growing | planned | measurement capture |
| Milestone check-off | Mark milestones achieved | NEW | Growing | planned | per-child tracking |
| Vaccination schedule | Recommended schedule + reminders | PED | Growing | planned | immunization tracker |

## 9. Notifications

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| In-app notifications | Notification center | NEW | Growing | planned | auth |
| Email notifications | Transactional email | NEW | Core | planned | auth |
| Push notifications | Desktop push | NEW | Growing | planned | desktop shell |
| SMS notifications | Text alerts | NEW | Heavy | planned | provider integration |

## 10. Messaging / chat

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Doctor–patient messaging | Secure threaded messages | NEW | Heavy | planned | auth, compliance |
| Message attachments | Send files in chat | NEW | Heavy | planned | storage, messaging |

## 11. Payments

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Checkout | Pay for visits/services | NEW | Heavy | planned | auth, payment provider |
| Invoices | Generate/view invoices | NEW | Heavy | planned | checkout |
| Insurance | Capture/verify insurance | NEW | Heavy | planned | checkout |

## 12. Platform & cross-cutting

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Persistent store (Postgres) | Repository pattern → SQLite/Postgres via `DATABASE_URL` | PED | Core | stub | — |
| DB migrations | Alembic schema migrations | NEW | Core | planned | persistence |
| Global search | Search across doctors/records/appointments | NEW | Growing | planned | persistence |
| Settings / preferences | Per-user app settings | NEW | Growing | planned | auth |
| Theming / dark mode | Catppuccin Mocha; light/dark toggle | NEW | Growing | planned | web UI |
| Offline support (desktop) | Core flows work offline | NEW | Growing | planned | persistence |
| Data export | Export own data (portability) | MR | Growing | planned | persistence |
| Onboarding / welcome | First-run guided setup | NEW | Growing | planned | auth |
| Help / FAQ | In-app help center | NEW | Growing | planned | — |
| Accessibility (WCAG) | Keyboard nav, ARIA, contrast | NEW | Core | planned | web UI |
| i18n / localization | Multi-language UI | NEW | Heavy | planned | — |
| Health / readiness endpoint | `GET /health` (provider, graph loaded) | NEW | Core | done | — |
| Typed API client | `web/lib/api.ts` in sync with schemas | NEW | Core | done | — |
| Tauri v2 desktop shell | Wraps static export | NEW | Core | done | — |
| Signed desktop installers | Linux/macOS/Windows builds | NEW | Growing | planned | desktop shell |
| CI pipeline | Run tests/lint/eval on PR | NEW | Core | planned | — |

## 13. Compliance, security & observability

| Feature | Description | Origin | Priority | Status | Depends on |
|---------|-------------|--------|----------|--------|------------|
| Audit log | Append-only access trail (`record_access`) | MR | Core | stub | persistence |
| Consent capture | Record patient/guardian consent | MR | Core | planned | auth, persistence |
| Field-level encryption | Encrypt PHI at rest | MR | Core | planned | persistence |
| Data-retention policy | Auto-expire per policy | MR | Core | planned | persistence |
| Right-to-erasure (GDPR) | Delete all user data on request | MR | Core | planned | account deletion |
| RBAC enforcement | Role-gated access control | MR | Core | stub | role model |
| Structured logging | Observability hooks (`observability.py`) | NEW | Growing | done (basic) | — |
| Error reporting | Capture/report runtime errors | NEW | Core | planned | — |
| Analytics / telemetry | Privacy-respecting usage metrics | NEW | Growing | planned | — |
| Secrets handling | No secrets/PHI committed; env-based config | MR | Core | done (policy) | — |
