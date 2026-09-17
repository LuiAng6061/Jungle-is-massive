// BuildMaster Australia — REGULATORY KNOWLEDGE ENGINE
// The game engine NEVER hard-codes rules; it queries this module. Version/status-aware (§4, §38, §58).

import { SOURCES, TOPICS } from './data.js';

export function getSource(id) {
  return SOURCES[id] || null;
}

export function getTopic(id) {
  return TOPICS.find((t) => t.id === id) || null;
}

// Determine the applicable regulatory context for a project (does NOT assume newest = applicable).
export function regulatoryContext(project) {
  return {
    jurisdiction: project.jurisdiction,
    building_class: project.building_class,
    ncc_edition: project.ncc_edition, // taken from the project's approval context, not "latest"
  };
}

// Build the source-verification record shown in the VIEW SOURCE panel (§39).
export function sourcePanel(topicId) {
  const t = getTopic(topicId);
  if (!t) return null;
  const s = getSource(t.source);
  const unreliable = t.status !== 'CURRENT';
  return {
    topic: t.topic,
    requirement_type: t.requirement_type,
    authority: s ? s.authority : '—',
    document: s ? s.document : '—',
    edition: t.ncc_edition || (s ? s.edition : ''),
    section: t.ncc_section || '',
    clause: t.clause || '(clause not yet verified)',
    source_url: s ? s.source_url : '',
    status: t.status,
    confidence: t.confidence,
    warning: unreliable
      ? 'UNVERIFIED — Do not rely on this information for real-world compliance. Verify against the ' +
        'applicable NCC edition, standard, legislation and project documents.'
      : '',
  };
}

// Statuses preserved, never overwritten (§58).
export const STATUS = ['CURRENT', 'SUPERSEDED', 'HISTORICAL', 'DRAFT', 'UNVERIFIED'];
