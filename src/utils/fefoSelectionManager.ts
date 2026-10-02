import { ValidadeRow } from '../types';
import { isValidadeDeleted, getValidadeQty, formatDateToBR } from './fefoDefaultData';
import { getValidadeUniqueId, getValidadeDateInfo } from '../components/ValidadesRecolhidasModal';
import { getDashboardAdjustments } from './fefoDashboardAdjustments';

export function getSelectedValidadesKeys(companyId: string): Set<string> {
  try {
    const saved = localStorage.getItem(`fefo_selected_validades_${companyId || 'demo'}`);
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch (e) {
    console.warn('Erro ao carregar selectedValidadesKeys:', e);
  }
  return new Set<string>();
}

export function saveSelectedValidadesKeys(keys: Set<string>, companyId: string): void {
  try {
    const key = `fefo_selected_validades_${companyId || 'demo'}`;
    localStorage.setItem(key, JSON.stringify(Array.from(keys)));
    localStorage.setItem(`fefo_selected_validades_initialized_${companyId || 'demo'}`, 'true');
    window.dispatchEvent(new CustomEvent('fefo_selection_updated', { detail: { companyId, count: keys.size } }));
    window.dispatchEvent(new Event('fefo_selection_updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Erro ao salvar selectedValidadesKeys:', e);
  }
}

export function hasSelectionInitialized(companyId: string): boolean {
  try {
    return localStorage.getItem(`fefo_selected_validades_initialized_${companyId || 'demo'}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Filtra a lista de validades aplicando a seleção persistida do usuário.
 * Se nenhuma validade estiver selecionada e ainda não foi inicializada, retorna todas não-deletadas.
 * Se houver seleção ativa (ou se já foi inicializado), retorna estritamente os itens selecionados.
 */
export function filterValidadesByActiveSelection(
  allValidades: ValidadeRow[],
  companyId: string,
  explicitKeys?: Set<string>
): ValidadeRow[] {
  const selectedKeys = explicitKeys || getSelectedValidadesKeys(companyId);
  const initialized = hasSelectionInitialized(companyId);
  const adjustments = getDashboardAdjustments(companyId);

  // Se o usuário selecionou chaves, aplica filtro com verificação robusta
  if (selectedKeys.size > 0) {
    return allValidades.filter((item, idx) => {
      if (isValidadeDeleted(item, companyId)) return false;
      const cod = String(item.codigo || '').replace(/^0+/, '').trim();
      const valBR = formatDateToBR(item.validade || '');
      const adj = adjustments[`${cod}_${valBR}`];
      if (adj && adj.isExcluded) return false;

      const qty = getValidadeQty(item);
      const hasAdj = (item as any)._hasDashboardAdjustment || (adj && !adj.isExcluded);
      if (qty <= 0 && !hasAdj) return false;

      // Itens explicitamente editados/ajustados pelo usuário nunca somem
      if (hasAdj) return true;

      const key = getValidadeUniqueId(item, idx);
      if (selectedKeys.has(key)) return true;
      if ((item as any)._uniqueKey && selectedKeys.has((item as any)._uniqueKey)) return true;
      if (item._docId && selectedKeys.has(item._docId)) return true;
      if (item.id && selectedKeys.has(String(item.id))) return true;

      // Verificação por código e validade
      for (const k of selectedKeys) {
        if (k.includes(`_${cod}_`) && (k.includes(valBR) || (item.validade && k.includes(item.validade)))) {
          return true;
        }
      }

      return false;
    });
  }

  // Se já foi inicializado e tem 0 selecionados, significa que o usuário desselecionou tudo
  if (initialized && selectedKeys.size === 0) {
    return [];
  }

  // Caso inicial sem filtro configurado: retorna todos não deletados com quantidade positiva
  return allValidades.filter(item => {
    if (isValidadeDeleted(item, companyId)) return false;
    return getValidadeQty(item) > 0 || (item as any)._hasDashboardAdjustment;
  });
}

/**
 * Agrupa as validades por data de coleta para exibição amigável
 */
export function getValidadesColetasSummary(validades: ValidadeRow[]): {
  date: string;
  displayDate: string;
  totalLotes: number;
  totalCaixas: number;
}[] {
  const groups: Record<string, { displayDate: string; totalLotes: number; totalCaixas: number }> = {};

  validades.forEach(item => {
    const { isoDate, displayDate } = getValidadeDateInfo(item);
    const qty = getValidadeQty(item);
    if (!groups[isoDate]) {
      groups[isoDate] = { displayDate, totalLotes: 0, totalCaixas: 0 };
    }
    groups[isoDate].totalLotes += 1;
    groups[isoDate].totalCaixas += qty;
  });

  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, data]) => ({
      date,
      displayDate: data.displayDate,
      totalLotes: data.totalLotes,
      totalCaixas: data.totalCaixas
    }));
}
