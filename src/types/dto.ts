export type DtoOperacaoId =
  | 'repack'
  | 'despejo'
  | 'quebras'
  | 'efc'
  | 'efd'
  | 'montagem'
  | 'validades'
  | 'blitz-puxada'
  | 'blitz-refugo';

export interface DtoItemChecklist {
  id: string;
  numero: string;
  pergunta: string;
  descricaoTecnica: string;
  categoria: 'Segurança & EPI' | 'Procedimento & Padrão' | 'Qualidade & FEFO' | 'Produtividade & Tempo' | 'Registro & 5S';
  peso?: number;
}

export interface DtoItemResposta {
  itemId: string;
  conforme: boolean | null; // true = SIM, false = NAO, null = nao preenchido
  observacao?: string;
  fotoUrl?: string;
}

export interface DtoPlanoAcao {
  oQueFazer: string;
  responsavel: string;
  prazo: string;
  comoFazer: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
}

export interface DtoRegistro {
  id: string;
  empresaId?: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  dataHoraISO: string;
  operacaoId: DtoOperacaoId;
  operacaoNome: string;
  motivoDto: 'meta_nao_batida' | 'aumento_perdas' | 'auditoria_rotina' | 'reciclagem_treinamento' | 'solicitacao_gestao';
  tipoDtoCategoria?: 'dto_padrao' | 'dto_indicador_metas'; // 'dto_padrao' = DTO Padrão tudo batendo 100% | 'dto_indicador_metas' = DTO Indicador de Metas de Pacote
  tipoPacote?: 'Lata' | 'PET' | 'Garrafa 600ml' | 'Long Neck' | 'Litrinho' | 'Geral';
  metaBatida?: boolean; // true = 90% dos casos batendo tudo | false = 10% com desvio/não batendo
  origemMovimentacao?: 'Armazém (Movimentação Interna)'; // Exclusivo movimentação no armazém
  metaEsperada?: string;
  resultadoRealizado?: string;
  indicadorOfensor?: string;
  avaliadorNome: string;
  avaliadorCargo?: string;
  colaboradorNome: string;
  colaboradorMatricula?: string;
  turno: '1º Turno' | '2º Turno' | '3º Turno' | 'Comercial' | 'Geral';
  linhaOuBox?: string;
  respostas: Record<string, DtoItemResposta>;
  totalItens: number;
  itensConformes: number;
  itensNaoConformes: number;
  percentualConformidade: number; // 0 a 100
  classificacao: 'conforme' | 'atencao' | 'critico';
  observacaoGeral?: string;
  planoAcao?: DtoPlanoAcao;
  planosAcao?: any[];
  criadoEm: string;
}

export interface DtoOperacaoConfig {
  id: DtoOperacaoId;
  nome: string;
  tituloCurto: string;
  sigla: string;
  icone: string;
  cor: string;
  badge: string;
  descricao: string;
  focoPrincipal: string;
  itens: DtoItemChecklist[];
}
