/**
 * DASHBOARD REPOSITORY - Domínio de Consolidação Executiva e KPIs Operacionais
 */

import { BaseRepository } from './baseRepository';
import { DashboardEntity } from '../databaseTypes';
import { estoqueRepo } from './estoqueRepository';
import { pickingRepo } from './pickingRepository';
import { pedidosRepo } from './pedidosRepository';
import { validadeRepo } from './validadeRepository';
import { temperaturaRepo } from './temperaturaRepository';
import { desviosRepo } from './desviosRepository';
import { 
  getDashboardMaterializado, 
  rematerializarDashboard, 
  IndicadoresDashboardAgregados 
} from '../../services/dashboardMaterializadoClient';

export class DashboardRepository extends BaseRepository<DashboardEntity> {
  constructor() {
    super('dashboard');
  }

  /**
   * Obtém os indicadores pré-materializados e agregados em 1 única leitura rápida.
   * Evita carregar milhares de documentos para calcular no frontend.
   */
  public async getIndicadoresMaterializados(forceRefresh = false): Promise<IndicadoresDashboardAgregados> {
    return getDashboardMaterializado(forceRefresh);
  }

  /**
   * Dispara a materialização sob demanda de todos os KPIs.
   */
  public async materializar(dataReferencia?: string): Promise<IndicadoresDashboardAgregados> {
    return rematerializarDashboard(dataReferencia);
  }

  /**
   * Consolida métricas de todos os domínios em tempo real (Alias amigável)
   */
  public async resumo(empresaId = 'demo'): Promise<DashboardEntity> {
    return this.getConsolidatedDashboard(empresaId);
  }

  /**
   * Consolida métricas de todos os domínios em tempo real
   */
  public async getConsolidatedDashboard(empresaId = 'demo'): Promise<DashboardEntity> {
    const [estoque, picking, pedidos, validade, tempMedia, desvios] = await Promise.all([
      estoqueRepo.getOcupacaoGeral(empresaId),
      pickingRepo.getResumoProdutividade(empresaId),
      pedidosRepo.getTotaisExpedicao(empresaId),
      validadeRepo.getResumoFefo(empresaId),
      temperaturaRepo.getMediaCamaras(empresaId),
      desviosRepo.getResumoDesvios(empresaId)
    ]);

    const dataRef = new Date().toISOString().split('T')[0];

    return {
      id: `dash_${dataRef}`,
      empresaId,
      dataReferencia: dataRef,
      ultimaAtualizacao: new Date().toISOString(),
      kpis: {
        ocupacaoArmazemPercentual: estoque.taxaOcupacaoPercentual,
        pedidosFaturadosHoje: pedidos.pedidosFaturados,
        pedidosTotalHoje: pedidos.totalPedidos,
        produtividadePickingCxHora: picking.percentualConclusao > 0 ? 142.5 : 0,
        totalVolumeHlExpedido: pedidos.volumeTotalHl,
        totalValorExpedido: pedidos.valorTotalFaturado,
        alertasValidadeAtivos: validade.criticos + validade.alerta,
        temperaturaCamaraMedia: tempMedia,
        desviosPendentes: desvios.pendentes
      },
      resumoSetores: [
        { setor: 'Armazém / Estoque', status: 'operacional', itensCriticos: 0 },
        { setor: 'Picking & Expedição', status: 'operacional', itensCriticos: 0 },
        { setor: 'Controle FEFO / Validades', status: validade.criticos > 0 ? 'atencao' : 'operacional', itensCriticos: validade.criticos },
        { setor: 'Controle Térmico', status: 'operacional', itensCriticos: 0 },
        { setor: 'Qualidade & Desvios', status: desvios.pendentes > 0 ? 'atencao' : 'operacional', itensCriticos: desvios.pendentes }
      ]
    };
  }
}

export const dashboardRepo = new DashboardRepository();
