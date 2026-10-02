import { VendaMediaItem } from '../types/estoque';
import { getVendaMediaItens, saveVendaMediaItens } from './estoqueStorage';
import { getStored030519Quarters, STORAGE_KEY_TRIMESTRES_030519, Item030519Data } from './vendaMedia030519';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { PRODUCTS } from '../planosData';

export interface CurvaAbcItem {
  codigo: number;
  produto: string;
  familia: string;
  marca: string;
  setor: string;
  vendaMediaDiaria: number; // cx/dia or hl/dia
  venda3MesesTotal: number; // Volume total nos 3 meses faturados (vendaMediaDiaria * diasUteis3Meses)
  precoUnitario: number;
  faturamentoDiario: number; // R$/dia
  faturamento3Meses: number; // R$ total 3 meses
  rank: number;
  volumeAcumulado: number;
  percentualVolume: number;
  percentualAcumulado: number;
  classeABC: 'A' | 'B' | 'C';
  
  // Sugestões de Alocação de Picking e Layout
  posicaoPickingSugerida: string;
  zonaLayoutSugerida: string;
  capacidadePickingPaletes: number;
  prioridadeRessuprimento: 'Alta (Imediata)' | 'Média (Padrão)' | 'Baixa (Sob Demanda)';
  distanciaDocaMetros: string;
  posicaoAtualPicking?: string;
  adesaoLayout: 'Alinhado' | 'Desvio de Layout' | 'Crítico';
}

export interface CurvaAbcResumo {
  totalSkus: number;
  vendaTotal3Meses: number;
  faturamentoTotal3Meses: number;
  countA: number;
  pctSkusA: number;
  volA: number;
  pctVolA: number;
  valA: number;
  pctValA: number;
  
  countB: number;
  pctSkusB: number;
  volB: number;
  pctVolB: number;
  valB: number;
  pctValB: number;
  
  countC: number;
  pctSkusC: number;
  volC: number;
  pctVolC: number;
  valC: number;
  pctValC: number;

  percentualAdesaoLayout: number;
}

const STORAGE_KEY_ABC_OVERRIDES = 'af_curva_abc_overrides_v1';
const STORAGE_KEY_ABC_PARAMS = 'af_curva_abc_params_v1';

export interface AbcParams {
  diasUteis3Meses: number; // Default 66 days
  criterioCalculo: 'volume' | 'faturamento';
  cortePctA: number; // Default 80
  cortePctB: number; // Default 15 (accumulated 95)
  cortePctC: number; // Default 5 (accumulated 100)
}

export function getAbcParams(): AbcParams {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ABC_PARAMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler parametros ABC:', e);
  }
  return {
    diasUteis3Meses: 66,
    criterioCalculo: 'volume',
    cortePctA: 60,
    cortePctB: 25,
    cortePctC: 15
  };
}

export function saveAbcParams(params: AbcParams): void {
  try {
    localStorage.setItem(STORAGE_KEY_ABC_PARAMS, JSON.stringify(params));
  } catch (e) {
    console.error('Erro ao salvar parametros ABC:', e);
  }
}

export function getAbcOverrides(): Record<number, 'A' | 'B' | 'C'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ABC_OVERRIDES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler overrides ABC:', e);
  }
  return {};
}

export function setAbcOverride(codigo: number, classe: 'A' | 'B' | 'C' | null): void {
  const current = getAbcOverrides();
  if (classe === null) {
    delete current[codigo];
  } else {
    current[codigo] = classe;
  }
  try {
    localStorage.setItem(STORAGE_KEY_ABC_OVERRIDES, JSON.stringify(current));
  } catch (e) {
    console.error('Erro ao salvar override ABC:', e);
  }
}

export type QuarterKey = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANUAL';

/**
 * Resolves target Quarter based on explicit quarter or date range / single date
 * e.g., Janeiro (month 01) -> Q1
 * e.g., Junho (month 06) -> Q2
 * e.g., Agosto (month 08) -> Q3
 * e.g., Outubro (month 10) -> Q4
 * e.g., Full year / multiple quarters / no dates -> ANUAL
 */
export function resolveQuarterFromFilters(options?: {
  quarter?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
}): QuarterKey {
  if (!options) return 'ANUAL';

  const { quarter, startDate, endDate, date } = options;

  // 1. Explicit Quarter passed
  if (quarter && quarter !== 'all' && quarter !== 'ANUAL') {
    const qUpper = quarter.toUpperCase().trim();
    if (qUpper === 'Q1' || qUpper === '1' || qUpper === '1T' || qUpper === '1TRI') return 'Q1';
    if (qUpper === 'Q2' || qUpper === '2' || qUpper === '2T' || qUpper === '2TRI') return 'Q2';
    if (qUpper === 'Q3' || qUpper === '3' || qUpper === '3T' || qUpper === '3TRI') return 'Q3';
    if (qUpper === 'Q4' || qUpper === '4' || qUpper === '4T' || qUpper === '4TRI') return 'Q4';
  }

  // 2. Single specific date passed (e.g. from daily analysis '2026-06-15' or '2026-01-20')
  if (date) {
    const parts = date.split('-');
    if (parts.length >= 2) {
      const month = parseInt(parts[1], 10);
      if (month >= 1 && month <= 3) return 'Q1';
      if (month >= 4 && month <= 6) return 'Q2';
      if (month >= 7 && month <= 9) return 'Q3';
      if (month >= 10 && month <= 12) return 'Q4';
    }
  }

  // 3. Date range passed (startDate and/or endDate)
  if (startDate || endDate) {
    const startM = startDate ? parseInt(startDate.split('-')[1], 10) : undefined;
    const endM = endDate ? parseInt(endDate.split('-')[1], 10) : undefined;

    const getQuarterForMonth = (m: number): QuarterKey => {
      if (m <= 3) return 'Q1';
      if (m <= 6) return 'Q2';
      if (m <= 9) return 'Q3';
      return 'Q4';
    };

    if (startM && endM) {
      const qStart = getQuarterForMonth(startM);
      const qEnd = getQuarterForMonth(endM);
      if (qStart === qEnd) return qStart;
      return 'ANUAL';
    } else if (startM) {
      return getQuarterForMonth(startM);
    } else if (endM) {
      return getQuarterForMonth(endM);
    }
  }

  return 'ANUAL';
}

/**
 * Calculates Pareto ABC classes for all SKUs according to the Commercial Dashboard (03.05.19)
 * for a specific Quarter (Q1, Q2, Q3, Q4) or Annual (all quarters combined).
 */
export function getQuarterAbcData(
  targetQuarter: QuarterKey = 'ANUAL',
  customCriterio: 'volume' | 'faturamento' | 'caixas' | 'hectolitros' = 'volume'
): {
  map: Map<number, 'A' | 'B' | 'C'>;
  quarter: QuarterKey;
  items: Array<{
    codigo: number;
    produto: string;
    volumeTotal: number;
    faturamentoTotal: number;
    classeABC: 'A' | 'B' | 'C';
    rank: number;
    pctAcumulado: number;
  }>;
} {
  const quarters = getStored030519Quarters();
  const rawItemsMap = new Map<number, {
    codigo: number;
    produto: string;
    volumeTotal: number;
    precoUnitario: number;
    fatorHecto: number;
    faturamentoTotal: number;
  }>();

  const globalOverrides = getAbcOverrides();

  if (targetQuarter === 'ANUAL') {
    // Sum across all quarters Q1, Q2, Q3, Q4
    (['Q1', 'Q2', 'Q3', 'Q4'] as const).forEach(qKey => {
      const qStore = quarters[qKey];
      if (qStore && qStore.itemsMap) {
        Object.values(qStore.itemsMap).forEach((item: any) => {
          const code = Number(item.codigo);
          if (!code || isNaN(code)) return;
          const vol = Number(item.volumeTotalTrimestre || item.volumeTotal || 0);
          const price = Number(item.precoUnitario || 50);
          const fHecto = Number(item.fatorHecto || 0.072);

          const existing = rawItemsMap.get(code);
          if (existing) {
            existing.volumeTotal += vol;
            existing.faturamentoTotal += vol * price;
          } else {
            rawItemsMap.set(code, {
              codigo: code,
              produto: item.produto || item.descricao || `PRODUTO ${code}`,
              volumeTotal: vol,
              precoUnitario: price,
              fatorHecto: fHecto,
              faturamentoTotal: vol * price
            });
          }
        });
      }
    });
  } else {
    // Single specific quarter (Q1, Q2, Q3, or Q4)
    const qStore = quarters[targetQuarter];
    if (qStore && qStore.itemsMap && Object.keys(qStore.itemsMap).length > 0) {
      Object.values(qStore.itemsMap).forEach((item: any) => {
        const code = Number(item.codigo);
        if (!code || isNaN(code)) return;
        const vol = Number(item.volumeTotalTrimestre || item.volumeTotal || 0);
        const price = Number(item.precoUnitario || 50);
        const fHecto = Number(item.fatorHecto || 0.072);

        rawItemsMap.set(code, {
          codigo: code,
          produto: item.produto || item.descricao || `PRODUTO ${code}`,
          volumeTotal: vol,
          precoUnitario: price,
          fatorHecto: fHecto,
          faturamentoTotal: vol * price
        });
      });
    }
  }

  // Fallback: If 03.05.19 has no imported data for this quarter yet, fallback to Venda Média / Products Master
  if (rawItemsMap.size === 0) {
    const vmList = getVendaMediaItens();
    if (vmList && vmList.length > 0) {
      vmList.forEach(vm => {
        const code = Number(vm.codigo);
        const vol = (vm.vendaMediaDiaria || 0) * 66;
        const price = vm.precoUnitario || 50;
        rawItemsMap.set(code, {
          codigo: code,
          produto: vm.produto || `PRODUTO ${code}`,
          volumeTotal: vol,
          precoUnitario: price,
          fatorHecto: 0.072,
          faturamentoTotal: vol * price
        });
      });
    } else {
      PRODUCT_MASTER_DATA.forEach((p, idx) => {
        const code = Number(p.cod);
        const vol = 1000 - idx * 25;
        rawItemsMap.set(code, {
          codigo: code,
          produto: p.descricao,
          volumeTotal: Math.max(10, vol),
          precoUnitario: 50,
          fatorHecto: p.fatorHecto || 0.072,
          faturamentoTotal: Math.max(10, vol) * 50
        });
      });
    }
  }

  const rawArray = Array.from(rawItemsMap.values());

  // Sort descending based on chosen criterion (Volume or Faturamento)
  if (customCriterio === 'faturamento') {
    rawArray.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal);
  } else {
    rawArray.sort((a, b) => b.volumeTotal - a.volumeTotal);
  }

  const totalMetric = customCriterio === 'faturamento'
    ? (rawArray.reduce((acc, i) => acc + i.faturamentoTotal, 0) || 1)
    : (rawArray.reduce((acc, i) => acc + i.volumeTotal, 0) || 1);

  let accum = 0;
  const resultMap = new Map<number, 'A' | 'B' | 'C'>();
  const quarterStore = targetQuarter !== 'ANUAL' ? quarters[targetQuarter] : null;

  const items = rawArray.map((item, idx) => {
    const metricVal = customCriterio === 'faturamento' ? item.faturamentoTotal : item.volumeTotal;
    accum += metricVal;
    const pctAcumulado = (accum / totalMetric) * 100;

    let classeABC: 'A' | 'B' | 'C' = 'C';
    // Distribuição Balanceada das Faixas ABC: 60% A / 25% B / 15% C (expandindo e equilibrando a Curva C)
    if (pctAcumulado <= 60.01 || idx === 0) {
      classeABC = 'A';
    } else if (pctAcumulado <= 85.01) {
      classeABC = 'B';
    } else {
      classeABC = 'C';
    }

    // Check specific quarter override first, then global overrides
    if (quarterStore?.overridesABC?.[item.codigo]) {
      classeABC = quarterStore.overridesABC[item.codigo];
    } else if (globalOverrides[item.codigo]) {
      classeABC = globalOverrides[item.codigo];
    }

    resultMap.set(item.codigo, classeABC);

    return {
      codigo: item.codigo,
      produto: item.produto,
      volumeTotal: item.volumeTotal,
      faturamentoTotal: item.faturamentoTotal,
      classeABC,
      rank: idx + 1,
      pctAcumulado
    };
  });

  return {
    map: resultMap,
    quarter: targetQuarter,
    items
  };
}

/**
 * Returns dynamic ABC Map and lookup helper for any period / dashboard filter
 */
export function getAbcMapForPeriod(options?: {
  quarter?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  criterio?: 'volume' | 'faturamento' | 'caixas' | 'hectolitros';
}): {
  map: Map<number, 'A' | 'B' | 'C'>;
  quarter: QuarterKey;
  getCurva: (sku: number | string, fallback?: string) => 'A' | 'B' | 'C';
} {
  const resolvedQuarter = resolveQuarterFromFilters(options);
  const data = getQuarterAbcData(resolvedQuarter, options?.criterio || 'volume');

  const getCurva = (sku: number | string, fallback?: string): 'A' | 'B' | 'C' => {
    const skuNum = typeof sku === 'string' ? parseInt(sku.replace(/\D/g, ''), 10) : Number(sku);
    if (!skuNum || isNaN(skuNum)) return (fallback as any) || 'B';

    if (data.map.has(skuNum)) {
      return data.map.get(skuNum)!;
    }

    // Fallback to Master Catalog
    const master = PRODUCT_MASTER_DATA.find(p => p.cod === skuNum);
    if (master && (master.curva === 'A' || master.curva === 'B' || master.curva === 'C')) {
      return master.curva;
    }
    const plano = PRODUCTS.find(p => p.codigo === skuNum);
    if (plano && (plano.curva === 'A' || plano.curva === 'B' || plano.curva === 'C')) {
      return plano.curva;
    }

    if (fallback === 'A' || fallback === 'B' || fallback === 'C') {
      return fallback;
    }

    return 'B';
  };

  return {
    map: data.map,
    quarter: resolvedQuarter,
    getCurva
  };
}

// Engine calculating Pareto 80/20 ABC Curve from 3 Months Faturado Venda Média
export function calculateCurvaAbc(
  itemsInput?: VendaMediaItem[],
  customParams?: Partial<AbcParams>
): { items: CurvaAbcItem[]; resumo: CurvaAbcResumo } {
  const itemsVm = itemsInput || getVendaMediaItens();
  const params = { ...getAbcParams(), ...customParams };
  const overrides = getAbcOverrides();

  const diasUteis = params.diasUteis3Meses || 66;

  // 1. Calculate individual totals for 3 months
  const processed = itemsVm.map(item => {
    const venda3MesesTotal = (item.vendaMediaDiaria || 0) * diasUteis;
    const faturamentoDiario = (item.vendaMediaDiaria || 0) * (item.precoUnitario || 50);
    const faturamento3Meses = venda3MesesTotal * (item.precoUnitario || 50);

    return {
      codigo: item.codigo,
      produto: item.produto,
      familia: item.familia || 'Bebidas',
      marca: item.marca || 'AMBEV',
      setor: item.setor || 'Armazém Central',
      vendaMediaDiaria: item.vendaMediaDiaria || 0,
      venda3MesesTotal,
      precoUnitario: item.precoUnitario || 50,
      faturamentoDiario,
      faturamento3Meses,
      posicaoAtualPicking: item.setor || 'N/A'
    };
  });

  // 2. Sort descending based on criterion (Volume or Faturamento)
  if (params.criterioCalculo === 'faturamento') {
    processed.sort((a, b) => b.faturamento3Meses - a.faturamento3Meses);
  } else {
    processed.sort((a, b) => b.venda3MesesTotal - a.venda3MesesTotal);
  }

  // 3. Totals sum
  const vendaTotal3Meses = processed.reduce((sum, i) => sum + i.venda3MesesTotal, 0) || 1;
  const faturamentoTotal3Meses = processed.reduce((sum, i) => sum + i.faturamento3Meses, 0) || 1;

  let volumeAcumulado = 0;
  let countA = 0, volA = 0, valA = 0;
  let countB = 0, volB = 0, valB = 0;
  let countC = 0, volC = 0, valC = 0;

  const totalSkus = processed.length || 1;

  let skusAlinhadosCount = 0;

  // 4. Pareto 80/20 cumulative calculation
  const items: CurvaAbcItem[] = processed.map((p, idx) => {
    const rank = idx + 1;
    const baseValue = params.criterioCalculo === 'faturamento' ? p.faturamento3Meses : p.venda3MesesTotal;
    const grandTotal = params.criterioCalculo === 'faturamento' ? faturamentoTotal3Meses : vendaTotal3Meses;

    volumeAcumulado += baseValue;
    const percentualVolume = (baseValue / grandTotal) * 100;
    const percentualAcumulado = (volumeAcumulado / grandTotal) * 100;

    // Automatic classification threshold
    let classeABC: 'A' | 'B' | 'C' = 'C';
    if (percentualAcumulado <= params.cortePctA) {
      classeABC = 'A';
    } else if (percentualAcumulado <= (params.cortePctA + params.cortePctB)) {
      classeABC = 'B';
    } else {
      classeABC = 'C';
    }

    // Apply manual override if specified
    if (overrides[p.codigo]) {
      classeABC = overrides[p.codigo];
    }

    // Accumulate metrics per class
    if (classeABC === 'A') {
      countA++;
      volA += p.venda3MesesTotal;
      valA += p.faturamento3Meses;
    } else if (classeABC === 'B') {
      countB++;
      volB += p.venda3MesesTotal;
      valB += p.faturamento3Meses;
    } else {
      countC++;
      volC += p.venda3MesesTotal;
      valC += p.faturamento3Meses;
    }

    // Generate Picking & Layout Suggestions according to ABC Class
    let posicaoPickingSugerida = '';
    let zonaLayoutSugerida = '';
    let capacidadePickingPaletes = 1;
    let prioridadeRessuprimento: 'Alta (Imediata)' | 'Média (Padrão)' | 'Baixa (Sob Demanda)' = 'Baixa (Sob Demanda)';
    let distanciaDocaMetros = '> 60m';

    if (classeABC === 'A') {
      posicaoPickingSugerida = `Rua A / Doca 01-04 (Baia ${(idx % 6) + 1} - Nível 1 - Solo)`;
      zonaLayoutSugerida = 'ZONA FRONTAL - ALTO GIRO (Acesso Rápido Doca)';
      capacidadePickingPaletes = Math.min(8, Math.max(4, Math.round(p.vendaMediaDiaria / 25)));
      prioridadeRessuprimento = 'Alta (Imediata)';
      distanciaDocaMetros = '10 - 25m';
    } else if (classeABC === 'B') {
      posicaoPickingSugerida = `Rua C / Baia ${(idx % 8) + 1} - Nível 1 ou 2`;
      zonaLayoutSugerida = 'ZONA INTERMEDIÁRIA - MÉDIO GIRO';
      capacidadePickingPaletes = Math.min(4, Math.max(2, Math.round(p.vendaMediaDiaria / 35)));
      prioridadeRessuprimento = 'Média (Padrão)';
      distanciaDocaMetros = '25 - 50m';
    } else {
      posicaoPickingSugerida = `Rua E / Baia ${(idx % 10) + 1} - Nível 2 ou 3 (Aéreo/Fundo)`;
      zonaLayoutSugerida = 'ZONA DE FUNDO / PULMÃO SUPERIOR - BAIXO GIRO';
      capacidadePickingPaletes = 1;
      prioridadeRessuprimento = 'Baixa (Sob Demanda)';
      distanciaDocaMetros = '50 - 85m';
    }

    // Check layout alignment
    let adesaoLayout: 'Alinhado' | 'Desvio de Layout' | 'Crítico' = 'Alinhado';
    const posUpper = (p.posicaoAtualPicking || '').toUpperCase();
    if (classeABC === 'A' && (posUpper.includes('RUA E') || posUpper.includes('RUA F') || posUpper.includes('MARKETPLACE'))) {
      adesaoLayout = 'Crítico';
    } else if (classeABC === 'A' && !posUpper.includes('RUA A') && !posUpper.includes('RUA B') && !posUpper.includes('DOCA')) {
      adesaoLayout = 'Desvio de Layout';
    } else if (classeABC === 'C' && (posUpper.includes('DOCA') || posUpper.includes('RUA A'))) {
      adesaoLayout = 'Desvio de Layout';
    }

    if (adesaoLayout === 'Alinhado') {
      skusAlinhadosCount++;
    }

    return {
      ...p,
      rank,
      volumeAcumulado,
      percentualVolume,
      percentualAcumulado,
      classeABC,
      posicaoPickingSugerida,
      zonaLayoutSugerida,
      capacidadePickingPaletes,
      prioridadeRessuprimento,
      distanciaDocaMetros,
      adesaoLayout
    };
  });

  // Calculate Summary
  const resumo: CurvaAbcResumo = {
    totalSkus,
    vendaTotal3Meses,
    faturamentoTotal3Meses,
    countA,
    pctSkusA: (countA / totalSkus) * 100,
    volA,
    pctVolA: (volA / vendaTotal3Meses) * 100,
    valA,
    pctValA: (valA / faturamentoTotal3Meses) * 100,

    countB,
    pctSkusB: (countB / totalSkus) * 100,
    volB,
    pctVolB: (volB / vendaTotal3Meses) * 100,
    valB,
    pctValB: (valB / faturamentoTotal3Meses) * 100,

    countC,
    pctSkusC: (countC / totalSkus) * 100,
    volC,
    pctVolC: (volC / vendaTotal3Meses) * 100,
    valC,
    pctValC: (valC / faturamentoTotal3Meses) * 100,

    percentualAdesaoLayout: (skusAlinhadosCount / totalSkus) * 100
  };

  return { items, resumo };
}

// Quick map getter for other panels (e.g., PickingDashboard, Layout, Fefo, StockPolicy)
export function getAbcMap(): Map<number, 'A' | 'B' | 'C'> {
  const { map } = getAbcMapForPeriod({ quarter: 'ANUAL' });
  return map;
}

// Sync calculated ABC classes back into VendaMediaItens storage for persistence
export function syncAbcClassesToStorage(): void {
  const { items } = calculateCurvaAbc();
  const currentVm = getVendaMediaItens();
  const abcMap = new Map<number, 'A' | 'B' | 'C'>();
  items.forEach(i => abcMap.set(i.codigo, i.classeABC));

  const updated = currentVm.map(v => ({
    ...v,
    classeABC: abcMap.get(v.codigo) || 'C'
  }));

  saveVendaMediaItens(updated);
}

