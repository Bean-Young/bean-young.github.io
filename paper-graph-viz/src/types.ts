export type LinkKind = 'cites' | 'extends' | 'similar';

/** hub=医学 AI 中心；pillar=三大方向；paper=你的论文/项目 */
export type PaperRole = 'hub' | 'pillar' | 'paper';

export interface PaperNode {
  id: string;
  title: string;
  shortLabel?: string;
  summary?: string;
  year: number;
  venue: string;
  url: string;
  citations: number;
  field: string;
  scholarTitle?: string;
  role?: PaperRole;
  /** 支柱 id：cat-3d | cat-diag | cat-trust */
  pillarId?: string;
  /** 力导向仿真写入 */
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface PaperLink {
  source: string;
  target: string;
  type: LinkKind;
}

export interface PaperGraphPayload {
  nodes: PaperNode[];
  links: PaperLink[];
  /** Double-click: merge these subgraphs keyed by node id */
  expansions?: Record<string, { nodes: PaperNode[]; links: PaperLink[] }>;
}
