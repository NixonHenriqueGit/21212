import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Search, 
  DollarSign, 
  Calendar, 
  Layers, 
  Box, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  ZoomIn, 
  ZoomOut, 
  Droplets, 
  PackageX, 
  Truck, 
  AlertTriangle, 
  CalendarClock, 
  ShieldAlert, 
  Wrench, 
  HelpCircle,
  Award,
  TrendingDown,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  BarChart3,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Settings,
  Zap,
  Clock,
  LayoutGrid,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Move,
  Save,
  Check,
  Loader2,
  Network,
  Building2,
  Users,
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { Usuario, QuebraRow } from '../types';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';
import { CustomKpiTree, CustomTreeNode, CustomTreeNodeRecord } from '../types/treeKpiTypes';
import { DEFAULT_OFFICIAL_KPI_TREE } from '../data/defaultKpiTreeData';
import { firestoreDb } from '../database/firestoreDatabase';
import { ManualNodeEditModal } from './tree-kpi/ManualNodeEditModal';
import { ManualTreeSettingsModal } from './tree-kpi/ManualTreeSettingsModal';
import { TreeHeader } from './tree-kpi/TreeHeader';
import { TreeFooter } from './tree-kpi/TreeFooter';
import { KpiNodeCard } from './tree-kpi/KpiNodeCard';

interface TreeKpiViewerProps {
  user?: Usuario;
  quebras?: QuebraRow[];
  onClose?: () => void;
  isModal?: boolean;
}

// Icon mapper helper
function renderNodeIcon(iconName?: string, fallback = AlertTriangle) {
  switch (iconName) {
    case 'building': case 'bank': case 'pilar': return <Building2 className="w-3.5 h-3.5 text-blue-600" />;
    case 'users': case 'team': case 'people': return <Users className="w-3.5 h-3.5 text-blue-600" />;
    case 'bar-chart': return <BarChart3 className="w-3.5 h-3.5 text-blue-600" />;
    case 'flame': return <Flame className="w-3.5 h-3.5 text-amber-600" />;
    case 'droplet': return <Droplets className="w-3.5 h-3.5 text-sky-600" />;
    case 'shield-alert': return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
    case 'package-x': return <PackageX className="w-3.5 h-3.5 text-rose-600" />;
    case 'truck': return <Truck className="w-3.5 h-3.5 text-blue-600" />;
    case 'clock': case 'calendar-clock': return <CalendarClock className="w-3.5 h-3.5 text-purple-600" />;
    case 'calendar': return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
    case 'box': case 'package': return <Box className="w-3.5 h-3.5 text-sky-600" />;
    case 'zap': return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    case 'award': return <Award className="w-3.5 h-3.5 text-emerald-600" />;
    case 'dollar': return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
    case 'alert-triangle': default: return <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />;
  }
}

export default function TreeKpiViewer({
  user,
  quebras,
  onClose,
  isModal = false
}: TreeKpiViewerProps) {
  // ── APP & DATA PERSISTENCE MODE ──
  const companyId = user?.empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
  const [activeMode, setActiveMode] = useState<'automatic' | 'manual'>('manual');

  // Initialize trees safely from local cache first, without destroying user data
  const [customTrees, setCustomTrees] = useState<CustomKpiTree[]>(() => {
    try {
      const companySaved = localStorage.getItem(`custom_kpi_trees_${companyId}`);
      if (companySaved) {
        const parsed = JSON.parse(companySaved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const savedV3 = localStorage.getItem('custom_kpi_trees_v3');
      if (savedV3) {
        const parsed = JSON.parse(savedV3);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      for (const key of ['custom_kpi_trees_v2', 'custom_kpi_trees_v1', 'custom_kpi_trees']) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [DEFAULT_OFFICIAL_KPI_TREE];
  });

  const [activeTreeId, setActiveTreeId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem(`kpi_active_tree_id_${companyId}`);
      if (savedId && customTrees.some(t => t.id === savedId)) return savedId;
    } catch {}
    return customTrees[0]?.id || DEFAULT_OFFICIAL_KPI_TREE.id;
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string>('');
  const isIncomingRemoteUpdate = useRef<boolean>(false);
  const lastSavedJsonRef = useRef<string>('');

  // Persist active tree ID
  const handleSelectTree = (id: string) => {
    setActiveTreeId(id);
    try {
      localStorage.setItem(`kpi_active_tree_id_${companyId}`, id);
    } catch {}
  };

  // Real-time Firestore Database Subscription
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = firestoreDb.subscribe<CustomKpiTree>('kpi_trees', companyId, (remoteTrees) => {
      if (!isMounted) return;
      if (remoteTrees && remoteTrees.length > 0) {
        // Strip Firestore metadata when comparing to avoid echo loops
        const cleanTrees = remoteTrees.map(t => {
          const { _docId, _atualizadoEm, _criadoEm, _serverTimestamp, empresaId: eId, ...rest } = t as any;
          return rest as CustomKpiTree;
        });
        const remoteJson = JSON.stringify(cleanTrees);
        if (remoteJson !== lastSavedJsonRef.current) {
          isIncomingRemoteUpdate.current = true;
          lastSavedJsonRef.current = remoteJson;
          setCustomTrees(cleanTrees);
          try {
            localStorage.setItem(`custom_kpi_trees_${companyId}`, remoteJson);
            localStorage.setItem('custom_kpi_trees_v3', remoteJson);
          } catch {}
        }
      } else {
        // If Firestore is empty, upload local trees to Firestore once
        try {
          const localSaved = localStorage.getItem(`custom_kpi_trees_${companyId}`) || localStorage.getItem('custom_kpi_trees_v3');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              lastSavedJsonRef.current = JSON.stringify(parsed);
              firestoreDb.batchUpsert('kpi_trees', parsed, companyId).catch(() => {});
              return;
            }
          }
          lastSavedJsonRef.current = JSON.stringify([DEFAULT_OFFICIAL_KPI_TREE]);
          firestoreDb.create('kpi_trees', DEFAULT_OFFICIAL_KPI_TREE, companyId, DEFAULT_OFFICIAL_KPI_TREE.id).catch(() => {});
        } catch (e) {
          console.error('Error seeding Firestore trees:', e);
        }
      }
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [companyId]);

  // Auto-sync custom trees to localStorage & Firestore whenever user edits
  useEffect(() => {
    if (!customTrees || customTrees.length === 0) return;
    const currentJson = JSON.stringify(customTrees);
    try {
      localStorage.setItem(`custom_kpi_trees_${companyId}`, currentJson);
      localStorage.setItem('custom_kpi_trees_v3', currentJson);
    } catch {}

    // If this update was triggered by incoming Firestore data, do not echo back
    if (isIncomingRemoteUpdate.current) {
      isIncomingRemoteUpdate.current = false;
      return;
    }

    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        lastSavedJsonRef.current = currentJson;
        await firestoreDb.batchUpsert('kpi_trees', customTrees, companyId);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } catch (err) {
        console.error('Firestore autosave failed:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [customTrees, companyId]);

  // Manual save trigger for 100% user confirmation
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      const currentJson = JSON.stringify(customTrees);
      localStorage.setItem(`custom_kpi_trees_${companyId}`, currentJson);
      localStorage.setItem('custom_kpi_trees_v3', currentJson);
      localStorage.setItem(`kpi_active_tree_id_${companyId}`, activeTreeId);
      lastSavedJsonRef.current = currentJson;
      await firestoreDb.batchUpsert('kpi_trees', customTrees, companyId);
      setSaveSuccess(true);
      setSaveToast('Árvore de KPI salva com sucesso no Firebase!');
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveToast('');
      }, 3500);
    } catch (err) {
      console.error('Error saving KPI tree:', err);
      setSaveToast('Salvo no cache do navegador!');
      setTimeout(() => setSaveToast(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const activeCustomTree = useMemo(() => {
    return customTrees.find(t => t.id === activeTreeId) || customTrees[0] || DEFAULT_OFFICIAL_KPI_TREE;
  }, [customTrees, activeTreeId]);

  // ── DISPLAY CONTROLS ──
  const [metricMode, setMetricMode] = useState<'valor' | 'quantidade'>('valor');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isModal);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // ── LAYOUT MODE & FREE 2D POSITIONS (PERSISTED IN DATABASE) ──
  const [layoutMode, setLayoutMode] = useState<'columns' | 'free'>(() => {
    return activeCustomTree.layoutMode || 'columns';
  });

  const [cardPositions, setCardPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    return activeCustomTree.positions || {};
  });

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dragStartRef = useRef<{
    cardId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Sync positions & layout mode when active tree changes
  useEffect(() => {
    if (activeCustomTree.positions) {
      setCardPositions(prev => ({ ...activeCustomTree.positions, ...prev }));
    }
    if (activeCustomTree.layoutMode) {
      setLayoutMode(activeCustomTree.layoutMode);
    }
  }, [activeCustomTree.id, activeCustomTree.positions, activeCustomTree.layoutMode]);

  // ── SELECTION STATE FOR 7 LEVELS ──
  const [selectedL2Id, setSelectedL2Id] = useState<string>('');
  const [selectedL3Id, setSelectedL3Id] = useState<string>('');
  const [selectedL4Id, setSelectedL4Id] = useState<string>('');
  const [selectedL5Id, setSelectedL5Id] = useState<string>('');
  const [selectedL6Id, setSelectedL6Id] = useState<string>('');

  // ── MODAL STATES FOR MANUAL BUILDING ──
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [editNodeModal, setEditNodeModal] = useState<{
    isOpen: boolean;
    levelNumber: number;
    levelTitle: string;
    node: CustomTreeNode | null;
    parentId?: string;
    availableParents?: Array<{ id: string; label: string }>;
  }>({
    isOpen: false,
    levelNumber: 2,
    levelTitle: '',
    node: null
  });

  // ── DRAG & DROP STATE FOR MOVING / REORDERING CARDS ──
  const [draggedNode, setDraggedNode] = useState<{
    level: number;
    parentId?: string;
    index: number;
    id: string;
  } | null>(null);

  const [dragOverTarget, setDragOverTarget] = useState<{
    level: number;
    parentId?: string;
    index: number;
  } | null>(null);

  // ── DOM REFS FOR CONNECTOR CALCULATION ──
  const containerRef = useRef<HTMLDivElement>(null);
  const rootCardRef = useRef<HTMLDivElement>(null);
  const l2CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l3CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l4CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l5CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l6CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const l7CardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const top10ContainerRef = useRef<HTMLDivElement | null>(null);

  const [svgPaths, setSvgPaths] = useState<Array<{ 
    id: string; 
    d: string; 
    gradientId: string;
    color: string; 
    strokeWidth?: number;
    opacity?: number;
    isCurrentActive?: boolean;
    startPoint: { x: number; y: number }; 
    endPoint: { x: number; y: number } 
  }>>([]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen && !isModal) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen, isModal]);

  // ── COMPUTE LIVE ACTIVE TREE DATA ──
  const treeData = useMemo<CustomKpiTree>(() => {
    const base = activeCustomTree || DEFAULT_OFFICIAL_KPI_TREE;
    const defaultNodes = DEFAULT_OFFICIAL_KPI_TREE.nodes;

    const mergeBranchMap = <T,>(defaultMap: Record<string, T[]> | undefined, customMap?: Record<string, T[]>) => {
      const res: Record<string, T[]> = { ...(defaultMap || {}) };
      if (customMap) {
        Object.keys(customMap).forEach(key => {
          res[key] = customMap[key];
        });
      }
      return res;
    };

    return {
      ...base,
      nodes: {
        level1: base.nodes?.level1 || defaultNodes.level1,
        level2: base.nodes?.level2 !== undefined && base.nodes.level2.length > 0 ? base.nodes.level2 : defaultNodes.level2,
        level3: mergeBranchMap(defaultNodes.level3, base.nodes?.level3),
        level4: mergeBranchMap(defaultNodes.level4, base.nodes?.level4),
        level5: mergeBranchMap(defaultNodes.level5, base.nodes?.level5),
        level6: mergeBranchMap(defaultNodes.level6, base.nodes?.level6),
        level7: mergeBranchMap(defaultNodes.level7, base.nodes?.level7)
      }
    };
  }, [activeCustomTree]);

  // Active level 2 nodes
  const l2Nodes = useMemo(() => {
    return treeData.nodes.level2 || [];
  }, [treeData]);

  // ── CASCADE SELECT HELPERS (OPENS FULL DECOMPOSITION DOWN TO LEVEL 7 IN ONE GO) ──
  const cascadeSelectL2 = (l2Id: string) => {
    setSelectedL2Id(l2Id);
    setCardPositions({});

    const l3List = treeData.nodes.level3?.[l2Id] || [];
    const nextL3Id = l3List[0]?.id || '';
    setSelectedL3Id(nextL3Id);

    const l4List = nextL3Id ? (treeData.nodes.level4?.[nextL3Id] || []) : [];
    const nextL4Id = l4List[0]?.id || '';
    setSelectedL4Id(nextL4Id);

    const l5List = nextL4Id ? (treeData.nodes.level5?.[nextL4Id] || []) : [];
    const nextL5Id = l5List[0]?.id || '';
    setSelectedL5Id(nextL5Id);

    const l6List = nextL5Id ? (treeData.nodes.level6?.[nextL5Id] || []) : [];
    const nextL6Id = l6List[0]?.id || '';
    setSelectedL6Id(nextL6Id);

    setTimeout(calculateConnectors, 50);
  };

  const cascadeSelectL3 = (l3Id: string) => {
    setSelectedL3Id(l3Id);

    const l4List = treeData.nodes.level4?.[l3Id] || [];
    const nextL4Id = l4List[0]?.id || '';
    setSelectedL4Id(nextL4Id);

    const l5List = nextL4Id ? (treeData.nodes.level5?.[nextL4Id] || []) : [];
    const nextL5Id = l5List[0]?.id || '';
    setSelectedL5Id(nextL5Id);

    const l6List = nextL5Id ? (treeData.nodes.level6?.[nextL5Id] || []) : [];
    const nextL6Id = l6List[0]?.id || '';
    setSelectedL6Id(nextL6Id);

    setTimeout(calculateConnectors, 50);
  };

  const cascadeSelectL4 = (l4Id: string) => {
    setSelectedL4Id(l4Id);

    const l5List = treeData.nodes.level5?.[l4Id] || [];
    const nextL5Id = l5List[0]?.id || '';
    setSelectedL5Id(nextL5Id);

    const l6List = nextL5Id ? (treeData.nodes.level6?.[nextL5Id] || []) : [];
    const nextL6Id = l6List[0]?.id || '';
    setSelectedL6Id(nextL6Id);

    setTimeout(calculateConnectors, 50);
  };

  const cascadeSelectL5 = (l5Id: string) => {
    setSelectedL5Id(l5Id);

    const l6List = treeData.nodes.level6?.[l5Id] || [];
    const nextL6Id = l6List[0]?.id || '';
    setSelectedL6Id(nextL6Id);

    setTimeout(calculateConnectors, 50);
  };

  const cascadeSelectL6 = (l6Id: string) => {
    setSelectedL6Id(l6Id);
    setTimeout(calculateConnectors, 50);
  };

  // Keep Level 2 selection valid and cascade down automatically
  useEffect(() => {
    if (l2Nodes.length > 0) {
      if (!selectedL2Id || !l2Nodes.some(n => n.id === selectedL2Id)) {
        const critical = l2Nodes.find(n => n.isCritical) || l2Nodes[0];
        cascadeSelectL2(critical.id);
      }
    } else {
      setSelectedL2Id('');
      setSelectedL3Id('');
      setSelectedL4Id('');
      setSelectedL5Id('');
      setSelectedL6Id('');
    }
  }, [l2Nodes, selectedL2Id]);

  const activeL2Node = useMemo(() => {
    return l2Nodes.find(n => n.id === selectedL2Id) || l2Nodes[0] || null;
  }, [l2Nodes, selectedL2Id]);

  // Active level 3 nodes
  const l3Nodes = useMemo(() => {
    if (!activeL2Node) return [];
    const mapNodes = treeData.nodes.level3[activeL2Node.id] || [];
    return mapNodes;
  }, [treeData, activeL2Node]);

  // Keep Level 3 selection valid and cascade down
  useEffect(() => {
    if (l3Nodes.length > 0) {
      if (!selectedL3Id || !l3Nodes.some(n => n.id === selectedL3Id)) {
        cascadeSelectL3(l3Nodes[0].id);
      }
    } else {
      setSelectedL3Id('');
      setSelectedL4Id('');
      setSelectedL5Id('');
      setSelectedL6Id('');
    }
  }, [l3Nodes, selectedL3Id]);

  const activeL3Node = useMemo(() => {
    return l3Nodes.find(n => n.id === selectedL3Id) || l3Nodes[0] || null;
  }, [l3Nodes, selectedL3Id]);

  // Active level 4 nodes
  const l4Nodes = useMemo(() => {
    if (!activeL3Node) return [];
    const mapNodes = treeData.nodes.level4[activeL3Node.id] || [];
    return mapNodes;
  }, [treeData, activeL3Node]);

  // Keep Level 4 selection valid and cascade down
  useEffect(() => {
    if (l4Nodes.length > 0) {
      if (!selectedL4Id || !l4Nodes.some(n => n.id === selectedL4Id)) {
        cascadeSelectL4(l4Nodes[0].id);
      }
    } else {
      setSelectedL4Id('');
      setSelectedL5Id('');
      setSelectedL6Id('');
    }
  }, [l4Nodes, selectedL4Id]);

  const activeL4Node = useMemo(() => {
    return l4Nodes.find(n => n.id === selectedL4Id) || l4Nodes[0] || null;
  }, [l4Nodes, selectedL4Id]);

  // Active level 5 nodes
  const l5Nodes = useMemo(() => {
    if (!activeL4Node) return [];
    const mapNodes = treeData.nodes.level5[activeL4Node.id] || [];
    return mapNodes;
  }, [treeData, activeL4Node]);

  // Keep Level 5 selection valid and cascade down
  useEffect(() => {
    if (l5Nodes.length > 0) {
      if (!selectedL5Id || !l5Nodes.some(n => n.id === selectedL5Id)) {
        cascadeSelectL5(l5Nodes[0].id);
      }
    } else {
      setSelectedL5Id('');
      setSelectedL6Id('');
    }
  }, [l5Nodes, selectedL5Id]);

  const activeL5Node = useMemo(() => {
    return l5Nodes.find(n => n.id === selectedL5Id) || l5Nodes[0] || null;
  }, [l5Nodes, selectedL5Id]);

  // Active level 6 nodes
  const l6Nodes = useMemo(() => {
    if (!activeL5Node) return [];
    const mapNodes = (treeData.nodes.level6 && treeData.nodes.level6[activeL5Node.id]) || [];
    return mapNodes;
  }, [treeData, activeL5Node]);

  // Keep Level 6 selection valid
  useEffect(() => {
    if (l6Nodes.length > 0) {
      if (!selectedL6Id || !l6Nodes.some(n => n.id === selectedL6Id)) {
        cascadeSelectL6(l6Nodes[0].id);
      }
    } else {
      setSelectedL6Id('');
    }
  }, [l6Nodes, selectedL6Id]);

  const activeL6Node = useMemo(() => {
    return l6Nodes.find(n => n.id === selectedL6Id) || l6Nodes[0] || null;
  }, [l6Nodes, selectedL6Id]);

  // Active level 7 nodes (Terminal items)
  const l7Nodes = useMemo(() => {
    if (!activeL6Node) return [];
    const mapNodes = (treeData.nodes.level7 && treeData.nodes.level7[activeL6Node.id]) || [];
    if (!searchTerm.trim()) return mapNodes;
    const term = searchTerm.toLowerCase();
    return mapNodes.filter(n => 
      n.label.toLowerCase().includes(term) || 
      (n.skuCode && n.skuCode.includes(term))
    );
  }, [treeData, activeL6Node, searchTerm]);

  // ── ACTIVE PILLAR SUBTREE NODES (FOR PILLAR-SPECIFIC TREE DISPLAY) ──
  const activePillarL3Nodes = useMemo(() => {
    if (!selectedL2Id) return [];
    return treeData.nodes.level3[selectedL2Id] || [];
  }, [treeData, selectedL2Id]);

  const activePillarL4Nodes = useMemo(() => {
    const l3Ids = new Set(activePillarL3Nodes.map(n => n.id));
    return Object.entries(treeData.nodes.level4).flatMap(([l3Id, list]) => 
      l3Ids.has(l3Id) ? (list || []).map((node, idx) => ({ node, parentId: l3Id, index: idx })) : []
    );
  }, [treeData, activePillarL3Nodes]);

  const activePillarL5Nodes = useMemo(() => {
    const l4Ids = new Set(activePillarL4Nodes.map(item => item.node.id));
    return Object.entries(treeData.nodes.level5).flatMap(([l4Id, list]) => 
      l4Ids.has(l4Id) ? (list || []).map((node, idx) => ({ node, parentId: l4Id, index: idx })) : []
    );
  }, [treeData, activePillarL4Nodes]);

  const activePillarL6Nodes = useMemo(() => {
    const l5Ids = new Set(activePillarL5Nodes.map(item => item.node.id));
    return Object.entries(treeData.nodes.level6 || {}).flatMap(([l5Id, list]) => 
      l5Ids.has(l5Id) ? (list || []).map((node, idx) => ({ node, parentId: l5Id, index: idx })) : []
    );
  }, [treeData, activePillarL5Nodes]);

  const activePillarL7Nodes = useMemo(() => {
    const l6Ids = new Set(activePillarL6Nodes.map(item => item.node.id));
    return Object.entries(treeData.nodes.level7 || {}).flatMap(([l6Id, list]) => 
      l6Ids.has(l6Id) ? (list || []).map((node, idx) => ({ node, parentId: l6Id, index: idx })) : []
    );
  }, [treeData, activePillarL6Nodes]);

  // ── AUTOMATIC 7-LEVEL HIERARCHICAL TREE LAYOUT CALCULATOR (SCOPED TO ACTIVE PILLAR) ──
  const computedTreeLayout = useMemo(() => {
    const defaultPositions: Record<string, { x: number; y: number }> = {};
    const colSpacing = 280;
    const startX = 40;

    const l2List = treeData.nodes.level2 || [];
    const l3Map = treeData.nodes.level3 || {};
    const l4Map = treeData.nodes.level4 || {};
    const l5Map = treeData.nodes.level5 || {};
    const l6Map = treeData.nodes.level6 || {};
    const l7Map = treeData.nodes.level7 || {};

    const activeL2 = l2List.find(n => n.id === selectedL2Id) || l2List[0];
    const activeIdx = activeL2 ? l2List.findIndex(n => n.id === activeL2.id) : 0;

    let currentY = 50 + Math.max(0, activeIdx * 65);

    const layoutSubtree = (nodeId: string, level: number): number => {
      let children: { id: string }[] = [];
      if (level === 2) children = l3Map[nodeId] || [];
      else if (level === 3) children = l4Map[nodeId] || [];
      else if (level === 4) children = l5Map[nodeId] || [];
      else if (level === 5) children = l6Map[nodeId] || [];
      else if (level === 6) children = l7Map[nodeId] || [];

      const colX = startX + (level - 1) * colSpacing;

      if (children.length === 0) {
        const y = currentY;
        defaultPositions[nodeId] = { x: colX, y };
        currentY += 115;
        return y;
      }

      const childYs: number[] = [];
      for (const child of children) {
        const cy = layoutSubtree(child.id, level + 1);
        childYs.push(cy);
      }

      const minY = childYs[0];
      const maxY = childYs[childYs.length - 1];
      const parentY = Math.round((minY + maxY) / 2);
      defaultPositions[nodeId] = { x: colX, y: parentY };
      return parentY;
    };

    let activePillarY = 100;
    if (activeL2) {
      activePillarY = layoutSubtree(activeL2.id, 2);
    }

    // Arrange all Pillar cards in Column 2
    const col2X = startX + colSpacing;
    if (activeIdx !== -1 && activeL2) {
      defaultPositions[activeL2.id] = { x: col2X, y: activePillarY };

      let topY = activePillarY - 60;
      for (let i = activeIdx - 1; i >= 0; i--) {
        defaultPositions[l2List[i].id] = { x: col2X, y: Math.max(20, topY) };
        topY -= 60;
      }

      let bottomY = Math.max(activePillarY + 60, currentY);
      for (let i = activeIdx + 1; i < l2List.length; i++) {
        defaultPositions[l2List[i].id] = { x: col2X, y: bottomY };
        bottomY += 60;
      }
      currentY = Math.max(currentY, bottomY);
    } else {
      l2List.forEach((l2, idx) => {
        defaultPositions[l2.id] = { x: col2X, y: 80 + idx * 60 };
      });
    }

    // Root (Level 1)
    const rootId = treeData.nodes.level1.id || 'root';
    defaultPositions[rootId] = { x: startX, y: activePillarY };

    return {
      positions: defaultPositions,
      totalHeight: Math.max(1200, currentY + 120)
    };
  }, [treeData, selectedL2Id]);

  // ── DEFAULT POSITIONS & FREE MOVEMENT HANDLERS ──
  const getDefaultPosition = useCallback((level: number, id: string, index: number, parentId?: string): { x: number; y: number } => {
    if (cardPositions[id]) return cardPositions[id];
    if (computedTreeLayout.positions[id]) return computedTreeLayout.positions[id];
    
    // Clean fallback spacing
    const colSpacing = 280;
    const startX = 40;
    const startY = 80;
    const colX = startX + (level - 1) * colSpacing;

    if (level === 1) {
      return { x: startX, y: startY + 100 };
    }
    
    if (parentId && cardPositions[parentId]) {
      const pPos = cardPositions[parentId];
      const rowY = Math.max(40, pPos.y + index * 135);
      return { x: colX, y: rowY };
    }

    const rowY = startY + index * 135;
    return { x: colX, y: rowY };
  }, [cardPositions, computedTreeLayout]);

  const handleCardPointerDown = (
    e: React.PointerEvent,
    cardId: string,
    level: number,
    index: number,
    parentId?: string
  ) => {
    // If clicked on an interactive button or input inside the card, ignore
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
      return;
    }

    if (layoutMode !== 'free') return;

    e.preventDefault();
    e.stopPropagation();

    const currentPos = cardPositions[cardId] || getDefaultPosition(level, cardId, index, parentId);
    const zoom = zoomLevel / 100;

    const activeCardId = cardId;
    let latestPos = { x: currentPos.x, y: currentPos.y };

    dragStartRef.current = {
      cardId: activeCardId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentPos.x,
      initialY: currentPos.y,
    };
    setDraggingCardId(activeCardId);

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dragInfo = dragStartRef.current;
      if (!dragInfo) return;

      const dx = (moveEvt.clientX - dragInfo.startX) / zoom;
      const dy = (moveEvt.clientY - dragInfo.startY) / zoom;

      const newX = Math.max(10, Math.round(dragInfo.initialX + dx));
      const newY = Math.max(10, Math.round(dragInfo.initialY + dy));
      latestPos = { x: newX, y: newY };

      setCardPositions(prev => ({
        ...prev,
        [activeCardId]: { x: newX, y: newY }
      }));
      
      calculateConnectors();
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (dragStartRef.current) {
        setDraggingCardId(null);
        dragStartRef.current = null;
        
        // Auto-save updated positions into customTrees state & persistent storage
        setCustomTrees(prevTrees => {
          return prevTrees.map(t => {
            if (t.id !== activeTreeId) return t;
            return {
              ...t,
              layoutMode: 'free',
              positions: {
                ...(t.positions || {}),
                [activeCardId]: latestPos
              }
            };
          });
        });

        setSaveToast('Posição do card salva!');
        setTimeout(() => setSaveToast(''), 2000);
        setTimeout(calculateConnectors, 50);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleResetPositions = () => {
    const newPositions = { ...computedTreeLayout.positions };

    setCardPositions(newPositions);
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        return {
          ...t,
          positions: newPositions
        };
      });
    });
    setSaveToast('Árvore completa organizada com sucesso!');
    setTimeout(() => setSaveToast(''), 2500);
    setTimeout(calculateConnectors, 60);
  };

  // ── DYNAMIC SVG BEZIER CURVE CALCULATION ──
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current) return;
    const paths: typeof svgPaths = [];

    if (layoutMode === 'free') {
      // ══════════════════════════════════════════════════════════════
      // EXACT DIRECT 2D MATHEMATICAL ROUTING FOR FREE CANVAS
      // ══════════════════════════════════════════════════════════════
      const computeFreeConnector = (
        id1: string,
        lvl1: number,
        idx1: number,
        pId1: string | undefined,
        id2: string,
        lvl2: number,
        idx2: number,
        pId2: string | undefined,
        gradientId: string,
        color: string,
        isSelected: boolean,
        isCrit: boolean = false
      ) => {
        const p1 = cardPositions[id1] || getDefaultPosition(lvl1, id1, idx1, pId1);
        const p2 = cardPositions[id2] || getDefaultPosition(lvl2, id2, idx2, pId2);

        const cardW = 205;
        const cardH1 = (lvl1 === 1 || lvl1 === 2) ? 44 : 85;
        const cardH2 = (lvl2 === 1 || lvl2 === 2) ? 44 : 85;

        let x1: number, y1: number, x2: number, y2: number;

        if (p2.x >= p1.x + 140) {
          // Normal left-to-right flow
          x1 = p1.x + cardW;
          y1 = p1.y + cardH1 / 2;
          x2 = p2.x;
          y2 = p2.y + cardH2 / 2;
        } else if (p2.x + cardW <= p1.x + 70) {
          // Reversed right-to-left flow
          x1 = p1.x;
          y1 = p1.y + cardH1 / 2;
          x2 = p2.x + cardW;
          y2 = p2.y + cardH2 / 2;
        } else {
          // Vertically stacked
          if (p2.y >= p1.y) {
            x1 = p1.x + cardW / 2;
            y1 = p1.y + cardH1;
            x2 = p2.x + cardW / 2;
            y2 = p2.y;
            const dy = Math.max(20, Math.abs(y2 - y1) * 0.5);
            return {
              id: `path-free-${id1}-${id2}`,
              d: `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`,
              gradientId,
              color,
              strokeWidth: isSelected ? 3.4 : 2.0,
              opacity: isSelected ? 1 : 0.65,
              isCurrentActive: isSelected,
              startPoint: { x: x1, y: y1 },
              endPoint: { x: x2, y: y2 }
            };
          } else {
            x1 = p1.x + cardW / 2;
            y1 = p1.y;
            x2 = p2.x + cardW / 2;
            y2 = p2.y + cardH2;
            const dy = Math.max(20, Math.abs(y1 - y2) * 0.5);
            return {
              id: `path-free-${id1}-${id2}`,
              d: `M ${x1} ${y1} C ${x1} ${y1 - dy}, ${x2} ${y2 + dy}, ${x2} ${y2}`,
              gradientId,
              color,
              strokeWidth: isSelected ? 3.4 : 2.0,
              opacity: isSelected ? 1 : 0.65,
              isCurrentActive: isSelected,
              startPoint: { x: x1, y: y1 },
              endPoint: { x: x2, y: y2 }
            };
          }
        }

        const dx = Math.max(30, Math.abs(x2 - x1) * 0.5);
        const sign = x2 >= x1 ? 1 : -1;
        const d = `M ${x1} ${y1} C ${x1 + dx * sign} ${y1}, ${x2 - dx * sign} ${y2}, ${x2} ${y2}`;

        return {
          id: `path-free-${id1}-${id2}`,
          d,
          gradientId,
          color,
          strokeWidth: isSelected ? 3.4 : 2.0,
          opacity: isSelected ? 1 : 0.65,
          isCurrentActive: isSelected,
          startPoint: { x: x1, y: y1 },
          endPoint: { x: x2, y: y2 }
        };
      };

      const rootId = treeData.nodes.level1.id || 'root';

      // 1. Root -> all L2 Nodes
      l2Nodes.forEach((m, mIdx) => {
        const isSelected = m.id === selectedL2Id;
        const isCrit = m.isCritical;
        paths.push(computeFreeConnector(
          rootId, 1, 0, undefined,
          m.id, 2, mIdx, undefined,
          isCrit ? 'grad-root-rose' : 'grad-root-blue',
          isCrit ? '#f43f5e' : (isSelected ? '#2563eb' : '#94a3b8'),
          isSelected,
          isCrit
        ));
      });

      // 2. Active L2 Pillar -> its L3 Nodes
      if (selectedL2Id) {
        const l2Idx = l2Nodes.findIndex(n => n.id === selectedL2Id);
        activePillarL3Nodes.forEach((mot, motIdx) => {
          const isSelected = mot.id === selectedL3Id;
          paths.push(computeFreeConnector(
            selectedL2Id, 2, l2Idx >= 0 ? l2Idx : 0, undefined,
            mot.id, 3, motIdx, selectedL2Id,
            'grad-month-amber',
            isSelected ? '#f59e0b' : '#fbbf24',
            isSelected
          ));
        });
      }

      // 3. Active L3 Nodes -> their L4 Nodes
      activePillarL4Nodes.forEach(({ node: pkg, parentId: l3Id, index: pkgIdx }) => {
        const isSelected = pkg.id === selectedL4Id && l3Id === selectedL3Id;
        paths.push(computeFreeConnector(
          l3Id, 3, 0, undefined,
          pkg.id, 4, pkgIdx, l3Id,
          'grad-motivo-sky',
          isSelected ? '#0ea5e9' : '#38bdf8',
          isSelected
        ));
      });

      // 4. Active L4 Nodes -> their L5 Nodes
      activePillarL5Nodes.forEach(({ node: det, parentId: l4Id, index: detIdx }) => {
        const isSelected = det.id === selectedL5Id && l4Id === selectedL4Id;
        paths.push(computeFreeConnector(
          l4Id, 4, 0, undefined,
          det.id, 5, detIdx, l4Id,
          'grad-pkg-emerald',
          isSelected ? '#10b981' : '#34d399',
          isSelected
        ));
      });

      // 5. Active L5 Nodes -> their L6 Nodes
      activePillarL6Nodes.forEach(({ node: op, parentId: l5Id, index: opIdx }) => {
        const isSelected = op.id === selectedL6Id && l5Id === selectedL5Id;
        paths.push(computeFreeConnector(
          l5Id, 5, 0, undefined,
          op.id, 6, opIdx, l5Id,
          'grad-l6-purple',
          isSelected ? '#9333ea' : '#c084fc',
          isSelected
        ));
      });

      // 6. Active L6 Nodes -> their L7 Nodes
      activePillarL7Nodes.forEach(({ node: sku, parentId: l6Id, index: skuIdx }) => {
        const isSelected = l6Id === selectedL6Id;
        paths.push(computeFreeConnector(
          l6Id, 6, 0, undefined,
          sku.id, 7, skuIdx, l6Id,
          'grad-l7-rose',
          isSelected ? '#e11d48' : '#fb7185',
          isSelected
        ));
      });

      setSvgPaths(paths);
      return;
    }

    // ══════════════════════════════════════════════════════════════
    // RELATIVE MEASUREMENT ROUTING FOR STRUCTURED COLUMNS MODE
    // ══════════════════════════════════════════════════════════════
    const cRect = containerRef.current.getBoundingClientRect();
    const zoom = zoomLevel / 100;
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollTop = containerRef.current.scrollTop;

    const computeConnector = (
      el1: HTMLElement,
      el2: HTMLElement,
      gradientId: string,
      color: string,
      isSelected: boolean,
      isCrit: boolean = false
    ) => {
      const box1 = el1.getBoundingClientRect();
      const box2 = el2.getBoundingClientRect();

      const x1 = (box1.right - cRect.left + scrollLeft) / zoom;
      const y1 = (box1.top + box1.height / 2 - cRect.top + scrollTop) / zoom;
      const x2 = (box2.left - cRect.left + scrollLeft) / zoom;
      const y2 = (box2.top + box2.height / 2 - cRect.top + scrollTop) / zoom;

      const dx = Math.max(30, Math.abs(x2 - x1) * 0.5);
      const sign = x2 >= x1 ? 1 : -1;
      const d = `M ${x1} ${y1} C ${x1 + dx * sign} ${y1}, ${x2 - dx * sign} ${y2}, ${x2} ${y2}`;

      return {
        id: `path-${el1.id || Math.random()}-${el2.id || Math.random()}`,
        d,
        gradientId,
        color,
        strokeWidth: isSelected ? 3.4 : 2.2,
        opacity: isSelected ? 1 : 0.65,
        isCurrentActive: isSelected,
        startPoint: { x: x1, y: y1 },
        endPoint: { x: x2, y: y2 }
      };
    };

    // 1. Root Card -> ALL Level 2 Cards
    if (rootCardRef.current && l2Nodes.length > 0) {
      const rEl = rootCardRef.current;
      l2Nodes.forEach(m => {
        const l2El = l2CardRefs.current[m.id];
        if (!l2El) return;
        const isSelected = m.id === selectedL2Id;
        const isCrit = m.isCritical;
        paths.push(computeConnector(
          rEl,
          l2El,
          isCrit ? 'grad-root-rose' : 'grad-root-blue',
          isCrit ? '#f43f5e' : (isSelected ? '#2563eb' : '#60a5fa'),
          isSelected,
          isCrit
        ));
      });
    }

    // 2. Selected Level 2 Card -> ALL Level 3 Cards
    if (selectedL2Id && l2CardRefs.current[selectedL2Id] && l3Nodes.length > 0) {
      const l2El = l2CardRefs.current[selectedL2Id];
      if (l2El) {
        l3Nodes.forEach(mot => {
          const l3El = l3CardRefs.current[mot.id];
          if (!l3El) return;
          const isSelected = mot.id === selectedL3Id;
          paths.push(computeConnector(
            l2El,
            l3El,
            'grad-month-amber',
            isSelected ? '#f59e0b' : '#fbbf24',
            isSelected
          ));
        });
      }
    }

    // 3. Selected Level 3 Card -> ALL Level 4 Cards
    if (selectedL3Id && l3CardRefs.current[selectedL3Id] && l4Nodes.length > 0) {
      const l3El = l3CardRefs.current[selectedL3Id];
      if (l3El) {
        l4Nodes.forEach(pkg => {
          const l4El = l4CardRefs.current[pkg.id];
          if (!l4El) return;
          const isSelected = pkg.id === selectedL4Id;
          paths.push(computeConnector(
            l3El,
            l4El,
            'grad-motivo-sky',
            isSelected ? '#0ea5e9' : '#38bdf8',
            isSelected
          ));
        });
      }
    }

    // 4. Selected Level 4 Card -> ALL Level 5 Cards
    if (selectedL4Id && l4CardRefs.current[selectedL4Id] && l5Nodes.length > 0) {
      const l4El = l4CardRefs.current[selectedL4Id];
      if (l4El) {
        l5Nodes.forEach(l5Item => {
          const l5El = l5CardRefs.current[l5Item.id];
          if (!l5El) return;
          const isSelected = l5Item.id === selectedL5Id;
          paths.push(computeConnector(
            l4El,
            l5El,
            'grad-pkg-emerald',
            isSelected ? '#10b981' : '#34d399',
            isSelected
          ));
        });
      }
    }

    // 5. Selected Level 5 Card -> ALL Level 6 Cards
    if (selectedL5Id && l5CardRefs.current[selectedL5Id] && l6Nodes.length > 0) {
      const l5El = l5CardRefs.current[selectedL5Id];
      if (l5El) {
        l6Nodes.forEach(l6Item => {
          const l6El = l6CardRefs.current[l6Item.id];
          if (!l6El) return;
          const isSelected = l6Item.id === selectedL6Id;
          paths.push(computeConnector(
            l5El,
            l6El,
            'grad-l6-purple',
            isSelected ? '#9333ea' : '#c084fc',
            isSelected
          ));
        });
      }
    }

    // 6. Selected Level 6 Card -> ALL Level 7 Cards
    if (selectedL6Id && l6CardRefs.current[selectedL6Id] && l7Nodes.length > 0) {
      const l6El = l6CardRefs.current[selectedL6Id];
      if (l6El) {
        l7Nodes.forEach(l7Item => {
          const l7El = l7CardRefs.current[l7Item.id];
          if (!l7El) return;
          paths.push(computeConnector(
            l6El,
            l7El,
            'grad-l7-rose',
            '#e11d48',
            true
          ));
        });
      }
    }

    setSvgPaths(paths);
  }, [
    layoutMode,
    cardPositions,
    getDefaultPosition,
    treeData,
    activeL2Node,
    activeL3Node,
    activeL4Node,
    activeL5Node,
    activeL6Node,
    l2Nodes,
    l3Nodes,
    l4Nodes,
    l5Nodes,
    l6Nodes,
    l7Nodes,
    selectedL2Id,
    selectedL3Id,
    selectedL4Id,
    selectedL5Id,
    selectedL6Id,
    zoomLevel
  ]);

  // Recalculate on any resize or level change
  useEffect(() => {
    const timer = setTimeout(calculateConnectors, 60);
    window.addEventListener('resize', calculateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateConnectors);
    };
  }, [calculateConnectors, l2Nodes, l3Nodes, l4Nodes, l5Nodes, l6Nodes, l7Nodes, selectedL2Id, selectedL3Id, selectedL4Id, selectedL5Id, selectedL6Id, zoomLevel, treeData]);

  // ── MANUAL TREE OPERATIONS ──
  const handleReorderNode = (
    level: number,
    parentId: string | undefined,
    sourceIndex: number,
    targetIndex: number
  ) => {
    if (sourceIndex === targetIndex || sourceIndex < 0 || targetIndex < 0) return;
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;

        const moveInArray = (arr: CustomTreeNode[]) => {
          if (!arr || sourceIndex >= arr.length || targetIndex >= arr.length) return arr;
          const [moved] = arr.splice(sourceIndex, 1);
          arr.splice(targetIndex, 0, moved);
          return arr;
        };

        if (level === 2) {
          newTree.nodes.level2 = moveInArray(newTree.nodes.level2);
        } else if (level === 3 && parentId) {
          if (newTree.nodes.level3[parentId]) {
            newTree.nodes.level3[parentId] = moveInArray(newTree.nodes.level3[parentId]);
          }
        } else if (level === 4 && parentId) {
          if (newTree.nodes.level4[parentId]) {
            newTree.nodes.level4[parentId] = moveInArray(newTree.nodes.level4[parentId]);
          }
        } else if (level === 5 && parentId) {
          if (newTree.nodes.level5[parentId]) {
            newTree.nodes.level5[parentId] = moveInArray(newTree.nodes.level5[parentId]);
          }
        } else if (level === 6 && parentId) {
          if (!newTree.nodes.level6) newTree.nodes.level6 = {};
          if (newTree.nodes.level6[parentId]) {
            newTree.nodes.level6[parentId] = moveInArray(newTree.nodes.level6[parentId]);
          }
        } else if (level === 7 && parentId) {
          if (!newTree.nodes.level7) newTree.nodes.level7 = {};
          if (newTree.nodes.level7[parentId]) {
            newTree.nodes.level7[parentId] = moveInArray(newTree.nodes.level7[parentId]);
          }
        }

        return newTree;
      });
    });
    setTimeout(calculateConnectors, 50);
  };

  const handleMoveNodeUp = (level: number, parentId: string | undefined, index: number) => {
    if (index <= 0) return;
    handleReorderNode(level, parentId, index, index - 1);
  };

  const handleMoveNodeDown = (level: number, parentId: string | undefined, index: number, maxLen: number) => {
    if (index >= maxLen - 1) return;
    handleReorderNode(level, parentId, index, index + 1);
  };

  const handleMoveNodeToParent = (
    oldParentId: string,
    newParentId: string,
    nodeId: string
  ) => {
    if (oldParentId === newParentId) return;
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;

        // Level 3
        if (newTree.nodes.level3[oldParentId]) {
          const idx = newTree.nodes.level3[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level3[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level3[newParentId]) newTree.nodes.level3[newParentId] = [];
            newTree.nodes.level3[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 4
        if (newTree.nodes.level4[oldParentId]) {
          const idx = newTree.nodes.level4[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level4[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level4[newParentId]) newTree.nodes.level4[newParentId] = [];
            newTree.nodes.level4[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 5
        if (newTree.nodes.level5[oldParentId]) {
          const idx = newTree.nodes.level5[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level5[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level5[newParentId]) newTree.nodes.level5[newParentId] = [];
            newTree.nodes.level5[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 6
        if (newTree.nodes.level6 && newTree.nodes.level6[oldParentId]) {
          const idx = newTree.nodes.level6[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level6[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level6[newParentId]) newTree.nodes.level6[newParentId] = [];
            newTree.nodes.level6[newParentId].push(moved);
            return newTree;
          }
        }

        // Level 7
        if (newTree.nodes.level7 && newTree.nodes.level7[oldParentId]) {
          const idx = newTree.nodes.level7[oldParentId].findIndex(n => n.id === nodeId);
          if (idx >= 0) {
            const [moved] = newTree.nodes.level7[oldParentId].splice(idx, 1);
            if (!newTree.nodes.level7[newParentId]) newTree.nodes.level7[newParentId] = [];
            newTree.nodes.level7[newParentId].push(moved);
            return newTree;
          }
        }

        return newTree;
      });
    });
    setTimeout(calculateConnectors, 50);
  };

  const handleSaveNode = (updatedNode: CustomTreeNode) => {
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;
        const lvl = editNodeModal.levelNumber;

        if (lvl === 1) {
          newTree.nodes.level1 = updatedNode;
          newTree.totalValue = updatedNode.value;
          if (updatedNode.volume) newTree.totalVolume = updatedNode.volume;
        } else if (lvl === 2) {
          const idx = newTree.nodes.level2.findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level2[idx] = updatedNode;
          } else {
            newTree.nodes.level2.push(updatedNode);
          }
        } else if (lvl === 3 && activeL2Node) {
          const l2Id = editNodeModal.parentId || activeL2Node.id;
          if (!newTree.nodes.level3[l2Id]) newTree.nodes.level3[l2Id] = [];
          const idx = newTree.nodes.level3[l2Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level3[l2Id][idx] = updatedNode;
          } else {
            newTree.nodes.level3[l2Id].push(updatedNode);
          }
        } else if (lvl === 4 && activeL3Node) {
          const l3Id = editNodeModal.parentId || activeL3Node.id;
          if (!newTree.nodes.level4[l3Id]) newTree.nodes.level4[l3Id] = [];
          const idx = newTree.nodes.level4[l3Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level4[l3Id][idx] = updatedNode;
          } else {
            newTree.nodes.level4[l3Id].push(updatedNode);
          }
        } else if (lvl === 5 && activeL4Node) {
          const l4Id = editNodeModal.parentId || activeL4Node.id;
          if (!newTree.nodes.level5[l4Id]) newTree.nodes.level5[l4Id] = [];
          const idx = newTree.nodes.level5[l4Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level5[l4Id][idx] = updatedNode;
          } else {
            newTree.nodes.level5[l4Id].push(updatedNode);
          }
        } else if (lvl === 6 && activeL5Node) {
          if (!newTree.nodes.level6) newTree.nodes.level6 = {};
          const l5Id = editNodeModal.parentId || activeL5Node.id;
          if (!newTree.nodes.level6[l5Id]) newTree.nodes.level6[l5Id] = [];
          const idx = newTree.nodes.level6[l5Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level6[l5Id][idx] = updatedNode;
          } else {
            newTree.nodes.level6[l5Id].push(updatedNode);
          }
        } else if (lvl === 7 && activeL6Node) {
          if (!newTree.nodes.level7) newTree.nodes.level7 = {};
          const l6Id = editNodeModal.parentId || activeL6Node.id;
          if (!newTree.nodes.level7[l6Id]) newTree.nodes.level7[l6Id] = [];
          const idx = newTree.nodes.level7[l6Id].findIndex(n => n.id === updatedNode.id);
          if (idx >= 0) {
            newTree.nodes.level7[l6Id][idx] = updatedNode;
          } else {
            newTree.nodes.level7[l6Id].push(updatedNode);
          }
        }

        return newTree;
      });
    });
  };

  const handleDeleteNode = (nodeId: string, levelNum?: number) => {
    setCustomTrees(prevTrees => {
      return prevTrees.map(t => {
        if (t.id !== activeTreeId) return t;
        const newTree = JSON.parse(JSON.stringify(t)) as CustomKpiTree;
        
        // Ensure tree has complete nodes structure so mutations persist
        if (!newTree.nodes) {
          newTree.nodes = JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_KPI_TREE.nodes));
        } else {
          newTree.nodes = {
            level1: newTree.nodes.level1 || DEFAULT_OFFICIAL_KPI_TREE.nodes.level1,
            level2: newTree.nodes.level2 !== undefined ? newTree.nodes.level2 : DEFAULT_OFFICIAL_KPI_TREE.nodes.level2,
            level3: newTree.nodes.level3 !== undefined ? newTree.nodes.level3 : DEFAULT_OFFICIAL_KPI_TREE.nodes.level3,
            level4: newTree.nodes.level4 !== undefined ? newTree.nodes.level4 : DEFAULT_OFFICIAL_KPI_TREE.nodes.level4,
            level5: newTree.nodes.level5 !== undefined ? newTree.nodes.level5 : DEFAULT_OFFICIAL_KPI_TREE.nodes.level5,
            level6: newTree.nodes.level6 !== undefined ? newTree.nodes.level6 : (DEFAULT_OFFICIAL_KPI_TREE.nodes.level6 || {}),
            level7: newTree.nodes.level7 !== undefined ? newTree.nodes.level7 : (DEFAULT_OFFICIAL_KPI_TREE.nodes.level7 || {})
          };
        }

        // 1. Remove from Level 2
        if (newTree.nodes.level2) {
          newTree.nodes.level2 = newTree.nodes.level2.filter(n => n.id !== nodeId);
        }

        // 2. Remove from Level 3
        if (newTree.nodes.level3) {
          Object.keys(newTree.nodes.level3).forEach(pid => {
            newTree.nodes.level3[pid] = (newTree.nodes.level3[pid] || []).filter(n => n.id !== nodeId);
          });
        }

        // 3. Remove from Level 4
        if (newTree.nodes.level4) {
          Object.keys(newTree.nodes.level4).forEach(pid => {
            newTree.nodes.level4[pid] = (newTree.nodes.level4[pid] || []).filter(n => n.id !== nodeId);
          });
        }

        // 4. Remove from Level 5
        if (newTree.nodes.level5) {
          Object.keys(newTree.nodes.level5).forEach(pid => {
            newTree.nodes.level5[pid] = (newTree.nodes.level5[pid] || []).filter(n => n.id !== nodeId);
          });
        }

        // 5. Remove from Level 6
        if (newTree.nodes.level6) {
          Object.keys(newTree.nodes.level6).forEach(pid => {
            newTree.nodes.level6[pid] = (newTree.nodes.level6[pid] || []).filter(n => n.id !== nodeId);
          });
        }

        // 6. Remove from Level 7
        if (newTree.nodes.level7) {
          Object.keys(newTree.nodes.level7).forEach(pid => {
            newTree.nodes.level7[pid] = (newTree.nodes.level7[pid] || []).filter(n => n.id !== nodeId);
          });
        }

        // Also clean up positions
        if (newTree.positions && newTree.positions[nodeId]) {
          delete newTree.positions[nodeId];
        }

        return newTree;
      });
    });

    // Remove from local card positions
    setCardPositions(prev => {
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });

    // Reset selection if active
    if (selectedL2Id === nodeId) setSelectedL2Id('');
    if (selectedL3Id === nodeId) setSelectedL3Id('');
    if (selectedL4Id === nodeId) setSelectedL4Id('');
    if (selectedL5Id === nodeId) setSelectedL5Id('');
    if (selectedL6Id === nodeId) setSelectedL6Id('');

    setSaveSuccess(true);
    setSaveToast('Card excluído com sucesso!');
    setTimeout(() => {
      setSaveSuccess(false);
      setSaveToast('');
    }, 2500);

    setTimeout(calculateConnectors, 50);
  };

  const handleCloneOfficial = () => {
    const cloned: CustomKpiTree = {
      ...JSON.parse(JSON.stringify(DEFAULT_OFFICIAL_KPI_TREE)),
      id: `tree-custom-${Date.now()}`,
      name: `Árvore Personalizada (${customTrees.length + 1})`,
      title: 'ÁRVORE DE INDICADORES (PERSONALIZADA)'
    };
    setCustomTrees(prev => [...prev, cloned]);
    setActiveTreeId(cloned.id);
    setActiveMode('manual');
  };

  const handleCreateNewBlank = (name: string) => {
    const newBlank: CustomKpiTree = {
      id: `tree-blank-${Date.now()}`,
      name: name || 'Nova Árvore Personalizada',
      title: (name || 'Nova Árvore de Indicadores').toUpperCase(),
      subtitle: 'Árvore de KPI customizada com 7 níveis hierárquicos',
      badgeText: '7 NÍVEIS',
      unitName: 'unidades',
      currencySymbol: 'R$',
      totalValue: 0,
      totalVolume: 0,
      totalRegistros: 0,
      ticketMedio: 0,
      summaryTag: 'Estrutura personalizada ativa.',
      criticalHighlight: '',
      levels: {
        level1Title: 'ÁRVORE DE KPI',
        level1Badge: 'RAIZ',
        level2Title: 'NÍVEL 2 - CATEGORIAS',
        level2Badge: '0 CARDS',
        level3Title: 'NÍVEL 3 - SUB-RAMOS',
        level3Badge: '0 CARDS',
        level4Title: 'NÍVEL 4 - SEGMENTOS',
        level4Badge: '0 CARDS',
        level5Title: 'NÍVEL 5 - DETALHAMENTO',
        level5Badge: '0 CARDS',
        level6Title: 'NÍVEL 6 - OPERAÇÃO',
        level6Badge: '0 CARDS',
        level7Title: 'NÍVEL 7 - ITENS / SKUS',
        level7Badge: '0 ITENS',
      },
      nodes: {
        level1: {
          id: 'root',
          label: 'ARVORE DE KPI',
          sublabel: 'Modo Manual',
          value: 0,
          volume: 0,
          badge: 'Manual',
          metaInfo: 'Árvore criada pelo usuário'
        },
        level2: [],
        level3: {},
        level4: {},
        level5: {},
        level6: {},
        level7: {}
      }
    };
    setCustomTrees(prev => [...prev, newBlank]);
    setActiveTreeId(newBlank.id);
    setActiveMode('manual');
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
    setTimeout(calculateConnectors, 60);
  };

  // Keyboard shortcut (Escape to exit fullscreen) and body scroll lock
  useEffect(() => {
    if (isFullscreen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
          setTimeout(calculateConnectors, 100);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen, calculateConnectors]);

  // Exact background style identical to platform's signature corporate light theme
  const platformGradientStyle: React.CSSProperties = {
    backgroundColor: '#dbeafe',
    backgroundImage: `
      radial-gradient(ellipse 60% 55% at -5% -5%, rgba(29, 78, 216, 0.70) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
      radial-gradient(ellipse 55% 50% at 105% -5%, rgba(30, 58, 138, 0.65) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
      radial-gradient(ellipse 65% 60% at 105% 105%, rgba(30, 58, 138, 0.90) 0%, rgba(29, 78, 216, 0.70) 30%, rgba(59, 130, 246, 0.40) 60%, transparent 85%),
      radial-gradient(ellipse 55% 50% at -5% 105%, rgba(37, 99, 235, 0.60) 0%, rgba(96, 165, 250, 0.40) 40%, transparent 75%),
      radial-gradient(ellipse 90% 80% at 50% 50%, #e2eeff 0%, #cee3fe 45%, #b9d7fd 100%)
    `,
    backgroundAttachment: 'local',
    backgroundSize: '100% 100%'
  };

  const mainContent = (
    <div 
      className={`flex flex-col text-slate-900 overflow-hidden font-sans select-none bg-slate-50/80 p-4 sm:p-6 ${
        isFullscreen 
          ? 'fixed inset-0 z-[999999] h-screen w-screen overflow-y-auto' 
          : 'w-full h-full rounded-2xl border border-slate-200/90 shadow-sm min-h-[640px] relative'
      }`}
    >
      {/* ── TOP EXECUTIVE APP HEADER BAR ── */}
      <TreeHeader
        treeData={treeData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        onRecalculateConnectors={calculateConnectors}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
        onClose={onClose}
        isModal={isModal}
        activeMode={activeMode}
        setActiveMode={setActiveMode}
        layoutMode={layoutMode}
        setLayoutMode={(mode) => {
          setLayoutMode(mode);
          setTimeout(calculateConnectors, 100);
        }}
        onResetPositions={handleResetPositions}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        handleManualSave={handleManualSave}
      />

      {/* ── MAIN 7-COLUMNS WORKSPACE ── */}
      <div 
        ref={containerRef}
        onScroll={calculateConnectors}
        className={`relative flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-4 select-none bg-white rounded-2xl border border-slate-200/90 shadow-xs ${
          isFullscreen ? 'min-h-[calc(100vh-220px)]' : 'min-h-[520px] h-[calc(100vh-260px)] max-h-[820px]'
        }`}
      >
        {/* ── CONDITIONAL LAYOUT: 2D FREE POSITION CANVAS OR 7 STRUCTURED COLUMNS ── */}
        {layoutMode === 'free' ? (
          /* ══════════════════════════════════════════════════════════════
              CANVAS DE POSIÇÃO LIVRE (DRAG & DROP 2D ARBITRÁRIO)
             ══════════════════════════════════════════════════════════════ */
          <div 
            style={{ 
              zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
              transformOrigin: 'top left',
              height: `${Math.max(2000, computedTreeLayout.totalHeight)}px`,
              width: '2800px'
            }}
            className="relative z-10 select-none"
          >
            {/* DYNAMIC SVG CANVAS FOR FREE 2D CONNECTORS */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
              <defs>
                <linearGradient id="grad-root-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-root-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-month-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#b45309" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-motivo-sky" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-pkg-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-l6-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#7e22ce" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="grad-l7-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e11d48" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
                </linearGradient>
                <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.15" />
                </filter>
              </defs>
              {svgPaths.map((path, pIdx) => (
                <g key={`path-${path.id}-${pIdx}`}>
                  <path
                    d={path.d}
                    fill="none"
                    stroke={`url(#${path.gradientId})`}
                    strokeWidth={path.strokeWidth || 3}
                    strokeOpacity={path.opacity || 1}
                    strokeLinecap="round"
                    filter="url(#soft-glow)"
                    className="transition-all duration-300"
                  />
                  <circle
                    cx={path.startPoint.x}
                    cy={path.startPoint.y}
                    r={path.isCurrentActive ? 4.5 : 3.5}
                    fill={path.color}
                    stroke="#ffffff"
                    strokeWidth={path.isCurrentActive ? 2.5 : 1.5}
                    className="shadow-sm"
                  />
                  <circle
                    cx={path.endPoint.x}
                    cy={path.endPoint.y}
                    r={path.isCurrentActive ? 4.5 : 3.5}
                    fill={path.color}
                    stroke="#ffffff"
                    strokeWidth={path.isCurrentActive ? 2.5 : 1.5}
                    className="shadow-sm"
                  />
                </g>
              ))}
            </svg>

            {/* Floating Level Column Guide Headers in background */}
            <div className="absolute top-2 left-[40px] flex gap-[75px] pointer-events-none opacity-45 select-none z-0">
              <span className="text-[10px] font-black uppercase text-blue-900 w-[205px] tracking-wider">01 • {treeData.levels.level1Title || 'Raiz'}</span>
              <span className="text-[10px] font-black uppercase text-blue-900 w-[205px] tracking-wider">02 • {treeData.levels.level2Title}</span>
              <span className="text-[10px] font-black uppercase text-amber-900 w-[205px] tracking-wider">03 • {treeData.levels.level3Title}</span>
              <span className="text-[10px] font-black uppercase text-sky-900 w-[205px] tracking-wider">04 • {treeData.levels.level4Title}</span>
              <span className="text-[10px] font-black uppercase text-emerald-900 w-[205px] tracking-wider">05 • {treeData.levels.level5Title}</span>
              <span className="text-[10px] font-black uppercase text-purple-900 w-[205px] tracking-wider">06 • {treeData.levels.level6Title || 'Operação'}</span>
              <span className="text-[10px] font-black uppercase text-rose-900 w-[205px] tracking-wider">07 • {treeData.levels.level7Title || 'Itens'}</span>
            </div>

            {/* Level 1 Root Card */}
            <KpiNodeCard
              cardRef={el => { rootCardRef.current = el; }}
              node={treeData.nodes.level1}
              level={1}
              index={0}
              layoutMode="free"
              position={cardPositions[treeData.nodes.level1.id || 'root'] || getDefaultPosition(1, treeData.nodes.level1.id || 'root', 0)}
              isDragging={draggingCardId === (treeData.nodes.level1.id || 'root')}
              isSelected={true}
              currencySymbol={treeData.currencySymbol}
              unitName={treeData.unitName}
              onPointerDownDrag={(e) => handleCardPointerDown(e, treeData.nodes.level1.id || 'root', 1, 0)}
              onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                isOpen: true,
                levelNumber: 1,
                levelTitle: treeData.levels.level1Title || 'Árvore de KPI',
                node: treeData.nodes.level1
              }) : undefined}
            />

            {/* Level 2 Cards */}
            {l2Nodes.map((m, mIdx) => (
              <KpiNodeCard
                key={`free-l2-${m.id}`}
                cardRef={el => { l2CardRefs.current[m.id] = el; }}
                node={m}
                level={2}
                index={mIdx}
                layoutMode="free"
                position={cardPositions[m.id] || getDefaultPosition(2, m.id, mIdx)}
                isDragging={draggingCardId === m.id}
                isSelected={selectedL2Id === m.id}
                currencySymbol={treeData.currencySymbol}
                unitName={treeData.unitName}
                sharePercent={m.percentage !== undefined ? `${m.percentage}%` : `${((m.value / (treeData.totalValue || 1)) * 100).toFixed(1)}%`}
                subCount={(treeData.nodes.level3[m.id] || []).length}
                unitAvg={m.volume && m.volume > 0 ? (m.value / m.volume) : 0}
                onSelect={() => {
                  cascadeSelectL2(m.id);
                }}
                onPointerDownDrag={(e) => handleCardPointerDown(e, m.id, 2, mIdx)}
                onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                  isOpen: true,
                  levelNumber: 2,
                  levelTitle: treeData.levels.level2Title,
                  node: m
                }) : undefined}
                onDelete={activeMode === 'manual' ? () => handleDeleteNode(m.id, 2) : undefined}
              />
            ))}

            {/* Level 3 Cards (Rendered for the selected Pillar) */}
            {activePillarL3Nodes.map((mot, motIdx) => (
              <KpiNodeCard
                key={`free-l3-${mot.id}`}
                cardRef={el => { l3CardRefs.current[mot.id] = el; }}
                node={mot}
                level={3}
                index={motIdx}
                parentId={selectedL2Id}
                layoutMode="free"
                position={cardPositions[mot.id] || getDefaultPosition(3, mot.id, motIdx, selectedL2Id)}
                isDragging={draggingCardId === mot.id}
                isSelected={selectedL3Id === mot.id}
                currencySymbol={treeData.currencySymbol}
                unitName={treeData.unitName}
                sharePercent={mot.percentage !== undefined ? `${mot.percentage}%` : undefined}
                subCount={(treeData.nodes.level4[mot.id] || []).length}
                unitAvg={mot.volume && mot.volume > 0 ? (mot.value / mot.volume) : 0}
                onSelect={() => {
                  cascadeSelectL3(mot.id);
                }}
                onPointerDownDrag={(e) => handleCardPointerDown(e, mot.id, 3, motIdx, selectedL2Id)}
                onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                  isOpen: true,
                  levelNumber: 3,
                  levelTitle: treeData.levels.level3Title,
                  node: mot,
                  parentId: selectedL2Id
                }) : undefined}
                onDelete={activeMode === 'manual' ? () => handleDeleteNode(mot.id, 3) : undefined}
              />
            ))}

            {/* Level 4 Cards (Rendered for the selected Pillar) */}
            {activePillarL4Nodes.map(({ node: pkg, parentId: l3Id, index: pkgIdx }) => {
              const l3Parent = activePillarL3Nodes.find(n => n.id === l3Id);
              const parentVal = l3Parent?.value || 1;
              return (
                <KpiNodeCard
                  key={`free-l4-${pkg.id}`}
                  cardRef={el => { l4CardRefs.current[pkg.id] = el; }}
                  node={pkg}
                  level={4}
                  index={pkgIdx}
                  parentId={l3Id}
                  layoutMode="free"
                  position={cardPositions[pkg.id] || getDefaultPosition(4, pkg.id, pkgIdx, l3Id)}
                  isDragging={draggingCardId === pkg.id}
                  isSelected={selectedL4Id === pkg.id}
                  currencySymbol={treeData.currencySymbol}
                  unitName={treeData.unitName}
                  sharePercent={pkg.percentage !== undefined ? `${pkg.percentage}%` : `${((pkg.value / parentVal) * 100).toFixed(1)}%`}
                  subCount={(treeData.nodes.level5[pkg.id] || []).length}
                  unitAvg={pkg.volume && pkg.volume > 0 ? (pkg.value / pkg.volume) : 0}
                  onSelect={() => {
                    if (l3Parent) {
                      setSelectedL3Id(l3Parent.id);
                    }
                    cascadeSelectL4(pkg.id);
                  }}
                  onPointerDownDrag={(e) => handleCardPointerDown(e, pkg.id, 4, pkgIdx, l3Id)}
                  onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                    isOpen: true,
                    levelNumber: 4,
                    levelTitle: treeData.levels.level4Title,
                    node: pkg,
                    parentId: l3Id
                  }) : undefined}
                  onDelete={activeMode === 'manual' ? () => handleDeleteNode(pkg.id, 4) : undefined}
                />
              );
            })}

            {/* Level 5 Cards (Rendered for the selected Pillar) */}
            {activePillarL5Nodes.map(({ node: det, parentId: l4Id, index: detIdx }) => {
              const l4Parent = activePillarL4Nodes.find(item => item.node.id === l4Id)?.node;
              const parentVal = l4Parent?.value || 1;
              return (
                <KpiNodeCard
                  key={`free-l5-${det.id}`}
                  cardRef={el => { l5CardRefs.current[det.id] = el; }}
                  node={det}
                  level={5}
                  index={detIdx}
                  parentId={l4Id}
                  layoutMode="free"
                  position={cardPositions[det.id] || getDefaultPosition(5, det.id, detIdx, l4Id)}
                  isDragging={draggingCardId === det.id}
                  isSelected={selectedL5Id === det.id}
                  currencySymbol={treeData.currencySymbol}
                  unitName={treeData.unitName}
                  sharePercent={det.percentage !== undefined ? `${det.percentage}%` : `${((det.value / parentVal) * 100).toFixed(1)}%`}
                  subCount={((treeData.nodes.level6 && treeData.nodes.level6[det.id]) || []).length}
                  unitAvg={det.volume && det.volume > 0 ? (det.value / det.volume) : 0}
                  onSelect={() => {
                    if (l4Parent) {
                      setSelectedL4Id(l4Parent.id);
                    }
                    cascadeSelectL5(det.id);
                  }}
                  onPointerDownDrag={(e) => handleCardPointerDown(e, det.id, 5, detIdx, l4Id)}
                  onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                    isOpen: true,
                    levelNumber: 5,
                    levelTitle: treeData.levels.level5Title,
                    node: det,
                    parentId: l4Id
                  }) : undefined}
                  onDelete={activeMode === 'manual' ? () => handleDeleteNode(det.id, 5) : undefined}
                />
              );
            })}

            {/* Level 6 Cards (Rendered for the selected Pillar) */}
            {activePillarL6Nodes.map(({ node: op, parentId: l5Id, index: opIdx }) => {
              const l5Parent = activePillarL5Nodes.find(item => item.node.id === l5Id)?.node;
              const parentVal = l5Parent?.value || 1;
              return (
                <KpiNodeCard
                  key={`free-l6-${op.id}`}
                  cardRef={el => { l6CardRefs.current[op.id] = el; }}
                  node={op}
                  level={6}
                  index={opIdx}
                  parentId={l5Id}
                  layoutMode="free"
                  position={cardPositions[op.id] || getDefaultPosition(6, op.id, opIdx, l5Id)}
                  isDragging={draggingCardId === op.id}
                  isSelected={selectedL6Id === op.id}
                  currencySymbol={treeData.currencySymbol}
                  unitName={treeData.unitName}
                  sharePercent={op.percentage !== undefined ? `${op.percentage}%` : `${((op.value / parentVal) * 100).toFixed(1)}%`}
                  subCount={((treeData.nodes.level7 && treeData.nodes.level7[op.id]) || []).length}
                  unitAvg={op.volume && op.volume > 0 ? (op.value / op.volume) : 0}
                  onSelect={() => {
                    cascadeSelectL6(op.id);
                  }}
                  onPointerDownDrag={(e) => handleCardPointerDown(e, op.id, 6, opIdx, l5Id)}
                  onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                    isOpen: true,
                    levelNumber: 6,
                    levelTitle: treeData.levels.level6Title || 'Nível 6 - Operação',
                    node: op,
                    parentId: l5Id
                  }) : undefined}
                  onDelete={activeMode === 'manual' ? () => handleDeleteNode(op.id, 6) : undefined}
                />
              );
            })}

            {/* Level 7 Cards (Rendered for the selected Pillar) */}
            {activePillarL7Nodes.map(({ node: sku, parentId: l6Id, index: skuIdx }) => {
              const l6Parent = activePillarL6Nodes.find(item => item.node.id === l6Id)?.node;
              const parentVal = l6Parent?.value || 1;
              return (
                <KpiNodeCard
                  key={`free-l7-${sku.id}`}
                  cardRef={el => { l7CardRefs.current[sku.id] = el; }}
                  node={sku}
                  level={7}
                  index={skuIdx}
                  parentId={l6Id}
                  layoutMode="free"
                  position={cardPositions[sku.id] || getDefaultPosition(7, sku.id, skuIdx, l6Id)}
                  isDragging={draggingCardId === sku.id}
                  isSelected={false}
                  currencySymbol={treeData.currencySymbol}
                  unitName={treeData.unitName}
                  sharePercent={sku.percentage !== undefined ? `${sku.percentage}%` : `${((sku.value / parentVal) * 100).toFixed(1)}%`}
                  unitAvg={sku.unitPrice || (sku.volume && sku.volume > 0 ? (sku.value / sku.volume) : 0)}
                  onPointerDownDrag={(e) => handleCardPointerDown(e, sku.id, 7, skuIdx, l6Id)}
                  onEdit={activeMode === 'manual' ? () => setEditNodeModal({
                    isOpen: true,
                    levelNumber: 7,
                    levelTitle: treeData.levels.level7Title || 'Nível 7 - Itens / SKUs',
                    node: sku,
                    parentId: l6Id
                  }) : undefined}
                  onDelete={activeMode === 'manual' ? () => handleDeleteNode(sku.id, 7) : undefined}
                />
              );
            })}
          </div>
        ) : (
        /* 7 HIERARCHICAL COLUMNS COM CARDS VIDRO TRANSLÚCIDO IMPECÁVEIS */
        <div 
          style={{ 
            zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
            transformOrigin: 'top left'
          }}
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 lg:gap-2.5 w-full min-w-[1550px] items-stretch min-h-full"
        >
          {/* DYNAMIC SVG CANVAS FOR COLUMNS CONNECTORS */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <linearGradient id="grad-root-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-root-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-month-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#b45309" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-motivo-sky" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-pkg-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#047857" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-l6-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="grad-l7-rose" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
              </linearGradient>
              <filter id="soft-glow-col" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.15" />
              </filter>
            </defs>
            {svgPaths.map((path, pIdx) => (
              <g key={`path-col-${path.id}-${pIdx}`}>
                <path
                  d={path.d}
                  fill="none"
                  stroke={`url(#${path.gradientId})`}
                  strokeWidth={path.strokeWidth || 3}
                  strokeOpacity={path.opacity || 1}
                  strokeLinecap="round"
                  filter="url(#soft-glow-col)"
                  className="transition-all duration-300"
                />
                <circle
                  cx={path.startPoint.x}
                  cy={path.startPoint.y}
                  r={path.isCurrentActive ? 4.5 : 3.5}
                  fill={path.color}
                  stroke="#ffffff"
                  strokeWidth={path.isCurrentActive ? 2.5 : 1.5}
                  className="shadow-sm"
                />
                <circle
                  cx={path.endPoint.x}
                  cy={path.endPoint.y}
                  r={path.isCurrentActive ? 4.5 : 3.5}
                  fill={path.color}
                  stroke="#ffffff"
                  strokeWidth={path.isCurrentActive ? 2.5 : 1.5}
                  className="shadow-sm"
                />
              </g>
            ))}
          </svg>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 1: TOTAL GERAL (CARD RAIZ EXECUTIVO)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1 h-full min-h-[220px]">
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-[10px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">01</span>
                {treeData.levels.level1Title && treeData.levels.level1Title !== 'TOTAL CONSOLIDADO' ? treeData.levels.level1Title : 'ÁRVORE DE KPI'}
              </span>
              <span className="text-[8.5px] text-blue-900/70 font-black uppercase tracking-wider">{treeData.levels.level1Badge}</span>
            </div>

            <div className="flex-1 flex flex-col justify-center my-auto">
              <div
                ref={rootCardRef}
                className="bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs border border-blue-200 relative overflow-hidden transition-all hover:shadow-md hover:border-blue-400 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 flex items-center gap-1.5 bg-blue-50/90 px-1.5 py-1 rounded border border-blue-200">
                    <Layers className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-blue-900 break-words whitespace-normal leading-tight">
                      {treeData.nodes.level1.label && treeData.nodes.level1.label !== 'TOTAL CONSOLIDADO' 
                        ? treeData.nodes.level1.label 
                        : 'PRODUTIVIDADE'}
                    </span>
                  </div>
                  {activeMode === 'manual' && (
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        onClick={() => setEditNodeModal({
                          isOpen: true,
                          levelNumber: 1,
                          levelTitle: treeData.levels.level1Title || 'Árvore de KPI',
                          node: treeData.nodes.level1
                        })}
                        className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                        title="Editar Card Raiz"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 2: MESES / PERÍODO / CATEGORIAS
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1 h-full min-h-[220px]">
            <div className="flex items-center justify-between px-1 shrink-0">
              <span className="text-[10px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">02</span>
                {treeData.levels.level2Title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-blue-900/70 font-black uppercase tracking-wider">{l2Nodes.length} Cards</span>
                {activeMode === 'manual' && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 2,
                      levelTitle: treeData.levels.level2Title,
                      node: null
                    })}
                    className="p-0.5 rounded bg-blue-100 text-blue-900 hover:bg-blue-200"
                    title="Adicionar Novo Card"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col space-y-1.5 overflow-y-auto max-h-[calc(100vh-230px)] min-h-[220px] pr-0.5 scrollbar-thin scrollbar-thumb-blue-300">
              {l2Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-blue-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Calendar className="w-4 h-4 text-blue-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum pilar cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Crie nós manuais ou importe quebras.</p>
                </div>
              ) : (
                l2Nodes.map((m, mIdx) => {
                const isSelected = selectedL2Id === m.id;
                const isCritical = m.isCritical;

                const isDragging = draggedNode?.level === 2 && draggedNode?.id === m.id;
                const isDropTarget = dragOverTarget?.level === 2 && dragOverTarget?.index === mIdx && !isDragging;

                return (
                  <div
                    key={`l2-node-${m.id}-${mIdx}`}
                    ref={el => { l2CardRefs.current[m.id] = el; }}
                    draggable={activeMode === 'manual'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', m.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode({ level: 2, index: mIdx, id: m.id });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTarget?.level !== 2 || dragOverTarget?.index !== mIdx) {
                        setDragOverTarget({ level: 2, index: mIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget?.level === 2 && dragOverTarget?.index === mIdx) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedNode && draggedNode.level === 2) {
                        handleReorderNode(2, undefined, draggedNode.index, mIdx);
                      }
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => {
                      cascadeSelectL2(m.id);
                    }}
                    className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1 group ${
                      isDragging 
                        ? 'opacity-40 scale-[0.98] border-2 border-dashed border-blue-500 bg-blue-50/50' 
                        : isDropTarget
                          ? 'ring-2 ring-blue-500/80 ring-offset-1 border-2 border-blue-600 scale-[1.01]'
                          : isSelected
                            ? isCritical
                              ? 'border-2 border-rose-500 ring-2 ring-rose-400/50 shadow-md'
                              : 'border-2 border-blue-600 ring-2 ring-blue-500/50 shadow-md'
                            : isCritical
                              ? 'border border-rose-300 hover:border-rose-500 hover:shadow-xs'
                              : 'border border-blue-200 hover:border-blue-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="relative z-10 flex items-center justify-between gap-1">
                      <div className="flex-1 min-w-0 flex items-center gap-1 bg-slate-50/90 px-1.5 py-1 rounded border border-slate-200">
                        <span className="shrink-0">{renderNodeIcon(m.iconName || 'calendar')}</span>
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-900 break-words whitespace-normal leading-tight">{m.label} {m.sublabel ? `(${m.sublabel})` : ''}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 ml-1">
                        {isCritical && (
                          <span className="px-1 py-0.2 rounded text-[6.5px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                            <Flame className="w-2 h-2 text-rose-600" />
                            Crítico
                          </span>
                        )}

                        {/* Movement & Edit Toolbar */}
                        {activeMode === 'manual' && (
                          <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={mIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeUp(2, undefined, mIdx);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                mIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                              }`}
                              title="Mover para cima (↑)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={mIdx === l2Nodes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeDown(2, undefined, mIdx, l2Nodes.length);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                mIdx === l2Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                              }`}
                              title="Mover para baixo (↓)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                            <div 
                              className="p-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                              title="Arrastar e soltar card"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 2,
                                  levelTitle: treeData.levels.level2Title,
                                  node: m
                                });
                              }}
                              className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                              title="Editar Card"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Deseja realmente excluir o card "${m.label}"?`)) {
                                  handleDeleteNode(m.id, 2);
                                }
                              }}
                              className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                              title="Excluir Card"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 3: NÍVEL 3 (SUB-RAMOS / MOTIVOS / CAUSAS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">03</span>
                {treeData.levels.level3Title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-amber-900/70 font-black uppercase tracking-wider">{l3Nodes.length} Cards</span>
                {activeMode === 'manual' && activeL2Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 3,
                      levelTitle: treeData.levels.level3Title,
                      node: null,
                      parentId: activeL2Node.id
                    })}
                    className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200"
                    title="Adicionar Sub-ramo"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-amber-300">
              {l3Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-amber-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum sub-ramo cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um card anterior ou adicione um novo.</p>
                </div>
              ) : (
                l3Nodes.map((mot, motIdx) => {
                const isSelected = selectedL3Id === mot.id;
                const parentTotal = activeL2Node ? activeL2Node.value : 1;
                const sharePercent = mot.percentage !== undefined ? `${mot.percentage}%` : `${((mot.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                const progressPercent = Math.min(100, Math.round((mot.value / (parentTotal || 1)) * 100));
                const subCount = (treeData.nodes.level4[mot.id] || []).length;
                const unitAvg = mot.volume && mot.volume > 0 ? (mot.value / mot.volume) : 0;
                const parentId = activeL2Node?.id;

                const isDragging = draggedNode?.level === 3 && draggedNode?.id === mot.id;
                const isDropTarget = dragOverTarget?.level === 3 && dragOverTarget?.index === motIdx && !isDragging;

                return (
                  <div
                    key={`l3-node-${mot.id}-${motIdx}`}
                    ref={el => { l3CardRefs.current[mot.id] = el; }}
                    draggable={activeMode === 'manual'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', mot.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode({ level: 3, parentId, index: motIdx, id: mot.id });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTarget?.level !== 3 || dragOverTarget?.index !== motIdx) {
                        setDragOverTarget({ level: 3, parentId, index: motIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget?.level === 3 && dragOverTarget?.index === motIdx) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedNode && draggedNode.level === 3 && parentId) {
                        handleReorderNode(3, parentId, draggedNode.index, motIdx);
                      }
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => {
                      cascadeSelectL3(mot.id);
                    }}
                    className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1 group ${
                      isDragging 
                        ? 'opacity-40 scale-[0.98] border-2 border-dashed border-amber-500 bg-amber-50/50' 
                        : isDropTarget
                          ? 'ring-2 ring-amber-500/80 ring-offset-1 border-2 border-amber-600 scale-[1.01]'
                          : isSelected
                            ? 'border-2 border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                            : 'border border-amber-200 hover:border-amber-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-amber-500 opacity-10 pointer-events-none transition-all"
                    />

                    {/* Header Row */}
                    <div className="relative z-10 flex items-center justify-between border-b border-amber-100 pb-1">
                      <div className="flex-1 min-w-0 flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <span className="shrink-0">{renderNodeIcon(mot.iconName || 'layers')}</span>
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-950 break-words whitespace-normal leading-tight">{mot.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="flex items-center gap-1 text-[7px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-300 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {sharePercent}
                        </span>

                        {/* Movement & Edit Toolbar */}
                        {activeMode === 'manual' && (
                          <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={motIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeUp(3, parentId, motIdx);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                motIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100 cursor-pointer'
                              }`}
                              title="Mover para cima (↑)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={motIdx === l3Nodes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeDown(3, parentId, motIdx, l3Nodes.length);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                motIdx === l3Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-100 cursor-pointer'
                              }`}
                              title="Mover para baixo (↓)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                            <div 
                              className="p-0.5 text-slate-400 hover:text-amber-700 hover:bg-amber-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                              title="Arrastar e soltar card"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 3,
                                  levelTitle: treeData.levels.level3Title,
                                  node: mot,
                                  parentId: parentId,
                                  availableParents: l2Nodes.map(n => ({ id: n.id, label: n.label }))
                                });
                              }}
                              className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                              title="Editar Card / Trocar Ramo"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Deseja realmente excluir o card "${mot.label}"?`)) {
                                  handleDeleteNode(mot.id, 3);
                                }
                              }}
                              className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                              title="Excluir Card"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2-Column Grid: META and REAL */}
                    <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-amber-100">
                      <div className="bg-amber-50/90 p-1 px-1.5 rounded border border-amber-200/90 flex flex-col justify-center">
                        <span className="text-[7.5px] text-amber-900/80 uppercase font-black tracking-wider block">META</span>
                        <strong className="font-mono text-amber-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                          {mot.meta !== undefined && String(mot.meta).trim() !== '' ? String(mot.meta) : (mot.percentage !== undefined && mot.percentage > 0 ? `${mot.percentage}%` : '-')}
                        </strong>
                      </div>
                      <div className="bg-emerald-50/90 p-1 px-1.5 rounded border border-emerald-200/90 flex flex-col justify-center">
                        <span className="text-[7.5px] text-emerald-900/80 uppercase font-black tracking-wider block">REAL</span>
                        <strong className="font-mono text-emerald-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                          {mot.real !== undefined && String(mot.real).trim() !== '' ? String(mot.real) : (mot.value !== undefined && mot.value !== 0 ? String(mot.value) : '-')}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 4: NÍVEL 4 (SEGMENTOS / TIPOS / PROCESSOS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-sky-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">04</span>
                {treeData.levels.level4Title}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-sky-900/70 font-black uppercase tracking-wider">{l4Nodes.length} Cards</span>
                {activeMode === 'manual' && activeL3Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 4,
                      levelTitle: treeData.levels.level4Title,
                      node: null,
                      parentId: activeL3Node.id
                    })}
                    className="p-0.5 rounded bg-sky-100 text-sky-900 hover:bg-sky-200"
                    title="Adicionar Segmento"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-sky-300">
              {l4Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-sky-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-sky-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum segmento cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um card anterior ou adicione um novo.</p>
                </div>
              ) : (
                l4Nodes.map((pkg, pkgIdx) => {
                const isSelected = selectedL4Id === pkg.id;
                const parentTotal = activeL3Node ? activeL3Node.value : 1;
                const sharePercent = pkg.percentage !== undefined ? `${pkg.percentage}%` : `${((pkg.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                const progressPercent = Math.min(100, Math.round((pkg.value / (parentTotal || 1)) * 100));
                const subCount = (treeData.nodes.level5[pkg.id] || []).length;
                const unitAvg = pkg.volume && pkg.volume > 0 ? (pkg.value / pkg.volume) : 0;
                const parentId = activeL3Node?.id;

                const isDragging = draggedNode?.level === 4 && draggedNode?.id === pkg.id;
                const isDropTarget = dragOverTarget?.level === 4 && dragOverTarget?.index === pkgIdx && !isDragging;

                return (
                  <div
                    key={`l4-node-${pkg.id}-${pkgIdx}`}
                    ref={el => { l4CardRefs.current[pkg.id] = el; }}
                    draggable={activeMode === 'manual'}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', pkg.id);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode({ level: 4, parentId, index: pkgIdx, id: pkg.id });
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTarget?.level !== 4 || dragOverTarget?.index !== pkgIdx) {
                        setDragOverTarget({ level: 4, parentId, index: pkgIdx });
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTarget?.level === 4 && dragOverTarget?.index === pkgIdx) {
                        setDragOverTarget(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggedNode && draggedNode.level === 4 && parentId) {
                        handleReorderNode(4, parentId, draggedNode.index, pkgIdx);
                      }
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedNode(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => {
                      cascadeSelectL4(pkg.id);
                    }}
                    className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1 group ${
                      isDragging 
                        ? 'opacity-40 scale-[0.98] border-2 border-dashed border-sky-500 bg-sky-50/50' 
                        : isDropTarget
                          ? 'ring-2 ring-sky-500/80 ring-offset-1 border-2 border-sky-600 scale-[1.01]'
                          : isSelected
                            ? 'border-2 border-sky-500 ring-2 ring-sky-400/50 shadow-md'
                            : 'border border-sky-200 hover:border-sky-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-sky-500 opacity-10 pointer-events-none transition-all"
                    />

                    {/* Header Row */}
                    <div className="relative z-10 flex items-center justify-between border-b border-sky-100 pb-1">
                      <div className="flex-1 min-w-0 flex items-center gap-1 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        <span className="shrink-0">{renderNodeIcon(pkg.iconName || 'box')}</span>
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-sky-950 break-words whitespace-normal leading-tight">{pkg.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="flex items-center gap-1 text-[7px] font-bold text-sky-900 bg-sky-50 px-1.5 py-0.2 rounded-full border border-sky-300 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                          {sharePercent}
                        </span>

                        {/* Movement & Edit Toolbar */}
                        {activeMode === 'manual' && (
                          <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                            <button
                              type="button"
                              disabled={pkgIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeUp(4, parentId, pkgIdx);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                pkgIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-100 cursor-pointer'
                              }`}
                              title="Mover para cima (↑)"
                            >
                              <ArrowUp className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              disabled={pkgIdx === l4Nodes.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveNodeDown(4, parentId, pkgIdx, l4Nodes.length);
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                pkgIdx === l4Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-sky-700 hover:bg-sky-100 cursor-pointer'
                              }`}
                              title="Mover para baixo (↓)"
                            >
                              <ArrowDown className="w-2.5 h-2.5" />
                            </button>
                            <div 
                              className="p-0.5 text-slate-400 hover:text-sky-700 hover:bg-sky-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                              title="Arrastar e soltar card"
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 4,
                                  levelTitle: treeData.levels.level4Title,
                                  node: pkg,
                                  parentId: parentId,
                                  availableParents: (l3Nodes.length > 0 ? l3Nodes : Object.values(treeData.nodes.level3).flat()).map(n => ({ id: n.id, label: n.label }))
                                });
                              }}
                              className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                              title="Editar Card / Trocar Ramo"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Deseja realmente excluir o card "${pkg.label}"?`)) {
                                  handleDeleteNode(pkg.id, 4);
                                }
                              }}
                              className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                              title="Excluir Card"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2-Column Grid: META and REAL */}
                    <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-sky-100">
                      <div className="bg-sky-50/90 p-1 px-1.5 rounded border border-sky-200/90 flex flex-col justify-center">
                        <span className="text-[7.5px] text-sky-900/80 uppercase font-black tracking-wider block">META</span>
                        <strong className="font-mono text-sky-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                          {pkg.meta !== undefined && String(pkg.meta).trim() !== '' ? String(pkg.meta) : (pkg.percentage !== undefined && pkg.percentage > 0 ? `${pkg.percentage}%` : '-')}
                        </strong>
                      </div>
                      <div className="bg-emerald-50/90 p-1 px-1.5 rounded border border-emerald-200/90 flex flex-col justify-center">
                        <span className="text-[7.5px] text-emerald-900/80 uppercase font-black tracking-wider block">REAL</span>
                        <strong className="font-mono text-emerald-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                          {pkg.real !== undefined && String(pkg.real).trim() !== '' ? String(pkg.real) : (pkg.value !== undefined && pkg.value !== 0 ? String(pkg.value) : '-')}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 5: NÍVEL 5 (DETALHAMENTO / PROCESSOS)
             ══════════════════════════════════════════════════════════════ */}
          <div ref={top10ContainerRef} className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-emerald-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">05</span>
                {treeData.levels.level5Title || 'NÍVEL 5'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-emerald-900/70 font-black uppercase tracking-wider">{l5Nodes.length} Ramos</span>
                {activeMode === 'manual' && activeL4Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 5,
                      levelTitle: treeData.levels.level5Title || 'NÍVEL 5',
                      node: null,
                      parentId: activeL4Node.id
                    })}
                    className="p-0.5 rounded bg-emerald-100 text-emerald-900 hover:bg-emerald-200"
                    title="Adicionar Nó no Nível 5"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-emerald-300">
              {l5Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-emerald-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-emerald-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum nó cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um segmento anterior ou adicione um novo nó.</p>
                </div>
              ) : (
                l5Nodes.map((l5Item, l5Idx) => {
                  const isSelected = l5Item.id === selectedL5Id;
                  const parentTotal = activeL4Node ? activeL4Node.value : 1;
                  const sharePercent = l5Item.percentage !== undefined ? `${l5Item.percentage}%` : `${((l5Item.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                  const parentId = activeL4Node?.id;

                  const isDragging = draggedNode?.level === 5 && draggedNode?.id === l5Item.id;
                  const isDropTarget = dragOverTarget?.level === 5 && dragOverTarget?.index === l5Idx && !isDragging;

                  const subNodes = (treeData.nodes.level6 && treeData.nodes.level6[l5Item.id]) || [];
                  const subCount = subNodes.length;

                  return (
                    <div
                      key={`l5-card-${l5Item.id}-${l5Idx}`}
                      ref={el => { l5CardRefs.current[l5Item.id] = el; }}
                      draggable={activeMode === 'manual'}
                      onClick={() => {
                        cascadeSelectL5(l5Item.id);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', l5Item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedNode({ level: 5, parentId, index: l5Idx, id: l5Item.id });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverTarget?.level !== 5 || dragOverTarget?.index !== l5Idx) {
                          setDragOverTarget({ level: 5, parentId, index: l5Idx });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget?.level === 5 && dragOverTarget?.index === l5Idx) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode.level === 5 && parentId) {
                          handleReorderNode(5, parentId, draggedNode.index, l5Idx);
                        }
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all space-y-1 relative overflow-hidden group cursor-pointer ${
                        isDragging 
                          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-emerald-500 bg-emerald-50/50' 
                          : isDropTarget
                            ? 'ring-2 ring-emerald-500/80 ring-offset-1 border-2 border-emerald-600 scale-[1.01]'
                            : isSelected
                              ? 'border-2 border-emerald-600 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/50 scale-[1.01]'
                              : 'border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="relative z-10 flex items-center justify-between border-b border-emerald-100 pb-1">
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <h4 className="text-[8.5px] sm:text-[9px] font-bold text-slate-900 break-words whitespace-normal leading-tight" title={l5Item.label}>
                            {l5Item.label}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="flex items-center gap-1 text-[7px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-300 shadow-2xs">
                            {sharePercent}
                          </span>

                          {/* Movement & Edit Toolbar */}
                          {activeMode === 'manual' && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={l5Idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeUp(5, parentId, l5Idx);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l5Idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                }`}
                                title="Mover para cima (↑)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={l5Idx === l5Nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeDown(5, parentId, l5Idx, l5Nodes.length);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l5Idx === l5Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                                }`}
                                title="Mover para baixo (↓)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <div 
                                className="p-0.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                                title="Arrastar e soltar nó"
                              >
                                <GripVertical className="w-2.5 h-2.5" />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditNodeModal({
                                    isOpen: true,
                                    levelNumber: 5,
                                    levelTitle: treeData.levels.level5Title || 'NÍVEL 5',
                                    node: l5Item,
                                    parentId: parentId,
                                    availableParents: (l4Nodes.length > 0 ? l4Nodes : Object.values(treeData.nodes.level4).flat()).map(n => ({ id: n.id, label: n.label }))
                                  });
                                }}
                                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                                title="Editar Nó / Trocar Ramo"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Deseja realmente excluir o card "${l5Item.label}"?`)) {
                                    handleDeleteNode(l5Item.id, 5);
                                  }
                                }}
                                className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                                title="Excluir Card"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2-Column Grid: META and REAL */}
                      <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-emerald-100">
                        <div className="bg-emerald-50/90 p-1 px-1.5 rounded border border-emerald-200/90 flex flex-col justify-center">
                          <span className="text-[7.5px] text-emerald-900/80 uppercase font-black tracking-wider block">META</span>
                          <strong className="font-mono text-emerald-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                            {l5Item.meta !== undefined && String(l5Item.meta).trim() !== '' ? String(l5Item.meta) : (l5Item.percentage !== undefined && l5Item.percentage > 0 ? `${l5Item.percentage}%` : '-')}
                          </strong>
                        </div>
                        <div className="bg-emerald-50/90 p-1 px-1.5 rounded border border-emerald-200/90 flex flex-col justify-center">
                          <span className="text-[7.5px] text-teal-900/80 uppercase font-black tracking-wider block">REAL</span>
                          <strong className="font-mono text-teal-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                            {l5Item.real !== undefined && String(l5Item.real).trim() !== '' ? String(l5Item.real) : (l5Item.value !== undefined && l5Item.value !== 0 ? String(l5Item.value) : '-')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 6: NÍVEL 6 (OPERAÇÃO / PROCESSOS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-purple-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">06</span>
                {treeData.levels.level6Title || 'NÍVEL 6 - OPERAÇÃO'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-purple-900/70 font-black uppercase tracking-wider">{l6Nodes.length} Sub-itens</span>
                {activeMode === 'manual' && activeL5Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 6,
                      levelTitle: treeData.levels.level6Title || 'NÍVEL 6 - OPERAÇÃO',
                      node: null,
                      parentId: activeL5Node.id
                    })}
                    className="p-0.5 rounded bg-purple-100 text-purple-900 hover:bg-purple-200"
                    title="Adicionar Nó no Nível 6"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-purple-300">
              {l6Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-purple-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-purple-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum nó cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um nó no Nível 5 para visualizar ou adicione um novo.</p>
                </div>
              ) : (
                l6Nodes.map((l6Item, l6Idx) => {
                  const isSelected = l6Item.id === selectedL6Id;
                  const parentTotal = activeL5Node ? activeL5Node.value : 1;
                  const sharePercent = l6Item.percentage !== undefined ? `${l6Item.percentage}%` : `${((l6Item.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                  const parentId = activeL5Node?.id;

                  const isDragging = draggedNode?.level === 6 && draggedNode?.id === l6Item.id;
                  const isDropTarget = dragOverTarget?.level === 6 && dragOverTarget?.index === l6Idx && !isDragging;

                  const subNodes = (treeData.nodes.level7 && treeData.nodes.level7[l6Item.id]) || [];
                  const subCount = subNodes.length;

                  return (
                    <div
                      key={`l6-card-${l6Item.id}-${l6Idx}`}
                      ref={el => { l6CardRefs.current[l6Item.id] = el; }}
                      draggable={activeMode === 'manual'}
                      onClick={() => {
                        cascadeSelectL6(l6Item.id);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', l6Item.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedNode({ level: 6, parentId, index: l6Idx, id: l6Item.id });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverTarget?.level !== 6 || dragOverTarget?.index !== l6Idx) {
                          setDragOverTarget({ level: 6, parentId, index: l6Idx });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget?.level === 6 && dragOverTarget?.index === l6Idx) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode.level === 6 && parentId) {
                          handleReorderNode(6, parentId, draggedNode.index, l6Idx);
                        }
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all space-y-1 relative overflow-hidden group cursor-pointer ${
                        isDragging 
                          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-purple-500 bg-purple-50/50' 
                          : isDropTarget
                            ? 'ring-2 ring-purple-500/80 ring-offset-1 border-2 border-purple-600 scale-[1.01]'
                            : isSelected
                              ? 'border-2 border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-400/50 scale-[1.01]'
                              : 'border border-purple-200 hover:border-purple-400 hover:bg-purple-50/30'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="relative z-10 flex items-center justify-between border-b border-purple-100 pb-1">
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                          <h4 className="text-[8.5px] sm:text-[9px] font-bold text-slate-900 break-words whitespace-normal leading-tight" title={l6Item.label}>
                            {l6Item.label}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="flex items-center gap-1 text-[7px] font-bold text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded-full border border-purple-300 shadow-2xs">
                            {sharePercent}
                          </span>

                          {/* Movement & Edit Toolbar */}
                          {activeMode === 'manual' && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={l6Idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeUp(6, parentId, l6Idx);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l6Idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-purple-700 hover:bg-purple-100 cursor-pointer'
                                }`}
                                title="Mover para cima (↑)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={l6Idx === l6Nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeDown(6, parentId, l6Idx, l6Nodes.length);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  l6Idx === l6Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-purple-700 hover:bg-purple-100 cursor-pointer'
                                }`}
                                title="Mover para baixo (↓)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <div 
                                className="p-0.5 text-slate-400 hover:text-purple-700 hover:bg-purple-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                                title="Arrastar e soltar nó"
                              >
                                <GripVertical className="w-2.5 h-2.5" />
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditNodeModal({
                                    isOpen: true,
                                    levelNumber: 6,
                                    levelTitle: treeData.levels.level6Title || 'NÍVEL 6 - OPERAÇÃO',
                                    node: l6Item,
                                    parentId: parentId,
                                    availableParents: (l5Nodes.length > 0 ? l5Nodes : Object.values(treeData.nodes.level5).flat()).map(n => ({ id: n.id, label: n.label }))
                                  });
                                }}
                                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                                title="Editar Nó / Trocar Ramo"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Deseja realmente excluir o card "${l6Item.label}"?`)) {
                                    handleDeleteNode(l6Item.id, 6);
                                  }
                                }}
                                className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                                title="Excluir Card"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2-Column Grid: META and REAL */}
                      <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-purple-100">
                        <div className="bg-purple-50/90 p-1 px-1.5 rounded border border-purple-200/90 flex flex-col justify-center">
                          <span className="text-[7.5px] text-purple-900/80 uppercase font-black tracking-wider block">META</span>
                          <strong className="font-mono text-purple-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                            {l6Item.meta !== undefined && String(l6Item.meta).trim() !== '' ? String(l6Item.meta) : (l6Item.percentage !== undefined && l6Item.percentage > 0 ? `${l6Item.percentage}%` : '-')}
                          </strong>
                        </div>
                        <div className="bg-emerald-50/90 p-1 px-1.5 rounded border border-emerald-200/90 flex flex-col justify-center">
                          <span className="text-[7.5px] text-emerald-900/80 uppercase font-black tracking-wider block">REAL</span>
                          <strong className="font-mono text-emerald-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                            {l6Item.real !== undefined && String(l6Item.real).trim() !== '' ? String(l6Item.real) : (l6Item.value !== undefined && l6Item.value !== 0 ? String(l6Item.value) : '-')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 7: NÍVEL 7 (ITENS / SKUS / APONTAMENTOS)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase text-rose-950 tracking-wider flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-700 text-white flex items-center justify-center text-[8px] font-mono shadow-xs">07</span>
                {treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[8.5px] text-rose-900/70 font-black uppercase tracking-wider">{l7Nodes.length} Itens</span>
                {activeMode === 'manual' && activeL6Node && (
                  <button
                    onClick={() => setEditNodeModal({
                      isOpen: true,
                      levelNumber: 7,
                      levelTitle: treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS',
                      node: null,
                      parentId: activeL6Node.id
                    })}
                    className="p-0.5 rounded bg-rose-100 text-rose-900 hover:bg-rose-200"
                    title="Adicionar Item no Nível 7"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5 max-h-[calc(100vh-230px)] min-h-[220px] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-rose-300">
              {l7Nodes.length === 0 ? (
                <div className="p-3 py-4 text-center bg-white/95 border border-rose-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1">
                  <Box className="w-4 h-4 text-rose-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700 text-[10px]">Nenhum item cadastrado</p>
                  <p className="text-[8.5px] text-slate-400">Selecione um nó no Nível 6 ou adicione um novo SKU.</p>
                </div>
              ) : (
                l7Nodes.map((prod, pIdx) => {
                  const isExpanded = !!expandedProducts[prod.id];
                  const parentTotal = activeL6Node ? activeL6Node.value : 1;
                  const sharePercent = prod.percentage !== undefined ? `${prod.percentage}%` : `${((prod.value / (parentTotal || 1)) * 100).toFixed(1)}%`;
                  const parentId = activeL6Node?.id;

                  const isDragging = draggedNode?.level === 7 && draggedNode?.id === prod.id;
                  const isDropTarget = dragOverTarget?.level === 7 && dragOverTarget?.index === pIdx && !isDragging;

                  const rankNumber = pIdx + 1;
                  const rankBadgeClass = 
                    rankNumber === 1 ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black shadow-xs ring-1 ring-amber-400' :
                    rankNumber === 2 ? 'bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-900 font-black' :
                    rankNumber === 3 ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-black' :
                    'bg-slate-100 text-slate-700 font-bold';

                  const rowsCount = prod.records?.length || 0;
                  const unitAvg = prod.unitPrice !== undefined ? prod.unitPrice : (prod.volume && prod.volume > 0 ? prod.value / prod.volume : 0);

                  return (
                    <div
                      key={`l7-card-${prod.id}-${pIdx}`}
                      ref={el => { l7CardRefs.current[prod.id] = el; }}
                      draggable={activeMode === 'manual'}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', prod.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggedNode({ level: 7, parentId, index: pIdx, id: prod.id });
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverTarget?.level !== 7 || dragOverTarget?.index !== pIdx) {
                          setDragOverTarget({ level: 7, parentId, index: pIdx });
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverTarget?.level === 7 && dragOverTarget?.index === pIdx) {
                          setDragOverTarget(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedNode && draggedNode.level === 7 && parentId) {
                          handleReorderNode(7, parentId, draggedNode.index, pIdx);
                        }
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      onDragEnd={() => {
                        setDraggedNode(null);
                        setDragOverTarget(null);
                      }}
                      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all space-y-1 relative overflow-hidden group ${
                        isDragging 
                          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-rose-500 bg-rose-50/50' 
                          : isDropTarget
                            ? 'ring-2 ring-rose-500/80 ring-offset-1 border-2 border-rose-600 scale-[1.01]'
                            : 'border border-rose-200 hover:border-rose-400 hover:shadow-xs'
                      }`}
                    >
                      {/* Header Row */}
                      <div className="relative z-10 flex items-center justify-between border-b border-rose-100 pb-1">
                        <div className="flex-1 min-w-0 flex items-center gap-1">
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[7.5px] shrink-0 ${rankBadgeClass}`}>
                            #{rankNumber}
                          </span>
                          <span className="text-[8px] font-black uppercase tracking-wider text-rose-950 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300 break-words whitespace-normal leading-tight">
                            {prod.skuCode ? `SKU #${prod.skuCode}` : prod.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <span className="flex items-center gap-1 text-[7px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded-full border border-rose-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {sharePercent}
                          </span>

                          {/* Movement & Edit Toolbar */}
                          {activeMode === 'manual' && (
                            <div className="flex items-center gap-0.5 ml-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                              <button
                                type="button"
                                disabled={pIdx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeUp(7, parentId, pIdx);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  pIdx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer'
                                }`}
                                title="Mover para cima (↑)"
                              >
                                <ArrowUp className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                disabled={pIdx === l7Nodes.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveNodeDown(7, parentId, pIdx, l7Nodes.length);
                                }}
                                className={`p-0.5 rounded transition-colors ${
                                  pIdx === l7Nodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-rose-700 hover:bg-rose-100 cursor-pointer'
                                }`}
                                title="Mover para baixo (↓)"
                              >
                                <ArrowDown className="w-2.5 h-2.5" />
                              </button>
                              <div 
                                className="p-0.5 text-slate-400 hover:text-rose-700 hover:bg-rose-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                                title="Arrastar e soltar item"
                              >
                                <GripVertical className="w-2.5 h-2.5" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setEditNodeModal({
                                  isOpen: true,
                                  levelNumber: 7,
                                  levelTitle: treeData.levels.level7Title || 'NÍVEL 7 - ITENS / SKUS',
                                  node: prod,
                                  parentId: parentId,
                                  availableParents: (l6Nodes.length > 0 ? l6Nodes : Object.values(treeData.nodes.level6 || {}).flat()).map(n => ({ id: n.id, label: n.label }))
                                })}
                                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                                title="Editar Item / Trocar Ramo"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Deseja realmente excluir o card "${prod.label}"?`)) {
                                    handleDeleteNode(prod.id, 7);
                                  }
                                }}
                                className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                                title="Excluir Card"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2-Column Grid: META and REAL */}
                      <div className="relative z-10 grid grid-cols-2 gap-1 pt-1 border-t border-rose-100">
                        <div className="bg-rose-50/90 p-1 px-1.5 rounded border border-rose-200/90 flex flex-col justify-center">
                          <span className="text-[7.5px] text-rose-900/80 uppercase font-black tracking-wider block">META</span>
                          <strong className="font-mono text-rose-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                            {prod.meta !== undefined && String(prod.meta).trim() !== '' ? String(prod.meta) : (prod.percentage !== undefined && prod.percentage > 0 ? `${prod.percentage}%` : '-')}
                          </strong>
                        </div>
                        <div className="bg-emerald-50/90 p-1 px-1.5 rounded border border-emerald-200/90 flex flex-col justify-center">
                          <span className="text-[7.5px] text-emerald-900/80 uppercase font-black tracking-wider block">REAL</span>
                          <strong className="font-mono text-emerald-950 text-[10px] font-black block truncate leading-tight mt-0.5">
                            {prod.real !== undefined && String(prod.real).trim() !== '' ? String(prod.real) : (prod.value !== undefined && prod.value !== 0 ? String(prod.value) : '-')}
                          </strong>
                        </div>
                      </div>

                      {/* ACCORDION BUTTON FOR INDIVIDUAL RECORDS */}
                      {rowsCount > 0 && (
                        <>
                          <button
                            onClick={() => toggleProductExpansion(prod.id)}
                            className="w-full py-0.5 px-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-950 text-[8px] font-bold flex items-center justify-between transition-all cursor-pointer border border-blue-200"
                          >
                            <span>{rowsCount} apontamentos</span>
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform text-blue-600 ${isExpanded ? 'rotate-180 text-rose-600' : ''}`} />
                          </button>

                          {isExpanded && (
                            <div className="pt-1 border-t border-rose-100 space-y-1 max-h-32 overflow-y-auto pr-0.5 text-[8px] font-mono scrollbar-thin scrollbar-thumb-rose-300">
                              {prod.records && prod.records.map((row, idx) => (
                                <div key={`row-${row.id || idx}-${idx}`} className="p-1 bg-rose-50/70 rounded border border-rose-200 space-y-0.5">
                                  <div className="flex items-center justify-between text-slate-700">
                                    <span>{row.dataISO || 'Data Recente'}</span>
                                    <span className="font-bold text-blue-800">{row.motivo || 'REGISTRO'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-800">
                                    <span>Resp: {row.responsavel || 'Operação'}</span>
                                    <strong className="text-emerald-700 font-bold">{row.quantidade} un • {treeData.currencySymbol} {row.valorTotal.toFixed(2)}</strong>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
        )}
      </div>

      {/* ── BOTTOM FOOTER: LEGENDA & CONTROLES (EXATAMENTE CONFORME A FOTO) ── */}
      <TreeFooter
        layoutMode={layoutMode}
        onToggleLayoutMode={() => {
          setLayoutMode(prev => prev === 'free' ? 'columns' : 'free');
          setTimeout(calculateConnectors, 100);
        }}
        onResetPositions={handleResetPositions}
        onAddClick={() => {
          if (activeL3Node) {
            setEditNodeModal({
              isOpen: true,
              levelNumber: 4,
              levelTitle: treeData.levels.level4Title,
              node: null,
              parentId: activeL3Node.id
            });
          } else if (activeL2Node) {
            setEditNodeModal({
              isOpen: true,
              levelNumber: 3,
              levelTitle: treeData.levels.level3Title,
              node: null,
              parentId: activeL2Node.id
            });
          } else {
            setEditNodeModal({
              isOpen: true,
              levelNumber: 2,
              levelTitle: treeData.levels.level2Title,
              node: null
            });
          }
        }}
        onEditClick={() => {
          if (activeL4Node) {
            setEditNodeModal({
              isOpen: true,
              levelNumber: 4,
              levelTitle: treeData.levels.level4Title,
              node: activeL4Node,
              parentId: activeL3Node?.id
            });
          } else if (activeL3Node) {
            setEditNodeModal({
              isOpen: true,
              levelNumber: 3,
              levelTitle: treeData.levels.level3Title,
              node: activeL3Node,
              parentId: activeL2Node?.id
            });
          } else if (activeL2Node) {
            setEditNodeModal({
              isOpen: true,
              levelNumber: 2,
              levelTitle: treeData.levels.level2Title,
              node: activeL2Node
            });
          }
        }}
        onSettingsClick={() => setIsSettingsModalOpen(true)}
      />

      {/* ── MODALS FOR MANUAL EDITING & TREE MANAGEMENT ── */}
      <ManualNodeEditModal
        isOpen={editNodeModal.isOpen}
        onClose={() => setEditNodeModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveNode}
        onDelete={handleDeleteNode}
        levelNumber={editNodeModal.levelNumber}
        levelTitle={editNodeModal.levelTitle}
        node={editNodeModal.node}
        currencySymbol={treeData.currencySymbol}
        unitName={treeData.unitName}
        availableParents={editNodeModal.availableParents}
        currentParentId={editNodeModal.parentId}
        onMoveParent={handleMoveNodeToParent}
      />

      <ManualTreeSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        trees={customTrees}
        activeTreeId={activeTreeId}
        onSelectTree={(id) => {
          handleSelectTree(id);
          setActiveMode('manual');
        }}
        onSaveTree={async (updatedTree) => {
          const nextTrees = customTrees.map(t => t.id === updatedTree.id ? updatedTree : t);
          setCustomTrees(nextTrees);
          try {
            const json = JSON.stringify(nextTrees);
            localStorage.setItem(`custom_kpi_trees_${companyId}`, json);
            localStorage.setItem('custom_kpi_trees_v3', json);
            lastSavedJsonRef.current = json;
            await firestoreDb.create('kpi_trees', updatedTree, companyId, updatedTree.id);
            setSaveSuccess(true);
            setSaveToast('Configurações da árvore salvas no Firebase!');
            setTimeout(() => {
              setSaveSuccess(false);
              setSaveToast('');
            }, 3000);
          } catch (e) {
            console.error('Error saving tree settings to Firestore:', e);
          }
        }}
        onDeleteTree={async (id) => {
          if (customTrees.length <= 1) {
            alert('Não é possível excluir a única árvore disponível.');
            return;
          }
          if (window.confirm('Tem certeza que deseja excluir esta árvore de KPI permanentemente do banco de dados?')) {
            try {
              await firestoreDb.delete('kpi_trees', id, companyId);
            } catch (e) {
              console.error('Error deleting tree from Firestore:', e);
            }
            const remaining = customTrees.filter(t => t.id !== id);
            setCustomTrees(remaining);
            if (activeTreeId === id) {
              handleSelectTree(remaining[0]?.id || DEFAULT_OFFICIAL_KPI_TREE.id);
            }
            try {
              const json = JSON.stringify(remaining);
              localStorage.setItem(`custom_kpi_trees_${companyId}`, json);
              localStorage.setItem('custom_kpi_trees_v3', json);
              lastSavedJsonRef.current = json;
            } catch {}
          }
        }}
        onCloneOfficial={handleCloneOfficial}
        onCreateNewBlank={handleCreateNewBlank}
      />
    </div>
  );

  return isFullscreen ? createPortal(mainContent, document.body) : mainContent;
}
