import { FefoRelocationDemand } from '../types';
import { calcularQuebrasFefoEstoqueXEstoque, calcularQuebrasFefoEstoqueXPicking } from './matrizBlocos';
import { 
  getStoredAuditoriaGiro, 
  saveAuditoriaGiro, 
  getStoredAderenciaHistorico, 
  saveAderenciaHistorico, 
  AuditoriaGiroItem, 
  RegistroAderenciaFefo,
  associarColaboradorOficial
} from './fefoAderenciaHistorico';

const FEFO_STORAGE_PREFIX = 'fefo_demands_';

export const DEFAULT_FEFO_DEMANDS_MOCK: FefoRelocationDemand[] = [
  // SEMANA 4 (24 a 26 de Agosto de 2026)
  {
    id: 'fefo_ronildo_exp_001_ago26',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '001',
    descricao: 'SKOL 600ML',
    ruaOndeEsta: 'A3',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-09-15',
    validadeLoteComparado: '2026-10-20',
    diasInversao: 35,
    quantidadeCaixas: 320,
    mensagem: 'Quebra Estoque x Picking: Produto no Estoque Central A3 mais antigo que no Picking',
    sugestaoAcao: 'Mover paletes de SKOL 600ML da rua A3 para o picking prioritário',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-26T07:30:00.000Z',
    iniciadoEm: '2026-08-26T07:32:00.000Z',
    finalizadoEm: '2026-08-26T07:38:00.000Z',
    duracaoMin: 6,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro de FEFO concluído com sucesso por Ronildo. Lote realocado da rua A3 para o Picking. Quebra sanada e lote mais antigo na frente da expedição.',
    criadoEm: '2026-08-26T07:30:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_002_ago26',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '002',
    descricao: 'BRAHMA 600ML',
    ruaOndeEsta: 'B2',
    ruaOndePrecisaEstar: 'A1',
    validadeLoteInconforme: '2026-08-10',
    validadeLoteComparado: '2026-09-28',
    diasInversao: 49,
    quantidadeCaixas: 280,
    mensagem: 'Inversão de Ruas: Bloco B2 mais antigo que Bloco A1 (>7 dias de tolerância)',
    sugestaoAcao: 'Realocar lote da rua B2 para a rua A1 para respeitar o FEFO',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-26T08:15:00.000Z',
    iniciadoEm: '2026-08-26T08:18:00.000Z',
    finalizadoEm: '2026-08-26T08:26:00.000Z',
    duracaoMin: 8,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro de FEFO concluído com sucesso por Marivaldo. Lote da rua B2 transferido para a rua A1. Fila de expedição 100% alinhada.',
    criadoEm: '2026-08-26T08:15:00.000Z'
  },
  {
    id: 'fefo_ronildo_exp_004_ago25',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '004',
    descricao: 'BUDWEISER 600ML',
    ruaOndeEsta: 'A2',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-09-01',
    validadeLoteComparado: '2026-10-12',
    diasInversao: 41,
    quantidadeCaixas: 210,
    mensagem: 'Quebra Estoque x Picking: Lote no estoque A2 mais antigo que picking',
    sugestaoAcao: 'Abastecer picking imediatamente com lote da rua A2',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-25T09:00:00.000Z',
    iniciadoEm: '2026-08-25T09:03:00.000Z',
    finalizadoEm: '2026-08-25T09:09:00.000Z',
    duracaoMin: 6,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro de FEFO concluído por Ronildo. Lote mais antigo da rua A2 abastecido na frente do picking.',
    criadoEm: '2026-08-25T09:00:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_003_ago25',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '003',
    descricao: 'STELLA ARTOIS 269ML',
    ruaOndeEsta: 'C2',
    ruaOndePrecisaEstar: 'A2',
    validadeLoteInconforme: '2026-11-05',
    validadeLoteComparado: '2026-11-27',
    diasInversao: 22,
    quantidadeCaixas: 450,
    mensagem: 'Inversão de Ruas: Bloco C2 mais antigo que Bloco A2',
    sugestaoAcao: 'Mover pallets de Stella Artois do bloco C2 para a frente no bloco A2',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-25T10:20:00.000Z',
    iniciadoEm: '2026-08-25T10:24:00.000Z',
    finalizadoEm: '2026-08-25T10:33:00.000Z',
    duracaoMin: 9,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro de FEFO concluído por Marivaldo. Paletes da rua C2 realocados para a rua A2 com sucesso.',
    criadoEm: '2026-08-25T10:20:00.000Z'
  },
  {
    id: 'fefo_ronildo_exp_005_ago24',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '005',
    descricao: 'GUARANÁ ANTARCTICA 2L',
    ruaOndeEsta: 'B1',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-12-20',
    validadeLoteComparado: '2027-01-07',
    diasInversao: 18,
    quantidadeCaixas: 600,
    mensagem: 'Quebra Estoque x Picking: Lote no estoque B1 mais antigo que o picking',
    sugestaoAcao: 'Giro de FEFO priorizando Guaraná Antarctica 2L do estoque B1 para o picking',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-24T08:00:00.000Z',
    iniciadoEm: '2026-08-24T08:04:00.000Z',
    finalizadoEm: '2026-08-24T08:11:00.000Z',
    duracaoMin: 7,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro de FEFO realizado por Ronildo. Estoque Central B1 para Área Picking concluído.',
    criadoEm: '2026-08-24T08:00:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_006_ago24',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '006',
    descricao: 'CORONA EXTRA 330ML',
    ruaOndeEsta: 'C1',
    ruaOndePrecisaEstar: 'A3',
    validadeLoteInconforme: '2026-10-18',
    validadeLoteComparado: '2026-11-15',
    diasInversao: 28,
    quantidadeCaixas: 380,
    mensagem: 'Inversão de Ruas: Bloco C1 mais antigo que Bloco A3',
    sugestaoAcao: 'Transferir paletes de Corona Extra da rua C1 para a rua A3',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-24T11:00:00.000Z',
    iniciadoEm: '2026-08-24T11:03:00.000Z',
    finalizadoEm: '2026-08-24T11:10:00.000Z',
    duracaoMin: 7,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro concluído por Marivaldo. Realocação da C1 para A3 executada e conferida.',
    criadoEm: '2026-08-24T11:00:00.000Z'
  },

  // SEMANA 3 (17 a 19 de Agosto de 2026)
  {
    id: 'fefo_ronildo_exp_007_ago19',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '007',
    descricao: 'SPATEN 355ML',
    ruaOndeEsta: 'B3',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-10-12',
    validadeLoteComparado: '2026-11-05',
    diasInversao: 24,
    quantidadeCaixas: 350,
    mensagem: 'Quebra Estoque x Picking: Lote em B3 mais antigo que picking',
    sugestaoAcao: 'Giro de FEFO para alimentar picking com Spaten 355ml de B3',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-19T07:45:00.000Z',
    iniciadoEm: '2026-08-19T07:48:00.000Z',
    finalizadoEm: '2026-08-19T07:54:00.000Z',
    duracaoMin: 6,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro de FEFO concluído por Ronildo. Lote de Spaten transferido com êxito.',
    criadoEm: '2026-08-19T07:45:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_008_ago19',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '008',
    descricao: 'ORIGINAL 600ML',
    ruaOndeEsta: 'C1',
    ruaOndePrecisaEstar: 'A1',
    validadeLoteInconforme: '2026-09-28',
    validadeLoteComparado: '2026-11-02',
    diasInversao: 35,
    quantidadeCaixas: 420,
    mensagem: 'Inversão de Ruas: Bloco C1 mais antigo que Bloco A1',
    sugestaoAcao: 'Realocar lote de Original 600ml da rua C1 para a rua A1',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-19T09:10:00.000Z',
    iniciadoEm: '2026-08-19T09:14:00.000Z',
    finalizadoEm: '2026-08-19T09:22:00.000Z',
    duracaoMin: 8,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro de FEFO executado por Marivaldo. C1 para A1 finalizado.',
    criadoEm: '2026-08-19T09:10:00.000Z'
  },
  {
    id: 'fefo_ronildo_exp_009_ago18',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '009',
    descricao: 'SKOL LATA 350ML',
    ruaOndeEsta: 'A4',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-11-14',
    validadeLoteComparado: '2026-12-10',
    diasInversao: 26,
    quantidadeCaixas: 540,
    mensagem: 'Quebra Estoque x Picking: Lote em A4 mais antigo que picking',
    sugestaoAcao: 'Giro de FEFO abastecendo picking com lote de A4',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-18T08:30:00.000Z',
    iniciadoEm: '2026-08-18T08:33:00.000Z',
    finalizadoEm: '2026-08-18T08:40:00.000Z',
    duracaoMin: 7,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro concluído por Ronildo. Picking abastecido e regularizado.',
    criadoEm: '2026-08-18T08:30:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_010_ago17',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '010',
    descricao: 'HEINEKEN 330ML',
    ruaOndeEsta: 'B3',
    ruaOndePrecisaEstar: 'A2',
    validadeLoteInconforme: '2026-11-08',
    validadeLoteComparado: '2026-12-05',
    diasInversao: 27,
    quantidadeCaixas: 310,
    mensagem: 'Inversão de Ruas: Bloco B3 mais antigo que Bloco A2',
    sugestaoAcao: 'Mover paletes de Heineken de B3 para A2',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-17T10:00:00.000Z',
    iniciadoEm: '2026-08-17T10:04:00.000Z',
    finalizadoEm: '2026-08-17T10:12:00.000Z',
    duracaoMin: 8,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro de FEFO concluído por Marivaldo. B3 para A2 regularizado.',
    criadoEm: '2026-08-17T10:00:00.000Z'
  },

  // SEMANA 2 (10 a 12 de Agosto de 2026)
  {
    id: 'fefo_ronildo_exp_001_ago12',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '001',
    descricao: 'SKOL 600ML',
    ruaOndeEsta: 'A3',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-09-10',
    validadeLoteComparado: '2026-10-05',
    diasInversao: 25,
    quantidadeCaixas: 290,
    mensagem: 'Quebra Estoque x Picking: Reposição semanal necessária',
    sugestaoAcao: 'Abastecer picking com lote de A3',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-12T07:30:00.000Z',
    iniciadoEm: '2026-08-12T07:33:00.000Z',
    finalizadoEm: '2026-08-12T07:39:00.000Z',
    duracaoMin: 6,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro concluído por Ronildo. Fila FEFO 100% conforme.',
    criadoEm: '2026-08-12T07:30:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_002_ago11',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '002',
    descricao: 'BRAHMA 600ML',
    ruaOndeEsta: 'B2',
    ruaOndePrecisaEstar: 'A1',
    validadeLoteInconforme: '2026-08-04',
    validadeLoteComparado: '2026-09-10',
    diasInversao: 37,
    quantidadeCaixas: 260,
    mensagem: 'Inversão de Ruas: Bloco B2 mais antigo que Bloco A1',
    sugestaoAcao: 'Mover da B2 para A1',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-11T09:00:00.000Z',
    iniciadoEm: '2026-08-11T09:04:00.000Z',
    finalizadoEm: '2026-08-11T09:11:00.000Z',
    duracaoMin: 7,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro de FEFO finalizado por Marivaldo.',
    criadoEm: '2026-08-11T09:00:00.000Z'
  },
  {
    id: 'fefo_ronildo_exp_004_ago10',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '004',
    descricao: 'BUDWEISER 600ML',
    ruaOndeEsta: 'A2',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-08-25',
    validadeLoteComparado: '2026-09-20',
    diasInversao: 26,
    quantidadeCaixas: 200,
    mensagem: 'Quebra Estoque x Picking: Lote em A2 mais antigo que picking',
    sugestaoAcao: 'Giro de FEFO para abastecimento de picking',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-10T08:15:00.000Z',
    iniciadoEm: '2026-08-10T08:18:00.000Z',
    finalizadoEm: '2026-08-10T08:24:00.000Z',
    duracaoMin: 6,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro concluído com sucesso por Ronildo.',
    criadoEm: '2026-08-10T08:15:00.000Z'
  },

  // SEMANA 1 (03 a 05 de Agosto de 2026)
  {
    id: 'fefo_marivaldo_exe_003_ago05',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '003',
    descricao: 'STELLA ARTOIS 269ML',
    ruaOndeEsta: 'C2',
    ruaOndePrecisaEstar: 'A2',
    validadeLoteInconforme: '2026-10-22',
    validadeLoteComparado: '2026-11-18',
    diasInversao: 27,
    quantidadeCaixas: 400,
    mensagem: 'Inversão de Ruas: Bloco C2 mais antigo que Bloco A2',
    sugestaoAcao: 'Realocação de C2 para A2',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-05T08:00:00.000Z',
    iniciadoEm: '2026-08-05T08:04:00.000Z',
    finalizadoEm: '2026-08-05T08:12:00.000Z',
    duracaoMin: 8,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro executado por Marivaldo no Bloco A2.',
    criadoEm: '2026-08-05T08:00:00.000Z'
  },
  {
    id: 'fefo_ronildo_exp_005_ago04',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_picking',
    codigo: '005',
    descricao: 'GUARANÁ ANTARCTICA 2L',
    ruaOndeEsta: 'B1',
    ruaOndePrecisaEstar: 'Área Picking',
    validadeLoteInconforme: '2026-12-01',
    validadeLoteComparado: '2026-12-25',
    diasInversao: 24,
    quantidadeCaixas: 580,
    mensagem: 'Quebra Estoque x Picking: B1 mais antigo que picking',
    sugestaoAcao: 'Giro de FEFO priorizando lote de B1',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Thiago (Conferente de Validades)',
    solicitadoEm: '2026-08-04T08:30:00.000Z',
    iniciadoEm: '2026-08-04T08:33:00.000Z',
    finalizadoEm: '2026-08-04T08:39:00.000Z',
    duracaoMin: 6,
    operadorExecutor: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    observacaoGiro: 'Giro concluído por Ronildo. Reposição de Guaraná 2L efetuada.',
    criadoEm: '2026-08-04T08:30:00.000Z'
  },
  {
    id: 'fefo_marivaldo_exe_002_ago03',
    empresaId: 'demo',
    tipoQuebra: 'estoque_x_estoque',
    codigo: '002',
    descricao: 'BRAHMA 600ML',
    ruaOndeEsta: 'B1',
    ruaOndePrecisaEstar: 'A1',
    validadeLoteInconforme: '2026-07-28',
    validadeLoteComparado: '2026-08-25',
    diasInversao: 28,
    quantidadeCaixas: 310,
    mensagem: 'Inversão de Ruas: Bloco B1 mais antigo que Bloco A1',
    sugestaoAcao: 'Giro de FEFO da B1 para A1',
    status: 'done',
    solicitadoPorConferente: true,
    solicitadoPor: 'Aline (Conferência & Qualidade)',
    solicitadoEm: '2026-08-03T07:40:00.000Z',
    iniciadoEm: '2026-08-03T07:44:00.000Z',
    finalizadoEm: '2026-08-03T07:51:00.000Z',
    duracaoMin: 7,
    operadorExecutor: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    observacaoGiro: 'Giro executado na abertura do mês por Marivaldo.',
    criadoEm: '2026-08-03T07:40:00.000Z'
  }
];

export function getStoredFefoDemands(companyId: string = 'demo'): FefoRelocationDemand[] {
  try {
    const saved = localStorage.getItem(`${FEFO_STORAGE_PREFIX}${companyId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading FEFO demands:', e);
  }
  return DEFAULT_FEFO_DEMANDS_MOCK;
}

export function saveFefoDemands(companyId: string = 'demo', demands: FefoRelocationDemand[]) {
  try {
    localStorage.setItem(`${FEFO_STORAGE_PREFIX}${companyId}`, JSON.stringify(demands));
    window.dispatchEvent(new Event('fefo_demands_updated'));
  } catch (e) {
    console.error('Error saving FEFO demands:', e);
  }
}

/**
 * Automatically calculates FEFO breaks and syncs them with stored demands.
 * If a break is newly detected, it creates a relocation demand with status='pending'.
 * If a demand already exists (e.g. pending, in_progress, done), its status and execution metrics are preserved.
 */
export function syncFefoDemandsFromValidades(companyId: string = 'demo', validadesList: any[]): FefoRelocationDemand[] {
  const currentDemands = getStoredFefoDemands(companyId);

  const pickingBreaks = calcularQuebrasFefoEstoqueXPicking(validadesList);
  const estoqueBreaks = calcularQuebrasFefoEstoqueXEstoque(validadesList);

  let updated = [...currentDemands];
  let hasChanges = false;

  // Process Picking breaks (Tolerância ZERO)
  pickingBreaks.forEach(q => {
    const cod = String(q.codigo).trim();
    const ruaEsta = q.ruaEstoque.trim();
    const ruaPrecisa = 'Área Picking';

    // Check if demand already exists
    const existing = updated.find(d => 
      String(d.codigo).trim() === cod &&
      d.ruaOndeEsta.toLowerCase() === ruaEsta.toLowerCase() &&
      d.ruaOndePrecisaEstar.toLowerCase() === ruaPrecisa.toLowerCase() &&
      d.validadeLoteInconforme === q.validadeEstoque
    );

    if (!existing) {
      const newDemand: FefoRelocationDemand = {
        id: `fefo_exp_${cod}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_picking',
        codigo: cod,
        descricao: q.descricao,
        ruaOndeEsta: ruaEsta,
        ruaOndePrecisaEstar: ruaPrecisa,
        validadeLoteInconforme: q.validadeEstoque,
        validadeLoteComparado: q.validadePicking,
        diasInversao: q.diasInversao,
        mensagem: q.mensagem,
        sugestaoAcao: q.sugestaoAcao,
        status: 'pending',
        operadorDesignado: 'TODOS',
        criadoEm: new Date().toISOString()
      };
      updated.unshift(newDemand);
      hasChanges = true;
    }
  });

  // Process Estoque x Estoque breaks (Tolerância 7 Dias)
  estoqueBreaks.forEach(q => {
    const cod = String(q.codigo).trim();
    const ruaEsta = q.ruaDistante.trim();
    const ruaPrecisa = q.ruaProxima.trim();

    const existing = updated.find(d => 
      String(d.codigo).trim() === cod &&
      d.ruaOndeEsta.toLowerCase() === ruaEsta.toLowerCase() &&
      d.ruaOndePrecisaEstar.toLowerCase() === ruaPrecisa.toLowerCase() &&
      d.validadeLoteInconforme === q.validadeRuaDistante
    );

    if (!existing) {
      const newDemand: FefoRelocationDemand = {
        id: `fefo_exe_${cod}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_estoque',
        codigo: cod,
        descricao: q.descricao,
        ruaOndeEsta: ruaEsta,
        ruaOndePrecisaEstar: ruaPrecisa,
        validadeLoteInconforme: q.validadeRuaDistante,
        validadeLoteComparado: q.validadeRuaProxima,
        diasInversao: q.diasInversao,
        mensagem: q.mensagem,
        sugestaoAcao: q.sugestaoAcao,
        status: 'pending',
        operadorDesignado: 'TODOS',
        criadoEm: new Date().toISOString()
      };
      updated.unshift(newDemand);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveFefoDemands(companyId, updated);
  }

  return updated;
}

export function requestFefoDemand(
  companyId: string = 'demo',
  id: string,
  requestedBy: string
) {
  const current = getStoredFefoDemands(companyId);
  const nowISO = new Date().toISOString();

  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        solicitadoPorConferente: true,
        solicitadoPor: requestedBy,
        solicitadoEm: nowISO,
        status: 'pending' as const,
        operadorDesignado: 'TODOS'
      };
    }
    return item;
  });

  saveFefoDemands(companyId, updated);
}

export function requestAllFefoDemands(
  companyId: string = 'demo',
  requestedBy: string
) {
  const current = getStoredFefoDemands(companyId);
  const nowISO = new Date().toISOString();

  const updated = current.map(item => {
    if (item.status !== 'done') {
      return {
        ...item,
        solicitadoPorConferente: true,
        solicitadoPor: requestedBy,
        solicitadoEm: nowISO,
        status: item.status === 'in_progress' ? item.status : ('pending' as const),
        operadorDesignado: 'TODOS'
      };
    }
    return item;
  });

  saveFefoDemands(companyId, updated);
}

export function cancelFefoDemandRequest(
  companyId: string = 'demo',
  id: string
) {
  const current = getStoredFefoDemands(companyId);

  const updated = current.map(item => {
    if (item.id === id && item.status === 'pending') {
      return {
        ...item,
        solicitadoPorConferente: false,
        solicitadoPor: undefined,
        solicitadoEm: undefined
      };
    }
    return item;
  });

  saveFefoDemands(companyId, updated);
}

export function updateFefoDemandStatus(
  companyId: string = 'demo',
  id: string,
  status: 'in_progress' | 'done',
  userExecutor: string
) {
  const current = getStoredFefoDemands(companyId);
  const nowISO = new Date().toISOString();

  const updated = current.map(item => {
    if (item.id === id) {
      if (status === 'in_progress') {
        return {
          ...item,
          status: 'in_progress' as const,
          iniciadoEm: item.iniciadoEm || nowISO,
          operadorExecutor: userExecutor
        };
      } else if (status === 'done') {
        const startTs = item.iniciadoEm ? new Date(item.iniciadoEm).getTime() : new Date().getTime();
        const durationMin = Math.max(1, Math.round((new Date(nowISO).getTime() - startTs) / 60000));
        return {
          ...item,
          status: 'done' as const,
          finalizadoEm: nowISO,
          duracaoMin: durationMin,
          operadorExecutor: userExecutor
        };
      }
    }
    return item;
  });

  saveFefoDemands(companyId, updated);
}

/**
 * Conclui todos os giros de FEFO gerados por quebras (Estoque x Picking e Estoque x Estoque),
 * atribuindo a execução e responsabilidade aos operadores Ronildo e Marivaldo,
 * gravando o histórico completo de auditorias e atualizando a aderência mensal para 100%.
 */
export function concluirTodosGirosFefoQuebras(
  companyId: string = 'demo',
  options?: {
    validadesList?: any[];
    operadores?: string[];
    dataFechamento?: string;
  }
): {
  demands: FefoRelocationDemand[];
  totalConcluidos: number;
} {
  // 1. Sincronizar se houver lista de validades
  let currentDemands = getStoredFefoDemands(companyId);
  if (options?.validadesList && options.validadesList.length > 0) {
    currentDemands = syncFefoDemandsFromValidades(companyId, options.validadesList);
  }

  const nowISO = new Date().toISOString();
  const dataHojeFormatada = options?.dataFechamento || new Date().toLocaleDateString('pt-BR');
  const operadores = options?.operadores || [
    'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    'Marivaldo (Operador de Empilhadeira 1 - Bloco B)'
  ];

  // 2. Se não houver demandas criadas mas existirem quebras padrão, criar demandas simuladas para garantir que tudo seja concluído
  if (currentDemands.length === 0) {
    const defaultQuebrasMock: FefoRelocationDemand[] = [
      {
        id: `fefo_ronildo_exp_001_${Date.now()}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_picking',
        codigo: '001',
        descricao: 'SKOL 600ML',
        ruaOndeEsta: 'A3',
        ruaOndePrecisaEstar: 'Área Picking',
        validadeLoteInconforme: '2026-09-15',
        diasInversao: 35,
        quantidadeCaixas: 320,
        mensagem: 'Quebra Estoque x Picking: Produto no Estoque Central mais antigo que no Picking',
        sugestaoAcao: 'Mover paletes de SKOL 600ML da rua A3 para o picking prioritário',
        status: 'pending',
        solicitadoPorConferente: true,
        solicitadoPor: 'Conferente de Validades',
        solicitadoEm: new Date(Date.now() - 3600000).toISOString(),
        criadoEm: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: `fefo_marivaldo_exe_002_${Date.now() + 1}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_estoque',
        codigo: '002',
        descricao: 'BRAHMA 600ML',
        ruaOndeEsta: 'B2',
        ruaOndePrecisaEstar: 'A1',
        validadeLoteInconforme: '2026-08-10',
        diasInversao: 49,
        quantidadeCaixas: 280,
        mensagem: 'Inversão de Ruas: Bloco B2 mais antigo que Bloco A1 (>7 dias de tolerância)',
        sugestaoAcao: 'Realocar lote da rua B2 para a rua A1 para respeitar o FEFO',
        status: 'pending',
        solicitadoPorConferente: true,
        solicitadoPor: 'Conferente de Validades',
        solicitadoEm: new Date(Date.now() - 3600000).toISOString(),
        criadoEm: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: `fefo_ronildo_exp_004_${Date.now() + 2}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_picking',
        codigo: '004',
        descricao: 'BUDWEISER 600ML',
        ruaOndeEsta: 'A2',
        ruaOndePrecisaEstar: 'Área Picking',
        validadeLoteInconforme: '2026-09-01',
        diasInversao: 41,
        quantidadeCaixas: 210,
        mensagem: 'Quebra Estoque x Picking: Lote no estoque A2 mais antigo que picking',
        sugestaoAcao: 'Abastecer picking imediatamente com lote da rua A2',
        status: 'pending',
        solicitadoPorConferente: true,
        solicitadoPor: 'Conferente de Validades',
        solicitadoEm: new Date(Date.now() - 3600000).toISOString(),
        criadoEm: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: `fefo_marivaldo_exe_003_${Date.now() + 3}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_estoque',
        codigo: '003',
        descricao: 'STELLA ARTOIS 269ML',
        ruaOndeEsta: 'C2',
        ruaOndePrecisaEstar: 'A2',
        validadeLoteInconforme: '2026-11-05',
        diasInversao: 22,
        quantidadeCaixas: 450,
        mensagem: 'Inversão de Ruas: Bloco C2 mais antigo que Bloco A2',
        sugestaoAcao: 'Mover pallets de Stella Artois do bloco C2 para a frente no bloco A2',
        status: 'pending',
        solicitadoPorConferente: true,
        solicitadoPor: 'Conferente de Validades',
        solicitadoEm: new Date(Date.now() - 3600000).toISOString(),
        criadoEm: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: `fefo_ronildo_exp_005_${Date.now() + 4}`,
        empresaId: companyId,
        tipoQuebra: 'estoque_x_picking',
        codigo: '005',
        descricao: 'GUARANÁ ANTARCTICA 2L',
        ruaOndeEsta: 'B1',
        ruaOndePrecisaEstar: 'Área Picking',
        validadeLoteInconforme: '2026-12-20',
        diasInversao: 18,
        quantidadeCaixas: 600,
        mensagem: 'Quebra Estoque x Picking: Lote no estoque B1 mais antigo que o picking',
        sugestaoAcao: 'Giro de FEFO priorizando Guaraná Antarctica 2L do estoque B1 para o picking',
        status: 'pending',
        solicitadoPorConferente: true,
        solicitadoPor: 'Conferente de Validades',
        solicitadoEm: new Date(Date.now() - 3600000).toISOString(),
        criadoEm: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    currentDemands = defaultQuebrasMock;
  }

  // 3. Atualizar todas as demandas para status 'done', distribuindo entre Ronildo e Marivaldo
  const updatedDemands: FefoRelocationDemand[] = currentDemands.map((item, idx) => {
    const assignedOp = idx % 2 === 0 ? operadores[0] : (operadores[1] || operadores[0]);
    const durationMin = 4 + (idx % 4); // 4 a 7 min por giro
    const startTs = new Date(Date.now() - (durationMin * 60 * 1000) - (idx * 5 * 60 * 1000)).toISOString();

    return {
      ...item,
      status: 'done' as const,
      solicitadoPorConferente: true,
      solicitadoPor: item.solicitadoPor || 'Conferente de Validades',
      solicitadoEm: item.solicitadoEm || startTs,
      iniciadoEm: item.iniciadoEm || startTs,
      finalizadoEm: item.finalizadoEm || nowISO,
      duracaoMin: item.duracaoMin || durationMin,
      operadorExecutor: 'Ronildo & Marivaldo',
      observacaoGiro: `Giro de FEFO concluído com sucesso por ${assignedOp}. Quebra corrigida e fila FEFO 100% regularizada.`
    };
  });

  saveFefoDemands(companyId, updatedDemands);

  // 4. Gravar auditorias de giro detalhadas para Ronildo e Marivaldo
  const currentAuditorias = getStoredAuditoriaGiro(companyId);
  const newAuditorias: AuditoriaGiroItem[] = updatedDemands.map((d, i) => {
    const isRonildo = i % 2 === 0;
    const assignedOp = isRonildo 
      ? 'Ronildo (Operador de Empilhadeira 2 - Bloco A)' 
      : 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)';
    const colabOficial = associarColaboradorOficial(assignedOp);

    return {
      id: `aud-giro-${d.id || i}-${Date.now()}`,
      data: dataHojeFormatada,
      dataHoraSolicitacao: d.solicitadoEm ? new Date(d.solicitadoEm).toLocaleString('pt-BR') : `${dataHojeFormatada} 07:30`,
      dataConclusao: d.finalizadoEm ? new Date(d.finalizadoEm).toLocaleString('pt-BR') : `${dataHojeFormatada} 07:45`,
      turno: (i % 2 === 0 ? 'Turno 1' : 'Turno 2') as 'Turno 1' | 'Turno 2',
      codigoSku: d.codigo,
      descricaoSku: d.descricao,
      tipoQuebra: d.tipoQuebra === 'estoque_x_picking' ? 'Estoque x Picking' : 'Estoque x Estoque',
      localizacaoOrigem: d.ruaOndeEsta ? `Rua ${d.ruaOndeEsta}` : 'Rua A3 (Estoque)',
      localizacaoDestino: d.ruaOndePrecisaEstar || 'Área Picking',
      loteExpedido: `LOTE-${d.validadeLoteInconforme ? d.validadeLoteInconforme.replace(/-/g, '') : 'OK'}-${isRonildo ? 'RON' : 'MAR'}`,
      validadeExpedida: d.validadeLoteInconforme || dataHojeFormatada,
      loteMaisDistante: `LOTE-COMP-${isRonildo ? 'RON' : 'MAR'}`,
      validadeMaisDistante: d.validadeLoteComparado || '2027-04-15',
      diferencaDias: d.diasInversao || 30,
      quantidadeCaixas: d.quantidadeCaixas || 250,
      houveDesvio: false, // Quebra sanada e regularizada com 100% de aderência!
      statusConclusao: 'Concluído',
      concluido: true,
      motivoDesvio: `Giro de FEFO concluído após quebra (${d.tipoQuebra === 'estoque_x_picking' ? 'Estoque x Picking' : 'Estoque x Estoque'}). Realocação da ${d.ruaOndeEsta} para ${d.ruaOndePrecisaEstar} executada com sucesso.`,
      responsavel: assignedOp,
      colaboradorOficial: colabOficial
    };
  });

  // Mesclar auditorias sem duplicar id
  const existingIds = new Set(currentAuditorias.map(a => a.id));
  const mergedAuditorias = [
    ...newAuditorias.filter(a => !existingIds.has(a.id)),
    ...currentAuditorias
  ];
  saveAuditoriaGiro(companyId, mergedAuditorias);

  // 5. Atualizar histórico mensal de aderência para refletir 100% de conformidade com todos os desvios sanados
  const currentHistorico = getStoredAderenciaHistorico(companyId);
  const updatedHistorico: RegistroAderenciaFefo[] = currentHistorico.map(h => {
    if (h.mesKey === '07' || h.mesNome.toLowerCase().includes('julho')) {
      return {
        ...h,
        aderenciaPct: 100.0,
        conformeFefoCx: h.totalExpedidoCx,
        desviosCx: 0,
        status: 'Conforme' as const,
        motivoPrincipalDesvio: 'Todos os giros de FEFO concluídos com sucesso por Ronildo e Marivaldo após quebras identificadas',
        responsavelAuditoria: 'Ronildo & Marivaldo (Empilhadores Responsáveis)',
        dataFechamento: dataHojeFormatada
      };
    }
    return h;
  });

  saveAderenciaHistorico(companyId, updatedHistorico);

  // 6. Notificar componentes relevantes
  window.dispatchEvent(new Event('fefo_demands_updated'));
  window.dispatchEvent(new Event('fefo_auditoria_updated'));
  window.dispatchEvent(new Event('fefo_aderencia_updated'));

  return {
    demands: updatedDemands,
    totalConcluidos: updatedDemands.length
  };
}
