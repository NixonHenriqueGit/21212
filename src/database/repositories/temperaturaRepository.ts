/**
 * TEMPERATURA REPOSITORY - Domínio de Controle Térmico de Câmaras e Galpão
 */

import { BaseRepository } from './baseRepository';
import { TemperaturaEntity } from '../databaseTypes';

export class TemperaturaRepository extends BaseRepository<TemperaturaEntity> {
  constructor() {
    super('temperatura');
  }

  public async getByArea(area: string, empresaId = 'demo'): Promise<TemperaturaEntity[]> {
    return this.findBy('area', area, empresaId);
  }

  public async getDesviosTemperatura(empresaId = 'demo'): Promise<TemperaturaEntity[]> {
    const sensores = await this.getAll(empresaId);
    return sensores.filter(s => s.status === 'alerta' || s.status === 'critico' || s.temperaturaAtual < s.faixaIdealMin || s.temperaturaAtual > s.faixaIdealMax);
  }

  public async getMediaCamaras(empresaId = 'demo'): Promise<number> {
    const sensores = await this.getAll(empresaId);
    const camaras = sensores.filter(s => s.area.toLowerCase().includes('câmara') || s.area.toLowerCase().includes('camara'));
    if (camaras.length === 0) return 2.75;
    const soma = camaras.reduce((acc, c) => acc + (c.temperaturaAtual || 0), 0);
    return Number((soma / camaras.length).toFixed(2));
  }
}

export const temperaturaRepo = new TemperaturaRepository();
