import type { LinkKind, PaperLink, PaperNode } from '../types';

export function asNodeId(v: string | PaperNode): string {
  if (typeof v === 'string') return v;
  return v.id;
}

export function linkKey(l: PaperLink): string {
  return `${asNodeId(l.source)}|${asNodeId(l.target)}|${l.type}`;
}

export function mergeExpansion(
  nodes: PaperNode[],
  links: PaperLink[],
  expansion: { nodes: PaperNode[]; links: PaperLink[] },
): { nodes: PaperNode[]; links: PaperLink[] } {
  const idSet = new Set(nodes.map((n) => n.id));
  const addNodes = expansion.nodes.filter((n) => !idSet.has(n.id));
  const mergedNodes = [...nodes, ...addNodes];
  const lk = new Set(links.map(linkKey));
  const addLinks = expansion.links.filter((l) => !lk.has(linkKey(l)));
  return { nodes: mergedNodes, links: [...links, ...addLinks] };
}

export type HighlightSets = {
  neighborIds: Set<string>;
  /** link keys that lie on citation ego-graph of focus */
  highlightLinkKeys: Set<string>;
  outgoingCite: Set<string>;
  incomingCite: Set<string>;
};

export function computeHighlight(
  focusId: string | null,
  links: PaperLink[],
): HighlightSets {
  const empty = (): HighlightSets => ({
    neighborIds: new Set(),
    highlightLinkKeys: new Set(),
    outgoingCite: new Set(),
    incomingCite: new Set(),
  });
  if (!focusId) return empty();

  const neighborIds = new Set<string>();
  const highlightLinkKeys = new Set<string>();
  const outgoingCite = new Set<string>();
  const incomingCite = new Set<string>();

  for (const l of links) {
    const s = asNodeId(l.source);
    const t = asNodeId(l.target);
    if (s !== focusId && t !== focusId) continue;
    neighborIds.add(s === focusId ? t : s);
    highlightLinkKeys.add(linkKey(l));
    if (l.type === 'cites') {
      if (s === focusId) outgoingCite.add(linkKey(l));
      if (t === focusId) incomingCite.add(linkKey(l));
    }
  }
  neighborIds.add(focusId);
  return { neighborIds, highlightLinkKeys, outgoingCite, incomingCite };
}

export function linkColorFor(
  l: PaperLink,
  focusId: string | null,
  hi: HighlightSets,
): string {
  const k = linkKey(l);
  const base = { cites: 'rgba(148,163,184,0.22)', extends: 'rgba(167,139,250,0.28)', similar: 'rgba(100,116,139,0.2)' };
  if (!focusId || !hi.highlightLinkKeys.has(k)) {
    return base[l.type as LinkKind] ?? base.cites;
  }
  if (l.type === 'cites') {
    if (hi.outgoingCite.has(k)) return 'rgba(56,189,248,0.85)';
    if (hi.incomingCite.has(k)) return 'rgba(244,114,182,0.85)';
    return 'rgba(148,163,184,0.5)';
  }
  if (l.type === 'extends') return 'rgba(167,139,250,0.9)';
  return 'rgba(148,163,184,0.55)';
}

export function nodeRadius(n: PaperNode): number {
  if (n.role === 'hub') return 45;
  if (n.role === 'pillar') return 32;
  const citations = Math.min(Math.max(n.citations, 0), 100);
  return Math.min(24, 15 + Math.sqrt(citations) * 2.1);
}

function baseColor(n: PaperNode): string {
  if (n.role === 'hub') return '#f4c95d';
  if (n.role === 'pillar') {
    if (n.id === 'cat-3d') return '#56b4c8';
    if (n.id === 'cat-diag') return '#70b889';
    if (n.id === 'cat-trust') return '#a98ac7';
  }
  if (n.pillarId === 'cat-3d') return '#c5e7ed';
  if (n.pillarId === 'cat-diag') return '#d2ebda';
  if (n.pillarId === 'cat-trust') return '#e3d7ee';
  return '#d9e0e8';
}

export function nodeColorFor(
  n: PaperNode,
  focusId: string | null,
  hi: HighlightSets,
): string {
  if (!focusId) return baseColor(n);
  if (n.id === focusId) return '#f4c95d';
  if (hi.neighborIds.has(n.id)) return baseColor(n);
  return 'rgba(203,213,225,0.58)';
}
