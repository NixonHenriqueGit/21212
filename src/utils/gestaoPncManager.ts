import rawPncDataset from '../data/gestaoPncOfficialDataset.json';

export interface PncRecord {
  n_bloqueio: string;
  opera_o: string | null;
  m_s: string;
  produto: number | string;
  descri_o: string;
  fab_origem: string;
  nf: number | string;
  nf_saida?: number | string | null;
  data_da_chegada: string;
  data_do_bloqueio: string;
  data_entrada?: string | null;
  data_saida?: string | null;
  motivo: string;
  emissor: string;
  origem_do_bloqueio: string;
  qtde_bloq_cx: number;
  qtde_bloq_hl: number;
  valor: number;
  a_o: string;
  respons_vel: string;
  status: string;
  qtde_retida: number | null;
  qtd_em_plts: number | null;
  qtde_liberada: number | null;
  data_da_libera_o: string | null;
  dias_no_pnc: number;
  observa_o: string | null;
}

export interface PncJsonDataset {
  nome_base: string;
  fonte: string;
  estrutura: {
    total_registros_ativos: number;
    campos: string[];
    campos_de_filtro: string[];
  };
  regras: Record<string, string>;
  opcoes_de_filtro?: Record<string, any[]>;
  registros: PncRecord[];
}

export interface PncFilters {
  meses: string[];
  produtos: (string | number)[];
  descricoes: string[];
  fabOrigens: string[];
  motivos: string[];
  origensBloqueio: string[];
  responsaveis: string[];
  statusList: string[];
  acoes: string[];
  dataBloqueio: string;
  dataInicio: string;
  dataFim: string;
  searchTerm: string;
}

export interface PncKpis {
  totalBloqueios: number;
  totalBloqCx: number;
  totalBloqHl: number;
  valorTotal: number;
  totalRetida: number;
  totalLiberada: number;
  totalPallets: number;
  // Métricas de Itens / Chamados (Substituição e enriquecimento de Pallets por Itens)
  totalItens: number;
  itensDevolvidos: number;
  itensEmTratativa: number;
  itensNaoDevolvidos: number;
  percentualItensDevolvidos: number;
  totalChamados: number;
  chamadosDevolvidos: number;
  chamadosEmTratativa: number;
  chamadosNaoDevolvidos: number;
  percentualChamadosDevolvidos: number;
  // Alertas de >30 dias para Despejo
  itensAcima30Dias: PncRecord[];
  qtdAcima30Dias: number;
  
  mediaDiasPnc: number;
  // Métricas sênior de devolução e amortização financeira
  valorAmortizadoDevolucao: number;
  percentualValorAmortizado: number;
  palletsDevolvidos: number;
  palletsRetidos: number;
  percentualPalletsDevolvidos: number;
  caixasDevolvidas: number;
  caixasRetidas: number;
  percentualCaixasDevolvidas: number;
  fornecedorMaiorValor: { nome: string; valor: number; percentual: number };
  fornecedorMaiorVolume: { nome: string; caixas: number; hl: number; percentual: number };
  motivoMaiorImpacto: { motivo: string; caixas: number; valor: number; percentual: number };
}

export interface SupplierMetric {
  nome: string;
  totalBloqueios: number;
  totalBloqCx: number;
  totalBloqHl: number;
  valorTotal: number;
  valorAmortizado: number;
  pctValorAmortizado: number;
  palletsBloqueados: number;
  palletsDevolvidos: number;
  pctPalletsDevolvidos: number;
  caixasDevolvidas: number;
  caixasRetidas: number;
  pctCaixasDevolvidas: number;
  motivos: Record<string, number>;
  principalMotivo: string;
  mediaDiasPnc: number;
  statusMap: Record<string, number>;
}

export interface MotivoMetric {
  motivo: string;
  totalBloqueios: number;
  totalBloqCx: number;
  totalBloqHl: number;
  valorTotal: number;
  valorAmortizado: number;
  pallets: number;
  principalFornecedor: string;
}

export interface OrigemBloqueioMetric {
  origem: string;
  totalBloqueios: number;
  totalBloqCx: number;
  totalBloqHl: number;
  valorTotal: number;
}

export interface PncSeniorAnalytics {
  suppliers: SupplierMetric[];
  motivos: MotivoMetric[];
  origensBloqueio: OrigemBloqueioMetric[];
  devolucaoResumo: {
    palletsBloqueados: number;
    palletsDevolvidos: number;
    pctPalletsDevolvidos: number;
    caixasBloqueadas: number;
    caixasDevolvidas: number;
    caixasRetidas: number;
    pctCaixasDevolvidas: number;
    hlBloqueado: number;
    hlDevolvido: number;
    hlRetido: number;
    pctHlDevolvido: number;
    valorTotalBloqueado: number;
    valorAmortizado: number;
    valorNaoAmortizado: number;
    pctValorAmortizado: number;
  };
  insights: {
    tipo: 'alerta' | 'sucesso' | 'estrategico' | 'operacional';
    titulo: string;
    descricao: string;
    impacto: string;
    recomendacao: string;
  }[];
}

const STORAGE_KEY_PREFIX = 'ambev_gestao_pnc_records_v1_';

/**
 * Retorna a data de referência padrão do sistema (Ambiente 2026-08-28 ou hoje)
 */
export function getSystemReferenceDate(): Date {
  // 2026-08-28T18:19:53
  const now = new Date();
  return now;
}

/**
 * Converte string de data para objeto Date sem fuso horário
 */
export function parseDateOnly(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim().split('T')[0];
  if (!clean) return null;

  // Formato ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // Formato BR: DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split('/').map(Number);
    return new Date(y, m - 1, d);
  }

  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Calcula a diferença em dias entre duas datas
 * Regra 7:
 * - Se houver data de liberação: diferença entre liberação e bloqueio.
 * - Se não houver data de liberação: diferença entre data atual e data do bloqueio.
 */
export function calculateDiasNoPnc(
  dataDoBloqueio?: string | null,
  dataDaLiberacao?: string | null,
  refDate: Date = getSystemReferenceDate()
): number {
  if (!dataDoBloqueio) return 0;
  const dtBloqueio = parseDateOnly(dataDoBloqueio);
  if (!dtBloqueio) return 0;

  if (dataDaLiberacao && dataDaLiberacao.trim() !== '') {
    const dtLiberacao = parseDateOnly(dataDaLiberacao);
    if (dtLiberacao) {
      const diffMs = dtLiberacao.getTime() - dtBloqueio.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
  }

  // Sem liberação: diferença entre data atual e bloqueio
  const refMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const diffMs = refMidnight.getTime() - dtBloqueio.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Normaliza e recalcula dinamicamente os registros
 */
export function normalizePncRecord(raw: any, refDate: Date = getSystemReferenceDate()): PncRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  // Regra: Somente registros com produto preenchido
  const produtoVal = raw.produto !== undefined && raw.produto !== null ? raw.produto : raw.Produto;
  if (produtoVal === undefined || produtoVal === null || String(produtoVal).trim() === '') {
    return null;
  }

  const n_bloqueio = String(raw.n_bloqueio || raw.numero_bloqueio || raw.nBloqueio || raw['n_bloqueio'] || `BLQ-${produtoVal}-${Date.now()}`).trim();
  const opera_o = raw.opera_o !== undefined ? raw.opera_o : (raw.operacao || raw.Operacao || 'GUARABIRA');
  const m_s = String(raw.m_s || raw.mes || raw.Mes || raw.Mês || '').trim().toUpperCase();
  const produto = isNaN(Number(produtoVal)) ? String(produtoVal).trim() : Number(produtoVal);
  const descri_o = String(raw.descri_o || raw.descricao || raw.Descricao || raw['descri_o'] || '').trim();
  const fab_origem = String(raw.fab_origem || raw.fabrica_origem || raw.fabOrigem || raw['fab_origem'] || '').trim();
  const nf = raw.nf !== undefined && raw.nf !== null ? raw.nf : (raw.nf_fabric || raw.nfFabric || raw.nf_origem || raw.nfEntrada || '');
  const nf_saida = raw.nf_saida !== undefined && raw.nf_saida !== null ? raw.nf_saida : (raw.nfSaida !== undefined ? raw.nfSaida : (raw.nf_devolucao || raw.nfDevolucao || null));
  const data_da_chegada = String(raw.data_da_chegada || raw.dataChegada || '').trim();
  const data_do_bloqueio = String(raw.data_do_bloqueio || raw.dataBloqueio || '').trim();
  const motivo = String(raw.motivo || raw.Motivo || '').trim();
  const emissor = String(raw.emissor || raw.Emissor || '').trim();
  const origem_do_bloqueio = String(raw.origem_do_bloqueio || raw.origemBloqueio || '').trim();
  
  const raw_bloq_cx = typeof raw.qtde_bloq_cx === 'number' ? raw.qtde_bloq_cx : parseFloat(String(raw.qtde_bloq_cx || 0).replace(',', '.')) || 0;
  const qtde_bloq_cx = Math.round(raw_bloq_cx);
  const raw_bloq_hl = typeof raw.qtde_bloq_hl === 'number' ? raw.qtde_bloq_hl : parseFloat(String(raw.qtde_bloq_hl || 0).replace(',', '.')) || 0;
  const qtde_bloq_hl = Number(raw_bloq_hl.toFixed(2));
  const raw_valor = typeof raw.valor === 'number' ? raw.valor : parseFloat(String(raw.valor || 0).replace(',', '.')) || 0;
  const valor = Number(raw_valor.toFixed(2));

  const a_o = String(raw.a_o || raw.acao || raw.Acao || '').trim();
  const respons_vel = String(raw.respons_vel || raw.responsavel || raw.Responsavel || '').trim();
  const status = String(raw.status || raw.Status || 'BLOQUEADO').trim();

  const qtde_retida = raw.qtde_retida !== undefined && raw.qtde_retida !== null && raw.qtde_retida !== ''
    ? (typeof raw.qtde_retida === 'number' ? raw.qtde_retida : parseFloat(String(raw.qtde_retida).replace(',', '.')) || 0)
    : null;

  const qtd_em_plts = raw.qtd_em_plts !== undefined && raw.qtd_em_plts !== null && raw.qtd_em_plts !== ''
    ? (typeof raw.qtd_em_plts === 'number' ? raw.qtd_em_plts : parseFloat(String(raw.qtd_em_plts).replace(',', '.')) || 0)
    : null;

  const qtde_liberada = raw.qtde_liberada !== undefined && raw.qtde_liberada !== null && raw.qtde_liberada !== ''
    ? (typeof raw.qtde_liberada === 'number' ? raw.qtde_liberada : parseFloat(String(raw.qtde_liberada).replace(',', '.')) || 0)
    : null;

  const data_da_libera_o = raw.data_da_libera_o !== undefined && raw.data_da_libera_o !== null && String(raw.data_da_libera_o).trim() !== ''
    ? String(raw.data_da_libera_o).trim()
    : null;

  // Cálculo dinâmico de dias no PNC
  const dias_no_pnc = calculateDiasNoPnc(data_do_bloqueio, data_da_libera_o, refDate);
  const observa_o = raw.observa_o !== undefined && raw.observa_o !== null ? String(raw.observa_o).trim() : null;

  return {
    n_bloqueio,
    opera_o: opera_o ? String(opera_o).trim() : null,
    m_s,
    produto,
    descri_o,
    fab_origem,
    nf,
    nf_saida: nf_saida ? String(nf_saida).trim() : null,
    data_da_chegada,
    data_do_bloqueio,
    motivo,
    emissor,
    origem_do_bloqueio,
    qtde_bloq_cx,
    qtde_bloq_hl,
    valor,
    a_o,
    respons_vel,
    status,
    qtde_retida,
    qtd_em_plts,
    qtde_liberada,
    data_da_libera_o,
    dias_no_pnc,
    observa_o
  };
}

/**
 * Converte lista bruta em lista normalizada de PncRecord
 */
export function normalizePncRecordsList(rawList: any[], refDate?: Date): PncRecord[] {
  if (!Array.isArray(rawList)) return [];
  const result: PncRecord[] = [];
  for (const item of rawList) {
    const norm = normalizePncRecord(item, refDate);
    if (norm) {
      result.push(norm);
    }
  }
  return result;
}

/**
 * Retorna os registros padrão do arquivo JSON
 */
export function getOfficialPncRecords(): PncRecord[] {
  const records = (rawPncDataset as any)?.registros || [];
  return normalizePncRecordsList(records);
}

/**
 * Lê os registros de PNC armazenados no LocalStorage ou retorna a base oficial do JSON
 */
export function getStoredPncRecords(empresaId = 'demo'): PncRecord[] {
  const officialList = getOfficialPncRecords();
  const officialMap = new Map(officialList.map(o => [o.n_bloqueio, o]));

  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + empresaId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = normalizePncRecordsList(parsed);
        // Sincronizar e mesclar automaticamente NF de saída oficial caso o item armazenado esteja nulo
        const merged = normalized.map(rec => {
          const off = officialMap.get(rec.n_bloqueio);
          if (off && (rec.nf_saida === null || rec.nf_saida === undefined || rec.nf_saida === '') && off.nf_saida) {
            return { ...rec, nf_saida: off.nf_saida };
          }
          return rec;
        });
        return merged;
      }
    }
  } catch (e) {
    console.error('Erro ao ler registros PNC do storage:', e);
  }
  return officialList;
}

/**
 * Salva os registros no LocalStorage
 */
export function savePncRecords(records: PncRecord[], empresaId = 'demo'): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + empresaId, JSON.stringify(records));
  } catch (e) {
    console.error('Erro ao salvar registros PNC:', e);
  }
}

/**
 * Atualiza um registro específico de PNC (incluindo NF de Saída ou NF de Entrada)
 */
export function updatePncRecord(updatedRecord: PncRecord, empresaId = 'demo'): PncRecord[] {
  const current = getStoredPncRecords(empresaId);
  const index = current.findIndex(r => r.n_bloqueio === updatedRecord.n_bloqueio);
  let updatedList: PncRecord[];

  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...updatedList[index], ...updatedRecord };
  } else {
    updatedList = [updatedRecord, ...current];
  }

  savePncRecords(updatedList, empresaId);
  try {
    window.dispatchEvent(new CustomEvent('pnc-records-updated', { detail: { records: updatedList } }));
  } catch (e) {
    // ignore
  }
  return updatedList;
}

/**
 * Atualiza apenas as notas fiscais (Entrada e/ou Saída) de um bloqueio
 */
export function updatePncRecordNf(
  n_bloqueio: string,
  nf_saida?: string | number | null,
  nf_entrada?: string | number | null,
  empresaId = 'demo'
): PncRecord[] {
  const current = getStoredPncRecords(empresaId);
  const updatedList = current.map(r => {
    if (r.n_bloqueio === n_bloqueio) {
      return {
        ...r,
        ...(nf_saida !== undefined ? { nf_saida: nf_saida ? String(nf_saida).trim() : null } : {}),
        ...(nf_entrada !== undefined && nf_entrada !== null ? { nf: String(nf_entrada).trim() } : {})
      };
    }
    return r;
  });

  savePncRecords(updatedList, empresaId);
  try {
    window.dispatchEvent(new CustomEvent('pnc-records-updated', { detail: { records: updatedList } }));
  } catch (e) {
    // ignore
  }
  return updatedList;
}

/**
 * Exclui um registro de PNC pelo seu número de bloqueio (n_bloqueio)
 */
export function deletePncRecord(n_bloqueio: string, empresaId = 'demo'): PncRecord[] {
  const current = getStoredPncRecords(empresaId);
  const updatedList = current.filter(r => String(r.n_bloqueio).trim() !== String(n_bloqueio).trim());
  
  savePncRecords(updatedList, empresaId);
  try {
    window.dispatchEvent(new CustomEvent('pnc-records-updated', { detail: { records: updatedList } }));
  } catch (e) {
    // ignore
  }
  return updatedList;
}

/**
 * Exclui múltiplos registros de PNC em lote pelos seus números de bloqueio
 */
export function deletePncRecordsBulk(n_bloqueios: string[], empresaId = 'demo'): PncRecord[] {
  const current = getStoredPncRecords(empresaId);
  const removeSet = new Set(n_bloqueios.map(n => String(n).trim()));
  const updatedList = current.filter(r => !removeSet.has(String(r.n_bloqueio).trim()));

  savePncRecords(updatedList, empresaId);
  try {
    window.dispatchEvent(new CustomEvent('pnc-records-updated', { detail: { records: updatedList } }));
  } catch (e) {
    // ignore
  }
  return updatedList;
}

/**
 * Reseta os dados para o JSON oficial original
 */
export function resetPncToOfficial(empresaId = 'demo'): PncRecord[] {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + empresaId);
  } catch (e) {
    console.error(e);
  }
  return getOfficialPncRecords();
}

/**
 * Importa e valida um arquivo JSON completo ou lista de registros
 */
export function importPncJson(
  input: string | object,
  empresaId = 'demo'
): { success: boolean; records: PncRecord[]; error?: string; count: number } {
  try {
    let parsed: any = typeof input === 'string' ? JSON.parse(input) : input;
    let list: any[] = [];

    if (Array.isArray(parsed)) {
      list = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.registros)) {
        list = parsed.registros;
      } else if (Array.isArray(parsed.data)) {
        list = parsed.data;
      } else if (Array.isArray(parsed.items)) {
        list = parsed.items;
      } else {
        list = [parsed];
      }
    } else {
      return { success: false, records: [], error: 'Estrutura JSON inválida. O arquivo deve conter uma lista ou objeto com "registros".', count: 0 };
    }

    const normalized = normalizePncRecordsList(list);
    if (normalized.length === 0) {
      return {
        success: false,
        records: [],
        error: 'Nenhum registro válido com campo "produto" preenchido foi encontrado.',
        count: 0
      };
    }

    savePncRecords(normalized, empresaId);
    return {
      success: true,
      records: normalized,
      count: normalized.length
    };
  } catch (e: any) {
    return {
      success: false,
      records: [],
      error: `Erro ao processar arquivo JSON: ${e.message}`,
      count: 0
    };
  }
}

/**
 * Identifica se um registro de PNC foi classificado ou processado como Devolução à Origem (Fábrica/Fornecedor) ou finalizado
 */
export function isPncRecordDevolvido(r: PncRecord): boolean {
  if (!r) return false;
  const st = String(r.status || '').toUpperCase().trim();
  const ac = String(r.a_o || '').toUpperCase().trim();
  return (
    st.includes('DEVOLUÇÃO') ||
    st.includes('DEVOLVIDO') ||
    st.includes('LIBERADO') ||
    st.includes('DESPEJO') ||
    (ac.includes('DEVOLUÇÃO ORIGEM') && st !== 'BLOQUEADO')
  );
}

/**
 * Identifica se o item de PNC ultrapassou o limite operacional de 30 dias e deve ser emitido alerta para Despejo
 */
export function isPncAcima30Dias(r: PncRecord): boolean {
  if (!r) return false;
  const dias = Number(r.dias_no_pnc) || 0;
  const st = String(r.status || '').toUpperCase().trim();
  const isFinalizado = st.includes('DEVOLVIDO') || st.includes('LIBERADO') || st.includes('DESPEJO');
  return dias >= 30 && !isFinalizado;
}

/**
 * Calcula dias no PNC com base na Data de Entrada e Data de Saída (ou hoje se ainda pendente)
 */
export function calculateDiasPnc(dataEntrada?: string | null, dataSaida?: string | null, fallbackDias = 0): number {
  if (!dataEntrada) return fallbackDias;
  try {
    const dEntrada = new Date(dataEntrada);
    if (isNaN(dEntrada.getTime())) return fallbackDias;
    dEntrada.setHours(0, 0, 0, 0);
    const dFim = dataSaida ? new Date(dataSaida) : new Date();
    if (isNaN(dFim.getTime())) return fallbackDias;
    dFim.setHours(0, 0, 0, 0);
    const diffMs = dFim.getTime() - dEntrada.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return fallbackDias;
  }
}

/**
 * Calcula os 8 KPIs oficiais e as métricas sênior de devolução, itens/chamados e alertas de 30 dias para despejo
 */
export function calculatePncKpis(records: PncRecord[]): PncKpis {
  let totalBloqCx = 0;
  let totalBloqHl = 0;
  let valorTotal = 0;
  let totalRetida = 0;
  let totalLiberada = 0;
  let totalPallets = 0;
  let totalItens = 0;
  let itensDevolvidos = 0;
  let chamadosDevolvidos = 0;
  let somaDiasPnc = 0;

  let valorAmortizadoDevolucao = 0;
  let palletsDevolvidos = 0;
  let caixasDevolvidas = 0;

  const itensAcima30Dias: PncRecord[] = [];
  const supplierValueMap: Record<string, number> = {};
  const supplierVolumeMap: Record<string, { caixas: number; hl: number }> = {};
  const motivoValueMap: Record<string, { caixas: number; valor: number }> = {};

  for (const r of records) {
    const cx = r.qtde_bloq_cx || 0;
    const hl = r.qtde_bloq_hl || 0;
    const val = r.valor || 0;
    const plts = r.qtd_em_plts || 0;
    const itemQty = Number(r.qtd_em_plts) > 0 ? Number(r.qtd_em_plts) : 1;

    totalBloqCx += cx;
    totalBloqHl += hl;
    valorTotal += val;
    totalItens += itemQty;

    if (r.qtde_retida !== null && r.qtde_retida !== undefined) {
      totalRetida += r.qtde_retida;
    }
    if (r.qtde_liberada !== null && r.qtde_liberada !== undefined) {
      totalLiberada += r.qtde_liberada;
    }
    if (r.qtd_em_plts !== null && r.qtd_em_plts !== undefined) {
      totalPallets += plts;
    }
    somaDiasPnc += r.dias_no_pnc || 0;

    const isDev = isPncRecordDevolvido(r);

    // Devoluções & Amortização Financeira / Itens Realizados
    if (isDev) {
      valorAmortizadoDevolucao += val;
      palletsDevolvidos += plts;
      caixasDevolvidas += cx;
      itensDevolvidos += itemQty;
      chamadosDevolvidos += 1;
    }

    // Alerta de permanência > 30 dias no PNC para encaminhamento de Despejo
    if (isPncAcima30Dias(r)) {
      itensAcima30Dias.push(r);
    }

    // Agrupamentos rápidos para identificar maior impacto
    const fab = r.fab_origem || 'SEM ORIGEM';
    supplierValueMap[fab] = (supplierValueMap[fab] || 0) + val;
    if (!supplierVolumeMap[fab]) supplierVolumeMap[fab] = { caixas: 0, hl: 0 };
    supplierVolumeMap[fab].caixas += cx;
    supplierVolumeMap[fab].hl += hl;

    const mot = r.motivo || 'OUTROS';
    if (!motivoValueMap[mot]) motivoValueMap[mot] = { caixas: 0, valor: 0 };
    motivoValueMap[mot].caixas += cx;
    motivoValueMap[mot].valor += val;
  }

  const totalBloqueios = records.length;
  const totalChamados = records.length;
  const mediaDiasPnc = totalBloqueios > 0 ? somaDiasPnc / totalBloqueios : 0;

  const percentualValorAmortizado = valorTotal > 0 ? (valorAmortizadoDevolucao / valorTotal) * 100 : 0;
  const palletsRetidos = Math.max(0, totalPallets - palletsDevolvidos);
  const percentualPalletsDevolvidos = totalPallets > 0 ? (palletsDevolvidos / totalPallets) * 100 : 0;
  
  const itensEmTratativa = Math.max(0, totalItens - itensDevolvidos);
  const itensNaoDevolvidos = itensEmTratativa;
  const percentualItensDevolvidos = totalItens > 0 ? (itensDevolvidos / totalItens) * 100 : 0;

  const chamadosEmTratativa = Math.max(0, totalChamados - chamadosDevolvidos);
  const chamadosNaoDevolvidos = chamadosEmTratativa;
  const percentualChamadosDevolvidos = totalChamados > 0 ? (chamadosDevolvidos / totalChamados) * 100 : 0;

  const caixasRetidas = Math.max(0, totalBloqCx - caixasDevolvidas);
  const percentualCaixasDevolvidas = totalBloqCx > 0 ? (caixasDevolvidas / totalBloqCx) * 100 : 0;

  // Maior fornecedor em valor
  let topSupplierVal = { nome: 'N/A', valor: 0, percentual: 0 };
  Object.entries(supplierValueMap).forEach(([nome, v]) => {
    if (v > topSupplierVal.valor) {
      topSupplierVal = {
        nome,
        valor: Math.round(v * 100) / 100,
        percentual: valorTotal > 0 ? Math.round((v / valorTotal) * 1000) / 10 : 0
      };
    }
  });

  // Maior fornecedor em volume
  let topSupplierVol = { nome: 'N/A', caixas: 0, hl: 0, percentual: 0 };
  Object.entries(supplierVolumeMap).forEach(([nome, vol]) => {
    if (vol.caixas > topSupplierVol.caixas) {
      topSupplierVol = {
        nome,
        caixas: vol.caixas,
        hl: Math.round(vol.hl * 100) / 100,
        percentual: totalBloqCx > 0 ? Math.round((vol.caixas / totalBloqCx) * 1000) / 10 : 0
      };
    }
  });

  // Motivo de maior impacto
  let topMotivo = { motivo: 'N/A', caixas: 0, valor: 0, percentual: 0 };
  Object.entries(motivoValueMap).forEach(([motivo, data]) => {
    if (data.caixas > topMotivo.caixas) {
      topMotivo = {
        motivo,
        caixas: data.caixas,
        valor: Math.round(data.valor * 100) / 100,
        percentual: totalBloqCx > 0 ? Math.round((data.caixas / totalBloqCx) * 1000) / 10 : 0
      };
    }
  });

  return {
    totalBloqueios,
    totalBloqCx: Math.round(totalBloqCx * 100) / 100,
    totalBloqHl: Math.round(totalBloqHl * 100) / 100,
    valorTotal: Math.round(valorTotal * 100) / 100,
    totalRetida: Math.round(totalRetida * 100) / 100,
    totalLiberada: Math.round(totalLiberada * 100) / 100,
    totalPallets: Math.round(totalPallets * 100) / 100,
    totalItens,
    itensDevolvidos,
    itensEmTratativa,
    itensNaoDevolvidos,
    percentualItensDevolvidos: Math.round(percentualItensDevolvidos * 10) / 10,
    totalChamados,
    chamadosDevolvidos,
    chamadosEmTratativa,
    chamadosNaoDevolvidos,
    percentualChamadosDevolvidos: Math.round(percentualChamadosDevolvidos * 10) / 10,
    itensAcima30Dias,
    qtdAcima30Dias: itensAcima30Dias.length,
    mediaDiasPnc: Math.round(mediaDiasPnc * 10) / 10,
    valorAmortizadoDevolucao: Math.round(valorAmortizadoDevolucao * 100) / 100,
    percentualValorAmortizado: Math.round(percentualValorAmortizado * 10) / 10,
    palletsDevolvidos: Math.round(palletsDevolvidos * 100) / 100,
    palletsRetidos: Math.round(palletsRetidos * 100) / 100,
    percentualPalletsDevolvidos: Math.round(percentualPalletsDevolvidos * 10) / 10,
    caixasDevolvidas: Math.round(caixasDevolvidas * 100) / 100,
    caixasRetidas: Math.round(caixasRetidas * 100) / 100,
    percentualCaixasDevolvidas: Math.round(percentualCaixasDevolvidas * 10) / 10,
    fornecedorMaiorValor: topSupplierVal,
    fornecedorMaiorVolume: topSupplierVol,
    motivoMaiorImpacto: topMotivo
  };
}

/**
 * Cria e insere um novo item/chamado de PNC no acompanhamento oficial
 */
export function createPncRecord(
  recordData: Partial<PncRecord>,
  empresaId = 'demo'
): { success: boolean; records: PncRecord[]; error?: string; createdRecord?: PncRecord } {
  try {
    const currentRecords = getStoredPncRecords(empresaId);
    const todayStr = new Date().toISOString().substring(0, 10);
    const dataEntrada = recordData.data_do_bloqueio || recordData.data_da_chegada || todayStr;
    const dataSaida = recordData.data_da_libera_o || null;
    const diasCalculados = calculateDiasPnc(dataEntrada, dataSaida, recordData.dias_no_pnc || 0);

    const generatedBloqueio = recordData.n_bloqueio?.trim() || `PNC-${Date.now().toString().slice(-6)}`;
    
    // Obter mês por extenso ou abreviado
    const monthNames = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    let mes = recordData.m_s;
    if (!mes && dataEntrada) {
      const d = new Date(dataEntrada);
      if (!isNaN(d.getTime())) {
        mes = monthNames[d.getMonth()];
      }
    }

    const newRecord: PncRecord = {
      n_bloqueio: generatedBloqueio,
      opera_o: recordData.opera_o || 'GUARABIRA',
      m_s: mes || 'AGOSTO',
      produto: recordData.produto ? String(recordData.produto) : '0000',
      descri_o: recordData.descri_o?.trim() || 'PRODUTO NÃO ESPECIFICADO',
      fab_origem: recordData.fab_origem?.trim() || 'CDD GUARABIRA',
      nf: recordData.nf || '',
      nf_saida: recordData.nf_saida || null,
      data_da_chegada: recordData.data_da_chegada || dataEntrada,
      data_do_bloqueio: dataEntrada,
      motivo: recordData.motivo?.trim() || 'AVARIA / NÃO CONFORMIDADE',
      emissor: recordData.emissor?.trim() || 'EQUIPE QUALIDADE',
      origem_do_bloqueio: recordData.origem_do_bloqueio?.trim() || 'RONDA DA QUALIDADE',
      qtde_bloq_cx: Number(recordData.qtde_bloq_cx) || 0,
      qtde_bloq_hl: Number(recordData.qtde_bloq_hl) || 0,
      valor: Number(recordData.valor) || 0,
      a_o: recordData.a_o?.trim() || 'Em Tratativa de Qualidade',
      respons_vel: recordData.respons_vel?.trim() || 'QUALIDADE CDD',
      status: recordData.status?.trim() || 'BLOQUEADO',
      qtde_retida: recordData.qtde_retida !== undefined ? recordData.qtde_retida : Number(recordData.qtde_bloq_cx) || 0,
      qtd_em_plts: Number(recordData.qtd_em_plts) || 1,
      qtde_liberada: Number(recordData.qtde_liberada) || 0,
      data_da_libera_o: dataSaida,
      dias_no_pnc: diasCalculados,
      observa_o: recordData.observa_o || null
    };

    // Prevenir duplicação de nº de bloqueio
    const existingIndex = currentRecords.findIndex(r => r.n_bloqueio.trim() === newRecord.n_bloqueio.trim());
    let updatedList: PncRecord[];
    if (existingIndex >= 0) {
      updatedList = currentRecords.map((r, i) => i === existingIndex ? newRecord : r);
    } else {
      updatedList = [newRecord, ...currentRecords];
    }

    savePncRecords(updatedList, empresaId);
    return { success: true, records: updatedList, createdRecord: newRecord };
  } catch (e: any) {
    return { success: false, records: getStoredPncRecords(empresaId), error: e.message };
  }
}

/**
 * Atualiza um registro de PNC existente com suporte completo a datas de entrada/saída, tratativa e status
 */
export function updatePncRecordFull(
  target: PncRecord | string,
  patchOrEmpresaId?: Partial<PncRecord> | string,
  empresaIdArg = 'demo'
): { success: boolean; records: PncRecord[]; error?: string } {
  try {
    let n_bloqueio = '';
    let patch: Partial<PncRecord> = {};
    let empresaId = empresaIdArg;

    if (typeof target === 'string') {
      n_bloqueio = target.trim();
      patch = (typeof patchOrEmpresaId === 'object' ? patchOrEmpresaId : {}) as Partial<PncRecord>;
    } else {
      n_bloqueio = target.n_bloqueio.trim();
      patch = target;
      if (typeof patchOrEmpresaId === 'string') {
        empresaId = patchOrEmpresaId;
      }
    }

    const currentRecords = getStoredPncRecords(empresaId);
    const existing = currentRecords.find(r => r.n_bloqueio.trim() === n_bloqueio);
    if (!existing) {
      return { success: false, records: currentRecords, error: 'Registro não encontrado' };
    }

    const merged: PncRecord = {
      ...existing,
      ...patch
    };

    const dataEntrada = merged.data_do_bloqueio || merged.data_da_chegada || merged.data_entrada;
    const dataSaida = merged.data_da_libera_o || merged.data_saida;
    const diasCalculados = calculateDiasPnc(dataEntrada, dataSaida, merged.dias_no_pnc || 0);

    const recordToSave: PncRecord = {
      ...merged,
      data_entrada: dataEntrada,
      data_saida: dataSaida,
      dias_no_pnc: diasCalculados
    };

    const updatedList = currentRecords.map(r =>
      r.n_bloqueio.trim() === n_bloqueio ? recordToSave : r
    );

    savePncRecords(updatedList, empresaId);
    try {
      window.dispatchEvent(new CustomEvent('pnc-records-updated', { detail: { records: updatedList } }));
    } catch (e) {
      // ignore
    }
    return { success: true, records: updatedList };
  } catch (e: any) {
    return { success: false, records: getStoredPncRecords(empresaIdArg), error: e.message };
  }
}

/**
 * Encaminha um item com mais de 30 dias no PNC diretamente para o processo de Despejo
 */
export function encaminharParaDespejo(
  n_bloqueio: string,
  empresaId = 'demo',
  motivoDespejo = 'Item com mais de 30 dias de permanência no PNC encaminhado para Despejo conforme diretriz DPO'
): { success: boolean; records: PncRecord[]; error?: string } {
  try {
    const currentRecords = getStoredPncRecords(empresaId);
    const todayStr = new Date().toISOString().substring(0, 10);

    const updatedList = currentRecords.map(r => {
      if (r.n_bloqueio.trim() === n_bloqueio.trim()) {
        const obsAtual = r.observa_o ? `${r.observa_o} | ` : '';
        return {
          ...r,
          status: 'ENCAMINHADO PARA DESPEJO',
          a_o: 'Encaminhado para Despejo / Descarte',
          data_da_libera_o: todayStr,
          observa_o: `${obsAtual}[ALERTA >30D DESPEJO] ${motivoDespejo} em ${todayStr}`
        };
      }
      return r;
    });

    savePncRecords(updatedList, empresaId);
    return { success: true, records: updatedList };
  } catch (e: any) {
    return { success: false, records: getStoredPncRecords(empresaId), error: e.message };
  }
}

export interface EncaminharItemPncParams {
  codigo: string | number;
  descricao: string;
  lote?: string;
  validade?: string;
  quantidade?: number;
  qtde_bloq_cx?: number;
  qtde_bloq_hl?: number;
  valor?: number;
  motivo?: string;
  fab_origem?: string;
  nf?: string | number;
  nf_saida?: string | number | null;
  localizacaoAnterior?: string;
  blocoAnterior?: string;
  data_entrada?: string;
  data_saida?: string | null;
  responsavel?: string;
  empresaId?: string;
  observacao?: string;
}

/**
 * Rotina para encaminhar e inserir um item no PNC (vindo da Guia de Validades ou Gestão de Escoamento)
 */
export function encaminharItemParaPnc(
  params: EncaminharItemPncParams,
  empresaId = 'demo'
): { success: boolean; records: PncRecord[]; createdRecord?: PncRecord; error?: string } {
  const companyId = params.empresaId || empresaId;
  const todayStr = new Date().toISOString().substring(0, 10);
  const dataEntrada = params.data_entrada || todayStr;
  const caixas = Number(params.qtde_bloq_cx || params.quantidade || 1);
  const hl = Number(params.qtde_bloq_hl || (caixas * 0.042));
  const valor = Number(params.valor || (caixas * 38.5));
  const n_bloqueio = `BLQ-${params.codigo}-${Date.now().toString().slice(-5)}`;

  const created = createPncRecord({
    n_bloqueio,
    opera_o: 'GUARABIRA',
    produto: params.codigo,
    descri_o: params.descricao,
    fab_origem: params.fab_origem || 'CDD GUARABIRA',
    nf: params.nf || '',
    nf_saida: params.nf_saida || null,
    data_da_chegada: dataEntrada,
    data_do_bloqueio: dataEntrada,
    data_entrada: dataEntrada,
    data_saida: params.data_saida || null,
    motivo: params.motivo || 'NÃO CONFORMIDADE / VALIDADE CRÍTICA',
    emissor: 'SISTEMA ARMAZÉM / CONFERÊNCIA',
    origem_do_bloqueio: params.localizacaoAnterior ? `Estoque (${params.localizacaoAnterior})` : 'ESTOQUE CENTRAL',
    qtde_bloq_cx: caixas,
    qtde_bloq_hl: hl,
    valor: valor,
    a_o: 'Em Tratativa de Qualidade / Destino',
    respons_vel: params.responsavel || 'QUALIDADE CDD',
    status: 'EM TRATATIVA',
    qtde_retida: caixas,
    qtd_em_plts: 1,
    observa_o: params.observacao || (params.lote ? `Lote: ${params.lote} | Val: ${params.validade || '-'}` : null)
  }, companyId);

  try {
    window.dispatchEvent(new CustomEvent('pnc-records-updated', { detail: { records: created.records } }));
    window.dispatchEvent(new Event('pnc_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {}

  return created;
}

/**
 * Realiza análise analítica sênior completa por Fornecedor, Motivo, Origem do Bloqueio e Devoluções
 */
export function calculatePncSeniorAnalytics(records: PncRecord[]): PncSeniorAnalytics {
  const supplierMap: Record<string, {
    totalBloqueios: number;
    totalBloqCx: number;
    totalBloqHl: number;
    valorTotal: number;
    valorAmortizado: number;
    palletsBloqueados: number;
    palletsDevolvidos: number;
    caixasDevolvidas: number;
    caixasRetidas: number;
    motivos: Record<string, number>;
    statusMap: Record<string, number>;
    somaDiasPnc: number;
  }> = {};

  const motivoMap: Record<string, {
    totalBloqueios: number;
    totalBloqCx: number;
    totalBloqHl: number;
    valorTotal: number;
    valorAmortizado: number;
    pallets: number;
    fornecedores: Record<string, number>;
  }> = {};

  const origemBloqueioMap: Record<string, {
    totalBloqueios: number;
    totalBloqCx: number;
    totalBloqHl: number;
    valorTotal: number;
  }> = {};

  let globalValorTotal = 0;
  let globalValorAmortizado = 0;
  let globalPalletsBloqueados = 0;
  let globalPalletsDevolvidos = 0;
  let globalCaixasBloqueadas = 0;
  let globalCaixasDevolvidas = 0;
  let globalHlBloqueado = 0;
  let globalHlDevolvido = 0;

  for (const r of records) {
    const fab = r.fab_origem || 'SEM ORIGEM';
    const mot = r.motivo || 'OUTROS';
    const orig = r.origem_do_bloqueio || 'NÃO ESPECIFICADA';
    const st = r.status || 'NÃO ESPECIFICADO';

    const cx = r.qtde_bloq_cx || 0;
    const hl = r.qtde_bloq_hl || 0;
    const val = r.valor || 0;
    const plts = r.qtd_em_plts || 0;
    const dias = r.dias_no_pnc || 0;
    const isDev = isPncRecordDevolvido(r);

    globalValorTotal += val;
    globalCaixasBloqueadas += cx;
    globalPalletsBloqueados += plts;
    globalHlBloqueado += hl;

    if (isDev) {
      globalValorAmortizado += val;
      globalPalletsDevolvidos += plts;
      globalCaixasDevolvidas += cx;
      globalHlDevolvido += hl;
    }

    // 1. Supplier Map
    if (!supplierMap[fab]) {
      supplierMap[fab] = {
        totalBloqueios: 0,
        totalBloqCx: 0,
        totalBloqHl: 0,
        valorTotal: 0,
        valorAmortizado: 0,
        palletsBloqueados: 0,
        palletsDevolvidos: 0,
        caixasDevolvidas: 0,
        caixasRetidas: 0,
        motivos: {},
        statusMap: {},
        somaDiasPnc: 0
      };
    }
    const sup = supplierMap[fab];
    sup.totalBloqueios += 1;
    sup.totalBloqCx += cx;
    sup.totalBloqHl += hl;
    sup.valorTotal += val;
    sup.palletsBloqueados += plts;
    sup.somaDiasPnc += dias;
    sup.motivos[mot] = (sup.motivos[mot] || 0) + cx;
    sup.statusMap[st] = (sup.statusMap[st] || 0) + 1;

    if (isDev) {
      sup.valorAmortizado += val;
      sup.palletsDevolvidos += plts;
      sup.caixasDevolvidas += cx;
    } else {
      sup.caixasRetidas += cx;
    }

    // 2. Motivo Map
    if (!motivoMap[mot]) {
      motivoMap[mot] = {
        totalBloqueios: 0,
        totalBloqCx: 0,
        totalBloqHl: 0,
        valorTotal: 0,
        valorAmortizado: 0,
        pallets: 0,
        fornecedores: {}
      };
    }
    const mData = motivoMap[mot];
    mData.totalBloqueios += 1;
    mData.totalBloqCx += cx;
    mData.totalBloqHl += hl;
    mData.valorTotal += val;
    mData.pallets += plts;
    mData.fornecedores[fab] = (mData.fornecedores[fab] || 0) + cx;
    if (isDev) {
      mData.valorAmortizado += val;
    }

    // 3. Origem Bloqueio Map
    if (!origemBloqueioMap[orig]) {
      origemBloqueioMap[orig] = {
        totalBloqueios: 0,
        totalBloqCx: 0,
        totalBloqHl: 0,
        valorTotal: 0
      };
    }
    const oData = origemBloqueioMap[orig];
    oData.totalBloqueios += 1;
    oData.totalBloqCx += cx;
    oData.totalBloqHl += hl;
    oData.valorTotal += val;
  }

  // Formatar Fornecedores ordenados por Valor Total Decrescente
  const suppliers: SupplierMetric[] = Object.entries(supplierMap).map(([nome, data]) => {
    let topMotivo = 'N/A';
    let topMotivoCount = -1;
    Object.entries(data.motivos).forEach(([m, count]) => {
      if (count > topMotivoCount) {
        topMotivoCount = count;
        topMotivo = m;
      }
    });

    const pctValorAmortizado = data.valorTotal > 0 ? (data.valorAmortizado / data.valorTotal) * 100 : 0;
    const pctPalletsDevolvidos = data.palletsBloqueados > 0 ? (data.palletsDevolvidos / data.palletsBloqueados) * 100 : 0;
    const pctCaixasDevolvidas = data.totalBloqCx > 0 ? (data.caixasDevolvidas / data.totalBloqCx) * 100 : 0;
    const mediaDias = data.totalBloqueios > 0 ? data.somaDiasPnc / data.totalBloqueios : 0;

    return {
      nome,
      totalBloqueios: data.totalBloqueios,
      totalBloqCx: Math.round(data.totalBloqCx * 100) / 100,
      totalBloqHl: Math.round(data.totalBloqHl * 100) / 100,
      valorTotal: Math.round(data.valorTotal * 100) / 100,
      valorAmortizado: Math.round(data.valorAmortizado * 100) / 100,
      pctValorAmortizado: Math.round(pctValorAmortizado * 10) / 10,
      palletsBloqueados: data.palletsBloqueados,
      palletsDevolvidos: data.palletsDevolvidos,
      pctPalletsDevolvidos: Math.round(pctPalletsDevolvidos * 10) / 10,
      caixasDevolvidas: data.caixasDevolvidas,
      caixasRetidas: data.caixasRetidas,
      pctCaixasDevolvidas: Math.round(pctCaixasDevolvidas * 10) / 10,
      motivos: data.motivos,
      principalMotivo: topMotivo,
      mediaDiasPnc: Math.round(mediaDias * 10) / 10,
      statusMap: data.statusMap
    };
  }).sort((a, b) => b.valorTotal - a.valorTotal);

  // Formatar Motivos ordenados por Caixas Bloqueadas Decrescente
  const motivos: MotivoMetric[] = Object.entries(motivoMap).map(([motivo, data]) => {
    let topForn = 'N/A';
    let topFornCount = -1;
    Object.entries(data.fornecedores).forEach(([f, count]) => {
      if (count > topFornCount) {
        topFornCount = count;
        topForn = f;
      }
    });

    return {
      motivo,
      totalBloqueios: data.totalBloqueios,
      totalBloqCx: Math.round(data.totalBloqCx * 100) / 100,
      totalBloqHl: Math.round(data.totalBloqHl * 100) / 100,
      valorTotal: Math.round(data.valorTotal * 100) / 100,
      valorAmortizado: Math.round(data.valorAmortizado * 100) / 100,
      pallets: data.pallets,
      principalFornecedor: topForn
    };
  }).sort((a, b) => b.totalBloqCx - a.totalBloqCx);

  // Formatar Origens de Bloqueio
  const origensBloqueio: OrigemBloqueioMetric[] = Object.entries(origemBloqueioMap).map(([origem, data]) => ({
    origem,
    totalBloqueios: data.totalBloqueios,
    totalBloqCx: Math.round(data.totalBloqCx * 100) / 100,
    totalBloqHl: Math.round(data.totalBloqHl * 100) / 100,
    valorTotal: Math.round(data.valorTotal * 100) / 100
  })).sort((a, b) => b.totalBloqCx - a.totalBloqCx);

  const pctPalletsDevolvidos = globalPalletsBloqueados > 0 ? (globalPalletsDevolvidos / globalPalletsBloqueados) * 100 : 0;
  const pctCaixasDevolvidas = globalCaixasBloqueadas > 0 ? (globalCaixasDevolvidas / globalCaixasBloqueadas) * 100 : 0;
  const pctHlDevolvido = globalHlBloqueado > 0 ? (globalHlDevolvido / globalHlBloqueado) * 100 : 0;
  const pctValorAmortizado = globalValorTotal > 0 ? (globalValorAmortizado / globalValorTotal) * 100 : 0;
  const valorNaoAmortizado = Math.max(0, globalValorTotal - globalValorAmortizado);
  const hlRetido = Math.max(0, globalHlBloqueado - globalHlDevolvido);

  // Geração Automática de Insights Sênior de Logística
  const insights: PncSeniorAnalytics['insights'] = [];

  // Insight 0: Alerta Crítico de Itens > 30 dias para Despejo
  const itensOver30 = records.filter(r => isPncAcima30Dias(r));
  if (itensOver30.length > 0) {
    insights.push({
      tipo: 'alerta',
      titulo: `⚠️ Alerta Crítico: ${itensOver30.length} Item(ns) > 30 Dias no PNC — Encaminhar para Despejo`,
      descricao: `${itensOver30.length} chamado(s) de PNC ultrapassaram a janela máxima regulamentar de 30 dias de permanência em quarentena sem resolução final, exigindo abertura imediata de ordem de despejo e descarte seguro.`,
      impacto: `Risco de perda operacional no fechamento DPO e ocupação física indevida de posições de estoque no CDD.`,
      recomendacao: `Proceder com o encaminhamento formal para Despejo através do botão de ação rápida na tabela de acompanhamento ou no modal de tratativa.`
    });
  }

  // Insight 1: Amortização Financeira e Eficácia de Devoluções
  if (pctValorAmortizado >= 80) {
    insights.push({
      tipo: 'sucesso',
      titulo: 'Alta Eficácia de Amortização por Devolução',
      descricao: `${pctValorAmortizado.toFixed(1)}% do valor retido em PNC (R$ ${globalValorAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) foi revertido com sucesso através de chamados de Devolução à Fábrica de Origem.`,
      impacto: `Custo evitado de R$ ${globalValorAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o CDD/Operação.`,
      recomendacao: 'Manter rigor no SLA de abertura de chamados DPO em até 24h após o bloqueio para garantir 100% de aceite fiscal.'
    });
  } else if (valorNaoAmortizado > 0) {
    insights.push({
      tipo: 'alerta',
      titulo: 'Risco Financeiro em Aberto sem Devolução Concluída',
      descricao: `Há R$ ${valorNaoAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em produtos bloqueados que ainda não foram ressarcidos/devolvidos à fábrica de origem.`,
      impacto: 'Potencial perda direta no balanço de quebras se ultrapassar a janela de tratativa.',
      recomendacao: 'Cobrar equipe fiscal/logística sobre a emissão de NF de devolução dos lotes pendentes.'
    });
  }

  // Insight 2: Fornecedor de Maior Impacto
  if (suppliers.length > 0) {
    const top = suppliers[0];
    const pctTopVal = globalValorTotal > 0 ? ((top.valorTotal / globalValorTotal) * 100).toFixed(1) : '0';
    insights.push({
      tipo: 'estrategico',
      titulo: `Concentração de Impacto: ${top.nome}`,
      descricao: `A unidade ${top.nome} responde por ${pctTopVal}% do montante financeiro bloqueado (R$ ${top.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) e ${top.totalBloqCx} caixas (${top.totalBloqHl.toFixed(2)} HL).`,
      impacto: `Principal ofensor identificado: ${top.principalMotivo}.`,
      recomendacao: `Abrir alinhamento de qualidade de fornecimento com a gestão de ${top.nome}, com foco no controle de ${top.principalMotivo}.`
    });
  }

  // Insight 3: Ocupação Física e Eficiência de Tratativa de Itens
  insights.push({
    tipo: 'operacional',
    titulo: 'Eficiência de Tratativa e Devolução de Itens no CDD',
    descricao: `${globalPalletsDevolvidos} de ${globalPalletsBloqueados} itens/volumes registrados (${pctPalletsDevolvidos.toFixed(1)}%) tiveram o fluxo de devolução expedido, liberando espaço no pulmão de armazenagem.`,
    impacto: `${Math.max(0, globalPalletsBloqueados - globalPalletsDevolvidos)} itens continuam em tratativa ativa ocupando área de quarentena.`,
    recomendacao: 'Acelerar carregamento reverso nos veículos que retornam vazios para as fábricas produtoras e despachar lotes sem devolução.'
  });

  return {
    suppliers,
    motivos,
    origensBloqueio,
    devolucaoResumo: {
      palletsBloqueados: globalPalletsBloqueados,
      palletsDevolvidos: globalPalletsDevolvidos,
      pctPalletsDevolvidos: Math.round(pctPalletsDevolvidos * 10) / 10,
      caixasBloqueadas: globalCaixasBloqueadas,
      caixasDevolvidas: globalCaixasDevolvidas,
      caixasRetidas: Math.max(0, globalCaixasBloqueadas - globalCaixasDevolvidas),
      pctCaixasDevolvidas: Math.round(pctCaixasDevolvidas * 10) / 10,
      hlBloqueado: Number(globalHlBloqueado.toFixed(2)),
      hlDevolvido: Number(globalHlDevolvido.toFixed(2)),
      hlRetido: Number(hlRetido.toFixed(2)),
      pctHlDevolvido: Math.round(pctHlDevolvido * 10) / 10,
      valorTotalBloqueado: Math.round(globalValorTotal * 100) / 100,
      valorAmortizado: Math.round(globalValorAmortizado * 100) / 100,
      valorNaoAmortizado: Math.round(valorNaoAmortizado * 100) / 100,
      pctValorAmortizado: Math.round(pctValorAmortizado * 10) / 10
    },
    insights
  };
}

/**
 * Filtra os registros de PNC sem modificar o array original
 */
export function filterPncRecords(records: PncRecord[], filters: PncFilters): PncRecord[] {
  return records.filter(r => {
    // 1. Busca textual global
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      const match =
        String(r.n_bloqueio).toLowerCase().includes(term) ||
        String(r.produto).toLowerCase().includes(term) ||
        String(r.descri_o).toLowerCase().includes(term) ||
        String(r.fab_origem).toLowerCase().includes(term) ||
        String(r.motivo).toLowerCase().includes(term) ||
        String(r.respons_vel).toLowerCase().includes(term) ||
        String(r.status).toLowerCase().includes(term) ||
        String(r.origem_do_bloqueio).toLowerCase().includes(term) ||
        String(r.a_o).toLowerCase().includes(term) ||
        String(r.nf).toLowerCase().includes(term) ||
        (r.observa_o && String(r.observa_o).toLowerCase().includes(term));
      if (!match) return false;
    }

    // 2. Mês (Múltipla seleção)
    if (filters.meses.length > 0) {
      if (!filters.meses.includes(r.m_s)) return false;
    }

    // 3. Produto (Múltipla seleção)
    if (filters.produtos.length > 0) {
      if (!filters.produtos.some(p => String(p) === String(r.produto))) return false;
    }

    // 4. Descrição (Múltipla seleção)
    if (filters.descricoes.length > 0) {
      if (!filters.descricoes.includes(r.descri_o)) return false;
    }

    // 5. Fábrica/Origem (Múltipla seleção)
    if (filters.fabOrigens.length > 0) {
      if (!filters.fabOrigens.includes(r.fab_origem)) return false;
    }

    // 6. Motivo (Múltipla seleção)
    if (filters.motivos.length > 0) {
      if (!filters.motivos.includes(r.motivo)) return false;
    }

    // 7. Origem do bloqueio (Múltipla seleção)
    if (filters.origensBloqueio.length > 0) {
      if (!filters.origensBloqueio.includes(r.origem_do_bloqueio)) return false;
    }

    // 8. Responsável (Múltipla seleção)
    if (filters.responsaveis.length > 0) {
      if (!filters.responsaveis.includes(r.respons_vel)) return false;
    }

    // 9. Status (Múltipla seleção)
    if (filters.statusList.length > 0) {
      if (!filters.statusList.includes(r.status)) return false;
    }

    // 10. Ação (Múltipla seleção)
    if (filters.acoes.length > 0) {
      if (!filters.acoes.includes(r.a_o)) return false;
    }

    // 11. Data do bloqueio específica
    if (filters.dataBloqueio) {
      if (r.data_do_bloqueio !== filters.dataBloqueio) return false;
    }

    // 12. Período (Data inicial e final usando data_do_bloqueio como referência)
    if (filters.dataInicio) {
      if (!r.data_do_bloqueio || r.data_do_bloqueio < filters.dataInicio) return false;
    }
    if (filters.dataFim) {
      if (!r.data_do_bloqueio || r.data_do_bloqueio > filters.dataFim) return false;
    }

    return true;
  });
}

/**
 * Extrai dinamicamente as opções únicas de filtro da base ativa
 */
export function extractFilterOptions(records: PncRecord[]) {
  const mesesSet = new Set<string>();
  const produtosSet = new Set<string | number>();
  const descricoesSet = new Set<string>();
  const fabOrigensSet = new Set<string>();
  const motivosSet = new Set<string>();
  const origensBloqueioSet = new Set<string>();
  const responsaveisSet = new Set<string>();
  const statusSet = new Set<string>();
  const acoesSet = new Set<string>();
  const datasBloqueioSet = new Set<string>();

  for (const r of records) {
    if (r.m_s) mesesSet.add(r.m_s);
    if (r.produto !== undefined && r.produto !== null && r.produto !== '') produtosSet.add(r.produto);
    if (r.descri_o) descricoesSet.add(r.descri_o);
    if (r.fab_origem) fabOrigensSet.add(r.fab_origem);
    if (r.motivo) motivosSet.add(r.motivo);
    if (r.origem_do_bloqueio) origensBloqueioSet.add(r.origem_do_bloqueio);
    if (r.respons_vel) responsaveisSet.add(r.respons_vel);
    if (r.status) statusSet.add(r.status);
    if (r.a_o) acoesSet.add(r.a_o);
    if (r.data_do_bloqueio) datasBloqueioSet.add(r.data_do_bloqueio);
  }

  return {
    meses: Array.from(mesesSet).sort(),
    produtos: Array.from(produtosSet).sort((a, b) => Number(a) - Number(b)),
    descricoes: Array.from(descricoesSet).sort(),
    fabOrigens: Array.from(fabOrigensSet).sort(),
    motivos: Array.from(motivosSet).sort(),
    origensBloqueio: Array.from(origensBloqueioSet).sort(),
    responsaveis: Array.from(responsaveisSet).sort(),
    statusList: Array.from(statusSet).sort(),
    acoes: Array.from(acoesSet).sort(),
    datasBloqueio: Array.from(datasBloqueioSet).sort()
  };
}
