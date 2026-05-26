// Advanced Super & Tax Planner — reference data
// All amounts in AUD. Sources: ATO published rates as at FY 2024-25.

window.PlannerData = (() => {
  // Concessional contribution caps by FY (per person)
  // 2018-19 was the first year carry-forward unused cap was tracked.
  const CONCESSIONAL_CAPS = {
    "2018-19": 25000,
    "2019-20": 25000,
    "2020-21": 25000,
    "2021-22": 27500,
    "2022-23": 27500,
    "2023-24": 27500,
    "2024-25": 30000,
    "2025-26": 30000,
    "2026-27": 30000, // editable assumption
  };

  // ATO marginal tax brackets (resident, no LITO modelled here for simplicity).
  // 2024-25 Stage 3 rates per spreadsheet.
  const TAX_BRACKETS_2024_25 = [
    { upTo: 18200, rate: 0.0, base: 0 },
    { upTo: 45000, rate: 0.16, base: 0 },
    { upTo: 135000, rate: 0.30, base: 4288 },
    { upTo: 190000, rate: 0.37, base: 31288 },
    { upTo: Infinity, rate: 0.45, base: 51638 },
  ];

  const MEDICARE_LEVY = 0.02;
  const CONTRIBUTIONS_TAX = 0.15;
  // Div 293 — additional 15% on concessional contributions if Div 293 income > threshold.
  const DIV_293_THRESHOLD = 250000;
  const DIV_293_EXTRA = 0.15;

  // Total Super Balance threshold — must be < $500k on 30 June of prior year to use carry-forward.
  const TSB_CARRY_FORWARD_THRESHOLD = 500000;

  // Company tax rates
  const COMPANY_BASE_RATE = 0.25; // base rate entity (passive income <= 80%, turnover < $50m)
  const COMPANY_FULL_RATE = 0.30;

  // Carry-forward planning years — the 5 lookback years for 2025-26 contributions.
  const CARRY_FORWARD_YEARS = ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"];

  // Default people from the source spreadsheet.
  const DEFAULT_PEOPLE = [
    {
      id: "p1",
      name: "Ljupco",
      taxableIncome: 200000,
      paygWithheld: 59000,
      tsb: 350000,
      employerContribs: { // 11.5% SG approx of income examples (editable)
        "2020-21": 19000,
        "2021-22": 21000,
        "2022-23": 22000,
        "2023-24": 23000,
        "2024-25": 23000,
      },
      personalContribs: {
        "2020-21": 0,
        "2021-22": 0,
        "2022-23": 0,
        "2023-24": 0,
        "2024-25": 0,
      },
    },
    {
      id: "p2",
      name: "Julie",
      taxableIncome: 220000,
      paygWithheld: 16451,
      tsb: 280000,
      employerContribs: {
        "2020-21": 18000,
        "2021-22": 20000,
        "2022-23": 22000,
        "2023-24": 23000,
        "2024-25": 23000,
      },
      personalContribs: {
        "2020-21": 0,
        "2021-22": 0,
        "2022-23": 0,
        "2023-24": 0,
        "2024-25": 0,
      },
    },
  ];

  // Default property scenario — 2026-27.
  const DEFAULT_PROPERTY = {
    year: "2026-27",
    saleProceeds: 2500000,
    landCost: 600000,
    constructionCost: 1100000,
    otherCosts: 150000,
    holdingPeriodMonths: 18,
    isCgtEligible: false, // development is generally on revenue account
    trustDistribution: { ljupco: 0.20, julie: 0.20, bucket: 0.60 },
    bucketRate: 0.25,
  };

  return {
    CONCESSIONAL_CAPS,
    TAX_BRACKETS_2024_25,
    MEDICARE_LEVY,
    CONTRIBUTIONS_TAX,
    DIV_293_THRESHOLD,
    DIV_293_EXTRA,
    TSB_CARRY_FORWARD_THRESHOLD,
    COMPANY_BASE_RATE,
    COMPANY_FULL_RATE,
    CARRY_FORWARD_YEARS,
    DEFAULT_PEOPLE,
    DEFAULT_PROPERTY,
  };
})();
