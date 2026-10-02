import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  TrendingUp, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { calculateStockAgeIndex } from '../utils/calculateStockAgeIndex';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';

interface StockAgeRankingSectionProps {
  empresaId: string;
  metaStockAge?: number; // e.g. 80%
}

export function StockAgeRankingSection({
  empresaId = 'demo',
  metaStockAge = 80
}: StockAgeRankingSectionProps) {
  const empresaData = useEmpresaData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'conforme' | 'critico'>('todos');

  // Compute Stock Age Index for each registered item in validades / produtos
  const stockAgeItems = useMemo(() => {
    const validades = empresaData?.validades || [];
    const produtos = empresaData?.produtos || [];

    if (validades.length === 0 && produtos.length === 0) {
      // Generate standard realistic stock batch items from unit products if empty
      const baseSkus = [
        { sku: 'SKU-001', nome: 'Brahma Chopp 350ml', lote: 'L-2026-08', fab: '2026-01-10', val: '2026-07-10', totalDays: 180, colab: 'JOSE RONILDO DA SILVA' },
        { sku: 'SKU-002', nome: 'Skol Pilsen 350ml', lote: 'L-2026-09', fab: '2026-01-15', val: '2026-07-15', totalDays: 180, colab: 'MARIVALDO ARTUR ALVES' },
        { sku: 'SKU-003', nome: 'Antarctica Original 600ml', lote: 'L-2026-03', fab: '2025-11-01', val: '2026-05-01', totalDays: 180, colab: 'PAULO PEREIRA DA SILVA' },
        { sku: 'SKU-004', nome: 'Stella Artois 330ml Long Neck', lote: 'L-2026-04', fab: '2025-10-01', val: '2026-04-01', totalDays: 180, colab: 'GILSON ROSA DA SILVA' },
        { sku: 'SKU-005', nome: 'Corona Extra 330ml Long Neck', lote: 'L-2026-11', fab: '2026-02-01', val: '2026-08-01', totalDays: 180, colab: 'CICERO MATHEU DE OLIVEIRA SILVA' },
        { sku: 'SKU-006', nome: 'Guaraná Antarctica 2L PET', lote: 'L-2026-12', fab: '2026-02-10', val: '2026-08-10', totalDays: 180, colab: 'CICERO MATHEU DE OLIVEIRA SILVA' },
        { sku: 'SKU-007', nome: 'Budweiser 350ml Lata', lote: 'L-2026-01', fab: '2025-09-15', val: '2026-03-15', totalDays: 180, colab: 'JOSE GONCALVES DE SOUZA' },
        { sku: 'SKU-008', nome: 'Becks 330ml Long Neck', lote: 'L-2026-15', fab: '2026-02-20', val: '2026-08-20', totalDays: 180, colab: 'DJEANDERSON SOARES DO NASCIMENTO' }
      ];

      const today = new Date();
      return baseSkus.map(item => {
        const fabDate = new Date(item.fab);
        const valDate = new Date(item.val);
        const totalLife = Math.max(1, Math.round((valDate.getTime() - fabDate.getTime()) / (1000 * 60 * 60 * 24)));
        const remDays = Math.max(0, Math.round((valDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        const indexScore = Math.min(100, Math.max(0, Math.round((remDays / totalLife) * 1000) / 10));
        
        return {
          id: `item-${item.sku}`,
          sku: item.sku,
          nome: item.nome,
          lote: item.lote,
          dataFabricacao: item.fab,
          dataValidade: item.val,
          diasRestantes: remDays,
          vidaTotalDias: totalLife,
          stockAgeIndex: indexScore,
          meta: metaStockAge,
          isConforme: indexScore >= metaStockAge,
          responsavel: item.colab,
          status: indexScore >= metaStockAge ? '🟢 SAUDÁVEL' : indexScore >= 60 ? '🟡 ATENÇÃO' : '🔴 CRÍTICO'
        };
      });
    }

    const today = new Date();
    return validades.map((v: any, idx: number) => {
      const p: any = produtos.find((prod: any) => prod.id === v.produtoId || prod.sku === v.sku || prod.codigo === v.sku);
      const valDate = new Date(v.dataValidade || v.validade || '2026-06-01');
      const fabDate = new Date(v.dataFabricacao || v.fabricacao || '2026-01-01');
      const totalLife = Math.max(1, Math.round((valDate.getTime() - fabDate.getTime()) / (1000 * 60 * 60 * 24)));
      const remDays = Math.max(0, Math.round((valDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const indexScore = Math.min(100, Math.max(0, Math.round((remDays / totalLife) * 1000) / 10));

      const colab = LISTA_COLABORADORES_OFICIAIS[idx % LISTA_COLABORADORES_OFICIAIS.length]?.nome || 'Operação Geral';

      return {
        id: v.id || `val-${idx}`,
        sku: v.sku || p?.sku || p?.codigo || `SKU-${idx + 1}`,
        nome: v.nome || p?.nome || p?.descricao || `Produto ${idx + 1}`,
        lote: v.lote || `L-${idx + 1}`,
        dataFabricacao: fabDate.toISOString().split('T')[0],
        dataValidade: valDate.toISOString().split('T')[0],
        diasRestantes: remDays,
        vidaTotalDias: totalLife,
        stockAgeIndex: indexScore,
        meta: metaStockAge,
        isConforme: indexScore >= metaStockAge,
        responsavel: colab,
        status: indexScore >= metaStockAge ? '🟢 SAUDÁVEL' : indexScore >= 60 ? '🟡 ATENÇÃO' : '🔴 CRÍTICO'
      };
    });
  }, [empresaData, metaStockAge]);

  const filteredItems = useMemo(() => {
    return stockAgeItems.filter(item => {
      if (statusFilter === 'conforme' && !item.isConforme) return false;
      if (statusFilter === 'critico' && item.isConforme) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          item.sku.toLowerCase().includes(q) ||
          item.nome.toLowerCase().includes(q) ||
          item.lote.toLowerCase().includes(q) ||
          item.responsavel.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => b.stockAgeIndex - a.stockAgeIndex);
  }, [stockAgeItems, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    if (stockAgeItems.length === 0) return { avgIndex: 0, conformesPct: 0, total: 0, criticos: 0 };
    const avgIndex = Math.round((stockAgeItems.reduce((acc, i) => acc + i.stockAgeIndex, 0) / stockAgeItems.length) * 10) / 10;
    const conformesCount = stockAgeItems.filter(i => i.isConforme).length;
    const conformesPct = Math.round((conformesCount / stockAgeItems.length) * 100);
    const criticos = stockAgeItems.length - conformesCount;

    return {
      avgIndex,
      conformesPct,
      total: stockAgeItems.length,
      criticos
    };
  }, [stockAgeItems]);

  return (
    <div className="space-y-6">
      {/* BANNER PRINCIPAL DO STOCK AGE INDEX */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 p-6 rounded-2xl text-white shadow-md border border-blue-600/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                PRODUTIVIDADE DE GIRO & VALIDADES
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                META PLATAFORMA: ≥ {metaStockAge}%
              </span>
            </div>
            <h2 className="text-xl font-black mt-1.5 flex items-center gap-2 text-white">
              <Calendar className="w-6 h-6 text-cyan-400" />
              Stock Age Index (Índice de Idade do Estoque & FEFO)
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-3xl leading-relaxed">
              Mapeamento do percentual de vida útil restante por SKU e lote contra a meta de integridade de estoque da revenda.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 p-3.5 rounded-xl flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-black block">Índice Médio Geral</span>
              <strong className="text-2xl font-mono font-black text-cyan-400">{stats.avgIndex}%</strong>
            </div>
            <div className="text-right pl-4 border-l border-white/20">
              <span className="text-[10px] text-blue-200 uppercase font-black block">Itens Conformes</span>
              <span className="text-sm font-black text-white">{stats.conformesPct}% ({stats.total - stats.criticos}/{stats.total})</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Meta Oficial</span>
          <strong className="text-2xl font-black text-blue-600 dark:text-indigo-400">≥ {metaStockAge}.0%</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Vida útil restante mínima</span>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">SKUs Monitorados</span>
          <strong className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Lotes com controle de validade</span>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Itens com Desvio (Abaixo da Meta)</span>
          <strong className={`text-2xl font-black ${stats.criticos === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {stats.criticos}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Requer priorização no FEFO</span>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Taxa de Conformidade</span>
          <strong className={`text-2xl font-black ${stats.conformesPct >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
            {stats.conformesPct}%
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">dos lotes atendem a meta</span>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" /> Status:
          </span>
          {(['todos', 'conforme', 'critico'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                statusFilter === f
                  ? 'bg-blue-600 dark:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0b1222] text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {f === 'todos' ? 'Todos os Lotes' : f === 'conforme' ? '🟢 Conformes (≥ 80%)' : '🔴 Atenção / Crítico (< 80%)'}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por SKU, Produto, Lote ou Responsável..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-4 py-2 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* TABELA DE RANKING POR ITEM DE STOCK AGE */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            Ranking de Produtividade e Saúde por Item ({filteredItems.length} itens)
          </h3>
          <span className="text-[10px] text-slate-500">Classificação por percentual de vida útil restante</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b1222] text-slate-600 dark:text-slate-400 font-black uppercase text-[9px] border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">#</th>
                <th className="p-3">SKU / Produto</th>
                <th className="p-3">Lote / Fabricação</th>
                <th className="p-3 text-center">Dias Restantes</th>
                <th className="p-3 text-center">Stock Age Index vs Meta</th>
                <th className="p-3">Responsável</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 font-black text-slate-900 dark:text-white">{idx + 1}º</td>
                  <td className="p-3">
                    <span className="text-blue-600 dark:text-indigo-400 font-mono text-[10px] font-bold block">{item.sku}</span>
                    <strong className="text-slate-900 dark:text-white text-xs">{item.nome}</strong>
                  </td>
                  <td className="p-3 text-[11px]">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.lote}</span>
                    <span className="text-[10px] text-slate-500 block">Val: {item.dataValidade}</span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{item.diasRestantes} dias</td>
                  <td className="p-3 text-center font-mono">
                    <strong className={`text-sm ${item.isConforme ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500 font-black'}`}>
                      {item.stockAgeIndex}%
                    </strong>
                    <span className="text-[9px] text-slate-400 block">Meta: ≥{metaStockAge}%</span>
                  </td>
                  <td className="p-3 text-xs text-slate-800 dark:text-slate-200">{item.responsavel}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      item.isConforme
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">
                    Nenhum item de Stock Age encontrado para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
