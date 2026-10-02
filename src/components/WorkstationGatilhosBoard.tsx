import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ShieldAlert,
  AlertTriangle,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Boxes,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  RefreshCw,
  Target,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  PackageCheck,
  Trash2,
  Calendar,
  Layers,
  Truck,
  ShieldCheck,
  RotateCcw,
  Calculator,
  Info,
  HelpCircle,
  X,
  Sparkles,
  Award,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { useSystemTargets } from '../utils/useSystemTargets';
import {
  calcularGatilhosOperacionaisCompletos,
  IndicadorGatilhoCalculado,
  CategoriaGatilho
} from '../utils/workstationGatilhosAnalytics';

interface WorkstationGatilhosBoardProps {
  user: any;
  empresaId?: string;
  onNavigateToAcoes?: () => void;
}

export interface DesvioDiarioItem {
  id: string;
  dataISO: string;
  dataStr: string;
  indicadorId: string;
  indicadorNome: string;
  valorApurado: number;
  limiteGatilho: number;
  unidade: string;
  turno: string;
  equipeResponsavel: string;
  colaboradorEnvolvido?: string;
  causaAnomalia: string;
  statusAcao: 'PENDENTE' | 'EM_ANALISE' | 'CONCLUIDO';
  planoAcaoDesc?: string;
  registradoPor: string;
  registradoEm: string;
}

export const WorkstationGatilhosBoard: React.FC<WorkstationGatilhosBoardProps> = ({
  user,
  empresaId = 'demo',
  onNavigateToAcoes
}) => {
  const { targets } = useSystemTargets(empresaId);
  const empresaData = useEmpresaData();

  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODOS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [diasUteisParam, setDiasUteisParam] = useState<number>(26);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Ouvintes de eventos para recálculo automático em tempo real quando qualquer dashboard for atualizado
  useEffect(() => {
    const handlePlatformDataUpdated = () => {
      setRefreshTick((t) => t + 1);
    };

    window.addEventListener('quebras-db-updated', handlePlatformDataUpdated);
    window.addEventListener('repack-updated', handlePlatformDataUpdated);
    window.addEventListener('despejo-updated', handlePlatformDataUpdated);
    window.addEventListener('wlp-updated', handlePlatformDataUpdated);
    window.addEventListener('storage', handlePlatformDataUpdated);

    return () => {
      window.removeEventListener('quebras-db-updated', handlePlatformDataUpdated);
      window.removeEventListener('repack-updated', handlePlatformDataUpdated);
      window.removeEventListener('despejo-updated', handlePlatformDataUpdated);
      window.removeEventListener('wlp-updated', handlePlatformDataUpdated);
      window.removeEventListener('storage', handlePlatformDataUpdated);
    };
  }, []);

  // Modal para visualização e impressão do relatório mensal formatado
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState<boolean>(false);

  // Modal para detalhamento analítico sênior
  const [drilldownIndicador, setDrilldownIndicador] = useState<IndicadorGatilhoCalculado | null>(null);

  // Modal para registro de anomalia / desvio
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newDesvioIndicadorId, setNewDesvioIndicadorId] = useState<string>('quebras_armazem_movimentacao');
  const [newDesvioValor, setNewDesvioValor] = useState<string>('');
  const [newDesvioTurno, setNewDesvioTurno] = useState<string>('Turno 1');
  const [newDesvioEquipe, setNewDesvioEquipe] = useState<string>('Armazém - Operacional');
  const [newDesvioColab, setNewDesvioColab] = useState<string>('');
  const [newDesvioCausa, setNewDesvioCausa] = useState<string>('');
  const [newDesvioPlano, setNewDesvioPlano] = useState<string>('');

  // Lista de Desvios Registrados (LocalStorage)
  const [desviosDiariosList, setDesviosDiariosList] = useState<DesvioDiarioItem[]>(() => {
    const key = `workstation_gatilhos_desvios_v2_${empresaId}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      {
        id: 'desv-01',
        dataISO: '2026-08-28',
        dataStr: '28/08/2026',
        indicadorId: 'wqi_quebras',
        indicadorNome: 'Qualidade & WQI (Quebras Diárias)',
        valorApurado: 1.45,
        limiteGatilho: 1.32,
        unidade: 'HL/dia',
        turno: 'Turno 2',
        equipeResponsavel: 'Armazém / Puxada',
        colaboradorEnvolvido: 'Equipe Puxada T2',
        causaAnomalia: 'Avaria mecânica por instabilidade de pallet misto durante o descarregamento da carreta #18',
        statusAcao: 'EM_ANALISE',
        planoAcaoDesc: 'Reforçar enfitamento de segurança e fiscalizar velocidade máxima da empilhadeira no pátio',
        registradoPor: 'Analista de Dados & Qualidade',
        registradoEm: '2026-08-28T15:30:00Z'
      }
    ];
  });

  const saveDesvios = (updated: DesvioDiarioItem[]) => {
    setDesviosDiariosList(updated);
    localStorage.setItem(`workstation_gatilhos_desvios_v2_${empresaId}`, JSON.stringify(updated));
  };

  // =========================================================================
  // MOTOR ANALÍTICO DINÂMICO 100% CORRELACIONADO AOS DASHBOARDS E METAS
  // Regra do Usuário: Limite de Gatilho = Média Diária + 10% (Acumulado Mês / Dias Úteis)
  // =========================================================================
  const indicadoresList: IndicadorGatilhoCalculado[] = useMemo(() => {
    return calcularGatilhosOperacionaisCompletos(
      empresaId,
      empresaData,
      targets,
      diasUteisParam
    );
  }, [empresaId, empresaData, targets, diasUteisParam, refreshTick]);

  // Contagem de desvios por indicador
  const indicadoresComDesvios = useMemo(() => {
    return indicadoresList.map((ind) => {
      const count = desviosDiariosList.filter((d) => d.indicadorId === ind.id).length;
      return { ...ind, desviosCount: count };
    });
  }, [indicadoresList, desviosDiariosList]);

  // Filtros aplicados
  const filteredIndicadores = useMemo(() => {
    return indicadoresComDesvios.filter((ind) => {
      const matchCat = selectedCategoria === 'TODOS' || ind.categoria === selectedCategoria;
      const matchStatus =
        selectedStatusFilter === 'TODOS' || ind.status === selectedStatusFilter;
      const matchSearch =
        ind.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.responsavelArea.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ind.descricaoIndicador.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [indicadoresComDesvios, selectedCategoria, selectedStatusFilter, searchTerm]);

  // Totais e KPIs de conformidade
  const totalIndicadores = indicadoresList.length;
  const gatilhosDisparados = indicadoresList.filter((i) => i.status === 'DISPARADO').length;
  const gatilhosAlerta = indicadoresList.filter((i) => i.status === 'ALERTA').length;
  const gatilhosNormais = indicadoresList.filter((i) => i.status === 'NORMAL').length;
  const taxaConformidade = Math.round(((gatilhosNormais + gatilhosAlerta) / (totalIndicadores || 1)) * 1000) / 10;

  const handleCriarDesvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesvioCausa.trim()) {
      alert('Por favor, informe a causa identificada para a anomalia.');
      return;
    }

    const indObj = indicadoresList.find((i) => i.id === newDesvioIndicadorId);
    const val = parseFloat(newDesvioValor) || (indObj ? indObj.valorHoje : 0);

    const nowIso = new Date().toISOString().split('T')[0];
    const parts = nowIso.split('-');
    const nowStr = `${parts[2]}/${parts[1]}/${parts[0]}`;

    const newRecord: DesvioDiarioItem = {
      id: `desv-${Date.now()}`,
      dataISO: nowIso,
      dataStr: nowStr,
      indicadorId: newDesvioIndicadorId,
      indicadorNome: indObj ? indObj.nome : 'Indicador Operacional',
      valorApurado: val,
      limiteGatilho: indObj ? indObj.limiteGatilho : 0,
      unidade: indObj ? indObj.unidade : '',
      turno: newDesvioTurno,
      equipeResponsavel: newDesvioEquipe,
      colaboradorEnvolvido: newDesvioColab.trim() || undefined,
      causaAnomalia: newDesvioCausa.trim(),
      statusAcao: 'PENDENTE',
      planoAcaoDesc: newDesvioPlano.trim() || undefined,
      registradoPor: user?.nome || 'Analista de Operações',
      registradoEm: new Date().toISOString()
    };

    saveDesvios([newRecord, ...desviosDiariosList]);

    // Reset formulário
    setNewDesvioCausa('');
    setNewDesvioPlano('');
    setNewDesvioColab('');
    setNewDesvioValor('');
    setIsModalOpen(false);
  };

  const handleUpdateStatusDesvio = (
    id: string,
    newStatus: 'PENDENTE' | 'EM_ANALISE' | 'CONCLUIDO'
  ) => {
    const updated = desviosDiariosList.map((d) =>
      d.id === id ? { ...d, statusAcao: newStatus } : d
    );
    saveDesvios(updated);
  };

  const handleDeleteDesvio = (id: string) => {
    if (window.confirm('Deseja realmente remover este registro de anomalia?')) {
      const updated = desviosDiariosList.filter((d) => d.id !== id);
      saveDesvios(updated);
    }
  };

  // =========================================================================
  // EXPORTAÇÃO COMPLETA DO RELATÓRIO DE GATILHOS DETALHADO DO MÊS (EXCEL & CSV)
  // =========================================================================
  const exportGatilhosExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // 1. Aba Resumo Executivo
      const resumoData = [
        ['PAU BRASIL DISTRIBUIDORA - UNIDADE GUARABIRA'],
        ['RELATÓRIO MENSAL DE GATILHOS E DESVIOS OPERACIONAIS (WORKSTATION DPO)'],
        ['Data da Emissão:', new Date().toLocaleString('pt-BR')],
        ['Responsável / Usuário:', user?.nome || 'Analista de Operações DPO'],
        ['Regra Mestra do Gatilho:', `Limite de Gatilho = Média Diária + 10% (Acumulado Mês ÷ ${diasUteisParam} Dias Úteis)`],
        [],
        ['KPIS DE CONFORMIDADE OPERACIONAL'],
        ['Total de Indicadores Monitorados:', totalIndicadores],
        ['Gatilhos Sob Controle (Verde):', gatilhosNormais],
        ['Gatilhos em Alerta (Amarelo):', gatilhosAlerta],
        ['Gatilhos Disparados / Desvios Reais (Vermelho):', gatilhosDisparados],
        ['Taxa Global de Conformidade:', `${taxaConformidade}%`]
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo_Executivo');

      // 2. Aba Matriz Completa dos Gatilhos
      const matrizRows = indicadoresList.map((ind) => ({
        'Código': ind.codigo,
        'Indicador': ind.nome,
        'Categoria': ind.categoria,
        'Diretriz da Meta': ind.isMenorMelhor ? 'Minimizar (Menor é Melhor)' : 'Maximizar (Maior é Melhor)',
        'Acumulado Mês': ind.detalhes.acumuladoMesFormatado,
        'Dias Úteis': ind.detalhes.diasUteis,
        'Média Diária Base': ind.detalhes.mediaDiariaFormatada,
        'Limite Gatilho (+10%)': `${ind.limiteGatilho} ${ind.unidade}`,
        'Apurado Hoje (Real)': `${ind.valorHoje} ${ind.unidade}`,
        'Delta vs Limite (%)': ind.detalhes.deltaPctFormatado,
        'Status Gatilho': ind.status === 'DISPARADO' ? 'DISPARADO (DESVIO REAL)' : ind.status === 'ALERTA' ? 'ALERTA' : 'SOB CONTROLE',
        'Meta Oficial': ind.metaPlataforma,
        'Responsável': ind.responsavelArea,
        'Desvios Registrados': ind.desviosCount || 0,
        'Diagnóstico do Analista': ind.detalhes.diagnosticoAnalista,
        'Fonte dos Dados': ind.detalhes.fonteDados
      }));
      const wsMatriz = XLSX.utils.json_to_sheet(matrizRows);
      XLSX.utils.book_append_sheet(wb, wsMatriz, 'Matriz_Gatilhos');

      // 3. Aba Histórico de Desvios Registrados
      const desviosRows = desviosDiariosList.map((d) => ({
        'ID Registro': d.id,
        'Data': d.dataStr,
        'Indicador': d.indicadorNome,
        'Valor Apurado': `${d.valorApurado} ${d.unidade}`,
        'Limite Gatilho': `${d.limiteGatilho} ${d.unidade}`,
        'Turno': d.turno,
        'Equipe / Setor': d.equipeResponsavel,
        'Colaborador / Equipamento': d.colaboradorEnvolvido || 'N/A',
        'Causa Raiz Identificada': d.causaAnomalia,
        'Plano de Ação D0 (Contenção)': d.planoAcaoDesc || 'N/A',
        'Status Tratativa': d.statusAcao,
        'Registrado Por': d.registradoPor,
        'Registrado Em': d.registradoEm
      }));
      const wsDesvios = XLSX.utils.json_to_sheet(desviosRows);
      XLSX.utils.book_append_sheet(wb, wsDesvios, 'Historico_Desvios');

      const fileName = `Relatorio_Gatilhos_Desvios_Mensal_DPO_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      alert('Ocorreu um erro ao exportar para Excel. Tente o formato CSV.');
    }
  };

  const exportGatilhosCSV = () => {
    try {
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += 'PAU BRASIL DISTRIBUIDORA - RELATORIO MENSAL DE GATILHOS E DESVIOS OPERACIONAIS (WORKSTATION DPO)\n';
      csv += `Emitido em:;${new Date().toLocaleString('pt-BR')};Usuario:;${user?.nome || 'Analista DPO'}\n`;
      csv += `Regra Mestra:;Limite de Gatilho = Media Diaria + 10% (Acumulado Mes / ${diasUteisParam} Dias Uteis)\n`;
      csv += `Conformidade Geral:;${taxaConformidade}%;Gatilhos Disparados:;${gatilhosDisparados};Alerta:;${gatilhosAlerta};Sob Controle:;${gatilhosNormais}\n\n`;

      csv += 'CODIGO;INDICADOR;CATEGORIA;DIRECAO_META;ACUMULADO_MES;DIAS_UTEIS;MEDIA_DIARIA;LIMITE_GATILHO_10PCT;APURADO_HOJE;DELTA_PCT;STATUS;RESPONSAVEL;FONTE_DADOS;DIAGNOSTICO\n';

      indicadoresList.forEach((ind) => {
        const row = [
          `"${ind.codigo}"`,
          `"${ind.nome.replace(/"/g, '""')}"`,
          `"${ind.categoria}"`,
          `"${ind.isMenorMelhor ? 'Minimizar' : 'Maximizar'}"`,
          `"${ind.detalhes.acumuladoMesFormatado}"`,
          ind.detalhes.diasUteis,
          `"${ind.detalhes.mediaDiariaFormatada}"`,
          `"${ind.limiteGatilho} ${ind.unidade}"`,
          `"${ind.valorHoje} ${ind.unidade}"`,
          `"${ind.detalhes.deltaPctFormatado}"`,
          `"${ind.status}"`,
          `"${ind.responsavelArea}"`,
          `"${ind.detalhes.fonteDados}"`,
          `"${ind.detalhes.diagnosticoAnalista.replace(/"/g, '""')}"`
        ];
        csv += row.join(';') + '\n';
      });

      csv += '\n\nHISTORICO DE DESVIOS E ANOMALIAS REGISTRADAS\n';
      csv += 'DATA;INDICADOR;VALOR_APURADO;LIMITE_GATILHO;TURNO;EQUIPE;COLABORADOR;CAUSA_RAIZ;PLANO_CONTENCAO;STATUS_TRATATIVA;REGISTRADO_POR\n';

      desviosDiariosList.forEach((d) => {
        const row = [
          `"${d.dataStr}"`,
          `"${d.indicadorNome.replace(/"/g, '""')}"`,
          `"${d.valorApurado} ${d.unidade}"`,
          `"${d.limiteGatilho} ${d.unidade}"`,
          `"${d.turno}"`,
          `"${d.equipeResponsavel}"`,
          `"${(d.colaboradorEnvolvido || 'N/A').replace(/"/g, '""')}"`,
          `"${d.causaAnomalia.replace(/"/g, '""')}"`,
          `"${(d.planoAcaoDesc || 'N/A').replace(/"/g, '""')}"`,
          `"${d.statusAcao}"`,
          `"${d.registradoPor}"`
        ];
        csv += row.join(';') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Relatorio_Gatilhos_Desvios_Mensal_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao exportar CSV:', err);
    }
  };

  return (
    <div id="workstation-gatilhos-container" className="space-y-6">
      {/* BANNER PRINCIPAL DO QUADRO DE GATILHOS WORKSTATION */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-[#031d3d] dark:via-[#092b52] dark:to-[#0f172a] border-2 border-amber-500/40 p-6 rounded-2xl text-slate-900 dark:text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-48 h-48 text-amber-500 dark:text-amber-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-500 dark:text-amber-400 shadow-inner">
                <Calculator className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    ANÁLISE SÊNIOR DE DADOS • WORKSTATION DPO
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                    Correlação 100% com Dashboards Oficiais
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5 flex items-center gap-2">
                  Quadro de Gatilhos & Desvios Operacionais Reais
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Seletor de Dias Úteis para a Regra de Média Diária */}
              <div className="flex items-center gap-2 bg-white dark:bg-[#081326] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Dias Úteis Mês:</span>
                <select
                  value={diasUteisParam}
                  onChange={(e) => setDiasUteisParam(Number(e.target.value))}
                  className="bg-transparent text-xs font-black text-amber-600 dark:text-amber-400 focus:outline-none cursor-pointer"
                >
                  <option value={26} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">26 dias (Seg-Sáb Ambev)</option>
                  <option value={22} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">22 dias (Seg-Sex Padrão)</option>
                  <option value={20} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">20 dias</option>
                  <option value={30} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">30 dias (Operação Contínua)</option>
                </select>
              </div>

              {/* Botões de Exportação e Relatório Mensal */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#081326] p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button
                  type="button"
                  onClick={exportGatilhosExcel}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Exportar Relatório Detalhado em Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excel</span>
                </button>

                <button
                  type="button"
                  onClick={exportGatilhosCSV}
                  className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Exportar Relatório em Formato CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMonthlyReportModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Visualizar e Imprimir Relatório Mensal"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Relatório</span>
                </button>
              </div>

              {onNavigateToAcoes && (
                <button
                  type="button"
                  onClick={onNavigateToAcoes}
                  className="px-4 py-2.5 bg-white dark:bg-[#0b1222] hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 transition-all cursor-pointer flex items-center gap-2 shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>Planos DPO</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Registrar Desvio</span>
              </button>
            </div>
          </div>

          {/* FÓRMULA MESTRA EXPLICADA */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-amber-700 dark:text-amber-300 uppercase tracking-wide block">
                  Regra Estatística dos Gatilhos Operacionais:
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Limite de Gatilho = Média + 10%</strong>. Quebras de Movimentação calculam a{' '}
                  <strong>Média Diária Anual sobre todos os 312 dias úteis do ano</strong>. <strong>TMR (Tempo Médio de Revenda)</strong> possui meta de <strong>150 min</strong> com gatilho em <strong>1h40 (100 min)</strong> para descarregar e carregar carretas. <strong>Ressuprimento & Reabastecimento no Carregamento</strong> dispara se <strong>ultrapassar 20%</strong>.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-lg border border-amber-500/30 shrink-0">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Auditoria Senior: <strong className="text-emerald-600 dark:text-emerald-400">{taxaConformidade}% Sob Controle</strong>
              </span>
            </div>
          </div>

          {/* KPIS RESUMO DOS GATILHOS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 bg-white/80 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block">
                  Indicadores Analisados
                </span>
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{totalIndicadores}</span>
              </div>
              <BarChart3 className="w-7 h-7 text-sky-500 dark:text-sky-400" />
            </div>

            <div className="p-3.5 bg-white/80 dark:bg-[#081326] border border-emerald-500/30 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block">
                  Sob Controle
                </span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{gatilhosNormais}</span>
              </div>
              <CheckCircle2 className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
            </div>

            <div className="p-3.5 bg-white/80 dark:bg-[#081326] border border-amber-500/30 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block">
                  Em Alerta (±5%)
                </span>
                <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{gatilhosAlerta}</span>
              </div>
              <Activity className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            </div>

            <div className="p-3.5 bg-white/80 dark:bg-[#081326] border border-rose-500/40 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider block">
                  Gatilhos Disparados (Real)
                </span>
                <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">{gatilhosDisparados}</span>
              </div>
              <AlertTriangle className="w-7 h-7 text-rose-500 dark:text-rose-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* PAINEL DE CONTROLES E FILTROS DE CATEGORIAS MEDIDAS */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por indicador (Quebras Movimentação, Despejo, WLP, PNP, Repack, Reabastecimento Carregamento, TMR...)"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          {/* Filtro por Status do Gatilho */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase shrink-0">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="NORMAL">✅ Sob Controle</option>
              <option value="ALERTA">⚠️ Em Alerta</option>
              <option value="DISPARADO">🚨 Gatilho Disparado (Desvio Real)</option>
            </select>
          </div>
        </div>

        {/* Abas de Categorias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 dark:border-slate-800/80 pt-3">
          {[
            { id: 'TODOS', label: 'Todos os Pilares', icon: Layers },
            { id: 'WLP', label: 'WLP Geral', icon: Activity },
            { id: 'PNP', label: 'PNP Operacional', icon: Users },
            { id: 'REPACK', label: 'Repack', icon: PackageCheck },
            { id: 'DESPEJO', label: 'Despejo & Refugo', icon: Trash2 },
            { id: 'ESTOQUE', label: 'Estoque & Quebras', icon: Boxes },
            { id: 'FROTA_ROTAS', label: 'TMR (Carga/Descarga)', icon: Truck },
            { id: 'ABASTECIMENTO', label: 'Reabastecimento no Carregamento', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategoria === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategoria(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-slate-100 dark:bg-[#0b1222] text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID DE CARDS DOS INDICADORES E GATILHOS CALCULADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredIndicadores.map((ind) => {
          const isDisparado = ind.status === 'DISPARADO';
          const isAlerta = ind.status === 'ALERTA';

          return (
            <div
              key={ind.id}
              onClick={() => setDrilldownIndicador(ind)}
              className={`bg-white dark:bg-[#111a30] rounded-2xl p-5 border transition-all duration-200 hover:shadow-2xl cursor-pointer relative group flex flex-col justify-between ${
                isDisparado
                  ? 'border-rose-500/80 bg-rose-500/[0.03] shadow-rose-500/10'
                  : isAlerta
                  ? 'border-amber-500/60 bg-amber-500/[0.02] shadow-amber-500/5'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                        {ind.codigo}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        {ind.responsavelArea}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1 group-hover:text-amber-500 transition-colors">
                      {ind.nome}
                    </h3>
                  </div>

                  {/* Badge de Status */}
                  <div className="shrink-0">
                    {isDisparado ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Gatilho Disparado
                      </span>
                    ) : isAlerta ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        <Activity className="w-3.5 h-3.5" />
                        Em Alerta
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sob Controle
                      </span>
                    )}
                  </div>
                </div>

                {/* Métricas Principais (Apurado Hoje vs Limite do Gatilho) */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-50 dark:bg-[#0b1222] rounded-xl border border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                      Apurado Hoje
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-xl font-black font-mono ${
                          isDisparado
                            ? 'text-rose-600 dark:text-rose-400'
                            : isAlerta
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {ind.valorHoje}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {ind.unidade}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-black uppercase block flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Limite Gatilho
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                        {ind.limiteGatilho}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        {ind.unidade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caixa de Fórmula da Média Diária + 10% */}
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 mb-3 bg-white dark:bg-[#081326] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Acumulado Mês:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ind.detalhes.acumuladoMesFormatado}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Média Diária ({ind.detalhes.diasUteis} dias):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {ind.detalhes.mediaDiariaFormatada}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Meta da Plataforma:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {ind.metaPlataforma}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer do Card */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-amber-500" />
                  Ver memória de cálculo
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                  Detalhes <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* REGISTRO DE DESVIOS DIÁRIOS / ANOMALIAS DA OPERAÇÃO */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                AUDITORIA DE ANOMALIAS
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Tratativas Rápidas D0</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5">
              Histórico de Desvios Registrados nos Gatilhos
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Anomalia</span>
          </button>
        </div>

        {desviosDiariosList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-sm">Nenhum desvio diário pendente de tratativa!</p>
            <p className="text-xs">Todos os gatilhos operacionais estão em conformidade com as metas do sistema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Indicador / Gatilho</th>
                  <th className="py-3 px-3">Apurado vs Limite</th>
                  <th className="py-3 px-3">Turno / Equipe</th>
                  <th className="py-3 px-3">Causa da Anomalia</th>
                  <th className="py-3 px-3">Status Tratativa</th>
                  <th className="py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {desviosDiariosList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {item.dataStr}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {item.indicadorNome}
                      </span>
                      {item.colaboradorEnvolvido && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Colab: {item.colaboradorEnvolvido}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {item.valorApurado} {item.unidade}
                      </span>{' '}
                      <span className="text-slate-400 text-[10px]">
                        (Gatilho: {item.limiteGatilho} {item.unidade})
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block">
                        {item.turno}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.equipeResponsavel}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs text-slate-700 dark:text-slate-300">
                      {item.causaAnomalia}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={item.statusAcao}
                        onChange={(e) =>
                          handleUpdateStatusDesvio(
                            item.id,
                            e.target.value as 'PENDENTE' | 'EM_ANALISE' | 'CONCLUIDO'
                          )
                        }
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          item.statusAcao === 'CONCLUIDO'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : item.statusAcao === 'EM_ANALISE'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <option value="PENDENTE">🔴 Pendente D0</option>
                        <option value="EM_ANALISE">🟡 Em Análise</option>
                        <option value="CONCLUIDO">🟢 Concluído / Sanado</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteDesvio(item.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE MEMÓRIA DE CÁLCULO E ANÁLISE SÊNIOR */}
      {drilldownIndicador && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-500">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {drilldownIndicador.codigo} • {drilldownIndicador.categoria}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
                    {drilldownIndicador.nome}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDrilldownIndicador(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Caixa de Fórmula Matemática */}
            <div className="p-4 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                <Target className="w-4 h-4 text-amber-500" />
                <span>Memória de Cálculo do Gatilho</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono leading-relaxed bg-white dark:bg-[#0b1222] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                {drilldownIndicador.detalhes.formulaExplicativa}
              </p>
            </div>

            {/* Grid dos Componentes do Cálculo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-[#081326] rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                  Acumulado no Mês
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {drilldownIndicador.detalhes.acumuladoMesFormatado}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#081326] rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                  Dias Úteis Considerados
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {drilldownIndicador.detalhes.diasUteis} dias
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#081326] rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                  Média Diária
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {drilldownIndicador.detalhes.mediaDiariaFormatada}
                </span>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <span className="text-[10px] text-amber-700 dark:text-amber-300 font-black uppercase block">
                  Limite de Gatilho (+10%)
                </span>
                <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                  {drilldownIndicador.limiteGatilho} {drilldownIndicador.unidade}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#081326] rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                  Apurado Real Hoje
                </span>
                <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1 block">
                  {drilldownIndicador.valorHoje} {drilldownIndicador.unidade}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#081326] rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
                  Delta vs Limite
                </span>
                <span
                  className={`text-sm font-black font-mono mt-1 block ${
                    drilldownIndicador.status === 'DISPARADO'
                      ? 'text-rose-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {drilldownIndicador.detalhes.deltaPctFormatado}
                </span>
              </div>
            </div>

            {/* Parecer do Analista Sênior */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 rounded-2xl space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
                Diagnóstico Analítico:
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {drilldownIndicador.detalhes.diagnosticoAnalista}
              </p>
              <span className="text-[10px] text-slate-400 block pt-1">
                Fonte de Dados Auditada: {drilldownIndicador.detalhes.fonteDados}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDrilldownIndicador(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Fechar
              </button>
              {onNavigateToAcoes && (
                <button
                  type="button"
                  onClick={() => {
                    setDrilldownIndicador(null);
                    onNavigateToAcoes();
                  }}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>Abrir Plano no Quadro DPO</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO MANUAL DE ANOMALIA / DESVIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Registrar Anomalia de Gatilho
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Abertura imediata de contenção D0
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarDesvio} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Indicador do Gatilho
                </label>
                <select
                  value={newDesvioIndicadorId}
                  onChange={(e) => setNewDesvioIndicadorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  {indicadoresList.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.nome} ({ind.unidade}) - Gatilho: {ind.limiteGatilho}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor Apurado na Anomalia
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDesvioValor}
                    onChange={(e) => setNewDesvioValor(e.target.value)}
                    placeholder="Ex: 1.45"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Turno Operacional
                  </label>
                  <select
                    value={newDesvioTurno}
                    onChange={(e) => setNewDesvioTurno(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Turno 1">Turno 1 (Manhã)</option>
                    <option value="Turno 2">Turno 2 (Tarde/Noite)</option>
                    <option value="Turno 3">Turno 3 (Madrugada)</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Equipe / Setor Responsável
                </label>
                <input
                  type="text"
                  value={newDesvioEquipe}
                  onChange={(e) => setNewDesvioEquipe(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Colaborador(es) ou Equipamento (Opcional)
                </label>
                <input
                  type="text"
                  value={newDesvioColab}
                  onChange={(e) => setNewDesvioColab(e.target.value)}
                  placeholder="Ex: Carlos Santos ou Empilhadeira #04"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Causa Raiz Preliminar da Anomalia *
                </label>
                <textarea
                  rows={2}
                  value={newDesvioCausa}
                  onChange={(e) => setNewDesvioCausa(e.target.value)}
                  placeholder="Descreva o que motivou a quebra do limite do gatilho..."
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ação Imediata de Contenção (D0)
                </label>
                <textarea
                  rows={2}
                  value={newDesvioPlano}
                  onChange={(e) => setNewDesvioPlano(e.target.value)}
                  placeholder="Ação executada no momento do disparo para conter o desvio..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Salvar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO E IMPRESSÃO DO RELATÓRIO MENSAL DETALHADO */}
      {isMonthlyReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-5xl w-full shadow-2xl space-y-6 my-6 max-h-[92vh] overflow-y-auto">
            {/* Barra Superior do Relatório */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-500">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Relatório Mensal de Gatilhos & Desvios Operacionais
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pau Brasil Distribuidora • Metodologia DPO e Regra de Média Diária + 10%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={exportGatilhosExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Baixar Excel</span>
                </button>

                <button
                  type="button"
                  onClick={exportGatilhosCSV}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMonthlyReportModalOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo Imprimível do Relatório */}
            <div id="printable-monthly-gatilhos-report" className="space-y-6 text-slate-900 dark:text-white">
              {/* Cabeçalho Corporativo */}
              <div className="p-4 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    PAU BRASIL DISTRIBUIDORA • GUARABIRA
                  </span>
                  <h2 className="text-base font-black uppercase mt-1">
                    Auditoria Mensal de Desvios e Conformidade de Gatilhos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <strong>Regra Estatística:</strong> Limite do Gatilho = Média Diária + 10% Tolerância (Acumulado Mês ÷ {diasUteisParam} Dias Úteis).
                  </p>
                </div>
                <div className="text-left md:text-right text-xs text-slate-500 dark:text-slate-400 shrink-0">
                  <div><strong>Emissão:</strong> {new Date().toLocaleString('pt-BR')}</div>
                  <div><strong>Auditor:</strong> {user?.nome || 'Analista Sênior DPO'}</div>
                  <div><strong>Status Geral:</strong> <span className="text-emerald-500 font-bold">{taxaConformidade}% Conforme</span></div>
                </div>
              </div>

              {/* Grid dos KPIs Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                    Indicadores Totais
                  </span>
                  <span className="text-xl font-black font-mono mt-0.5 block">{totalIndicadores}</span>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                    Sob Controle (Verde)
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {gatilhosNormais}
                  </span>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                    Em Alerta (Amarelo)
                  </span>
                  <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {gatilhosAlerta}
                  </span>
                </div>

                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
                    Desvios Reais (Disparados)
                  </span>
                  <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                    {gatilhosDisparados}
                  </span>
                </div>
              </div>

              {/* Tabela Completa dos Indicadores e Limites */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  1. Matriz de Indicadores e Limites Calculados no Mês
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#081326] text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[9px] border-b border-slate-200 dark:border-slate-800">
                        <th className="py-2 px-3">Cód.</th>
                        <th className="py-2 px-3">Indicador</th>
                        <th className="py-2 px-3">Categoria</th>
                        <th className="py-2 px-3">Acum. Mês</th>
                        <th className="py-2 px-3">Média Diária</th>
                        <th className="py-2 px-3">Limite Gatilho (+10%)</th>
                        <th className="py-2 px-3">Apurado Hoje</th>
                        <th className="py-2 px-3">Delta %</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Responsável</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {indicadoresList.map((ind) => (
                        <tr key={ind.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{ind.codigo}</td>
                          <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">{ind.nome}</td>
                          <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{ind.categoria}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{ind.detalhes.acumuladoMesFormatado}</td>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{ind.detalhes.mediaDiariaFormatada}</td>
                          <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">
                            {ind.limiteGatilho} {ind.unidade}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                            {ind.valorHoje} {ind.unidade}
                          </td>
                          <td className={`py-2 px-3 font-bold ${ind.status === 'DISPARADO' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {ind.detalhes.deltaPctFormatado}
                          </td>
                          <td className="py-2 px-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                              ind.status === 'DISPARADO'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                : ind.status === 'ALERTA'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}>
                              {ind.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{ind.responsavelArea}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabela dos Desvios e Ocorrências Registradas */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  2. Histórico de Anomalias e Contenção D0 do Mês
                </h4>
                {desviosDiariosList.length === 0 ? (
                  <div className="p-4 bg-slate-50 dark:bg-[#081326] border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-500 dark:text-slate-400">
                    Nenhum desvio crítico registrado no período.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#081326] text-slate-600 dark:text-slate-400 uppercase font-black tracking-wider text-[9px] border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 px-3">Data</th>
                          <th className="py-2 px-3">Indicador</th>
                          <th className="py-2 px-3">Apurado vs Limite</th>
                          <th className="py-2 px-3">Turno / Setor</th>
                          <th className="py-2 px-3">Causa da Anomalia</th>
                          <th className="py-2 px-3">Ação D0</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {desviosDiariosList.map((d) => (
                          <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="py-2 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{d.dataStr}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{d.indicadorNome}</td>
                            <td className="py-2 px-3 font-mono text-rose-600 dark:text-rose-400 font-bold">
                              {d.valorApurado} {d.unidade} <span className="text-slate-400 text-[9px] font-normal">(gatilho: {d.limiteGatilho})</span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{d.turno} • {d.equipeResponsavel}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-xs">{d.causaAnomalia}</td>
                            <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-xs">{d.planoAcaoDesc || '—'}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {d.statusAcao}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
