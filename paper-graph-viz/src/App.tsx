import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PaperForceGraph } from './components/PaperForceGraph';
import rawPayload from './data/papers.json';
import type { PaperGraphPayload } from './types';

const payload = rawPayload as PaperGraphPayload;

export default function App() {
  const graph = useMemo(
    () => ({ nodes: [...payload.nodes], links: [...payload.links] }),
    [],
  );
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
