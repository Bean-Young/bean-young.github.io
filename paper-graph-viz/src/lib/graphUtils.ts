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
  const c = Math.min(Math.max(n.citations, 0), 5000);
  let r = 18 + Math.pow(c, 0.96) * 2.8;
  if (n.role === 'hub') r *= 1.18;
  if (n.role === 'pillar') r *= 1.08;
  return Math.min(86, r);
}

function baseColor(n: PaperNode): string {
  if (n.role === 'hub') return '#fbbf24';
  if (n.role === 'pillar') {
    if (n.id === 'cat-3d') return '#38bdf8';
    if (n.id === 'cat-diag') return '#4ade80';
    if (n.id === 'cat-trust') return '#c084fc';
  }
  return 'rgba(148,163,184,0.92)';
}

export function nodeColorFor(
  n: PaperNode,
  focusId: string | null,
  hi: HighlightSets,
): string {
  if (!focusId) return baseColor(n);
  if (n.id === focusId) return '#fbbf24';
  if (hi.neighborIds.has(n.id)) return 'rgba(34,211,238,0.95)';
  return 'rgba(71,85,105,0.42)';
}
