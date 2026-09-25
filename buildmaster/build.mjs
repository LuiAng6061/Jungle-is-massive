// Bundle the multi-file app into a single self-contained HTML file (no build tooling required).
// Usage: node build.mjs
import fs from 'node:fs';

const read = (f) => fs.readFileSync(new URL(f, import.meta.url), 'utf8');
function strip(src) {
  return src.split('\n')
    .filter((l) => !/^\s*import\s.*from\s.*;?\s*$/.test(l))
    .filter((l) => !/^\s*export\s*\{[^}]*\}\s*;?\s*$/.test(l))
    .map((l) => l.replace(/^\s*export\s+(const|function|class|let|var)\s+/, '$1 '))
    .join('\n');
}

const data = strip(read('./js/data.js'));
const diagrams = strip(read('./js/diagrams.js'));
const spot = strip(read('./js/spot.js'));
const reg = strip(read('./js/regulatory.js'));
const eng = strip(read('./js/engine.js'));
const app = strip(read('./js/app.js'));
const R = 'const R={getSource,getTopic,regulatoryContext,sourcePanel,STATUS};';
const E = 'const E={makeRng,hashSeed,MODES,newProfile,levelFromXp,levelName,competencyGate,SCORE_DIMS,scoreScenario,resolveConsequence,updateKnowledge,dueForReview,applyResult,pickEvent,evaluateFreeText,loadProfile,saveProfile,SCENARIOS};';
const bundle = [data, diagrams, spot, reg, eng, R, E, app].join('\n\n/* ---- */\n\n');

let html = read('./index.html');
html = html.replace(/\s*<link rel="stylesheet" href="css\/buildmaster.css" \/>/, '\n  <style>\n' + read('./css/buildmaster.css') + '\n  </style>');
html = html.replace(/\s*<script type="module" src="js\/app.js"><\/script>/, '\n  <script type="module">\n' + bundle + '\n  </script>');
fs.writeFileSync(new URL('./BuildMaster-Australia.html', import.meta.url), html);

// Self-check: the inlined module must have no leftover import/export.
const inline = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const stray = inline.split('\n').filter((l) => /^\s*(import|export)\s/.test(l));
if (stray.length) { console.error('STRAY module syntax:', stray); process.exit(1); }
console.log('Built BuildMaster-Australia.html —', Buffer.byteLength(html), 'bytes; no stray module syntax.');
