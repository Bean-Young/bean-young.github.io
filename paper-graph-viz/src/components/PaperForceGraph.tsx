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
  width,
  height,
}: Props) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<PaperNode>, LinkObject<NodeObject<PaperNode>, PaperLink>> | undefined
  >(undefined);
  const clickTimerRef = useRef<number | null>(null);
  const lastClickRef = useRef<{ id: string; t: number }>({ id: '', t: 0 });
  const labelBoxesRef = useRef<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);

  const hi = useMemo(
    () => computeHighlight(focusId, graphData.links),
    [focusId, graphData.links],
  );

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
        const fg = fgRef.current;
        if (fg && node.x !== undefined && node.y !== undefined) {
          const p = fg.graph2ScreenCoords(node.x, node.y);
          onSelectNode(node as PaperNode, { x: p.x, y: p.y });
        } else {
          onSelectNode(node as PaperNode);
        }
      }, 220);
    },
    [onFocus, onSelectNode, onOpenNode],
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

  return (
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
        let fontSize = Math.max(3.6, 5.8 / globalScale);
        if (n.id === 'hub-medical') {
          fontSize += 4.6 / globalScale;
          // Medical AI 使用单行，避免被换行稀释视觉大小
          limited.length = 0;
          limited.push(label);
        }
        const lineHeight = fontSize * 1.03;
        const startY = (node.y ?? 0) - ((limited.length - 1) * lineHeight) / 2;
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
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
  );
}
