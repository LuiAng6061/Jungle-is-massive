# BuildMaster Australia — Implementation Plan (Phase 0 Audit + Slice Scope)

> Interactive residential builder training & construction-compliance simulator.
> **Jurisdiction 1: Western Australia.** Educational simulation only — see disclaimer.

## 1. Repository audit (Phase 0)

| Finding | Detail |
|---|---|
| Existing app | `/index.html` + `css/ js/ vendor/` — a **static** Australian super/tax planner. No Node, no build, no DB. |
| Constraint | Repo is a plain static site served as files. Introducing Next.js/Postgres/Prisma would require tooling the repo does not have and cannot run here. |
| Decision | Build BuildMaster as a **self-contained static vertical slice** under `buildmaster/`, leaving the tax app untouched. Vanilla ES modules, no dependencies, no build step. |
| Regulatory sourcing | Authoritative primary sources (`ncc.abcb.gov.au`, `commerce.wa.gov.au`, `legislation.wa.gov.au`) are **blocked by the environment egress proxy**. Per the master prompt's accuracy rule, no clause text is fabricated. Two topics carry multi-source secondary corroboration at `confidence: MEDIUM`; the rest are `UNVERIFIED` with empty clause fields awaiting authoritative ingestion. |

## 2. What this slice delivers (the playable vertical slice)

`START PROJECT → inspect document → site event → investigate → FIND THE RULE → make decision → consequence → learn → continue`

Plus: main dashboard, player profile with 9-axis skill profile, XP, 3 difficulty modes,
AI-style mentor with a progressive hint ladder, source-verification UI, seeded/replayable
projects, a spaced-repetition knowledge tracker, and a short competency assessment.

## 3. Architecture (kept separable, per master prompt §4)

```
buildmaster/
  index.html            App shell + navigation + disclaimer
  css/buildmaster.css   Professional desktop-first, responsive UI
  js/
    data.js             CONTENT: regulatory sources, knowledge topics, scenarios,
                        defects, events, project, subcontractors, clients
    regulatory.js       REGULATORY KNOWLEDGE ENGINE (version/status-aware queries)
    engine.js           GAME ENGINE: seeded RNG, player profile, scoring,
                        spaced repetition, consequence engine — queries regulatory.js
    app.js              UI: dashboard, scenario runner, Find-the-Rule, mentor, profile
```

The **game engine never hard-codes regulations**; it asks `regulatory.js`, which stores
every item with `status`, `effective_from/to`, `edition`, `source_url` and `confidence`
so historical/superseded content is preserved, never silently overwritten (§4, §38, §58).

## 4. Roadmap beyond this slice (unbuilt phases, mapped to prompt)

- **Phase 1 remainder** — auth, more scenarios (target 30), 50 knowledge topics, 20 defects.
- **Phase 2** — virtual site navigation, richer document viewer, inspection mode, ITPs.
- **Phase 3** — real NCC/WA ingestion pipeline + vector retrieval once sources reachable.
- **Phase 4** — finance/programme/subcontractor/client/variation/RFI systems (data models stubbed).
- **Phase 5** — RAG-grounded mentor, free-text evaluation, forensic mode.
- **Phase 6** — admin portal, analytics, NSW/VIC/QLD/… jurisdictions (schema already jurisdiction-keyed).

## 5. Honesty / accuracy guarantees implemented

- No invented clause numbers, standards, measurements, or tolerances.
- Every regulatory answer exposes **VIEW SOURCE** with status + confidence + URL.
- `UNVERIFIED` items display: "Do not rely on this for real-world compliance."
- Persistent real-world disclaimer (master prompt §70).
