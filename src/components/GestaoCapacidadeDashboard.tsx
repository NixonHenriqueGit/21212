import { ManualInstrucaoCard } from './ManualInstrucaoCard';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Warehouse, 
  Layers, 
  Upload, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Sparkle,
  ArrowRight, 
  BarChart3, 
  PieChart, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  Box, 
  RotateCcw,
  BookOpen,
  Map,
  Grid,
  Download,
  Image as ImageIcon,
  Check,
  Snowflake,
  Boxes,
  HelpCircle,
  LayoutDashboard,
  BarChart2,
  Sliders,
  Maximize2,
  Edit3,
  Save,
  CheckCircle,
  X,
  Info,
  Eye,
  Truck,
  ExternalLink,
  Tag,
  Database,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Usuario, Empresa } from '../types';
import { PosicaoPallet021101Item } from '../types/estoque';
import { 
  getPosicaoPallet021101Itens, 
  savePosicaoPallet021101Itens, 
  getCapacityAreaMetas, 
  saveCapacityAreaMetas, 
  AreaMetasConfig,
  DEFAULT_AREA_FACTORS
} from '../utils/estoqueStorage';
import { processPosicaoPallet021101Import, isCleaningProduct } from '../utils/estoqueParsers';
import { PRODUCTS } from '../planosData';
import * as XLSX from 'xlsx';
import { 
  getProductMeta, 
  getProductUnit, 
  PRODUCT_CATALOG_DETAILS, 
  recalculatePosicaoPalletItem,
  calculateOccupiedPalletPositions,
  isSmallFractionalOrConfectioneryProduct,
  getProductOfficialDescription,
  getMarketplaceGroup,
  calculateMarketplaceConsolidatedPositions,
  MarketplaceGroupSummary,
  isMarketplaceProduct,
  isBarrilChopp,
  saveCustomSkuOverride,
  getCustomSkuOverrides
} from '../utils/productCatalogData';
import { PadraoOperacionalModal } from './PadraoOperacionalModal';
import { IndicatorActionModal } from './IndicatorActionModal';
import PoliticaEstoqueDashboard from './PoliticaEstoqueDashboard';
import CurvaAbcTrimestralTab from './CurvaAbcTrimestralTab';
import MatrizAbcLogisticaPanel from './MatrizAbcLogisticaPanel';
import { LayoutPanZoomViewer } from './LayoutPanZoomViewer';
import { getMediaItem, setMediaItem, removeMediaItem } from '../utils/idbStorage';
import { QuadroAcoesDpo } from './QuadroAcoesDpo';
import { gerarRelatorioCompletoLogisticaPDF } from '../utils/pdfExportUtils';


// Storage Area Capacity Limits from specifications
export const AREA_CAPACITIES = {
  CENTRAL: 615,
  PICKING: 160,
  MARKETPLACE: 84,
  CONTINGENCIA: 108,
  PULMAO: 140,
  PNC: 9,
  LIMPEZA: 35
};

export interface InventoryItem {
  cod: string;
  descricao: string;
  fator: number;
  valor: number;
  fatorHecto: number;
  quantCentral: number;
  quantPicking: number;
  quantMarketplace: number;
  quantContingencia: number;
}

// Initial catalog provided in CSV text
const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  { cod: '347', descricao: 'SUKITA PET 1L CAIXA C/12', fator: 12, valor: 30.48, fatorHecto: 0.12, quantCentral: 40, quantPicking: 15, quantMarketplace: 8, quantContingencia: 0 },
  { cod: '503', descricao: 'SUKITA PET 2L CAIXA C/6', fator: 6, valor: 19.45, fatorHecto: 0.12, quantCentral: 35, quantPicking: 10, quantMarketplace: 5, quantContingencia: 0 },
  { cod: '504', descricao: 'PEPSI COLA PET 2L CAIXA C/6', fator: 6, valor: 26.97, fatorHecto: 0.12, quantCentral: 50, quantPicking: 18, quantMarketplace: 12, quantContingencia: 0 },
  { cod: '620', descricao: 'CARACU LONG NECK 355ML SIX-PACK BANDEJA C/4', fator: 24, valor: 78.20, fatorHecto: 0.09, quantCentral: 15, quantPicking: 5, quantMarketplace: 4, quantContingencia: 0 },
  { cod: '982', descricao: 'SKOL 600ML', fator: 12, valor: 53.35, fatorHecto: 0.07, quantCentral: 65, quantPicking: 22, quantMarketplace: 10, quantContingencia: 0 },
  { cod: '988', descricao: 'BRAHMA CHOPP 600ML', fator: 12, valor: 52.23, fatorHecto: 0.07, quantCentral: 70, quantPicking: 25, quantMarketplace: 12, quantContingencia: 0 },
  { cod: '1114', descricao: 'GUARANA CHP ANTARCTICA PET 3,3 L SH C/04', fator: 4, valor: 27.55, fatorHecto: 0.13, quantCentral: 20, quantPicking: 8, quantMarketplace: 4, quantContingencia: 0 },
  { cod: '1695', descricao: 'BRAHMA CHOPP GFA VD 1L COM TTC', fator: 12, valor: 59.89, fatorHecto: 0.12, quantCentral: 45, quantPicking: 15, quantMarketplace: 8, quantContingencia: 0 },
  { cod: '2319', descricao: 'GUARANA CHP ANTARCTICA PET 1L CAIXA C/12', fator: 12, valor: 34.22, fatorHecto: 0.12, quantCentral: 30, quantPicking: 12, quantMarketplace: 6, quantContingencia: 0 },
  { cod: '2546', descricao: 'ORIGINAL 600ML', fator: 12, valor: 61.02, fatorHecto: 0.07, quantCentral: 55, quantPicking: 20, quantMarketplace: 10, quantContingencia: 0 },
  { cod: '9067', descricao: 'ANTARCTICA PILSEN LATA 350ML SH C/12 NPAL', fator: 12, valor: 28.95, fatorHecto: 0.04, quantCentral: 80, quantPicking: 28, quantMarketplace: 14, quantContingencia: 0 },
  { cod: '9068', descricao: 'SKOL LATA 350ML SH C/12 NPAL', fator: 12, valor: 28.52, fatorHecto: 0.04, quantCentral: 90, quantPicking: 30, quantMarketplace: 15, quantContingencia: 0 },
  { cod: '9069', descricao: 'BRAHMA CHOPP LATA 350ML SH C/12 NPAL', fator: 12, valor: 28.51, fatorHecto: 0.04, quantCentral: 85, quantPicking: 26, quantMarketplace: 12, quantContingencia: 0 },
  { cod: '18836', descricao: 'CORONA EXTRA N LONG NECK 330ML CX C/24 NPAL', fator: 24, valor: 118.01, fatorHecto: 0.08, quantCentral: 40, quantPicking: 12, quantMarketplace: 8, quantContingencia: 0 },
  { cod: '20329', descricao: 'BRAHMA CHOPP 600ML', fator: 12, valor: 54.69, fatorHecto: 0.07, quantCentral: 60, quantPicking: 18, quantMarketplace: 9, quantContingencia: 0 },
  { cod: '23186', descricao: 'SPATEN N 600ML', fator: 12, valor: 60.57, fatorHecto: 0.07, quantCentral: 50, quantPicking: 16, quantMarketplace: 7, quantContingencia: 0 },
  { cod: '35331', descricao: 'BUDWEISER GFA VD 1L', fator: 12, valor: 65.61, fatorHecto: 0.12, quantCentral: 30, quantPicking: 10, quantMarketplace: 5, quantContingencia: 0 }
];

// Pau Brasil Correlation Matrix Locations (20 items)
export const MATRIX_LOCATIONS = [
  'ESTOQUE CENTRAL - A',
  'ESTOQUE CENTRAL - B',
  'ESTOQUE CENTRAL - C',
  'PICKING',
  'PNC',
  'DEVOLUÇÃO',
  'ADM - SALA DE CONFERENCIA',
  'REPACK',
  'MARKT PLACE',
  'ESTACIONAMENTO EMPILHADEIRA',
  'ESTACIONAMENTO PALETEIRAS/CARRINHO',
  'PIT STOP',
  'RED ZONE',
  'RETORNO DE ROTA',
  'REFUGO',
  'AMARRAÇÃO',
  'ESTACIONAMENTO',
  'DESPEJO',
  'RESIDUOS/ MATERIAS RECICLAVEIS',
  'BANHEIROS'
];

// Reference matrix values from Pau Brasil template screenshot
export const DEFAULT_CORRELATION_MATRIX: string[][] = [
  /* A */  ['X','8','8','10','3','5','1','8','8','1','1','1','8','3','3','1','1','5','1','1'],
  /* B */  ['8','X','8','10','3','5','1','8','8','1','1','1','8','3','3','1','1','5','1','1'],
  /* C */  ['8','8','X','10','3','5','1','8','8','1','1','1','8','3','3','1','1','5','1','1'],
  /* PICKING */ ['10','10','10','X','5','3','1','8','8','1','1','1','10','8','1','1','1','1','1','1'],
  /* PNC */ ['5','5','5','8','X','8','1','1','1','1','1','1','8','10','8','5','1','10','1','1'],
  /* DEVOL */ ['8','8','8','8','10','X','1','1','1','1','5','1','8','10','8','5','1','8','1','1'],
  /* ADM */ ['8','8','8','8','8','8','X','8','8','1','1','1','1','5','5','5','1','1','1','1'],
  /* REPACK */ ['10','10','10','10','3','3','8','X','8','1','1','1','1','1','1','1','1','1','1','1'],
  /* MARKT */ ['8','8','8','8','8','3','5','3','X','1','1','1','1','1','1','1','1','1','1','1'],
  /* ESTAC EMP */ ['1','1','1','1','1','1','1','1','1','X','1','10','8','8','8','1','1','1','1','1'],
  /* ESTAC PAL */ ['1','1','1','8','1','1','1','5','1','1','X','5','8','8','8','5','1','8','8','1'],
  /* PIT STOP */ ['1','1','1','1','1','1','1','1','1','1','1','X','10','5','5','1','1','1','1','1'],
  /* RED ZONE */ ['1','1','1','1','1','1','1','1','1','10','8','10','X','8','8','1','1','1','5','1'],
  /* RET ROTA */ ['5','5','5','5','8','8','1','1','1','8','8','1','8','X','10','5','1','5','5','1'],
  /* REFUGO */ ['5','5','5','5','8','8','1','1','1','8','8','1','8','10','X','5','1','5','5','1'],
  /* AMARRAÇÃO */ ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','X','1','1','1','1'],
  /* ESTACIONAMENTO */ ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','X','1','1','1'],
  /* DESPEJO */ ['1','1','1','1','8','8','1','1','1','1','8','1','1','8','8','1','1','X','8','1'],
  /* RESIDUOS */ ['1','1','1','1','8','8','1','1','1','1','8','1','1','8','8','1','1','10','X','1'],
  /* BANHEIROS */ ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','X']
];

interface GestaoCapacidadeProps {
  user: Usuario;
  empresa: Empresa | null;
  theme?: 'light' | 'dark';
  initialTab?: 'governanca-visual' | 'capacidade-instalada' | 'politica-estoque' | 'curva-abc-030519' | 'matriz-abc-logistica' | 'acoes';
  onBack?: () => void;
  onNavigate?: (panel: string, options?: any) => void;
}

export default function GestaoCapacidadeDashboard({
  user,
  empresa,
  theme = 'light',
  initialTab = 'governanca-visual',
  onBack,
  onNavigate
}: GestaoCapacidadeProps) {
  // Master Tab State for ETAPA 15 Unification + Curva ABC + Matriz ABC Logistica + Ações DPO
  const [activeMasterTab, setActiveMasterTab] = useState<'governanca-visual' | 'capacidade-instalada' | 'politica-estoque' | 'curva-abc-030519' | 'matriz-abc-logistica' | 'acoes'>(initialTab as any);

  // Sub-section for Governança Visual
  const [govSection, setGovSection] = useState<'layout' | 'matriz' | 'zonas'>('layout');

  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('af_capacity_inventory_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INVENTORY_ITEMS;
  });

  // Correlation Matrix State
  const [matrixData, setMatrixData] = useState<string[][]>(() => {
    try {
      const saved = localStorage.getItem('af_correlation_matrix_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CORRELATION_MATRIX;
  });

  // Layout Image Upload State
  const [layoutImage, setLayoutImage] = useState<string | null>(() => {
    return localStorage.getItem('af_warehouse_layout_img') || null;
  });

  useEffect(() => {
    getMediaItem('af_warehouse_layout_img').then((img) => {
      if (img) setLayoutImage(img);
    });
  }, []);

  // Layout Layout Positions Table
  const [layoutPositions, setLayoutPositions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('af_warehouse_positions_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: '1', rua: 'RUA 01', bloco: 'BLOCO A', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Central', cap: 2, ocup: 2, sku: '982 - SKOL 600ML', status: 'Ocupado' },
      { id: '2', rua: 'RUA 01', bloco: 'BLOCO A', nivel: 'NIVEL 1', pos: 'POS 02', zona: 'Central', cap: 2, ocup: 1, sku: '988 - BRAHMA CHOPP 600ML', status: 'Parcial' },
      { id: '3', rua: 'RUA 02', bloco: 'BLOCO B', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Picking', cap: 1, ocup: 1, sku: '9068 - SKOL LATA 350ML', status: 'Ocupado' },
      { id: '4', rua: 'RUA 03', bloco: 'BLOCO C', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Marketplace', cap: 1, ocup: 0, sku: 'Vazio', status: 'Livre' },
      { id: '5', rua: 'RUA 04', bloco: 'BLOCO D', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Pulmão', cap: 2, ocup: 2, sku: '18836 - CORONA EXTRA', status: 'Ocupado' },
      { id: '6', rua: 'RUA 05', bloco: 'BLOCO E', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Zona de Ativos', cap: 10, ocup: 8, sku: 'Paletes PBR Madeira', status: 'Normal' },
      { id: '7', rua: 'RUA 06', bloco: 'BLOCO F', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'PNC', cap: 2, ocup: 1, sku: 'Avaria Segregada', status: 'Segregado' },
      { id: '8', rua: 'RUA 07', bloco: 'BLOCO G', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Repack', cap: 2, ocup: 2, sku: 'Recuperação de Pack', status: 'Em Processo' },
      { id: '9', rua: 'RUA 08', bloco: 'BLOCO H', nivel: 'NIVEL 1', pos: 'POS 01', zona: 'Limpeza', cap: 2, ocup: 1, sku: '33061 - YPÊ TIXAN LAVA ROUPAS', status: 'Ocupado' },
    ];
  });

  const [displayMode, setDisplayMode] = useState<'paletes' | 'hectolitros'>('paletes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTargetArea, setSelectedTargetArea] = useState<'ALL' | 'CENTRAL' | 'PICKING' | 'MARKETPLACE' | 'CONTINGENCIA' | 'PULMAO' | 'PNC' | 'LIMPEZA'>('ALL');
  const [skuSortField, setSkuSortField] = useState<'posicoes' | 'caixas' | 'pallets' | 'lastros' | 'hectolitros' | 'codigo' | 'produto' | 'area'>('posicoes');
  const [skuSortDirection, setSkuSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isPopOpen, setIsPopOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [showOfficialLayoutModal, setShowOfficialLayoutModal] = useState(false);
  const [lastUploadInfo, setLastUploadInfo] = useState<string | null>(null);

  // 02.11.01 Posição Pallet State & Area Metas
  const [posicaoPalletItems, setPosicaoPalletItems] = useState<PosicaoPallet021101Item[]>(() => {
    const raw = getPosicaoPallet021101Itens();
    const companyId = empresa?.id || 'demo';
    return raw.map(item => recalculatePosicaoPalletItem(item, companyId));
  });
  const [areaMetas, setAreaMetas] = useState<AreaMetasConfig>(() => getCapacityAreaMetas());
  const [editingMetas, setEditingMetas] = useState(false);
  const [tempMetas, setTempMetas] = useState<AreaMetasConfig>(() => getCapacityAreaMetas());
  const [showUnmappedModal, setShowUnmappedModal] = useState(false);

  // Sync listener: whenever products or capacity data are updated anywhere, recalculate and update smoothly (debounced)
  useEffect(() => {
    let timeoutId: any = null;

    const handleProductRefresh = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentItems = getPosicaoPallet021101Itens();
        const companyId = empresa?.id || 'demo';
        const recalculated = (currentItems || [])
          .filter(item => !isBarrilChopp(item.codigo, item.produto))
          .map(item => recalculatePosicaoPalletItem(item, companyId));
        setPosicaoPalletItems(recalculated);
        setAreaMetas(getCapacityAreaMetas());
      }, 120);
    };

    const events = [
      'local_data_changed',
      'produtos_updated',
      'posicao_pallet_updated',
      'estoque_updated',
      'app_data_updated',
      'venda_media_imported',
      'vendaMedia030519Updated',
      'storage'
    ];

    events.forEach(evt => window.addEventListener(evt, handleProductRefresh));

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, handleProductRefresh));
    };
  }, [empresa?.id]);

  // Quick SKU Edit & Palletization Modal State
  const [showSkuEditModal, setShowSkuEditModal] = useState(false);
  const [editingSkuData, setEditingSkuData] = useState<{
    codigo: number;
    produto: string;
    fatorCx: number;
    caixasPallet: number;
    lastro: number;
    camadas: number;
    fatorHecto: number;
    grupo: string;
    valorUnitario: number;
    areaId: number;
  }>({
    codigo: 0,
    produto: '',
    fatorCx: 1,
    caixasPallet: 50,
    lastro: 10,
    camadas: 5,
    fatorHecto: 0,
    grupo: 'Cervejas',
    valorUnitario: 0,
    areaId: 1
  });

  const handleOpenQuickEdit = (item: PosicaoPallet021101Item | { codigo: number | string; produto?: string; areaId?: number }) => {
    const codeNum = Number(item.codigo);
    const companyId = empresa?.id || 'demo';
    const meta = getProductMeta(codeNum, companyId);
    const catalogItem = PRODUCTS.find(p => Number(p.codigo) === codeNum) as any;
    const officialDesc = getProductOfficialDescription(codeNum, item.produto || catalogItem?.descricao || `SKU ${codeNum}`, companyId);

    const fatorCx = meta.fator || 1;
    const caixasPallet = meta.fatorPallet || 50;
    const lastro = meta.lastro || Math.max(1, Math.round(caixasPallet / (meta.camadas || 5)));
    const camadas = meta.camadas || Math.max(1, Math.round(caixasPallet / (lastro || 1)));
    const rawFatorHecto = (item as PosicaoPallet021101Item).fatorHecto ?? meta.fatorHecto ?? 0;
    const grupo = meta.grupo || (isCleaningProduct(codeNum, officialDesc) ? 'Produtos de Limpeza' : (isMarketplaceProduct(codeNum, officialDesc) ? 'MARKETPLACE' : 'CERVEJA'));
    const valor = meta.preco || 0;
    
    let areaId = item.areaId || 1;
    if (isCleaningProduct(codeNum, officialDesc, grupo)) {
      areaId = 7;
    } else if (isMarketplaceProduct(codeNum, officialDesc, grupo)) {
      areaId = 3;
    }

    setEditingSkuData({
      codigo: codeNum,
      produto: officialDesc,
      fatorCx,
      caixasPallet,
      lastro,
      camadas,
      fatorHecto: rawFatorHecto,
      grupo,
      valorUnitario: valor,
      areaId
    });
    setShowSkuEditModal(true);
  };

  const handleOpenCadastro = (skuCodigo?: number | string) => {
    if (skuCodigo) {
      sessionStorage.setItem('filtro_produto_codigo', String(skuCodigo));
    }
    if (onNavigate) {
      onNavigate('cadastros', { subTab: 'produtos' });
    } else {
      window.dispatchEvent(new CustomEvent('navigate_panel', { detail: { panel: 'cadastros', subTab: 'produtos' } }));
    }
  };

  const handleSaveSkuQuickEdit = (formData: typeof editingSkuData) => {
    const codeNum = formData.codigo;
    const companyId = empresa?.id || 'demo';
    
    // 1. Permanently save to Custom SKU Overrides (Never lost on refresh, remix or re-import)
    saveCustomSkuOverride({
      codigo: codeNum,
      produto: formData.produto,
      fatorCx: Number(formData.fatorCx) || 1,
      caixasPallet: Number(formData.caixasPallet) || 50,
      fatorPallet: Number(formData.caixasPallet) || 50,
      lastro: Number(formData.lastro) || 10,
      camadas: Number(formData.camadas) || 5,
      fatorHecto: Number(formData.fatorHecto) || 0,
      grupo: formData.grupo,
      valorUnitario: Number(formData.valorUnitario) || 0,
      preco: Number(formData.valorUnitario) || 0,
      areaId: formData.areaId,
      areaNome: formData.areaId === 1 ? 'Armazém Central' :
                formData.areaId === 2 ? 'Picking' :
                formData.areaId === 3 ? 'Marketplace' :
                formData.areaId === 4 ? 'Contingência' :
                formData.areaId === 5 ? 'Pulmão' :
                formData.areaId === 6 ? 'PNC' : 'Produtos de Limpeza'
    });

    // 2. Update in-memory product details
    if (PRODUCT_CATALOG_DETAILS[codeNum]) {
      PRODUCT_CATALOG_DETAILS[codeNum].fator = Number(formData.fatorCx) || 1;
      PRODUCT_CATALOG_DETAILS[codeNum].fatorPallet = Number(formData.caixasPallet) || 50;
      PRODUCT_CATALOG_DETAILS[codeNum].caixasPallet = Number(formData.caixasPallet) || 50;
      PRODUCT_CATALOG_DETAILS[codeNum].fatorHecto = Number(formData.fatorHecto) || 0;
      PRODUCT_CATALOG_DETAILS[codeNum].lastro = Number(formData.lastro) || 10;
      PRODUCT_CATALOG_DETAILS[codeNum].camadas = Number(formData.camadas) || 5;
      PRODUCT_CATALOG_DETAILS[codeNum].preco = Number(formData.valorUnitario) || 0;
      PRODUCT_CATALOG_DETAILS[codeNum].grupo = formData.grupo;
    } else {
      PRODUCT_CATALOG_DETAILS[codeNum] = {
        preco: Number(formData.valorUnitario) || 0,
        fator: Number(formData.fatorCx) || 1,
        fatorPallet: Number(formData.caixasPallet) || 50,
        caixasPallet: Number(formData.caixasPallet) || 50,
        fatorHecto: Number(formData.fatorHecto) || 0,
        lastro: Number(formData.lastro) || 10,
        camadas: Number(formData.camadas) || 5,
        grupo: formData.grupo,
        curva: 'B'
      };
    }
    
    const prodIndex = PRODUCTS.findIndex(p => Number(p.codigo) === codeNum);
    if (prodIndex >= 0) {
      const targetProd = PRODUCTS[prodIndex] as any;
      targetProd.descricao = formData.produto;
      targetProd.fator = Number(formData.fatorCx) || 1;
      targetProd.fatorHecto = Number(formData.fatorHecto) || 0;
      targetProd.fatorPallet = Number(formData.caixasPallet) || 50;
      targetProd.caixasPallet = Number(formData.caixasPallet) || 50;
      targetProd.lastro = Number(formData.lastro) || 10;
      targetProd.camadas = Number(formData.camadas) || 5;
      targetProd.preco = Number(formData.valorUnitario) || 0;
      targetProd.valor = Number(formData.valorUnitario) || 0;
      targetProd.grupo = formData.grupo;
    }

    // 3. Persist to localStorage for products collection (Cadastro de Produtos) for active and demo
    ['produtos_' + companyId, 'produtos_demo'].forEach(prodKey => {
      try {
        const saved = localStorage.getItem(prodKey);
        let prodList: any[] = saved ? JSON.parse(saved) : [];
        if (prodList.length === 0) {
          prodList = PRODUCTS.map((p: any) => ({
            id: `prod-${p.codigo}`,
            codigo: String(p.codigo),
            descricao: p.descricao,
            fator: Number(p.fator) || 1,
            fatorPallet: Number(p.fatorPallet) || Number(p.caixasPallet) || 50,
            caixasPallet: Number(p.caixasPallet) || Number(p.fatorPallet) || 50,
            lastro: Number(p.lastro) || 10,
            camadas: Number(p.camadas) || 5,
            fatorHecto: Number(p.fatorHecto) || 0,
            valor: Number(p.preco) || Number(p.valor) || 0,
            preco: Number(p.preco) || Number(p.valor) || 0,
            grupo: p.grupo || 'CERVEJA',
            curva: p.curva || 'B',
            empresaId: companyId
          }));
        }

        const idx = prodList.findIndex((p: any) => Number(p.codigo) === codeNum);
        const updatedProd = {
          id: idx >= 0 ? prodList[idx].id : `prod-${codeNum}`,
          codigo: String(codeNum),
          descricao: formData.produto,
          fator: Number(formData.fatorCx) || 1,
          fatorPallet: Number(formData.caixasPallet) || 50,
          caixasPallet: Number(formData.caixasPallet) || 50,
          lastro: Number(formData.lastro) || 10,
          camadas: Number(formData.camadas) || 5,
          fatorHecto: Number(formData.fatorHecto) || 0,
          valor: Number(formData.valorUnitario) || 0,
          preco: Number(formData.valorUnitario) || 0,
          grupo: formData.grupo,
          empresaId: companyId,
          atualizadoEm: new Date().toISOString()
        };
        if (idx >= 0) {
          prodList[idx] = { ...prodList[idx], ...updatedProd };
        } else {
          prodList.unshift(updatedProd);
        }
        localStorage.setItem(prodKey, JSON.stringify(prodList));
        localStorage.removeItem(`produtos_cleared_${companyId}`);
      } catch (e) {
        console.error('Erro ao salvar produto no localStorage:', e);
      }
    });

    // 4. Update active 02.11.01 items and recalculate Pallets, Lastros, and HL
    setPosicaoPalletItems(prevItems => {
      const updated = prevItems.map(item => {
        if (Number(item.codigo) === codeNum) {
          const fatorPallet = Number(formData.caixasPallet) || 50;
          const totalCaixas = Number(item.qtdFisicaCaixas || (item.qtdPallet * fatorPallet));
          const lastro = Number(formData.lastro) || Math.max(1, Math.round(fatorPallet / (Number(formData.camadas) || 5)));
          
          let newAreaId = item.areaId;
          let newAreaNome = item.areaNome;
          
          if (formData.areaId) {
            newAreaId = formData.areaId;
            newAreaNome = formData.areaId === 1 ? 'Armazém Central' :
                          formData.areaId === 2 ? 'Picking' :
                          formData.areaId === 3 ? 'Marketplace' :
                          formData.areaId === 4 ? 'Contingência' :
                          formData.areaId === 5 ? 'Pulmão' :
                          formData.areaId === 6 ? 'PNC' : 'Produtos de Limpeza';
          } else if (isCleaningProduct(codeNum, formData.produto, formData.grupo)) {
            newAreaId = 7;
            newAreaNome = 'Produtos de Limpeza';
          }

          const calc = calculateOccupiedPalletPositions(
            totalCaixas,
            fatorPallet,
            lastro,
            codeNum,
            formData.produto,
            formData.grupo || '',
            newAreaId
          );
          const newHl = Math.round((totalCaixas * Number(formData.fatorHecto)) * 1000) / 1000;

          return {
            ...item,
            produto: formData.produto,
            qtdFisicaCaixas: totalCaixas,
            qtdPallet: calc.palletsCompletos,
            qtdLastro: calc.lastrosCalculados,
            posicoesPalletOcupadas: calc.posicoesOcupadas,
            isFracionadoSemPosicao: calc.isFracionadoSemPosicao,
            fatorHecto: Number(formData.fatorHecto) || 0,
            temFatorHecto: Number(formData.fatorHecto) > 0,
            hectolitros: newHl,
            areaId: newAreaId,
            areaNome: newAreaNome
          };
        }
        return item;
      });
      savePosicaoPallet021101Itens(updated);
      return updated;
    });

    // 5. Update inventory state if present
    setInventory(prevInv => {
      return prevInv.map(inv => {
        if (Number(inv.cod) === codeNum) {
          return {
            ...inv,
            descricao: formData.produto,
            fator: Number(formData.fatorCx) || 1,
            fatorHecto: Number(formData.fatorHecto) || 0,
            valor: Number(formData.valorUnitario) || 0
          };
        }
        return inv;
      });
    });

    window.dispatchEvent(new CustomEvent('produtos_updated', { detail: { codigo: codeNum } }));
    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('storage'));
    setLastUploadInfo(`✅ SKU ${codeNum} configurado permanentemente! Palletização: ${formData.caixasPallet} cx, Lastro: ${formData.lastro} cx, Fator HE: ${formData.fatorHecto}.`);
    setShowSkuEditModal(false);
  };

  const handlePosicaoPalletImport = (e: React.ChangeEvent<HTMLInputElement>, isMerge: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileNameLower = file.name.toLowerCase();
      const isExcel = fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls');

      if (isExcel) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const csvText = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
            
            const companyId = empresa?.id || 'demo';
            const res = processPosicaoPallet021101Import(csvText, file.name, user.nome || 'Operador', companyId, isMerge);
            if (res.success && res.parsedItems) {
              setPosicaoPalletItems(res.parsedItems);
              setLastUploadInfo(res.message);
              setAreaMetas(getCapacityAreaMetas());
            } else {
              alert(res.message || 'Erro ao processar relatório 02.11.01.');
            }
          } catch (err: any) {
            console.error('Erro ao ler arquivo Excel 02.11.01:', err);
            alert('Falha ao processar arquivo Excel da 02.11.01: ' + (err?.message || 'Arquivo inválido'));
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          if (!text) return;
          const companyId = empresa?.id || 'demo';
          const res = processPosicaoPallet021101Import(text, file.name, user.nome || 'Operador', companyId, isMerge);
          if (res.success && res.parsedItems) {
            setPosicaoPalletItems(res.parsedItems);
            setLastUploadInfo(res.message);
            setAreaMetas(getCapacityAreaMetas());
          } else {
            alert(res.message || 'Erro ao processar relatório 02.11.01.');
          }
        };
        reader.readAsText(file, 'ISO-8859-1');
      }
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const handleSaveMetas = () => {
    setAreaMetas(tempMetas);
    saveCapacityAreaMetas(tempMetas);
    setEditingMetas(false);
    setLastUploadInfo('Metas de Capacidade atualizadas e salvas com sucesso!');
  };

  const handleDownload021101Template = () => {
    const csv = `Area;Codigo;Produto;Setor;Lote;Validade;Fornecedor;Fabricacao;Vencimento;QtdCaixas;QtdPallet;QtdLastro\n` +
      `1;9067;ANTARCTICA PILSEN LATA 350ML;Cerveja;L01;2026-12-31;Ambev;2026-01-01;2026-12-31;480;10;0\n` +
      `1;982;SKOL 600ML;Cerveja;L02;2026-12-31;Ambev;2026-01-01;2026-12-31;360;8;0\n` +
      `2;9068;SKOL LATA 350ML;Cerveja;L03;2026-12-31;Ambev;2026-01-01;2026-12-31;50;0;4\n` +
      `3;18836;CORONA EXTRA 330ML;Cerveja;L04;2026-12-31;Ambev;2026-01-01;2026-12-31;40;1;0\n` +
      `4;35331;BUDWEISER 1L;Cerveja;L05;2026-12-31;Ambev;2026-01-01;2026-12-31;60;2;0\n`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Modelo_Importacao_02.11.01_Posicao_Pallet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  useEffect(() => {
    try {
      localStorage.setItem('af_capacity_inventory_v1', JSON.stringify(inventory));
    } catch (e) {
      console.error(e);
    }
  }, [inventory]);

  useEffect(() => {
    try {
      localStorage.setItem('af_correlation_matrix_v1', JSON.stringify(matrixData));
    } catch (e) {
      console.error(e);
    }
  }, [matrixData]);

  useEffect(() => {
    try {
      localStorage.setItem('af_warehouse_positions_v1', JSON.stringify(layoutPositions));
    } catch (e) {
      console.error(e);
    }
  }, [layoutPositions]);

  // Handle Layout Image Upload
  const handleLayoutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setLayoutImage(result);
          setMediaItem('af_warehouse_layout_img', result);
          setLastUploadInfo(`Imagem de layout atualizada com sucesso (${file.name})`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Download Layout Excel/CSV Model
  const handleDownloadLayoutTemplate = () => {
    const csvContent = `RUA;BLOCO;NIVEL;POSICAO;ZONA;CAPACIDADE_PALETES;OCUPACAO_SKU;SKU_ALOCADO;STATUS\n` +
      `RUA 01;BLOCO A;NIVEL 1;POS 01;Central;2;2;982 - SKOL 600ML;Ocupado\n` +
      `RUA 01;BLOCO A;NIVEL 1;POS 02;Central;2;1;988 - BRAHMA CHOPP 600ML;Parcial\n` +
      `RUA 02;BLOCO B;NIVEL 1;POS 01;Picking;1;1;9068 - SKOL LATA 350ML;Ocupado\n` +
      `RUA 03;BLOCO C;NIVEL 1;POS 01;Marketplace;1;0;Vazio;Livre\n` +
      `RUA 04;BLOCO D;NIVEL 1;POS 01;Pulmão;2;2;18836 - CORONA EXTRA;Ocupado\n` +
      `RUA 05;BLOCO E;NIVEL 1;POS 01;Zona de Ativos;10;8;Paletes PBR Madeira;Normal\n` +
      `RUA 06;BLOCO F;NIVEL 1;POS 01;PNC;2;1;Avaria Segregada;Segregado\n` +
      `RUA 07;BLOCO G;NIVEL 1;POS 01;Repack;2;2;Recuperação de Pack;Em Processo\n`;
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Modelo_Layout_Armazem_Guarabira.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload Layout CSV
  const handleLayoutCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split('\n');
        const parsed: any[] = [];
        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('rua')) return;
          const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 5) {
            parsed.push({
              id: String(idx),
              rua: cols[0] || `RUA ${idx}`,
              bloco: cols[1] || 'BLOCO A',
              nivel: cols[2] || 'NIVEL 1',
              pos: cols[3] || `POS ${idx}`,
              zona: cols[4] || 'Central',
              cap: parseInt(cols[5] || '2', 10) || 2,
              ocup: parseInt(cols[6] || '0', 10) || 0,
              sku: cols[7] || 'Vazio',
              status: cols[8] || 'Normal'
            });
          }
        });
        if (parsed.length > 0) {
          setLayoutPositions(parsed);
          setLastUploadInfo(`Layout do Armazém importado com sucesso: ${parsed.length} posições atualizadas.`);
        }
      };
      reader.readAsText(file, 'ISO-8859-1');
    }
  };

  // Download Correlation Matrix Template
  const handleDownloadMatrixTemplate = () => {
    let csv = 'AREAS;' + MATRIX_LOCATIONS.join(';') + '\n';
    MATRIX_LOCATIONS.forEach((rowName, rIdx) => {
      const rowVals = MATRIX_LOCATIONS.map((_, cIdx) => matrixData[rIdx]?.[cIdx] ?? '1');
      csv += `${rowName};${rowVals.join(';')}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Matriz_de_Correlacao_PauBrasil.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload Correlation Matrix CSV
  const handleMatrixCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split('\n');
        const newMatrix: string[][] = [];
        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('areas')) return;
          const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2) {
            const vals = cols.slice(1, 21);
            if (vals.length > 0) {
              newMatrix.push(vals);
            }
          }
        });
        if (newMatrix.length === 20) {
          setMatrixData(newMatrix);
          setLastUploadInfo('Matriz de Correlação atualizada via arquivo CSV.');
        } else {
          alert('Arquivo importado contém divergência de colunas. Certifique-se de importar o modelo com 20 áreas.');
        }
      };
      reader.readAsText(file, 'ISO-8859-1');
    }
  };

  // Aggregate totals per area
  const rawTotals = useMemo(() => {
    let central = 0;
    let picking = 0;
    let marketplace = 0;
    let contingencia = 0;

    let centralHl = 0;
    let pickingHl = 0;
    let marketplaceHl = 0;
    let contingenciaHl = 0;

    inventory.forEach(item => {
      central += item.quantCentral;
      picking += item.quantPicking;
      marketplace += item.quantMarketplace;
      contingencia += item.quantContingencia;

      centralHl += item.quantCentral * item.fatorHecto;
      pickingHl += item.quantPicking * item.fatorHecto;
      marketplaceHl += item.quantMarketplace * item.fatorHecto;
      contingenciaHl += item.quantContingencia * item.fatorHecto;
    });

    return {
      central,
      picking,
      marketplace,
      contingencia,
      centralHl,
      pickingHl,
      marketplaceHl,
      contingenciaHl
    };
  }, [inventory]);

  // Capacity calculations with 100% threshold
  const capacityAnalysis = useMemo(() => {
    const centralOverflow = Math.max(0, rawTotals.central - AREA_CAPACITIES.CENTRAL);
    const pickingOverflow = Math.max(0, rawTotals.picking - AREA_CAPACITIES.PICKING);
    const marketplaceOverflow = Math.max(0, rawTotals.marketplace - AREA_CAPACITIES.MARKETPLACE);

    const totalOverflowToContingency = centralOverflow + pickingOverflow + marketplaceOverflow;

    const actualCentral = Math.min(rawTotals.central, AREA_CAPACITIES.CENTRAL);
    const actualPicking = Math.min(rawTotals.picking, AREA_CAPACITIES.PICKING);
    const actualMarketplace = Math.min(rawTotals.marketplace, AREA_CAPACITIES.MARKETPLACE);
    const actualContingencia = rawTotals.contingencia + totalOverflowToContingency;

    const centralPct = Math.min(100, (rawTotals.central / AREA_CAPACITIES.CENTRAL) * 100);
    const pickingPct = Math.min(100, (rawTotals.picking / AREA_CAPACITIES.PICKING) * 100);
    const marketplacePct = Math.min(100, (rawTotals.marketplace / AREA_CAPACITIES.MARKETPLACE) * 100);
    const contingenciaPct = Math.min(100, (actualContingencia / AREA_CAPACITIES.CONTINGENCIA) * 100);

    return {
      actualCentral,
      actualPicking,
      actualMarketplace,
      actualContingencia,
      centralPct,
      pickingPct,
      marketplacePct,
      contingenciaPct,
      centralOverflow,
      pickingOverflow,
      marketplaceOverflow,
      totalOverflowToContingency
    };
  }, [rawTotals]);

  // Marketplace consolidated grouping logic (Halls, Trident, Azeite, Doces Vieira, Tang, etc.)
  // As required: Items of same group are summed together; if < 1 lastro = 0 pos; if >= 1 lastro = 1 shared pos
  const marketplaceConsolidation = useMemo(() => {
    const companyId = empresa?.id || 'demo';
    return calculateMarketplaceConsolidatedPositions(posicaoPalletItems, companyId);
  }, [posicaoPalletItems, empresa?.id]);

  // Calculate operational HL/pallet ratio per area from current 02.11.01 import
  const areaRealFactors = useMemo(() => {
    let centralPallets = 0, centralHl = 0;
    let pickingPallets = 0, pickingHl = 0;
    let mpPallets = marketplaceConsolidation.totalMarketplacePallets;
    let mpHl = marketplaceConsolidation.totalMarketplaceHl;
    let contingenciaPallets = 0, contingenciaHl = 0;
    let pulmaoPallets = 0, pulmaoHl = 0;
    let pncPallets = 0, pncHl = 0;
    let limpezaPallets = 0, limpezaHl = 0;

    const companyId = empresa?.id || 'demo';

    posicaoPalletItems.forEach(item => {
      const codeNum = Number(item.codigo);
      const meta = getProductMeta(codeNum, companyId);
      const catalogItem = PRODUCTS.find(p => Number(p.codigo) === codeNum);
      const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : 50;
      const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / (meta.camadas || 5)));
      const temFatorHecto = meta.fatorHecto !== undefined && meta.fatorHecto > 0;
      const fatorHecto = temFatorHecto ? meta.fatorHecto : 0;

      let totalQtd = Number(item.qtdFisicaCaixas || 0);
      if (totalQtd === 0 && item.qtdPallet > 0) {
        totalQtd = item.qtdPallet * fatorPallet;
      }
      
      const isLimpeza = item.areaId === 7 || (isCleaningProduct(codeNum, item.produto, meta.grupo || catalogItem?.grupo) && item.areaId !== 1 && item.areaId !== 2 && item.areaId !== 3 && item.areaId !== 4 && item.areaId !== 5 && item.areaId !== 6);
      const effectiveAreaId = isLimpeza ? 7 : item.areaId;

      // Area 3 (Marketplace) is handled via marketplaceConsolidation
      if (effectiveAreaId === 3) return;

      const calc = calculateOccupiedPalletPositions(
        totalQtd,
        fatorPallet,
        lastro,
        codeNum,
        item.produto,
        meta.grupo || catalogItem?.grupo,
        effectiveAreaId
      );
      const posicoesPallet = calc.posicoesOcupadas;
      const itemHl = temFatorHecto ? Math.round((totalQtd * fatorHecto) * 1000) / 1000 : 0;

      if (effectiveAreaId === 1) { centralPallets += posicoesPallet; centralHl += itemHl; }
      else if (effectiveAreaId === 2) { pickingPallets += posicoesPallet; pickingHl += itemHl; }
      else if (effectiveAreaId === 4) { contingenciaPallets += posicoesPallet; contingenciaHl += itemHl; }
      else if (effectiveAreaId === 5) { pulmaoPallets += posicoesPallet; pulmaoHl += itemHl; }
      else if (effectiveAreaId === 6) { pncPallets += posicoesPallet; pncHl += itemHl; }
      else if (effectiveAreaId === 7) { limpezaPallets += posicoesPallet; limpezaHl += itemHl; }
    });

    return {
      1: centralPallets > 0 ? (centralHl / centralPallets) : DEFAULT_AREA_FACTORS[1],
      2: pickingPallets > 0 ? (pickingHl / pickingPallets) : DEFAULT_AREA_FACTORS[2],
      3: mpPallets > 0 ? (mpHl / mpPallets) : DEFAULT_AREA_FACTORS[3],
      4: contingenciaPallets > 0 ? (contingenciaHl / contingenciaPallets) : DEFAULT_AREA_FACTORS[4],
      5: pulmaoPallets > 0 ? (pulmaoHl / pulmaoPallets) : DEFAULT_AREA_FACTORS[5],
      6: pncPallets > 0 ? (pncHl / pncPallets) : DEFAULT_AREA_FACTORS[6],
      7: limpezaPallets > 0 ? (limpezaHl / limpezaPallets) : (DEFAULT_AREA_FACTORS[7] || 1.5),
    };
  }, [posicaoPalletItems, empresa?.id, marketplaceConsolidation]);

  // Track items in 02.11.01 that do not have Fator Hecto in catalog
  const unmappedFatorHectoItems = useMemo(() => {
    const companyId = empresa?.id || 'demo';
    return posicaoPalletItems.filter(item => {
      const codeNum = Number(item.codigo);
      const meta = getProductMeta(codeNum, companyId);
      return meta.fatorHecto === undefined || meta.fatorHecto <= 0;
    });
  }, [posicaoPalletItems, empresa?.id]);

  const handleSyncMetasHlWithReal = () => {
    const newMetas: AreaMetasConfig = {
      1: { ...areaMetas[1], hectolitrosMeta: Math.round((areaMetas[1]?.palletsMeta || 615) * (areaRealFactors[1] || 8.5) * 10) / 10 },
      2: { ...areaMetas[2], hectolitrosMeta: Math.round((areaMetas[2]?.palletsMeta || 160) * (areaRealFactors[2] || 5.8) * 10) / 10 },
      3: { ...areaMetas[3], hectolitrosMeta: Math.round((areaMetas[3]?.palletsMeta || 84) * (areaRealFactors[3] || 2.5) * 10) / 10 },
      4: { ...areaMetas[4], hectolitrosMeta: Math.round((areaMetas[4]?.palletsMeta || 108) * (areaRealFactors[4] || 7.5) * 10) / 10 },
      5: { ...areaMetas[5], hectolitrosMeta: Math.round((areaMetas[5]?.palletsMeta || 140) * (areaRealFactors[5] || 8.5) * 10) / 10 },
      6: { ...areaMetas[6], hectolitrosMeta: Math.round((areaMetas[6]?.palletsMeta || 9) * (areaRealFactors[6] || 6.0) * 10) / 10 },
      7: { ...(areaMetas[7] || { palletsMeta: 35, hectolitrosMeta: 0 }), hectolitrosMeta: Math.round((areaMetas[7]?.palletsMeta || 35) * (areaRealFactors[7] || 1.5) * 10) / 10 },
    };
    setAreaMetas(newMetas);
    setTempMetas(newMetas);
    saveCapacityAreaMetas(newMetas);
    setLastUploadInfo('Metas em Hectolitros sincronizadas com o mix real de cada área!');
  };

  // Posicao Pallet 02.11.01 Area Metrics & Goals
  const posMetricsByArea = useMemo(() => {
    let centralPallets = 0, centralHl = 0;
    let pickingPallets = 0, pickingHl = 0;
    let mpPallets = marketplaceConsolidation.totalMarketplacePallets;
    let mpHl = marketplaceConsolidation.totalMarketplaceHl;
    let contingenciaPallets = 0, contingenciaHl = 0;
    let pulmaoPallets = 0, pulmaoHl = 0;
    let pncPallets = 0, pncHl = 0;
    let limpezaPallets = 0, limpezaHl = 0;

    const companyId = empresa?.id || 'demo';

    if (posicaoPalletItems.length > 0) {
      posicaoPalletItems.forEach(item => {
        const codeNum = Number(item.codigo);
        const meta = getProductMeta(codeNum, companyId);
        const catalogItem = PRODUCTS.find(p => Number(p.codigo) === codeNum);
        const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : 50;
        const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / (meta.camadas || 5)));
        const temFatorHecto = meta.fatorHecto !== undefined && meta.fatorHecto > 0;
        const fatorHecto = temFatorHecto ? meta.fatorHecto : 0;

        let totalQtd = Number(item.qtdFisicaCaixas || 0);
        if (totalQtd === 0 && item.qtdPallet > 0) {
          totalQtd = item.qtdPallet * fatorPallet;
        }

        const isLimpeza = item.areaId === 7 || (isCleaningProduct(codeNum, item.produto, meta.grupo || catalogItem?.grupo) && item.areaId !== 1 && item.areaId !== 2 && item.areaId !== 3 && item.areaId !== 4 && item.areaId !== 5 && item.areaId !== 6);
        const effectiveAreaId = isLimpeza ? 7 : item.areaId;

        // Area 3 (Marketplace) is handled via marketplaceConsolidation
        if (effectiveAreaId === 3) return;

        const calc = calculateOccupiedPalletPositions(
          totalQtd,
          fatorPallet,
          lastro,
          codeNum,
          item.produto,
          meta.grupo || catalogItem?.grupo,
          effectiveAreaId
        );
        const posicoesPallet = calc.posicoesOcupadas;
        const itemHl = temFatorHecto ? Math.round((totalQtd * fatorHecto) * 1000) / 1000 : 0;

        if (effectiveAreaId === 1) {
          centralPallets += posicoesPallet;
          centralHl += itemHl;
        } else if (effectiveAreaId === 2) {
          pickingPallets += posicoesPallet;
          pickingHl += itemHl;
        } else if (effectiveAreaId === 4) {
          contingenciaPallets += posicoesPallet;
          contingenciaHl += itemHl;
        } else if (effectiveAreaId === 5) {
          pulmaoPallets += posicoesPallet;
          pulmaoHl += itemHl;
        } else if (effectiveAreaId === 6) {
          pncPallets += posicoesPallet;
          pncHl += itemHl;
        } else if (effectiveAreaId === 7) {
          limpezaPallets += posicoesPallet;
          limpezaHl += itemHl;
        }
      });
    } else {
      centralPallets = Math.min(rawTotals.central, AREA_CAPACITIES.CENTRAL);
      centralHl = rawTotals.centralHl;
      pickingPallets = Math.min(rawTotals.picking, AREA_CAPACITIES.PICKING);
      pickingHl = rawTotals.pickingHl;
      mpPallets = Math.min(rawTotals.marketplace, AREA_CAPACITIES.MARKETPLACE);
      mpHl = rawTotals.marketplaceHl;
      contingenciaPallets = rawTotals.contingencia;
      contingenciaHl = rawTotals.contingenciaHl;
      pulmaoPallets = 0;
      pulmaoHl = 0;
      pncPallets = 0;
      pncHl = 0;
      limpezaPallets = 0;
      limpezaHl = 0;
    }

    const areas = [1, 2, 3, 4, 5, 6, 7].map(id => {
      const areaKey = id as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      const palletsReal = id === 1 ? centralPallets : id === 2 ? pickingPallets : id === 3 ? mpPallets : id === 4 ? contingenciaPallets : id === 5 ? pulmaoPallets : id === 6 ? pncPallets : limpezaPallets;
      const hlReal = id === 1 ? centralHl : id === 2 ? pickingHl : id === 3 ? mpHl : id === 4 ? contingenciaHl : id === 5 ? pulmaoHl : id === 6 ? pncHl : limpezaHl;
      const palletsMeta = areaMetas[areaKey]?.palletsMeta ?? (id === 5 ? 140 : id === 6 ? 9 : id === 7 ? 35 : 100);
      const hlMeta = areaMetas[areaKey]?.hectolitrosMeta ?? (palletsMeta * (DEFAULT_AREA_FACTORS[areaKey] || 7.5));

      const palletsPct = palletsMeta > 0 ? (palletsReal / palletsMeta) * 100 : 0;
      const hlPct = hlMeta > 0 ? (hlReal / hlMeta) * 100 : 0;

      // Consistency validation between Meta HL/Pallet and Real HL/Pallet
      const razaoMeta = palletsMeta > 0 ? hlMeta / palletsMeta : 0;
      const razaoReal = palletsReal > 0 ? hlReal / palletsReal : (areaRealFactors[areaKey] || DEFAULT_AREA_FACTORS[areaKey] || 7.5);
      const desvioPct = (razaoReal > 0 && razaoMeta > 0) ? (Math.abs(razaoMeta - razaoReal) / razaoReal) * 100 : 0;
      const isMetaDesatualizada = desvioPct > 30 && id !== 7;

      const areaInfo: Record<number, { nome: string; shortName: string }> = {
        1: { nome: '1 - Armazém Central', shortName: 'Central' },
        2: { nome: '2 - Picking', shortName: 'Picking' },
        3: { nome: '3 - Marketplace', shortName: 'Marketplace' },
        4: { nome: '4 - Contingência', shortName: 'Contingência' },
        5: { nome: '5 - Pulmão', shortName: 'Pulmão' },
        6: { nome: '6 - PNC', shortName: 'PNC' },
        7: { nome: '7 - Produtos de Limpeza', shortName: 'Limpeza' }
      };

      return {
        id,
        nome: areaInfo[id].nome,
        shortName: areaInfo[id].shortName,
        palletsMeta,
        palletsReal,
        palletsPct,
        hlMeta,
        hlReal,
        hlPct,
        razaoMeta,
        razaoReal,
        desvioPct,
        isMetaDesatualizada
      };
    });

    const totalPalletsMeta = (areaMetas[1]?.palletsMeta || 615) + (areaMetas[2]?.palletsMeta || 160) + (areaMetas[3]?.palletsMeta || 84) + (areaMetas[4]?.palletsMeta || 108) + (areaMetas[5]?.palletsMeta || 140) + (areaMetas[6]?.palletsMeta || 9) + (areaMetas[7]?.palletsMeta || 35);
    const totalPalletsReal = centralPallets + pickingPallets + mpPallets + contingenciaPallets + pulmaoPallets + pncPallets + limpezaPallets;
    const totalHlMeta = (areaMetas[1]?.hectolitrosMeta || 0) + (areaMetas[2]?.hectolitrosMeta || 0) + (areaMetas[3]?.hectolitrosMeta || 0) + (areaMetas[4]?.hectolitrosMeta || 0) + (areaMetas[5]?.hectolitrosMeta || 0) + (areaMetas[6]?.hectolitrosMeta || 0) + (areaMetas[7]?.hectolitrosMeta || 0);
    const totalHlReal = centralHl + pickingHl + mpHl + contingenciaHl + pulmaoHl + pncHl + limpezaHl;

    return {
      hasImport: posicaoPalletItems.length > 0,
      areas,
      total: {
        nome: 'Total Armazém',
        palletsMeta: totalPalletsMeta,
        palletsReal: totalPalletsReal,
        palletsPct: totalPalletsMeta > 0 ? (totalPalletsReal / totalPalletsMeta) * 100 : 0,
        hlMeta: totalHlMeta,
        hlReal: totalHlReal,
        hlPct: totalHlMeta > 0 ? (totalHlReal / totalHlMeta) * 100 : 0
      }
    };
  }, [posicaoPalletItems, areaMetas, rawTotals, areaRealFactors]);

  // Pre-calculated & Sorted 02.11.01 SKU List (Default: Highest Pallet Occupancy First -> Decrescente)
  const sortedPosicaoPalletItems = useMemo(() => {
    const companyId = empresa?.id || 'demo';

    const processed = posicaoPalletItems
      .filter(item => {
        const codeNum = Number(item.codigo);
        const isLimpeza = item.areaId === 7 || (isCleaningProduct(codeNum, item.produto) && item.areaId !== 1 && item.areaId !== 2 && item.areaId !== 3 && item.areaId !== 4 && item.areaId !== 5 && item.areaId !== 6);
        const effectiveAreaId = isLimpeza ? 7 : item.areaId;

        if (selectedTargetArea === 'CENTRAL' && effectiveAreaId !== 1) return false;
        if (selectedTargetArea === 'PICKING' && effectiveAreaId !== 2) return false;
        if (selectedTargetArea === 'MARKETPLACE' && effectiveAreaId !== 3) return false;
        if (selectedTargetArea === 'CONTINGENCIA' && effectiveAreaId !== 4) return false;
        if (selectedTargetArea === 'PULMAO' && effectiveAreaId !== 5) return false;
        if (selectedTargetArea === 'PNC' && effectiveAreaId !== 6) return false;
        if (selectedTargetArea === 'LIMPEZA' && effectiveAreaId !== 7) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const codStr = String(item.codigo || '');
          const prodStr = (item.produto || '').toLowerCase();
          return codStr.includes(q) || prodStr.includes(q);
        }
        return true;
      })
      .map((item, idx) => {
        const codeNum = Number(item.codigo);
        const meta = getProductMeta(codeNum, companyId);
        const catalogItem = PRODUCTS.find(p => Number(p.codigo) === codeNum);
        const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : 50;
        const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / (meta.camadas || 5)));
        const temFatorHecto = meta.fatorHecto !== undefined && meta.fatorHecto > 0;
        const fator = temFatorHecto ? meta.fatorHecto : 0;
        const officialDesc = getProductOfficialDescription(codeNum, item.produto, companyId);

        let totalQtd = Number(item.qtdFisicaCaixas || 0);
        if (totalQtd === 0 && item.qtdPallet > 0) {
          totalQtd = item.qtdPallet * fatorPallet;
        }

        const isLimpeza = item.areaId === 7 || (isCleaningProduct(codeNum, officialDesc, meta.grupo || catalogItem?.grupo) && item.areaId !== 1 && item.areaId !== 2 && item.areaId !== 3 && item.areaId !== 4 && item.areaId !== 5 && item.areaId !== 6);
        const effectiveAreaId = isLimpeza ? 7 : item.areaId;
        const isMarketplace = effectiveAreaId === 3 || isMarketplaceProduct(codeNum, officialDesc, meta.grupo || catalogItem?.grupo);
        const mpGroup = isMarketplace ? getMarketplaceGroup(codeNum, officialDesc, meta.grupo || catalogItem?.grupo) : undefined;

        const calc = calculateOccupiedPalletPositions(
          totalQtd,
          fatorPallet,
          lastro,
          codeNum,
          officialDesc,
          meta.grupo || catalogItem?.grupo,
          effectiveAreaId
        );

        const palletsCompletos = calc.palletsCompletos;
        const lastrosCalculados = calc.lastrosCalculados;
        const posicoesOcupadas = calc.posicoesOcupadas;
        const isFracionadoSemPos = calc.isFracionadoSemPosicao;
        const itemHl = temFatorHecto ? Math.round((totalQtd * fator) * 1000) / 1000 : 0;

        return {
          rawItem: item,
          idx,
          codigo: codeNum,
          officialDesc,
          meta,
          fatorPallet,
          lastro,
          temFatorHecto,
          fator,
          totalQtd,
          isLimpeza,
          effectiveAreaId,
          isMarketplace,
          mpGroup,
          palletsCompletos,
          lastrosCalculados,
          posicoesOcupadas,
          isFracionadoSemPos,
          itemHl
        };
      });

    // Ordenação (Padrão: Maior Ocupação de Posições Pallet Primeiro -> Decrescente)
    processed.sort((a, b) => {
      let comparison = 0;
      if (skuSortField === 'posicoes') {
        comparison = (b.posicoesOcupadas - a.posicoesOcupadas) || (b.totalQtd - a.totalQtd) || (b.itemHl - a.itemHl);
        return skuSortDirection === 'asc' ? -comparison : comparison;
      } else if (skuSortField === 'caixas') {
        comparison = (b.totalQtd - a.totalQtd);
        return skuSortDirection === 'asc' ? -comparison : comparison;
      } else if (skuSortField === 'pallets') {
        comparison = (b.palletsCompletos - a.palletsCompletos);
        return skuSortDirection === 'asc' ? -comparison : comparison;
      } else if (skuSortField === 'lastros') {
        comparison = (b.lastrosCalculados - a.lastrosCalculados);
        return skuSortDirection === 'asc' ? -comparison : comparison;
      } else if (skuSortField === 'hectolitros') {
        comparison = (b.itemHl - a.itemHl);
        return skuSortDirection === 'asc' ? -comparison : comparison;
      } else if (skuSortField === 'codigo') {
        comparison = a.codigo - b.codigo;
        return skuSortDirection === 'desc' ? -comparison : comparison;
      } else if (skuSortField === 'produto') {
        comparison = a.officialDesc.localeCompare(b.officialDesc);
        return skuSortDirection === 'desc' ? -comparison : comparison;
      } else if (skuSortField === 'area') {
        comparison = a.effectiveAreaId - b.effectiveAreaId;
        return skuSortDirection === 'desc' ? -comparison : comparison;
      }
      return (b.posicoesOcupadas - a.posicoesOcupadas) || (b.totalQtd - a.totalQtd);
    });

    return processed;
  }, [posicaoPalletItems, selectedTargetArea, searchQuery, skuSortField, skuSortDirection, empresa?.id]);

  // Item calculations
  const itemsCalculated = useMemo(() => {
    return inventory.map(item => {
      const totalQuant = item.quantCentral + item.quantPicking + item.quantMarketplace + item.quantContingencia;
      const totalHl = totalQuant * item.fatorHecto;
      return {
        ...item,
        totalQuant,
        totalHl
      };
    });
  }, [inventory]);

  // CSV Drag and Drop Handler for inventory
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newItems: InventoryItem[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('cod')) return;
        const cols = line.split(';').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 2) {
          const cod = cols[0] || String(index + 1);
          const desc = cols[1] || `Produto ${cod}`;
          const fator = parseFloat(cols[2] || '12') || 12;
          
          let valorStr = (cols[3] || '25').replace('R$', '').replace('.', '').replace(',', '.').trim();
          const valor = parseFloat(valorStr) || 25;

          let hectoStr = (cols[4] || '0.05').replace(',', '.').trim();
          const fatorHecto = parseFloat(hectoStr) || 0.05;

          const baseCount = Math.floor(Math.random() * 40) + 5;

          newItems.push({
            cod,
            descricao: desc,
            fator,
            valor,
            fatorHecto,
            quantCentral: baseCount,
            quantPicking: Math.floor(baseCount * 0.3),
            quantMarketplace: Math.floor(baseCount * 0.15),
            quantContingencia: 0
          });
        }
      });

      if (newItems.length > 0) {
        setInventory(newItems);
        setLastUploadInfo(`Estoque importado com sucesso: ${file.name} (${newItems.length} SKUs)`);
      }
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  const handleResetDefault = () => {
    setInventory(INITIAL_INVENTORY_ITEMS);
    localStorage.removeItem('af_capacity_inventory_v1');
    setLastUploadInfo('Estoque redefinido para o catálogo padrão.');
  };

  const filteredItems = useMemo(() => {
    return itemsCalculated.filter(item => {
      const matchesSearch = item.descricao.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.cod.includes(searchQuery);
      if (!matchesSearch) return false;

      if (selectedTargetArea === 'CENTRAL') return item.quantCentral > 0;
      if (selectedTargetArea === 'PICKING') return item.quantPicking > 0;
      if (selectedTargetArea === 'MARKETPLACE') return item.quantMarketplace > 0;
      if (selectedTargetArea === 'CONTINGENCIA') return item.quantContingencia > 0;
      return true;
    });
  }, [itemsCalculated, searchQuery, selectedTargetArea]);

  // Color helper for Correlation Matrix cell
  const getMatrixCellColor = (val: string) => {
    switch (val) {
      case '10':
        return 'bg-emerald-700 text-white font-black border-emerald-800'; // Quanto mais próximo, melhor
      case '8':
        return 'bg-emerald-500/80 text-white font-bold border-emerald-600'; // BOM ESTAR PRÓXIMO
      case '5':
        return 'bg-amber-400 text-slate-950 font-bold border-amber-500'; // INDIFERENTE
      case '3':
        return 'bg-orange-300 text-slate-900 font-bold border-orange-400'; // BOM ESTAR AFASTADO
      case '1':
        return 'bg-rose-500/80 text-white font-bold border-rose-600'; // QUANTO MAIS LONGE MELHOR
      case 'X':
        return 'bg-slate-900 text-slate-500 font-mono font-black border-slate-950'; // Diagonal
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className={`p-4 md:p-6 space-y-6 min-h-screen ${theme === 'dark' ? 'bg-[#0b1329] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* TOP HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#131d38] border border-gray-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
              Painel Unificado de Armazém
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              ETAPA 15 — Layout, Capacidade & Política de Estoque
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#032b5e] dark:text-white mt-1 flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-amber-500" />
            Gestão Unificada de Capacidade, Layout & Política de Estoque
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5">
            Governança visual integrada: Planta Baixa do Armazém, Matriz de Correlação Pau Brasil, Capacidade Instalada e Política de 6 Dias DPO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-exportar-relatorio-pdf-completo"
            onClick={() => {
              gerarRelatorioCompletoLogisticaPDF(
                empresa?.id || 'demo',
                empresa?.nome || 'CDD Guarabira',
                user?.nome || 'Gestor Logístico'
              );
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/40"
            title="Exportar Relatório Executivo Integrado em PDF (Capacidade, Política de Estoque e Matriz Logística)"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            Exportar Relatório (PDF)
          </button>

          <button
            onClick={() => setIsPopOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Padrão Operacional (POP)
          </button>

          <button
            onClick={() => setActiveMasterTab('acoes')}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-blue-400/30"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            Gerar Ações
          </button>

          {onBack && (
            <button
              onClick={onBack}
              className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {/* MASTER UNIFIED TAB NAVIGATION (ETAPA 15 REQUIREMENT) */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0b1222] p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button
          onClick={() => setActiveMasterTab('governanca-visual')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'governanca-visual'
              ? 'bg-[#032b5e] text-white border border-amber-500/50 shadow-md ring-2 ring-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Map className="w-4 h-4 text-amber-400" />
          1. Layout & Matriz
        </button>

        <button
          onClick={() => setActiveMasterTab('capacidade-instalada')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'capacidade-instalada'
              ? 'bg-[#032b5e] text-white border border-blue-500/50 shadow-md ring-2 ring-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-4 h-4 text-sky-400" />
          2. Capacidade
        </button>

        <button
          onClick={() => setActiveMasterTab('politica-estoque')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'politica-estoque'
              ? 'bg-[#032b5e] text-white border border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          3. Política 6 Dias
        </button>

        <button
          onClick={() => setActiveMasterTab('curva-abc-030519')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'curva-abc-030519'
              ? 'bg-[#032b5e] text-white border border-amber-500/50 shadow-md ring-2 ring-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-amber-400" />
          4. Curva ABC
        </button>

        <button
          onClick={() => setActiveMasterTab('matriz-abc-logistica')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'matriz-abc-logistica'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border border-blue-400 shadow-md ring-2 ring-blue-400/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          5. Matriz Logística
        </button>

        <button
          onClick={() => setActiveMasterTab('acoes')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
            activeMasterTab === 'acoes'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border border-blue-400 shadow-md ring-2 ring-blue-400/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          6. Ações DPO (Capacidade & Layout)
        </button>
      </div>

      {/* UPLOAD STATUS NOTIFICATION BANNER */}
      {lastUploadInfo && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" /> {lastUploadInfo}
          </span>
          <button onClick={() => setLastUploadInfo(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ── MASTER TAB 1: GOVERNANÇA VISUAL, LAYOUT & MATRIZ ── */}
      {activeMasterTab === 'governanca-visual' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* SUB-SECTIONS NAV FOR GOVERNANÇA VISUAL */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setGovSection('layout')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                govSection === 'layout'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-800/40'
              }`}
            >
              <Map className="w-4 h-4" /> (a) Layout do Armazém
            </button>

            <button
              onClick={() => setGovSection('matriz')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                govSection === 'matriz'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-800/40'
              }`}
            >
              <Grid className="w-4 h-4" /> (b) Matriz de Correlação
            </button>

            <button
              onClick={() => setGovSection('zonas')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                govSection === 'zonas'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-800/40'
              }`}
            >
              <Boxes className="w-4 h-4" /> (c) 7 Zonas de Armazenamento
            </button>
          </div>

          {/* SECTION A: LAYOUT DO ARMAZÉM */}
          {govSection === 'layout' && (
            <div className="space-y-6">
              
              {/* ACTION BUTTONS & MODEL DOWNLOAD */}
              <div className="bg-[#111a30] border border-blue-900/60 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Map className="w-5 h-5 text-amber-400" />
                    Planta Baixa & Mapeamento de Posições (Layout do Armazém de Guarabira)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Visualize o mapa estrutural da revenda, faça upload do arquivo visual atualizado e baixe o modelo de planilha Excel para associar cada rua, bloco e nível aos dados de ocupação.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* DOWNLOAD MODELO LAYOUT */}
                  <button
                    onClick={handleDownloadLayoutTemplate}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    Download Modelo Excel Layout (.csv)
                  </button>

                  {/* IMPORT LAYOUT EXCEL/CSV */}
                  <label className="px-4 py-2.5 bg-[#032b5e] hover:bg-blue-900 border border-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-sky-300" />
                    Importar Layout
                    <input
                      type="file"
                      accept=".csv, .txt"
                      onChange={handleLayoutCSVImport}
                      className="hidden"
                    />
                  </label>

                  {/* BOTÃO PARA EXIBIR IMAGEM DO LAYOUT GUARABIRA */}
                  <button
                    onClick={() => setShowOfficialLayoutModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-amber-500/20 cursor-pointer transition-all border border-amber-400/40"
                  >
                    <Eye className="w-4 h-4 text-slate-950" />
                    EXIBIR LAYOUT GUARABIRA
                  </button>

                  {/* UPLOAD IMAGEM PLANTA BAIXA */}
                  <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    Upload Nova Imagem
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLayoutImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* LAYOUT IMAGE PREVIEW & BLUEPRINT CANVAS WITH INTEGRATED LEGEND */}
              <div className="bg-[#131d38] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      PLANTA OFICIAL DA REVENDA
                    </span>
                    <h4 className="text-sm font-black uppercase text-white">Armazém de Guarabira — Planta de Layout, Capacidade & Sinalização (DPO)</h4>
                  </div>
                  {layoutImage && (
                    <button 
                      onClick={() => {
                        setLayoutImage(null);
                        removeMediaItem('af_warehouse_layout_img');
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 uppercase font-bold cursor-pointer"
                    >
                      Remover Imagem Personalizada
                    </button>
                  )}
                </div>

                {/* VISUAL BLUEPRINT CANVAS / MAP WITH PAN, ZOOM & MAXIMIZE */}
                <LayoutPanZoomViewer imageSrc={layoutImage} title="Armazém de Guarabira — Planta de Layout Interativa">
                  <div className="bg-[#091122] border border-slate-700 rounded-xl p-4 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Map className="w-5 h-5 text-amber-400" />
                        <h5 className="text-xs font-black uppercase text-white">Planta Estrutural do Armazém (Revenda Guarabira - PAU BRASIL)</h5>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        Capacidade Total: 967 Paletes
                      </span>
                    </div>

                    {/* INTERACTIVE VECTOR REPRESENTATION OF THE GUARABIRA LAYOUT BLUEPRINT */}
                    <div className="relative border-2 border-slate-700 rounded-xl bg-slate-950/80 p-4 overflow-x-auto text-xs min-w-[700px]">
                      
                      {/* TOP INFRASTRUCTURE ROW */}
                      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3 gap-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-center">
                            <span className="text-[9px] font-black text-emerald-400 uppercase block">RECICLÁVEL</span>
                            <span className="text-[8px] text-slate-400">Despejo & Coleta</span>
                          </div>
                          <div className="bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-lg text-center">
                            <span className="text-[9px] font-black text-amber-400 uppercase block">POSTO COMBUSTÍVEL</span>
                            <span className="text-[8px] text-slate-400">Abastecimento Frota</span>
                          </div>
                        </div>

                        {/* MARKETPLACE TOP ZONE */}
                        <div className="bg-blue-900/30 border border-blue-500/40 px-4 py-2 rounded-xl text-center">
                          <span className="text-[10px] font-black text-blue-300 uppercase block">MARKETPLACE / E-COMMERCE (84 PALETES)</span>
                          <span className="text-[9px] text-slate-400">Atendimento Ambev On e Fracionados</span>
                        </div>
                      </div>

                      {/* MAIN WAREHOUSE FLOORPLAN GRID */}
                      <div className="grid grid-cols-12 gap-3 my-2">
                        
                        {/* LEFT COLUMN: BLOCKS C (CURVA C - RED - 200 PALETES) */}
                        <div className="col-span-3 bg-rose-950/20 border-2 border-rose-500/40 rounded-xl p-2.5 space-y-2">
                          <div className="flex items-center justify-between border-b border-rose-500/30 pb-1">
                            <span className="text-[10px] font-black uppercase text-rose-400">ESTOQUE CENTRAL - BLOCO C</span>
                            <span className="text-[9px] font-mono text-rose-300 font-bold">Curva C</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[9px] text-center font-bold">
                            <div className="bg-rose-500/20 border border-rose-500/40 py-2 rounded text-rose-200">C4</div>
                            <div className="bg-rose-500/20 border border-rose-500/40 py-2 rounded text-rose-200">C2</div>
                            <div className="bg-rose-500/20 border border-rose-500/40 py-2 rounded text-rose-200">C1</div>
                            <div className="bg-rose-500/20 border border-rose-500/40 py-2 rounded text-rose-200">C3</div>
                          </div>
                          <span className="text-[8px] text-slate-400 block text-center">Fundo do Armazém (Menor Giro)</span>
                        </div>

                        {/* MIDDLE COLUMN: BLOCKS B (CURVA B - YELLOW - 215 PALETES) */}
                        <div className="col-span-3 bg-amber-950/20 border-2 border-amber-500/40 rounded-xl p-2.5 space-y-2">
                          <div className="flex items-center justify-between border-b border-amber-500/30 pb-1">
                            <span className="text-[10px] font-black uppercase text-amber-400">ESTOQUE CENTRAL - BLOCO B</span>
                            <span className="text-[9px] font-mono text-amber-300 font-bold">Curva B</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-[9px] text-center font-bold">
                            <div className="bg-amber-500/20 border border-amber-500/40 py-2 rounded text-amber-200">B4</div>
                            <div className="bg-amber-500/20 border border-amber-500/40 py-2 rounded text-amber-200">B2</div>
                            <div className="bg-amber-500/20 border border-amber-500/40 py-2 rounded text-amber-200">B1</div>
                            <div className="bg-amber-500/20 border border-amber-500/40 py-2 rounded text-amber-200">B3</div>
                          </div>
                          <span className="text-[8px] text-slate-400 block text-center">Centro do Armazém (Giro Médio)</span>
                        </div>

                        {/* RIGHT COLUMN: BLOCKS A (CURVA A - GREEN - 200 PALETES) */}
                        <div className="col-span-3 bg-emerald-950/20 border-2 border-emerald-500/40 rounded-xl p-2.5 space-y-2">
                          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1">
                            <span className="text-[10px] font-black uppercase text-emerald-400">ESTOQUE CENTRAL - BLOCO A</span>
                            <span className="text-[9px] font-mono text-emerald-300 font-bold">Curva A</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-[8px] text-center font-bold">
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A1</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A2</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A3</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A4</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A5</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A6</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A7</div>
                            <div className="bg-emerald-500/20 border border-emerald-500/40 py-1.5 rounded text-emerald-200">A8</div>
                          </div>
                          <span className="text-[8px] text-slate-400 block text-center">Próximo ao Picking (Maior Giro)</span>
                        </div>

                        {/* FAR RIGHT: PICKING & CONTINGÊNCIA & DOCAS */}
                        <div className="col-span-3 space-y-2">
                          <div className="bg-rose-950/30 border-2 border-rose-500/60 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] font-black uppercase text-rose-400 block">CONTINGÊNCIA (108 PALETES)</span>
                            <span className="text-[8px] text-slate-300">Capacidade Complementar Transbordo</span>
                          </div>
                          <div className="bg-amber-950/30 border-2 border-amber-500/60 rounded-xl p-2.5 text-center">
                            <span className="text-[10px] font-black uppercase text-amber-300 block">PICKING (160 PALETES)</span>
                            <span className="text-[8px] text-slate-300">Área de Separação / Ressuprimento</span>
                          </div>
                          <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-2 text-center text-[8px] text-blue-300 font-bold">
                            PÁTIO DE CARREGAMENTO & DOCAS (FROTA)
                          </div>
                        </div>

                      </div>

                      {/* BOTTOM AUXILIARY AREAS & RED ZONE */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[9px] text-center font-bold">
                        <div className="bg-slate-900 border border-slate-700 py-1.5 rounded text-slate-300">REPACKING</div>
                        <div className="bg-slate-900 border border-slate-700 py-1.5 rounded text-slate-300">SALA DE FROTA</div>
                        <div className="bg-slate-900 border border-slate-700 py-1.5 rounded text-slate-300">MARKETING E VENDAS</div>
                        <div className="bg-rose-950/40 border border-rose-500/50 py-1.5 rounded text-rose-300">RED ZONE (SEGURANÇA 4,5M)</div>
                      </div>

                    </div>
                  </div>
                </LayoutPanZoomViewer>

                {/* COMPLETE OFFICIAL LAYOUT LEGEND (LEGENDA DO LAYOUT) */}
                <div className="bg-[#0b1326] border border-slate-700/90 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h5 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-400" />
                      LEGENDAS OFICIAIS DO LAYOUT (SINALIZAÇÃO DPO, CURVA ABC & CAPACIDADES)
                    </h5>
                    <span className="text-[10px] font-bold text-slate-400">Padrão Pau Brasil Distribuidora</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    {/* LEGENDA DE CURVA ABC DE GIRO */}
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
                      <span className="text-[11px] font-black uppercase text-white block border-b border-slate-800 pb-1">
                        1. LEGENDA DE CURVA DE GIRO (ABC)
                      </span>
                      <div className="space-y-1.5 text-[11px] font-bold">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs"></span>
                          <span>Curva A — Maior Giro (Bloco A / Entrada)</span>
                        </div>
                        <div className="flex items-center gap-2 text-amber-400">
                          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs"></span>
                          <span>Curva B — Giro Intermediário (Bloco B / Centro)</span>
                        </div>
                        <div className="flex items-center gap-2 text-rose-400">
                          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-xs"></span>
                          <span>Curva C — Menor Giro (Bloco C / Fundo)</span>
                        </div>
                      </div>
                    </div>

                    {/* LEGENDA DE CAPACIDADES POR ÁREA */}
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
                      <span className="text-[11px] font-black uppercase text-white block border-b border-slate-800 pb-1">
                        2. CAPACIDADES META (967 PALETES TOTAL)
                      </span>
                      <div className="space-y-1 text-[10px] font-bold">
                        <div className="flex items-center justify-between text-blue-300">
                          <span>🔵 Central (Blocos A/B/C)</span>
                          <span className="font-mono">615 Paletes (63,6%)</span>
                        </div>
                        <div className="flex items-center justify-between text-amber-300">
                          <span>🟡 Picking (Separação)</span>
                          <span className="font-mono">160 Paletes (16,5%)</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-300">
                          <span>🟢 Marketplace (E-commerce)</span>
                          <span className="font-mono">84 Paletes (8,7%)</span>
                        </div>
                        <div className="flex items-center justify-between text-purple-300">
                          <span>🟣 Contingência (Transbordo)</span>
                          <span className="font-mono">108 Paletes (11,2%)</span>
                        </div>
                      </div>
                    </div>

                    {/* SINAIS DE SEGURANÇA E SINALIZAÇÃO DPO */}
                    <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-2">
                      <span className="text-[11px] font-black uppercase text-white block border-b border-slate-800 pb-1">
                        3. SINALIZAÇÃO DE SEGURANÇA & DPO
                      </span>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-300 font-bold">
                        <div className="flex items-center gap-1">⛽ Posto Combustível</div>
                        <div className="flex items-center gap-1">💡 Luz Emergência</div>
                        <div className="flex items-center gap-1 text-emerald-400">🚪 Saída Emergência</div>
                        <div className="flex items-center gap-1 text-rose-400">🚷 Proibido Pedestres</div>
                        <div className="flex items-center gap-1 text-amber-400">🚚 Max 10 km/h Caminhão</div>
                        <div className="flex items-center gap-1 text-sky-400">🚜 Tráfego Máquinas</div>
                        <div className="flex items-center gap-1 text-rose-400">🧯 Bomba / Hidrante</div>
                        <div className="flex items-center gap-1">🪤 Iscas Pragas</div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* LAYOUT POSITIONS DATA TABLE */}
              <div className="bg-white dark:bg-[#131d38] border border-gray-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase text-[#032b5e] dark:text-white flex items-center gap-2">
                      <Grid className="w-4 h-4 text-amber-500" /> Tabela de Ocupação do Layout (Endereçamento Físico)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Relação detalhada de ruas, blocos, níveis e posições associadas às zonas de armazenamento.
                    </p>
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {layoutPositions.length} Endereços Cadastrados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60">
                        <th className="p-2.5">Rua</th>
                        <th className="p-2.5">Bloco</th>
                        <th className="p-2.5">Nível</th>
                        <th className="p-2.5">Posição</th>
                        <th className="p-2.5">Zona de Armazenamento</th>
                        <th className="p-2.5 text-right">Capacidade (Paletes)</th>
                        <th className="p-2.5 text-right">Ocupação Atual</th>
                        <th className="p-2.5">SKU / Produto Alocado</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
                      {layoutPositions.map((pos) => {
                        const isCentral = pos.zona.toLowerCase().includes('central');
                        const isPicking = pos.zona.toLowerCase().includes('picking');
                        const isMkt = pos.zona.toLowerCase().includes('market');
                        
                        return (
                          <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold font-mono text-blue-500">{pos.rua}</td>
                            <td className="p-2.5 font-bold">{pos.bloco}</td>
                            <td className="p-2.5 font-mono text-slate-400">{pos.nivel}</td>
                            <td className="p-2.5 font-mono font-bold text-amber-500">{pos.pos}</td>
                            <td className="p-2.5">
                              <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${
                                isCentral ? 'bg-blue-500/10 text-blue-700 border-blue-300/60 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50' :
                                isPicking ? 'bg-amber-500/10 text-amber-800 border-amber-300/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50' :
                                isMkt ? 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50' :
                                'bg-purple-500/10 text-purple-800 border-purple-300/60 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isCentral ? 'bg-blue-500' :
                                  isPicking ? 'bg-amber-500' :
                                  isMkt ? 'bg-emerald-500' :
                                  'bg-purple-500'
                                }`} />
                                {pos.zona}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold">{pos.cap}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-amber-400">{pos.ocup}</td>
                            <td className="p-2.5 font-bold uppercase text-slate-200">{pos.sku}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                pos.status === 'Ocupado' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                pos.status === 'Livre' ? 'bg-slate-700 text-slate-300' :
                                'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {pos.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SECTION B: MATRIZ DE CORRELAÇÃO */}
          {govSection === 'matriz' && (
            <div className="space-y-6">
              
              <div className="bg-[#111a30] border border-blue-900/60 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase">
                      PADRÃO DPO PAU BRASIL
                    </span>
                    <span className="text-[10px] text-blue-300 font-bold uppercase">20 Setores / Áreas Mapeadas</span>
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-tight mt-1 flex items-center gap-2">
                    <Grid className="w-5 h-5 text-amber-400" />
                    Matriz de Correlação do Armazém (Proximidade Ideal entre Áreas)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Avaliação técnica de proximidade espacial necessária para otimizar movimentação e prevenir contaminações/riscos na operação.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleDownloadMatrixTemplate}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-emerald-200" />
                    Download Modelo CSV Matriz
                  </button>

                  <label className="px-4 py-2.5 bg-[#032b5e] hover:bg-blue-900 border border-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-sky-300" />
                    Importar Matriz CSV
                    <input
                      type="file"
                      accept=".csv, .txt"
                      onChange={handleMatrixCSVImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* COLOR LEGEND BAR FROM REFERENCED IMAGE */}
              <div className="bg-[#131d38] border border-slate-700 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="font-black text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
                  LEGENDA DE PONTUAÇÃO DE PROXIMIDADE:
                </span>
                <div className="flex flex-wrap items-center gap-2 font-bold text-[10px]">
                  <span className="px-2.5 py-1 bg-emerald-700 text-white rounded-md border border-emerald-800">
                    10 — QUANTO MAIS PRÓXIMO, MELHOR
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500 text-white rounded-md border border-emerald-600">
                    8 — BOM ESTAR PRÓXIMO
                  </span>
                  <span className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-md border border-amber-500">
                    5 — INDIFERENTE
                  </span>
                  <span className="px-2.5 py-1 bg-orange-300 text-slate-950 rounded-md border border-orange-400">
                    3 — BOM ESTAR AFASTADO
                  </span>
                  <span className="px-2.5 py-1 bg-rose-500 text-white rounded-md border border-rose-600">
                    1 — QUANTO MAIS LONGE MELHOR
                  </span>
                </div>
              </div>

              {/* FULL 20X20 INTERACTIVE CORRELATION MATRIX TABLE */}
              <div className="bg-white dark:bg-[#131d38] border border-gray-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xl overflow-x-auto">
                <table className="w-full text-center text-[10px] border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#081226] text-white">
                      <th className="p-3 border border-slate-700 text-left font-black uppercase text-[10px] w-[200px] shrink-0 sticky left-0 bg-[#081226] z-20 align-bottom">
                        Área / Setor
                      </th>
                      {MATRIX_LOCATIONS.map((loc, idx) => (
                        <th key={idx} className="p-2 border border-slate-700 font-black uppercase text-amber-300 min-w-[42px] h-[160px] align-bottom pb-2">
                          <div className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap tracking-wider text-[10px] font-extrabold mx-auto leading-tight text-slate-200" title={loc}>
                            {loc}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MATRIX_LOCATIONS.map((rowLoc, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/20">
                        <td className="p-2 border border-slate-700 text-left font-black uppercase text-[9px] bg-[#0c1830] text-amber-300 sticky left-0 z-10 shadow-md">
                          {rowLoc}
                        </td>
                        {MATRIX_LOCATIONS.map((_, cIdx) => {
                          const val = matrixData[rIdx]?.[cIdx] ?? '1';
                          return (
                            <td 
                              key={cIdx} 
                              className={`p-1.5 border font-mono font-bold text-[10px] transition-all ${getMatrixCellColor(val)}`}
                              title={`${rowLoc} × ${MATRIX_LOCATIONS[cIdx]}: Nota ${val}`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SECTION C: 7 ZONAS DE ARMAZENAMENTO */}
          {govSection === 'zonas' && (
            <div className="space-y-6">
              
              <div className="bg-[#111a30] border border-blue-900/60 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Definição Padrão das 7 Zonas de Armazenamento do Armazém
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Regras operacionais e diretrizes para alocação de SKUs em cada zona da fábrica.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* ZONA 1: CENTRAL */}
                <div className="bg-[#131d38] border border-blue-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      ZONA 01
                    </span>
                    <span className="text-xs font-mono font-black text-white">Capacidade: 615 Paletes</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">1. Estoque Central (A, B, C)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Estruturas porta-paletes de alta densidade destinadas ao armazenamento de grandes volumes de embalagens fechadas e alta rotatividade.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Responsável: Operador de Empilhadeira</div>
                    <div>• Acesso: Restrito a equipamentos pesados</div>
                  </div>
                </div>

                {/* ZONA 2: PICKING */}
                <div className="bg-[#131d38] border border-amber-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      ZONA 02
                    </span>
                    <span className="text-xs font-mono font-black text-white">Capacidade: 160 Paletes</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">2. Área de Picking</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pistas e endereços térreos de separação fracionada e montagem de paletes para frota de entrega diária.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Regra: Mínimo 1 palete completo de segurança</div>
                    <div>• Reposição: Prioridade alta no ressuprimento</div>
                  </div>
                </div>

                {/* ZONA 3: MARKETPLACE */}
                <div className="bg-[#131d38] border border-emerald-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      ZONA 03
                    </span>
                    <span className="text-xs font-mono font-black text-white">Capacidade: 84 Paletes</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">3. Marketplace</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Área reservada para fracionados de parceiros, vendas B2B via Ambev On e itens especiais de baixo volume.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Organização: Prateleiras e gaiolas numeradas</div>
                    <div>• Controle: Auditoria diária de invólucros</div>
                  </div>
                </div>

                {/* ZONA 4: PULMÃO DE DESCARREGAMENTO */}
                <div className="bg-[#131d38] border border-cyan-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> ZONA 04
                    </span>
                    <span className="text-xs font-mono font-black text-white">Pulmão de Recebimento</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">4. Pulmão (Descarregamento)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Área destinada a armazenamento temporário e descarregamento de pallets de carretas oriundas das fábricas (puxada).
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Regra DPO: Liberação física e conferência em até 30 min</div>
                    <div>• Operação: Descarregamento direto de carretas e triagem de paletes</div>
                  </div>
                </div>

                {/* ZONA 5: ZONA DE ATIVOS */}
                <div className="bg-[#131d38] border border-purple-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                      ZONA 05
                    </span>
                    <span className="text-xs font-mono font-black text-white">Ativos de Giro</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">5. Zona de Ativos</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pátio de segregação de garrafas de vidro retornáveis (600ml, 1L), garrafeiros vazios e paletes PBR de madeira.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Amarração: Empilhamento máximo de 4 níveis</div>
                    <div>• Bloqueio: Ativos quebrados vão para Refugo</div>
                  </div>
                </div>

                {/* ZONA 6: PNC */}
                <div className="bg-[#131d38] border border-rose-500/30 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                      ZONA 06
                    </span>
                    <span className="text-xs font-mono font-black text-rose-400">Segregação Total</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">6. PNC (Produto Não Conforme)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Área cercada e sinalizada para produtos com avaria visual, vício de fabricação, retenção de qualidade ou validade vencida.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Acesso: Restrito ao time de Qualidade/Supervisão</div>
                    <div>• Regra: Proibida movimentação sem laudo</div>
                  </div>
                </div>

                {/* ZONA 7: REPACK */}
                <div className="bg-[#131d38] border border-orange-500/30 rounded-2xl p-5 space-y-3 shadow-lg md:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                      ZONA 07
                    </span>
                    <span className="text-xs font-mono font-black text-white">Recuperação</span>
                  </div>
                  <h4 className="text-base font-black text-white uppercase">7. Repack (Reembalagem)</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Bancada e sala de reembalagem para recomposição de packs danificados, refaazimento de fardos e troca de filmes retráteis.
                  </p>
                  <div className="pt-2 border-t border-slate-700 text-[10px] text-slate-400 font-bold space-y-1">
                    <div>• Meta: Retorno de SKUs reembalados em até 24h</div>
                    <div>• Registro: Lançamento obrigatório no painel Repack</div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ── MASTER TAB 2: CAPACIDADE INSTALADA ── */}
      {activeMasterTab === 'capacidade-instalada' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* MANUAL DE INSTRUÇÃO E METAS */}
          <ManualInstrucaoCard
            title="Manual de Instrução & Parâmetros de Meta — Gestão de Capacidade & Ocupação (Relatório 02.11.01)"
            metrics={[
              {
                key: 'capacidade_ocupacao_pallets',
                label: 'Ocupação de Pallets (% Atingimento)',
                unit: '%',
                comoCalcular: '(Paletes Físicos + Lastro no Picking como 1 posição) ÷ (Meta de Paletes da Área ou Total) × 100.'
              },
              {
                key: 'capacidade_ocupacao_he',
                label: 'Capacidade em Hectolitros (HL)',
                unit: 'HE',
                comoCalcular: 'Soma de (Caixas Contadas na Coluna J) × (Fator Hectolitro do SKU da Coluna C).'
              },
              {
                key: 'regra_picking_lastro',
                label: 'Regra de Lastro no Picking (Área 2)',
                unit: 'Posição',
                comoCalcular: 'Na Área 2 (Picking), se houver quantidade na Coluna Ç (Lastro) > 0, esta fração ocupa a posição de 1 Pallet inteiro.'
              }
            ]}
          />

          {/* 02.11.01 IMPORT & TEMPLATE DOWNLOAD CARD */}
          <div className="bg-[#032b5e] text-white rounded-2xl p-5 shadow-lg border border-blue-900/60 relative overflow-hidden space-y-4">
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <Warehouse className="w-56 h-56 text-white" />
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-full">
                    Relatório 02.11.01
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full border border-emerald-400 font-mono">
                    Suporte a Mesclagem / Recontagem
                  </span>
                </div>
                <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  Importação & Mesclagem de Recontagens (02.11.01)
                </h3>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Carregue a planilha oficial <strong>02.11.01</strong> contendo a contagem por áreas.
                  Mapeamento: <strong>Área 1 = Armazém Central</strong> | <strong>Área 2 = Picking</strong> (Lastro &gt; 0 ocupa 1 posição) | <strong>Área 3 = Marketplace</strong> | <strong>Área 4 = Contingência</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* BAIXAR MODELO */}
                <button
                  onClick={handleDownload021101Template}
                  className="px-3.5 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors border border-blue-700/80 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" /> Baixar Modelo
                </button>

                {/* MESCLAR RECONTAGEM (PATCH) */}
                <label 
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 border border-emerald-300 ring-2 ring-emerald-400/30"
                  title="Importa uma nova planilha 02.11.01 de recontagem, atualizando/corrigindo apenas os itens recontados e mantendo todos os outros SKUs intactos"
                >
                  <RefreshCw className="w-4 h-4 text-slate-950" /> 
                  <span>Mesclar Recontagem (02.11.01)</span>
                  <input type="file" accept=".xlsx, .xls, .csv, .txt" onChange={(e) => handlePosicaoPalletImport(e, true)} className="hidden" />
                </label>

                {/* CARGA GERAL / SUBSTITUIR TUDO */}
                <label 
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2"
                  title="Substitui 100% da base ativa com todos os produtos do arquivo enviado"
                >
                  <Upload className="w-4 h-4" /> 
                  <span>Carga Geral / Substituir</span>
                  <input type="file" accept=".xlsx, .xls, .csv, .txt" onChange={(e) => handlePosicaoPalletImport(e, false)} className="hidden" />
                </label>
              </div>
            </div>

            {/* CAIXA DE DINÂMICA DE RECONTAGEM EXPLICATIVA */}
            <div className="bg-blue-950/70 border border-blue-800/80 rounded-xl p-3 text-[11px] text-blue-200/90 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-white uppercase font-bold tracking-wider">Dinâmica de Recontagem:</strong> Carregue a primeira planilha <strong>02.11.01</strong> via <em>"Carga Geral"</em> com todos os produtos. Se solicitar recontagens ao conferente, suba a 2ª ou 3ª planilha clicando em <strong className="text-emerald-300">"Mesclar Recontagem"</strong> — o sistema corrigirá apenas os itens recontados, preservará os demais produtos intactos e atualizará instantaneamente a Gestão de Capacidade, Ocupação e Hectolitros.
              </div>
            </div>

            {/* STATUS DA ÚLTIMA IMPORTAÇÃO 02.11.01 */}
            {lastUploadInfo && (
              <div className="pt-2 border-t border-blue-800/80 flex items-center justify-between text-xs text-amber-200 font-medium">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{lastUploadInfo}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-300 bg-blue-900/80 px-2.5 py-1 rounded-md border border-blue-700 shrink-0">
                  {posicaoPalletItems.length} registros ativos
                </span>
              </div>
            )}
          </div>

          {/* META VS REAL TABLE FOR ALL AREAS (PALLETS & HECTOLITROS) */}
          <div className="bg-white dark:bg-[#131d38] border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-xs uppercase tracking-wider text-[#032b5e] dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  Painel Consolidado de Capacidade Armazém: Meta vs Real (Pallets & Hectolitros)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparativo direto das metas estabelecidas versus a contagem real física do relatório 02.11.01.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {unmappedFatorHectoItems.length > 0 && (
                  <button
                    onClick={() => setShowUnmappedModal(true)}
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span><strong>{unmappedFatorHectoItems.length} SKUs</strong> sem Fator Hecto</span>
                  </button>
                )}

                {posMetricsByArea.areas.some(a => a.isMetaDesatualizada) && (
                  <button
                    onClick={handleSyncMetasHlWithReal}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                    <span>Sincronizar Metas HL com Mix Real</span>
                  </button>
                )}

                {editingMetas ? (
                  <button
                    onClick={handleSaveMetas}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar Metas
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setTempMetas({ ...areaMetas });
                      setEditingMetas(true);
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-500" /> Editar Metas por Área
                  </button>
                )}
              </div>
            </div>

            {/* TABELA DE METAS VS REAL */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3">Área do Armazém</th>
                    <th className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">Meta Pallets</th>
                    <th className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">Real Pallets</th>
                    <th className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">% Ocup. Pallets</th>
                    <th className="p-3 text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">Meta (HL)</th>
                    <th className="p-3 text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">Real (HL)</th>
                    <th className="p-3 text-center bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">% Ocup. HL</th>
                    <th className="p-3 text-center">Status Atingimento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {posMetricsByArea.areas.map((a) => {
                    const isPicking = a.id === 2;
                    // Regra: Para Picking (área 2), até 100% é Conforme e acima de 100% é Crítico (sem alerta intermediário de 90%)
                    const isExceeded = a.palletsPct > 100 || a.hlPct > 100;
                    const isHighCapacity = !isPicking && !isExceeded && (a.palletsPct >= 90 || a.hlPct >= 90);

                    return (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">
                          {a.nome}
                        </td>

                        {/* PALLETS META & REAL */}
                        <td className="p-3 text-center font-mono font-bold text-blue-900 dark:text-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
                          {editingMetas ? (
                            <input
                              type="number"
                              value={tempMetas[a.id as 1 | 2 | 3 | 4 | 5 | 6 | 7]?.palletsMeta || 0}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                const areaKey = a.id as 1 | 2 | 3 | 4 | 5 | 6 | 7;
                                const areaFactor = areaRealFactors[areaKey] || DEFAULT_AREA_FACTORS[areaKey] || 7.5;
                                setTempMetas({
                                  ...tempMetas,
                                  [areaKey]: { 
                                    palletsMeta: v,
                                    hectolitrosMeta: Math.round(v * areaFactor * 10) / 10
                                  }
                                });
                              }}
                              className="w-20 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-blue-400 rounded-md font-bold font-mono text-xs"
                            />
                          ) : (
                            a.palletsMeta
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 text-sm">
                          {a.palletsReal}
                        </td>
                        <td className="p-3 text-center font-mono font-black bg-blue-50/30 dark:bg-blue-950/10">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                            a.palletsPct > 100
                              ? 'bg-rose-600 text-white font-black'
                              : (!isPicking && a.palletsPct >= 90)
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                          }`}>
                            {a.palletsPct.toFixed(1)}%
                          </span>
                        </td>

                        {/* HECTOLITROS META & REAL */}
                        <td className="p-3 text-center font-mono font-bold text-amber-900 dark:text-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
                          {editingMetas ? (
                            <input
                              type="number"
                              step="10"
                              value={tempMetas[a.id as 1 | 2 | 3 | 4 | 5 | 6 | 7]?.hectolitrosMeta || 0}
                              onChange={(e) => {
                                const v = Number(e.target.value) || 0;
                                const areaKey = a.id as 1 | 2 | 3 | 4 | 5 | 6 | 7;
                                setTempMetas({
                                  ...tempMetas,
                                  [areaKey]: { ...(tempMetas[areaKey] || { palletsMeta: a.palletsMeta, hectolitrosMeta: 0 }), hectolitrosMeta: v }
                                });
                              }}
                              className="w-24 px-2 py-1 text-center bg-white dark:bg-slate-900 border border-amber-400 rounded-md font-bold font-mono text-xs"
                            />
                          ) : (
                            <div>
                              <span>{a.hlMeta.toLocaleString('pt-BR')} HE</span>
                              {a.isMetaDesatualizada && (
                                <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5" title="Meta HL difere >30% da razão operacional real do mix">
                                  ⚠️ Meta HL desatualizada
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10 text-sm">
                          {a.hlReal.toFixed(1)} HE
                        </td>
                        <td className="p-3 text-center font-mono font-black bg-amber-50/30 dark:bg-amber-950/10">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                            a.hlPct > 100
                              ? 'bg-rose-600 text-white font-black'
                              : (!isPicking && a.hlPct >= 90)
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                          }`}>
                            {a.hlPct.toFixed(1)}%
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="p-3 text-center font-bold">
                          {isExceeded ? (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 text-[11px] uppercase font-black">
                              <AlertTriangle className="w-3.5 h-3.5" /> Capacidade Crítica
                            </span>
                          ) : isHighCapacity ? (
                            <span className="text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 text-[11px] uppercase font-bold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Alerta (≥90%)
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 text-[11px] uppercase font-bold">
                              <CheckCircle className="w-3.5 h-3.5" /> Capacidade OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* TOTAL ARMAZÉM ROW */}
                  <tr className="bg-slate-100 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="p-3.5 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <Warehouse className="w-4 h-4 text-amber-500" />
                      {posMetricsByArea.total.nome}
                    </td>
                    <td className="p-3.5 text-center font-mono text-blue-900 dark:text-blue-200 text-sm">
                      {posMetricsByArea.total.palletsMeta}
                    </td>
                    <td className="p-3.5 text-center font-mono text-blue-600 dark:text-blue-400 text-base">
                      {posMetricsByArea.total.palletsReal}
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-xs">
                        {posMetricsByArea.total.palletsPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-mono text-amber-900 dark:text-amber-200 text-sm">
                      {posMetricsByArea.total.hlMeta.toLocaleString('pt-BR')} HE
                    </td>
                    <td className="p-3.5 text-center font-mono text-amber-600 dark:text-amber-400 text-base">
                      {posMetricsByArea.total.hlReal.toFixed(1)} HE
                    </td>
                    <td className="p-3.5 text-center font-mono">
                      <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-1 rounded-lg text-xs">
                        {posMetricsByArea.total.hlPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-xs uppercase text-slate-600 dark:text-slate-300">
                      Capacidade Total
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CAPACITY GAUGES VISUAL CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {posMetricsByArea.areas.map((area) => {
              const isOver = area.palletsPct > 100;
              return (
                <div
                  key={area.id}
                  className={`p-4.5 rounded-2xl border shadow-xs transition-all relative overflow-hidden ${
                    isOver
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                      : 'bg-white dark:bg-[#131d38] border-slate-200 dark:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Área {area.id}: {area.shortName}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                      isOver
                        ? 'bg-rose-600 text-white'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    }`}>
                      {isOver ? `${area.palletsPct.toFixed(1)}% CRÍTICO` : `${area.palletsPct.toFixed(1)}%`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black font-mono text-[#032b5e] dark:text-white">
                      {area.palletsReal} <span className="text-xs font-normal text-slate-400">/ {area.palletsMeta} pal</span>
                    </span>
                    <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">
                      {area.hlReal.toFixed(1)} HE
                    </span>
                  </div>

                  {/* PROGRESS BAR PALLETS */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        isOver ? 'bg-rose-600' : area.id === 2 ? 'bg-amber-500' : area.id === 3 ? 'bg-emerald-500' : area.id === 4 ? 'bg-purple-600' : area.id === 5 ? 'bg-cyan-500' : area.id === 6 ? 'bg-rose-500' : 'bg-[#1e56f0]'
                      }`} 
                      style={{ width: `${Math.min(100, area.palletsPct)}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                    <span>Meta HL: {area.hlMeta} HE</span>
                    <span>Disponível: {Math.max(0, area.palletsMeta - area.palletsReal)} pos.</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DETAILED TABLE OF IMPORTED 02.11.01 POSIÇÃO PALLET ITEMS */}
          <div className="bg-white dark:bg-[#131d38] border border-gray-200 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] dark:text-white tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Relatório Detalhado de Contagem Posição Pallet (02.11.01)
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Exibição de todos os itens contados com posições de pallets fechados, lastros e hectolitros calculados. Clique em <strong>Editar</strong> para ajustar a palletização ou Fator HE.
                </p>
              </div>

              {/* ACTIONS & GUIA DE CADASTRO */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenCadastro()}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Abrir a tela de Cadastro de Produtos para editar palletização ou Fator HE dos 377 SKUs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Guia de Cadastro de Produtos</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                </button>

                {/* PESQUISA */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar código ou descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* FILTROS DE ÁREA */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-wrap">
                  <button
                    onClick={() => setSelectedTargetArea('ALL')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'ALL'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('CENTRAL')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'CENTRAL'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    1-Central
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('PICKING')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'PICKING'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    2-Picking
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('MARKETPLACE')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'MARKETPLACE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    3-Marketplace
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('CONTINGENCIA')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'CONTINGENCIA'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    4-Contingência
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('PULMAO')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'PULMAO'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    5-Pulmão
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('PNC')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'PNC'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    6-PNC
                  </button>
                  <button
                    onClick={() => setSelectedTargetArea('LIMPEZA')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase transition-all ${
                      selectedTargetArea === 'LIMPEZA'
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-teal-600 dark:hover:text-teal-300'
                    }`}
                  >
                    7-Limpeza
                  </button>
                </div>
              </div>
            </div>

            {/* INFO BAR ABOUT FRACTIONAL & CONFECTIONERY PALLET POSITION LOGIC */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong>Regra de Ocupação de Posições Pallet:</strong> Produtos classificados como <strong>Marketplace</strong> (<em>Halls, Trident, Azeites, Doces Vieira, Tang, etc.</em>) são agrupados por família. Caso a soma do grupo não atinja 1 lastro mínimo, <strong>não ocupa posição porta-paletes (0 pos)</strong>. Ao atingir ou superar 1 lastro, o grupo <strong>ocupa 1 posição compartilhada</strong>. A descrição é padronizada pelo Cadastro Oficial de Produtos.
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                Fator Pallet &amp; Lastro Ativos
              </span>
            </div>

            {/* DETAILED TABLE 02.11.01 OR FALLBACK INVENTORY */}
            <div className="overflow-x-auto">
              {posicaoPalletItems.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60 select-none">
                      <th className="p-3 whitespace-nowrap text-center"># Rank</th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'area') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('area'); setSkuSortDirection('asc'); }
                        }}
                        className="p-3 whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Área"
                      >
                        <div className="flex items-center gap-1">
                          <span>Área</span>
                          {skuSortField === 'area' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'codigo') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('codigo'); setSkuSortDirection('asc'); }
                        }}
                        className="p-3 whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Código"
                      >
                        <div className="flex items-center gap-1">
                          <span>Código</span>
                          {skuSortField === 'codigo' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'produto') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('produto'); setSkuSortDirection('asc'); }
                        }}
                        className="p-3 min-w-[280px] sm:min-w-[340px] lg:min-w-[400px] cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Descrição Oficial"
                      >
                        <div className="flex items-center gap-1">
                          <span>Descrição Oficial do Produto</span>
                          {skuSortField === 'produto' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'caixas') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('caixas'); setSkuSortDirection('desc'); }
                        }}
                        className="p-3 text-right whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Volume Físico de Caixas"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Caixas</span>
                          {skuSortField === 'caixas' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'pallets') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('pallets'); setSkuSortDirection('desc'); }
                        }}
                        className="p-3 text-right whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Paletes Completos"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Pallets</span>
                          {skuSortField === 'pallets' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'lastros') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('lastros'); setSkuSortDirection('desc'); }
                        }}
                        className="p-3 text-right whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Lastros"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Lastro</span>
                          {skuSortField === 'lastros' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'posicoes') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('posicoes'); setSkuSortDirection('desc'); }
                        }}
                        className="p-3 text-right whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black rounded-t"
                        title="Clique para ordenar por Posições Pallet Ocupadas (Maior para Menor)"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Pos. Ocupadas</span>
                          {skuSortField === 'posicoes' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-600 dark:text-amber-400" /> : <ArrowDown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-right whitespace-nowrap">Fator HE</th>
                      <th 
                        onClick={() => {
                          if (skuSortField === 'hectolitros') setSkuSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
                          else { setSkuSortField('hectolitros'); setSkuSortDirection('desc'); }
                        }}
                        className="p-3 text-right whitespace-nowrap cursor-pointer hover:text-amber-500 transition-colors"
                        title="Clique para ordenar por Total de Hectolitros"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Total HE</span>
                          {skuSortField === 'hectolitros' ? (
                            skuSortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="p-3 text-center whitespace-nowrap">Ações / Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
                    {sortedPosicaoPalletItems.map((item, rankIdx) => {
                      const {
                        rawItem,
                        codigo,
                        officialDesc,
                        meta,
                        effectiveAreaId,
                        isLimpeza,
                        isMarketplace,
                        mpGroup,
                        totalQtd,
                        palletsCompletos,
                        lastrosCalculados,
                        posicoesOcupadas,
                        isFracionadoSemPos,
                        temFatorHecto,
                        fator,
                        itemHl
                      } = item;

                      return (
                        <tr key={`${effectiveAreaId}-${codigo}-${rankIdx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded text-[10px] font-black font-mono ${
                              rankIdx < 3 && posicoesOcupadas > 0
                                ? 'bg-amber-500 text-slate-950 shadow-xs'
                                : rankIdx < 10 && posicoesOcupadas > 0
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              #{rankIdx + 1}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border ${
                              effectiveAreaId === 1 ? 'bg-blue-500/10 text-blue-700 border-blue-300/60 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50' :
                              effectiveAreaId === 2 ? 'bg-amber-500/10 text-amber-800 border-amber-300/60 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50' :
                              effectiveAreaId === 3 ? 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50' :
                              effectiveAreaId === 4 ? 'bg-purple-500/10 text-purple-800 border-purple-300/60 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50' :
                              effectiveAreaId === 5 ? 'bg-cyan-500/10 text-cyan-800 border-cyan-300/60 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50' :
                              effectiveAreaId === 6 ? 'bg-rose-500/10 text-rose-800 border-rose-300/60 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50' :
                              'bg-teal-500/10 text-teal-800 border-teal-300/60 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                effectiveAreaId === 1 ? 'bg-blue-500' :
                                effectiveAreaId === 2 ? 'bg-amber-500' :
                                effectiveAreaId === 3 ? 'bg-emerald-500' :
                                effectiveAreaId === 4 ? 'bg-purple-500' :
                                effectiveAreaId === 5 ? 'bg-cyan-500' :
                                effectiveAreaId === 6 ? 'bg-rose-500' :
                                'bg-teal-500'
                              }`} />
                              {effectiveAreaId === 1 ? 'Armazém Central' :
                               effectiveAreaId === 2 ? 'Picking' :
                               effectiveAreaId === 3 ? 'Marketplace' :
                               effectiveAreaId === 4 ? 'Contingência' :
                               effectiveAreaId === 5 ? 'Pulmão' :
                               effectiveAreaId === 6 ? 'PNC' :
                               'Produtos de Limpeza'}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-amber-600">{codigo}</td>
                          <td className="p-3 min-w-[280px] sm:min-w-[340px] lg:min-w-[400px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11.5px] font-bold uppercase tracking-tight text-slate-900 dark:text-slate-100">
                                {officialDesc}
                              </span>
                              {isLimpeza ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[8.5px] font-extrabold rounded border border-teal-500/20 uppercase tracking-tight whitespace-nowrap">
                                  Limpeza
                                </span>
                              ) : mpGroup ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-extrabold rounded border border-emerald-500/20 uppercase tracking-tight whitespace-nowrap">
                                  {mpGroup}
                                </span>
                              ) : null}
                              {isFracionadoSemPos && totalQtd > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[8px] font-bold rounded border border-amber-500/20 uppercase tracking-tight whitespace-nowrap" title="Volume menor que 1 lastro: alocado em prateleira/flow-rack sem ocupar posição porta-paletes">
                                  &lt; 1 Lastro (0 pos)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono font-bold">{totalQtd} {getProductUnit(meta)}</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {palletsCompletos}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            {lastrosCalculados}
                          </td>
                          <td className="p-3 text-right font-mono bg-amber-500/5 dark:bg-amber-500/10">
                            {posicoesOcupadas > 0 ? (
                              <span className="font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                {posicoesOcupadas} pos
                              </span>
                            ) : (
                              <span className="font-bold text-slate-400 dark:text-slate-500 text-[11px]">
                                0 pos
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-400">
                            {temFatorHecto ? (
                              <span>{fator.toFixed(4)}</span>
                            ) : (
                              <span className="text-rose-500 font-bold text-[10px]">Sem Fator</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-black font-mono text-amber-600 dark:text-amber-400">
                            {itemHl.toFixed(2)} HE
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenQuickEdit(rawItem)}
                                title="Editar Palletização e Fator Hecto deste SKU"
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Editar</span>
                              </button>
                              <button
                                onClick={() => handleOpenCadastro(codigo)}
                                title="Abrir no Cadastro de Produtos Geral"
                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60">
                      <th className="p-3 whitespace-nowrap">Código</th>
                      <th className="p-3 min-w-[260px] sm:min-w-[320px]">Descrição do Produto</th>
                      <th className="p-3 text-right whitespace-nowrap">Fator Cx</th>
                      <th className="p-3 text-right whitespace-nowrap">Valor un.</th>
                      <th className="p-3 text-right whitespace-nowrap">Central (615)</th>
                      <th className="p-3 text-right whitespace-nowrap">Picking (160)</th>
                      <th className="p-3 text-right whitespace-nowrap">Marketplace (84)</th>
                      <th className="p-3 text-right whitespace-nowrap">Contingência (108)</th>
                      <th className="p-3 text-right whitespace-nowrap">Pulmão (140)</th>
                      <th className="p-3 text-right whitespace-nowrap">PNC (9)</th>
                      <th className="p-3 text-right whitespace-nowrap">Total Est.</th>
                      <th className="p-3 text-right whitespace-nowrap">Total HE</th>
                      <th className="p-3 text-center whitespace-nowrap">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 font-medium">
                    {filteredItems.map((item, idx) => (
                      <tr key={`cap-item-${item.cod}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-600 whitespace-nowrap">{item.cod}</td>
                        <td className="p-3 min-w-[260px] sm:min-w-[320px] font-bold uppercase text-slate-900 dark:text-slate-100 text-xs">{item.descricao}</td>
                        <td className="p-3 text-right font-mono">{item.fator}</td>
                        <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3 text-right font-bold text-blue-600 dark:text-blue-400">{item.quantCentral}</td>
                        <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">{item.quantPicking}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{item.quantMarketplace}</td>
                        <td className="p-3 text-right font-bold text-purple-600 dark:text-purple-400">{item.quantContingencia}</td>
                        <td className="p-3 text-right font-black text-slate-900 dark:text-white">{item.totalQuant}</td>
                        <td className="p-3 text-right font-black font-mono text-amber-600 dark:text-amber-400">{item.totalHl.toFixed(2)} HE</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleOpenQuickEdit({ codigo: item.cod, produto: item.descricao })}
                            className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all mx-auto cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ── MASTER TAB 3: POLÍTICA DE ESTOQUE (META 6 DIAS DPO) ── */}
      {activeMasterTab === 'politica-estoque' && (
        <div className="animate-fadeIn space-y-6">
          <div className="bg-[#111a30] border border-emerald-900/60 rounded-2xl p-4 text-white shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  DIRETRIZ CORPORATIVA DPO
                </span>
                <h3 className="text-sm font-black uppercase text-white mt-0.5">
                  Política de Estoque — Meta Padrão: 6.0 Dias de Cobertura de Vendas
                </h3>
              </div>
            </div>
          </div>

          {/* EMBEDDED POLITICA DE ESTOQUE DASHBOARD */}
          <PoliticaEstoqueDashboard user={user} />
        </div>
      )}

      {/* ── MASTER TAB 4: CURVA ABC (03.05.19) ── */}
      {activeMasterTab === 'curva-abc-030519' && (
        <div className="animate-fadeIn space-y-6">
          <CurvaAbcTrimestralTab />
        </div>
      )}

      {/* ── MASTER TAB 5: MATRIZ ABC LOGÍSTICA COMPLETA ── */}
      {activeMasterTab === 'matriz-abc-logistica' && (
        <div className="animate-fadeIn space-y-6">
          <MatrizAbcLogisticaPanel user={user} empresaId={empresa?.id || 'demo'} />
        </div>
      )}

      {/* ── MASTER TAB 6: QUADRO DE AÇÕES DPO (CAPACIDADE & LAYOUT & POLÍTICA DE ESTOQUE) ── */}
      {activeMasterTab === 'acoes' && (
        <div className="animate-fadeIn space-y-6">
          <QuadroAcoesDpo
            user={user}
            empresa={empresa}
            theme={theme || 'light'}
            processoFilter="Armazenagem"
            title="Quadro de Ações — Gestão de Capacidade, Layout & Estoque"
            subtitle="Planos de ação 5W2H, contramedidas de ocupação de armazém, layout e política de estoque."
            onBack={() => setActiveMasterTab('governanca-visual')}
          />
        </div>
      )}

      {/* MODAL DE PRODUTOS SEM FATOR HECTO */}
      {showUnmappedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Produtos sem Fator Hecto Cadastrado ({unmappedFatorHectoItems.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Estes SKUs estão no relatório 02.11.01 mas não possuem Fator Hectolitro no Cadastro de Produtos.
                    Eles foram **excluídos da contagem de Real HL** para evitar distorção do volume físico.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUnmappedModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                    <th className="pb-2">Código</th>
                    <th className="pb-2">Descrição do Produto</th>
                    <th className="pb-2">Área do Armazém</th>
                    <th className="pb-2 text-right">Qtd Caixas</th>
                    <th className="pb-2 text-right">Pallets / Lastro</th>
                    <th className="pb-2 text-center">Status HL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {unmappedFatorHectoItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 font-mono font-bold text-amber-600">{item.codigo}</td>
                      <td className="py-2.5 font-bold uppercase text-slate-800 dark:text-slate-200">{item.produto}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          item.areaId === 1 ? 'bg-blue-500/10 text-blue-700 border-blue-300/60 dark:bg-blue-900/40 dark:text-blue-300' :
                          item.areaId === 2 ? 'bg-amber-500/10 text-amber-800 border-amber-300/60 dark:bg-amber-900/40 dark:text-amber-300' :
                          item.areaId === 3 ? 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-300' :
                          item.areaId === 4 ? 'bg-purple-500/10 text-purple-800 border-purple-300/60 dark:bg-purple-900/40 dark:text-purple-300' :
                          item.areaId === 5 ? 'bg-cyan-500/10 text-cyan-800 border-cyan-300/60 dark:bg-cyan-900/40 dark:text-cyan-300' :
                          'bg-rose-500/10 text-rose-800 border-rose-300/60 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.areaId === 1 ? 'bg-blue-500' :
                            item.areaId === 2 ? 'bg-amber-500' :
                            item.areaId === 3 ? 'bg-emerald-500' :
                            item.areaId === 4 ? 'bg-purple-500' :
                            item.areaId === 5 ? 'bg-cyan-500' :
                            'bg-rose-500'
                          }`} />
                          {item.areaId === 1 ? 'Armazém Central' :
                           item.areaId === 2 ? 'Picking' :
                           item.areaId === 3 ? 'Marketplace' :
                           item.areaId === 4 ? 'Contingência' :
                           item.areaId === 5 ? 'Pulmão' :
                           'PNC'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold">{item.qtdFisicaCaixas} cx</td>
                      <td className="py-2.5 text-right font-mono">{item.qtdPallet} pal / {item.qtdLastro} lastro</td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px] rounded-md">
                          0.00 HE (Sem Fator)
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cadastre o Fator Hecto na aba "Matriz ABC" ou no Cadastro de Produtos para incluí-los no somatório de HL.
              </span>
              <button
                onClick={() => setShowUnmappedModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Entendido / Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL DE VISUALIZAÇÃO DO LAYOUT GUARABIRA */}
      {showOfficialLayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-[#0b1329] border border-amber-500/40 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* MODAL HEADER */}
            <div className="px-6 py-4 border-b border-slate-800 bg-[#070d1e] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                  <Map className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono font-black text-[10px] rounded border border-amber-500/30">
                      PB-GBA-LAY-01
                    </span>
                    <span className="text-xs font-bold text-slate-400">Pau Brasil Distribuidora — Guarabira/PB</span>
                  </div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">
                    Planta de Layout, Capacidade e Sinalização DPO — Revenda Guarabira
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPopOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Abrir POP DPO
                </button>
                <button
                  onClick={() => setShowOfficialLayoutModal(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* MODAL BODY WITH BLUEPRINT */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#091024]">
              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex-wrap gap-3">
                <div className="flex items-center gap-4 text-xs font-mono font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Central: 615 PL</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Picking: 160 PL</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Marketplace: 84 PL</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Contingência: 108 PL</span>
                  <span className="text-amber-400 font-black">TOTAL: 967 PL</span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Substituir por Foto do Layout
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLayoutImageUpload}
                      className="hidden"
                    />
                  </label>
                  {layoutImage && (
                    <button
                      onClick={() => {
                        setLayoutImage(null);
                        removeMediaItem('af_warehouse_layout_img');
                      }}
                      className="px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Restaurar Planta Vetorial
                    </button>
                  )}
                </div>
              </div>

              {/* IMAGE OR VECTOR BLUEPRINT DISPLAY WITH ZOOM & PAN CONTROLS */}
              <LayoutPanZoomViewer 
                imageSrc={layoutImage} 
                title="Planta DPO PB-GBA-LAY-01 — Revenda Guarabira"
                onCloseModal={() => setShowOfficialLayoutModal(false)}
              >
                <div className="border-2 border-amber-500/30 rounded-2xl bg-[#060a17] p-5 space-y-6 shadow-2xl">
                  {/* DIAGRAMA VETORIAL COMPLETO DO LAYOUT GUARABIRA */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Map className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Planta Física e Funcional — Armazém Revenda Guarabira
                        </h4>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold uppercase">
                        Conforme Padrão DPO PB-GBA-LAY-01
                      </span>
                    </div>

                    {/* LAYOUT TOP ZONES */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                      <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl text-center">
                        <span className="font-black text-emerald-400 block uppercase">Reciclável & Despejo</span>
                        <span className="text-[10px] text-slate-400">Coleta de Resíduos</span>
                      </div>
                      <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-center">
                        <span className="font-black text-amber-400 block uppercase">Posto de Combustível</span>
                        <span className="text-[10px] text-slate-400">Abastecimento Frota</span>
                      </div>
                      <div className="bg-blue-950/40 border border-blue-500/30 p-3 rounded-xl text-center">
                        <span className="font-black text-blue-400 block uppercase">Marketplace (84 PL)</span>
                        <span className="text-[10px] text-slate-400">Fracionados & Ambev On</span>
                      </div>
                      <div className="bg-purple-950/40 border border-purple-500/30 p-3 rounded-xl text-center">
                        <span className="font-black text-purple-400 block uppercase">Pulmão de Carretas</span>
                        <span className="text-[10px] text-slate-400">Descarregamento Puxada</span>
                      </div>
                    </div>

                    {/* CENTRAL STORAGE BLOCKS (A, B, C) */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
                      <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Armazém Central (615 Paletes) — Blocos C, B, A</span>
                        <span className="text-[10px] text-slate-400 font-mono">Disposição Curva ABC</span>
                      </h5>

                      {/* BLOCKS GRID */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* BLOCO C - CURVA C (RED) */}
                        <div className="bg-rose-950/30 border-2 border-rose-600/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-rose-800/40 pb-1.5">
                            <span className="font-black text-rose-400 text-xs uppercase">Bloco C (Curva C)</span>
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 font-mono px-1.5 py-0.5 rounded font-bold">Fundo</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-center font-bold">
                            <div className="bg-rose-900/40 text-rose-200 p-2 rounded border border-rose-700/40">C1 (Ruas 09-10)</div>
                            <div className="bg-rose-900/40 text-rose-200 p-2 rounded border border-rose-700/40">C2 (Ruas 11-12)</div>
                            <div className="bg-rose-900/40 text-rose-200 p-2 rounded border border-rose-700/40">C3 (Ruas 13-14)</div>
                            <div className="bg-rose-900/40 text-rose-200 p-2 rounded border border-rose-700/40">C4 (Ruas 15-16)</div>
                          </div>
                        </div>

                        {/* BLOCO B - CURVA B (YELLOW) */}
                        <div className="bg-amber-950/30 border-2 border-amber-600/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-amber-800/40 pb-1.5">
                            <span className="font-black text-amber-400 text-xs uppercase">Bloco B (Curva B)</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded font-bold">Centro</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-center font-bold">
                            <div className="bg-amber-900/40 text-amber-200 p-2 rounded border border-amber-700/40">B1 (Ruas 05-06)</div>
                            <div className="bg-amber-900/40 text-amber-200 p-2 rounded border border-amber-700/40">B2 (Ruas 07-08)</div>
                            <div className="bg-amber-900/40 text-amber-200 p-2 rounded border border-amber-700/40">B3 (Ruas 05-06)</div>
                            <div className="bg-amber-900/40 text-amber-200 p-2 rounded border border-amber-700/40">B4 (Ruas 07-08)</div>
                          </div>
                        </div>

                        {/* BLOCO A - CURVA A (GREEN) */}
                        <div className="bg-emerald-950/30 border-2 border-emerald-600/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between border-b border-emerald-800/40 pb-1.5">
                            <span className="font-black text-emerald-400 text-xs uppercase">Bloco A (Curva A)</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded font-bold">Próx. Doca</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px] text-center font-bold">
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A1</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A2</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A3</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A4</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A5</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A6</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A7</div>
                            <div className="bg-emerald-900/40 text-emerald-200 p-1.5 rounded border border-emerald-700/40">A8</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PICKING & CONTINGÊNCIA ROW */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-amber-950/40 border-2 border-dashed border-amber-500/60 p-4 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-400 uppercase">Área de Picking (160 Paletes)</span>
                          <span className="text-[10px] font-mono text-slate-300">Separação Rápida</span>
                        </div>
                        <p className="text-[11px] text-slate-300">Posições no nível do piso para separação de mistos e abastecimento diário.</p>
                      </div>

                      <div className="bg-rose-950/40 border-2 border-dashed border-rose-500/60 p-4 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-rose-400 uppercase">Área de Contingência (108 Paletes)</span>
                          <span className="text-[10px] font-mono text-slate-300">Buffer / Transbordo</span>
                        </div>
                        <p className="text-[11px] text-slate-300">Ativada exclusivamente ao atingir 100% da capacidade do Central.</p>
                      </div>
                    </div>

                    {/* DPO LEGEND BOX */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      <h5 className="text-xs font-black text-white uppercase tracking-wider">
                        Sinalização & Legendas de Segurança DPO
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0"></span>
                          <span className="text-slate-300 font-bold">Curva A (Verde - Alto Giro)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="w-3 h-3 rounded bg-amber-500 flex-shrink-0"></span>
                          <span className="text-slate-300 font-bold">Curva B (Amarelo - Médio Giro)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="w-3 h-3 rounded bg-rose-500 flex-shrink-0"></span>
                          <span className="text-slate-300 font-bold">Curva C (Vermelho - Baixo Giro)</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="w-3 h-3 rounded bg-red-600 flex-shrink-0"></span>
                          <span className="text-slate-300 font-bold">Red Zone (Tráfego Restrito)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </LayoutPanZoomViewer>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-800 bg-[#070d1e] flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Padrão DPO PB-GBA-LAY-01 · Revenda Guarabira · Capacidade 967 PL
              </span>
              <button
                onClick={() => setShowOfficialLayoutModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POP OPERATIONAL MODAL */}
      <PadraoOperacionalModal
        moduleKey="empilhador"
        moduleName="Gestão de Capacidade & Layout do Armazém"
        isOpen={isPopOpen}
        onClose={() => setIsPopOpen(false)}
        user={user}
      />

      {/* DEDICATED ACTION MODAL (FILTERED FOR CAPACIDADE & LAYOUT & CURVA ABC) */}
      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Gestão de Capacidade & Layout"
        indicatorSubtitle="Visualizando e gerenciando apenas os planos de ação e contramedidas 5W2H relacionados à Curva ABC, Otimização de Layout e Gestão de Capacidade."
        indicatorBadge="CAPACIDADE DPO"
        allowedProcessos={['Gestão de Capacidade', 'Curva ABC', 'Layout', 'Otimização de Layout', 'Capacidade']}
        defaultProcesso="Gestão de Capacidade"
        defaultIndicador="Otimização de Layout, Curva ABC e Capacidade Instalada"
        defaultMeta="≤ 85% de Ocupação / 100% Curva ABC"
        user={user}
      />

      {/* MODAL DE EDIÇÃO RÁPIDA DE SKU & CADASTRO DE PRODUTOS */}
      {showSkuEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sans font-black text-sm uppercase text-slate-900 dark:text-white flex items-center gap-2">
                    Editar Cadastro &amp; Palletização do SKU
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      #{editingSkuData.codigo}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajuste os parâmetros de pallet, lastro, hectolitros e descrição oficial sincronizados com o Cadastro Geral.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSkuEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* DESCRIÇÃO OFICIAL */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Descrição Oficial do Produto
                </label>
                <input
                  type="text"
                  value={editingSkuData.produto}
                  onChange={(e) => setEditingSkuData(prev => ({ ...prev, produto: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="Ex: SKOL PURO MALTE 350ML CX 12UN"
                />
              </div>

              {/* GRUPO / FAMÍLIA & ÁREA NO ARMAZÉM */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Grupo / Categoria
                  </label>
                  <select
                    value={editingSkuData.grupo}
                    onChange={(e) => setEditingSkuData(prev => ({ ...prev, grupo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="CERVEJA">CERVEJA</option>
                    <option value="NAB">NAB (Refrigerantes / Sucos / Águas)</option>
                    <option value="MARKETPLACE">MARKETPLACE (Alimentos, Azeites, Doces)</option>
                    <option value="HALLS">HALLS</option>
                    <option value="TRIDENT">TRIDENT</option>
                    <option value="AZEITE">AZEITE</option>
                    <option value="DOCES VIEIRA">DOCES VIEIRA</option>
                    <option value="TANG">TANG</option>
                    <option value="CONFEITOS & BALAS">CONFEITOS & BALAS</option>
                    <option value="DESTILADOS">DESTILADOS</option>
                    <option value="VINHOS">VINHOS</option>
                    <option value="Produtos de Limpeza">PRODUTOS DE LIMPEZA</option>
                    <option value="OUTROS">OUTROS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Área Designada no Armazém
                  </label>
                  <select
                    value={editingSkuData.areaId}
                    onChange={(e) => setEditingSkuData(prev => ({ ...prev, areaId: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value={1}>1 - Armazém Central</option>
                    <option value={2}>2 - Picking</option>
                    <option value={3}>3 - Marketplace</option>
                    <option value={4}>4 - Contingência</option>
                    <option value={5}>5 - Pulmão</option>
                    <option value={6}>6 - PNC (Não Conformes)</option>
                    <option value={7}>7 - Produtos de Limpeza</option>
                  </select>
                </div>
              </div>

              {/* PALLETIZAÇÃO, LASTRO & CAMADAS */}
              <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-4 h-4 text-amber-500" />
                    Regras de Palletização &amp; Lastro
                  </span>
                  <span className="text-[10px] font-bold font-mono text-amber-700 dark:text-amber-400">
                    {editingSkuData.lastro} cx/lastro × {editingSkuData.camadas} camadas = {editingSkuData.caixasPallet} cx/pal
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Caixas / Pallet (Fator Pallet)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingSkuData.caixasPallet}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setEditingSkuData(prev => {
                          const currentLastro = prev.lastro || 10;
                          const camadas = Math.max(1, Math.round(val / currentLastro));
                          return { ...prev, caixasPallet: val, camadas };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Caixas / Lastro
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingSkuData.lastro}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setEditingSkuData(prev => {
                          const camadas = Math.max(1, Math.round(prev.caixasPallet / val));
                          return { ...prev, lastro: val, camadas };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Camadas (Alturas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editingSkuData.camadas}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setEditingSkuData(prev => {
                          const caixasPallet = prev.lastro * val;
                          return { ...prev, camadas: val, caixasPallet };
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* FATOR CAIXA, FATOR HECTO & VALOR UNITÁRIO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Fator Caixa (un/cx)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingSkuData.fatorCx}
                    onChange={(e) => setEditingSkuData(prev => ({ ...prev, fatorCx: Math.max(1, Number(e.target.value) || 1) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Fator Hectolitro (HE/cx)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editingSkuData.fatorHecto}
                    onChange={(e) => setEditingSkuData(prev => ({ ...prev, fatorHecto: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingSkuData.valorUnitario}
                    onChange={(e) => setEditingSkuData(prev => ({ ...prev, valorUnitario: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20 rounded-xl flex items-start gap-2 text-xs text-blue-800 dark:text-blue-300">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Ao salvar, as alterações serão atualizadas imediatamente no <strong>Cadastro Oficial de Produtos</strong> e os cálculos de posições pallet e volumes HE serão recalculados automaticamente em toda a aplicação.
                </span>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleOpenCadastro(editingSkuData.codigo)}
                className="px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir no Cadastro Completo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSkuEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSkuQuickEdit(editingSkuData)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar &amp; Recalcular</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
