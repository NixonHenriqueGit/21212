// Requirement 22: Central Historical & Retroactive Operations Data Manager
import { buildOfficialRepackRetroactiveRecords } from './repackDefaultData';
import { buildOfficialDespejoRetroactiveRecords } from './retroactiveDespejoParser';

export type RetroactiveModule = 
  | 'efc_efd'
  | 'despejo_repack'
  | 'repack'
  | 'despejo'
  | 'quebras'
  | 'wlp_faturado'
  | 'temperatura';

export const RETROACTIVE_MODULES_LIST: { id: RetroactiveModule; label: string; iconName: string; desc: string }[] = [
  { id: 'temperatura', label: 'Temperatura do Armazém (JSON / Excel)', iconName: 'Thermometer', desc: 'Aferições Térmicas Retroativas, Média Diária, Picos e Controle > 28°C' },
  { id: 'wlp_faturado', label: 'Volume Faturado & Absenteísmo (JSON)', iconName: 'BarChart3', desc: 'Volume Faturado Diário (HL), Jornadas de Ponto e Monitoramento de Absenteísmo' },
  { id: 'quebras', label: 'Quebras & Avarias', iconName: 'AlertCircle', desc: 'Lançamentos de Avarias e Quebras de Estoque' },
  { id: 'despejo', label: 'Despejo', iconName: 'Droplet', desc: 'Lançamentos de Despejo de Produtos e Hectolitros Perdidos' },
  { id: 'repack', label: 'Repack', iconName: 'Box', desc: 'Lançamentos de Reembalagem e Aferição de Metas de Repack' },
  { id: 'efc_efd', label: 'EFC & EFD (Empilhador)', iconName: 'Truck', desc: 'Placa, Empilhador, Hora Início e Hora Fim' }
];

export interface RetroactiveRecord {
  id: string;
  modulo: RetroactiveModule;
  dataISO: string;
  dataFormatada: string;
  codigoProduto?: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorFinanceiro: number;
  operador: string;
  setor: string;
  status: 'Concluído'; // Always Concluído by requirement 22
  observacoes?: string;
  
  // Specialized operational fields for retroactive imports
  lote?: string;
  dataValidade?: string;
  localizacao?: string;
  placa?: string;
  empilhador?: string;
  colaboradorAjudante?: string;
  horaInicio?: string;
  horaFim?: string;
  duracaoMinutos?: number;
  rendimentoHLHora?: number;

  simuladoHistorico: true; // Does not affect live operational data
  criadoEm: string;
}

const STORAGE_KEY_RETROACTIVE = 'af_dados_retroativos_historicos_v3';

function generateInitialRetroactiveData(): RetroactiveRecord[] {
  const today = new Date().toISOString().split('T')[0];
  const dFmt = new Date().toLocaleDateString('pt-BR');

  const baseSeeds: RetroactiveRecord[] = [
    // EFC / EFD sample
    {
      id: 'retro-efc-1',
      modulo: 'efc_efd',
      dataISO: '2026-02-01',
      dataFormatada: '01/02/2026',
      codigoProduto: 'SKU-EFC-504',
      descricao: 'Carregamento EFC - Carreta Bitrem',
      quantidade: 120,
      unidade: 'PALLETS',
      valorFinanceiro: 32000,
      operador: 'Marcos Empilhador',
      empilhador: 'Marcos Empilhador',
      placa: 'RLT5J54',
      horaInicio: '08:15',
      horaFim: '09:45',
      duracaoMinutos: 90,
      rendimentoHLHora: 80,
      setor: 'Doca 02',
      status: 'Concluído',
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    },
    // Despejo & Repack (Ajudante) sample
    {
      id: 'retro-des-1',
      modulo: 'despejo_repack',
      dataISO: '2026-02-25',
      dataFormatada: '25/02/2026',
      codigoProduto: 'SKU-18836',
      descricao: 'Montagem de Repack - CORONA EXTRA 330ML',
      quantidade: 85,
      unidade: 'CX',
      valorFinanceiro: 4250,
      operador: 'João Pedro (Ajudante de Armazém)',
      colaboradorAjudante: 'João Pedro (Ajudante)',
      horaInicio: '08:00',
      horaFim: '10:30',
      duracaoMinutos: 150,
      setor: 'Bancada Repack 01',
      observacoes: 'Montagem conforme padrão operacional POP-04',
      status: 'Concluído',
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    }
  ];

  const repackSeeds = buildOfficialRepackRetroactiveRecords();
  const despejoSeeds = buildOfficialDespejoRetroactiveRecords();
  return [...baseSeeds, ...repackSeeds, ...despejoSeeds];
}

export function getRetroactiveRecords(moduleFilter?: RetroactiveModule | 'todos'): RetroactiveRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RETROACTIVE);
    let all: RetroactiveRecord[] = [];
    if (!raw) {
      all = generateInitialRetroactiveData();
      localStorage.setItem(STORAGE_KEY_RETROACTIVE, JSON.stringify(all));
    } else {
      all = JSON.parse(raw);
    }

    // Filter out removed modules if any remain in old cache
    const activeModuleIds = new Set(RETROACTIVE_MODULES_LIST.map(m => m.id as string).concat(['despejo_repack']));
    all = all.filter(r => activeModuleIds.has(r.modulo as string));

    if (moduleFilter && moduleFilter !== 'todos') {
      return all.filter(r => r.modulo === moduleFilter);
    }
    return all;
  } catch (e) {
    return generateInitialRetroactiveData();
  }
}

export function saveRetroactiveRecords(records: RetroactiveRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RETROACTIVE, JSON.stringify(records));
  } catch (e) {
    console.error('Erro ao salvar dados retroativos:', e);
  }
}

export function upsertRetroactiveRecord(record: RetroactiveRecord): void {
  const all = getRetroactiveRecords('todos');
  const idx = all.findIndex(r => r.id === record.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.unshift(record);
  }
  saveRetroactiveRecords(all);
}

export function deleteRetroactiveRecord(id: string): void {
  const all = getRetroactiveRecords('todos');
  const updated = all.filter(r => r.id !== id);
  saveRetroactiveRecords(updated);
}

export function clearRetroactiveModule(moduleKey: RetroactiveModule): void {
  const all = getRetroactiveRecords('todos');
  const filtered = all.filter(r => r.modulo !== moduleKey);
  saveRetroactiveRecords(filtered);
}
