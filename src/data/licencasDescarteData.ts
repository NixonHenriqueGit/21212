import { LucideIcon } from 'lucide-react';

export interface ReciboDescarteItem {
  descricao: string;
  quantidade: number;
  unidade?: string;
  valorUnitario: number;
  total: number;
}

export interface ReciboDescarte {
  id: string;
  numero: string;
  data: string; // YYYY-MM-DD
  dataFormatted: string;
  empresaCompradora: string;
  cnpjCompradora: string;
  responsavelRecebimento: string;
  tipoOperacao: 'COMPRA DE MATERIAIS RECICLÁVEIS' | 'DESTINAÇÃO FINAL HOMOLOGADA' | 'DESPEJO AMBIENTAL';
  itens: ReciboDescarteItem[];
  valorTotal: number;
  status: 'HOMOLOGADO' | 'VALIDADO_DPO' | 'EM_AUDITORIA';
  observacoes: string;
}

export interface LicencaOperacional {
  id: string;
  numeroLicenca: string;
  orgaoEmissor: string; // Ex: SUDEMA - Governo da Paraíba
  processoNumero: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  municipio: string;
  uf: string;
  cep: string;
  coordenadas: string;
  atividadeLicenciada: string;
  areaConstruida: string;
  dataEmissao: string;
  dataValidade: string;
  diasValidade: number;
  seloAutenticidade: string;
  status: 'VIGENTE' | 'EM_RENOVACAO' | 'EXPIRADA';
  condicionantes: string[];
}

export const LICENCA_SUDEMA_OFICIAL: LicencaOperacional = {
  id: 'licenca-sudema-599-2020',
  numeroLicenca: 'N.º 599/2020',
  orgaoEmissor: 'SUDEMA - Superintendência de Administração do Meio Ambiente (Governo do Estado da Paraíba)',
  processoNumero: 'SUDEMA N.º 2019-007896/TEC/LO-0049',
  razaoSocial: 'PEDRO CIDELINO LEITE (PEDRO CIDELINO RECICLÁVEIS)',
  cnpj: '06.167.801/0001-22',
  endereco: 'RUA DUQUE DE CAXIAS CENTRO',
  municipio: 'PATOS',
  uf: 'PB',
  cep: '58700-200',
  coordenadas: 'Latitude: 07° 01\' 39,82" | Longitude: 37° 16\' 54,39"',
  atividadeLicenciada: 'Comércio atacadista de resíduos e sucatas metálicas, com área construída de 162,00 m².',
  areaConstruida: '162,00 m²',
  dataEmissao: '2020-04-17',
  dataValidade: '2028-04-17', // Válida por ciclo operacional homologado
  diasValidade: 730,
  seloAutenticidade: '045.049',
  status: 'VIGENTE',
  condicionantes: [
    'Esta Licença é válida pelo período estabelecido, conforme processo SUDEMA N.º 2019-007896/TEC/LO-0049, observando as condições deste documento e seus anexos.',
    'Diz respeito à análise de viabilidade ambiental de competência da SUDEMA, devendo o empreendedor obter Anuência e/ou Autorização de outras instâncias cabíveis.',
    'A cópia deste documento só terá validade com autenticação em cartório ou selo digital de autenticidade oficial.',
    'Fixar placa (dimensões 80x60 cm) com identificação da atividade licenciada, conforme modelo disponível no site da SUDEMA www.sudema.pb.gov.br.',
    'Todas as licenças relativas aos demais órgãos públicos fiscalizadores deverão ser mantidas durante o período de validade.'
  ]
};

export const RECIBOS_DESCARTE_OFICIAIS: ReciboDescarte[] = [
  {
    id: 'recibo-cidelino-2026-01-15',
    numero: 'REC-2026-01/14',
    data: '2026-01-15',
    dataFormatted: '15/01/2026',
    empresaCompradora: 'Pedro Cidelino Recicláveis',
    cnpjCompradora: '06.167.801/0001-22',
    responsavelRecebimento: 'Jefferson Cidelino de Souza',
    tipoOperacao: 'COMPRA DE MATERIAIS RECICLÁVEIS',
    status: 'HOMOLOGADO',
    observacoes: 'Destinação ambiental e reciclagem de materiais descartados no armazém DSPD Guarabira. Lote 01/2026.',
    itens: [
      { descricao: 'PALETES', quantidade: 18, valorUnitario: 3.00, total: 54.00 },
      { descricao: 'CAIXA', quantidade: 42, valorUnitario: 2.00, total: 84.00 },
      { descricao: 'PET', quantidade: 310, valorUnitario: 0.80, total: 248.00 },
      { descricao: 'LATINHA', quantidade: 54, valorUnitario: 7.00, total: 378.00 },
      { descricao: 'FILME/MELISSA', quantidade: 365, valorUnitario: 2.20, total: 803.00 },
      { descricao: 'PAPELAO/CANULA', quantidade: 2050, valorUnitario: 0.25, total: 512.50 }
    ],
    valorTotal: 2079.50
  },
  {
    id: 'recibo-cidelino-2026-01-30',
    numero: 'REC-2026-02/14',
    data: '2026-01-30',
    dataFormatted: '30/01/2026',
    empresaCompradora: 'Pedro Cidelino Recicláveis',
    cnpjCompradora: '06.167.801/0001-22',
    responsavelRecebimento: 'Jefferson Cidelino de Souza',
    tipoOperacao: 'COMPRA DE MATERIAIS RECICLÁVEIS',
    status: 'HOMOLOGADO',
    observacoes: 'Destinação ambiental e reciclagem de materiais descartados no armazém DSPD Guarabira. Lote 02/2026.',
    itens: [
      { descricao: 'PALETES', quantidade: 22, valorUnitario: 3.00, total: 66.00 },
      { descricao: 'CAIXA', quantidade: 36, valorUnitario: 2.00, total: 72.00 },
      { descricao: 'PET', quantidade: 284, valorUnitario: 0.80, total: 227.20 },
      { descricao: 'LATINHA', quantidade: 61, valorUnitario: 7.00, total: 427.00 },
      { descricao: 'FILME/MELISSA', quantidade: 392, valorUnitario: 2.20, total: 862.40 },
      { descricao: 'PAPELAO/CANULA', quantidade: 2190, valorUnitario: 0.25, total: 547.50 }
    ],
    valorTotal: 2202.10
  }
];
