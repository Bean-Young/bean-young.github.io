export type LinkKind = 'cites' | 'extends' | 'similar';

/** hub=顶层研究领域；pillar=研究方向；paper=论文/项目 */
export type PaperRole = 'hub' | 'pillar' | 'paper';

export interface PaperNode {
  id: string;
  title: string;
  titleZh?: string;
  shortLabel?: string;
  summary?: string;
  summaryZh?: string;
  year: number;
  venue: string;
  url: string;
  projectUrl?: string;
  citations: number;
  field: string;
  scholarTitle?: string;
  role?: PaperRole;
  /** 所属方向或领域 id：cat-3d | cat-diag | cat-trust | cat-general */
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
