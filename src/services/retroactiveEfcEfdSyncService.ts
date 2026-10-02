import { EfcEfdVehicle, saveEfcVehicles } from '../utils/efcEfdManager';
import { RetroactiveRecord, getRetroactiveRecords, saveRetroactiveRecords, clearRetroactiveModule } from '../utils/dadosRetroativosUtils';
import { EfcEfdVehiclesRepository, ArmazemRepository } from '../db/repositories';
import { ArmazemRow } from '../types';
import { getJsonTable, saveJsonTable } from '../utils/hybridJsonDatabase';
import { syncEntityToPublic } from './bancoDadosSyncClient';
import { invalidateHybridCache } from '../utils/hybridCacheService';

export interface EfcEfdSyncResult {
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  totalSynced: number;
  collection: string;
  publicSyncStatus: boolean;
  hybridTableStatus: boolean;
  retroactiveSaved: number;
  modoSubstituicaoTotal?: boolean;
  divergenciasRemovidas?: number;
  errors: string[];
}

/**
 * Converte a lista de EfcEfdVehicle para o formato nativo ArmazemRow utilizado pelo LogisticaDashboard.
 */
export function convertEfcVehiclesToArmazemRows(vehicles: EfcEfdVehicle[], empresaId: string = 'demo'): ArmazemRow[] {
  const rows: ArmazemRow[] = [];

  vehicles.forEach((v, index) => {
    const rawAny = v as any;
    const palhetes = Number(v.qtdPallets || v.pallets || 10);
    const pernoiteVal = ((v.categoriaFinal || 'D0').toUpperCase()) as 'D0' | 'D1' | 'D2' | 'D3' | 'D4';

    // 1. Linha de Carregamento (EFC)
    const cDataFormatada = v.dataCarregamento || rawAny.date || new Date().toLocaleDateString('pt-BR');
    let cDataISO = new Date().toISOString().split('T')[0];
    if (cDataFormatada.includes('/')) {
      const parts = cDataFormatada.split('/');
      if (parts.length === 3) {
        cDataISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const cInicio = v.carregamentoInicio ? (v.carregamentoInicio.includes(' ') ? v.carregamentoInicio.split(' ')[1] : v.carregamentoInicio) : (rawAny.horaInicio || '22:17');
    const cFim = v.carregamentoFinal ? (v.carregamentoFinal.includes(' ') ? v.carregamentoFinal.split(' ')[1] : v.carregamentoFinal) : (rawAny.horaFim || '22:30');
    const isEfcDentro = v.carregamentoMeta ? v.carregamentoMeta.toUpperCase().includes('DENTRO') : (v.efcCompliant !== false);
    const cHour = parseInt(cInicio.split(':')[0] || '12', 10);
    const cTurno = (cHour >= 6 && cHour < 18) ? 'Diurno' : 'Noturno';

    const efcDocId = v.id ? `efc_${v.id}_c` : `efc_${v.mapa || ''}_${v.placa || ''}_${cDataISO}_${index}_c`;

    rows.push({
      _docId: efcDocId,
      empresaId,
      operacao: 'Carregamento',
      data: cDataFormatada,
      dataISO: cDataISO,
      inicio: cInicio,
      fim: cFim,
      status: isEfcDentro ? 'DENTRO DA JANELA' : 'FORA DA JANELA',
      empilhador: v.colaboradorCarregamento || v.operadorExecutorCarregamento || 'Paulo Pereira da Silva',
      turno: cTurno,
      placa: v.placa || rawAny.veiculo || 'SLB3J76',
      tipo: v.tipoVeiculo || 'Frota Dedicada',
      palhete: palhetes,
      pernoite: pernoiteVal,
      obs: `Mapa: ${v.mapa || 'S/N'} | Meta: ${v.carregamentoMeta || (isEfcDentro ? 'DENTRO' : 'FORA')}`,
      _criadoEm: new Date().toISOString()
    });

    // 2. Linha de Descarregamento (EFD)
    const dDataFormatada = v.dataFechamentoRota || v.dataCarregamento || rawAny.date || new Date().toLocaleDateString('pt-BR');
    let dDataISO = cDataISO;
    if (dDataFormatada.includes('/')) {
      const parts = dDataFormatada.split('/');
      if (parts.length === 3) {
        dDataISO = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    const dInicio = v.descarregamentoInicio ? (v.descarregamentoInicio.includes(' ') ? v.descarregamentoInicio.split(' ')[1] : v.descarregamentoInicio) : '07:08';
    const dFim = v.descarregamentoFinal ? (v.descarregamentoFinal.includes(' ') ? v.descarregamentoFinal.split(' ')[1] : v.descarregamentoFinal) : '07:13';
    const isEfdDentro = v.descarregamentoMeta ? v.descarregamentoMeta.toUpperCase().includes('DENTRO') : (v.efdCompliant !== false);
    const dHour = parseInt(dInicio.split(':')[0] || '12', 10);
    const dTurno = (dHour >= 6 && dHour < 18) ? 'Diurno' : 'Noturno';

    const efdDocId = v.id ? `efd_${v.id}_d` : `efd_${v.mapa || ''}_${v.placa || ''}_${dDataISO}_${index}_d`;

    rows.push({
      _docId: efdDocId,
      empresaId,
      operacao: 'Descarregamento',
      data: dDataFormatada,
      dataISO: dDataISO,
      inicio: dInicio,
      fim: dFim,
      status: isEfdDentro ? 'DENTRO DA JANELA' : 'FORA DA JANELA',
      empilhador: v.colaboradorDescarregamento || v.operadorExecutorDescarregamento || v.colaboradorCarregamento || 'Operador Empilhadeira',
      turno: dTurno,
      placa: v.placa || rawAny.veiculo || 'SLB3J76',
      tipo: v.tipoVeiculo || 'Frota Dedicada',
      palhete: palhetes,
      pernoite: pernoiteVal,
      obs: `Mapa: ${v.mapa || 'S/N'} | Meta: ${v.descarregamentoMeta || (isEfdDentro ? 'DENTRO' : 'FORA')}`,
      _criadoEm: new Date().toISOString()
    });
  });

  return rows;
}

/**
 * Serviço de sincronização e persistência para dados retroativos de EFC / EFD (Carregamento e Descarregamento).
 * Suporta Modo Padrão da Plataforma (Substituição Total / Exclusão de Divergências):
 * Quando ativo, apaga registros anteriores divergentes e define o documento importado
 * como a única fonte da verdade oficial em todas as 5 camadas da aplicação.
 */
export async function syncRetroactiveEfcEfdBatch(
  vehicles: EfcEfdVehicle[],
  retroRecords: RetroactiveRecord[],
  empresaId: string = 'demo',
  tornarPadraoOficial: boolean = false
): Promise<EfcEfdSyncResult> {
  const result: EfcEfdSyncResult = {
    success: false,
    insertedCount: 0,
    updatedCount: 0,
    totalSynced: 0,
    collection: `empresas/${empresaId}/efc_efd_vehicles`,
    publicSyncStatus: false,
    hybridTableStatus: false,
    retroactiveSaved: 0,
    modoSubstituicaoTotal: tornarPadraoOficial,
    divergenciasRemovidas: 0,
    errors: []
  };

  if (!vehicles || vehicles.length === 0) {
    result.errors.push('Nenhum registro de veículo EFC/EFD fornecido para persistência.');
    return result;
  }

  try {
    // ── CAMADA 1: Repositório Oficial e Local Storage de EFC/EFD ──
    try {
      let finalVehiclesList: EfcEfdVehicle[] = [];

      if (tornarPadraoOficial) {
        finalVehiclesList = [...vehicles];
        result.divergenciasRemovidas = 0;
      } else {
        // Mesclar com os dados pré-existentes
        const existingStored = localStorage.getItem(`efc_efd_vehicles_${empresaId}`);
        let existingList: EfcEfdVehicle[] = [];
        if (existingStored) {
          try {
            existingList = JSON.parse(existingStored);
          } catch (_) {}
        }

        const vehicleMap = new Map<string, EfcEfdVehicle>();
        existingList.forEach(v => { if (v.id) vehicleMap.set(v.id, v); });
        vehicles.forEach(v => { if (v.id) vehicleMap.set(v.id, v); });
        finalVehiclesList = Array.from(vehicleMap.values());
      }

      // Persistir no Manager do EFC/EFD (LocalStorage + Eventos de Atualização)
      saveEfcVehicles(empresaId, finalVehiclesList);

      // Repositório Firestore
      try {
        await EfcEfdVehiclesRepository.update(empresaId, {
          id: empresaId,
          vehicles: finalVehiclesList,
          updatedAt: new Date().toISOString()
        }, empresaId);
      } catch (err: any) {
        console.warn('[EfcEfdSync] Aviso no Repositório:', err.message);
      }

      result.insertedCount = vehicles.length;
      result.totalSynced = finalVehiclesList.length;
    } catch (err: any) {
      console.warn('[EfcEfdSync] Erro na Camada 1:', err.message);
      result.errors.push(`Camada 1: ${err.message}`);
    }

    // ── CAMADA 2: Tabela JSON Híbrida e Linhas do Dashboard de Logística (ArmazemRow) ──
    try {
      await saveJsonTable(empresaId, 'efc_efd', vehicles);
      await saveJsonTable(empresaId, 'veiculos', vehicles);
      
      // Converter para ArmazemRow e alimentar a fonte do LogisticaDashboard
      const convertedArmazemRows = convertEfcVehiclesToArmazemRows(vehicles, empresaId);
      
      let finalArmazemRows: ArmazemRow[] = [];
      if (tornarPadraoOficial) {
        finalArmazemRows = convertedArmazemRows;
      } else {
        const storedArmazem = localStorage.getItem(`armazem_rows_${empresaId}`);
        let existingArmazem: ArmazemRow[] = [];
        if (storedArmazem) {
          try { existingArmazem = JSON.parse(storedArmazem); } catch (_) {}
        }
        const armazemMap = new Map<string, ArmazemRow>();
        existingArmazem.forEach(r => { if (r._docId) armazemMap.set(r._docId, r); });
        convertedArmazemRows.forEach(r => { if (r._docId) armazemMap.set(r._docId, r); });
        finalArmazemRows = Array.from(armazemMap.values());
      }

      localStorage.setItem(`armazem_rows_${empresaId}`, JSON.stringify(finalArmazemRows));
      await saveJsonTable(empresaId, 'armazem', finalArmazemRows);

      result.hybridTableStatus = true;
    } catch (err: any) {
      console.warn('[EfcEfdSync] Falha na tabela híbrida / armazém:', err.message);
      result.errors.push(`Tabela JSON Híbrida: ${err.message}`);
    }

    // ── CAMADA 3: Backend /public/banco-dados/hoje/efc_efd.json ──
    try {
      const timestamp = new Date().toISOString();
      const payloadEfcEfd = {
        dataReferencia: new Date().toISOString().split('T')[0],
        ultimaAtualizacao: timestamp,
        tipoOrigem: tornarPadraoOficial ? 'padrao_oficial_plataforma_efc_efd' : 'importacao_retroativa_json_efc_efd',
        isPadraoOficial: tornarPadraoOficial,
        totalVeiculos: vehicles.length,
        totalPallets: vehicles.reduce((acc, v) => acc + (v.qtdPallets || v.pallets || 10), 0),
        efcConformes: vehicles.filter(v => v.efcCompliant).length,
        efdConformes: vehicles.filter(v => v.efdCompliant).length,
        veiculos: vehicles
      };

      const publicSync = await syncEntityToPublic('efc_efd', payloadEfcEfd);
      result.publicSyncStatus = publicSync.success;
    } catch (err: any) {
      console.warn('[EfcEfdSync] Falha na sincronização pública:', err.message);
    }

    // ── CAMADA 4: Armazenamento Retroativo Local Central ──
    try {
      if (retroRecords && retroRecords.length > 0) {
        if (tornarPadraoOficial) {
          clearRetroactiveModule('efc_efd');
        }

        const existingAll = getRetroactiveRecords('todos');
        const existingFiltered = tornarPadraoOficial 
          ? existingAll.filter(r => r.modulo !== 'efc_efd')
          : existingAll;

        const newRetroMap = new Map<string, RetroactiveRecord>();
        existingFiltered.forEach(r => newRetroMap.set(r.id, r));
        retroRecords.forEach(r => newRetroMap.set(r.id, r));

        const updatedRetroList = Array.from(newRetroMap.values());
        saveRetroactiveRecords(updatedRetroList);
        result.retroactiveSaved = retroRecords.length;
      }
    } catch (err: any) {
      console.warn('[EfcEfdSync] Falha no histórico retroativo:', err.message);
    }

    // ── CAMADA 5: Invalidação de Cache & Notificação Global ──
    try {
      invalidateHybridCache('efc_efd');
      invalidateHybridCache('veiculos');
      window.dispatchEvent(new Event('efc_vehicles_updated'));
      window.dispatchEvent(new Event('local_data_changed'));
    } catch (_) {}

    result.success = true;
    return result;

  } catch (error: any) {
    result.errors.push(`Erro crítico na sincronização de EFC/EFD: ${error.message}`);
    return result;
  }
}
