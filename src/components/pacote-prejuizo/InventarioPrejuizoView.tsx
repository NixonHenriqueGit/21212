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
  PieChart, 
  Pie 
} from 'recharts';
import { 
  ExternalLink, 
  Boxes, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  Scale, 
  Package, 
  Calendar, 
  Search, 
  Filter, 
  RotateCcw, 
  FileSpreadsheet, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Building2,
  AlertCircle
} from 'lucide-react';
import { InventarioPerdaItem } from '../../utils/pacotePrejuizoManager';
import { 
  INVENTARIO_PLATAFORMA_EXTERNA_URL, 
  INVENTARIO_OFICIAL_CONSOLIDADO,
  buildOfficialInventarioDataset 
} from '../../data/inventarioOfficialDataset';
import { JsonImportZone } from './JsonImportZone';

interface InventarioPrejuizoViewProps {
  items: InventarioPerdaItem[];
  companyId: string;
  theme?: 'light' | 'dark';
  unitMode?: 'reais' | 'hl';
  onImportJson: (jsonContent: string) => { success: boolean; count: number; error?: string };
  onClearData: () => void;
  onRestoreOfficial: () => void;
  sampleJsonGenerator: () => string;
}

export const InventarioPrejuizoView: React.FC<InventarioPrejuizoViewProps> = ({
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
  const [activeSubTab, setActiveSubTab] = useState<'visao_oficial' | 'detalhes_skus' | 'alimentar_json'>('visao_oficial');
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = INVENTARIO_OFICIAL_CONSOLIDADO;

  // Totais reais calculados dos itens salvos
  const totalFaltasCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.valorTotal || 0), 0);
  }, [items]);

  const totalHlCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.hlTotal || 0), 0);
  }, [items]);

  const totalQtdItensFalta = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.quantidade || 0), 0);
  }, [items]);

  // Lista filtrada para a tabela analítica
  const filteredList = useMemo(() => {
    return items.filter(it => {
      if (selectedGroup !== 'todos') {
        const descUpper = (it.descricao || '').toUpperCase();
        const obsUpper = (it.observacao || '').toUpperCase();
        if (!descUpper.includes(selectedGroup.toUpperCase()) && !obsUpper.includes(selectedGroup.toUpperCase())) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCod = String(it.codProduto || '').toLowerCase().includes(q);
        const matchDesc = String(it.descricao || '').toLowerCase().includes(q);
        const matchRua = String(it.ruaPosicao || '').toLowerCase().includes(q);
        const matchCausa = String(it.causa || '').toLowerCase().includes(q);
        if (!matchCod && !matchDesc && !matchRua && !matchCausa) return false;
      }

      return true;
    });
  }, [items, selectedGroup, searchTerm]);

  // Gráfico Faltas vs Sobras
  const barChartData = [
    { name: 'Faltas (Perdas)', valor: stats.faltasTotais, fill: '#ef4444' },
    { name: 'Sobras (Excedentes)', valor: stats.sobrasTotais, fill: '#10b981' }
  ];

  // Gráfico Donut de Acuracidade de Itens
  const donutData = [
    { name: 'Itens 100% Corretos', value: stats.skusCorretos, color: '#3b82f6' },
    { name: 'Itens em Falta', value: stats.skusFalta, color: '#ef4444' },
    { name: 'Itens em Sobra', value: stats.skusSobra, color: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO (IDÊNTICO À IMAGEM OFICIAL) */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/20' 
          : 'bg-gradient-to-r from-white via-indigo-50/50 to-white border-indigo-200'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-black tracking-wider flex items-center gap-1.5 uppercase">
              <Scale className="w-3.5 h-3.5" />
              {stats.modulo}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-black tracking-wider flex items-center gap-1.5 uppercase">
              <Building2 className="w-3.5 h-3.5" />
              {stats.distribuidora}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{stats.periodo}</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab('alimentar_json')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Alimentar Faltas & Sobras</span>
            </button>

            <a
              href={INVENTARIO_PLATAFORMA_EXTERNA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              title="Abrir plataforma externa de auditoria de estoque"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Plataforma Externa</span>
            </a>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>{stats.unidade ? 'DASHBOARD DE FALTAS & SOBRAS — PRODUTO ACABADO' : 'DASHBOARD DE FALTAS & SOBRAS'}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Inventário físico vs disponível • {stats.unidade} — <strong className="text-amber-400">{stats.totalSkusAuditados} SKUs auditados</strong> — Estoque Total: <strong className="text-emerald-400">R$ {stats.estoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </p>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('visao_oficial')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'visao_oficial'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Visão Consolidada Oficial
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('detalhes_skus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'detalhes_skus'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>Detalhamento dos SKUs com Falta ({items.length})</span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">
              -R$ {totalFaltasCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('alimentar_json')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'alimentar_json'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>Alimentar / Importar JSON</span>
          </button>

          <button
            type="button"
            onClick={onRestoreOfficial}
            className="ml-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            title="Restaurar dados originais consolidados da imagem"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Restaurar Oficial (R$ 23.231,79)</span>
          </button>
        </div>
      </div>

      {/* SUB-ABA 1: VISÃO OFICIAL CONSOLIDADA (IDÊNTICA À IMAGEM) */}
      {activeSubTab === 'visao_oficial' && (
        <div className="space-y-6">
          {/* BANNER DE ALERTA DE PREJUÍZO CONSOLIDADO */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-rose-400 uppercase tracking-wider">
                  Valor Consolidado no Pacote Prejuízo
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  O valor de <strong className="text-rose-400 font-black">R$ 23.231,79 (129 SKUs com falta)</strong> é integralmente somado às perdas totais operacionais do negócio.
                </div>
              </div>
            </div>

            <a
              href={INVENTARIO_PLATAFORMA_EXTERNA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <span>Acessar Auditoria na Íntegra</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 5 CARDS DE KPIS CONSOLIDADOS (IDÊNTICOS AO TOPO DA IMAGEM) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. VALOR DO ESTOQUE */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-black tracking-wider uppercase">VALOR DO ESTOQUE</span>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                R$ {stats.estoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 mt-2">
                <strong>{stats.totalSkusAuditados}</strong> SKUs inventariados
              </div>
            </div>

            {/* 2. DIFERENÇA LÍQUIDA */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-black tracking-wider uppercase">DIFERENÇA LÍQUIDA</span>
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                R$ {stats.diferencaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-emerald-400/90 mt-2 font-medium">
                Superávit no inventário
              </div>
            </div>

            {/* 3. FALTAS TOTAIS (CIRCULADO EM VERMELHO NA IMAGEM) */}
            <div className="p-5 rounded-2xl border-2 border-rose-500/80 bg-rose-950/20 shadow-lg shadow-rose-900/20 relative">
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider">
                Impacto Prejuízo
              </div>
              <div className="flex items-center justify-between text-rose-300 mb-2">
                <span className="text-xs font-black tracking-wider uppercase">FALTAS TOTAIS</span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-400">
                -R$ {stats.faltasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-xs text-rose-300/80 mt-2">
                <span><strong>{stats.faltasQtdProdutos}</strong> produtos</span>
                <span className="font-bold text-rose-400">{stats.faltasPct.toFixed(2)}%</span>
              </div>
            </div>

            {/* 4. SOBRAS TOTAIS */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-black tracking-wider uppercase">SOBRAS TOTAIS</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                +R$ {stats.sobrasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-xs text-emerald-400/80 mt-2">
                <span><strong>{stats.sobrasQtdProdutos}</strong> produtos</span>
                <span className="font-bold text-emerald-400">{stats.sobrasPct.toFixed(2)}%</span>
              </div>
            </div>

            {/* 5. ACURACIDADE SKUS (ALTERADA CONFORME SOLICITADO PELO USUÁRIO PARA 77,6%) */}
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-black tracking-wider uppercase">ACURACIDADE SKUS</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-400">
                {stats.acuracidadeSkusPct.toFixed(1)}%
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span><strong>{stats.skusCorretos}</strong> de 206 OK</span>
                <span className="text-emerald-400 font-bold">100% batimento</span>
              </div>
            </div>
          </div>

          {/* 3 PAINÉIS ANALÍTICOS INFERIORES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* PAINEL 1: IMPACTO FINANCEIRO BRUTO (R$) - FALTAS VS SOBRAS */}
            <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-amber-400" />
                    <span>Impacto Financeiro Bruto (R$)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">FALTAS VS SOBRAS</span>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Comparativo em valor monetário absoluto apurado no inventário físico
                </p>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                        formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                      />
                      <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 mt-4">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                  <div className="text-[10px] font-bold text-rose-300 uppercase">FALTAS</div>
                  <div className="text-sm font-black text-rose-400">
                    -R$ {stats.faltasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <div className="text-[10px] font-bold text-emerald-300 uppercase">SOBRAS</div>
                  <div className="text-sm font-black text-emerald-400">
                    +R$ {stats.sobrasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            {/* PAINEL 2: DIFERENÇA LÍQUIDA POR GRUPO */}
            <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Diferença Líquida por Grupo</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">POSIÇÃO LÍQUIDA</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Saldo financeiro (R$) acumulado por categoria de embalagem
                </p>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {stats.diferencaPorGrupo.map((g, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        g.tipo === 'falta'
                          ? 'bg-rose-950/20 border-rose-900/30'
                          : 'bg-emerald-950/20 border-emerald-900/30'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{g.grupo}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {g.skus} SKUs • Estoque: R$ {g.estoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black ${g.tipo === 'falta' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {g.saldoFinanceiro < 0 ? '-' : '+'}R$ {Math.abs(g.saldoFinanceiro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={`text-[10px] font-bold ${g.tipo === 'falta' ? 'text-rose-400/80' : 'text-emerald-400/80'}`}>
                          {g.percentualImpacto > 0 ? `+${g.percentualImpacto}%` : `${g.percentualImpacto}%`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-center pt-3 border-t border-slate-800 mt-2 font-medium">
                Total de <strong>{stats.gruposMapeadosTotal} grupos</strong> mapeados na unidade
              </div>
            </div>

            {/* PAINEL 3: ACURACIDADE DE ITENS (SKUS) COM DONUT */}
            <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Acuracidade de Itens (SKUs)</span>
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">CONTAGEM</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Proporção de itens sem divergência versus itens com falta ou sobra
                </p>

                <div className="h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">
                      {stats.acuracidadeSkusPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      ACURACIDADE
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-slate-300">Itens 100% Corretos</span>
                  </div>
                  <span className="font-bold text-blue-400">{stats.skusCorretos} SKUs</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="text-slate-300">Itens em Falta</span>
                  </div>
                  <span className="font-bold text-rose-400">{stats.skusFalta} SKUs</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">Itens em Sobra</span>
                  </div>
                  <span className="font-bold text-emerald-400">{stats.skusSobra} SKUs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 2: DETALHAMENTO ANALÍTICO DOS 129 SKUS COM FALTA */}
      {activeSubTab === 'detalhes_skus' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Detalhamento dos SKUs com Perda Físico vs Sistêmico</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-rose-500/20 text-rose-400 font-black">
                    {filteredList.length} itens
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Listagem completa dos itens com faltas apuradas no fechamento de inventário físico.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar SKU, código, rua..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="todos">Todos os Grupos</option>
                  <option value="GARRAFA">Garrafas</option>
                  <option value="LATA">Latas</option>
                  <option value="ENVELOPE">Envelopes</option>
                  <option value="LONG NECK">Long Necks</option>
                  <option value="CHOPP">Chopp</option>
                  <option value="PET">PET</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição do SKU</th>
                    <th className="py-2.5 px-3 text-right">Qtd Falta</th>
                    <th className="py-2.5 px-3 text-right">R$ Prejuízo</th>
                    <th className="py-2.5 px-3 text-right">HL</th>
                    <th className="py-2.5 px-3">Posição / Setor</th>
                    <th className="py-2.5 px-3">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{item.data}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                          {item.tipoDivergencia}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{item.codProduto}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{item.descricao}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">{item.quantidade}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-400">
                        R$ {(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-400">
                        {(item.hlTotal || 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-medium">
                        {item.ruaPosicao || item.setorEstoque || 'Geral'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate" title={item.motivo}>
                        {item.motivo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredList.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum SKU encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 3: ALIMENTAR / IMPORTAR JSON */}
      {activeSubTab === 'alimentar_json' && (
        <div className="space-y-6">
          <JsonImportZone
            titulo="Importar Arquivo JSON de Perdas por Inventário"
            descricao="Carregue as divergências de contagem física vs disponível (faltas, avarias ocultas, extravios) para integração automática no Pacote Prejuízo."
            sampleFileName="modelo_perdas_inventario.json"
            sampleJsonGenerator={sampleJsonGenerator}
            onImportJson={onImportJson}
            onClearData={onClearData}
            currentCount={items.length}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
};
