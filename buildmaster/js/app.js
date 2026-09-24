// BuildMaster Australia — UI CONTROLLER (vertical slice runner + dashboard + profile)
import { META, PROJECT, SCENARIOS, TOPICS, SKILL_AXES, SUBCONTRACTORS, CLIENT, DEFECTS } from './data.js';
import * as R from './regulatory.js';
import * as E from './engine.js';
import { diagramFor, diagramForTopic } from './diagrams.js';

const $ = (s, el = document) => el.querySelector(s);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let profile = E.loadProfile();
let seed = profile.seed || 1;
let currentPage = 'dashboard';
// Transient run state for the active scenario
let run = null;

// ---------- boot ----------
function boot() {
  $('#disclaimer').textContent = META.disclaimer;
  $('#mode').value = profile.mode;
  $('#mode').addEventListener('change', (e) => { profile.mode = e.target.value; persist(); render(); });
  $('#nav').addEventListener('click', (e) => {
    const li = e.target.closest('li'); if (!li) return;
    setPage(li.dataset.page);
  });
  $('#newProject').addEventListener('click', () => { seed = Math.floor(Math.random() * 1e9); profile.seed = seed; run = null; persist(); setPage('play'); });
  $('#replay').addEventListener('click', () => { const s = prompt('Enter project seed to replay', String(seed)); if (s) { seed = parseInt(s, 10) || seed; profile.seed = seed; run = null; persist(); setPage('play'); } });
  window.addEventListener('hashchange', applyRoute);
  applyRoute();
}

const PAGES = ['dashboard', 'project', 'play', 'findrule', 'review', 'profile', 'assessment'];
// URL-hash routing: each section is its own page (#play, #profile…) with real Back-button support.
function setPage(p) { if ((location.hash.slice(1) || 'dashboard') === p) applyRoute(); else location.hash = p; }
function applyRoute() {
  const p = location.hash.slice(1);
  currentPage = PAGES.includes(p) ? p : 'dashboard';
  document.querySelectorAll('#nav li').forEach((li) => li.classList.toggle('active', li.dataset.page === currentPage));
  window.scrollTo(0, 0);
  render();
}
function persist() { E.saveProfile(profile); syncTopbar(); }
function syncTopbar() {
  $('#tbLevel').textContent = profile.level;
  $('#tbXp').textContent = profile.xp;
  $('#tbLevelName').textContent = E.levelName(profile.level);
}

// ---------- render dispatch ----------
function render() {
  syncTopbar();
  const v = $('#view');
  const title = ({ dashboard: 'Dashboard', project: 'Current project', play: 'Scenario — vertical slice', findrule: 'Find the Rule', review: 'Knowledge review', profile: 'Player profile', assessment: 'Competency assessment' })[currentPage] || '';
  const back = currentPage !== 'dashboard' ? '<button class="backbtn" id="back">← Back</button>' : '';
  $('#crumbs').innerHTML = back + `<span>${title}</span>`;
  const b = $('#back'); if (b) b.onclick = () => { if (history.length > 1) history.back(); else setPage('dashboard'); };
  v.innerHTML = '';
  if (currentPage !== 'play') document.querySelector('.mentor-wrap')?.remove();
  ({ dashboard: renderDashboard, project: renderProject, play: renderPlay, findrule: renderFindRuleStandalone, review: renderReview, profile: renderProfile, assessment: renderAssessment }[currentPage] || renderDashboard)(v);
}

// ---------- dashboard (§41) ----------
function renderDashboard(v) {
  const due = E.dueForReview(profile).length;
  v.appendChild(el(`<div>
    <h2>${esc(PROJECT.name)}</h2>
    <p class="lead">${esc(PROJECT.summary)} · Seed <b>${seed}</b> · ${esc(PROJECT.jurisdiction)} · ${esc(PROJECT.building_class)} · ${esc(PROJECT.ncc_edition)}</p>
    <div class="grid cols3 mb">
      <div class="card"><h3>Stage</h3><div class="big">Roof / envelope</div><div class="muted">5 of 5 MVP stages loaded</div></div>
      <div class="card"><h3>Skill level</h3><div class="big">${profile.level}</div><div class="muted">${esc(E.levelName(profile.level))}</div></div>
      <div class="card"><h3>Knowledge due</h3><div class="big">${due}</div><div class="muted">topics for spaced review</div></div>
    </div>
    <div class="grid cols3 mb">
      <div class="card"><h3>Scenarios done</h3><div class="big">${profile.completedScenarios.length}/${SCENARIOS.length}</div></div>
      <div class="card"><h3>XP</h3><div class="big">${profile.xp}</div></div>
      <div class="card"><h3>Mode</h3><div class="big" style="font-size:20px">${esc(E.MODES[profile.mode].label)}</div></div>
    </div>
    <div class="row">
      <button class="btn" id="go-play">▶ Continue / Play scenario</button>
      <button class="btn ghost" id="go-project">Review documents</button>
      <button class="btn ghost" id="go-find">Find the Rule</button>
      <button class="btn ghost" id="go-review">Knowledge review</button>
    </div>
  </div>`));
  $('#go-play', v).onclick = () => setPage('play');
  $('#go-project', v).onclick = () => setPage('project');
  $('#go-find', v).onclick = () => setPage('findrule');
  $('#go-review', v).onclick = () => setPage('review');
}

// ---------- project / documents (§13) ----------
function renderProject(v) {
  v.appendChild(el(`<div>
    <h2>Project documents</h2>
    <p class="lead">Documents you can cross-reference during investigation. Click through in a scenario to gather evidence.</p>
    <div class="grid cols2">
      ${PROJECT.documents.map((d) => `<div class="card"><h3>${esc(d.name)}</h3><div class="muted">${esc(d.note)}</div></div>`).join('')}
    </div>
    <h3 class="mt">Team</h3>
    <div class="grid cols3">
      ${SUBCONTRACTORS.map((s) => `<div class="card"><h3>${esc(s.trade)}</h3><div class="muted">Competence ${s.competence}/5 · Docs ${s.documentation}/5</div><div class="muted">${esc(s.risk)}</div></div>`).join('')}
      <div class="card"><h3>Client — ${esc(CLIENT.name)}</h3><div class="muted">${esc(CLIENT.note)}</div></div>
    </div>
    <h3 class="mt">Common defects to watch (not all are automatically non-compliant)</h3>
    <div class="grid cols2">
      ${DEFECTS.map((d) => { const tp = TOPICS.find((x) => x.id === d.topic); return `<div class="card"><h3>${esc(d.text)}</h3>
        <div class="muted mb">${esc(d.area)} · <span class="tag ${d.severity === 'critical' || d.severity === 'high' ? 'bad' : d.severity === 'medium' ? 'warn' : ''}">${esc(d.severity)}</span>
        ${d.maybeAcceptable ? ' <span class="tag">may be acceptable — investigate</span>' : ''}</div>
        ${tp ? `<div class="diagram-sm">${diagramForTopic(tp)}</div>` : ''}</div>`; }).join('')}
    </div>
  </div>`));
}

// ---------- the vertical slice runner ----------
const FLOW = ['brief', 'investigate', 'findrule', 'decide', 'consequence', 'learn'];
function startScenario(scn) {
  run = { scn, step: 'brief', evidenceChosen: [], ruleSel: {}, ruleCorrect: false, decisionId: null, result: null, cons: null, hintLevel: 0 };
  mentorOpen = false;
  document.querySelector('.mentor-wrap')?.remove();
}
function renderPlay(v) {
  if (!run) {
    // pick next uncompleted scenario, else first
    const next = SCENARIOS.find((s) => !profile.completedScenarios.includes(s.id)) || SCENARIOS[0];
    v.appendChild(el(`<div>
      <h2>Scenario select</h2>
      <p class="lead">A playable vertical slice: brief → investigate → find the rule → decide → consequence → learn.</p>
      <div class="grid cols2">
        ${SCENARIOS.map((s) => `<div class="card"><h3>${esc(s.title)} ${profile.completedScenarios.includes(s.id) ? '<span class="tag ok">done</span>' : ''}</h3>
          <div class="muted mb">${esc(s.brief)}</div>
          <button class="btn" data-scn="${s.id}">Start</button></div>`).join('')}
      </div>
      <p class="muted mt">Suggested next: <b>${esc(next.title)}</b></p>
    </div>`));
    v.querySelectorAll('[data-scn]').forEach((b) => b.onclick = () => { startScenario(SCENARIOS.find((s) => s.id === b.dataset.scn)); render(); });
    return;
  }
  const scn = run.scn;
  const stepsBar = `<div class="steps">${FLOW.map((f) => {
    const idx = FLOW.indexOf(f), cur = FLOW.indexOf(run.step);
    return `<span class="step ${f === run.step ? 'on' : idx < cur ? 'done' : ''}">${f}</span>`;
  }).join('')}</div>`;
  const wrap = el(`<div><h2>${esc(scn.title)}</h2>${stepsBar}<div id="stepbody"></div></div>`);
  v.appendChild(wrap);
  renderStep($('#stepbody', wrap));
  mountMentor();
}

function renderStep(body) {
  const scn = run.scn;
  if (run.step === 'brief') {
    body.appendChild(el(`<div>
      <div class="card mb"><h3>Site event</h3><p>${esc(scn.brief)}</p>
        <div class="muted">Skills in play: ${scn.skillsTested.join(', ')} · Difficulty ${scn.difficulty}</div></div>
      ${diagramFor(scn) ? `<div class="card mb"><h3>Illustration</h3>${diagramFor(scn)}</div>` : ''}
      <button class="btn" id="next">Investigate ▶</button>
    </div>`));
    $('#next', body).onclick = () => { run.step = 'investigate'; render(); };
    return;
  }
  if (run.step === 'investigate') {
    body.appendChild(el(`<div>
      <p class="lead">Gather evidence. Choose what you'd actually check — some options are distractions.</p>
      <div id="ev"></div>
      <button class="btn mt" id="next">Take what I've gathered ▶</button>
    </div>`));
    const evBox = $('#ev', body);
    scn.evidence.forEach((e) => {
      const b = el(`<button class="choice ${run.evidenceChosen.includes(e.id) ? 'selected' : ''}">${esc(e.label)}${e.doc ? ` <span class="tag">doc: ${esc(e.doc)}</span>` : ''}</button>`);
      b.onclick = () => { const i = run.evidenceChosen.indexOf(e.id); if (i >= 0) run.evidenceChosen.splice(i, 1); else run.evidenceChosen.push(e.id); render(); };
      evBox.appendChild(b);
    });
    $('#next', body).onclick = () => { run.step = 'findrule'; render(); };
    return;
  }
  if (run.step === 'findrule') {
    renderFindRule(body, scn, () => { run.step = 'decide'; render(); });
    return;
  }
  if (run.step === 'decide') {
    body.appendChild(el(`<div>
      <p class="lead">Make the management decision. Consider safety, compliance, quality, documentation and risk — there isn't always one "correct" answer.</p>
      <div id="dec"></div>
      ${E.MODES[profile.mode].freeText ? `<div class="card mt"><h3>Expert: justify it (free text)</h3><textarea id="ft" placeholder="What do you need to establish before proceeding, and why?"></textarea></div>` : ''}
      <button class="btn mt" id="next" disabled>Commit decision ▶</button>
    </div>`));
    const decBox = $('#dec', body);
    const nx = $('#next', body); nx.disabled = !run.decisionId;
    scn.decisions.forEach((d) => {
      const b = el(`<button class="choice ${run.decisionId === d.id ? 'selected' : ''}">${esc(d.label)}${d.note ? ` <span class="tag warn">${esc(d.note)}</span>` : ''}</button>`);
      // Update in place — do NOT re-render, or the expert free-text box would be wiped.
      b.onclick = () => {
        run.decisionId = d.id;
        decBox.querySelectorAll('.choice').forEach((x) => x.classList.remove('selected'));
        b.classList.add('selected');
        nx.disabled = false;
      };
      decBox.appendChild(b);
    });
    // Expert free-text: persist on every keystroke and restore across re-renders.
    const ft = $('#ft', body);
    if (ft) { ft.value = run.freeText || ''; ft.oninput = () => { run.freeText = ft.value; }; }
    nx.onclick = () => {
      if (ft) run.freeText = ft.value;
      run.result = E.scoreScenario(scn, { evidenceChosen: run.evidenceChosen, ruleCorrect: run.ruleCorrect, decisionId: run.decisionId, mode: profile.mode });
      const rng = E.makeRng(E.hashSeed(`${seed}:${scn.id}:${run.decisionId}`));
      run.cons = E.resolveConsequence(scn, run.result, rng);
      run.step = 'consequence'; render();
    };
    return;
  }
  if (run.step === 'consequence') {
    const good = run.cons.good;
    body.appendChild(el(`<div>
      <div class="${good ? 'okbox' : 'badbox'} mb"><b>${good ? 'Outcome' : 'Delayed consequence'}</b><p style="margin:6px 0 0">${esc(run.cons.text)}</p></div>
      <button class="btn" id="next">See what this taught ▶</button>
    </div>`));
    $('#next', body).onclick = () => { run.step = 'learn'; commitResult(); render(); };
    return;
  }
  if (run.step === 'learn') {
    const res = run.result; const l = scn.learn;
    const sp = R.sourcePanel(scn.topic);
    body.appendChild(el(`<div>
      <div class="grid cols3 mb">
        <div class="card"><h3>Evidence</h3><div class="big">${res.dims.evidence}</div></div>
        <div class="card"><h3>Source ID</h3><div class="big">${res.dims.source}</div></div>
        <div class="card"><h3>Decision</h3><div class="big">${res.dims.decision}</div></div>
      </div>
      <div class="card mb"><h3>Learning breakdown</h3>
        <p><b>Root cause:</b> ${esc(l.rootCause)}</p>
        <p><b>Missed evidence:</b> ${esc(l.missedEvidence)}</p>
        <p><b>Better investigation:</b> ${esc(l.better)}</p>
        <p class="muted">+${res.xp} XP · overall ${res.overall}/100</p>
      </div>
      ${diagramFor(scn) ? `<div class="card mb"><h3>Illustration</h3>${diagramFor(scn)}</div>` : ''}
      ${sourcePanelHtml(sp)}
      ${run.freeText ? freeTextFeedback(scn, run.freeText) : ''}
      <div class="row mt"><button class="btn" id="again">Play another scenario</button><button class="btn ghost" id="dash">Back to dashboard</button></div>
    </div>`));
    $('#again', body).onclick = () => { run = null; setPage('play'); };
    $('#dash', body).onclick = () => { run = null; setPage('dashboard'); };
    return;
  }
}

function commitResult() {
  if (run.committed) return; run.committed = true;
  const correctForKnowledge = run.result.overall >= 55 && run.cons.good;
  E.applyResult(profile, run.scn, run.result, correctForKnowledge);
  persist();
}

function freeTextFeedback(scn, text) {
  const rubric = [
    { label: 'Immediate safety / scope', any: ['safety', 'stop', 'affected', 'isolate'] },
    { label: 'Evidence needed', any: ['evidence', 'drawing', 'measure', 'engineer', 'document'] },
    { label: 'Consultation', any: ['engineer', 'surveyor', 'consult', 'rfi'] },
    { label: 'Documentation', any: ['document', 'record', 'photo', 'rfi', 'notice'] },
  ];
  const r = E.evaluateFreeText(text, rubric);
  return `<div class="card mb"><h3>Free-text evaluation (structure, not keywords) — ${r.score}/100</h3>
    <p class="muted">Covered: ${r.covered.map(esc).join(', ') || '—'}</p>
    <p class="muted">Consider also: ${r.missed.map(esc).join(', ') || '—'}</p></div>`;
}

// ---------- Find the Rule (embedded + standalone, §17) ----------
function renderFindRule(body, scn, done) {
  const path = scn.rulePath;
  const steps = [
    { key: 'jurisdiction', label: 'Jurisdiction', opts: ['WA', 'NSW', 'VIC'] },
    { key: 'edition', label: 'Applicable NCC edition', opts: ['NCC 2022', 'NCC 2019', 'NCC 2016'] },
    { key: 'area', label: 'Relevant area', opts: [path.area, 'Fire safety', 'Energy efficiency'].filter(uniq) },
    { key: 'pathway', label: 'Compliance pathway', opts: [path.pathway, 'Performance Solution', 'Unsure'].filter(uniq) },
  ];
  const c = el(`<div>
    <p class="lead">Navigate to the authoritative source — reward is correct source + applicability, not clause memorisation.</p>
    <div id="frsteps"></div>
    <button class="btn mt" id="checkrule" disabled>Confirm source ▶</button>
    <div id="rulefeedback" class="mt"></div>
  </div>`);
  body.appendChild(c);
  const box = $('#frsteps', c);
  steps.forEach((s) => {
    const wrap = el(`<div class="card mb"><h3>${esc(s.label)}</h3><div class="row" data-key="${s.key}"></div></div>`);
    const rowBox = $('.row', wrap);
    shuffleStable(s.opts).forEach((o) => {
      const b = el(`<button class="choice" style="width:auto;display:inline-block;margin:0 8px 0 0">${esc(o)}</button>`);
      b.onclick = () => { run.ruleSel[s.key] = o; rowBox.querySelectorAll('.choice').forEach((x) => x.classList.remove('selected')); b.classList.add('selected'); refresh(); };
      if (run.ruleSel[s.key] === o) b.classList.add('selected');
      rowBox.appendChild(b);
    });
    box.appendChild(wrap);
  });
  const check = $('#checkrule', c);
  function refresh() { check.disabled = steps.some((s) => !run.ruleSel[s.key]); }
  refresh();
  check.onclick = () => {
    const correct = run.ruleSel.jurisdiction === path.jurisdiction && run.ruleSel.edition === path.edition &&
      run.ruleSel.area === path.area && run.ruleSel.pathway === path.pathway;
    run.ruleCorrect = correct;
    const sp = R.sourcePanel(scn.topic);
    $('#rulefeedback', c).innerHTML = `<div class="${correct ? 'okbox' : 'warnbox'} mb">${correct
      ? 'Correct navigation. Authoritative source identified below.'
      : 'Not the expected path. Compare with the applicable project context, then review the source.'}</div>${sourcePanelHtml(sp)}
      <button class="btn mt" id="fr-next">Continue to decision ▶</button>`;
    $('#fr-next', c).onclick = done;
  };
}
function renderFindRuleStandalone(v) {
  const scn = SCENARIOS[0];
  if (!run || run.scn !== scn) startScenario(scn);
  run.step = 'findrule';
  v.appendChild(el(`<div><h2>Find the Rule — practice</h2></div>`));
  renderFindRule(v, scn, () => { alert('Nice — in a full scenario this leads to the decision step.'); });
}

function sourcePanelHtml(sp) {
  if (!sp) return '';
  return `<div class="source-panel mb">
    <div class="row" style="justify-content:space-between"><b>VIEW SOURCE — ${esc(sp.topic)}</b>
      <span class="tag ${sp.status === 'CURRENT' ? 'ok' : 'warn'}">${esc(sp.status)} · ${esc(sp.confidence)}</span></div>
    <div><span class="k">Type:</span> ${esc(sp.requirement_type)}</div>
    <div><span class="k">Authority:</span> ${esc(sp.authority)}</div>
    <div><span class="k">Document:</span> ${esc(sp.document)} ${esc(sp.edition)}</div>
    <div><span class="k">Section:</span> ${esc(sp.section || '—')} · <span class="k">Clause:</span> ${esc(sp.clause)}</div>
    <div><span class="k">Source:</span> <a href="${esc(sp.source_url)}" target="_blank" rel="noopener">${esc(sp.source_url)}</a></div>
    ${sp.warning ? `<div class="warnbox mt">${esc(sp.warning)}</div>` : ''}
  </div>`;
}

// ---------- knowledge review (§10) ----------
function renderReview(v) {
  const dueIds = E.dueForReview(profile);
  v.appendChild(el(`<div>
    <h2>Knowledge review — spaced repetition</h2>
    <p class="lead">Repeated errors resurface sooner; consistent success spaces topics out but never removes them.</p>
    <div class="grid cols2">
      ${TOPICS.map((t) => {
        const k = profile.knowledge[t.id] || { score: 0, seen: 0 };
        const due = dueIds.includes(t.id);
        return `<div class="card"><h3>${esc(t.topic)} ${due ? '<span class="tag warn">due</span>' : ''}</h3>
          <div class="muted mb">${esc(t.category)} · ${esc(t.skill)} · status ${esc(t.status)} (${esc(t.confidence)})</div>
          <div class="diagram-sm mb">${diagramForTopic(t)}</div>
          <div class="bar"><span class="muted">retention</span><div class="track"><div class="fill" style="width:${k.score}%"></div></div><span>${k.score}</span></div>
          <div class="muted mt" style="font-size:12px">seen ${k.seen || 0}×</div></div>`;
      }).join('')}
    </div>
  </div>`));
}

// ---------- player profile (§11) ----------
function renderProfile(v) {
  const gate = E.competencyGate(profile, ['waterproofing', 'structural', 'ncc'], 40);
  v.appendChild(el(`<div>
    <h2>Player profile — ${esc(E.levelName(profile.level))}</h2>
    <p class="lead">Descriptive learning indicators only — not a licence, registration or competency certification.</p>
    <div class="card mb"><h3>Skill profile</h3><div class="bars">
      ${SKILL_AXES.map((a) => `<div class="bar"><span>${esc(a.label)}</span><div class="track"><div class="fill" style="width:${profile.skills[a.key] || 0}%"></div></div><span>${profile.skills[a.key] || 0}</span></div>`).join('')}
    </div></div>
    <div class="card mb"><h3>Competency gate → next tier (waterproofing, structural, NCC ≥ 40)</h3>
      ${gate.passed ? '<div class="okbox">Gate met — progression not blocked by this gate.</div>'
        : `<div class="warnbox">Not yet: strengthen ${gate.failing.join(', ')}. XP alone does not advance you.</div>`}
    </div>
    <div class="card mb"><h3>Personal learning observations</h3>${learningObservations()}</div>
    <div class="card"><h3>Progress data</h3>
      <p class="muted">Your progress is saved automatically in this browser. Export a backup or start over.</p>
      <div class="row"><button class="btn ghost" id="export">Export progress (JSON)</button>
        <button class="btn ghost" id="reset">Reset progress</button></div>
    </div>
  </div>`));
  $('#export', v).onclick = exportProgress;
  $('#reset', v).onclick = () => {
    if (confirm('Reset all progress? This clears your XP, skills and knowledge in this browser.')) {
      profile = E.newProfile(); profile.mode = $('#mode').value; run = null; persist(); setPage('profile');
    }
  };
}
function exportProgress() {
  try {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'buildmaster-progress.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (_) { alert('Export not available in this browser.'); }
}
function learningObservations() {
  const s = profile.skills; const obs = [];
  if (s.structural > s.waterproofing + 15) obs.push('Strong structural reasoning but comparatively light on waterproofing evidence.');
  if (s.contracts < 20 && profile.completedScenarios.length > 0) obs.push('Tends to under-document decisions — documentation score lags.');
  if (s.safety >= 40) obs.push('Consistently identifies safety scope before acting.');
  if (!obs.length) obs.push('Not enough data yet — play a few scenarios to generate observations.');
  return '<ul class="muted">' + obs.map((o) => `<li>${esc(o)}</li>`).join('') + '</ul>';
}

// ---------- competency assessment (§35) ----------
function renderAssessment(v) {
  v.appendChild(el(`<div>
    <h2>Level competency assessment</h2>
    <p class="lead">Scenario-based, multi-dimensional. Passing does NOT confer a licence, registration or statutory qualification.</p>
    <div class="card mb"><h3>Readiness snapshot</h3>
      <div class="muted">Scenarios completed: ${profile.completedScenarios.length}/${SCENARIOS.length} · XP ${profile.xp} · Level ${profile.level}</div>
      <div class="bars mt">
        ${['waterproofing', 'structural', 'ncc', 'safety', 'contracts'].map((k) => {
          const a = SKILL_AXES.find((x) => x.key === k);
          return `<div class="bar"><span>${esc(a.label)}</span><div class="track"><div class="fill" style="width:${profile.skills[k] || 0}%"></div></div><span>${profile.skills[k] || 0}</span></div>`;
        }).join('')}
      </div>
    </div>
    <div class="${profile.completedScenarios.length >= SCENARIOS.length ? 'okbox' : 'warnbox'}">
      ${profile.completedScenarios.length >= SCENARIOS.length
        ? 'All available slice scenarios complete. In the full product this unlocks a scored scenario assessment.'
        : 'Complete the available scenarios to attempt the assessment.'}
    </div>
  </div>`));
}

// ---------- mentor with progressive hint ladder (§27) ----------
// The mentor lives in its own persistent wrapper on <body>, so re-rendering the
// scenario view (e.g. toggling evidence) never rebuilds or re-opens it.
let mentorOpen = false;
function mountMentor() {
  if (!run || currentPage !== 'play') { document.querySelector('.mentor-wrap')?.remove(); return; }
  if (document.querySelector('.mentor-wrap')) return; // already mounted; leave it alone
  const wrap = el('<div class="mentor-wrap"></div>');
  document.body.appendChild(wrap);
  drawMentor(wrap);
}
function drawMentor(wrap) {
  wrap.innerHTML = '';
  if (!mentorOpen) {
    const fab = el('<button class="mentor-fab">🪵 Mentor</button>');
    fab.onclick = () => { mentorOpen = true; drawMentor(wrap); };
    wrap.appendChild(fab);
    return;
  }
  const m = el(`<div class="mentor"><span class="close" id="mc">✕</span><h4>🪵 Builder Mentor <span class="tag">${esc(E.MODES[profile.mode].label)}</span></h4>
    <div class="body" id="mbody"></div>
    <button class="btn ghost mt" id="hint" style="width:100%">Ask for a hint</button></div>`);
  wrap.appendChild(m);
  $('#mc', m).onclick = () => { mentorOpen = false; drawMentor(wrap); };
  renderHint($('#mbody', m));
  $('#hint', m).onclick = () => { run.hintLevel = Math.min(6, run.hintLevel + 1); renderHint($('#mbody', m)); };
}
function renderHint(box) {
  const scn = run.scn; const t = R.getTopic(scn.topic); const sp = R.sourcePanel(scn.topic);
  const floor = E.MODES[profile.mode].hintFloor;
  const lvl = Math.max(run.hintLevel, run.hintLevel === 0 ? 0 : floor);
  const ladder = [
    'The mentor challenges you: experience or "it\'ll be fine" is not evidence. What would you need to prove it?',
    `Think about the risk category: ${esc(t.category)}. What could go wrong if this is concealed?`,
    `Technical clue: ${esc(t.common_mistake)}`,
    `Relevant document: check "${esc(scn.evidence.find((e) => e.doc)?.doc || 'the project detail')}".`,
    `Relevant source: ${esc(sp.authority)} — ${esc(sp.document)}. Verify the current provision yourself.`,
    `Model reasoning: ${esc(t.explanation)}`,
  ];
  const shown = ladder.slice(0, Math.max(1, lvl));
  box.innerHTML = shown.map((h, i) => `<p><b>${['Hint 1', 'Hint 2', 'Technical clue', 'Document', 'Source', 'Model reasoning'][i]}:</b> ${h}</p>`).join('')
    + (lvl >= 6 ? '' : '<p class="muted">The mentor won\'t just hand over the answer — keep investigating.</p>');
}

// ---------- utils ----------
function uniq(v, i, a) { return a.indexOf(v) === i; }
function shuffleStable(arr) { return arr.slice().sort((a, b) => (E.hashSeed(a + seed) - E.hashSeed(b + seed))); }

boot();
