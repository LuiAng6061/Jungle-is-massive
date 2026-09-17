// BuildMaster — automated tests (run: node --test buildmaster/tests)
// Covers: seeded replay, scoring, spaced repetition, competency gate, consequence engine,
// source attribution, regulatory status, free-text evaluation, event selection.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import * as E from '../js/engine.js';
import * as R from '../js/regulatory.js';
import { SCENARIOS, TOPICS, SOURCES } from '../js/data.js';

test('seeded RNG is deterministic and replayable', () => {
  const a = E.makeRng(E.hashSeed('proj:42')); const b = E.makeRng(E.hashSeed('proj:42'));
  const seqA = [a(), a(), a()]; const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
  const c = E.makeRng(E.hashSeed('proj:43'));
  assert.notEqual(seqA[0], c());
});

test('levels: XP maps to a level and level name resolves', () => {
  assert.equal(E.levelFromXp(0), 1);
  assert.ok(E.levelFromXp(1000) <= 10);
  assert.equal(typeof E.levelName(1), 'string');
});

test('scoring rewards good evidence + correct source + sound decision', () => {
  const scn = SCENARIOS.find((s) => s.id === 'SCN-SHOWER-FALLS');
  const goodEv = scn.evidence.filter((e) => e.good).map((e) => e.id);
  const strong = E.scoreScenario(scn, { evidenceChosen: goodEv, ruleCorrect: true, decisionId: 'd-investigate', mode: 'builder' });
  const weak = E.scoreScenario(scn, { evidenceChosen: ['ev-verbal'], ruleCorrect: false, decisionId: 'd-continue', mode: 'builder' });
  assert.ok(strong.overall > weak.overall);
  assert.ok(strong.dims.source === 100 && weak.dims.source < 100);
  assert.ok(strong.xp > weak.xp);
});

test('bad evidence picks reduce the evidence score', () => {
  const scn = SCENARIOS.find((s) => s.id === 'SCN-SHOWER-FALLS');
  const clean = E.scoreScenario(scn, { evidenceChosen: ['ev-detail', 'ev-measure', 'ev-waste'], ruleCorrect: true, decisionId: 'd-investigate' });
  const noisy = E.scoreScenario(scn, { evidenceChosen: ['ev-detail', 'ev-measure', 'ev-waste', 'ev-verbal', 'ev-paint'], ruleCorrect: true, decisionId: 'd-investigate' });
  assert.ok(clean.dims.evidence >= noisy.dims.evidence);
});

test('spaced repetition: errors resurface sooner than successes', () => {
  const p = E.newProfile();
  E.updateKnowledge(p, 'WP-FALLS', true, 0);
  const goodDue = p.knowledge['WP-FALLS'].reviewDue;
  E.updateKnowledge(p, 'WP-WETAREA', false, 0);
  const badDue = p.knowledge['WP-WETAREA'].reviewDue;
  assert.ok(badDue < goodDue, 'incorrect answer should be due sooner');
  assert.ok(p.knowledge['WP-FALLS'].score > 0 && p.knowledge['WP-WETAREA'].score === 0);
});

test('knowledge topics are never fully removed (score floors at 0)', () => {
  const p = E.newProfile();
  for (let i = 0; i < 20; i++) E.updateKnowledge(p, 'WP-FALLS', false, 0);
  assert.equal(p.knowledge['WP-FALLS'].score, 0);
  assert.ok(p.knowledge['WP-FALLS'].seen === 20);
});

test('competency gate blocks on weak axes', () => {
  const p = E.newProfile();
  let g = E.competencyGate(p, ['waterproofing', 'structural'], 40);
  assert.equal(g.passed, false);
  p.skills.waterproofing = 60; p.skills.structural = 55;
  g = E.competencyGate(p, ['waterproofing', 'structural'], 40);
  assert.equal(g.passed, true);
});

test('consequence engine: bad decision usually bites, good usually holds (seeded)', () => {
  const scn = SCENARIOS[0];
  let badHits = 0, goodHits = 0;
  for (let i = 0; i < 200; i++) {
    const rng = E.makeRng(i);
    const badRes = { decision: { outcomeGood: false } };
    const goodRes = { decision: { outcomeGood: true } };
    if (!E.resolveConsequence(scn, badRes, E.makeRng(i)).good) badHits++;
    if (E.resolveConsequence(scn, goodRes, E.makeRng(i + 999)).good) goodHits++;
  }
  assert.ok(badHits > 140, `bad path should mostly bite, got ${badHits}`);
  assert.ok(goodHits > 160, `good path should mostly hold, got ${goodHits}`);
});

test('applyResult advances xp/level and updates skills', () => {
  const p = E.newProfile();
  const scn = SCENARIOS.find((s) => s.id === 'SCN-SHOWER-FALLS');
  const res = E.scoreScenario(scn, { evidenceChosen: scn.evidence.filter((e) => e.good).map((e) => e.id), ruleCorrect: true, decisionId: 'd-investigate' });
  E.applyResult(p, scn, res, true);
  assert.ok(p.xp > 0);
  assert.ok(p.skills.waterproofing > 0);
  assert.ok(p.completedScenarios.includes(scn.id));
});

test('regulatory engine: source panel exposes status/confidence and warns when unverified', () => {
  const sp = R.sourcePanel('WP-FALLS');
  assert.ok(sp);
  assert.ok(sp.authority.includes('ABCB'));
  assert.equal(sp.status, 'UNVERIFIED');
  assert.ok(sp.warning.includes('Do not rely'));
});

test('no topic fabricates a clause number when unverified', () => {
  for (const t of TOPICS) {
    if (t.status !== 'CURRENT') assert.equal(t.clause, '', `${t.id} must not carry a clause while unverified`);
  }
});

test('every topic references a real source in the source table', () => {
  for (const t of TOPICS) assert.ok(SOURCES[t.source], `${t.id} -> missing source ${t.source}`);
});

test('free-text evaluation scores by rubric coverage, not single keyword', () => {
  const rubric = [
    { label: 'safety', any: ['safety', 'stop'] },
    { label: 'evidence', any: ['evidence', 'engineer'] },
  ];
  const full = E.evaluateFreeText('stop the affected work and get engineer evidence', rubric);
  const partial = E.evaluateFreeText('stop it', rubric);
  assert.equal(full.score, 100);
  assert.equal(partial.score, 50);
});

test('event selection is deterministic for a given seed+stage', () => {
  const p = E.newProfile();
  const e1 = E.pickEvent(p, 'roof', 77);
  const e2 = E.pickEvent(p, 'roof', 77);
  assert.equal(e1.id, e2.id);
});

test('scenarios have coherent structure', () => {
  for (const s of SCENARIOS) {
    assert.ok(s.evidence.some((e) => e.good), `${s.id} needs at least one good evidence`);
    assert.ok(s.decisions.some((d) => d.outcomeGood), `${s.id} needs a good decision`);
    assert.ok(s.rulePath && s.rulePath.source, `${s.id} needs a rule source`);
    assert.ok(R.getTopic(s.topic), `${s.id} topic must exist`);
  }
});
