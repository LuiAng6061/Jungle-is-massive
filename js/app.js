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
      const r = C.computePersonStrategy(p, maxContrib, state.brackets);
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
      const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, target);
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
      const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, target);
      const opt = C.optimiseContribution(p, built.maxContrib, state.brackets);
      const recommend = opt.optimal;
      const recommendResult = C.computePersonStrategy(p, recommend, state.brackets);
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

      const personalSuperDeduction = p.personalContribs?.[state.targetYear] || 0;
      const deductionRows = D.DEDUCTION_ITEMS.map((it) => {
        const v = it.key === "D12" ? personalSuperDeduction : (p.deductions?.[it.key] || 0);
        const input = it.readOnly
          ? `<input type="number" value="${v}" disabled style="width:160px;text-align:right;opacity:.7"/>`
          : `<input type="number" data-id="${p.id}" data-bind="deduction" data-key="${it.key}" value="${v}" style="width:160px;text-align:right"/>`;
        return `<tr><td>${it.label}</td><td>${input}</td></tr>`;
      }).join("");

      const node = document.createElement("div");
      node.className = "card";
      node.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="margin:0;">${p.name}</h3>
          <span class="chip ${cf.eligibleByTsb ? "good" : "bad"}">TSB ${money(p.tsb || 0)} ${cf.eligibleByTsb ? "✓ eligible" : "✗ ineligible for carry-forward"}</span>
        </div>
        <div class="field-row">
          <div class="field"><label>Name</label><input data-bind="name" data-id="${p.id}" value="${p.name}"/></div>
          <div class="field"><label>PAYG withheld (current FY)</label><input type="number" data-bind="paygWithheld" data-id="${p.id}" value="${p.paygWithheld}"/></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Total super balance (30 Jun prior)</label><input type="number" data-bind="tsb" data-id="${p.id}" value="${p.tsb}"/></div>
          <div class="field"><label>Derived taxable income (read-only)</label><input type="number" value="${inc.taxableIncome}" disabled style="opacity:.7"/></div>
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
            ${D.CARRY_FORWARD_YEARS.map((y) => {
              const cap = state.caps[y];
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
        const val = e.target.type === "number" ? Number(e.target.value) : e.target.value;
        if (bind === "employer") person.employerContribs[year] = val;
        else if (bind === "personal") person.personalContribs[year] = val;
        else if (bind === "payg") person.paygIncome[key] = val;
        else if (bind === "business") person.businessIncome[key] = val;
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
    const built = C.buildStrategies(p, state.customContribs[p.id], state.caps, state.targetYear);
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
      const result = C.optimiseContribution(p, built.maxContrib, state.brackets);
      state.customContribs[p.id] = result.optimal;
      saveState();
      renderStrategy();
    });

    // Cap exceedance alert
    const alertWrap = $("#strategy-alert");
    if (exceed.exceeds) {
      alertWrap.innerHTML = `<div class="alert bad">⚠ Cap exceedance: total ${money(exceed.total)} exceeds available ${money(exceed.available)} by ${money(exceed.exceedanceAmount)}. Excess is taxed at your marginal rate (less 15% offset) and may attract an excess concessional contributions charge.</div>`;
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
          <div class="row"><span>Contributions tax</span><span>${money(s.contributionsTax)}</span></div>
          ${s.div293Extra > 0 ? `<div class="row"><span>Div 293 extra (15%)</span><span>${money(s.div293Extra)}</span></div>` : ""}
          <div class="row"><span>Refund/(payable) after</span><span>${money(s.refundAfter)}</span></div>
        </div>
      `;
    }).join("");

    // Strategy bar chart
    Charts.strategyComparison("strategyBarChart", built.strategies);

    // Savings curve
    const curve = C.buildSavingsCurve(p, built.maxContrib, 30, state.brackets);
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
  function renderAll() {
    renderDashboard();
    renderPeople();
    renderCarryForward();
    renderStrategy();
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
