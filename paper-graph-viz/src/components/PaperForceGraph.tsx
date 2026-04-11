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
  width: number;
  height: number;
};

export function PaperForceGraph({
  graphData,
  focusId,
  onFocus,
  width,
  height,
}: Props) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<PaperNode>, LinkObject<NodeObject<PaperNode>, PaperLink>> | undefined
  >(undefined);

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
      onFocus(nid);
      centerOn(node);
    },
    [onFocus, centerOn],
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
      nodeRelSize={1}
      nodeVal={(n: PaperNode) => nodeRadius(n)}
      nodeColor={(n: PaperNode) => nodeColorFor(n, focusId, hi)}
      nodeCanvasObject={(node, ctx, globalScale) => {
        const n = node as PaperNode;
        const label = n.title;
        const fontSize = Math.max(6, 12 / globalScale);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#1e293b';
        ctx.fillText(label, node.x ?? 0, (node.y ?? 0) - nodeRadius(n) - 6);
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
      onBackgroundClick={() => {
        onFocus(null);
      }}
      enableNodeDrag
      enableZoomInteraction
      enablePanInteraction
    />
  );
}
