import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GraphToolbar } from './components/GraphToolbar';
import { PaperForceGraph } from './components/PaperForceGraph';
import { PaperInfoPanel } from './components/PaperInfoPanel';
import rawPayload from './data/papers.json';
import { generateStressGraph } from './data/stressGenerator';
import { mergeExpansion } from './lib/graphUtils';
import { useFilteredGraph } from './hooks/useFilteredGraph';
import type { PaperGraphPayload, PaperNode } from './types';

const payload = rawPayload as PaperGraphPayload;

function yearBounds(nodes: PaperNode[]) {
  const ys = nodes.map((n) => n.year);
  return { min: Math.min(...ys), max: Math.max(...ys) };
}

export default function App() {
  const initial = useMemo(
    () => ({ nodes: [...payload.nodes], links: [...payload.links] }),
    [],
  );
  const [graph, setGraph] = useState(initial);
  const [stressMode, setStressMode] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [focusId, setFocusId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const bounds = useMemo(() => yearBounds(graph.nodes), [graph.nodes]);
  const [yearLimit, setYearLimit] = useState(() => Math.max(...payload.nodes.map((n) => n.year)));
  const [recenterTick, setRecenterTick] = useState(0);

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

  const filtered = useFilteredGraph(graph.nodes, graph.links, yearLimit, search);

  useEffect(() => {
    if (focusId && !filtered.nodes.some((n) => n.id === focusId)) {
      setFocusId(null);
    }
  }, [filtered.nodes, focusId]);

  useEffect(() => {
    const b = yearBounds(graph.nodes);
    setYearLimit((y) => Math.min(Math.max(y, b.min), b.max));
  }, [graph.nodes]);

  const selectedPaper = useMemo(
    () => (focusId ? graph.nodes.find((n) => n.id === focusId) ?? null : null),
    [focusId, graph.nodes],
  );

  const onSearchGo = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;
    const hit = filtered.nodes.find((n) => n.title.toLowerCase().includes(q));
    if (hit) {
      setFocusId(hit.id);
      setRecenterTick((t) => t + 1);
    }
  };

  const onNodeDouble = (node: PaperNode) => {
    if (stressMode) return;
    const ex = payload.expansions?.[node.id];
    if (!ex || expanded.has(node.id)) return;
    setExpanded((prev) => new Set(prev).add(node.id));
    setGraph((g) => {
      const m = mergeExpansion(g.nodes, g.links, ex);
      return { nodes: m.nodes, links: m.links };
    });
  };

  const loadStress = () => {
    const { nodes, links } = generateStressGraph(1000);
    setStressMode(true);
    setExpanded(new Set());
    setFocusId(null);
    setGraph({ nodes, links });
  };

  const resetData = () => {
    setStressMode(false);
    setExpanded(new Set());
    setFocusId(null);
    setGraph({ nodes: [...payload.nodes], links: [...payload.links] });
    const b = yearBounds(payload.nodes);
    setYearLimit(b.max);
  };

  return (
    <div className="app">
      <GraphToolbar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={onSearchGo}
        yearMin={bounds.min}
        yearMax={bounds.max}
        yearLimit={yearLimit}
        onYearChange={setYearLimit}
        nodeCount={filtered.nodes.length}
        linkCount={filtered.links.length}
      />
      <div className="app__main">
        <div className="app__canvas-wrap" ref={wrapRef}>
          <PaperForceGraph
            graphData={filtered}
            focusId={focusId}
            onFocus={setFocusId}
            width={size.w}
            height={size.h}
            onNodeDouble={onNodeDouble}
            recenterTick={recenterTick}
          />
        </div>
        <PaperInfoPanel paper={selectedPaper} onClose={() => setFocusId(null)} />
      </div>
      <footer className="app__footer">
        <button type="button" className="app__linkbtn" onClick={loadStress}>
          Load 1000-node stress demo
        </button>
        {stressMode && (
          <button type="button" className="app__linkbtn" onClick={resetData}>
            Reset to publication graph
          </button>
        )}
        <span className="app__hint">Single-click: focus · Double-click: expand related · Drag pan · Scroll zoom</span>
      </footer>
    </div>
  );
}
