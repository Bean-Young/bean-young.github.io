import { useMemo } from 'react';
import type { PaperLink, PaperNode } from '../types';
import { asNodeId } from '../lib/graphUtils';

export function useFilteredGraph(
  nodes: PaperNode[],
  links: PaperLink[],
  yearMax: number,
  search: string,
) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    const fnodes = nodes.filter(
      (n) => n.year <= yearMax && (q === '' || n.title.toLowerCase().includes(q)),
    );
    const ids = new Set(fnodes.map((n) => n.id));
    const flinks = links.filter((l) => ids.has(asNodeId(l.source)) && ids.has(asNodeId(l.target)));
    return { nodes: fnodes, links: flinks };
  }, [nodes, links, yearMax, search]);
}
