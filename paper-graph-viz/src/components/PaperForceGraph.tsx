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
  /** 搜索「Go」等外部操作触发重新居中 */
  recenterTick: number;
  /** 双击：由父级决定是否合并扩展子图 */
  onNodeDouble: (node: PaperNode) => void;
};

export function PaperForceGraph({
  graphData,
  focusId,
  onFocus,
  width,
  height,
  recenterTick,
  onNodeDouble,
}: Props) {
  const fgRef = useRef<
    ForceGraphMethods<NodeObject<PaperNode>, LinkObject<NodeObject<PaperNode>, PaperLink>> | undefined
  >(undefined);
  const clickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

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
    if (!recenterTick || !focusId) return;
    const id = focusId;
    const t = window.setTimeout(() => {
      fgRef.current?.zoomToFit(500, 120, (n) => String(n.id) === id);
    }, 60);
    return () => clearTimeout(t);
  }, [recenterTick, focusId]);

  const handleNodeClick = useCallback(
    (node: NodeObject<PaperNode>) => {
      const now = Date.now();
      const { id, time } = clickRef.current;
      const nid = String(node.id ?? '');
      if (nid === id && now - time < 340) {
        onNodeDouble(node as PaperNode);
        clickRef.current = { id: '', time: 0 };
        return;
      }
      clickRef.current = { id: nid, time: now };
      onFocus(nid);
      centerOn(node);
    },
    [onFocus, onNodeDouble, centerOn],
  );

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      backgroundColor="#020617"
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
      nodeLabel={(n: PaperNode) => n.title}
      nodeRelSize={1}
      nodeVal={(n: PaperNode) => nodeRadius(n)}
      nodeColor={(n: PaperNode) => nodeColorFor(n, focusId, hi)}
      linkColor={(l: PaperLink) => linkColorFor(l, focusId, hi)}
      linkWidth={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 2.2 : 0.7;
      }}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkDirectionalParticles={(l: PaperLink) => {
        const k = linkKey(l);
        return focusId && hi.highlightLinkKeys.has(k) ? 2 : 0;
      }}
      linkDirectionalParticleWidth={1.2}
      linkDirectionalParticleSpeed={() => 0.008}
      onNodeClick={handleNodeClick}
      onBackgroundClick={() => {
        clickRef.current = { id: '', time: 0 };
        onFocus(null);
      }}
      enableNodeDrag
      enableZoomInteraction
      enablePanInteraction
    />
  );
}
