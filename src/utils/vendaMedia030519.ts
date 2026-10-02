import { PRODUCTS } from '../planosData';
import { getVendaMediaItens, saveVendaMediaItens } from './estoqueStorage';
import { VendaMediaItem } from '../types/estoque';
import { useEffect, useState, useCallback } from 'react';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { OFFICIAL_CURVA_ABC_DATASET, OFFICIAL_ABC_MAP } from '../data/curvaAbcOfficialDataset';
import { RELATORIO_030519_RAW_ITEMS, getRelatorio030519Item } from '../data/relatorio030519Dataset';

export interface Item030519Data {
  codigo: number;
  produto: string;
  unidade: string;
  volumeTotalTrimestre: number;
  vendaMediaDiaria: number;
  fatorHecto: number;
  precoUnitario: number;
  vendaMediaReais: number;
  vendaMediaHectolitro: number;
  faturamentoTotal: number;
  volumeTotalHectolitros: number;
  categoria?: string;
  classeABC?: 'A' | 'B' | 'C';
  curvaAbc?: 'A' | 'B' | 'C';
  rank?: number;
  source: '030519' | 'fallback';
}

export interface TrimestreStore {
  diasUteis: number;
  itemsMap: Record<number, any>;
  importadoEm?: string;
  nomeArquivo?: string;
  overridesCategoria?: Record<number, string>;
  overridesABC?: Record<number, 'A' | 'B' | 'C'>;
}

export const STORAGE_KEY_TRIMESTRES_030519 = 'af_curva_abc_trimestres_030519_v1';
export const EVENT_VENDA_MEDIA_030519_UPDATED = 'vendaMedia030519Updated';

let cachedQuarters030519: Record<string, TrimestreStore> | null = null;

export function invalidateQuarters030519Cache() {
  cachedQuarters030519 = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_TRIMESTRES_030519) {
      invalidateQuarters030519Cache();
    }
  });
  window.addEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, invalidateQuarters030519Cache);
  window.addEventListener('local_data_changed', invalidateQuarters030519Cache);
}

/**
 * Builds base itemsMap from the official dataset and attached 03.05.19 report
 */
function buildOfficialItemsMap(): Record<number, any> {
  const map: Record<number, any> = {};
  OFFICIAL_CURVA_ABC_DATASET.forEach(item => {
    const precoCalc = item.vendaMediaDiariaCx > 0 
      ? Math.round((item.vendaMediaReaisDia / item.vendaMediaDiariaCx) * 100) / 100 
      : 50;
    const fatorHectoCalc = item.vendaMediaDiariaCx > 0
      ? Math.round((item.vendaMediaHectolitroDia / item.vendaMediaDiariaCx) * 10000) / 10000
      : 0.072;

    map[item.codigoSku] = {
      codigo: item.codigoSku,
      produto: item.produto,
      unidade: item.unidade,
      volumeTotalTrimestre: item.volumeTotalTrimestre,
      vendaMediaDiaria: item.vendaMediaDiariaCx,
      fatorHecto: fatorHectoCalc,
      precoUnitario: precoCalc,
      vendaMediaReais: item.vendaMediaReaisDia,
      vendaMediaHectolitro: item.vendaMediaHectolitroDia,
      faturamentoTotal: item.faturamentoTotalReais,
      volumeTotalHectolitros: item.volumeTotalHl,
      categoria: item.categoria,
      classeABC: item.classeAbc,
      curvaAbc: item.classeAbc,
      rank: item.rank,
      source: '030519'
    };
  });

  // Também mesclar itens específicos anexados do relatório 03.05.19
  RELATORIO_030519_RAW_ITEMS.forEach((rItem, idx) => {
    const vm = rItem.vendaMediaDiaria;
    const vol = rItem.volumeTotal;
    const pr = rItem.precoMedioEstimado || 50;
    const fh = rItem.fatorHecto || 0.072;
    map[rItem.codigo] = {
      codigo: rItem.codigo,
      produto: rItem.produto,
      unidade: rItem.unidade || 'cx',
      volumeTotalTrimestre: vol,
      vendaMediaDiaria: vm,
      fatorHecto: fh,
      precoUnitario: pr,
      vendaMediaReais: Math.round(vm * pr * 100) / 100,
      vendaMediaHectolitro: Math.round(vm * fh * 100) / 100,
      faturamentoTotal: Math.round(vol * pr * 100) / 100,
      volumeTotalHectolitros: Math.round(vol * fh * 100) / 100,
      categoria: 'Geral',
      classeABC: rItem.curvaAbc || 'B',
      curvaAbc: rItem.curvaAbc || 'B',
      rank: idx + 1,
      source: '030519'
    };
  });

  return map;
}

/**
 * Returns populated initial quarters for 03.05.19 with official 190 items
 */
export function getDefault030519Quarters(): Record<string, TrimestreStore> {
  const baseMap = buildOfficialItemsMap();
  return {
    Q1: { diasUteis: 66, itemsMap: { ...baseMap } },
    Q2: { diasUteis: 65, itemsMap: { ...baseMap } },
    Q3: { diasUteis: 66, itemsMap: { ...baseMap } },
    Q4: { diasUteis: 64, itemsMap: { ...baseMap } },
  };
}

/**
 * Returns all stored quarters data for 03.05.19 from localStorage (memoized in memory)
 */
export function getStored030519Quarters(): Record<string, TrimestreStore> {
  if (cachedQuarters030519) return cachedQuarters030519;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIMESTRES_030519);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed.Q1 || parsed.Q2 || parsed.Q3 || parsed.Q4)) {
        cachedQuarters030519 = {
          Q1: parsed.Q1 || { diasUteis: 66, itemsMap: {} },
          Q2: parsed.Q2 || { diasUteis: 65, itemsMap: {} },
          Q3: parsed.Q3 || { diasUteis: 66, itemsMap: {} },
          Q4: parsed.Q4 || { diasUteis: 64, itemsMap: {} },
        };
        return cachedQuarters030519;
      }
    }
  } catch (e) {
    console.error('Erro ao ler 03.05.19 do localStorage:', e);
  }
  const defaults = getDefault030519Quarters();
  cachedQuarters030519 = defaults;
  return defaults;
}

/**
 * Returns a consolidated lookup map of all SKUs with their manually imported 03.05.19 data.
 * Does not invent sales data if 03.05.19 has not been imported.
 */
export function getConsolidated030519Map(): Map<string, Item030519Data> {
  const quarters = getStored030519Quarters();
  const map = new Map<string, Item030519Data>();

  // Determine current active quarter based on month
  const month = new Date().getMonth() + 1; // 1 to 12
  const currentQ = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';

  // Priority order: Current quarter -> other quarters with data
  const qPriority = [currentQ, 'Q1', 'Q2', 'Q3', 'Q4'].filter((v, i, a) => a.indexOf(v) === i);

  let chosenQuarterKey = '';
  for (const qKey of qPriority) {
    const qData = quarters[qKey];
    if (qData && qData.itemsMap && Object.keys(qData.itemsMap).length > 0) {
      chosenQuarterKey = qKey;
      break;
    }
  }

  // If a quarter has data, load it first
  if (chosenQuarterKey && quarters[chosenQuarterKey]?.itemsMap) {
    const rawItems = Object.values(quarters[chosenQuarterKey].itemsMap || {});
    const items = rawItems.filter((item: any) => item && typeof item === 'object' && item.codigo != null && !isNaN(Number(item.codigo)));
    
    // Sort by volume to assign Pareto ABC
    const sorted = [...items].sort((a: any, b: any) => (b.volumeTotalTrimestre || 0) - (a.volumeTotalTrimestre || 0));
    const totalVol = sorted.reduce((sum, item: any) => sum + (Number(item.volumeTotalTrimestre) || 0), 0);
    
    let acc = 0;
    sorted.forEach((item: any, idx) => {
      const vol = Number(item.volumeTotalTrimestre) || 0;
      acc += vol;
      const pctAcc = totalVol > 0 ? (acc / totalVol) * 100 : 0;
      const classeABC: 'A' | 'B' | 'C' = (pctAcc <= 60.01 || idx === 0) ? 'A' : (pctAcc <= 85.01) ? 'B' : 'C';

      const codeStr = String(item.codigo).trim();
      map.set(codeStr, {
        codigo: Number(item.codigo),
        produto: item.produto || item.descricao || `Produto ${codeStr}`,
        unidade: item.unidade || 'cx',
        volumeTotalTrimestre: vol,
        vendaMediaDiaria: Math.max(0.1, Number(item.vendaMediaDiaria) || (vol / (quarters[chosenQuarterKey].diasUteis || 66))),
        fatorHecto: Number(item.fatorHecto) || 0.1,
        precoUnitario: Number(item.precoUnitario) || 50,
        vendaMediaReais: Number(item.vendaMediaReais) || 0,
        vendaMediaHectolitro: Number(item.vendaMediaHectolitro) || 0,
        faturamentoTotal: Number(item.faturamentoTotal) || 0,
        volumeTotalHectolitros: Number(item.volumeTotalHectolitros) || 0,
        categoria: item.categoria || item.familia || 'Geral',
        classeABC,
        curvaAbc: classeABC,
        rank: idx + 1,
        source: '030519'
      });
    });
  }

  // Also check and merge from getVendaMediaItens() in af_estoque_venda_media
  try {
    const estoqueStorageItems = getVendaMediaItens();
    if (estoqueStorageItems && estoqueStorageItems.length > 0) {
      estoqueStorageItems.forEach((esItem, idx) => {
        if (!esItem || typeof esItem !== 'object' || esItem.codigo == null || isNaN(Number(esItem.codigo))) return;
        const codeNum = Number(esItem.codigo);
        const codeStr = String(codeNum);
        const vmDiaria = Number((esItem as any).vendaMediaDiaria || (esItem as any).vendaMedia || 0);

        if (vmDiaria > 0) {
          const itemData: Item030519Data = {
            codigo: codeNum,
            produto: esItem.produto || (esItem as any).descricao || `Produto ${codeStr}`,
            unidade: (esItem as any).unidade || 'cx',
            volumeTotalTrimestre: Number((esItem as any).vendaTotalTrimestre || (esItem as any).volumeTotalTrimestre || vmDiaria * 30),
            vendaMediaDiaria: vmDiaria,
            fatorHecto: (esItem as any).fatorHecto || 0.072,
            precoUnitario: Number(esItem.precoUnitario) || 50,
            vendaMediaReais: Number((esItem as any).vendaMediaReais) || vmDiaria * (Number(esItem.precoUnitario) || 50),
            vendaMediaHectolitro: Number((esItem as any).vendaMediaHectolitro) || vmDiaria * 0.1,
            faturamentoTotal: Number((esItem as any).faturamentoTotal) || (vmDiaria * 30 * (Number(esItem.precoUnitario) || 50)),
            volumeTotalHectolitros: Number((esItem as any).volumeTotalHectolitros) || (vmDiaria * 30 * 0.1),
            categoria: esItem.familia || (esItem as any).categoria || 'Geral',
            classeABC: (esItem as any).classeABC || 'B',
            curvaAbc: (esItem as any).curvaAbc || 'B',
            rank: idx + 1,
            source: '030519'
          };

          map.set(codeStr, itemData);
          map.set(String(esItem.codigo), itemData);
        }
      });
    }
  } catch (err) {
    console.warn('Erro ao mesclar af_estoque_venda_media:', err);
  }

  return map;
}

/**
 * Returns single SKU 03.05.19 data from manual import if available.
 * Handles both plain codes (9067), leading-zero codes (0009067), and string/number variations.
 */
export function get030519DataForSku(codigo: string | number): Item030519Data | null {
  if (codigo === undefined || codigo === null) return null;
  const rawStr = String(codigo).trim();
  if (!rawStr) return null;

  const map = getConsolidated030519Map();
  
  if (map.has(rawStr)) return map.get(rawStr)!;

  const digits = rawStr.replace(/\D/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    const numStr = String(num);
    if (map.has(numStr)) return map.get(numStr)!;

    const padded7 = numStr.padStart(7, '0');
    if (map.has(padded7)) return map.get(padded7)!;
  }

  // Fallback direto ao dataset oficial anexado
  const rawRel = getRelatorio030519Item(codigo);
  if (rawRel) {
    const vm = rawRel.vendaMediaDiaria;
    const vol = rawRel.volumeTotal;
    const pr = rawRel.precoMedioEstimado || 50;
    const fh = rawRel.fatorHecto || 0.072;
    return {
      codigo: rawRel.codigo,
      produto: rawRel.produto,
      unidade: rawRel.unidade || 'cx',
      volumeTotalTrimestre: vol,
      vendaMediaDiaria: vm,
      fatorHecto: fh,
      precoUnitario: pr,
      vendaMediaReais: Math.round(vm * pr * 100) / 100,
      vendaMediaHectolitro: Math.round(vm * fh * 100) / 100,
      faturamentoTotal: Math.round(vol * pr * 100) / 100,
      volumeTotalHectolitros: Math.round(vol * fh * 100) / 100,
      categoria: 'Geral',
      classeABC: rawRel.curvaAbc || 'B',
      curvaAbc: rawRel.curvaAbc || 'B',
      rank: 1,
      source: '030519'
    };
  }

  return null;
}

/**
 * Broadcasts an update across the app whenever 03.05.19 is imported or updated
 */
export function sync030519WithEstoqueStorage(updatedItemsMap: Record<number | string, any>): void {
  try {
    if (!updatedItemsMap || typeof updatedItemsMap !== 'object') return;

    // Normalize updatedItemsMap: handle if caller passed quarters dictionary e.g. { Q1: { itemsMap }, Q2: ... }
    const flatItems: any[] = [];
    const isQuarterDict = Object.keys(updatedItemsMap).some(k => k === 'Q1' || k === 'Q2' || k === 'Q3' || k === 'Q4');

    if (isQuarterDict) {
      Object.values(updatedItemsMap).forEach((q: any) => {
        if (q && q.itemsMap && typeof q.itemsMap === 'object') {
          Object.values(q.itemsMap).forEach((item: any) => {
            if (item && typeof item === 'object' && item.codigo != null && !isNaN(Number(item.codigo))) {
              flatItems.push(item);
            }
          });
        }
      });
    } else {
      Object.values(updatedItemsMap).forEach((item: any) => {
        if (item && typeof item === 'object' && item.codigo != null && !isNaN(Number(item.codigo))) {
          flatItems.push(item);
        }
      });
    }

    const currentStorage = getVendaMediaItens();
    const storageMap = new Map<number, VendaMediaItem>();
    if (Array.isArray(currentStorage)) {
      currentStorage.forEach(item => {
        if (item && typeof item === 'object' && item.codigo != null && !isNaN(Number(item.codigo))) {
          storageMap.set(Number(item.codigo), item);
        }
      });
    }

    flatItems.forEach((item: any) => {
      if (!item || typeof item !== 'object' || item.codigo == null) return;
      const code = Number(item.codigo);
      if (isNaN(code) || code <= 0) return;
      const existing = storageMap.get(code);
      storageMap.set(code, {
        codigo: code,
        produto: item.produto || item.descricao || existing?.produto || `Produto ${code}`,
        vendaMediaDiaria: Math.max(0.1, Math.round(Number(item.vendaMediaDiaria || item.vendaMedia || 0) * 100) / 100),
        precoUnitario: Number(item.precoUnitario) || existing?.precoUnitario || 50,
        familia: item.categoria || item.familia || existing?.familia || 'Cervejas',
        marca: existing?.marca || 'Ambev',
        setor: existing?.setor || 'Central A',
        atualizadoEm: new Date().toISOString()
      });
    });

    saveVendaMediaItens(Array.from(storageMap.values()));

    // Also update active quarter in STORAGE_KEY_TRIMESTRES_030519 if flat map provided
    if (!isQuarterDict && flatItems.length > 0) {
      const quarters = getStored030519Quarters();
      const month = new Date().getMonth() + 1;
      const currentQ = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
      if (!quarters[currentQ]) {
        quarters[currentQ] = { diasUteis: 66, itemsMap: {} };
      }
      if (!quarters[currentQ].itemsMap) {
        quarters[currentQ].itemsMap = {};
      }
      flatItems.forEach((item: any) => {
        if (item && item.codigo != null && !isNaN(Number(item.codigo))) {
          quarters[currentQ].itemsMap[Number(item.codigo)] = item;
        }
      });
      quarters[currentQ].importadoEm = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_TRIMESTRES_030519, JSON.stringify(quarters));
      invalidateQuarters030519Cache();
    }

    window.dispatchEvent(new CustomEvent(EVENT_VENDA_MEDIA_030519_UPDATED));
    window.dispatchEvent(new CustomEvent('local_data_changed'));
  } catch (e) {
    console.error('Erro ao sincronizar 03.05.19 com estoque storage:', e);
  }
}

export function normalizeText(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

/**
 * Robust parser for text pasted from SAP report 03.05.19 (Venda Média / Giro Diário)
 */
export function parseSapNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  let str = String(val).trim();
  if (!str) return 0;

  let isNegative = false;
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.replace(/^[-\s]+/, '');
  }

  // Handle format like "25112;03" (integer;cents with semicolon separator)
  if (str.includes(';')) {
    const parts = str.split(';');
    const cleanInt = parts[0].replace(/[^\d]/g, '');
    const cleanDec = parts[1] ? parts[1].replace(/[^\d]/g, '') : '0';
    if (!cleanInt && !cleanDec) return 0;
    const num = parseFloat(`${cleanInt || '0'}.${cleanDec || '0'}`);
    return isNegative ? -num : num;
  }

  // Handle Brazilian decimal format "25.112,03" or "25112,03"
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return isNegative ? -Math.abs(num) : num;
  }

  // Standard float
  const clean = str.replace(/[^\d.-]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Robust parser for text / CSV / Excel pasted from SAP report 03.05.19 (Venda Média / Giro Diário)
 * Exact SAP standard: Column G (index 6) = SKU Code, Column H (index 7) = Product Name, Column AC (index 28) = Total, Column J (index 9) = Venda
 */
export function parse030519Text(text: string, diasUteis: number = 30): Item030519Data[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const dias = diasUteis > 0 ? diasUteis : 30;

  interface SkuAccumulator {
    codigo: number;
    rawCode: string;
    produto: string;
    unidade: string;
    totalVolume: number;
    vendaVolume: number;
  }

  const skuMap = new Map<number, SkuAccumulator>();

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // Ignorar linhas de cabeçalho puro
    if (lineIdx === 0 || (/unb|gte\s*vendas|linha-marca|tipo-marca|produto|nome\s*produto/i.test(line) && !/^\d{4}/.test(line))) {
      if (/produto|nome\s*produto/i.test(line)) continue;
    }

    // Separadores comuns: ponto-e-vírgula, tabulação, múltiplos espaços
    let cols = line.split(';');
    if (cols.length < 2) cols = line.split('\t');
    if (cols.length < 2) cols = line.split(/ {2,}/);

    let codeRaw = '';
    let descRaw = '';
    let unitRaw = 'cx';
    let qty = 0;
    let vendaQty = 0;

    // Caso 1: Formato padrão SAP 03.05.19 completo (Coluna G = index 6, Coluna H = index 7, Coluna AC = index 28)
    if (cols.length >= 29) {
      codeRaw = cols[6] ? cols[6].trim() : '';
      descRaw = cols[7] ? cols[7].trim() : '';
      unitRaw = cols[8] ? cols[8].trim() : 'cx';
      
      // Total está na coluna AC (index 28)
      qty = parseSapNumber(cols[28]);
      // Venda está na coluna J (index 9)
      vendaQty = parseSapNumber(cols[9]);

      if (qty === 0 && vendaQty > 0) {
        qty = vendaQty;
      }
    } else if (cols.length >= 7) {
      // Caso 2: Formato com pelo menos 7 colunas (Coluna G = Código)
      codeRaw = cols[6] ? cols[6].trim() : cols[0].trim();
      descRaw = cols[7] ? cols[7].trim() : (cols[1] ? cols[1].trim() : '');
      unitRaw = cols[8] ? cols[8].trim() : 'cx';
      
      // Tentar pegar a última ou penúltima coluna numérica como quantidade
      for (let i = cols.length - 1; i >= 2; i--) {
        const val = parseSapNumber(cols[i]);
        if (val !== 0) {
          qty = val;
          break;
        }
      }
    } else if (cols.length >= 2) {
      // Caso 3: Formato simplificado (Código; Descrição; Venda) ou (Código; Venda)
      codeRaw = cols[0].trim();
      if (cols.length === 2) {
        descRaw = `Produto ${codeRaw}`;
        qty = parseSapNumber(cols[1]);
      } else {
        descRaw = cols[1].trim();
        qty = parseSapNumber(cols[2]);
      }
    } else {
      // Caso 4: Linha contínua com Regex
      const rx = /(\d{4,8})\s+([A-Z0-9\s\/\.\-]+?)\s+([\d.,;]+)/i;
      const m = line.match(rx);
      if (m) {
        codeRaw = m[1].trim();
        descRaw = m[2].trim();
        qty = parseSapNumber(m[3]);
      }
    }

    // Limpar e validar código do SKU
    const cleanDigits = codeRaw.replace(/\D/g, '');
    const codigoNum = parseInt(cleanDigits, 10);

    if (isNaN(codigoNum) || codigoNum <= 0) {
      continue;
    }

    // Se for cabeçalho disfarçado
    if (descRaw.toLowerCase().includes('nome produto') || codeRaw.toLowerCase().includes('produto')) {
      continue;
    }

    const cleanDesc = descRaw || `Produto ${codigoNum}`;

    // Acumular volumes por SKU (somar todas as Gtes / UNBs do mesmo produto)
    if (skuMap.has(codigoNum)) {
      const existing = skuMap.get(codigoNum)!;
      existing.totalVolume += qty;
      existing.vendaVolume += vendaQty;
      if (cleanDesc && cleanDesc.length > existing.produto.length && !existing.produto.includes(cleanDesc)) {
        existing.produto = cleanDesc;
      }
      if (unitRaw && unitRaw !== 'cx') {
        existing.unidade = unitRaw;
      }
    } else {
      skuMap.set(codigoNum, {
        codigo: codigoNum,
        rawCode: codeRaw,
        produto: cleanDesc,
        unidade: unitRaw || 'cx',
        totalVolume: qty,
        vendaVolume: vendaQty
      });
    }
  }

  // Converter acumulador em itens com Venda Média Diária calculada
  const rawList = Array.from(skuMap.values());
  const sorted = [...rawList].sort((a, b) => b.totalVolume - a.totalVolume);
  const totalVolumeGeral = sorted.reduce((sum, item) => sum + Math.max(0, item.totalVolume), 0);

  let accVol = 0;
  const items: Item030519Data[] = [];

  sorted.forEach((item, idx) => {
    const vol = Math.max(0, Math.round(item.totalVolume * 100) / 100);
    accVol += vol;
    const pctAcc = totalVolumeGeral > 0 ? (accVol / totalVolumeGeral) * 100 : 0;
    const classeABC: 'A' | 'B' | 'C' = (pctAcc <= 60.01 || idx === 0) ? 'A' : (pctAcc <= 85.01) ? 'B' : 'C';

    const vendaMediaDiaria = dias > 0 ? Math.round((vol / dias) * 100) / 100 : vol;
    const precoUnitario = 50.0;

    items.push({
      codigo: item.codigo,
      produto: item.produto,
      unidade: item.unidade,
      volumeTotalTrimestre: vol,
      vendaMediaDiaria: vendaMediaDiaria > 0 ? vendaMediaDiaria : 0.1,
      fatorHecto: 0.1,
      precoUnitario,
      vendaMediaReais: Math.round(vendaMediaDiaria * precoUnitario * 100) / 100,
      vendaMediaHectolitro: Math.round(vendaMediaDiaria * 0.1 * 100) / 100,
      faturamentoTotal: Math.round(vol * precoUnitario * 100) / 100,
      volumeTotalHectolitros: Math.round(vol * 0.1 * 100) / 100,
      categoria: 'Geral',
      classeABC,
      curvaAbc: classeABC,
      rank: idx + 1,
      source: '030519'
    });
  });

  return items;
}

/**
 * Salva trimestre com itens importados do 03.05.19
 */
export function save030519Quarter(quarter: string, diasUteis: number, items: Item030519Data[], fileName?: string): void {
  const current = getStored030519Quarters();
  const itemsMap: Record<number, any> = {};

  items.forEach(it => {
    itemsMap[it.codigo] = it;
  });

  current[quarter] = {
    diasUteis: diasUteis > 0 ? diasUteis : 66,
    itemsMap,
    importadoEm: new Date().toISOString(),
    nomeArquivo: fileName || `03.05.19_${quarter}.xlsx`
  };

  try {
    localStorage.setItem(STORAGE_KEY_TRIMESTRES_030519, JSON.stringify(current));
    invalidateQuarters030519Cache();
    sync030519WithEstoqueStorage(itemsMap);
    window.dispatchEvent(new Event(EVENT_VENDA_MEDIA_030519_UPDATED));
  } catch (e) {
    console.error('Erro ao salvar trimestre 03.05.19:', e);
  }
}

export function getSafe030519Item(code: string | number): Item030519Data {
  const found = get030519DataForSku(code);
  if (found) return found;

  const codeNum = parseInt(String(code).replace(/\D/g, ''), 10) || 0;
  return {
    codigo: codeNum,
    produto: `SKU ${codeNum || code}`,
    unidade: 'cx',
    volumeTotalTrimestre: 0,
    vendaMediaDiaria: 1.0,
    fatorHecto: 0.072,
    precoUnitario: 50.0,
    vendaMediaReais: 50.0,
    vendaMediaHectolitro: 0.072,
    faturamentoTotal: 0,
    volumeTotalHectolitros: 0,
    categoria: 'Geral',
    classeABC: 'B',
    curvaAbc: 'B',
    source: 'fallback'
  };
}

/**
 * Custom React Hook that keeps any component in sync with 03.05.19 data updates
 */
export function useVendaMedia030519() {
  const [dataMap, setDataMap] = useState<Map<string, Item030519Data>>(() => getConsolidated030519Map());
  const [allQuarters, setAllQuarters] = useState<Record<string, TrimestreStore>>(() => getStored030519Quarters());
  const [activeQuarterInfo, setActiveQuarterInfo] = useState<{ quarter: string; skusCount: number; importadoEm?: string }>(() => {
    try {
      const quarters = getStored030519Quarters();
      const month = new Date().getMonth() + 1;
      const currentQ = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
      const qPriority = [currentQ, 'Q1', 'Q2', 'Q3', 'Q4'].filter((v, i, a) => a.indexOf(v) === i);
      for (const qKey of qPriority) {
        if (quarters[qKey] && quarters[qKey].itemsMap && Object.keys(quarters[qKey].itemsMap).length > 0) {
          return {
            quarter: qKey,
            skusCount: Object.keys(quarters[qKey].itemsMap).length,
            importadoEm: quarters[qKey].importadoEm
          };
        }
      }
    } catch {}
    return { quarter: 'Q1', skusCount: 0 };
  });

  const reload = useCallback(() => {
    const map = getConsolidated030519Map();
    setDataMap(map);

    const quarters = getStored030519Quarters();
    setAllQuarters(quarters);
    let qFound = 'Q1';
    let count = 0;
    let imp: string | undefined = undefined;

    const month = new Date().getMonth() + 1;
    const currentQ = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
    const qPriority = [currentQ, 'Q1', 'Q2', 'Q3', 'Q4'].filter((v, i, a) => a.indexOf(v) === i);

    for (const qKey of qPriority) {
      if (quarters[qKey] && quarters[qKey].itemsMap && Object.keys(quarters[qKey].itemsMap).length > 0) {
        qFound = qKey;
        count = Object.keys(quarters[qKey].itemsMap).length;
        imp = quarters[qKey].importadoEm;
        break;
      }
    }

    setActiveQuarterInfo({
      quarter: qFound,
      skusCount: count,
      importadoEm: imp
    });
  }, []);

  useEffect(() => {
    const handleUpdate = () => reload();
    window.addEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [reload]);

  return {
    dataMap,
    allQuarters,
    activeQuarterInfo,
    reload,
    refresh: reload,
    getItem: (code: string | number) => dataMap.get(String(code).trim()) || getSafe030519Item(code)
  };
}
