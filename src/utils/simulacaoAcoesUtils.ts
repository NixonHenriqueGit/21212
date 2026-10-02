import { firestoreDb } from '../database/firestoreDatabase';
import { getOfficialSeededAcoes } from '../data/acoesOficiaisDataset';

// Requirement 26, 27, 28, 31 & 32: Auto Action Generator, Simulated Action Database (280+ items), FEFO/Loss Specific Actions, and Multi-Database Isolation.

export interface AuditTrailEntry {
  dataHora: string;
  usuario: string;
  alteracao: string;
}

export interface CincoPorques {
  porque1: string;
  porque2: string;
  porque3: string;
  porque4: string;
  porque5: string;
}

export interface AcaoCorretiva {
  id: string;
  data: string; // DD/MM/YYYY
  dataISO: string; // YYYY-MM-DD
  hora: string; // HH:MM
  processo: 
    | 'Repack'
    | 'Despejo'
    | 'EFC'
    | 'EFD'
    | 'Picking'
    | 'Gestão de Capacidade'
    | 'Gestão de Quebras'
    | 'Gestão FEFO'
    | 'Estoque x Estoque'
    | 'Estoque x Picking'
    | 'Ressuprimento'
    | 'Recebimento'
    | 'Carregamento'
    | 'Marketplace';
  setor: string;
  colaboradorResponsavel: string;
  indicador: string;
  meta: string;
  resultadoObtido: string;
  desvioEncontrado: string;
  causaRaiz: 'Método' | 'Mão de Obra' | 'Máquina' | 'Material';
  causaRaizDetalhe?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado' | 'Reaberto';
  responsavelTratativa: string; // Supervisor/Gestor
  prazo: string; // YYYY-MM-DD
  evidencias?: string;
  comentarioOperador: string;
  historicoAlteracoes: AuditTrailEntry[];
  simulado: boolean;
  criadoEm: string;

  // Requirement 33, 34 & 35: Governance & Standardization
  tipoAcao: 'Corretiva' | 'Melhoria';
  prioridade: 'Alta' | 'Média' | 'Baixa';
  cincoPorques?: CincoPorques;
  contramedida?: string;
  aprovacaoGestor?: 'Pendente' | 'Aprovado' | 'Rejeitado';
  aceiteColaborador?: boolean; // "Li e estou de acordo"
  impactoEsperado?: string;
  situacaoMeta?: 'Atingida' | 'Em Risco' | 'Perdida' | 'Tendência de Queda';
  
  // Requirement 38: RLP Actions
  isRlp?: boolean;
  areaRlp?: 'Logística' | 'Comercial' | 'Planejamento' | 'Operação';
  tendenciaProjecao?: string;

  // Requirement 28: Specific fields for FEFO and Quebras (Loss & Expiration)
  isFefoOuQuebra?: boolean;
  produto?: string;
  codigoProduto?: string;
  lote?: string;
  validade?: string;
  quantidade?: number;
  localizacao?: string;
  supervisor?: string;
  motivoOcorrencia?: string;
  impactoFinanceiro?: number;
  hlPerdido?: number;
  planoAcao?: string;

  // New fields for Delay Justification, Rescheduling & Execution Tracking
  justificativaAtraso?: string;
  prazoOriginal?: string;
  dataReagendada?: string;
  reagendadoCount?: number;
  dataInicioExecucao?: string;
  concluidoNoPrazo?: boolean;

  // Audit of opening and closing users
  abertoPor?: string; // Nome e cargo do usuário que criou/abriu a ação
  dataAbertura?: string; // Data e hora de abertura
  fechadoPor?: string; // Nome e cargo do usuário que concluiu/fechou a ação
  dataFechamento?: string; // Data e hora do fechamento

  // Custom fields for imported retroactions (matching spreadsheet template)
  area?: string; // Área (ex: Armazém)
  reuniao?: string; // Reunião (ex: RPS ARMAZEM)
  onde?: string; // Onde (ex: Guarabira)
  inicio?: string; // Data Início (DD/MM/YYYY)
  final?: string; // Data Final (DD/MM/YYYY)
  obsResponsavel?: string; // Obs do Responsável
  etapasVerificacao?: (string | { id: string; texto: string; concluida: boolean })[]; // Etapas de verificação e checklist
}

export interface EtapaVerificacaoAcao {
  id: string;
  texto: string;
  concluida: boolean;
}

export type DatabaseMode = 'simulado' | 'operacional' | 'historico';

const STORAGE_KEY_SIMULADO = 'af_banco_simulado_acoes_2026';
const STORAGE_KEY_OPERACIONAL = 'af_banco_operacional_acoes';
const STORAGE_KEY_HISTORICO = 'af_banco_historico_acoes';
const STORAGE_KEY_ACTIVE_MODE = 'af_banco_ativo_modo';

export const MODULES_LIST: AcaoCorretiva['processo'][] = [
  'Repack',
  'Despejo',
  'EFC',
  'EFD',
  'Picking',
  'Gestão de Capacidade',
  'Gestão de Quebras',
  'Gestão FEFO',
  'Estoque x Estoque',
  'Estoque x Picking',
  'Ressuprimento',
  'Recebimento',
  'Carregamento',
  'Marketplace'
];

const COLABORADORES = [
  'Carlos Silva (Operador)',
  'Fernanda Lima (Ajudante)',
  'Roberto Souza (Conferente)',
  'Aline Mendes (Empilhador)',
  'Marcos Oliveira (Operador)',
  'Juliana Costa (Conferente)',
  'Paulo Santos (Ajudante)',
  'Gilson Ferreira (Empilhador)',
  'Matheus Barbosa (Líder)',
  'Ronildo Paiva (Operador)',
  'Ozenildo Silva (Técnico)'
];

const SUPERVISORES = [
  'João Paulo (Supervisor Pátio)',
  'Mariana Alves (Coordenadora Logística)',
  'Luciano Santos (Gestor de Processos)',
  'Eduardo Rocha (Supervisor Qualidade)',
  'Beatriz Souza (Supervisora VPO)'
];

const SETORES = [
  'Armazém 01', 'Armazém 02', 'Doca de Recebimento', 'Doca de Expedição',
  'Pátio Central', 'Corredor de Picking', 'Área de Devolução', 'Linha 1 Repack',
  'Área de Despejo', 'Estoque Aéreo', 'Setor de Blister', 'Área de Contingência'
];

const CAUSAS: AcaoCorretiva['causaRaiz'][] = ['Método', 'Mão de Obra', 'Máquina', 'Material'];

const COMMENT_EXAMPLES: Record<string, string[]> = {
  Repack: [
    "Faltou caixa de papelão nova para repaciar lata trincada.",
    "Bancada 2 estava desorganizada no início do turno.",
    "Empilhadeira demorou para trazer o lote avariado.",
    "Fita adesiva acabou durante o processo e demorou para repor."
  ],
  Despejo: [
    "Canaleta de drenagem de líquidos entupiu no meio da operação.",
    "Mesa de apoio ergonômica estava ocupada por outro palete.",
    "Caixa de garrafas de 600ml caiu ao manipular garra manual.",
    "Atraso no escoamento de resíduos por acúmulo no container."
  ],
  EFC: [
    "Atraso no fechamento do faturamento na cabine central.",
    "Impressora de etiquetas de conferência travou.",
    "Palete não estava identificado no endereço de expedição.",
    "Rádio do conferente estava sem bateria."
  ],
  EFD: [
    "Caminhão de transferência chegou com 40min de atraso.",
    "Divergência entre o manifesto impresso e o coletor.",
    "Falta de ajudante para descarregar caixas soltas.",
    "Avaria de 2 fardos no baú do caminhão."
  ],
  Picking: [
    "Falta de palete de Brahma 350ml na frente terrestre.",
    "Corredor de picking bloqueado por paleteira quebrada.",
    "Conferente identificou erro de contagem na caixa 14.",
    "Etiqueta de posição ilegível na gôndola B3."
  ],
  'Gestão de Capacidade': [
    "Excesso de ocupação no Armazém 1 atingiu 96% de limite.",
    "Falta de espaço para alocar caminhão de fábrica D0.",
    "Corredor 4 congestionado impedindo manobra da empilhadeira.",
    "Demora na liberação de paletes vazios para a fábrica."
  ],
  'Gestão de Quebras': [
    "Queda de caixa de garrafa retornável durante a curva.",
    "Choque de garra da empilhadeira no canto do palete.",
    "Lata perfurada por prego saliente no palete de madeira.",
    "Avaria por empilhamento excessivo no piso 3."
  ],
  'Gestão FEFO': [
    "Palete com lote de vencimento próximo (15 dias) não foi puxado.",
    "Falta de etiqueta de semáforo amarelo no palete A-04.",
    "Operador pegou lote mais novo por facilidade de acesso.",
    "Divergência entre a data sistêmica e a data impressa na caixa."
  ],
  'Estoque x Estoque': [
    "Contagem física divergente em 8 caixas no endereço E-12.",
    "Palete movimentado sem registrar baixa no sistema.",
    "Código de barras lido incorretamente no inventário rotativo.",
    "Troca inadvertida de SKU no mesmo nicho de armazenagem."
  ],
  'Estoque x Picking': [
    "Falta de produto no picking enquanto constava 50 CX no saldo.",
    "Reabastecimento efetuado com SKU incorreto no Picking 2.",
    "Divergência entre saldo aéreo e posição terrestre.",
    "Caixa avariada não foi deduzida do saldo ativo de picking."
  ],
  Ressuprimento: [
    "Tempo de atendimento de reabastecimento excedeu 15 minutos.",
    "Empilhador priorizou descarga de fábrica em vez do picking.",
    "Solicitação de ressuprimento feita em cima da hora pelo conferente.",
    "Endereço aéreo estava bloqueado por palete de terceiro."
  ],
  Recebimento: [
    "Carreta da fábrica chegou com lacre rompido sem ressalva.",
    "Demora de 1h30 na liberação do laudo de qualidade pela fábrica.",
    "Avarias de transporte encontradas no fundo do baú.",
    "Falta de paleteiro disponível para descarregar."
  ],
  Carregamento: [
    "Atraso na montagem da rota por falta de produto no picking.",
    "Motorista de rota ausente no horário de início da doca.",
    "Lona do caminhão rasgada impedindo carregamento seguro.",
    "Conferência final indicou 1 caixa a mais do que o mapa."
  ],
  Marketplace: [
    "Pedido de e-commerce não localizado no escaninho.",
    "Caixa de e-commerce amassada durante a embalagem final.",
    "Atraso na coleta da transportadora parceira.",
    "Etiqueta de postagem com código de barras borrado."
  ]
};

// Requirement 32: Get current Database Mode
export function getActiveDatabaseMode(): DatabaseMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_MODE) as DatabaseMode;
    if (saved === 'simulado' || saved === 'operacional' || saved === 'historico') {
      return saved;
    }
  } catch (e) {}
  return 'simulado'; // Default to simulated for demo environment
}

export function setActiveDatabaseMode(mode: DatabaseMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_MODE, mode);
  } catch (e) {
    console.error('Error setting database mode:', e);
  }
}

// Requirement 27 & 32: Generate simulated database containing 20+ records per module from Jan 1, 2026 to current date
export function generateFullSimulatedDatabase2026(): AcaoCorretiva[] {
  const records: AcaoCorretiva[] = [];
  const startDate = new Date(2026, 0, 1); // 2026-01-01
  const endDate = new Date(2026, 6, 29); // 2026-07-29
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let globalCounter = 1;

  MODULES_LIST.forEach((modulo) => {
    // Generate 20 records per module
    for (let i = 0; i < 20; i++) {
      const dayOffset = Math.floor((i / 20) * totalDays) + Math.floor(Math.random() * 3);
      const currDate = new Date(startDate.getTime() + Math.min(dayOffset, totalDays) * 24 * 60 * 60 * 1000);

      const dStr = currDate.toLocaleDateString('pt-BR');
      const dISO = currDate.toISOString().split('T')[0];
      const hStr = `${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 12) % 60).padStart(2, '0')}`;

      const colab = COLABORADORES[i % COLABORADORES.length];
      const superv = SUPERVISORES[i % SUPERVISORES.length];
      const setor = SETORES[i % SETORES.length];
      const causa = CAUSAS[i % CAUSAS.length];
      
      const comments = COMMENT_EXAMPLES[modulo] || COMMENT_EXAMPLES['Repack'];
      const comment = comments[i % comments.length];

      const isFefoQuebraModule = (
        modulo === 'Gestão FEFO' || 
        modulo === 'Gestão de Quebras' || 
        modulo === 'Estoque x Estoque' || 
        modulo === 'Estoque x Picking' || 
        modulo === 'Despejo'
      );

      const statusOptions: AcaoCorretiva['status'][] = ['Concluído', 'Em Andamento', 'Pendente', 'Atrasado', 'Concluído'];
      const status = statusOptions[i % statusOptions.length];

      const deadlineDate = new Date(currDate.getTime() + (3 + (i % 5)) * 24 * 60 * 60 * 1000);
      const deadlineISO = deadlineDate.toISOString().split('T')[0];

      const skuCodes = ['0001010', '0001015', '0002030', '0003045', '0004010', '0005020'];
      const skuNames = ['Brahma Chopp 350ml', 'Skol Pilsen 600ml', 'Antarctica Boa 300ml', 'Stella Artois 330ml', 'Guaraná Antarctica 2L', 'Budweiser 473ml'];
      const skuIndex = i % skuCodes.length;

      const isMelhoria = i % 4 === 3; // 25% Ações de Melhoria preventivas, 75% Ações Corretivas por desvio
      const prioridade: AcaoCorretiva['prioridade'] = i % 3 === 0 ? 'Alta' : i % 3 === 1 ? 'Média' : 'Baixa';

      const record: AcaoCorretiva = {
        id: `acao-2026-${String(globalCounter).padStart(4, '0')}`,
        data: dStr,
        dataISO: dISO,
        hora: hStr,
        processo: modulo,
        setor,
        colaboradorResponsavel: colab,
        indicador: `Indicador de Conformidade Operacional (${modulo})`,
        meta: modulo.includes('Quebras') ? '0.50% max' : modulo.includes('FEFO') ? '100% FEFO' : 'Meta Diária 100%',
        resultadoObtido: modulo.includes('Quebras') ? '1.85%' : modulo.includes('FEFO') ? '78.5%' : '82.0%',
        desvioEncontrado: isMelhoria 
          ? `Alerta Preventivo: Tendência de queda de performance nas últimas 3 semanas em ${modulo}` 
          : `Desvio identificado no processo de ${modulo}: ${comment}`,
        causaRaiz: causa,
        causaRaizDetalhe: `Falha técnica/operacional no fator ${causa}.`,
        status,
        responsavelTratativa: superv,
        prazo: deadlineISO,
        evidencias: `Evidência registrada via aplicativo em ${dStr} - Foto e Registro #${globalCounter}`,
        comentarioOperador: comment,
        simulado: true,
        criadoEm: currDate.toISOString(),

        // Requirements 33, 34 & 35: Governance & 5 Whys Flow
        tipoAcao: isMelhoria ? 'Melhoria' : 'Corretiva',
        prioridade,
        cincoPorques: {
          porque1: `Por que o indicador de ${modulo} desviou? Devido a gargalos operacionais no setor ${setor}.`,
          porque2: `Por que houve gargalo no setor? O tempo de ciclo aumentou durante o turno.`,
          porque3: `Por que o tempo de ciclo aumentou? Falta de insumos e alocação inadequada de equipe.`,
          porque4: `Por que faltou insumo/equipe? Atraso no reabastecimento preventivo e ausência de operador.`,
          porque5: `Por que não houve reabastecimento preventivo? Falha no checklist inicial e na ordenação da fila.`
        },
        contramedida: isMelhoria 
          ? `Implantar rotina de reabastecimento antecipado e reforço de treinamento no turno.` 
          : `Ajuste imediato de fluxo, isolamento de lote e alocação de conferente dedicado.`,
        aprovacaoGestor: status === 'Concluído' ? 'Aprovado' : 'Pendente',
        aceiteColaborador: status === 'Concluído',
        impactoEsperado: isMelhoria ? 'Evitar perda da meta mensal (+3.5% de recuperação)' : 'Eliminar desvio e atingir 100% da meta diária',
        situacaoMeta: isMelhoria ? 'Tendência de Queda' : status === 'Concluído' ? 'Atingida' : 'Perdida',
        
        ...(i % 5 === 0 ? {
          isRlp: true,
          areaRlp: (['Logística', 'Comercial', 'Planejamento', 'Operação'] as const)[i % 4],
          tendenciaProjecao: `Projeção quinzenal indicava perda de meta se a intervenção não fosse realizada.`
        } : {}),

        historicoAlteracoes: [
          {
            dataHora: `${dStr} ${hStr}`,
            usuario: 'Sistema de Governança Integrada',
            alteracao: isMelhoria 
              ? 'Ação de Melhoria Preventiva gerada por análise automática de tendência.' 
              : 'Ação Corretiva gerada automaticamente por desvio com formulário de 5 Porquês.'
          },
          ...(status === 'Concluído' ? [{
            dataHora: `${deadlineDate.toLocaleDateString('pt-BR')} 16:30`,
            usuario: superv,
            alteracao: 'Ação validada pelo gestor, evidência anexada e termo "Li e estou de acordo" assinado pelo operador.'
          }] : [])
        ],

        // Specific fields for Req 28
        ...(isFefoQuebraModule ? {
          isFefoOuQuebra: true,
          produto: skuNames[skuIndex],
          codigoProduto: skuCodes[skuIndex],
          lote: `LOTE-2026-${100 + i}`,
          validade: new Date(2026, 8, 15 + i).toLocaleDateString('pt-BR'),
          quantidade: 10 + (i * 3),
          localizacao: `Posição ${String.fromCharCode(65 + (i % 6))}-${10 + i}`,
          supervisor: superv,
          motivoOcorrencia: comment,
          impactoFinanceiro: (10 + (i * 3)) * 48.5,
          hlPerdido: Math.round(((10 + (i * 3)) * 0.084) * 100) / 100,
          planoAcao: `Executar isolamento do lote, reciclagem da equipe e ajuste no coletor WMS.`
        } : {})
      };

      records.push(record);
      globalCounter++;
    }
  });

  return records;
}

// UNIFIED STORAGE KEYS FROM DASHBOARDS
export const UNIFIED_ACOES_DPO_KEY = 'af_acoes_dpo_unificadas_2026';
export const MONTAGEM_ACOES_KEY = 'af_acoes_montagem_fastpicking';
export const DESVIOS_ACOES_KEY = 'af_acoes_desvios_gatilhos_v1';
export const MELHORIAS_ACOES_KEY = 'af_acoes_melhorias_tor_v1';

// Helper to normalize any dashboard action item into standard AcaoCorretiva
export function normalizeToActionCorretiva(item: any): AcaoCorretiva | null {
  if (!item || !item.id) return null;

  // Check if this is an old mock seed item (e.g. acao-2026-0001 from old generator)
  const isOldMockSeed = typeof item.id === 'string' && item.id.startsWith('acao-2026-') && !item.id.startsWith('ACAO_2026_');
  if (isOldMockSeed) return null;

  const now = new Date();
  const defaultDateISO = now.toISOString().split('T')[0];
  const defaultDateStr = now.toLocaleDateString('pt-BR');

  // Date resolution
  let dataISO = item.dataISO || item.dataInicio || item.inicio || defaultDateISO;
  let dataStr = item.data || defaultDateStr;
  if (!dataStr && dataISO) {
    try {
      const parts = dataISO.split('-');
      if (parts.length === 3) {
        dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (e) {
      dataStr = defaultDateStr;
    }
  }

  // Process resolution
  let processo: AcaoCorretiva['processo'] = 'Picking';
  const rawProc = String(item.processo || item.area || '').trim();
  if (rawProc.toLowerCase().includes('repack')) processo = 'Repack';
  else if (rawProc.toLowerCase().includes('despejo')) processo = 'Despejo';
  else if (rawProc.toLowerCase().includes('quebra') || rawProc.toLowerCase().includes('avaria') || rawProc.toLowerCase().includes('qualidade')) processo = 'Gestão de Quebras';
  else if (rawProc.toLowerCase().includes('fefo') || rawProc.toLowerCase().includes('validade')) processo = 'Gestão FEFO';
  else if (rawProc.toLowerCase().includes('capacidade') || rawProc.toLowerCase().includes('armazen') || rawProc.toLowerCase().includes('layout')) processo = 'Gestão de Capacidade';
  else if (rawProc.toLowerCase().includes('picking')) processo = 'Picking';
  else if (rawProc.toLowerCase().includes('montagem')) processo = 'Picking';
  else if (rawProc.toLowerCase().includes('wlp') || rawProc.toLowerCase().includes('pnp')) processo = 'EFC';
  else if (rawProc.toLowerCase().includes('tmr') || rawProc.toLowerCase().includes('recebimento')) processo = 'Recebimento';
  else if (rawProc.toLowerCase().includes('carregamento') || rawProc.toLowerCase().includes('expedi')) processo = 'Carregamento';
  else if (rawProc.toLowerCase().includes('marketplace') || rawProc.toLowerCase().includes('ecommerce')) processo = 'Marketplace';
  else if (rawProc.toLowerCase().includes('ressuprimento')) processo = 'Ressuprimento';
  else if (rawProc.toLowerCase().includes('efd')) processo = 'EFD';
  else if (rawProc.toLowerCase().includes('efc')) processo = 'EFC';
  else if (rawProc.toLowerCase().includes('estoque')) processo = 'Estoque x Estoque';
  else {
    processo = classifyProcessFromActionFields({
      indicador: item.indicador || item.indicadorBeneficiado,
      oQueFazer: item.oQueFazer || item.oQueSeraFeito || item.desvioEncontrado,
      acao: item.resolucao || item.contramedida || item.comoExecutar,
      onde: item.local || item.setor || item.ondeLocal,
      area: item.area || item.pilarDPO,
      reuniao: item.reuniao || item.reuniaoTOR
    });
  }

  // Type resolution
  let tipoAcao: AcaoCorretiva['tipoAcao'] = 'Corretiva';
  const rawTipo = String(item.tipoAcao || item.tipo || '').toLowerCase();
  if (rawTipo.includes('melhoria')) tipoAcao = 'Melhoria';
  else if (rawTipo.includes('rotina')) tipoAcao = 'Corretiva'; // Treated as operational routine in governance
  else tipoAcao = 'Corretiva';

  // Priority / Criticidade resolution
  let prioridade: AcaoCorretiva['prioridade'] = 'Alta';
  const rawCrit = String(item.prioridade || item.criticidade || item.severidade || '').toLowerCase();
  if (rawCrit.includes('baixa') || rawCrit.includes('p3')) prioridade = 'Baixa';
  else if (rawCrit.includes('média') || rawCrit.includes('media') || rawCrit.includes('p2')) prioridade = 'Média';
  else prioridade = 'Alta';

  // Status resolution
  let status: AcaoCorretiva['status'] = 'Pendente';
  const rawStatus = String(item.status || item.statusTOR || '').toLowerCase();
  if (rawStatus.includes('conclu') || rawStatus.includes('validado') || rawStatus.includes('padronizada')) status = 'Concluído';
  else if (rawStatus.includes('andamento') || rawStatus.includes('execução') || rawStatus.includes('teste')) status = 'Em Andamento';
  else if (rawStatus.includes('atrasad')) status = 'Atrasado';
  else status = 'Pendente';

  const desvio = item.desvioEncontrado || item.oQueFazer || item.tituloMelhoria || item.oportunidadeIdentificada || 'Ocorrência registrada no dashboard';
  const contramedida = item.contramedida || item.resolucao || item.comoExecutar || item.oQueSeraFeito || '';
  const indicador = item.indicador || item.indicadorBeneficiado || `Indicador Operacional (${processo})`;
  const responsavel = item.colaboradorResponsavel || item.responsavel || item.responsavelPrincipal || item.responsavelTratativa || 'Operador Responsável';
  const supervisor = item.responsavelTratativa || item.supervisor || item.abertoPor || item.registradoPor || 'Supervisor de Operações';
  const setor = item.setor || item.local || item.ondeLocal || 'Armazém / Operações';
  const prazo = item.prazo || item.dataTermino || item.prazoImplantacao || item.final || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

  return {
    id: String(item.id),
    data: dataStr,
    dataISO,
    hora: item.hora || '08:00',
    processo,
    setor,
    colaboradorResponsavel: responsavel,
    indicador,
    meta: item.meta || item.metaMelhoria || '100% Executado no Padrão DPO',
    resultadoObtido: item.resultadoObtido || 'Desvio identificado na rotina',
    desvioEncontrado: desvio,
    causaRaiz: item.causaRaiz || item.causaRaiz4M || 'Método',
    causaRaizDetalhe: item.causaRaizDetalhe || '',
    status,
    responsavelTratativa: supervisor,
    prazo,
    evidencias: item.evidencias || '',
    comentarioOperador: item.comentarioOperador || desvio,
    historicoAlteracoes: item.historicoAlteracoes || [{
      dataHora: `${dataStr} 08:00`,
      usuario: supervisor,
      alteracao: `Ação (${tipoAcao}) unificada do dashboard ${processo}.`
    }],
    simulado: false,
    criadoEm: item.criadoEm || `${dataISO}T08:00:00.000Z`,
    tipoAcao,
    prioridade,
    cincoPorques: item.cincoPorques ? {
      porque1: item.cincoPorques.porque1 || item.cincoPorques.pq1 || '',
      porque2: item.cincoPorques.porque2 || item.cincoPorques.pq2 || '',
      porque3: item.cincoPorques.porque3 || item.cincoPorques.pq3 || '',
      porque4: item.cincoPorques.porque4 || item.cincoPorques.pq4 || '',
      porque5: item.cincoPorques.porque5 || item.cincoPorques.pq5 || ''
    } : {
      porque1: `Por que ocorreu o desvio? ${desvio.substring(0, 70)}`,
      porque2: '',
      porque3: '',
      porque4: '',
      porque5: ''
    },
    contramedida,
    aprovacaoGestor: item.aprovacaoGestor || (status === 'Concluído' ? 'Aprovado' : 'Pendente'),
    aceiteColaborador: item.aceiteColaborador !== undefined ? item.aceiteColaborador : (status === 'Concluído'),
    impactoEsperado: item.impactoEsperado || item.ganhoEsperado || 'Normalização imediata do processo',
    situacaoMeta: item.situacaoMeta || (status === 'Concluído' ? 'Atingida' : 'Em Risco'),
    etapasVerificacao: item.etapasVerificacao,
    produto: item.produto,
    codigoProduto: item.codigoProduto,
    lote: item.lote,
    validade: item.validade
  };
}

export function isSystemGeneratedOrSimulatedAction(item: any): boolean {
  if (!item) return true;
  // Only remove explicit temporary mock test dummy seeds
  if (item.isMockPlaceholderSeed === true) return true;
  const idStr = String(item.id || '').toLowerCase();
  if (idStr.startsWith('mock-seed-dummy-')) return true;
  return false;
}

// Get all actions unified from platform dashboards (strictly user-created and dashboard-generated actions)
export function getAcoesAll(specificMode?: DatabaseMode): AcaoCorretiva[] {
  const mergedMap = new Map<string, AcaoCorretiva>();

  // 1. Load from UNIFIED_ACOES_DPO_KEY (QuadroAcoesDpo across all dashboards)
  try {
    const rawUnified = localStorage.getItem(UNIFIED_ACOES_DPO_KEY);
    if (rawUnified) {
      const parsed = JSON.parse(rawUnified);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!isSystemGeneratedOrSimulatedAction(item)) {
            const norm = normalizeToActionCorretiva(item);
            if (norm && norm.id && !isSystemGeneratedOrSimulatedAction(norm)) {
              mergedMap.set(norm.id, norm);
            }
          }
        });
      }
    }
  } catch (e) {
    console.error('Error loading unified dashboard actions:', e);
  }

  // 1.1 Also load from UNIFIED_ACOES_STORAGE_KEY if present
  try {
    const rawUnifiedStorage = localStorage.getItem('af_acoes_dpo_unificadas_2026');
    if (rawUnifiedStorage) {
      const parsed = JSON.parse(rawUnifiedStorage);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!isSystemGeneratedOrSimulatedAction(item)) {
            const norm = normalizeToActionCorretiva(item);
            if (norm && norm.id && !isSystemGeneratedOrSimulatedAction(norm)) {
              mergedMap.set(norm.id, norm);
            }
          }
        });
      }
    }
  } catch (e) {}

  // 2. Load from Montagem / FastPicking
  try {
    const rawMont = localStorage.getItem(MONTAGEM_ACOES_KEY);
    if (rawMont) {
      const parsed = JSON.parse(rawMont);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!isSystemGeneratedOrSimulatedAction(item)) {
            const norm = normalizeToActionCorretiva(item);
            if (norm && norm.id && !isSystemGeneratedOrSimulatedAction(norm)) {
              mergedMap.set(norm.id, norm);
            }
          }
        });
      }
    }
  } catch (e) {}

  // 3. Load from Desvios / Gatilhos
  try {
    const rawDesvios = localStorage.getItem(DESVIOS_ACOES_KEY);
    if (rawDesvios) {
      const parsed = JSON.parse(rawDesvios);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!isSystemGeneratedOrSimulatedAction(item)) {
            const norm = normalizeToActionCorretiva(item);
            if (norm && norm.id && !isSystemGeneratedOrSimulatedAction(norm)) {
              mergedMap.set(norm.id, norm);
            }
          }
        });
      }
    }
  } catch (e) {}

  // 4. Load from Melhorias / TOR
  try {
    const rawMelhorias = localStorage.getItem(MELHORIAS_ACOES_KEY);
    if (rawMelhorias) {
      const parsed = JSON.parse(rawMelhorias);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (!isSystemGeneratedOrSimulatedAction(item)) {
            const norm = normalizeToActionCorretiva(item);
            if (norm && norm.id && !isSystemGeneratedOrSimulatedAction(norm)) {
              mergedMap.set(norm.id, norm);
            }
          }
        });
      }
    }
  } catch (e) {}

  // 5. Load user-created operational actions from storage
  const storageKeys = [STORAGE_KEY_OPERACIONAL, STORAGE_KEY_SIMULADO];
  storageKeys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (!isSystemGeneratedOrSimulatedAction(item)) {
              const norm = normalizeToActionCorretiva(item);
              if (norm && norm.id && !isSystemGeneratedOrSimulatedAction(norm)) {
                mergedMap.set(norm.id, norm);
              }
            }
          });
        }
      }
    } catch (e) {}
  });

  return Array.from(mergedMap.values());
}

/**
 * Classificação inteligente e otimizada de processos para distribuição nos respectivos dashboards
 * Analisa: indicador, o que fazer, ação contramedida, onde, área e reunião
 */
export function classifyProcessFromActionFields(fields: {
  indicador?: string;
  oQueFazer?: string;
  acao?: string;
  onde?: string;
  area?: string;
  reuniao?: string;
}): AcaoCorretiva['processo'] {
  const ind = (fields.indicador || '').toLowerCase().trim();
  const oq = (fields.oQueFazer || '').toLowerCase().trim();
  const ac = (fields.acao || '').toLowerCase().trim();
  const onde = (fields.onde || '').toLowerCase().trim();
  const area = (fields.area || '').toLowerCase().trim();
  const reuniao = (fields.reuniao || '').toLowerCase().trim();
  
  const allText = `${ind} ${oq} ${ac} ${onde} ${area} ${reuniao}`.toLowerCase();

  // 1. REPACK: Menções de repack nos indicadores ou textos vão para o Repack
  if (ind.includes('repack') || oq.includes('repack') || onde.includes('repack') || ac.includes('repack') || area.includes('repack')) {
    return 'Repack';
  }

  // 2. DESPEJO: Menções de despejo nos indicadores ou textos vão para o Despejo
  if (ind.includes('despejo') || oq.includes('despejo') || onde.includes('despejo') || ac.includes('despejo') || area.includes('despejo')) {
    return 'Despejo';
  }

  // 3. QUEBRAS / AVARIAS / WQI / DQI / TOTAL QI / QUALIDADE DE PERDAS
  if (
    ind.includes('quebra') || ind.includes('wqi') || ind.includes('dqi') || ind.includes('total qi') ||
    ind.includes('avaria') || ind.includes('refugo') || ind.includes('fgli') || ind.includes('scl') ||
    ind.includes('falha de bloqueio') || ind.includes('pnc') || ind.includes('bloqueio e segregação') ||
    ind.includes('devoluções') || ind.includes('ronda de qualidade') || ind.includes('segurança de movimentação') ||
    ind.includes('blitz de segurança') || ind.includes('ergonomia') || ind.includes('qualidade da puxada') ||
    allText.includes('área de perdas') || allText.includes('área de devoluções') || allText.includes('pnc /')
  ) {
    return 'Gestão de Quebras';
  }

  // 4. FEFO / VALIDADES / IDADE DE ESTOQUE / SHELF LIFE
  if (
    ind.includes('fefo') || ind.includes('idade de estoque') || ind.includes('validade') || 
    ind.includes('shelf life') || allText.includes('bloco a') || allText.includes('bloco b') || 
    allText.includes('bloco c') || ind.includes('vencimento')
  ) {
    return 'Gestão FEFO';
  }

  // 5. CAPACIDADE / OCUPAÇÃO / LAYOUT / CONTINGÊNCIA
  if (
    ind.includes('capacidade') || ind.includes('ocupação') || ind.includes('layout') || 
    allText.includes('contingência') || allText.includes('ocupação acima de 80')
  ) {
    return 'Gestão de Capacidade';
  }

  // 6. RESSUPRIMENTO / REABASTECIMENTO
  if (
    ind.includes('ressuprimento') || ind.includes('reabastecimento') || 
    allText.includes('ressuprimento manual') || allText.includes('ressuprimento inteligente') ||
    allText.includes('reabastecimento inteligente') || allText.includes('solicitações manuais') ||
    allText.includes('saldo de reserva')
  ) {
    return 'Ressuprimento';
  }

  // 7. RECEBIMENTO / TMR / TMV / TMA / DESCARGA / CARRETAS
  if (
    ind.includes('tmr') || ind.includes('tmv') || ind.includes('tma') || 
    ind.includes('recebimento') || ind.includes('descarregamento') || 
    allText.includes('tempo da carreta') || allText.includes('pulmão / área de descarregamento') ||
    allText.includes('controle de recebimento')
  ) {
    return 'Recebimento';
  }

  // 8. EFD (se explícito)
  if (ind === 'efd' || ind.includes('efd')) {
    return 'EFD';
  }

  // 9. EFC (se explícito)
  if (ind === 'efc' || ind.includes('efc')) {
    return 'EFC';
  }

  // 10. CARREGAMENTO / EXPEDIÇÃO / BLITZ DE CARREGAMENTO / ERROS DE CARREGAMENTO
  if (
    ind.includes('blitz de carregamento') || ind.includes('erros de carregamento') || 
    ind.includes('erro de conferência') || ind.includes('carregamento') || 
    ind.includes('eficiência logistica') || ind.includes('matriz de correlação') || 
    ind.includes('previsão de volume') || allText.includes('área de carregamento') ||
    allText.includes('controle de expedição') || allText.includes('preparação de cargas')
  ) {
    return 'Carregamento';
  }

  // 11. ESTOQUE / TOOS / FALTA TEÓRICA / STOCK OUT / INVENTÁRIO / ACURACIDADE / DIFERENÇA DE ESTOQUE
  if (
    ind.includes('falta teórica') || ind.includes('toos') || ind.includes('stock out') || 
    ind.includes('inventário') || ind.includes('acuracidade') || ind.includes('diferença de estoque') ||
    allText.includes('armazém fácil / estoque')
  ) {
    return 'Estoque x Picking';
  }

  // 12. MARKETPLACE / 5S / SANITIZAÇÃO / ROTAS DE FUGA
  if (
    ind.includes('5s') || ind.includes('rotas de fuga') || ind.includes('sanitização') || 
    ind.includes('marketplace')
  ) {
    return 'Marketplace';
  }

  // 13. PICKING / MONTAGEM / PRECISÃO DO PICKING / CURVA ABC / WLP / PRODUTIVIDADE / GENTE
  if (
    ind.includes('picking') || ind.includes('precisão do picking') || ind.includes('curva abc') || 
    ind.includes('montagem') || ind.includes('efm') || ind.includes('wlp') || 
    ind.includes('produtividade') || ind.includes('absenteísmo') || ind.includes('treinamento') ||
    ind.includes('novos skus')
  ) {
    return 'Picking';
  }

  return 'Picking';
}

/**
 * Verifica se uma ação pertence ao filtro de um processo, indicador ou dashboard específico
 */
export function isActionMatchingProcessOrIndicator(acao: AcaoCorretiva, allowedKeywords: string[]): boolean {
  if (!allowedKeywords || allowedKeywords.length === 0) return true;
  
  const normalizedAllowed = allowedKeywords.map(k => k.toLowerCase().trim());
  if (normalizedAllowed.includes('todos') || normalizedAllowed.includes('all')) return true;

  const proc = (acao.processo || '').toLowerCase().trim();
  const ind = (acao.indicador || '').toLowerCase().trim();
  const desvio = (acao.desvioEncontrado || '').toLowerCase().trim();
  const contra = (acao.contramedida || '').toLowerCase().trim();
  const onde = (acao.onde || '').toLowerCase().trim();
  const setor = (acao.setor || '').toLowerCase().trim();
  const area = (acao.area || '').toLowerCase().trim();
  const reuniao = (acao.reuniao || '').toLowerCase().trim();
  const allText = `${proc} ${ind} ${desvio} ${contra} ${onde} ${setor} ${area} ${reuniao}`.toLowerCase();

  return normalizedAllowed.some(allowed => {
    // Exact or substring match
    if (proc === allowed || proc.includes(allowed)) return true;
    if (ind.includes(allowed)) return true;
    if (desvio.includes(allowed) || contra.includes(allowed) || onde.includes(allowed) || setor.includes(allowed)) return true;

    // Regras específicas de dashboards e termos:
    if (allowed === 'repack') {
      return allText.includes('repack');
    }
    if (allowed === 'despejo') {
      return allText.includes('despejo');
    }
    if (allowed === 'produtividade' || allowed === 'wlp') {
      return allText.includes('produtividade') || allText.includes('wlp') || allText.includes('efm') || allText.includes('montagem') || allText.includes('absenteísmo') || allText.includes('pnp');
    }
    if (allowed === 'quebras' || allowed === 'gestão de quebras' || allowed === 'qualidade') {
      return allText.includes('quebra') || allText.includes('qualidade') || allText.includes('wqi') || allText.includes('dqi') || allText.includes('total qi') || allText.includes('avaria') || allText.includes('refugo') || allText.includes('pnc') || allText.includes('fgli') || allText.includes('bloqueio') || allText.includes('segurança') || allText.includes('ergonomia');
    }
    if (allowed === 'fefo' || allowed === 'gestão fefo' || allowed === 'validade') {
      return allText.includes('fefo') || allText.includes('validade') || allText.includes('idade de estoque') || allText.includes('shelf life') || allText.includes('vencimento') || allText.includes('bloco a') || allText.includes('bloco b') || allText.includes('bloco c') || allText.includes('rlp');
    }
    if (allowed === 'capacidade' || allowed === 'gestão de capacidade' || allowed === 'armazenagem' || allowed === 'layout' || allowed === 'estoque') {
      return allText.includes('capacidade') || allText.includes('armazen') || allText.includes('ocupação') || allText.includes('layout') || allText.includes('contingência') || allText.includes('estoque') || allText.includes('política');
    }
    if (allowed === 'ressuprimento') {
      return allText.includes('ressuprimento') || allText.includes('reabastecimento') || allText.includes('solicitações manuais') || allText.includes('saldo de reserva');
    }
    if (allowed === 'tmr' || allowed === 'recebimento') {
      return allText.includes('recebimento') || allText.includes('tmr') || allText.includes('tmv') || allText.includes('tma') || allText.includes('efd') || allText.includes('descarregamento') || allText.includes('pulmão');
    }
    if (allowed === 'carregamento' || allowed === 'efc') {
      return allText.includes('carregamento') || allText.includes('efc') || allText.includes('blitz de carregamento') || allText.includes('conferência') || allText.includes('erros de carregamento') || allText.includes('eficiência logistica') || allText.includes('previsão de volume');
    }
    if (allowed === 'picking') {
      return allText.includes('picking') || allText.includes('precisão do picking') || allText.includes('curva abc') || allText.includes('montagem') || allText.includes('coleta');
    }
    if (allowed === '5s' || allowed === 'marketplace') {
      return allText.includes('5s') || allText.includes('rotas de fuga') || allText.includes('sanitização') || allText.includes('marketplace');
    }
    if (allowed === 'estoque' || allowed === 'toos' || allowed === 'inventário') {
      return allText.includes('toos') || allText.includes('falta teórica') || allText.includes('stock out') || allText.includes('inventário') || allText.includes('acuracidade') || allText.includes('diferença de estoque');
    }

    return false;
  });
}

/**
 * Parser unificado para importar payloads de Ações (JSON, Array ou CSV/TSV)
 */
export function parseAndImportActionsPayload(content: string, currentUser: string = 'Administrador'): {
  success: boolean;
  count: number;
  actions: AcaoCorretiva[];
  message: string;
} {
  if (!content || !content.trim()) {
    return { success: false, count: 0, actions: [], message: 'Conteúdo vazio fornecido para importação.' };
  }

  const raw = content.trim();
  const newAcoes: AcaoCorretiva[] = [];

  // 1. TENTATIVA DE PARSE COMO JSON
  if (raw.startsWith('{') || raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      const rawList: any[] = Array.isArray(parsed) 
        ? parsed 
        : (Array.isArray(parsed.acoes) ? parsed.acoes : (Array.isArray(parsed.data) ? parsed.data : []));

      if (rawList.length === 0) {
        return { success: false, count: 0, actions: [], message: 'Nenhuma ação encontrada na lista do JSON.' };
      }

      rawList.forEach((item: any, idx: number) => {
        if (!item) return;

        const idNum = item.id !== undefined && item.id !== null ? String(item.id) : String(idx + 1);
        const cArea = item.area || item.setor || 'Armazém';
        const cReuniao = item.reuniao || 'Team Room Armazém';
        const cResponsavel = item.responsavel || item.colaboradorResponsavel || 'Djeanderson Soares';
        const cIndicador = item.indicador || 'Indicador Operacional';
        const cOqueFazer = item.o_que_fazer || item.desvioEncontrado || item.acao || 'Ação operacional registrada';
        const cAcao = item.acao || item.contramedida || cOqueFazer;
        const cOnde = item.onde || item.localizacao || 'Guarabira';
        const cInicio = item.inicio || item.data || new Date().toISOString().split('T')[0];
        const cFinal = item.final || item.prazo || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const cObs = item.observacao_responsavel || item.obsResponsavel || item.comentarioOperador || '';

        // Formatação de datas
        const isoInicio = cInicio.includes('/') 
          ? cInicio.split('/').reverse().join('-') 
          : cInicio;
        const isoFinal = cFinal.includes('/') 
          ? cFinal.split('/').reverse().join('-') 
          : cFinal;
        
        const displayInicio = cInicio.includes('-') 
          ? cInicio.split('-').reverse().join('/') 
          : cInicio;
        const displayFinal = cFinal.includes('-') 
          ? cFinal.split('-').reverse().join('/') 
          : cFinal;

        // Classificação inteligente de Processo
        const proc = classifyProcessFromActionFields({
          indicador: cIndicador,
          oQueFazer: cOqueFazer,
          acao: cAcao,
          onde: cOnde,
          area: cArea,
          reuniao: cReuniao
        });

        // Status Normalization
        const rawStatus = String(item.status || '').toUpperCase().trim();
        let normalizedStatus: AcaoCorretiva['status'] = 'Pendente';
        if (rawStatus.includes('FINALIZADO') || rawStatus.includes('CONCLUÍD') || rawStatus.includes('CONCLUID')) {
          normalizedStatus = 'Concluído';
        } else if (rawStatus.includes('ANDAMENTO') || rawStatus.includes('EM ANDAMENTO')) {
          normalizedStatus = 'Em Andamento';
        } else if (rawStatus.includes('ATRASADO') || (item.atraso_dias && Number(item.atraso_dias) > 0)) {
          normalizedStatus = 'Atrasado';
        } else {
          normalizedStatus = 'Pendente';
        }

        // Tipo de Ação Normalization
        const rawTipo = String(item.tipo_acao || item.tipoAcao || '').toLowerCase();
        const normalizedTipo: 'Corretiva' | 'Melhoria' = rawTipo.includes('melhoria') ? 'Melhoria' : 'Corretiva';

        // Prioridade
        const normalizedPrioridade: 'Alta' | 'Média' | 'Baixa' = 
          (item.atraso_dias > 0 || normalizedStatus === 'Atrasado') ? 'Alta' : (normalizedStatus === 'Pendente' ? 'Alta' : 'Média');

        const actionItem: AcaoCorretiva = {
          id: `ACAO_2026_${idNum}`,
          data: displayInicio,
          dataISO: isoInicio,
          hora: '08:00',
          processo: proc,
          setor: cArea,
          colaboradorResponsavel: cResponsavel,
          indicador: cIndicador,
          meta: 'Conforme Padrão DPO 2026',
          resultadoObtido: normalizedStatus === 'Concluído' ? 'Ação Tratada e Concluída' : 'Em Acompanhamento Ativo',
          desvioEncontrado: cOqueFazer,
          causaRaiz: 'Método',
          causaRaizDetalhe: cAcao,
          status: normalizedStatus,
          responsavelTratativa: cResponsavel || currentUser,
          prazo: isoFinal,
          comentarioOperador: cObs,
          simulado: false,
          criadoEm: isoInicio ? `${isoInicio}T08:00:00.000Z` : new Date().toISOString(),
          tipoAcao: normalizedTipo,
          prioridade: normalizedPrioridade,
          contramedida: cAcao,
          aprovacaoGestor: 'Aprovado',
          aceiteColaborador: true,
          abertoPor: currentUser,
          dataAbertura: `${displayInicio} 08:00`,
          dataFechamento: normalizedStatus === 'Concluído' ? `${displayFinal} 17:00` : undefined,
          fechadoPor: normalizedStatus === 'Concluído' ? cResponsavel : undefined,

          area: cArea,
          reuniao: cReuniao,
          onde: cOnde,
          inicio: displayInicio,
          final: displayFinal,
          obsResponsavel: cObs,

          historicoAlteracoes: [{
            dataHora: new Date().toLocaleString('pt-BR'),
            usuario: currentUser,
            alteracao: `Ação importada para o processo [${proc}] (Indicador: ${cIndicador}).`
          }]
        };

        newAcoes.push(actionItem);
      });

      const current = getAcoesAll();
      const mergedMap = new Map<string, AcaoCorretiva>();
      
      // Adiciona as novas primeiro
      newAcoes.forEach(a => mergedMap.set(a.id, a));
      // Preserva anteriores não sobrescritas
      current.forEach(a => {
        if (!mergedMap.has(a.id)) mergedMap.set(a.id, a);
      });

      const finalList = Array.from(mergedMap.values());
      saveAcoes(finalList);

      return {
        success: true,
        count: newAcoes.length,
        actions: newAcoes,
        message: `✓ ${newAcoes.length} ações importadas e distribuídas com sucesso em seus respectivos dashboards!`
      };
    } catch (err: any) {
      console.warn("JSON parse attempt failed, trying CSV...", err);
    }
  }

  // 2. TENTATIVA DE PARSE COMO CSV / DELIMITED
  const lines = raw.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, count: 0, actions: [], message: 'Nenhuma linha válida encontrada no texto/arquivo fornecido.' };
  }

  const firstLine = lines[0];
  let delimiter = ';';
  if (firstLine.includes(';') && !firstLine.includes('\t')) delimiter = ';';
  else if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(',')) delimiter = ',';

  let startIndex = 0;
  if (firstLine.toLowerCase().includes('área') || firstLine.toLowerCase().includes('area') || firstLine.toLowerCase().includes('reunião') || firstLine.toLowerCase().includes('indicador')) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length < 3) continue;

    const cArea = cols[0] || 'Armazém';
    const cReuniao = cols[1] || 'Team Room Armazém';
    const cResponsavel = cols[2] || 'Djeanderson Soares';
    const cIndicador = cols[3] || 'Indicador Operacional';
    const cOqueFazer = cols[4] || 'Ação operacional registrada';
    const cOnde = cols[5] || 'Guarabira';
    const cInicio = cols[6] || new Date().toLocaleDateString('pt-BR');
    const cFinal = cols[7] || new Date(Date.now() + 7 * 86400000).toLocaleDateString('pt-BR');
    const cObs = cols[8] || '';

    const isoInicio = cInicio.includes('/') ? cInicio.split('/').reverse().join('-') : cInicio;
    const isoFinal = cFinal.includes('/') ? cFinal.split('/').reverse().join('-') : cFinal;
    const displayInicio = cInicio.includes('-') ? cInicio.split('-').reverse().join('/') : cInicio;
    const displayFinal = cFinal.includes('-') ? cFinal.split('-').reverse().join('/') : cFinal;

    const proc = classifyProcessFromActionFields({
      indicador: cIndicador,
      oQueFazer: cOqueFazer,
      onde: cOnde,
      area: cArea,
      reuniao: cReuniao
    });

    const actionItem: AcaoCorretiva = {
      id: `ACAO_IMP_${Date.now()}_${i}`,
      data: displayInicio,
      dataISO: isoInicio,
      hora: '08:00',
      processo: proc,
      setor: cArea,
      colaboradorResponsavel: cResponsavel,
      indicador: cIndicador,
      meta: 'Conforme Padrão DPO 2026',
      resultadoObtido: 'Em Acompanhamento Ativo',
      desvioEncontrado: cOqueFazer,
      causaRaiz: 'Método',
      status: 'Em Andamento',
      responsavelTratativa: currentUser,
      prazo: isoFinal,
      comentarioOperador: cObs,
      simulado: false,
      criadoEm: new Date().toISOString(),
      tipoAcao: 'Corretiva',
      prioridade: 'Alta',
      contramedida: cOqueFazer,
      aprovacaoGestor: 'Aprovado',
      aceiteColaborador: true,
      abertoPor: currentUser,
      dataAbertura: `${displayInicio} 08:00`,

      area: cArea,
      reuniao: cReuniao,
      onde: cOnde,
      inicio: displayInicio,
      final: displayFinal,
      obsResponsavel: cObs,

      historicoAlteracoes: [{
        dataHora: new Date().toLocaleString('pt-BR'),
        usuario: currentUser,
        alteracao: `Ação importada via planilha para o processo [${proc}] (Início: ${displayInicio}, Final: ${displayFinal}).`
      }]
    };

    newAcoes.push(actionItem);
  }

  if (newAcoes.length === 0) {
    return { success: false, count: 0, actions: [], message: 'Nenhuma ação pôde ser processada do formato fornecido.' };
  }

  const current = getAcoesAll();
  const merged = [...current, ...newAcoes];
  saveAcoes(merged);

  return {
    success: true,
    count: newAcoes.length,
    actions: newAcoes,
    message: `✓ ${newAcoes.length} ações importadas e distribuídas com sucesso em seus respectivos dashboards!`
  };
}

export function cleanAllAutomaticActionsFromStorage(): { removedCount: number } {
  let totalRemoved = 0;
  const storageKeys = [
    STORAGE_KEY_SIMULADO,
    STORAGE_KEY_OPERACIONAL,
    STORAGE_KEY_HISTORICO,
    UNIFIED_ACOES_DPO_KEY,
    MONTAGEM_ACOES_KEY,
    DESVIOS_ACOES_KEY,
    MELHORIAS_ACOES_KEY,
    'af_desvios_acoes_v2',
    'af_melhorias_acoes',
    'af_unified_acoes_dpo',
    'af_montagem_acoes'
  ];

  // Adicionar chaves de empresa
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('acoes_rows_') || key.startsWith('workstation_gatilhos_desvios_') || key.startsWith('af_acoes_'))) {
        if (!storageKeys.includes(key)) storageKeys.push(key);
      }
    }
  }

  storageKeys.forEach(key => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const beforeLen = parsed.length;
          const cleaned = parsed.filter((item: any) => !isSystemGeneratedOrSimulatedAction(item));
          const removed = beforeLen - cleaned.length;
          totalRemoved += removed;
          localStorage.setItem(key, JSON.stringify(cleaned));
        }
      }
    } catch (e) {}
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('af_acoes_updated'));
    window.dispatchEvent(new CustomEvent('af_acoes_dpo_updated'));
    window.dispatchEvent(new Event('af_acoes_cleaned'));
  }

  return { removedCount: totalRemoved };
}

export function toAcaoDpoItem(item: AcaoCorretiva): any {
  return {
    id: item.id,
    processo: item.processo,
    tipo: item.tipoAcao === 'Melhoria' ? 'Melhoria' : 'Corretiva',
    indicador: item.indicador,
    criticidade: item.prioridade || 'Alta',
    oQueFazer: item.desvioEncontrado,
    resolucao: item.contramedida || '',
    dataInicio: item.dataISO || (item.data ? item.data.split('/').reverse().join('-') : new Date().toISOString().split('T')[0]),
    dataTermino: item.prazo || item.dataISO || new Date().toISOString().split('T')[0],
    responsavel: item.colaboradorResponsavel || 'Colaborador',
    local: item.setor || 'Armazém',
    status: item.status === 'Concluído' ? 'Concluído' : item.status === 'Em Andamento' ? 'Em Andamento' : 'Pendente',
    etapasVerificacao: item.etapasVerificacao,
    cincoPorques: item.cincoPorques ? {
      pq1: item.cincoPorques.porque1,
      pq2: item.cincoPorques.porque2,
      pq3: item.cincoPorques.porque3,
      pq4: item.cincoPorques.porque4,
      pq5: item.cincoPorques.porque5,
    } : undefined
  };
}

export function saveAcoes(list: AcaoCorretiva[], specificMode?: DatabaseMode): void {
  const mode = specificMode || getActiveDatabaseMode();
  let storageKey = STORAGE_KEY_SIMULADO;

  if (mode === 'operacional') storageKey = STORAGE_KEY_OPERACIONAL;
  else if (mode === 'historico') storageKey = STORAGE_KEY_HISTORICO;

  const uniqueMap = new Map<string, AcaoCorretiva>();
  list.forEach(item => {
    if (item && item.id) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
  });
  const cleanList = Array.from(uniqueMap.values());

  try {
    localStorage.setItem(storageKey, JSON.stringify(cleanList));
    localStorage.setItem(STORAGE_KEY_OPERACIONAL, JSON.stringify(cleanList));
    
    // Sync to unified dashboard storage
    const dpoList = cleanList.map(toAcaoDpoItem);
    localStorage.setItem(UNIFIED_ACOES_DPO_KEY, JSON.stringify(dpoList));

    // Dispatch event so all UI components update in real time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('af_acoes_updated'));
      window.dispatchEvent(new CustomEvent('af_acoes_dpo_updated'));
      const empresaId = localStorage.getItem('af_empresa_id') || 'demo';
      if (cleanList.length > 0) {
        firestoreDb.batchUpsert('acoes', cleanList, empresaId).catch(() => {});
      }
    }
  } catch (e) {
    console.error('Error saving actions:', e);
  }
}

export function clearAllAcoes(): void {
  try {
    localStorage.setItem(STORAGE_KEY_SIMULADO, '[]');
    localStorage.setItem(STORAGE_KEY_OPERACIONAL, '[]');
    localStorage.setItem(STORAGE_KEY_HISTORICO, '[]');
    localStorage.setItem(UNIFIED_ACOES_DPO_KEY, '[]');
    localStorage.setItem(MONTAGEM_ACOES_KEY, '[]');
    localStorage.setItem(DESVIOS_ACOES_KEY, '[]');
    localStorage.setItem(MELHORIAS_ACOES_KEY, '[]');
    cleanAllAutomaticActionsFromStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('af_acoes_updated'));
      window.dispatchEvent(new CustomEvent('af_acoes_dpo_updated'));
    }
  } catch (e) {
    console.error('Error clearing actions:', e);
  }
}

// Requirement 26: Automatic trigger function to register a corrective action
export function triggerAutoAcaoCorretiva(trigger: {
  processo: AcaoCorretiva['processo'];
  setor?: string;
  colaboradorResponsavel?: string;
  indicador: string;
  meta: string;
  resultadoObtido: string;
  desvioEncontrado: string;
  causaRaiz?: AcaoCorretiva['causaRaiz'];
  comentarioOperador?: string;
  responsavelTratativa?: string;
  
  // Optional FEFO/Quebra details (Req 28)
  produto?: string;
  codigoProduto?: string;
  lote?: string;
  validade?: string;
  quantidade?: number;
  localizacao?: string;
  impactoFinanceiro?: number;
  hlPerdido?: number;
}): AcaoCorretiva {
  const currentList = getAcoesAll();

  const now = new Date();
  const dStr = now.toLocaleDateString('pt-BR');
  const dISO = now.toISOString().split('T')[0];
  const hStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const deadlineDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const deadlineISO = deadlineDate.toISOString().split('T')[0];

  const newAction: AcaoCorretiva = {
    id: `acao-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    data: dStr,
    dataISO: dISO,
    hora: hStr,
    processo: trigger.processo,
    setor: trigger.setor || 'Pátio Central / Armazém',
    colaboradorResponsavel: trigger.colaboradorResponsavel || 'Operador Responsável',
    indicador: trigger.indicador,
    meta: trigger.meta,
    resultadoObtido: trigger.resultadoObtido,
    desvioEncontrado: trigger.desvioEncontrado,
    causaRaiz: trigger.causaRaiz || 'Método',
    causaRaizDetalhe: 'Identificado via gatilho de desvio automático do sistema.',
    status: 'Pendente',
    responsavelTratativa: trigger.responsavelTratativa || 'Supervisor de Processos',
    prazo: deadlineISO,
    evidencias: `Gatilho automático gerado em ${dStr} às ${hStr}`,
    comentarioOperador: trigger.comentarioOperador || trigger.desvioEncontrado,
    simulado: getActiveDatabaseMode() === 'simulado',
    criadoEm: now.toISOString(),

    // Requirement 33 & 35: Governance & 5 Whys Flow
    tipoAcao: 'Corretiva',
    prioridade: 'Alta',
    cincoPorques: {
      porque1: `Desvio no indicador ${trigger.indicador}: ${trigger.resultadoObtido} x Meta ${trigger.meta}`,
      porque2: 'Aumento de tempo de manobra e fila de separação no turno.',
      porque3: 'Gargalo operacional por acúmulo de paletes no corredor.',
      porque4: 'Deficiência na alocação da equipe e reabastecimento tardio.',
      porque5: 'Falha no sequenciamento preventivo das ordens de trabalho.'
    },
    contramedida: 'Executar alocação emergencial, reordenar ordens no WMS e realizar treinamento relâmpago.',
    aprovacaoGestor: 'Pendente',
    aceiteColaborador: false,
    impactoEsperado: 'Restabelecer performance do turno e atingir a meta diária.',
    situacaoMeta: 'Perdida',

    historicoAlteracoes: [
      {
        dataHora: `${dStr} ${hStr}`,
        usuario: 'Gatilho Automático do Sistema',
        alteracao: `Ação Corretiva gerada automaticamente por desvio no indicador "${trigger.indicador}". Formulário dos 5 Porquês aberto.`
      }
    ],

    ...(trigger.produto || trigger.codigoProduto ? {
      isFefoOuQuebra: true,
      produto: trigger.produto || 'Produto Não Especificado',
      codigoProduto: trigger.codigoProduto || '0000000',
      lote: trigger.lote || 'LOTE-SISTEMA',
      validade: trigger.validade || dStr,
      quantidade: trigger.quantidade || 1,
      localizacao: trigger.localizacao || 'Armazém',
      motivoOcorrencia: trigger.desvioEncontrado,
      impactoFinanceiro: trigger.impactoFinanceiro || 0,
      hlPerdido: trigger.hlPerdido || 0,
      planoAcao: 'Tratativa e regularização imediata requisitada.'
    } : {})
  };

  const updatedList = [newAction, ...currentList];
  saveAcoes(updatedList);
  return newAction;
}

// Requirement 33 (Part 2) & Requirement 38: Automatic Preventive Improvement Action Trigger (Tendência Operacional & RLP)
export function triggerAutoAcaoMelhoriaPreventiva(trigger: {
  processo: AcaoCorretiva['processo'];
  indicador: string;
  tendenciaProjecao: string;
  recomendacaoSugerida: string;
  areaRlp?: 'Logística' | 'Comercial' | 'Planejamento' | 'Operação';
  isRlp?: boolean;
  responsavel?: string;
  prioridade?: 'Alta' | 'Média' | 'Baixa';
  produto?: string;
  codigoProduto?: string;
  lote?: string;
}): AcaoCorretiva {
  const currentList = getAcoesAll();

  const now = new Date();
  const dStr = now.toLocaleDateString('pt-BR');
  const dISO = now.toISOString().split('T')[0];
  const hStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const deadlineDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days for preventive
  const deadlineISO = deadlineDate.toISOString().split('T')[0];

  const newAction: AcaoCorretiva = {
    id: `melhoria-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    data: dStr,
    dataISO: dISO,
    hora: hStr,
    processo: trigger.processo,
    setor: 'Geral / Planejamento Operacional',
    colaboradorResponsavel: trigger.responsavel || 'Equipe de Melhoria Contínua',
    indicador: trigger.indicador,
    meta: 'Meta Mensal 100%',
    resultadoObtido: 'Em risco por tendência de queda',
    desvioEncontrado: `Alerta de Tendência: ${trigger.tendenciaProjecao}`,
    causaRaiz: 'Método',
    causaRaizDetalhe: 'Identificado via Inteligência de Tendência Operacional / RLP.',
    status: 'Pendente',
    responsavelTratativa: 'Gestor de Processos & Logística',
    prazo: deadlineISO,
    evidencias: `Alerta emitido pelo algoritmo de tendência operacional em ${dStr}`,
    comentarioOperador: `Ação Preventiva Sugerida: ${trigger.recomendacaoSugerida}`,
    simulado: getActiveDatabaseMode() === 'simulado',
    criadoEm: now.toISOString(),

    tipoAcao: 'Melhoria',
    prioridade: trigger.prioridade || 'Alta',
    contramedida: trigger.recomendacaoSugerida,
    aprovacaoGestor: 'Pendente',
    aceiteColaborador: false,
    impactoEsperado: 'Prevenir a perda da meta mensal e restabelecer tendência positiva de performance.',
    situacaoMeta: 'Tendência de Queda',

    isRlp: trigger.isRlp || false,
    areaRlp: trigger.areaRlp || 'Logística',
    tendenciaProjecao: trigger.tendenciaProjecao,

    ...(trigger.produto ? {
      isFefoOuQuebra: true,
      produto: trigger.produto,
      codigoProduto: trigger.codigoProduto || '0000000',
      lote: trigger.lote || 'LOTE-CRITICO',
      planoAcao: trigger.recomendacaoSugerida
    } : {}),

    historicoAlteracoes: [
      {
        dataHora: `${dStr} ${hStr}`,
        usuario: 'Algoritmo de Tendência e Prevenção RLP',
        alteracao: `Ação de Melhoria Preventiva gerada. Motivo: ${trigger.tendenciaProjecao}`
      }
    ]
  };

  const updatedList = [newAction, ...currentList];
  saveAcoes(updatedList);
  return newAction;
}

export function updateAcaoCorretiva(item: AcaoCorretiva, usuario: string = 'Usuário'): void {
  const currentList = getAcoesAll();
  const idx = currentList.findIndex(a => a.id === item.id);

  const updatedTrail: AuditTrailEntry[] = [
    ...(item.historicoAlteracoes || []),
    {
      dataHora: `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      usuario,
      alteracao: `Registro atualizado (Status: ${item.status}).`
    }
  ];

  const itemToSave = { ...item, historicoAlteracoes: updatedTrail };

  if (idx >= 0) {
    currentList[idx] = itemToSave;
  } else {
    currentList.unshift(itemToSave);
  }

  saveAcoes(currentList);
}

export function deleteAcaoCorretiva(id: string): void {
  const currentList = getAcoesAll();
  const filtered = currentList.filter(a => String(a.id) !== String(id));
  saveAcoes(filtered);

  // Clean from all other sub-keys
  [MONTAGEM_ACOES_KEY, DESVIOS_ACOES_KEY, MELHORIAS_ACOES_KEY].forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const next = parsed.filter((item: any) => String(item.id) !== String(id));
          localStorage.setItem(k, JSON.stringify(next));
        }
      }
    } catch (e) {}
  });
}

export function deleteAcoesBatch(ids: string[]): void {
  const currentList = getAcoesAll();
  const setIds = new Set(ids.map(String));
  const filtered = currentList.filter(a => !setIds.has(String(a.id)));
  saveAcoes(filtered);

  // Clean from all other sub-keys
  [MONTAGEM_ACOES_KEY, DESVIOS_ACOES_KEY, MELHORIAS_ACOES_KEY].forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const next = parsed.filter((item: any) => !setIds.has(String(item.id)));
          localStorage.setItem(k, JSON.stringify(next));
        }
      }
    } catch (e) {}
  });
}

// Requirement 32: Management functions for simulated database
export function restoreSimulatedDatabase(): AcaoCorretiva[] {
  const seeded = generateFullSimulatedDatabase2026();
  saveAcoes(seeded, 'simulado');
  return seeded;
}

export function clearSimulatedDatabase(): void {
  saveAcoes([], 'simulado');
}

export function exportAcoesCSV(mode?: DatabaseMode): void {
  const data = getAcoesAll(mode);
  if (data.length === 0) {
    alert('Não há registros para exportar.');
    return;
  }

  const headers = [
    'ID', 'Data', 'Hora', 'Processo', 'Setor', 'Colaborador', 
    'Indicador', 'Meta', 'Resultado', 'Desvio', 'Causa Raiz', 
    'Status', 'Responsável Tratativa', 'Prazo', 'Comentário Operador'
  ];

  const rows = data.map(item => [
    item.id,
    item.data,
    item.hora,
    item.processo,
    `"${item.setor}"`,
    `"${item.colaboradorResponsavel}"`,
    `"${item.indicador}"`,
    `"${item.meta}"`,
    `"${item.resultadoObtido}"`,
    `"${item.desvioEncontrado.replace(/"/g, '""')}"`,
    item.causaRaiz,
    item.status,
    `"${item.responsavelTratativa}"`,
    item.prazo,
    `"${(item.comentarioOperador || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Acoes_Corretivas_${mode || getActiveDatabaseMode()}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
