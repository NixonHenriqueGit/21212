import { EfcEfdVehicle } from './efcEfdManager';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { sanitizeData } from '../security/JsonSecuritySanitizer';

export interface RawEfcEfdJsonItem {
  Mapa?: number | string;
  mapa?: number | string;
  MAPA?: number | string;

  Veiculo?: string;
  veiculo?: string;
  VEICULO?: string;
  Placa?: string;
  placa?: string;
  PLACA?: string;

  Colaborador_Carregamento?: string;
  colaborador_carregamento?: string;
  colaboradorCarregamento?: string;
  ColaboradorCarregamento?: string;
  OperadorCarregamento?: string;
  operadorCarregamento?: string;

  Data_Carregamento?: string;
  data_carregamento?: string;
  dataCarregamento?: string;
  DataCarregamento?: string;

  Carregamento_Label?: string;
  carregamento_label?: string;
  carregamentoLabel?: string;

  Carregamento_Inicio?: string;
  carregamento_inicio?: string;
  carregamentoInicio?: string;

  Carregamento_Final?: string;
  carregamento_final?: string;
  carregamentoFinal?: string;

  Carregamento_Tempo_Min?: number | string;
  carregamento_tempo_min?: number | string;
  carregamentoTempoMin?: number | string;

  Carregamento_Meta?: string;
  carregamento_meta?: string;
  carregamentoMeta?: string;

  Colaborador_Descarregamento?: string;
  colaborador_descarregamento?: string;
  colaboradorDescarregamento?: string;
  ColaboradorDescarregamento?: string;
  OperadorDescarregamento?: string;
  operadorDescarregamento?: string;

  Data_Fechamento_Rota?: string;
  data_fechamento_rota?: string;
  dataFechamentoRota?: string;

  Dia_Semana_Fechamento?: string;
  dia_semana_fechamento?: string;
  diaSemanaFechamento?: string;

  Categoria_Final?: string;
  categoria_final?: string;
  categoriaFinal?: string;

  Qtd_Pallets?: number | string;
  qtd_pallets?: number | string;
  qtdPallets?: number | string;
  Pallets?: number | string;
  pallets?: number | string;

  Status_Carregamento?: string;
  status_carregamento?: string;
  statusCarregamento?: string;

  Status_Descarregamento?: string;
  status_descarregamento?: string;
  statusDescarregamento?: string;

  Descarregamento_Inicio?: string;
  descarregamento_inicio?: string;
  descarregamentoInicio?: string;

  Descarregamento_Final?: string;
  descarregamento_final?: string;
  descarregamentoFinal?: string;

  Descarregamento_Tempo_Min?: number | string;
  descarregamento_tempo_min?: number | string;
  descarregamentoTempoMin?: number | string;

  Descarregamento_Meta?: string;
  descarregamento_meta?: string;
  descarregamentoMeta?: string;

  [key: string]: any;
}

export interface ParsedEfcEfdRow {
  id: string;
  mapa: string;
  veiculo: string;
  colaboradorCarregamento: string;
  dataCarregamento: string;
  dataCarregamentoISO: string;
  carregamentoLabel: string;
  carregamentoInicio: string;
  carregamentoFinal: string;
  carregamentoTempoMin: number;
  carregamentoMeta: 'DENTRO' | 'FORA';
  efcCompliant: boolean;

  colaboradorDescarregamento: string;
  dataFechamentoRota: string;
  dataFechamentoRotaISO: string;
  diaSemanaFechamento: string;
  categoriaFinal: 'D0' | 'D1' | 'D2' | 'D3' | 'D4' | string;
  qtdPallets: number;

  statusCarregamento: 'Concluido' | 'Pendente' | 'Em Carregamento' | string;
  statusDescarregamento: 'Descarregado' | 'Pendente' | 'Em Descarregamento' | 'Pernoite' | string;
  descarregamentoInicio: string;
  descarregamentoFinal: string;
  descarregamentoTempoMin: number;
  descarregamentoMeta: 'DENTRO' | 'FORA';
  efdCompliant: boolean;
}

export interface ParsedEfcEfdResult {
  valid: boolean;
  rows: ParsedEfcEfdRow[];
  vehicles: EfcEfdVehicle[];
  retroactiveRecords: RetroactiveRecord[];
  totalRecords: number;
  totalPallets: number;
  totalEfcDentro: number;
  totalEfcFora: number;
  taxaEfcDentro: number;
  totalEfdDentro: number;
  totalEfdFora: number;
  taxaEfdDentro: number;
  tempoMedioCarregamentoMin: number;
  tempoMedioDescarregamentoMin: number;
  resumoPorColaborador: Record<string, { 
    carregamentos: number; 
    carregamentoDentro: number; 
    descarregamentos: number; 
    descarregamentoDentro: number; 
    pallets: number; 
  }>;
  resumoPorCategoria: Record<string, { count: number; pallets: number; efcDentro: number; efdDentro: number }>;
  resumoPorDiaSemana: Record<string, { count: number; pallets: number; efcDentro: number; efdDentro: number }>;
  errors: string[];
  warnings: string[];
}

/**
 * Normaliza datas no formato DD/MM/YYYY ou YYYY-MM-DD para ISO YYYY-MM-DD
 */
function normalizeDateToISO(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.slice(0, 10);
  }
  const parts = clean.split(/[/.-]/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Converte data ISO YYYY-MM-DD para DD/MM/YYYY
 */
function formatDateToBR(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

/**
 * Extrai HH:MM a partir de strings completas ("2026-01-30 22:17" ou "22:17:00")
 */
function extractHourMinute(timeStr?: string): string {
  if (!timeStr) return '--:--';
  const clean = timeStr.trim();
  if (clean.includes(' ')) {
    const timePart = clean.split(' ')[1];
    return timePart.slice(0, 5);
  }
  return clean.slice(0, 5);
}

/**
 * Parse oficial de JSON de EFC / EFD Retroativo
 */
export function parseEfcEfdJson(
  rawInput: string | RawEfcEfdJsonItem[],
  empresaId: string = 'demo',
  currentUserName: string = 'Administrador'
): ParsedEfcEfdResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rawList: RawEfcEfdJsonItem[] = [];

  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return createEmptyEfcEfdResult(['O conteúdo JSON fornecido está vazio.']);
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.itens || parsed.items || parsed.veiculos || parsed.dados || parsed.data)) {
          rawList = parsed.itens || parsed.items || parsed.veiculos || parsed.dados || parsed.data;
        } else {
          rawList = [parsed];
        }
      } else {
        return createEmptyEfcEfdResult(['O JSON fornecido não é uma lista de objetos válida.']);
      }
    } catch (e: any) {
      return createEmptyEfcEfdResult([`Erro de sintaxe JSON: ${e.message}`]);
    }
  } else if (Array.isArray(rawInput)) {
    rawList = rawInput;
  } else if (rawInput && typeof rawInput === 'object') {
    rawList = [rawInput];
  } else {
    return createEmptyEfcEfdResult(['Entrada inválida fornecida para o parser de EFC/EFD.']);
  }

  // Sanitização de segurança
  try {
    rawList = sanitizeData(rawList);
  } catch (e: any) {
    warnings.push(`Aviso na sanitização de dados: ${e.message}`);
  }

  const rows: ParsedEfcEfdRow[] = [];
  const vehicles: EfcEfdVehicle[] = [];
  const retroactiveRecords: RetroactiveRecord[] = [];

  let totalPallets = 0;
  let totalEfcDentro = 0;
  let totalEfcFora = 0;
  let totalEfdDentro = 0;
  let totalEfdFora = 0;
  let totalCarregamentoTempo = 0;
  let totalDescarregamentoTempo = 0;

  const resumoPorColaborador: Record<string, { 
    carregamentos: number; 
    carregamentoDentro: number; 
    descarregamentos: number; 
    descarregamentoDentro: number; 
    pallets: number; 
  }> = {};

  const resumoPorCategoria: Record<string, { count: number; pallets: number; efcDentro: number; efdDentro: number }> = {};
  const resumoPorDiaSemana: Record<string, { count: number; pallets: number; efcDentro: number; efdDentro: number }> = {};

  rawList.forEach((item, index) => {
    try {
      const mapaRaw = item.Mapa ?? item.mapa ?? item.MAPA ?? (10000 + index);
      const mapa = String(mapaRaw).trim();

      const veiculoRaw = item.Veiculo ?? item.veiculo ?? item.VEICULO ?? item.Placa ?? item.placa ?? item.PLACA ?? `VEC-${index + 1}`;
      const veiculo = String(veiculoRaw).trim().toUpperCase();

      const colabCarregamento = String(
        item.Colaborador_Carregamento ?? 
        item.colaborador_carregamento ?? 
        item.colaboradorCarregamento ?? 
        item.ColaboradorCarregamento ?? 
        item.OperadorCarregamento ?? 
        item.operadorCarregamento ?? 
        'Operador Carregamento'
      ).trim();

      const dataCarregamentoRaw = String(
        item.Data_Carregamento ?? 
        item.data_carregamento ?? 
        item.dataCarregamento ?? 
        item.DataCarregamento ?? 
        new Date().toISOString().split('T')[0]
      ).trim();
      const dataCarregamentoISO = normalizeDateToISO(dataCarregamentoRaw);
      const dataCarregamento = formatDateToBR(dataCarregamentoISO);

      const carregamentoLabel = String(item.Carregamento_Label ?? item.carregamento_label ?? item.carregamentoLabel ?? 'Carregamento').trim();
      const carregamentoInicio = String(item.Carregamento_Inicio ?? item.carregamento_inicio ?? item.carregamentoInicio ?? '').trim();
      const carregamentoFinal = String(item.Carregamento_Final ?? item.carregamento_final ?? item.carregamentoFinal ?? '').trim();
      const carregamentoTempoMin = Number(item.Carregamento_Tempo_Min ?? item.carregamento_tempo_min ?? item.carregamentoTempoMin ?? 0) || 0;

      const carregamentoMetaRaw = String(item.Carregamento_Meta ?? item.carregamento_meta ?? item.carregamentoMeta ?? '').toUpperCase().trim();
      const carregamentoMeta: 'DENTRO' | 'FORA' = (carregamentoMetaRaw.includes('DENTRO') || carregamentoMetaRaw.includes('OK') || carregamentoMetaRaw.includes('BATIDA')) ? 'DENTRO' : 'FORA';
      const efcCompliant = carregamentoMeta === 'DENTRO';

      const colabDescarregamento = String(
        item.Colaborador_Descarregamento ?? 
        item.colaborador_descarregamento ?? 
        item.colaboradorDescarregamento ?? 
        item.ColaboradorDescarregamento ?? 
        item.OperadorDescarregamento ?? 
        item.operadorDescarregamento ?? 
        colabCarregamento ?? 
        'Operador Descarregamento'
      ).trim();

      const dataFechamentoRaw = String(
        item.Data_Fechamento_Rota ?? 
        item.data_fechamento_rota ?? 
        item.dataFechamentoRota ?? 
        dataCarregamentoRaw
      ).trim();
      const dataFechamentoRotaISO = normalizeDateToISO(dataFechamentoRaw);
      const dataFechamentoRota = formatDateToBR(dataFechamentoRotaISO);

      const diaSemanaFechamento = String(item.Dia_Semana_Fechamento ?? item.dia_semana_fechamento ?? item.diaSemanaFechamento ?? 'Dia Útil').trim();
      const categoriaFinal = String(item.Categoria_Final ?? item.categoria_final ?? item.categoriaFinal ?? 'D0').trim().toUpperCase();

      const qtdPallets = Number(item.Qtd_Pallets ?? item.qtd_pallets ?? item.qtdPallets ?? item.Pallets ?? item.pallets ?? 10) || 0;

      const statusCarregamento = String(item.Status_Carregamento ?? item.status_carregamento ?? item.statusCarregamento ?? 'Concluido').trim();
      const statusDescarregamento = String(item.Status_Descarregamento ?? item.status_descarregamento ?? item.statusDescarregamento ?? 'Descarregado').trim();

      const descarregamentoInicio = String(item.Descarregamento_Inicio ?? item.descarregamento_inicio ?? item.descarregamentoInicio ?? '').trim();
      const descarregamentoFinal = String(item.Descarregamento_Final ?? item.descarregamento_final ?? item.descarregamentoFinal ?? '').trim();
      const descarregamentoTempoMin = Number(item.Descarregamento_Tempo_Min ?? item.descarregamento_tempo_min ?? item.descarregamentoTempoMin ?? 0) || 0;

      const descarregamentoMetaRaw = String(item.Descarregamento_Meta ?? item.descarregamento_meta ?? item.descarregamentoMeta ?? '').toUpperCase().trim();
      const descarregamentoMeta: 'DENTRO' | 'FORA' = (descarregamentoMetaRaw.includes('DENTRO') || descarregamentoMetaRaw.includes('OK') || descarregamentoMetaRaw.includes('BATIDA')) ? 'DENTRO' : 'FORA';
      const efdCompliant = descarregamentoMeta === 'DENTRO';

      const rowId = `efc-efd-${mapa}-${veiculo}-${index}`;

      const row: ParsedEfcEfdRow = {
        id: rowId,
        mapa,
        veiculo,
        colaboradorCarregamento: colabCarregamento,
        dataCarregamento,
        dataCarregamentoISO,
        carregamentoLabel,
        carregamentoInicio,
        carregamentoFinal,
        carregamentoTempoMin,
        carregamentoMeta,
        efcCompliant,
        colaboradorDescarregamento: colabDescarregamento,
        dataFechamentoRota,
        dataFechamentoRotaISO,
        diaSemanaFechamento,
        categoriaFinal,
        qtdPallets,
        statusCarregamento,
        statusDescarregamento,
        descarregamentoInicio,
        descarregamentoFinal,
        descarregamentoTempoMin,
        descarregamentoMeta,
        efdCompliant
      };

      rows.push(row);

      // Conversão para EfcEfdVehicle para alimentar os painéis operacionais de Conferente e Empilhador
      const horaInicioC = extractHourMinute(carregamentoInicio);
      const horaFimC = extractHourMinute(carregamentoFinal);
      const horaInicioD = extractHourMinute(descarregamentoInicio);
      const horaFimD = extractHourMinute(descarregamentoFinal);

      const uniqueTripId = `efc-vec-${mapa}-${veiculo}-${dataCarregamentoISO || 'data'}-${index}`;

      const vehicleDoc: EfcEfdVehicle = {
        id: uniqueTripId,
        placa: veiculo,
        mapa,
        empresaId,
        tipoVeiculo: 'Caminhão de Rota',
        motorista: 'Motorista Rota',
        caixas: qtdPallets * 60,
        totalCaixas: qtdPallets * 60,
        peso: qtdPallets * 950,
        dataEntrega: dataFechamentoRota,
        dataEntregaISO: dataFechamentoRotaISO,

        statusCarregamento: 'Finalizado',
        horaInicioCarregamento: horaInicioC !== '--:--' ? horaInicioC : '22:15',
        horaFimCarregamento: horaFimC !== '--:--' ? horaFimC : '22:30',
        efcCompliant,

        statusDescarregamento: (categoriaFinal.startsWith('D') && categoriaFinal !== 'D0') ? 'Pernoite' : 'Finalizado',
        horaInicioDescarregamento: horaInicioD !== '--:--' ? horaInicioD : '07:08',
        horaFimDescarregamento: horaFimD !== '--:--' ? horaFimD : '07:13',
        efdCompliant,

        pernoiteMarked: categoriaFinal !== 'D0',
        pernoiteStatus: (['D1', 'D2', 'D3', 'D4'].includes(categoriaFinal) ? categoriaFinal : undefined) as any,

        tipoCarga: 'Rota Comercial',
        isRecarga: false,
        operadorDesignado: colabCarregamento,
        operadorExecutorCarregamento: colabCarregamento,
        operadorExecutorDescarregamento: colabDescarregamento,
        operadoresExecutoresCarregamento: [colabCarregamento],
        operadoresExecutoresDescarregamento: [colabDescarregamento],
        duracaoCarregamentoMin: carregamentoTempoMin,
        duracaoDescarregamentoMin: descarregamentoTempoMin,

        timestampInicioCarregamento: carregamentoInicio,
        timestampFimCarregamento: carregamentoFinal,
        timestampInicioDescarregamento: descarregamentoInicio,
        timestampFimDescarregamento: descarregamentoFinal,

        colaboradorCarregamento: colabCarregamento,
        colaboradorDescarregamento: colabDescarregamento,
        dataCarregamento,
        dataFechamentoRota,
        diaSemanaFechamento,
        categoriaFinal,
        qtdPallets,
        pallets: qtdPallets,
        carregamentoLabel,
        carregamentoInicio,
        carregamentoFinal,
        carregamentoTempoMin,
        carregamentoMeta,
        descarregamentoInicio,
        descarregamentoFinal,
        descarregamentoTempoMin,
        descarregamentoMeta
      };

      vehicles.push(vehicleDoc);

      // Conversão para RetroactiveRecord central
      const retroRecord: RetroactiveRecord = {
        id: `retro-efc-${mapa}-${veiculo}-${dataCarregamentoISO || 'data'}-${index}`,
        modulo: 'efc_efd',
        dataISO: dataCarregamentoISO,
        dataFormatada: dataCarregamento,
        codigoProduto: `MAPA-${mapa}`,
        descricao: `Carregamento EFC / EFD Rota ${veiculo} (Mapa ${mapa})`,
        quantidade: qtdPallets,
        unidade: 'PALLETS',
        valorFinanceiro: qtdPallets * 450,
        operador: colabCarregamento,
        empilhador: colabCarregamento,
        placa: veiculo,
        setor: 'Doca de Carregamento / Pátio',
        status: 'Concluído',
        observacoes: `Carregamento: ${carregamentoMeta} (${carregamentoTempoMin} min) | Descarregamento: ${descarregamentoMeta} (${descarregamentoTempoMin} min) | Categoria: ${categoriaFinal}`,
        horaInicio: horaInicioC !== '--:--' ? horaInicioC : '22:15',
        horaFim: horaFimC !== '--:--' ? horaFimC : '22:30',
        duracaoMinutos: carregamentoTempoMin + descarregamentoTempoMin,
        rendimentoHLHora: carregamentoTempoMin > 0 ? (qtdPallets / (carregamentoTempoMin / 60)) : 0,
        simuladoHistorico: true,
        criadoEm: new Date().toISOString()
      };

      retroactiveRecords.push(retroRecord);

      // Agregações
      totalPallets += qtdPallets;
      if (efcCompliant) totalEfcDentro++; else totalEfcFora++;
      if (efdCompliant) totalEfdDentro++; else totalEfdFora++;
      totalCarregamentoTempo += carregamentoTempoMin;
      totalDescarregamentoTempo += descarregamentoTempoMin;

      // Resumo por colaborador
      if (colabCarregamento) {
        if (!resumoPorColaborador[colabCarregamento]) {
          resumoPorColaborador[colabCarregamento] = { carregamentos: 0, carregamentoDentro: 0, descarregamentos: 0, descarregamentoDentro: 0, pallets: 0 };
        }
        resumoPorColaborador[colabCarregamento].carregamentos += 1;
        if (efcCompliant) resumoPorColaborador[colabCarregamento].carregamentoDentro += 1;
        resumoPorColaborador[colabCarregamento].pallets += qtdPallets;
      }

      if (colabDescarregamento) {
        if (!resumoPorColaborador[colabDescarregamento]) {
          resumoPorColaborador[colabDescarregamento] = { carregamentos: 0, carregamentoDentro: 0, descarregamentos: 0, descarregamentoDentro: 0, pallets: 0 };
        }
        resumoPorColaborador[colabDescarregamento].descarregamentos += 1;
        if (efdCompliant) resumoPorColaborador[colabDescarregamento].descarregamentoDentro += 1;
      }

      // Resumo por categoria (D0, D1, etc.)
      if (!resumoPorCategoria[categoriaFinal]) {
        resumoPorCategoria[categoriaFinal] = { count: 0, pallets: 0, efcDentro: 0, efdDentro: 0 };
      }
      resumoPorCategoria[categoriaFinal].count += 1;
      resumoPorCategoria[categoriaFinal].pallets += qtdPallets;
      if (efcCompliant) resumoPorCategoria[categoriaFinal].efcDentro += 1;
      if (efdCompliant) resumoPorCategoria[categoriaFinal].efdDentro += 1;

      // Resumo por dia da semana
      if (!resumoPorDiaSemana[diaSemanaFechamento]) {
        resumoPorDiaSemana[diaSemanaFechamento] = { count: 0, pallets: 0, efcDentro: 0, efdDentro: 0 };
      }
      resumoPorDiaSemana[diaSemanaFechamento].count += 1;
      resumoPorDiaSemana[diaSemanaFechamento].pallets += qtdPallets;
      if (efcCompliant) resumoPorDiaSemana[diaSemanaFechamento].efcDentro += 1;
      if (efdCompliant) resumoPorDiaSemana[diaSemanaFechamento].efdDentro += 1;

    } catch (err: any) {
      warnings.push(`Linha ${index + 1}: Erro ao processar item: ${err.message}`);
    }
  });

  const totalRecords = rows.length;
  const taxaEfcDentro = totalRecords > 0 ? Math.round((totalEfcDentro / totalRecords) * 1000) / 10 : 0;
  const taxaEfdDentro = totalRecords > 0 ? Math.round((totalEfdDentro / totalRecords) * 1000) / 10 : 0;
  const tempoMedioCarregamentoMin = totalRecords > 0 ? Math.round((totalCarregamentoTempo / totalRecords) * 10) / 10 : 0;
  const tempoMedioDescarregamentoMin = totalRecords > 0 ? Math.round((totalDescarregamentoTempo / totalRecords) * 10) / 10 : 0;

  return {
    valid: totalRecords > 0 && errors.length === 0,
    rows,
    vehicles,
    retroactiveRecords,
    totalRecords,
    totalPallets,
    totalEfcDentro,
    totalEfcFora,
    taxaEfcDentro,
    totalEfdDentro,
    totalEfdFora,
    taxaEfdDentro,
    tempoMedioCarregamentoMin,
    tempoMedioDescarregamentoMin,
    resumoPorColaborador,
    resumoPorCategoria,
    resumoPorDiaSemana,
    errors,
    warnings
  };
}

function createEmptyEfcEfdResult(errors: string[]): ParsedEfcEfdResult {
  return {
    valid: false,
    rows: [],
    vehicles: [],
    retroactiveRecords: [],
    totalRecords: 0,
    totalPallets: 0,
    totalEfcDentro: 0,
    totalEfcFora: 0,
    taxaEfcDentro: 0,
    totalEfdDentro: 0,
    totalEfdFora: 0,
    taxaEfdDentro: 0,
    tempoMedioCarregamentoMin: 0,
    tempoMedioDescarregamentoMin: 0,
    resumoPorColaborador: {},
    resumoPorCategoria: {},
    resumoPorDiaSemana: {},
    errors,
    warnings: []
  };
}

/**
 * Dados de exemplo oficiais no formato solicitado pelo usuário
 */
export const SAMPLE_EFC_EFD_JSON: RawEfcEfdJsonItem[] = [
  {
    "Mapa": 10470,
    "Veiculo": "SLB3J76",
    "Colaborador_Carregamento": "Paulo Pereira da Silva",
    "Data_Carregamento": "30/01/2026",
    "Carregamento_Label": "Carregamento",
    "Carregamento_Inicio": "2026-01-30 22:17",
    "Carregamento_Final": "2026-01-30 22:30",
    "Carregamento_Tempo_Min": 13,
    "Carregamento_Meta": "DENTRO",
    "Colaborador_Descarregamento": "José Ronildo",
    "Data_Fechamento_Rota": "31/01/2026",
    "Dia_Semana_Fechamento": "Sábado",
    "Categoria_Final": "D0",
    "Qtd_Pallets": 10,
    "Status_Carregamento": "Concluido",
    "Status_Descarregamento": "Descarregado",
    "Descarregamento_Inicio": "2026-01-31 07:08",
    "Descarregamento_Final": "2026-01-31 07:13",
    "Descarregamento_Tempo_Min": 5,
    "Descarregamento_Meta": "DENTRO"
  },
  {
    "Mapa": 10471,
    "Veiculo": "RTY8K12",
    "Colaborador_Carregamento": "Marcos Antônio Santos",
    "Data_Carregamento": "30/01/2026",
    "Carregamento_Label": "Carregamento",
    "Carregamento_Inicio": "2026-01-30 22:35",
    "Carregamento_Final": "2026-01-30 22:52",
    "Carregamento_Tempo_Min": 17,
    "Carregamento_Meta": "DENTRO",
    "Colaborador_Descarregamento": "Marcos Antônio Santos",
    "Data_Fechamento_Rota": "31/01/2026",
    "Dia_Semana_Fechamento": "Sábado",
    "Categoria_Final": "D0",
    "Qtd_Pallets": 12,
    "Status_Carregamento": "Concluido",
    "Status_Descarregamento": "Descarregado",
    "Descarregamento_Inicio": "2026-01-31 07:20",
    "Descarregamento_Final": "2026-01-31 07:28",
    "Descarregamento_Tempo_Min": 8,
    "Descarregamento_Meta": "DENTRO"
  },
  {
    "Mapa": 10472,
    "Veiculo": "KLP9A44",
    "Colaborador_Carregamento": "Paulo Pereira da Silva",
    "Data_Carregamento": "30/01/2026",
    "Carregamento_Label": "Carregamento",
    "Carregamento_Inicio": "2026-01-30 23:05",
    "Carregamento_Final": "2026-01-30 23:25",
    "Carregamento_Tempo_Min": 20,
    "Carregamento_Meta": "DENTRO",
    "Colaborador_Descarregamento": "José Ronildo",
    "Data_Fechamento_Rota": "31/01/2026",
    "Dia_Semana_Fechamento": "Sábado",
    "Categoria_Final": "D1",
    "Qtd_Pallets": 14,
    "Status_Carregamento": "Concluido",
    "Status_Descarregamento": "Descarregado",
    "Descarregamento_Inicio": "2026-01-31 08:15",
    "Descarregamento_Final": "2026-01-31 08:24",
    "Descarregamento_Tempo_Min": 9,
    "Descarregamento_Meta": "DENTRO"
  }
];
