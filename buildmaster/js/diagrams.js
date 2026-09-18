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

const DIAGRAMS = {
  'SCN-SHOWER-FALLS': shower, 'WP-FALLS': shower, 'EV-FLAT': shower,
  'SCN-WALL-REMOVED': wall, 'STR-WALL': wall,
  'SCN-LINTEL': lintel, 'STR-LINTEL': lintel,
  'SCN-FLASHING': flashing, 'ROOF-FLASHING': flashing,
  'SCN-BARRIER': barrier, 'SAFE-BARRIER': barrier,
  'SCN-INSUL': insul, 'ENERGY-INSUL': insul,
  'SCN-VARIATION': variation, 'CONTRACT-VARIATION': variation,
};

export function diagramFor(scenario) {
  if (!scenario) return '';
  return DIAGRAMS[scenario.id] || DIAGRAMS[scenario.topic] || '';
}
