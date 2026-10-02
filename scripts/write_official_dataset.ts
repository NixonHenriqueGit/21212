import fs from 'fs';

const rondasData = JSON.parse(fs.readFileSync('/tmp/all_final_rondas.json', 'utf-8'));

// Build JSON string safely
const rondasJson = JSON.stringify(rondasData, null, 2);

const fullFile = `export interface ItemVerificacaoGSA {
  id: number;
  categoria: 'Piso & Estrutura' | 'Empilhamento & Armazenagem' | 'Emergência & Incêndio' | 'Equipamentos & Máquinas' | 'Pessoas & EPIs' | 'Ergonomia & Comportamento' | '5S & Meio Ambiente';
  norma: string;
  pergunta: string;
  perguntaCurta: string;
  descricaoOrientacao?: string;
  peso: number;
  riscoSeDesvio: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  acaoPadrao5W2H: {
    oQue: string;
    porQue: string;
    onde: string;
    quem: string;
    quando: string;
    como: string;
    quanto: string;
  };
}

export type StatusItemAvaliacao = 'OTIMO' | 'BOM' | 'RUIM' | 'NA';

export const QUESTOES_GSA_OFICIAIS: ItemVerificacaoGSA[] = [
  { 
    id: 1, 
    categoria: 'Piso & Estrutura', 
    norma: 'NR-11 / NR-26',
    pergunta: 'Piso - O piso está limpo e seco?', 
    perguntaCurta: 'Piso limpo e seco', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Secagem e higienização imediata do piso operacional',
      porQue: 'Evitar derrapagens de empilhadeiras e quedas de colaboradores (NR-11)',
      onde: 'Ruas de circulação e docas do armazém',
      quem: 'Equipe de Limpeza / Operação de Armazém',
      quando: 'Imediato (Até 30 minutos)',
      como: 'Utilização de máquina lavadora e sinalização com cones de piso molhado',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 2, 
    categoria: 'Piso & Estrutura', 
    norma: 'NR-11',
    pergunta: 'Piso - O piso está uniforme sem presença de ondulações que ofereçam riscos de acidentes?', 
    perguntaCurta: 'Piso uniforme sem ondulações', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Mapeamento e reparo asfáltico/epóxi nas ondulações do piso',
      porQue: 'Prevenir trepidação e desestabilização de cargas transportadas',
      onde: 'Vias de tráfego de empilhadeiras',
      quem: 'Manutenção Predial / Gestão de Ativos',
      quando: 'Em até 7 dias úteis',
      como: 'Aplicação de argamassa autonivelante epóxi de alta resistência',
      quanto: 'Orçamento de Manutenção Predial'
    }
  },
  { 
    id: 3, 
    categoria: 'Empilhamento & Armazenagem', 
    norma: 'Manual DPO / ABNT',
    pergunta: 'Empilhamento de produto - O empilhamento de produtos segue o padrão do manual de segurança em armazéns e almoxarifados? Verificar se existe ruas com lotes de produtos inclinados.', 
    perguntaCurta: 'Empilhamento no padrão sem inclinação', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Desmontagem e reempilhamento imediato de lotes desalinhados ou inclinados',
      porQue: 'Eliminar risco iminente de tombamento e avaria grave de produtos',
      onde: 'Ruas de picking e armazenagem blocada',
      quem: 'Operador de Empilhadeira e Supervisor de Turno',
      quando: 'Imediato (Parada preventiva do setor)',
      como: 'Remover blocos inclinados, conferir paletes e alinhar com prumo correto',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 4, 
    categoria: 'Emergência & Incêndio', 
    norma: 'NR-23 (Proteção Contra Incêndios)',
    pergunta: 'Equipamentos de combate a Incêndio - Os extintores e hidrantes estão desobstruido? Foi realizado inspeção mensal? Estão em boas condições?', 
    perguntaCurta: 'Extintores e hidrantes desobstruídos e inspecionados', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Desobstrução imediata de extintores/hidrantes e revisão de lacres/manômetros',
      porQue: 'Garantir acesso rápido de emergência em sinistros e conformidade com NR-23',
      onde: 'Pontos de combate a incêndio no armazém',
      quem: 'Técnico de Segurança do Trabalho / Brigada de Incêndio',
      quando: 'Imediato (Tolerância Zero DPO)',
      como: 'Remoção de paletes ou mercadorias depositadas na demarcação vermelha/amarela',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 5, 
    categoria: 'Piso & Estrutura', 
    norma: 'NR-12 / NR-35',
    pergunta: 'Plataformas e escadas - Todas as plataformas, escadas e guarda-corpo estão em boas condições de uso e identificadas? Sem presença de amassados, soldas quebradas, rodas danificadas, etc.', 
    perguntaCurta: 'Plataformas, escadas e guarda-corpos seguros', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Interdição e reparo estrutural de escadas/plataformas danificadas',
      porQue: 'Prevenir acidentes por queda de nível ou quebra de componentes',
      onde: 'Áreas de mezanino, picking aéreo e manutenção',
      quem: 'SST / Manutenção Mecânica',
      quando: 'Até 48 horas',
      como: 'Etiquetagem de bloqueio, soldagem técnica e troca de rodízios',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 6, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-11 / NR-12',
    pergunta: 'Equipamentos de elevação (racks, prateleiras, paleteiras, etc), são inspecionados? Possuem etiquetas de liberação ou segregação?', 
    perguntaCurta: 'Equipamentos de elevação inspecionados e identificados', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Inspeção técnica e etiquetagem dos equipamentos de elevação',
      porQue: 'Garantir rastreabilidade de manutenção e capacidade nominal de carga',
      onde: 'Estruturas porta-paletes e armazém',
      quem: 'Inspetor de Qualidade / Almoxarife',
      quando: 'Em até 5 dias úteis',
      como: 'Checklist estrutural e colagem de selos verde (aprovado) ou vermelho (segregado)',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 7, 
    categoria: 'Piso & Estrutura', 
    norma: 'NR-10 (Segurança em Eletricidade)',
    pergunta: 'Paineis elétricos - Há sinalização adequada e as portas estão fechadas? Existem gambiarras elétricas?', 
    perguntaCurta: 'Painéis elétricos fechados e sinalizados', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Fechamento de portas de quadros elétricos e eliminação de extensões irregulares',
      porQue: 'Evitar choque elétrico, curto-circuito e incêndio (NR-10)',
      onde: 'Subestação e quadros de distribuição',
      quem: 'Eletricista Predial Autorizado (NR-10)',
      quando: 'Imediato',
      como: 'Trancamento com chave padrão, sinalização de perigo 380V/220V e inspeção termográfica',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 8, 
    categoria: 'Empilhamento & Armazenagem', 
    norma: 'NR-20 / NR-26 (Produtos Químicos)',
    pergunta: 'Armazenagem de prod. Químicos -  Todos os Prod. químicos estão armazenados adequadamente e segue o padrão de incompatibilidade? Existe bacia de contenção?', 
    perguntaCurta: 'Produtos químicos com bacia de contenção', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Reorganização de reagentes químicos em bacias de contenção estanques',
      porQue: 'Impedir vazamento ao solo e reações químicas perigosas de incompatibilidade',
      onde: 'Almoxarifado de químicos e oficina',
      quem: 'Responsável Técnico / Almoxarifado',
      quando: 'Em até 24 horas',
      como: 'Consultar FISPQ/FDS de cada produto e alocar sobre pallets de contenção',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 9, 
    categoria: 'Emergência & Incêndio', 
    norma: 'NR-20 / ABNT NBR 16291',
    pergunta: 'Chuveiros de Emergência - Há chuveiros emergenciais com lava olhos próximo a área de produtos químicos e carregamento de baterias - Todos estão em perfeito funcionamento (puxadores e alavancas das válvulas) e saindo água suficiente e uniforme?', 
    perguntaCurta: 'Chuveiro de emergência e lava-olhos em funcionamento', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Teste de vazão e higienização do chuveiro/lava-olhos de emergência',
      porQue: 'Socorro imediato em caso de respingo de ácido ou produto químico corrosivo',
      onde: 'Sala de carga de baterias e almoxarifado químico',
      quem: 'Técnico de Segurança / Encanador Predial',
      quando: 'Em até 24 horas',
      como: 'Acionar alavanca, aferir pressão uniforme e preencher ficha de inspeção semanal',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 10, 
    categoria: 'Piso & Estrutura', 
    norma: 'NR-26 (Sinalização de Segurança)',
    pergunta: 'Sinalização - A área demarcada para circulação de pedestres esta bem sinalizada existe placas de sinalização, estão adequadas?', 
    perguntaCurta: 'Faixas de pedestre e sinalização viária', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Repintura de faixas de pedestre e substituição de placas de sinalização',
      porQue: 'Garantir segregação visual clara entre tráfego de pedestres e empilhadeiras',
      onde: 'Ruas centrais do armazém e docas',
      quem: 'Manutenção / SST',
      quando: 'Em até 7 dias úteis',
      como: 'Aplicação de tinta acrílica amarela de tráfego pesado e fixação de placas refletivas',
      quanto: 'Orçamento de Tintas'
    }
  },
  { 
    id: 11, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-35 (Trabalho em Altura)',
    pergunta: 'Sistema de trava-quedas - A linha de vida, monovias, troles, e trava quedas? Estão em perfeitas condições de uso?', 
    perguntaCurta: 'Linha de vida e trava-quedas', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Inspeção e recertificação do sistema de linha de vida e trava-quedas',
      porQue: 'Prevenir acidentes graves em lonamento e deslonamento de carretas',
      onde: 'Baia de lonamento e docas elevadas',
      quem: 'TST e Profissional Qualificado NR-35',
      quando: 'Imediato',
      como: 'Verificar cabo de aço, conectores, mola de absorção e selo de calibração',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 12, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-11 / DPO Logística',
    pergunta: 'Trava-roda esta sendo utilizado no carregamento, retorno de rota e puxada? Estão em bons estado de uso? O trava-rodas de Puxada está no padrão correto? Estão em bons estados de uso?', 
    perguntaCurta: 'Uso e estado dos trava-rodas', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Obrigatoriedade de calçamento com trava-rodas em todas as carretas e caminhões parados',
      porQue: 'Impedir movimentação involuntária do veículo durante embarque com empilhadeira',
      onde: 'Docas de carga e descarga',
      quem: 'Conferente de Doca e Motorista',
      quando: 'Imediato (Toda manobra)',
      como: 'Instalar calços duplos de borracha sob as rodas traseiras antes de abrir a doca',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 13, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-11 / NR-17',
    pergunta: 'Paleteiras esta sendo utilizada corretamente? Estão em bom estado de uso?', 
    perguntaCurta: 'Paleteiras manuais em bom estado de conservação', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Manutenção preventiva nas paleteiras manuais e lubrificação das rodas',
      porQue: 'Reduzir esforço físico do ajudante e evitar quebras no picking',
      onde: 'Setores de picking e conferência',
      quem: 'Manutenção Mecânica',
      quando: 'Em até 3 dias úteis',
      como: 'Substituição de rodas de nylon danificadas e alinhamento do pistão hidráulico',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 14, 
    categoria: 'Piso & Estrutura', 
    norma: 'NR-11 / NR-26',
    pergunta: 'Espelhos convexos - Os espelhos convexos estão em boas condições e na quantidade necessária a área?', 
    perguntaCurta: 'Espelhos convexos de cruzamento', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Limpeza, reposicionamento ou substituição de espelhos convexos trincados',
      porQue: 'Garantir visibilidade em cruzamentos cegos de empilhadeiras e pedestres',
      onde: 'Cruzamentos das ruas A, B, C e docas',
      quem: 'Manutenção Predial / SST',
      quando: 'Até 48 horas',
      como: 'Instalação de espelho esférico de 60cm com ajuste angular ótimo',
      quanto: 'Orçamento de Segurança'
    }
  },
  { 
    id: 15, 
    categoria: 'Piso & Estrutura', 
    norma: 'NHO 11 (Iluminação de Ambientes de Trabalho)',
    pergunta: 'Iluminação - A iluminação das áreas ( Logistica, Amarração, Repack, Of. Empilhadeira e Pit Stop) estão em boas condições?', 
    perguntaCurta: 'Iluminação operacional adequada (NHO 11)', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Troca de luminárias LED queimadas e religamento pontual de circuitos',
      porQue: 'Garantir iluminância mínima de 300 lux para conferência segura e manobras',
      onde: 'Amarração, Logística, Repack e Pit Stop',
      quem: 'Eletricista de Manutenção',
      quando: 'Em até 24 horas',
      como: 'Substituição de refletores industriais LED High Bay 150W',
      quanto: 'Almoxarifado Elétrico'
    }
  },
  { 
    id: 16, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-11 / NR-12 (Checklist Diário)',
    pergunta: 'Empilhadeiras - Todas as empilhadeiras estão em boas condições de trabalho (Sinal sonoro de ré, luz de ré, faróis, giroflex, buzina, protetos de teto (grade), freios, pneus, retrovisores, extintor dentro da validade, cinto de segurança com dispositiv', 
    perguntaCurta: 'Checklist diário e itens de segurança da empilhadeira', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Checklist diário obrigatório de itens críticos antes do início de cada turno',
      porQue: 'Impedir operação de máquina com falha em freio, buzina, alarme de ré ou giroflex',
      onde: 'Oficina e estacionamento de empilhadeiras',
      quem: 'Operadores de Empilhadeira e Líder de Manutenção',
      quando: 'Diário (Início de cada turno)',
      como: 'Preenchimento digital/físico do check de partida; parada da máquina se houver item crítico reprovado',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 17, 
    categoria: 'Piso & Estrutura', 
    norma: 'Programa 5S / NR-20',
    pergunta: 'Oficina de empilhadeiras - A oficina de empilhadeiras está limpa, isenta de óleos no piso e organizada?', 
    perguntaCurta: 'Oficina de empilhadeiras limpa e organizada', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Limpeza de poças de óleo com serragem/absorvente e organização de bancadas',
      porQue: 'Evitar quedas, contaminação ambiental e incêndios por materiais combustíveis',
      onde: 'Oficina Mecânica',
      quem: 'Mecânicos e Equipe de Limpeza',
      quando: 'Fim de cada turno',
      como: 'Desengraxante industrial e armazenamento de ferramentas nos painéis sombra',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 18, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-12 (Segurança em Ferramentas Manuais)',
    pergunta: 'Ferramentas - As ferramentas/estiletes de segurança utilizados na área estão em boas condições de uso?', 
    perguntaCurta: 'Estiletes de segurança autorizados com lâmina retrátil', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Recolhimento de estiletes comuns e fornecimento de estiletes com lâmina auto-retrátil',
      porQue: 'Eliminar cortes acidentais de membros superiores na abertura de caixas/paletes',
      onde: 'Amarração, Conferência e Repack',
      quem: 'TST e Almoxarifado',
      quando: 'Imediato',
      como: 'Troca 1x1 no almoxarifado de estiletes não conformes',
      quanto: 'Estoque Almoxarifado'
    }
  },
  { 
    id: 19, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-20 (Líquidos Inflamáveis e Combustíveis)',
    pergunta: 'Área de abastecimento - O abastecimento é feito por colaborador treinado? Seguindo todos padrões de segurança?', 
    perguntaCurta: 'Abastecimento realizado por operador qualificado', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Restringir abastecimento apenas a colaboradores com curso NR-20 vigente',
      porQue: 'Prevenir explosões e vazamentos de GLP ou combustível',
      onde: 'Ponto de Abastecimento GLP/Diesel',
      quem: 'Operadores Certificados NR-20',
      quando: 'Permanente',
      como: 'Aterramento eletrostático obrigatório e uso de EPI antichama/luva criogênica para GLP',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 20, 
    categoria: 'Pessoas & EPIs', 
    norma: 'Regra de Ouro DPO - Proibição de Adornos',
    pergunta: 'Pessoas - Os funcionários retiram qualquer tipo de adorno durante acesso às áreas produtivas? Verificar se estão seguindo este procedimento.', 
    perguntaCurta: 'Proibição total de adornos (alianças, anéis, correntes, relógios)', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Retirada obrigatória de anéis, alianças, colares, brincos e relógios antes da entrada no armazém',
      porQue: 'Prevenir esmagamento, amputação e aprisionamento em paletes e estruturas móveis',
      onde: 'Acesso às áreas operacionais e vestiários',
      quem: 'Todos os colaboradores e visitantes',
      quando: 'Tolerância Zero / Imediato',
      como: 'Coaching 1 a 1 imediato e guarda dos adornos no armário individual',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 21, 
    categoria: 'Pessoas & EPIs', 
    norma: 'NR-06 (Uso Obrigatório de EPI)',
    pergunta: 'Pessoas - Todos os funcionários próprios e terceiros estão utilizando os EPIs necessarios (capacete com jugular; bota de segurança; óculos de segurança; colete ou uniforme refletivo? Todos estão em boas condições de uso?', 
    perguntaCurta: 'EPIs completos (Capacete, Óculos, Botina, Colete Refletivo)', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Paralisação da atividade do colaborador até a colocação correta dos EPIs obrigatórios',
      porQue: 'Garantir proteção contra impactos, perfurações e visibilidade noturna (NR-06)',
      onde: 'Armazém geral e pátio externo',
      quem: 'Auditor GSA / Liderança de Turno',
      quando: 'Imediato',
      como: 'Fornecimento imediato do EPI faltante e registro de coaching no sistema',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 22, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'NR-17 (Ergonomia)',
    pergunta: 'Pessoas - Todos os funcionários próprios e terceiros estão seguindo os procedimentos de segurança de movimentação manual (seguem a postura correta no manuseio de produtos)?', 
    perguntaCurta: 'Postura na movimentação manual de cargas', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Treinamento prático de ergonomia: flexão dos joelhos e coluna ereta',
      porQue: 'Prevenir lombalgias, lesões na coluna e fadiga osteomuscular (NR-17)',
      onde: 'Picking manual, carregamento e descarregamento',
      quem: 'Ergonomista / TST / Fisioterapeuta do Trabalho',
      quando: 'Em até 5 dias úteis',
      como: 'Aplicação de Diálogo Diário de Segurança (DDS) prático com demonstração postural',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 23, 
    categoria: 'Emergência & Incêndio', 
    norma: 'NR-23 (Plano de Evacuação)',
    pergunta: 'Pessoas - Funcionários conhecem a rota de fuga em caso de emergência e os pontos de encontro? Orientar os colaboradores sobre o ponto de apoio : guarita, em caso de emergência.', 
    perguntaCurta: 'Conhecimento da rota de fuga e ponto de encontro', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'DDS e simulado de evacuação reforçando ponto de encontro na guarita',
      porQue: 'Garantir evacuação ordenada e contagem segura de vidas em emergência',
      onde: 'Ponto de Encontro - Guarita Principal',
      quem: 'Brigada de Emergência e SST',
      quando: 'Semanal nos DDS',
      como: 'Exibição do mapa de rotas de fuga e testes de tempo de resposta',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 24, 
    categoria: 'Pessoas & EPIs', 
    norma: 'Regra de Ouro DPO - Segregação 5M',
    pergunta: 'Pessoas - As pessoas estão afastadas pelo menos a 5 metros das empilhadeiras quando estão em operação, conforme solicitados no manual de segurança em armazéns e almoxarifados?', 
    perguntaCurta: 'Distância de segurança de 5 metros das empilhadeiras', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Coaching imediato para manter distância mínima de 5 metros da empilhadeira em ação',
      porQue: 'Eliminar risco de atropelamento e esmagamento por carga em movimentação',
      onde: 'Ruas do armazém e pátio',
      quem: 'Operadores, Conferentes e Ajudantes',
      quando: 'Imediato (Tolerância Zero DPO)',
      como: 'Parar a operação se houver pedestre no raio de 5m e só retomar após afastamento',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 25, 
    categoria: '5S & Meio Ambiente', 
    norma: 'Programa 5S DPO',
    pergunta: '5s - Todos os objetos disponiveis na área são realmente necessários? Área está organizada e limpa?', 
    perguntaCurta: '5S: Senso de Utilização e Organização', 
    peso: 4,
    riscoSeDesvio: 'BAIXO',
    acaoPadrao5W2H: {
      oQue: 'Mutirão 5S de descarte de materiais obsoletos e organização de caixas',
      porQue: 'Otimizar espaço, fluidez logística e ambiente de trabalho limpo',
      onde: 'Setor auditado',
      quem: 'Padrinho 5S do Setor e Equipe',
      quando: 'Até o final da semana',
      como: 'Classificação com etiquetas vermelhas e descarte ecologicamente correto',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 26, 
    categoria: '5S & Meio Ambiente', 
    norma: 'PGRS / ISO 14001',
    pergunta: 'Coleta seletiva - Os materiais estão separados corretamente para sua devida destinação.', 
    perguntaCurta: 'Coleta seletiva e descarte ecológico', 
    peso: 4,
    riscoSeDesvio: 'BAIXO',
    acaoPadrao5W2H: {
      oQue: 'Reorganização das lixeiras de coleta seletiva e orientação da equipe',
      porQue: 'Cumprimento da legislação ambiental e destinação de recicláveis (PGRS)',
      onde: 'Pontos de descarte do armazém',
      quem: 'Comitê de Meio Ambiente',
      quando: 'Em até 48 horas',
      como: 'Padronização de cores: azul (papelão), vermelho (plástico), cinza (não reciclável)',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 27, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'NR-17 (Ergonomia)',
    pergunta: 'Aproxima o corpo da carga abaixando-se e executando ergonomia correta?', 
    perguntaCurta: 'Ergonomia: aproximação da carga', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Correção ergonômica da técnica de pega: aproximar a carga do tronco',
      porQue: 'Diminuir o braço de alavanca sobre a região lombar',
      onde: 'Bancadas de picking e repack',
      quem: 'Ajudantes e Conferentes',
      quando: 'Imediato no posto de trabalho',
      como: 'Coaching 1 a 1 do supervisor demonstrando o centro de gravidade da carga',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 28, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'NR-17 / NR-11',
    pergunta: 'Está empurrando a paleteira ao inves de puxar?', 
    perguntaCurta: 'Empurrar paleteira manual (não puxar)', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Orientação operacional para SEMPRE EMPURRAR a paleteira manual carregada',
      porQue: 'Evitar torção de coluna, atropelamento dos próprios calcanhares e lesões nos ombros',
      onde: 'Vias de circulação interna',
      quem: 'Operadores de paleteira',
      quando: 'Imediato',
      como: 'Coaching comportamental e feedback corretivo durante a ronda',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 29, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'DPO Segurança - Segregação',
    pergunta: 'Utilizam as travas do piking e a segregação homem máquina?', 
    perguntaCurta: 'Travas do picking e segregação homem-máquina', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Acionamento obrigatório das correntes e travas de segurança nas ruas de picking',
      porQue: 'Bloquear entrada de pedestres enquanto a empilhadeira opera no corredor',
      onde: 'Corredores de picking e ressuprimento',
      quem: 'Operadores de Picking e Empilhadores',
      quando: 'Permanente',
      como: 'Engatar a trava com placa de "Corredor Bloqueado - Empilhadeira Operando"',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 30, 
    categoria: 'Pessoas & EPIs', 
    norma: 'NR-06 / Manual DPO',
    pergunta: 'Está ultilizando luvas na operação de empilhadeira?', 
    perguntaCurta: 'Uso de luvas pelo empilhador', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Obrigatoriedade do uso de luvas de proteção (ambas as mãos) na empilhadeira',
      porQue: 'Proteção contra farpas de madeira de paletes, atrito e cortes',
      onde: 'Cabine de comando da empilhadeira',
      quem: 'Operadores de Empilhadeira',
      quando: 'Imediato',
      como: 'Fornecer luva nitrílica/vaqueta com ajuste adequado ao operador',
      quanto: 'R$ 0,00 (Estoque Almoxarifado)'
    }
  },
  { 
    id: 31, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'DPO Segurança - Parada Segura',
    pergunta: 'Desliga a empilhadeira e abaixa os garfos quando alguém se aproxima? Orientar colaborador sobre este procedimento.', 
    perguntaCurta: 'Desligar empilhadeira e abaixar garfos na aproximação', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Treinamento de parada segura: abaixar garfos ao nível do piso e desligar ignição',
      porQue: 'Impedir tropeços nas lanças elevadas e partidas acidentais durante diálogo',
      onde: 'Área de movimentação de paletes',
      quem: 'Operadores de Empilhadeira',
      quando: 'Imediato',
      como: 'Coaching comportamental e checagem nas rondas semanais',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 32, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'NR-10 / NR-20',
    pergunta: 'Realiza carregamento de bateria seguindo todos padrões de segurança?', 
    perguntaCurta: 'Carregamento seguro de baterias', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Uso de avental de PVC, protetor facial e luva de borracha na sala de baterias',
      porQue: 'Proteger contra vapores de hidrogênio e respingos de eletrólito ácido sulfúrico',
      onde: 'Sala de Carga de Baterias Tracionárias',
      quem: 'Operadores de Bateria',
      quando: 'Em todas as recargas',
      como: 'Checagem do exaustor ligado e kit de neutralização de ácido disponível',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 33, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'Regra de Ouro DPO - Giro 360°',
    pergunta: 'Faz o giro 360 em carretas e caminhões antes de carregar e descarregar?', 
    perguntaCurta: 'Giro de 360° em carretas antes da operação', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Inspeção perimetral completa (360 graus) antes de liberar carga/descarga',
      porQue: 'Verificar travas, calços, vazamentos, pessoas no entorno e estabilidade',
      onde: 'Pátio de Carretas e Docas',
      quem: 'Conferente e Operador de Empilhadeira',
      quando: 'Antes de iniciar cada veículo',
      como: 'Caminhada ao redor do veículo inspecionando laterais, pneus, teto e traseira',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 34, 
    categoria: 'Pessoas & EPIs', 
    norma: 'NR-11 / Regra de Ouro DPO',
    pergunta: 'Faz o uso do cinto de segurança ?', 
    perguntaCurta: 'Uso contínuo do cinto de segurança na empilhadeira', 
    peso: 4,
    riscoSeDesvio: 'CRITICO',
    acaoPadrao5W2H: {
      oQue: 'Uso obrigatório e contínuo do cinto de segurança de 3 pontos na empilhadeira',
      porQue: 'Impedir ejeção do operador em caso de tombamento lateral da máquina',
      onde: 'Todas as empilhadeiras em circulação',
      quem: 'Operadores de Empilhadeira',
      quando: 'Tolerância Zero',
      como: 'Verificação visual dos líderes; desligamento imediato da máquina se flagrado sem cinto',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 35, 
    categoria: 'Equipamentos & Máquinas', 
    norma: 'Regra de Ouro DPO - Chave de Ignição',
    pergunta: 'Verificar durante a semana se quando no carregamento ou descarregamento de produtos, a chave da ignição é retirada.', 
    perguntaCurta: 'Remoção da chave de ignição da empilhadeira parada', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Retirar e guardar a chave da ignição sempre que descer da empilhadeira',
      porQue: 'Impedir acionamento por pessoas não autorizadas ou acidentes de terceiros',
      onde: 'Áreas de descarga, docas e estacionamento',
      quem: 'Operadores de Empilhadeira',
      quando: 'Toda parada de máquina',
      como: 'Coaching comportamental e guarda da chave no bolso do uniforme',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 36, 
    categoria: 'Ergonomia & Comportamento', 
    norma: 'Regra de Ouro DPO - Três Pontos',
    pergunta: 'Desce do caminhão utilizando os três pontos de apoio?', 
    perguntaCurta: 'Três pontos de apoio na descida de cabines/carretas', 
    peso: 4,
    riscoSeDesvio: 'ALTO',
    acaoPadrao5W2H: {
      oQue: 'Descer de cabines, carretas e escadas mantendo 3 pontos de contato (2 mãos e 1 pé ou 2 pés e 1 mão)',
      porQue: 'Eliminar risco de torção de tornozelo, quedas e fraturas',
      onde: 'Frota de caminhões, carretas e empilhadeiras',
      quem: 'Motoristas, Ajudantes e Operadores',
      quando: 'Permanente',
      como: 'Descer sempre de frente para o veículo sem pular do estribo',
      quanto: 'R$ 0,00 (Operacional)'
    }
  },
  { 
    id: 37, 
    categoria: 'Pessoas & EPIs', 
    norma: 'Pilar Gente DPO / Treinamentos',
    pergunta: 'Os colaboradores do armazém sabe ou se lembra qual foi o último treinamento? Colocar ao lado qual foi a reposta dos colaboradores.', 
    perguntaCurta: 'Fixação e lembrança dos treinamentos DPO', 
    peso: 4,
    riscoSeDesvio: 'MEDIO',
    acaoPadrao5W2H: {
      oQue: 'Reforço semanal nos DDS dos temas ministrados no plano de capacitação DPO',
      porQue: 'Garantir retenção e aplicação prática dos procedimentos operacionais padrão',
      onde: 'Armazém Geral',
      quem: 'Instrutor Interno e Supervisores',
      quando: 'Semanal',
      como: 'Perguntas surpresa nos DDS com premiação simbólica de reconhecimento',
      quanto: 'R$ 0,00 (Operacional)'
    }
  }
];

export interface RondaInspecaoCompleta {
  id: string;
  dataISO: string;
  dataFormatted: string;
  mesAno: string;
  mesNumero: string;
  semanaAno?: number;
  auditorNome: string;
  colaboradorAuditado: string;
  localAuditado: string;
  percentual: number;
  pontosNota10: number;
  status: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM';
  comentarios: string | null;
  desvioIdentificado?: boolean;
  coachingAplicado?: boolean;
  acaoCorretiva?: string;
  respostas: Record<string, string>;
  totalConformes: number;
  totalNaoConformes: number;
  totalNaoAplica: number;
  criadoEm: string;
}

// 34 Rondas Oficiais Extraídas Diretamente do "farol gsa.xlsx" e Consolidadas até 28 de Agosto de 2026
export const RONDA_GSA_HISTORICO_OFICIAL: RondaInspecaoCompleta[] = ${rondasJson};

export const TODAS_RONDAS_OFICIAIS_2026: RondaInspecaoCompleta[] = RONDA_GSA_HISTORICO_OFICIAL;

// Meses disponíveis no filtro do ano de 2026 (Até Dezembro de 2026)
export const MESES_DISPONIVEIS_2026 = [
  { value: 'TODOS', label: 'Todos os Meses (2026)', totalRondas: 34 },
  { value: '01/2026', label: 'Janeiro / 2026', totalRondas: 4 },
  { value: '02/2026', label: 'Fevereiro / 2026', totalRondas: 4 },
  { value: '03/2026', label: 'Março / 2026', totalRondas: 4 },
  { value: '04/2026', label: 'Abril / 2026', totalRondas: 4 },
  { value: '05/2026', label: 'Maio / 2026', totalRondas: 4 },
  { value: '06/2026', label: 'Junho / 2026', totalRondas: 4 },
  { value: '07/2026', label: 'Julho / 2026', totalRondas: 5 },
  { value: '08/2026', label: 'Agosto / 2026 (Atualizado até 28/08)', totalRondas: 4 },
  { value: '09/2026', label: 'Setembro / 2026 (Cronograma Aberto)', totalRondas: 0 },
  { value: '10/2026', label: 'Outubro / 2026 (Cronograma Aberto)', totalRondas: 0 },
  { value: '11/2026', label: 'Novembro / 2026 (Cronograma Aberto)', totalRondas: 0 },
  { value: '12/2026', label: 'Dezembro / 2026 (Cronograma Aberto)', totalRondas: 0 }
];

export const AUDITORES_OFICIAIS_GSA = [
  'DJEANDERSON SOARES',
  'MARIA KAMILLY DOS SANTOS'
];

export interface ItemLaudoAvaliado {
  id: number;
  categoria: string;
  norma: string;
  pergunta: string;
  perguntaCurta: string;
  status: StatusItemAvaliacao;
  statusLabel: string;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  observacao?: string;
  acao5W2H?: ItemVerificacaoGSA['acaoPadrao5W2H'];
}

export const FAROL_GSA_URL_OFICIAL = 'https://app.quickgestao.com.br/checklist/farol';

export function classificarStatusItem(valor: string | undefined): { status: StatusItemAvaliacao; label: string; conformidade: number } {
  if (!valor) return { status: 'NA', label: 'N/A', conformidade: 0 };
  const v = valor.trim().toUpperCase();
  if (v === 'OTIMO' || v === 'ÓTIMO' || v === 'SIM') return { status: 'OTIMO', label: 'Ótimo', conformidade: 100 };
  if (v === 'BOM') return { status: 'BOM', label: 'Bom', conformidade: 50 };
  if (v === 'RUIM' || v === 'NÃO' || v === 'NAO') return { status: 'RUIM', label: 'Ruim', conformidade: 0 };
  return { status: 'NA', label: 'N/A', conformidade: 0 };
}

export interface DesvioMapeado {
  id: number;
  categoria: string;
  norma: string;
  pergunta: string;
  perguntaCurta: string;
  status: StatusItemAvaliacao;
  statusLabel: string;
  risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  observacao: string;
  acao5W2H: ItemVerificacaoGSA['acaoPadrao5W2H'];
}

export interface CategoriaLaudoStats {
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
  dataFormatted: string;
  dataISO: string;
  semanaAno: number;
  mesAno: string;
  auditorNome: string;
  colaboradorAuditado: string;
  localAuditado: string;
  percentual: number;
  pontosNota10: number;
  statusFarol: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM';
  totalOtimo: number;
  totalBom: number;
  totalRuim: number;
  totalNA: number;
  totalAvaliados: number;
  totalGeral: number;
  itens: ItemLaudoAvaliado[];
  desvios: DesvioMapeado[];
  categoriasStats: CategoriaLaudoStats[];
  parecerTecnico: string;
  conclusaoSeguranca: string;
  comentariosAuditor: string | null;
  acoesDpoSugeridas: Array<{
    id: string;
    origemItem: number;
    titulo: string;
    oQue: string;
    porQue: string;
    onde: string;
    quem: string;
    quando: string;
    como: string;
    quanto: string;
    status: string;
  }>;
}

export function gerarLaudoTecnicoConformidade(ronda: RondaInspecaoCompleta | any): LaudoTecnicoConformidadeData {
  if (!ronda) {
    return {
      rondaId: '',
      dataFormatted: '',
      dataISO: '',
      semanaAno: 1,
      mesAno: '01/2026',
      auditorNome: '',
      colaboradorAuditado: '',
      localAuditado: '',
      percentual: 0,
      pontosNota10: 0,
      statusFarol: 'RUIM',
      totalOtimo: 0,
      totalBom: 0,
      totalRuim: 0,
      totalNA: 0,
      totalAvaliados: 0,
      totalGeral: QUESTOES_GSA_OFICIAIS.length,
      itens: [],
      desvios: [],
      categoriasStats: [],
      parecerTecnico: '',
      conclusaoSeguranca: '',
      comentariosAuditor: null,
      acoesDpoSugeridas: []
    };
  }

  const respostas = ronda.respostas || {};
  let totalOtimo = 0;
  let totalBom = 0;
  let totalRuim = 0;
  let totalNA = 0;

  const itensAvaliados: ItemLaudoAvaliado[] = [];
  const desvios: DesvioMapeado[] = [];

  const categoriasMap = new Map<string, { total: number; otimo: number; bom: number; ruim: number; na: number }>();

  QUESTOES_GSA_OFICIAIS.forEach((q) => {
    let rawVal = respostas[q.pergunta] || respostas[q.perguntaCurta] || 'N/A';
    const norm = String(rawVal).toUpperCase().trim();

    let status: StatusItemAvaliacao = 'NA';
    let statusLabel = 'N/A (Não Aplica)';

    if (norm === 'ÓTIMO' || norm === 'OTIMO' || norm === 'SIM') {
      status = 'OTIMO';
      statusLabel = 'Ótimo / Sim (100%)';
      totalOtimo++;
    } else if (norm === 'BOM') {
      status = 'BOM';
      statusLabel = 'Bom / Conforme c/ Ressalva';
      totalBom++;
    } else if (norm === 'RUIM' || norm === 'NÃO' || norm === 'NAO') {
      status = 'RUIM';
      statusLabel = 'Ruim / Não Conforme (Desvio)';
      totalRuim++;
      desvios.push({
        id: q.id,
        categoria: q.categoria,
        norma: q.norma,
        pergunta: q.pergunta,
        perguntaCurta: q.perguntaCurta,
        status: status,
        statusLabel: statusLabel,
        risco: q.riscoSeDesvio,
        observacao: 'Desvio identificado em: ' + q.perguntaCurta + '. Avaliado como "' + rawVal + '".',
        acao5W2H: q.acaoPadrao5W2H
      });
    } else {
      status = 'NA';
      statusLabel = 'N/A (Não Aplicável)';
      totalNA++;
    }

    itensAvaliados.push({
      id: q.id,
      categoria: q.categoria,
      norma: q.norma,
      pergunta: q.pergunta,
      perguntaCurta: q.perguntaCurta,
      status,
      statusLabel,
      risco: q.riscoSeDesvio,
      observacao: status === 'RUIM' ? (ronda.comentarios || 'Desvio identificado na inspeção') : undefined,
      acao5W2H: q.acaoPadrao5W2H
    });

    if (!categoriasMap.has(q.categoria)) {
      categoriasMap.set(q.categoria, { total: 0, otimo: 0, bom: 0, ruim: 0, na: 0 });
    }
    const cat = categoriasMap.get(q.categoria)!;
    cat.total += 1;
    if (status === 'OTIMO') cat.otimo += 1;
    if (status === 'BOM') cat.bom += 1;
    if (status === 'RUIM') cat.ruim += 1;
    if (status === 'NA') cat.na += 1;
  });

  const totalAvaliados = totalOtimo + totalBom + totalRuim;

  const categoriasStats: CategoriaLaudoStats[] = Array.from(categoriasMap.entries()).map(([categoria, stats]) => {
    const avaliaveis = stats.otimo + stats.bom + stats.ruim;
    const conformes = stats.otimo + stats.bom;
    const conformidadePct = avaliaveis > 0 ? Number(((conformes / avaliaveis) * 100).toFixed(1)) : 100;
    return {
      categoria,
      totalItens: stats.total,
      otimo: stats.otimo,
      bom: stats.bom,
      ruim: stats.ruim,
      na: stats.na,
      conformidadePct
    };
  });

  const pct = Number(ronda.percentual || (totalAvaliados > 0 ? (((totalOtimo * 2 + totalBom) / (totalAvaliados * 2)) * 100).toFixed(2) : 95));
  let statusFarol: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM' = 'EXCELENTE';
  let parecerTecnico = '';
  let conclusaoSeguranca = '';

  if (pct >= 95) {
    statusFarol = 'EXCELENTE';
    parecerTecnico = 'A auditoria de qualidade e segurança operacional do armazém registrou índice de conformidade de ' + pct + '%, atingindo a faixa de EXCELÊNCIA DPO (≥95%). Observa-se elevada aderência aos padrões de segregação homem-máquina, utilização obrigatória de EPIs conforme NR-06, cumprimento dos 5 metros de afastamento operacional de empilhadeiras e manutenção preventiva das vias de circulação.';
    conclusaoSeguranca = 'UNIDADE EM CONFORMIDADE PLENA. Recomenda-se a manutenção dos Diálogos Diários de Segurança (DDS), reconhecimento da equipe e sustentação dos padrões de 5S e ergonomia no armazém.';
  } else if (pct >= 90) {
    statusFarol = 'BOM';
    parecerTecnico = 'A inspeção registrou índice de conformidade de ' + pct + '%, situando-se em nível BOM com pequenas não conformidades pontuais. Foram identificados ' + totalRuim + ' ponto(s) de atenção com necessidade de ação corretiva ou coaching comportamental.';
    conclusaoSeguranca = 'UNIDADE APROVADA COM RESSALVAS. Exige-se a execução imediata do plano de ação 5W2H anexo para os desvios identificados em até 48 horas.';
  } else if (pct >= 80) {
    statusFarol = 'RAZOÁVEL';
    parecerTecnico = 'Índice de conformidade de ' + pct + '% em zona de ATENÇÃO (Razoável). Constataram-se ' + totalRuim + ' desvios de processo que comprometem a fluidez operacional e a segurança patrimonial e física dos colaboradores.';
    conclusaoSeguranca = 'NECESSIDADE DE INTERVENÇÃO IMEDIATA. O Supervisor de Turno e o Técnico de Segurança devem aplicar reciclagem prática com a equipe operacional antes do próximo turno.';
  } else {
    statusFarol = 'RUIM';
    parecerTecnico = 'Índice de conformidade crítico de ' + pct + '%, abaixo do limite tolerável DPO (<80%). Múltiplos desvios graves detectados envolvendo normas regulamentadoras NR-11, NR-12 e regras de ouro de segurança.';
    conclusaoSeguranca = 'INTERVENÇÃO CRÍTICA OBRIGATÓRIA. Reunião extraordinária de alinhamento com a Gerência de Operações e execução prioritária dos planos de ação.';
  }

  const acoesDpoSugeridas = desvios.map((desvio, idx) => ({
    id: 'acao-' + (ronda.id || 'gsa') + '-' + desvio.id + '-' + idx,
    origemItem: desvio.id,
    titulo: 'GSA 5W2H - ' + desvio.perguntaCurta,
    oQue: desvio.acao5W2H.oQue,
    porQue: desvio.acao5W2H.porQue + ' (' + desvio.norma + ')',
    onde: desvio.acao5W2H.onde,
    quem: ronda.auditorNome ? (ronda.auditorNome + ' / Supervisor de Turno') : desvio.acao5W2H.quem,
    quando: desvio.risco === 'CRITICO' ? 'Imediato (24h)' : desvio.acao5W2H.quando,
    como: desvio.acao5W2H.como,
    quanto: desvio.acao5W2H.quanto,
    status: 'Em Andamento'
  }));

  return {
    rondaId: ronda.id || 'ronda-atual',
    dataFormatted: ronda.dataFormatted || ronda.data || new Date().toLocaleDateString('pt-BR'),
    dataISO: ronda.dataISO || new Date().toISOString(),
    semanaAno: ronda.semanaAno || 1,
    mesAno: ronda.mesAno || '01/2026',
    auditorNome: ronda.auditorNome || 'Auditor de Qualidade DPO',
    colaboradorAuditado: ronda.colaboradorAuditado || 'Equipe de Operações',
    localAuditado: ronda.localAuditado || 'Armazém Geral - Guarabira / PB',
    percentual: pct,
    pontosNota10: ronda.pontosNota10 || Number((pct / 10).toFixed(1)),
    statusFarol,
    totalOtimo,
    totalBom,
    totalRuim,
    totalNA,
    totalAvaliados,
    totalGeral: QUESTOES_GSA_OFICIAIS.length,
    itens: itensAvaliados,
    desvios,
    categoriasStats,
    parecerTecnico,
    conclusaoSeguranca,
    comentariosAuditor: ronda.comentarios || null,
    acoesDpoSugeridas
  };
}

export const gerarLaudoConformidadeTecnico = gerarLaudoTecnicoConformidade;
`;

fs.writeFileSync('./src/data/rondaGsaOfficialDataset.ts', fullFile);
console.log('Successfully written ./src/data/rondaGsaOfficialDataset.ts with', rondasData.length, 'inspections');
