// Chart helpers — wraps Chart.js with planner styling
window.PlannerCharts = (() => {
  const palette = {
    accent: "#5eead4",
    accent2: "#6366f1",
    good: "#22c55e",
    warn: "#f59e0b",
    bad: "#ef4444",
    text: "#e6ecf5",
    muted: "#94a3b8",
    grid: "rgba(148, 163, 184, 0.15)",
  };

  // Apply common axis styling
  Chart.defaults.color = palette.muted;
  Chart.defaults.borderColor = palette.grid;
  Chart.defaults.font.family =
    '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif';

  const instances = {};

  function destroy(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  function ensure(id, config) {
    destroy(id);
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    instances[id] = new Chart(ctx, config);
    return instances[id];
  }

  const moneyTick = (v) =>
    typeof v === "number"
      ? v.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })
      : v;

  function savingsCurve(id, series, contributionLabel = "Contribution") {
    return ensure(id, {
      type: "line",
      data: {
        labels: series.map((p) => p.contribution),
        datasets: [
          {
            label: "Tax saving",
            data: series.map((p) => p.taxSaving),
            borderColor: palette.accent,
            backgroundColor: "rgba(94,234,212,0.10)",
            fill: true,
            tension: 0.25,
          },
          {
            label: "Contributions tax (15% + Div293)",
            data: series.map((p) => p.contributionsTax),
            borderColor: palette.warn,
            backgroundColor: "rgba(245,158,11,0.08)",
            fill: true,
            tension: 0.25,
          },
          {
            label: "Net benefit",
            data: series.map((p) => p.netBenefit),
            borderColor: palette.accent2,
            backgroundColor: "rgba(99,102,241,0.10)",
            borderWidth: 2.5,
            fill: false,
            tension: 0.25,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { ticks: { callback: moneyTick }, grid: { color: palette.grid } },
          x: {
            ticks: { callback: moneyTick, maxTicksLimit: 8 },
            title: { display: true, text: contributionLabel, color: palette.muted },
            grid: { color: palette.grid },
          },
        },
        plugins: {
          legend: { position: "bottom", labels: { color: palette.text } },
          tooltip: {
            callbacks: {
              label: (c) => `${c.dataset.label}: ${moneyTick(c.parsed.y)}`,
              title: (items) => `Contribution: ${moneyTick(Number(items[0].label))}`,
            },
          },
        },
      },
    });
  }

  function capUsageStacked(id, breakdown, currentYearCap, currentYearUsed) {
    const labels = [...breakdown.map((b) => b.year), breakdown[breakdown.length - 1] ? "2025-26 (target)" : ""].filter(Boolean);
    const used = [...breakdown.map((b) => b.used), currentYearUsed];
    const unused = [...breakdown.map((b) => b.unused), Math.max(0, currentYearCap - currentYearUsed)];
    return ensure(id, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Used", data: used, backgroundColor: palette.accent2 },
          { label: "Unused (carry-forward)", data: unused, backgroundColor: palette.accent },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { color: palette.grid } },
          y: { stacked: true, ticks: { callback: moneyTick }, grid: { color: palette.grid } },
        },
        plugins: { legend: { position: "bottom", labels: { color: palette.text } } },
      },
    });
  }

  function strategyComparison(id, strategies) {
    const labels = ["None", "Minimum", "Maximum", "Custom"];
    const keys = ["none", "minimum", "maximum", "custom"];
    return ensure(id, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Tax saving",
            data: keys.map((k) => strategies[k].taxSaving),
            backgroundColor: palette.accent,
          },
          {
            label: "Contributions tax",
            data: keys.map((k) => -strategies[k].contributionsTax),
            backgroundColor: palette.warn,
          },
          {
            label: "Net benefit",
            data: keys.map((k) => strategies[k].netBenefit),
            backgroundColor: palette.accent2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { ticks: { callback: moneyTick }, grid: { color: palette.grid } },
        },
        plugins: { legend: { position: "bottom", labels: { color: palette.text } } },
      },
    });
  }

  function propertyComparison(id, model) {
    return ensure(id, {
      type: "bar",
      data: {
        labels: ["Personal (50/50)", "Trust (streamed)", "Bucket co only"],
        datasets: [
          {
            label: "Net profit after tax",
            data: [model.personal.netProfit, model.trust.netProfit, model.company.netProfit],
            backgroundColor: palette.accent,
          },
          {
            label: "Total tax",
            data: [model.personal.totalTax, model.trust.totalTax, model.company.totalTax],
            backgroundColor: palette.bad,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { ticks: { callback: moneyTick }, grid: { color: palette.grid } } },
        plugins: { legend: { position: "bottom", labels: { color: palette.text } } },
      },
    });
  }

  function dashboardSummary(id, datasets, labels) {
    return ensure(id, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { ticks: { callback: moneyTick }, grid: { color: palette.grid } } },
        plugins: { legend: { position: "bottom", labels: { color: palette.text } } },
      },
    });
  }

  return {
    destroy,
    savingsCurve,
    capUsageStacked,
    strategyComparison,
    propertyComparison,
    dashboardSummary,
    moneyTick,
  };
})();
