import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaperForceGraph } from './components/PaperForceGraph';
import rawPayload from './data/papers.json';
import type { PaperGraphPayload, PaperNode } from './types';

const payload = rawPayload as PaperGraphPayload;

function withAggregatedCitations(nodes: PaperNode[]): PaperNode[] {
  const paperNodes = nodes.filter((n) => n.role === 'paper');
  const total = paperNodes.reduce((sum, n) => sum + Math.max(0, n.citations || 0), 0);
  const byPillar = new Map<string, number>();
  for (const n of paperNodes) {
    if (!n.pillarId) continue;
    byPillar.set(n.pillarId, (byPillar.get(n.pillarId) || 0) + Math.max(0, n.citations || 0));
  }
  return nodes.map((n) => {
    if (n.role === 'hub') return { ...n, citations: total };
    if (n.role === 'pillar') return { ...n, citations: byPillar.get(n.id) || 0 };
    return n;
  });
}

export default function App() {
  const initialGraph = useMemo(
    () => ({
      nodes: withAggregatedCitations(payload.nodes.map((n) => ({ ...n }))),
      links: payload.links.map((l) => ({ ...l })),
    }),
    [],
  );
  const graph = initialGraph;
  const [focusId, setFocusId] = useState<string | null>('hub-medical');

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const onResize = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize({ w: Math.max(320, r.width), h: Math.max(400, r.height) });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => onResize());
    ro.observe(el);
    onResize();
    return () => ro.disconnect();
  }, [onResize]);

  useEffect(() => {
    setFocusId('hub-medical');
  }, []);

  return (
    <div className="app">
      <div className="app__canvas-wrap" ref={wrapRef}>
        <PaperForceGraph
          graphData={graph}
          focusId={focusId}
          onFocus={setFocusId}
          width={size.w}
          height={size.h}
        />
      </div>
    </div>
  );
}
