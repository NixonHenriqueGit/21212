import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  AreaChart, 
  Area, 
  Line,
  Legend
} from 'recharts';
import { 
  RotateCcw, 
  ExternalLink, 
  Layers, 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Factory, 
  Package, 
  Calendar, 
  FileSpreadsheet, 
  Download, 
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Droplet,
  PieChart as PieIcon,
  BarChart3,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { RefugoPrejuizoItem } from '../../utils/pacotePrejuizoManager';
import { 
  REFUGO_POWERBI_URL, 
  REFUGO_OFICIAL_CONSOLIDADO,
  buildOfficialRefugoDataset
} from '../../data/refugoOfficialDataset';
import { JsonImportZone } from './JsonImportZone';

interface RefugoPrejuizoViewProps {
  items: RefugoPrejuizoItem[];
  companyId: string;
  theme?: 'light' | 'dark';
  unitMode?: 'reais' | 'hl';
  onImportJson: (jsonContent: string) => { success: boolean; count: number; error?: string };
  onClearData: () => void;
  onRestoreOfficial: () => void;
  sampleJsonGenerator: () => string;
}

export const RefugoPrejuizoView: React.FC<RefugoPrejuizoViewProps> = ({
  items,
  companyId,
  theme = 'dark',
  unitMode,
  onImportJson,
  onClearData,
  onRestoreOfficial,
  sampleJsonGenerator
}) => {
  const isDark = theme !== 'light';
  const [activeSubTab, setActiveSubTab] = useState<'visao_bi' | 'materiais_fabricas' | 'registros'>('visao_bi');
  const [selectedFabrica, setSelectedFabrica] = useState<string>('todas');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = REFUGO_OFICIAL_CONSOLIDADO;

  // Totais reais calculados a partir dos itens salvos
  const totalCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.valorTotal || 0), 0);
  }, [items]);

  const totalHlCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.hlTotal || 0), 0);
  }, [items]);

  const totalUnidadesCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.quantidade || 0), 0);
  }, [items]);

  // Lista filtrada para a tabela analítica
  const filteredList = useMemo(() => {
    return items.filter(it => {
      if (selectedFabrica !== 'todas') {
        const c = (it.causa || it.linhaTriagem || it.observacao || '').toLowerCase();
        if (!c.includes(selectedFabrica.toLowerCase())) return false;
      }

      if (selectedCategoria !== 'todas') {
        if (it.tipoAtivo !== selectedCategoria) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mDesc = (it.descricao || '').toLowerCase().includes(q);
        const mCod = String(it.codProduto || '').toLowerCase().includes(q);
        const mDef = (it.tipoDefeito || '').toLowerCase().includes(q);
        const mCausa = (it.causa || '').toLowerCase().includes(q);
        const mObs = (it.observacao || '').toLowerCase().includes(q);
        if (!mDesc && !mCod && !mDef && !mCausa && !mObs) return false;
      }

      return true;
    });
  }, [items, selectedFabrica, selectedCategoria, searchTerm]);

  // Exportação CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Data', 'Tipo Ativo', 'Código', 'Descrição', 'Quantidade', 'Valor Total (R$)', 'HL Total', 'Defeito', 'Causa', 'Linha / Fábrica', 'Observação'];
    const rows = items.map(it => [
      it.id,
      it.data,
      `"${it.tipoAtivo}"`,
      it.codProduto || '',
      `"${(it.descricao || '').replace(/"/g, '""')}"`,
      it.quantidade,
      (it.valorTotal || 0).toFixed(2),
      (it.hlTotal || 0).toFixed(4),
      `"${(it.tipoDefeito || '').replace(/"/g, '""')}"`,
      `"${(it.causa || '').replace(/"/g, '""')}"`,
      `"${(it.linhaTriagem || '').replace(/"/g, '""')}"`,
      `"${(it.observacao || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `base_oficial_refugo_ativos_2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cores de fábrica
  const getFactoryColor = (index: number) => {
    const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      
      {/* Banner de Acesso Direto ao Power BI Oficial */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/30 shadow-2xl' 
          : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 shadow-md'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CONSOLIDADO OFICIAL POWER BI
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                8 MESES CONSOLIDADOS (JAN - AGO 2026)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                VOLUME LÍQUIDO: 0 HL (EXCLUSIVO ATIVOS & EMBALAGENS)
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <RotateCcw className="w-6 h-6 text-emerald-400" />
              <span>Refugo de Vasilhames & Ativos de Giro</span>
            </h2>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Base oficial consolidada de perdas por refugo de vasilhames, garrafas quebradas na triagem, avarias de garrafeiras plásticas e pallets. O refugo representa perda financeira de embalagem/ativo de giro e <strong>não entra no cálculo de perda em hectolitros (0 HL)</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={REFUGO_POWERBI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
              title="Abrir relatório detalhado no Power BI"
            >
              <span>Abrir Relatório no Power BI</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={handleExportCsv}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700' 
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Base (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 5 KPI Cards (Exatamente idênticos ao Power BI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Meta vs Real */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">META</span>
            <span className="text-sm font-bold text-slate-300 font-mono">
              R$ {stats.metaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="my-2 py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 uppercase tracking-wide">REAL</span>
            <div className="text-right">
              <div className="text-base font-black text-rose-500 font-mono flex items-center gap-1 justify-end">
                <span className="text-xs">▼</span>
                <span>R$ {stats.realTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <span className="text-slate-400 font-bold">Gap %</span>
            <span className="font-bold text-rose-400 font-mono flex items-center gap-0.5">
              <span>▼</span>
              <span>{stats.gapPct.toFixed(2)}%</span>
            </span>
          </div>
        </div>

        {/* Card 2: Top Material */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NOME</span>
            <span className="text-xs font-bold text-slate-200 truncate block mt-0.5" title={stats.topMaterial.nomeCompleto}>
              {stats.topMaterial.nome}
            </span>
          </div>

          <div className="my-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">VALOR</span>
            <div className="text-lg font-black text-emerald-400 font-mono">
              R$ 115,61 Mil
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <span className="text-slate-400 font-bold">PERCENTUAL</span>
            <span className="font-bold text-emerald-400 font-mono">
              {stats.topMaterial.percentual}%
            </span>
          </div>
        </div>

        {/* Card 3: Top Fábrica */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NOME</span>
            <span className="text-xs font-bold text-slate-200 block mt-0.5">
              {stats.topFabrica.nome}
            </span>
          </div>

          <div className="my-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">VALOR</span>
            <div className="text-lg font-black text-blue-400 font-mono">
              R$ 209,80 Mil
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <span className="text-slate-400 font-bold">PERCENTUAL</span>
            <span className="font-bold text-blue-400 font-mono">
              {stats.topFabrica.percentual}%
            </span>
          </div>
        </div>

        {/* Card 4: Índice Médio */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">ÍNDICE MÉDIO</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Taxa de refugo de ativos</span>
          </div>

          <div className="my-2 flex items-center justify-center">
            <div className="text-3xl font-black text-white font-mono">
              {stats.indiceMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <span className="text-slate-400 font-bold">PADRÃO DPO</span>
            <span className="font-bold text-emerald-400 font-mono">&lt; 2,00%</span>
          </div>
        </div>

        {/* Card 5: Total Ativos */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">TOTAL ATIVOS</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Vasilhames auditados</span>
          </div>

          <div className="my-2 flex items-center justify-center">
            <div className="text-2xl font-black text-sky-400 font-mono">
              {stats.totalAtivos.toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
            <span className="text-slate-400 font-bold">TOTAL SALVO</span>
            <span className="font-bold text-slate-300 font-mono">R$ {totalCalculado.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>

      {/* Sub-Tabs de Navegação Interna */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('visao_bi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'visao_bi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 Visão Executiva Power BI
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('materiais_fabricas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'materiais_fabricas'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏭 Detalhamento por Fábrica & Material
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('registros')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'registros'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>📋 Base de Registros</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {items.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRestoreOfficial}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Recarrega os dados oficiais do Power BI"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restaurar Base Oficial BI</span>
        </button>
      </div>

      {/* VIEW 1: VISÃO EXECUTIVA POWER BI */}
      {activeSubTab === 'visao_bi' && (
        <div className="space-y-6">
          
          {/* Grid de Gráficos: Custo por Material & Custo por Fábrica */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gráfico Custo por Material (7 colunas) */}
            <div className={`lg:col-span-7 p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-400" />
                    Custo por Material
                  </h3>
                  <span className="text-xs text-slate-400">Ranking por valor total refugado (R$)</span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">
                  Top 1: 42,35%
                </span>
              </div>

              {/* Gráfico de barras verticais de material */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.custoPorMaterial.slice(0, 7)} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
                    <XAxis 
                      dataKey="material" 
                      stroke="#94a3b8" 
                      fontSize={9} 
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      tickFormatter={(val) => val.length > 15 ? val.substring(0, 13) + '...' : val}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false}
                      tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Custo Refugo']}
                      labelFormatter={(label) => `Material: ${label}`}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Bar dataKey="valor" fill="#1d4ed8" radius={[6, 6, 0, 0]}>
                      {stats.custoPorMaterial.slice(0, 7).map((entry, index) => (
                        <Cell key={`mat-${index}`} fill={index === 0 ? '#1e40af' : index === 1 ? '#2563eb' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Lista detalhada dos materiais com barras de progresso */}
              <div className="mt-4 space-y-2 border-t border-slate-800/60 pt-4">
                {stats.custoPorMaterial.slice(0, 5).map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs gap-3">
                    <span className="text-slate-300 font-medium truncate max-w-[260px]" title={mat.material}>
                      {idx + 1}. {mat.material}
                    </span>
                    <div className="flex items-center gap-3 shrink-0 font-mono">
                      <span className="font-bold text-white">
                        R$ {mat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-bold w-12 text-right">
                        {mat.percentual}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico Custo por Fábrica (5 colunas) */}
            <div className={`lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Factory className="w-4 h-4 text-indigo-400" />
                      Custo por Fábrica
                    </h3>
                    <span className="text-xs text-slate-400">Distribuição por planta de origem</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    5 Plantas
                  </span>
                </div>

                {/* Barras Horizontais com Percentuais */}
                <div className="space-y-4 my-2">
                  {stats.custoPorFabrica.map((fab, idx) => (
                    <div key={fab.fabrica} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200">{fab.fabrica}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-indigo-300">
                            R$ {fab.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">({fab.percentual}%)</span>
                        </div>
                      </div>
                      
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${fab.percentual}%`,
                            backgroundColor: idx === 0 ? '#1e40af' : idx === 1 ? '#3b82f6' : '#60a5fa'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Refugado por Fábricas</span>
                <span className="font-black text-white font-mono">
                  R$ {stats.realTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </div>

          {/* Gráfico Custo por Mês (Evolução 2026 - Real vs Meta) */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Custo por Mês — Total Refugo vs Total Meta
                </h3>
                <span className="text-xs text-slate-400">
                  Comparativo mensal oficial (Janeiro a Agosto de 2026)
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-indigo-900 border border-indigo-400" />
                  <span className="text-slate-300 font-bold">Total Refugo (Real)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-sky-400" />
                  <span className="text-slate-300 font-bold">Total Meta</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.evolucaoMensal} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorRefugoReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4338ca" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4338ca" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRefugoMeta" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.5} />
                  <XAxis dataKey="mesNome" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      name === 'real' ? 'Total Refugo (Real)' : 'Total Meta'
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="real" 
                    name="real" 
                    stroke="#3730a3" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRefugoReal)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="meta" 
                    name="meta" 
                    stroke="#38bdf8" 
                    strokeWidth={2.5} 
                    dot={{ fill: '#38bdf8', r: 4 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Grid dos Meses com Valores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4 pt-4 border-t border-slate-800">
              {stats.evolucaoMensal.map((m) => (
                <div key={m.mes} className={`p-2.5 rounded-xl border text-center ${
                  m.real > m.meta ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.mesNome}</span>
                  <div className="text-xs font-black text-white font-mono mt-1">
                    R$ {(m.real / 1000).toFixed(1)}k
                  </div>
                  <span className={`text-[10px] font-mono font-bold block ${
                    m.real > m.meta ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {m.gapPct > 0 ? `+${m.gapPct.toFixed(0)}%` : `${m.gapPct.toFixed(0)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: DETALHAMENTO POR FÁBRICA & MATERIAL */}
      {activeSubTab === 'materiais_fabricas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Tabela de Todos os Materiais */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              Ranking Completo de Materiais Refugados
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Material / Ativo</th>
                    <th className="py-2.5 px-3 text-right">Valor Total (R$)</th>
                    <th className="py-2.5 px-3 text-right">% Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {stats.custoPorMaterial.map((mat, i) => (
                    <tr key={i} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-slate-500 font-bold">{i + 1}</td>
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{mat.material}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        R$ {mat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-400">
                        {mat.percentual}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela e Análise de Fábricas */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-black text-white uppercase mb-4 flex items-center gap-2">
              <Factory className="w-4 h-4 text-indigo-400" />
              Desempenho por Unidade Produtora / Fábrica
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Fábrica</th>
                    <th className="py-2.5 px-3 text-right">Valor Total (R$)</th>
                    <th className="py-2.5 px-3 text-right">Participação</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-mono">
                  {stats.custoPorFabrica.map((fab, i) => (
                    <tr key={i} className="hover:bg-slate-800/20">
                      <td className="py-3 px-3 font-sans font-bold text-slate-200">{fab.fabrica}</td>
                      <td className="py-3 px-3 text-right font-bold text-indigo-400">
                        R$ {fab.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-300">
                        {fab.percentual}%
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          fab.percentual > 50 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {fab.percentual > 50 ? 'Ofensora Principal' : 'Controlada'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 space-y-1.5">
              <span className="font-bold block">💡 Insights do Analista de Dados:</span>
              <p className="text-slate-300">
                A <strong>F. Pernambuco</strong> concentra <strong>76,85%</strong> (R$ 209,80 Mil) do refugo total de vasilhames, principalmente em garrafas 635ml e 1L retornáveis. Recomenda-se plano de ação conjunto na triagem de entrada e despaletização da fábrica.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 3: BASE DE REGISTROS ANALÍTICOS */}
      {activeSubTab === 'registros' && (
        <div className="space-y-6">
          
          {/* Zona de Importação JSON */}
          <JsonImportZone
            titulo="Importar Arquivo JSON de Refugo de Vasilhames e Ativos"
            descricao="Carregue novas aferições de refugo ou atualize os lotes de descarte de garrafas, garrafeiras e paletes."
            sampleFileName="modelo_refugo_ativos_2026.json"
            sampleJsonGenerator={sampleJsonGenerator}
            onImportJson={onImportJson}
            onClearData={onClearData}
            currentCount={items.length}
            theme={theme}
          />

          {/* Filtros e Busca */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar material, código, defeito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="todas">Todos os Ativos</option>
                <option value="Garrafa Vidro">Garrafa Vidro</option>
                <option value="Garrafeira Plástica">Garrafeira Plástica</option>
                <option value="Pallet PBR">Pallet PBR</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Exibindo <strong>{filteredList.length}</strong> de <strong>{items.length}</strong> registros</span>
            </div>
          </div>

          {/* Tabela de Refugo */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo Ativo</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição Material</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3 text-right">R$ Total</th>
                    <th className="py-2.5 px-3 text-right">HL</th>
                    <th className="py-2.5 px-3">Defeito</th>
                    <th className="py-2.5 px-3">Causa / Fábrica</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{item.data}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.tipoAtivo === 'Garrafa Vidro' 
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.tipoAtivo === 'Garrafeira Plástica'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.tipoAtivo}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400">{item.codProduto || '-'}</td>
                      <td className="py-2 px-3 font-bold text-white">{item.descricao}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-300 font-mono">{item.quantidade.toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-400 font-mono">
                        R$ {(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400">
                        0,0000 <span className="text-[9px] text-slate-500 block">0 HL</span>
                      </td>
                      <td className="py-2 px-3 text-rose-400">{item.tipoDefeito}</td>
                      <td className="py-2 px-3 text-slate-400">{item.causa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredList.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum registro de refugo encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
