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
  {
    id: 'STR-LINTEL', topic: 'Lintels over openings', category: 'Structure', skill: 'structural',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '',
    clause: '', source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED',
    confidence: 'LOW',
    explanation: 'A lintel spans an opening and carries the load above it to the supports either side. The member size and bearing must match the engineering for the span and load, or the opening can deflect or fail.',
    common_mistake: 'Substituting a smaller/available lintel than the one specified for the span.',
    site_example: 'A window opening framed with a lintel that looks lighter than the detail.', prerequisites: [], related_topics: ['STR-WALL', 'STR-TIEDOWN'],
  },
  {
    id: 'STR-BRACING', topic: 'Wall bracing', category: 'Structure', skill: 'structural', difficulty: 2,
    jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Bracing resists horizontal (racking) forces such as wind. The type, quantity and fixing of bracing units must follow the design; removing or under-fixing bracing weakens lateral resistance.',
    common_mistake: 'Treating bracing as optional sheeting rather than a designed structural element.',
    site_example: 'A braced wall panel with fixings missing along one edge.', prerequisites: [], related_topics: ['STR-TIEDOWN'],
  },
  {
    id: 'STR-FOOTING', topic: 'Footings & site classification', category: 'Structure', skill: 'structural',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Footing design depends on the site classification (reactivity of the soil) and the loads. A footing built to the wrong classification or without the specified reinforcement/depth can move or crack.',
    common_mistake: 'Pouring footings before verifying reinforcement, depth and the geotechnical/site classification.',
    site_example: 'Footing trenches that look shallower than the engineering detail.', prerequisites: [], related_topics: ['STR-WALL'],
  },
  {
    id: 'ROOF-FLASHING', topic: 'Roof & wall flashings', category: 'Building envelope', skill: 'waterproofing',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Flashings direct water away from junctions (roof-to-wall, penetrations, parapets). Incorrect laps, upturns or terminations let water track into the structure.',
    common_mistake: 'Relying on sealant instead of correctly lapped and terminated flashing.',
    site_example: 'A roof-to-wall junction with flashing lapped the wrong way.', prerequisites: [], related_topics: ['ROOF-DRAINAGE', 'WP-WETAREA'],
  },
  {
    id: 'ROOF-DRAINAGE', topic: 'Gutters, downpipes & overflow', category: 'Building envelope', skill: 'defects',
    difficulty: 1, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Roof drainage must carry design rainfall away, with overflow provisions so that a blockage sheds water outside rather than into the building (e.g. via eaves gutters overflowing internally).',
    common_mistake: 'Omitting overflow provisions or setting gutters without adequate fall.',
    site_example: 'A box gutter with no visible overflow outlet.', prerequisites: [], related_topics: ['ROOF-FLASHING'],
  },
  {
    id: 'SAFE-BARRIER', topic: 'Barriers to prevent falls', category: 'Safety', skill: 'safety', difficulty: 2,
    jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: 'NCC 2022', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Where there is a fall hazard above a defined height, a barrier of adequate height and opening resistance is generally required. Confirm the trigger height and the barrier requirements against the current provision.',
    common_mistake: 'Assuming a decorative balustrade meets the opening/height requirements without checking.',
    site_example: 'A raised alfresco edge with no barrier where there may be a fall.', prerequisites: [], related_topics: ['SAFE-GLAZING'],
  },
  {
    id: 'SAFE-GLAZING', topic: 'Glazing in hazardous locations', category: 'Safety', skill: 'safety', difficulty: 2,
    jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '', source: 'ABCB_NCC_V2',
    requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Glazing in locations with a human-impact risk (e.g. low panels, doors, wet areas) generally needs to meet impact-safety requirements. The type of glass and marking matter.',
    common_mistake: 'Installing ordinary glass in a location that requires grade-A safety glazing.',
    site_example: 'A full-height glass panel beside a door with no safety marking.', prerequisites: [], related_topics: ['SAFE-BARRIER'],
  },
  {
    id: 'SERV-PENETRATION', topic: 'Service penetrations through structure', category: 'Services', skill: 'structural',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Notching or drilling structural members for services can reduce their capacity beyond allowable limits. Penetrations must respect the member\'s permitted notch/hole zones per the engineering.',
    common_mistake: 'Drilling a large hole through a joist or truss chord outside the allowable zone.',
    site_example: 'A plumbing pipe punched through the middle of a truss bottom chord.', prerequisites: [], related_topics: ['STR-TIEDOWN'],
  },
  {
    id: 'SERV-SMOKE', topic: 'Smoke alarms', category: 'Services', skill: 'defects', difficulty: 1,
    jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: 'NCC 2022', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Smoke alarms must be provided and located to give early warning. Type, power source and location requirements apply; WA may add its own requirements. Verify against the current provision and WA requirements.',
    common_mistake: 'Placing alarms where cooking/steam causes nuisance, or omitting required locations.',
    site_example: 'A hallway with no smoke alarm serving the bedrooms.', prerequisites: [], related_topics: [],
  },
  {
    id: 'TERMITE', topic: 'Termite management', category: 'Building envelope', skill: 'defects', difficulty: 2,
    jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '', source: 'ABCB_NCC_V2',
    requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Where required, a termite management system (physical and/or chemical) plus a durable notice is provided. Breaches (e.g. bridging the barrier) can void the system.',
    common_mistake: 'Rendering or paving over a termite barrier so it is bridged.',
    site_example: 'A paved path built up over the slab edge termite barrier.', prerequisites: [], related_topics: [],
  },
  {
    id: 'CONTRACT-VARIATION', topic: 'Variations & documentation', category: 'Project management', skill: 'contracts',
    difficulty: 2, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'WA_BUILDING_ACT', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'A client change should be investigated for its knock-on effects (services, structure, cost, time, approvals) and captured in a documented, priced variation before the work proceeds.',
    common_mistake: 'Doing the change on a verbal request without a documented, priced variation.',
    site_example: 'A client asks to move a fitting after rough-in with no written variation.', prerequisites: [], related_topics: ['REG-PERMIT'],
  },
  {
    id: 'SITE-DRAINAGE', topic: 'Site stormwater & surface drainage', category: 'Site', skill: 'siteManagement',
    difficulty: 1, jurisdiction: 'WA', building_class: 'Class 1a', ncc_edition: '', ncc_section: '', clause: '',
    source: 'ABCB_NCC_V2', requirement_type: 'educational-explanation', status: 'UNVERIFIED', confidence: 'LOW',
    explanation: 'Surface water and roof stormwater must be directed away from the building and disposed of as designed, so water does not pond against footings or enter the building.',
    common_mistake: 'Grading paving or garden beds so water runs back toward the slab edge.',
    site_example: 'Finished ground falling toward the dwelling instead of away.', prerequisites: [], related_topics: ['ROOF-DRAINAGE'],
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
  {
    id: 'SCN-LINTEL', title: 'A lighter lintel than specified', stage: 'frame', topic: 'STR-LINTEL',
    difficulty: 2, skillsTested: ['structural', 'defects', 'siteManagement'],
    brief: 'Over the main window opening the framer has installed a lintel that looks lighter than the one on the detail. He says the supplier was out of the specified size so he "used what was on the truck".',
    evidence: [
      { id: 'l-detail', doc: 'structural', label: 'Check the specified lintel size and span on the structural detail', good: true },
      { id: 'l-measure', doc: null, label: 'Measure the opening span and compare to the schedule', good: true },
      { id: 'l-load', doc: 'structural', label: 'Confirm what the lintel supports above', good: true },
      { id: 'l-truck', doc: null, label: 'Accept that "what was on the truck" is close enough', good: false },
    ],
    rulePath: { jurisdiction: 'WA', edition: 'NCC 2022', area: 'Structure', pathway: 'Engineering / permitted documents', source: 'ABCB_NCC_V2' },
    decisions: [
      { id: 'l-leave', label: 'Leave it — it looks strong enough', scores: { safety: -2, compliance: -2, quality: -1, documentation: -1, risk: -2 }, outcomeGood: false },
      { id: 'l-rfi', label: 'Hold the affected work, raise an RFI to confirm/replace the lintel, document the substitution', scores: { safety: 2, compliance: 2, quality: 2, documentation: 2, risk: 2 }, outcomeGood: true },
    ],
    consequences: {
      good: 'You confirm the substitution against the schedule, replace it with the specified member (or get engineering acceptance in writing), and photograph it. Load path verified and recorded.',
      bad: 'The under-sized lintel stays. Months later the window head deflects, cracking the render above and jamming the window — invasive rectification and a warranty claim follow.',
    },
    learn: { rootCause: 'Unapproved structural substitution.', missedEvidence: 'The lintel schedule and the load above.', better: 'Availability is not a compliance pathway; verify or replace and document.' },
  },
  {
    id: 'SCN-FLASHING', title: 'Flashing lapped the wrong way', stage: 'roof', topic: 'ROOF-FLASHING',
    difficulty: 2, skillsTested: ['waterproofing', 'defects', 'ncc'],
    brief: 'At the roof-to-wall junction the flashing appears lapped so that water could track behind it. The roofer has run a bead of sealant along the top and says "that\'ll stop it".',
    evidence: [
      { id: 'f-detail', doc: 'wet-area-detail', label: 'Check the flashing detail (laps, upturn, termination)', good: true },
      { id: 'f-inspect', doc: null, label: 'Inspect the lap direction and upturn height on site', good: true },
      { id: 'f-water', doc: null, label: 'Consider where water goes in heavy rain', good: true },
      { id: 'f-sealant', doc: null, label: 'Rely on the sealant bead as the waterproofing', good: false },
    ],
    rulePath: { jurisdiction: 'WA', edition: 'NCC 2022', area: 'Health & amenity (wet areas)', pathway: 'DTS (Housing Provisions)', source: 'ABCB_NCC_V2' },
    decisions: [
      { id: 'f-accept', label: 'Accept it — the sealant will hold', scores: { safety: 0, compliance: -2, quality: -2, documentation: -1, risk: -2 }, outcomeGood: false },
      { id: 'f-redo', label: 'Have the flashing re-lapped correctly before concealment; document with photos', scores: { safety: 0, compliance: 2, quality: 2, documentation: 2, risk: 2 }, outcomeGood: true },
    ],
    consequences: {
      good: 'The flashing is corrected and photographed before the wall is closed up. No concealed leak path.',
      bad: 'The sealant perishes within a couple of seasons and water tracks behind the flashing, staining the internal lining and requiring the junction to be opened up again.',
    },
    learn: { rootCause: 'Reverse-lapped flashing relying on sealant.', missedEvidence: 'The flashing detail and lap direction.', better: 'Sealant is a supplement, not the primary flashing; fix the lap before concealment.' },
  },
  {
    id: 'SCN-BARRIER', title: 'A drop with no barrier', stage: 'roof', topic: 'SAFE-BARRIER',
    difficulty: 2, skillsTested: ['safety', 'ncc', 'siteManagement'],
    brief: 'The raised alfresco has an edge with a drop to the yard. There is no barrier shown yet. A trade says "it\'s not high enough to need one".',
    evidence: [
      { id: 'b-height', doc: null, label: 'Measure the actual fall height at the edge', good: true },
      { id: 'b-plan', doc: 'floor-plan', label: 'Check the plans/finished levels for the edge', good: true },
      { id: 'b-req', doc: 'permit', label: 'Check what the approved documents show for the edge', good: true },
      { id: 'b-verbal', doc: null, label: 'Accept the trade\'s guess about the trigger height', good: false },
    ],
    rulePath: { jurisdiction: 'WA', edition: 'NCC 2022', area: 'Safe movement & access', pathway: 'DTS (Housing Provisions)', source: 'ABCB_NCC_V2' },
    decisions: [
      { id: 'b-ignore', label: 'Move on — probably fine', scores: { safety: -2, compliance: -2, quality: 0, documentation: -1, risk: -2 }, outcomeGood: false },
      { id: 'b-check', label: 'Measure the fall, check the barrier trigger height against the current provision, document the finding', scores: { safety: 2, compliance: 2, quality: 1, documentation: 2, risk: 1 }, outcomeGood: true },
    ],
    consequences: {
      good: 'You establish the actual fall height and the applicable requirement, and either confirm no barrier is needed or add the required one — recorded either way.',
      bad: 'The edge is left as-is on a guess. A barrier is later found to be required at handover, forcing a retrofit that clashes with finished paving.',
    },
    learn: { rootCause: 'Fall-barrier requirement decided by guess, not evidence.', missedEvidence: 'The measured fall height and the trigger provision.', better: 'Confirm the trigger height against the current provision before deciding.' },
  },
  {
    id: 'SCN-INSUL', title: 'Insulation crammed and compressed', stage: 'roof', topic: 'ENERGY-INSUL',
    difficulty: 1, skillsTested: ['defects', 'ncc', 'quality'],
    brief: 'Near the bathroom exhaust, batts have been stuffed in and compressed to about half their thickness to fit around ducting. The energy report assumed the rated R-value.',
    evidence: [
      { id: 'i-report', doc: 'energy', label: 'Check the R-value the energy report relied on', good: true },
      { id: 'i-inspect', doc: null, label: 'Inspect the compressed/again gapped areas', good: true },
      { id: 'i-verbal', doc: null, label: 'Assume compressed batts still perform the same', good: false },
    ],
    rulePath: { jurisdiction: 'WA', edition: 'NCC 2022', area: 'Energy efficiency', pathway: 'DTS (Housing Provisions)', source: 'ABCB_NCC_V2' },
    decisions: [
      { id: 'i-leave', label: 'Leave it — insulation is insulation', scores: { safety: 0, compliance: -1, quality: -2, documentation: -1, risk: -1 }, outcomeGood: false },
      { id: 'i-fix', label: 'Have the insulation reinstated to achieve the assumed value; note any gaps', scores: { safety: 0, compliance: 1, quality: 2, documentation: 1, risk: 1 }, outcomeGood: true },
    ],
    consequences: {
      good: 'The insulation is reworked so the assumed thermal value is actually achieved. Small cost, energy performance protected.',
      bad: 'The compressed insulation stays. The occupants later report the room runs cold/hot and the as-built performance falls short of the report.',
    },
    learn: { rootCause: 'Insulation not installed to its rated value.', missedEvidence: 'The R-value the report assumed.', better: 'Installed performance, not nominal product rating, is what counts.' },
  },
  {
    id: 'SCN-VARIATION', title: 'Client wants the sink moved', stage: 'frame', topic: 'CONTRACT-VARIATION',
    difficulty: 2, skillsTested: ['contracts', 'projectControl', 'siteManagement'],
    brief: 'After rough-in the client asks to move the kitchen sink 600 mm. They want it "just done" and are surprised you would write anything up.',
    evidence: [
      { id: 'v-plumb', doc: 'floor-plan', label: 'Check the plumbing/drainage impact of the move', good: true },
      { id: 'v-cab', doc: 'floor-plan', label: 'Check cabinetry and bench impacts', good: true },
      { id: 'v-cost', doc: null, label: 'Estimate cost and programme impact', good: true },
      { id: 'v-just', doc: null, label: 'Just move it on the verbal request, no paperwork', good: false },
    ],
    rulePath: { jurisdiction: 'WA', edition: 'NCC 2022', area: 'Project management', pathway: 'Contract / documentation', source: 'WA_BUILDING_ACT' },
    decisions: [
      { id: 'v-verbal', label: 'Do it on the verbal request to keep the client happy', scores: { safety: 0, compliance: 0, quality: 0, documentation: -2, risk: -2 }, outcomeGood: false },
      { id: 'v-doc', label: 'Investigate impacts, then issue a documented, priced variation for sign-off before proceeding', scores: { safety: 0, compliance: 1, quality: 1, documentation: 2, risk: 2 }, outcomeGood: true },
    ],
    consequences: {
      good: 'The variation is priced, its knock-on effects captured, and signed before the work — no dispute later about scope or cost.',
      bad: 'The undocumented change resurfaces at final claim as a disputed cost, and a plumbing clash the move caused is now concealed behind cabinetry.',
    },
    learn: { rootCause: 'Change made without a documented, priced variation.', missedEvidence: 'The knock-on impacts and a written instruction.', better: 'Investigate, price and document a variation before doing the work.' },
  },
];

// ---- RANDOM SITE EVENTS (§19) — small seeded library ----------------------------------------
export const EVENTS = [
  { id: 'EV-INSUL', stage: 'roof', topic: 'ENERGY-INSUL', text: 'Batts near the bathroom exhaust are compressed to half thickness.' },
  { id: 'EV-TIEDOWN', stage: 'frame', topic: 'STR-TIEDOWN', text: 'A truss appears to be missing its tie-down connector at the top plate.' },
  { id: 'EV-VARIATION', stage: 'frame', topic: 'REG-PERMIT', text: 'The client asks to move the kitchen sink 600 mm after framing.' },
  { id: 'EV-FLAT', stage: 'roof', topic: 'WP-FALLS', text: 'The shower base reads almost flat under a spirit level.' },
  { id: 'EV-LINTEL', stage: 'frame', topic: 'STR-LINTEL', text: 'The lintel over the main window looks lighter than the detail.' },
  { id: 'EV-BRACE', stage: 'frame', topic: 'STR-BRACING', text: 'A braced wall panel is missing fixings along one edge.' },
  { id: 'EV-FLASH', stage: 'roof', topic: 'ROOF-FLASHING', text: 'A roof-to-wall flashing appears lapped the wrong way.' },
  { id: 'EV-GUTTER', stage: 'roof', topic: 'ROOF-DRAINAGE', text: 'A box gutter has no visible overflow outlet.' },
  { id: 'EV-PEN', stage: 'frame', topic: 'SERV-PENETRATION', text: 'A pipe has been drilled through a truss bottom chord.' },
  { id: 'EV-FOOTING', stage: 'ground', topic: 'STR-FOOTING', text: 'Footing trenches look shallower than the engineering detail.' },
  { id: 'EV-BARRIER', stage: 'roof', topic: 'SAFE-BARRIER', text: 'A raised alfresco edge has a drop with no barrier.' },
];

// ---- DEFECTS LIBRARY (§16) — not every apparent defect is actually non-compliant ------------
export const DEFECTS = [
  { id: 'DF-FALLS', area: 'Waterproofing', topic: 'WP-FALLS', severity: 'high', text: 'Inadequate fall to the shower waste.', maybeAcceptable: false },
  { id: 'DF-MEMBRANE', area: 'Waterproofing', topic: 'WP-WETAREA', severity: 'high', text: 'Membrane upturn shorter than the detail.', maybeAcceptable: false },
  { id: 'DF-LINTEL', area: 'Structure', topic: 'STR-LINTEL', severity: 'high', text: 'Lintel smaller than specified for the span.', maybeAcceptable: false },
  { id: 'DF-WALL', area: 'Structure', topic: 'STR-WALL', severity: 'critical', text: 'Load-bearing wall altered without approval.', maybeAcceptable: false },
  { id: 'DF-TIEDOWN', area: 'Structure', topic: 'STR-TIEDOWN', severity: 'high', text: 'Missing roof tie-down connector.', maybeAcceptable: false },
  { id: 'DF-BRACE', area: 'Structure', topic: 'STR-BRACING', severity: 'high', text: 'Bracing panel under-fixed.', maybeAcceptable: false },
  { id: 'DF-PEN', area: 'Structure', topic: 'SERV-PENETRATION', severity: 'high', text: 'Service penetration outside allowable zone.', maybeAcceptable: true },
  { id: 'DF-FLASH', area: 'Envelope', topic: 'ROOF-FLASHING', severity: 'medium', text: 'Flashing reverse-lapped.', maybeAcceptable: false },
  { id: 'DF-GUTTER', area: 'Envelope', topic: 'ROOF-DRAINAGE', severity: 'medium', text: 'No overflow provision to box gutter.', maybeAcceptable: false },
  { id: 'DF-INSUL', area: 'Energy', topic: 'ENERGY-INSUL', severity: 'medium', text: 'Insulation compressed below rated value.', maybeAcceptable: true },
  { id: 'DF-BARRIER', area: 'Safety', topic: 'SAFE-BARRIER', severity: 'high', text: 'Missing fall barrier at a raised edge.', maybeAcceptable: true },
  { id: 'DF-GLAZE', area: 'Safety', topic: 'SAFE-GLAZING', severity: 'high', text: 'Non-safety glass in a hazardous location.', maybeAcceptable: false },
  { id: 'DF-TERMITE', area: 'Envelope', topic: 'TERMITE', severity: 'medium', text: 'Termite barrier bridged by paving.', maybeAcceptable: false },
  { id: 'DF-SMOKE', area: 'Services', topic: 'SERV-SMOKE', severity: 'high', text: 'Smoke alarm missing from a required location.', maybeAcceptable: false },
  { id: 'DF-HAIRLINE', area: 'Finishes', topic: null, severity: 'low', text: 'Fine hairline crack in cornice — may be acceptable shrinkage; needs monitoring.', maybeAcceptable: true },
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
