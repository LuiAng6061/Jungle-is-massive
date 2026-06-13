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
  // FY 2024-25 Medicare levy low-income thresholds (single, general).
  // Below LOW: no Medicare. Phase-in between LOW and HIGH at 10c per dollar.
  // Above HIGH: full 2%. HIGH ≈ LOW / (1 − levy/phase) = LOW / 0.8.
  const MEDICARE_LEVY_LOW = 27222;
  const MEDICARE_LEVY_HIGH = 34027;
  const MEDICARE_LEVY_PHASE_RATE = 0.10;
  const CONTRIBUTIONS_TAX = 0.15;
  // Div 293 — additional 15% on concessional contributions if Div 293 income > threshold.
  const DIV_293_THRESHOLD = 250000;
  const DIV_293_EXTRA = 0.15;

  // Total Super Balance threshold — must be < $500k on 30 June of prior year to use carry-forward.
  const TSB_CARRY_FORWARD_THRESHOLD = 500000;

  // Company tax rates
  const COMPANY_BASE_RATE = 0.25; // base rate entity (passive income <= 80%, turnover < $50m)
  const COMPANY_FULL_RATE = 0.30;

  // Low Income Tax Offset — FY 2024-25 (unchanged by Stage 3).
  //   income ≤ $37,500            → $700
  //   $37,500 < income ≤ $45,000  → 700 − (income − 37,500) × 5c
  //   $45,000 < income ≤ $66,667  → 325 − (income − 45,000) × 1.5c
  //   income > $66,667            → 0
  // Non-refundable: reduces income tax but not below zero. Does not reduce Medicare/MLS.
  const LITO_PARAMS = {
    max: 700,
    firstThreshold: 37500,
    firstTaperRate: 0.05,
    secondThreshold: 45000,
    secondTaperRate: 0.015,
    endThreshold: 66667,
  };

  // Medicare Levy Surcharge — FY 2024-25. Applies if no appropriate private hospital cover.
  //   Singles: base $97,000 / T1 $113,000 / T2 $151,000  (1%, 1.25%, 1.5%)
  //   Families: base $194,000 / T1 $226,000 / T2 $302,000 + $1,500 per dependent after the first
  // Surcharge is on the entire surcharge income, not just the excess.
  const MLS_PARAMS = {
    singleBase: 97000,
    singleTier1: 113000,
    singleTier2: 151000,
    familyBase: 194000,
    familyTier1: 226000,
    familyTier2: 302000,
    perChildAdjustment: 1500,
    tier1Rate: 0.01,
    tier2Rate: 0.0125,
    tier3Rate: 0.015,
  };

  // Excess Concessional Contributions charge — applied via the Shortfall
  // Interest Charge on any excess above the cap (approximate). Excess
  // itself goes back onto the tax return at marginal rate, with a 15%
  // tax offset for what the fund already paid.
  const ECC_PARAMS = {
    sicAnnualRate: 0.0804, // ATO SIC ~8% (resets quarterly)
    avgMonthsOutstanding: 9, // typical 6–12 months between contribution & assessment
    fundTaxOffset: 0.15,
  };

  // Carry-forward planning years — the 5 lookback years for 2025-26 contributions.
  // (Kept for backwards compatibility; calc.getLookbackYears(targetYear) is preferred.)
  const CARRY_FORWARD_YEARS = ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"];

  // ATO Individual tax return — PAYG income items (1-3).
  const PAYG_ITEMS = [
    { key: "item1",  label: "Salary or wages (Item 1)" },
    { key: "item2",  label: "Allowances, earnings, tips, director's fees (Item 2)" },
    { key: "item3",  label: "Employer lump sum payments A & B (Item 3)" },
  ];

  // ATO Individual tax return — Business / partnership / trust income (Items 13, 15).
  const BUSINESS_ITEMS = [
    { key: "item13", label: "Partnership/trust distributions — non-PSI (Item 13)" },
    { key: "item15a", label: "Net income — primary production (Item 15A)" },
    { key: "item15b", label: "Net income — non-primary production (Item 15B)" },
  ];

  // Business income detail (ABN sole-trader breakdown). When the user enters
  // gross revenue (or any expense > 0) this breakdown overrides the direct
  // Item 15B input — net business income = revenue − expenses.
  const BUSINESS_EXPENSE_ITEMS = [
    { key: "costOfSales",  label: "Cost of sales / goods sold" },
    { key: "wages",        label: "Wages & salaries paid to employees" },
    { key: "contractors",  label: "Contractor / subcontractor payments" },
    { key: "rent",         label: "Rent of business premises" },
    { key: "interest",     label: "Interest on business loans" },
    { key: "depreciation", label: "Depreciation & capital allowances" },
    { key: "motorVehicle", label: "Motor vehicle expenses" },
    { key: "insurance",    label: "Insurance" },
    { key: "utilities",    label: "Utilities, phone, internet" },
    { key: "other",        label: "Other business expenses" },
  ];

  // Tax already paid for the current FY (used for refund/payable).
  const TAX_PAYMENT_ITEMS = [
    { key: "paygWithheld",     label: "PAYG withheld (employer)" },
    { key: "paygInstalments",  label: "PAYG instalments paid (PAYGI quarterly under ABN)" },
    { key: "voluntaryTaxPaid", label: "Voluntary tax payments to ATO" },
  ];

  // ATO Individual tax return — Deductions D1 through D15. D12 is the
  // personal super deduction which is modelled by the strategy comparison,
  // so we keep it visible but read-only.
  const DEDUCTION_ITEMS = [
    { key: "D1",  label: "D1 Work-related car expenses" },
    { key: "D2",  label: "D2 Work-related travel expenses" },
    { key: "D3",  label: "D3 Work-related clothing, laundry & dry-cleaning" },
    { key: "D4",  label: "D4 Work-related self-education expenses" },
    { key: "D5",  label: "D5 Other work-related expenses" },
    { key: "D6",  label: "D6 Low value pool deduction" },
    { key: "D7",  label: "D7 Interest deductions" },
    { key: "D8",  label: "D8 Dividend deductions" },
    { key: "D9",  label: "D9 Gifts or donations" },
    { key: "D10", label: "D10 Cost of managing tax affairs" },
    { key: "D11", label: "D11 Deductible UPP of foreign pension or annuity" },
    { key: "D12", label: "D12 Personal superannuation contributions (set in Strategy)", readOnly: true },
    { key: "D13", label: "D13 Deduction for project pool" },
    { key: "D14", label: "D14 Forestry managed investment scheme" },
    { key: "D15", label: "D15 Other deductions" },
  ];

  const emptyPayg = () => Object.fromEntries(PAYG_ITEMS.map((i) => [i.key, 0]));
  const emptyBusiness = () => Object.fromEntries(BUSINESS_ITEMS.map((i) => [i.key, 0]));
  const emptyDeductions = () => Object.fromEntries(DEDUCTION_ITEMS.map((i) => [i.key, 0]));
  const emptyBusinessExpenses = () => Object.fromEntries(BUSINESS_EXPENSE_ITEMS.map((i) => [i.key, 0]));
  const emptySurcharge = () => ({
    reportableFringeBenefits: 0,
    privateHospitalCover: true,
    mlsFamily: false,
    mlsDependents: 0,
    salarySacrifice: 0, // RESC — voluntary employer super above mandatory SG
    frankedDividendsGrossUp: 0, // assessable amount (cash + franking credit)
    frankingCredits: 0, // refundable offset
  });

  // Default people from the source spreadsheet — populated with PAYG only.
  const DEFAULT_PEOPLE = [
    {
      id: "p1",
      name: "Ljupco",
      paygWithheld: 59000,
      paygInstalments: 0,
      voluntaryTaxPaid: 0,
      tsb: 350000,
      paygIncome: { ...emptyPayg(), item1: 200000 },
      businessIncome: emptyBusiness(),
      businessRevenue: 0,
      businessExpenses: emptyBusinessExpenses(),
      deductions: emptyDeductions(),
      taxableIncome: 200000, // derived, kept in sync by calc.recomputePerson
      ...emptySurcharge(),
      employerContribs: {
        "2020-21": 19000,
        "2021-22": 21000,
        "2022-23": 22000,
        "2023-24": 23000,
        "2024-25": 23000,
        "2025-26": 23000,
        "2026-27": 24000,
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
      paygWithheld: 16451,
      paygInstalments: 0,
      voluntaryTaxPaid: 0,
      tsb: 280000,
      paygIncome: { ...emptyPayg(), item1: 220000 },
      businessIncome: emptyBusiness(),
      businessRevenue: 0,
      businessExpenses: emptyBusinessExpenses(),
      deductions: emptyDeductions(),
      taxableIncome: 220000,
      ...emptySurcharge(),
      employerContribs: {
        "2020-21": 18000,
        "2021-22": 20000,
        "2022-23": 22000,
        "2023-24": 23000,
        "2024-25": 23000,
        "2025-26": 23000,
        "2026-27": 24000,
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
    bucketDistributeMode: "distribute", // "distribute" applies imputation top-up; "retain" leaves at 25%
    bucketShareholders: { p1: 0.5, p2: 0.5 },
  };

  return {
    CONCESSIONAL_CAPS,
    TAX_BRACKETS_2024_25,
    MEDICARE_LEVY,
    MEDICARE_LEVY_LOW,
    MEDICARE_LEVY_HIGH,
    MEDICARE_LEVY_PHASE_RATE,
    CONTRIBUTIONS_TAX,
    DIV_293_THRESHOLD,
    DIV_293_EXTRA,
    TSB_CARRY_FORWARD_THRESHOLD,
    COMPANY_BASE_RATE,
    COMPANY_FULL_RATE,
    CARRY_FORWARD_YEARS,
    PAYG_ITEMS,
    BUSINESS_ITEMS,
    BUSINESS_EXPENSE_ITEMS,
    TAX_PAYMENT_ITEMS,
    DEDUCTION_ITEMS,
    LITO_PARAMS,
    MLS_PARAMS,
    ECC_PARAMS,
    DEFAULT_PEOPLE,
    DEFAULT_PROPERTY,
    emptyPayg,
    emptyBusiness,
    emptyBusinessExpenses,
    emptyDeductions,
    emptySurcharge,
  };
})();
