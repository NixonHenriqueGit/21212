/**
 * DATABASE - Fachada Principal da Camada Database
 * 
 * Unifica os módulos:
 * - databaseRouter: Roteamento inteligente L1/L2 Cache -> JSON -> Firestore
 * - jsonDatabase: Armazenamento e fallback local JSON
 * - firestoreDatabase: Comunicação nativa com Firestore
 * - cacheDatabase: Gestão de cache com métricas e TTL
 * - syncDatabase: Sincronização incremental e publicação de dados
 * - databaseTypes: Tipos e interfaces de domínio
 */

export * from './databaseTypes';
export * from './cacheDatabase';
export * from './jsonDatabase';
export * from './firestoreDatabase';
export * from './syncDatabase';
export * from './databaseRouter';
export * from './repositories';
export * from './useRepository';

import { dbRouter } from './databaseRouter';
import { cacheDb } from './cacheDatabase';
import { jsonDb } from './jsonDatabase';
import { firestoreDb } from './firestoreDatabase';
import { syncDb } from './syncDatabase';

import { estoqueRepo } from './repositories/estoqueRepository';
import { pickingRepo } from './repositories/pickingRepository';
import { pedidosRepo } from './repositories/pedidosRepository';
import { validadeRepo } from './repositories/validadeRepository';
import { temperaturaRepo } from './repositories/temperaturaRepository';
import { desviosRepo } from './repositories/desviosRepository';
import { dashboardRepo } from './repositories/dashboardRepository';

/**
 * API Interna de Acesso Unificado ao Banco
 * 
 * Os componentes não precisam saber se o dado veio de JSON, Firestore ou IndexedDB;
 * toda a estratégia de resolução, prioridade e cache é resolvida pela camada Database.
 * 
 * Exemplos de uso:
 * - database.estoque.list()
 * - database.estoque.get(101)
 * - database.estoque.historico()
 * - database.picking.hoje()
 * - database.dashboard.resumo()
 */
export const Database = {
  // Domínios Reais do Projeto
  estoque: estoqueRepo,
  picking: pickingRepo,
  pedidos: pedidosRepo,
  validade: validadeRepo,
  temperatura: temperaturaRepo,
  desvios: desviosRepo,
  dashboard: dashboardRepo,

  // Mecanismos Centrais e Infraestrutura
  router: dbRouter,
  cache: cacheDb,
  json: jsonDb,
  firestore: firestoreDb,
  sync: syncDb,

  // Rotina de Fechamento Diário
  fechamento: {
    executar: (dataFechamento?: string, proximaData?: string) =>
      syncDb.executarFechamentoDiario(dataFechamento, proximaData),
    historico: () => syncDb.getHistoricoFechamentos()
  }
};

export const database = Database;

export default Database;
