import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaperForceGraph } from './components/PaperForceGraph';
import rawPayload from './data/papers.json';
import type { PaperGraphPayload, PaperNode } from './types';

const payload = rawPayload as PaperGraphPayload;
type ZoomDirection = 'in' | 'out';

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
  if (isZh && node.summaryZh) return node.summaryZh;
  if (node.summary) return node.summary;
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
  const [focusId, setFocusId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PaperNode | null>(null);
  const [resetTick, setResetTick] = useState(0);
  const [zoomRequest, setZoomRequest] = useState<{ direction: ZoomDirection; sequence: number }>({
    direction: 'in',
    sequence: 0,
  });

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

  const paperNodes = useMemo(
    () => graph.nodes.filter((node) => node.role === 'paper'),
    [graph.nodes],
  );

  const directions = useMemo(
    () => [
      { id: 'cat-3d', label: isZh ? '三维重建' : '3D Reconstruction', tone: 'cyan' },
      { id: 'cat-diag', label: isZh ? '智能诊断' : 'Intelligent Diagnosis', tone: 'green' },
      { id: 'cat-trust', label: isZh ? '可信智能' : 'Trustworthy AI', tone: 'violet' },
    ],
    [isZh],
  );

  const resetView = useCallback(() => {
    setFocusId(null);
    setSelectedNode(null);
    setResetTick((tick) => tick + 1);
  }, []);

  const requestZoom = useCallback((direction: ZoomDirection) => {
    setZoomRequest((previous) => ({ direction, sequence: previous.sequence + 1 }));
  }, []);

  const focusNode = useCallback(
    (id: string) => {
      if (!id) {
        resetView();
        return;
      }
      const node = graph.nodes.find((candidate) => candidate.id === id) ?? null;
      setFocusId(id);
      setSelectedNode(node?.role === 'paper' ? node : null);
    },
    [graph.nodes, resetView],
  );

  return (
    <div className="app">
      <div className="app__layout">
        <header className="map-toolbar">
          <div className="map-toolbar__directions" role="group" aria-label={isZh ? '研究方向' : 'Research directions'}>
            <button
              type="button"
              className={`direction-btn ${focusId === null ? 'is-active' : ''}`}
              aria-pressed={focusId === null}
              onClick={resetView}
            >
              {isZh ? '总览' : 'Overview'}
            </button>
            {directions.map((direction) => (
              <button
                key={direction.id}
                type="button"
                className={`direction-btn direction-btn--${direction.tone} ${focusId === direction.id ? 'is-active' : ''}`}
                aria-pressed={focusId === direction.id}
                onClick={() => focusNode(direction.id)}
              >
                <span className="direction-btn__dot" aria-hidden="true" />
                {direction.label}
              </button>
            ))}
          </div>
          <label className="paper-picker">
            <span className="sr-only">{isZh ? '选择论文或项目' : 'Select a paper or project'}</span>
            <select
              value={selectedNode?.id ?? ''}
              onChange={(event) => focusNode(event.target.value)}
              aria-label={isZh ? '选择论文或项目' : 'Select a paper or project'}
            >
              <option value="">{isZh ? '浏览成果' : 'Browse works'}</option>
              {paperNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.shortLabel ?? node.title}
                </option>
              ))}
            </select>
          </label>
        </header>
        <div className="app__canvas-wrap" ref={wrapRef}>
          <div className="map-zoom-controls" role="group" aria-label={isZh ? '关系图缩放控制' : 'Research map zoom controls'}>
            <button
              type="button"
              className="graph-control-btn"
              onClick={() => requestZoom('in')}
              aria-label={isZh ? '放大关系图' : 'Zoom in'}
              title={isZh ? '放大' : 'Zoom in'}
            >
              <span aria-hidden="true">+</span>
            </button>
            <button
              type="button"
              className="graph-control-btn"
              onClick={() => requestZoom('out')}
              aria-label={isZh ? '缩小关系图' : 'Zoom out'}
              title={isZh ? '缩小' : 'Zoom out'}
            >
              <span aria-hidden="true">&#8722;</span>
            </button>
            <button
              type="button"
              className="graph-control-btn"
              onClick={resetView}
              aria-label={isZh ? '恢复总览' : 'Reset research map'}
              title={isZh ? '恢复总览' : 'Reset overview'}
            >
              <span aria-hidden="true">&#8634;</span>
            </button>
          </div>
          <PaperForceGraph
            graphData={graph}
            focusId={focusId}
            onFocus={setFocusId}
            onSelectNode={(node) => {
              setSelectedNode(node);
            }}
            onOpenNode={(node) => {
              if (node.role !== 'paper') return;
              window.open(node.projectUrl ?? node.url, '_blank', 'noopener,noreferrer');
            }}
            resetTick={resetTick}
            zoomRequest={zoomRequest}
            width={size.w}
            height={size.h}
          />
          {selectedNode?.role === 'paper' && (
            <aside className="paper-card" aria-live="polite">
              <div className="paper-card__header">
                <span>{isZh ? '成果详情' : 'Work detail'}</span>
                <button
                  type="button"
                  className="paper-card__close"
                  aria-label={isZh ? '关闭详情' : 'Close detail'}
                  onClick={() => {
                    setSelectedNode(null);
                    setFocusId(null);
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="paper-card__title">
                {isZh && selectedNode.titleZh ? selectedNode.titleZh : selectedNode.title}
              </div>
              <div className="paper-card__badges">
                <span className="paper-badge paper-badge--venue">{selectedNode.venue}</span>
                <span className="paper-badge paper-badge--year">{selectedNode.year}</span>
              </div>
              <div className="paper-card__summary">{oneLineSummary(selectedNode, isZh)}</div>
              <a
                className="paper-card__link"
                href={selectedNode.projectUrl ?? selectedNode.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {isZh
                  ? selectedNode.projectUrl ? '查看项目页面' : '查看成果'
                  : selectedNode.projectUrl ? 'View project page' : 'View work'}
              </a>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
