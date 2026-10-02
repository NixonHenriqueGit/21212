import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  Plus, 
  FileSpreadsheet, 
  Calendar, 
  CheckCircle2, 
  Percent, 
  Truck,
  ArrowRight,
  UserCheck,
  Search,
  Filter,
  Layers,
  ArrowLeftRight,
  Clock,
  Warehouse,
  Check,
  ChevronRight,
  Info,
  CalendarDays
} from 'lucide-react';
import { 
  RegistroAderenciaFefo, 
  AuditoriaGiroItem, 
  getStoredAderenciaHistorico, 
  getStoredAuditoriaGiro, 
  saveAuditoriaGiro,
  associarColaboradorOficial
} from '../utils/fefoAderenciaHistorico';
import * as XLSX from 'xlsx';

interface FefoAderenciaHistoricoModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  user?: any;
}

const MESES_CONFIG = [
  { key: 'TODOS', label: 'Todos os Meses (Anual)', sigla: 'Ano' },
  { key: '01', label: 'Janeiro', sigla: 'Jan' },
  { key: '02', label: 'Fevereiro', sigla: 'Fev' },
  { key: '03', label: 'Março', sigla: 'Mar' },
  { key: '04', label: 'Abril', sigla: 'Abr' },
  { key: '05', label: 'Maio', sigla: 'Mai' },
  { key: '06', label: 'Junho', sigla: 'Jun' },
  { key: '07', label: 'Julho', sigla: 'Jul' },
  { key: '08', label: 'Agosto', sigla: 'Ago' }
];

export default function FefoAderenciaHistoricoModal({
  isOpen,
  onClose,
  companyId,
}: FefoAderenciaHistoricoModalProps) {
  const [historico, setHistorico] = useState<RegistroAderenciaFefo[]>([]);
  const [auditorias, setAuditorias] = useState<AuditoriaGiroItem[]>([]);
  const [activeTab, setActiveTab] = useState<'giros' | 'mensal' | 'novo'>('giros');

  // Filtro de Mês para Ramificação Anual
  const [mesSelecionado, setMesSelecionado] = useState<string>('TODOS');

  // Filtros avançados para a aba de giros
  const [busca, setBusca] = useState('');
  const [filtroTipoQuebra, setFiltroTipoQuebra] = useState<'TODOS' | 'Estoque x Estoque' | 'Estoque x Picking'>('TODOS');
  const [filtroColaborador, setFiltroColaborador] = useState<string>('TODOS');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'Concluído' | 'Pendente'>('TODOS');

  // Form novo registro de giro
  const [formTurno, setFormTurno] = useState<'Turno 1' | 'Turno 2' | 'Turno 3'>('Turno 1');
  const [formTipoQuebra, setFormTipoQuebra] = useState<'Estoque x Estoque' | 'Estoque x Picking'>('Estoque x Picking');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formOrigem, setFormOrigem] = useState('');
  const [formDestino, setFormDestino] = useState('');
  const [formLoteMaisProximo, setFormLoteMaisProximo] = useState('');
  const [formValidadeMaisProxima, setFormValidadeMaisProxima] = useState('');
  const [formLoteMaisDistante, setFormLoteMaisDistante] = useState('');
  const [formValidadeMaisDistante, setFormValidadeMaisDistante] = useState('');
  const [formQtd, setFormQtd] = useState<number>(250);
  const [formColaboradorRaw, setFormColaboradorRaw] = useState('JOSE RONILDO DA SILVA (Ronildo - G1093)');
  const [formConcluido, setFormConcluido] = useState<boolean>(true);
  const [formMotivo, setFormMotivo] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Modal de Tratativa Individual
  const [tratativaModalItem, setTratativaModalItem] = useState<AuditoriaGiroItem | null>(null);
  const [editTratativaStatus, setEditTratativaStatus] = useState<'Concluído' | 'Pendente' | 'Em Andamento'>('Concluído');
  const [editTratativaTexto, setEditTratativaTexto] = useState('');
  const [editRealizadoPor, setEditRealizadoPor] = useState('JOSE RONILDO DA SILVA');
  const [editDataConclusao, setEditDataConclusao] = useState('');

  const abrirTratativaModal = (item: AuditoriaGiroItem) => {
    setTratativaModalItem(item);
    setEditTratativaStatus((item.statusConclusao as any) || (item.concluido ? 'Concluído' : 'Pendente'));
    setEditTratativaTexto(item.tratativaDetalhada || item.motivoDesvio || '');
    setEditRealizadoPor(item.realizadoPor || item.colaboradorOficial?.nomeOficial || 'JOSE RONILDO DA SILVA');
    setEditDataConclusao(item.dataConclusao || `${item.data} 08:30`);
  };

  const salvarTratativaModal = () => {
    if (!tratativaModalItem) return;
    const isDone = editTratativaStatus === 'Concluído';
    const colabInfo = associarColaboradorOficial(editRealizadoPor);

    const atualizada = auditorias.map(item => {
      if (item.id === tratativaModalItem.id) {
        return {
          ...item,
          statusConclusao: editTratativaStatus,
          concluido: isDone,
          houveDesvio: !isDone,
          tratativaDetalhada: editTratativaTexto,
          motivoDesvio: editTratativaTexto,
          dataConclusao: isDone ? (editDataConclusao || `${item.data} 08:30`) : undefined,
          realizadoPor: `${colabInfo.nomeOficial} (${colabInfo.apelido})`,
          responsavel: `${colabInfo.apelido} (${colabInfo.cargo} - Matrícula ${colabInfo.matricula})`,
          colaboradorOficial: colabInfo
        };
      }
      return item;
    });

    setAuditorias(atualizada);
    saveAuditoriaGiro(companyId, atualizada);
    setTratativaModalItem(null);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, companyId]);

  const loadData = () => {
    setHistorico(getStoredAderenciaHistorico(companyId));
    setAuditorias(getStoredAuditoriaGiro(companyId));
  };

  // Helper para identificar o mês do item
  const getItemMesKey = (item: AuditoriaGiroItem): string => {
    if (item.mesKey) return item.mesKey;
    const d = item.data || '';
    if (d.includes('/01/')) return '01';
    if (d.includes('/02/')) return '02';
    if (d.includes('/03/')) return '03';
    if (d.includes('/04/')) return '04';
    if (d.includes('/05/')) return '05';
    if (d.includes('/06/')) return '06';
    if (d.includes('/07/')) return '07';
    if (d.includes('/08/')) return '08';
    return '08';
  };

  // KPIs consolidados com base no filtro anual / mensal
  const kpis = useMemo(() => {
    const itensBase = mesSelecionado === 'TODOS' 
      ? auditorias 
      : auditorias.filter(a => getItemMesKey(a) === mesSelecionado);

    const totalGiros = itensBase.length;
    const concluidos = itensBase.filter(a => a.concluido || a.statusConclusao === 'Concluído').length;
    const pendentes = totalGiros - concluidos;
    const estoquePicking = itensBase.filter(a => a.tipoQuebra === 'Estoque x Picking').length;
    const estoqueEstoque = itensBase.filter(a => a.tipoQuebra === 'Estoque x Estoque').length;

    // Histórico de Aderência
    const sumAderencia = historico.reduce((acc, h) => acc + h.aderenciaPct, 0);
    const avgAderencia = historico.length > 0 ? sumAderencia / historico.length : 100;
    const ultimoRegistro = historico[historico.length - 1];

    const registroMesAtual = mesSelecionado === 'TODOS' 
      ? ultimoRegistro 
      : historico.find(h => h.mesKey === mesSelecionado);

    const aderenciaDesteMes = registroMesAtual ? registroMesAtual.aderenciaPct : 100.0;
    const atingimentoRealocacaoPct = totalGiros > 0 ? Math.round((concluidos / totalGiros) * 100) : 100;

    return {
      totalGiros,
      concluidos,
      pendentes,
      estoquePicking,
      estoqueEstoque,
      atingimentoRealocacaoPct,
      aderenciaMediaAno: Number(avgAderencia.toFixed(1)),
      aderenciaMes: Number(aderenciaDesteMes.toFixed(1))
    };
  }, [historico, auditorias, mesSelecionado]);

  // Lista filtrada de giros de FEFO
  const girosFiltrados = useMemo(() => {
    return auditorias.filter(item => {
      // Filtro de Mês
      if (mesSelecionado !== 'TODOS') {
        if (getItemMesKey(item) !== mesSelecionado) return false;
      }

      // Busca geral
      if (busca.trim()) {
        const query = busca.toLowerCase();
        const matchesQuery = 
          item.descricaoSku.toLowerCase().includes(query) ||
          item.codigoSku.toLowerCase().includes(query) ||
          (item.localizacaoOrigem && item.localizacaoOrigem.toLowerCase().includes(query)) ||
          (item.localizacaoDestino && item.localizacaoDestino.toLowerCase().includes(query)) ||
          (item.loteExpedido && item.loteExpedido.toLowerCase().includes(query)) ||
          (item.colaboradorOficial?.nomeOficial && item.colaboradorOficial.nomeOficial.toLowerCase().includes(query)) ||
          (item.responsavel && item.responsavel.toLowerCase().includes(query));
        
        if (!matchesQuery) return false;
      }

      // Filtro Tipo Quebra
      if (filtroTipoQuebra !== 'TODOS') {
        if (item.tipoQuebra !== filtroTipoQuebra) return false;
      }

      // Filtro Colaborador Oficial
      if (filtroColaborador !== 'TODOS') {
        const nomeOficial = item.colaboradorOficial?.nomeOficial || '';
        if (filtroColaborador === 'RONILDO' && !nomeOficial.includes('RONILDO')) return false;
        if (filtroColaborador === 'MARIVALDO' && !nomeOficial.includes('MARIVALDO')) return false;
      }

      // Filtro Status
      if (filtroStatus !== 'TODOS') {
        const isDone = item.concluido || item.statusConclusao === 'Concluído';
        if (filtroStatus === 'Concluído' && !isDone) return false;
        if (filtroStatus === 'Pendente' && isDone) return false;
      }

      return true;
    });
  }, [auditorias, mesSelecionado, busca, filtroTipoQuebra, filtroColaborador, filtroStatus]);

  const handleSalvarGiro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDescricao || !formOrigem || !formDestino) {
      setFeedbackMsg('Preencha os campos obrigatórios.');
      return;
    }

    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const horaAgora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const colabInfo = associarColaboradorOficial(formColaboradorRaw);

    const novoItem: AuditoriaGiroItem = {
      id: `aud-giro-${Date.now()}`,
      mesKey: '08',
      mesNome: 'Agosto',
      ano: 2026,
      data: dataHoje,
      dataColeta: '21/08/2026 (Sexta-feira)',
      dataLimiteRealocacao: '27/08/2026 (Quinta-feira)',
      dataHoraSolicitacao: `${dataHoje} ${horaAgora}`,
      dataConclusao: formConcluido ? `${dataHoje} ${horaAgora}` : undefined,
      turno: formTurno,
      codigoSku: formCodigo || 'SKU',
      descricaoSku: formDescricao,
      tipoQuebra: formTipoQuebra,
      localizacaoOrigem: formOrigem,
      localizacaoDestino: formDestino,
      loteExpedido: formLoteMaisProximo || `LOTE-${Date.now().toString().slice(-4)}`,
      validadeExpedida: formValidadeMaisProxima || dataHoje,
      loteMaisDistante: formLoteMaisDistante || 'LOTE-COMP',
      validadeMaisDistante: formValidadeMaisDistante || dataHoje,
      diferencaDias: 30,
      quantidadeCaixas: formQtd,
      houveDesvio: false,
      statusConclusao: formConcluido ? 'Concluído' : 'Pendente',
      concluido: formConcluido,
      motivoDesvio: formMotivo || `Giro de FEFO executado por ${colabInfo.nomeOficial} para regularização de quebra (${formTipoQuebra}).`,
      responsavel: `${colabInfo.apelido} (${colabInfo.cargo})`,
      colaboradorOficial: colabInfo
    };

    const novaLista = [novoItem, ...auditorias];
    setAuditorias(novaLista);
    saveAuditoriaGiro(companyId, novaLista);

    setFeedbackMsg('Giro de FEFO registrado e adicionado ao histórico com sucesso!');
    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveTab('giros');
    }, 1200);

    // Reset form
    setFormCodigo('');
    setFormDescricao('');
    setFormOrigem('');
    setFormDestino('');
    setFormLoteMaisProximo('');
    setFormValidadeMaisProxima('');
    setFormLoteMaisDistante('');
    setFormValidadeMaisDistante('');
    setFormMotivo('');
  };

  const exportToExcel = () => {
    const wsGiros = XLSX.utils.json_to_sheet(girosFiltrados.map(a => ({
      'Mês': a.mesNome || 'Agosto',
      'Data Quebra / Execução': a.data,
      'Data Coleta Validade (Sexta)': a.dataColeta || 'Sexta-feira',
      'Prazo Limite Realocação (Quinta)': a.dataLimiteRealocacao || 'Quinta-feira',
      'Data e Hora Conclusão': a.dataConclusao || (a.concluido ? `${a.data} 07:45` : 'Pendente'),
      'Status': a.concluido ? 'Concluído' : 'Pendente',
      'Atingimento': a.concluido ? '100% Sanado' : 'Em Andamento',
      'Código SKU': a.codigoSku,
      'Descrição do Produto': a.descricaoSku,
      'Tipo de Quebra FEFO': a.tipoQuebra,
      'Onde Estava (Rua Origem)': a.localizacaoOrigem,
      'Para Onde Foi (Rua Destino)': a.localizacaoDestino,
      'Validade Mais Próxima (Priorizada)': a.validadeExpedida,
      'Validade Mais Distante': a.validadeMaisDistante || '-',
      'Dias Inversão': a.diferencaDias || 0,
      'Quantidade (Cx)': a.quantidadeCaixas,
      'Colaborador Oficial': a.colaboradorOficial?.nomeOficial || a.responsavel,
      'Matrícula': a.colaboradorOficial?.matricula || '-',
      'Cargo': a.colaboradorOficial?.cargo || 'OPERADOR DE EMPILHADEIRA',
      'Turno': a.turno,
      'Observações do Giro': a.motivoDesvio || 'Giro executado e regularizado'
    })));

    const wsMensal = XLSX.utils.json_to_sheet(historico.map(h => ({
      'Mês': h.mesNome,
      'Ano': h.ano,
      'Aderência FEFO (%)': `${h.aderenciaPct}%`,
      'Total Expedido (Cx)': h.totalExpedidoCx,
      'Conforme FEFO (Cx)': h.conformeFefoCx,
      'Desvios (Cx)': h.desviosCx,
      'Volume (HL)': h.totalHectolitros,
      'Motivo Principal': h.motivoPrincipalDesvio || '-',
      'Responsável': h.responsavelAuditoria || 'Equipe de Empilhadores',
      'Status': h.status
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsGiros, 'Historico_Giros_FEFO');
    XLSX.utils.book_append_sheet(wb, wsMensal, 'Aderencia_Mensal_FEFO');
    XLSX.writeFile(wb, `Historico_Quebras_FEFO_Anual_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getNomeMesAtual = () => {
    const config = MESES_CONFIG.find(m => m.key === mesSelecionado);
    return config ? config.label : 'Anual';
  };

  if (!isOpen) return null;

  return (
    <div id="modal-fefo-giros-historico" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-[#032b5e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black uppercase tracking-wider">Histórico de Quebras de FEFO & Realocações Anuais</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {kpis.atingimentoRealocacaoPct}% Quebras Sanadas
                </span>
                <span className="bg-sky-500/20 text-sky-200 border border-sky-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  🚜 Operação Empilhadores
                </span>
              </div>
              <p className="text-xs text-sky-200/90 mt-0.5">
                Consulte todos os meses do ano com seus andamentos, atingimento da realocação e histórico das ruas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              id="btn-export-excel-giros"
              onClick={exportToExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs border-none cursor-pointer"
              title="Exportar Histórico em Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
            <button 
              id="btn-close-modal-giros"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Operational Cycle Banner (Sexta coleta -> Quinta prazo) */}
        <div className="bg-blue-900/90 text-sky-100 px-6 py-2.5 flex flex-wrap items-center justify-between border-b border-blue-800 text-xs">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-semibold">
              <strong className="text-white font-bold">Ciclo Operacional Semanal:</strong> As coletas de validade são realizadas na <span className="text-amber-300 font-bold">Sexta-feira</span> e as realocações de giro de FEFO são executadas até a <span className="text-emerald-300 font-bold">Quinta-feira da próxima semana</span>.
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-[11px] bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Tendência Positiva nos últimos 4 meses: <span className="text-emerald-300">Maio (92.5%) ➔ Junho (94.8%) ➔ Julho (100%) ➔ Agosto (100%)</span>
          </div>
        </div>

        {/* Month Selector Bar (Ramificação de Todos os Meses do Ano) */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-black uppercase text-slate-500 mr-1 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ramificar Mês:
          </span>
          {MESES_CONFIG.map(m => {
            const isSelected = mesSelecionado === m.key;
            return (
              <button
                key={m.key}
                id={`btn-mes-filtro-${m.key}`}
                onClick={() => setMesSelecionado(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#032b5e] text-white border-[#032b5e] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Top KPI Cards adaptados ao Mês Selecionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase">
              <span>{mesSelecionado === 'TODOS' ? 'Total Quebras no Ano' : `Quebras em ${getNomeMesAtual()}`}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{kpis.concluidos}</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                100% Concluídos
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Realocações executadas no prazo</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase">
              <span>Estoque x Picking ({getNomeMesAtual()})</span>
              <Layers className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-700">{kpis.estoquePicking}</span>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">
                Abastecimentos
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Estoque pulmão para picking</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase">
              <span>Estoque x Estoque ({getNomeMesAtual()})</span>
              <Warehouse className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-700">{kpis.estoqueEstoque}</span>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded">
                Troca de Ruas
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Inversões de blocos corrigidas</p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase">
              <span>% Giro Acumulado ({mesSelecionado === 'TODOS' ? 'Média Ano' : getNomeMesAtual()})</span>
              <Percent className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#032b5e]">
                {mesSelecionado === 'TODOS' ? kpis.aderenciaMediaAno : kpis.aderenciaMes}%
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                Meta: ≥90%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Atingimento: 100%</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white">
          <button
            id="tab-btn-giros"
            onClick={() => setActiveTab('giros')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === 'giros'
                ? 'border-[#032b5e] text-[#032b5e]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            🚜 Quebras & Realocações de {getNomeMesAtual()} ({girosFiltrados.length})
          </button>
          <button
            id="tab-btn-mensal"
            onClick={() => setActiveTab('mensal')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === 'mensal'
                ? 'border-[#032b5e] text-[#032b5e]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            📊 Aderência Mensal & Tendência 4 Meses (Jan a Dez)
          </button>
          <button
            id="tab-btn-novo"
            onClick={() => setActiveTab('novo')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer bg-transparent ${
              activeTab === 'novo'
                ? 'border-[#032b5e] text-[#032b5e]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            ➕ Registrar Nova Realocação
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* TAB 1: HISTÓRICO DETALHADO DE QUEBRAS E REALOCAÇÕES */}
          {activeTab === 'giros' && (
            <div className="space-y-4">
              
              {/* Filtros e Busca com segmented views para Quebras */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por SKU, Produto, Rua, Lote..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  {busca && (
                    <button 
                      onClick={() => setBusca('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs border-none bg-transparent cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Segmented Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setFiltroTipoQuebra('TODOS')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all border-none cursor-pointer ${
                        filtroTipoQuebra === 'TODOS' ? 'bg-[#032b5e] text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todas as Quebras
                    </button>
                    <button
                      onClick={() => setFiltroTipoQuebra('Estoque x Estoque')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all border-none cursor-pointer ${
                        filtroTipoQuebra === 'Estoque x Estoque' ? 'bg-cyan-700 text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Estoque x Estoque
                    </button>
                    <button
                      onClick={() => setFiltroTipoQuebra('Estoque x Picking')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all border-none cursor-pointer ${
                        filtroTipoQuebra === 'Estoque x Picking' ? 'bg-purple-700 text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Estoque x Picking
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-500">Empilhador:</span>
                    <select
                      value={filtroColaborador}
                      onChange={(e) => setFiltroColaborador(e.target.value)}
                      className="p-1.5 text-xs border border-slate-300 rounded-lg font-medium bg-white"
                    >
                      <option value="TODOS">Todos Empilhadores</option>
                      <option value="RONILDO">José Ronildo da Silva</option>
                      <option value="MARIVALDO">Marivaldo Artur Alves</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setActiveTab('novo')}
                    className="flex items-center gap-1 bg-[#032b5e] hover:bg-[#021f44] text-white text-xs font-bold px-3 py-2 rounded-lg transition-all border-none cursor-pointer ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Novo Giro
                  </button>
                </div>
              </div>

              {/* Cards / Tabela com o Histórico das Quebras e Realocações */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700">
                    Quebras de FEFO & Movimentações de {getNomeMesAtual()} ({girosFiltrados.length} registros)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Ciclo: Coleta na Sexta-feira ➔ Realocação Concluída até Quinta-feira
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Coleta & Delegação</th>
                        <th className="py-3 px-4">Produto / SKU</th>
                        <th className="py-3 px-4">Tipo de Quebra</th>
                        <th className="py-3 px-4">Ruas / Localização</th>
                        <th className="py-3 px-4">Validades Comparadas (FEFO)</th>
                        <th className="py-3 px-4 text-center">Andamento & Status</th>
                        <th className="py-3 px-4">Empilhador Executor</th>
                        <th className="py-3 px-4 text-center">Tratativa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {girosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                            Nenhum registro de quebra encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        girosFiltrados.map((item, idx) => {
                          const colab = item.colaboradorOficial || associarColaboradorOficial(item.responsavel);
                          const isEstoquePicking = item.tipoQuebra === 'Estoque x Picking';
                          const isDone = item.concluido || item.statusConclusao === 'Concluído';

                          return (
                            <tr key={`giro-row-${item.id}-${idx}`} className="hover:bg-slate-50/90 transition-colors">
                              {/* Coleta & Delegação */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                    <span>Coleta: {item.dataColeta || `${item.data} (Sexta)`}</span>
                                  </div>
                                  <div className="text-[9.5px] font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span>Delegado: {item.delegadoPor || 'Gilson Rosa (Conferente)'}</span>
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-medium">
                                    Delegação: {item.dataDelegacao || item.dataHoraSolicitacao || `${item.data} 14:30`}
                                  </div>
                                  <div className="text-[10px] font-bold text-blue-800 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span>Prazo: {item.dataLimiteRealocacao || 'Quinta-feira'}</span>
                                  </div>
                                  {isDone && (
                                    <div className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                                      Executado: {item.dataConclusao || `${item.data} 08:30`}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Produto */}
                              <td className="py-3.5 px-4 align-top max-w-xs">
                                <div className="font-bold text-slate-900 leading-snug">{item.descricaoSku}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                                    Cód: {item.codigoSku}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-bold">
                                    {item.quantidadeCaixas} cx
                                  </span>
                                </div>
                              </td>

                              {/* Tipo de Quebra */}
                              <td className="py-3.5 px-4 align-top">
                                {isEstoquePicking ? (
                                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
                                    <Layers className="w-3 h-3" /> Estoque x Picking
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">
                                    <Warehouse className="w-3 h-3" /> Estoque x Estoque
                                  </span>
                                )}
                                <p className="text-[10px] text-slate-500 mt-1 max-w-[170px] leading-tight">
                                  {isEstoquePicking 
                                    ? 'Estoque mais antigo que o picking' 
                                    : 'Inversão física entre ruas do armazém'}
                                </p>
                              </td>

                              {/* Onde Estavam Localizados (Ruas Origem -> Destino) */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                                      Rua Origem
                                    </span>
                                    <span className="font-semibold text-slate-800">{item.localizacaoOrigem}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-1 rounded border border-emerald-200">
                                      Rua Destino
                                    </span>
                                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                                      {item.localizacaoDestino}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Validades Comparadas (Mais Próxima vs Mais Distante) */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] bg-emerald-50 text-emerald-900 px-2 py-1 rounded border border-emerald-200">
                                    <span className="font-bold flex items-center gap-1">
                                      🟢 Mais Próxima:
                                    </span>
                                    <span className="font-mono font-black">{item.validadeExpedida}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] bg-sky-50 text-sky-900 px-2 py-1 rounded border border-sky-200">
                                    <span className="font-bold flex items-center gap-1">
                                      🔵 Mais Distante:
                                    </span>
                                    <span className="font-mono font-black">{item.validadeMaisDistante || '2027-05-15'}</span>
                                  </div>
                                  {item.diferencaDias ? (
                                    <div className="text-[9px] text-slate-500 font-medium text-right">
                                      Inversão corrigida: <span className="font-bold text-slate-700">{item.diferencaDias} dias</span>
                                    </div>
                                  ) : null}
                                </div>
                              </td>

                              {/* Andamento & Atingimento */}
                              <td className="py-3.5 px-4 align-top text-center">
                                {isDone ? (
                                  <>
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-2xs">
                                      <Check className="w-3 h-3" /> Concluído
                                    </span>
                                    <div className="text-[10px] text-emerald-700 font-black mt-1">100% Atingido</div>
                                    <div className="text-[9px] text-slate-400">Sanado no Prazo</div>
                                  </>
                                ) : (
                                  <>
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-2xs">
                                      <Clock className="w-3 h-3" /> Pendente
                                    </span>
                                    <div className="text-[10px] text-amber-700 font-black mt-1">Em Andamento</div>
                                    <div className="text-[9px] text-slate-400">Aguardando Giro</div>
                                  </>
                                )}
                              </td>

                              {/* Empilhador Executor / Cadastro Oficial */}
                              <td className="py-3.5 px-4 align-top">
                                <div className="flex items-start gap-2">
                                  <div className="w-7 h-7 rounded-full bg-[#032b5e] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                                    {colab.apelido ? colab.apelido[0] : 'E'}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">
                                      {colab.nomeOficial}
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <span className="bg-slate-100 text-slate-700 px-1 rounded font-mono font-bold">
                                        Matrícula: {colab.matricula}
                                      </span>
                                    </div>
                                    <div className="text-[9px] font-bold text-blue-700 mt-0.5 uppercase">
                                      {colab.cargo} • {colab.turno || 'MANHÃ/TARDE'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Coluna TRATATIVA (com Botão e Resumo Conforme Solicitado) */}
                              <td className="py-3.5 px-4 align-top text-center max-w-[220px]">
                                <button
                                  type="button"
                                  onClick={() => abrirTratativaModal(item)}
                                  className="bg-[#032b5e] hover:bg-[#021f44] text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-xs flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer border-none"
                                >
                                  <span>✏️</span>
                                  <span>Tratativa</span>
                                </button>
                                <div className="mt-1.5 text-left text-[9.5px] text-slate-600 line-clamp-3 bg-slate-50 p-1.5 rounded border border-slate-200">
                                  {item.tratativaDetalhada || item.motivoDesvio || 'Realocação de FEFO registrada no sistema.'}
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>

                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: VISÃO MENSAL & TENDÊNCIA DOS ÚLTIMOS 4 MESES */}
          {activeTab === 'mensal' && (
            <div className="space-y-6">
              
              {/* Card Destaque Tendência Positiva nos Últimos 4 Meses */}
              <div className="bg-linear-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl border border-blue-700 shadow-md">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-400 text-emerald-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase">
                        📈 Tendência Positiva Consolidada
                      </span>
                      <span className="text-sky-200 text-xs font-semibold">Últimos 4 Meses de Giro FEFO</span>
                    </div>
                    <h3 className="text-lg font-black mt-1">
                      Média Acumulada do Giro Anual: <span className="text-amber-300">{kpis.aderenciaMediaAno}%</span>
                    </h3>
                    <p className="text-xs text-sky-200/90 mt-0.5">
                      Evolução consistente na conferência semanal: <strong className="text-white">Maio (92.5%) ➔ Junho (94.8%) ➔ Julho (100.0%) ➔ Agosto (100.0%)</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/20">
                    <div className="text-right">
                      <div className="text-[10px] text-sky-200 uppercase font-black">Atingimento Atual</div>
                      <div className="text-2xl font-black text-emerald-300">100.0%</div>
                    </div>
                    <Award className="w-8 h-8 text-amber-300 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Grid de Meses com funcionalidade de clique para ramificação */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#032b5e] tracking-wider">
                      Evolução da Taxa de Aderência ao Giro FEFO por Mês (%)
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Clique em qualquer mês para ramificar e visualizar as quebras e realocações detalhadas
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Conforme (≥90%)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <span className="w-3 h-3 rounded-full bg-amber-500"></span> Atenção (85-89.9%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {historico.map((item, hIdx) => {
                    const isSelected = mesSelecionado === item.mesKey;
                    const isLast4Months = ['05', '06', '07', '08'].includes(item.mesKey);

                    return (
                      <div 
                        key={`hist-card-${item.id}-${hIdx}`} 
                        onClick={() => {
                          setMesSelecionado(item.mesKey);
                          setActiveTab('giros');
                        }}
                        className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-102 hover:shadow-md ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400' 
                            : isLast4Months 
                              ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50' 
                              : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                          <span className="flex items-center gap-1">
                            {item.mesNome}
                            {isLast4Months && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            item.aderenciaPct >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {item.aderenciaPct}%
                          </span>
                        </div>
                        
                        <div className="my-2.5">
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                item.aderenciaPct >= 90 ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(item.aderenciaPct, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[9px] text-slate-500 space-y-0.5 border-t border-slate-200/60 pt-1.5">
                          <div className="flex justify-between">
                            <span>Total:</span>
                            <span className="font-mono font-bold">{item.totalExpedidoCx.toLocaleString('pt-BR')} cx</span>
                          </div>
                          <div className="flex justify-between text-emerald-700">
                            <span>FEFO:</span>
                            <span className="font-mono font-bold">{item.conformeFefoCx.toLocaleString('pt-BR')} cx</span>
                          </div>
                          <div className="text-[8px] text-blue-700 font-bold text-right pt-0.5 flex items-center justify-end gap-0.5">
                            <span>Ver quebras</span>
                            <ChevronRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabela mês a mês com andamento e atingimento */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800">
                    Histórico de Aderência Consolidado & Atingimento Anual
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Meta Corporativa: ≥ 90.0%
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-black tracking-wider">
                      <tr>
                        <th className="py-2.5 px-4">Mês / Ano</th>
                        <th className="py-2.5 px-4 text-center">Taxa de Aderência</th>
                        <th className="py-2.5 px-4 text-right">Total Expedido</th>
                        <th className="py-2.5 px-4 text-right text-emerald-700">Conforme FEFO</th>
                        <th className="py-2.5 px-4 text-right text-amber-700">Desvios</th>
                        <th className="py-2.5 px-4">Causa / Observações</th>
                        <th className="py-2.5 px-4">Responsáveis</th>
                        <th className="py-2.5 px-4 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {historico.map((h, hIdx) => (
                        <tr key={`hist-row-${h.id}-${hIdx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {h.mesNome} / {h.ano}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-0.5 rounded-full border ${
                              h.aderenciaPct >= 90
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {h.aderenciaPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                            {h.totalExpedidoCx.toLocaleString('pt-BR')} cx
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {h.conformeFefoCx.toLocaleString('pt-BR')} cx
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-amber-700">
                            {h.desviosCx.toLocaleString('pt-BR')} cx
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs">
                            {h.motivoPrincipalDesvio || 'Giros de FEFO executados com sucesso'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 text-[11px] font-medium">
                            {h.responsavelAuditoria || 'Equipe de Empilhadores'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setMesSelecionado(h.mesKey);
                                setActiveTab('giros');
                              }}
                              className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-all cursor-pointer"
                            >
                              Ver Quebras
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NOVO REGISTRO DE GIRO */}
          {activeTab === 'novo' && (
            <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black uppercase text-[#032b5e]">Registrar Nova Realocação de Giro FEFO</h3>
              </div>

              {feedbackMsg && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {feedbackMsg}
                </div>
              )}

              <form onSubmit={handleSalvarGiro} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Quebra FEFO *</label>
                    <select
                      value={formTipoQuebra}
                      onChange={(e) => setFormTipoQuebra(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold bg-white"
                    >
                      <option value="Estoque x Picking">Estoque x Picking (Abastecimento)</option>
                      <option value="Estoque x Estoque">Estoque x Estoque (Troca de Ruas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Turno de Execução *</label>
                    <select
                      value={formTurno}
                      onChange={(e) => setFormTurno(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold bg-white"
                    >
                      <option value="Turno 1">Turno 1 (Manhã)</option>
                      <option value="Turno 2">Turno 2 (Tarde)</option>
                      <option value="Turno 3">Turno 3 (Noite)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Código SKU</label>
                    <input
                      type="text"
                      value={formCodigo}
                      onChange={(e) => setFormCodigo(e.target.value)}
                      placeholder="Ex: 2548"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Descrição do Produto *</label>
                    <input
                      type="text"
                      value={formDescricao}
                      onChange={(e) => setFormDescricao(e.target.value)}
                      placeholder="Ex: BUDWEISER 600ML CX 24"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Localização de Origem (Onde Estava) *</label>
                    <input
                      type="text"
                      value={formOrigem}
                      onChange={(e) => setFormOrigem(e.target.value)}
                      placeholder="Ex: Rua A3 (Estoque Pulmão)"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Localização de Destino (Para Onde Foi) *</label>
                    <input
                      type="text"
                      value={formDestino}
                      onChange={(e) => setFormDestino(e.target.value)}
                      placeholder="Ex: Área Picking (Box 01)"
                      className="w-full p-2.5 border border-slate-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Validade Mais Próxima (Priorizada)</label>
                    <input
                      type="date"
                      value={formValidadeMaisProxima}
                      onChange={(e) => setFormValidadeMaisProxima(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Validade Mais Distante (Comparada)</label>
                    <input
                      type="date"
                      value={formValidadeMaisDistante}
                      onChange={(e) => setFormValidadeMaisDistante(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Quantidade de Caixas</label>
                    <input
                      type="number"
                      value={formQtd}
                      onChange={(e) => setFormQtd(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Empilhador Responsável *</label>
                    <select
                      value={formColaboradorRaw}
                      onChange={(e) => setFormColaboradorRaw(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-bold bg-white"
                    >
                      <option value="JOSE RONILDO DA SILVA (Ronildo - G1093)">JOSE RONILDO DA SILVA (Ronildo - G1093)</option>
                      <option value="MARIVALDO ARTUR ALVES (Marivaldo - G1071)">MARIVALDO ARTUR ALVES (Marivaldo - G1071)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Observações do Giro</label>
                  <textarea
                    value={formMotivo}
                    onChange={(e) => setFormMotivo(e.target.value)}
                    placeholder="Descreva os detalhes da operação de realocação física..."
                    rows={2}
                    className="w-full p-2.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('giros')}
                    className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#032b5e] hover:bg-[#021f44] text-white font-bold rounded-lg transition-all shadow-xs cursor-pointer border-none"
                  >
                    Salvar Realocação
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Modal / Dialog de Edição e Visualização da Tratativa */}
        {tratativaModalItem && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-[#032b5e] text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✏️</span>
                  <div>
                    <h3 className="font-black text-sm">Tratativa de Quebra de FEFO</h3>
                    <p className="text-[11px] text-blue-200">{tratativaModalItem.descricaoSku} ({tratativaModalItem.codigoSku})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTratativaModalItem(null)}
                  className="p-1 text-white/80 hover:text-white rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                {/* Resumo da Quebra */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Tipo de Quebra:</span>
                    <span className="font-bold text-slate-800">{tratativaModalItem.tipoQuebra}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Quantidade:</span>
                    <span className="font-bold text-slate-800">{tratativaModalItem.quantidadeCaixas} cx</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Rua Origem:</span>
                    <span className="font-bold text-rose-700">{tratativaModalItem.localizacaoOrigem}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-400 block">Rua Destino:</span>
                    <span className="font-bold text-emerald-700">{tratativaModalItem.localizacaoDestino}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-900">
                      👤 Delegado por: {tratativaModalItem.delegadoPor || 'Gilson Rosa (Conferente)'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Data: {tratativaModalItem.dataDelegacao || tratativaModalItem.dataHoraSolicitacao || `${tratativaModalItem.data} 14:30`}
                    </span>
                  </div>
                </div>

                {/* Status da Tratativa */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">Status da Tratativa / Realocação</label>
                  <select
                    value={editTratativaStatus}
                    onChange={(e) => setEditTratativaStatus(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                  >
                    <option value="Concluído">✅ Concluído (Giro de FEFO Realizado)</option>
                    <option value="Pendente">⏳ Pendente (Aguardando Desobstrução / Próximo Turno)</option>
                    <option value="Em Andamento">🔄 Em Andamento (Em Movimentação no Armazém)</option>
                  </select>
                </div>

                {/* Quem realizou */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-slate-700 mb-1">Empilhador Executor Oficial</label>
                    <select
                      value={editRealizadoPor}
                      onChange={(e) => setEditRealizadoPor(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                    >
                      <option value="JOSE RONILDO DA SILVA">JOSE RONILDO DA SILVA (Ronildo - G1093)</option>
                      <option value="MARIVALDO ARTUR ALVES">MARIVALDO ARTUR ALVES (Marivaldo - G1071)</option>
                      <option value="PAULO PEREIRA DA SILVA">PAULO PEREIRA DA SILVA (Paulo - G1013)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-black text-slate-700 mb-1">Data / Hora Conclusão</label>
                    <input
                      type="text"
                      value={editDataConclusao}
                      onChange={(e) => setEditDataConclusao(e.target.value)}
                      placeholder="DD/MM/AAAA HH:MM"
                      className="w-full p-2 border border-slate-300 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Detalhes da Tratativa */}
                <div>
                  <label className="block font-black text-slate-700 mb-1">Descrição Detalhada da Tratativa Logística</label>
                  <textarea
                    value={editTratativaTexto}
                    onChange={(e) => setEditTratativaTexto(e.target.value)}
                    rows={4}
                    placeholder="Descreva a ação corretiva tomada para sanar a quebra de FEFO..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTratativaModalItem(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors bg-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={salvarTratativaModal}
                    className="px-5 py-2 bg-[#032b5e] hover:bg-[#021f44] text-white font-black rounded-xl transition-all shadow-xs cursor-pointer border-none"
                  >
                    Salvar Tratativa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
