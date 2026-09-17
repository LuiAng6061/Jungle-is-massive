# Regulatory content ingestion — how to verify and replace placeholders

Every regulatory topic in `js/data.js` currently carries `status: 'UNVERIFIED'` (two at
`confidence: 'MEDIUM'` from secondary corroboration, the rest `LOW`). **No clause text is
fabricated.** This file is the procedure to turn a placeholder into verified, cited content.

## Why it isn't done yet

The build/verification environment's **network policy blocks the authoritative domains**
(`ncc.abcb.gov.au`, `nccb.gov.au`, `wa.gov.au`, `legislation.wa.gov.au`). Verification must be
run either:
- in an environment whose network policy **allows** those domains, or
- by a person pasting text from the official sources.

## The authoritative sources (Priority 1)

| Topic area | Source | Where |
|---|---|---|
| NCC Volume Two / Housing Provisions | ABCB | https://ncc.abcb.gov.au/editions/ncc-2022 |
| WA building permits / approvals | Building Act 2011 (WA) | https://www.legislation.wa.gov.au (law_a146699) |
| WA building administration | Building Regulations 2012 (WA) | https://www.legislation.wa.gov.au (law_s6987) |
| Wet-area waterproofing construction | AS 3740:2021 | Standards Australia (paywalled) |

## Procedure per topic

1. Open the authoritative source and locate the current provision for the topic.
2. Record the **exact** section/part/clause reference and edition/amendment.
3. Update the topic object in `js/data.js`:
   ```js
   {
     id: 'WP-WETAREA',
     // ...
     ncc_section: 'ABCB Housing Provisions Part 10.2',   // exact
     clause: '10.2.x',                                    // exact, from the source
     status: 'CURRENT',                                   // was UNVERIFIED
     confidence: 'HIGH',
     effective_from: '2023-05-01',                        // adoption date you confirm
     verification_date: 'YYYY-MM-DD',
     verified_by: 'your name / role',
   }
   ```
4. Do **not** delete the old values — if a provision is superseded later, add a new record and
   set the old one's `status` to `SUPERSEDED` / `HISTORICAL` (data-integrity rule, master prompt §58).
5. Re-run tests: `npm test`. The invariant test "no topic fabricates a clause when unverified"
   only allows a non-empty `clause` once `status` is `CURRENT`.
6. Rebuild the standalone file (see `README.md`) if you distribute that.

## Guardrails (must hold)

- A topic may carry a `clause` **only** when `status === 'CURRENT'` (enforced by test).
- The `VIEW SOURCE` panel shows the `UNVERIFIED` warning for anything not `CURRENT`.
- Educational simplifications are marked `requirement_type: 'educational-explanation'`, never
  presented as the legislation itself.
