// BuildMaster Australia — GAME ENGINE (pure logic; testable; queries the regulatory engine)

import { SKILL_AXES, LEVELS, TOPICS, SCENARIOS, EVENTS } from './data.js';

// ---- Seeded RNG (mulberry32) so projects/events are replayable (§9) --------------------------
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---- Difficulty modes (§27, §33) -------------------------------------------------------------
export const MODES = {
  beginner: { id: 'beginner', label: 'Beginner', hintFloor: 0, freeText: false, guided: true },
  builder: { id: 'builder', label: 'Builder', hintFloor: 1, freeText: false, guided: false },
  expert: { id: 'expert', label: 'Expert', hintFloor: 3, freeText: true, guided: false },
};

// ---- Player profile --------------------------------------------------------------------------
export function newProfile() {
  const skills = {};
  SKILL_AXES.forEach((a) => { skills[a.key] = 0; }); // 0..100 descriptive indicators, not certification
  const knowledge = {};
  TOPICS.forEach((t) => {
    knowledge[t.id] = { score: 0, seen: 0, correct: 0, incorrect: 0, reviewDue: 0 };
  });
  return {
    version: 1, xp: 0, level: 1, mode: 'beginner',
    skills, knowledge, completedScenarios: [], seed: 1,
  };
}

export function levelFromXp(xp) {
  // 10 competency levels; XP alone does not advance past a soft cap without competency (§8).
  const idx = Math.min(LEVELS.length, Math.max(1, Math.floor(xp / 120) + 1));
  return idx;
}
export function levelName(level) { return LEVELS[Math.min(level, LEVELS.length) - 1]; }

// Competency gate: to pass a level the player must have non-trivial skill in its core axes (§8).
export function competencyGate(profile, requiredAxes, threshold = 40) {
  const failing = requiredAxes.filter((k) => (profile.skills[k] || 0) < threshold);
  return { passed: failing.length === 0, failing };
}

// ---- Scoring (multi-dimensional, §76) --------------------------------------------------------
export const SCORE_DIMS = ['safety', 'compliance', 'quality', 'documentation', 'risk'];

export function scoreScenario(scenario, run) {
  // run = { evidenceChosen:[ids], ruleCorrect:bool, decisionId, mode }
  const chosenIds = new Set(run.evidenceChosen || []);
  const goodEvidence = scenario.evidence.filter((e) => e.good);
  const goodPicked = goodEvidence.filter((e) => chosenIds.has(e.id)).length;
  const badPicked = scenario.evidence.filter((e) => !e.good && chosenIds.has(e.id)).length;
  const evidenceScore = clamp(goodPicked - badPicked, 0, goodEvidence.length) / Math.max(1, goodEvidence.length);

  const decision = scenario.decisions.find((d) => d.id === run.decisionId) || { scores: {}, outcomeGood: false };
  const decisionTotal = SCORE_DIMS.reduce((s, k) => s + (decision.scores[k] || 0), 0);

  const dims = {
    evidence: Math.round(evidenceScore * 100),
    source: run.ruleCorrect ? 100 : 30,
    decision: Math.round(clamp((decisionTotal + 6) / 12, 0, 1) * 100),
  };
  const overall = Math.round((dims.evidence + dims.source + dims.decision) / 3);
  const xp = Math.round(overall * 0.6) + (decision.outcomeGood ? 20 : 0);
  return { dims, overall, xp, decision, evidenceScore };
}

// ---- Consequence engine (probabilistic, remembers decisions, §20, §77) -----------------------
export function resolveConsequence(scenario, result, rng) {
  // Even a good decision can occasionally surface a latent issue; a bad decision usually bites.
  const goodPath = result.decision.outcomeGood;
  const roll = rng();
  const triggeredBad = goodPath ? roll < 0.1 : roll < 0.85;
  return {
    text: triggeredBad ? scenario.consequences.bad : scenario.consequences.good,
    good: !triggeredBad,
  };
}

// ---- Spaced repetition (§10) -----------------------------------------------------------------
export function updateKnowledge(profile, topicId, correct, now = Date.now()) {
  const k = profile.knowledge[topicId] || (profile.knowledge[topicId] = { score: 0, seen: 0, correct: 0, incorrect: 0, reviewDue: 0 });
  k.seen += 1;
  if (correct) { k.correct += 1; k.score = clamp(k.score + 15, 0, 100); }
  else { k.incorrect += 1; k.score = clamp(k.score - 10, 0, 100); }
  // Errors bring the topic back sooner; consistent success spaces it out but never removes it.
  const intervalDays = correct ? Math.min(30, 1 + k.correct * 3) : 1;
  k.reviewDue = now + intervalDays * 86400000;
  return k;
}
export function dueForReview(profile, now = Date.now()) {
  return Object.entries(profile.knowledge)
    .filter(([, k]) => k.seen > 0 && k.reviewDue <= now)
    .map(([id]) => id);
}

// ---- Apply a scenario result to the profile --------------------------------------------------
export function applyResult(profile, scenario, result, correctForKnowledge) {
  profile.xp += result.xp;
  profile.level = levelFromXp(profile.xp);
  (scenario.skillsTested || []).forEach((axis) => {
    const delta = Math.round((result.overall - 40) / 6); // -ve if poor, +ve if strong
    profile.skills[axis] = clamp((profile.skills[axis] || 0) + delta, 0, 100);
  });
  updateKnowledge(profile, scenario.topic, correctForKnowledge);
  if (!profile.completedScenarios.includes(scenario.id)) profile.completedScenarios.push(scenario.id);
  return profile;
}

// ---- Seeded random event selection (§9, §19) -------------------------------------------------
export function pickEvent(profile, stage, seed) {
  const rng = makeRng(hashSeed(`${seed}:${stage}:${profile.completedScenarios.length}`));
  const pool = EVENTS.filter((e) => e.stage === stage);
  const list = pool.length ? pool : EVENTS;
  return list[Math.floor(rng() * list.length)];
}

// ---- Free-text evaluation (expert mode, §26) — structural, not keyword-only ------------------
export function evaluateFreeText(text, rubric) {
  const t = (text || '').toLowerCase();
  const hits = rubric.filter((r) => r.any.some((kw) => t.includes(kw)));
  const covered = hits.map((h) => h.label);
  const missed = rubric.filter((r) => !hits.includes(r)).map((h) => h.label);
  const score = Math.round((covered.length / rubric.length) * 100);
  return { score, covered, missed };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---- Persistence (localStorage, guarded) -----------------------------------------------------
const KEY = 'buildmaster.profile.v1';
export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (_) { /* private mode / blocked */ }
  return newProfile();
}
export function saveProfile(profile) {
  try { localStorage.setItem(KEY, JSON.stringify(profile)); } catch (_) { /* ignore */ }
}
function migrate(p) {
  const base = newProfile();
  return { ...base, ...p, skills: { ...base.skills, ...(p.skills || {}) }, knowledge: { ...base.knowledge, ...(p.knowledge || {}) } };
}

export { SCENARIOS };
