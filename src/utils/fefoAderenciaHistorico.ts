// Gerenciador e histórico de Aderência e Realocação ao Giro de FEFO (Meta corporativa ≥ 90%, histórico padrão em 89-100%)

export interface RegistroAderenciaFefo {
  id: string;
  mesKey: string; // '01'..'12'
  mesNome: string; // 'Janeiro', 'Fevereiro', ...
  ano: number;
  aderenciaPct: number; // Ex: 89
  totalExpedidoCx: number;
  conformeFefoCx: number;
  desviosCx: number;
  totalHectolitros: number;
  motivoPrincipalDesvio?: string;
  responsavelAuditoria?: string;
  dataFechamento?: string;
  status: 'Conforme' | 'Atenção' | 'Crítico';
}

export interface ColaboradorInfoGiro {
  nomeOficial: string;
  matricula: string;
  cargo: string;
  apelido: string;
  turno?: string;
}

export interface AuditoriaGiroItem {
  id: string;
  data: string; // Data da quebra / registro
  dataColeta?: string; // Data da Coleta de Validade (Sempre Sexta-feira)
  dataLimiteRealocacao?: string; // Prazo limite da realocação (Até a Quinta-feira da próxima semana)
  dataHoraSolicitacao?: string; // ex: 26/08/2026 07:30
  dataConclusao?: string; // ex: 26/08/2026 07:38
  mesKey?: string; // '01'..'12'
  mesNome?: string; // 'Janeiro', 'Fevereiro', ...
  ano?: number; // 2026
  turno: 'Turno 1' | 'Turno 2' | 'Turno 3';
  codigoSku: string;
  descricaoSku: string;
  
  // Detalhamento do Giro de Realocação FEFO
  tipoQuebra: 'Estoque x Estoque' | 'Estoque x Picking';
  localizacaoOrigem: string; // onde o lote com quebra estava (ex: Rua A3, Bloco B2)
  localizacaoDestino: string; // para onde precisou girar (ex: Área Picking, Rua A1)
  
  // Validades Comparadas (Mais Próxima vs Mais Distante)
  loteExpedido: string; // lote girado / mais proximo
  validadeExpedida: string; // validade mais proxima (ex: 2026-09-15)
  loteMaisVelhoIgnorado?: string; // alias para compatibilidade
  validadeMaisVelhaIgnorada?: string;
  loteMaisDistante?: string; // lote comparado mais novo
  validadeMaisDistante?: string; // validade mais distante (ex: 2026-10-20)
  diferencaDias?: number; // dias de inversão
  
  quantidadeCaixas: number;
  houveDesvio: boolean; // se false, a quebra foi sanada / regularizada
  statusConclusao: 'Concluído' | 'Em Andamento' | 'Pendente';
  concluido: boolean;
  motivoDesvio?: string;
  
  // Colaborador / Empilhador Executor Oficial
  responsavel: string; // Label amigável (ex: Ronildo (Operador de Empilhadeira 2 - Bloco A))
  colaboradorOficial: ColaboradorInfoGiro;

  // Delegação e Tratativa
  delegadoPor?: string; // ex: Gilson Rosa (Conferente / Auditor)
  dataDelegacao?: string; // ex: 21/08/2026 14:30
  realizadoPor?: string; // ex: José Ronildo da Silva (Ronildo)
  tratativaDetalhada?: string; // Descrição detalhada da tratativa logística
}

/**
 * Mapeamento e associação inteligente de nomes informados para o cadastro oficial de colaboradores
 */
export function associarColaboradorOficial(nomeRaw: string): ColaboradorInfoGiro {
  const norm = (nomeRaw || '').toUpperCase().trim();
  
  if (norm.includes('RONILDO') || norm.includes('ROMILDO') || norm.includes('JOSE RONILDO') || norm.includes('JOSÉ RONILDO')) {
    return {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    };
  }
  
  if (norm.includes('MARIVALDO') || norm.includes('ARTUR ALVES') || norm.includes('MARIVALDO ARTUR')) {
    return {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    };
  }

  if (norm.includes('PAULO') || norm.includes('PEREIRA') || norm.includes('PAULO PEREIRA')) {
    return {
      nomeOficial: 'PAULO PEREIRA DA SILVA',
      matricula: 'G1013',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Paulo Pereira',
      turno: 'NOITE'
    };
  }

  return {
    nomeOficial: nomeRaw || 'COLABORADOR REGISTRADO',
    matricula: 'G0000',
    cargo: 'OPERADOR DE EMPILHADEIRA',
    apelido: nomeRaw || 'Operador',
    turno: 'GERAL'
  };
}

export const DEFAULT_HISTORICO_ADERENCIA: RegistroAderenciaFefo[] = [
  {
    id: 'aderencia-jan',
    mesKey: '01',
    mesNome: 'Janeiro',
    ano: 2026,
    aderenciaPct: 86.4,
    totalExpedidoCx: 18450,
    conformeFefoCx: 15940,
    desviosCx: 2510,
    totalHectolitros: 2214,
    motivoPrincipalDesvio: 'Obstrução física em rua secundária do Bloco B sanada no ciclo semanal',
    responsavelAuditoria: 'Ronildo & Marivaldo (Operação de Empilhadeiras)',
    dataFechamento: '31/01/2026',
    status: 'Atenção'
  },
  {
    id: 'aderencia-fev',
    mesKey: '02',
    mesNome: 'Fevereiro',
    ano: 2026,
    aderenciaPct: 87.8,
    totalExpedidoCx: 16800,
    conformeFefoCx: 14750,
    desviosCx: 2050,
    totalHectolitros: 2016,
    motivoPrincipalDesvio: 'Ajuste de combo comercial no canal autosserviço regularizado no prazo',
    responsavelAuditoria: 'Ronildo & Marivaldo (Operação de Empilhadeiras)',
    dataFechamento: '28/02/2026',
    status: 'Atenção'
  },
  {
    id: 'aderencia-mar',
    mesKey: '03',
    mesNome: 'Março',
    ano: 2026,
    aderenciaPct: 88.2,
    totalExpedidoCx: 21300,
    conformeFefoCx: 18786,
    desviosCx: 2514,
    totalHectolitros: 2556,
    motivoPrincipalDesvio: 'Ressuprimento da frente de picking acelerado de segunda a quarta',
    responsavelAuditoria: 'Ronildo & Marivaldo (Operação de Empilhadeiras)',
    dataFechamento: '31/03/2026',
    status: 'Atenção'
  },
  {
    id: 'aderencia-abr',
    mesKey: '04',
    mesNome: 'Abril',
    ano: 2026,
    aderenciaPct: 88.9,
    totalExpedidoCx: 19750,
    conformeFefoCx: 17558,
    desviosCx: 2192,
    totalHectolitros: 2370,
    motivoPrincipalDesvio: 'Implementação de etiquetas semafóricas e padronização das realocações',
    responsavelAuditoria: 'Ronildo & Marivaldo (Operação de Empilhadeiras)',
    dataFechamento: '30/04/2026',
    status: 'Atenção'
  },
  // Início da tendência positiva nos últimos 4 meses (Maio, Junho, Julho e Agosto)
  {
    id: 'aderencia-mai',
    mesKey: '05',
    mesNome: 'Maio',
    ano: 2026,
    aderenciaPct: 92.5,
    totalExpedidoCx: 22400,
    conformeFefoCx: 20720,
    desviosCx: 1680,
    totalHectolitros: 2688,
    motivoPrincipalDesvio: 'Evolução positiva: Giros de FEFO executados por Ronildo e Marivaldo após coleta de sexta-feira',
    responsavelAuditoria: 'Ronildo & Marivaldo (Empilhadores Oficiais)',
    dataFechamento: '31/05/2026',
    status: 'Conforme'
  },
  {
    id: 'aderencia-jun',
    mesKey: '06',
    mesNome: 'Junho',
    ano: 2026,
    aderenciaPct: 94.8,
    totalExpedidoCx: 23150,
    conformeFefoCx: 21946,
    desviosCx: 1204,
    totalHectolitros: 2778,
    motivoPrincipalDesvio: 'Tendência ascendente consolidada: Realocações concluídas até quinta-feira da semana seguinte',
    responsavelAuditoria: 'Ronildo & Marivaldo (Operação Empilhadeiras)',
    dataFechamento: '30/06/2026',
    status: 'Conforme'
  },
  {
    id: 'aderencia-jul',
    mesKey: '07',
    mesNome: 'Julho',
    ano: 2026,
    aderenciaPct: 100.0,
    totalExpedidoCx: 24500,
    conformeFefoCx: 24500,
    desviosCx: 0,
    totalHectolitros: 2940,
    motivoPrincipalDesvio: 'Atingimento pleno: 100% de quebras sanadas e giros concluídos com sucesso dentro do prazo',
    responsavelAuditoria: 'Ronildo & Marivaldo (Empilhadores Responsáveis)',
    dataFechamento: '31/07/2026',
    status: 'Conforme'
  },
  {
    id: 'aderencia-ago',
    mesKey: '08',
    mesNome: 'Agosto (Atual)',
    ano: 2026,
    aderenciaPct: 100.0,
    totalExpedidoCx: 26800,
    conformeFefoCx: 26800,
    desviosCx: 0,
    totalHectolitros: 3216,
    motivoPrincipalDesvio: '100% dos giros de FEFO executados e concluídos com sucesso por Ronildo e Marivaldo após quebras identificadas na conferência de sexta-feira.',
    responsavelAuditoria: 'Ronildo & Marivaldo (Operação de Empilhadeiras)',
    dataFechamento: '27/08/2026',
    status: 'Conforme'
  }
];

export const DEFAULT_AUDITORIA_GIRO_ITEMS: AuditoriaGiroItem[] = [
  // ==========================================
  // AGOSTO 2026 (MÊS ATUAL)
  // Coletas na Sexta-feira -> Realocações concluídas até Quinta-feira
  // ==========================================
  {
    id: 'aud-ronildo-ago-26-final',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '26/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 16:10',
    dataConclusao: '26/08/2026 16:22',
    turno: 'Turno 1',
    codigoSku: '2548',
    descricaoSku: 'BUDWEISER 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A3 (Estoque Pulmão)',
    localizacaoDestino: 'Área Picking (Box 01)',
    loteExpedido: 'LOTE-20270401-RON',
    validadeExpedida: '2027-04-01',
    loteMaisDistante: 'LOTE-20270515-PK1',
    validadeMaisDistante: '2027-05-15',
    diferencaDias: 44,
    quantidadeCaixas: 250,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO finalizado na quarta-feira (último do ciclo da semana). Realocação da Rua A3 para Área Picking executada e 100% regularizada na fila FEFO.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-marivaldo-ago-26-final-2',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '26/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 16:30',
    dataConclusao: '26/08/2026 16:45',
    turno: 'Turno 2',
    codigoSku: '21020',
    descricaoSku: 'BUDWEISER LT SLEEK 350ML CX CART C 12',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B2 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A - Frente)',
    loteExpedido: 'LOTE-20270323-MAR',
    validadeExpedida: '2027-03-23',
    loteMaisDistante: 'LOTE-20270510-EST',
    validadeMaisDistante: '2027-05-10',
    diferencaDias: 48,
    quantidadeCaixas: 250,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído e finalizado na quarta-feira com 100% de regularização. Realocação da Rua B2 para Rua A1 executada com sucesso.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },
  {
    id: 'aud-ronildo-ago-26-01',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '26/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 07:30',
    dataConclusao: '26/08/2026 07:38',
    turno: 'Turno 1',
    codigoSku: '001',
    descricaoSku: 'SKOL 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A3 (Estoque Pulmão)',
    localizacaoDestino: 'Área Picking',
    loteExpedido: 'L-2608-SKOL-R1',
    validadeExpedida: '2026-09-15',
    loteMaisDistante: 'L-2608-SKOL-P1',
    validadeMaisDistante: '2026-10-20',
    diferencaDias: 35,
    quantidadeCaixas: 320,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído com sucesso após quebra Estoque x Picking. Realocação da Rua A3 para Área Picking executada e regularizada.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-marivaldo-ago-26-02',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '26/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 08:15',
    dataConclusao: '26/08/2026 08:26',
    turno: 'Turno 1',
    codigoSku: '002',
    descricaoSku: 'BRAHMA 600ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B2 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-2608-BRA-M1',
    validadeExpedida: '2026-08-10',
    loteMaisDistante: 'L-2608-BRA-A1',
    validadeMaisDistante: '2026-09-28',
    diferencaDias: 49,
    quantidadeCaixas: 280,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído com sucesso após quebra Estoque x Estoque. Realocação da Rua B2 para Rua A1 executada com regularização completa.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },
  {
    id: 'aud-ronildo-ago-25-01',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '25/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 09:00',
    dataConclusao: '25/08/2026 09:09',
    turno: 'Turno 2',
    codigoSku: '004',
    descricaoSku: 'BUDWEISER 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A2 (Estoque Central)',
    localizacaoDestino: 'Área Picking',
    loteExpedido: 'L-2508-BUD-R2',
    validadeExpedida: '2026-09-01',
    loteMaisDistante: 'L-2508-BUD-PK',
    validadeMaisDistante: '2026-10-12',
    diferencaDias: 41,
    quantidadeCaixas: 210,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído após quebra Estoque x Picking. Lote do estoque A2 transferido para a frente do picking.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-marivaldo-ago-25-02',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '25/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 10:20',
    dataConclusao: '25/08/2026 10:33',
    turno: 'Turno 2',
    codigoSku: '003',
    descricaoSku: 'STELLA ARTOIS 269ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua C2 (Bloco C)',
    localizacaoDestino: 'Rua A2 (Bloco A)',
    loteExpedido: 'L-2508-STE-M2',
    validadeExpedida: '2026-11-05',
    loteMaisDistante: 'L-2508-STE-A2',
    validadeMaisDistante: '2026-11-27',
    diferencaDias: 22,
    quantidadeCaixas: 450,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído após inversão de ruas. Lote da Rua C2 reposicionado para Bloco A2.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },
  {
    id: 'aud-ronildo-ago-24-01',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '24/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 08:00',
    dataConclusao: '24/08/2026 08:11',
    turno: 'Turno 1',
    codigoSku: '005',
    descricaoSku: 'GUARANÁ ANTARCTICA 2L',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua B1 (Estoque Central)',
    localizacaoDestino: 'Área Picking',
    loteExpedido: 'L-2408-GUA-R1',
    validadeExpedida: '2026-12-20',
    loteMaisDistante: 'L-2408-GUA-PK',
    validadeMaisDistante: '2027-01-07',
    diferencaDias: 18,
    quantidadeCaixas: 600,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído com sucesso após quebra detectada na conferência de validade. Estoque B1 -> Picking.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-marivaldo-ago-24-02',
    mesKey: '08',
    mesNome: 'Agosto',
    ano: 2026,
    data: '24/08/2026',
    dataColeta: '21/08/2026 (Sexta-feira)',
    dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
    dataHoraSolicitacao: '21/08/2026 09:30',
    dataConclusao: '24/08/2026 09:41',
    turno: 'Turno 2',
    codigoSku: '006',
    descricaoSku: 'CORONA EXTRA 330ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua C1 (Bloco C)',
    localizacaoDestino: 'Rua A3 (Bloco A)',
    loteExpedido: 'L-2408-COR-M2',
    validadeExpedida: '2026-10-18',
    loteMaisDistante: 'L-2408-COR-A3',
    validadeMaisDistante: '2026-11-20',
    diferencaDias: 33,
    quantidadeCaixas: 380,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO concluído após inversão Bloco C1 -> Bloco A3.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },

  // ==========================================
  // JULHO 2026 (100% FEFO)
  // Coletas na Sexta-feira -> Realocações concluídas até Quinta-feira
  // ==========================================
  {
    id: 'aud-jul-01',
    mesKey: '07',
    mesNome: 'Julho',
    ano: 2026,
    data: '15/07/2026',
    dataColeta: '10/07/2026 (Sexta-feira)',
    dataLimiteRealocacao: '16/07/2026 (Quinta-feira)',
    dataHoraSolicitacao: '10/07/2026 08:00',
    dataConclusao: '15/07/2026 09:15',
    turno: 'Turno 1',
    codigoSku: '2548',
    descricaoSku: 'BUDWEISER 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A3 (Estoque Pulmão)',
    localizacaoDestino: 'Área Picking (Box 01)',
    loteExpedido: 'L-JUL-BUD-01',
    validadeExpedida: '2026-11-10',
    loteMaisDistante: 'L-JUL-BUD-PK',
    validadeMaisDistante: '2026-12-25',
    diferencaDias: 45,
    quantidadeCaixas: 300,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Realocação de giro FEFO concluída dentro do prazo semanal. Lote mais próximo transferido ao picking.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-jul-02',
    mesKey: '07',
    mesNome: 'Julho',
    ano: 2026,
    data: '16/07/2026',
    dataColeta: '10/07/2026 (Sexta-feira)',
    dataLimiteRealocacao: '16/07/2026 (Quinta-feira)',
    dataHoraSolicitacao: '10/07/2026 08:30',
    dataConclusao: '16/07/2026 10:20',
    turno: 'Turno 1',
    codigoSku: '002',
    descricaoSku: 'BRAHMA 600ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B1 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-JUL-BRA-02',
    validadeExpedida: '2026-10-15',
    loteMaisDistante: 'L-JUL-BRA-A1',
    validadeMaisDistante: '2026-11-30',
    diferencaDias: 46,
    quantidadeCaixas: 320,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Inversão física entre ruas B1 e A1 sanada com 100% de conformidade.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },
  {
    id: 'aud-jul-03',
    mesKey: '07',
    mesNome: 'Julho',
    ano: 2026,
    data: '22/07/2026',
    dataColeta: '17/07/2026 (Sexta-feira)',
    dataLimiteRealocacao: '23/07/2026 (Quinta-feira)',
    dataHoraSolicitacao: '17/07/2026 08:00',
    dataConclusao: '22/07/2026 08:45',
    turno: 'Turno 1',
    codigoSku: '008',
    descricaoSku: 'ORIGINAL 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua B2 (Estoque)',
    localizacaoDestino: 'Área Picking (Box 03)',
    loteExpedido: 'L-JUL-ORI-03',
    validadeExpedida: '2026-11-20',
    loteMaisDistante: 'L-JUL-ORI-PK',
    validadeMaisDistante: '2027-01-05',
    diferencaDias: 46,
    quantidadeCaixas: 280,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro FEFO concluído no box de picking com antecedência.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-jul-04',
    mesKey: '07',
    mesNome: 'Julho',
    ano: 2026,
    data: '23/07/2026',
    dataColeta: '17/07/2026 (Sexta-feira)',
    dataLimiteRealocacao: '23/07/2026 (Quinta-feira)',
    dataHoraSolicitacao: '17/07/2026 09:00',
    dataConclusao: '23/07/2026 11:00',
    turno: 'Turno 2',
    codigoSku: '18807',
    descricaoSku: 'STELLA ARTOIS LONG NECK 330ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua C1 (Bloco C)',
    localizacaoDestino: 'Rua A2 (Bloco A)',
    loteExpedido: 'L-JUL-STE-04',
    validadeExpedida: '2026-12-05',
    loteMaisDistante: 'L-JUL-STE-A2',
    validadeMaisDistante: '2027-01-20',
    diferencaDias: 46,
    quantidadeCaixas: 400,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Marivaldo reposicionando Stella Artois para rua prioritária.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },

  // ==========================================
  // JUNHO 2026 (94.8% FEFO)
  // ==========================================
  {
    id: 'aud-jun-01',
    mesKey: '06',
    mesNome: 'Junho',
    ano: 2026,
    data: '10/06/2026',
    dataColeta: '05/06/2026 (Sexta-feira)',
    dataLimiteRealocacao: '11/06/2026 (Quinta-feira)',
    dataHoraSolicitacao: '05/06/2026 08:00',
    dataConclusao: '10/06/2026 08:35',
    turno: 'Turno 1',
    codigoSku: '007',
    descricaoSku: 'SPATEN 355ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua B2 (Estoque)',
    localizacaoDestino: 'Área Picking (Box 04)',
    loteExpedido: 'L-JUN-SPA-01',
    validadeExpedida: '2026-10-08',
    loteMaisDistante: 'L-JUN-SPA-PK',
    validadeMaisDistante: '2026-11-20',
    diferencaDias: 43,
    quantidadeCaixas: 340,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Ronildo transferindo lote mais novo da frente para o fundo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-jun-02',
    mesKey: '06',
    mesNome: 'Junho',
    ano: 2026,
    data: '11/06/2026',
    dataColeta: '05/06/2026 (Sexta-feira)',
    dataLimiteRealocacao: '11/06/2026 (Quinta-feira)',
    dataHoraSolicitacao: '05/06/2026 09:00',
    dataConclusao: '11/06/2026 09:40',
    turno: 'Turno 2',
    codigoSku: '006',
    descricaoSku: 'CORONA EXTRA 330ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua C2 (Bloco C)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-JUN-COR-02',
    validadeExpedida: '2026-09-30',
    loteMaisDistante: 'L-JUN-COR-A1',
    validadeMaisDistante: '2026-11-15',
    diferencaDias: 46,
    quantidadeCaixas: 260,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Inversão sanada no prazo limite da quinta-feira.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },
  {
    id: 'aud-jun-03',
    mesKey: '06',
    mesNome: 'Junho',
    ano: 2026,
    data: '17/06/2026',
    dataColeta: '12/06/2026 (Sexta-feira)',
    dataLimiteRealocacao: '18/06/2026 (Quinta-feira)',
    dataHoraSolicitacao: '12/06/2026 08:30',
    dataConclusao: '17/06/2026 09:10',
    turno: 'Turno 1',
    codigoSku: '005',
    descricaoSku: 'GUARANÁ ANTARCTICA 2L',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua B1 (Estoque)',
    localizacaoDestino: 'Área Picking',
    loteExpedido: 'L-JUN-GUA-03',
    validadeExpedida: '2026-11-25',
    loteMaisDistante: 'L-JUN-GUA-PK',
    validadeMaisDistante: '2027-01-10',
    diferencaDias: 46,
    quantidadeCaixas: 500,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Ronildo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },

  // ==========================================
  // MAIO 2026 (92.5% FEFO)
  // ==========================================
  {
    id: 'aud-mai-01',
    mesKey: '05',
    mesNome: 'Maio',
    ano: 2026,
    data: '13/05/2026',
    dataColeta: '08/05/2026 (Sexta-feira)',
    dataLimiteRealocacao: '14/05/2026 (Quinta-feira)',
    dataHoraSolicitacao: '08/05/2026 08:00',
    dataConclusao: '13/05/2026 09:00',
    turno: 'Turno 1',
    codigoSku: '001',
    descricaoSku: 'SKOL 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A3 (Estoque)',
    localizacaoDestino: 'Área Picking (Box 01)',
    loteExpedido: 'L-MAI-SKOL-01',
    validadeExpedida: '2026-08-30',
    loteMaisDistante: 'L-MAI-SKOL-PK',
    validadeMaisDistante: '2026-10-15',
    diferencaDias: 46,
    quantidadeCaixas: 310,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro regular de FEFO executado por Ronildo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-mai-02',
    mesKey: '05',
    mesNome: 'Maio',
    ano: 2026,
    data: '14/05/2026',
    dataColeta: '08/05/2026 (Sexta-feira)',
    dataLimiteRealocacao: '14/05/2026 (Quinta-feira)',
    dataHoraSolicitacao: '08/05/2026 09:00',
    dataConclusao: '14/05/2026 10:15',
    turno: 'Turno 2',
    codigoSku: '002',
    descricaoSku: 'BRAHMA 600ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B2 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-MAI-BRA-02',
    validadeExpedida: '2026-08-20',
    loteMaisDistante: 'L-MAI-BRA-A1',
    validadeMaisDistante: '2026-09-30',
    diferencaDias: 41,
    quantidadeCaixas: 290,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Marivaldo no prazo limite de quinta-feira.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },

  // ==========================================
  // ABRIL 2026 (88.9% FEFO)
  // ==========================================
  {
    id: 'aud-abr-01',
    mesKey: '04',
    mesNome: 'Abril',
    ano: 2026,
    data: '15/04/2026',
    dataColeta: '10/04/2026 (Sexta-feira)',
    dataLimiteRealocacao: '16/04/2026 (Quinta-feira)',
    dataHoraSolicitacao: '10/04/2026 08:00',
    dataConclusao: '15/04/2026 08:50',
    turno: 'Turno 1',
    codigoSku: '004',
    descricaoSku: 'BUDWEISER 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A2 (Estoque)',
    localizacaoDestino: 'Área Picking',
    loteExpedido: 'L-ABR-BUD-01',
    validadeExpedida: '2026-07-30',
    loteMaisDistante: 'L-ABR-BUD-PK',
    validadeMaisDistante: '2026-09-10',
    diferencaDias: 42,
    quantidadeCaixas: 230,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro de FEFO executado por Ronildo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-abr-02',
    mesKey: '04',
    mesNome: 'Abril',
    ano: 2026,
    data: '16/04/2026',
    dataColeta: '10/04/2026 (Sexta-feira)',
    dataLimiteRealocacao: '16/04/2026 (Quinta-feira)',
    dataHoraSolicitacao: '10/04/2026 09:00',
    dataConclusao: '16/04/2026 10:30',
    turno: 'Turno 2',
    codigoSku: '33818',
    descricaoSku: 'ORIGINAL LATA 350ML SHRINK C/12',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B1 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-ABR-ORI-02',
    validadeExpedida: '2026-08-15',
    loteMaisDistante: 'L-ABR-ORI-A1',
    validadeMaisDistante: '2026-09-25',
    diferencaDias: 41,
    quantidadeCaixas: 320,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro executado por Marivaldo.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },

  // ==========================================
  // MARÇO 2026 (88.2% FEFO)
  // ==========================================
  {
    id: 'aud-mar-01',
    mesKey: '03',
    mesNome: 'Março',
    ano: 2026,
    data: '11/03/2026',
    dataColeta: '06/03/2026 (Sexta-feira)',
    dataLimiteRealocacao: '12/03/2026 (Quinta-feira)',
    dataHoraSolicitacao: '06/03/2026 08:00',
    dataConclusao: '11/03/2026 08:40',
    turno: 'Turno 1',
    codigoSku: '007',
    descricaoSku: 'SPATEN 355ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua B1 (Estoque)',
    localizacaoDestino: 'Área Picking (Box 04)',
    loteExpedido: 'L-MAR-SPA-01',
    validadeExpedida: '2026-07-15',
    loteMaisDistante: 'L-MAR-SPA-PK',
    validadeMaisDistante: '2026-08-30',
    diferencaDias: 46,
    quantidadeCaixas: 280,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Ronildo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-mar-02',
    mesKey: '03',
    mesNome: 'Março',
    ano: 2026,
    data: '12/03/2026',
    dataColeta: '06/03/2026 (Sexta-feira)',
    dataLimiteRealocacao: '12/03/2026 (Quinta-feira)',
    dataHoraSolicitacao: '06/03/2026 09:00',
    dataConclusao: '12/03/2026 09:30',
    turno: 'Turno 2',
    codigoSku: '9068',
    descricaoSku: 'SKOL LATA 350ML SH C/12',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B2 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-MAR-SKO-02',
    validadeExpedida: '2026-07-10',
    loteMaisDistante: 'L-MAR-SKO-A1',
    validadeMaisDistante: '2026-08-20',
    diferencaDias: 41,
    quantidadeCaixas: 450,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Marivaldo.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },

  // ==========================================
  // FEVEREIRO 2026 (87.8% FEFO)
  // ==========================================
  {
    id: 'aud-fev-01',
    mesKey: '02',
    mesNome: 'Fevereiro',
    ano: 2026,
    data: '11/02/2026',
    dataColeta: '06/02/2026 (Sexta-feira)',
    dataLimiteRealocacao: '12/02/2026 (Quinta-feira)',
    dataHoraSolicitacao: '06/02/2026 08:00',
    dataConclusao: '11/02/2026 08:30',
    turno: 'Turno 1',
    codigoSku: '006',
    descricaoSku: 'CORONA EXTRA 330ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua C1 (Estoque)',
    localizacaoDestino: 'Área Picking (Box 02)',
    loteExpedido: 'L-FEV-COR-01',
    validadeExpedida: '2026-06-25',
    loteMaisDistante: 'L-FEV-COR-PK',
    validadeMaisDistante: '2026-08-10',
    diferencaDias: 46,
    quantidadeCaixas: 240,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Ronildo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-fev-02',
    mesKey: '02',
    mesNome: 'Fevereiro',
    ano: 2026,
    data: '12/02/2026',
    dataColeta: '06/02/2026 (Sexta-feira)',
    dataLimiteRealocacao: '12/02/2026 (Quinta-feira)',
    dataHoraSolicitacao: '06/02/2026 09:00',
    dataConclusao: '12/02/2026 09:50',
    turno: 'Turno 2',
    codigoSku: '008',
    descricaoSku: 'ORIGINAL 600ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B3 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-FEV-ORI-02',
    validadeExpedida: '2026-06-20',
    loteMaisDistante: 'L-FEV-ORI-A1',
    validadeMaisDistante: '2026-08-05',
    diferencaDias: 46,
    quantidadeCaixas: 300,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro concluído por Marivaldo.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  },

  // ==========================================
  // JANEIRO 2026 (86.4% FEFO)
  // ==========================================
  {
    id: 'aud-jan-01',
    mesKey: '01',
    mesNome: 'Janeiro',
    ano: 2026,
    data: '14/01/2026',
    dataColeta: '09/01/2026 (Sexta-feira)',
    dataLimiteRealocacao: '15/01/2026 (Quinta-feira)',
    dataHoraSolicitacao: '09/01/2026 08:00',
    dataConclusao: '14/01/2026 08:45',
    turno: 'Turno 1',
    codigoSku: '001',
    descricaoSku: 'SKOL 600ML',
    tipoQuebra: 'Estoque x Picking',
    localizacaoOrigem: 'Rua A2 (Estoque)',
    localizacaoDestino: 'Área Picking (Box 01)',
    loteExpedido: 'L-JAN-SKOL-01',
    validadeExpedida: '2026-05-20',
    loteMaisDistante: 'L-JAN-SKOL-PK',
    validadeMaisDistante: '2026-07-05',
    diferencaDias: 46,
    quantidadeCaixas: 330,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro regular executado por Ronildo.',
    responsavel: 'Ronildo (Operador de Empilhadeira 2 - Bloco A)',
    colaboradorOficial: {
      nomeOficial: 'JOSE RONILDO DA SILVA',
      matricula: 'G1093',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Ronildo',
      turno: 'TARDE'
    }
  },
  {
    id: 'aud-jan-02',
    mesKey: '01',
    mesNome: 'Janeiro',
    ano: 2026,
    data: '15/01/2026',
    dataColeta: '09/01/2026 (Sexta-feira)',
    dataLimiteRealocacao: '15/01/2026 (Quinta-feira)',
    dataHoraSolicitacao: '09/01/2026 09:00',
    dataConclusao: '15/01/2026 10:10',
    turno: 'Turno 2',
    codigoSku: '002',
    descricaoSku: 'BRAHMA 600ML',
    tipoQuebra: 'Estoque x Estoque',
    localizacaoOrigem: 'Rua B1 (Bloco B)',
    localizacaoDestino: 'Rua A1 (Bloco A)',
    loteExpedido: 'L-JAN-BRA-02',
    validadeExpedida: '2026-05-15',
    loteMaisDistante: 'L-JAN-BRA-A1',
    validadeMaisDistante: '2026-06-30',
    diferencaDias: 46,
    quantidadeCaixas: 350,
    houveDesvio: false,
    statusConclusao: 'Concluído',
    concluido: true,
    motivoDesvio: 'Giro executado por Marivaldo.',
    responsavel: 'Marivaldo (Operador de Empilhadeira 1 - Bloco B)',
    colaboradorOficial: {
      nomeOficial: 'MARIVALDO ARTUR ALVES',
      matricula: 'G1071',
      cargo: 'OPERADOR DE EMPILHADEIRA',
      apelido: 'Marivaldo',
      turno: 'MANHÃ'
    }
  }
];

export function getStoredAderenciaHistorico(companyId: string): RegistroAderenciaFefo[] {
  const key = `fefo_aderencia_historico_${companyId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler histórico de aderência:', e);
  }
  return DEFAULT_HISTORICO_ADERENCIA;
}

export function saveAderenciaHistorico(companyId: string, list: RegistroAderenciaFefo[]): void {
  const key = `fefo_aderencia_historico_${companyId}`;
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event('fefo_aderencia_updated'));
  } catch (e) {
    console.error('Erro ao salvar histórico de aderência:', e);
  }
}

import { gerarQuebrasFefoConsolidadas } from './fefoDataGenerator';

export function getStoredAuditoriaGiro(companyId: string): AuditoriaGiroItem[] {
  const key = `fefo_auditoria_giro_${companyId}_v3`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 80) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler auditorias de giro:', e);
  }
  const generated = gerarQuebrasFefoConsolidadas();
  saveAuditoriaGiro(companyId, generated);
  return generated;
}

export function saveAuditoriaGiro(companyId: string, list: AuditoriaGiroItem[]): void {
  const key = `fefo_auditoria_giro_${companyId}_v3`;
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new Event('fefo_auditoria_updated'));
  } catch (e) {
    console.error('Erro ao salvar auditorias de giro:', e);
  }
}

