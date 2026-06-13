// Advanced Super & Tax Planner — application logic
(function () {
  const D = window.PlannerData;
  const C = window.PlannerCalc;
  const Charts = window.PlannerCharts;

  // ----- Persistent state -----
  const STATE_KEY = "super_planner_state_v2";
  const LEGACY_STATE_KEY = "super_planner_state_v1";

  function migratePerson(p) {
    if (!p.paygIncome) {
      p.paygIncome = { ...D.emptyPayg(), item1: p.taxableIncome || 0 };
    }
    if (!p.businessIncome) p.businessIncome = D.emptyBusiness();
    if (!p.deductions) p.deductions = D.emptyDeductions();
    if (!p.businessExpenses) p.businessExpenses = D.emptyBusinessExpenses();
    if (p.businessRevenue === undefined) p.businessRevenue = 0;
    if (p.paygInstalments === undefined) p.paygInstalments = 0;
    if (p.voluntaryTaxPaid === undefined) p.voluntaryTaxPaid = 0;
    // Surcharge / offsets / franking — added later.
    const surchargeDefaults = D.emptySurcharge();
    for (const k of Object.keys(surchargeDefaults)) {
      if (p[k] === undefined) p[k] = surchargeDefaults[k];
    }
    C.recomputePerson(p);
    return p;
  }

  function loadState() {
    try {
      let raw = localStorage.getItem(STATE_KEY);
      if (!raw) {
        const legacy = localStorage.getItem(LEGACY_STATE_KEY);
        if (legacy) raw = legacy;
      }
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Array.isArray(s.people)) s.people.forEach(migratePerson);
      return s;
    } catch (e) {
      return null;
    }
  }
  function saveState() {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }

  const initial = loadState() || {
    people: structuredClone(D.DEFAULT_PEOPLE),
    property: structuredClone(D.DEFAULT_PROPERTY),
    caps: { ...D.CONCESSIONAL_CAPS },
    targetYear: "2025-26",
    customContribs: { p1: 15000, p2: 15000 },
    activePersonId: "p1",
    brackets: structuredClone(D.TAX_BRACKETS_2024_25),
    medicareLevy: D.MEDICARE_LEVY,
    medicareLevyLow: D.MEDICARE_LEVY_LOW,
    medicareLevyHigh: D.MEDICARE_LEVY_HIGH,
    medicareLevyPhaseRate: D.MEDICARE_LEVY_PHASE_RATE,
  };
  const state = initial;
  // Sync any persisted Medicare parameters back into the calc-module constants.
  if (state.medicareLevy !== undefined) D.MEDICARE_LEVY = state.medicareLevy;
  if (state.medicareLevyLow !== undefined) D.MEDICARE_LEVY_LOW = state.medicareLevyLow;
  if (state.medicareLevyHigh !== undefined) D.MEDICARE_LEVY_HIGH = state.medicareLevyHigh;
  if (state.medicareLevyPhaseRate !== undefined) D.MEDICARE_LEVY_PHASE_RATE = state.medicareLevyPhaseRate;
  state.people.forEach(C.recomputePerson);

  // ----- Helpers -----
  const money = (n) =>
    (n || 0).toLocaleString("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    });
  const pct = (n) => `${(n * 100).toFixed(1)}%`;

  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function activePerson() {
    return state.people.find((p) => p.id === state.activePersonId) || state.people[0];
  }

  // ----- Navigation -----
  function navigate(pageId) {
    $$(".page").forEach((p) => p.classList.remove("active"));
    $$(".nav li").forEach((l) => l.classList.remove("active"));
    $(`#page-${pageId}`).classList.add("active");
    $(`.nav li[data-page="${pageId}"]`).classList.add("active");
    renderAll();
  }

  // ----- Dashboard -----
  function renderDashboard() {
    const target = state.targetYear;
    const wrap = $("#dashboard-kpis");
    let totalCarry = 0;
    let totalAvail = 0;
    let totalNetBenefit = 0;
    let totalTaxSavingMax = 0;
    let warnings = 0;

    state.people.forEach((p) => {
      const cf = C.carryForwardAvailable(p, target, state.caps);
      totalCarry += cf.totalCarryForward;
      totalAvail += cf.totalAvailable;
      if (!cf.eligibleByTsb) warnings++;
      const employer = p.employerContribs?.[target] || 0;
      const maxContrib = Math.max(0, cf.totalAvailable - employer);
      const r = C.computePersonStrategy(p, maxContrib, state.brackets, employer);
      totalNetBenefit += r.netBenefit;
      totalTaxSavingMax += r.taxSaving;
    });

    wrap.innerHTML = `
      <div class="kpi"><div class="label">Combined carry-forward available</div>
        <div class="value">${money(totalCarry)}</div>
        <div class="delta">Across ${state.people.length} member(s)</div></div>
      <div class="kpi"><div class="label">Total cap for ${target}</div>
        <div class="value">${money(totalAvail)}</div>
        <div class="delta">Including current year cap</div></div>
      <div class="kpi good"><div class="label">Max tax saving (combined)</div>
        <div class="value">${money(totalTaxSavingMax)}</div>
        <div class="delta">At full contribution</div></div>
      <div class="kpi ${totalNetBenefit > 0 ? "good" : "warn"}">
        <div class="label">Max net benefit (combined)</div>
        <div class="value">${money(totalNetBenefit)}</div>
        <div class="delta">Tax saving − 15% contributions tax (− Div 293)</div></div>
    `;

    // Scenarios summary table
    const tbody = $("#dashboard-scenarios tbody");
    tbody.innerHTML = "";
    const labels = ["No contribution", "Minimum (0)", "Maximum", "Custom"];
    const keys = ["none", "minimum", "maximum", "custom"];

    // Combine across people
    const combined = keys.map(() => ({ contribution: 0, taxBefore: 0, taxAfter: 0, taxSaving: 0, contributionsTax: 0, netBenefit: 0 }));
    state.people.forEach((p) => {
      const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, target, state.brackets);
      keys.forEach((k, i) => {
        const s = built.strategies[k];
        combined[i].contribution += s.contribution;
        combined[i].taxBefore += s.taxBefore;
        combined[i].taxAfter += s.taxAfter;
        combined[i].taxSaving += s.taxSaving;
        combined[i].contributionsTax += s.contributionsTax;
        combined[i].netBenefit += s.netBenefit;
      });
    });

    let bestIdx = 0;
    combined.forEach((c, i) => { if (c.netBenefit > combined[bestIdx].netBenefit) bestIdx = i; });

    combined.forEach((s, i) => {
      tbody.insertAdjacentHTML("beforeend", `
        <tr class="${i === bestIdx ? "good-row" : ""}">
          <td>${labels[i]}${i === bestIdx ? ' <span class="chip good">Best</span>' : ""}</td>
          <td>${money(s.contribution)}</td>
          <td>${money(s.taxBefore)}</td>
          <td>${money(s.taxAfter)}</td>
          <td>${money(s.taxSaving)}</td>
          <td>${money(s.contributionsTax)}</td>
          <td><strong>${money(s.netBenefit)}</strong></td>
        </tr>
      `);
    });

    // Dashboard chart
    Charts.dashboardSummary("dashChart", [
      { label: "Tax saving", data: combined.map((c) => c.taxSaving), backgroundColor: "#5eead4" },
      { label: "Contributions tax", data: combined.map((c) => -c.contributionsTax), backgroundColor: "#f59e0b" },
      { label: "Net benefit", data: combined.map((c) => c.netBenefit), backgroundColor: "#6366f1" },
    ], labels);

    // Property summary on dashboard
    const propModel = C.modelPropertyDevelopment(state.property, state.people, state.brackets);
    $("#dashboard-property").innerHTML = `
      <div class="grid grid-3">
        <div class="kpi"><div class="label">Property profit (gross)</div><div class="value">${money(propModel.grossProfit)}</div></div>
        <div class="kpi good"><div class="label">Best structure net</div>
          <div class="value">${money(Math.max(propModel.personal.netProfit, propModel.trust.netProfit, propModel.company.netProfit))}</div>
          <div class="delta">${bestStructureLabel(propModel)}</div></div>
        <div class="kpi bad"><div class="label">Worst structure net</div>
          <div class="value">${money(Math.min(propModel.personal.netProfit, propModel.trust.netProfit, propModel.company.netProfit))}</div>
          <div class="delta">${worstStructureLabel(propModel)}</div></div>
      </div>
    `;

    if (warnings > 0) {
      $("#dashboard-alert").innerHTML = `<div class="alert warn">${warnings} member(s) have TSB ≥ ${money(D.TSB_CARRY_FORWARD_THRESHOLD)} and cannot use carry-forward unused cap for ${target}.</div>`;
    } else {
      $("#dashboard-alert").innerHTML = `<div class="alert good">All members are eligible to use carry-forward unused cap for ${target}.</div>`;
    }

    const dashTarget = document.getElementById("dash-target-display");
    if (dashTarget) dashTarget.textContent = target;

    renderRecommendations();
  }

  // Compute and display the tax-minimising personal-deductible contribution
  // for each member, plus a combined recommendation.
  function renderRecommendations() {
    const target = state.targetYear;
    const wrap = $("#dashboard-recommendations");
    if (!wrap) return;
    let combinedRec = 0;
    let combinedSaving = 0;
    let combinedNet = 0;
    const perPerson = state.people.map((p) => {
      const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, target, state.brackets);
      const opt = C.optimiseContribution(p, built.maxContrib, state.brackets, built.employerThisYear);
      const recommend = opt.optimal;
      const recommendResult = C.computePersonStrategy(p, recommend, state.brackets, built.employerThisYear);
      combinedRec += recommend;
      combinedSaving += recommendResult.taxSaving;
      combinedNet += recommendResult.netBenefit;
      return { person: p, built, recommend, result: recommendResult };
    });

    wrap.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:14px;">
        <div class="kpi good"><div class="label">Recommended contribution (combined)</div>
          <div class="value">${money(combinedRec)}</div>
          <div class="delta">Tax-minimising personal-deductible amount</div></div>
        <div class="kpi"><div class="label">Tax saved if you contribute</div>
          <div class="value">${money(combinedSaving)}</div>
          <div class="delta">Before 15% contributions tax</div></div>
        <div class="kpi good"><div class="label">Net benefit after super tax</div>
          <div class="value">${money(combinedNet)}</div>
          <div class="delta">Cash-in-hand improvement vs no contribution</div></div>
      </div>
      <table>
        <thead><tr><th>Member</th><th>Available cap</th><th>Employer SG</th><th>Recommended personal</th><th>Tax saving</th><th>Contributions tax</th><th>Net benefit</th></tr></thead>
        <tbody>
          ${perPerson.map(({ person, built, recommend, result }) => `
            <tr>
              <td><strong>${person.name}</strong></td>
              <td>${money(built.cf.totalAvailable)}</td>
              <td>${money(built.employerThisYear)}</td>
              <td><strong>${money(recommend)}</strong>${recommend >= built.maxContrib && built.maxContrib > 0 ? ' <span class="chip good">at cap</span>' : ""}</td>
              <td>${money(result.taxSaving)}</td>
              <td>${money(result.contributionsTax)}</td>
              <td><strong>${money(result.netBenefit)}</strong></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
        <button class="btn accent" id="apply-recommendations-btn">Apply recommendation to all members</button>
        <span class="hint" style="align-self:center;">Sets each member's custom contribution to the optimal amount and updates every tab.</span>
      </div>
    `;

    $("#apply-recommendations-btn").onclick = () => {
      perPerson.forEach(({ person, recommend }) => {
        state.customContribs[person.id] = recommend;
      });
      saveState();
      renderAll();
    };
  }

  function bestStructureLabel(m) {
    const arr = [
      { name: "Personal (50/50)", v: m.personal.netProfit },
      { name: "Trust", v: m.trust.netProfit },
      { name: "Bucket co", v: m.company.netProfit },
    ];
    arr.sort((a, b) => b.v - a.v);
    return arr[0].name;
  }
  function worstStructureLabel(m) {
    const arr = [
      { name: "Personal (50/50)", v: m.personal.netProfit },
      { name: "Trust", v: m.trust.netProfit },
      { name: "Bucket co", v: m.company.netProfit },
    ];
    arr.sort((a, b) => a.v - b.v);
    return arr[0].name;
  }

  // ----- People & income editing -----
  function renderPeople() {
    const list = $("#people-list");
    list.innerHTML = "";
    state.people.forEach((p) => {
      const cf = C.carryForwardAvailable(p, state.targetYear, state.caps);
      const employer = p.employerContribs?.[state.targetYear] || 0;
      const inc = C.computePersonIncome(p);

      const paygRows = D.PAYG_ITEMS.map((it) => `
        <tr><td>${it.label}</td>
        <td><input type="number" data-id="${p.id}" data-bind="payg" data-key="${it.key}" value="${p.paygIncome?.[it.key] || 0}" style="width:160px;text-align:right"/></td></tr>
      `).join("");

      const businessRows = D.BUSINESS_ITEMS.map((it) => `
        <tr><td>${it.label}</td>
        <td><input type="number" data-id="${p.id}" data-bind="business" data-key="${it.key}" value="${p.businessIncome?.[it.key] || 0}" style="width:160px;text-align:right"/></td></tr>
      `).join("");

      // D12 shows the PLANNED current-year personal contribution (state.customContribs),
      // not the historical personalContribs[targetYear] which is only used for the
      // carry-forward lookback.
      const personalSuperDeduction = state.customContribs[p.id] || 0;
      const deductionRows = D.DEDUCTION_ITEMS.map((it) => {
        const v = it.key === "D12" ? personalSuperDeduction : (p.deductions?.[it.key] || 0);
        const input = it.readOnly
          ? `<input type="number" value="${v}" disabled style="width:160px;text-align:right;opacity:.7"/>`
          : `<input type="number" data-id="${p.id}" data-bind="deduction" data-key="${it.key}" value="${v}" style="width:160px;text-align:right"/>`;
        return `<tr><td>${it.label}</td><td>${input}</td></tr>`;
      }).join("");

      const businessExpenseRows = D.BUSINESS_EXPENSE_ITEMS.map((it) => `
        <tr><td>${it.label}</td>
        <td><input type="number" data-id="${p.id}" data-bind="businessExpense" data-key="${it.key}" value="${p.businessExpenses?.[it.key] || 0}" style="width:160px;text-align:right"/></td></tr>
      `).join("");
      const totalBusinessExpenses = inc.businessExpenses;
      const netFromDetail = inc.netBusinessFromDetail;

      const taxCredits = C.totalTaxCredits(p);
      const taxOpts = C.personTaxOptions(p, inc.taxableIncome, 0);
      const breakdown = C.taxBreakdown(inc.taxableIncome, state.brackets, taxOpts);
      const taxAtCurrentTaxable = breakdown.total;
      const currentRefund = taxCredits - taxAtCurrentTaxable;

      const node = document.createElement("div");
      node.className = "card";
      node.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0;">${p.name}</h3>
          <span class="chip ${cf.eligibleByTsb ? "good" : "bad"}">TSB ${money(p.tsb || 0)} ${cf.eligibleByTsb ? "✓ eligible" : "✗ ineligible for carry-forward"}</span>
        </div>
        <div class="field-row">
          <div class="field"><label>Name</label><input data-bind="name" data-id="${p.id}" value="${p.name}"/></div>
          <div class="field"><label>Total super balance (30 Jun prior)</label><input type="number" data-bind="tsb" data-id="${p.id}" value="${p.tsb}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Derived taxable income (read-only)</label><input type="number" value="${inc.taxableIncome}" disabled style="opacity:.7"/></div>
          <div class="field"><label>Refund / (payable) at current taxable income</label><input type="number" value="${Math.round(currentRefund)}" disabled style="opacity:.7"/></div>
        </div>

        <div class="grid grid-2" style="margin-top:18px;">
          <div>
            <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">PAYG / employment income (Items 1–3)</h4>
            <table>
              <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${paygRows}
                <tr class="highlight"><td><strong>Total PAYG income</strong></td><td style="text-align:right"><strong>${money(inc.payg)}</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Business / partnership / trust income (Items 13, 15)</h4>
            <table>
              <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                ${businessRows}
                <tr class="highlight"><td><strong>Total business income</strong></td><td style="text-align:right"><strong>${money(inc.business)}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top:18px;">
          <div>
            <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">ABN business income detail${inc.usingDetailBreakdown ? ' <span class="chip good" style="vertical-align:middle">overrides Item 15B</span>' : ''}</h4>
            <table>
              <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                <tr><td>Gross business revenue (sales / fees, ex-GST)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="businessRevenue" value="${p.businessRevenue || 0}" style="width:160px;text-align:right"/></td></tr>
                ${businessExpenseRows}
                <tr class="highlight"><td><strong>Total business expenses</strong></td><td style="text-align:right"><strong>${money(totalBusinessExpenses)}</strong></td></tr>
                <tr class="${netFromDetail < 0 ? 'bad-row' : 'good-row'}">
                  <td><strong>Net business income${inc.usingDetailBreakdown ? ' → Item 15B' : ''}</strong></td>
                  <td style="text-align:right"><strong>${money(netFromDetail)}</strong>${netFromDetail < 0 ? ' <span class="chip bad">loss</span>' : ''}</td></tr>
              </tbody>
            </table>
            <div class="hint" style="margin-top:6px">${inc.usingDetailBreakdown
              ? 'Detail breakdown is active — direct Item 15B above is ignored. Clear revenue &amp; expenses to revert.'
              : 'Leave revenue at $0 to enter Item 15B directly in the table above.'}</div>
          </div>

          <div>
            <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Tax already paid this FY (credits)</h4>
            <table>
              <tbody>
                <tr><td>PAYG withheld (employer)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="paygWithheld" value="${p.paygWithheld || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr><td>PAYG instalments paid (PAYGI quarterly under ABN)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="paygInstalments" value="${p.paygInstalments || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr><td>Voluntary tax payments to ATO</td>
                  <td><input type="number" data-id="${p.id}" data-bind="voluntaryTaxPaid" value="${p.voluntaryTaxPaid || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr class="highlight"><td><strong>Total tax credits</strong></td>
                  <td style="text-align:right"><strong>${money(taxCredits)}</strong></td></tr>
              </tbody>
            </table>
            <div class="hint" style="margin-top:6px">PAYG instalments are quarterly pre-payments the ATO requires once business income passes its threshold. Voluntary payments are any extra you've sent in this year to even out cash flow.</div>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top:18px;">
          <div>
            <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Surcharge, offsets & franking</h4>
            <table>
              <tbody>
                <tr><td>Private hospital cover?</td>
                  <td style="text-align:right"><label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--text);">
                    <input type="checkbox" data-id="${p.id}" data-bind="privateHospitalCover" ${p.privateHospitalCover ? 'checked' : ''}/>
                    ${p.privateHospitalCover ? 'Yes — no MLS' : 'No — MLS applies'}</label></td></tr>
                <tr><td>MLS family threshold?</td>
                  <td style="text-align:right"><label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--text);">
                    <input type="checkbox" data-id="${p.id}" data-bind="mlsFamily" ${p.mlsFamily ? 'checked' : ''}/>
                    ${p.mlsFamily ? 'Family' : 'Single'}</label></td></tr>
                <tr><td>Dependents (for family threshold)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="mlsDependents" value="${p.mlsDependents || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr><td>Reportable fringe benefits (RFB)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="reportableFringeBenefits" value="${p.reportableFringeBenefits || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr><td>Salary sacrifice super (RESC)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="salarySacrifice" value="${p.salarySacrifice || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr><td>Franked dividends — grossed-up (Item 11U)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="frankedDividendsGrossUp" value="${p.frankedDividendsGrossUp || 0}" style="width:160px;text-align:right"/></td></tr>
                <tr><td>Franking credits attached (Item 11V)</td>
                  <td><input type="number" data-id="${p.id}" data-bind="frankingCredits" value="${p.frankingCredits || 0}" style="width:160px;text-align:right"/></td></tr>
              </tbody>
            </table>
            <div class="hint" style="margin-top:6px">RFB &amp; RESC add to MLS and Div 293 income but don't change taxable income. Franked dividend gross-up flows into taxable income; the franking credit is a refundable tax offset.</div>
          </div>
          <div>
            <h4 style="margin:0 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Tax breakdown at current taxable income ${money(inc.taxableIncome)}</h4>
            <table>
              <tbody>
                <tr><td>Income tax (gross, brackets)</td><td style="text-align:right">${money(breakdown.grossIncomeTax)}</td></tr>
                <tr><td>Less: LITO offset</td><td style="text-align:right">− ${money(breakdown.litoOffset)}</td></tr>
                <tr><td>Income tax after LITO</td><td style="text-align:right">${money(breakdown.incomeTaxAfterLito)}</td></tr>
                <tr><td>Plus: Medicare levy (2%)</td><td style="text-align:right">+ ${money(breakdown.medicareLevy)}</td></tr>
                <tr><td>Plus: Medicare Levy Surcharge</td><td style="text-align:right">+ ${money(breakdown.mls)}</td></tr>
                <tr><td>Less: franking credits (refundable)</td><td style="text-align:right">− ${money(breakdown.frankingCredits)}</td></tr>
                <tr class="highlight"><td><strong>Total tax</strong></td><td style="text-align:right"><strong>${money(breakdown.total)}</strong></td></tr>
                <tr><td>Total tax credits (PAYG / PAYGI / voluntary)</td><td style="text-align:right">− ${money(taxCredits)}</td></tr>
                <tr class="${currentRefund >= 0 ? 'good-row' : 'bad-row'}">
                  <td><strong>${currentRefund >= 0 ? 'Estimated refund' : 'Estimated payable'}</strong></td>
                  <td style="text-align:right"><strong>${money(Math.abs(currentRefund))}</strong></td></tr>
              </tbody>
            </table>
            <div class="hint" style="margin-top:6px">Does not include the planned personal super deduction (modelled separately in Strategy comparison).</div>
          </div>
        </div>

        <h4 style="margin:18px 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Deductions (D1 – D15)</h4>
        <table>
          <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            ${deductionRows}
            <tr class="highlight"><td><strong>Total deductions</strong></td><td style="text-align:right"><strong>${money(inc.deductions + personalSuperDeduction)}</strong></td></tr>
          </tbody>
        </table>

        <div class="grid grid-3" style="margin-top:14px;">
          <div class="kpi"><div class="label">Gross assessable income</div><div class="value">${money(inc.grossIncome)}</div><div class="delta">PAYG ${money(inc.payg)} + Business ${money(inc.business)}</div></div>
          <div class="kpi"><div class="label">Total deductions (excl. D12)</div><div class="value">${money(inc.deductions)}</div><div class="delta">D12 personal super tracked separately</div></div>
          <div class="kpi good"><div class="label">Taxable income before super</div><div class="value">${money(inc.taxableIncome)}</div></div>
        </div>

        <h4 style="margin:18px 0 8px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Concessional contributions per FY (employer + personal)</h4>
        <table>
          <thead><tr><th>Year</th><th>Cap</th><th>Employer</th><th>Personal</th><th>Used</th><th>Unused</th></tr></thead>
          <tbody>
            ${C.getLookbackYears(state.targetYear).map((y) => {
              const cap = state.caps[y] || 0;
              const emp = p.employerContribs?.[y] || 0;
              const pers = p.personalContribs?.[y] || 0;
              const used = emp + pers;
              const unused = Math.max(0, cap - used);
              const over = used > cap;
              return `<tr class="${over ? "bad-row" : ""}">
                <td>${y}</td>
                <td>${money(cap)}</td>
                <td><input type="number" data-bind="employer" data-id="${p.id}" data-year="${y}" value="${emp}" style="width:120px"/></td>
                <td><input type="number" data-bind="personal" data-id="${p.id}" data-year="${y}" value="${pers}" style="width:120px"/></td>
                <td>${money(used)}${over ? ' <span class="chip bad">over</span>' : ""}</td>
                <td>${money(unused)}</td>
              </tr>`;
            }).join("")}
            <tr class="highlight">
              <td><strong>${state.targetYear}</strong> (target)</td>
              <td>${money(state.caps[state.targetYear])}</td>
              <td><input type="number" data-bind="employer" data-id="${p.id}" data-year="${state.targetYear}" value="${employer}" style="width:120px"/></td>
              <td><em>set in Strategy tab</em></td>
              <td colspan="2"><strong>Available cap (incl. carry-forward): ${money(cf.totalAvailable)}</strong></td>
            </tr>
          </tbody>
        </table>
      `;
      list.appendChild(node);
    });

    // Bind events
    $$("#people-list input").forEach((inp) => {
      inp.addEventListener("change", (e) => {
        const id = e.target.dataset.id;
        const bind = e.target.dataset.bind;
        const year = e.target.dataset.year;
        const key = e.target.dataset.key;
        const person = state.people.find((p) => p.id === id);
        if (!person) return;
        let val;
        if (e.target.type === "checkbox") val = e.target.checked;
        else if (e.target.type === "number") val = Number(e.target.value);
        else val = e.target.value;
        if (bind === "employer") person.employerContribs[year] = val;
        else if (bind === "personal") person.personalContribs[year] = val;
        else if (bind === "payg") person.paygIncome[key] = val;
        else if (bind === "business") person.businessIncome[key] = val;
        else if (bind === "businessExpense") person.businessExpenses[key] = val;
        else if (bind === "deduction") person.deductions[key] = val;
        else person[bind] = val;
        C.recomputePerson(person);
        saveState();
        renderAll();
      });
    });
  }

  // ----- Carry-forward page -----
  function renderCarryForward() {
    const wrap = $("#cf-content");
    wrap.innerHTML = "";

    state.people.forEach((p, idx) => {
      const cf = C.carryForwardAvailable(p, state.targetYear, state.caps);
      const currentYearUsed = p.employerContribs?.[state.targetYear] || 0;
      const cardId = `cf-chart-${p.id}`;
      wrap.insertAdjacentHTML("beforeend", `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <h3 style="margin:0">${p.name} — Carry-forward cap tracker</h3>
            <span class="chip ${cf.eligibleByTsb ? "good" : "bad"}">${cf.eligibleByTsb ? "Eligible (TSB < $500k)" : "Ineligible (TSB ≥ $500k)"}</span>
          </div>
          <div class="grid grid-4" style="margin-top:16px;">
            <div class="kpi"><div class="label">Total carry-forward</div><div class="value">${money(cf.totalCarryForward)}</div></div>
            <div class="kpi"><div class="label">Current year cap (${state.targetYear})</div><div class="value">${money(cf.currentYearCap)}</div></div>
            <div class="kpi good"><div class="label">Total available cap</div><div class="value">${money(cf.totalAvailable)}</div></div>
            <div class="kpi"><div class="label">Employer contribs ${state.targetYear}</div><div class="value">${money(currentYearUsed)}</div></div>
          </div>
          <table style="margin-top:16px;">
            <thead><tr><th>Year</th><th>Cap</th><th>Used</th><th>Unused (carried fwd)</th></tr></thead>
            <tbody>
              ${cf.breakdown.map((b) => `
                <tr><td>${b.year}</td><td>${money(b.cap)}</td><td>${money(b.used)}</td><td><strong>${money(b.unused)}</strong></td></tr>
              `).join("")}
              <tr class="highlight"><td><strong>Total carried forward</strong></td><td></td><td></td><td><strong>${money(cf.totalCarryForward)}</strong></td></tr>
            </tbody>
          </table>
          <div class="chart-wrap" style="margin-top:18px;"><canvas id="${cardId}"></canvas></div>
        </div>
      `);
    });

    // Render charts after DOM
    state.people.forEach((p) => {
      const cf = C.carryForwardAvailable(p, state.targetYear, state.caps);
      const currentYearUsed = p.employerContribs?.[state.targetYear] || 0;
      Charts.capUsageStacked(`cf-chart-${p.id}`, cf.breakdown, cf.currentYearCap, currentYearUsed);
    });
  }

  // ----- Strategy comparison page -----
  function renderStrategy() {
    // Person tabs
    const tabsWrap = $("#strategy-person-tabs");
    tabsWrap.innerHTML = state.people.map((p) =>
      `<div class="person-tab ${p.id === state.activePersonId ? "active" : ""}" data-pid="${p.id}">${p.name}</div>`
    ).join("");
    $$(".person-tab", tabsWrap).forEach((el) => {
      el.addEventListener("click", () => {
        state.activePersonId = el.dataset.pid;
        saveState();
        renderStrategy();
      });
    });

    const p = activePerson();
    const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, state.targetYear, state.brackets);
    const cf = built.cf;
    const employer = built.employerThisYear;
    const exceed = C.checkCapExceedance(p, state.customContribs[p.id] || 0, state.targetYear, state.caps);

    // Income KPIs
    $("#strategy-kpis").innerHTML = `
      <div class="kpi"><div class="label">Taxable income</div><div class="value">${money(p.taxableIncome)}</div></div>
      <div class="kpi"><div class="label">Marginal rate (incl. Medicare)</div><div class="value">${pct(built.strategies.none.marginalRate)}</div></div>
      <div class="kpi"><div class="label">Available cap ${state.targetYear}</div><div class="value">${money(cf.totalAvailable)}</div><div class="delta">Carry-fwd ${money(cf.totalCarryForward)} + cap ${money(cf.currentYearCap)}</div></div>
      <div class="kpi"><div class="label">Employer contribs already in cap</div><div class="value">${money(employer)}</div><div class="delta">Max personal deductible: ${money(built.maxContrib)}</div></div>
    `;

    // Custom contribution control + optimiser
    $("#strategy-custom-wrap").innerHTML = `
      <div class="field-row" style="align-items:flex-end;">
        <div class="field">
          <label>Custom personal deductible contribution</label>
          <input type="number" id="custom-contrib-input" value="${state.customContribs[p.id]}" min="0" max="${built.maxContrib}"/>
          <div class="hint">Capped at ${money(built.maxContrib)} (your available cap minus employer SG)</div>
        </div>
        <div class="field">
          <button class="btn accent" id="optimise-btn">Auto-optimise for max net benefit</button>
        </div>
      </div>
    `;
    $("#custom-contrib-input").addEventListener("change", (e) => {
      state.customContribs[p.id] = Math.max(0, Number(e.target.value || 0));
      saveState();
      renderStrategy();
    });
    $("#optimise-btn").addEventListener("click", () => {
      const result = C.optimiseContribution(p, built.maxContrib, state.brackets, employer);
      state.customContribs[p.id] = result.optimal;
      saveState();
      renderStrategy();
    });

    // Cap exceedance alert
    const alertWrap = $("#strategy-alert");
    if (exceed.exceeds) {
      const mr = C.marginalRate(p.taxableIncome || 0, state.brackets);
      const ecc = C.eccCharge(exceed.exceedanceAmount, mr);
      alertWrap.innerHTML = `<div class="alert bad">⚠ <strong>Cap exceedance:</strong> total ${money(exceed.total)} exceeds available ${money(exceed.available)} by <strong>${money(exceed.exceedanceAmount)}</strong>.
        <ul style="margin:8px 0 0 18px; padding:0;">
          <li>Excess goes back onto your return at marginal ${(mr*100).toFixed(0)}% (less 15% fund-tax offset) = <strong>${money(ecc.additionalTax)}</strong> extra income tax</li>
          <li>Plus ATO Shortfall Interest Charge ≈ ${(D.ECC_PARAMS.sicAnnualRate*100).toFixed(1)}% × ${D.ECC_PARAMS.avgMonthsOutstanding} mo = <strong>${money(ecc.interestCharge)}</strong></li>
          <li><strong>Total cost of the excess ≈ ${money(ecc.total)}</strong> (wipes out the contribution benefit).</li>
        </ul>
        Reduce your custom contribution to ${money(built.maxContrib)} to stay within cap.</div>`;
    } else if (state.customContribs[p.id] > 0) {
      alertWrap.innerHTML = `<div class="alert good">✓ Within cap. Total concessional contributions ${money(exceed.total)} of ${money(exceed.available)} available.</div>`;
    } else {
      alertWrap.innerHTML = "";
    }

    // Strategy cards
    const labels = { none: "No contribution", minimum: "Minimum ($0)", maximum: "Maximum cap", custom: "Custom" };
    let bestKey = "none";
    Object.keys(built.strategies).forEach((k) => {
      if (built.strategies[k].netBenefit > built.strategies[bestKey].netBenefit) bestKey = k;
    });

    $("#strategy-cards").innerHTML = ["none", "minimum", "maximum", "custom"].map((k) => {
      const s = built.strategies[k];
      return `
        <div class="strategy-card ${k === bestKey ? "best" : ""}">
          <h4>${labels[k]}${k === bestKey ? ' · Best' : ""}</h4>
          <div class="big">${money(s.netBenefit)}</div>
          <div style="font-size:11px;color:var(--muted);margin-bottom:8px;">Net benefit</div>
          <div class="row"><span>Contribution</span><span>${money(s.contribution)}</span></div>
          <div class="row"><span>Tax before</span><span>${money(s.taxBefore)}</span></div>
          <div class="row"><span>Tax after</span><span>${money(s.taxAfter)}</span></div>
          <div class="row"><span>Tax saving</span><span>${money(s.taxSaving)}</span></div>
          <div class="row"><span>Contributions tax (15%)</span><span>${money(s.contributionsTax)}</span></div>
          ${s.div293Total > 0 ? `<div class="row"><span>Div 293 (total in scenario)</span><span>${money(s.div293Total)}</span></div>` : ""}
          ${s.div293Extra > 0 ? `<div class="row"><span>↳ marginal Div 293 vs no contrib</span><span>${money(s.div293Extra)}</span></div>` : ""}
          <div class="row"><span>Refund/(payable) after</span><span>${money(s.refundAfter)}</span></div>
        </div>
      `;
    }).join("");

    // Strategy bar chart
    Charts.strategyComparison("strategyBarChart", built.strategies);

    // Savings curve
    const curve = C.buildSavingsCurve(p, built.maxContrib, 30, state.brackets, employer);
    Charts.savingsCurve("savingsCurveChart", curve, `${p.name}'s personal deductible contribution`);
  }

  // ----- Property page -----
  function renderProperty() {
    const prop = state.property;
    if (!prop.bucketDistributeMode) prop.bucketDistributeMode = "distribute";
    if (!prop.bucketShareholders) prop.bucketShareholders = { p1: 0.5, p2: 0.5 };

    const fields = $("#property-inputs");
    fields.innerHTML = `
      <div class="field-row">
        <div class="field"><label>Sale proceeds</label><input type="number" data-pkey="saleProceeds" value="${prop.saleProceeds}"/></div>
        <div class="field"><label>Land cost</label><input type="number" data-pkey="landCost" value="${prop.landCost}"/></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Construction cost</label><input type="number" data-pkey="constructionCost" value="${prop.constructionCost}"/></div>
        <div class="field"><label>Other costs (interest, fees, GST etc.)</label><input type="number" data-pkey="otherCosts" value="${prop.otherCosts}"/></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Bucket company tax rate</label>
          <select data-pkey="bucketRate">
            <option value="0.25" ${prop.bucketRate === 0.25 ? "selected" : ""}>25% base rate entity</option>
            <option value="0.30" ${prop.bucketRate === 0.30 ? "selected" : ""}>30% full rate</option>
          </select>
        </div>
        <div class="field"><label>Bucket co distribution scenario</label>
          <select data-pkey="bucketDistributeMode">
            <option value="distribute" ${prop.bucketDistributeMode === "distribute" ? "selected" : ""}>Distribute as franked dividend (apples-to-apples)</option>
            <option value="retain" ${prop.bucketDistributeMode === "retain" ? "selected" : ""}>Retain in company (defer tax)</option>
          </select>
        </div>
      </div>
      <div class="field-row">
        <div class="field"><label>Bucket shareholder — ${state.people[0]?.name || "Person 1"} (%)</label><input type="number" data-pkey="shr.p1" value="${((prop.bucketShareholders.p1 || 0) * 100).toFixed(0)}"/></div>
        <div class="field"><label>Bucket shareholder — ${state.people[1]?.name || "Person 2"} (%)</label><input type="number" data-pkey="shr.p2" value="${((prop.bucketShareholders.p2 || 0) * 100).toFixed(0)}"/></div>
      </div>
      <h4 style="margin:14px 0 6px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Trust distribution (must total 100%)</h4>
      <div class="field-row">
        <div class="field"><label>${state.people[0]?.name || "Person 1"} (%)</label><input type="number" data-pkey="dist.ljupco" value="${(prop.trustDistribution.ljupco * 100).toFixed(0)}"/></div>
        <div class="field"><label>${state.people[1]?.name || "Person 2"} (%)</label><input type="number" data-pkey="dist.julie" value="${(prop.trustDistribution.julie * 100).toFixed(0)}"/></div>
      </div>
      <div class="field">
        <label>Bucket company (%)</label>
        <input type="number" data-pkey="dist.bucket" value="${(prop.trustDistribution.bucket * 100).toFixed(0)}"/>
      </div>
      <div class="field"><label>Year</label><input type="text" data-pkey="year" value="${prop.year}"/></div>
    `;

    $$("#property-inputs input, #property-inputs select").forEach((el) => {
      el.addEventListener("change", (e) => {
        const key = e.target.dataset.pkey;
        const isNumeric = e.target.type === "number";
        if (key === "year") prop.year = e.target.value;
        else if (key === "bucketDistributeMode") prop.bucketDistributeMode = e.target.value;
        else if (key === "dist.ljupco") prop.trustDistribution.ljupco = Number(e.target.value) / 100;
        else if (key === "dist.julie") prop.trustDistribution.julie = Number(e.target.value) / 100;
        else if (key === "dist.bucket") prop.trustDistribution.bucket = Number(e.target.value) / 100;
        else if (key === "shr.p1") prop.bucketShareholders.p1 = Number(e.target.value) / 100;
        else if (key === "shr.p2") prop.bucketShareholders.p2 = Number(e.target.value) / 100;
        else prop[key] = isNumeric ? Number(e.target.value) : e.target.value;
        saveState();
        renderProperty();
      });
    });

    const model = C.modelPropertyDevelopment(prop, state.people, state.brackets);
    const distTotal = prop.trustDistribution.ljupco + prop.trustDistribution.julie + prop.trustDistribution.bucket;
    const shrTotal = (prop.bucketShareholders.p1 || 0) + (prop.bucketShareholders.p2 || 0);

    $("#property-kpis").innerHTML = `
      <div class="kpi"><div class="label">Gross profit</div><div class="value">${money(model.grossProfit)}</div></div>
      <div class="kpi"><div class="label">Personal — net after tax</div><div class="value">${money(model.personal.netProfit)}</div><div class="delta">Effective rate ${pct(model.personal.effectiveRate)}</div></div>
      <div class="kpi"><div class="label">Trust — net after tax</div><div class="value">${money(model.trust.netProfit)}</div><div class="delta">Effective rate ${pct(model.trust.effectiveRate)}</div></div>
      <div class="kpi"><div class="label">Bucket co — net after tax</div><div class="value">${money(model.company.netProfit)}</div><div class="delta">Effective rate ${pct(model.company.effectiveRate)}</div></div>
    `;

    const alerts = [];
    if (Math.abs(distTotal - 1) > 0.001) {
      alerts.push(`<div class="alert bad">Trust distribution totals ${(distTotal * 100).toFixed(0)}%, not 100%. Adjust the percentages.</div>`);
    }
    if (Math.abs(shrTotal - 1) > 0.001) {
      alerts.push(`<div class="alert warn">Bucket co shareholder split totals ${(shrTotal * 100).toFixed(0)}%, not 100%. Adjust the split.</div>`);
    }
    if (alerts.length === 0) {
      const ranking = [
        { name: "Personal (50/50)", v: model.personal.netProfit },
        { name: "Discretionary trust", v: model.trust.netProfit },
        { name: "100% bucket company", v: model.company.netProfit },
      ].sort((a, b) => b.v - a.v);
      const modeNote = model.distributeBucket
        ? "Bucket co tax shown <strong>after franked dividend distribution</strong> — under imputation this equals the shareholders' marginal tax, so bucket co only wins on income-splitting (distributing to lower-marginal beneficiaries), not as a flat 25% rate."
        : "Bucket co tax shown as <strong>company tax only (retained earnings)</strong> — the 25% looks attractive but a top-up of (marginal − 25%) applies whenever earnings are eventually distributed.";
      alerts.push(`<div class="alert info">Optimal structure: <strong>${ranking[0].name}</strong> (${money(ranking[0].v)} net) — ${money(ranking[0].v - ranking[2].v)} better than the worst. ${modeNote}</div>`);
    }
    $("#property-alert").innerHTML = alerts.join("");

    $("#property-detail").innerHTML = `
      <div class="grid grid-3">
        ${["personal", "trust", "company"].map((key) => {
          const m = model[key];
          const title = key === "personal" ? "Personal (50/50)" : key === "trust" ? "Discretionary trust" : "100% bucket company";
          return `
            <div class="card">
              <h3>${title}</h3>
              <table>
                <thead><tr><th>Beneficiary</th><th>Share</th><th>Entity tax</th><th>Dist'n top-up</th><th>Total tax</th><th>Eff. rate</th></tr></thead>
                <tbody>
                  ${m.results.map((r) => `
                    <tr><td>${r.name}</td><td>${money(r.share)}</td><td>${money(r.entityTax || 0)}</td><td>${money(r.distributionTopUp || 0)}</td><td>${money(r.totalTax)}</td><td>${pct(r.effectiveRate)}</td></tr>
                  `).join("")}
                  <tr class="highlight">
                    <td><strong>Total</strong></td>
                    <td>${money(model.grossProfit)}</td>
                    <td>${money(m.results.reduce((s, r) => s + (r.entityTax || 0), 0))}</td>
                    <td>${money(m.results.reduce((s, r) => s + (r.distributionTopUp || 0), 0))}</td>
                    <td><strong>${money(m.totalTax)}</strong></td>
                    <td>${pct(m.effectiveRate)}</td>
                  </tr>
                  <tr class="good-row">
                    <td><strong>Net profit</strong></td>
                    <td colspan="5"><strong>${money(m.netProfit)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          `;
        }).join("")}
      </div>
    `;

    Charts.propertyComparison("propertyChart", model);
  }

  // ----- Assumptions page -----
  function renderAssumptions() {
    const capsTable = $("#caps-table tbody");
    capsTable.innerHTML = Object.keys(state.caps).map((y) => `
      <tr><td>${y}</td><td><input type="number" data-cap-year="${y}" value="${state.caps[y]}" style="width:140px"/></td></tr>
    `).join("");
    $$("#caps-table input").forEach((el) => {
      el.addEventListener("change", (e) => {
        state.caps[e.target.dataset.capYear] = Number(e.target.value);
        saveState();
        renderAll();
      });
    });

    const bracketsTable = $("#brackets-table tbody");
    bracketsTable.innerHTML = state.brackets.map((b, i) => `
      <tr>
        <td><input type="number" data-bracket-idx="${i}" data-field="upTo" value="${isFinite(b.upTo) ? b.upTo : 9999999}" style="width:140px"/></td>
        <td><input type="number" step="0.001" data-bracket-idx="${i}" data-field="rate" value="${b.rate}" style="width:100px"/></td>
        <td><input type="number" data-bracket-idx="${i}" data-field="base" value="${b.base}" style="width:140px"/></td>
      </tr>
    `).join("");
    $$("#brackets-table input").forEach((el) => {
      el.addEventListener("change", (e) => {
        const i = Number(e.target.dataset.bracketIdx);
        const f = e.target.dataset.field;
        const v = Number(e.target.value);
        state.brackets[i][f] = f === "upTo" && v >= 9999999 ? Infinity : v;
        saveState();
        renderAll();
      });
    });

    $("#target-year-input").value = state.targetYear;
    $("#target-year-input").onchange = (e) => {
      state.targetYear = e.target.value;
      saveState();
      renderAll();
    };

    $("#medicare-levy-rate").value = state.medicareLevy;
    $("#medicare-levy-low").value = state.medicareLevyLow;
    $("#medicare-levy-high").value = state.medicareLevyHigh;
    $("#medicare-levy-phase").value = state.medicareLevyPhaseRate;
    const bindML = (id, key, dKey) => {
      $(id).onchange = (e) => {
        const v = Number(e.target.value);
        state[key] = v;
        D[dKey] = v;
        saveState();
        renderAll();
      };
    };
    bindML("#medicare-levy-rate", "medicareLevy", "MEDICARE_LEVY");
    bindML("#medicare-levy-low", "medicareLevyLow", "MEDICARE_LEVY_LOW");
    bindML("#medicare-levy-high", "medicareLevyHigh", "MEDICARE_LEVY_HIGH");
    bindML("#medicare-levy-phase", "medicareLevyPhaseRate", "MEDICARE_LEVY_PHASE_RATE");

    $("#reset-btn").onclick = () => {
      if (confirm("Reset all data to defaults? Your edits will be lost.")) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
      }
    };
    $("#export-btn").onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `super-planner-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  // ----- Master render -----
  // ----- "Should I contribute?" — plain-English feasibility -----
  function renderShouldIContribute() {
    const wrap = $("#should-content");
    if (!wrap) return;
    const target = state.targetYear;

    wrap.innerHTML = state.people.map((p) => {
      const employerSG = p.employerContribs?.[target] || 0;
      const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, target, state.brackets);
      const maxContrib = built.maxContrib;

      // Your tax rate on the next dollar you earn.
      const yourRate = built.strategies.none.marginalRate;
      // Super's tax rate.
      const superRate = 0.15;

      // Is some of the contribution in the Div 293 zone?
      const baseTotal = (p.taxableIncome || 0) + employerSG;
      const baseExcess = Math.max(0, baseTotal - D.DIV_293_THRESHOLD);
      // Each $1 of personal contribution adds 15c Div 293 while:
      //   - baseTotal > threshold (so an excess exists), AND
      //   - employerSG + personal_so_far < baseExcess
      // i.e. for the first max(0, baseExcess - employerSG) dollars of personal contribution.
      const div293ZoneDollars = baseTotal > D.DIV_293_THRESHOLD
        ? Math.max(0, Math.min(maxContrib, baseExcess - employerSG))
        : 0;
      const noDiv293ZoneDollars = Math.max(0, maxContrib - div293ZoneDollars);

      const savingsPerDollarNoDiv293 = Math.max(0, yourRate - superRate);
      const savingsPerDollarDiv293 = Math.max(0, yourRate - superRate - 0.15);

      // Use the maximum scenario as the headline figure (matches the optimiser).
      const maxStrat = built.strategies.maximum;
      const feasible = maxStrat.netBenefit > 0 && maxContrib > 0;

      const pct = (x) => `${(x * 100).toFixed(0)}c`;
      const intMoney = (n) => money(Math.round(n));

      // Coin-flip story numbers (per $1)
      const keepIfNotContributing = 1 - yourRate; // c per $1 kept in pocket
      const inSuperPerDollar = 1 - superRate;     // c per $1 in super
      const winsBy = inSuperPerDollar - keepIfNotContributing; // c won per $1

      // Scaled to max contribution
      const ifKept = maxContrib * keepIfNotContributing;
      const ifSuper = maxContrib * inSuperPerDollar;
      const diff = ifSuper - ifKept;

      const div293Note = div293ZoneDollars > 0 ? `
        <div class="alert warn" style="margin-top:8px;">
          <strong>Heads up — Div 293:</strong> because ${p.name}'s income + employer SG is above $250,000,
          the first <strong>${money(div293ZoneDollars)}</strong> of personal contribution attracts an extra
          15c per dollar (so the saving on those dollars is only <strong>${pct(savingsPerDollarDiv293)}</strong>).
          The remaining <strong>${money(noDiv293ZoneDollars)}</strong> still saves <strong>${pct(savingsPerDollarNoDiv293)}</strong> per dollar.
        </div>
      ` : "";

      return `
        <div class="card">
          <h3 style="margin-top:0">${p.name} — should you put money in super?</h3>

          <div class="compare-row">
            <div class="compare-box your-rate">
              <div class="small">Your tax rate</div>
              <div class="number">${pct(yourRate)}</div>
              <div class="caption">On every extra $1 you earn,<br/>the ATO takes <strong>${pct(yourRate)}</strong>.</div>
            </div>
            <div class="op">−</div>
            <div class="compare-box super-rate">
              <div class="small">Super's tax rate</div>
              <div class="number">${pct(superRate)}</div>
              <div class="caption">When you put money in super,<br/>the fund only pays <strong>${pct(superRate)}</strong>.</div>
            </div>
            <div class="op">=</div>
            <div class="compare-box diff">
              <div class="small">You save per $1</div>
              <div class="number">${pct(savingsPerDollarNoDiv293)}</div>
              <div class="caption">That's <strong>${pct(savingsPerDollarNoDiv293)}</strong> of every dollar<br/>going to YOU instead of the ATO.</div>
            </div>
          </div>

          ${div293Note}

          <div class="story">
            <h4>Think of it like two buckets — $1 in each</h4>
            <div class="step"><span class="bullet">🪣</span> <span><strong>Pocket bucket:</strong> you earn $1 → the ATO takes ${pct(yourRate)} → you keep <strong>${pct(keepIfNotContributing)}</strong>.</span></div>
            <div class="step"><span class="bullet">🏦</span> <span><strong>Super bucket:</strong> you put $1 into super → super pays ${pct(superRate)} tax → super has <strong>${pct(inSuperPerDollar)}</strong>.</span></div>
            <div class="step"><span class="bullet">🏆</span> <span><strong>${pct(inSuperPerDollar)} vs ${pct(keepIfNotContributing)}</strong> — the super bucket wins by <strong>${pct(winsBy)}</strong> for every dollar.</span></div>
          </div>

          ${maxContrib > 0 ? `
            <div class="story">
              <h4>Scaled to ${p.name}'s maximum contribution of ${money(maxContrib)}</h4>
              <div class="step"><span class="bullet">🪣</span> <span>Keep ${money(maxContrib)} in your pocket → ATO takes ${intMoney(maxContrib * yourRate)} → you end up with <strong>${intMoney(ifKept)}</strong> in your bank.</span></div>
              <div class="step"><span class="bullet">🏦</span> <span>Put ${money(maxContrib)} in super → super pays ${intMoney(maxContrib * superRate)} tax → super has <strong>${intMoney(ifSuper)}</strong>${div293ZoneDollars > 0 ? ` (then less ${intMoney(div293ZoneDollars * 0.15)} Div 293 = ${intMoney(ifSuper - div293ZoneDollars * 0.15)})` : ""}.</span></div>
              <div class="total">
                <strong>Net benefit:</strong> putting it in super leaves you ${intMoney(maxStrat.netBenefit)} better off than keeping it.
                <span style="color:var(--muted);font-size:12px;display:block;margin-top:4px;">(tax saving ${intMoney(maxStrat.taxSaving)} − contributions tax ${intMoney(maxStrat.contributionsTax)}${maxStrat.div293Extra > 0 ? ` − marginal Div 293 ${intMoney(maxStrat.div293Extra)}` : ""})</span>
              </div>
            </div>
          ` : `
            <div class="alert warn">${p.name} has no concessional cap available this year (employer SG already fills the cap).</div>
          `}

          <div class="verdict ${feasible ? "yes" : "no"}">
            <div class="big-answer">${feasible ? "✓ YES" : "✗ NO"}</div>
            <div class="summary">
              ${feasible
                ? `It's worth contributing — every $1 of personal contribution puts ${pct(savingsPerDollarNoDiv293)}${div293ZoneDollars > 0 ? `–${pct(savingsPerDollarDiv293)}` : ""} back in your pocket instead of the ATO's. Recommended amount: <strong>${money(maxContrib)}</strong>, saving <strong>${intMoney(maxStrat.netBenefit)}</strong>.`
                : maxContrib === 0
                  ? `There's no concessional cap left for ${p.name} this year — the employer SG already uses it up.`
                  : `${p.name}'s tax rate (${pct(yourRate)}) is below super's tax rate (${pct(superRate)}${div293ZoneDollars > 0 ? ` + 15% Div 293` : ""}), so contributing would actually cost more than it saves.`}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ----- Division 293 page -----
  function renderDiv293() {
    const wrap = $("#div293-content");
    if (!wrap) return;
    const kpiWrap = $("#div293-kpis");
    const target = state.targetYear;

    const analyses = state.people.map((p) => {
      const employerSG = p.employerContribs?.[target] || 0;
      const personalContrib = state.customContribs[p.id] || 0;
      const personalCapped = Math.min(personalContrib, Math.max(0, (state.caps[target] || 0) + 0));
      const cur = C.analyzeDiv293(p, personalContrib, employerSG);
      const noContrib = C.analyzeDiv293(p, 0, employerSG);
      // Maximum personal contribution before any extra Div 293 hits (compared to baseline).
      // Once income + employerSG > threshold, every dollar of personal contribution adds
      // 15c of Div 293 until the contributions cap reaches the excess. Headroom is the
      // gap between current low-tax contribs and the threshold-driven cap.
      const personalHeadroomBeforeExtra = noContrib.total < D.DIV_293_THRESHOLD
        ? D.DIV_293_THRESHOLD - noContrib.total
        : Math.max(0, noContrib.excess - employerSG);
      return { person: p, employerSG, personalContrib, cur, noContrib, personalHeadroomBeforeExtra };
    });

    const totalCurrent = analyses.reduce((s, a) => s + a.cur.tax, 0);
    const totalBaseline = analyses.reduce((s, a) => s + a.noContrib.tax, 0);
    const affected = analyses.filter((a) => a.cur.affected).length;
    const safeHeadroom = analyses.reduce((s, a) => s + Math.max(0, D.DIV_293_THRESHOLD - a.cur.total), 0);

    kpiWrap.innerHTML = `
      <div class="kpi ${totalCurrent > 0 ? "bad" : "good"}">
        <div class="label">Total Div 293 tax</div>
        <div class="value">${money(totalCurrent)}</div>
        <div class="delta">${affected} of ${analyses.length} member(s) affected</div>
      </div>
      <div class="kpi">
        <div class="label">Div 293 on employer SG alone</div>
        <div class="value">${money(totalBaseline)}</div>
        <div class="delta">Unavoidable while income + SG &gt; ${money(D.DIV_293_THRESHOLD)}</div>
      </div>
      <div class="kpi">
        <div class="label">Marginal Div 293 from personal contribs</div>
        <div class="value">${money(totalCurrent - totalBaseline)}</div>
        <div class="delta">Caused by the current custom contribution amounts</div>
      </div>
      <div class="kpi ${safeHeadroom > 0 ? "good" : ""}">
        <div class="label">Combined headroom before threshold</div>
        <div class="value">${money(safeHeadroom)}</div>
        <div class="delta">Extra income or contributions you can absorb</div>
      </div>
    `;

    wrap.innerHTML = analyses.map(({ person, employerSG, personalContrib, cur, noContrib, personalHeadroomBeforeExtra }) => {
      const baseTotal = person.taxableIncome + employerSG; // total for Div 293 — invariant of personal contrib
      const baseExcess = Math.max(0, baseTotal - D.DIV_293_THRESHOLD);
      const sgCapsTheBase = employerSG >= baseExcess && baseTotal > D.DIV_293_THRESHOLD;
      const personalMarginalRate = C.marginalRate(person.taxableIncome || 0, state.brackets);
      const netPerDollarAtCap = Math.max(0, (personalMarginalRate - 0.15) * 100); // % at cap

      let statusChip;
      if (baseTotal <= D.DIV_293_THRESHOLD) {
        statusChip = `<span class="chip good">Safe — no Div 293</span>`;
      } else if (sgCapsTheBase) {
        statusChip = `<span class="chip warn">Affected on SG — personal contrib adds no further Div 293</span>`;
      } else {
        statusChip = `<span class="chip bad">Affected — personal contrib adds Div 293 up to ${money(baseExcess - employerSG)}</span>`;
      }

      const strategies = [];

      if (baseTotal <= D.DIV_293_THRESHOLD) {
        const headroom = D.DIV_293_THRESHOLD - baseTotal;
        strategies.push({
          cls: "good",
          title: "✓ Div 293 does not apply at any contribution level",
          body: `Pre-super taxable income (${money(person.taxableIncome)}) + employer SG (${money(employerSG)}) = <strong>${money(baseTotal)}</strong>, which is <strong>${money(headroom)}</strong> below the ${money(D.DIV_293_THRESHOLD)} threshold. Personal deductible contributions don't affect this total (the deduction reduces taxable income by exactly what it adds to low-tax contributions), so you can max your cap without triggering Div 293.`,
        });
      } else {
        strategies.push({
          cls: "bad",
          title: `Div 293 of ${money(noContrib.tax)} on employer SG is unavoidable`,
          body: `Your income (${money(person.taxableIncome)}) + employer SG (${money(employerSG)}) = <strong>${money(baseTotal)}</strong> exceeds the ${money(D.DIV_293_THRESHOLD)} threshold by ${money(baseExcess)}. Personal contributions don't change this total — but they do <strong>increase the taxable-contribution base</strong>, which is what attracts the 15% Div 293.`,
        });

        if (sgCapsTheBase) {
          strategies.push({
            cls: "good",
            title: "Personal contributions don't increase your Div 293",
            body: `Your employer SG (${money(employerSG)}) already meets or exceeds the threshold excess (${money(baseExcess)}). The Div 293 base is capped at the excess regardless of personal contribution. Max your cap freely — every dollar still nets ~${netPerDollarAtCap.toFixed(0)}c after 15% contributions tax.`,
          });
        } else {
          const personalBeforeCap = Math.max(0, baseExcess - employerSG);
          strategies.push({
            cls: "warn",
            title: `Each $1 of personal contribution up to ${money(personalBeforeCap)} adds 15c of Div 293`,
            body: `Beyond ${money(personalBeforeCap)} personal contribution, additional Div 293 stops (the taxable-contribution base hits the excess ${money(baseExcess)}). Even at the full marginal Div 293 hit, top-marginal earners still net ~17c per dollar (47% saving − 15% contributions tax − 15% Div 293), so the optimiser correctly recommends contributing to the cap.`,
          });

          // Reduce salary sacrifice (only useful if employerSG > mandatory SG ~11.5% of salary)
          const estMandatorySg = Math.round((person.paygIncome?.item1 || 0) * 0.115);
          if (employerSG > estMandatorySg + 1000) {
            strategies.push({
              cls: "info",
              title: "Reduce voluntary salary sacrifice to lower employer concessional",
              body: `Your employer concessional ${money(employerSG)} is above the mandatory SG floor (~${money(estMandatorySg)} at 11.5%). Reducing salary sacrifice lowers low-tax contributions, which can shrink the Div 293 base — though you also lose the 15% contributions-tax benefit on the sacrificed amount.`,
            });
          }
        }
      }

      // Spouse-shifting strategy — useful any time the other member has Div 293 headroom
      const otherPeople = state.people.filter((q) => q.id !== person.id);
      const spouseHeadroom = otherPeople.map((q) => {
        const empSG = q.employerContribs?.[target] || 0;
        const otherTotal = (q.taxableIncome || 0) + empSG;
        return { name: q.name, total: otherTotal, headroom: Math.max(0, D.DIV_293_THRESHOLD - otherTotal) };
      });
      const spouseUseful = spouseHeadroom.find((s) => s.headroom > 0);
      if (baseTotal > D.DIV_293_THRESHOLD && spouseUseful) {
        strategies.push({
          cls: "info",
          title: `Shift contributions to ${spouseUseful.name} — they have ${money(spouseUseful.headroom)} of Div 293 headroom`,
          body: `Their income + SG = ${money(spouseUseful.total)}, below the threshold. A deductible contribution made through them (subject to their own cap and personal-deductible eligibility) attracts no Div 293. Note: spouse contribution splitting (split-back of up to 85% of last year's contributions) does <em>not</em> reduce your Div 293 — the contribution is still assessed to the original member.`,
        });
      }

      // Carry-forward deferral
      if (baseTotal > D.DIV_293_THRESHOLD) {
        strategies.push({
          cls: "info",
          title: "Defer to a lower-income year via carry-forward",
          body: `Unused concessional cap carries forward up to 5 years (while TSB &lt; $500k). If you expect a future year with income + SG below ${money(D.DIV_293_THRESHOLD)} (retirement, sabbatical, lower-bonus year), holding off and contributing a larger amount then avoids Div 293 entirely on that contribution.`,
        });
      }

      const breakdownRows = [
        ["Taxable income (pre-super-deduction)", money(person.taxableIncome)],
        ["Less: personal deductible contribution", `− ${money(personalContrib)}`],
        ["Tax-return taxable income", money(cur.taxReturnTaxable)],
        ["Plus: employer concessional contributions", `+ ${money(employerSG)}`],
        ["Plus: personal concessional contributions", `+ ${money(personalContrib)}`],
        ["Total low-tax contributions", money(cur.lowTaxContributions)],
        ["= Total for Div 293 comparison", `<strong>${money(cur.total)}</strong>`],
        ["Threshold", money(D.DIV_293_THRESHOLD)],
        ["Excess over threshold", cur.excess > 0 ? `<strong>${money(cur.excess)}</strong>` : "—"],
        ["Taxable contributions (min of low-tax & excess)", money(cur.taxableContribs)],
        ["Div 293 tax (15%)", `<strong>${money(cur.tax)}</strong>`],
      ];

      return `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <h3 style="margin:0">${person.name}</h3>
            ${statusChip}
          </div>
          <div class="grid grid-2" style="margin-top:14px;">
            <div>
              <h4 style="margin:0 0 6px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">Breakdown at current personal contribution ${money(personalContrib)}</h4>
              <table>
                <tbody>
                  ${breakdownRows.map(([k, v]) => `<tr><td>${k}</td><td style="text-align:right">${v}</td></tr>`).join("")}
                </tbody>
              </table>
            </div>
            <div>
              <h4 style="margin:0 0 6px;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;">How to avoid or minimise</h4>
              ${strategies.map((s) => `
                <div class="alert ${s.cls}" style="margin:6px 0;">
                  <strong>${s.title}</strong>
                  <div style="margin-top:4px;">${s.body}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }).join("");
  }


  function renderAll() {
    renderDashboard();
    renderPeople();
    renderCarryForward();
    renderStrategy();
    renderShouldIContribute();
    renderDiv293();
    renderProperty();
    renderAssumptions();
  }

  // ----- Boot -----
  document.addEventListener("DOMContentLoaded", () => {
    $$(".nav li").forEach((li) => {
      li.addEventListener("click", () => navigate(li.dataset.page));
    });
    renderAll();
    navigate("dashboard");
  });
})();
