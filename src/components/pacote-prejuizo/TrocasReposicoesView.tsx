import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  ExternalLink, 
  Layers, 
  Boxes, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Package, 
  Calendar, 
  FileSpreadsheet, 
  Download, 
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Droplet
} from 'lucide-react';
import { TrocaReposicaoItem } from '../../utils/pacotePrejuizoManager';
import { 
  TROCAS_PLATAFORMA_EXTERNA_URL, 
  DADOS_OFICIAIS_SSTR_TROCAS,
  buildOfficialTrocasReposicoesDataset
} from '../../data/trocasReposicoesOfficialDataset';
import { JsonImportZone } from './JsonImportZone';

interface TrocasReposicoesViewProps {
  items: TrocaReposicaoItem[];
  companyId: string;
  theme?: 'light' | 'dark';
  unitMode?: 'reais' | 'hl';
  onImportJson: (jsonContent: string) => { success: boolean; count: number; error?: string };
  onClearData: () => void;
  sampleJsonGenerator: () => string;
}

export const TrocasReposicoesView: React.FC<TrocasReposicoesViewProps> = ({
  items,
  companyId,
  theme = 'dark',
  unitMode,
  onImportJson,
  onClearData,
  sampleJsonGenerator
}) => {
  const isDark = theme !== 'light';
  const [selectedProcesso, setSelectedProcesso] = useState<'todos' | 'reposicao' | 'troca'>('todos');
  const [unitViewMode, setUnitViewMode] = useState<'hl' | 'reais'>(() => (unitMode === 'reais' ? 'reais' : 'hl'));
  const [subView, setSubView] = useState<'visao_geral' | 'auditoria_setor'>('visao_geral');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (unitMode) {
      setUnitViewMode(unitMode === 'reais' ? 'reais' : 'hl');
    }
  }, [unitMode]);

  const stats = DADOS_OFICIAIS_SSTR_TROCAS;

  // Filtrar itens
  const filteredList = useMemo(() => {
    return items.filter(it => {
      if (selectedProcesso === 'reposicao') {
        const c = (it.causa || it.motivo || '').toLowerCase();
        if (!c.includes('reposi') && !c.includes('falta') && !c.includes('03.18.05')) return false;
      } else if (selectedProcesso === 'troca') {
        const c = (it.causa || it.motivo || '').toLowerCase();
        if (c.includes('reposi') || c.includes('03.18.05')) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mDesc = (it.descricao || '').toLowerCase().includes(q);
        const mCod = String(it.codProduto || '').toLowerCase().includes(q);
        const mCli = (it.cliente || '').toLowerCase().includes(q);
        const mMot = (it.motivo || '').toLowerCase().includes(q);
        const mCausa = (it.causa || '').toLowerCase().includes(q);
        if (!mDesc && !mCod && !mCli && !mMot && !mCausa) return false;
      }

      return true;
    });
  }, [items, selectedProcesso, searchTerm]);

  // Exportar Relatório Excel/CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Data', 'Código', 'Descrição', 'Qtd', 'R$ Total', 'HL Total', 'Motivo', 'Causa', 'Cliente', 'Rota', 'Motorista', 'NF'];
    const rows = items.map(it => [
      it.id,
      it.data,
      it.codProduto,
      `"${(it.descricao || '').replace(/"/g, '""')}"`,
      it.quantidade,
      (it.valorTotal || 0).toFixed(2),
      (it.hlTotal || 0).toFixed(4),
      `"${(it.motivo || '').replace(/"/g, '""')}"`,
      `"${(it.causa || '').replace(/"/g, '""')}"`,
      `"${(it.cliente || '').replace(/"/g, '""')}"`,
      `"${(it.rota || '').replace(/"/g, '""')}"`,
      `"${(it.motorista || '').replace(/"/g, '""')}"`,
      it.notaFiscal || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_trocas_reposicoes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. BANNER DE REDIRECIONAMENTO PARA PLATAFORMA EXTERNA OFICIAL */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden ${
        isDark ? 'bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/70 border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md'
      }`}>
        <div className="flex items-start gap-3.5 z-10">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Plataforma Oficial de Trocas & Reposições (Armazém)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                ARMAZ-M-
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Sistema integrado de controle de processos de devoluções, reposição de rota, acertos e auditoria SSTR.
              Clique no botão ao lado para abrir a ferramenta externa diretamente em uma nova aba.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 z-10">
          <a
            href={TROCAS_PLATAFORMA_EXTERNA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <span>Acessar Plataforma Externa (ARMAZ-M-)</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. CLASSIFICAÇÃO DE PROCESSOS (REPOSIÇÃO VS. TROCA) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-400" />
            Classificação de Processos (Reposição vs. Troca)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Exibindo {stats.totalGeral.registros} de {stats.totalGeral.registros} registros do banco de dados
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Todos os Processos */}
          <button
            type="button"
            onClick={() => setSelectedProcesso('todos')}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
              selectedProcesso === 'todos'
                ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-500/10'
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase">
                <Layers className="w-3.5 h-3.5" />
                Todos os Processos
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                {stats.totalGeral.registros} reg.
              </span>
            </div>
            <div className="text-2xl font-black text-white">
              {unitViewMode === 'hl' ? (
                <>
                  {stats.totalGeral.hl.toFixed(1).replace('.', ',')} <span className="text-sm font-bold text-sky-400">HL</span>
                </>
              ) : (
                <>
                  R$ {stats.totalGeral.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </>
              )}
            </div>
            <div className="text-xs font-bold text-slate-300 mt-1">
              {unitViewMode === 'hl' ? (
                <>
                  R$ {stats.totalGeral.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • <span className="text-slate-400 font-normal">Visão Consolidada do Sistema</span>
                </>
              ) : (
                <>
                  {stats.totalGeral.hl.toFixed(1).replace('.', ',')} HL • <span className="text-slate-400 font-normal">Visão Consolidada do Sistema</span>
                </>
              )}
            </div>
          </button>

          {/* Card 2: Reposição */}
          <button
            type="button"
            onClick={() => setSelectedProcesso('reposicao')}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
              selectedProcesso === 'reposicao'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase">
                <Boxes className="w-3.5 h-3.5" />
                Reposição (Falta de Produto)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                {stats.reposicao.registros} reg.
              </span>
            </div>
            <div className="text-2xl font-black text-amber-400">
              {unitViewMode === 'hl' ? (
                <>
                  {stats.reposicao.hl.toFixed(2).replace('.', ',')} <span className="text-sm font-bold text-sky-400">HL</span>
                </>
              ) : (
                <>
                  R$ {stats.reposicao.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </>
              )}
            </div>
            <div className="text-xs font-bold text-slate-300 mt-1">
              {unitViewMode === 'hl' ? (
                <>
                  R$ {stats.reposicao.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • <span className="text-slate-400 font-normal">{stats.reposicao.descricao}</span>
                </>
              ) : (
                <>
                  {stats.reposicao.hl.toFixed(2).replace('.', ',')} HL • <span className="text-slate-400 font-normal">{stats.reposicao.descricao}</span>
                </>
              )}
            </div>
          </button>

          {/* Card 3: Troca */}
          <button
            type="button"
            onClick={() => setSelectedProcesso('troca')}
            className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
              selectedProcesso === 'troca'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10'
                : isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                <RotateCcw className="w-3.5 h-3.5" />
                Troca (Outros Motivos)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {stats.troca.registros} reg.
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {unitViewMode === 'hl' ? (
                <>
                  {stats.troca.hl.toFixed(2).replace('.', ',')} <span className="text-sm font-bold text-sky-400">HL</span>
                </>
              ) : (
                <>
                  R$ {stats.troca.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </>
              )}
            </div>
            <div className="text-xs font-bold text-slate-300 mt-1">
              {unitViewMode === 'hl' ? (
                <>
                  R$ {stats.troca.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • <span className="text-slate-400 font-normal">{stats.troca.descricao}</span>
                </>
              ) : (
                <>
                  {stats.troca.hl.toFixed(2).replace('.', ',')} HL • <span className="text-slate-400 font-normal">{stats.troca.descricao}</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO DE SUB-VISÃO (VISÃO GERAL VS AUDITORIA POR SETOR) + TOGGLE HL / R$ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubView('visao_geral')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subView === 'visao_geral'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('auditoria_setor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              subView === 'auditoria_setor'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Auditoria por Setor</span>
          </button>
        </div>

        {/* Toggle HL vs Reais + Exportar */}
        <div className="flex items-center gap-2.5">
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}>
            <button
              type="button"
              onClick={() => setUnitViewMode('hl')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                unitViewMode === 'hl'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Droplet className="w-3 h-3" />
              <span>Hectolitro (HL)</span>
            </button>

            <button
              type="button"
              onClick={() => setUnitViewMode('reais')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                unitViewMode === 'reais'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Reais (R$)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Baixar Relatório HL (Excel)</span>
          </button>
        </div>
      </div>

      {/* 4. METAS & PERCENTUAIS DE ATINGIMENTO SSTR + PICOS DE CONSUMO INTEGRADO (QUANDO VISÃO GERAL) */}
      {subView === 'visao_geral' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Coluna Esquerda: Metas e Percentuais de Atingimento SSTR */}
          <div className={`lg:col-span-7 p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-400" />
                {unitViewMode === 'hl' ? 'Metas & Percentuais de Atingimento SSTR (Volume HL)' : 'Metas & Percentuais de Atingimento SSTR'}
              </h4>
              <span className="text-[10px] font-mono text-slate-500">
                Padrão DPO Corporativo
              </span>
            </div>

            <div className="space-y-4">
              {/* Meta 1: Mês Atual */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400 uppercase text-[11px]">
                    ATINGIMENTO DO MÊS ({stats.metasSstr.mesAtual.mesRef})
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Status da Meta
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-lg font-black text-white">
                    {unitViewMode === 'hl' ? (
                      <>
                        {stats.metasSstr.mesAtual.realHl.toFixed(2).replace('.', ',')} HL <span className="text-xs text-slate-400 font-normal">de {stats.metasSstr.mesAtual.metaHl.toFixed(2).replace('.', ',')} HL</span>
                      </>
                    ) : (
                      <>
                        R$ {stats.metasSstr.mesAtual.realReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">de R$ {stats.metasSstr.mesAtual.metaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </div>
                  <div className={`text-sm font-black font-mono flex items-center gap-1 ${
                    unitViewMode === 'hl' 
                      ? (stats.metasSstr.mesAtual.statusHlPct > 100 ? 'text-amber-400' : 'text-emerald-400')
                      : (stats.metasSstr.mesAtual.statusReaisPct <= 100 ? 'text-emerald-400' : 'text-amber-400')
                  }`}>
                    <span>{unitViewMode === 'hl' ? `${stats.metasSstr.mesAtual.statusHlPct.toFixed(1).replace('.', ',')}%` : `${stats.metasSstr.mesAtual.statusReaisPct.toFixed(1).replace('.', ',')}%`}</span>
                    {unitViewMode === 'hl' && stats.metasSstr.mesAtual.statusHlPct > 100 ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      unitViewMode === 'hl' 
                        ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500' 
                        : 'bg-gradient-to-r from-blue-600 to-blue-400'
                    }`}
                    style={{ width: `${Math.min(unitViewMode === 'hl' ? stats.metasSstr.mesAtual.statusHlPct : stats.metasSstr.mesAtual.statusReaisPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meta 2: 1º Semestre */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400 uppercase text-[11px]">
                    ATINGIMENTO 1º SEMESTRE (1º H)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Status da Meta
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-lg font-black text-white">
                    {unitViewMode === 'hl' ? (
                      <>
                        {stats.metasSstr.primeiroSemestre.realHl.toFixed(2).replace('.', ',')} HL <span className="text-xs text-slate-400 font-normal">de {stats.metasSstr.primeiroSemestre.metaHl.toFixed(2).replace('.', ',')} HL</span>
                      </>
                    ) : (
                      <>
                        R$ {stats.metasSstr.primeiroSemestre.realReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">de R$ {stats.metasSstr.primeiroSemestre.metaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-black font-mono text-indigo-300 flex items-center gap-1">
                    <span>{unitViewMode === 'hl' ? `${stats.metasSstr.primeiroSemestre.statusHlPct.toFixed(1).replace('.', ',')}%` : `${stats.metasSstr.primeiroSemestre.statusReaisPct.toFixed(1).replace('.', ',')}%`}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" 
                    style={{ width: `${Math.min(unitViewMode === 'hl' ? stats.metasSstr.primeiroSemestre.statusHlPct : stats.metasSstr.primeiroSemestre.statusReaisPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meta 3: 2º Semestre */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400 uppercase text-[11px]">
                    ATINGIMENTO 2º SEMESTRE (2º H)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Status da Meta
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-lg font-black text-white">
                    {unitViewMode === 'hl' ? (
                      <>
                        {stats.metasSstr.segundoSemestre.realHl.toFixed(2).replace('.', ',')} HL <span className="text-xs text-slate-400 font-normal">de {stats.metasSstr.segundoSemestre.metaHl.toFixed(2).replace('.', ',')} HL</span>
                      </>
                    ) : (
                      <>
                        R$ {stats.metasSstr.segundoSemestre.realReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">de R$ {stats.metasSstr.segundoSemestre.metaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-black font-mono text-cyan-300 flex items-center gap-1">
                    <span>{unitViewMode === 'hl' ? `${stats.metasSstr.segundoSemestre.statusHlPct.toFixed(1).replace('.', ',')}%` : `${stats.metasSstr.segundoSemestre.statusReaisPct.toFixed(1).replace('.', ',')}%`}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full" 
                    style={{ width: `${Math.min(unitViewMode === 'hl' ? stats.metasSstr.segundoSemestre.statusHlPct : stats.metasSstr.segundoSemestre.statusReaisPct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meta 4: Ano (YTD) */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-400 uppercase text-[11px]">
                    ATINGIMENTO DO ANO (YTD)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Status da Meta
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-lg font-black text-white">
                    {unitViewMode === 'hl' ? (
                      <>
                        {stats.metasSstr.anoYtd.realHl.toFixed(2).replace('.', ',')} HL <span className="text-xs text-slate-400 font-normal">de {stats.metasSstr.anoYtd.metaHl.toFixed(2).replace('.', ',')} HL</span>
                      </>
                    ) : (
                      <>
                        R$ {stats.metasSstr.anoYtd.realReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">de R$ {stats.metasSstr.anoYtd.metaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-black font-mono text-purple-300 flex items-center gap-1">
                    <span>{unitViewMode === 'hl' ? `${stats.metasSstr.anoYtd.statusHlPct.toFixed(1).replace('.', ',')}%` : `${stats.metasSstr.anoYtd.statusReaisPct.toFixed(1).replace('.', ',')}%`}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" 
                    style={{ width: `${Math.min(unitViewMode === 'hl' ? stats.metasSstr.anoYtd.statusHlPct : stats.metasSstr.anoYtd.statusReaisPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Picos de Consumo Operacional Integrado */}
          <div className={`lg:col-span-5 p-6 rounded-3xl border space-y-4 ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Picos de Consumo Operacional Integrado
              </h4>
            </div>

            <div className="space-y-3.5">
              {/* 1. Cliente Top */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      CLIENTE COM MAIOR CONSUMO
                    </span>
                    <h5 className="text-xs font-black text-white truncate mt-0.5">
                      {stats.picosConsumo.clienteTop.nome}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      NB: {stats.picosConsumo.clienteTop.nb}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-purple-400 block font-mono">
                      R$ {stats.picosConsumo.clienteTop.valorReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {stats.picosConsumo.clienteTop.volumeHl.toFixed(3).replace('.', ',')} HL solicitados
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Produto Top */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      PRODUTO DE MAIOR CONSUMO
                    </span>
                    <h5 className="text-xs font-black text-white truncate mt-0.5">
                      {stats.picosConsumo.produtoTop.nome}
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Cód: {stats.picosConsumo.produtoTop.codigo}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-amber-400 block font-mono">
                      R$ {stats.picosConsumo.produtoTop.valorReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {stats.picosConsumo.produtoTop.unidades} un. • {stats.picosConsumo.produtoTop.volumeHl.toFixed(3).replace('.', ',')} HL
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Dia Pico */}
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      DIA DE MAIOR CONSUMO (PICO)
                    </span>
                    <h5 className="text-xs font-black text-white truncate mt-0.5 font-mono">
                      {stats.picosConsumo.diaPico.dataFmt}
                    </h5>
                    <span className="text-[10px] text-slate-500">
                      Lançamentos: {stats.picosConsumo.diaPico.lancamentosUnidades} un.
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-teal-400 block font-mono">
                      R$ {stats.picosConsumo.diaPico.valorReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {stats.picosConsumo.diaPico.volumeHl.toFixed(3).replace('.', ',')} HL movimentados
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SUB-VISÃO: AUDITORIA POR SETOR E CAUSAS OPERACIONAIS */
        <div className={`p-6 rounded-3xl border space-y-6 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Auditoria e Distribuição de Trocas por Causa & Setor
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Detalhamento dos motivos operacionais de reposição de rota e trocas de qualidade ({unitViewMode === 'hl' ? 'Volume HL' : 'Valores em Reais'})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Avarias em Rota / Trânsito</span>
              <div className="text-lg font-black text-white mt-1">
                {unitViewMode === 'hl' ? '28,40 HL' : 'R$ 23.850,12'}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">1.750 registros (37.6%)</span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Inversão de Carga / Lote</span>
              <div className="text-lg font-black text-white mt-1">
                {unitViewMode === 'hl' ? '19,35 HL' : 'R$ 16.240,40'}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">1.192 registros (25.6%)</span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Falta na Entrega (03.18.05)</span>
              <div className="text-lg font-black text-white mt-1">
                {unitViewMode === 'hl' ? '8,73 HL' : 'R$ 7.600,01'}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">406 registros (12.0%)</span>
            </div>

            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] uppercase font-bold text-slate-400">Vencimento / Qualidade</span>
              <div className="text-lg font-black text-white mt-1">
                {unitViewMode === 'hl' ? '19,12 HL' : 'R$ 15.748,13'}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">1.180 registros (24.8%)</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. ÁREA DE IMPORTAÇÃO JSON PARA TROCAS E REPOSIÇÕES */}
      <JsonImportZone
        titulo="Importar Arquivo JSON de Trocas e Reposições"
        descricao="Carregue novos relatórios de trocas comerciais, reposições de rota e avarias para consolidar na plataforma e recalcular os indicadores."
        sampleFileName="modelo_trocas_reposicoes.json"
        sampleJsonGenerator={sampleJsonGenerator}
        onImportJson={onImportJson}
        onClearData={onClearData}
        currentCount={items.length}
        theme={theme}
      />

      {/* 6. TABELA DETALHADA DE LANÇAMENTOS COM BUSCA */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Registros e Detalhamento de Trocas & Reposições ({filteredList.length} registros)
            </h3>
            <p className="text-xs text-slate-400">Linha a linha dos registros operacionais de trocas e devoluções</p>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}>
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar produto, motivo, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-48 placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Cód</th>
                <th className="py-2.5 px-3">Produto</th>
                <th className="py-2.5 px-3 text-right">Qtd</th>
                <th className="py-2.5 px-3 text-right">R$ Total</th>
                <th className="py-2.5 px-3 text-right">HL</th>
                <th className="py-2.5 px-3">Motivo</th>
                <th className="py-2.5 px-3">Causa / Processo</th>
                <th className="py-2.5 px-3">Cliente / Rota</th>
                <th className="py-2.5 px-3">NF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredList.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-800/20 transition-all ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{item.data}</td>
                  <td className="py-2 px-3 font-mono text-slate-400">{item.codProduto}</td>
                  <td className="py-2 px-3 font-bold max-w-xs truncate" title={item.descricao}>{item.descricao}</td>
                  <td className="py-2 px-3 text-right font-bold">{item.quantidade}</td>
                  <td className="py-2 px-3 text-right font-black text-rose-400 whitespace-nowrap">
                    R$ {(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-sky-400 whitespace-nowrap">{(item.hlTotal || 0).toFixed(3)}</td>
                  <td className="py-2 px-3 text-slate-300">{item.motivo}</td>
                  <td className="py-2 px-3 text-slate-400">{item.causa}</td>
                  <td className="py-2 px-3 text-slate-400">{item.cliente || item.rota || '-'}</td>
                  <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{item.notaFiscal || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredList.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
