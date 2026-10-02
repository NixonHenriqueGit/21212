import { QuebraRow } from '../types';
import { RetroactiveRecord, getRetroactiveRecords, saveRetroactiveRecords, clearRetroactiveModule } from '../utils/dadosRetroativosUtils';
import { QuebrasRepository } from '../db/repositories';
import { getJsonTable, saveJsonTable } from '../utils/hybridJsonDatabase';
import { syncEntityToPublic } from './bancoDadosSyncClient';
import { invalidateHybridCache } from '../utils/hybridCacheService';

export interface SaveQuebrasRetroativasResult {
  success: boolean;
  importedCount: number;
  totalVolume: number;
  totalHl: number;
  totalValor: number;
  modoSubstituicaoTotal?: boolean;
  divergenciasRemovidas?: number;
  destinosAtualizados: {
    repositorioQuebras: boolean;
    tabelaJsonQuebras: boolean;
    publicBancoDadosHoje: boolean;
    dadosRetroativosHistoricos: boolean;
  };
  arquivosGerados: string[];
  timestamp: string;
  detalhes?: string;
  error?: string;
}

/**
 * Salva registros de quebras retroativas em todas as camadas do banco de dados híbrido:
 * 1. Base Repository (Firestore / Database Router)
 * 2. Tabela JSON Local (hybridJsonDatabase: quebras)
 * 3. Arquivo do Backend (/public/banco-dados/hoje/quebras.json)
 * 4. Repositório Retroativo (localStorage: af_dados_retroativos_historicos_v3)
 * 5. Invalidação de Cache L1/L2
 */
export async function persistirQuebrasRetroativasNoBanco(
  quebraRows: QuebraRow[],
  retroactiveRecords: RetroactiveRecord[],
  empresaId = 'demo',
  tornarPadraoOficial = false
): Promise<SaveQuebrasRetroativasResult> {
  const timestamp = new Date().toISOString();
  const arquivosGerados: string[] = [];
  let divergenciasRemovidas = 0;
  const destinos = {
    repositorioQuebras: false,
    tabelaJsonQuebras: false,
    publicBancoDadosHoje: false,
    dadosRetroativosHistoricos: false
  };

  try {
    if (!quebraRows || quebraRows.length === 0) {
      throw new Error('Nenhum registro de quebra fornecido para persistência.');
    }

    const newIds = new Set(quebraRows.map(r => String(r.id)));

    // Se tornar padrão oficial da plataforma: purgar dados divergentes anteriores
    if (tornarPadraoOficial) {
      try {
        const existingAll = await QuebrasRepository.getAll(empresaId);
        const divergentItems = existingAll.filter(item => !newIds.has(String(item.id)));
        
        for (const item of divergentItems) {
          if (item.id) {
            await QuebrasRepository.delete(item.id, empresaId);
            divergenciasRemovidas++;
          }
        }
        arquivosGerados.push(`Expurgo de Divergências: ${divergenciasRemovidas} registros removidos`);
      } catch (err) {
        console.warn('Alerta ao expurgar divergências de quebras:', err);
      }
    }

    // 1. Salvar no Repositório de Quebras (BaseRepository / DatabaseRouter)
    try {
      await QuebrasRepository.batchUpsert(quebraRows, empresaId);
      destinos.repositorioQuebras = true;
      arquivosGerados.push(`Coleção Oficial: empresas/${empresaId}/quebras (${quebraRows.length} docs)`);
    } catch (err) {
      console.warn('Alerta ao persistir no repositório de quebras:', err);
    }

    // 2. Salvar na Tabela JSON do Banco Local Híbrido (hybridJsonDatabase)
    try {
      if (tornarPadraoOficial) {
        // Substituição total
        await saveJsonTable(empresaId, 'quebras', quebraRows);
        destinos.tabelaJsonQuebras = true;
        arquivosGerados.push(`Tabela JSON Híbrida Oficial: json_db:${empresaId}:quebras (${quebraRows.length} registros)`);
      } else {
        const existingJsonTable = await getJsonTable<QuebraRow>(empresaId, 'quebras');
        const mergedMap = new Map<string, QuebraRow>();
        
        // Preserva dados existentes
        existingJsonTable.forEach(item => {
          if (item.id) mergedMap.set(String(item.id), item);
        });
        
        // Adiciona novos itens retroativos
        quebraRows.forEach(item => {
          if (item.id) mergedMap.set(String(item.id), item);
        });

        const updatedQuebrasTable = Array.from(mergedMap.values());
        await saveJsonTable(empresaId, 'quebras', updatedQuebrasTable);
        destinos.tabelaJsonQuebras = true;
        arquivosGerados.push(`Tabela JSON Híbrida: json_db:${empresaId}:quebras (${updatedQuebrasTable.length} total)`);
      }
    } catch (err) {
      console.warn('Alerta ao salvar tabela JSON local:', err);
    }

    // 3. Sincronizar com os Arquivos do Servidor em /public/banco-dados/hoje/quebras.json
    try {
      const payloadQuebras = {
        dataReferencia: new Date().toISOString().split('T')[0],
        ultimaAtualizacao: timestamp,
        tipoOrigem: 'importacao_retroativa_json',
        padraoOficialPlataforma: tornarPadraoOficial,
        totalItens: quebraRows.length,
        volumeTotalQtd: quebraRows.reduce((acc, q) => acc + (q.quantidade || 0), 0),
        totalHlPerdido: quebraRows.reduce((acc, q) => acc + (q.hlPerdido || 0), 0),
        valorTotalAvaria: quebraRows.reduce((acc, q) => acc + (q.valorTotal || q.valor || 0), 0),
        itens: quebraRows
      };

      const syncResult = await syncEntityToPublic('quebras', payloadQuebras);
      if (syncResult.success) {
        destinos.publicBancoDadosHoje = true;
        arquivosGerados.push('/public/banco-dados/hoje/quebras.json');
        arquivosGerados.push('/public/banco-dados/indices/quebras_index.json');
      }
    } catch (err) {
      console.warn('Alerta ao sincronizar backend /public/banco-dados/hoje/quebras:', err);
    }

    // 4. Salvar na Camada de Dados Retroativos Históricos
    try {
      if (tornarPadraoOficial) {
        clearRetroactiveModule('quebras');
        saveRetroactiveRecords(retroactiveRecords);
        destinos.dadosRetroativosHistoricos = true;
        arquivosGerados.push(`Base Histórica Oficial Redefinida: af_dados_retroativos_historicos_v3 (${retroactiveRecords.length} itens)`);
      } else {
        const existingRetro = getRetroactiveRecords('todos');
        const existingRetroMap = new Map<string, RetroactiveRecord>();
        
        existingRetro.forEach(r => existingRetroMap.set(r.id, r));
        retroactiveRecords.forEach(r => existingRetroMap.set(r.id, r));

        const updatedRetroList = Array.from(existingRetroMap.values());
        saveRetroactiveRecords(updatedRetroList);
        destinos.dadosRetroativosHistoricos = true;
        arquivosGerados.push(`Base Histórica Retroativa: af_dados_retroativos_historicos_v3 (+${retroactiveRecords.length} itens)`);
      }
    } catch (err) {
      console.warn('Alerta ao salvar base retroativa local:', err);
    }

    // Marca padrão oficial ou mescla no localStorage
    if (typeof window !== 'undefined') {
      try {
        if (tornarPadraoOficial) {
          localStorage.setItem(`quebras_${empresaId}`, JSON.stringify(quebraRows));
          localStorage.setItem('quebras_demo', JSON.stringify(quebraRows));
          localStorage.setItem(`af_padrao_oficial_quebras_${empresaId}`, JSON.stringify({
            dataPadrao: timestamp,
            totalItens: quebraRows.length
          }));
        } else {
          const saved = localStorage.getItem(`quebras_${empresaId}`);
          let merged: QuebraRow[] = [];
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) {
                const map = new Map<string, QuebraRow>();
                parsed.forEach(p => { if (p.id) map.set(String(p.id), p); });
                quebraRows.forEach(q => { if (q.id) map.set(String(q.id), q); });
                merged = Array.from(map.values());
              }
            } catch (_) {}
          }
          if (merged.length === 0) merged = [...quebraRows];
          localStorage.setItem(`quebras_${empresaId}`, JSON.stringify(merged));
        }
      } catch (e) {
        console.warn('Alerta ao atualizar localStorage de quebras:', e);
      }
    }

    // 5. Invalidar cache para sincronização imediata
    invalidateHybridCache(`empresas/${empresaId}/quebras`);
    invalidateHybridCache('quebras');

    // Notificar eventos de atualização para que outros componentes reajam
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('quebras-db-updated', { detail: { count: quebraRows.length } }));
      window.dispatchEvent(new CustomEvent('retroactive-data-updated', { detail: { modulo: 'quebras' } }));
    }

    const totalVolume = quebraRows.reduce((acc, q) => acc + (q.quantidade || 0), 0);
    const totalHl = quebraRows.reduce((acc, q) => acc + (q.hlPerdido || 0), 0);
    const totalValor = quebraRows.reduce((acc, q) => acc + (q.valorTotal || q.valor || 0), 0);

    return {
      success: true,
      importedCount: quebraRows.length,
      totalVolume,
      totalHl,
      totalValor,
      modoSubstituicaoTotal: tornarPadraoOficial,
      divergenciasRemovidas,
      destinosAtualizados: destinos,
      arquivosGerados,
      timestamp,
      detalhes: `Persistidos com sucesso ${quebraRows.length} registros retroativos de quebras e avarias.`
    };

  } catch (error: any) {
    return {
      success: false,
      importedCount: 0,
      totalVolume: 0,
      totalHl: 0,
      totalValor: 0,
      destinosAtualizados: destinos,
      arquivosGerados,
      timestamp,
      error: error?.message || 'Falha desconhecida na persistência de quebras.'
    };
  }
}
