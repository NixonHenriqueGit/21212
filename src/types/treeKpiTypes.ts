export interface CustomTreeNodeRecord {
  id: string;
  dataISO?: string;
  motivo?: string;
  responsavel?: string;
  quantidade: number;
  valorTotal: number;
}

export interface CustomTreeNode {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
  volume?: number;
  meta?: string | number;
  real?: string | number;
  percentage?: number;
  badge?: string;
  isCritical?: boolean;
  iconName?: string;
  color?: string;
  metaInfo?: string;
  unitPrice?: number;
  records?: CustomTreeNodeRecord[];
  skuCode?: string;
  position?: { x: number; y: number };
}

export interface CustomKpiTree {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  badgeText: string;
  unitName: string;
  currencySymbol: string;
  totalValue: number;
  totalVolume: number;
  totalRegistros: number;
  ticketMedio: number;
  summaryTag: string;
  criticalHighlight?: string;
  layoutMode?: 'columns' | 'free';
  positions?: Record<string, { x: number; y: number }>;
  levels: {
    level1Title: string;
    level1Badge: string;
    level2Title: string;
    level2Badge: string;
    level3Title: string;
    level3Badge: string;
    level4Title: string;
    level4Badge: string;
    level5Title: string;
    level5Badge: string;
    level6Title?: string;
    level6Badge?: string;
    level7Title?: string;
    level7Badge?: string;
  };
  nodes: {
    level1: CustomTreeNode;
    level2: CustomTreeNode[]; // e.g. Months / Pillars
    level3: Record<string, CustomTreeNode[]>; // parentId (level2.id) -> Level 3 nodes
    level4: Record<string, CustomTreeNode[]>; // parentId (level3.id) -> Level 4 nodes
    level5: Record<string, CustomTreeNode[]>; // parentId (level4.id) -> Level 5 nodes
    level6?: Record<string, CustomTreeNode[]>; // parentId (level5.id) -> Level 6 nodes
    level7?: Record<string, CustomTreeNode[]>; // parentId (level6.id) -> Level 7 nodes
  };
}
