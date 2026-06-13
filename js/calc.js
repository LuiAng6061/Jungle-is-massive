// Tax + super calculation engine
window.PlannerCalc = (() => {
  const D = window.PlannerData;

  // Brackets are passed in so future years can be modelled with the assumptions sheet.
  function incomeTax(income, brackets) {
    if (income <= 0) return 0;
    for (let i = 0; i < brackets.length; i++) {
      const b = brackets[i];
      if (income <= b.upTo) {
        const prev = i === 0 ? 0 : brackets[i - 1].upTo;
        return b.base + (income - prev) * b.rate;
      }
    }
    return 0;
  }

  // Medicare levy with the FY 2024-25 low-income threshold.
  //   income ≤ LOW           → 0
  //   LOW < income < HIGH    → phase-in at 10c per dollar above LOW
  //   income ≥ HIGH          → full 2% of income
  function medicareLevy(income) {
    const i = Math.max(0, income);
    const lo = D.MEDICARE_LEVY_LOW;
    const hi = D.MEDICARE_LEVY_HIGH;
    if (i <= lo) return 0;
    if (i >= hi) return i * D.MEDICARE_LEVY;
    return (i - lo) * D.MEDICARE_LEVY_PHASE_RATE;
  }

  // Low Income Tax Offset (LITO) — see LITO_PARAMS.
  function lito(taxableIncome, params = D.LITO_PARAMS) {
    const i = Math.max(0, taxableIncome);
    if (i <= params.firstThreshold) return params.max;
    if (i <= params.secondThreshold) {
      return params.max - (i - params.firstThreshold) * params.firstTaperRate;
    }
    if (i <= params.endThreshold) {
      const midOffset = params.max - (params.secondThreshold - params.firstThreshold) * params.firstTaperRate;
      return Math.max(0, midOffset - (i - params.secondThreshold) * params.secondTaperRate);
    }
    return 0;
  }

  // Medicare Levy Surcharge. Applies if no private hospital cover and
  // surcharge income exceeds the relevant threshold.
  function mls(surchargeIncome, hasHospitalCover, isFamily = false, dependents = 0, params = D.MLS_PARAMS) {
    if (hasHospitalCover) return 0;
    const i = Math.max(0, surchargeIncome);
    let base, t1, t2;
    if (isFamily) {
      const childAdj = Math.max(0, dependents - 1) * params.perChildAdjustment;
      base = params.familyBase + childAdj;
      t1 = params.familyTier1 + childAdj;
      t2 = params.familyTier2 + childAdj;
    } else {
      base = params.singleBase;
      t1 = params.singleTier1;
      t2 = params.singleTier2;
    }
    if (i <= base) return 0;
    let rate;
    if (i <= t1) rate = params.tier1Rate;
    else if (i <= t2) rate = params.tier2Rate;
    else rate = params.tier3Rate;
    return i * rate;
  }

  // Excess Concessional Contributions charge. The excess is added back
  // to taxable income at marginal rate, with a 15% offset for what the
  // fund already paid (the "fund tax offset"). Plus an SIC-style charge
  // for the deferred tax.
  function eccCharge(excessAmount, marginalRateInclMedicare, params = D.ECC_PARAMS) {
    if (excessAmount <= 0) return { additionalTax: 0, interestCharge: 0, total: 0 };
    const grossTaxOnExcess = excessAmount * marginalRateInclMedicare;
    const offset = excessAmount * params.fundTaxOffset;
    const additionalTax = Math.max(0, grossTaxOnExcess - offset);
    const interestCharge = excessAmount * params.sicAnnualRate * (params.avgMonthsOutstanding / 12);
    return {
      additionalTax,
      interestCharge,
      total: additionalTax + interestCharge,
    };
  }

  // Compute the 5 prior FY codes for a target year.
  //   "2025-26" → ["2020-21","2021-22","2022-23","2023-24","2024-25"]
  function getLookbackYears(targetYear) {
    const startYear = parseInt(String(targetYear).split("-")[0]);
    if (!Number.isFinite(startYear)) return D.CARRY_FORWARD_YEARS;
    const years = [];
    for (let i = 5; i >= 1; i--) {
      const s = startYear - i;
      const eShort = String(s + 1).slice(2).padStart(2, "0");
      years.push(`${s}-${eShort}`);
    }
    return years;
  }

  // Full tax calculation including LITO, Medicare, MLS, and refundable
  // franking credits. Used by computePersonStrategy.
  // options:
  //   applyLito          (default true)
  //   surchargeIncome    — if omitted, uses taxableIncome (no RFB/RESC added)
  //   hasHospitalCover   (default true → no MLS)
  //   isFamily           (default false)
  //   dependents         (default 0)
  //   frankingCredits    (default 0) — refundable offset
  function totalTax(taxableIncome, brackets, options = {}) {
    let it = incomeTax(taxableIncome, brackets);
    if (options.applyLito !== false) {
      const offset = lito(taxableIncome);
      it = Math.max(0, it - offset); // LITO is non-refundable against income tax only
    }
    const ml = medicareLevy(taxableIncome);
    const mlsAmt = mls(
      options.surchargeIncome ?? taxableIncome,
      options.hasHospitalCover ?? true,
      options.isFamily ?? false,
      options.dependents ?? 0,
    );
    let total = it + ml + mlsAmt;
    // Franking credits are refundable for individual taxpayers.
    total -= options.frankingCredits || 0;
    return total;
  }

  // Decomposed tax view — used for the per-person tax-breakdown panel.
  function taxBreakdown(taxableIncome, brackets, options = {}) {
    const gross = incomeTax(taxableIncome, brackets);
    const litoOffset = options.applyLito !== false ? lito(taxableIncome) : 0;
    const incomeTaxAfterLito = Math.max(0, gross - litoOffset);
    const ml = medicareLevy(taxableIncome);
    const mlsAmt = mls(
      options.surchargeIncome ?? taxableIncome,
      options.hasHospitalCover ?? true,
      options.isFamily ?? false,
      options.dependents ?? 0,
    );
    const franking = options.frankingCredits || 0;
    const total = incomeTaxAfterLito + ml + mlsAmt - franking;
    return {
      grossIncomeTax: gross,
      litoOffset,
      incomeTaxAfterLito,
      medicareLevy: ml,
      mls: mlsAmt,
      frankingCredits: franking,
      total,
    };
  }

  // Marginal rate at a given income = income-tax bracket rate + Medicare marginal.
  // Medicare marginal is 0 below LOW, 10% in the phase-in zone, and 2% above HIGH.
  function marginalRate(income, brackets) {
    const i = Math.max(0, income);
    let bracketRate = brackets[brackets.length - 1].rate;
    for (const b of brackets) {
      if (i <= b.upTo) { bracketRate = b.rate; break; }
    }
    let medicareMarginal;
    if (i < D.MEDICARE_LEVY_LOW) medicareMarginal = 0;
    else if (i >= D.MEDICARE_LEVY_HIGH) medicareMarginal = D.MEDICARE_LEVY;
    else medicareMarginal = D.MEDICARE_LEVY_PHASE_RATE;
    return bracketRate + medicareMarginal;
  }

  // Sum the values of an object's numeric keys.
  function sumValues(obj) {
    return Object.values(obj || {}).reduce((s, v) => s + (Number(v) || 0), 0);
  }

  // Derive PAYG, business, deductions, and taxable income from the return-form components.
  // If the user fills in the ABN business detail (gross revenue or any
  // expense > 0) we use revenue − expenses as the Item 15B net business
  // income, overriding any direct Item 15B value.
  // Franked dividends (grossed-up) are added to assessable income; the
  // franking credit is applied as a refundable offset at tax-payable time.
  function computePersonIncome(person) {
    const payg = sumValues(person.paygIncome);
    let business = sumValues(person.businessIncome);
    const revenue = person.businessRevenue || 0;
    const businessExpenses = sumValues(person.businessExpenses);
    const usingDetailBreakdown = revenue > 0 || businessExpenses > 0;
    let netBusinessFromDetail = 0;
    if (usingDetailBreakdown) {
      netBusinessFromDetail = revenue - businessExpenses; // can be negative (loss)
      business = business - (person.businessIncome?.item15b || 0) + netBusinessFromDetail;
    }
    const frankedGrossUp = person.frankedDividendsGrossUp || 0;
    const grossIncome = payg + business + frankedGrossUp;
    const deductions = sumValues(person.deductions);
    const taxableIncome = Math.max(0, grossIncome - deductions);
    return {
      payg,
      business,
      frankedGrossUp,
      grossIncome,
      deductions,
      taxableIncome,
      usingDetailBreakdown,
      businessRevenue: revenue,
      businessExpenses,
      netBusinessFromDetail,
    };
  }

  // Sum the year's tax-paid components used to compute refund/payable.
  function totalTaxCredits(person) {
    return (
      (person.paygWithheld || 0) +
      (person.paygInstalments || 0) +
      (person.voluntaryTaxPaid || 0)
    );
  }

  // Keep person.taxableIncome consistent with the components (mutates).
  function recomputePerson(person) {
    if (person.paygIncome || person.businessIncome || person.deductions) {
      person.taxableIncome = computePersonIncome(person).taxableIncome;
    }
    return person;
  }

  // Total concessional contributions used by a person in a year (employer + personal deductible).
  function totalUsedInYear(person, year) {
    const emp = person.employerContribs?.[year] || 0;
    const pers = person.personalContribs?.[year] || 0;
    return emp + pers;
  }

  // Carry-forward unused cap available for a target year (uses the 5 prior years).
  // Returns object with per-year unused cap and total carry-forward available.
  function carryForwardAvailable(person, targetYear = "2025-26", caps = D.CONCESSIONAL_CAPS) {
    const years = getLookbackYears(targetYear);
    const breakdown = years.map((y) => {
      const cap = caps[y] || 0;
      const used = totalUsedInYear(person, y);
      const unused = Math.max(0, cap - used);
      return { year: y, cap, used, unused };
    });
    const totalCarryForward = breakdown.reduce((s, r) => s + r.unused, 0);
    const currentYearCap = caps[targetYear] || 0;
    const eligibleByTsb = (person.tsb || 0) < D.TSB_CARRY_FORWARD_THRESHOLD;
    const totalAvailable = currentYearCap + (eligibleByTsb ? totalCarryForward : 0);
    return {
      breakdown,
      totalCarryForward,
      currentYearCap,
      eligibleByTsb,
      totalAvailable,
      targetYear,
    };
  }

  // Division 293 — additional 15% tax on a high-income earner's low-tax
  // (concessional) contributions. The ATO formula:
  //   Div 293 income = taxable income (post-super-deduction) + adjustments
  //   Low-tax contributions = employer SG + salary sacrifice + personal deductible
  //   Total = Div 293 income + low-tax contributions
  //   If Total > $250k, additional 15% applies to the lesser of:
  //     (a) low-tax contributions, or
  //     (b) Total − $250k.
  // Note that the Total reduces to "pre-super-deduction taxable income +
  // employer SG" — it does not depend on whether the personal contribution
  // is made or not. What does depend on the personal contribution is the
  // size of "low-tax contributions" (capped by the excess).
  function analyzeDiv293(person, personalContribution, employerSG) {
    const preDeductionTaxable = person.taxableIncome || 0;
    const taxReturnTaxable = Math.max(0, preDeductionTaxable - personalContribution);
    const lowTaxContributions = (employerSG || 0) + (personalContribution || 0);
    // Div 293 income adds reportable fringe benefits to taxable income.
    const rfb = person.reportableFringeBenefits || 0;
    const div293Income = taxReturnTaxable + rfb;
    const total = div293Income + lowTaxContributions;
    const threshold = D.DIV_293_THRESHOLD;
    const excess = Math.max(0, total - threshold);
    const taxableContribs = Math.min(lowTaxContributions, excess);
    const tax = taxableContribs * D.DIV_293_EXTRA;
    return {
      preDeductionTaxable,
      taxReturnTaxable,
      rfb,
      employerSG: employerSG || 0,
      personalContribution: personalContribution || 0,
      lowTaxContributions,
      div293Income,
      total,
      threshold,
      excess,
      taxableContribs,
      tax,
      affected: excess > 0,
    };
  }

  // Build the totalTax options for a given person and post-deduction
  // taxable income. The post-deduction value matters for the income-tax
  // base; the surcharge income adds RFB and RESC equivalents.
  function personTaxOptions(person, taxableIncomeForBracket, personalContribution = 0) {
    const rfb = person.reportableFringeBenefits || 0;
    const resc = (person.salarySacrifice || 0) + (personalContribution || 0);
    return {
      surchargeIncome: taxableIncomeForBracket + rfb + resc,
      hasHospitalCover: person.privateHospitalCover !== false,
      isFamily: !!person.mlsFamily,
      dependents: person.mlsDependents || 0,
      frankingCredits: person.frankingCredits || 0,
      applyLito: true,
    };
  }

  // Compute strategy result for a person + proposed personal-deductible contribution.
  // Handles Div 293 properly (including employer SG) and reports marginal
  // Div 293 cost so net benefit reflects the true incremental impact.
  function computePersonStrategy(person, contribution, brackets = D.TAX_BRACKETS_2024_25, employerSG = 0) {
    const incomeBefore = person.taxableIncome;
    const incomeAfter = Math.max(0, incomeBefore - contribution);
    // Surcharge income is invariant of personal contribution (adds RESC back),
    // matching the Div 293 algebra: (taxable − contrib) + (RESC base + contrib).
    const optsBefore = personTaxOptions(person, incomeBefore, 0);
    const optsAfter = personTaxOptions(person, incomeAfter, contribution);
    const taxBefore = totalTax(incomeBefore, brackets, optsBefore);
    const taxAfter = totalTax(incomeAfter, brackets, optsAfter);
    const taxSaving = taxBefore - taxAfter;

    const d293With = analyzeDiv293(person, contribution, employerSG);
    const d293Baseline = analyzeDiv293(person, 0, employerSG);
    const div293Marginal = d293With.tax - d293Baseline.tax;

    const contributionsTax = contribution * D.CONTRIBUTIONS_TAX;
    const netBenefit = taxSaving - contributionsTax - div293Marginal;

    return {
      personId: person.id,
      personName: person.name,
      contribution,
      incomeBefore,
      incomeAfter,
      taxBefore,
      taxAfter,
      taxSaving,
      contributionsTax,
      div293Extra: div293Marginal,      // marginal Div 293 caused by this contribution
      div293Total: d293With.tax,        // total Div 293 in this scenario
      div293Baseline: d293Baseline.tax, // Div 293 if no personal contribution
      employerSG,
      netBenefit,
      taxCredits: totalTaxCredits(person),
      refundBefore: totalTaxCredits(person) - taxBefore,
      refundAfter: totalTaxCredits(person) - taxAfter,
      marginalRate: marginalRate(incomeBefore, brackets),
      breakdownBefore: taxBreakdown(incomeBefore, brackets, optsBefore),
      breakdownAfter: taxBreakdown(incomeAfter, brackets, optsAfter),
    };
  }

  // Strategy comparison for a single person.
  function buildStrategies(person, customContribution, caps = D.CONCESSIONAL_CAPS, targetYear = "2025-26", brackets = D.TAX_BRACKETS_2024_25) {
    const cf = carryForwardAvailable(person, targetYear, caps);
    const employerThisYear = person.employerContribs?.[targetYear] || 0;
    const minContrib = 0;
    // Max personal deductible that fits in available cap (cap minus employer).
    const maxContrib = Math.max(0, cf.totalAvailable - employerThisYear);
    const custom = Math.min(Math.max(0, customContribution || 0), maxContrib);

    const strategies = {
      none: computePersonStrategy(person, 0, brackets, employerThisYear),
      minimum: computePersonStrategy(person, minContrib, brackets, employerThisYear),
      maximum: computePersonStrategy(person, maxContrib, brackets, employerThisYear),
      custom: computePersonStrategy(person, custom, brackets, employerThisYear),
    };
    return { strategies, cf, employerThisYear, maxContrib };
  }

  // Optimisation: find contribution that maximises net benefit, within available cap.
  function optimiseContribution(person, maxContrib, brackets = D.TAX_BRACKETS_2024_25, employerSG = 0) {
    if (maxContrib <= 0) return { optimal: 0, net: 0 };
    let best = { optimal: 0, net: 0 };
    const step = Math.max(50, Math.round(maxContrib / 500));
    for (let c = 0; c <= maxContrib; c += step) {
      const r = computePersonStrategy(person, c, brackets, employerSG);
      if (r.netBenefit > best.net) best = { optimal: c, net: r.netBenefit };
    }
    // Always test the cap itself — for high earners the optimum sits exactly there.
    const cap = computePersonStrategy(person, maxContrib, brackets, employerSG);
    if (cap.netBenefit > best.net) best = { optimal: maxContrib, net: cap.netBenefit };
    // Refine ±step in $1 increments around the best candidate.
    const lo = Math.max(0, best.optimal - step);
    const hi = Math.min(maxContrib, best.optimal + step);
    for (let c = lo; c <= hi; c += 1) {
      const r = computePersonStrategy(person, c, brackets, employerSG);
      if (r.netBenefit > best.net) best = { optimal: c, net: r.netBenefit };
    }
    return best;
  }

  // Cap exceedance check.
  function checkCapExceedance(person, contribution, targetYear, caps = D.CONCESSIONAL_CAPS) {
    const cf = carryForwardAvailable(person, targetYear, caps);
    const employer = person.employerContribs?.[targetYear] || 0;
    const total = employer + contribution;
    const exceedance = total - cf.totalAvailable;
    return {
      employer,
      personal: contribution,
      total,
      available: cf.totalAvailable,
      exceeds: exceedance > 0,
      exceedanceAmount: Math.max(0, exceedance),
      eligibleByTsb: cf.eligibleByTsb,
    };
  }

  // Property development — three ownership comparisons.
  // For the company-owned slices (100% bucket co; trust's bucket share) we
  // model the franking-credit consequence of distributing those retained
  // earnings to the shareholder(s). Under full imputation, distributing to
  // a top-marginal-rate shareholder gives the same effective tax as direct
  // personal ownership. Set property.bucketDistributeMode to "retain" to
  // see the deferred-tax benefit instead.
  function modelPropertyDevelopment(property, people, brackets = D.TAX_BRACKETS_2024_25) {
    const grossProfit =
      property.saleProceeds -
      property.landCost -
      property.constructionCost -
      property.otherCosts;

    const distributeBucket = (property.bucketDistributeMode || "distribute") === "distribute";
    const shareholders = property.bucketShareholders || { p1: 0.5, p2: 0.5 };
    const bucketRate = property.bucketRate;

    function marginalAdditionalTax(person, additional) {
      if (!person || additional <= 0) return 0;
      const base = person.taxableIncome || 0;
      return totalTax(base + additional, brackets) - totalTax(base, brackets);
    }

    // Eventual tax on a slice of profit sitting in the bucket co.
    // If retained: just the company tax (bucketRate × slice).
    // If distributed as a fully franked dividend: the franking system means
    // total tax = sum over shareholders of marginalTaxOn(grossedUpShare),
    // where grossedUpShare = slice × shareholderFraction. The company tax
    // forms part of that total via the franking credit; the shareholder
    // tops up (or is refunded) the difference.
    function bucketTaxOnSlice(slice) {
      const entityTax = slice * bucketRate;
      if (!distributeBucket) {
        return { entityTax, distributionTopUp: 0, totalTax: entityTax };
      }
      let totalShareholderTax = 0;
      Object.entries(shareholders).forEach(([pid, frac]) => {
        const person = people.find((p) => p.id === pid);
        const personalSlice = slice * (frac || 0);
        totalShareholderTax += marginalAdditionalTax(person, personalSlice);
      });
      return {
        entityTax,
        distributionTopUp: totalShareholderTax - entityTax,
        totalTax: totalShareholderTax,
      };
    }

    // 1) Personal ownership (50/50 split between the two people).
    const splitProfit = grossProfit / 2;
    const personalResults = people.slice(0, 2).map((p) => {
      const mt = marginalAdditionalTax(p, splitProfit);
      return {
        name: p.name,
        share: splitProfit,
        entityTax: 0,
        distributionTopUp: 0,
        totalTax: mt,
        effectiveRate: splitProfit > 0 ? mt / splitProfit : 0,
      };
    });
    const personalTotalTax = personalResults.reduce((s, r) => s + r.totalTax, 0);
    const personalNet = grossProfit - personalTotalTax;

    // 2) Discretionary trust — streams to beneficiaries per property.trustDistribution.
    const dist = property.trustDistribution;
    const ljupcoShare = grossProfit * (dist.ljupco || 0);
    const julieShare = grossProfit * (dist.julie || 0);
    const bucketShare = grossProfit * (dist.bucket || 0);

    const trustResults = [];
    if (people[0]) {
      const mt = marginalAdditionalTax(people[0], ljupcoShare);
      trustResults.push({
        name: `${people[0].name} (trust)`,
        share: ljupcoShare,
        entityTax: 0,
        distributionTopUp: 0,
        totalTax: mt,
        effectiveRate: ljupcoShare > 0 ? mt / ljupcoShare : 0,
      });
    }
    if (people[1]) {
      const mt = marginalAdditionalTax(people[1], julieShare);
      trustResults.push({
        name: `${people[1].name} (trust)`,
        share: julieShare,
        entityTax: 0,
        distributionTopUp: 0,
        totalTax: mt,
        effectiveRate: julieShare > 0 ? mt / julieShare : 0,
      });
    }
    const bucketSlice = bucketTaxOnSlice(bucketShare);
    trustResults.push({
      name: `Bucket co${distributeBucket ? " (distributed)" : " (retained)"}`,
      share: bucketShare,
      entityTax: bucketSlice.entityTax,
      distributionTopUp: bucketSlice.distributionTopUp,
      totalTax: bucketSlice.totalTax,
      effectiveRate: bucketShare > 0 ? bucketSlice.totalTax / bucketShare : 0,
    });
    const trustTotalTax = trustResults.reduce((s, r) => s + r.totalTax, 0);
    const trustNet = grossProfit - trustTotalTax;

    // 3) 100% bucket company.
    const companySlice = bucketTaxOnSlice(grossProfit);
    const companyResults = [{
      name: distributeBucket ? "Bucket co (distributed to shareholders)" : "Bucket co (retained)",
      share: grossProfit,
      entityTax: companySlice.entityTax,
      distributionTopUp: companySlice.distributionTopUp,
      totalTax: companySlice.totalTax,
      effectiveRate: grossProfit > 0 ? companySlice.totalTax / grossProfit : 0,
    }];
    const companyTotalTax = companySlice.totalTax;
    const companyNet = grossProfit - companyTotalTax;

    return {
      grossProfit,
      distributeBucket,
      personal: {
        results: personalResults,
        totalTax: personalTotalTax,
        netProfit: personalNet,
        effectiveRate: grossProfit > 0 ? personalTotalTax / grossProfit : 0,
      },
      trust: {
        results: trustResults,
        totalTax: trustTotalTax,
        netProfit: trustNet,
        effectiveRate: grossProfit > 0 ? trustTotalTax / grossProfit : 0,
      },
      company: {
        results: companyResults,
        totalTax: companyTotalTax,
        netProfit: companyNet,
        effectiveRate: grossProfit > 0 ? companyTotalTax / grossProfit : 0,
      },
    };
  }

  // Build a "tax saved vs contribution" series for a person, used for charts.
  function buildSavingsCurve(person, maxContrib, points = 30, brackets = D.TAX_BRACKETS_2024_25, employerSG = 0) {
    const series = [];
    const step = Math.max(1, Math.round(maxContrib / points));
    for (let c = 0; c <= maxContrib; c += step) {
      const r = computePersonStrategy(person, c, brackets, employerSG);
      series.push({ contribution: c, taxSaving: r.taxSaving, contributionsTax: r.contributionsTax, netBenefit: r.netBenefit });
    }
    return series;
  }

  return {
    incomeTax,
    medicareLevy,
    lito,
    mls,
    eccCharge,
    totalTax,
    taxBreakdown,
    marginalRate,
    sumValues,
    getLookbackYears,
    computePersonIncome,
    totalTaxCredits,
    recomputePerson,
    totalUsedInYear,
    carryForwardAvailable,
    analyzeDiv293,
    personTaxOptions,
    computePersonStrategy,
    buildStrategies,
    optimiseContribution,
    checkCapExceedance,
    modelPropertyDevelopment,
    buildSavingsCurve,
  };
})();
