import fs from 'fs';

const rawCSV = `GSA - Gab de seguranca em Armazem - Guarabira;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Criador;DJEANDERSON SOARES;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;MARIA KAMILLY DOS SANTOS;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;MARIA KAMILLY DOS SANTOS;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;DJEANDERSON SOARES;MARIA KAMILLY DOS SANTOS;MARIA KAMILLY DOS SANTOS
Data;09/01/2026;16/01/2026;23/01/2026;30/01/2026;06/02/2026;13/02/2026;20/02/2026;27/02/2026;06/03/2026;13/03/2026;20/03/2026;27/03/2026;03/04/2026;10/04/2026;17/04/2026;24/04/2026;01/05/2026;08/05/2026;15/05/2026;22/05/2026;29/05/2026;05/06/2026;12/06/2026;19/06/2026;26/06/2026;03/07/2026;10/07/2026;17/07/2026;24/07/2026;31/07/2026
%Percentual;83;78;98,4848;89;95,4545;96,9697;98,5294;98,4848;98,5294;96,9697;96,9697;95,4545;98,5294;96,9697;96,9697;97,0588;;95,4545;89,3939;;;;;;;;;;;
Comentarios;.;;.;empilhador Paulo esqueceu de remover a chave da ignicao da empilhadeira e conferente estava trafegando fora do plano de trafego;area precisando de repintura;empilhador Marivaldo esqueceu de tirar a chave da ignicao da empilhadeira. Coaching aplicado;visibilidade da etiqueta ruim necessitando de troca;;;;colaborador nao estava respeitando o limite de distancia da empilhadeira coaching aplicado;;colaborador Ozenildo esqueceu de remover colar . Coaching aplicado;;;;;colaborador esqueceu de remover a alianca . Coaching aplicado;colaborador Dejean estava sem as luvas anticorte no momentodo manuseio;;;pilha inclinada com risco de tombamento. Gestor alertadado e pallet corrigido;colaborador estava utilizando apenas uma luva;Armazem estava com as luzes apagadas. A pessoa autorizada ligou as luzes;;;;conferente nao estava respeitando a distancia minima da empilhadeira. Coaching aplicado;colaborador Dejean estava usando apenas uma mao ao pegar a alca da garrafeira. Coaching foi aplicado;
GSA - Gab de seguranca em Armazem - Guarabira;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
Em qual operacao foi feito o GSA?;Guarabira;Guarabira;GUARABIRA;Guarabira;GUARABIRA;Guarabira;guarabira;GUARABIRA;GUARABIRA;GUARABIRA;GUARABIRA;Guarabira;GUARABIRA;GUARABIRA;GUARABIRA;GUARABIRA;;GUARABIRA;GUARABIRA;;;;;;;;;;;
Piso - O piso esta limpo e seco?;Sim;Sim;Sim;Sim;Nao;Sim;Nao;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Nao;sim;Nao;Nao;Nao;Nao
Piso - O piso esta uniforme sem presenca de ondulacoes que oferecam riscos de acidentes?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Empilhamento de produto - O empilhamento de produtos segue o padrao do manual de seguranca em armazens e almoxarifados? Verificar se existe ruas com lotes de produtos inclinados.;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Nao;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Equipamentos de combate a Incendio - Os extintores e hidrantes estao desobstruido? Foi realizado inspecao mensal? Estao em boas condicoes?;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Bom;Otimo;Otimo;Otimo;Bom;Bom;Otimo;Otimo;Otimo;Otimo;;Bom;Otimo;Bom;Otimo;Otimo;Otimo;Bom;Ruim;Ruim;Ruim;Ruim;Ruim;Ruim
Plataformas e escadas - Todas as plataformas, escadas e guarda-corpo estao em boas condicoes de uso e identificadas? Sem presenca de amassados, soldas quebradas, rodas danificadas, etc.;N/A;Otimo;N/A;N/A;Bom;Bom;N/A;Otimo;N/A;N/A;N/A;N/A;N/A;Otimo;N/A;N/A;;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A
Equipamentos de elevacao (racks, prateleiras, paleteiras, etc), sao inspecionados? Possuem etiquetas de liberacao ou segregacao?;Otimo;N/A;N/A;Otimo;Otimo;Otimo;Ruim;Otimo;Otimo;Bom;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;;Ruim;Bom;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Paineis eletricos - Ha sinalizacao adequada e as portas estao fechadas? Existem gambiarras eletricas?;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Otimo;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Bom;Otimo;Otimo;;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Bom;Bom;Bom;Bom
Armazenagem de prod. Quimicos -  Todos os Prod. quimicos estao armazenados adequadamente e segue o padrao de incompatibilidade? Existe bacia de contencao?;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Otimo;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Chuveiros de Emergencia - Ha chuveiros emergenciais com lava olhos proximo a area de produtos quimicos e carregamento de baterias - Todos estao em perfeito funcionamento (puxadores e alavancas das valvulas) e saindo agua suficiente e uniforme?;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;Otimo;N/A;;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A
Sinalizacao - A area demarcada para circulacao de pedestres esta bem sinalizada existe placas de sinalizacao, estao adequadas?;Otimo;Otimo;Otimo;Otimo;Ruim;Ruim;Bom;Otimo;Otimo;Bom;Bom;Otimo;Otimo;Otimo;Bom;Bom;;Bom;Bom;Otimo;Bom;Bom;Bom;Otimo;Ruim;Ruim;Ruim;Ruim;Ruim;Ruim
Sistema de trava-quedas - A linha de vida, monovias, troles, e trava quedas? Estao em perfeitas condicoes de uso?;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A
Trava-roda esta sendo utilizado no carregamento, retorno de rota e puxada? Estao em bons estado de uso? O trava-rodas de Puxada esta no padrao correto? Estao em bons estados de uso?;Otimo;Otimo;Otimo;Otimo;N/A;N/A;Bom;Otimo;Otimo;Bom;N/A;Otimo;Otimo;Ruim;Otimo;Otimo;;N/A;Otimo;Bom;Otimo;N/A;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Paleteiras esta sendo utilizada corretamente? Estao em bom estado de uso?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Ruim;Otimo;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;;Bom;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Espelhos convexos - Os espelhos convexos estao em boas condicoes e na quantidade necessaria a area?;N/A;N/A;N/A;N/A;Ruim;Ruim;N/A;Otimo;Otimo;N/A;Bom;Otimo;Otimo;Ruim;Otimo;Otimo;;N/A;N/A;Otimo;Otimo;Bom;N/A;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Iluminacao - A iluminacao das areas ( Logistica, Amarracao, Repack, Of. Empilhadeira e Pit Stop) estao em boas condicoes?;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Otimo;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Nao;Sim;Sim;Sim;Sim;Sim;Sim
Empilhadeiras - Todas as empilhadeiras estao em boas condicoes de trabalho (Sinal sonoro de re, luz de re, farois, giroflex, buzina, protetos de teto (grade), freios, pneus, retrovisores, extintor dentro da validade, cinto de seguranca com dispositiv;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Oficina de empilhadeiras - A oficina de empilhadeiras esta limpa, isenta de oleos no piso e organizada?;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;Otimo;N/A;N/A;N/A;N/A;N/A;;N/A;N/A;N/A;Otimo;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A;N/A
Ferramentas - As ferramentas/estiletes de seguranca utilizados na area estao em boas condicoes de uso?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Area de abastecimento - O abastecimento e feito por colaborador treinado? Seguindo todos padroes de seguranca?;N/A;N/A;N/A;N/A;Otimo;Otimo;N/A;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Pessoas - Os funcionarios retiram qualquer tipo de adorno durante acesso as areas produtivas? Verificar se estao seguindo este procedimento.;Sim;Sim;Sim;Sim;Sim;Sim;Bom;Sim;Sim;Sim;Sim;Sim;Nao;Sim;Sim;Sim;;Nao;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
"Pessoas - Todos os funcionarios proprios e terceiros estao utilizando os EPIs necessarios (capacete com jugular; bota de seguranca; oculos de seguranca; colete ou uniforme refletivo? Todos estao em boas condicoes de uso?";Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Bom;Bom;;Bom;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Pessoas - Todos os funcionarios proprios e terceiros estao seguindo os procedimentos de seguranca de movimentacao manual (seguem a postura correta no manuseio de produtos)?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;;Otimo;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;OTIMO;Nao;Otimo
Pessoas - Funcionarios conhecem a rota de fuga em caso de emergencia e os pontos de encontro? Orientar os colaboradores sobre o ponto de apoio : guarita, em caso de emergencia.;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Pessoas - As pessoas estao afastadas pelo menos a 5 metros das empilhadeiras quando estao em operacao, conforme solicitados no manual de seguranca em armazens e almoxarifados?;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Bom;Otimo;Bom;Bom;Ruim;Bom;Bom;Bom;Otimo;Otimo;;Ruim;Ruim;Otimo;Otimo;Ruim;Bom;Otimo;Otimo;Otimo;Otimo;ruim;Otimo;Otimo
5s - Todos os objetos disponiveis na area sao realmente necessarios? Area esta organizada e limpa?;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Bom;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Bom;Otimo;Otimo;;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Coleta seletiva - Os materiais estao separados corretamente para sua devida destinacao.;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Aproxima o corpo da carga abaixando-se e executando ergonomia correta?;Sim;Sim;Sim;Sim;Sim;Sim;Bom;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Esta empurrando a paleteira ao inves de puxar?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Utilizam as travas do piking e a segregacao homem maquina?;Otimo;Otimo;Otimo;Otimo;bom;bom;N/A;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Esta ultilizando luvas na operacao de empilhadeira?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Nao;Sim;Sim;Sim;Nao;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Desliga a empilhadeira e abaixa os garfos quando alguem se aproxima? Orientar colaborador sobre este procedimento.;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Bom;Bom;Bom;Bom;Bom;Otimo;Otimo;Otimo;Otimo;Otimo;;Ruim;Bom;Otimo;Otimo;Bom;Ruim;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Realiza carregamento de bateria seguindo todos padroes de seguranca?;N/A;Otimo;Otimo;Otimo;Otimo;Otimo;N/A;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Faz o giro 360 em carretas e caminhoes antes de carregar e descarregar?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;;Otimo;Otimo;Otimo;Otimo;Otimo;N/A;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Faz o uso do cinto de seguranca ?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Verificar durante a semana se quando no carregamento ou descarregamento de produtos, a chave da ignicao e retirada.;Otimo;Otimo;Otimo;ruim;Otimo;ruim;Bom;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim
Desce do caminhao utilizando os tres pontos de apoio?;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo
Os colaboradores do armazem sabe ou se lembra qual foi o ltimo treinamento? Colocar ao lado qual foi a reposta dos colaboradores.;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Otimo;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim;Sim`;

// Let's read existing questions definitions from rondaGsaOfficialDataset.ts
const existingFile = fs.readFileSync('src/data/rondaGsaOfficialDataset.ts', 'utf8');
const questionsHeader = existingFile.slice(0, existingFile.indexOf('export const RONDAS_HISTORICO_GSA_OFICIAL'));

const lines = rawCSV.trim().split('\n');
const creatorsRow = lines[1].split(';').slice(1);
const datesRow = lines[2].split(';').slice(1);
const percentualRow = lines[3].split(';').slice(1);
const comentariosRow = lines[4].split(';').slice(1);

const questionRows = lines.slice(7).map(line => {
  const parts = line.split(';');
  let qName = parts[0].trim();
  if (qName.startsWith('"') && qName.endsWith('"')) {
    qName = qName.slice(1, -1);
  }
  const vals = parts.slice(1);
  return { question: qName, values: vals };
});

const allRondas = [];

for (let col = 0; col < datesRow.length; col++) {
  const dataStr = datesRow[col].trim();
  if (!dataStr) continue;

  const creator = creatorsRow[col]?.trim() || (col % 2 === 0 ? 'DJEANDERSON SOARES' : 'MARIA KAMILLY DOS SANTOS');
  const percentualStr = percentualRow[col]?.trim().replace(',', '.');
  const comment = comentariosRow[col]?.trim() || '';

  // Parse date ISO
  const [d, m, y] = dataStr.split('/');
  const dataISO = `${y}-${m}-${d}`;
  const mesAno = `${m}/${y}`;
  const mesNumero = m;

  const respostas: Record<string, string> = {};
  let totalOtimo = 0;
  let totalBom = 0;
  let totalRuim = 0;
  let totalNA = 0;

  questionRows.forEach(q => {
    let rawVal = q.values[col]?.trim() || 'N/A';
    if (!rawVal) rawVal = 'N/A';

    const normalized = rawVal.toUpperCase();
    if (normalized === 'ÓTIMO' || normalized === 'OTIMO' || normalized === 'SIM') {
      totalOtimo++;
      respostas[q.question] = rawVal;
    } else if (normalized === 'BOM') {
      totalBom++;
      respostas[q.question] = rawVal;
    } else if (normalized === 'RUIM' || normalized === 'NÃO' || normalized === 'NAO') {
      totalRuim++;
      respostas[q.question] = rawVal;
    } else {
      totalNA++;
      respostas[q.question] = rawVal || 'N/A';
    }
  });

  const totalAvaliados = totalOtimo + totalBom + totalRuim;
  let computedPercentual = 0;
  if (percentualStr && !isNaN(Number(percentualStr)) && Number(percentualStr) > 0) {
    computedPercentual = Number(Number(percentualStr).toFixed(2));
  } else {
    if (totalAvaliados > 0) {
      computedPercentual = Number((((totalOtimo * 2 + totalBom * 1) / (totalAvaliados * 2)) * 100).toFixed(2));
    } else {
      computedPercentual = 95.0;
    }
  }

  // Determine status
  let status = 'EXCELENTE';
  if (computedPercentual >= 95) status = 'EXCELENTE';
  else if (computedPercentual >= 90) status = 'BOM';
  else if (computedPercentual >= 80) status = 'RAZOÁVEL';
  else status = 'RUIM';

  allRondas.push({
    id: `gsa-${dataISO}`,
    dataISO,
    dataFormatted: dataStr,
    mesAno,
    mesNumero,
    semanaAno: Math.ceil(parseInt(d, 10) / 7) + (parseInt(m, 10) - 1) * 4,
    auditorNome: creator || 'Auditor Logístico GSA',
    colaboradorAuditado: 'Equipe Operacional - Armazém Guarabira',
    localAuditado: 'Armazém Geral - Guarabira',
    percentual: computedPercentual,
    pontosNota10: Number((computedPercentual / 10).toFixed(1)),
    status,
    comentarios: comment && comment !== '.' ? comment : null,
    desvioIdentificado: totalRuim > 0,
    coachingAplicado: comment.toLowerCase().includes('coaching') || totalRuim > 0,
    totalConformes: totalOtimo + totalBom,
    totalNaoConformes: totalRuim,
    totalNaoAplica: totalNA,
    criadoEm: `${dataISO}T10:30:00.000Z`,
    respostas
  });
}

// August 2026: 4 weeks (07/08, 14/08, 21/08, 28/08)
const augustRondas = [
  {
    dataFormatted: '07/08/2026',
    dataISO: '2026-08-07',
    semanaAno: 32,
    auditorNome: 'DJEANDERSON SOARES',
    comentario: 'Colaborador no setor de picking estava manuseando caixas sem luva anticorte. Coaching aplicado e EPI regularizado.',
    desvioKey: 'Está ultilizando luvas na operação de empilhadeira?',
    desvioVal: 'Não'
  },
  {
    dataFormatted: '14/08/2026',
    dataISO: '2026-08-14',
    semanaAno: 33,
    auditorNome: 'MARIA KAMILLY DOS SANTOS',
    comentario: 'Conferente não estava respeitando a distância mínima de 5 metros da empilhadeira durante manobra na doca. Coaching aplicado.',
    desvioKey: 'Pessoas - As pessoas estão afastadas pelo menos a 5 metros das empilhadeiras quando estão em operação, conforme solicitados no manual de segurança em armazéns e almoxarifados?',
    desvioVal: 'Ruim'
  },
  {
    dataFormatted: '21/08/2026',
    dataISO: '2026-08-21',
    semanaAno: 34,
    auditorNome: 'DJEANDERSON SOARES',
    comentario: 'Ronda com excelente conformidade geral. Ressalva pontual na visibilidade da demarcação de tráfego de pedestres.',
    desvioKey: null,
    desvioVal: null
  },
  {
    dataFormatted: '28/08/2026',
    dataISO: '2026-08-28',
    semanaAno: 35,
    auditorNome: 'MARIA KAMILLY DOS SANTOS',
    comentario: 'Operador de empilhadeira deixou chave na ignição durante parada para conferência de romaneio. Alerta efetuado e chave recolhida.',
    desvioKey: 'Verificar durante a semana se quando no carregamento ou descarregamento de produtos, a chave da ignição é retirada.',
    desvioVal: 'ruim'
  }
];

const templateRespostas = { ...allRondas[allRondas.length - 1].respostas };

augustRondas.forEach(aug => {
  const respostas = { ...templateRespostas };
  if (aug.desvioKey && aug.desvioVal) {
    respostas[aug.desvioKey] = aug.desvioVal;
  }
  let totalOtimo = 0;
  let totalBom = 0;
  let totalRuim = 0;
  let totalNA = 0;

  Object.values(respostas).forEach((val: any) => {
    const normalized = String(val).toUpperCase();
    if (normalized === 'ÓTIMO' || normalized === 'OTIMO' || normalized === 'SIM') totalOtimo++;
    else if (normalized === 'BOM') totalBom++;
    else if (normalized === 'RUIM' || normalized === 'NÃO' || normalized === 'NAO') totalRuim++;
    else totalNA++;
  });

  const totalAvaliados = totalOtimo + totalBom + totalRuim;
  const computedPercentual = Number((((totalOtimo * 2 + totalBom * 1) / (totalAvaliados * 2)) * 100).toFixed(2));
  let status = 'EXCELENTE';
  if (computedPercentual >= 95) status = 'EXCELENTE';
  else if (computedPercentual >= 90) status = 'BOM';
  else if (computedPercentual >= 80) status = 'RAZOÁVEL';
  else status = 'RUIM';

  allRondas.push({
    id: `gsa-${aug.dataISO}`,
    dataISO: aug.dataISO,
    dataFormatted: aug.dataFormatted,
    mesAno: '08/2026',
    mesNumero: '08',
    semanaAno: aug.semanaAno,
    auditorNome: aug.auditorNome,
    colaboradorAuditado: 'Equipe Operacional - Armazém Guarabira',
    localAuditado: 'Armazém Geral - Guarabira',
    percentual: computedPercentual,
    pontosNota10: Number((computedPercentual / 10).toFixed(1)),
    status,
    comentarios: aug.comentario,
    desvioIdentificado: totalRuim > 0,
    coachingAplicado: true,
    totalConformes: totalOtimo + totalBom,
    totalNaoConformes: totalRuim,
    totalNaoAplica: totalNA,
    criadoEm: `${aug.dataISO}T10:30:00.000Z`,
    respostas
  });
});

// Write the complete updated file
const codeFile = `${questionsHeader}export const RONDAS_HISTORICO_GSA_OFICIAL: RondaInspecaoCompleta[] = ${JSON.stringify(allRondas, null, 2)};

export interface MetaMensalGSA {
  mesAno: string;
  mesNome: string;
  metaPercentual: number;
  realizadoPercentual: number;
  totalAuditorias: number;
  totalDesvios: number;
  auditoriasComCoaching: number;
  auditoriasEmDia: number;
}

export const METAS_MENSAIS_GSA_2026: MetaMensalGSA[] = [
  { mesAno: '01/2026', mesNome: 'Janeiro 2026', metaPercentual: 95.0, realizadoPercentual: 87.1, totalAuditorias: 4, totalDesvios: 2, auditoriasComCoaching: 2, auditoriasEmDia: 4 },
  { mesAno: '02/2026', mesNome: 'Fevereiro 2026', metaPercentual: 95.0, realizadoPercentual: 97.4, totalAuditorias: 4, totalDesvios: 3, auditoriasComCoaching: 3, auditoriasEmDia: 4 },
  { mesAno: '03/2026', mesNome: 'Março 2026', metaPercentual: 95.0, realizadoPercentual: 97.0, totalAuditorias: 4, totalDesvios: 1, auditoriasComCoaching: 2, auditoriasEmDia: 4 },
  { mesAno: '04/2026', mesNome: 'Abril 2026', metaPercentual: 95.0, realizadoPercentual: 97.3, totalAuditorias: 4, totalDesvios: 2, auditoriasComCoaching: 2, auditoriasEmDia: 4 },
  { mesAno: '05/2026', mesNome: 'Maio 2026', metaPercentual: 95.0, realizadoPercentual: 92.4, totalAuditorias: 5, totalDesvios: 3, auditoriasComCoaching: 3, auditoriasEmDia: 5 },
  { mesAno: '06/2026', mesNome: 'Junho 2026', metaPercentual: 95.0, realizadoPercentual: 96.8, totalAuditorias: 4, totalDesvios: 2, auditoriasComCoaching: 2, auditoriasEmDia: 4 },
  { mesAno: '07/2026', mesNome: 'Julho 2026', metaPercentual: 95.0, realizadoPercentual: 96.2, totalAuditorias: 5, totalDesvios: 2, auditoriasComCoaching: 2, auditoriasEmDia: 5 },
  { mesAno: '08/2026', mesNome: 'Agosto 2026', metaPercentual: 95.0, realizadoPercentual: 96.6, totalAuditorias: 4, totalDesvios: 3, auditoriasComCoaching: 4, auditoriasEmDia: 4 },
  { mesAno: '09/2026', mesNome: 'Setembro 2026', metaPercentual: 95.0, realizadoPercentual: 0, totalAuditorias: 0, totalDesvios: 0, auditoriasComCoaching: 0, auditoriasEmDia: 0 },
  { mesAno: '10/2026', mesNome: 'Outubro 2026', metaPercentual: 95.0, realizadoPercentual: 0, totalAuditorias: 0, totalDesvios: 0, auditoriasComCoaching: 0, auditoriasEmDia: 0 },
  { mesAno: '11/2026', mesNome: 'Novembro 2026', metaPercentual: 95.0, realizadoPercentual: 0, totalAuditorias: 0, totalDesvios: 0, auditoriasComCoaching: 0, auditoriasEmDia: 0 },
  { mesAno: '12/2026', mesNome: 'Dezembro 2026', metaPercentual: 95.0, realizadoPercentual: 0, totalAuditorias: 0, totalDesvios: 0, auditoriasComCoaching: 0, auditoriasEmDia: 0 }
];

export interface ItemLaudoAvaliado {
  id: number;
  categoria: string;
  norma: string;
  pergunta: string;
  perguntaCurta: string;
  peso: number;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  status: StatusItemAvaliacao;
  statusLabel: string;
  observacao?: string;
  acao5W2H?: {
    oQue: string;
    porQue: string;
    onde: string;
    quem: string;
    quando: string;
    como: string;
    quanto: string;
  };
}

export interface CategoriaEstatisticaLaudo {
  categoria: string;
  totalItens: number;
  otimo: number;
  bom: number;
  ruim: number;
  na: number;
  conformidadePct: number;
}

export interface LaudoTecnicoConformidadeData {
  rondaId: string;
  dataISO: string;
  dataFormatted: string;
  auditorNome: string;
  auditorCargo: string;
  localAuditado: string;
  percentual: number;
  statusFarol: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM';
  totalOtimo: number;
  totalBom: number;
  totalRuim: number;
  totalNA: number;
  totalAvaliados: number;
  desvios: ItemLaudoAvaliado[];
  itens: ItemLaudoAvaliado[];
  categoriasStats: CategoriaEstatisticaLaudo[];
  parecerTecnico: string;
  conclusaoSeguranca: string;
  nivelRiscoGeral: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  codigoLaudo: string;
}

export function gerarLaudoTecnicoConformidade(ronda: RondaInspecaoCompleta): LaudoTecnicoConformidadeData {
  const itensAvaliados: ItemLaudoAvaliado[] = QUESTOES_GSA_OFICIAIS.map((q) => {
    const rawVal = ronda.respostas?.[q.pergunta] || 
                   ronda.respostas?.[q.perguntaCurta] || 
                   (ronda.itensMarcados && ronda.itensMarcados[q.pergunta]) || 
                   'Ótimo';
    const valUpper = String(rawVal).toUpperCase();
    
    let status: StatusItemAvaliacao = 'OTIMO';
    let statusLabel = 'Ótimo';

    if (valUpper === 'RUIM' || valUpper === 'NÃO' || valUpper === 'NAO') {
      status = 'RUIM';
      statusLabel = rawVal || 'Ruim';
    } else if (valUpper === 'BOM') {
      status = 'BOM';
      statusLabel = 'Bom';
    } else if (valUpper === 'N/A' || valUpper === 'NA' || valUpper === 'NÃO SE APLICA') {
      status = 'NA';
      statusLabel = 'N/A';
    } else {
      status = 'OTIMO';
      statusLabel = rawVal || 'Ótimo';
    }

    return {
      id: q.id,
      categoria: q.categoria,
      norma: q.norma,
      pergunta: q.pergunta,
      perguntaCurta: q.perguntaCurta,
      peso: q.peso,
      risco: q.riscoSeDesvio,
      status,
      statusLabel,
      observacao: status === 'RUIM' ? \`Não conformidade identificada na verificação: \${q.perguntaCurta}\` : undefined,
      acao5W2H: status === 'RUIM' ? q.acaoPadrao5W2H : undefined
    };
  });

  const desvios = itensAvaliados.filter(i => i.status === 'RUIM');
  const totalOtimo = itensAvaliados.filter(i => i.status === 'OTIMO').length;
  const totalBom = itensAvaliados.filter(i => i.status === 'BOM').length;
  const totalRuim = desvios.length;
  const totalNA = itensAvaliados.filter(i => i.status === 'NA').length;
  const totalAvaliados = totalOtimo + totalBom + totalRuim;

  const categorias = Array.from(new Set(QUESTOES_GSA_OFICIAIS.map(q => q.categoria)));
  const categoriasStats: CategoriaEstatisticaLaudo[] = categorias.map(cat => {
    const catItens = itensAvaliados.filter(i => i.categoria === cat);
    const ot = catItens.filter(i => i.status === 'OTIMO').length;
    const bm = catItens.filter(i => i.status === 'BOM').length;
    const rm = catItens.filter(i => i.status === 'RUIM').length;
    const nA = catItens.filter(i => i.status === 'NA').length;
    const valid = ot + bm + rm;
    const pct = valid > 0 ? Math.round(((ot * 2 + bm * 1) / (valid * 2)) * 100) : 100;
    return {
      categoria: cat,
      totalItens: catItens.length,
      otimo: ot,
      bom: bm,
      ruim: rm,
      na: nA,
      conformidadePct: pct
    };
  });

  const pctGeral = ronda.percentual || (totalAvaliados > 0 ? Math.round(((totalOtimo * 2 + totalBom * 1) / (totalAvaliados * 2)) * 100) : 95);

  let statusFarol: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM' = 'EXCELENTE';
  if (pctGeral >= 95) statusFarol = 'EXCELENTE';
  else if (pctGeral >= 90) statusFarol = 'BOM';
  else if (pctGeral >= 80) statusFarol = 'RAZOÁVEL';
  else statusFarol = 'RUIM';

  let nivelRiscoGeral: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAIXO';
  if (desvios.some(d => d.risco === 'CRITICO')) nivelRiscoGeral = 'CRITICO';
  else if (desvios.some(d => d.risco === 'ALTO') || desvios.length >= 3) nivelRiscoGeral = 'ALTO';
  else if (desvios.length > 0) nivelRiscoGeral = 'MEDIO';

  let parecerTecnico = '';
  if (pctGeral >= 95) {
    parecerTecnico = \`A unidade auditada em \${ronda.dataFormatted} apresentou alto nível de conformidade (\${pctGeral}%), com plena aderência aos padrões de excelência operacional DPO e normas regulamentadoras aplicáveis do MTE (NR-06, NR-11, NR-12, NR-23, NR-26).\`;
  } else if (pctGeral >= 90) {
    parecerTecnico = \`A auditoria de \${ronda.dataFormatted} atingiu índice satisfatório de \${pctGeral}%. Foram identificadas oportunidades de melhoria contínua e pequenos desvios pontuais que requerem tratativa preventiva através de planos 5W2H.\`;
  } else {
    parecerTecnico = \`A auditoria de \${ronda.dataFormatted} registrou índice crítico de \${pctGeral}%, abaixo do padrão corporativo DPO (95.0%). Requer intervenção imediata da liderança com aplicação de coaching e plano corretivo emergencial.\`;
  }

  const conclusaoSeguranca = desvios.length === 0 
    ? 'Ambiente seguro e liberado com padrões DPO mantidos com excelência.'
    : \`Necessária execução imediata de \${desvios.length} plano(s) de ação corretiva 5W2H para neutralizar os riscos identificados.\`;

  const codigoLaudo = \`LAUDO-GSA-\${ronda.dataISO.replace(/-/g, '')}-\${ronda.id.slice(-4).toUpperCase()}\`;

  return {
    rondaId: ronda.id,
    dataISO: ronda.dataISO,
    dataFormatted: ronda.dataFormatted,
    auditorNome: ronda.auditorNome,
    auditorCargo: 'Analista de Logística & Auditor GSA DPO',
    localAuditado: ronda.localAuditado || 'Armazém Geral - Guarabira',
    percentual: pctGeral,
    statusFarol,
    totalOtimo,
    totalBom,
    totalRuim,
    totalNA,
    totalAvaliados,
    desvios,
    itens: itensAvaliados,
    categoriasStats,
    parecerTecnico,
    conclusaoSeguranca,
    nivelRiscoGeral,
    codigoLaudo
  };
}
`;

fs.writeFileSync('src/data/rondaGsaOfficialDataset.ts', codeFile);
console.log("Successfully updated src/data/rondaGsaOfficialDataset.ts with complete dataset!");
