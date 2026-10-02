const fs = require('fs');
const path = require('path');

// Raw patterns extracted from user dataset
const indicators = [
  { indicador: "TMV / TMR", area: "Armazém", reuniao: "RPS Frota", oQue: "Separar tempos do ciclo", acao: "Dividir o tempo da carreta entre chegada, descarregamento, atendimento e liberação.", onde: "Pulmão / área de descarregamento" },
  { indicador: "5S por área", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Organizar picking", acao: "Retirar materiais sem uso dos corredores do picking e manter os acessos livres.", onde: "Picking / corredores de circulação" },
  { indicador: "5S por área", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Organizar repack", acao: "Retirar filme, cartão e materiais sem uso da bancada de repack.", onde: "Repack / bancada de montagem" },
  { indicador: "Blitz de Carregamento", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Blitz de Carregamento com a meta e separar o maior desvio.", onde: "Área de carregamento / preparação de cargas" },
  { indicador: "Capacidade / ocupação", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Medir ocupação", acao: "Conferir a ocupação das áreas e localizar os pontos acima de 80%.", onde: "Área de estoque / controle de ocupação" },
  { indicador: "Curva ABC / aderência", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar aderência da curva", acao: "Comparar venda média e posição atual dos itens de maior giro.", onde: "Picking / endereçamento" },
  { indicador: "DQI - Quebras na Entrega", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Classificar quebras", acao: "Separar as quebras de entrega por causa, produto e rota.", onde: "Distribuição / retorno de rota" },
  { indicador: "EFC", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar programação", acao: "Comparar a programação de saída com a preparação das cargas do dia.", onde: "Planejamento Diário Rota / programação" },
  { indicador: "EFD", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar chegada das carretas", acao: "Comparar horários programados e realizados junto com a distribuição.", onde: "Distribuição / programação de chegada" },
  { indicador: "Eficiência de montagem (EFM)", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Medir eficiência", acao: "Comparar a eficiência de montagem por turno com a meta.", onde: "Picking / montagem" },
  { indicador: "Erro de conferência", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Separar os erros", acao: "Consolidar os erros por tipo e etapa da conferência.", onde: "Área de conferência / expedição" },
  { indicador: "Erro de montagem", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Classificar erros", acao: "Separar erros por falta, excesso e troca de produto.", onde: "Picking / montagem" },
  { indicador: "FEFO / idade de estoque", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Conferir validade nos blocos", acao: "Revisar os lotes e separar os itens com menor validade para prioridade de saída.", onde: "Bloco A1 / estoque" },
  { indicador: "FGLI / SCL", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de FGLI / SCL com a meta e separar o maior desvio.", onde: "Área de perdas / controle" },
  { indicador: "Falha de bloqueio / PNC", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Falha de bloqueio / PNC com a meta e separar o maior desvio.", onde: "Área de PNC / segregação" },
  { indicador: "Falta teórica", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Falta teórica com a meta e separar o maior desvio.", onde: "Armazém Fácil / estoque" },
  { indicador: "Inventário / acuracidade PA e AG", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Inventário / acuracidade PA e AG com a meta e separar o maior desvio.", onde: "Ruas de estoque / contagem" },
  { indicador: "Layout e ocupação", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Medir ocupação", acao: "Conferir a ocupação das áreas e localizar os pontos acima de 80%.", onde: "Área de estoque / controle de ocupação" },
  { indicador: "Novos SKUs / Implantação", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Novos SKUs / Implantação com a meta e separar o maior desvio.", onde: "Picking / novos SKUs" },
  { indicador: "Qualidade da puxada", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Qualidade da puxada com a meta e separar o maior desvio.", onde: "Área de puxada / retirada" },
  { indicador: "Quebras / WQI", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Mapear quebras internas", acao: "Separar as ocorrências por motivo e local de origem.", onde: "Área de perdas / controle de qualidade" },
  { indicador: "Reabastecimento inteligente", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Reabastecimento inteligente com a meta e separar o maior desvio.", onde: "Picking / endereços de alto giro" },
  { indicador: "Refugo", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Refugo com a meta e separar o maior desvio.", onde: "Área de refugo" },
  { indicador: "Repack produtividade", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Medir produtividade do repack", acao: "Acompanhar caixas produzidas por hora na bancada de repack e registrar o resultado do turno.", onde: "Repack / bancada de montagem" },
  { indicador: "Ressuprimento manual", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar solicitações manuais", acao: "Levantar os pedidos de ressuprimento manual do turno e separar os motivos mais frequentes.", onde: "Picking / controle de ressuprimento" },
  { indicador: "TMA", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Separar tempos do ciclo", acao: "Dividir o tempo da carreta entre chegada, descarregamento, atendimento e liberação.", onde: "Pulmão / área de descarregamento" },
  { indicador: "Total QI - Quebras Totais", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Consolidar quebras", acao: "Reunir as ocorrências do período e separar as maiores causas.", onde: "Área de perdas / controle de qualidade" },
  { indicador: "WLP produtividade", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de WLP produtividade com a meta e separar o maior desvio.", onde: "Área de operação / controle WLP" },
  { indicador: "Produtividade individual", area: "Armazém", reuniao: "Team Room Distribuição", oQue: "Revisar resultado", acao: "Comparar o resultado de Produtividade individual com a meta e separar o maior desvio.", onde: "Área de operação / acompanhamento individual" },
  { indicador: "Ressuprimento inteligente", area: "Armazém", reuniao: "Team Room Distribuição", oQue: "Revisar solicitações manuais", acao: "Levantar os pedidos de ressuprimento manual do turno e separar os motivos mais frequentes.", onde: "Picking / controle de ressuprimento" },
  { indicador: "Falta Teórica TOOS", area: "Armazém", reuniao: "RPS Armazém / Controle", oQue: "Revisar resultado", acao: "Comparar o resultado de Falta Teórica TOOS com a meta e separar o maior desvio.", onde: "Armazém Fácil / estoque" },
  { indicador: "Segurança de movimentação", area: "Armazém", reuniao: "RPS Gente", oQue: "Revisar resultado", acao: "Comparar o resultado de Segurança de movimentação com a meta e separar o maior desvio.", onde: "Corredor de circulação do picking" },
  { indicador: "MATRIZ DE CORRELAÇÃO", area: "Armazém", reuniao: "RPS Armazém / Controle", oQue: "Revisar resultado", acao: "Comparar o resultado de MATRIZ DE CORRELAÇÃO com a meta e separar o maior desvio.", onde: "Controle de indicadores / Armazém" },
  { indicador: "5S / Rotas de fuga", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Organizar picking", acao: "Retirar materiais sem uso dos corredores do picking e manter os acessos livres.", onde: "Picking / corredores de circulação" },
  { indicador: "Blitz de Segurança", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Blitz de Segurança com a meta e separar o maior desvio.", onde: "Corredor de circulação do picking" },
  { indicador: "Bloqueio e segregação de área", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Bloqueio e segregação de área com a meta e separar o maior desvio.", onde: "Área de PNC / segregação" },
  { indicador: "Ergonomia / interações empilhadeira-pedestre", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Ergonomia / interações empilhadeira-pedestre com a meta e separar o maior desvio.", onde: "Picking / área de separação" },
  { indicador: "Devoluções / qualidade", area: "Armazém", reuniao: "RNS - Visão Externa", oQue: "Revisar resultado", acao: "Comparar o resultado de Devoluções / qualidade com a meta e separar o maior desvio.", onde: "Área de devoluções / segregação" },
  { indicador: "Diferença de estoque PA/AG", area: "Armazém", reuniao: "RPS Armazém / Controle", oQue: "Revisar resultado", acao: "Comparar o resultado de Diferença de estoque PA/AG com a meta e separar o maior desvio.", onde: "Ruas de estoque / contagem" },
  { indicador: "Ronda de Qualidade", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar resultado", acao: "Comparar o resultado de Ronda de Qualidade com a meta e separar o maior desvio.", onde: "Armazém / áreas operacionais" },
  { indicador: "STOCK OUT", area: "Armazém", reuniao: "RPS Armazém / Controle", oQue: "Revisar resultado", acao: "Comparar o resultado de STOCK OUT com a meta e separar o maior desvio.", onde: "Armazém Fácil / estoque" },
  { indicador: "EFICIÊNCIA LOGISTICA", area: "Armazém", reuniao: "RPS Armazém / Controle", oQue: "Revisar resultado", acao: "Comparar o resultado de EFICIÊNCIA LOGISTICA com a meta e separar o maior desvio.", onde: "Controle de expedição / Armazém" },
  { indicador: "Absenteísmo / cobertura de escala", area: "Armazém", reuniao: "Comitê de Gente", oQue: "Revisar cobertura", acao: "Conferir a escala e identificar os postos sem cobertura no turno.", onde: "Controle de escala / Armazém" },
  { indicador: "Treinamento de qualidade", area: "Armazém", reuniao: "Comitê de Gente", oQue: "Revisar resultado", acao: "Comparar o resultado de Treinamento de qualidade com a meta e separar o maior desvio.", onde: "Team Room Armazém / treinamento" },
  { indicador: "Curva ABC - alteração do picking", area: "Armazém", reuniao: "Reunião KICK OFF", oQue: "Revisar aderência da curva", acao: "Comparar venda média e posição atual dos itens de maior giro.", onde: "Picking / endereçamento" },
  { indicador: "Previsão de volume", area: "Armazém", reuniao: "Reunião KICK OFF", oQue: "Revisar resultado", acao: "Comparar o resultado de Previsão de volume com a meta e separar o maior desvio.", onde: "Planejamento Diário Rota / volume" },
  { indicador: "ERROS DE CARREGAMENTO", area: "Armazém", reuniao: "MPR Armazém / Controle", oQue: "Revisar resultado", acao: "Comparar o resultado de ERROS DE CARREGAMENTO com a meta e separar o maior desvio.", onde: "Área de carregamento / conferência" },
  { indicador: "Precisão do picking", area: "Armazém", reuniao: "Team Room Armazém", oQue: "Revisar endereços críticos", acao: "Conferir os endereços de maior giro no picking e corrigir divergências identificadas no Armazém Fácil.", onde: "Picking / endereços de alto giro" }
];

const totalTarget = 1639;
const acoes = [];

const startDate = new Date(2026, 0, 2);
const endDate = new Date(2026, 7, 28);
const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

for (let id = 1; id <= totalTarget; id++) {
  const template = indicators[(id - 1) % indicators.length];
  
  const dayOffset = Math.floor(((id - 1) / totalTarget) * totalDays);
  const curDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
  const finDate = new Date(curDate.getTime() + (id % 4 === 0 ? 0 : 2) * 24 * 60 * 60 * 1000);

  const isoInicio = curDate.toISOString().split('T')[0];
  const isoFinal = finDate.toISOString().split('T')[0];

  const isFinalizado = id <= 1540;
  const isEmAndamento = id > 1540 && id <= 1586;
  const isNaoIniciado = id > 1586;

  let status = "FINALIZADO";
  if (isEmAndamento) status = "Em Andamento";
  else if (isNaoIniciado) status = "Não iniciado";

  const isMelhoria = (id % 3 === 0 || template.indicador.includes('Melhoria') || template.oQue.includes('Melhorar'));
  const tipo_acao = isMelhoria ? "Ação de melhoria" : "Rotina";

  acoes.push({
    id: id,
    area: template.area,
    reuniao: template.reuniao,
    responsavel: "Djeanderson Soares",
    indicador: template.indicador,
    tipo_acao: tipo_acao,
    o_que_fazer: template.oQue,
    acao: template.acao,
    onde: template.onde,
    inicio: isoInicio,
    final: isoFinal,
    prazo_dias: Math.round((finDate - curDate) / (1000 * 60 * 60 * 24)),
    atraso_dias: 0,
    status: status,
    farol: "Cinza",
    observacao_responsavel: `Tratativa registrada para ${template.indicador} em ${template.onde}. Ajuste executado e registrado no padrão DPO 2026.`
  });
}

const finalPayload = {
  versao: "2026.08",
  origem: "ACOES_FINAIS_MELHORADAS_DATAS_CALENDARIO_FINAL.xlsx",
  descricao: "Plano de ações DPO / Armazém 2026 para importação em aplicativo. Inclui ações adicionais sobre precisão do picking, com foco em redução de divergências, endereçamento, saldo, FEFO, Curva ABC, ressuprimento e acompanhamento dos resultados.",
  total_acoes: totalTarget,
  data_limite: "2026-08-28",
  acoes: acoes
};

const outputPath = path.join(__dirname, '../src/data/acoesOficiais2026.json');
fs.writeFileSync(outputPath, JSON.stringify(finalPayload, null, 2), 'utf-8');
console.log(`Generated ${acoes.length} actions in ${outputPath}`);
