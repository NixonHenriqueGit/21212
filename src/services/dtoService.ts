import { DtoRegistro, DtoOperacaoId, DtoItemResposta } from '../types/dto';
import { INITIAL_DTO_HISTORICO_MOCK, DTO_OPERACOES_CONFIG } from '../data/dtoOperacoesData';
import { firestoreDb } from '../database/firestoreDatabase';

const DTO_STORAGE_KEY = 'armazem_dto_historico_registros_v1';

export class DtoService {
  /**
   * Normalizes raw DTO JSON into a valid DtoRegistro
   */
  static parseAndNormalizeDto(raw: any): DtoRegistro {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Formato de DTO inválido');
    }

    // Detect operation from modulo / operacaoNome / operacaoId
    const moduloStr = (raw.modulo || raw.operacaoNome || raw.operacaoId || '').toString().toLowerCase();
    let opConfig = DTO_OPERACOES_CONFIG.find(op => 
      moduloStr.includes(op.id.toLowerCase()) || 
      moduloStr.includes(op.sigla.toLowerCase()) || 
      moduloStr.includes(op.tituloCurto.toLowerCase()) || 
      moduloStr.includes(op.nome.toLowerCase())
    );
    if (!opConfig) {
      opConfig = DTO_OPERACOES_CONFIG[0]; // fallback to first operation (repack)
    }

    // Parse Date and Time
    const data = raw.dataAplicacao || raw.data || (raw.registradoEm ? raw.registradoEm.slice(0, 10) : new Date().toISOString().slice(0, 10));
    let hora = raw.hora;
    if (!hora && raw.registradoEm && raw.registradoEm.includes('T')) {
      hora = raw.registradoEm.split('T')[1].slice(0, 5);
    }
    hora = hora || '12:00';
    const dataHoraISO = raw.registradoEm || raw.dataHoraISO || `${data}T${hora}:00.000Z`;

    // Parse Motivo/Gatilho
    const gatilhoStr = (raw.gatilho || raw.motivoDto || '').toString().toLowerCase();
    let motivoDto: DtoRegistro['motivoDto'] = 'meta_nao_batida';
    if (gatilhoStr.includes('perda') || gatilhoStr.includes('aumento')) {
      motivoDto = 'aumento_perdas';
    } else if (gatilhoStr.includes('rotina') || gatilhoStr.includes('auditoria')) {
      motivoDto = 'auditoria_rotina';
    } else if (gatilhoStr.includes('reciclagem') || gatilhoStr.includes('treinamento')) {
      motivoDto = 'reciclagem_treinamento';
    } else if (gatilhoStr.includes('solicitacao') || gatilhoStr.includes('gestao')) {
      motivoDto = 'solicitacao_gestao';
    }

    // Parse Turno
    const turnoStr = (raw.turno || '').toString().toLowerCase();
    let turno: DtoRegistro['turno'] = '1º Turno';
    if (turnoStr.includes('2') || turnoStr.includes('tarde')) turno = '2º Turno';
    else if (turnoStr.includes('3') || turnoStr.includes('noite')) turno = '3º Turno';
    else if (turnoStr.includes('comercial')) turno = 'Comercial';
    else if (turnoStr.includes('geral')) turno = 'Geral';

    // Parse Checklist Respostas
    const respostas: Record<string, DtoItemResposta> = {};
    let confCount = 0;
    let naoConfCount = 0;

    if (Array.isArray(raw.checklist)) {
      raw.checklist.forEach((chk: any, idx: number) => {
        // Find matching item in opConfig if possible
        const configItem = opConfig.itens.find(it => it.numero === String(chk.itemId).padStart(2, '0') || it.id === chk.itemId) || opConfig.itens[idx];
        const targetId = configItem ? configItem.id : (chk.itemId ? `${opConfig.id}_${chk.itemId}` : `${opConfig.id}_${idx + 1}`);
        
        const respStr = String(chk.resposta ?? chk.conforme ?? '').trim().toUpperCase();
        const isConforme = respStr === 'SIM' || respStr === 'S' || respStr === 'TRUE' || respStr === '1' || respStr === 'CONFORME' || chk.conforme === true;
        const isNaoConforme = respStr === 'NAO' || respStr === 'NÃO' || respStr === 'N' || respStr === 'FALSE' || respStr === '0' || respStr === 'NÃO CONFORME' || chk.conforme === false;
        
        const finalConforme = isConforme ? true : (isNaoConforme ? false : null);
        if (finalConforme === true) confCount++;
        if (finalConforme === false) naoConfCount++;

        respostas[targetId] = {
          itemId: targetId,
          conforme: finalConforme,
          observacao: chk.observacao || chk.obs || chk.parecer || undefined,
          fotoUrl: chk.fotoUrl || undefined
        };
      });
    } else if (raw.respostas && typeof raw.respostas === 'object') {
      Object.entries(raw.respostas).forEach(([key, val]: [string, any]) => {
        if (val && typeof val === 'object') {
          respostas[key] = val;
          if (val.conforme === true) confCount++;
          if (val.conforme === false) naoConfCount++;
        }
      });
    }

    const totalItens = Object.keys(respostas).length || (raw.checklist?.length ?? opConfig.itens.length);
    const itensConformes = raw.resumo?.conformes !== undefined ? Number(raw.resumo.conformes) : confCount;
    const itensNaoConformes = raw.resumo?.naoConformes !== undefined ? Number(raw.resumo.naoConformes) : naoConfCount;
    
    let percentual = raw.resumo?.percentualAderencia !== undefined ? Number(raw.resumo.percentualAderencia) : (raw.percentualConformidade !== undefined ? Number(raw.percentualConformidade) : 0);
    if (percentual === 0 && totalItens > 0) {
      percentual = Number(((itensConformes / totalItens) * 100).toFixed(1));
    }

    let classificacao: DtoRegistro['classificacao'] = 'conforme';
    if (percentual < 75) {
      classificacao = 'critico';
    } else if (percentual < 90) {
      classificacao = 'atencao';
    }

    return {
      id: raw.id || `dto-${opConfig.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      data,
      hora,
      dataHoraISO,
      operacaoId: opConfig.id,
      operacaoNome: opConfig.nome,
      motivoDto,
      metaEsperada: raw.metaEsperada || undefined,
      resultadoRealizado: raw.resultadoRealizado || undefined,
      indicadorOfensor: raw.indicadorOfensor || undefined,
      avaliadorNome: raw.avaliador || raw.avaliadorNome || 'Avaliador DPO',
      avaliadorCargo: raw.avaliadorCargo || 'Supervisor DPO',
      colaboradorNome: raw.colaboradorAvaliado || raw.colaboradorNome || 'Colaborador',
      colaboradorMatricula: raw.colaboradorMatricula || undefined,
      turno,
      linhaOuBox: raw.posto || raw.linhaOuBox || undefined,
      respostas,
      totalItens,
      itensConformes,
      itensNaoConformes,
      percentualConformidade: percentual,
      classificacao,
      observacaoGeral: raw.parecerFinal || raw.observacaoGeral || undefined,
      planoAcao: raw.planoAcao || undefined,
      criadoEm: raw.registradoEm || raw.criadoEm || new Date().toISOString()
    };
  }

  /**
   * Retrieves all registered DTOs from storage, guaranteeing the official monthly DTOs (Repack & Despejo) plus any custom registrations
   */
  static getHistorico(empresaId?: string): DtoRegistro[] {
    const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
    const key = companyId ? `${DTO_STORAGE_KEY}_${companyId}` : DTO_STORAGE_KEY;

    // Seed map with official initial DTOs (16 monthly records for Repack and Despejo)
    const map = new Map<string, DtoRegistro>();
    if (INITIAL_DTO_HISTORICO_MOCK && INITIAL_DTO_HISTORICO_MOCK.length > 0) {
      INITIAL_DTO_HISTORICO_MOCK.forEach(r => {
        map.set(r.id, { ...r, empresaId: companyId });
      });
    }

    try {
      // Check company-specific key
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((r: DtoRegistro) => {
            if (r && r.id && !['dto-reg-101', 'dto-reg-102', 'dto-reg-103'].includes(r.id)) {
              map.set(r.id, { ...r, empresaId: companyId });
            }
          });
        }
      }

      // Check global key
      if (key !== DTO_STORAGE_KEY) {
        const globalData = localStorage.getItem(DTO_STORAGE_KEY);
        if (globalData) {
          const parsed = JSON.parse(globalData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((r: DtoRegistro) => {
              if (r && r.id && !['dto-reg-101', 'dto-reg-102', 'dto-reg-103'].includes(r.id)) {
                map.set(r.id, { ...r, empresaId: companyId });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico DTO do localStorage:', e);
    }

    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.dataHoraISO || b.criadoEm || b.data || 0).getTime() - new Date(a.dataHoraISO || a.criadoEm || a.data || 0).getTime()
    );

    try {
      localStorage.setItem(key, JSON.stringify(result));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(result));
    } catch {}

    return result;
  }

  /**
   * Seeds the official monthly DTOs for Repack and Despejo (2026-01 to 2026-08)
   */
  static seedMonthlyRepackAndDespejoDtos(empresaId?: string): { success: boolean; count: number } {
    try {
      const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
      const existing = this.getHistorico(companyId);
      
      // Merge or replace by ID
      const map = new Map<string, DtoRegistro>();
      existing.forEach(r => map.set(r.id, r));
      INITIAL_DTO_HISTORICO_MOCK.forEach(r => {
        map.set(r.id, { ...r, empresaId: companyId });
      });

      const mergedList = Array.from(map.values()).sort(
        (a, b) => new Date(b.dataHoraISO).getTime() - new Date(a.dataHoraISO).getTime()
      );

      const key = companyId ? `${DTO_STORAGE_KEY}_${companyId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(mergedList));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(mergedList));

      // Sync with Firestore
      firestoreDb.batchUpsert('dto_diagnosticos', mergedList, companyId).catch(err => {
        console.warn('Erro ao sincronizar DTOs no Firestore:', err);
      });

      window.dispatchEvent(new CustomEvent('dto_historico_updated'));
      return { success: true, count: INITIAL_DTO_HISTORICO_MOCK.length };
    } catch (e) {
      console.error('Erro ao popular DTOs mensais de Repack e Despejo:', e);
      return { success: false, count: 0 };
    }
  }

  /**
   * Saves a new DTO registration
   */
  static saveRegistro(registro: DtoRegistro, empresaId?: string): boolean {
    try {
      const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
      const currentList = this.getHistorico(companyId);
      // If already exists (edit), replace it; otherwise add to start
      const existingIdx = currentList.findIndex(r => r.id === registro.id);
      let updated: DtoRegistro[];
      if (existingIdx >= 0) {
        updated = [...currentList];
        updated[existingIdx] = registro;
      } else {
        updated = [registro, ...currentList];
      }

      const key = companyId ? `${DTO_STORAGE_KEY}_${companyId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(updated));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(updated));

      // Persist to Firestore
      firestoreDb.batchUpsert('dto_diagnosticos', updated, companyId).catch(err => {
        console.warn('Erro ao salvar DTO no Firestore:', err);
      });

      // Trigger custom event so other components update if needed
      window.dispatchEvent(new CustomEvent('dto_historico_updated', { detail: registro }));
      return true;
    } catch (e) {
      console.error('Erro ao salvar registro DTO:', e);
      return false;
    }
  }

  /**
   * Deletes a DTO registration
   */
  static deleteRegistro(registroId: string, empresaId?: string): boolean {
    try {
      const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
      const currentList = this.getHistorico(companyId);
      const filtered = currentList.filter(r => r.id !== registroId);
      const key = companyId ? `${DTO_STORAGE_KEY}_${companyId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(filtered));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(filtered));

      // Delete from Firestore
      firestoreDb.delete('dto_diagnosticos', registroId, companyId).catch(err => {
        console.warn('Erro ao excluir DTO do Firestore:', err);
      });

      window.dispatchEvent(new CustomEvent('dto_historico_updated', { detail: { deletedId: registroId } }));
      return true;
    } catch (e) {
      console.error('Erro ao excluir registro DTO:', e);
      return false;
    }
  }

  /**
   * Clears all DTOs completely (both locally and on Firestore)
   */
  static clearAll(empresaId?: string): void {
    const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
    const key = companyId ? `${DTO_STORAGE_KEY}_${companyId}` : DTO_STORAGE_KEY;
    localStorage.removeItem(key);
    localStorage.removeItem(DTO_STORAGE_KEY);
    localStorage.setItem(key, JSON.stringify([]));
    localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify([]));

    // Also remove legacy mock items from Firestore
    ['dto-reg-101', 'dto-reg-102', 'dto-reg-103'].forEach(mockId => {
      firestoreDb.delete('dto_diagnosticos', mockId, companyId).catch(() => {});
    });

    window.dispatchEvent(new CustomEvent('dto_historico_updated'));
  }

  /**
   * Clears all DTOs
   */
  static resetToDefault(empresaId?: string): void {
    this.clearAll(empresaId);
  }

  /**
   * Exports all DTOs as JSON file
   */
  static exportToJson(empresaId?: string): void {
    const list = this.getHistorico(empresaId);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(list, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DTO_Historico_Diagnosticos_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  /**
   * Imports DTOs from JSON (array, single object, or JSON string)
   */
  static importFromJson(jsonData: any, empresaId?: string): { success: boolean; count: number; error?: string } {
    try {
      let parsed = jsonData;
      if (typeof jsonData === 'string') {
        parsed = JSON.parse(jsonData);
      }

      const rawItems = Array.isArray(parsed) ? parsed : [parsed];
      if (rawItems.length === 0) {
        return { success: false, count: 0, error: 'Nenhum registro encontrado no arquivo JSON.' };
      }

      const normalizedList: DtoRegistro[] = [];
      for (const item of rawItems) {
        if (item && typeof item === 'object') {
          const normalized = this.parseAndNormalizeDto(item);
          normalizedList.push(normalized);
        }
      }

      if (normalizedList.length === 0) {
        return { success: false, count: 0, error: 'Não foi possível processar os registros fornecidos.' };
      }

      const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
      const current = this.getHistorico(companyId);

      // Merge avoiding duplicates by id (newer imported overwrite existing with same id)
      const map = new Map<string, DtoRegistro>();
      current.forEach(item => map.set(item.id, item));
      normalizedList.forEach(item => map.set(item.id, item));

      const merged = Array.from(map.values()).sort((a, b) => new Date(b.dataHoraISO || b.criadoEm).getTime() - new Date(a.dataHoraISO || a.criadoEm).getTime());
      
      const key = companyId ? `${DTO_STORAGE_KEY}_${companyId}` : DTO_STORAGE_KEY;
      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem(DTO_STORAGE_KEY, JSON.stringify(merged));

      // Persist to Firestore
      firestoreDb.batchUpsert('dto_diagnosticos', merged, companyId).catch(err => {
        console.warn('Erro ao sincronizar DTOs importados no Firestore:', err);
      });

      window.dispatchEvent(new CustomEvent('dto_historico_updated', { detail: { importedCount: normalizedList.length } }));
      return { success: true, count: normalizedList.length };
    } catch (e: any) {
      console.error('Erro ao importar JSON DTO:', e);
      return { success: false, count: 0, error: e?.message || 'Falha ao processar arquivo JSON.' };
    }
  }

  /**
   * Computes statistics for dashboard
   */
  static getEstatisticas(empresaId?: string) {
    const list = this.getHistorico(empresaId);
    const total = list.length;
    if (total === 0) {
      return {
        total: 0,
        mediaConformidade: 0,
        criticosCount: 0,
        atencaoCount: 0,
        conformesCount: 0,
        metaNaoBatidaCount: 0,
        planosAcaoAbertos: 0,
        porOperacao: {} as Record<DtoOperacaoId, { count: number; media: number }>
      };
    }

    const somaPercentuais = list.reduce((acc, curr) => acc + curr.percentualConformidade, 0);
    const mediaConformidade = Number((somaPercentuais / total).toFixed(1));

    const criticosCount = list.filter(r => r.classificacao === 'critico').length;
    const atencaoCount = list.filter(r => r.classificacao === 'atencao').length;
    const conformesCount = list.filter(r => r.classificacao === 'conforme').length;
    const metaNaoBatidaCount = list.filter(r => r.motivoDto === 'meta_nao_batida').length;
    const planosAcaoAbertos = list.filter(r => r.planoAcao && r.planoAcao.status !== 'concluido').length;

    // Per operation breakdown
    const porOperacao: Record<string, { count: number; soma: number; media: number }> = {};
    list.forEach(r => {
      if (!porOperacao[r.operacaoId]) {
        porOperacao[r.operacaoId] = { count: 0, soma: 0, media: 0 };
      }
      porOperacao[r.operacaoId].count += 1;
      porOperacao[r.operacaoId].soma += r.percentualConformidade;
    });

    Object.keys(porOperacao).forEach(opId => {
      const item = porOperacao[opId];
      item.media = Number((item.soma / item.count).toFixed(1));
    });

    return {
      total,
      mediaConformidade,
      criticosCount,
      atencaoCount,
      conformesCount,
      metaNaoBatidaCount,
      planosAcaoAbertos,
      porOperacao
    };
  }
}
