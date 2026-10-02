/**
 * PEDIDOS REPOSITORY - Domínio de Expedição, Faturamento e Cargas
 */

import { BaseRepository } from './baseRepository';
import { PedidosEntity } from '../databaseTypes';

export class PedidosRepository extends BaseRepository<PedidosEntity> {
  constructor() {
    super('pedidos');
  }

  public async getByRota(rota: string, empresaId = 'demo'): Promise<PedidosEntity[]> {
    return this.findBy('rota', rota, empresaId);
  }

  public async getByStatus(status: string, empresaId = 'demo'): Promise<PedidosEntity[]> {
    return this.findBy('status', status, empresaId);
  }

  public async getByCliente(cliente: string, empresaId = 'demo'): Promise<PedidosEntity[]> {
    return this.findBy('cliente', cliente, empresaId);
  }

  /**
   * Retorna os pedidos do dia atual
   */
  public async hoje(empresaId = 'demo'): Promise<PedidosEntity[]> {
    const hojeStr = new Date().toISOString().split('T')[0];
    const todos = await this.list(empresaId);
    return todos.filter(p => p.dataPedido?.startsWith(hojeStr) || p.dataISO?.startsWith(hojeStr) || !p.dataPedido);
  }

  /**
   * Alias amigável para totais de expedição
   */
  public async resumo(empresaId = 'demo') {
    return this.getTotaisExpedicao(empresaId);
  }

  public async getTotaisExpedicao(empresaId = 'demo') {
    const pedidos = await this.getAll(empresaId);
    const faturados = pedidos.filter(p => p.status === 'faturado' || p.status === 'carregado' || p.status === 'entregue');
    const valorTotal = faturados.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    const volumeTotalHl = faturados.reduce((acc, p) => acc + (p.hlTotal || 0), 0);

    return {
      totalPedidos: pedidos.length,
      pedidosFaturados: faturados.length,
      valorTotalFaturado: valorTotal,
      volumeTotalHl
    };
  }
}

export const pedidosRepo = new PedidosRepository();
