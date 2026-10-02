import * as XLSX from 'xlsx';
import { formatDateToBR } from './fefoDefaultData';

export interface EscoamentoVendidoItem {
  key: string; // `${codigo}_${validade}`
  codigo: string;
  descricao: string;
  validade: string;
  lote?: string;
  quantidadeOriginal: number;
  quantidadeVendida: number;
  valorTotal: number;
  volumeHl: number;
  dataVenda: string; // DD/MM/AAAA
  horaVenda: string; // HH:mm:ss
  timestamp: string; // ISO string
  responsavel: string;
  nfSaida?: string;
  observacao?: string;
  localizacao?: string;
  bloco?: string;
  vendaMedia?: number;
  diasRestantes?: number;
  status: 'VENDIDO';
}

function getStorageKey(companyId: string): string {
  return `escoamento_vendidos_${companyId || 'demo'}`;
}

export function getStoredEscoamentoVendidos(companyId: string): Record<string, EscoamentoVendidoItem> {
  try {
    const raw = localStorage.getItem(getStorageKey(companyId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (err) {
    console.warn('Erro ao carregar escoamento_vendidos:', err);
    return {};
  }
}

export const getEscoamentoVendidosMap = getStoredEscoamentoVendidos;

export function saveStoredEscoamentoVendidos(data: Record<string, EscoamentoVendidoItem>, companyId: string): void {
  try {
    localStorage.setItem(getStorageKey(companyId), JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('escoamento_venda_updated', { detail: { companyId } }));
    window.dispatchEvent(new Event('escoamento_venda_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
  } catch (err) {
    console.error('Erro ao salvar escoamento_vendidos:', err);
  }
}

export function isItemVendido(key: string, companyId: string): boolean {
  const map = getStoredEscoamentoVendidos(companyId);
  return !!map[key];
}

export function marcarItemComoVendido(params: {
  codigo: string;
  descricao: string;
  validade: string;
  lote?: string;
  quantidade: number;
  valorTotal?: number;
  volumeHl?: number;
  responsavel?: string;
  nfSaida?: string;
  observacao?: string;
  localizacao?: string;
  bloco?: string;
  vendaMedia?: number;
  diasRestantes?: number;
}, companyId: string): EscoamentoVendidoItem {
  const now = new Date();
  const dStr = String(now.getDate()).padStart(2, '0');
  const mStr = String(now.getMonth() + 1).padStart(2, '0');
  const yStr = now.getFullYear();
  const dataVenda = `${dStr}/${mStr}/${yStr}`;
  const horaVenda = now.toTimeString().substring(0, 8);

  const cleanCod = String(params.codigo || '').trim();
  const cleanVal = String(params.validade || '').trim();
  const key = `${cleanCod}_${cleanVal}`;

  const current = getStoredEscoamentoVendidos(companyId);

  const vendidoItem: EscoamentoVendidoItem = {
    key,
    codigo: cleanCod,
    descricao: params.descricao || `Produto ${cleanCod}`,
    validade: cleanVal,
    lote: params.lote || '-',
    quantidadeOriginal: params.quantidade || 0,
    quantidadeVendida: params.quantidade || 0,
    valorTotal: params.valorTotal || 0,
    volumeHl: params.volumeHl || 0,
    dataVenda,
    horaVenda,
    timestamp: now.toISOString(),
    responsavel: params.responsavel || 'Operador CCO',
    nfSaida: params.nfSaida || '-',
    observacao: params.observacao || 'Vendido / Escoado com sucesso na Gestão de Escoamento',
    localizacao: params.localizacao || 'central',
    bloco: params.bloco || '',
    vendaMedia: params.vendaMedia,
    diasRestantes: params.diasRestantes,
    status: 'VENDIDO'
  };

  current[key] = vendidoItem;
  saveStoredEscoamentoVendidos(current, companyId);

  // Também registra nos logs diários de escoamento para total rastreabilidade
  try {
    const logsKey = `armazem_escoamento_logs_${companyId || 'demo'}`;
    const rawLogs = localStorage.getItem(logsKey);
    const logsList = rawLogs ? JSON.parse(rawLogs) : [];
    logsList.unshift({
      id: String(Date.now()),
      loteKey: key,
      dataCount: now.toISOString().substring(0, 10),
      qtdAnterior: params.quantidade,
      qtdAtual: 0,
      qtdEscoada: params.quantidade,
      responsavel: params.responsavel || 'Operador CCO',
      observacao: `VENDIDO: ${vendidoItem.observacao} (NF: ${vendidoItem.nfSaida})`,
      timestamp: now.toISOString()
    });
    localStorage.setItem(logsKey, JSON.stringify(logsList.slice(0, 500)));
    window.dispatchEvent(new Event('escoamento_logs_updated'));
  } catch (e) {}

  return vendidoItem;
}

export function reverterItemParaPendente(key: string, companyId: string): void {
  const current = getStoredEscoamentoVendidos(companyId);
  if (current[key]) {
    delete current[key];
    saveStoredEscoamentoVendidos(current, companyId);
  }
}

/**
 * Exporta para Excel o histórico completo do escoamento contendo todos os itens:
 * Itens Vendidos (com data, responsável, NF) e Itens Pendentes (com risco, dias e valor).
 */
export function exportarHistoricoCompletoEscoamento(params: {
  itensAtivos: any[];
  vendidosMap: Record<string, EscoamentoVendidoItem>;
  companyId: string;
  nomeEmpresa?: string;
}): void {
  const { itensAtivos, vendidosMap, companyId, nomeEmpresa } = params;

  const rows: any[] = [];
  const processedKeys = new Set<string>();

  // 1. Adiciona itens já vendidos
  Object.values(vendidosMap).forEach(v => {
    processedKeys.add(v.key);
    rows.push({
      'Status': '✅ VENDIDO',
      'Código SKU': v.codigo,
      'Descrição do Produto': v.descricao,
      'Lote': v.lote || '-',
      'Data de Vencimento': formatDateToBR(v.validade),
      'Qtd Vendida / Escoada (cx)': v.quantidadeVendida,
      'Volume (HL)': v.volumeHl ? Number(v.volumeHl.toFixed(2)) : 0,
      'Valor Total (R$)': v.valorTotal ? Number(v.valorTotal.toFixed(2)) : 0,
      'Data da Venda': v.dataVenda,
      'Hora da Venda': v.horaVenda,
      'Responsável': v.responsavel,
      'Nota Fiscal (NF)': v.nfSaida || '-',
      'Localização / Bloco': `${v.localizacao || ''} ${v.bloco ? `(${v.bloco})` : ''}`.trim(),
      'Observações': v.observacao || 'Vendido / Escoado'
    });
  });

  // 2. Adiciona itens pendentes que ainda não foram vendidos
  itensAtivos.forEach(item => {
    const key = `${item.codigo}_${item.validade}`;
    if (processedKeys.has(key)) return; // Já incluído como vendido

    const diasParaVencer = item.diasParaVencer !== undefined ? item.diasParaVencer : (item.diasRestantes || 0);
    const qty = item.quantidade || item.qtdAtual || 0;
    const preco = item.precoUnitario || 85;
    const valTotal = item.valorTotal || (qty * preco);

    rows.push({
      'Status': '⏳ PENDENTE',
      'Código SKU': item.codigo,
      'Descrição do Produto': item.descricao,
      'Lote': item.lote || '-',
      'Data de Vencimento': formatDateToBR(item.validade || item.dataVencimento),
      'Qtd Vendida / Escoada (cx)': 0,
      'Volume (HL)': item.volumeHl ? Number(item.volumeHl.toFixed(2)) : Number((qty * 0.072).toFixed(2)),
      'Valor Total (R$)': Number(valTotal.toFixed(2)),
      'Data da Venda': '-',
      'Hora da Venda': '-',
      'Responsável': '-',
      'Nota Fiscal (NF)': (item as any).nfSaida || '-',
      'Localização / Bloco': `${item.localizacao || ''} ${item.bloco ? `(${item.bloco})` : ''}`.trim(),
      'Observações': `Aguardando escoamento (${diasParaVencer} dias restantes)`
    });
  });

  // Ordena por status (Vendidos primeiro ou Pendentes primeiro) e depois por código
  rows.sort((a, b) => {
    if (a.Status !== b.Status) return a.Status.localeCompare(b.Status);
    return String(a['Código SKU']).localeCompare(String(b['Código SKU']));
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Define larguras amigáveis de coluna
  worksheet['!cols'] = [
    { wch: 14 }, // Status
    { wch: 12 }, // Código SKU
    { wch: 36 }, // Descrição
    { wch: 12 }, // Lote
    { wch: 18 }, // Vencimento
    { wch: 22 }, // Qtd Vendida
    { wch: 14 }, // Volume HL
    { wch: 16 }, // Valor Total
    { wch: 14 }, // Data Venda
    { wch: 14 }, // Hora Venda
    { wch: 20 }, // Responsável
    { wch: 16 }, // NF
    { wch: 22 }, // Localização
    { wch: 38 }  // Observações
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Historico_Escoamento');

  const todayStr = new Date().toISOString().substring(0, 10);
  const fileName = `Historico_Escoamento_${nomeEmpresa || companyId || 'Armazem'}_${todayStr}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Atalho conveniente para exportar histórico de escoamento a partir do companyId
 */
export function exportarHistoricoEscoamentoParaExcel(companyId: string, itensAtivos: any[] = [], nomeEmpresa?: string): void {
  const vendidosMap = getStoredEscoamentoVendidos(companyId);
  exportarHistoricoCompletoEscoamento({
    itensAtivos,
    vendidosMap,
    companyId,
    nomeEmpresa
  });
}
