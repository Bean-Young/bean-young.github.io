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
  onSelectNode: (node: PaperNode | null) => void;
  onOpenNode: (node: PaperNode) => void;
  width: number;
  height: number;
};

export function PaperForceGraph({
  graphData,
  focusId,
  onFocus,
  onSelectNode,
  onOpenNode,
  width,
  height,
}: Props) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<PaperNode>, LinkObject<NodeObject<PaperNode>, PaperLink>> | undefined
  >(undefined);
  const clickTimerRef = useRef<number | null>(null);
  const lastClickRef = useRef<{ id: string; t: number }>({ id: '', t: 0 });

  const hi = useMemo(
    () => computeHighlight(focusId, graphData.links),
    [focusId, graphData.links],
  );

  const centerOn = useCallback((node: NodeObject<PaperNode>) => {
    const id = String(node.id ?? '');
    window.setTimeout(() => {
      const fg = fgRef.current;
      if (!fg) return;
      if (node.x !== undefined && node.y !== undefined) {
        fg.centerAt(node.x, node.y, 500);
        fg.zoom(3.2, 500);
      } else {
        fg.zoomToFit(500, 100, (n) => String(n.id) === id);
      }
    }, 0);
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

  useEffect(() => {
    if (!focusId) return;
    const id = focusId;
    const t = window.setTimeout(() => {
      fgRef.current?.zoomToFit(500, 120, (n) => String(n.id) === id);
    }, 60);
    return () => clearTimeout(t);
  }, [focusId]);

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
        onSelectNode(node as PaperNode);
        centerOn(node);
      }, 220);
    },
    [onFocus, onSelectNode, onOpenNode, centerOn],
  );

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
      minZoom={0.35}
      maxZoom={16}
      nodeLabel={() => ''}
      nodeCanvasObjectMode={() => 'after'}
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
          const testSize = Math.max(4.5, (radius * 0.5) / globalScale);
          ctx.font = `600 ${testSize}px sans-serif`;
          if (ctx.measureText(next).width <= maxWidth || !line) {
            line = next;
          } else {
            lines.push(line);
            line = w;
          }
        }
        if (line) lines.push(line);
        const limited = lines.slice(0, 3);
        const fontSize = Math.max(4.5, (radius * 0.5) / globalScale);
        const lineHeight = fontSize * 1.03;
        const startY = (node.y ?? 0) - ((limited.length - 1) * lineHeight) / 2;
        ctx.font = `600 ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        limited.forEach((ln, idx) => {
          ctx.fillText(ln, node.x ?? 0, startY + idx * lineHeight);
        });
      }}
      linkColor={(l: PaperLink) => linkColorFor(l, focusId, hi)}
      linkWidth={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 1.8 : 0.5;
      }}
      linkDirectionalArrowLength={2.5}
      linkDirectionalArrowRelPos={1}
      linkDirectionalParticles={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 1 : 0;
      }}
      linkDirectionalParticleWidth={0.9}
      linkDirectionalParticleSpeed={() => 0.008}
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
