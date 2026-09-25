// BuildMaster Australia — "Spot the defect" visual scenes (interactive SVG).
// Each scene shows a construction situation; the player clicks where the defect is.
// Not every candidate is a defect — some are correct construction (teaches investigation, not guessing).
// Illustrative teaching aids, not construction details or to scale.

const P = {
  bg: '#16223a', line: '#93a4c0', ink: '#e6edf7', slab: '#3a4763', tile: '#22304d',
  timber: '#8a6d3b', timber2: '#b08a4a', teal: '#14b8a6', amber: '#fbbf24',
  red: '#f87171', water: '#60a5fa', good: '#4ade80',
};
const tx = (x, y, s, fill = P.ink, size = 11, anchor = 'start', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" font-family="Arial,sans-serif">${s}</text>`;

export const SPOTS = [
  {
    id: 'SPOT-WP', topic: 'WP-FALLS', skill: 'waterproofing',
    title: 'Wet area — spot the waterproofing risk',
    prompt: 'Water has been run in this shower. Click where the waterproofing risk is.',
    bg: `
      <rect x="40" y="60" width="20" height="160" fill="${P.tile}" stroke="${P.line}"/>
      <polygon points="60,196 430,196 430,214 60,214" fill="${P.slab}" stroke="${P.line}"/>
      <polyline points="90,192 430,182" fill="none" stroke="${P.line}" stroke-width="2"/>
      ${tx(230, 176, 'Floor slopes UP to the right (away from the waste)', P.line, 10, 'middle')}
      <rect x="62" y="188" width="26" height="26" fill="#0e1830" stroke="${P.amber}"/>
      ${tx(75, 234, 'Floor waste', P.amber, 10, 'middle')}
      <ellipse cx="385" cy="188" rx="42" ry="8" fill="${P.water}" opacity="0.7"/>
      ${tx(385, 168, 'Water ponds here', P.water, 10, 'middle')}
    `,
    hotspots: [
      { x: 385, y: 188, r: 30, correct: true, label: 'Ponding / no fall to waste',
        explain: 'The floor falls away from the waste, so water ponds and can migrate past the waterproofing. This is the defect.' },
      { x: 75, y: 201, r: 22, correct: false, label: 'Floor waste',
        explain: 'The waste itself is fine — the problem is that the floor does not drain toward it.' },
      { x: 50, y: 130, r: 22, correct: false, label: 'Tiled wall',
        explain: 'The wall is not the issue here.' },
    ],
  },
  {
    id: 'SPOT-TIEDOWN', topic: 'STR-TIEDOWN', skill: 'structural',
    title: 'Roof frame — spot the structural defect',
    prompt: 'Two truss ends over the top plate. Click the structural defect.',
    bg: `
      <line x1="120" y1="70" x2="360" y2="70" stroke="${P.timber2}" stroke-width="3"/>
      <polygon points="120,70 360,70 240,120" fill="none" stroke="${P.timber2}" stroke-width="2"/>
      ${tx(240, 60, 'Truss', P.line, 10, 'middle')}
      <rect x="110" y="120" width="260" height="10" fill="${P.timber}" stroke="${P.line}"/>
      ${tx(240, 145, 'Top plate', P.line, 10, 'middle')}
      <path d="M130,72 L130,120" stroke="${P.good}" stroke-width="3"/>
      ${tx(130, 165, 'Strap present', P.good, 9, 'middle')}
      ${tx(350, 160, 'No strap', P.red, 9, 'middle')}
      <circle cx="350" cy="96" r="10" fill="none" stroke="${P.red}" stroke-width="1.5" stroke-dasharray="3 2"/>
    `,
    hotspots: [
      { x: 350, y: 96, r: 26, correct: true, label: 'Missing tie-down connector',
        explain: 'One truss end has no tie-down strap — the uplift load path is broken on that side.' },
      { x: 130, y: 96, r: 24, correct: false, label: 'Strap present',
        explain: 'This side is correctly strapped — not the defect.' },
      { x: 240, y: 90, r: 22, correct: false, label: 'Truss apex',
        explain: 'The apex is not the issue; look at the connections to the plate.' },
    ],
  },
  {
    id: 'SPOT-FLASH', topic: 'ROOF-FLASHING', skill: 'waterproofing',
    title: 'Roof-to-wall — spot the flashing defect',
    prompt: 'Two roof-to-wall junctions. Click the one that will leak.',
    bg: `
      ${tx(130, 30, 'Junction A', P.line, 11, 'middle', 700)}
      <rect x="70" y="60" width="18" height="150" fill="${P.tile}" stroke="${P.line}"/>
      <polygon points="88,150 210,180 210,196 88,166" fill="${P.slab}" stroke="${P.line}"/>
      <path d="M108,118 L108,150 L200,172" fill="none" stroke="${P.good}" stroke-width="3"/>
      ${tx(150, 232, 'Flashing over roof', P.good, 9, 'middle')}
      <line x1="250" y1="55" x2="250" y2="250" stroke="${P.line}" stroke-dasharray="4 4"/>
      ${tx(370, 30, 'Junction B', P.line, 11, 'middle', 700)}
      <rect x="320" y="60" width="18" height="150" fill="${P.tile}" stroke="${P.line}"/>
      <polygon points="338,150 452,180 452,196 338,166" fill="${P.slab}" stroke="${P.line}"/>
      <path d="M358,150 L358,118 M358,150 L448,172" fill="none" stroke="${P.red}" stroke-width="3"/>
      ${tx(392, 232, 'Flashing under roof', P.red, 9, 'middle')}
    `,
    hotspots: [
      { x: 375, y: 150, r: 34, correct: true, label: 'Reverse-lapped flashing (B)',
        explain: 'Junction B is lapped so water can track behind the flashing into the wall — the leak path.' },
      { x: 150, y: 150, r: 32, correct: false, label: 'Correct flashing (A)',
        explain: 'Junction A sheds water out over the roof — correct.' },
    ],
  },
  {
    id: 'SPOT-PEN', topic: 'SERV-PENETRATION', skill: 'structural',
    title: 'Framing — spot the service defect',
    prompt: 'A pipe passes through a structural member. Click the defect.',
    bg: `
      <rect x="50" y="120" width="380" height="54" fill="${P.timber}" stroke="${P.line}"/>
      ${tx(240, 110, 'Structural member', P.line, 10, 'middle')}
      <rect x="150" y="120" width="180" height="54" fill="${P.good}" opacity="0.22"/>
      ${tx(240, 152, 'allowable zone', P.good, 9, 'middle')}
      <circle cx="240" cy="147" r="10" fill="#0e1830" stroke="${P.good}"/>
      <circle cx="380" cy="147" r="22" fill="#0e1830" stroke="${P.red}" stroke-width="2"/>
      ${tx(380, 196, 'Large hole', P.red, 9, 'middle')}
    `,
    hotspots: [
      { x: 380, y: 147, r: 26, correct: true, label: 'Oversized hole outside the zone',
        explain: 'A large hole outside the allowable notch/hole zone reduces the member’s capacity — the defect.' },
      { x: 240, y: 147, r: 20, correct: false, label: 'Small hole in the allowable zone',
        explain: 'A small hole within the permitted zone can be acceptable — not the defect.' },
    ],
  },
  {
    id: 'SPOT-BARRIER', topic: 'SAFE-BARRIER', skill: 'safety',
    title: 'Level change — spot the safety defect',
    prompt: 'A raised area with two edges. Click the safety defect.',
    bg: `
      <rect x="60" y="150" width="360" height="70" fill="${P.slab}" stroke="${P.line}"/>
      ${tx(240, 190, 'Raised alfresco', P.line, 10, 'middle')}
      <line x1="70" y1="90" x2="70" y2="150" stroke="${P.good}" stroke-width="3"/>
      <line x1="70" y1="100" x2="150" y2="100" stroke="${P.good}" stroke-width="3"/>
      <line x1="150" y1="90" x2="150" y2="150" stroke="${P.good}" stroke-width="3"/>
      ${tx(110, 82, 'Barrier', P.good, 9, 'middle')}
      ${tx(370, 140, 'Open edge (drop)', P.red, 9, 'middle')}
      <line x1="420" y1="150" x2="420" y2="220" stroke="${P.water}"/>
    `,
    hotspots: [
      { x: 400, y: 150, r: 28, correct: true, label: 'Unprotected edge above a drop',
        explain: 'This edge has a fall with no barrier — if it exceeds the trigger height, a barrier is required.' },
      { x: 110, y: 120, r: 26, correct: false, label: 'Guarded edge',
        explain: 'This edge already has a barrier — not the defect.' },
    ],
  },
];
