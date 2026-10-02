/**
 * ESTOQUE REPOSITORY - Domínio de Armazém e Gestão de Posições
 */

import { BaseRepository } from './baseRepository';
import { EstoqueEntity } from '../databaseTypes';

export class EstoqueRepository extends BaseRepository<EstoqueEntity> {
  constructor() {
    super('armazem');
  }

  public async getByLocalizacao(localizacao: string, empresaId = 'demo'): Promise<EstoqueEntity[]> {
    return this.findBy('localizacao', localizacao, empresaId);
  }

  public async getByStatus(status: string, empresaId = 'demo'): Promise<EstoqueEntity[]> {
    return this.findBy('status', status, empresaId);
  }

  public async getByCodigoProduto(codigo: number | string, empresaId = 'demo'): Promise<EstoqueEntity[]> {
    return this.findBy('codigo', Number(codigo), empresaId);
  }

  /**
   * Alias amigável para ocupação geral do armazém
   */
  public async resumo(empresaId = 'demo') {
    return this.getOcupacaoGeral(empresaId);
  }

  public async getOcupacaoGeral(empresaId = 'demo') {
    const itens = await this.getAll(empresaId);
    const totalCaixas = itens.reduce((acc, curr) => acc + (curr.quantidadeCaixas || 0), 0);
    const paletesOcupados = itens.reduce((acc, curr) => acc + (curr.quantidadePaletes || Math.ceil((curr.quantidadeCaixas || 0) / 60)), 0);
    const capacidadeTotal = 4500;

    return {
      totalItens: itens.length,
      totalCaixas,
      paletesOcupados,
      capacidadeTotal,
      taxaOcupacaoPercentual: Number(((paletesOcupados / capacidadeTotal) * 100).toFixed(2))
    };
  }
}

export const estoqueRepo = new EstoqueRepository();
