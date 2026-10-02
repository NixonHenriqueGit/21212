// SOP / POP Process Standardization Service (Requirement 20)

import { DEFAULT_POPS, OperationalModuleKey } from '../components/PadraoOperacionalModal';
import { saveSopToIDB, deleteSopFromIDB, getCachedSopsFromMemory, getCachedSopFile, saveSopFileToIDB } from './sopStorage';
import { getUserRoleType } from './permissions';
import { Usuario } from '../types';

export function canUserManageSop(user?: Usuario | null): boolean {
  return true;
}

export type SopScope = 'exclusivo' | 'compartilhado' | 'global';

export type SopModule = 
  | 'quebras'
  | 'repack'
  | 'despejo'
  | 'picking'
  | 'gestao_capacidade'
  | 'ressuprimento'
  | 'recebimento'
  | 'armazenagem'
  | 'carregamento'
  | 'efc'
  | 'efd'
  | 'efc_efd'
  | 'ressuprimento_reabastecimento'
  | 'tmr'
  | 'empilhador'
  | 'conferente'
  | 'fefo'
  | 'estoque_x_estoque'
  | 'estoque_x_picking'
  | 'marketplace'
  | 'central'
  | 'contingencia'
  | 'treinamentos_qualidade'
  | 'bloqueio_armazem'
  | 'devolucao'
  | 'contagem_inventario'
  | 'gestao_ativos'
  | 'qualidade_puxada'
  | 'politica_estoque'
  | 'simulador_ressuprimento'
  | 'wlp'
  | '5s_digital'
  | 'temperatura'
  | 'pragas'
  | 'acoes';

export const SOP_MODULES_LIST: { id: SopModule; label: string }[] = [
  { id: 'quebras', label: '💥 Quebras e Avarias' },
  { id: 'repack', label: '📦 Repack (Reembalamento)' },
  { id: 'despejo', label: '♻️ Despejo & Descarte' },
  { id: 'fefo', label: '⏳ FEFO & Validades' },
  { id: 'efc_efd', label: '🚚 EFC / EFD (Pátio & Carregamento)' },
  { id: 'ressuprimento_reabastecimento', label: '🪵 Abastecimento & Reabastecimento (R&R)' },
  { id: 'tmr', label: '🏬 TMR & Ciclo de Carretas' },
  { id: 'empilhador', label: '🚜 Operação Empilhador' },
  { id: 'conferente', label: '📋 Conferente & ADM Armazém' },
  { id: 'carregamento', label: '📦 Montagem de Cargas (Fast Picking)' },
  { id: 'treinamentos_qualidade', label: '🎓 Treinamentos de Qualidade (QLP)' },
  { id: 'bloqueio_armazem', label: '🚫 Bloqueio no Armazém & PNC' },
  { id: 'devolucao', label: '🔄 Devolução & Retorno de Rota' },
  { id: 'contagem_inventario', label: '📊 Contagem de Inventário & Cíclico' },
  { id: 'gestao_ativos', label: '♻️ Gestão de Ativos (PBR & Vasilhames)' },
  { id: 'qualidade_puxada', label: '🚛 Qualidade da Puxada & Recebimento' },
  { id: 'politica_estoque', label: '📈 Política de Estoque & Curva ABC' },
  { id: 'simulador_ressuprimento', label: '🔄 Simulador de Ressuprimento' },
  { id: 'contingencia', label: '🛡️ Área de Contingência' },
  { id: 'gestao_capacidade', label: '🗺️ Gestão de Capacidade & Layout DPO' },
  { id: 'wlp', label: '📉 WLP & Índice de Qualidade (WQI)' },
  { id: '5s_digital', label: '✨ 5S Digital & Housekeeping' },
  { id: 'temperatura', label: '🌡️ Padrão de Temperatura' },
  { id: 'pragas', label: '🐜 Controle de Pragas & Higienização' },
  { id: 'acoes', label: '🎯 Gestão de Ações & Governança SDPO' },
  { id: 'picking', label: '🛒 Picking' },
  { id: 'ressuprimento', label: '🔄 Ressuprimento' },
  { id: 'recebimento', label: '📥 Recebimento' },
  { id: 'armazenagem', label: '🏬 Armazenagem' },
  { id: 'efc', label: '🚛 EFC' },
  { id: 'efd', label: '🚚 EFD' },
  { id: 'estoque_x_estoque', label: '📦 Estoque x Estoque' },
  { id: 'estoque_x_picking', label: '🛒 Estoque x Picking' },
  { id: 'marketplace', label: '🏪 Marketplace' },
  { id: 'central', label: '🏢 Central Geral' },
];

export interface CustomSopModule {
  id: string;
  label: string;
  icon?: string;
  createdAt?: string;
}

export function getCustomSopModules(): CustomSopModule[] {
  try {
    const raw = localStorage.getItem('af_sop_custom_processes');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveCustomSopModule(moduleItem: CustomSopModule): CustomSopModule[] {
  const current = getCustomSopModules();
  const exists = current.some(m => m.id === moduleItem.id);
  let updated: CustomSopModule[];
  if (exists) {
    updated = current.map(m => m.id === moduleItem.id ? moduleItem : m);
  } else {
    updated = [...current, moduleItem];
  }
  try {
    localStorage.setItem('af_sop_custom_processes', JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

export function getAllSopModulesList(): { id: string; label: string }[] {
  const custom = getCustomSopModules();
  const map = new Map<string, string>();
  SOP_MODULES_LIST.forEach(m => map.set(m.id, m.label));
  custom.forEach(c => map.set(c.id, c.label));
  return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
}

export interface SopAlteracaoHistorico {
  id: string;
  data: string;
  alteracao: string;
  usuario: string;
  revisaoAnterior?: string;
}

export interface SopDocument {
  id: string;
  codigo: string;              // e.g. "POP-RPK-01"
  nome: string;                // e.g. "Padrão de Repack e Triagem"
  objetivo: string;            // Objetivo do padrão
  descricao: string;           // Descrição detalhada
  passoAPasso: string[];       // Lista de passos sequenciais
  fotos: string[];             // URLs ou Base64 das fotos
  videos: string[];            // URLs dos vídeos
  anexos: { nome: string; url: string; tipo?: string }[];
  revisao: string;             // e.g. "Rev 02"
  dataRevisao: string;         // e.g. "2026-07-29"
  responsavel: string;         // Nome do responsável
  status: 'Ativo' | 'Inativo';
  escopo: SopScope;            // 'exclusivo' | 'compartilhado' | 'global'
  modulosVinculados: (SopModule | string)[]; // Módulos onde o padrão é exibido
  historicoAlteracoes: SopAlteracaoHistorico[];
  criadoEm: string;
  atualizadoEm: string;
}

const STORAGE_KEY_SOPS = 'af_sop_central_documents';
const STORAGE_KEY_DELETED_SOPS = 'af_deleted_sop_ids';

export function getDeletedSopIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_SOPS);
    if (!raw) return new Set<string>();
    return new Set<string>(JSON.parse(raw));
  } catch (e) {
    return new Set<string>();
  }
}

export function addDeletedSopId(sopId: string): void {
  try {
    const current = getDeletedSopIds();
    current.add(sopId);
    localStorage.setItem(STORAGE_KEY_DELETED_SOPS, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

// Initial default SOPs for all platform modules
const DEFAULT_CENTRAL_SOPS: SopDocument[] = [
  {
    id: 'sop-global-01',
    codigo: 'POP-GLO-01',
    nome: 'Segurança Operacional e Uso Obrigatório de EPIs',
    objetivo: 'Garantir a integridade física de todos os colaboradores em todas as áreas operacionais do armazém.',
    descricao: 'Norma padronizada de utilização de Equipamentos de Proteção Individual e postura ergonômica.',
    passoAPasso: [
      '1. Inspecione seus EPIs antes do início de cada turno (Bota de aço, luva anticorte, óculos e protetor auricular).',
      '2. Realize a ginástica laboral de 5 minutos antes da primeira atividade física.',
      '3. Sinalize imediatamente à supervisão qualquer avaria ou vazamento de líquido.',
      '4. Nunca transite em corredores de empilhadeira fora da faixa de pedestres.'
    ],
    fotos: [],
    videos: [],
    anexos: [{ nome: 'Manual_EPIs_Ambev_2026.pdf', url: '#' }],
    revisao: 'Rev 03',
    dataRevisao: '2026-07-01',
    responsavel: 'Eng. de Segurança (Carlos Eduardo)',
    status: 'Ativo',
    escopo: 'global',
    modulosVinculados: SOP_MODULES_LIST.map(m => m.id),
    historicoAlteracoes: [
      { id: 'h1', data: '2026-07-01', alteracao: 'Inclusão da obrigatoriedade do óculos no picking', usuario: 'Carlos Eduardo', revisaoAnterior: 'Rev 02' }
    ],
    criadoEm: '2026-01-10T08:00:00.000Z',
    atualizadoEm: '2026-07-01T10:00:00.000Z'
  },
  {
    id: 'sop-rpk-01',
    codigo: 'POP-RPK-01',
    nome: 'Procedimento Operacional Padronizado de Repack',
    objetivo: 'Normatizar a triagem, reembalagem e montagem de caixas e fardos sem avaria.',
    descricao: 'Instruções técnicas para resgate de caixas avariadas no armazém.',
    passoAPasso: [
      '1. Paramentação com luva anticorte e avental.',
      '2. Triagem e separação de vasilhames trincados ou amassados.',
      '3. Sanitização e secagem de latas e garrafas íntegras.',
      '4. Montagem de novas caixas/fardos padronizados por marca.',
      '5. Lançamento do volume processado no painel do operador.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-06-15',
    responsavel: 'Supervisor de Repack (Mariana)',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['repack'],
    historicoAlteracoes: [
      { id: 'h1', data: '2026-06-15', alteracao: 'Ajuste no tempo padrão de sanitização', usuario: 'Mariana', revisaoAnterior: 'Rev 01' }
    ],
    criadoEm: '2026-02-01T08:00:00.000Z',
    atualizadoEm: '2026-06-15T14:30:00.000Z'
  },
  {
    id: 'sop-qbr-01',
    codigo: 'WH-LOG-03',
    nome: 'Procedimento Operacional Padrão - Gestão de Quebras e Avarias',
    objetivo: 'Definir normas e procedimentos para o processo de gestão nas ocorrências de perdas e quebras dentro da operação.',
    descricao: 'Padrão corporativo para controle estatístico de perdas, isolamento de áreas de risco, recolha segura de garrafas e apuração de causas.',
    passoAPasso: [
      '1. Avaliação de Risco & Check Visual de integridade de pallets PBR e fitas de amostragem.',
      '2. Atendimento de Emergência & Isolamento (30 min de espera obrigatória antes da limpeza).',
      '3. Limpeza Segura com luvas anticorte e destinação adequada do vidro.',
      '4. Contabilização e Registro na Plataforma (código SKU, área, turno, motivo e responsável).',
      '5. Análise de CFTV & Apuração de causa raiz.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2025-12-05',
    responsavel: 'Armazém - Pau Brasil Guarabira',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['quebras'],
    historicoAlteracoes: [],
    criadoEm: '2025-12-05T08:00:00.000Z',
    atualizadoEm: '2025-12-05T08:00:00.000Z'
  },
  {
    id: 'sop-dsp-01',
    codigo: 'WH-LOG-03-DSP',
    nome: 'Procedimento Operacional Padrão - Gestão do Despejo e Descarte',
    objetivo: 'Mapear o fluxo a ser seguido para o envio de produtos não conformes para despejo na bombona e destinação responsável de resíduos.',
    descricao: 'Processo corporativo de escoamento de líquidos na bombona, enfardamento de resíduos (Projeto Reciclar) e controle de descarte.',
    passoAPasso: [
      '1. Conferência e Organização de PNC (Produtos Não Conformes).',
      '2. Autorização prévia e Despejo do Líquido na Bombona com EPIs de proteção completa.',
      '3. Verificação do nível da Bombona e agendamento de recolha com a fábrica.',
      '4. Segregação de Resíduos & Encaminhamento ao Projeto Reciclar.',
      '5. Lançamento da produtividade no aplicativo.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 04',
    dataRevisao: '2026-08-01',
    responsavel: 'Armazém - Distribuidora Pau Brasil',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['despejo'],
    historicoAlteracoes: [],
    criadoEm: '2026-08-01T08:00:00.000Z',
    atualizadoEm: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sop-pck-01',
    codigo: 'POP-PCK-01',
    nome: 'Separação e Estilagem no Picking de Vendas',
    objetivo: 'Zero avarias durante a montagem de paletes para expedição.',
    descricao: 'Orientações para arrumação física de caixas no palete de expedição.',
    passoAPasso: [
      '1. Bipar o código de barras da posição de picking.',
      '2. Colocar produtos pesados (Garrafas 1L/600ml) na base do palete.',
      '3. Acomodar caixas leves e latas nas camadas superiores.',
      '4. Aplicar filme stretch com ao menos 4 voltas de travamento.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 01',
    dataRevisao: '2026-05-20',
    responsavel: 'Coordenador de Logística (Roberto)',
    status: 'Ativo',
    escopo: 'compartilhado',
    modulosVinculados: ['picking', 'ressuprimento', 'gestao_capacidade', 'estoque_x_picking'],
    historicoAlteracoes: [],
    criadoEm: '2026-05-20T08:00:00.000Z',
    atualizadoEm: '2026-05-20T08:00:00.000Z'
  },
  {
    id: 'sop-fefo-01',
    codigo: 'POP-FEFO-01',
    nome: 'Controle de Validades e Giro FEFO no Armazém',
    objetivo: 'Garantir que os produtos com data de vencimento mais próxima sejam expedidos primeiro (First Expired, First Out).',
    descricao: 'Norma de rastreamento diário de lotes, bandeiras de criticidade e bloqueio automático de SKUs abaixo de 45 dias para o vencimento.',
    passoAPasso: [
      '1. Auditoria diária de etiquetas de lote nas posições de picking e pulmão.',
      '2. Atualização dos lotes no painel FEFO da plataforma com status Crítico/Alerta/Normal.',
      '3. Priorização imediata no roteamento de picking para lotes em alerta.',
      '4. Bloqueio físico e sistêmico de produtos em risco iminente de vencimento (<30 dias).'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 03',
    dataRevisao: '2026-07-15',
    responsavel: 'Analista de Qualidade e FEFO',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['fefo'],
    historicoAlteracoes: [],
    criadoEm: '2026-01-15T08:00:00.000Z',
    atualizadoEm: '2026-07-15T08:00:00.000Z'
  },
  {
    id: 'sop-efc-01',
    codigo: 'POP-EFC-01',
    nome: 'Eficiência de Carregamento e Despacho de Rotas (EFC/EFD)',
    objetivo: 'Assegurar a partida pontual dos caminhões de entrega e carregamento sem gargalos de doca.',
    descricao: 'Padrão operacional de alocação de docas, check-in de motoristas, conferência cega e liberação de manifesto de carga.',
    passoAPasso: [
      '1. Check-in do veículo na portaria com registro de horário no painel EFC.',
      '2. Posicionamento na baia designada e colocação de calço de segurança nas rodas.',
      '3. Carregamento ágil seguindo o mapa de cubagem e estabilidade do baú.',
      '4. Lacração, conferência da nota fiscal e liberação para saída no horário da meta.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-06-10',
    responsavel: 'Supervisor de Distribuição & Pátio',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['efc_efd', 'efc', 'efd', 'carregamento'],
    historicoAlteracoes: [],
    criadoEm: '2026-02-10T08:00:00.000Z',
    atualizadoEm: '2026-06-10T08:00:00.000Z'
  },
  {
    id: 'sop-rr-01',
    codigo: 'POP-RR-01',
    nome: 'Abastecimento Contínuo e Reabastecimento Dinâmico (R&R)',
    objetivo: 'Eliminar rupturas de picking durante a janela de separação através do ressuprimento preventivo do pulmão para a área de picking.',
    descricao: 'Mapeamento de níveis de estoque mínimo, disparo de ondas de ressuprimento automático e movimentação de pallets inteiros.',
    passoAPasso: [
      '1. Monitoramento do mapa de calor de estoque de picking em tempo real.',
      '2. Disparo de ordem de ressuprimento quando o nível atingir o Ponto de Reposição (30%).',
      '3. Descida do pallet do porta-palete pelo operador de empilhadeira com trava de segurança.',
      '4. Posicionamento e bipagem na posição de picking designada.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-07-20',
    responsavel: 'Coordenador de Armazenagem',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['ressuprimento_reabastecimento', 'ressuprimento'],
    historicoAlteracoes: [],
    criadoEm: '2026-03-01T08:00:00.000Z',
    atualizadoEm: '2026-07-20T08:00:00.000Z'
  },
  {
    id: 'sop-tmr-01',
    codigo: 'POP-TMR-01',
    nome: 'Gestão de Tempo Médio de Permanência de Carretas (TMR)',
    objetivo: 'Garantir o descarregamento de carretas de fábrica e revenda dentro da janela máxima de 120 minutos.',
    descricao: 'Fluxo de recepção de carretas, conferência de integridade de carga na puxada e rápida liberação de motoristas.',
    passoAPasso: [
      '1. Recepção da carreta no pátio e registro imediato de entrada no painel TMR.',
      '2. Inspeção de lona, lacres e temperatura da carga.',
      '3. Descarga simultânea com duas empilhadeiras em docas equipadas.',
      '4. Liberação do motorista e registro do tempo total do ciclo.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 01',
    dataRevisao: '2026-05-10',
    responsavel: 'Analista de Logística / CCO',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['tmr'],
    historicoAlteracoes: [],
    criadoEm: '2026-05-10T08:00:00.000Z',
    atualizadoEm: '2026-05-10T08:00:00.000Z'
  },
  {
    id: 'sop-emp-01',
    codigo: 'POP-EMP-01',
    nome: 'Operação Segura de Empilhadeiras e Movimentação Vertical',
    objetivo: 'Zero acidentes de trabalho e preservação da integridade estrutural das mercadorias e estruturas porta-paletes.',
    descricao: 'Checklist diário da máquina, limites de velocidade, regras de trânsito em cruzamentos e elevação segura de cargas.',
    passoAPasso: [
      '1. Realização do checklist pré-operacional (freios, buzina, vazamentos e garfos).',
      '2. Velocidade máxima permitida de 10 km/h no armazém e uso contínuo do cinto de segurança.',
      '3. Elevação do garfo somente com a empilhadeira parada em frente à posição de estocagem.',
      '4. Nunca transitar com carga elevada.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 04',
    dataRevisao: '2026-08-01',
    responsavel: 'Engenharia de Segurança & Manutenção',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['empilhador'],
    historicoAlteracoes: [],
    criadoEm: '2026-01-05T08:00:00.000Z',
    atualizadoEm: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sop-cnf-01',
    codigo: 'POP-CNF-01',
    nome: 'Conferência Cega e Lançamento de Manifestos de Carga',
    objetivo: 'Garantir 100% de acuracidade na conferência física versus nota fiscal na expedição e recebimento.',
    descricao: 'Procedimento padrão de conferência item a item, contagem física de caixas e resolução de divergências.',
    passoAPasso: [
      '1. Recebimento do espelho cego de conferência sem visualização de quantidades prévias.',
      '2. Contagem física das caixas e pallets na doca.',
      '3. Registro das quantidades no coletor e validação de divergências.',
      '4. Assinatura do termo de conferência e liberação para o motorista.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-06-25',
    responsavel: 'Encarregado de Conferência',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['conferente'],
    historicoAlteracoes: [],
    criadoEm: '2026-02-15T08:00:00.000Z',
    atualizadoEm: '2026-06-25T08:00:00.000Z'
  },
  {
    id: 'sop-trein-01',
    codigo: 'POP-QLP-01',
    nome: 'Treinamentos de Qualidade e Capacitação DPO (QLP)',
    objetivo: 'Garantir que 100% dos operadores estejam treinados e certificados nos padrões de qualidade e segurança.',
    descricao: 'Matriz de competências, frequência de reciclagens operacionais e registro de presença e eficácia.',
    passoAPasso: [
      '1. Mapeamento de operadores novatos ou com reciclagem pendente.',
      '2. Aplicação do módulo teórico e prático com avaliação de retenção.',
      '3. Registro do certificado e horas no histórico do colaborador.',
      '4. Auditoria em campo de 30 dias para verificar aderência aos padrões.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-07-10',
    responsavel: 'Analista de Treinamento e Qualidade',
    status: 'Ativo',
    escopo: 'compartilhado',
    modulosVinculados: ['treinamentos_qualidade', 'acoes'],
    historicoAlteracoes: [],
    criadoEm: '2026-03-10T08:00:00.000Z',
    atualizadoEm: '2026-07-10T08:00:00.000Z'
  },
  {
    id: 'sop-blq-01',
    codigo: 'POP-BLQ-01',
    nome: 'Bloqueio Preventivo e Gestão de Produtos Não Conformes (PNC)',
    objetivo: 'Impedir a saída e entrega de qualquer produto com defeito de fábrica, desvio sensorial ou avaria.',
    descricao: 'Critérios de segregação física na gaiola de bloqueio, emissão de fita zebrada e registro sistêmico.',
    passoAPasso: [
      '1. Identificação visual ou sensorial do desvio no lote.',
      '2. Bloqueio sistêmico instantâneo na plataforma para impedir o picking.',
      '3. Movimentação física do lote para a Área Segregada de Bloqueio.',
      '4. Emissão de laudo com o laboratório da cervejaria e destinação final.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 03',
    dataRevisao: '2026-08-05',
    responsavel: 'Garantia da Qualidade & Supervisão',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['bloqueio_armazem'],
    historicoAlteracoes: [],
    criadoEm: '2026-02-05T08:00:00.000Z',
    atualizadoEm: '2026-08-05T08:00:00.000Z'
  },
  {
    id: 'sop-dev-01',
    codigo: 'POP-DEV-01',
    nome: 'Recepção e Tratamento de Devoluções de Rota',
    objetivo: 'Agilizar o retorno de mercadorias não entregues com triagem de qualidade e reintegração rápida ao estoque.',
    descricao: 'Triagem de motivos de devolução (recusa, cliente fechado, avaria de transporte) e conferência de vasilhames.',
    passoAPasso: [
      '1. Recepção do caminhão de rota na doca de devolução.',
      '2. Inspeção física da carga retornada e checagem da nota de devolução.',
      '3. Segregação: produtos íntegros voltam ao estoque; avariados vão para Repack.',
      '4. Lançamento da baixa sistêmica no painel de devoluções.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-06-30',
    responsavel: 'Supervisor de Logística Reversa',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['devolucao'],
    historicoAlteracoes: [],
    criadoEm: '2026-01-20T08:00:00.000Z',
    atualizadoEm: '2026-06-30T08:00:00.000Z'
  },
  {
    id: 'sop-inv-01',
    codigo: 'POP-INV-01',
    nome: 'Contagem de Inventário Cíclico e Auditoria de Posições',
    objetivo: 'Garantir acuracidade de estoque superior a 99,8% em contagens físicas diárias.',
    descricao: 'Divisão do armazém por setores ABC, contagem em duas rodadas independentes e conciliação de sobras e faltas.',
    passoAPasso: [
      '1. Emissão da lista de contagem cega por rua e nível.',
      '2. Primeira contagem realizada pelo auditor independente.',
      '3. Segunda contagem de reconferência nos itens com divergência.',
      '4. Análise de causa raiz para qualquer discrepância antes do ajuste.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 03',
    dataRevisao: '2026-07-25',
    responsavel: 'Coordenador de Controladoria & Estoque',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['contagem_inventario'],
    historicoAlteracoes: [],
    criadoEm: '2026-02-18T08:00:00.000Z',
    atualizadoEm: '2026-07-25T08:00:00.000Z'
  },
  {
    id: 'sop-atv-01',
    codigo: 'POP-ATV-01',
    nome: 'Gestão e Controle de Ativos Retornáveis (Paletes PBR e Vasilhames)',
    objetivo: 'Manter o saldo positivo de paletes PBR e vasilhames retornáveis evitando perdas patrimoniais.',
    descricao: 'Controle de entrada e saída de paletes com transportadoras e fábricas, triagem de paletes quebrados e reparo.',
    passoAPasso: [
      '1. Contagem física de paletes PBR vazios em toda descarga e carregamento.',
      '2. Inspeção de integridade: separar paletes com tocos soltos ou tábuas trincadas.',
      '3. Emissão do comprovante de troca de ativo com o motorista.',
      '4. Atualização diária do saldo devedor/credor de vasilhames na plataforma.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 01',
    dataRevisao: '2026-05-15',
    responsavel: 'Gestor de Ativos Retornáveis',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['gestao_ativos'],
    historicoAlteracoes: [],
    criadoEm: '2026-05-15T08:00:00.000Z',
    atualizadoEm: '2026-05-15T08:00:00.000Z'
  },
  {
    id: 'sop-pux-01',
    codigo: 'POP-PUX-01',
    nome: 'Qualidade da Puxada e Auditoria de Cargas Recebidas',
    objetivo: 'Garantir que cargas vindas das fábricas cheguem sem tombamentos, avarias ou inconformidades de estiva.',
    descricao: 'Auditoria visual de pallets, medição de altura, verificação de cantoneiras e registro fotográfico de avarias de transporte.',
    passoAPasso: [
      '1. Abertura do baú na presença do motorista para registro fotográfico inicial.',
      '2. Avaliação de inclinação de pallets e amarração com fita.',
      '3. Apontamento de avarias de trânsito para imputação à transportadora.',
      '4. Lançamento do formulário de Qualidade da Puxada com índice de assertividade.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-06-18',
    responsavel: 'Líder de Recebimento de Carga',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['qualidade_puxada'],
    historicoAlteracoes: [],
    criadoEm: '2026-03-12T08:00:00.000Z',
    atualizadoEm: '2026-06-18T08:00:00.000Z'
  },
  {
    id: 'sop-cap-01',
    codigo: 'PB-GBA-LAY-01',
    nome: 'Gestão de Layout, Endereçamento e Capacidade Estática',
    objetivo: 'Maximizar a taxa de ocupação do armazém garantindo fluidez logística e respeito às alturas máximas de empilhamento.',
    descricao: 'Definição de ruas de alto fluxo, zoneamento de picking por giro (Curva ABC) e restrições de empilhamento por embalagem.',
    passoAPasso: [
      '1. Posicionamento de SKUs Curva A nas posições mais próximas da doca de expedição.',
      '2. Respeito rigoroso aos limites de empilhamento vertical (máximo 3 alturas para PBR com lata, 2 para vidro).',
      '3. Manutenção das faixas amarelas e saídas de emergência 100% desobstruídas.',
      '4. Atualização semanal da taxa de ocupação volumétrica no dashboard.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 04',
    dataRevisao: '2026-08-01',
    responsavel: 'Coordenador de Armazém e Layout DPO',
    status: 'Ativo',
    escopo: 'compartilhado',
    modulosVinculados: ['gestao_capacidade', 'empilhador', 'picking'],
    historicoAlteracoes: [],
    criadoEm: '2026-01-08T08:00:00.000Z',
    atualizadoEm: '2026-08-01T08:00:00.000Z'
  },
  {
    id: 'sop-5s-01',
    codigo: 'POP-5S-01',
    nome: 'Auditoria 5S Digital, Organização e Housekeeping do Armazém',
    objetivo: 'Manter o ambiente de trabalho limpo, organizado, seguro e produtivo em conformidade com os pilares DPO.',
    descricao: 'Rotina de limpeza das ruas, destinação de restos de filme stretch, organização de ferramentas e pontuação 5S.',
    passoAPasso: [
      '1. Realização do Seiri (Descarte): retirar das ruas paletes quebrados e materiais sem uso.',
      '2. Realização do Seiton (Organização): manter carrinhos e paleteiras estacionados nas vagas demarcadas.',
      '3. Realização do Seiso (Limpeza): recolher cacos de vidro, plástico e poeira ao término do turno.',
      '4. Auditoria semanal com nota mínima de corte de 95% de conformidade.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 03',
    dataRevisao: '2026-07-05',
    responsavel: 'Comitê 5S & Segurança do Trabalho',
    status: 'Ativo',
    escopo: 'compartilhado',
    modulosVinculados: ['5s_digital', 'acoes'],
    historicoAlteracoes: [],
    criadoEm: '2026-02-12T08:00:00.000Z',
    atualizadoEm: '2026-07-05T08:00:00.000Z'
  },
  {
    id: 'sop-tmp-01',
    codigo: 'POP-TMP-01',
    nome: 'Monitoramento de Temperatura e Termohigrometria do Armazém',
    objetivo: 'Preservar a estabilidade sensorial da cerveja garantindo estocagem em temperatura adequada (< 28°C).',
    descricao: 'Leitura diária dos termômetros digitais nos quatro quadrantes do armazém e acionamento de exaustores em picos térmicos.',
    passoAPasso: [
      '1. Leitura dos 4 termohigrômetros às 08h, 12h e 16h.',
      '2. Registro no sistema da temperatura ambiente e umidade relativa.',
      '3. Acionamento do sistema forçado de ventilação se temperatura > 27°C.',
      '4. Registro de alerta de qualidade se ultrapassar a faixa de tolerância por mais de 4 horas.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 01',
    dataRevisao: '2026-04-20',
    responsavel: 'Técnico de Qualidade Assegurada',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['temperatura'],
    historicoAlteracoes: [],
    criadoEm: '2026-04-20T08:00:00.000Z',
    atualizadoEm: '2026-04-20T08:00:00.000Z'
  },
  {
    id: 'sop-prg-01',
    codigo: 'POP-PRG-01',
    nome: 'Controle Integrado de Pragas e Higienização de Perímetro',
    objetivo: 'Garantir zero contaminação de produtos e embalagens por roedores, pássaros ou insetos.',
    descricao: 'Inspeção semanal das iscas de atração, barreiras físicas nas portas de doca e controle de vegetação no entorno.',
    passoAPasso: [
      '1. Inspeção do mapa de porta-iscas numerados e lacrados.',
      '2. Manutenção de portas de doca fechadas quando não houver caminhão operando.',
      '3. Vistoria diária de ralos e telas de proteção contra entrada de aves.',
      '4. Registro do certificado da empresa de dedetização autorizada.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 02',
    dataRevisao: '2026-06-05',
    responsavel: 'Engenharia de Meio Ambiente e Saúde',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: ['pragas'],
    historicoAlteracoes: [],
    criadoEm: '2026-01-25T08:00:00.000Z',
    atualizadoEm: '2026-06-05T08:00:00.000Z'
  },
  {
    id: 'sop-act-01',
    codigo: 'POP-SDPO-01',
    nome: 'Gestão da Rotina, Governança SDPO e Planos de Ação 5 Porquês',
    objetivo: 'Garantir o fechamento de desvios operacionais com análise de causa raiz e planos de ação eficazes no prazo.',
    descricao: 'Aplicação dos 5 Porquês para qualquer meta não atingida no dia, atribuição de responsável e acompanhamento no CCO.',
    passoAPasso: [
      '1. Identificação do desvio no fechamento diário do indicador operacional.',
      '2. Realização da sessão dos 5 Porquês com o operador e liderança direta.',
      '3. Cadastro do plano de ação com Ação Corretiva, Responsável e Prazo Máximo.',
      '4. Validação semanal da eficácia e encerramento do plano de ação.'
    ],
    fotos: [],
    videos: [],
    anexos: [],
    revisao: 'Rev 04',
    dataRevisao: '2026-08-10',
    responsavel: 'Gerência de Operações & Excelência SDPO',
    status: 'Ativo',
    escopo: 'compartilhado',
    modulosVinculados: ['acoes', 'wlp', 'politica_estoque'],
    historicoAlteracoes: [],
    criadoEm: '2026-01-02T08:00:00.000Z',
    atualizadoEm: '2026-08-10T08:00:00.000Z'
  }
];

export function getAllSops(): SopDocument[] {
  const deletedSet = getDeletedSopIds();
  const idbCached = getCachedSopsFromMemory();
  const mergedMap = new Map<string, SopDocument>();

  // 1. Initial defaults
  DEFAULT_CENTRAL_SOPS.forEach(s => {
    if (s && s.id && !deletedSet.has(s.id)) {
      mergedMap.set(s.id, s);
    }
  });

  // 2. Saved SOPs from localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SOPS);
    if (raw) {
      const parsed: SopDocument[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(s => {
          if (s && s.id && !deletedSet.has(s.id)) {
            if (s.id === 'sop-rpk-01' && (s.modulosVinculados.includes('despejo') || s.modulosVinculados.includes('quebras'))) {
              s.modulosVinculados = ['repack'];
            }
            mergedMap.set(s.id, s);
          }
        });
      }
    }
  } catch (e) {}

  // 3. Saved SOPs from IndexedDB memory cache
  idbCached.forEach(s => {
    if (s && s.id && !deletedSet.has(s.id)) {
      mergedMap.set(s.id, s);
    }
  });

  return Array.from(mergedMap.values());
}

export function saveAllSops(sops: SopDocument[]): void {
  sops.forEach(sop => {
    saveSopToIDB(sop).catch(() => {});
  });

  try {
    const sanitizedForLs = sops.map(s => {
      if (s.anexos && s.anexos.length > 0) {
        const anexosClean = s.anexos.map(a => {
          if (a.url && a.url.length > 300000) {
            return { ...a, url: '#' };
          }
          return a;
        });
        return { ...s, anexos: anexosClean };
      }
      return s;
    });
    localStorage.setItem(STORAGE_KEY_SOPS, JSON.stringify(sanitizedForLs));
  } catch (e) {
    console.error('Erro ao salvar SOPs em localStorage:', e);
  }
}

export function getSopsForModule(moduleName: SopModule): SopDocument[] {
  const all = getAllSops();
  return all.filter(sop => 
    sop.status === 'Ativo' && (
      sop.escopo === 'global' || 
      sop.modulosVinculados.includes(moduleName)
    )
  );
}

export interface SopViewOption {
  id: string;
  code?: string;
  title: string;
  displayName: string;
  steps: string[];
  fileUrl?: string;
  fileName?: string;
  description?: string;
}

export function resolveSopFile(key: string, existingUrl?: string, existingName?: string): { fileUrl?: string; fileName?: string } {
  const cached = getCachedSopFile(key);
  if (cached && cached.dataUrl && cached.dataUrl !== '#' && cached.dataUrl !== 'about:blank') {
    return { fileUrl: cached.dataUrl, fileName: cached.name || existingName };
  }
  if (existingUrl && existingUrl !== '#' && existingUrl !== 'about:blank') {
    return { fileUrl: existingUrl, fileName: existingName };
  }
  return { fileUrl: undefined, fileName: existingName };
}

export function getAllSopsForOperationList(operation: string): SopViewOption[] {
  const normKey = (operation || 'repack').toLowerCase().trim() as OperationalModuleKey;
  const deletedSet = getDeletedSopIds();

  const aliasMap: Record<string, OperationalModuleKey> = {
    repack: 'repack',
    despejo: 'despejo',
    armazem: 'armazem',
    logistica: 'efc_efd',
    efc: 'efc_efd',
    efd: 'efc_efd',
    efc_efd: 'efc_efd',
    fefo: 'fefo',
    validades: 'fefo',
    picking: 'picking',
    empilhador: 'empilhador',
    quebras: 'quebras',
    ressuprimento: 'ressuprimento_reabastecimento',
    ressuprimento_reabastecimento: 'ressuprimento_reabastecimento',
    tmr: 'tmr'
  };
  const targetKey = aliasMap[normKey] || normKey;

  const result: SopViewOption[] = [];
  const addedIds = new Set<string>();

  // 1. Check direct POP doc saved in af_pop_doc_${normKey} / af_pop_doc_${targetKey}
  const moduleKeysToTry = Array.from(new Set([normKey, targetKey]));
  for (const k of moduleKeysToTry) {
    try {
      const itemId = `pop-doc-${k}`;
      if (deletedSet.has(itemId)) continue;
      
      const rawSaved = localStorage.getItem(`af_pop_doc_${k}`);
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (parsed.title || parsed.nome || parsed.fileUrl) {
          const itemTitle = parsed.title || parsed.nome || 'Padrão Operacional';
          const itemCode = parsed.code || `POP-${k.toUpperCase()}`;
          const resolved = resolveSopFile(k, parsed.fileUrl || parsed.anexos?.[0]?.url, parsed.fileName || parsed.anexos?.[0]?.nome || `${itemCode}.pdf`);
          
          if (!addedIds.has(itemId)) {
            addedIds.add(itemId);
            result.push({
              id: itemId,
              code: itemCode,
              title: itemTitle,
              displayName: `${itemCode} - ${itemTitle}`,
              steps: Array.isArray(parsed.steps) 
                ? parsed.steps.map((s: any) => typeof s === 'string' ? s : `${s.step || ''}. ${s.title}: ${s.description}`) 
                : (parsed.passoAPasso || []),
              fileUrl: resolved.fileUrl,
              fileName: resolved.fileName,
              description: parsed.content || parsed.description || parsed.objetivo || parsed.descricao
            });
          }
        }
      }
    } catch (e) {}
  }

  // 2. Default POP for this SPECIFIC module ONLY
  const matchingDefaultKey = DEFAULT_POPS[normKey] ? normKey : DEFAULT_POPS[targetKey] ? targetKey : null;
  if (matchingDefaultKey && DEFAULT_POPS[matchingDefaultKey]) {
    const pop = DEFAULT_POPS[matchingDefaultKey];
    const itemId = `default-pop-${matchingDefaultKey}`;
    if (!addedIds.has(itemId) && !deletedSet.has(itemId)) {
      addedIds.add(itemId);
      const resolved = resolveSopFile(matchingDefaultKey, pop.fileUrl, pop.fileName || `${pop.code}.pdf`);
      result.push({
        id: itemId,
        code: pop.code,
        title: pop.title,
        displayName: `${pop.code} - ${pop.title}`,
        steps: pop.steps ? pop.steps.map(s => `${s.step}. ${s.title}: ${s.description}`) : [],
        fileUrl: resolved.fileUrl,
        fileName: resolved.fileName,
        description: pop.content || pop.objetivo
      });
    }
  }

  // 3. Central SOP documents strictly matching this module
  try {
    const allSops = getAllSops();
    for (const sop of allSops) {
      if (sop.status !== 'Ativo' || deletedSet.has(sop.id)) continue;
      const matches = sop.escopo === 'global' || (
        Array.isArray(sop.modulosVinculados) && (
          sop.modulosVinculados.includes(normKey as any) || 
          sop.modulosVinculados.includes(targetKey as any) ||
          sop.modulosVinculados.includes('central' as any) ||
          (normKey === 'armazem' && (sop.modulosVinculados.includes('efc' as any) || sop.modulosVinculados.includes('efd' as any) || sop.modulosVinculados.includes('efc_efd' as any))) ||
          ((normKey as string) === 'conferente' && (sop.modulosVinculados.includes('efc_efd' as any) || sop.modulosVinculados.includes('carregamento' as any) || sop.modulosVinculados.includes('despacho' as any)))
        )
      );

      if (matches && !addedIds.has(sop.id)) {
        addedIds.add(sop.id);
        const firstAnexo = sop.anexos?.[0];
        const resolved = resolveSopFile(sop.id, firstAnexo?.url, firstAnexo?.nome || `${sop.codigo}.pdf`);
        result.push({
          id: sop.id,
          code: sop.codigo,
          title: sop.nome,
          displayName: `${sop.codigo} - ${sop.nome}`,
          steps: sop.passoAPasso || [],
          fileUrl: resolved.fileUrl,
          fileName: resolved.fileName,
          description: sop.objetivo || sop.descricao
        });
      }
    }
  } catch (e) {}

  return result.filter(item => !deletedSet.has(item.id));
}

export function getSopForOperation(operation: string): { code?: string; title: string; steps: string[]; fileUrl?: string; fileName?: string; description?: string } {
  const normKey = (operation || 'repack').toLowerCase().trim() as OperationalModuleKey;

  const aliasMap: Record<string, OperationalModuleKey> = {
    repack: 'repack',
    despejo: 'despejo',
    armazem: 'armazem',
    logistica: 'armazem',
    fefo: 'validades',
    validades: 'validades',
    picking: 'picking',
    empilhador: 'empilhador',
    quebras: 'quebras',
    ressuprimento: 'ressuprimento',
    capacidade: 'capacidade',
    tmr: 'tmr',
    efc_efd: 'efc_efd',
    ressuprimento_reabastecimento: 'ressuprimento_reabastecimento'
  };
  const targetKey = aliasMap[normKey] || normKey;

  // 1. Direct POP document in localStorage for this specific sector key
  try {
    const rawSaved = localStorage.getItem(`af_pop_doc_${normKey}`) || localStorage.getItem(`af_pop_doc_${targetKey}`);
    if (rawSaved) {
      const parsed = JSON.parse(rawSaved);
      if (parsed.title || parsed.nome || parsed.fileUrl) {
        const resolved = resolveSopFile(normKey, parsed.fileUrl || (parsed.anexos?.[0]?.url), parsed.fileName || (parsed.anexos?.[0]?.nome));
        return {
          code: parsed.code,
          title: parsed.code ? `${parsed.code} - ${parsed.title || parsed.nome}` : (parsed.title || parsed.nome || 'Padrão Operacional'),
          steps: Array.isArray(parsed.steps) 
            ? parsed.steps.map((s: any) => typeof s === 'string' ? s : `${s.step || ''}. ${s.title}: ${s.description}`) 
            : (parsed.passoAPasso || []),
          fileUrl: resolved.fileUrl,
          fileName: resolved.fileName,
          description: parsed.content || parsed.description || parsed.objetivo || parsed.descricao
        };
      }
    }
  } catch (e) {}

  // 2. Direct match from DEFAULT_POPS for this specific module key
  if (DEFAULT_POPS[normKey] || DEFAULT_POPS[targetKey]) {
    const pop = DEFAULT_POPS[normKey] || DEFAULT_POPS[targetKey];
    const resolved = resolveSopFile(normKey, pop.fileUrl, pop.fileName);
    return {
      code: pop.code,
      title: `${pop.code} - ${pop.title}`,
      steps: pop.steps ? pop.steps.map(s => `${s.step}. ${s.title}: ${s.description}`) : [],
      fileUrl: resolved.fileUrl,
      fileName: resolved.fileName,
      description: pop.content || pop.objetivo
    };
  }

  // 3. Central SOP documents matching module specifically
  try {
    const allSops = getAllSops();
    const specificSop = allSops.find(sop => 
      sop.status === 'Ativo' && 
      Array.isArray(sop.modulosVinculados) && (
        sop.modulosVinculados.includes(normKey as any) || 
        sop.modulosVinculados.includes(targetKey as any)
      )
    );

    if (specificSop) {
      const firstAnexo = specificSop.anexos?.[0];
      const resolved = resolveSopFile(specificSop.id, firstAnexo?.url, firstAnexo?.nome);
      return {
        code: specificSop.codigo,
        title: `${specificSop.codigo} - ${specificSop.nome}`,
        steps: specificSop.passoAPasso || [],
        fileUrl: resolved.fileUrl,
        fileName: resolved.fileName,
        description: specificSop.objetivo || specificSop.descricao
      };
    }
  } catch (e) {}

  return {
    code: `POP-${operation.toUpperCase()}`,
    title: `POP Padronizado - Operação de ${operation.toUpperCase()}`,
    steps: [
      '1. Verificação prévia dos equipamentos e EPIs.',
      '2. Execução das rotinas seguindo o padrão operacional.',
      '3. Lançamento e conferência no sistema ao final do processo.'
    ]
  };
}

export function saveSopForOperation(operation: string, sopData: { title: string; steps: string[]; fileUrl?: string; fileName?: string }): void {
  const modMap: Record<string, SopModule> = {
    repack: 'repack',
    despejo: 'despejo',
    armazem: 'efc',
    logistica: 'carregamento',
    fefo: 'fefo',
    picking: 'picking'
  };
  const targetMod = modMap[operation] || 'repack';
  const newSop: SopDocument = {
    id: `sop-${operation}-${Date.now()}`,
    codigo: `POP-${operation.slice(0, 3).toUpperCase()}-01`,
    nome: sopData.title,
    objetivo: `Objetivo operacional do módulo ${operation}`,
    descricao: `Descrição detalhada do padrão ${sopData.title}`,
    passoAPasso: sopData.steps,
    fotos: [],
    videos: [],
    anexos: sopData.fileUrl ? [{ nome: sopData.fileName || 'Anexo', url: sopData.fileUrl }] : [],
    revisao: 'Rev 01',
    dataRevisao: new Date().toISOString().split('T')[0],
    responsavel: 'Coordenador Operacional',
    status: 'Ativo',
    escopo: 'exclusivo',
    modulosVinculados: [targetMod],
    historicoAlteracoes: [],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };

  saveOrUpdateSop(newSop, 'Sistema');
}

export function saveOrUpdateSop(sop: SopDocument, usuario: string): SopDocument {
  saveSopToIDB(sop).catch(() => {});

  const all = getAllSops();
  const existingIdx = all.findIndex(s => s.id === sop.id);
  const nowISO = new Date().toISOString();

  let finalSop: SopDocument;

  if (existingIdx >= 0) {
    const prev = all[existingIdx];
    const hasRevChange = prev.revisao !== sop.revisao || prev.nome !== sop.nome || prev.descricao !== sop.descricao;
    
    const newHistory: SopAlteracaoHistorico[] = [...(prev.historicoAlteracoes || [])];
    if (hasRevChange) {
      newHistory.unshift({
        id: `h-${Date.now()}`,
        data: new Date().toLocaleDateString('pt-BR'),
        alteracao: `Atualizado para ${sop.revisao}. Alteração realizada no sistema.`,
        usuario: usuario || 'Gestor',
        revisaoAnterior: prev.revisao
      });
    }

    finalSop = {
      ...sop,
      historicoAlteracoes: newHistory,
      atualizadoEm: nowISO
    };
    all[existingIdx] = finalSop;
  } else {
    finalSop = {
      ...sop,
      id: sop.id || `sop-${Date.now()}`,
      criadoEm: nowISO,
      atualizadoEm: nowISO,
      historicoAlteracoes: [
        {
          id: `h-${Date.now()}`,
          data: new Date().toLocaleDateString('pt-BR'),
          alteracao: `Criação inicial do padrão (${sop.revisao})`,
          usuario: usuario || 'Gestor'
        }
      ]
    };
    all.unshift(finalSop);
  }

  saveSopToIDB(finalSop).catch(() => {});
  saveAllSops(all);

  // Sync to individual af_pop_doc_ keys so SopBannerViewer & PadraoOperacionalModal receive instant updates
  try {
    const modulesToSync = finalSop.escopo === 'global' 
      ? SOP_MODULES_LIST.map(m => m.id)
      : (finalSop.modulosVinculados || []);

    const firstAnexo = finalSop.anexos?.[0];

    modulesToSync.forEach(modKey => {
      const popDocToSync = {
        title: finalSop.nome,
        code: finalSop.codigo,
        version: finalSop.revisao,
        lastUpdated: finalSop.dataRevisao,
        updatedBy: finalSop.responsavel,
        content: finalSop.descricao || finalSop.objetivo,
        safetyEPIs: ['Luvas Anticorte', 'Bota com Biqueira de Aço', 'Óculos de Proteção'],
        steps: (finalSop.passoAPasso || []).map((stepStr, i) => ({
          step: i + 1,
          title: `Passo ${i + 1}`,
          description: stepStr
        })),
        fileUrl: firstAnexo?.url,
        fileName: firstAnexo?.nome
      };
      try {
        localStorage.setItem(`af_pop_doc_${modKey}`, JSON.stringify(popDocToSync));
      } catch (e) {}
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('af_pop_updated', { detail: { sop: finalSop } }));
    }
  } catch (e) {
    console.error('Erro ao sincronizar af_pop_doc:', e);
  }

  return finalSop;
}

export function deleteSop(sopId: string): void {
  addDeletedSopId(sopId);
  deleteSopFromIDB(sopId).catch(() => {});

  const raw = localStorage.getItem(STORAGE_KEY_SOPS);
  if (raw) {
    try {
      const all: SopDocument[] = JSON.parse(raw);
      const sopToDelete = all.find(s => s.id === sopId);
      const filtered = all.filter(s => s.id !== sopId);
      saveAllSops(filtered);

      if (sopToDelete) {
        const modulesToClean = sopToDelete.escopo === 'global' 
          ? SOP_MODULES_LIST.map(m => m.id)
          : (sopToDelete.modulosVinculados || []);
        modulesToClean.forEach(modKey => {
          try {
            localStorage.removeItem(`af_pop_doc_${modKey}`);
          } catch (e) {}
        });
      }
    } catch (e) {}
  }

  if (sopId.startsWith('pop-doc-')) {
    const modKey = sopId.replace('pop-doc-', '');
    try {
      localStorage.removeItem(`af_pop_doc_${modKey}`);
    } catch (e) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('af_pop_updated', { detail: { deletedId: sopId } }));
  }
}

/**
 * Converts a base64 data URL (e.g. data:application/pdf;base64,...) to a Blob URL (blob:https://...)
 * Chrome blocks data:application/pdf URLs inside iframes/embeds/top-frame navigations for security reasons.
 * Blob URLs work seamlessly in modern browsers.
 */
export function createSafePdfBlobUrl(fileUrl: string): string {
  if (!fileUrl || fileUrl === '#' || fileUrl === 'about:blank') return '';
  if (fileUrl.startsWith('blob:')) return fileUrl;
  if (fileUrl.startsWith('data:')) {
    try {
      const parts = fileUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const b64Data = parts[1];
      if (!b64Data) return '';
      
      const byteCharacters = atob(b64Data);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      const blob = new Blob(byteArrays, { type: mime });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error('Failed to convert dataUrl to Blob:', err);
      return fileUrl;
    }
  }
  return fileUrl;
}

export function openPdfInNewTab(fileUrl: string, fileName: string = 'Padrao_Operacional.pdf', title?: string, code?: string): void {
  if (!fileUrl || fileUrl === '#' || fileUrl === 'about:blank') {
    alert('Documento PDF não possui anexo anexado ou está corrompido.');
    return;
  }
  
  // Dispatch global event for in-app viewer modal if registered
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('af_open_pdf_viewer', {
      detail: { url: fileUrl, fileName, title, code }
    }));
  }

  const safeUrl = createSafePdfBlobUrl(fileUrl);
  if (!safeUrl) return;

  // Open safe blob URL in target _blank without parent navigation
  try {
    const a = document.createElement('a');
    a.href = safeUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error('Erro ao abrir link do PDF:', e);
  }
}

export function downloadPdfFile(fileUrl: string, fileName: string = 'Padrao_Operacional.pdf'): void {
  if (!fileUrl || fileUrl === '#' || fileUrl === 'about:blank') return;
  const safeUrl = createSafePdfBlobUrl(fileUrl);
  if (!safeUrl) return;
  const a = document.createElement('a');
  a.href = safeUrl;
  a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function openOrDownloadGeneratedSopPdf(popData: any, isDownload: boolean = false): void {
  if (!popData) return;

  if (popData.fileUrl) {
    if (isDownload) {
      downloadPdfFile(popData.fileUrl, popData.fileName || `${popData.code || 'POP'}_Padrao_Operacional.pdf`);
    } else {
      openPdfInNewTab(popData.fileUrl, popData.fileName || `${popData.code || 'POP'}_Padrao_Operacional.pdf`);
    }
    return;
  }

  // Generate clean printable HTML view for browser PDF print/view
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${popData.code || 'POP'} - ${popData.title || 'Padrão Operacional'}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #fff; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
        .badge { background: #0284c7; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
        .title { font-size: 18px; font-weight: 800; text-transform: uppercase; margin-top: 4px; color: #0f172a; }
        .meta { font-size: 11px; color: #64748b; }
        .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .box-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0369a1; margin-bottom: 6px; }
        .epis { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .epi-tag { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; }
        .step { display: flex; gap: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 8px; }
        .step-num { width: 24px; height: 24px; background: #0284c7; color: white; border-radius: 6px; font-weight: bold; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .step-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .step-desc { font-size: 11px; color: #334155; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
        th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 10px; }
        .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: bold; text-transform: uppercase; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; display: flex; gap: 8px;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
          🖨️ Imprimir / Salvar como PDF
        </button>
      </div>

      <div class="header">
        <div>
          <span class="badge">${popData.code || 'POP-01'}</span>
          <span class="meta" style="margin-left: 8px;">Versão v${popData.version || '01'} | Atualizado em: ${popData.lastUpdated || ''}</span>
          <div class="title">${popData.title || 'Padrão Operacional'}</div>
        </div>
        <div style="text-align: right;" class="meta">
          <strong>SISTEMA DE QUALIDADE & SEGURANÇA AMBEV</strong><br>
          ${popData.updatedBy || 'Pau Brasil Guarabira'}
        </div>
      </div>

      ${popData.objetivo ? `
        <div class="box">
          <div class="box-title">🎯 Objetivo do Processo</div>
          <div style="font-size: 12px; color: #1e293b;">${popData.objetivo}</div>
        </div>
      ` : ''}

      ${popData.content ? `
        <div class="box">
          <div class="box-title">📋 Resumo do Padrão</div>
          <div style="font-size: 11px; color: #334155;">${popData.content}</div>
        </div>
      ` : ''}

      ${popData.safetyEPIs && popData.safetyEPIs.length > 0 ? `
        <div class="box">
          <div class="box-title">🛡️ Equipamentos de Proteção Obrigatórios (EPIs)</div>
          <div class="epis">
            ${popData.safetyEPIs.map((epi: string) => `<span class="epi-tag">✓ ${epi}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      ${popData.steps && popData.steps.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <div class="box-title">📝 Passo a Passo Operacional Padrão</div>
          ${popData.steps.map((s: any) => `
            <div class="step">
              <div class="step-num">${s.step}</div>
              <div>
                <div class="step-title">${s.title}</div>
                <div class="step-desc">${s.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${popData.raciTable && popData.raciTable.length > 0 ? `
        <div style="margin-bottom: 16px;">
          <div class="box-title">👥 Matriz RACI do Processo</div>
          <table>
            <thead>
              <tr>
                <th>Atividade / Etapa</th>
                ${popData.raciTable[0].god !== undefined ? '<th>GOD</th>' : ''}
                ${popData.raciTable[0].coa !== undefined ? '<th>COA</th>' : ''}
                ${popData.raciTable[0].tst !== undefined ? '<th>TST</th>' : ''}
                ${popData.raciTable[0].analista !== undefined ? '<th>Analista</th>' : ''}
                ${popData.raciTable[0].conferente !== undefined ? '<th>Conf.</th>' : ''}
                ${popData.raciTable[0].empilhador !== undefined ? '<th>Empilh.</th>' : ''}
                ${popData.raciTable[0].ajudante !== undefined ? '<th>Ajud.</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${popData.raciTable.map((row: any) => `
                <tr>
                  <td>${row.atividade}</td>
                  ${row.god !== undefined ? `<td>${row.god || '-'}</td>` : ''}
                  ${row.coa !== undefined ? `<td>${row.coa || '-'}</td>` : ''}
                  ${row.tst !== undefined ? `<td>${row.tst || '-'}</td>` : ''}
                  ${row.analista !== undefined ? `<td>${row.analista || '-'}</td>` : ''}
                  ${row.conferente !== undefined ? `<td>${row.conferente || '-'}</td>` : ''}
                  ${row.empilhador !== undefined ? `<td>${row.empilhador || '-'}</td>` : ''}
                  ${row.ajudante !== undefined ? `<td>${row.ajudante || '-'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="footer">
        Documento Oficial de Padrão Operacional - Qualidade & Segurança Ambev
      </div>

      <script>
        ${isDownload ? 'window.onload = function() { window.print(); };' : ''}
      </script>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}


