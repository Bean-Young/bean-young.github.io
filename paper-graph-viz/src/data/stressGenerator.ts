import type { PaperLink, PaperNode } from '../types';

/** 用于验证 Canvas 力导向在千级节点下的可交互性（示意数据） */
export function generateStressGraph(nodeCount: number): { nodes: PaperNode[]; links: PaperLink[] } {
  const nodes: PaperNode[] = [];
  const n = Math.max(10, Math.min(nodeCount, 5000));
  for (let i = 0; i < n; i++) {
    nodes.push({
      id: `synth-${i}`,
      title: `Synthetic benchmark paper #${i}`,
      year: 2014 + (i % 13),
      venue: 'Benchmark',
      url: 'https://example.com',
      citations: (i * 13) % 800,
      field: `topic-${i % 9}`,
    });
  }
  const links: PaperLink[] = [];
  for (let i = 0; i < n - 1; i++) {
    const t = i % 3;
    const type = t === 0 ? 'cites' : t === 1 ? 'extends' : 'similar';
    links.push({ source: `synth-${i}`, target: `synth-${i + 1}`, type });
  }
  const extra = Math.min(2000, n * 2);
  for (let k = 0; k < extra; k++) {
    const a = Math.floor(Math.random() * n);
    let b = Math.floor(Math.random() * n);
    if (a === b) b = (b + 1) % n;
    links.push({ source: `synth-${a}`, target: `synth-${b}`, type: 'similar' });
  }
  return { nodes, links };
}
