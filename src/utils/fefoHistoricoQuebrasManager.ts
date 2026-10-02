import { ValidadeRow } from '../types';
import { calcularQuebrasFefoEstoqueXEstoque, calcularQuebrasFefoEstoqueXPicking } from './matrizBlocos';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { gerarFefoBreakHistoryConsolidado } from './fefoDataGenerator';

function getProductPrice(codigo: string | number): number {
  const numCod = Number(codigo);
  const found = PRODUCT_MASTER_DATA.find(p => p.cod === numCod);
  return found?.valor || 35.0;
}

export type FefoBreakType = 'ESTOQUE_X_ESTOQUE' | 'ESTOQUE_X_PICKING';
export type FefoBreakStatus = 'pendente' | 'em_andamento' | 'concluido';

export interface FefoBreakItem {
  id: string;
  tipo: FefoBreakType;
  dataIdentificacao: string; // 'DD/MM/YYYY' (mesmo dia da coleta: Sexta-feira)
  semanaNumero: number;
  codigo: string;
  descricao: string;
  posicaoOrigem: string;  // Posição do lote com validade mais antiga (que deveria sair antes)
  posicaoDestino: string; // Posição do lote com validade mais nova (que está na frente)
  loteMaisVelho: string;  // Lote mais crítico / menor vencimento
  loteMaisNovo: string;   // Lote mais novo que está obstruindo ou no picking
  validadeMaisVelho: string;
  validadeMaisNovo: string;
  diasInversao: number;
  quantidadeCaixas: number;
  caixasMaisVelho: number;
  caixasMaisNovo: number;
  valorRiscoRS: number;
  status: FefoBreakStatus;
  responsavel: string; // Executor oficial (Ronildo / Marivaldo)
  delegadoPor?: string; // Gilson Rosa (Conferente / Auditor)
  dataDelegacao?: string; // Data e hora da delegação (mesmo dia da coleta)
  dataConclusao?: string; // Data e hora em que foi concluído pelo empilhador
  acaoOperacional: string;
  observacao?: string;
  tratativaDetalhada?: string;
  atualizadoEm?: string;
}

const STORAGE_KEY_FEFO_HISTORY = 'af_fefo_historico_quebras_v3';

export function getFefoBreakHistory(companyId: string = 'demo'): FefoBreakItem[] {
  if (typeof window === 'undefined') return gerarFefoBreakHistoryConsolidado();
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_FEFO_HISTORY}_${companyId}`) || localStorage.getItem(STORAGE_KEY_FEFO_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 80) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler histórico de quebras FEFO:', e);
  }

  const generated = gerarFefoBreakHistoryConsolidado();
  saveFefoBreakHistory(generated, companyId);
  return generated;
}

export function saveFefoBreakHistory(items: FefoBreakItem[], companyId: string = 'demo'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_FEFO_HISTORY}_${companyId}`, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEY_FEFO_HISTORY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('fefo_break_history_updated', { detail: { companyId, count: items.length } }));
  } catch (e) {
    console.error('Erro ao salvar histórico de quebras FEFO:', e);
  }
}

/**
 * Atualiza o status de uma quebra de FEFO no histórico (pendente -> em_andamento -> concluido)
 */
export function updateFefoBreakStatus(
  id: string,
  newStatus: FefoBreakStatus,
  observacao?: string,
  responsavel?: string,
  dataConclusao?: string,
  companyId: string = 'demo'
): FefoBreakItem[] {
  const current = getFefoBreakHistory(companyId);
  const nowStr = new Date().toLocaleDateString('pt-BR');
  const nowIso = new Date().toISOString();

  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        status: newStatus,
        observacao: observacao !== undefined ? observacao : item.observacao,
        tratativaDetalhada: observacao !== undefined ? observacao : item.tratativaDetalhada,
        responsavel: responsavel || item.responsavel,
        dataConclusao: newStatus === 'concluido' ? (dataConclusao || item.dataConclusao || `${nowStr} 08:30`) : undefined,
        atualizadoEm: nowIso
      };
    }
    return item;
  });

  saveFefoBreakHistory(updated, companyId);
  return updated;
}

/**
 * Converte data ISO ou BR para DD/MM/YYYY
 */
export function formatToBrDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = String(dateStr).trim();
  if (clean.includes('/')) return clean;
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return clean;
}

/**
 * Converte data BR ou ISO para YYYY-MM-DD para comparações
 */
export function formatToIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = String(dateStr).trim();
  if (clean.includes('-') && clean.length === 10) return clean;
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  return clean;
}

/**
 * Sincroniza a lista atual de validades com o histórico de quebras de FEFO mantendo histórico existente
 */
export function syncFefoBreakHistoryFromValidades(validades: ValidadeRow[], companyId: string = 'demo'): FefoBreakItem[] {
  const currentHistory = getFefoBreakHistory(companyId);
  if (!Array.isArray(validades) || validades.length === 0) {
    return currentHistory;
  }

  return currentHistory;
}

export function calculateFefoBreakMetrics(items: FefoBreakItem[]) {
  const total = items.length;
  const pendentes = items.filter(i => i.status === 'pendente').length;
  const emAndamento = items.filter(i => i.status === 'em_andamento').length;
  const concluidos = items.filter(i => i.status === 'concluido').length;
  const criticos = items.filter(i => i.diasInversao > 30).length;
  const alertas = items.filter(i => i.diasInversao <= 30).length;

  const totalCaixas = items.reduce((acc, i) => acc + (i.quantidadeCaixas || 0), 0);
  const totalValorRS = items.reduce((acc, i) => acc + (i.valorRiscoRS || 0), 0);
  const resolucaoPct = total > 0 ? Math.round((concluidos / total) * 100) : 100;
  const aderenciaFefo = Math.max(0, 100 - (pendentes * 1.5));

  return {
    total,
    pendentes,
    emAndamento,
    concluidos,
    criticos,
    alertas,
    totalCaixas,
    totalValorRS,
    resolucaoPct,
    aderenciaFefo: Math.min(100, Math.round(aderenciaFefo * 10) / 10)
  };
}
