# Accessibility

> **Target: WCAG 2.1 AA.** This is a public-facing health tool — worried parents, varied devices, assistive tech. Accessibility here is a usability and equity requirement, not a checkbox.
>
> **Current state:** the UI is semantic HTML (real `<button>`, `<input>`, `<label>`, `<nav>`, `<a>`, `lang="en"`) on a dark Catppuccin Mocha theme. Findings are grounded in `web/app/symptom-checker/page.tsx`, `web/app/layout.tsx`, `web/app/globals.css`.
>
> **PCP-17 (done):** global `:focus-visible` ring; symptom chips expose `aria-pressed` + the group has `role="group"`; age inputs (symptom-checker + stages) are label-associated (`htmlFor`/`id`); results use `aria-live="polite"`; errors use `role="alert"`. **Still open:** Mocha contrast verification, chip-group label wording, numeric `min`/`max`/`inputmode`, full keyboard-trap audit.

## Standards & scope

| Area | Standard | Tag |
|---|---|---|
| Keyboard navigation | All actions reachable & operable by keyboard (WCAG 2.1.1) | Core |
| Visible focus | Clear focus indicator on every interactive element (2.4.7) | Core |
| Color contrast | Text ≥ 4.5:1, large text/UI ≥ 3:1 (1.4.3 / 1.4.11) | Core |
| Names/labels | Every control has an accessible name (4.1.2, 1.3.1) | Core |
| Screen reader / ARIA | Dynamic results announced, state exposed | Growing |
| Don't rely on color alone | Triage levels not color-only (1.4.1) | Growing |
| Reduced motion / responsive | Honor `prefers-reduced-motion`, reflow at 320px (1.4.10) | Heavy |

## Color contrast — Catppuccin Mocha (must verify)

The theme uses Mocha tokens on `base #1e1e2e`. Approximate contrast ratios:

| Foreground | On | Ratio (approx) | AA normal text | Verdict |
|---|---|---|---|---|
| `text #cdd6f4` | base `#1e1e2e` | ~11:1 | pass | Good for body |
| `subtext #a6adc8` | base | ~6.5:1 | pass | OK, but it's used for **a lot** of primary content |
| `subtext` | mantle `#181825` | ~7:1 | pass | OK |
| `crust #11111b` on `mauve #cba6f7` | (primary button) | ~9:1 | pass | Good |
| `peach #fab387` (disclaimer) | mantle | ~7:1 | pass | OK — but a safety disclaimer at `text-xs` is a size concern, not contrast |
| `yellow #f9e2af` triage text | base | ~13:1 | pass | Color contrast fine; **meaning conveyed by color** is the issue (see below) |

> Action: run an automated contrast audit (axe / Lighthouse) — values above are estimates. The real risks are **small text** (`text-xs` disclaimer + matched-symptoms) and **subtext overuse**, not raw contrast.

## Component review — symptom checker

| Element | Current | Gap | Tag |
|---|---|---|---|
| Symptom chips | Real `<button>`, toggle on click | **Selected state is conveyed by color/bg only** — no `aria-pressed`; screen reader can't tell selected from unselected | Core |
| Chip group | `flex` of buttons | Not grouped/labeled as a set (`role="group"` + label e.g. "Common symptoms") | Growing |
| Age input | `<input type="number">` + adjacent `<label>` | Label is **not associated** (no `htmlFor`/`id`) — SR won't announce it; numeric input has no min/max/`inputmode` | Core |
| "Check symptoms" button | `<button disabled>` when empty/loading | OK; but loading state ("Analyzing…") isn't announced via `aria-live` | Growing |
| Results / triage / predictions | Rendered on submit | **Not announced** — appears silently; needs `aria-live="polite"` region so SR users know results arrived | Core |
| Triage badge | Color + text label ("Triage: urgent") | Good — text label means not color-only here. Keep it. | — |
| Confidence bar | `<div>` width = % | Decorative; the `%` text beside it carries the value — acceptable, but consider `role="progressbar"`+`aria-valuenow` | Growing |
| Error message | `text-red` div | Not in an `aria-live`/`role="alert"` region | Growing |
| Disclaimer | `text-xs text-peach` | Safety-critical text at smallest size — increase size/weight; ensure it's in reading order near results | Core |

## App-wide

| Element | Current | Gap | Tag |
|---|---|---|---|
| Focus indicator | Relies on browser default; hover styles defined, no explicit `:focus-visible` | Add visible `:focus-visible` ring (esp. on chips/nav where bg-only changes) | Core |
| Nav | `<nav>` with `<Link>`s, `lang="en"` set | Add "skip to main content" link; mark current page (`aria-current="page"`) | Growing |
| Landmarks | `<aside>` + `<main>` present | Good. Ensure one `<h1>` per page (symptom-checker has one) | — |
| Icon-only text | `🩺` emoji in brand | Decorative — fine, but ensure not the sole label | Growing |
| Motion | `transition-colors` everywhere | Honor `prefers-reduced-motion` | Heavy |
| Zoom/reflow | Fixed `w-60` sidebar, `max-w-4xl` main | Verify usable at 320px / 200% zoom (sidebar may need to collapse) | Heavy |

## Current gaps — priority

1. **Associate the age `<label>` with its input** (`htmlFor`/`id`). _(Core)_
2. **`aria-live` region for results + errors** so screen-reader users know a prediction returned. _(Core)_
3. **`aria-pressed` on symptom chips** to expose selected state. _(Core)_
4. **Explicit `:focus-visible` styles** across chips and nav. _(Core)_
5. **Run axe/Lighthouse** to confirm contrast and catch the above automatically. _(Core)_
6. Enlarge the safety **disclaimer** beyond `text-xs`. _(Core)_

## Checklist (per page / PR)

- [ ] Every control reachable & operable by keyboard; logical tab order
- [ ] Visible `:focus-visible` indicator on all interactive elements
- [ ] Every input has an associated, programmatic label
- [ ] State (selected chips, loading, current nav) exposed to assistive tech
- [ ] Dynamic content (results, errors) in an `aria-live` / `role="alert"` region
- [ ] No information conveyed by color alone
- [ ] Contrast ≥ 4.5:1 (text) / 3:1 (UI) — verified with a tool
- [ ] One `<h1>`, sensible heading order, landmarks present
- [ ] Skip-to-content link; `aria-current` on active nav
- [ ] Usable at 320px width and 200% zoom; `prefers-reduced-motion` honored
- [ ] Automated audit (axe/Lighthouse) passes; spot-check with a screen reader
