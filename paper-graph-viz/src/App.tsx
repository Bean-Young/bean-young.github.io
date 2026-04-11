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

function oneLineSummary(node: PaperNode, isZh: boolean): string {
  if (isZh) return `该工作聚焦于 ${node.field}，并与 Medical AI 主线形成关联。`;
  return `This work focuses on ${node.field} and connects to the Medical AI storyline.`;
}

export default function App() {
  const isZh =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('lang') === 'zh';

  const initialGraph = useMemo(
    () => ({
      nodes: withAggregatedCitations(payload.nodes.map((n) => ({ ...n }))).sort(
        (a, b) => b.citations - a.citations,
      ),
      links: payload.links.map((l) => ({ ...l })),
    }),
    [],
  );
  const graph = initialGraph;
  const [focusId, setFocusId] = useState<string | null>('hub-medical');
  const [selectedNode, setSelectedNode] = useState<PaperNode | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  const onResize = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize({ w: Math.max(320, r.width), h: Math.max(180, r.height) });
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
      <div className="app__layout">
        <div className="app__canvas-wrap" ref={wrapRef}>
          <PaperForceGraph
            graphData={graph}
            focusId={focusId}
            onFocus={setFocusId}
            onSelectNode={setSelectedNode}
            onOpenNode={(node) => {
              if (!node.url) return;
              window.open(node.url, '_blank', 'noopener,noreferrer');
            }}
            width={size.w}
            height={size.h}
          />
        </div>
        <aside className="paper-card">
          {selectedNode?.role === 'paper' ? (
            <>
              <div className="paper-card__title">{selectedNode.title}</div>
              <div className="paper-card__meta">{selectedNode.venue}</div>
              <div className="paper-card__meta">
                {isZh ? '年份' : 'Year'} {selectedNode.year}
              </div>
              <div className="paper-card__summary">{oneLineSummary(selectedNode, isZh)}</div>
              <a
                className="paper-card__link"
                href={selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {isZh ? '打开页面' : 'Open Page'}
              </a>
            </>
          ) : (
            <div className="paper-card__empty">
              {isZh ? '单击论文节点查看详情' : 'Click a paper node to view details'}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
