import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Compass, 
  Warehouse, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calendar, 
  Search, 
  ArrowUpDown, 
  BarChart2, 
  Boxes, 
  RotateCcw,
  SlidersHorizontal,
  Package,
  Sparkles,
  TrendingDown,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  Percent,
  X,
  Zap
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  getStoredMonthlyColetas, 
  MONTH_KEYS,
  getSemanaDoMesFromDate
} from '../utils/stockAgeMonthlyManager';
import { 
  useVendaMedia030519,
  get030519DataForSku,
  getStored030519Quarters
} from '../utils/vendaMedia030519';
import { 
  getProductMeta, 
  getProductOfficialDescription,
  isMarketplaceProductExceptWater,
  isWaterProduct
} from '../utils/productCatalogData';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { StreetBreakdownChart, StreetQuebraData } from './curvaAbcRuas/StreetBreakdownChart';
import { StreetDrilldownModal } from './curvaAbcRuas/StreetDrilldownModal';
import { Q3AdherencePlanCard } from './curvaAbcRuas/Q3AdherencePlanCard';

export interface DesvioAderenciaRow {
  id: string;
  mesKey: string;
  mesNome: string;
  trimestre: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  trimestreNome: string;
  dataColeta: string;
  dataColetaIso: string;
  semanaNumero: number;
  codigo: string;
  descricao: string;
  rua: string;
  bloco: string; // 'A' | 'B' | 'C'
  curvaAbcReal: 'A' | 'B' | 'C';
  fonteCurva: string;
  ruaIdeal: string;
  blocoIdeal: string;
  isAderente: boolean;
  statusOkNok: 'OK' | 'NOK';
  severidade: 'ADERENTE' | 'ALERTA' | 'CRITICO';
  tipoDesvio: string;
  sugestaoAcao: string;
  
  // Pallets e Volumes (Pallets Fechados Arredondados)
  fatorPallet: number;
  quantidadePallets: number;
  quantidadeCaixas: number;
  volumeHectolitros: number;
  faturamentoOuValorEstimado: number;
  vendaMediaDiaria: number;
  
  // Percentual de desvio no bloco deste item
  pctDesvioBloco: number;
  
  // Validade e Idade
  diasRestantesValidade: number;
  statusValidade: string;
  stockAgeIndex: number;
  fatorHecto: number;
  precoUnitario: number;
}

export interface CurvaOccupancyKpis {
  curva: 'A' | 'B' | 'C';
  totalPallets: number;
  totalCaixas: number;
  totalLotes: number;
  palletsConformes: number; // No bloco correto
  caixasConformes: number;
  lotesConformes: number;
  palletsDesvio: number;   // Fora do bloco correto
  caixasDesvio: number;
  lotesDesvio: number;
  pctAtingimento: number;  // (palletsConformes / totalPallets) * 100
  palletsNoBlocoA: number;
  palletsNoBlocoB: number;
  palletsNoBlocoC: number;
}

export interface SummaryAderenciaKpis {
  totalLotesArmazemCentral: number;
  totalPalletsArmazemCentral: number;
  totalCaixasArmazemCentral: number;
  totalHectolitrosArmazemCentral: number;
  totalValorArmazemCentral: number;
  
  // Aderentes Gerais
  lotesAderentes: number;
  palletsAderentes: number;
  caixasAderentes: number;
  valorAderente: number;
  
  // Desvios Gerais
  lotesDesvio: number;
  palletsDesvio: number;
  caixasDesvio: number;
  valorDesvio: number;
  
  // Severidade
  lotesCriticos: number;
  palletsCriticos: number;
  lotesAlerta: number;
  palletsAlerta: number;
  
  // Taxas Globais
  taxaAderenciaPalletsPct: number;
  taxaAderenciaCaixasPct: number;
  taxaAderenciaLotesPct: number;
  taxaAderenciaValorPct: number;
  
  // Ocupação e Atingimento por Curva ABC de Vendas
  curvaA: CurvaOccupancyKpis;
  curvaB: CurvaOccupancyKpis;
  curvaC: CurvaOccupancyKpis;
  
  // Estatísticas por Bloco Físico
  blocoA: { totalPallets: number; palletsAderentes: number; palletsDesvio: number; pctDesvio: number };
  blocoB: { totalPallets: number; palletsAderentes: number; palletsDesvio: number; pctDesvio: number };
  blocoC: { totalPallets: number; palletsAderentes: number; palletsDesvio: number; pctDesvio: number };
}

const RUAS_BLOCO_A = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];
const RUAS_BLOCO_B = ['B1', 'B2', 'B3', 'B4'];
const RUAS_BLOCO_C = ['C1', 'C2', 'C3', 'C4'];

/**
 * Normaliza qualquer formato de data (DD/MM/YYYY ou YYYY-MM-DD) para ISO YYYY-MM-DD
 */
function normalizeDateToIso(dateStr: string): { iso: string; mesKey: string; monthNum: number; ano: number } {
  if (!dateStr) {
    return { iso: '2026-08-21', mesKey: '08', monthNum: 8, ano: 2026 };
  }
  const clean = dateStr.trim();
  
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      const mNum = parseInt(m, 10) || 8;
      return { iso: `${y}-${m}-${d}`, mesKey: m, monthNum: mNum, ano: parseInt(y, 10) || 2026 };
    }
  }

  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4) {
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      const mNum = parseInt(m, 10) || 8;
      return { iso: `${y}-${m}-${d}`, mesKey: m, monthNum: mNum, ano: parseInt(y, 10) || 2026 };
    } else if (parts[2]?.length === 4) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      const mNum = parseInt(m, 10) || 8;
      return { iso: `${y}-${m}-${d}`, mesKey: m, monthNum: mNum, ano: parseInt(y, 10) || 2026 };
    }
  }

  return { iso: '2026-08-21', mesKey: '08', monthNum: 8, ano: 2026 };
}

/**
 * Retorna o trimestre com base no mês da data de coleta:
 * - Janeiro a Março (1 a 3) -> 1º Trimestre (Q1)
 * - Abril a Junho (4 a 6) -> 2º Trimestre (Q2)
 * - Julho a Setembro / Julho em diante (7 a 9) -> 3º Trimestre (Q3)
 * - Outubro a Dezembro (10 a 12) -> 4º Trimestre (Q4)
 */
function getTrimestreFromMonthNum(monthNum: number): { key: 'Q1' | 'Q2' | 'Q3' | 'Q4'; nome: string } {
  if (monthNum <= 3) return { key: 'Q1', nome: '1º Trimestre (Jan - Mar)' };
  if (monthNum <= 6) return { key: 'Q2', nome: '2º Trimestre (Abr - Jun)' };
  if (monthNum <= 9) return { key: 'Q3', nome: '3º Trimestre (Jul - Set)' };
  return { key: 'Q4', nome: '4º Trimestre (Out - Dez)' };
}

interface CurvaAbcAderenciaRuasTabProps {
  empresaId?: string;
  activeValidades?: any[];
}

export default function CurvaAbcAderenciaRuasTab({ empresaId = 'demo', activeValidades }: CurvaAbcAderenciaRuasTabProps) {
  // 1. Filtros Principais
  const [filterMode, setFilterMode] = useState<'all' | 'quarter' | 'month' | 'custom_range'>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<'ALL' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' ou '01' a '12'
  const [customStartDate, setCustomStartDate] = useState<string>('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-12-31');

  // Filtros Operacionais
  const [selectedBlocoFilter, setSelectedBlocoFilter] = useState<'TODOS' | 'A' | 'B' | 'C'>('TODOS');
  const [selectedRuaFilter, setSelectedRuaFilter] = useState<string>('TODAS');
  const [statusAderenciaFilter, setStatusAderenciaFilter] = useState<'TODOS' | 'OK' | 'NOK' | 'CRITICO' | 'ALERTA'>('TODOS');
  const [curvaFilter, setCurvaFilter] = useState<'TODAS' | 'A' | 'B' | 'C'>('TODAS');
  const [matrixCellFilter, setMatrixCellFilter] = useState<{ curva: 'A' | 'B' | 'C'; bloco: 'A' | 'B' | 'C' } | null>(null);
  const [selectedDrilldownRua, setSelectedDrilldownRua] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 2. Ordenação e Paginação
  const [sortField, setSortField] = useState<keyof DesvioAderenciaRow>('quantidadePallets');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 3. Venda Média e Quarters da 03.05.19
  const { dataMap: map030519 } = useVendaMedia030519();
  const [monthlyDataTick, setMonthlyDataTick] = useState(0);

  // Listener para atualizações em tempo real entre dashboards
  useEffect(() => {
    let timeoutId: any = null;
    const handleStorageChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setMonthlyDataTick(prev => prev + 1);
      }, 100);
    };

    const events = [
      'storage',
      'local_data_changed',
      'validades_updated',
      'venda_media_imported',
      'vendaMedia030519Updated',
      'estoque_updated',
      'app_data_updated'
    ];

    events.forEach(evt => window.addEventListener(evt, handleStorageChange));
    return () => {
      clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, handleStorageChange));
    };
  }, []);

  // 4. Cruzamento dos Dados Mês a Mês do Stock Age Index com a Curva ABC por Trimestres + Conversão para PALLETS FECHADOS
  const rawAnalyzedDataset = useMemo(() => {
    const storedColetas = getStoredMonthlyColetas();
    const storedQuarters = getStored030519Quarters();
    
    // Tenta carregar também de af_curva_abc_trimestres_030519_v1
    let rawQuartersStore: any = storedQuarters;
    try {
      const saved = localStorage.getItem('af_curva_abc_trimestres_030519_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          rawQuartersStore = { ...storedQuarters, ...parsed };
        }
      }
    } catch (_) {}

    // Pré-computar mapas de Curva ABC para cada trimestre com base nas vendas 03.05.19
    const quarterAbcMaps: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', Map<string, 'A' | 'B' | 'C'>> = {
      Q1: new Map(),
      Q2: new Map(),
      Q3: new Map(),
      Q4: new Map()
    };

    (['Q1', 'Q2', 'Q3', 'Q4'] as const).forEach(qKey => {
      const qData = rawQuartersStore[qKey];
      if (qData && qData.itemsMap) {
        const items = Object.values(qData.itemsMap) as any[];
        // Sort por volume/faturamento total do trimestre
        const sorted = [...items].sort((a, b) => (Number(b.volumeTotalTrimestre || b.faturamentoTotal) || 0) - (Number(a.volumeTotalTrimestre || a.faturamentoTotal) || 0));
        const totalVol = sorted.reduce((sum, item) => sum + (Number(item.volumeTotalTrimestre || item.faturamentoTotal) || 0), 0);
        
        let acc = 0;
        sorted.forEach((item, idx) => {
          const vol = Number(item.volumeTotalTrimestre || item.faturamentoTotal) || 0;
          acc += vol;
          const pct = totalVol > 0 ? (acc / totalVol) * 100 : 0;
          let cls: 'A' | 'B' | 'C' = (pct <= 60.01 || idx === 0) ? 'A' : (pct <= 85.01) ? 'B' : 'C';
          
          if (qData.overridesABC?.[item.codigo]) {
            cls = qData.overridesABC[item.codigo];
          } else if (item.classeABC) {
            cls = item.classeABC;
          }

          const codeStr = String(item.codigo).trim();
          quarterAbcMaps[qKey].set(codeStr, cls);
          quarterAbcMaps[qKey].set(String(parseInt(codeStr, 10)), cls);
        });
      }
    });

    const rows: DesvioAderenciaRow[] = [];

    // Meses a processar de Janeiro a Dezembro
    const allMonthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

    allMonthKeys.forEach(mKey => {
      const monthMeta = MONTH_KEYS.find(m => m.key === mKey) || { name: `Mês ${mKey}`, short: mKey };
      const rawList = storedColetas[mKey] || [];

      rawList.forEach((item, idx) => {
        const codigoStr = String(item.codigo || '').trim();
        const codeNum = parseInt(codigoStr.replace(/\D/g, ''), 10) || 0;
        const officialDesc = getProductOfficialDescription(codeNum, item.descricao || '');
        const pMeta = getProductMeta(codeNum, empresaId);
        const pMaster = PRODUCT_MASTER_DATA.find(p => p.cod === codeNum);
        const grupo = pMaster?.grupo || pMeta?.grupo || '';

        // REGRA ESTRITA: Produtos classificados como marketplace (drops, gomas, confeitos, halls, tang, mercearia, doces, etc.),
        // EXCETO ÁGUAS, ficam em local exclusivo separado e NÃO podem entrar na Aderência da Curva ABC do Armazém Central!
        if (isMarketplaceProductExceptWater(codeNum, officialDesc || item.descricao, grupo, (item as any).areaId)) {
          return; // Exclui produtos de marketplace (exceto águas)
        }

        // FILTRAGEM ESTRITA DE ÁREA: Excluir 'picking' e 'marketplace' (exceto se for água mineral de armazenagem central)
        const rawSubBloco = String(item.subBloco || '').trim().toLowerCase();
        const rawBlocoPrincipal = String(item.blocoPrincipal || '').trim().toLowerCase();
        const rawDescricao = String(item.descricao || '').trim().toLowerCase();
        const rawLocal = String((item as any).localizacao || (item as any).setor || '').trim().toLowerCase();
        const isWater = isWaterProduct(officialDesc || item.descricao, grupo);

        if (!isWater) {
          if (
            rawSubBloco.includes('picking') || 
            rawBlocoPrincipal.includes('picking') || 
            rawDescricao.includes('picking') ||
            rawLocal.includes('picking') ||
            rawSubBloco.includes('marketplace') || 
            rawBlocoPrincipal.includes('marketplace') || 
            rawDescricao.includes('marketplace') || 
            rawLocal.includes('marketplace') ||
            rawSubBloco.includes('mktp') ||
            rawBlocoPrincipal.includes('mktp')
          ) {
            return; // Pula itens de picking e marketplace
          }
        }

        const dateInfo = normalizeDateToIso(item.dataColeta || `2026-${mKey}-15`);
        const { iso: dataColetaIso, monthNum } = dateInfo;
        const triInfo = getTrimestreFromMonthNum(monthNum);

        // 1. Aplicação dos filtros de período (Modo: all, quarter, month, custom_range)
        if (filterMode === 'quarter' && selectedQuarter !== 'ALL' && triInfo.key !== selectedQuarter) {
          return;
        }

        if (filterMode === 'month' && selectedMonth !== 'ALL' && mKey !== selectedMonth) {
          return;
        }

        if (filterMode === 'custom_range') {
          if (customStartDate && dataColetaIso < customStartDate) return;
          if (customEndDate && dataColetaIso > customEndDate) return;
        }
        
        // Mapeamento e normalização estrita da Rua e Bloco no Armazém Central (A1-A8, B1-B4, C1-C4)
        let ruaRaw = String(item.subBloco || '').trim().toUpperCase().replace(/^RUA\s*/i, '');
        let blocoRaw = String(item.blocoPrincipal || '').trim().toUpperCase();

        const VALID_RUAS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];

        let ruaFinal = '';
        if (VALID_RUAS.includes(ruaRaw)) {
          ruaFinal = ruaRaw;
        } else if (['A', 'B', 'C'].includes(blocoRaw)) {
          // Se tiver apenas o bloco no armazém central, atribui à primeira rua correspondente
          ruaFinal = `${blocoRaw}1`;
        } else {
          return; // Pula qualquer endereço fora das ruas A1-A8, B1-B4, C1-C4
        }

        const blocoFinal = ruaFinal.charAt(0);
        const rua = ruaFinal;
        const bloco = blocoFinal;

        // 3. CURVA ABC VENDAS DE ACORDO COM O TRIMESTRE DA COLETA
        // - Janeiro a Março (1º Tri / Q1)
        // - Abril a Junho (2º Tri / Q2)
        // - Julho em diante (3º Tri / Q3: Julho e Agosto)
        let curvaAbcReal: 'A' | 'B' | 'C' = 'B';
        let fonteCurva = 'Cadastro';

        const qMap = quarterAbcMaps[triInfo.key];
        if (qMap && (qMap.has(codigoStr) || qMap.has(String(codeNum)))) {
          curvaAbcReal = qMap.get(codigoStr) || qMap.get(String(codeNum)) || 'B';
          fonteCurva = `03.05.19 (${triInfo.key})`;
        } else {
          // Fallback para outros trimestres disponíveis
          let foundInOtherQ = false;
          for (const otherQ of ['Q1', 'Q2', 'Q3', 'Q4'] as const) {
            const oMap = quarterAbcMaps[otherQ];
            if (oMap && (oMap.has(codigoStr) || oMap.has(String(codeNum)))) {
              curvaAbcReal = oMap.get(codigoStr) || oMap.get(String(codeNum)) || 'B';
              fonteCurva = `03.05.19 (${otherQ})`;
              foundInOtherQ = true;
              break;
            }
          }

          if (!foundInOtherQ) {
            const imported030519 = get030519DataForSku(codigoStr);
            if (imported030519 && imported030519.curvaAbc && ['A', 'B', 'C'].includes(imported030519.curvaAbc)) {
              curvaAbcReal = imported030519.curvaAbc;
              fonteCurva = '03.05.19 Consolidado';
            } else if (pMeta.curva && ['A', 'B', 'C'].includes(pMeta.curva.toUpperCase())) {
              curvaAbcReal = pMeta.curva.toUpperCase() as 'A' | 'B' | 'C';
              fonteCurva = 'Cadastro Produtos';
            } else if (pMaster?.curva && ['A', 'B', 'C'].includes(pMaster.curva.toUpperCase())) {
              curvaAbcReal = pMaster.curva.toUpperCase() as 'A' | 'B' | 'C';
              fonteCurva = 'Master Data';
            } else if (item.curva && ['A', 'B', 'C'].includes(item.curva.toUpperCase())) {
              curvaAbcReal = item.curva.toUpperCase() as 'A' | 'B' | 'C';
              fonteCurva = 'Registro Coleta';
            }
          }
        }

        // Determinar Bloco e Rua Ideal com base na Curva ABC Real
        let blocoIdeal = 'A';
        let ruaIdeal = 'A1 a A8';
        if (curvaAbcReal === 'A') {
          blocoIdeal = 'A';
          ruaIdeal = 'A1 a A8';
        } else if (curvaAbcReal === 'B') {
          blocoIdeal = 'B';
          ruaIdeal = 'B1 a B4';
        } else {
          blocoIdeal = 'C';
          ruaIdeal = 'C1 a C4';
        }

        // Cálculo de Aderência e Severidade dos Desvios
        let isAderente = false;
        let severidade: 'ADERENTE' | 'ALERTA' | 'CRITICO' = 'ADERENTE';
        let tipoDesvio = 'Posicionamento Correto';
        let sugestaoAcao = 'Manter no endereço atual';

        if (curvaAbcReal === 'A') {
          if (bloco === 'A') {
            isAderente = true;
            severidade = 'ADERENTE';
            tipoDesvio = 'Conforme (Curva A no Bloco A)';
            sugestaoAcao = rua === 'A1' ? 'Posicionamento nobre ideal (Rua A1)' : 'Manter alocado no Bloco A próximo ao Picking';
          } else if (bloco === 'B') {
            isAderente = false;
            severidade = 'ALERTA';
            tipoDesvio = 'Curva A alocado no Bloco B (Centro)';
            sugestaoAcao = 'Remanejar para o Bloco A (Ruas A1-A8) para agilizar abastecimento do picking';
          } else {
            isAderente = false;
            severidade = 'CRITICO';
            tipoDesvio = 'Curva A alocado no Bloco C (Fundo)';
            sugestaoAcao = 'Remanejar URGENTE para o Bloco A (A1-A2) - SKU de altíssimo giro no fundo do armazém';
          }
        } else if (curvaAbcReal === 'B') {
          if (bloco === 'B') {
            isAderente = true;
            severidade = 'ADERENTE';
            tipoDesvio = 'Conforme (Curva B no Bloco B)';
            sugestaoAcao = 'Manter alocado no Centro do Armazém (Bloco B)';
          } else if (bloco === 'A') {
            isAderente = false;
            severidade = 'ALERTA';
            tipoDesvio = 'Curva B ocupando Bloco A (Área Nobre)';
            sugestaoAcao = 'Transferir para Bloco B (B1-B4) para liberar espaço nobre para itens Curva A';
          } else {
            isAderente = false;
            severidade = 'ALERTA';
            tipoDesvio = 'Curva B alocado no Bloco C (Fundo)';
            sugestaoAcao = 'Remanejar para o Bloco B no próximo giro';
          }
        } else {
          // Curva C
          if (bloco === 'C') {
            isAderente = true;
            severidade = 'ADERENTE';
            tipoDesvio = 'Conforme (Curva C / Gatilho no Bloco C)';
            sugestaoAcao = 'Manter no Bloco C (Ruas C1-C4) preservando ruas nobres A e B livres';
          } else if (bloco === 'A') {
            isAderente = false;
            severidade = 'CRITICO';
            tipoDesvio = 'Curva C bloqueando Bloco A (Área Nobre)';
            sugestaoAcao = 'Remover IMEDIATAMENTE do Bloco A e destinar ao Bloco C (Ruas C1-C4)';
          } else {
            isAderente = false;
            severidade = 'ALERTA';
            tipoDesvio = 'Curva C alocado no Bloco B (Centro)';
            sugestaoAcao = 'Transferir para o Bloco C (Ruas C1-C4) para abrir espaço para itens Curva B';
          }
        }

        const statusOkNok: 'OK' | 'NOK' = isAderente ? 'OK' : 'NOK';

        // 4. CONVERSÃO EXATA PARA PALLET FECHADO (ARREDONDADO)
        const qtdeCaixas = Number(item.qtdeCaixas) || 0;
        
        let fatorPallet = 60;
        if (pMeta.fatorPallet && pMeta.fatorPallet > 0) {
          fatorPallet = pMeta.fatorPallet;
        } else if (pMeta.caixasPallet && pMeta.caixasPallet > 0) {
          fatorPallet = pMeta.caixasPallet;
        } else if (pMaster?.fatorPallet && pMaster.fatorPallet > 0) {
          fatorPallet = pMaster.fatorPallet;
        }

        // Como no armazém central só existem pallets fechados, a quantidade de pallets é sempre um número inteiro arredondado
        const quantidadePallets = qtdeCaixas > 0 
          ? Math.max(1, Math.round(qtdeCaixas / (fatorPallet > 0 ? fatorPallet : 60)))
          : 0;

        const fatorHecto = pMeta.fatorHecto || pMaster?.fatorHecto || 0.12;
        const volumeHectolitros = Math.round((qtdeCaixas * fatorHecto) * 100) / 100;
        const precoUnitario = pMeta.preco || (pMaster as any)?.valor || 48.0;
        const faturamentoOuValorEstimado = Math.round((qtdeCaixas * precoUnitario) * 100) / 100;
        const vendaMediaDiaria = 5.0;
        const semanaNumero = getSemanaDoMesFromDate(item.dataColeta || dataColetaIso);
        const descricaoOficial = getProductOfficialDescription(codeNum, item.descricao || `SKU ${codigoStr}`, empresaId);

        rows.push({
          id: `${mKey}_${codigoStr}_${rua}_${idx}`,
          mesKey: mKey,
          mesNome: monthMeta.name,
          trimestre: triInfo.key,
          trimestreNome: triInfo.nome,
          dataColeta: item.dataColeta || `${dataColetaIso.split('-')[2]}/${dataColetaIso.split('-')[1]}/${dataColetaIso.split('-')[0]}`,
          dataColetaIso,
          semanaNumero,
          codigo: codigoStr,
          descricao: descricaoOficial,
          rua,
          bloco,
          curvaAbcReal,
          fonteCurva,
          ruaIdeal,
          blocoIdeal,
          isAderente,
          statusOkNok,
          severidade,
          tipoDesvio,
          sugestaoAcao,
          fatorPallet,
          quantidadePallets,
          quantidadeCaixas: qtdeCaixas,
          volumeHectolitros,
          faturamentoOuValorEstimado,
          vendaMediaDiaria,
          pctDesvioBloco: 0,
          diasRestantesValidade: Number(item.validadeDias) || 90,
          statusValidade: (Number(item.validadeDias) || 90) <= 30 ? 'Crítico' : (Number(item.validadeDias) || 90) <= 60 ? 'Atenção' : 'OK',
          stockAgeIndex: Math.min(100, Math.max(0, Math.round(100 - ((Number(item.validadeDias) || 90) / 180) * 100))),
          fatorHecto,
          precoUnitario
        });
      });
    });

    // Calcular % de desvio por bloco físico
    const totalsByBlock: Record<string, { totalPl: number; desvioPl: number }> = {
      A: { totalPl: 0, desvioPl: 0 },
      B: { totalPl: 0, desvioPl: 0 },
      C: { totalPl: 0, desvioPl: 0 }
    };

    rows.forEach(r => {
      if (totalsByBlock[r.bloco]) {
        totalsByBlock[r.bloco].totalPl += r.quantidadePallets;
        if (!r.isAderente) {
          totalsByBlock[r.bloco].desvioPl += r.quantidadePallets;
        }
      }
    });

    rows.forEach(r => {
      const bInfo = totalsByBlock[r.bloco];
      if (bInfo && bInfo.totalPl > 0) {
        r.pctDesvioBloco = Math.round((bInfo.desvioPl / bInfo.totalPl) * 1000) / 10;
      }
    });

    return rows;
  }, [filterMode, selectedQuarter, selectedMonth, customStartDate, customEndDate, map030519, empresaId, monthlyDataTick]);

  // Constante de Meta Oficial de Aderência
  const META_ADERENCIA_OFICIAL = 70.0;

  // Função auxiliar para rolar suavemente até a tabela de detalhes
  const scrollToDetailsTable = () => {
    setTimeout(() => {
      const el = document.getElementById('tabela-detalhes-aderencia');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  // 4.1. Totais Gerais do Período Base (sem filtros operacionais locais)
  const periodBaseStats = useMemo(() => {
    let totalPl = 0;
    let okPl = 0;
    let nokPl = 0;
    let criticoPl = 0;
    let alertaPl = 0;

    rawAnalyzedDataset.forEach(r => {
      totalPl += r.quantidadePallets;
      if (r.statusOkNok === 'OK') {
        okPl += r.quantidadePallets;
      } else {
        nokPl += r.quantidadePallets;
        if (r.severidade === 'CRITICO') criticoPl += r.quantidadePallets;
        else alertaPl += r.quantidadePallets;
      }
    });

    return {
      totalPl: Math.round(totalPl * 10) / 10,
      okPl: Math.round(okPl * 10) / 10,
      nokPl: Math.round(nokPl * 10) / 10,
      criticoPl: Math.round(criticoPl * 10) / 10,
      alertaPl: Math.round(alertaPl * 10) / 10,
    };
  }, [rawAnalyzedDataset]);

  // 4.2. Filtragem Dinâmica dos Dados: qualquer filtro acionado remaneja os dados
  const filteredTableList = useMemo(() => {
    return rawAnalyzedDataset.filter(row => {
      // Filtro da célula da Matriz se clicada
      if (matrixCellFilter) {
        if (row.curvaAbcReal !== matrixCellFilter.curva || row.bloco !== matrixCellFilter.bloco) {
          return false;
        }
      }

      // Filtro de Bloco Físico
      if (selectedBlocoFilter !== 'TODOS' && row.bloco !== selectedBlocoFilter) {
        return false;
      }

      // Filtro de Rua
      if (selectedRuaFilter !== 'TODAS' && row.rua !== selectedRuaFilter) {
        return false;
      }

      // Filtro de Curva ABC
      if (curvaFilter !== 'TODAS' && row.curvaAbcReal !== curvaFilter) {
        return false;
      }

      // Filtro de Status de Aderência (OK, NOK, CRITICO, ALERTA)
      if (statusAderenciaFilter === 'OK' && row.statusOkNok !== 'OK') return false;
      if (statusAderenciaFilter === 'NOK' && row.statusOkNok !== 'NOK') return false;
      if (statusAderenciaFilter === 'CRITICO' && row.severidade !== 'CRITICO') return false;
      if (statusAderenciaFilter === 'ALERTA' && row.severidade !== 'ALERTA') return false;

      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = row.codigo.toLowerCase().includes(q);
        const matchDesc = row.descricao.toLowerCase().includes(q);
        const matchRua = row.rua.toLowerCase().includes(q);
        const matchAction = row.sugestaoAcao.toLowerCase().includes(q);
        if (!matchCode && !matchDesc && !matchRua && !matchAction) return false;
      }

      return true;
    });
  }, [rawAnalyzedDataset, matrixCellFilter, selectedBlocoFilter, selectedRuaFilter, curvaFilter, statusAderenciaFilter, searchQuery]);

  // 5. Estatísticas e KPIs Dinâmicos de Aderência baseados no recorte filtrado
  const summaryKpis: SummaryAderenciaKpis = useMemo(() => {
    let totalLotes = 0;
    let totalPallets = 0;
    let totalCaixas = 0;
    let totalHecto = 0;
    let totalValor = 0;

    let lotesAderentes = 0;
    let palletsAderentes = 0;
    let caixasAderentes = 0;
    let valorAderente = 0;

    let lotesDesvio = 0;
    let palletsDesvio = 0;
    let caixasDesvio = 0;
    let valorDesvio = 0;

    let lotesCriticos = 0;
    let palletsCriticos = 0;
    let lotesAlerta = 0;
    let palletsAlerta = 0;

    // Métricas específicas por Curva ABC Vendas
    const cA: CurvaOccupancyKpis = {
      curva: 'A', totalPallets: 0, totalCaixas: 0, totalLotes: 0,
      palletsConformes: 0, caixasConformes: 0, lotesConformes: 0,
      palletsDesvio: 0, caixasDesvio: 0, lotesDesvio: 0, pctAtingimento: 100,
      palletsNoBlocoA: 0, palletsNoBlocoB: 0, palletsNoBlocoC: 0
    };

    const cB: CurvaOccupancyKpis = {
      curva: 'B', totalPallets: 0, totalCaixas: 0, totalLotes: 0,
      palletsConformes: 0, caixasConformes: 0, lotesConformes: 0,
      palletsDesvio: 0, caixasDesvio: 0, lotesDesvio: 0, pctAtingimento: 100,
      palletsNoBlocoA: 0, palletsNoBlocoB: 0, palletsNoBlocoC: 0
    };

    const cC: CurvaOccupancyKpis = {
      curva: 'C', totalPallets: 0, totalCaixas: 0, totalLotes: 0,
      palletsConformes: 0, caixasConformes: 0, lotesConformes: 0,
      palletsDesvio: 0, caixasDesvio: 0, lotesDesvio: 0, pctAtingimento: 100,
      palletsNoBlocoA: 0, palletsNoBlocoB: 0, palletsNoBlocoC: 0
    };

    const bA = { totalPallets: 0, palletsAderentes: 0, palletsDesvio: 0, pctDesvio: 0 };
    const bB = { totalPallets: 0, palletsAderentes: 0, palletsDesvio: 0, pctDesvio: 0 };
    const bC = { totalPallets: 0, palletsAderentes: 0, palletsDesvio: 0, pctDesvio: 0 };

    filteredTableList.forEach(row => {
      totalLotes++;
      totalPallets += row.quantidadePallets;
      totalCaixas += row.quantidadeCaixas;
      totalHecto += row.volumeHectolitros;
      totalValor += row.faturamentoOuValorEstimado;

      // Por bloco físico
      if (row.bloco === 'A') {
        bA.totalPallets += row.quantidadePallets;
        if (row.isAderente) bA.palletsAderentes += row.quantidadePallets;
        else bA.palletsDesvio += row.quantidadePallets;
      } else if (row.bloco === 'B') {
        bB.totalPallets += row.quantidadePallets;
        if (row.isAderente) bB.palletsAderentes += row.quantidadePallets;
        else bB.palletsDesvio += row.quantidadePallets;
      } else if (row.bloco === 'C') {
        bC.totalPallets += row.quantidadePallets;
        if (row.isAderente) bC.palletsAderentes += row.quantidadePallets;
        else bC.palletsDesvio += row.quantidadePallets;
      }

      // Por Curva ABC Vendas
      const targetCurva = row.curvaAbcReal === 'A' ? cA : row.curvaAbcReal === 'B' ? cB : cC;
      targetCurva.totalLotes++;
      targetCurva.totalPallets += row.quantidadePallets;
      targetCurva.totalCaixas += row.quantidadeCaixas;

      if (row.bloco === 'A') targetCurva.palletsNoBlocoA += row.quantidadePallets;
      if (row.bloco === 'B') targetCurva.palletsNoBlocoB += row.quantidadePallets;
      if (row.bloco === 'C') targetCurva.palletsNoBlocoC += row.quantidadePallets;

      if (row.isAderente) {
        targetCurva.lotesConformes++;
        targetCurva.palletsConformes += row.quantidadePallets;
        targetCurva.caixasConformes += row.quantidadeCaixas;

        lotesAderentes++;
        palletsAderentes += row.quantidadePallets;
        caixasAderentes += row.quantidadeCaixas;
        valorAderente += row.faturamentoOuValorEstimado;
      } else {
        targetCurva.lotesDesvio++;
        targetCurva.palletsDesvio += row.quantidadePallets;
        targetCurva.caixasDesvio += row.quantidadeCaixas;

        lotesDesvio++;
        palletsDesvio += row.quantidadePallets;
        caixasDesvio += row.quantidadeCaixas;
        valorDesvio += row.faturamentoOuValorEstimado;

        if (row.severidade === 'CRITICO') {
          lotesCriticos++;
          palletsCriticos += row.quantidadePallets;
        } else {
          lotesAlerta++;
          palletsAlerta += row.quantidadePallets;
        }
      }
    });

    // % Atingimento de cada Curva
    cA.pctAtingimento = cA.totalPallets > 0 ? Math.round((cA.palletsConformes / cA.totalPallets) * 1000) / 10 : 100;
    cB.pctAtingimento = cB.totalPallets > 0 ? Math.round((cB.palletsConformes / cB.totalPallets) * 1000) / 10 : 100;
    cC.pctAtingimento = cC.totalPallets > 0 ? Math.round((cC.palletsConformes / cC.totalPallets) * 1000) / 10 : 100;

    // Arredondar métricas de curvas
    [cA, cB, cC].forEach(c => {
      c.totalPallets = Math.round(c.totalPallets * 10) / 10;
      c.palletsConformes = Math.round(c.palletsConformes * 10) / 10;
      c.palletsDesvio = Math.round(c.palletsDesvio * 10) / 10;
      c.palletsNoBlocoA = Math.round(c.palletsNoBlocoA * 10) / 10;
      c.palletsNoBlocoB = Math.round(c.palletsNoBlocoB * 10) / 10;
      c.palletsNoBlocoC = Math.round(c.palletsNoBlocoC * 10) / 10;
    });

    bA.pctDesvio = bA.totalPallets > 0 ? Math.round((bA.palletsDesvio / bA.totalPallets) * 1000) / 10 : 0;
    bB.pctDesvio = bB.totalPallets > 0 ? Math.round((bB.palletsDesvio / bB.totalPallets) * 1000) / 10 : 0;
    bC.pctDesvio = bC.totalPallets > 0 ? Math.round((bC.palletsDesvio / bC.totalPallets) * 1000) / 10 : 0;

    const taxaAderenciaPalletsPct = totalPallets > 0 ? Math.round((palletsAderentes / totalPallets) * 1000) / 10 : 100;
    const taxaAderenciaCaixasPct = totalCaixas > 0 ? Math.round((caixasAderentes / totalCaixas) * 1000) / 10 : 100;
    const taxaAderenciaLotesPct = totalLotes > 0 ? Math.round((lotesAderentes / totalLotes) * 1000) / 10 : 100;
    const taxaAderenciaValorPct = totalValor > 0 ? Math.round((valorAderente / totalValor) * 1000) / 10 : 100;

    return {
      totalLotesArmazemCentral: totalLotes,
      totalPalletsArmazemCentral: Math.round(totalPallets * 10) / 10,
      totalCaixasArmazemCentral: totalCaixas,
      totalHectolitrosArmazemCentral: Math.round(totalHecto * 10) / 10,
      totalValorArmazemCentral: Math.round(totalValor),
      
      lotesAderentes,
      palletsAderentes: Math.round(palletsAderentes * 10) / 10,
      caixasAderentes,
      valorAderente: Math.round(valorAderente),
      
      lotesDesvio,
      palletsDesvio: Math.round(palletsDesvio * 10) / 10,
      caixasDesvio,
      valorDesvio: Math.round(valorDesvio),
      
      lotesCriticos,
      palletsCriticos: Math.round(palletsCriticos * 10) / 10,
      lotesAlerta,
      palletsAlerta: Math.round(palletsAlerta * 10) / 10,
      
      taxaAderenciaPalletsPct,
      taxaAderenciaCaixasPct,
      taxaAderenciaLotesPct,
      taxaAderenciaValorPct,
      
      curvaA: cA,
      curvaB: cB,
      curvaC: cC,
      
      blocoA: {
        totalPallets: Math.round(bA.totalPallets * 10) / 10,
        palletsAderentes: Math.round(bA.palletsAderentes * 10) / 10,
        palletsDesvio: Math.round(bA.palletsDesvio * 10) / 10,
        pctDesvio: bA.pctDesvio
      },
      blocoB: {
        totalPallets: Math.round(bB.totalPallets * 10) / 10,
        palletsAderentes: Math.round(bB.palletsAderentes * 10) / 10,
        palletsDesvio: Math.round(bB.palletsDesvio * 10) / 10,
        pctDesvio: bB.pctDesvio
      },
      blocoC: {
        totalPallets: Math.round(bC.totalPallets * 10) / 10,
        palletsAderentes: Math.round(bC.palletsAderentes * 10) / 10,
        palletsDesvio: Math.round(bC.palletsDesvio * 10) / 10,
        pctDesvio: bC.pctDesvio
      }
    };
  }, [filteredTableList]);

  // 6. Matriz Cruzada de Ruas/Blocos vs Curva ABC Vendas (3x3 em PALLETS) recalculada dinamicamente
  const crossMatrixData = useMemo(() => {
    const matrix: Record<'A' | 'B' | 'C', Record<'A' | 'B' | 'C', { count: number; pallets: number; caixas: number; valor: number; topProducts: { cod: string; desc: string; pallets: number }[] }>> = {
      A: { 
        A: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] }, 
        B: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] }, 
        C: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] } 
      },
      B: { 
        A: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] }, 
        B: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] }, 
        C: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] } 
      },
      C: { 
        A: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] }, 
        B: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] }, 
        C: { count: 0, pallets: 0, caixas: 0, valor: 0, topProducts: [] } 
      },
    };

    const cellProductMap: Record<string, Map<string, { desc: string; pallets: number }>> = {};

    filteredTableList.forEach(row => {
      const ruaBloco = (row.bloco === 'A' || row.bloco === 'B' || row.bloco === 'C') ? row.bloco : 'A';
      const c = row.curvaAbcReal;
      const cellKey = `${c}_${ruaBloco}`;
      
      matrix[c][ruaBloco].count++;
      matrix[c][ruaBloco].pallets += row.quantidadePallets;
      matrix[c][ruaBloco].caixas += row.quantidadeCaixas;
      matrix[c][ruaBloco].valor += row.faturamentoOuValorEstimado;

      if (!cellProductMap[cellKey]) cellProductMap[cellKey] = new Map();
      const pMap = cellProductMap[cellKey];
      const cur = pMap.get(row.codigo) || { desc: row.descricao, pallets: 0 };
      cur.pallets += row.quantidadePallets;
      pMap.set(row.codigo, cur);
    });

    (['A', 'B', 'C'] as const).forEach(curva => {
      (['A', 'B', 'C'] as const).forEach(bloco => {
        const cellKey = `${curva}_${bloco}`;
        const pMap = cellProductMap[cellKey];
        if (pMap) {
          const list = Array.from(pMap.entries()).map(([cod, data]) => ({
            cod,
            desc: data.desc,
            pallets: Math.round(data.pallets * 10) / 10
          }));
          list.sort((a, b) => b.pallets - a.pallets);
          matrix[curva][bloco].topProducts = list.slice(0, 3);
        }
        matrix[curva][bloco].pallets = Math.round(matrix[curva][bloco].pallets * 10) / 10;
      });
    });

    return matrix;
  }, [filteredTableList]);

  // 7. Gráfico: Desvios e Aderência por Rua (A1 a A8, B1 a B4, C1 a C4) recalculado dinamicamente
  const chartDataRuasQuebra: StreetQuebraData[] = useMemo(() => {
    const ALL_RUAS = [
      { rua: 'A1', bloco: 'A' },
      { rua: 'A2', bloco: 'A' },
      { rua: 'A3', bloco: 'A' },
      { rua: 'A4', bloco: 'A' },
      { rua: 'A5', bloco: 'A' },
      { rua: 'A6', bloco: 'A' },
      { rua: 'A7', bloco: 'A' },
      { rua: 'A8', bloco: 'A' },
      { rua: 'B1', bloco: 'B' },
      { rua: 'B2', bloco: 'B' },
      { rua: 'B3', bloco: 'B' },
      { rua: 'B4', bloco: 'B' },
      { rua: 'C1', bloco: 'C' },
      { rua: 'C2', bloco: 'C' },
      { rua: 'C3', bloco: 'C' },
      { rua: 'C4', bloco: 'C' }
    ];

    return ALL_RUAS.map(({ rua, bloco }) => {
      const itemsInRua = filteredTableList.filter(r => r.rua === rua);
      let palletsOk = 0;
      let palletsQuebra = 0;
      let lotesOk = 0;
      let lotesQuebra = 0;

      itemsInRua.forEach(r => {
        if (r.statusOkNok === 'OK') {
          palletsOk += r.quantidadePallets;
          lotesOk++;
        } else {
          palletsQuebra += r.quantidadePallets;
          lotesQuebra++;
        }
      });

      const totalPallets = palletsOk + palletsQuebra;
      const pctQuebra = totalPallets > 0 ? Math.round((palletsQuebra / totalPallets) * 1000) / 10 : 0;
      const pctAderencia = totalPallets > 0 ? Math.round((palletsOk / totalPallets) * 1000) / 10 : 100;

      return {
        rua,
        bloco,
        palletsOk: Math.round(palletsOk),
        palletsQuebra: Math.round(palletsQuebra),
        totalPallets: Math.round(totalPallets),
        pctQuebra,
        pctAderencia,
        lotesTotal: itemsInRua.length,
        lotesQuebra,
        itensQuebrados: itemsInRua.filter(r => r.statusOkNok === 'NOK')
      };
    });
  }, [filteredTableList]);

  // 8. Gráfico: Desvios de Pallets por Curva ABC recalculado dinamicamente
  const chartDataCurvaDesvios = useMemo(() => {
    return [
      {
        curva: 'Curva A (Alta Demanda)',
        palletsConformes: summaryKpis.curvaA.palletsConformes,
        palletsDesvio: summaryKpis.curvaA.palletsDesvio,
        totalPallets: summaryKpis.curvaA.totalPallets,
        pctAtingimento: summaryKpis.curvaA.pctAtingimento
      },
      {
        curva: 'Curva B (Médio Giro)',
        palletsConformes: summaryKpis.curvaB.palletsConformes,
        palletsDesvio: summaryKpis.curvaB.palletsDesvio,
        totalPallets: summaryKpis.curvaB.totalPallets,
        pctAtingimento: summaryKpis.curvaB.pctAtingimento
      },
      {
        curva: 'Curva C (Baixo Giro)',
        palletsConformes: summaryKpis.curvaC.palletsConformes,
        palletsDesvio: summaryKpis.curvaC.palletsDesvio,
        totalPallets: summaryKpis.curvaC.totalPallets,
        pctAtingimento: summaryKpis.curvaC.pctAtingimento
      }
    ];
  }, [summaryKpis]);

  // 9. Gráfico: Top SKUs com Maiores Desvios em PALLETS recalculado dinamicamente
  const topDesvioSkus = useMemo(() => {
    const skuMap = new Map<string, {
      codigo: string;
      descricao: string;
      curvaAbcReal: 'A' | 'B' | 'C';
      ruaAtual: string;
      blocoAtual: string;
      ruaIdeal: string;
      blocoIdeal: string;
      fatorPallet: number;
      totalPalletsDesvio: number;
      totalCaixasDesvio: number;
      severidade: string;
    }>();

    filteredTableList
      .filter(r => r.statusOkNok === 'NOK')
      .forEach(r => {
        const key = `${r.codigo}_${r.rua}`;
        if (!skuMap.has(key)) {
          skuMap.set(key, {
            codigo: r.codigo,
            descricao: r.descricao,
            curvaAbcReal: r.curvaAbcReal,
            ruaAtual: r.rua,
            blocoAtual: r.bloco,
            ruaIdeal: r.ruaIdeal,
            blocoIdeal: r.blocoIdeal,
            fatorPallet: r.fatorPallet,
            totalPalletsDesvio: 0,
            totalCaixasDesvio: 0,
            severidade: r.severidade
          });
        }
        const item = skuMap.get(key)!;
        item.totalPalletsDesvio += r.quantidadePallets;
        item.totalCaixasDesvio += r.quantidadeCaixas;
      });

    const list = Array.from(skuMap.values()).map(i => ({
      ...i,
      totalPalletsDesvio: Math.round(i.totalPalletsDesvio)
    }));

    list.sort((a, b) => b.totalPalletsDesvio - a.totalPalletsDesvio);
    return list.slice(0, 8);
  }, [filteredTableList]);


  // 10. Ordenação dos Dados
  const sortedTableList = useMemo(() => {
    const list = [...filteredTableList];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredTableList, sortField, sortAsc]);

  // 11. Paginação
  const totalPages = Math.ceil(sortedTableList.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTableList.slice(start, start + itemsPerPage);
  }, [sortedTableList, currentPage, itemsPerPage]);

  const handleSort = (field: keyof DesvioAderenciaRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 12. Exportação CSV Completa com todas as métricas
  const handleExportCSV = useCallback(() => {
    const headers = [
      'CODIGO_SKU',
      'DESCRICAO_PRODUTO',
      'DATA_COLETA',
      'TRIMESTRE_COLETA',
      'MES_COLETA',
      'CURVA_ABC_VENDAS_REAL',
      'FONTE_CURVA',
      'RUA_ATUAL',
      'BLOCO_ATUAL',
      'RUA_IDEAL',
      'BLOCO_IDEAL',
      'STATUS_ADERENCIA',
      'SEVERIDADE',
      'FATOR_PALLET_CX_PL',
      'QUANTIDADE_PALLETS_PL',
      'QUANTIDADE_CAIXAS_CX',
      'VOLUME_HECTOLITROS_HL',
      'FATURAMENTO_ESTIMADO_RS',
      'PERCENTUAL_DESVIO_NO_BLOCO',
      'TIPO_DESVIO',
      'SUGESTAO_ACAO_REMANEJAMENTO'
    ];

    const rows = sortedTableList.map(r => [
      `"${r.codigo}"`,
      `"${r.descricao.replace(/"/g, '""')}"`,
      `"${r.dataColeta}"`,
      `"${r.trimestre}"`,
      `"${r.mesNome}"`,
      `"${r.curvaAbcReal}"`,
      `"${r.fonteCurva}"`,
      `"${r.rua}"`,
      `"${r.bloco}"`,
      `"${r.ruaIdeal}"`,
      `"${r.blocoIdeal}"`,
      `"${r.isAderente ? 'ADERENTE' : 'DESVIO'}"`,
      `"${r.severidade}"`,
      r.fatorPallet,
      r.quantidadePallets.toFixed(1),
      r.quantidadeCaixas,
      r.volumeHectolitros.toFixed(2),
      r.faturamentoOuValorEstimado.toFixed(2),
      `${r.pctDesvioBloco.toFixed(1)}%`,
      `"${r.tipoDesvio}"`,
      `"${r.sugestaoAcao.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Ocupacao_Aderencia_CurvaABC_Pallets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório de Ocupação em Pallets exportado com sucesso (.CSV)!');
  }, [sortedTableList]);

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/40 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER HERO BANNER COM INDICADORES INTEGRADOS (20% RATI / 5 MIN TEMPO MÉDIO / GATILHO) */}
      <div className="bg-gradient-to-r from-[#032147] via-[#0b2958] to-[#121c38] p-6 rounded-3xl text-white shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 w-max">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                RELATÓRIO DE OCUPAÇÃO & ADERÊNCIA DA CURVA ABC × RUAS
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                UNIDADE OFICIAL: PALLET (PL)
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30">
                RUAS: A1-A8 • B1-B4 • C1-C4
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Cruzamento Stock Age Index × Curva ABC Vendas Trimestral
            </h2>
            <p className="text-xs text-slate-300 font-medium max-w-4xl leading-relaxed">
              Análise de conformidade espacial do <strong>Armazém Central (Ruas A1-A8, B1-B4, C1-C4)</strong>. Converte caixas em <strong>Pallets (PL)</strong> através do fator de paletização cadastrado e valida se SKUs de alta rotação (Curva A) estão na área nobre (A1-A8), médio giro (Curva B) no centro (B1-B4) e baixo giro (Curva C / Gatilho) no fundo (C1-C4), sincronizado com as vendas dos trimestres <strong>Q1 (Jan-Mar)</strong>, <strong>Q2 (Abr-Jun)</strong> e <strong>Q3 (Jul em diante)</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* INDICADORES DO CABEÇALHO: RATI 20% E TEMPO MÉDIO 5 MIN */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-blue-500/30 shadow-inner">
              <div className="px-3 py-1.5 bg-blue-950/80 rounded-xl border border-blue-400/20 text-center">
                <span className="text-[9px] text-blue-300 font-black uppercase block tracking-wider">Meta RATI</span>
                <span className="text-sm font-black text-amber-300 font-mono">20.0%</span>
              </div>
              <div className="px-3 py-1.5 bg-blue-950/80 rounded-xl border border-blue-400/20 text-center">
                <span className="text-[9px] text-blue-300 font-black uppercase block tracking-wider">Tempo Médio</span>
                <span className="text-sm font-black text-emerald-300 font-mono">5 min</span>
              </div>
              <div className="px-3 py-1.5 bg-blue-950/80 rounded-xl border border-blue-400/20 text-center">
                <span className="text-[9px] text-purple-300 font-black uppercase block tracking-wider">Gatilho C</span>
                <span className="text-sm font-black text-purple-300 font-mono">C1-C4</span>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg border border-emerald-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* PAINEL DE FILTROS AVANÇADOS */}
      <div className="bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* LINHA 1: FILTROS TEMPORAIS (TRIMESTRES E MESES) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Período da Coleta:
            </span>

            {/* SELETORES DE TRIMESTRES */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setFilterMode('all');
                  setSelectedQuarter('ALL');
                  setSelectedMonth('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ano 2026 Completo
              </button>

              <button
                onClick={() => {
                  setFilterMode('quarter');
                  setSelectedQuarter('Q1');
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                  filterMode === 'quarter' && selectedQuarter === 'Q1'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                1º Tri (Q1: Jan-Mar)
              </button>

              <button
                onClick={() => {
                  setFilterMode('quarter');
                  setSelectedQuarter('Q2');
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                  filterMode === 'quarter' && selectedQuarter === 'Q2'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                2º Tri (Q2: Abr-Jun)
              </button>

              <button
                onClick={() => {
                  setFilterMode('quarter');
                  setSelectedQuarter('Q3');
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                  filterMode === 'quarter' && selectedQuarter === 'Q3'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                3º Tri (Q3: Jul-Ago)
              </button>

              <button
                onClick={() => {
                  setFilterMode('quarter');
                  setSelectedQuarter('Q4');
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                  filterMode === 'quarter' && selectedQuarter === 'Q4'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                4º Tri (Q4: Set-Dez)
              </button>
            </div>
          </div>

          {/* MODO INTERVALO PERSONALIZADO OU SELEÇÃO MENSAL */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterMode === 'month' ? selectedMonth : 'CUSTOM'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'CUSTOM') {
                  setFilterMode('custom_range');
                } else if (val === 'ALL') {
                  setFilterMode('all');
                  setSelectedMonth('ALL');
                } else {
                  setFilterMode('month');
                  setSelectedMonth(val);
                }
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-1.5 font-bold focus:ring-2 focus:ring-blue-500 outline-hidden cursor-pointer"
            >
              <option value="ALL">Todos os Meses (Consolidado)</option>
              {MONTH_KEYS.map(m => (
                <option key={m.key} value={m.key}>{m.name} 2026</option>
              ))}
              <option value="CUSTOM">📅 Intervalo Personalizado</option>
            </select>

            {filterMode === 'custom_range' && (
              <div className="flex items-center gap-1.5 bg-blue-500/10 p-1.5 rounded-xl border border-blue-500/30">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-900 text-white text-[11px] font-bold rounded-lg px-2 py-1 border border-slate-700 outline-hidden"
                />
                <span className="text-[10px] font-bold text-slate-400">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-900 text-white text-[11px] font-bold rounded-lg px-2 py-1 border border-slate-700 outline-hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* LINHA 2: FILTROS OPERACIONAIS (STATUS, BLOCO, RUA, CURVA, BUSCA) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* FILTRO DE ADERÊNCIA / STATUS OK vs NOK */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setStatusAderenciaFilter('TODOS')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  statusAderenciaFilter === 'TODOS'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Todos ({summaryKpis.totalPalletsArmazemCentral} PL)
              </button>

              <button
                onClick={() => setStatusAderenciaFilter('OK')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  statusAderenciaFilter === 'OK'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>OK — Conformes ({summaryKpis.palletsAderentes} PL)</span>
              </button>

              <button
                onClick={() => setStatusAderenciaFilter('NOK')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  statusAderenciaFilter === 'NOK'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>NOK — Quebras ({summaryKpis.palletsDesvio} PL)</span>
              </button>

              <button
                onClick={() => setStatusAderenciaFilter('CRITICO')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  statusAderenciaFilter === 'CRITICO'
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-red-500 hover:bg-red-500/10'
                }`}
              >
                Críticos ({summaryKpis.palletsCriticos} PL)
              </button>

              <button
                onClick={() => setStatusAderenciaFilter('ALERTA')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                  statusAderenciaFilter === 'ALERTA'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-500 hover:bg-amber-500/10'
                }`}
              >
                Alerta ({summaryKpis.palletsAlerta} PL)
              </button>
            </div>

            {/* FILTRO CURVA ABC */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 px-1.5">Curva:</span>
              {(['TODAS', 'A', 'B', 'C'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCurvaFilter(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                    curvaFilter === c
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* FILTRO BLOCO */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 px-1.5">Bloco:</span>
              {(['TODOS', 'A', 'B', 'C'] as const).map(b => (
                <button
                  key={b}
                  onClick={() => setSelectedBlocoFilter(b)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                    selectedBlocoFilter === b
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {b === 'TODOS' ? 'Todos' : `Bloco ${b}`}
                </button>
              ))}
            </div>

            {/* FILTRO DE RUA ESPECÍFICA */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 px-1.5">Rua:</span>
              <select
                value={selectedRuaFilter}
                onChange={(e) => setSelectedRuaFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 text-[11px] font-bold outline-hidden cursor-pointer"
              >
                <option value="TODAS">Todas as Ruas</option>
                {['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'].map(r => (
                  <option key={r} value={r}>Rua {r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* BUSCA TEXTUAL */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, Descrição, Rua..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* BADGE DE FILTRO DA MATRIZ SE ATIVO */}
        {matrixCellFilter && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <Filter className="w-4 h-4 text-amber-400" />
              <span>Filtro ativo da Matriz 3x3: Curva {matrixCellFilter.curva} no Bloco {matrixCellFilter.bloco}</span>
            </div>
            <button
              onClick={() => setMatrixCellFilter(null)}
              className="text-xs text-amber-400 hover:text-white flex items-center gap-1 font-black cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtro da Matriz</span>
            </button>
          </div>
        )}
      </div>

      {/* RELATÓRIO DE OCUPAÇÃO & ATINGIMENTO POR GATILHO (CARDS PRINCIPAIS COM META NO TOPO, REAL EM BAIXO E ALERTA DE ESTOURO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD GATILHO / CURVA A */}
        {(() => {
          const metaA = 90; // Meta arredondada Curva A
          const realA = summaryKpis.curvaA.pctAtingimento;
          const isEstouradoA = realA < metaA;
          const desvioPctA = (metaA - realA).toFixed(1);

          return (
            <div className={`bg-white dark:bg-[#11192e] p-5 rounded-2xl border-2 transition-all shadow-md flex flex-col justify-between ${
              isEstouradoA ? 'border-amber-500/70 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-emerald-500/40'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-400" />
                    GATILHO CURVA A
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    Ruas A1 - A8
                  </span>
                </div>

                {/* META ARREDONDADA NO TOPO */}
                <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Gatilho / Meta Arredondada
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                    {metaA}% <span className="text-xs font-bold text-slate-400">Objetivo</span>
                  </div>
                </div>

                {/* REAL EM BAIXO */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Real Atingido:</span>
                    <span className={`text-lg font-black ${realA >= metaA ? 'text-emerald-500' : 'text-amber-400'}`}>
                      {realA.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {summaryKpis.curvaA.palletsConformes.toLocaleString('pt-BR')} de {summaryKpis.curvaA.totalPallets.toLocaleString('pt-BR')} PL conformes ({summaryKpis.curvaA.totalCaixas.toLocaleString('pt-BR')} cx)
                  </p>
                </div>

                {/* ALERTA SE ESTOURAR */}
                {isEstouradoA ? (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>🚨 ALERTA: GATILHO ESTOURADO (-{desvioPctA}% | {summaryKpis.curvaA.palletsDesvio} PL no B/C)</span>
                  </div>
                ) : (
                  <div className="mt-3 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>✓ Gatilho em Conformidade</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-black mb-1.5">
                  <span className="text-slate-400">Progresso Curva A:</span>
                  <span className={realA >= metaA ? 'text-emerald-400' : 'text-amber-400'}>
                    {realA.toFixed(1)}% / {metaA}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      realA >= metaA ? 'bg-emerald-500' : realA >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, realA)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* CARD GATILHO / CURVA B */}
        {(() => {
          const metaB = 85; // Meta arredondada Curva B
          const realB = summaryKpis.curvaB.pctAtingimento;
          const isEstouradoB = realB < metaB;
          const desvioPctB = (metaB - realB).toFixed(1);

          return (
            <div className={`bg-white dark:bg-[#11192e] p-5 rounded-2xl border-2 transition-all shadow-md flex flex-col justify-between ${
              isEstouradoB ? 'border-amber-500/70 bg-gradient-to-b from-amber-500/5 to-transparent' : 'border-amber-500/40'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    GATILHO CURVA B
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    Ruas B1 - B4
                  </span>
                </div>

                {/* META ARREDONDADA NO TOPO */}
                <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Gatilho / Meta Arredondada
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                    {metaB}% <span className="text-xs font-bold text-slate-400">Objetivo</span>
                  </div>
                </div>

                {/* REAL EM BAIXO */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Real Atingido:</span>
                    <span className={`text-lg font-black ${realB >= metaB ? 'text-emerald-500' : 'text-amber-400'}`}>
                      {realB.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {summaryKpis.curvaB.palletsConformes.toLocaleString('pt-BR')} de {summaryKpis.curvaB.totalPallets.toLocaleString('pt-BR')} PL conformes ({summaryKpis.curvaB.totalCaixas.toLocaleString('pt-BR')} cx)
                  </p>
                </div>

                {/* ALERTA SE ESTOURAR */}
                {isEstouradoB ? (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-400 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>🚨 ALERTA: GATILHO ESTOURADO (-{desvioPctB}% | {summaryKpis.curvaB.palletsDesvio} PL fora do B)</span>
                  </div>
                ) : (
                  <div className="mt-3 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>✓ Gatilho em Conformidade</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-black mb-1.5">
                  <span className="text-slate-400">Progresso Curva B:</span>
                  <span className={realB >= metaB ? 'text-emerald-400' : 'text-amber-400'}>
                    {realB.toFixed(1)}% / {metaB}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      realB >= metaB ? 'bg-emerald-500' : realB >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, realB)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* CARD GATILHO / CURVA C */}
        {(() => {
          const metaC = 90; // Meta arredondada Curva C
          const realC = summaryKpis.curvaC.pctAtingimento;
          const isEstouradoC = realC < metaC;
          const desvioPctC = (metaC - realC).toFixed(1);

          return (
            <div className={`bg-white dark:bg-[#11192e] p-5 rounded-2xl border-2 transition-all shadow-md flex flex-col justify-between ${
              isEstouradoC ? 'border-purple-500/70 bg-gradient-to-b from-purple-500/5 to-transparent' : 'border-purple-500/40'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-400" />
                    GATILHO CURVA C
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    Ruas C1 - C4
                  </span>
                </div>

                {/* META ARREDONDADA NO TOPO */}
                <div className="mt-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                    Gatilho / Meta Arredondada
                  </div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                    {metaC}% <span className="text-xs font-bold text-slate-400">Objetivo</span>
                  </div>
                </div>

                {/* REAL EM BAIXO */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Real Atingido:</span>
                    <span className={`text-lg font-black ${realC >= metaC ? 'text-emerald-500' : 'text-purple-400'}`}>
                      {realC.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {summaryKpis.curvaC.palletsConformes.toLocaleString('pt-BR')} de {summaryKpis.curvaC.totalPallets.toLocaleString('pt-BR')} PL conformes ({summaryKpis.curvaC.totalCaixas.toLocaleString('pt-BR')} cx)
                  </p>
                </div>

                {/* ALERTA SE ESTOURAR */}
                {isEstouradoC ? (
                  <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-[11px] text-purple-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                    <span>🚨 ALERTA: GATILHO ESTOURADO (-{desvioPctC}% | {summaryKpis.curvaC.palletsDesvio} PL no A/B)</span>
                  </div>
                ) : (
                  <div className="mt-3 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <span>✓ Gatilho em Conformidade</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-black mb-1.5">
                  <span className="text-slate-400">Progresso Curva C:</span>
                  <span className={realC >= metaC ? 'text-emerald-400' : 'text-purple-400'}>
                    {realC.toFixed(1)}% / {metaC}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      realC >= metaC ? 'bg-emerald-500' : realC >= 75 ? 'bg-purple-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, realC)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* CARD GATILHO / ADERÊNCIA GLOBAL DO ARMAZÉM COM META ARREDONDADA */}
        {(() => {
          const metaGlobal = Math.round(META_ADERENCIA_OFICIAL); // 70%
          const realGlobal = summaryKpis.taxaAderenciaPalletsPct;
          const isEstouradoGlobal = realGlobal < metaGlobal;
          const desvioPctGlobal = (metaGlobal - realGlobal).toFixed(1);

          return (
            <div className={`bg-gradient-to-br from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border-2 flex flex-col justify-between ${
              isEstouradoGlobal ? 'border-amber-400/70' : 'border-blue-400/50'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                    GATILHO GLOBAL
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    DPO: {metaGlobal}%
                  </span>
                </div>

                {/* META ARREDONDADA NO TOPO */}
                <div className="mt-3 bg-blue-950/70 p-3 rounded-xl border border-blue-400/30">
                  <div className="text-[11px] font-black uppercase text-blue-200 tracking-wider">
                    Gatilho / Meta Arredondada
                  </div>
                  <div className="text-3xl font-black text-white mt-0.5">
                    {metaGlobal}% <span className="text-xs font-bold text-blue-300">Meta Ambev</span>
                  </div>
                </div>

                {/* REAL EM BAIXO */}
                <div className="mt-3 pt-2 border-t border-blue-800/80">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-blue-200">Real Atingido:</span>
                    <span className={`text-lg font-black ${realGlobal >= metaGlobal ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {realGlobal.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-blue-200 font-medium mt-0.5">
                    {summaryKpis.palletsAderentes.toLocaleString('pt-BR')} de {summaryKpis.totalPalletsArmazemCentral.toLocaleString('pt-BR')} PL conformes
                  </p>
                </div>

                {/* ALERTA SE ESTOURAR */}
                {isEstouradoGlobal ? (
                  <div className="mt-3 p-2 bg-amber-400/20 border border-amber-400/40 rounded-xl text-[11px] text-amber-300 font-bold flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-300" />
                    <span>🚨 ALERTA: GATILHO ESTOURADO (-{desvioPctGlobal}% | {summaryKpis.palletsDesvio} PL em desvio)</span>
                  </div>
                ) : (
                  <div className="mt-3 p-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-[11px] text-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                    <span>✓ Meta Global Atingida</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-blue-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-blue-200">Progresso rumo aos {metaGlobal}%:</span>
                  <span className="text-amber-300 font-black">
                    {Math.min(100, Math.round((realGlobal / metaGlobal) * 100))}% do Objetivo
                  </span>
                </div>
                <div className="relative w-full h-2 bg-blue-950/80 rounded-full overflow-hidden border border-blue-700/50">
                  <div
                    className={`h-full transition-all duration-500 ${
                      realGlobal >= metaGlobal ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, (realGlobal / 100) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* MATRIZ DE CRUZAMENTO 3x3 (CURVA ABC VENDAS × BLOCO DE COLETA) */}
      <div className="bg-white dark:bg-[#11192e] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              Matriz de Cruzamento Espacial (Curva ABC Vendas × Bloco Físico)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Distribuição de <strong>Pallets (PL)</strong> no armazém. Clique em qualquer célula da matriz para descer e filtrar os produtos correspondentes na tabela de detalhes.
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Conforme (Ideal)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Alerta</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Crítico</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-black uppercase text-[11px]">
                <th className="py-3 px-4 text-left">Curva ABC Vendas (Trimestral)</th>
                <th className="py-3 px-4 text-center bg-blue-500/5">Bloco A (Ruas A1 a A8)</th>
                <th className="py-3 px-4 text-center bg-amber-500/5">Bloco B (Ruas B1 a B4)</th>
                <th className="py-3 px-4 text-center bg-indigo-500/5">Bloco C (Ruas C1 a C4)</th>
                <th className="py-3 px-4 text-right">Total Pallets Curva</th>
                <th className="py-3 px-4 text-center">% Atingimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {/* LINHA CURVA A */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[11px] border border-emerald-500/30">
                      Curva A
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Alta Demanda</span>
                  </div>
                </td>

                {/* CURVA A NO BLOCO A (IDEAL) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'A', bloco: 'A' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-emerald-400">{crossMatrixData.A.A.pallets} PL</div>
                  <div className="text-[10px] text-emerald-300">{crossMatrixData.A.A.caixas} cx ({crossMatrixData.A.A.count} lotes)</div>
                  <div className="text-[9px] text-slate-400 mt-1 font-bold">✓ Conforme Ideal (Clique p/ ver)</div>
                </td>

                {/* CURVA A NO BLOCO B (ALERTA) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'A', bloco: 'B' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-amber-400">{crossMatrixData.A.B.pallets} PL</div>
                  <div className="text-[10px] text-amber-300">{crossMatrixData.A.B.caixas} cx ({crossMatrixData.A.B.count} lotes)</div>
                  <div className="text-[9px] text-amber-400 mt-1 font-bold">⚠ Desvio em Alerta (Clique p/ ver)</div>
                </td>

                {/* CURVA A NO BLOCO C (CRÍTICO) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'A', bloco: 'C' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-rose-400">{crossMatrixData.A.C.pallets} PL</div>
                  <div className="text-[10px] text-rose-300">{crossMatrixData.A.C.caixas} cx ({crossMatrixData.A.C.count} lotes)</div>
                  <div className="text-[9px] text-rose-400 mt-1 font-bold">🚨 Desvio Crítico (Clique p/ ver)</div>
                </td>

                <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">
                  {summaryKpis.curvaA.totalPallets} PL
                </td>

                <td className="py-4 px-4 text-center font-black text-emerald-400">
                  {summaryKpis.curvaA.pctAtingimento.toFixed(1)}%
                </td>
              </tr>

              {/* LINHA CURVA B */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[11px] border border-amber-500/30">
                      Curva B
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Médio Giro</span>
                  </div>
                </td>

                {/* CURVA B NO BLOCO A (ALERTA) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'B', bloco: 'A' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-amber-400">{crossMatrixData.B.A.pallets} PL</div>
                  <div className="text-[10px] text-amber-300">{crossMatrixData.B.A.caixas} cx ({crossMatrixData.B.A.count} lotes)</div>
                  <div className="text-[9px] text-amber-400 mt-1 font-bold">⚠ Ocupa Bloco A (Clique p/ ver)</div>
                </td>

                {/* CURVA B NO BLOCO B (IDEAL) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'B', bloco: 'B' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-emerald-400">{crossMatrixData.B.B.pallets} PL</div>
                  <div className="text-[10px] text-emerald-300">{crossMatrixData.B.B.caixas} cx ({crossMatrixData.B.B.count} lotes)</div>
                  <div className="text-[9px] text-slate-400 mt-1 font-bold">✓ Conforme Ideal (Clique p/ ver)</div>
                </td>

                {/* CURVA B NO BLOCO C (ALERTA) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'B', bloco: 'C' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-amber-400">{crossMatrixData.B.C.pallets} PL</div>
                  <div className="text-[10px] text-amber-300">{crossMatrixData.B.C.caixas} cx ({crossMatrixData.B.C.count} lotes)</div>
                  <div className="text-[9px] text-amber-400 mt-1 font-bold">⚠ Desvio em Alerta (Clique p/ ver)</div>
                </td>

                <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">
                  {summaryKpis.curvaB.totalPallets} PL
                </td>

                <td className="py-4 px-4 text-center font-black text-emerald-400">
                  {summaryKpis.curvaB.pctAtingimento.toFixed(1)}%
                </td>
              </tr>

              {/* LINHA CURVA C */}
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-4 font-black text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-[11px] border border-indigo-500/30">
                      Curva C
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Baixo Giro</span>
                  </div>
                </td>

                {/* CURVA C NO BLOCO A (CRÍTICO) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'C', bloco: 'A' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-rose-400">{crossMatrixData.C.A.pallets} PL</div>
                  <div className="text-[10px] text-rose-300">{crossMatrixData.C.A.caixas} cx ({crossMatrixData.C.A.count} lotes)</div>
                  <div className="text-[9px] text-rose-400 mt-1 font-bold">🚨 Bloqueia Área Nobre (Clique p/ ver)</div>
                </td>

                {/* CURVA C NO BLOCO B (ALERTA) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'C', bloco: 'B' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-amber-400">{crossMatrixData.C.B.pallets} PL</div>
                  <div className="text-[10px] text-amber-300">{crossMatrixData.C.B.caixas} cx ({crossMatrixData.C.B.count} lotes)</div>
                  <div className="text-[9px] text-amber-400 mt-1 font-bold">⚠ Desvio em Alerta (Clique p/ ver)</div>
                </td>

                {/* CURVA C NO BLOCO C (IDEAL) */}
                <td 
                  onClick={() => {
                    setMatrixCellFilter({ curva: 'C', bloco: 'C' });
                    scrollToDetailsTable();
                  }}
                  className="py-3 px-4 text-center bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                >
                  <div className="text-sm font-black text-emerald-400">{crossMatrixData.C.C.pallets} PL</div>
                  <div className="text-[10px] text-emerald-300">{crossMatrixData.C.C.caixas} cx ({crossMatrixData.C.C.count} lotes)</div>
                  <div className="text-[9px] text-slate-400 mt-1 font-bold">✓ Conforme Ideal (Clique p/ ver)</div>
                </td>

                <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">
                  {summaryKpis.curvaC.totalPallets} PL
                </td>

                <td className="py-4 px-4 text-center font-black text-emerald-400">
                  {summaryKpis.curvaC.pctAtingimento.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PLANO E ANÁLISE DE ELEVAÇÃO DE ADERÊNCIA (TODOS OS TRIMESTRES) */}
      <Q3AdherencePlanCard
        allRows={rawAnalyzedDataset}
        activeQuarter={selectedQuarter}
        onSelectQuarter={(q) => {
          setSelectedQuarter(q);
          if (q === 'ALL') {
            setFilterMode('all');
          } else {
            setFilterMode('quarter');
          }
          setSelectedMonth('ALL');
        }}
        onApplyQ3Filter={() => {
          setSelectedQuarter('Q3');
          setFilterMode('quarter');
          setSelectedMonth('ALL');
        }}
        onFilterStreet={(rua) => {
          setSelectedRuaFilter(rua);
          setSelectedDrilldownRua(rua);
          scrollToDetailsTable();
        }}
      />

      {/* GRÁFICO DE QUEBRAS POR RUA COM DRILL-DOWN */}
      <StreetBreakdownChart
        data={chartDataRuasQuebra}
        onSelectStreet={(rua) => {
          setSelectedDrilldownRua(rua);
        }}
        selectedRua={selectedDrilldownRua}
      />


      {/* GRÁFICOS EXECUTIVOS COMPLEMENTARES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: DESVIOS DE PALLETS POR CURVA */}
        <div className="bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-500" />
              Pallets Conformes (OK) vs Quebras (NOK) por Curva ABC
            </h4>
            <span className="text-[10px] font-bold text-slate-400">Unidade: Pallets Fechados (PL)</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataCurvaDesvios} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="curva" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  formatter={(val: any, name: string) => [`${val} Pallets`, name === 'palletsConformes' ? 'Conforme (OK)' : 'Quebra (NOK)']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="palletsConformes" name="Pallets OK (Conformes)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="palletsDesvio" name="Pallets NOK (Quebras)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: TOP SKUS COM MAIORES DESVIOS */}
        <div className="bg-white dark:bg-[#11192e] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Top SKUs com Maiores Quebras de Pallets Fechados
            </h4>
            <span className="text-[10px] font-bold text-rose-400">Requer Remanejamento Imediato</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDesvioSkus} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis dataKey="codigo" type="category" tick={{ fontSize: 10, fill: '#94a3b8' }} width={55} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                  formatter={(val: any, _, props: any) => [
                    `${val} Pallets (${props.payload.totalCaixasDesvio} cx)`,
                    `${props.payload.descricao} (Curva ${props.payload.curvaAbcReal} na Rua ${props.payload.ruaAtual})`
                  ]}
                />
                <Bar dataKey="totalPalletsDesvio" name="Pallets Desviados" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                  {topDesvioSkus.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.severidade === 'CRITICO' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TABELA DETALHADA DE REGISTROS DE OCUPAÇÃO */}
      <div id="tabela-detalhes-aderencia" className="bg-white dark:bg-[#11192e] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-5 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-500" />
                Relatório Detalhado de Ocupação por Coleta de Validade (Pallets Fechados)
              </h3>
              {(selectedRuaFilter !== 'TODAS' || selectedBlocoFilter !== 'TODOS' || curvaFilter !== 'TODAS' || statusAderenciaFilter !== 'TODOS' || matrixCellFilter || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedRuaFilter('TODAS');
                    setSelectedBlocoFilter('TODOS');
                    setCurvaFilter('TODAS');
                    setStatusAderenciaFilter('TODOS');
                    setMatrixCellFilter(null);
                    setSearchQuery('');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-lg hover:bg-rose-500/20 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <X className="w-3 h-3" />
                  <span>Limpar Todos os Filtros Ativos</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Exibindo <strong>{sortedTableList.length}</strong> lotes coletados no armazém central (Ruas A1-A8, B1-B4, C1-C4) {selectedRuaFilter !== 'TODAS' ? `• Filtrado pela Rua ${selectedRuaFilter}` : ''} {matrixCellFilter ? `• Matriz Curva ${matrixCellFilter.curva} no Bloco ${matrixCellFilter.bloco}` : ''}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-xl px-2.5 py-1 text-slate-700 dark:text-slate-300 font-bold outline-hidden cursor-pointer"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* TABELA */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
          <table className="w-full min-w-[1250px] text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('codigo')}>
                  <div className="flex items-center gap-1">
                    <span>Código SKU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[220px]">Descrição do Produto</th>
                <th className="py-3 px-3 cursor-pointer select-none" onClick={() => handleSort('dataColeta')}>
                  <div className="flex items-center gap-1">
                    <span>Data Coleta</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Trimestre</th>
                <th className="py-3 px-3 text-center cursor-pointer select-none" onClick={() => handleSort('curvaAbcReal')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Curva Vendas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Rua Atual</th>
                <th className="py-3 px-3 text-center">Rua Ideal</th>
                <th className="py-3 px-3 text-center">Status (OK / NOK)</th>
                <th className="py-3 px-3 text-right">Fator Pallet</th>
                <th className="py-3 px-3 text-right font-black cursor-pointer select-none text-blue-400" onClick={() => handleSort('quantidadePallets')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Pallets (PL)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right cursor-pointer select-none" onClick={() => handleSort('quantidadeCaixas')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Caixas (cx)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center cursor-pointer select-none" onClick={() => handleSort('pctDesvioBloco')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>% Desvio Bloco</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[220px]">Ação Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedList.map((row) => {
                  let badgeCurva = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  if (row.curvaAbcReal === 'B') badgeCurva = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  if (row.curvaAbcReal === 'C') badgeCurva = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';

                  const isOk = row.statusOkNok === 'OK';

                  return (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{row.codigo}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-200">
                        {row.descricao}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">{row.dataColeta}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/30 font-mono">
                          {row.trimestre}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${badgeCurva}`}>
                          Curva {row.curvaAbcReal}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono">
                          {row.rua}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400 font-mono">
                        {row.ruaIdeal}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isOk ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            OK (Ideal)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            NOK (Quebra)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {row.fatorPallet} cx/PL
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-400">
                        {row.quantidadePallets} PL
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {row.quantidadeCaixas.toLocaleString('pt-BR')} cx
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                        {row.pctDesvioBloco.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-400">
                        {row.sugestaoAcao}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINAÇÃO */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Página {currentPage} de {totalPages} ({sortedTableList.length} registros)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DRILL-DOWN DETALHADO POR RUA */}
      {selectedDrilldownRua && (
        <StreetDrilldownModal
          rua={selectedDrilldownRua}
          allItemsInStreet={rawAnalyzedDataset.filter(r => r.rua === selectedDrilldownRua)}
          onClose={() => setSelectedDrilldownRua(null)}
          onFilterMainTableByStreet={(rua) => {
            setSelectedRuaFilter(rua);
            setSelectedDrilldownRua(null);
            scrollToDetailsTable();
          }}
        />
      )}
    </div>
  );
}
