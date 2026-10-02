// Dataset Oficial de Rondas de Qualidade do Armazém - DSPD Guarabira (41 Quesitos / 6 Áreas)
// Responsável Técnico: Djeanderson Soares
// Unidade: DSPD Guarabira - PB | Período: 01/01/2026 a 29/08/2026 (1 ronda por semana)
// Meta DPO: >= 95% de Aderência

export interface ItemVerificacaoGSA {
  id: number;
  sourceRow?: number;
  categoria: string; // 'Estrutura de Armazém e Layout' | 'Condições de Armazenagem' | 'Gestão de Pragas' | 'Gestão de Idade' | 'Segregação de PNC' | 'Repack'
  norma: string;
  pergunta: string;
  perguntaCurta: string;
  descricaoOrientacao?: string;
  peso: number;
  riscoSeDesvio: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  impactoOperacional?: 'BAIXO' | 'MEDIO' | 'ALTO';
  mediaAderenciaJanAgo?: number;
  mediaAderenciaPercentual?: number;
  respostasObservadas?: number;
  sim?: number;
  nao?: number;
  mediaPorMes?: Record<string, number>;
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

export const CATEGORIAS_GSA = [
  'Estrutura de Armazém e Layout',
  'Condições de Armazenagem',
  'Gestão de Pragas',
  'Gestão de Idade',
  'Segregação de PNC',
  'Repack'
] as const;

export const DOCUMENTO_DSPD_GUARABIRA = {
  nome: "DSPD Guarabira - Rondas de Qualidade",
  unidade: "DSPD Guarabira",
  responsavel_rondas: "Djeanderson Soares",
  periodo: {
    inicio: "2026-01-01",
    fim: "2026-08-29"
  },
  frequencia: "1 ronda por semana",
  metaDpo: 95.0,
  acumulado_jan_ago: {
    aderencia: 0.965041,
    percentual: 96.5
  },
  resumo_mensal: {
    JAN: { respostas_observadas: 164, sim: 153, nao: 11, aderencia: 0.932927, aderencia_percentual: 93.29 },
    FEV: { respostas_observadas: 164, sim: 158, nao: 6, aderencia: 0.963415, aderencia_percentual: 96.34 },
    MAR: { respostas_observadas: 164, sim: 159, nao: 5, aderencia: 0.969512, aderencia_percentual: 96.95 },
    ABR: { respostas_observadas: 164, sim: 158, nao: 6, aderencia: 0.963415, aderencia_percentual: 96.34 },
    MAI: { respostas_observadas: 164, sim: 159, nao: 5, aderencia: 0.969512, aderencia_percentual: 96.95 },
    JUN: { respostas_observadas: 164, sim: 159, nao: 5, aderencia: 0.969512, aderencia_percentual: 96.95 },
    JUL: { respostas_observadas: 164, sim: 160, nao: 4, aderencia: 0.97561, aderencia_percentual: 97.56 },
    AGO: { respostas_observadas: 82, sim: 81, nao: 1, aderencia: 0.987805, aderencia_percentual: 98.78 }
  },
  resumo_por_area: {
    "Estrutura de Armazém e Layout": { respostas: 240, sim: 223, nao: 17, aderencia: 0.929167, aderencia_percentual: 92.92 },
    "Condições de Armazenagem": { respostas: 330, sim: 314, nao: 16, aderencia: 0.951515, aderencia_percentual: 95.15 },
    "Gestão de Pragas": { respostas: 150, sim: 147, nao: 3, aderencia: 0.98, aderencia_percentual: 98.0 },
    "Gestão de Idade": { respostas: 60, sim: 60, nao: 0, aderencia: 1.0, aderencia_percentual: 100.0 },
    "Segregação de PNC": { respostas: 90, sim: 90, nao: 0, aderencia: 1.0, aderencia_percentual: 100.0 },
    "Repack": { respostas: 360, sim: 353, nao: 7, aderencia: 0.980556, aderencia_percentual: 98.06 }
  }
};

export const QUESTOES_GSA_OFICIAIS: ItemVerificacaoGSA[] = [
  {
    id: 1,
    sourceRow: 6,
    categoria: "Estrutura de Armazém e Layout",
    norma: "Manual DPO Armazém / Segurança Patrimonial",
    pergunta: "O acesso ao armazém e outros prédios de armazenamento e manuseio de produtos é restrito, para impedir a entrada de pessoas não autorizadas.",
    perguntaCurta: "Controle de acesso restrito ao armazém",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Reforçar controle de acesso e crachá nas portarias e portas de docas",
      porQue: "Impedir fluxo de pedestres desautorizados nas áreas de movimentação",
      onde: "Acessos principais e portões de expedição",
      quem: "Portaria / Djeanderson Soares",
      quando: "Imediato",
      como: "Fechamento de catracas e verificação de identificação",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 2,
    sourceRow: 7,
    categoria: "Estrutura de Armazém e Layout",
    norma: "Manutenção Predial / NR-08",
    pergunta: "O telhado do armazém está em bom estado de conservação, livre de danos estruturais e sinais de vazamento.",
    perguntaCurta: "Conservação do telhado e ausência de goteiras",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 0.966667,
    mediaAderenciaPercentual: 96.67,
    respostasObservadas: 30,
    sim: 29,
    nao: 1,
    acaoPadrao5W2H: {
      oQue: "Inspeção e vedação de calhas e telhas com fissuras",
      porQue: "Prevenir goteiras e umidade nas embalagens de produto acabado",
      onde: "Cobertura do armazém geral",
      quem: "Manutenção Predial / Djeanderson Soares",
      quando: "Em até 48 horas",
      como: "Aplicação de manta asfáltica e troca de telhas danificadas",
      quanto: "R$ 250,00"
    }
  },
  {
    id: 3,
    sourceRow: 8,
    categoria: "Estrutura de Armazém e Layout",
    norma: "Manual de Higiene e 5S DPO",
    pergunta: "A área do armazém é geralmente limpa, bem organizada e livre de sinais de infestação de pragas (pássaros, roedores e insetos).",
    perguntaCurta: "Limpeza geral, 5S e ausência de pragas no armazém",
    peso: 5,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.833333,
    mediaAderenciaPercentual: 83.33,
    respostasObservadas: 30,
    sim: 25,
    nao: 5,
    acaoPadrao5W2H: {
      oQue: "Mutirão 5S, varrição pesada e reforço no isolamento contra aves",
      porQue: "Eliminar sujidades, restos de madeira e abrigo de pragas no armazém",
      onde: "Ruas de armazenagem e corredores perimetrais",
      quem: "Djeanderson Soares / Equipe de Limpeza",
      quando: "Imediato na ronda semanal",
      como: "Higienização diária com varredeira mecânica e recolhimento de resíduos",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 4,
    sourceRow: 9,
    categoria: "Estrutura de Armazém e Layout",
    norma: "NR-11 / Segurança Viária",
    pergunta: "Todas as superfícies do piso utilizadas para o tráfego de empilhadeiras são lisas, limpas e sem rachaduras ou buracos que podem causar danos ao produto durante o transporte.",
    perguntaCurta: "Piso liso e sem buracos para empilhadeiras",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 0.866667,
    mediaAderenciaPercentual: 86.67,
    respostasObservadas: 30,
    sim: 26,
    nao: 4,
    acaoPadrao5W2H: {
      oQue: "Correção de juntas e nivelamento de buracos no piso de tráfego",
      porQue: "Prevenir desestabilização de paletes e vibrações na torre de empilhadeiras",
      onde: "Vias de circulação das empilhadeiras",
      quem: "Manutenção Predial / Djeanderson Soares",
      quando: "Em até 5 dias úteis",
      como: "Aplicação de argamassa epóxi de cura rápida",
      quanto: "R$ 400,00"
    }
  },
  {
    id: 5,
    sourceRow: 10,
    categoria: "Estrutura de Armazém e Layout",
    norma: "Padrão de Higiene DPO",
    pergunta: "Existe um cronograma de limpeza, para garantir que os pisos/estruturas sejam mantidos limpos, livres de acúmulo excessivo de poeira e água parada para evitar acúmulo de poeira / sujeira nos produtos acabados.",
    perguntaCurta: "Cronograma de limpeza e controle de poeira",
    peso: 3,
    riscoSeDesvio: "BAIXO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Auditar o cumprimento do cronograma diário e semanal de limpeza",
      porQue: "Garantir padrão sanitário e preservação visual dos lotes",
      onde: "Todo o complexo do armazém",
      quem: "Djeanderson Soares",
      quando: "Semanal",
      como: "Checagem visual e visto no quadro de rotinas",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 6,
    sourceRow: 11,
    categoria: "Estrutura de Armazém e Layout",
    norma: "Qualidade DPO / NR-11",
    pergunta: "Os pisos das áreas externas, de carga e descarga são varridos / limpos regularmente, para reduzir a migração de poeira e sujeira para o armazém pelo tráfego de empilhadeiras.",
    perguntaCurta: "Varrição das áreas externas e docas de carga",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.833333,
    mediaAderenciaPercentual: 83.33,
    respostasObservadas: 30,
    sim: 25,
    nao: 5,
    acaoPadrao5W2H: {
      oQue: "Intensificar varrição dos pátios externos e docas antes da operação",
      porQue: "Evitar que poeira externa entre no armazém grudada nos pneus das empilhadeiras",
      onde: "Pátio externo de manobra e plataformas de descarga",
      quem: "Equipe de Limpeza / Djeanderson Soares",
      quando: "2x ao dia (Início de turno)",
      como: "Varrição com recolhimento imediato de detritos",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 7,
    sourceRow: 12,
    categoria: "Estrutura de Armazém e Layout",
    norma: "Endereçamento WMS / Visual Management",
    pergunta: "Os corredores / baias/lotes do armazém estão claramente identificados, para reduzir o risco de erro humano durante as movimentações internas.",
    perguntaCurta: "Identificação clara de corredores, baias e lotes",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.966667,
    mediaAderenciaPercentual: 96.67,
    respostasObservadas: 30,
    sim: 29,
    nao: 1,
    acaoPadrao5W2H: {
      oQue: "Substituir placas de identificação de rua e etiquetas de lote danificadas",
      porQue: "Prevenir erros de conferência e trocas de endereço de armazenagem",
      onde: "Placas aéreas e cantoneiras de baias",
      quem: "Líder de Armazém / Djeanderson Soares",
      quando: "Em até 24 horas",
      como: "Impressão e fixação de placas refletivas com QR code/endereço WMS",
      quanto: "R$ 60,00"
    }
  },
  {
    id: 8,
    sourceRow: 13,
    categoria: "Estrutura de Armazém e Layout",
    norma: "NR-17 / ABNT NBR ISO 8995-1",
    pergunta: "A área do armazém é devidamente iluminada, permitindo a identificação visual dos corredores / baias/lotes e códigos do produto, bem como possíveis defeitos do produto.",
    perguntaCurta: "Iluminação adequada para inspeção e visualização",
    peso: 3,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.966667,
    mediaAderenciaPercentual: 96.67,
    respostasObservadas: 30,
    sim: 29,
    nao: 1,
    acaoPadrao5W2H: {
      oQue: "Substituição de luminárias LED queimadas e limpeza dos refletores",
      porQue: "Garantir luminância mínima de 150 lux para inspeção visual de avarias",
      onde: "Ruas de estoque e docas de conferência",
      quem: "Manutenção Elétrica / Djeanderson Soares",
      quando: "Em até 48 horas",
      como: "Troca de lâmpadas com apoio de plataforma elevatória",
      quanto: "R$ 120,00"
    }
  },
  {
    id: 9,
    sourceRow: 14,
    categoria: "Condições de Armazenagem",
    norma: "Política de Qualidade Cervejeira DPO",
    pergunta: "Não existe exposição de produtos à luz solar.",
    perguntaCurta: "Proteção total de produtos contra luz solar direta",
    peso: 5,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.833333,
    mediaAderenciaPercentual: 83.33,
    respostasObservadas: 30,
    sim: 25,
    nao: 5,
    acaoPadrao5W2H: {
      oQue: "Instalação/ajuste de lonas de proteção e remanejamento de paletes nas portas",
      porQue: "Evitar oxidação e alteração de sabor da cerveja pelo efeito do sol (lightstruck)",
      onde: "Docas laterais e portas de galpão",
      quem: "Djeanderson Soares / Operação de Armazém",
      quando: "Imediato no ato da ronda",
      como: "Recuo de 2 metros das pilhas em relação às portas e instalação de cortinas UV",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 10,
    sourceRow: 15,
    categoria: "Condições de Armazenagem",
    norma: "Qualidade DPO - Termometria (3°C a 25°C)",
    pergunta: "As áreas de armazenamento do produto são mantidas entre uma temperatura mínima de 3 ° C (38 ° F) e um máximo de 25 ° C (77 ° F) ?",
    perguntaCurta: "Faixa de temperatura controlada (3°C a 25°C)",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.933333,
    mediaAderenciaPercentual: 93.33,
    respostasObservadas: 30,
    sim: 28,
    nao: 2,
    acaoPadrao5W2H: {
      oQue: "Verificar termohigrômetros e manter ventilação/exaustão ativa no galpão",
      porQue: "Assegurar preservação físico-química e shelf life dos produtos",
      onde: "Pontos de medição de temperatura do armazém",
      quem: "Djeanderson Soares",
      quando: "Diário em 3 turnos",
      como: "Leitura calibrada e acionamento de exaustores eólicos/mecânicos",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 11,
    sourceRow: 16,
    categoria: "Condições de Armazenagem",
    norma: "Manual de Chopp DPO - Cadeia do Frio",
    pergunta: "Os barris de chopp são armazenados em uma câmara fria para evitar a deterioração microbiológica e a temperatura da sala é monitorada e gravada pelo menos uma vez ao dia ?",
    perguntaCurta: "Armazenamento e monitoramento de chopp em câmara fria",
    peso: 5,
    riscoSeDesvio: "CRITICO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Registro diário no logbook da câmara fria (0°C a 4°C)",
      porQue: "Evitar fermentação secundária e azedamento de chopp não pasteurizado",
      onde: "Câmara Fria de Chopp",
      quem: "Conferente / Djeanderson Soares",
      quando: "Diário",
      como: "Checagem de display digital e teste de cortina de ar",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 12,
    sourceRow: 17,
    categoria: "Condições de Armazenagem",
    norma: "DPO - PTL (Permissible Total Load)",
    pergunta: "Os pallets são empilhados de acordo com os limites permitidos (PTL) para evitar danos aos produtos devido à compressão?",
    perguntaCurta: "Limites de empilhamento vertical (PTL) respeitados",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.933333,
    mediaAderenciaPercentual: 93.33,
    respostasObservadas: 30,
    sim: 28,
    nao: 2,
    acaoPadrao5W2H: {
      oQue: "Desempilhar e ajustar lotes que excederem o PTL padrão por SKU",
      porQue: "Evitar amassamento de latas inferiores e colapso de caixas",
      onde: "Ruas de armazenagem",
      quem: "Operadores de Empilhadeira / Djeanderson Soares",
      quando: "Imediato",
      como: "Orientação operacional e sinalização das alturas máximas nas colunas",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 13,
    sourceRow: 18,
    categoria: "Condições de Armazenagem",
    norma: "DPO Padrão de Estabilização",
    pergunta: "Os pallets empilhados com 3-alta são protegidos de deformação pelo uso de chapatex colocado entre os mesmos?",
    perguntaCurta: "Uso de chapatex em empilhamento 3-alta",
    peso: 3,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Colocação de chapatex de fibra entre o 2º e 3º andar de paletes",
      porQue: "Distribuir peso uniformemente e estabilizar a torre de caixas",
      onde: "Lotes de vasilhames e produtos 3-alta",
      quem: "Operador de Empilhadeira",
      quando: "Durante a blocagem",
      como: "Inserção manual ou com pegador de chapatex limpo",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 14,
    sourceRow: 19,
    categoria: "Condições de Armazenagem",
    norma: "Boas Práticas de Fabricação / Segurança de Vidros",
    pergunta: "Todas as luzes do teto do armazém são inquebráveis ou equipadas com tampas para evitar a queda do vidro e contaminação dos produtos?",
    perguntaCurta: "Lâmpadas com proteção anti-estilhaçamento",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.966667,
    mediaAderenciaPercentual: 96.67,
    respostasObservadas: 30,
    sim: 29,
    nao: 1,
    acaoPadrao5W2H: {
      oQue: "Instalar difusor de policarbonato em luminárias desprovidas de proteção",
      porQue: "Evitar contaminação por estilhaços de vidro sobre pallets abertos",
      onde: "Luminárias do teto",
      quem: "Manutenção Predial",
      quando: "Em até 48 horas",
      como: "Encaixe de capas plásticas de retenção",
      quanto: "R$ 80,00"
    }
  },
  {
    id: 15,
    sourceRow: 20,
    categoria: "Condições de Armazenagem",
    norma: "Padrão de Qualidade de Paletes PBR / DPO",
    pergunta: "Os pallets de madeira com pregos salientes ou outros danos são imediatamente retirados e segregados para reparo?",
    perguntaCurta: "Segregação imediata de paletes quebrados ou com pregos",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.866667,
    mediaAderenciaPercentual: 86.67,
    respostasObservadas: 30,
    sim: 26,
    nao: 4,
    acaoPadrao5W2H: {
      oQue: "Retirar do fluxo paletes com tocos rachados, pregos expostos ou tábuas soltas",
      porQue: "Prevenir furos em latas, rasgos de filmes e acidentes com colaboradores",
      onde: "Área de paletes vazios e esteiras",
      quem: "Conferentes, Separadores e Djeanderson Soares",
      quando: "Diário contínuo",
      como: "Envio para a baia de manutenção e identificação com fita de segregação",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 16,
    sourceRow: 21,
    categoria: "Condições de Armazenagem",
    norma: "NR-20 / Segurança Alimentar",
    pergunta: "Lubrificantes, combustíveis, produtos de limpeza e outros produtos químicos não alimentares nunca são armazenados na proximidade de produtos acabados evitando o risco de contaminação cruzada ou odor nas embalagens?",
    perguntaCurta: "Segregação de produtos químicos longe de bebidas",
    peso: 5,
    riscoSeDesvio: "CRITICO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Armazenar químicos exclusivamente na sala de inflamáveis/bacia estanque",
      porQue: "Garantir inocuidade total e eliminar risco de contaminação por odor/vazamento",
      onde: "Depósito químico segregado",
      quem: "Almoxarifado / Djeanderson Soares",
      quando: "Permanente",
      como: "Conferência visual de trancas e dique de contenção",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 17,
    sourceRow: 22,
    categoria: "Condições de Armazenagem",
    norma: "NR-11 / Qualidade do Ar",
    pergunta: "As empilhadeiras usadas no armazém são alimentadas por baterias elétricas ou gás (GLP) para evitar a geração de gases de combustão?",
    perguntaCurta: "Empilhadeiras elétricas/GLP sem fumaça no armazém",
    peso: 3,
    riscoSeDesvio: "BAIXO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Auditar a frota garantindo que máquinas diesel não operem em galpão fechado",
      porQue: "Preservar a qualidade do ar e evitar fuligem sobre os produtos",
      onde: "Frota de empilhadeiras",
      quem: "Líder de Manutenção / Djeanderson Soares",
      quando: "Semanal",
      como: "Checklist de combustível e emissão de gases",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 18,
    sourceRow: 23,
    categoria: "Condições de Armazenagem",
    norma: "NR-11 / Conservação de Ativos",
    pergunta: "Empilhadeiras e outros veículos motorizados são mantidos adequadamente (pintura, luzes, sinais reflexivos, etc) e equipado com proteção de borracha nos garfos para evitar dano aos produtos?",
    perguntaCurta: "Manutenção de empilhadeiras e proteção nos garfos",
    peso: 3,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.933333,
    mediaAderenciaPercentual: 93.33,
    respostasObservadas: 30,
    sim: 28,
    nao: 2,
    acaoPadrao5W2H: {
      oQue: "Reposição de borrachas de encosto dos garfos e conserto de faróis",
      porQue: "Evitar que o aço do garfo rasgue embalagens secundárias e filmes",
      onde: "Oficina de empilhadeiras",
      quem: "Manutenção Mecânica / Djeanderson Soares",
      quando: "Em até 24 horas",
      como: "Instalação de kit de proteção de borracha/poliuretano nos garfos",
      quanto: "R$ 150,00"
    }
  },
  {
    id: 19,
    sourceRow: 24,
    categoria: "Condições de Armazenagem",
    norma: "Regra de Ouro DPO / Segurança",
    pergunta: "Fumar, comer e beber não são permitidos nas áreas de armazenamento de produto.",
    perguntaCurta: "Proibição estrita de fumar, comer e beber no armazém",
    peso: 5,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Fiscalização e advertência quanto à ingestão de alimentos fora do refeitório",
      porQue: "Prevenir atração de pragas, cinzas de cigarro e resíduos alimentares",
      onde: "Todo o perímetro interno do armazém",
      quem: "Djeanderson Soares / Liderança Operacional",
      quando: "Contínuo",
      como: "Diálogo de segurança semanal e placas de proibição visíveis",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 20,
    sourceRow: 25,
    categoria: "Gestão de Pragas",
    norma: "MIP - Manejo Integrado de Pragas DPO",
    pergunta: "A estrutura está preparada para garantir que não haja abrigo de aves no teto, evitando a queda de penas e fezes em produtos acabados?",
    perguntaCurta: "Prevenção contra abrigo de aves e pombos no teto",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.966667,
    mediaAderenciaPercentual: 96.67,
    respostasObservadas: 30,
    sim: 29,
    nao: 1,
    acaoPadrao5W2H: {
      oQue: "Manutenção em telas passarinheiras e espantadores ultrassônicos/visuais",
      porQue: "Eliminar risco de contaminação biológica por fezes e penas de pássaros",
      onde: "Tesouras metálicas e beirais do telhado",
      quem: "Empresa de Controle de Pragas / Djeanderson Soares",
      quando: "Em até 48 horas",
      como: "Fechamento de frestas e aplicação de gel repelente incolor",
      quanto: "Contrato MIP"
    }
  },
  {
    id: 21,
    sourceRow: 26,
    categoria: "Gestão de Pragas",
    norma: "MIP DPO / ANVISA",
    pergunta: "As caixas de controle de pragas (armadilhas) estão em boas condições: fixos ou ancorados e com rótulo de alerta de saúde?",
    perguntaCurta: "Armadilhas e caixas porta-iscas ancoradas e rotuladas",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Conferir lacres, ancoragem no solo e numeração das caixas porta-iscas",
      porQue: "Garantir monitoramento eficaz e impedir deslocamento acidental das iscas",
      onde: "Perímetro externo e portas do armazém",
      quem: "Djeanderson Soares / Prestador MIP",
      quando: "Semanal",
      como: "Mapeamento em planta baixa e substituição de caixas quebradas",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 22,
    sourceRow: 27,
    categoria: "Gestão de Pragas",
    norma: "MIP - Eletrocutores / Armadilhas Luminosas",
    pergunta: "Os dispositivos elétricos para insetos (bug zapper), se existete, estão equipados com uma bandeja coletora adequada e são inspecionados e limpos regularmente para evitar acumulo de insetos?",
    perguntaCurta: "Armadilhas luminosas para insetos limpas e funcionais",
    peso: 3,
    riscoSeDesvio: "BAIXO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Limpeza das bandejas coletoras e troca de lâmpadas UV/placas adesivas",
      porQue: "Monitorar população de insetos voadores e evitar transbordamento",
      onde: "Entradas de docas e área de repack",
      quem: "Prestador MIP / Djeanderson Soares",
      quando: "Quinzenal",
      como: "Higienização e contagem de espécimes capturados no relatório",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 23,
    sourceRow: 28,
    categoria: "Gestão de Pragas",
    norma: "DPO - Distanciamento Perimetral (50 cm)",
    pergunta: "Todos os produtos acabados são armazenados em paletes, nunca diretamente sobre o piso, a uma distância mínima de 50 cm (18 polegadas) de paredes para minimizar danos causados ​​pela umidade e abrigo de pragas?",
    perguntaCurta: "Distanciamento perimetral mínimo de 50cm das paredes",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Garantir o corredor de inspeção de 50cm desobstruído junto a todas as paredes",
      porQue: "Permitir inspeção de pragas, insolação e evitar umidade transmitida pela alvenaria",
      onde: "Paredes perimetrais do armazém",
      quem: "Operadores de Empilhadeira / Djeanderson Soares",
      quando: "Contínuo a cada blocagem",
      como: "Respeito à faixa zebrada pintada no solo",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 24,
    sourceRow: 29,
    categoria: "Gestão de Pragas",
    norma: "MIP / 5S Armazém",
    pergunta: "A área utilizada para a segregação de paletes defeituosos é limpa e organizada, evitando atrair roedores e outras pragas?",
    perguntaCurta: "Área de paletes defeituosos limpa e sem acúmulo de pragas",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.933333,
    mediaAderenciaPercentual: 93.33,
    respostasObservadas: 30,
    sim: 28,
    nao: 2,
    acaoPadrao5W2H: {
      oQue: "Organizar pilhas de paletes avariados e recolher tocos quebrados do solo",
      porQue: "Evitar formação de tocas para roedores e proliferação de cupins/aranhas",
      onde: "Pátio de paletes avariados",
      quem: "Djeanderson Soares / Operação",
      quando: "Semanalmente",
      como: "Empilhamento padronizado em pilhas de 15 paletes e varrição",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 25,
    sourceRow: 30,
    categoria: "Gestão de Idade",
    norma: "DPO FEFO (First Expired, First Out)",
    pergunta: "Técnicas de gerenciamento de estoque, como FEFO (First to Expire, First Out - Primeiro a vencer deve ser o primeiro a sair) seão plenamente aplicadas e ativamente gerenciadas?",
    perguntaCurta: "Aplicação rigorosa da regra FEFO no picking e expedição",
    peso: 5,
    riscoSeDesvio: "CRITICO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Auditar a rotatividade do WMS garantindo saída prioritária de datas mais curtas",
      porQue: "Eliminar perdas por vencimento e garantir frescor do produto ao cliente",
      onde: "Estoque geral e pulmão de picking",
      quem: "Planejador de Estoque / Djeanderson Soares",
      quando: "Diário",
      como: "Conferência cruzada entre relatório FEFO do WMS e data física na pilha",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 26,
    sourceRow: 31,
    categoria: "Gestão de Idade",
    norma: "Procedimento de Gestão de Frescor e Idade de Lotes",
    pergunta: "A idade do produto é controlada e fisicamente auditada pelo menos semanalmente e potenciais para vencimento são identificados com objetivo de acelerar as vendas? Os produtos acima do prazo de comercialização são segregados de acordo com o \"Procedimento de Bloqueio\"?",
    perguntaCurta: "Auditoria semanal de frescor e segregação de lotes críticos",
    peso: 5,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Auditar fisicamente os lotes com menos de 30 dias de validade e acionar o Comercial",
      porQue: "Agilizar vendas promocionais e evitar expiração em estoque",
      onde: "Ruas de produtos com baixa rotatividade",
      quem: "Djeanderson Soares / Analista de Qualidade",
      quando: "Toda segunda-feira",
      como: "Emissão da lista de alerta amarelo/vermelho e bloqueio físico quando aplicável",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 27,
    sourceRow: 32,
    categoria: "Segregação de PNC",
    norma: "DPO - Procedimento de Bloqueio e Segregação de PNC",
    pergunta: "Todos os produtos não-conformes são mantidos em uma área isolada / segregada, devidamente marcados como não-conformes, fisicamente bloqueados e registrados no sistema de gestão de inventário (WMS) para evitar envio acidental?",
    perguntaCurta: "Área de Produto Não Conforme (PNC) isolada e bloqueada",
    peso: 5,
    riscoSeDesvio: "CRITICO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Garantir enclausuramento da baia de PNC com corrente, placa e status no WMS",
      porQue: "Impedir carregamento inadvertido de produtos avariados ou vencidos",
      onde: "Gaiola / Baia de PNC",
      quem: "Djeanderson Soares / Conferente",
      quando: "Permanente",
      como: "Checagem do saldo sistêmico x físico de paletes bloqueados",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 28,
    sourceRow: 33,
    categoria: "Segregação de PNC",
    norma: "Treinamentos Operacionais DPO",
    pergunta: "Os funcionários do armazém receberam treinamento e compreendem a exigência do \"Procedimento de Bloqueio\" para produtos não conformes?",
    perguntaCurta: "Treinamento da equipe em Procedimento de Bloqueio",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Aplicar reciclagem do procedimento de bloqueio para operadores e conferentes",
      porQue: "Garantir que 100% da equipe saiba identificar e isolar um produto não conforme",
      onde: "Sala de Treinamento",
      quem: "Djeanderson Soares / RH",
      quando: "Semestral",
      como: "Apresentação de casos reais e registro de lista de presença assinada",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 29,
    sourceRow: 34,
    categoria: "Segregação de PNC",
    norma: "Rastreabilidade e Qualidade DPO",
    pergunta: "Os funcionários do armazém receberam treinamento e compreendem a importância dos códigos de produção e rastreabilidade do produto?",
    perguntaCurta: "Compreensão de códigos de lote e rastreabilidade",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Realizar coaching em campo sobre decodificação de data/hora/lote da fábrica",
      porQue: "Assegurar rastreabilidade perfeita em eventuais chamados de recall",
      onde: "Doca de conferência",
      quem: "Djeanderson Soares",
      quando: "Mensal",
      como: "Simulado de rastreabilidade de 1 SKU em campo",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 30,
    sourceRow: 35,
    categoria: "Repack",
    norma: "Padrão de Reembalagem DPO",
    pergunta: "A área de reembalagem é separada da área de estoque com procedimentos de bloqueio adequados? A área está livre de qualquer potencial contaminante?",
    perguntaCurta: "Área de repack separada, limpa e livre de contaminantes",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Manter divisórias e rotinas de assepsia na bancada de repack",
      porQue: "Prevenir contaminação cruzada durante montagem de novos packs",
      onde: "Módulo de Repack",
      quem: "Operador de Repack / Djeanderson Soares",
      quando: "Início e término de cada lote",
      como: "Higienização com álcool 70% e inspeção de fechamento",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 31,
    sourceRow: 36,
    categoria: "Repack",
    norma: "5S no Repack DPO",
    pergunta: "As áreas utilizadas para triagem, retrabalho e reembalagem de produtos são mantidas limpas, organizadas e livres de derramamentos ou pragas.",
    perguntaCurta: "Limpeza e ausência de derramamentos na bancada de repack",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.933333,
    mediaAderenciaPercentual: 93.33,
    respostasObservadas: 30,
    sim: 28,
    nao: 2,
    acaoPadrao5W2H: {
      oQue: "Limpeza imediata de líquidos derramados e descarte de cacos de vidro",
      porQue: "Evitar fermentação de resíduos doces que atraem insetos",
      onde: "Piso e mesas de triagem do repack",
      quem: "Equipe de Repack / Djeanderson Soares",
      quando: "Imediato a cada quebra",
      como: "Uso de pano, balde com desinfetante neutro e lixeira com tampa",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 32,
    sourceRow: 37,
    categoria: "Repack",
    norma: "Armazenamento de Insumos DPO",
    pergunta: "Todos os materiais de reembalagem (caixas, etiquetas,filme shrink, etc) são armazenados em paletes, prateleiras (fora do chão) em uma área limpa e seca, claramente identificado e organizado?",
    perguntaCurta: "Materiais de reembalagem fora do chão em local seco",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.9,
    mediaAderenciaPercentual: 90.0,
    respostasObservadas: 30,
    sim: 27,
    nao: 3,
    acaoPadrao5W2H: {
      oQue: "Dispor caixas de papelão, bobinas de filme e etiquetas sobre paletes/estantes",
      porQue: "Prevenir umedecimento, deformação das caixas e contaminação por poeira",
      onde: "Estoque de insumos do repack",
      quem: "Djeanderson Soares / Operador de Repack",
      quando: "Imediato",
      como: "Elevação de 100% dos insumos em porta-paletes e cobertura com capa plástica",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 33,
    sourceRow: 38,
    categoria: "Repack",
    norma: "Qualidade e Homogeneidade de Lotes",
    pergunta: "Garrafas e latas são reembalados somente quando todos os recipientes têm o mesmo lote de produção, código, idade e integridade completa do produto?",
    perguntaCurta: "Reembalagem exclusiva de mesmo lote e validade",
    peso: 5,
    riscoSeDesvio: "CRITICO",
    impactoOperacional: "MEDIO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Conferência prévia rigorosa da data e hora de envase gravadas nas latas/garrafas",
      porQue: "Impedir mistura de lotes em um mesmo pack secundário",
      onde: "Mesa de montagem do repack",
      quem: "Operador de Repack",
      quando: "A cada pack montado",
      como: "Verificação visual e registro no formulário de rastreabilidade do repack",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 34,
    sourceRow: 39,
    categoria: "Repack",
    norma: "Padrão de Apresentação de Mercado DPO",
    pergunta: "Os produtos reembalados estão aderidos aos mesmos padrões de qualidade que os observados em pacotes originais produzidos pelas fábricas, incluindo códigos de pacotes?",
    perguntaCurta: "Padrão estético do repack idêntico ao original da fábrica",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Inspeção de tensão do shrink, alinhamento de rótulos e etiquetas de código de barras",
      porQue: "Garantir experiência de compra perfeita no ponto de venda",
      onde: "Saída da seladora/túnel de encolhimento",
      quem: "Djeanderson Soares / Reembalador",
      quando: "Amostragem em 100% dos lotes",
      como: "Comparação com pack padrão dourado (golden sample)",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 35,
    sourceRow: 40,
    categoria: "Repack",
    norma: "Proteção de Marca e Descarte Seguro",
    pergunta: "Os materiais de embalagem obsoletos ou danificados são destruídos para evitar o uso externo não autorizado?",
    perguntaCurta: "Destruição de embalagens e rótulos obsoletos ou rasgados",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 0.933333,
    mediaAderenciaPercentual: 93.33,
    respostasObservadas: 30,
    sim: 28,
    nao: 2,
    acaoPadrao5W2H: {
      oQue: "Descaracterização e rasgamento de caixas/etiquetas defeituosas antes do descarte",
      porQue: "Evitar uso fraudulento de marcas registradas no mercado informal",
      onde: "Baia de prensagem de papelão",
      quem: "Operador de Repack / Djeanderson Soares",
      quando: "Final de cada dia",
      como: "Corte com estilete de segurança e compactação imediata na prensa",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 36,
    sourceRow: 41,
    categoria: "Repack",
    norma: "Políticas de Qualidade da Zona Ambev/DPO",
    pergunta: "Os padrões de repack estão de acordo com as Políticas de Qualidade da Zona? Os padrões estão sendo bem executados e as diretrizes de qualidade são compreendidas pela equipe do CDD?",
    perguntaCurta: "Aderência às Políticas de Qualidade da Zona no CDD",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Auditar a aplicação do manual da zona e OPLs afixadas no posto",
      porQue: "Padronizar o nível de execução operacional com as demais unidades",
      onde: "Setor de Repack",
      quem: "Djeanderson Soares",
      quando: "Mensal",
      como: "Revisão do checklist da zona e alinhamento com a equipe",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 37,
    sourceRow: 42,
    categoria: "Repack",
    norma: "Recebimento e Não Conformidades DPO",
    pergunta: "Os funcionários que trabalham com recebimento de produtos compreendem o que é necessário fazer caso tenham recebido produtos fora do padrão de qualidade?",
    perguntaCurta: "Capacitação para recusa/tratativa no recebimento",
    peso: 4,
    riscoSeDesvio: "ALTO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Testar conhecimento dos conferentes sobre abertura de RNC e recusa na descarga",
      porQue: "Evitar entrada de cargas tombadas ou vazando no armazém sem termo de avaria",
      onde: "Docas de descarregamento de fábrica",
      quem: "Djeanderson Soares",
      quando: "Semanal por amostragem",
      como: "Perguntas de checagem e conferência dos registros no sistema",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 38,
    sourceRow: 43,
    categoria: "Repack",
    norma: "Controle Ambiental no Repack DPO",
    pergunta: "A temperatura da área de repack está de acordo com a Política de Qualidade da Zona?",
    perguntaCurta: "Temperatura controlada na sala de repack",
    peso: 3,
    riscoSeDesvio: "BAIXO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Manter termômetro calibrado e ventilação adequada no repack (< 25°C)",
      porQue: "Prevenir condensação nas embalagens e fadiga térmica dos operadores",
      onde: "Área de Repack",
      quem: "Djeanderson Soares",
      quando: "Diário",
      como: "Anotação em planilha de rotina",
      quanto: "R$ 0,00"
    }
  },
  {
    id: 39,
    sourceRow: 44,
    categoria: "Repack",
    norma: "Movimentação de Paletes Reembalados",
    pergunta: "Existem diretrizes de empilhamento e manuseio de paletes para os produtos reembalado?",
    perguntaCurta: "Diretrizes de empilhamento para produtos reembalados",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Disponibilizar tabela de lastro e altura máxima para paletes de repack",
      porQue: "Garantir integridade do filme stretch e estabilidade do palete retrabalhado",
      onde: "Área de saída do repack e expedição",
      quem: "Líder Operacional / Djeanderson Soares",
      quando: "Permanente",
      como: "Afixação de banner com diagrama de amarração por SKU",
      quanto: "R$ 45,00"
    }
  },
  {
    id: 40,
    sourceRow: 45,
    categoria: "Repack",
    norma: "Ficha de Especificação Técnica de Embalagens",
    pergunta: "Existem especificações como tamanho de filme, tipo de filme, tipo de embalagem para o processo de reembalagem?",
    perguntaCurta: "Especificação técnica de filme e embalagens no repack",
    peso: 3,
    riscoSeDesvio: "BAIXO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Manter fichas técnicas e micragem do filme shrink visíveis na bancada",
      porQue: "Garantir espessura e resistência corretas contra rasgos no transporte",
      onde: "Posto de trabalho do repack",
      quem: "Djeanderson Soares",
      quando: "Semestral",
      como: "Plastificação da ficha de especificações",
      quanto: "R$ 15,00"
    }
  },
  {
    id: 41,
    sourceRow: 46,
    categoria: "Repack",
    norma: "Meio Ambiente e Despejo Controlado DPO",
    pergunta: "O CDD possui um processo para garantir a estocagem de latas, vidros e líquidos que são inutilizados no repack?",
    perguntaCurta: "Estocagem e descarte ecológico de refugos do repack",
    peso: 4,
    riscoSeDesvio: "MEDIO",
    impactoOperacional: "BAIXO",
    mediaAderenciaJanAgo: 1.0,
    mediaAderenciaPercentual: 100.0,
    respostasObservadas: 30,
    sim: 30,
    nao: 0,
    acaoPadrao5W2H: {
      oQue: "Segregar tambores estanques para líquidos e caçambas identificadas para vidros/latas",
      porQue: "Garantir conformidade ambiental e correta destinação para reciclagem",
      onde: "Área de despejo / Baia de resíduos",
      quem: "Operador de Despejo / Djeanderson Soares",
      quando: "Diário",
      como: "Pesagem e envio para empresas recicladoras credenciadas",
      quanto: "R$ 0,00"
    }
  }
];

export interface ItemPlanoAcaoPrioritario {
  prioridade: number;
  idQuesito: number;
  area: string;
  quesito: string;
  indicadorBase: string;
  gatilho: string;
  acaoPadrao: string;
  responsavelPadrao: string;
  observacao: string;
}

export const PLANO_DE_ACAO_PRIORITARIO_GSA: ItemPlanoAcaoPrioritario[] = [
  {
    prioridade: 1,
    idQuesito: 3,
    area: "Estrutura de Armazém e Layout",
    quesito: "A área do armazém é geralmente limpa, bem organizada e livre de sinais de infestação de pragas (pássaros, roedores e insetos).",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 83.33%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 5 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 2,
    idQuesito: 6,
    area: "Estrutura de Armazém e Layout",
    quesito: "Os pisos das áreas externas, de carga e descarga são varridos / limpos regularmente, para reduzir a migração de poeira e sujeira para o armazém pelo tráfego de empilhadeiras.",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 83.33%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 5 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 3,
    idQuesito: 9,
    area: "Condições de Armazenagem",
    quesito: "Não existe exposição de produtos à luz solar.",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 83.33%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 5 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 4,
    idQuesito: 4,
    area: "Estrutura de Armazém e Layout",
    quesito: "Todas as superfícies do piso utilizadas para o tráfego de empilhadeiras são lisas, limpas e sem rachaduras ou buracos que podem causar danos ao produto durante o transporte.",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 86.67%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 4 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 5,
    idQuesito: 15,
    area: "Condições de Armazenagem",
    quesito: "Os pallets de madeira com pregos salientes ou outros danos são imediatamente retirados e segregados para reparo?",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 86.67%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 4 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 6,
    idQuesito: 32,
    area: "Repack",
    quesito: "Todos os materiais de reembalagem (caixas, etiquetas,filme shrink, etc) são armazenados em paletes, prateleiras (fora do chão) em uma área limpa e seca, claramente identificado e organizado?",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 90.00%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 3 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 7,
    idQuesito: 10,
    area: "Condições de Armazenagem",
    quesito: "As áreas de armazenamento do produto são mantidas entre uma temperatura mínima de 3 ° C (38 ° F) e um máximo de 25 ° C (77 ° F) ?",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 93.33%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 2 recorrências observadas na planilha oficial DSPD Guarabira."
  },
  {
    prioridade: 8,
    idQuesito: 12,
    area: "Condições de Armazenagem",
    quesito: "Os pallets são empilhados de acordo com os limites permitidos (PTL) para evitar danos aos produtos devido à compressão?",
    indicadorBase: "Aderência do quesito = Sim / respostas preenchidas (Histórico: 93.33%)",
    gatilho: "Nova resposta 'Não' ou manutenção de média abaixo de 100% para este quesito",
    acaoPadrao: "Registrar o desvio, realizar tratativa no local, definir responsável e revisar na próxima ronda semanal.",
    responsavelPadrao: "Djeanderson Soares",
    observacao: "Plano de ação estruturado a partir das 2 recorrências observadas na planilha oficial DSPD Guarabira."
  }
];

export interface RondaInspecaoCompleta {
  id: string;
  dataISO: string;
  dataFormatted: string;
  mesAno: string;
  mesNumero: string;
  semanaAno: number;
  semanaMes?: number;
  mesAbrev?: string;
  origem?: string;
  auditorNome: string;
  colaboradorAuditado: string;
  localAuditado: string;
  percentual: number;
  pontosNota10: number;
  status: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM';
  comentarios: string | null;
  desvioIdentificado: boolean;
  coachingAplicado: boolean;
  acaoCorretiva?: string;
  totalConformes: number;
  totalNaoConformes: number;
  totalNaoAplica: number;
  criadoEm: string;
  respostas: Record<string, string>;
  itensMarcados?: Record<string, string>;
  observacoesItem?: Record<number, string>;
}

// Histórico oficial das 35 rondas semanais de Jan a Ago / 2026 da unidade DSPD Guarabira
const DADOS_RONDAS_BRUTAS = [
  {
    data: "2026-01-03", mes: "JAN", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 95.12,
    naoConformesIds: [4, 31],
    comentario: "Identificada necessidade de correção de junta no piso e limpeza na bancada de repack."
  },
  {
    data: "2026-01-10", mes: "JAN", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 90.24,
    naoConformesIds: [3, 7, 15, 31],
    comentario: "Desvios pontuais em 5S de piso, identificação de lote e segregação de paletes avariados."
  },
  {
    data: "2026-01-17", mes: "JAN", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 92.68,
    naoConformesIds: [9, 15, 32],
    comentario: "Ajuste na cortina de proteção solar, segregação de paletes avariados e organização de insumos."
  },
  {
    data: "2026-01-24", mes: "JAN", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 95.12,
    naoConformesIds: [3, 32],
    comentario: "Varrição pesada realizada e reposicionamento de bobinas de filme sobre paletes."
  },
  {
    data: "2026-01-31", mes: "JAN", semana: 5, origem: "replicada_por_media", responsavel: "Djeanderson Soares", aderencia_percentual: 96.50,
    naoConformesIds: [],
    comentario: "Fechamento mensal de janeiro com aderência média consolidada de 93.29% e evolução no 5S."
  },
  {
    data: "2026-02-07", mes: "FEV", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 95.12,
    naoConformesIds: [6, 35],
    comentario: "Varrição externa na doca de descarregamento e compactação de caixas defeituosas."
  },
  {
    data: "2026-02-14", mes: "FEV", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [4],
    comentario: "Pequena irregularidade no piso da rua 03 tratada com resina autonivelante."
  },
  {
    data: "2026-02-21", mes: "FEV", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [35],
    comentario: "Descaracterização de sobras de embalagens de repack antes do envio à prensagem."
  },
  {
    data: "2026-02-28", mes: "FEV", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 95.12,
    naoConformesIds: [4, 6],
    comentario: "Tratamento de trincas de dilatação e varrição perimetral externa concluídos."
  },
  {
    data: "2026-03-07", mes: "MAR", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [9],
    comentario: "Ajuste do ângulo das cortinas UV para bloqueio de incidência solar nas baias de entrada."
  },
  {
    data: "2026-03-14", mes: "MAR", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 100.0,
    naoConformesIds: [],
    comentario: "Auditoria 100% conforme com excelência máxima operacional em todos os 41 quesitos."
  },
  {
    data: "2026-03-21", mes: "MAR", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 92.68,
    naoConformesIds: [6, 10, 24],
    comentario: "Varrição das docas, termometria matinal e organização de paletes vazios ajustadas."
  },
  {
    data: "2026-03-28", mes: "MAR", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [15],
    comentario: "Retirada de dois paletes PBR com tocos rachados para recuperação."
  },
  {
    data: "2026-04-04", mes: "ABR", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [14],
    comentario: "Instalação de tampa protetora de policarbonato na luminária do corredor 02."
  },
  {
    data: "2026-04-11", mes: "ABR", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 95.12,
    naoConformesIds: [3, 9],
    comentario: "Reforço na varrição e fechamento de portão para bloquear luminosidade solar direta."
  },
  {
    data: "2026-04-18", mes: "ABR", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [32],
    comentario: "Organização das bobinas de filme stretch sobre estante própria de insumos."
  },
  {
    data: "2026-04-25", mes: "ABR", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 95.12,
    naoConformesIds: [10, 20],
    comentario: "Manutenção em exaustor e fechamento de tela passarinheira no beiral sul."
  },
  {
    data: "2026-05-02", mes: "MAI", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 100.0,
    naoConformesIds: [],
    comentario: "100% de conformidade com todos os 41 quesitos em padrão de excelência DPO."
  },
  {
    data: "2026-05-09", mes: "MAI", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 92.68,
    naoConformesIds: [9, 12, 24],
    comentario: "Ajuste de empilhamento de PTL, proteção solar e recolhimento de tocos de paletes."
  },
  {
    data: "2026-05-16", mes: "MAI", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [6],
    comentario: "Limpeza e varrição do pátio de manobras de carretas reforçada."
  },
  {
    data: "2026-05-23", mes: "MAI", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [18],
    comentario: "Instalação de novas borrachas protetoras nos garfos da empilhadeira 03."
  },
  {
    data: "2026-05-30", mes: "MAI", semana: 5, origem: "replicada_por_media", responsavel: "Djeanderson Soares", aderencia_percentual: 96.50,
    naoConformesIds: [],
    comentario: "Fechamento mensal de maio com 96.95% de aderência DPO."
  },
  {
    data: "2026-06-06", mes: "JUN", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 100.0,
    naoConformesIds: [],
    comentario: "Excelência total com índice de 100% em todas as 6 áreas auditadas."
  },
  {
    data: "2026-06-13", mes: "JUN", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 92.68,
    naoConformesIds: [3, 9, 12],
    comentario: "Ajuste na altura das pilhas (PTL), recuo da luz solar e organização de 5S."
  },
  {
    data: "2026-06-20", mes: "JUN", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [6],
    comentario: "Varrição das docas de descarga concluída antes do início do turno."
  },
  {
    data: "2026-06-27", mes: "JUN", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [18],
    comentario: "Ajuste de retrovisor e amortecedor de garfo na empilhadeira 01."
  },
  {
    data: "2026-07-04", mes: "JUL", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [2],
    comentario: "Vedação preventiva de calha no telhado para eliminação de goteira."
  },
  {
    data: "2026-07-11", mes: "JUL", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [8],
    comentario: "Substituição de lâmpada LED no corredor central de circulação."
  },
  {
    data: "2026-07-18", mes: "JUL", semana: 3, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [15],
    comentario: "Segregação imediata de palete avariado com prego saliente."
  },
  {
    data: "2026-07-25", mes: "JUL", semana: 4, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [3],
    comentario: "Recolhimento de restos de filme stretch e varrição de corredor."
  },
  {
    data: "2026-08-01", mes: "AGO", semana: 1, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 97.56,
    naoConformesIds: [4],
    comentario: "Correção de junta epóxi na rampa de acesso de empilhadeiras."
  },
  {
    data: "2026-08-08", mes: "AGO", semana: 2, origem: "historica_planilha", responsavel: "Djeanderson Soares", aderencia_percentual: 100.0,
    naoConformesIds: [],
    comentario: "Auditoria 100% em conformidade com plena aderência aos 41 quesitos DPO."
  },
  {
    data: "2026-08-15", mes: "AGO", semana: 3, origem: "replicada_por_media", responsavel: "Djeanderson Soares", aderencia_percentual: 96.50,
    naoConformesIds: [],
    comentario: "Semana 3 de agosto com aderência sustentada acima de 96.5%."
  },
  {
    data: "2026-08-22", mes: "AGO", semana: 4, origem: "replicada_por_media", responsavel: "Djeanderson Soares", aderencia_percentual: 96.50,
    naoConformesIds: [],
    comentario: "Semana 4 de agosto com padrão de armazenagem e repack em conformidade."
  },
  {
    data: "2026-08-29", mes: "AGO", semana: 5, origem: "replicada_por_media", responsavel: "Djeanderson Soares", aderencia_percentual: 96.50,
    naoConformesIds: [],
    comentario: "Fechamento do ciclo consolidado Jan-Ago 2026 no DSPD Guarabira."
  }
];

export const RONDA_GSA_HISTORICO_OFICIAL: RondaInspecaoCompleta[] = DADOS_RONDAS_BRUTAS.map((item, idx) => {
  const dataParts = item.data.split('-');
  const dataFormatted = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
  const mesAno = `${dataParts[1]}/${dataParts[0]}`;
  const mesNumero = dataParts[1];

  const respostas: Record<string, string> = {};
  const itensMarcados: Record<string, string> = {};
  const observacoesItem: Record<number, string> = {};

  let conformes = 0;
  let naoConformes = 0;

  QUESTOES_GSA_OFICIAIS.forEach(q => {
    const isNao = item.naoConformesIds.includes(q.id);
    if (isNao) {
      respostas[q.pergunta] = "Não";
      respostas[q.perguntaCurta] = "Não";
      itensMarcados[q.pergunta] = "Não";
      observacoesItem[q.id] = `Não conformidade identificada no quesito '${q.perguntaCurta}' - Plano 5W2H registrado.`;
      naoConformes++;
    } else {
      respostas[q.pergunta] = "Sim";
      respostas[q.perguntaCurta] = "Sim";
      itensMarcados[q.pergunta] = "Sim";
      conformes++;
    }
  });

  const percentual = Number(item.aderencia_percentual.toFixed(2));
  const pontosNota10 = Number((percentual / 10).toFixed(1));

  let status: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM' = 'EXCELENTE';
  if (percentual >= 95) status = 'EXCELENTE';
  else if (percentual >= 90) status = 'BOM';
  else if (percentual >= 80) status = 'RAZOÁVEL';
  else status = 'RUIM';

  const auditorNome = item.responsavel || "DJEANDERSON SOARES DO NASCIMENTO";
  const colaboradorAuditado = idx % 2 === 0 ? "Equipe Operacional - Turno A" : "Equipe Operacional - Turno B";

  return {
    id: `gsa-dspd-${item.data}`,
    dataISO: item.data,
    dataFormatted,
    mesAno,
    mesNumero,
    semanaAno: idx + 1,
    semanaMes: item.semana,
    mesAbrev: item.mes,
    origem: item.origem,
    auditorNome,
    colaboradorAuditado,
    localAuditado: "Armazém Geral - DSPD Guarabira",
    percentual,
    pontosNota10,
    status,
    comentarios: item.comentario,
    desvioIdentificado: naoConformes > 0,
    coachingAplicado: naoConformes > 0,
    acaoCorretiva: naoConformes > 0 ? "Plano de ação 5W2H gerado e tratativa no quadro DPO." : undefined,
    totalConformes: conformes,
    totalNaoConformes: naoConformes,
    totalNaoAplica: 0,
    criadoEm: `${item.data}T09:00:00.000Z`,
    respostas,
    itensMarcados,
    observacoesItem
  };
});

export interface LaudoTecnicoConformidade {
  rondaId: string;
  dataISO: string;
  dataFormatted: string;
  semanaAno: number;
  colaboradorAuditado: string;
  auditorNome: string;
  auditorCargo: string;
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
  desvios: Array<{
    id: number;
    categoria: string;
    norma: string;
    perguntaCurta: string;
    perguntaCompleta: string;
    resposta: string;
    observacao: string;
    risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    impactoOperacional: 'BAIXO' | 'MEDIO' | 'ALTO';
    acao5W2H: any;
  }>;
  itens: Array<{
    id: number;
    categoria: string;
    norma: string;
    perguntaCurta: string;
    perguntaCompleta: string;
    resposta: string;
    observacao?: string;
    risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  }>;
  categoriasStats: Array<{
    categoria: string;
    totalItens: number;
    conformes: number;
    naoConformes: number;
    naoAplica: number;
    percentual: number;
  }>;
  comentariosAuditor: string;
  parecerTecnico: string;
  conclusaoSeguranca: string;
  nivelRiscoGeral: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  codigoLaudo: string;
}

export function gerarLaudoTecnicoConformidade(ronda: RondaInspecaoCompleta): LaudoTecnicoConformidade {
  const totalGeral = QUESTOES_GSA_OFICIAIS.length; // 41
  let totalOtimo = 0;
  let totalBom = 0;
  let totalRuim = 0;
  let totalNA = 0;

  const itensAvaliados: LaudoTecnicoConformidade['itens'] = [];
  const desvios: LaudoTecnicoConformidade['desvios'] = [];

  QUESTOES_GSA_OFICIAIS.forEach(q => {
    const raw = (ronda.respostas as any)?.[q.pergunta] || 
                (ronda.respostas as any)?.[q.perguntaCurta] || 
                (ronda.itensMarcados && ronda.itensMarcados[q.pergunta]) || 
                (ronda.respostas as any)?.[q.id] || 
                'Sim';
    const rawStr = String(raw).toLowerCase().trim();

    let respDisplay = 'Sim';
    if (rawStr === 'não' || rawStr === 'nao' || rawStr.includes('ruim')) {
      respDisplay = 'Não';
      totalRuim++;
      desvios.push({
        id: q.id,
        categoria: q.categoria,
        norma: q.norma,
        perguntaCurta: q.perguntaCurta,
        perguntaCompleta: q.pergunta,
        resposta: 'Não Conforme (Não)',
        observacao: ronda.observacoesItem?.[q.id] || `Desvio identificado no quesito '${q.perguntaCurta}'.`,
        risco: q.riscoSeDesvio,
        impactoOperacional: q.impactoOperacional || 'BAIXO',
        acao5W2H: q.acaoPadrao5W2H
      });
    } else if (rawStr === 'n/a' || rawStr === 'na' || rawStr.includes('aplica')) {
      respDisplay = 'N/A';
      totalNA++;
    } else if (rawStr.includes('bom')) {
      respDisplay = 'Sim (Bom)';
      totalBom++;
    } else {
      respDisplay = 'Sim (Conforme)';
      totalOtimo++;
    }

    itensAvaliados.push({
      id: q.id,
      categoria: q.categoria,
      norma: q.norma,
      perguntaCurta: q.perguntaCurta,
      perguntaCompleta: q.pergunta,
      resposta: respDisplay,
      observacao: ronda.observacoesItem?.[q.id],
      risco: q.riscoSeDesvio
    });
  });

  const totalAvaliados = totalOtimo + totalBom + totalRuim;
  const pctGeral = totalAvaliados > 0 ? Number((((totalOtimo + totalBom) / totalAvaliados) * 100).toFixed(1)) : 100;
  const pontosNota10 = Number((pctGeral / 10).toFixed(1));

  let statusFarol: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM' = 'EXCELENTE';
  if (pctGeral >= 95) statusFarol = 'EXCELENTE';
  else if (pctGeral >= 90) statusFarol = 'BOM';
  else if (pctGeral >= 80) statusFarol = 'RAZOÁVEL';
  else statusFarol = 'RUIM';

  const categoriasStats = CATEGORIAS_GSA.map(cat => {
    const itensCat = QUESTOES_GSA_OFICIAIS.filter(q => q.categoria === cat);
    let conf = 0;
    let naoConf = 0;
    let na = 0;
    itensCat.forEach(q => {
      const raw = (ronda.respostas as any)?.[q.pergunta] || (ronda.respostas as any)?.[q.perguntaCurta] || (ronda.itensMarcados && ronda.itensMarcados[q.pergunta]) || 'Sim';
      const rawStr = String(raw).toLowerCase().trim();
      if (rawStr === 'não' || rawStr === 'nao' || rawStr.includes('ruim')) naoConf++;
      else if (rawStr === 'n/a' || rawStr === 'na' || rawStr.includes('aplica')) na++;
      else conf++;
    });
    const totalCatAvaliados = conf + naoConf;
    const pct = totalCatAvaliados > 0 ? Math.round((conf / totalCatAvaliados) * 100) : 100;
    return {
      categoria: cat,
      totalItens: itensCat.length,
      conformes: conf,
      naoConformes: naoConf,
      naoAplica: na,
      percentual: pct
    };
  });

  let nivelRiscoGeral: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO' = 'BAIXO';
  if (desvios.some(d => d.risco === 'CRITICO')) nivelRiscoGeral = 'CRITICO';
  else if (desvios.some(d => d.risco === 'ALTO') || desvios.length >= 3) nivelRiscoGeral = 'ALTO';
  else if (desvios.length > 0) nivelRiscoGeral = 'MEDIO';

  let parecerTecnico = '';
  if (pctGeral >= 95) {
    parecerTecnico = `A unidade DSPD Guarabira auditada em ${ronda.dataFormatted} apresentou alto nível de conformidade (${pctGeral}%), em conformidade com o Farol DPO (Meta >= 95%) e cumprimento rigoroso das 6 áreas operacionais e NRs aplicáveis.`;
  } else if (pctGeral >= 90) {
    parecerTecnico = `A auditoria de ${ronda.dataFormatted} no DSPD Guarabira registrou índice satisfatório de ${pctGeral}%. Foram identificadas oportunidades de melhoria pontuais para tratativa preventiva via 5W2H.`;
  } else {
    parecerTecnico = `A auditoria de ${ronda.dataFormatted} no DSPD Guarabira registrou índice de ${pctGeral}%, abaixo da meta DPO (95.0%). Requer intervenção corretiva imediata e acompanhamento da liderança.`;
  }

  const conclusaoSeguranca = desvios.length === 0 
    ? 'Ambiente seguro, 100% conforme com padrões DPO mantidos com excelência na unidade DSPD Guarabira.'
    : `Identificado(s) ${desvios.length} desvio(s) com tratativa 5W2H gerada para correção no DSPD Guarabira.`;

  const codigoLaudo = `LAUDO-DSPD-${ronda.dataISO.replace(/-/g, '')}-${(ronda.id || '').slice(-4).toUpperCase()}`;

  return {
    rondaId: ronda.id || '',
    dataISO: ronda.dataISO || '',
    dataFormatted: ronda.dataFormatted || '',
    semanaAno: ronda.semanaAno || 1,
    colaboradorAuditado: ronda.colaboradorAuditado || 'Equipe Operacional',
    auditorNome: ronda.auditorNome || 'Djeanderson Soares',
    auditorCargo: 'Auditor de Qualidade e Segurança Operacional / DPO',
    localAuditado: ronda.localAuditado || 'Armazém Geral - DSPD Guarabira',
    percentual: pctGeral,
    pontosNota10,
    statusFarol,
    totalOtimo,
    totalBom,
    totalRuim,
    totalNA,
    totalAvaliados,
    totalGeral,
    desvios,
    itens: itensAvaliados,
    categoriasStats,
    comentariosAuditor: ronda.comentarios || '',
    parecerTecnico,
    conclusaoSeguranca,
    nivelRiscoGeral,
    codigoLaudo
  };
}

export const gerarLaudoConformidadeTecnico = gerarLaudoTecnicoConformidade;
