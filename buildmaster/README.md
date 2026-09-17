# BuildMaster Australia — WA Builder Training Simulator (vertical slice)

An interactive residential-construction training simulator for **Western Australia**, built from the
BuildMaster master prompt. This is a **self-contained static vertical slice** (vanilla ES modules, no
build step, no backend) living alongside — and independent of — the repo's existing tax app.

> **Educational simulation only.** It is not legal, engineering, building-surveying, licensing or
> regulatory advice, and passing an in-app assessment confers no licence or qualification.

## Run it

No install needed. Serve the folder statically (ES modules require http, not `file://`):

```bash
cd buildmaster
python3 -m http.server 8080   # then open http://localhost:8080
```

## Test

```bash
cd buildmaster
npm test          # node --test over the pure engine/regulatory logic (15 tests)
```

## What's implemented (this slice)

- **Playable vertical slice:** brief → investigate (gather evidence) → **Find the Rule** (navigate to the
  authoritative source) → multi-dimensional decision → **probabilistic, delayed consequence** → learning breakdown.
- **Dashboard, player profile** with a 9-axis skill profile, XP and 10 competency levels with a **competency gate**.
- **3 difficulty modes** (beginner/builder/expert) controlling mentor assistance and free-text evaluation.
- **AI-style mentor** with a progressive hint ladder that challenges assumptions and won't just hand over answers.
- **Spaced-repetition** knowledge tracker; **seeded, replayable** projects/events.
- **Source-verification UI** (`VIEW SOURCE`) exposing authority, edition, status and confidence.

## Regulatory accuracy

Per the master prompt, **no NCC clause text, standard, measurement or tolerance is invented**. Primary
sources (`ncc.abcb.gov.au`, `commerce.wa.gov.au`, `legislation.wa.gov.au`) were **egress-blocked** in the
build environment, so two topics carry `confidence: MEDIUM` from multi-source secondary corroboration and
the rest are `UNVERIFIED` with empty clause fields, awaiting authoritative ingestion. The regulatory engine
(`js/regulatory.js`) is kept separate from the game engine (`js/engine.js`) so real sources can be ingested
later without rewriting gameplay.

See `IMPLEMENTATION_PLAN.md` for the full architecture and roadmap (Phases 1–6).

## Structure

```
buildmaster/
  index.html              App shell + navigation + disclaimer
  css/buildmaster.css     Desktop-first, responsive UI
  js/data.js              Content: sources, knowledge topics, scenarios, defects, events, project
  js/regulatory.js        Regulatory knowledge engine (status/version-aware)
  js/engine.js            Game engine: seeded RNG, scoring, spaced repetition, consequences
  js/app.js               UI controller / scenario runner
  tests/engine.test.mjs   Automated tests
```
