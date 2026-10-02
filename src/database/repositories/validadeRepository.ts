/**
 * VALIDADE REPOSITORY - Domínio de Controle de Validades FEFO
 */

import { BaseRepository } from './baseRepository';
import { ValidadeEntity } from '../databaseTypes';

export class ValidadeRepository extends BaseRepository<ValidadeEntity> {
  constructor() {
    super('validades');
  }

  public async getCriticos(empresaId = 'demo'): Promise<ValidadeEntity[]> {
    return this.findBy('status', 'critico', empresaId);
  }

  public async getAlertas(empresaId = 'demo'): Promise<ValidadeEntity[]> {
    return this.findBy('status', 'alerta', empresaId);
  }

  public async getByLote(lote: string, empresaId = 'demo'): Promise<ValidadeEntity[]> {
    return this.findBy('lote', lote, empresaId);
  }

  /**
   * Alias amigável para resumo FEFO
   */
  public async resumo(empresaId = 'demo') {
    return this.getResumoFefo(empresaId);
  }

  public async getResumoFefo(empresaId = 'demo') {
    const itens = await this.getAll(empresaId);
    const criticos = itens.filter(i => i.status === 'critico' || i.diasRestantes <= 30);
    const alerta = itens.filter(i => i.status === 'alerta' || (i.diasRestantes > 30 && i.diasRestantes <= 60));
    const normal = itens.filter(i => i.status === 'normal' || i.diasRestantes > 60);

    return {
      totalItens: itens.length,
      criticos: criticos.length,
      alerta: alerta.length,
      normal: normal.length
    };
  }
}

export const validadeRepo = new ValidadeRepository();
