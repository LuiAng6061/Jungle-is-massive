// BuildMaster Australia — SCENARIO ILLUSTRATIONS (inline SVG, theme-aware, offline)
// Detailed labelled vector scenes keyed by scenario id (fallback by topic). Colours are chosen
// to read on the dark UI. Diagrams are illustrative teaching aids, not construction details.

const C = {
  line: '#93a4c0', ink: '#e6edf7', slab: '#3a4763', screed: '#586a8c', tile: '#22304d',
  teal: '#14b8a6', amber: '#fbbf24', red: '#f87171', water: '#60a5fa', good: '#4ade80',
  timber: '#8a6d3b', timber2: '#b08a4a', panel: '#16223a',
};

function frame(inner, vb = '0 0 480 300') {
  return `<svg viewBox="${vb}" width="100%" role="img" style="max-width:520px;background:${C.panel};border-radius:10px;border:1px solid #243352">
    <defs>
      <marker id="arw" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="${C.amber}"/></marker>
      <marker id="arwR" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="${C.red}"/></marker>
      <marker id="arwB" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="${C.water}"/></marker>
    </defs>${inner}</svg>`;
}
const t = (x, y, s, fill = C.ink, size = 12, anchor = 'start', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" font-family="Arial,sans-serif">${s}</text>`;

// ---- Shower fall to waste (WP-FALLS) ---------------------------------------------------------
const shower = frame(`
  <rect x="40" y="60" width="20" height="150" fill="${C.tile}" stroke="${C.line}"/>
  ${t(50, 52, 'Wall', C.line, 11, 'middle')}
  <polygon points="60,190 420,190 420,210 60,210" fill="${C.slab}" stroke="${C.line}"/>
  ${t(430, 205, 'Slab', C.line, 11)}
  <polygon points="60,178 420,190 420,196 60,184" fill="${C.screed}"/>
  ${t(240, 172, 'Screed (graded fall)', C.line, 11, 'middle')}
  <polyline points="60,176 418,188" fill="none" stroke="${C.teal}" stroke-width="2" stroke-dasharray="4 3"/>
  ${t(300, 160, 'Waterproof membrane', C.teal, 11)}
  <line x1="60" y1="172" x2="420" y2="184" stroke="${C.line}"/>
  <g fill="${C.tile}" stroke="${C.line}">
    ${Array.from({ length: 9 }, (_, i) => `<rect x="${64 + i * 39}" y="${164 + i * 1.4}" width="37" height="8"/>`).join('')}
  </g>
  ${t(200, 150, 'Tiles', C.line, 11)}
  <rect x="60" y="185" width="26" height="30" fill="#0e1830" stroke="${C.amber}"/>
  ${t(73, 236, 'Floor waste', C.amber, 11, 'middle')}
  <circle cx="330" cy="150" r="6" fill="${C.water}"/>
  <path d="M330,158 Q200,150 92,185" fill="none" stroke="${C.water}" stroke-width="2.5" marker-end="url(#arwB)"/>
  ${t(240, 120, 'Water drains to waste →', C.water, 12)}
  ${t(24, 30, 'Correct: continuous fall carries water to the waste', C.good, 13, 'start', 700)}
  ${t(24, 274, 'A near-flat floor lets water pond and migrate past the membrane.', C.line, 11)}
`);

// ---- Load path / removed structural wall (STR-WALL) ------------------------------------------
const wall = frame(`
  <polygon points="60,60 420,60 400,90 80,90" fill="${C.timber}" stroke="${C.line}"/>
  ${t(240, 52, 'Roof load', C.line, 11, 'middle')}
  ${Array.from({ length: 7 }, (_, i) => `<line x1="${90 + i * 50}" y1="92" x2="${90 + i * 50}" y2="108" stroke="${C.amber}" stroke-width="2" marker-end="url(#arw)"/>`).join('')}
  <rect x="80" y="108" width="120" height="120" fill="${C.tile}" stroke="${C.good}" stroke-width="2"/>
  ${t(140, 172, 'Load-bearing', C.good, 11, 'middle')} ${t(140, 186, 'wall (kept)', C.good, 11, 'middle')}
  <rect x="270" y="108" width="120" height="120" fill="none" stroke="${C.red}" stroke-width="2" stroke-dasharray="6 4"/>
  ${t(330, 168, 'Wall REMOVED', C.red, 11, 'middle')}
  <line x1="330" y1="108" x2="330" y2="228" stroke="${C.red}" stroke-width="2" marker-end="url(#arwR)"/>
  ${t(330, 246, 'load path broken', C.red, 11, 'middle')}
  <rect x="60" y="228" width="360" height="16" fill="${C.slab}" stroke="${C.line}"/>
  ${t(240, 240, 'Footing / slab', C.line, 10, 'middle')}
  ${t(24, 30, 'Removing a load-bearing wall breaks the load path', C.red, 13, 'start', 700)}
`);

// ---- Lintel over opening (STR-LINTEL) --------------------------------------------------------
const lintel = frame(`
  ${Array.from({ length: 6 }, (_, i) => `<line x1="${130 + i * 44}" y1="70" x2="${130 + i * 44}" y2="92" stroke="${C.amber}" stroke-width="2" marker-end="url(#arw)"/>`).join('')}
  ${t(240, 62, 'Load from above', C.line, 11, 'middle')}
  <rect x="110" y="94" width="260" height="22" fill="${C.timber2}" stroke="${C.line}"/>
  ${t(240, 109, 'Lintel — must match span & load', C.ink, 11, 'middle')}
  <rect x="110" y="116" width="26" height="120" fill="${C.tile}" stroke="${C.line}"/>
  <rect x="344" y="116" width="26" height="120" fill="${C.tile}" stroke="${C.line}"/>
  ${t(123, 250, 'Support', C.line, 10, 'middle')} ${t(357, 250, 'Support', C.line, 10, 'middle')}
  <rect x="136" y="116" width="208" height="120" fill="#0e1830" stroke="${C.line}" stroke-dasharray="3 3"/>
  ${t(240, 180, 'Window opening', C.line, 11, 'middle')}
  <line x1="136" y1="128" x2="344" y2="128" stroke="${C.water}" marker-start="url(#arwB)" marker-end="url(#arwB)"/>
  ${t(240, 122, 'span', C.water, 10, 'middle')}
  ${t(24, 30, 'A lintel too small for the span will deflect', C.amber, 13, 'start', 700)}
`);

// ---- Flashing lap direction (ROOF-FLASHING) --------------------------------------------------
const flashing = frame(`
  ${t(120, 28, 'CORRECT lap', C.good, 12, 'middle', 700)}
  <rect x="70" y="70" width="20" height="150" fill="${C.tile}" stroke="${C.line}"/>
  <polygon points="90,150 210,180 210,196 90,166" fill="${C.slab}" stroke="${C.line}"/>
  <path d="M110,120 L110,150 L200,172" fill="none" stroke="${C.good}" stroke-width="3"/>
  <circle cx="150" cy="110" r="5" fill="${C.water}"/>
  <path d="M150,116 Q160,150 205,180" fill="none" stroke="${C.water}" stroke-width="2" marker-end="url(#arwB)"/>
  ${t(150, 240, 'Flashing over roof: water sheds out', C.good, 10, 'middle')}
  <line x1="245" y1="60" x2="245" y2="250" stroke="${C.line}" stroke-dasharray="4 4"/>
  ${t(370, 28, 'WRONG lap', C.red, 12, 'middle', 700)}
  <rect x="320" y="70" width="20" height="150" fill="${C.tile}" stroke="${C.line}"/>
  <polygon points="340,150 450,180 450,196 340,166" fill="${C.slab}" stroke="${C.line}"/>
  <path d="M360,150 L360,120 M360,150 L448,172" fill="none" stroke="${C.red}" stroke-width="3"/>
  <circle cx="400" cy="110" r="5" fill="${C.water}"/>
  <path d="M400,116 Q372,150 352,172" fill="none" stroke="${C.red}" stroke-width="2" marker-end="url(#arwR)"/>
  ${t(390, 240, 'Water tracks behind → leak', C.red, 10, 'middle')}
`);

// ---- Fall barrier (SAFE-BARRIER) -------------------------------------------------------------
const barrier = frame(`
  <rect x="60" y="150" width="200" height="90" fill="${C.slab}" stroke="${C.line}"/>
  ${t(160, 200, 'Raised alfresco', C.line, 11, 'middle')}
  <rect x="260" y="230" width="180" height="10" fill="${C.slab}" stroke="${C.line}"/>
  ${t(350, 226, 'Yard below', C.line, 10, 'middle')}
  <line x1="270" y1="150" x2="270" y2="230" stroke="${C.water}" marker-start="url(#arwB)" marker-end="url(#arwB)"/>
  ${t(300, 195, 'fall height', C.water, 11)}
  <line x1="60" y1="150" x2="260" y2="150" stroke="${C.line}"/>
  <line x1="70" y1="90" x2="70" y2="150" stroke="${C.good}" stroke-width="3"/>
  <line x1="250" y1="90" x2="250" y2="150" stroke="${C.good}" stroke-width="3"/>
  <line x1="70" y1="100" x2="250" y2="100" stroke="${C.good}" stroke-width="3"/>
  <line x1="70" y1="125" x2="250" y2="125" stroke="${C.good}" stroke-width="2"/>
  ${t(160, 82, 'Barrier — height & openings per provision', C.good, 10, 'middle')}
  ${t(24, 30, 'Above the trigger height a compliant barrier is required', C.amber, 13, 'start', 700)}
  ${t(24, 274, 'Confirm the trigger height and barrier requirements — do not guess.', C.line, 11)}
`);

// ---- Insulation compressed (ENERGY-INSUL) ----------------------------------------------------
const insul = frame(`
  <rect x="60" y="90" width="360" height="12" fill="${C.timber2}" stroke="${C.line}"/>
  ${t(240, 84, 'Ceiling / rafters', C.line, 10, 'middle')}
  <rect x="70" y="102" width="150" height="60" fill="${C.teal}" opacity="0.5" stroke="${C.line}"/>
  ${t(145, 178, 'Full thickness = rated R-value', C.good, 10, 'middle')}
  <line x1="230" y1="102" x2="230" y2="162" stroke="${C.line}" marker-start="url(#arw)" marker-end="url(#arw)"/>
  <rect x="250" y="132" width="150" height="30" fill="${C.teal}" opacity="0.5" stroke="${C.line}"/>
  ${t(325, 178, 'Compressed = lower R-value', C.red, 10, 'middle')}
  <line x1="410" y1="132" x2="410" y2="162" stroke="${C.red}" marker-start="url(#arwR)" marker-end="url(#arwR)"/>
  <circle cx="320" cy="147" r="10" fill="none" stroke="${C.red}" stroke-width="2"/>
  <line x1="313" y1="140" x2="327" y2="154" stroke="${C.red}" stroke-width="2"/>
  ${t(24, 30, 'Compressed insulation underperforms its rating', C.amber, 13, 'start', 700)}
  ${t(24, 274, 'Installed performance — not the product label — is what counts.', C.line, 11)}
`);

// ---- Variation: sink move (CONTRACT-VARIATION) -----------------------------------------------
const variation = frame(`
  <rect x="60" y="60" width="360" height="180" fill="none" stroke="${C.line}"/>
  ${t(70, 52, 'Kitchen (plan view)', C.line, 11)}
  <rect x="90" y="90" width="300" height="40" fill="${C.tile}" stroke="${C.line}"/>
  ${t(240, 114, 'Benchtop / cabinetry', C.line, 10, 'middle')}
  <rect x="130" y="96" width="40" height="28" fill="#0e1830" stroke="${C.good}"/>
  ${t(150, 140, 'sink (as built)', C.good, 9, 'middle')}
  <rect x="250" y="96" width="40" height="28" fill="none" stroke="${C.amber}" stroke-dasharray="4 3"/>
  ${t(270, 140, 'sink (proposed)', C.amber, 9, 'middle')}
  <line x1="170" y1="110" x2="250" y2="110" stroke="${C.amber}" marker-end="url(#arw)"/>
  ${t(210, 104, '600 mm', C.amber, 10, 'middle')}
  <line x1="150" y1="124" x2="150" y2="210" stroke="${C.water}" stroke-dasharray="3 3"/>
  <line x1="270" y1="124" x2="270" y2="210" stroke="${C.water}" stroke-dasharray="3 3"/>
  ${t(150, 224, 'waste', C.water, 9, 'middle')} ${t(270, 224, 'new waste?', C.water, 9, 'middle')}
  ${t(24, 30, 'Every change ripples: plumbing, cabinetry, cost, time', C.amber, 13, 'start', 700)}
`);

// ---- Roof tie-down / load path (STR-TIEDOWN) -------------------------------------------------
const tiedown = frame(`
  <polygon points="150,70 330,70 240,110" fill="none" stroke="${C.timber2}" stroke-width="3"/>
  <line x1="150" y1="70" x2="330" y2="70" stroke="${C.timber2}" stroke-width="3"/>
  ${t(240, 60, 'Truss', C.line, 11, 'middle')}
  <rect x="150" y="110" width="180" height="10" fill="${C.timber}" stroke="${C.line}"/>
  ${t(240, 134, 'Top plate', C.line, 10, 'middle')}
  <rect x="160" y="120" width="12" height="90" fill="${C.timber}" stroke="${C.line}"/>
  <rect x="308" y="120" width="12" height="90" fill="${C.timber}" stroke="${C.line}"/>
  <path d="M166,72 L166,210" stroke="${C.good}" stroke-width="2.5"/>
  <path d="M314,72 L314,210" stroke="${C.good}" stroke-width="2.5"/>
  ${t(110, 150, 'Tie-down', C.good, 11)} ${t(110, 164, 'strap', C.good, 11)}
  <rect x="140" y="210" width="200" height="14" fill="${C.slab}" stroke="${C.line}"/>
  ${t(240, 221, 'Slab / footing', C.line, 10, 'middle')}
  <line x1="240" y1="55" x2="240" y2="30" stroke="${C.red}" stroke-width="2" marker-end="url(#arwR)"/>
  ${t(240, 24, 'wind uplift', C.red, 11, 'middle')}
  ${t(24, 30, 'A continuous tie-down path resists roof uplift', C.good, 13, 'start', 700)}
`);

// ---- Footing & site classification (STR-FOOTING) ---------------------------------------------
const footing = frame(`
  <rect x="40" y="60" width="400" height="70" fill="none" stroke="${C.line}" stroke-dasharray="2 3"/>
  <line x1="40" y1="130" x2="440" y2="130" stroke="${C.line}"/>
  ${t(60, 122, 'Ground level', C.line, 10)}
  <rect x="40" y="130" width="400" height="130" fill="${C.slab}" opacity="0.5"/>
  <rect x="180" y="130" width="120" height="90" fill="${C.screed}" stroke="${C.line}"/>
  ${t(240, 250, 'Footing', C.line, 11, 'middle')}
  ${Array.from({ length: 4 }, (_, i) => `<circle cx="${200 + i * 27}" cy="205" r="4" fill="${C.amber}"/>`).join('')}
  ${t(240, 240, 'Reinforcement', C.amber, 10, 'middle')}
  <line x1="320" y1="130" x2="320" y2="220" stroke="${C.water}" marker-start="url(#arwB)" marker-end="url(#arwB)"/>
  ${t(348, 178, 'depth', C.water, 11)}
  ${t(24, 30, 'Footing depth, reinforcement & soil class must match design', C.amber, 12, 'start', 700)}
  ${t(24, 285, 'Verify before pouring — concealed once poured.', C.line, 11)}
`);

// ---- Gutter overflow (ROOF-DRAINAGE) ---------------------------------------------------------
const gutter = frame(`
  <polygon points="60,70 300,150 300,164 60,84" fill="${C.slab}" stroke="${C.line}"/>
  ${t(170, 100, 'Roof', C.line, 11)}
  <path d="M300,150 L300,200 L360,200 L360,150" fill="none" stroke="${C.line}" stroke-width="3"/>
  ${t(330, 220, 'Gutter', C.line, 11, 'middle')}
  <rect x="300" y="175" width="60" height="20" fill="${C.water}" opacity="0.6"/>
  <rect x="356" y="158" width="6" height="30" fill="${C.good}"/>
  ${t(392, 172, 'Overflow', C.good, 10)} ${t(392, 186, 'outlet', C.good, 10)}
  <path d="M330,200 L330,250" stroke="${C.line}" stroke-width="4"/>
  ${t(330, 268, 'Downpipe', C.line, 10, 'middle')}
  ${t(24, 30, 'Overflow sheds water OUT if the pipe blocks', C.good, 13, 'start', 700)}
  ${t(24, 288, 'No overflow → a blockage floods back into the building.', C.line, 11)}
`);

// ---- Service penetration allowable zone (SERV-PENETRATION) ------------------------------------
const penetration = frame(`
  <rect x="50" y="120" width="380" height="50" fill="${C.timber}" stroke="${C.line}"/>
  ${t(240, 110, 'Structural member (e.g. joist / truss chord)', C.line, 10, 'middle')}
  <rect x="150" y="120" width="180" height="50" fill="${C.good}" opacity="0.25"/>
  ${t(240, 150, 'allowable zone', C.good, 10, 'middle')}
  <circle cx="240" cy="145" r="14" fill="#0e1830" stroke="${C.good}"/>
  ${t(240, 195, 'OK: small hole, correct zone', C.good, 10, 'middle')}
  <circle cx="380" cy="145" r="20" fill="#0e1830" stroke="${C.red}" stroke-width="2"/>
  ${t(380, 200, 'Too big / wrong zone', C.red, 10, 'middle')}
  <line x1="366" y1="131" x2="394" y2="159" stroke="${C.red}" stroke-width="2"/>
  ${t(24, 30, 'Notches & holes must stay within the allowable zone', C.amber, 12, 'start', 700)}
`);

// ---- Safety glazing (SAFE-GLAZING) -----------------------------------------------------------
const glazing = frame(`
  <rect x="120" y="70" width="90" height="180" fill="none" stroke="${C.line}" stroke-width="2"/>
  ${t(165, 62, 'Door', C.line, 11, 'middle')}
  <rect x="210" y="70" width="110" height="180" fill="${C.water}" opacity="0.15" stroke="${C.line}"/>
  ${t(265, 62, 'Side panel', C.line, 11, 'middle')}
  <rect x="210" y="160" width="110" height="90" fill="${C.red}" opacity="0.18"/>
  ${t(265, 210, 'impact zone', C.red, 10, 'middle')}
  ${t(265, 226, 'needs safety glass', C.red, 10, 'middle')}
  <circle cx="150" cy="235" r="4" fill="${C.amber}"/>
  ${t(24, 30, 'Glazing in impact-risk locations needs safety glass', C.amber, 12, 'start', 700)}
  ${t(24, 285, 'Type & marking matter — ordinary glass may not comply.', C.line, 11)}
`);

// ---- Wet-area membrane upturn (WP-WETAREA) ---------------------------------------------------
const membrane = frame(`
  <rect x="90" y="60" width="24" height="180" fill="${C.tile}" stroke="${C.line}"/>
  ${t(102, 52, 'Wall', C.line, 11, 'middle')}
  <rect x="114" y="200" width="300" height="40" fill="${C.slab}" stroke="${C.line}"/>
  ${t(280, 224, 'Floor', C.line, 10, 'middle')}
  <path d="M114,120 L114,196 L414,206" fill="none" stroke="${C.teal}" stroke-width="3"/>
  ${t(150, 112, 'Membrane turned UP the wall', C.teal, 11)}
  <line x1="128" y1="196" x2="128" y2="120" stroke="${C.water}" marker-start="url(#arwB)" marker-end="url(#arwB)"/>
  ${t(156, 160, 'upturn height', C.water, 10)}
  <circle cx="300" cy="150" r="5" fill="${C.water}"/>
  <path d="M300,156 Q220,180 122,196" fill="none" stroke="${C.water}" stroke-width="2" marker-end="url(#arwB)"/>
  ${t(24, 30, 'Membrane must turn up to the required extents', C.teal, 13, 'start', 700)}
  ${t(24, 285, 'Confirm waterproofed extents against the current provision.', C.line, 11)}
`);

// ---- Generic fallback: labelled house cross-section, so every topic shows something -----------
function generic(topic) {
  const label = topic ? topic.topic : 'Construction detail';
  const cat = topic ? topic.category : '';
  return frame(`
    <polygon points="80,120 240,50 400,120" fill="none" stroke="${C.timber2}" stroke-width="3"/>
    ${t(240, 44, 'Roof', C.line, 10, 'middle')}
    <rect x="100" y="120" width="280" height="120" fill="none" stroke="${C.line}" stroke-width="2"/>
    <rect x="100" y="240" width="280" height="14" fill="${C.slab}" stroke="${C.line}"/>
    ${t(240, 250, 'Slab / footing', C.line, 9, 'middle')}
    <rect x="150" y="170" width="50" height="70" fill="${C.tile}" stroke="${C.line}"/>
    <rect x="290" y="150" width="50" height="45" fill="${C.water}" opacity="0.2" stroke="${C.line}"/>
    <circle cx="240" cy="160" r="26" fill="none" stroke="${C.teal}" stroke-width="2"/>
    ${t(240, 165, 'focus', C.teal, 10, 'middle')}
    <line x1="240" y1="134" x2="240" y2="120" stroke="${C.teal}" stroke-width="2" marker-end="url(#arw)"/>
    ${t(24, 30, escD(label), C.ink, 13, 'start', 700)}
    ${cat ? t(24, 285, escD(cat) + ' — schematic teaching aid, not to scale', C.line, 11) : ''}
  `);
}
function escD(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

const DIAGRAMS = {
  'SCN-SHOWER-FALLS': shower, 'WP-FALLS': shower, 'EV-FLAT': shower,
  'SCN-WALL-REMOVED': wall, 'STR-WALL': wall,
  'SCN-LINTEL': lintel, 'STR-LINTEL': lintel,
  'SCN-FLASHING': flashing, 'ROOF-FLASHING': flashing,
  'SCN-BARRIER': barrier, 'SAFE-BARRIER': barrier,
  'SCN-INSUL': insul, 'ENERGY-INSUL': insul,
  'SCN-VARIATION': variation, 'CONTRACT-VARIATION': variation,
  'STR-TIEDOWN': tiedown, 'STR-FOOTING': footing, 'ROOF-DRAINAGE': gutter,
  'SERV-PENETRATION': penetration, 'SAFE-GLAZING': glazing, 'WP-WETAREA': membrane,
};

export function diagramFor(scenario) {
  if (!scenario) return '';
  return DIAGRAMS[scenario.id] || DIAGRAMS[scenario.topic] || '';
}
// Every knowledge topic gets a visual: a bespoke scene where one exists, else a labelled generic.
export function diagramForTopic(topic) {
  if (!topic) return '';
  return DIAGRAMS[topic.id] || generic(topic);
}
