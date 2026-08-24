import { useCallback, useEffect, useMemo, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';
import type { PaperLink, PaperNode } from '../types';
import {
  computeHighlight,
  linkColorFor,
  linkKey,
  nodeColorFor,
  nodeRadius,
} from '../lib/graphUtils';

type Props = {
  graphData: { nodes: PaperNode[]; links: PaperLink[] };
  focusId: string | null;
  onFocus: (id: string | null) => void;
  onSelectNode: (node: PaperNode | null, pos?: { x: number; y: number }) => void;
  onOpenNode: (node: PaperNode) => void;
  resetTick: number;
  zoomRequest: { direction: 'in' | 'out'; sequence: number };
  width: number;
  height: number;
};

export function PaperForceGraph({
  graphData,
  focusId,
  onFocus,
  onSelectNode,
  onOpenNode,
  resetTick,
  zoomRequest,
  width,
  height,
}: Props) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<PaperNode>, LinkObject<NodeObject<PaperNode>, PaperLink>> | undefined
  >(undefined);
  const clickTimerRef = useRef<number | null>(null);
  const lastClickRef = useRef<{ id: string; t: number }>({ id: '', t: 0 });
  const labelBoxesRef = useRef<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const interactionRef = useRef<HTMLDivElement>(null);

  const hi = useMemo(
    () => computeHighlight(focusId, graphData.links),
    [focusId, graphData.links],
  );

  const focusNode = useCallback(
    (node: PaperNode) => {
      const fg = fgRef.current;
      if (!fg || node.x === undefined || node.y === undefined) return;
      const duration = 460;
      fg.centerAt(node.x, node.y, duration);
      fg.zoom(node.role === 'paper' ? 1.75 : width <= 680 ? 1.65 : 2.15, duration);
    },
    [width],
  );

  useEffect(() => {
    const surface = interactionRef.current;
    if (!surface) return;
    const allowPinchOnly = (event: WheelEvent) => {
      // Trackpad pinch emits ctrl+wheel; plain scroll should reach the parent page.
      if (!event.ctrlKey) event.stopImmediatePropagation();
    };
    surface.addEventListener('wheel', allowPinchOnly, { capture: true, passive: true });
    return () => surface.removeEventListener('wheel', allowPinchOnly, true);
  }, []);

  const clampNodeToViewport = useCallback(
    (node: NodeObject<PaperNode>, mode: 'soft' | 'hard') => {
      const fg = fgRef.current;
      if (!fg) return;
      const pad = 10;
      const topLeft = fg.screen2GraphCoords(pad, pad);
      const bottomRight = fg.screen2GraphCoords(width - pad, height - pad);
      const minX = Math.min(topLeft.x, bottomRight.x);
      const maxX = Math.max(topLeft.x, bottomRight.x);
      const minY = Math.min(topLeft.y, bottomRight.y);
      const maxY = Math.max(topLeft.y, bottomRight.y);
      if (node.x === undefined || node.y === undefined) return;

      const damping = 0.22; // 越小阻力越强
      let bounced = false;

      if (mode === 'soft') {
        if (node.x < minX) node.x = minX - (minX - node.x) * damping;
        if (node.x > maxX) node.x = maxX + (node.x - maxX) * damping;
        if (node.y < minY) node.y = minY - (minY - node.y) * damping;
        if (node.y > maxY) node.y = maxY + (node.y - maxY) * damping;
        node.fx = node.x;
        node.fy = node.y;
        return;
      }

      if (node.x < minX) {
        node.x = minX;
        node.vx = Math.abs(node.vx ?? 0) * 0.7 + 0.4;
        bounced = true;
      } else if (node.x > maxX) {
        node.x = maxX;
        node.vx = -Math.abs(node.vx ?? 0) * 0.7 - 0.4;
        bounced = true;
      }

      if (node.y < minY) {
        node.y = minY;
        node.vy = Math.abs(node.vy ?? 0) * 0.7 + 0.4;
        bounced = true;
      } else if (node.y > maxY) {
        node.y = maxY;
        node.vy = -Math.abs(node.vy ?? 0) * 0.7 - 0.4;
        bounced = true;
      }

      node.fx = node.x;
      node.fy = node.y;
      if (bounced) {
        fg.d3ReheatSimulation();
      }
    },
    [width, height],
  );

  const handleNodeClick = useCallback(
    (node: NodeObject<PaperNode>) => {
      const nid = String(node.id ?? '');
      const now = Date.now();
      if (lastClickRef.current.id === nid && now - lastClickRef.current.t < 280) {
        if (clickTimerRef.current) {
          window.clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        onOpenNode(node as PaperNode);
        lastClickRef.current = { id: '', t: 0 };
        return;
      }
      lastClickRef.current = { id: nid, t: now };
      if (clickTimerRef.current) window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = window.setTimeout(() => {
        onFocus(nid);
        // A repeated click on the active node should still restore its focused view.
        if (nid === focusId) focusNode(node as PaperNode);
        const fg = fgRef.current;
        if (fg && node.x !== undefined && node.y !== undefined) {
          const p = fg.graph2ScreenCoords(node.x, node.y);
          onSelectNode(node as PaperNode, { x: p.x, y: p.y });
        } else {
          onSelectNode(node as PaperNode);
        }
      }, 220);
    },
    [focusId, focusNode, onFocus, onSelectNode, onOpenNode],
  );

  // RESET: restore overview view without forcing node zoom on single click.
  useEffect(() => {
    if (!resetTick) return;
    const fg = fgRef.current;
    if (!fg) return;
    window.setTimeout(() => {
      fg.zoomToFit(420, 34);
    }, 20);
  }, [resetTick]);

  useEffect(() => {
    if (!focusId) return;
    const fg = fgRef.current;
    const node = graphData.nodes.find((candidate) => candidate.id === focusId);
    if (!fg || node?.x === undefined || node.y === undefined) return;
    const timer = window.setTimeout(() => focusNode(node), 80);
    return () => window.clearTimeout(timer);
  }, [focusId, focusNode, graphData.nodes]);

  useEffect(() => {
    if (!zoomRequest.sequence) return;
    const fg = fgRef.current;
    if (!fg) return;
    const multiplier = zoomRequest.direction === 'in' ? 1.24 : 0.8;
    const nextZoom = Math.min(3.1, Math.max(0.72, fg.zoom() * multiplier));
    fg.zoom(nextZoom, 220);
  }, [zoomRequest]);

  useEffect(() => {
    if (focusId) return;
    const fitGraph = () => fgRef.current?.zoomToFit(360, width <= 680 ? 16 : 22);
    const firstFit = window.setTimeout(fitGraph, 240);
    const settledFit = window.setTimeout(fitGraph, 1050);
    return () => {
      window.clearTimeout(firstFit);
      window.clearTimeout(settledFit);
    };
  }, [focusId, width, height]);

  return (
    <div className="force-graph" ref={interactionRef}>
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      backgroundColor="#ffffff"
      width={width}
      height={height}
      nodeId="id"
      linkSource="source"
      linkTarget="target"
      cooldownTicks={160}
      warmupTicks={90}
      d3VelocityDecay={0.35}
      minZoom={0.72}
      maxZoom={3.1}
      nodeLabel={() => ''}
      nodeCanvasObjectMode={() => 'after'}
      onRenderFramePre={() => {
        labelBoxesRef.current = [];
      }}
      nodeRelSize={1}
      nodeVal={(n: PaperNode) => nodeRadius(n)}
      nodeColor={(n: PaperNode) => nodeColorFor(n, focusId, hi)}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const n = node as PaperNode;
        const label = n.shortLabel ?? n.title;
        const radius = nodeRadius(n);
        const maxWidth = radius * 1.55;
        const words = label.split(/\s+/).filter(Boolean);
        const lines: string[] = [];
        let line = '';
        for (const w of words) {
          const next = line ? `${line} ${w}` : w;
          const testSize = Math.max(3.6, 5.8 / globalScale);
          ctx.font = `600 ${testSize}px sans-serif`;
          if (ctx.measureText(next).width <= maxWidth || !line) {
            line = next;
          } else {
            lines.push(line);
            line = w;
          }
        }
        if (line) lines.push(line);
        const limited = lines.slice(0, 2);
        let fontSize = Math.max(4.2, 6.4 / globalScale);
        if (n.id === 'hub-medical') {
          fontSize += 3.8 / globalScale;
          // Medical AI 使用单行，避免被换行稀释视觉大小
          limited.length = 0;
          limited.push(label);
        }
        const lineHeight = fontSize * 1.03;
        const startY = (node.y ?? 0) - ((limited.length - 1) * lineHeight) / 2;
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#172033';
        if (n.id === focusId) {
          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, radius + 3 / globalScale, 0, Math.PI * 2);
          ctx.strokeStyle = '#b7791f';
          ctx.lineWidth = Math.max(1.2 / globalScale, 0.7);
          ctx.stroke();
        }
        const maxLineWidth = Math.max(
          ...limited.map((ln) => ctx.measureText(ln).width),
          0,
        );
        const x = node.x ?? 0;
        const pad = 2;
        const box = {
          x1: x - maxLineWidth / 2 - pad,
          y1: startY - lineHeight / 2 - pad,
          x2: x + maxLineWidth / 2 + pad,
          y2: startY + (limited.length - 1) * lineHeight + lineHeight / 2 + pad,
        };
        const overlap = labelBoxesRef.current.some(
          (b) => !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2),
        );
        if (overlap && n.role !== 'hub') return;
        labelBoxesRef.current.push(box);
        limited.forEach((ln, idx) => {
          ctx.fillText(ln, x, startY + idx * lineHeight);
        });
      }}
      linkColor={(l: PaperLink) => linkColorFor(l, focusId, hi)}
      linkWidth={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 2.8 : 1.05;
      }}
      linkDirectionalArrowLength={3.6}
      linkDirectionalArrowRelPos={1}
      linkDirectionalParticles={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 4 : 0;
      }}
      linkDirectionalParticleWidth={2.2}
      linkDirectionalParticleSpeed={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 0.02 : 0.006;
      }}
      onNodeClick={handleNodeClick}
      onNodeDrag={(node) => {
        clampNodeToViewport(node as NodeObject<PaperNode>, 'soft');
      }}
      onNodeDragEnd={(node) => {
        clampNodeToViewport(node as NodeObject<PaperNode>, 'hard');
      }}
      onBackgroundClick={() => {
        if (clickTimerRef.current) {
          window.clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        onFocus(null);
        onSelectNode(null);
      }}
      enableNodeDrag
      enableZoomInteraction
      enablePanInteraction
    />
    </div>
  );
}
