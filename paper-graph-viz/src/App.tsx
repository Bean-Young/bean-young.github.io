import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaperForceGraph } from './components/PaperForceGraph';
import rawPayload from './data/papers.json';
import type { PaperGraphPayload, PaperNode } from './types';

const payload = rawPayload as PaperGraphPayload;
const GS_PAPER_CITATIONS_URL =
  'https://cdn.jsdelivr.net/gh/Bean-Young/bean-young.github.io@google-scholar-stats/gs_publication_citations.json';

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
  const [graph, setGraph] = useState(initialGraph);
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

  useEffect(() => {
    let cancelled = false;
    const loadCitations = async () => {
      try {
        const res = await fetch(`${GS_PAPER_CITATIONS_URL}?t=${Date.now()}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          updated?: Array<{ id?: string; new?: number }>;
        };
        if (cancelled || !Array.isArray(data.updated)) return;
        const map = new Map<string, number>();
        for (const item of data.updated) {
          if (item.id && typeof item.new === 'number') {
            map.set(item.id, item.new);
          }
        }
        if (map.size === 0) return;
        setGraph((prev) => ({
          ...prev,
          nodes: withAggregatedCitations(
            prev.nodes.map((n) =>
              n.role === 'paper' && map.has(n.id)
                ? { ...n, citations: map.get(n.id) ?? n.citations }
                : n,
            ),
          ),
        }));
      } catch {
        // ignore remote fetch failures, keep local fallback citations
      }
    };
    loadCitations();
    return () => {
      cancelled = true;
    };
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
