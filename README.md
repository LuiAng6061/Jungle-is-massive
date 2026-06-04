# Advanced Super & Tax Planner

An interactive single-page web application for planning Australian
concessional super contributions and 2026-27 property development tax
structuring. Built from the seed spreadsheet `Advanced_Super_Tax_Planner.xlsx`.

## Features

- **Carry-forward concessional cap tracking** for FY 2020-21 through
  2024-25, with per-year breakdown of used vs unused cap
- **Cap exceedance warnings** including TSB < $500k eligibility check
- **Strategy comparison**: No contribution / Minimum / Maximum / Custom
  with tax saving, contributions tax, Div 293 and net benefit
- **Tax before and after** contributions calculated against 2024-25
  Stage 3 brackets plus the 2% Medicare levy
- **Automatic optimisation** of contribution amount for maximum net benefit
- **Tax-saved-vs-contribution chart** showing the curve up to the cap
- **2026-27 property development model**: personal (50/50) vs discretionary
  trust (streamed) vs 100% bucket company
- **Dashboard** with scenario summaries, charts, and combined position
- **Editable assumptions sheet** — caps for future years, brackets,
  target year, bucket-company rate, trust distribution

State persists in `localStorage` and can be exported as JSON.

## Run

It's a static site — open `index.html` directly in a browser, or serve:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

```
index.html                 Page shell + navigation
css/styles.css             Visual styling
vendor/chart.umd.min.js    Chart.js 4.4.1 (vendored, works offline)
js/data.js                 ATO caps, brackets, defaults
js/calc.js                 Tax + carry-forward + optimisation + property engine
js/charts.js               Chart.js wrappers
js/app.js                  UI rendering + state management
```

## Disclaimer

Indicative only. Does not model LITO, MLS, FBT, excess concessional
contributions charge, or franking. Verify all numbers with your accountant
before acting.
