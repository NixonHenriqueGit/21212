import { ValidadeRow } from '../types';
import { formatDateToBR, normalizeDateString } from './fefoDefaultData';

export interface DashboardValidadeAdjustment {
  codigo: string;
  validadeOriginal: string; // DD/MM/AAAA ou ISO
  quantidade: number;       // Quantidade exata e definitiva no Dashboard
  novaValidade?: string;    // DD/MM/AAAA se alterada
  localizacao?: string;
  bloco?: string;
  isExcluded?: boolean;     // Se marcado como excluído apenas no Dashboard
  ajustadoEm: string;
  ajustadoPor?: string;
  originalQty?: number;     // Guarda a contagem original recolhida pelo conferente
}

export function getAdjustmentKey(codigo: string | number, validade: string): string {
  const codClean = String(codigo || '').replace(/^0+/, '').trim();
  const valBR = formatDateToBR(validade || '');
  return `${codClean}_${valBR}`;
}

const STORAGE_PREFIX = 'fefo_dashboard_adjustments_';

export function getDashboardAdjustments(companyId: string): Record<string, DashboardValidadeAdjustment> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${companyId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('[getDashboardAdjustments] Erro ao ler ajustes:', e);
  }
  return {};
}

export function saveDashboardAdjustment(companyId: string, adjustment: DashboardValidadeAdjustment): void {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    const key = getAdjustmentKey(adjustment.codigo, adjustment.validadeOriginal);
    adjustments[key] = {
      ...adjustment,
      codigo: String(adjustment.codigo).replace(/^0+/, '').trim(),
      validadeOriginal: formatDateToBR(adjustment.validadeOriginal),
      novaValidade: adjustment.novaValidade ? formatDateToBR(adjustment.novaValidade) : formatDateToBR(adjustment.validadeOriginal),
      ajustadoEm: new Date().toISOString()
    };
    localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(adjustments));
    window.dispatchEvent(new Event('fefo_adjustments_updated'));
  } catch (e) {
    console.error('[saveDashboardAdjustment] Erro ao salvar ajuste:', e);
  }
}

export function removeDashboardAdjustment(companyId: string, codigo: string | number, validade: string): void {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    const key = getAdjustmentKey(codigo, validade);
    if (adjustments[key]) {
      delete adjustments[key];
      localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(adjustments));
      window.dispatchEvent(new Event('fefo_adjustments_updated'));
    }
  } catch (e) {
    console.error('[removeDashboardAdjustment] Erro ao remover ajuste:', e);
  }
}

export function unexcludeDashboardAdjustment(companyId: string, codigo: string | number, validade: string): void {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    const key = getAdjustmentKey(codigo, validade);
    if (adjustments[key]) {
      adjustments[key].isExcluded = false;
      if (adjustments[key].quantidade <= 0) {
        adjustments[key].quantidade = adjustments[key].originalQty || 10;
      }
      localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(adjustments));
      window.dispatchEvent(new Event('fefo_adjustments_updated'));
    }
  } catch (e) {
    console.error('[unexcludeDashboardAdjustment] Erro ao desmarcar exclusão:', e);
  }
}

export function restoreAllExcludedAdjustments(companyId: string): number {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    let count = 0;
    Object.keys(adjustments).forEach(k => {
      if (adjustments[k].isExcluded) {
        adjustments[k].isExcluded = false;
        if (adjustments[k].quantidade <= 0) {
          adjustments[k].quantidade = adjustments[k].originalQty || 10;
        }
        count++;
      }
    });
    if (count > 0) {
      localStorage.setItem(`${STORAGE_PREFIX}${companyId}`, JSON.stringify(adjustments));
      window.dispatchEvent(new Event('fefo_adjustments_updated'));
    }
    return count;
  } catch (e) {
    console.error('[restoreAllExcludedAdjustments] Erro ao restaurar ajustes:', e);
    return 0;
  }
}

export function getExcludedAdjustments(companyId: string): DashboardValidadeAdjustment[] {
  try {
    const adjustments = getDashboardAdjustments(companyId);
    return Object.values(adjustments).filter(adj => adj.isExcluded === true);
  } catch {
    return [];
  }
}

/**
 * Aplica os ajustes exclusivos do Dashboard sobre uma lista de validades originais do conferente,
 * garantindo que a quantidade ajustada pelo usuário no Dashboard seja exatamente a configurada,
 * sem duplicar somas e sem modificar os dados originais do conferente.
 */
export function applyDashboardAdjustments(validades: ValidadeRow[], companyId: string): ValidadeRow[] {
  const adjustments = getDashboardAdjustments(companyId);
  if (!adjustments || Object.keys(adjustments).length === 0) {
    return validades;
  }

  // Agrupa os itens para saber quais já foram processados
  const processedKeys = new Set<string>();
  const result: ValidadeRow[] = [];

  for (const item of validades) {
    const cod = String(item.codigo || (item as any).cod || '').replace(/^0+/, '').trim();
    const valBR = formatDateToBR(item.validade || '');
    const key = `${cod}_${valBR}`;
    let adj = adjustments[key];

    // Fallback: busca por código e ou novaValidade ou validadeOriginal
    if (!adj) {
      const foundKey = Object.keys(adjustments).find(k => {
        const a = adjustments[k];
        return a && a.codigo === cod && (a.novaValidade === valBR || a.validadeOriginal === valBR);
      });
      if (foundKey) {
        adj = adjustments[foundKey];
      }
    }

    if (adj) {
      // Apenas pula se foi explicitamente marcado com isExcluded = true
      if (adj.isExcluded) {
        continue;
      }

      if (!processedKeys.has(key)) {
        // Primeiro registro deste SKU/validade: recebe EXATAMENTE a quantidade ajustada
        processedKeys.add(key);
        const stableUniqueKey = (item as any)._uniqueKey || item._docId || (item.id ? String(item.id) : `val_${cod}_${valBR}`);
        result.push({
          ...item,
          quantidade: Math.max(0, adj.quantidade),
          caixa: Math.max(0, adj.quantidade),
          palhete: 0,
          lastro: 0,
          validade: adj.novaValidade || valBR,
          localizacao: adj.localizacao || item.localizacao || 'central',
          bloco: adj.bloco || item.bloco || '',
          _uniqueKey: String(stableUniqueKey),
          // Flags para exibição no dashboard
          ...( {
            _hasDashboardAdjustment: true,
            _dashboardOriginalQty: adj.originalQty !== undefined ? adj.originalQty : (item.quantidade || (item as any).caixa || 0)
          } as any )
        });
      } else {
        // Registros subsequentes do mesmo SKU e validade são ignorados para não somar duas vezes
        continue;
      }
    } else {
      result.push(item);
    }
  }

  // Se houver algum ajuste de item novo que não estava na lista original mas foi adicionado/ajustado
  for (const key of Object.keys(adjustments)) {
    if (!processedKeys.has(key)) {
      const adj = adjustments[key];
      if (!adj.isExcluded) {
        processedKeys.add(key);
        result.push({
          codigo: adj.codigo,
          descricao: `Produto ${adj.codigo}`,
          quantidade: Math.max(0, adj.quantidade),
          caixa: Math.max(0, adj.quantidade),
          palhete: 0,
          lastro: 0,
          validade: adj.novaValidade || adj.validadeOriginal,
          localizacao: adj.localizacao || 'central',
          bloco: adj.bloco || '',
          _uniqueKey: `adj_${adj.codigo}_${adj.novaValidade || adj.validadeOriginal}`,
          ...( {
            _hasDashboardAdjustment: true,
            _dashboardOriginalQty: adj.originalQty !== undefined ? adj.originalQty : 0
          } as any )
        });
      }
    }
  }

  return result;
}
