import { AcaoCorretiva, classifyProcessFromActionFields } from '../utils/simulacaoAcoesUtils';

export interface RawAcaoItem {
  id: number;
  area: string;
  reuniao: string;
  responsavel: string;
  indicador: string;
  tipo_acao: string;
  o_que_fazer: string;
  acao: string;
  onde: string;
  inicio: string;
  final: string;
  prazo_dias: number;
  atraso_dias: number;
  status: string;
  farol: string;
  observacao_responsavel: string;
}

export function convertRawItemToAcaoCorretiva(item: RawAcaoItem): AcaoCorretiva {
  const proc = classifyProcessFromActionFields({
    indicador: item.indicador,
    oQueFazer: item.o_que_fazer,
    acao: item.acao,
    onde: item.onde,
    area: item.area,
    reuniao: item.reuniao
  });

  const rawStatus = (item.status || '').toUpperCase().trim();
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

  const rawTipo = (item.tipo_acao || '').toLowerCase();
  const normalizedTipo: 'Corretiva' | 'Melhoria' = rawTipo.includes('melhoria') ? 'Melhoria' : 'Corretiva';

  const isoInicio = item.inicio.includes('/') 
    ? item.inicio.split('/').reverse().join('-') 
    : item.inicio;
  const isoFinal = item.final.includes('/') 
    ? item.final.split('/').reverse().join('-') 
    : item.final;
  
  const displayInicio = item.inicio.includes('-') 
    ? item.inicio.split('-').reverse().join('/') 
    : item.inicio;
  const displayFinal = item.final.includes('-') 
    ? item.final.split('-').reverse().join('/') 
    : item.final;

  const prioridade: 'Alta' | 'Média' | 'Baixa' = 
    (item.atraso_dias > 0 || normalizedStatus === 'Atrasado') ? 'Alta' : (normalizedStatus === 'Pendente' ? 'Alta' : 'Média');

  return {
    id: `ACAO_2026_${item.id}`,
    data: displayInicio,
    dataISO: isoInicio,
    hora: '08:00',
    processo: proc,
    setor: item.area || 'Armazém',
    colaboradorResponsavel: item.responsavel || 'Djeanderson Soares',
    indicador: item.indicador,
    meta: 'Conforme Padrão DPO 2026',
    resultadoObtido: normalizedStatus === 'Concluído' ? 'Ação Tratada e Concluída' : 'Em Acompanhamento Ativo',
    desvioEncontrado: item.o_que_fazer || 'Desvio Operacional',
    causaRaiz: 'Método',
    causaRaizDetalhe: item.acao || item.o_que_fazer,
    status: normalizedStatus,
    responsavelTratativa: item.responsavel || 'Djeanderson Soares',
    prazo: isoFinal,
    comentarioOperador: item.observacao_responsavel || '',
    simulado: false,
    criadoEm: isoInicio ? `${isoInicio}T08:00:00.000Z` : new Date().toISOString(),
    tipoAcao: normalizedTipo,
    prioridade,
    contramedida: item.acao || item.o_que_fazer,
    aprovacaoGestor: 'Aprovado',
    aceiteColaborador: true,
    abertoPor: item.responsavel || 'Djeanderson Soares',
    dataAbertura: `${displayInicio} 08:00`,
    dataFechamento: normalizedStatus === 'Concluído' ? `${displayFinal} 17:00` : undefined,
    fechadoPor: normalizedStatus === 'Concluído' ? item.responsavel : undefined,

    area: item.area,
    reuniao: item.reuniao,
    onde: item.onde,
    inicio: displayInicio,
    final: displayFinal,
    obsResponsavel: item.observacao_responsavel,

    historicoAlteracoes: [{
      dataHora: `${displayInicio} 08:00`,
      usuario: item.responsavel || 'Djeanderson Soares',
      alteracao: `Ação oficial cadastrada no plano DPO 2026 para [${proc}] (Indicador: ${item.indicador}).`
    }]
  };
}
