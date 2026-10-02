// Gerador otimizado e cacheado de 10 a 15 Quebras de FEFO por Mês (Jan a Ago 2026)
// 100% interligado com as Recolhas de Validade do Stock Age Index
import { AuditoriaGiroItem, ColaboradorInfoGiro, associarColaboradorOficial } from './fefoAderenciaHistorico';
import { FefoBreakItem, FefoBreakStatus, FefoBreakType } from './fefoHistoricoQuebrasManager';

// Produtos Reais do Mapeamento do Armazém
const PRODUTOS_BASE = [
  { codigo: '2548', descricao: 'BUDWEISER 600ML', curva: 'A' },
  { codigo: '9068', descricao: 'SKOL LATA 350ML SH C/12 NPAL', curva: 'A' },
  { codigo: '9069', descricao: 'BRAHMA CHOPP LATA 350ML SH C/12 NPAL', curva: 'A' },
  { codigo: '21020', descricao: 'BUDWEISER LT SLEEK 350ML CX CART C 12', curva: 'A' },
  { codigo: '18807', descricao: 'STELLA ARTOIS LONG NECK 330ML SIX-PACK', curva: 'B' },
  { codigo: '006', descricao: 'CORONA EXTRA 330ML', curva: 'B' },
  { codigo: '007', descricao: 'SPATEN 355ML LN', curva: 'A' },
  { codigo: '008', descricao: 'ORIGINAL 600ML', curva: 'A' },
  { codigo: '7945', descricao: 'PEPSI COLA PET 2L CAIXA C/6', curva: 'B' },
  { codigo: '19321', descricao: 'GUARANA ANTARCTICA PET 2L C/6', curva: 'A' },
  { codigo: '33818', descricao: 'ORIGINAL LATA 350ML SHRINK C/12', curva: 'A' },
  { codigo: '9083', descricao: 'SKOL LT 473ML SH C/12 NPAL', curva: 'A' },
  { codigo: '1024', descricao: 'BEATS SENSES LATA 269ML C/8', curva: 'B' },
  { codigo: '3120', descricao: 'STELLA ARTOIS SEM GLUTEN 330ML', curva: 'C' }
];

const RUAS_ESTOQUE = ['Rua A1', 'Rua A2', 'Rua A3', 'Rua B1', 'Rua B2', 'Rua B3', 'Rua C1', 'Rua C2', 'Rua C3'];
const BOXES_PICKING = ['Área Picking (Box 01)', 'Área Picking (Box 02)', 'Área Picking (Box 03)', 'Área Picking (Box 04)', 'Área Picking (Box 05)'];

interface MesConfigGen {
  mesKey: string;
  mesNome: string;
  ano: number;
  dataSextaColeta: string;
  dataLimiteQuinta: string;
  numRegistros: number; // 10 a 15
  pendentesIdx: number[]; // 1 a 2 como não concluída
}

const MESES_CONFIG_GEN: MesConfigGen[] = [
  { mesKey: '01', mesNome: 'Janeiro', ano: 2026, dataSextaColeta: '09/01/2026', dataLimiteQuinta: '15/01/2026', numRegistros: 12, pendentesIdx: [4, 11] },
  { mesKey: '02', mesNome: 'Fevereiro', ano: 2026, dataSextaColeta: '06/02/2026', dataLimiteQuinta: '12/02/2026', numRegistros: 11, pendentesIdx: [3, 9] },
  { mesKey: '03', mesNome: 'Março', ano: 2026, dataSextaColeta: '06/03/2026', dataLimiteQuinta: '12/03/2026', numRegistros: 13, pendentesIdx: [5, 10] },
  { mesKey: '04', mesNome: 'Abril', ano: 2026, dataSextaColeta: '10/04/2026', dataLimiteQuinta: '16/04/2026', numRegistros: 12, pendentesIdx: [2, 8] },
  { mesKey: '05', mesNome: 'Maio', ano: 2026, dataSextaColeta: '08/05/2026', dataLimiteQuinta: '14/05/2026', numRegistros: 14, pendentesIdx: [6] },
  { mesKey: '06', mesNome: 'Junho', ano: 2026, dataSextaColeta: '05/06/2026', dataLimiteQuinta: '11/06/2026', numRegistros: 13, pendentesIdx: [7] },
  { mesKey: '07', mesNome: 'Julho', ano: 2026, dataSextaColeta: '10/07/2026', dataLimiteQuinta: '16/07/2026', numRegistros: 14, pendentesIdx: [12] },
  { mesKey: '08', mesNome: 'Agosto', ano: 2026, dataSextaColeta: '21/08/2026', dataLimiteQuinta: '27/08/2026', numRegistros: 15, pendentesIdx: [14] }
];

let _cachedAuditorias: AuditoriaGiroItem[] | null = null;
let _cachedFefoBreaks: FefoBreakItem[] | null = null;

export function gerarQuebrasFefoConsolidadas(): AuditoriaGiroItem[] {
  if (_cachedAuditorias && _cachedAuditorias.length >= 90) {
    return _cachedAuditorias;
  }

  const result: AuditoriaGiroItem[] = [];

  MESES_CONFIG_GEN.forEach(mes => {
    for (let i = 0; i < mes.numRegistros; i++) {
      const prod = PRODUTOS_BASE[i % PRODUTOS_BASE.length];
      const isEstoquePicking = i % 2 === 0;
      const tipoQuebra: 'Estoque x Estoque' | 'Estoque x Picking' = isEstoquePicking ? 'Estoque x Picking' : 'Estoque x Estoque';
      const isPendente = mes.pendentesIdx.includes(i);
      
      const ruaOrigem = RUAS_ESTOQUE[(i + parseInt(mes.mesKey)) % RUAS_ESTOQUE.length];
      const ruaDestino = isEstoquePicking 
        ? BOXES_PICKING[i % BOXES_PICKING.length]
        : RUAS_ESTOQUE[(i + parseInt(mes.mesKey) + 3) % RUAS_ESTOQUE.length];

      const executorNome = (i % 2 === 0) ? 'JOSE RONILDO DA SILVA' : 'MARIVALDO ARTUR ALVES';
      const colabOficial: ColaboradorInfoGiro = associarColaboradorOficial(executorNome);

      const diaExec = Math.min(27, 9 + (i % 5) * 3);
      const diaExecStr = String(diaExec).padStart(2, '0');
      const dataExec = `${diaExecStr}/${mes.mesKey}/${mes.ano}`;
      // Conferente delega no MESMO DIA da coleta de validade
      const dataDelegacao = `${mes.dataSextaColeta} 14:${(10 + (i * 3) % 45).toString().padStart(2, '0')}`;
      const dataConclusao = isPendente ? undefined : `${dataExec} 08:${(20 + (i * 4) % 35).toString().padStart(2, '0')}`;

      // Validades
      const valMesProxima = parseInt(mes.mesKey) + 2;
      const valMesDistante = parseInt(mes.mesKey) + 4;
      const anoProxima = valMesProxima > 12 ? mes.ano + 1 : mes.ano;
      const anoDistante = valMesDistante > 12 ? mes.ano + 1 : mes.ano;
      const valMesProxStr = String(((valMesProxima - 1) % 12) + 1).padStart(2, '0');
      const valMesDistStr = String(((valMesDistante - 1) % 12) + 1).padStart(2, '0');

      const valProxima = `${anoProxima}-${valMesProxStr}-15`;
      const valDistante = `${anoDistante}-${valMesDistStr}-28`;

      const caixas = 180 + ((i * 45) % 450);

      const tratativa = isPendente
        ? `Tratativa em andamento: Quebra delegada por Gilson Rosa na coleta de validade de ${mes.dataSextaColeta}. Aguardando liberação física da ${ruaOrigem} para concluir realocação para ${ruaDestino}.`
        : isEstoquePicking
        ? `Tratativa concluída: Quebra de FEFO delegada por Gilson Rosa (Conferente) em ${mes.dataSextaColeta}. Realocação executada por ${colabOficial.apelido} (${colabOficial.matricula}) transferindo ${caixas} cx da ${ruaOrigem} para ${ruaDestino}. Lote mais antigo abastecido no picking.`
        : `Tratativa concluída: Inversão de estoque delegada por Gilson Rosa (Conferente) em ${mes.dataSextaColeta}. Realocação executada por ${colabOficial.apelido} (${colabOficial.matricula}) reposicionando paletes da ${ruaOrigem} para ${ruaDestino} com regularização total.`;

      result.push({
        id: `aud-${mes.mesKey}-${String(i + 1).padStart(2, '0')}-${prod.codigo}`,
        mesKey: mes.mesKey,
        mesNome: mes.mesNome,
        ano: mes.ano,
        data: dataExec,
        dataColeta: `${mes.dataSextaColeta} (Sexta-feira)`,
        dataLimiteRealocacao: `${mes.dataLimiteQuinta} (Quinta-feira)`,
        dataHoraSolicitacao: dataDelegacao,
        dataConclusao: dataConclusao,
        turno: (i % 2 === 0) ? 'Turno 1' : 'Turno 2',
        codigoSku: prod.codigo,
        descricaoSku: prod.descricao,
        tipoQuebra: tipoQuebra,
        localizacaoOrigem: ruaOrigem,
        localizacaoDestino: ruaDestino,
        loteExpedido: `LOTE-${mes.ano}${mes.mesKey}${String(i + 1).padStart(2, '0')}-A`,
        validadeExpedida: valProxima,
        loteMaisDistante: `LOTE-${mes.ano}${mes.mesKey}${String(i + 1).padStart(2, '0')}-B`,
        validadeMaisDistante: valDistante,
        diferencaDias: 45,
        quantidadeCaixas: caixas,
        houveDesvio: isPendente,
        statusConclusao: isPendente ? 'Pendente' : 'Concluído',
        concluido: !isPendente,
        motivoDesvio: tratativa,
        responsavel: `${colabOficial.apelido} (${colabOficial.cargo} - Matrícula ${colabOficial.matricula})`,
        colaboradorOficial: colabOficial,
        // Delegador Gilson Rosa Conferente no mesmo dia da coleta
        delegadoPor: 'Gilson Rosa (Conferente / Auditor)',
        dataDelegacao: dataDelegacao,
        realizadoPor: `${colabOficial.nomeOficial} (${colabOficial.apelido})`,
        tratativaDetalhada: tratativa
      } as any);
    }
  });

  _cachedAuditorias = result;
  return result;
}

export function gerarFefoBreakHistoryConsolidado(): FefoBreakItem[] {
  if (_cachedFefoBreaks && _cachedFefoBreaks.length >= 90) {
    return _cachedFefoBreaks;
  }

  const result: FefoBreakItem[] = [];

  MESES_CONFIG_GEN.forEach(mes => {
    for (let i = 0; i < mes.numRegistros; i++) {
      const prod = PRODUTOS_BASE[i % PRODUTOS_BASE.length];
      const isEstoquePicking = i % 2 === 0;
      const tipo: FefoBreakType = isEstoquePicking ? 'ESTOQUE_X_PICKING' : 'ESTOQUE_X_ESTOQUE';
      const isPendente = mes.pendentesIdx.includes(i);
      
      const ruaOrigem = RUAS_ESTOQUE[(i + parseInt(mes.mesKey)) % RUAS_ESTOQUE.length];
      const ruaDestino = isEstoquePicking 
        ? BOXES_PICKING[i % BOXES_PICKING.length]
        : RUAS_ESTOQUE[(i + parseInt(mes.mesKey) + 3) % RUAS_ESTOQUE.length];

      const executorNome = (i % 2 === 0) ? 'JOSE RONILDO DA SILVA' : 'MARIVALDO ARTUR ALVES';
      const colabOficial: ColaboradorInfoGiro = associarColaboradorOficial(executorNome);

      const diaExec = Math.min(27, 9 + (i % 5) * 3);
      const diaExecStr = String(diaExec).padStart(2, '0');
      const dataConclusaoStr = `${diaExecStr}/${mes.mesKey}/${mes.ano} 08:30`;
      
      // Conferente delega no MESMO DIA da coleta de validade (Sexta-feira)
      const dataDelegacao = `${mes.dataSextaColeta} 14:${(10 + (i * 3) % 45).toString().padStart(2, '0')}`;
      const dataConclusao = isPendente ? undefined : dataConclusaoStr;

      // Validades
      const valMesProxima = parseInt(mes.mesKey) + 2;
      const valMesDistante = parseInt(mes.mesKey) + 4;
      const anoProxima = valMesProxima > 12 ? mes.ano + 1 : mes.ano;
      const anoDistante = valMesDistante > 12 ? mes.ano + 1 : mes.ano;
      const valMesProxStr = String(((valMesProxima - 1) % 12) + 1).padStart(2, '0');
      const valMesDistStr = String(((valMesDistante - 1) % 12) + 1).padStart(2, '0');

      const valProxima = `${anoProxima}-${valMesProxStr}-15`;
      const valDistante = `${anoDistante}-${valMesDistStr}-28`;

      const caixas = 180 + ((i * 45) % 450);
      const valorRisco = Math.round(caixas * 38.5 * 100) / 100;

      const tratativa = isPendente
        ? `Tratativa em andamento: Quebra delegada por Gilson Rosa na coleta de validade (${mes.dataSextaColeta}). Aguardando liberação física da ${ruaOrigem} para concluir realocação para ${ruaDestino}.`
        : isEstoquePicking
        ? `Tratativa concluída: Quebra de FEFO delegada por Gilson Rosa (Conferente) em ${mes.dataSextaColeta}. Realocação executada por ${colabOficial.apelido} (${colabOficial.matricula}) transferindo ${caixas} cx da ${ruaOrigem} para ${ruaDestino}. Lote mais antigo abastecido no picking.`
        : `Tratativa concluída: Inversão de estoque delegada por Gilson Rosa (Conferente) em ${mes.dataSextaColeta}. Realocação executada por ${colabOficial.apelido} (${colabOficial.matricula}) reposicionando paletes da ${ruaOrigem} para ${ruaDestino} com regularização total.`;

      const status: FefoBreakStatus = isPendente ? 'pendente' : 'concluido';

      result.push({
        id: `fefo-break-${mes.mesKey}-${String(i + 1).padStart(2, '0')}-${prod.codigo}`,
        tipo: tipo,
        dataIdentificacao: mes.dataSextaColeta, // Data da coleta (mesmo dia da delegação)
        semanaNumero: Math.ceil(diaExec / 7),
        codigo: prod.codigo,
        descricao: prod.descricao,
        posicaoOrigem: ruaOrigem,
        posicaoDestino: ruaDestino,
        loteMaisVelho: `LOTE-${mes.ano}${mes.mesKey}${String(i + 1).padStart(2, '0')}-A`,
        loteMaisNovo: `LOTE-${mes.ano}${mes.mesKey}${String(i + 1).padStart(2, '0')}-B`,
        validadeMaisVelho: valProxima,
        validadeMaisNovo: valDistante,
        diasInversao: 45,
        quantidadeCaixas: caixas,
        caixasMaisVelho: caixas,
        caixasMaisNovo: Math.round(caixas * 0.4),
        valorRiscoRS: valorRisco,
        status: status,
        responsavel: `${colabOficial.nomeOficial} (${colabOficial.apelido} - Matrícula ${colabOficial.matricula})`,
        delegadoPor: 'Gilson Rosa (Conferente / Auditor)',
        dataDelegacao: dataDelegacao,
        dataConclusao: dataConclusao,
        acaoOperacional: isEstoquePicking
          ? `Abastecimento de Picking: Mover ${caixas} cx da ${ruaOrigem} para ${ruaDestino} priorizando validade ${valProxima}.`
          : `Giro de Estoque: Reposicionar ${caixas} cx da ${ruaOrigem} para ${ruaDestino} liberando lote com vencimento ${valProxima}.`,
        observacao: tratativa,
        tratativaDetalhada: tratativa,
        atualizadoEm: new Date().toISOString()
      });
    }
  });

  _cachedFefoBreaks = result;
  return result;
}
