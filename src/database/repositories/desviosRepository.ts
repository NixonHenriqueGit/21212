/**
 * DESVIOS REPOSITORY - Domínio de Gestão de Não-Conformidades, Quebras e Desvios
 */

import { BaseRepository } from './baseRepository';
import { DesviosEntity } from '../databaseTypes';

export class DesviosRepository extends BaseRepository<DesviosEntity> {
  constructor() {
    super('quebras');
  }

  public async getPendentes(empresaId = 'demo'): Promise<DesviosEntity[]> {
    const list = await this.getAll(empresaId);
    return list.filter(d => d.status === 'pendente' || d.status === 'em_analise');
  }

  public async getBySeveridade(severidade: string, empresaId = 'demo'): Promise<DesviosEntity[]> {
    return this.findBy('severidade', severidade, empresaId);
  }

  public async getBySetor(setor: string, empresaId = 'demo'): Promise<DesviosEntity[]> {
    return this.findBy('setor', setor, empresaId);
  }

  public async getResumoDesvios(empresaId = 'demo') {
    const desvios = await this.getAll(empresaId);
    const pendentes = desvios.filter(d => d.status === 'pendente' || d.status === 'em_analise');
    const resolvidos = desvios.filter(d => d.status === 'resolvido');
    const criticos = desvios.filter(d => d.severidade === 'alta' || d.severidade === 'critica');

    return {
      total: desvios.length,
      pendentes: pendentes.length,
      resolvidos: resolvidos.length,
      criticos: criticos.length
    };
  }
}

export const desviosRepo = new DesviosRepository();
