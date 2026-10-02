/**
 * REPOSITORIES REGISTRY
 * Centraliza os repositórios fortemente tipados para todas as entidades do sistema.
 */

import { BaseRepository } from './BaseRepository';
import {
  RepackRow,
  RepackValidadeRow,
  DespejoRow,
  ArmazemRow,
  QuebraRow,
  ValidadeRow,
  BlitzRefugoRow,
  Tarefa,
  RepackActionPlan,
  RepackA3Board,
  ColaboradorMaster,
  ProdutoMaster,
  AcessoColaborador,
  TmrDemand,
  FefoRelocationDemand,
  ArmazemTemperaturaLog
} from '../../types';
import { CustomKpiTree } from '../../types/treeKpiTypes';

// Repositórios Operacionais
export const RepackRepository = new BaseRepository<RepackRow>('repack');
export const RepackValidadesRepository = new BaseRepository<RepackValidadeRow>('repack_validades');
export const DespejoRepository = new BaseRepository<DespejoRow>('despejo');
export const QuebrasRepository = new BaseRepository<QuebraRow>('quebras');
export const ArmazemRepository = new BaseRepository<ArmazemRow>('armazem');
export const ValidadesRepository = new BaseRepository<ValidadeRow>('validades');
export const ValidadesConfigRepository = new BaseRepository<any>('validades_config');
export const ValidadesHistoricoRepository = new BaseRepository<any>('validades_historico_exclusoes');
export const FefoCloudAdjustmentsRepository = new BaseRepository<any>('fefo_cloud_adjustments');
export const RefugoRepository = new BaseRepository<BlitzRefugoRow>('blitz_refugo');
export const TarefasRepository = new BaseRepository<Tarefa>('tarefas');
export const PlanosAcaoRepository = new BaseRepository<RepackActionPlan>('planos_acao');
export const A3BoardRepository = new BaseRepository<RepackA3Board>('a3_boards');
export const KpiTreesRepository = new BaseRepository<CustomKpiTree>('kpi_trees');

// Repositórios de Cadastros e Acessos
export const ColaboradoresRepository = new BaseRepository<ColaboradorMaster>('colaboradores');
export const ProdutosRepository = new BaseRepository<ProdutoMaster>('produtos');
export const AcessosRepository = new BaseRepository<AcessoColaborador>('acessos_colaboradores');

// Repositórios de Demandas e Logística
export const TmrDemandsRepository = new BaseRepository<TmrDemand>('tmr_demands');
export const FefoDemandsRepository = new BaseRepository<FefoRelocationDemand>('fefo_demands');
export const TemperaturaLogsRepository = new BaseRepository<ArmazemTemperaturaLog>('temperatura_logs');
export const EfcEfdVehiclesRepository = new BaseRepository<any>('efc_efd_vehicles');
export const AferimentoRotaDbRepository = new BaseRepository<any>('aferimento_rota_db');

// Repositórios DPO e Qualidade
export const DpoAuditoriasRepository = new BaseRepository<any>('dpo_auditorias');
export const RondaGsaRepository = new BaseRepository<any>('ronda_gsa');
export const DiarioBordoRepository = new BaseRepository<any>('diario_bordo');
export const AbastecimentoRepository = new BaseRepository<any>('abastecimento_diario');
export const JornadasRepository = new BaseRepository<any>('jornadas_colaboradores');
export const FaturamentoRepository = new BaseRepository<any>('faturamento_diario');
export const DemandasGeraisRepository = new BaseRepository<any>('demandas');
export const Workstation5SRepository = new BaseRepository<any>('workstation_5s');
export const AcoesGeraisRepository = new BaseRepository<any>('acoes');

/**
 * Função utilitária para obter um repositório genérico por nome da coleção
 */
export function getRepository<T extends { id?: string | number; _docId?: string | number }>(collectionName: string): BaseRepository<T> {
  return new BaseRepository<T>(collectionName);
}

export * from './BaseRepository';
