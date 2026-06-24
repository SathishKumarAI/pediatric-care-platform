# Incident Response Runbook

> **Scope note:** Today the app holds **synthetic data only**, so a "breach" of current data is not a reportable PHI event. This runbook exists so the process is **ready before real pediatric PHI** is handled. The moment real data is accepted, the breach-notification timers below become legal obligations. Lifecycle follows **NIST SP 800-61**.

## Severity classification (health app)

| Sev | Definition | Examples | First response |
|-----|-----------|----------|----------------|
| **SEV1** | Confirmed/likely exposure of **real PHI** (esp. child data), or active attacker, or safety-affecting integrity loss | PHI exfiltration; KG tampered so red-flags don't escalate to "urgent"; ransomware | Page on-call **now**; start breach timers; engage privacy/legal |
| **SEV2** | High risk, not yet confirmed exposure; major availability loss | Auth bypass found in prod; leaked `ANTHROPIC_API_KEY`; backend down | On-call within 30 min; contain |
| **SEV3** | Limited/internal-only impact; synthetic-data exposure | Synthetic records leaked; vuln with no prod data path | Next business day; ticket |
| **SEV4** | Low / informational | Dependency CVE not exploitable here; minor misconfig | Backlog; fix in normal cycle |

**Pediatric escalator:** anything involving a real child's identifiable data is **minimum SEV2**, treated as SEV1 until proven otherwise (COPPA + heightened sensitivity).

## Roles

| Role | Owns | Default |
|------|------|---------|
| **Incident Commander (IC)** | Decisions, coordination, declaring sev | Sathish Kumar |
| **Privacy/Compliance Lead** | Breach determination, regulator/parent notice, timers | (assign) |
| **Tech Lead** | Containment, eradication, recovery, forensics | (assign) |
| **Comms** | Internal updates, affected-party/parental notices | (assign) |
| **Scribe** | Timeline + evidence log | (assign) |

Solo-maintainer reality: one person may hold several roles — still keep the **scribe timeline** separate and contemporaneous.

## Detection sources

- App/audit logs (`pcp.audit` via `app/security.py`), error spikes, observability (`app/observability.py`)
- Dependency/secret scanning alerts (see `SECURITY.md`)
- External vulnerability report (per `SECURITY.md` process)
- Anomalous LLM egress or API-key billing spikes (`PROVIDER=claude`)

## Response lifecycle (NIST SP 800-61)

| Phase | Actions | Done when |
|-------|---------|-----------|
| **1. Prepare** | This runbook current; contacts filled; backups + audit logging working; on-call known | Pre-incident |
| **2. Detect & analyze** | Confirm it's real (filter false positives); classify sev; **was real PHI involved?**; open ticket; start scribe timeline | Sev assigned, scope estimated |
| **3. Contain** | Short-term: isolate host, revoke sessions/keys, take endpoint offline, **rotate `ANTHROPIC_API_KEY`/DB/Neo4j creds**, block source. Long-term: patched path before restore. **Preserve evidence before wiping.** | Bleeding stopped |
| **4. Eradicate** | Remove attacker access, patch the vuln, restore KG integrity (re-verify red-flag escalation), purge malicious data | Root cause removed |
| **5. Recover** | Restore from clean backup, re-enable access under monitoring, confirm triage/predict behave correctly | Service healthy + watched |
| **6. Post-incident** | Post-mortem within 5 business days; track action items to closure | Review done, items tracked |

## Breach-notification timelines

| Regime | Trigger | Deadline | Notify |
|--------|---------|----------|--------|
| **HIPAA Breach Notification Rule** | Unsecured PHI compromised | **≤60 days** to affected individuals; HHS (annual if <500, else 60 days); media if >500 in a state | Individuals (parents/guardians for minors), HHS |
| **GDPR Art. 33/34** | Personal-data breach with risk | **≤72 hours** to supervisory authority; to data subjects "without undue delay" if high risk | DPA + data subjects |
| **COPPA** | Children's data compromised | No fixed clock, but parental notice + FTC exposure; act under the strictest applicable timer | Parents/guardians |
| **US state laws** | Varies | Often "without unreasonable delay" | Per state |

**Rule of thumb:** when in doubt, run to the **72-hour (GDPR)** clock — it is the tightest. Start the timer at *detection*, not at confirmation.

## Contact / escalation template

```
INCIDENT: <id>            SEV: <1-4>           STATUS: <investigating|contained|resolved>
Declared:  <UTC timestamp>            IC: <name>
Real PHI involved? <yes/no/unknown>   Children's data? <yes/no/unknown>
Breach timers started: HIPAA __  GDPR(72h) __    Deadline: <UTC>
Summary:    <one line>
Affected:   <systems / data / # individuals>
Actions:    <containment so far>
Next update: <UTC>
Escalation: IC -> Privacy Lead -> Legal/Regulator -> Affected parents/guardians
```

## Evidence collection

| Do | Don't |
|----|-------|
| Snapshot logs, audit trail, memory/process state **before** remediating | Don't wipe/reboot before capturing volatile state |
| Hash + timestamp artifacts; store read-only, access-controlled | Don't store evidence containing PHI in chat/email |
| Record every action with who/when in the scribe timeline | Don't act off-record |
| Preserve `.env`-derived config state (note which keys, **never the values**) | Don't paste secrets into the ticket |
| Maintain chain of custody | Don't let evidence touch the same host you're rebuilding |

## Post-incident review template

```
## Post-mortem: <incident id> — <date>
Severity: <>            Duration: detect <t0> -> resolve <t1>
Real PHI / child data impacted: <>     Reportable? <yes/no> (timers met? <>)

### Timeline
<UTC> - <event>

### Root cause
<technical + process cause; no blame>

### Impact
<systems, data, individuals, regulatory>

### What went well / poorly
- ...

### Action items (owner, due, tracked)
1. <control to add — map to docs/privacy-compliance.md / docs/threat-model.md / app/security.py>

### Notifications sent
HIPAA: <date/n>   GDPR: <date>   Parents/guardians: <date>
```

Every post-mortem must produce at least one tracked action item mapped to a control gap in `docs/privacy-compliance.md`, a threat in `docs/threat-model.md`, or a TODO in `app/security.py`.
