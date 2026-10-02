import { ValidadeRow } from '../types';
import validadesRecolhidasSemana3Data from '../data/validadesRecolhidasSemana3.json';
import validadesRecolhidasSemana4Data from '../data/validadesRecolhidasSemana4.json';
import { calcularTotalCaixas } from '../data/coletaPackagingData';

export const DEFAULT_OFFICIAL_VALIDADES_WEEK4: ValidadeRow[] = (validadesRecolhidasSemana4Data as ValidadeRow[])
  .filter(item => {
    const val = String(item.validade || '').trim();
    const col = String(item.dataColeta || '').trim();
    return val !== '2026-10-02' && val !== '02/10/2026' && col !== '02/10/2026' && col !== '2026-10-02' && item.id !== 'val_1166_sem4_7';
  })
  .map((item, idx) => ({
    ...item,
    id: item.id || `val_${item.codigo}_sem4_${idx + 1}`,
    dataColeta: '28/08/2026',
    semanaNumero: 4,
    mesReferencia: '08'
  }));

export const DEFAULT_OFFICIAL_VALIDADES_WEEK3: ValidadeRow[] = (validadesRecolhidasSemana3Data as ValidadeRow[])
  .filter(item => {
    const val = String(item.validade || '').trim();
    const col = String(item.dataColeta || '').trim();
    return val !== '2026-10-02' && val !== '02/10/2026' && col !== '02/10/2026' && col !== '2026-10-02' && item.id !== 'val_1166_sem3_7';
  })
  .map((item, idx) => ({
    ...item,
    id: item.id || `val_${item.codigo}_sem3_${idx + 1}`,
    dataColeta: '21/08/2026',
    semanaNumero: 3,
    mesReferencia: '08'
  }));

export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (s.includes('T')) return s.split('T')[0];
  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) return s.slice(0, 10);
      const [d, m, y] = parts;
      const fullY = y.length === 2 ? `20${y}` : y;
      return `${fullY}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const [d, m, y] = parts;
      const fullY = y.length === 2 ? `20${y}` : y;
      return `${fullY}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return s;
}

/**
 * Converte qualquer formato de data (ISO, YYYY-MM-DD, Timestamp, etc.)
 * rigorosamente para o padrão brasileiro DD/MM/AAAA.
 */
export function formatDateToBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (!s) return '';

  // ISO com T (ex: 2026-10-01T00:00:00)
  if (s.includes('T')) {
    const isoPart = s.split('T')[0];
    const parts = isoPart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }

  // Já no formato DD/MM/AAAA ou D/M/AA
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(s)) {
    const parts = s.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }

  // No formato YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const parts = s.substring(0, 10).split('-');
    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }

  // No formato DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{2,4}$/.test(s)) {
    const parts = s.split('-');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${d}/${m}/${y}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return s;
}

export function matchValidade(item: any, target: { codigo?: string; validade?: string; id?: string; _docId?: string }): boolean {
  if (!item || !target) return false;
  if (target._docId && item._docId && String(target._docId) === String(item._docId)) return true;
  if (target.id && item.id && String(target.id) === String(item.id)) return true;
  
  const targetCod = String(target.codigo || '').replace(/^0+/, '').trim();
  const itemCod = String(item.codigo || item.cod || '').replace(/^0+/, '').trim();
  
  if (targetCod && itemCod && targetCod === itemCod) {
    if (target.validade && item.validade) {
      const targetVal = formatDateToBR(target.validade).trim();
      const itemVal = formatDateToBR(item.validade).trim();
      if (targetVal === itemVal) return true;
      const normTargetVal = normalizeDateString(targetVal);
      const normItemVal = normalizeDateString(itemVal);
      if (normTargetVal && normItemVal && normTargetVal === normItemVal) return true;
    }
  }
  return false;
}

export function isValidadeDeleted(item: any, companyId: string = 'demo'): boolean {
  if (!item) return false;
  const val = String(item.validade || '').trim();
  const valBr = formatDateToBR(val);
  const col = String(item.dataColeta || '').trim();
  const idStr = String(item.id || '');
  if (val === '2026-10-02' || val === '02/10/2026' || valBr === '02/10/2026' || col === '02/10/2026' || col === '2026-10-02' || idStr === 'val_1166_sem4_7' || idStr === 'val_1166_sem3_7') {
    return true;
  }
  try {
    const raw = localStorage.getItem(`fefo_deleted_validades_${companyId}`) || localStorage.getItem('fefo_deleted_validades_global');
    if (!raw) return false;
    const deletedList: any[] = JSON.parse(raw);
    if (!Array.isArray(deletedList) || deletedList.length === 0) return false;
    return deletedList.some(target => matchValidade(item, target));
  } catch (e) {
    return false;
  }
}

export function markValidadeAsDeleted(
  target: { codigo?: string; validade?: string; id?: string; _docId?: string; lote?: string },
  companyId: string = 'demo'
) {
  try {
    const key = `fefo_deleted_validades_${companyId}`;
    const globalKey = 'fefo_deleted_validades_global';
    
    let list: any[] = [];
    try {
      const stored = localStorage.getItem(key) || localStorage.getItem(globalKey);
      if (stored) list = JSON.parse(stored);
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }

    list.push(target);
    localStorage.setItem(key, JSON.stringify(list));
    localStorage.setItem(globalKey, JSON.stringify(list));

    // Limpa de TODAS as chaves de validades do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && (storageKey.startsWith('validades_') || storageKey.startsWith('armazem_validades_'))) {
        try {
          const val = localStorage.getItem(storageKey);
          if (val) {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(item => !matchValidade(item, target));
              localStorage.setItem(storageKey, JSON.stringify(cleaned));
            }
          }
        } catch (_) {}
      }
    }
  } catch (e) {
    console.error('Erro ao marcar validade como excluída:', e);
  }
}

export function getDeletedValidades(companyId: string = 'demo'): any[] {
  try {
    const key = `fefo_deleted_validades_${companyId}`;
    const globalKey = 'fefo_deleted_validades_global';
    const stored = localStorage.getItem(key) || localStorage.getItem(globalKey);
    if (!stored) return [];
    const list = JSON.parse(stored);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function restoreDeletedValidade(
  target: { codigo?: string; validade?: string; id?: string; _docId?: string; lote?: string },
  companyId: string = 'demo'
): boolean {
  try {
    const key = `fefo_deleted_validades_${companyId}`;
    const globalKey = 'fefo_deleted_validades_global';

    // 1. Remove da lista de excluídos local e global
    [key, globalKey].forEach(k => {
      try {
        const stored = localStorage.getItem(k);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const filtered = list.filter(item => !matchValidade(item, target));
            localStorage.setItem(k, JSON.stringify(filtered));
          }
        }
      } catch (e) {}
    });

    // 2. Procura o item original para restaurar no armazenamento
    let restoredRow: ValidadeRow | null = null;
    const targetCod = String(target.codigo || '').replace(/^0+/, '').trim();
    const allSeeds = [...DEFAULT_OFFICIAL_VALIDADES_WEEK4, ...DEFAULT_OFFICIAL_VALIDADES_WEEK3];
    const foundSeed = allSeeds.find(item => matchValidade(item, target));

    if (foundSeed) {
      restoredRow = {
        ...foundSeed,
        empresaId: companyId
      };
    } else if (targetCod) {
      restoredRow = {
        id: target.id || `val_restored_${targetCod}_${Date.now()}`,
        codigo: targetCod,
        descricao: (target as any).descricao || `Produto ${targetCod}`,
        validade: target.validade ? formatDateToBR(target.validade) : '31/12/2026',
        quantidade: (target as any).quantidade || (target as any).caixa || 10,
        caixa: (target as any).quantidade || (target as any).caixa || 10,
        palhete: 0,
        lastro: 0,
        localizacao: 'central',
        bloco: 'C1',
        empresaId: companyId
      };
    }

    // 3. Adiciona de volta ao localStorage de validades se recuperou
    if (restoredRow) {
      const storageKey = `validades_${companyId}`;
      let currentRows: ValidadeRow[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) currentRows = JSON.parse(raw);
        if (!Array.isArray(currentRows)) currentRows = [];
      } catch {
        currentRows = [];
      }

      // Evita duplicar se já existia
      const exists = currentRows.some(r => matchValidade(r, target));
      if (!exists) {
        currentRows.push(restoredRow);
        localStorage.setItem(storageKey, JSON.stringify(currentRows));
      }
    }

    window.dispatchEvent(new CustomEvent('fefo_validades_restored', { detail: { target, companyId } }));
    window.dispatchEvent(new Event('app_data_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('validades_updated'));
    return true;
  } catch (e) {
    console.error('Erro ao restaurar validade excluída:', e);
    return false;
  }
}

export function restoreAllDeletedValidades(companyId: string = 'demo'): number {
  try {
    const list = getDeletedValidades(companyId);
    const count = list.length;
    localStorage.removeItem(`fefo_deleted_validades_${companyId}`);
    localStorage.removeItem('fefo_deleted_validades_global');

    // Restaura cada item
    list.forEach(target => {
      restoreDeletedValidade(target, companyId);
    });

    window.dispatchEvent(new Event('fefo_validades_restored'));
    window.dispatchEvent(new Event('app_data_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('validades_updated'));
    return count;
  } catch (e) {
    console.error('Erro ao restaurar todos os excluídos:', e);
    return 0;
  }
}

/**
 * Salva a alteração de quantidade ou validade de um item DEFINITIVAMENTE em todos os armazenamentos
 * locais e caches, garantindo que o item NUNCA suma da lista e reflita o novo valor imediatamente.
 */
export function saveUpdatedValidadeDefinitive(
  companyId: string = 'demo',
  updatedItem: {
    codigo: string | number;
    validadeOriginal: string;
    novaValidade?: string;
    quantidade: number;
    localizacao?: string;
    bloco?: string;
    descricao?: string;
  }
): void {
  try {
    const cod = String(updatedItem.codigo).replace(/^0+/, '').trim();
    const valOrig = formatDateToBR(updatedItem.validadeOriginal);
    const finalVal = updatedItem.novaValidade ? formatDateToBR(updatedItem.novaValidade) : valOrig;
    const finalQty = Number(updatedItem.quantidade) >= 0 ? Number(updatedItem.quantidade) : 0;

    // Remove de deleted se por acaso estava na lista de excluídos
    const deletedKey = `fefo_deleted_validades_${companyId}`;
    const globalDelKey = 'fefo_deleted_validades_global';
    [deletedKey, globalDelKey].forEach(k => {
      try {
        const stored = localStorage.getItem(k);
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            const filtered = list.filter(item => !matchValidade(item, { codigo: cod, validade: valOrig }));
            localStorage.setItem(k, JSON.stringify(filtered));
          }
        }
      } catch (_) {}
    });

    const targetKeys = [
      `validades_${companyId}`,
      `armazem_validades_${companyId}`,
      `validades_demo`,
      `armazem_validades_demo`
    ];

    let foundAndUpdated = false;

    targetKeys.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let modified = false;
            const updatedList = parsed.map(item => {
              if (matchValidade(item, { codigo: cod, validade: valOrig })) {
                modified = true;
                foundAndUpdated = true;
                return {
                  ...item,
                  quantidade: finalQty,
                  caixa: finalQty,
                  totalUnities: finalQty,
                  totalUnitiesRaw: finalQty,
                  validade: finalVal,
                  localizacao: updatedItem.localizacao || item.localizacao || 'central',
                  bloco: updatedItem.bloco || item.bloco || '',
                  atualizadoDefinitivoEm: new Date().toISOString()
                };
              }
              return item;
            });
            if (modified) {
              localStorage.setItem(k, JSON.stringify(updatedList));
            }
          }
        }
      } catch (_) {}
    });

    // Se o item não existia no localStorage (apenas no seed original de 314 itens), adiciona-o ao localStorage de validades
    if (!foundAndUpdated) {
      const storageKey = `validades_${companyId}`;
      let currentRows: ValidadeRow[] = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) currentRows = JSON.parse(raw);
        if (!Array.isArray(currentRows)) currentRows = [];
      } catch {
        currentRows = [];
      }

      // Procura no seed padrão
      const allSeeds = [...DEFAULT_OFFICIAL_VALIDADES_WEEK4, ...DEFAULT_OFFICIAL_VALIDADES_WEEK3];
      const seedItem = allSeeds.find(item => matchValidade(item, { codigo: cod, validade: valOrig }));

      const newRow: any = {
        ...(seedItem || {}),
        id: seedItem?.id || `val_def_${cod}_${Date.now()}`,
        codigo: cod,
        descricao: updatedItem.descricao || seedItem?.descricao || `Produto ${cod}`,
        quantidade: finalQty,
        caixa: finalQty,
        totalUnities: finalQty,
        totalUnitiesRaw: finalQty,
        validade: finalVal,
        localizacao: updatedItem.localizacao || seedItem?.localizacao || 'central',
        bloco: updatedItem.bloco || seedItem?.bloco || '',
        empresaId: companyId,
        atualizadoDefinitivoEm: new Date().toISOString()
      };

      currentRows.push(newRow);
      localStorage.setItem(storageKey, JSON.stringify(currentRows));
    }

    // Dispara eventos em tempo real para sincronizar abas e componentes
    window.dispatchEvent(new CustomEvent('fefo_definitive_updated', {
      detail: { codigo: cod, validade: finalVal, quantidade: finalQty }
    }));
    window.dispatchEvent(new Event('fefo_adjustments_updated'));
    window.dispatchEvent(new Event('app_data_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('validades_updated'));
  } catch (e) {
    console.error('Erro em saveUpdatedValidadeDefinitive:', e);
  }
}

export function getValidadeQty(item: any): number {
  if (!item) return 0;

  // 1. Quantidade explícita anotada/recolhida (prioridade absoluta)
  const q = item.quantidade;
  if (q !== undefined && q !== null && !isNaN(Number(q)) && Number(q) > 0) {
    return Number(q);
  }
  const tu = item.totalUnities;
  if (tu !== undefined && tu !== null && !isNaN(Number(tu)) && Number(tu) > 0) {
    return Number(tu);
  }
  const tur = item.totalUnitiesRaw;
  if (tur !== undefined && tur !== null && !isNaN(Number(tur)) && Number(tur) > 0) {
    return Number(tur);
  }

  // 2. Se tiver paletes, lastros ou caixas avulsas anotadas pelo conferente,
  // calcula com fidelidade total usando a função oficial de paletização
  const p = Number(item.palhete) || 0;
  const l = Number(item.lastro) || 0;
  const c = Number(item.caixa) || 0;
  if (p > 0 || l > 0 || c > 0) {
    const calc = calcularTotalCaixas(item.codigo, p, l, c);
    if (calc > 0) return calc;
    if (c > 0) return c;
  }

  if (item.caixa !== undefined && item.caixa !== null && !isNaN(Number(item.caixa)) && Number(item.caixa) > 0) {
    return Number(item.caixa);
  }

  return 0;
}

export function getInitialDefaultValidades(companyId: string = 'demo'): ValidadeRow[] {
  const combined = [...DEFAULT_OFFICIAL_VALIDADES_WEEK4, ...DEFAULT_OFFICIAL_VALIDADES_WEEK3];
  return combined
    .filter(item => !isValidadeDeleted(item, companyId) && getValidadeQty(item) > 0)
    .map(item => ({
      ...item,
      empresaId: companyId
    }));
}

/**
 * Remove itens legados de seed/mock ou versões antigas com poucos itens, garantindo os 314 recolhidos
 */
export function removeLegacySeedValidades(rows: ValidadeRow[], companyId: string = 'demo'): ValidadeRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return getInitialDefaultValidades(companyId);
  }
  const filtered = rows.filter(r => {
    if (isValidadeDeleted(r, companyId)) return false;
    if (getValidadeQty(r) <= 0) return false;
    const docId = String(r._docId || '');
    const id = String(r.id || '');
    if (docId.startsWith('seed-val-') || id.startsWith('seed-val-')) return false;

    // Purga especificamente a validade ou coleta de 02/10/2026
    const val = String(r.validade || '').trim();
    const valBr = formatDateToBR(val);
    const col = String(r.dataColeta || '').trim();
    if (val === '2026-10-02' || val === '02/10/2026' || valBr === '02/10/2026' || col === '02/10/2026' || col === '2026-10-02' || id === 'val_1166_sem4_7' || id === 'val_1166_sem3_7') {
      return false;
    }
    return true;
  });

  return filtered;
}

// Auto cleanup imediato de localStorage para remover qualquer resquício da coleta / validade de 02/10/2026
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('validades_') || key.startsWith('armazem_validades_'))) {
        const val = localStorage.getItem(key);
        if (val && (val.includes('2026-10-02') || val.includes('02/10/2026') || val.includes('val_1166_sem4_7') || val.includes('val_1166_sem3_7'))) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter(item => {
                const itemVal = formatDateToBR(item.validade);
                const itemCol = formatDateToBR(item.dataColeta);
                const id = String(item.id || '');
                return itemVal !== '02/10/2026' && item.validade !== '2026-10-02' && itemCol !== '02/10/2026' && id !== 'val_1166_sem4_7' && id !== 'val_1166_sem3_7';
              });
              localStorage.setItem(key, JSON.stringify(cleaned));
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
}


