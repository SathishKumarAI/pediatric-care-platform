# UI/UX Specification + Component Backlog

> **Point:** PedCare is a **desktop** health tool (Tauri v2 window 1200×800 + Next.js 15 / React 19 / Tailwind CSS 4 / TS). Its users are anxious parents looking for guidance on a child's health. Every design decision serves **clarity + calm + trust**, never alarm. This is **synthetic data, not a medical device** — the disclaimer is always visible.
>
> **Scope of "done":** Only the shell, 5 screens, design tokens, and the 13 hand-rolled components listed below exist today. Everything else is **planned**. UI components are currently hand-rolled; production target is **shadcn/ui** (Tailwind 4 + Next 15 native fit).

---

## 1. Design principles

Why each matters for an anxious-parent health tool:

| Principle | What it means | Why |
|---|---|---|
| **Clarity first** | One primary action per screen, plain language, no jargon | A worried parent should never have to decode the UI |
| **Calm, not clinical** | Soft Catppuccin Mocha palette, generous spacing, no harsh white | Reduces stress vs. sterile hospital aesthetics |
| **Trust** | Show confidence/evidence (matched symptoms, % bars), cite "why" | Parents act on advice only if they understand the basis |
| **Never alarmist** | Urgent ≠ scary; red used sparingly, paired with calm next-step copy | Panic leads to bad decisions or ER overload |
| **"Not a diagnosis" always** | Persistent disclaimer on every clinical surface | Legal + ethical; sets correct expectations |
| **Accessibility** | Keyboard, contrast, screen-reader, color-independent meaning | Stressed/tired users, low-vision parents, assistive tech |
| **Forgiving** | Confirm destructive/booking actions, easy undo, inline validation | Mistakes under stress are common — make them cheap to reverse |

---

## 2. Design system / tokens

**Status:** color tokens **done** (`web/app/globals.css` `@theme`, Catppuccin Mocha). Dark theme is default; **light theme = planned**.

### Color tokens & semantic use

| Token | Hex | Semantic use |
|---|---|---|
| base | `#1e1e2e` | App background (default surface) |
| mantle | `#181825` | Sidebar / secondary background |
| crust | `#11111b` | Deepest background, window chrome |
| surface0 | `#313244` | Cards, inputs, raised panels |
| surface1 | `#45475a` | Borders, hover states, dividers |
| text | `#cdd6f4` | Primary text |
| subtext | `#a6adc8` | Secondary/muted text, labels |
| blue | `#89b4fa` | Info, links, neutral accents |
| green | `#a6e3a1` | OK / self-care / healthy / success |
| yellow | `#f9e2af` | Caution / see-a-doctor / warning |
| peach | `#fab387` | Secondary warning, in-progress |
| red | `#f38ba8` | Urgent / danger / error (used sparingly) |
| mauve | `#cba6f7` | **Primary action** (buttons, active nav) |

### Scale & treatment (current vs planned)

| Aspect | Current | Planned |
|---|---|---|
| Typography | `system-ui`, ad-hoc sizes | Defined scale: 12 / 14 / 16 / 20 / 24 / 32px, weights 400/500/600 |
| Spacing | Tailwind defaults, inconsistent | 4px base scale (4/8/12/16/24/32/48) used systematically |
| Radius | Mixed | Tokens: sm 6px, md 10px, lg 16px, pill 9999 |
| Elevation | Flat / borders only | 2-level shadow scale for modals/popovers |
| Theme | Dark (Mocha) default | Light theme (Catppuccin Latte) + toggle |

---

## 3. Triage color semantics

Explicit, fixed mapping — used by `TriageBadge` and `ConfidenceBar`:

| Level | Color | Icon (planned) | Tone of copy |
|---|---|---|---|
| **self-care** | green `#a6e3a1` | ✓ / leaf | "You can likely manage this at home" |
| **see-doctor** | yellow `#f9e2af` | ! / clock | "Worth checking with your pediatrician" |
| **urgent** | red `#f38ba8` | ⚠ / cross | "Seek care now" — calm, directive, no panic |

**Accessibility (critical):** Never rely on color alone (WCAG 1.4.1). Every triage signal MUST also carry a **text label** and a **distinct icon/shape**. Color-blind and grayscale users must read the same urgency.

---

## 4. Screen inventory

| Screen | Route | Status | Purpose |
|---|---|---|---|
| App shell / sidebar nav | `app/layout.tsx` | **done** | Persistent left nav, "🩺 PedCare" brand |
| Dashboard | `/` (`app/page.tsx`) | **done** | Backend-health banner + feature card grid |
| Symptom Checker | `/symptom-checker` | **done** | Symptom chips → triage + confidence + LLM explanation |
| Appointments | `/appointments` | **done** | Book (doctor/time/reason) + appointment list |
| Doctors | `/doctors` | **done** | Doctor card grid + availability tags |
| Growth Stages | `/stages` | **done** | Milestones by domain + red-flag list |
| Login / Signup | `/login`, `/signup` | planned | Auth entry |
| Onboarding | `/onboarding` | planned | First-run: add child, set expectations, disclaimer accept |
| Patient / Child profile | `/children/:id` | planned | Per-child demographics, history hub |
| Record detail / timeline | `/records`, `/records/:id` | planned | Visit/symptom/growth history timeline |
| Doctor profile | `/doctors/:id` | planned | Full bio, schedule, book CTA |
| Settings | `/settings` | planned | Theme, account, data, notifications |
| Help / FAQ | `/help` | planned | Guidance, disclaimer detail, support |
| Notifications center | `/notifications` | planned | Appointment reminders, follow-ups |
| Admin dashboard | `/admin` | planned | Manage doctors, data, usage (internal) |
| Growth charts | `/children/:id/growth` | planned | Percentile curves (height/weight/head circ.) |

---

## 5. Component inventory & backlog

**Priority key:** **Core** = needed for a coherent MVP · **Growing** = needed as features expand · **Heavy** = high-effort / later-stage.
Library recommendation: adopt **shadcn/ui** (copy-in, Radix primitives, Tailwind 4 themeable to Mocha). Current components are **hand-rolled** and should be progressively reconciled with shadcn equivalents.

### Existing components (hand-rolled)

| Component | Description | Status | Priority | Used on |
|---|---|---|---|---|
| Sidebar nav | Left nav with 5 links + brand | done | Core | Shell (all screens) |
| FeatureCard | Linkable feature tile | done | Core | Dashboard |
| SymptomChip | Toggleable symptom selector | done | Core | Symptom Checker |
| TriageBadge | Color-coded triage level badge | done | Core | Symptom Checker |
| ConfidenceBar | Per-disease % bar + matched symptoms | done | Core | Symptom Checker |
| DoctorCard | Doctor summary card | done | Core | Doctors |
| AvailabilityTag | Availability-day tag/pill | done | Core | Doctors, Doctor profile |
| AppointmentForm | Doctor select + datetime + reason + book | done | Core | Appointments |
| AppointmentList | List of booked appointments | done | Core | Appointments |
| MilestoneRow | Milestone row grouped by domain | done | Core | Growth Stages |
| RedFlagList | Red-flag warnings list | done | Core | Growth Stages |
| HealthStatusBanner | Backend health green/red banner | done | Core | Dashboard |
| Disclaimer | "Not a diagnosis" notice | done | Core | Symptom Checker (target: global) |

### Production component set (planned)

| Component | Description | Status | Priority | Used on |
|---|---|---|---|---|
| Button (variants) | Primary/secondary/ghost/destructive, sizes, loading | planned | Core | Everywhere |
| Input | Text input + states | planned | Core | Forms |
| Select | Dropdown select | planned | Core | Appointments, filters |
| Textarea | Multi-line input | planned | Core | Reason, notes |
| DatePicker | Calendar date picker | planned | Core | Appointments, records |
| TimePicker | Time selection | planned | Growing | Appointments |
| Modal / Dialog | Overlay container | planned | Core | Confirmations, detail |
| ConfirmDialog | Confirm destructive/booking actions | planned | Core | Cancel/delete/book |
| Toast / Snackbar | Transient action feedback | planned | Core | Booking, save, errors |
| Tooltip | Hover/focus hint | planned | Growing | Icons, terms |
| Tabs | Sectioned content switcher | planned | Growing | Profiles, records |
| Accordion | Collapsible sections | planned | Growing | FAQ, milestone groups |
| Table / DataGrid | Sortable tabular data | planned | Growing | Admin, records |
| Pagination | Page navigation for lists | planned | Growing | Lists, tables |
| Avatar | Doctor/child image/initials | planned | Growing | Cards, profiles |
| Badge / Pill | Status/category label | planned | Core | Status, tags |
| Card | Generic content container | planned | Core | Throughout |
| Skeleton / Loader | Content placeholder while loading | planned | Core | All async views |
| Spinner | Inline busy indicator | planned | Core | Buttons, fetches |
| EmptyState | "Nothing here yet" + CTA | planned | Core | Empty lists |
| ErrorBoundary / ErrorState | Graceful failure UI | planned | Core | All data screens |
| Breadcrumbs | Hierarchy navigation | planned | Growing | Nested routes |
| Calendar | Month/week view | planned | Growing | Appointments |
| Stepper / Wizard | Multi-step flow | planned | Growing | Onboarding |
| Chart / Graph | Growth percentiles, confidence viz | planned | Heavy | Growth charts, Symptom Checker |
| SearchBar / Autocomplete | Typeahead search | planned | Growing | Doctors, symptoms |
| BodyMap symptom selector | Click-a-body-region symptom input | planned | Heavy | Symptom Checker |
| FileUpload | Attach documents/images | planned | Heavy | Records |
| NotificationBell | Notification indicator + dropdown | planned | Growing | Shell |
| Theme toggle | Dark/light switch | planned | Growing | Settings, shell |
| FormField / validation | Label + control + inline error | planned | Core | All forms |
| Drawer | Side panel overlay | planned | Growing | Filters, quick detail |

---

## 6. UX flows

### A. Symptom check → triage → book appointment
```
Dashboard → Symptom Checker
  1. Enter child age (months)
  2. Toggle symptom chips
  3. Click "Check symptoms"
  4. See TriageBadge + per-disease ConfidenceBars + LLM explanation + Disclaimer
  5. If see-doctor / urgent → CTA "Book appointment" (planned)
     → Appointments (doctor preselected) → pick time → reason → Book
     → Toast confirms (planned) → appears in AppointmentList
```

### B. View growth stage
```
Growth Stages
  1. Enter child age (months)
  2. View milestones grouped by domain
  3. Scan RedFlagList → if flags match, CTA to Symptom Checker / Book (planned)
```

### C. Add record (planned)
```
Child profile → Records → "Add record"
  1. Choose type (visit / symptom episode / growth measurement)
  2. Fill FormField set (date, notes, attachments)
  3. Validate inline → Save → Toast → appears on timeline
```

---

## 7. Accessibility (WCAG 2.1 AA)

**Target:** AA. **Current state:** unverified — assume gaps until audited.

| Area | Requirement | Current gap |
|---|---|---|
| Keyboard nav | All actions reachable + operable via keyboard | Chips/cards likely not all focusable |
| Focus states | Visible focus ring on every interactive element | Relies on browser default; inconsistent |
| Contrast | ≥4.5:1 text, ≥3:1 large/UI (verify Mocha tokens) | subtext on surface0 and yellow/green-on-dark need verification |
| Color independence | Never color-only meaning (1.4.1) | TriageBadge needs icon + label, not just color |
| ARIA — chips | `role="button"`/`checkbox`, `aria-pressed` | Not set |
| ARIA — badges | Status text exposed to SR (not just color) | Not set |
| ARIA — forms | Labels tied to inputs, `aria-invalid`, error `aria-describedby` | Partial |
| SR labels | Icon-only controls need `aria-label` | Pending icon adoption |
| Live regions | Triage result + toasts announced (`aria-live`) | Not implemented |
| Disclaimer | Always perceivable, not hidden behind interaction | Currently only on Symptom Checker |

**Checklist:** focusable + visible focus · verify all token contrast pairs · icon+label on every status · ARIA roles on chips/badges/forms · `aria-live` for async results · skip-to-content link · respect `prefers-reduced-motion`.

---

## 8. Responsive / window behavior

**Desktop-first.** Target Tauri window **1200×800**, **min 900×600**.

| Width | Behavior |
|---|---|
| ≥1200 (default) | Full sidebar + multi-column card/grid layouts |
| 900–1199 (min) | Sidebar persists; grids reflow to fewer columns |
| <900 | Out of scope (min window enforced); planned web breakpoints below |

**Planned breakpoints (web build):** collapse sidebar to icon rail < 1024px; single-column < 768px. No native mobile target. Forms and lists must remain usable at the 900×600 minimum without horizontal scroll.

---

## 9. UI/UX feature backlog

| Enhancement | Why | Priority | Status |
|---|---|---|---|
| Loading states everywhere (Skeleton/Spinner) | Avoid blank/janky screens on fetch | Core | planned |
| Empty states everywhere | Guide first-time / no-data users | Core | planned |
| Error states + ErrorBoundary | Fail gracefully, offer retry | Core | planned |
| Form validation + inline errors | Prevent bad bookings under stress | Core | planned |
| Optimistic updates | Snappy booking/record feel | Growing | planned |
| Toasts for actions | Confirm book/save/cancel | Core | planned |
| ConfirmDialog on destructive/booking | Prevent costly mistakes | Core | planned |
| Global persistent disclaimer | Legal/ethical on every clinical surface | Core | planned |
| Keyboard shortcuts | Power-user efficiency | Growing | planned |
| Dark/light theme toggle | Comfort, accessibility | Growing | planned |
| i18n / RTL | Reach non-English families | Heavy | planned |
| Animations / transitions (reduced-motion aware) | Calm, polished feel | Growing | planned |
| Print styles for records | Hand records to a real doctor | Growing | planned |
| Onboarding tour | Orient anxious first-time users | Growing | planned |
| Micro-copy / tone pass | Calm, non-alarmist, plain language | Core | planned |
| Triage icons + labels (color-independent) | Accessibility + clarity | Core | planned |
| Focus-visible + a11y audit pass | WCAG AA compliance | Core | planned |

---

*Synthetic data. Not a medical device. Not a diagnosis — always consult a qualified pediatrician.*
