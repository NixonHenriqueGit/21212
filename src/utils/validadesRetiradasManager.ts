import { ValidadeRow } from '../types';
import { markValidadeAsDeleted, restoreDeletedValidade, formatDateToBR, normalizeDateString } from './fefoDefaultData';
import { syncValidadesListToMonthlyColetas } from './stockAgeMonthlyManager';

export interface ValidadeRetiradaRecord {
  id: string;
  codigo: string;
  descricao: string;
  validade: string;
  lote: string;
  quantidade: number;
  unidade?: string;
  bloco?: string;
  localizacao: string;
  motivo: string;
  destino: 'PNC / Quarentena' | 'Despejo' | 'Devolução Fábrica' | 'Baixa Operacional' | 'Outro';
  retiradoPor: string;
  cargo: string;
  dataRetirada: string;
  observacoes?: string;
}

export function getValidadesRetiradas(companyId: string = 'demo'): ValidadeRetiradaRecord[] {
  try {
    const raw = localStorage.getItem(`validades_retiradas_${companyId}`) || localStorage.getItem('validades_retiradas_global');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('Erro ao ler validades retiradas:', e);
    return [];
  }
}

export function registrarRetiradaValidade(
  item: {
    codigo: string | number;
    descricao?: string;
    validade: string;
    lote?: string;
    quantidade: number;
    bloco?: string;
    localizacao?: string;
    motivo?: string;
    destino?: 'PNC / Quarentena' | 'Despejo' | 'Devolução Fábrica' | 'Baixa Operacional' | 'Outro';
    retiradoPor?: string;
    cargo?: string;
    observacoes?: string;
  },
  companyId: string = 'demo'
): ValidadeRetiradaRecord {
  const codStr = String(item.codigo).replace(/^0+/, '').trim();
  const valBr = formatDateToBR(item.validade);
  const dataNow = new Date().toISOString();

  const record: ValidadeRetiradaRecord = {
    id: `ret_${codStr}_${Date.now()}`,
    codigo: codStr,
    descricao: item.descricao || `Produto ${codStr}`,
    validade: valBr,
    lote: item.lote || `LOT-${codStr}-${valBr.replace(/\//g, '')}`,
    quantidade: Number(item.quantidade) || 0,
    unidade: 'cx',
    bloco: item.bloco || 'C1',
    localizacao: item.localizacao || 'central',
    motivo: item.motivo || 'Validade vencida / Recolhimento físico pelo conferente',
    destino: item.destino || 'PNC / Quarentena',
    retiradoPor: item.retiradoPor || 'Conferente CCO',
    cargo: item.cargo || 'Conferente',
    dataRetirada: dataNow,
    observacoes: item.observacoes || 'Retirada física e baixa registrada no CCO Guarabira.'
  };

  // 1. Salva no histórico de retiradas
  const existing = getValidadesRetiradas(companyId);
  const updated = [record, ...existing];
  localStorage.setItem(`validades_retiradas_${companyId}`, JSON.stringify(updated));
  localStorage.setItem('validades_retiradas_global', JSON.stringify(updated));

  // 2. Remove do estoque ativo de validades em todas as chaves
  markValidadeAsDeleted({
    codigo: codStr,
    validade: item.validade,
    lote: item.lote
  }, companyId);

  // 3. Atualiza validadesList no localStorage
  const storageKey = `validades_${companyId}`;
  try {
    const rawVal = localStorage.getItem(storageKey);
    if (rawVal) {
      const parsed: ValidadeRow[] = JSON.parse(rawVal);
      if (Array.isArray(parsed)) {
        const remaining = parsed.filter(v => {
          const vCod = String(v.codigo).replace(/^0+/, '').trim();
          const vVal = formatDateToBR(v.validade);
          return !(vCod === codStr && vVal === valBr);
        });
        localStorage.setItem(storageKey, JSON.stringify(remaining));
        syncValidadesListToMonthlyColetas(remaining, companyId);
      }
    }
  } catch (e) {
    console.error('Erro ao atualizar validades após retirada:', e);
  }

  // 4. Se o destino for Despejo, registra na fila de despejo
  if (record.destino === 'Despejo') {
    const despejadosKey = `armazem_escoamento_despejados_${companyId}`;
    try {
      let despList: string[] = JSON.parse(localStorage.getItem(despejadosKey) || '[]');
      const key = `${codStr}_${item.validade}`;
      if (!despList.includes(key)) despList.push(key);
      localStorage.setItem(despejadosKey, JSON.stringify(despList));
    } catch (_) {}
  }

  // 5. Dispara eventos para reatividade em tempo real
  window.dispatchEvent(new CustomEvent('validades_retiradas_updated', { detail: record }));
  window.dispatchEvent(new Event('validades_updated'));
  window.dispatchEvent(new Event('fefo_adjustments_updated'));
  window.dispatchEvent(new Event('app_data_updated'));
  window.dispatchEvent(new Event('local_data_changed'));

  return record;
}

export function reverterRetiradaValidade(retiradaId: string, companyId: string = 'demo'): boolean {
  try {
    const list = getValidadesRetiradas(companyId);
    const item = list.find(r => r.id === retiradaId);
    if (!item) return false;

    // Remove do histórico de retiradas
    const remaining = list.filter(r => r.id !== retiradaId);
    localStorage.setItem(`validades_retiradas_${companyId}`, JSON.stringify(remaining));
    localStorage.setItem('validades_retiradas_global', JSON.stringify(remaining));

    // Restaura no estoque ativo
    restoreDeletedValidade({
      codigo: item.codigo,
      validade: item.validade,
      lote: item.lote
    }, companyId);

    window.dispatchEvent(new Event('validades_retiradas_updated'));
    window.dispatchEvent(new Event('validades_updated'));
    window.dispatchEvent(new Event('app_data_updated'));
    return true;
  } catch (e) {
    console.error('Erro ao reverter retirada:', e);
    return false;
  }
}

/**
 * Identifica validades com data de vencimento hoje ou vencidas
 * que ainda constam no estoque ativo e precisam de retirada pelo Conferente.
 */
export function checkValidadesPendentesRetirada(validadesList: ValidadeRow[]): ValidadeRow[] {
  if (!Array.isArray(validadesList)) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return validadesList.filter(row => {
    if (!row.validade) return false;
    const qty = Number(row.quantidade || row.totalUnities || row.caixa || 0);
    if (qty <= 0) return false;

    const valBr = formatDateToBR(row.validade);
    if (!valBr) return false;

    // Itens com data <= hoje
    try {
      const parts = valBr.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        d.setHours(0, 0, 0, 0);
        if (d.getTime() <= today.getTime()) {
          return true;
        }
      }
    } catch (_) {}

    return false;
  });
}
