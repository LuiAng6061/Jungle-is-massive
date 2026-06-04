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

  function totalTax(income, brackets) {
    return incomeTax(income, brackets) + medicareLevy(income);
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
  function computePersonIncome(person) {
    const payg = sumValues(person.paygIncome);
    const business = sumValues(person.businessIncome);
    const grossIncome = payg + business;
    const deductions = sumValues(person.deductions);
    const taxableIncome = Math.max(0, grossIncome - deductions);
    return { payg, business, grossIncome, deductions, taxableIncome };
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
    const years = D.CARRY_FORWARD_YEARS; // 2020-21 .. 2024-25
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

  // Compute strategy result for a person + proposed personal-deductible contribution.
  // Adds Div 293 logic and contributions-tax handling.
  function computePersonStrategy(person, contribution, brackets = D.TAX_BRACKETS_2024_25) {
    const incomeBefore = person.taxableIncome;
    const incomeAfter = Math.max(0, incomeBefore - contribution);
    const taxBefore = totalTax(incomeBefore, brackets);
    const taxAfter = totalTax(incomeAfter, brackets);
    const taxSaving = taxBefore - taxAfter;

    // Contributions tax: 15% always. Div 293 adds 15% if Div 293 income > $250k.
    const div293Income = incomeBefore; // simplification (true Div293 adds super contribs but we approximate)
    let div293Extra = 0;
    if (div293Income + contribution > D.DIV_293_THRESHOLD) {
      // Only the amount of contribution above the threshold is taxed.
      const excess = Math.min(contribution, div293Income + contribution - D.DIV_293_THRESHOLD);
      div293Extra = excess * D.DIV_293_EXTRA;
    }
    const contributionsTax = contribution * D.CONTRIBUTIONS_TAX + div293Extra;
    const netBenefit = taxSaving - contributionsTax;

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
      div293Extra,
      netBenefit,
      refundBefore: (person.paygWithheld || 0) - taxBefore,
      refundAfter: (person.paygWithheld || 0) - taxAfter,
      marginalRate: marginalRate(incomeBefore, brackets),
    };
  }

  // Strategy comparison for a single person.
  function buildStrategies(person, customContribution, caps = D.CONCESSIONAL_CAPS, targetYear = "2025-26") {
    const cf = carryForwardAvailable(person, targetYear, caps);
    const employerThisYear = person.employerContribs?.[targetYear] || 0;
    const minContrib = 0;
    // Max personal deductible that fits in available cap (cap minus employer).
    const maxContrib = Math.max(0, cf.totalAvailable - employerThisYear);
    const custom = Math.min(Math.max(0, customContribution || 0), maxContrib);

    const strategies = {
      none: computePersonStrategy(person, 0),
      minimum: computePersonStrategy(person, minContrib),
      maximum: computePersonStrategy(person, maxContrib),
      custom: computePersonStrategy(person, custom),
    };
    return { strategies, cf, employerThisYear, maxContrib };
  }

  // Optimisation: find contribution that maximises net benefit, within available cap.
  // Net benefit only stays positive while marginal rate (after the contribution) >= 15% + div293 share.
  // We bisect across [0, maxContrib]. Function is concave so we can scan.
  function optimiseContribution(person, maxContrib, brackets = D.TAX_BRACKETS_2024_25) {
    if (maxContrib <= 0) return { optimal: 0, net: 0 };
    let best = { optimal: 0, net: 0 };
    const step = Math.max(50, Math.round(maxContrib / 500));
    for (let c = 0; c <= maxContrib; c += step) {
      const r = computePersonStrategy(person, c, brackets);
      if (r.netBenefit > best.net) best = { optimal: c, net: r.netBenefit };
    }
    // Always test the cap itself — for high earners the optimum sits exactly there.
    const cap = computePersonStrategy(person, maxContrib, brackets);
    if (cap.netBenefit > best.net) best = { optimal: maxContrib, net: cap.netBenefit };
    // Refine ±step in $1 increments around the best candidate.
    const lo = Math.max(0, best.optimal - step);
    const hi = Math.min(maxContrib, best.optimal + step);
    for (let c = lo; c <= hi; c += 1) {
      const r = computePersonStrategy(person, c, brackets);
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
  function buildSavingsCurve(person, maxContrib, points = 30, brackets = D.TAX_BRACKETS_2024_25) {
    const series = [];
    const step = Math.max(1, Math.round(maxContrib / points));
    for (let c = 0; c <= maxContrib; c += step) {
      const r = computePersonStrategy(person, c, brackets);
      series.push({ contribution: c, taxSaving: r.taxSaving, contributionsTax: r.contributionsTax, netBenefit: r.netBenefit });
    }
    return series;
  }

  return {
    incomeTax,
    medicareLevy,
    totalTax,
    marginalRate,
    sumValues,
    computePersonIncome,
    recomputePerson,
    totalUsedInYear,
    carryForwardAvailable,
    computePersonStrategy,
    buildStrategies,
    optimiseContribution,
    checkCapExceedance,
    modelPropertyDevelopment,
    buildSavingsCurve,
  };
})();
