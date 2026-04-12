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
  const [resetTick, setResetTick] = useState(0);
  const [cardPos, setCardPos] = useState({ x: 16, y: 16 });
  const draggingRef = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  }>({ dragging: false, startX: 0, startY: 0, baseX: 16, baseY: 16 });

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
          <button
            type="button"
            className="reset-btn"
            onClick={() => {
              setFocusId('hub-medical');
              setSelectedNode(null);
              setResetTick((t) => t + 1);
            }}
          >
            RESET
          </button>
          <PaperForceGraph
            graphData={graph}
            focusId={focusId}
            onFocus={setFocusId}
            onSelectNode={(node, pos) => {
              setSelectedNode(node);
              if (!node || !pos) return;
              const cardW = 220;
              const gap = 10;
              const x = Math.max(6, Math.min(pos.x + gap, size.w - cardW - 6));
              const y = Math.max(6, Math.min(pos.y - 20, size.h - 130));
              setCardPos({ x, y });
            }}
            onOpenNode={(node) => {
              if (node.role !== 'paper') return;
              if (!node.url) return;
              window.open(node.url, '_blank', 'noopener,noreferrer');
            }}
            resetTick={resetTick}
            width={size.w}
            height={size.h}
          />
          {selectedNode?.role === 'paper' && (
            <aside className="paper-card" style={{ left: `${cardPos.x}px`, top: `${cardPos.y}px` }}>
              <div
                className="paper-card__drag"
                onMouseDown={(e) => {
                  draggingRef.current = {
                    dragging: true,
                    startX: e.clientX,
                    startY: e.clientY,
                    baseX: cardPos.x,
                    baseY: cardPos.y,
                  };
                  const move = (ev: MouseEvent) => {
                    if (!draggingRef.current.dragging) return;
                    const nx = draggingRef.current.baseX + (ev.clientX - draggingRef.current.startX);
                    const ny = draggingRef.current.baseY + (ev.clientY - draggingRef.current.startY);
                    setCardPos({
                      x: Math.max(6, Math.min(nx, size.w - 245)),
                      y: Math.max(6, Math.min(ny, size.h - 130)),
                    });
                  };
                  const up = () => {
                    draggingRef.current.dragging = false;
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                  };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              >
                {isZh ? '论文详情' : 'Paper Details'}
              </div>
              <div className="paper-card__title">{selectedNode.title}</div>
              <div className="paper-card__meta">
                {selectedNode.venue}, {selectedNode.year}
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
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
