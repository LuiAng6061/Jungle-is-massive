// BuildMaster Australia — CONTENT LAYER (data only; no game logic, no hard-coded rule enforcement)
// Jurisdiction 1: Western Australia. Educational simulation only.
//
// REGULATORY ACCURACY RULE (master prompt §2): no NCC clause text, standard, measurement or
// tolerance is invented here. Items with confidence:"MEDIUM" have multi-source SECONDARY
// corroboration only (primary sources were egress-blocked at build time). Everything else is
// UNVERIFIED with empty clause fields, awaiting authoritative ingestion.

export const META = {
  jurisdiction: 'WA',
  buildAcademicOnly: true,
  disclaimer:
    'This application is an educational simulation. It does not constitute legal, engineering, ' +
    'building surveying, licensing or regulatory advice, and passing an in-app assessment does not ' +
    'confer a licence, registration or statutory qualification. Always verify requirements against ' +
    'the applicable legislation, NCC edition, standards, approvals and project-specific documentation.',
};

// ---- REGULATORY SOURCES (Priority-ranked, §3) ------------------------------------------------
export const SOURCES = {
  ABCB_NCC_V2: {
    id: 'ABCB_NCC_V2',
    authority: 'Australian Building Codes Board (ABCB)',
    document: 'National Construction Code 2022 — Volume Two & ABCB Housing Provisions',
    edition: 'NCC 2022',
    amendment: '',
    source_url: 'https://ncc.abcb.gov.au/editions/ncc-2022',
    priority: 1,
    note: 'Primary source egress-blocked in build environment; verify clause text directly.',
  },
  WA_BUILDING_ACT: {
    id: 'WA_BUILDING_ACT',
    authority: 'Parliament of Western Australia / DEMIRS',
    document: 'Building Act 2011 (WA)',
    edition: 'consolidated',
    source_url: 'https://www.legislation.wa.gov.au/legislation/statutes.nsf/law_a146699.html',
    priority: 1,
  },
  WA_BUILDING_REGS: {
    id: 'WA_BUILDING_REGS',
    authority: 'Government of Western Australia',
    document: 'Building Regulations 2012 (WA)',
    edition: 'consolidated',
    source_url: 'https://www.legislation.wa.gov.au/legislation/statutes.nsf/law_s6987.html',
    priority: 1,
  },
  AS_3740: {
    id: 'AS_3740',
    authority: 'Standards Australia',
    document: 'AS 3740 Waterproofing of domestic wet areas',
    edition: 'AS 3740:2021 (referenced by NCC 2022)',
    source_url: 'https://www.standards.org.au/',
    priority: 2,
  },
};

// ---- KNOWLEDGE TOPICS (§37 object shape) -----------------------------------------------------
// requirement_type: verified-requirement | educational-explanation | industry-practice | example
export const TOPICS = [
  {
    id: 'WP-FALLS', topic: 'Shower floor falls to waste', category: 'Waterproofing', skill: 'waterproofing',
    difficulty: 1, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: 'NCC 2022',
    ncc_section: 'Volume Two / Housing Provisions Part 10.2', clause: '', source: 'ABCB_NCC_V2',
    requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'MEDIUM',
    explanation:
      'Shower and wet-area floors are graded so water drains to the floor waste rather than ponding ' +
      'or migrating past the waterproofing. NCC 2022 reinstated wet-area construction detail into ' +
      'Housing Provisions Part 10.2, with AS 3740 available as an alternative construction method.',
    common_mistake: 'Assuming a visually "flat" floor is acceptable without checking the documented fall/grade.',
    site_example: 'A finished shower base where water pools in a corner instead of running to the waste.',
    prerequisites: [], related_topics: ['WP-WETAREA'],
  },
  {
    id: 'WP-WETAREA', topic: 'Wet area waterproofing (Part 10.2 / AS 3740)', category: 'Waterproofing',
    skill: 'waterproofing', difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a',
    ncc_edition: 'NCC 2022', ncc_section: 'Volume Two H4 / Housing Provisions Part 10.2', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED',
    confidence: 'MEDIUM',
    explanation:
      'Wet areas must be waterproofed / water-resistant to defined extents. In NCC 2022 the deemed-to-' +
      'satisfy detail sits in Housing Provisions Part 10.2, and AS 3740:2021 remains a suitable ' +
      'construction method. Confirm exact waterproofed extents against the current provision.',
    common_mistake: 'Treating AS 3740 and Part 10.2 as identical — NCC 2022 lets you use Part 10.2 without AS 3740.',
    site_example: 'Membrane turned up the wall to an undocumented height at the shower.',
    prerequisites: ['WP-FALLS'], related_topics: ['WP-FALLS', 'DTS-PERF'],
  },
  {
    id: 'REG-PERMIT', topic: 'WA building permit before work commences', category: 'Regulatory',
    skill: 'siteManagement', difficulty: 1, jurisdiction: 'WA', building_class: 'Class 1a',
    ncc_edition: '', ncc_section: '', clause: '', source: 'WA_BUILDING_ACT',
    requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'MEDIUM',
    explanation:
      'In WA, building work generally requires a building permit under the Building Act 2011 before work ' +
      'commences, unless specifically exempted by the Regulations or the Minister. Permits are administered ' +
      'with the Building Regulations 2012.',
    common_mistake: 'Starting affected work before confirming the permit covers it.',
    site_example: 'A structural alteration proposed that differs from the permitted documents.',
    prerequisites: [], related_topics: ['STR-WALL'],
  },
  {
    id: 'DTS-PERF', topic: 'DTS pathway vs Performance Solution', category: 'Regulatory reasoning',
    skill: 'ncc', difficulty: 3, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: 'NCC 2022',
    ncc_section: 'NCC governing requirements', clause: '', source: 'ABCB_NCC_V2',
    requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation:
      'Compliance with a Performance Requirement can be met by a Deemed-to-Satisfy (DTS) Solution, a ' +
      'Performance Solution, or a combination. Deviating from DTS is NOT automatically non-compliant, and a ' +
      'Performance Solution is NOT automatically acceptable — it must be shown to meet the relevant ' +
      'Performance Requirements with appropriate evidence.',
    common_mistake: 'Assuming "not DTS" means "illegal", or "Performance Solution" means "approved".',
    site_example: 'A window detail that differs from the documented DTS detail.', prerequisites: [],
    related_topics: ['WP-WETAREA'],
  },
  {
    id: 'STR-WALL', topic: 'Altered / removed structural wall', category: 'Structure', skill: 'structural',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '',
    clause: '', source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED',
    confidence: 'LOW',
    explanation:
      'A wall shown as structural on the engineering documentation carries load. Removing or altering it ' +
      'without engineering clarification changes the load path and can affect stability. The management ' +
      'response is typically to stop the AFFECTED work, obtain engineering input, and document it.',
    common_mistake: 'Relying on a trade\'s verbal assurance that "it will be fine".',
    site_example: 'A framed opening where the drawings show a load-bearing wall.', prerequisites: [],
    related_topics: ['REG-PERMIT'],
  },
  {
    id: 'STR-TIEDOWN', topic: 'Roof tie-down / connections', category: 'Structure', skill: 'structural',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '',
    clause: '', source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED',
    confidence: 'LOW',
    explanation:
      'Roof members must be tied down along a continuous load path to resist wind uplift, per the ' +
      'engineering design and applicable wind classification. Missing or substituted connectors break the ' +
      'load path.',
    common_mistake: 'Assuming standard connectors suit every wind classification without checking the design.',
    site_example: 'A truss with no visible tie-down connector at the top plate.', prerequisites: [],
    related_topics: [],
  },
  {
    id: 'ENERGY-INSUL', topic: 'Insulation installation & thermal bridging', category: 'Energy efficiency',
    skill: 'defects', difficulty: 1, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: 'NCC 2022',
    ncc_section: '', clause: '', source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation',
    status: 'UNVERIFIED', confidence: 'LOW',
    explanation:
      'Insulation only performs if installed to its intended thermal value: gaps, compression and thermal ' +
      'bridges reduce effective performance below the documented energy assessment.',
    common_mistake: 'Compressing batts to fit and assuming the rated R-value still applies.',
    site_example: 'Batts stuffed behind pipework, compressed to half thickness.', prerequisites: [],
    related_topics: [],
  },
  {
    id: 'SAFE-STOP', topic: 'Stop-work as a management decision', category: 'Safety / Management',
    skill: 'safety', difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '',
    ncc_section: '', clause: '', source: 'WA_BUILDING_ACT', requirement_type: 'educational-explanation',
    status: 'UNVERIFIED', confidence: 'LOW',
    explanation:
      'Stopping affected work is sometimes the correct action while information is obtained — but it is not ' +
      'universally correct. The builder must identify the SCOPE of affected work and the REASON, not stop the ' +
      'whole site reflexively.',
    common_mistake: 'Either ignoring a serious risk, or stopping everything without defining scope.',
    site_example: 'Concealed structural uncertainty discovered before lining.', prerequisites: [],
    related_topics: ['STR-WALL'],
  },
];

// ---- THE FIRST PROJECT (§12) -----------------------------------------------------------------
export const PROJECT = {
  id: 'perth-dwelling-01',
  name: 'Lot 42 — Single-storey dwelling, suburban Perth',
  jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: 'NCC 2022',
  summary: '3 bed / 2 bath, double garage, single storey. Brick veneer, timber roof framing.',
  documents: [
    { id: 'site-plan', name: 'Site plan', note: 'Setbacks, orientation, stormwater.' },
    { id: 'floor-plan', name: 'Floor plan', note: 'Room layout, wet areas, wall types.' },
    { id: 'elevations', name: 'Elevations', note: 'External finishes, heights.' },
    { id: 'structural', name: 'Structural drawings', note: 'Load-bearing walls, beams, tie-down.' },
    { id: 'wet-area-detail', name: 'Wet area detail', note: 'Falls, membrane extents, waste locations.' },
    { id: 'energy', name: 'Energy report', note: 'Insulation R-values, glazing.' },
    { id: 'permit', name: 'Building permit & approved docs', note: 'What was actually approved.' },
  ],
  stages: [
    { id: 'site', name: 'Site establishment' },
    { id: 'ground', name: 'Groundworks / foundations' },
    { id: 'slab', name: 'Slab' },
    { id: 'frame', name: 'Framing' },
    { id: 'roof', name: 'Roof / envelope' },
  ],
};

// ---- SCENARIOS (§16, §17, §23) ---------------------------------------------------------------
// A scenario is the playable unit: brief → investigate → find the rule → decide → consequence → learn.
// Decisions are scored on MULTIPLE dimensions, not a single right/wrong answer (§76).
export const SCENARIOS = [
  {
    id: 'SCN-SHOWER-FALLS', title: 'The shower floor looks flat', stage: 'roof', topic: 'WP-FALLS',
    difficulty: 1, skillsTested: ['waterproofing', 'defects', 'ncc'],
    brief:
      'At the wet-area rough-in inspection the tiler mentions the shower base "looks pretty flat" but says ' +
      '"it\'ll be fine once it\'s tiled". The wet area detail is in the documents.',
    // Investigation: which evidence to gather. Each has a weight toward good investigation.
    evidence: [
      { id: 'ev-detail', doc: 'wet-area-detail', label: 'Check the documented fall/grade to the waste', good: true },
      { id: 'ev-measure', doc: null, label: 'Measure the actual fall on site with a level', good: true },
      { id: 'ev-waste', doc: 'wet-area-detail', label: 'Confirm floor waste location vs. low point', good: true },
      { id: 'ev-verbal', doc: null, label: 'Accept the tiler\'s verbal assurance', good: false },
      { id: 'ev-paint', doc: null, label: 'Check the exterior paint colour selection', good: false },
    ],
    // Find-the-rule correct navigation path.
    rulePath: {
      jurisdiction: 'WA', edition: 'NCC 2022', area: 'Health & amenity (wet areas)',
      pathway: 'DTS (Housing Provisions)', source: 'ABCB_NCC_V2',
    },
    decisions: [
      {
        id: 'd-continue', label: 'Let tiling proceed as-is',
        scores: { safety: 0, compliance: -2, quality: -2, documentation: -1, risk: -2 },
        outcomeGood: false,
      },
      {
        id: 'd-investigate', label: 'Hold shower tiling; measure falls & compare to the detail; document before proceeding',
        scores: { safety: 1, compliance: 2, quality: 2, documentation: 2, risk: 2 },
        outcomeGood: true,
      },
      {
        id: 'd-stopall', label: 'Stop the entire site',
        scores: { safety: 1, compliance: 0, quality: 0, documentation: 0, risk: -1 },
        outcomeGood: false, note: 'Over-scoped: only the shower waterproofing is affected.',
      },
    ],
    consequences: {
      good:
        'You confirm the fall is inadequate against the documented detail, have it corrected and photographed ' +
        'before waterproofing. No concealed defect. Small programme cost, large risk avoided.',
      bad:
        'Tiling proceeds. Three stages later the client reports water pooling and a damp skirting in the ' +
        'adjoining room. The concealed waterproofing must be investigated and partly rectified — delay, cost ' +
        'and a client dispute follow.',
    },
    learn: {
      rootCause: 'Inadequate fall to waste concealed by finishes.',
      missedEvidence: 'The documented grade and an on-site measurement.',
      better: 'Treat wet-area falls as a hold point before waterproofing; verify against the detail; document.',
    },
  },
  {
    id: 'SCN-WALL-REMOVED', title: 'A structural wall is missing', stage: 'frame', topic: 'STR-WALL',
    difficulty: 2, skillsTested: ['structural', 'safety', 'siteManagement'],
    brief:
      'On a framing walk you notice a wall shown as load-bearing on the structural drawings has been framed ' +
      'as a wide opening instead. The carpenter says he "does it all the time".',
    evidence: [
      { id: 'w-str', doc: 'structural', label: 'Confirm on the structural drawings that the wall is load-bearing', good: true },
      { id: 'w-permit', doc: 'permit', label: 'Check whether the change was ever approved', good: true },
      { id: 'w-above', doc: 'structural', label: 'Trace what the wall supports (load path above)', good: true },
      { id: 'w-verbal', doc: null, label: 'Rely on the carpenter\'s experience', good: false },
    ],
    rulePath: {
      jurisdiction: 'WA', edition: 'NCC 2022', area: 'Structure',
      pathway: 'Engineering / permitted documents', source: 'WA_BUILDING_ACT',
    },
    decisions: [
      {
        id: 'w-proceed', label: 'Proceed — the frame is already up',
        scores: { safety: -2, compliance: -2, quality: -1, documentation: -1, risk: -2 }, outcomeGood: false,
      },
      {
        id: 'w-stopscope', label: 'Stop the affected structural work, obtain engineering clarification, document, then act',
        scores: { safety: 2, compliance: 2, quality: 1, documentation: 2, risk: 2 }, outcomeGood: true,
      },
    ],
    consequences: {
      good:
        'You isolate the affected work, raise an RFI to the engineer, and get a documented resolution (either ' +
        'a compliant alternative or reinstatement). Load path integrity confirmed and recorded.',
      bad:
        'Framing and roof proceed over an unverified load path. A later inspection queries stability, forcing ' +
        'invasive investigation and possible rework at a far higher cost.',
    },
    learn: {
      rootCause: 'Undocumented change to a load-bearing element.',
      missedEvidence: 'The structural drawings and the load path above.',
      better: 'Verbal experience is not evidence of compliance; stop the affected work and get engineering sign-off.',
    },
  },
];

// ---- RANDOM SITE EVENTS (§19) — small seeded library ----------------------------------------
export const EVENTS = [
  { id: 'EV-INSUL', stage: 'roof', topic: 'ENERGY-INSUL', text: 'Batts near the bathroom exhaust are compressed to half thickness.' },
  { id: 'EV-TIEDOWN', stage: 'frame', topic: 'STR-TIEDOWN', text: 'A truss appears to be missing its tie-down connector at the top plate.' },
  { id: 'EV-VARIATION', stage: 'frame', topic: 'REG-PERMIT', text: 'The client asks to move the kitchen sink 600 mm after framing.' },
  { id: 'EV-FLAT', stage: 'roof', topic: 'WP-FALLS', text: 'The shower base reads almost flat under a spirit level.' },
];

// ---- SUBCONTRACTORS & CLIENTS (§29, §30) — profiles only, not stereotypes -------------------
export const SUBCONTRACTORS = [
  { id: 'chippy', trade: 'Carpenter', competence: 4, reliability: 4, documentation: 2, risk: 'Confident; light on documentation.' },
  { id: 'plumber', trade: 'Plumber', competence: 3, reliability: 4, documentation: 3, risk: 'Budget-focused; watch substitutions.' },
  { id: 'tiler', trade: 'Tiler', competence: 5, reliability: 3, documentation: 3, risk: 'Perfectionist but slower.' },
];
export const CLIENT = { id: 'client-01', name: 'The Novaks', priorities: ['budget', 'quality'], note: 'First-home owners; cost-sensitive but want it right.' };

// ---- SKILL AXES (§11) ------------------------------------------------------------------------
export const SKILL_AXES = [
  { key: 'structural', label: 'Structural' },
  { key: 'waterproofing', label: 'Waterproofing' },
  { key: 'ncc', label: 'NCC navigation' },
  { key: 'siteManagement', label: 'Site management' },
  { key: 'contracts', label: 'Contracts / docs' },
  { key: 'defects', label: 'Defects' },
  { key: 'safety', label: 'Safety' },
  { key: 'projectControl', label: 'Project control' },
  { key: 'forensic', label: 'Forensic reasoning' },
];

export const LEVELS = [
  'Construction Beginner', 'Site Assistant', 'Junior Site Supervisor', 'Site Supervisor',
  'Junior Builder', 'Residential Builder', 'Senior Builder', 'Construction Manager',
  'Expert Builder', 'Master / Forensic Builder',
];
