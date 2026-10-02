/**
 * PICKING REPOSITORY - Domínio de Separação de Pedidos e Produtividade
 */

import { BaseRepository } from './baseRepository';
import { PickingEntity } from '../databaseTypes';

export class PickingRepository extends BaseRepository<PickingEntity> {
  constructor() {
    super('tarefas');
  }

  public async getByOperador(operador: string, empresaId = 'demo'): Promise<PickingEntity[]> {
    return this.findBy('operador', operador, empresaId);
  }

  public async getByStatus(status: string, empresaId = 'demo'): Promise<PickingEntity[]> {
    return this.findBy('status', status, empresaId);
  }

  public async getByPedido(pedidoId: string, empresaId = 'demo'): Promise<PickingEntity[]> {
    return this.findBy('pedidoId', pedidoId, empresaId);
  }

  /**
   * Retorna as tarefas e separações do dia atual
   */
  public async hoje(empresaId = 'demo'): Promise<PickingEntity[]> {
    const hojeStr = new Date().toISOString().split('T')[0];
    const todas = await this.list(empresaId);
    return todas.filter(t => t.dataCriacao?.startsWith(hojeStr) || t.dataISO?.startsWith(hojeStr) || !t.dataCriacao);
  }

  /**
   * Alias amigável para resumo de produtividade
   */
  public async resumo(empresaId = 'demo') {
    return this.getResumoProdutividade(empresaId);
  }

  public async getResumoProdutividade(empresaId = 'demo') {
    const tarefas = await this.getAll(empresaId);
    const concluidas = tarefas.filter(t => t.status === 'concluida');
    const emAndamento = tarefas.filter(t => t.status === 'em_andamento');
    const pendentes = tarefas.filter(t => t.status === 'pendente');

    return {
      totalTarefas: tarefas.length,
      concluidas: concluidas.length,
      emAndamento: emAndamento.length,
      pendentes: pendentes.length,
      percentualConclusao: tarefas.length > 0 ? Number(((concluidas.length / tarefas.length) * 100).toFixed(1)) : 0
    };
  }
}

export const pickingRepo = new PickingRepository();
