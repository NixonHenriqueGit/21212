import { calcularPoliticaEstoque } from './estoqueStorage';
import { PRODUCTS } from '../planosData';
import { getProductMeta, getProductOfficialDescription, isProdutoCadastrado } from './productCatalogData';
import { buildOfficialQuebrasRows } from './retroactiveQuebrasParser';
import { parseValidadeDate, getDiasRestantes } from './calculateStockAgeIndex';
import { calcularTotalCaixas as calcCaixasPackaging } from '../data/coletaPackagingData';

export interface MatrizAbcItem {
  // Identificação
  codigo: number;
  descricao: string;
  grupo: string;
  familia: string;
  marca: string;
  embalagem: string;
  unidadeVenda: string;
  fator: number;
  fatorHecto: number;
  precoUnitario: number;

  // Movimentação
  vendaQtdCx: number;
  vendaValorRS: number;
  vendaVolumeHl: number;
  vendaDiariaCx: number;
  percentVendaValor: number;
  percentAcumuladoVendaValor: number;
  curvaAbcValor: 'A' | 'B' | 'C';
  percentVendaVolume: number;
  percentAcumuladoVendaVolume: number;
  curvaAbcVolume: 'A' | 'B' | 'C';

  // Estoque
  estoqueAtualCx: number;
  estoqueSkuFechado: number;
  estoqueUnidadeAvulsa: number;
  estoqueMedioCx: number;
  estoqueValorRS: number;
  percentEstoqueValor: number;
  percentAcumuladoEstoqueValor: number;
  curvaAbcEstoque: 'A' | 'B' | 'C';
  giroEstoque: number; // Rotatividade
  coberturaDias: number;

  // Operação & Pallets Movimentados
  qtdPickingCx: number;
  freqPicking: number;
  qtdReabastecimentos: number;
  freqReabastecimento: number;
  palletsRessuprimento: number; // Pallets recebidos/alocados no pulmão
  palletsReabastecimento: number; // Pallets transferidos do pulmão para o picking
  totalPalletsMovimentados: number; // Ressuprimento + Reabastecimento
  scoreImpactoOperacional: number;
  percentOperacional: number;
  percentAcumuladoOperacional: number;
  curvaAbcOperacional: 'A' | 'B' | 'C';

  // Qualidade e Perdas
  qtdQuebras: number;
  valorQuebrasRS: number;
  percentQuebra: number;
  shelfLifeDias: number;
  statusFefo: 'Ok' | 'Atencao' | 'Critico' | 'Vencido' | 'SemRegistro';
  diasParaVencimentoMin: number;
  riscoVencimento: 'Baixo' | 'Medio' | 'Alto' | 'Critico';

  // Classificação e Diagnóstico Final
  criticidade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  diagnosticoFinal: string;
}

export interface MatrizAbcKPIs {
  totalSkus: number;
  skusClasseA: number;
  skusClasseB: number;
  skusClasseC: number;
  percentFaturamentoClasseA: number;
  valorTotalEstoque: number;
  valorEstoqueClasseA: number;
  giroMedioEstoque: number;
  coberturaMediaDias: number;
  totalMovimentacoesOperacionais: number;
  totalReabastecimentos: number;
  totalPalletsMovimentados: number;
  palletsRessuprimentoTotal: number;
  palletsReabastecimentoTotal: number;
  valorTotalQuebras: number;
  volumeTotalQuebrasCx: number;
  skusRiscoVencimento: number;
}

/**
 * Robust date parser to calculate remaining shelf-life days from validade records
 */
function parseValidadeDiasParaVencer(v: any, hojeMs: number): number | null {
  if (v.diasParaVencer !== undefined && v.diasParaVencer !== null && !isNaN(Number(v.diasParaVencer))) {
    return Number(v.diasParaVencer);
  }
  if (v.diasRestantes !== undefined && v.diasRestantes !== null && !isNaN(Number(v.diasRestantes))) {
    return Number(v.diasRestantes);
  }
  if (v.dias !== undefined && v.dias !== null && !isNaN(Number(v.dias))) {
    return Number(v.dias);
  }
  
  const rawDateStr = v.validade || v.dataValidade || v.vencimento || v.dataVencimento;
  if (!rawDateStr) return null;

  const targetDate = parseValidadeDate(String(rawDateStr));
  if (targetDate && !isNaN(targetDate.getTime())) {
    const hoje = new Date(hojeMs);
    hoje.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    return Math.round((targetDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }

  return null;
}

export interface ShelfLifeRiscoItem {
  codigo: number;
  descricao: string;
  diasParaVencer: number;
  quantidadeCx: number;
  valorTotalRS: number;
  validade: string;
  lote: string;
  status: 'Vencido' | 'Critico' | 'Atencao';
}

/**
 * Puxa do Dashboard de Shelf-Life / Validades todos os itens com 45 dias ou menos para vencer e calcula sua valoração financeira (R$).
 */
export function getShelfLifeRisco45Dias(empresaId: string = 'demo'): ShelfLifeRiscoItem[] {
  let validadesData: any[] = [];
  const validadesKeys = [
    `validades_${empresaId}`,
    `armazem_validades_${empresaId}`,
    `custom_validades_${empresaId}`,
    'validades_demo',
    'armazem_validades_demo',
    'validades',
    'armazem_validades',
    `repack_validades_${empresaId}`,
    'repack_validades_demo',
    'repack_validades'
  ];

  // Also dynamically search all keys in localStorage for validades
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('validades') || k.startsWith('armazem_validades') || k.startsWith('custom_validades') || k.startsWith('repack_validades'))) {
          if (!validadesKeys.includes(k)) {
            validadesKeys.push(k);
          }
        }
      }
    }
  } catch (e) {}

  const seenValidadeIds = new Set<string>();
  validadesKeys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const uId = item._docId || item.id || `${item.codigo}_${item.validade}_${item.lote}_${item.localizacao}`;
            if (!seenValidadeIds.has(String(uId))) {
              seenValidadeIds.add(String(uId));
              validadesData.push(item);
            }
          });
        }
      }
    } catch (_) {}
  });

  const hojeDate = new Date();
  hojeDate.setHours(0, 0, 0, 0);
  const hojeMs = hojeDate.getTime();

  const groupedMap = new Map<number, ShelfLifeRiscoItem>();

  validadesData.forEach(v => {
    const cod = Number(v.codigo || v.codProduto || v.cod || v.codSku || v.sku || 0);
    if (cod <= 0 || !isProdutoCadastrado(cod, empresaId)) return;

    const diasRemaining = parseValidadeDiasParaVencer(v, hojeMs);
    // REGRA: Apenas itens com 45 dias ou menos para vencer (diasRemaining <= 45)
    if (diasRemaining !== null && diasRemaining <= 45) {
      const meta = getProductMeta(cod);
      const catalogItem = PRODUCTS.find(prod => Number(prod.codigo) === cod);
      const preco = meta.preco || catalogItem?.preco || 45;
      
      const p = Number(v.palhete || v.pallets || 0);
      const l = Number(v.lastro || 0);
      const c = Number(v.caixa || 0);
      const q = Number(v.quantidade || 0);
      
      const fatorPallet = meta.fatorPallet || 60;
      const lastro = meta.lastro || 12;
      let qtdCx = q > 0 ? q : 0;
      if (qtdCx === 0 && (p > 0 || l > 0 || c > 0)) {
        qtdCx = calcCaixasPackaging(cod, p, l, c) || (p * fatorPallet + l * lastro + c);
      }
      if (qtdCx === 0 && c > 0) qtdCx = c;
      if (qtdCx === 0) qtdCx = 1;

      const valorRS = qtdCx * preco;

      let statusStr: 'Vencido' | 'Critico' | 'Atencao' = 'Atencao';
      if (diasRemaining <= 0) statusStr = 'Vencido';
      else if (diasRemaining <= 15) statusStr = 'Critico';
      else if (diasRemaining <= 45) statusStr = 'Atencao';

      const desc = getProductOfficialDescription(cod, v.descricao || '', empresaId);

      const existing = groupedMap.get(cod);
      if (existing) {
        existing.quantidadeCx += qtdCx;
        existing.valorTotalRS += valorRS;
        if (diasRemaining < existing.diasParaVencer) {
          existing.diasParaVencer = diasRemaining;
          existing.validade = v.validade || existing.validade;
          existing.lote = v.lote || existing.lote;
          existing.status = statusStr;
        }
      } else {
        groupedMap.set(cod, {
          codigo: cod,
          descricao: desc,
          diasParaVencer: diasRemaining,
          quantidadeCx: qtdCx,
          valorTotalRS: valorRS,
          validade: v.validade || '',
          lote: v.lote || '',
          status: statusStr
        });
      }
    }
  });

  return Array.from(groupedMap.values()).sort((a, b) => b.valorTotalRS - a.valorTotalRS);
}

export function calcularMatrizAbcLogistica(empresaId: string = 'demo'): MatrizAbcItem[] {
  const politicaEstoque = calcularPoliticaEstoque();

  // 1. Carregar vendas acumuladas de TODOS OS TRIMESTRES importados na 03.05.19
  const mapVendas030519Acumuladas = new Map<number, {
    volumeTotalTrimestres: number;
    diasUteisTotais: number;
    precoUnitario: number;
    fatorHecto: number;
    trimestresImportados: number;
  }>();

  try {
    const rawTrimestres = localStorage.getItem('af_curva_abc_trimestres_030519_v1');
    if (rawTrimestres) {
      const parsedTrimestres = JSON.parse(rawTrimestres);
      if (parsedTrimestres && typeof parsedTrimestres === 'object') {
        (['Q1', 'Q2', 'Q3', 'Q4'] as const).forEach(qKey => {
          const qStore = parsedTrimestres[qKey];
          if (qStore && qStore.itemsMap && Object.keys(qStore.itemsMap).length > 0) {
            const diasQ = Number(qStore.diasUteis) || 66;
            Object.values(qStore.itemsMap).forEach((item: any) => {
              const cod = Number(item.codigo);
              const vol = Number(item.volumeTotalTrimestre) || 0;
              const preco = Number(item.precoUnitario) || 0;
              const fh = Number(item.fatorHecto) || 0;

              const existing = mapVendas030519Acumuladas.get(cod);
              if (existing) {
                existing.volumeTotalTrimestres += vol;
                existing.diasUteisTotais += diasQ;
                existing.trimestresImportados += 1;
                if (preco > 0) existing.precoUnitario = preco;
                if (fh > 0) existing.fatorHecto = fh;
              } else {
                mapVendas030519Acumuladas.set(cod, {
                  volumeTotalTrimestres: vol,
                  diasUteisTotais: diasQ,
                  precoUnitario: preco,
                  fatorHecto: fh,
                  trimestresImportados: 1
                });
              }
            });
          }
        });
      }
    }
  } catch (e) {
    console.error('Erro ao ler trimestres da 03.05.19:', e);
  }

  // 2. Carregar dados de quebras de todas as fontes disponíveis
  let quebrasData: any[] = [];
  try {
    const rawQuebras = 
      localStorage.getItem(`quebras_${empresaId}`) || 
      localStorage.getItem(`custom_quebras_${empresaId}`) || 
      localStorage.getItem(`local_quebras_${empresaId}`) || 
      localStorage.getItem(`quebras_records_${empresaId}`) || 
      localStorage.getItem(`quebras_demo`);
    
    if (rawQuebras) {
      const parsed = JSON.parse(rawQuebras);
      if (Array.isArray(parsed) && parsed.length > 0) {
        quebrasData = parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler dados de quebras:', e);
  }

  // Se não houver quebras registradas no localStorage, carregar a base oficial do armazém
  if (quebrasData.length === 0) {
    try {
      quebrasData = buildOfficialQuebrasRows(empresaId);
    } catch (e) {
      console.warn('Fallback para quebras padrão falhou:', e);
    }
  }

  // 3. Carregar dados de validades de todas as fontes disponíveis
  let validadesData: any[] = [];
  const validadesKeys = [
    `validades_${empresaId}`,
    `armazem_validades_${empresaId}`,
    `custom_validades_${empresaId}`,
    'validades_demo',
    'armazem_validades_demo',
    'validades',
    'armazem_validades',
    `repack_validades_${empresaId}`,
    'repack_validades_demo',
    'repack_validades'
  ];

  // Dynamically scan any other validades keys in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('validades') || k.startsWith('armazem_validades') || k.startsWith('custom_validades') || k.startsWith('repack_validades'))) {
          if (!validadesKeys.includes(k)) {
            validadesKeys.push(k);
          }
        }
      }
    }
  } catch (e) {}

  const seenValidadeIds = new Set<string>();
  validadesKeys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const uId = item._docId || item.id || `${item.codigo}_${item.validade}_${item.lote}_${item.localizacao}`;
            if (!seenValidadeIds.has(String(uId))) {
              seenValidadeIds.add(String(uId));
              validadesData.push(item);
            }
          });
        }
      }
    } catch (_) {}
  });

  // Mapas auxiliares para quebras
  const mapQuebras = new Map<number, { qtd: number; valor: number }>();
  quebrasData.forEach(q => {
    const cod = Number(q.codProduto || q.codSku || q.codigo || q.sku || q.produtoId || 0);
    if (cod > 0) {
      const current = mapQuebras.get(cod) || { qtd: 0, valor: 0 };
      const qtdAdd = Number(q.quantidade || q.qtd || q.volumeQuebra || q.qtdQuebrada || 1);
      const valorAdd = Number(q.valorTotal || q.valor || q.custoTotal || (qtdAdd * 45));
      mapQuebras.set(cod, {
        qtd: current.qtd + qtdAdd,
        valor: current.valor + (valorAdd > 0 ? valorAdd : qtdAdd * 45)
      });
    }
  });

  // Mapas auxiliares para validades (identifica dias para vencer com precisão cirúrgica)
  const mapValidades = new Map<number, { diasMin: number; status: string; totalQtd: number; hasRealRecord: boolean }>();
  const hojeDate = new Date();
  hojeDate.setHours(0, 0, 0, 0);
  const hojeMs = hojeDate.getTime();

  validadesData.forEach(v => {
    const cod = Number(v.codigo || v.codProduto || v.cod || 0);
    if (cod > 0) {
      const diasRemaining = parseValidadeDiasParaVencer(v, hojeMs);
      if (diasRemaining !== null) {
        const existing = mapValidades.get(cod);
        const currentMin = existing ? Math.min(existing.diasMin, diasRemaining) : diasRemaining;
        const totalQtd = (existing ? existing.totalQtd : 0) + Number(v.quantidade || v.caixa || 0);

        let statusStr = 'Ok';
        if (currentMin <= 0) statusStr = 'Vencido';
        else if (currentMin <= 15) statusStr = 'Critico';
        else if (currentMin <= 45) statusStr = 'Atencao';

        mapValidades.set(cod, { diasMin: currentMin, status: statusStr, totalQtd, hasRealRecord: true });
      }
    }
  });

  // 4. Mapear cada SKU consolidando vendas acumuladas da 03.05.19, estoque, quebras e esforço de movimentação
  const rawList: Omit<
    MatrizAbcItem,
    | 'percentVendaValor'
    | 'percentAcumuladoVendaValor'
    | 'curvaAbcValor'
    | 'percentVendaVolume'
    | 'percentAcumuladoVendaVolume'
    | 'curvaAbcVolume'
    | 'percentEstoqueValor'
    | 'percentAcumuladoEstoqueValor'
    | 'curvaAbcEstoque'
    | 'percentOperacional'
    | 'percentAcumuladoOperacional'
    | 'curvaAbcOperacional'
    | 'criticidade'
    | 'diagnosticoFinal'
  >[] = politicaEstoque
    .filter(p => isProdutoCadastrado(p.codigo, empresaId))
    .map(p => {
    const cod = Number(p.codigo);
    const catalogItem = PRODUCTS.find(prod => Number(prod.codigo) === cod);
    const meta = getProductMeta(cod);

    const fator = catalogItem?.fator || meta.fator || 12;
    const fatorHecto = meta.fatorHecto || catalogItem?.fatorHecto || 0.04;
    const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 
      ? meta.fatorPallet 
      : (meta.caixasPallet && meta.caixasPallet > 0 ? meta.caixasPallet : 50);
    const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / 5));
    const precoUnitario = catalogItem?.preco || meta.preco || p.precoUnitario || 45;

    // Descrição completa e oficial conforme cadastros da plataforma
    const descricaoOficial = getProductOfficialDescription(cod, p.produto || (p as any).descricao || '', empresaId);

    // Vendas: Se houver dados importados na 03.05.19 para este SKU, acumular todos os trimestres
    const v030519 = mapVendas030519Acumuladas.get(cod);

    let vendaDiariaCx = p.vendaMediaDiaria || 0;
    let vendaQtdCx = Math.round(vendaDiariaCx * 30);

    if (v030519 && v030519.diasUteisTotais > 0 && v030519.volumeTotalTrimestres > 0) {
      vendaDiariaCx = v030519.volumeTotalTrimestres / v030519.diasUteisTotais;
      // Venda mensal representativa baseada na média diária acumulada dos trimestres importados
      vendaQtdCx = Math.round(vendaDiariaCx * 30);
    }

    const vendaValorRS = vendaQtdCx * precoUnitario;
    const vendaVolumeHl = Number((vendaQtdCx * fatorHecto).toFixed(2));

    // Estoque
    const estoqueSkuFechado = p.qtdSkuFechado ?? p.estoqueAtualTotal;
    const estoqueUnidadeAvulsa = p.qtdUnidadeAvulsa ?? 0;
    const estoqueAtualCx = p.estoqueAtualTotal;
    const estoqueValorRS = (estoqueSkuFechado * precoUnitario) + (estoqueUnidadeAvulsa * (precoUnitario / (fator || 12)));
    const estoqueMedioCx = Math.round((estoqueAtualCx + (p.estoqueIdeal || estoqueAtualCx)) / 2);

    const giroEstoque = vendaDiariaCx > 0 ? parseFloat(((vendaDiariaCx * 30) / Math.max(1, estoqueAtualCx)).toFixed(2)) : 0;
    const coberturaDias = p.coberturaDias || (vendaDiariaCx > 0 ? parseFloat((estoqueAtualCx / vendaDiariaCx).toFixed(1)) : 0);

    // Operação & Pallets Movimentados no Ressuprimento e Reabastecimento
    const qtdPickingCx = p.estoquePicking || Math.round(estoqueAtualCx * 0.2);
    const freqPicking = Math.max(1, Math.round(vendaDiariaCx * 1.5));
    
    // Pallets de Ressuprimento (Descarga/Transferência de fornecedor para o Pulmão)
    const palletsRessuprimento = Math.max(0, Math.ceil(vendaQtdCx / Math.max(1, fatorPallet)));
    
    // Pallets de Reabastecimento (Movimentação com empilhadeira do Pulmão para a Posição de Picking)
    const capacidadePickingCx = Math.max(1, qtdPickingCx > 0 ? qtdPickingCx : lastro);
    const qtdReabastecimentos = Math.max(0, Math.ceil(vendaQtdCx / capacidadePickingCx));
    const palletsReabastecimento = qtdReabastecimentos;
    const freqReabastecimento = Math.max(0, Math.round(qtdReabastecimentos * 1.2));
    
    const totalPalletsMovimentados = palletsRessuprimento + palletsReabastecimento;
    const scoreImpactoOperacional = totalPalletsMovimentados > 0 
      ? totalPalletsMovimentados 
      : Math.max(1, Math.round(vendaQtdCx / 50));

    // Quebras / Avarias
    const qData = mapQuebras.get(cod) || { qtd: 0, valor: 0 };
    const qtdQuebras = qData.qtd;
    const valorQuebrasRS = qData.valor;
    const percentQuebra = vendaValorRS > 0 ? parseFloat(((valorQuebrasRS / vendaValorRS) * 100).toFixed(2)) : 0;

    // FEFO / Validades & Shelf-Life Risk
    const vData = mapValidades.get(cod);
    const shelfLifeDias = 180;
    const diasParaVencimentoMin = vData ? vData.diasMin : 999;
    const statusFefo: MatrizAbcItem['statusFefo'] = vData ? (vData.status as any) : 'SemRegistro';

    let riscoVencimento: MatrizAbcItem['riscoVencimento'] = 'Baixo';
    if (diasParaVencimentoMin <= 0) riscoVencimento = 'Critico';
    else if (diasParaVencimentoMin <= 15) riscoVencimento = 'Critico';
    else if (diasParaVencimentoMin <= 45) riscoVencimento = 'Alto';
    else if (diasParaVencimentoMin <= 60) riscoVencimento = 'Medio';

    return {
      codigo: cod,
      descricao: descricaoOficial,
      grupo: meta.grupo || p.grupo || 'CERVEJA',
      familia: p.familia || 'CERVEJA',
      marca: p.marca || 'AMBEV',
      embalagem: (fator === 12 ? 'Lata/SH' : 'Garrafa/CX'),
      unidadeVenda: 'CX',
      fator,
      fatorHecto,
      precoUnitario,
      vendaQtdCx,
      vendaValorRS,
      vendaVolumeHl,
      vendaDiariaCx,
      estoqueAtualCx,
      estoqueSkuFechado,
      estoqueUnidadeAvulsa,
      estoqueMedioCx,
      estoqueValorRS,
      giroEstoque,
      coberturaDias,
      qtdPickingCx,
      freqPicking,
      qtdReabastecimentos,
      freqReabastecimento,
      palletsRessuprimento,
      palletsReabastecimento,
      totalPalletsMovimentados,
      scoreImpactoOperacional,
      qtdQuebras,
      valorQuebrasRS,
      percentQuebra,
      shelfLifeDias,
      statusFefo,
      diasParaVencimentoMin,
      riscoVencimento
    };
  });

  // Totais globais para porcentagens acumuladas
  const totalVendaRS = rawList.reduce((acc, curr) => acc + curr.vendaValorRS, 0) || 1;
  const totalVendaVolume = rawList.reduce((acc, curr) => acc + curr.vendaQtdCx, 0) || 1;
  const totalEstoqueRS = rawList.reduce((acc, curr) => acc + curr.estoqueValorRS, 0) || 1;
  const totalOperacional = rawList.reduce((acc, curr) => acc + curr.scoreImpactoOperacional, 0) || 1;

  // Mapas para armazenar as curvas calculadas independentemente
  const mapCurvaValor = new Map<number, { percent: number; acum: number; curva: 'A' | 'B' | 'C' }>();
  const mapCurvaVolume = new Map<number, { percent: number; acum: number; curva: 'A' | 'B' | 'C' }>();
  const mapCurvaEstoque = new Map<number, { percent: number; acum: number; curva: 'A' | 'B' | 'C' }>();
  const mapCurvaOperacional = new Map<number, { percent: number; acum: number; curva: 'A' | 'B' | 'C' }>();

  // 1. Calcular Curva ABC R$
  [...rawList]
    .sort((a, b) => b.vendaValorRS - a.vendaValorRS)
    .reduce((acum, item) => {
      const pct = (item.vendaValorRS / totalVendaRS) * 100;
      const newAcum = acum + pct;
      const curva: 'A' | 'B' | 'C' = newAcum <= 80 ? 'A' : newAcum <= 95 ? 'B' : 'C';
      mapCurvaValor.set(item.codigo, { percent: parseFloat(pct.toFixed(2)), acum: parseFloat(newAcum.toFixed(2)), curva });
      return newAcum;
    }, 0);

  // 2. Calcular Curva ABC Volume
  [...rawList]
    .sort((a, b) => b.vendaQtdCx - a.vendaQtdCx)
    .reduce((acum, item) => {
      const pct = (item.vendaQtdCx / totalVendaVolume) * 100;
      const newAcum = acum + pct;
      const curva: 'A' | 'B' | 'C' = newAcum <= 80 ? 'A' : newAcum <= 95 ? 'B' : 'C';
      mapCurvaVolume.set(item.codigo, { percent: parseFloat(pct.toFixed(2)), acum: parseFloat(newAcum.toFixed(2)), curva });
      return newAcum;
    }, 0);

  // 3. Calcular Curva ABC Estoque
  [...rawList]
    .sort((a, b) => b.estoqueValorRS - a.estoqueValorRS)
    .reduce((acum, item) => {
      const pct = (item.estoqueValorRS / totalEstoqueRS) * 100;
      const newAcum = acum + pct;
      const curva: 'A' | 'B' | 'C' = newAcum <= 80 ? 'A' : newAcum <= 95 ? 'B' : 'C';
      mapCurvaEstoque.set(item.codigo, { percent: parseFloat(pct.toFixed(2)), acum: parseFloat(newAcum.toFixed(2)), curva });
      return newAcum;
    }, 0);

  // 4. Calcular Curva ABC Operacional (Pallets Movimentados)
  [...rawList]
    .sort((a, b) => b.scoreImpactoOperacional - a.scoreImpactoOperacional)
    .reduce((acum, item) => {
      const pct = (item.scoreImpactoOperacional / totalOperacional) * 100;
      const newAcum = acum + pct;
      const curva: 'A' | 'B' | 'C' = newAcum <= 80 ? 'A' : newAcum <= 95 ? 'B' : 'C';
      mapCurvaOperacional.set(item.codigo, { percent: parseFloat(pct.toFixed(2)), acum: parseFloat(newAcum.toFixed(2)), curva });
      return newAcum;
    }, 0);

  // Montar o resultado final com diagnósticos e criticidade
  const resultado = rawList.map(item => {
    const valObj = mapCurvaValor.get(item.codigo) || { percent: 0, acum: 0, curva: 'C' };
    const volObj = mapCurvaVolume.get(item.codigo) || { percent: 0, acum: 0, curva: 'C' };
    const estObj = mapCurvaEstoque.get(item.codigo) || { percent: 0, acum: 0, curva: 'C' };
    const opObj = mapCurvaOperacional.get(item.codigo) || { percent: 0, acum: 0, curva: 'C' };

    const cVal = valObj.curva;
    const cVol = volObj.curva;
    const cEst = estObj.curva;
    const cOp = opObj.curva;

    // Matriz de Criticidade e Diagnóstico Logístico
    let criticidade: MatrizAbcItem['criticidade'] = 'Baixa';
    let diagnosticoFinal = 'Giro e Controle Padrão';

    if (item.coberturaDias === 0 && (cVal === 'A' || cVol === 'A')) {
      criticidade = 'Crítica';
      diagnosticoFinal = 'Ruptura Iminente em Produto Classe A — Reposição Urgente';
    } else if (item.riscoVencimento === 'Critico' || item.riscoVencimento === 'Alto') {
      criticidade = 'Crítica';
      diagnosticoFinal = 'Risco FEFO Crítico / Vencimento Próximo — Ação Promocional ou Despacho Urgente';
    } else if (item.percentQuebra > 0.5 && item.valorQuebrasRS > 200) {
      criticidade = 'Alta';
      diagnosticoFinal = 'Avarias/Quebras Elevadas — Auditar Manuseio e Acondicionamento no Armazém';
    } else if (cVal === 'A' && cVol === 'A' && cEst === 'A' && cOp === 'A') {
      criticidade = 'Crítica';
      diagnosticoFinal = 'Prioridade Máxima — Alto Valor, Volume, Estoque e Impacto Operacional';
    } else if (cVal === 'A' && cVol === 'C' && cEst === 'A') {
      criticidade = 'Alta';
      diagnosticoFinal = 'Alto Valor Financeiro com Baixo Giro — Risco de Capital Imobilizado';
    } else if (cVol === 'A' && cOp === 'A' && cVal !== 'A') {
      criticidade = 'Alta';
      diagnosticoFinal = 'Alto Volume e Frequência no Picking — Exige Posicionamento Estratégico no Layout';
    } else if (cEst === 'A' && cVal === 'C' && cVol === 'C') {
      criticidade = 'Alta';
      diagnosticoFinal = 'Excesso de Capital Parado em Estoque — Avaliar Redução de Pedidos';
    } else if (cVal === 'A' || cEst === 'A') {
      criticidade = 'Média';
      diagnosticoFinal = 'Monitoramento Constante de Nível de Serviço e Cobertura';
    } else {
      criticidade = 'Baixa';
      diagnosticoFinal = 'Controle Operacional Padrão e Reposição Contínua';
    }

    return {
      ...item,
      percentVendaValor: valObj.percent,
      percentAcumuladoVendaValor: valObj.acum,
      curvaAbcValor: cVal,
      percentVendaVolume: volObj.percent,
      percentAcumuladoVendaVolume: volObj.acum,
      curvaAbcVolume: cVol,
      percentEstoqueValor: estObj.percent,
      percentAcumuladoEstoqueValor: estObj.acum,
      curvaAbcEstoque: cEst,
      percentOperacional: opObj.percent,
      percentAcumuladoOperacional: opObj.acum,
      curvaAbcOperacional: cOp,
      criticidade,
      diagnosticoFinal
    };
  });

  // Retornar lista ordenada por maior Faturamento R$ para o menor faturamento
  return resultado.sort((a, b) => b.vendaValorRS - a.vendaValorRS);
}

export function getMatrizAbcKPIs(items: MatrizAbcItem[]): MatrizAbcKPIs {
  const totalSkus = items.length;
  const skusClasseA = items.filter(i => i.curvaAbcValor === 'A').length;
  const skusClasseB = items.filter(i => i.curvaAbcValor === 'B').length;
  const skusClasseC = items.filter(i => i.curvaAbcValor === 'C').length;

  const totalFaturamento = items.reduce((acc, i) => acc + i.vendaValorRS, 0) || 1;
  const faturamentoClasseA = items.filter(i => i.curvaAbcValor === 'A').reduce((acc, i) => acc + i.vendaValorRS, 0);
  const percentFaturamentoClasseA = parseFloat(((faturamentoClasseA / totalFaturamento) * 100).toFixed(1));

  const valorTotalEstoque = items.reduce((acc, i) => acc + i.estoqueValorRS, 0);
  const valorEstoqueClasseA = items.filter(i => i.curvaAbcEstoque === 'A').reduce((acc, i) => acc + i.estoqueValorRS, 0);

  const totalVendaDiaria = items.reduce((acc, i) => acc + i.vendaDiariaCx, 0);
  const totalEstoqueCx = items.reduce((acc, i) => acc + i.estoqueAtualCx, 0);
  const coberturaMediaDias = totalVendaDiaria > 0 ? parseFloat((totalEstoqueCx / totalVendaDiaria).toFixed(1)) : 0;

  const giroMedioEstoque = totalEstoqueCx > 0 ? parseFloat(((totalVendaDiaria * 30) / totalEstoqueCx).toFixed(2)) : 0;

  const totalMovimentacoesOperacionais = items.reduce((acc, i) => acc + i.scoreImpactoOperacional, 0);
  const totalReabastecimentos = items.reduce((acc, i) => acc + i.qtdReabastecimentos, 0);
  const palletsRessuprimentoTotal = items.reduce((acc, i) => acc + i.palletsRessuprimento, 0);
  const palletsReabastecimentoTotal = items.reduce((acc, i) => acc + i.palletsReabastecimento, 0);
  const totalPalletsMovimentados = palletsRessuprimentoTotal + palletsReabastecimentoTotal;

  const valorTotalQuebras = items.reduce((acc, i) => acc + i.valorQuebrasRS, 0);
  const volumeTotalQuebrasCx = items.reduce((acc, i) => acc + i.qtdQuebras, 0);

  // Itens com risco de validade (com menos de 45 dias para vencer)
  const skusRiscoVencimento = items.filter(i => i.diasParaVencimentoMin <= 45 && i.statusFefo !== 'SemRegistro').length;

  return {
    totalSkus,
    skusClasseA,
    skusClasseB,
    skusClasseC,
    percentFaturamentoClasseA,
    valorTotalEstoque,
    valorEstoqueClasseA,
    giroMedioEstoque,
    coberturaMediaDias,
    totalMovimentacoesOperacionais,
    totalReabastecimentos,
    totalPalletsMovimentados,
    palletsRessuprimentoTotal,
    palletsReabastecimentoTotal,
    valorTotalQuebras,
    volumeTotalQuebrasCx,
    skusRiscoVencimento
  };
}
