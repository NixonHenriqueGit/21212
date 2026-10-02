import React from 'react';
import { ShelfItem } from '../utils/pncManager';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Box, 
  TrendingDown, 
  AlertTriangle 
} from 'lucide-react';

interface ShelfLifeChartsProps {
  items: ShelfItem[];
}

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  'Concluído': '#10b981',
  'Pendente': '#ef4444',
  'Em Andamento': '#f59e0b'
};

export const ShelfLifeCharts: React.FC<ShelfLifeChartsProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a]">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Nenhum dado de Shelf Life disponível para gerar gráficos.
        </p>
      </div>
    );
  }

  // 1. Métricas Totais
  const totalUnidades = items.reduce((acc, i) => acc + (i.quantidadeUnidades || 0), 0);
  const totalHectolitros = Number(items.reduce((acc, i) => acc + (i.hectolitros || 0), 0).toFixed(4));
  const totalValor = Number(items.reduce((acc, i) => acc + (i.valorTotal || 0), 0).toFixed(2));
  
  const itensDespejados = items.filter(i => i.statusDespejo === 'Concluído');
  const itensPendentes = items.filter(i => i.statusDespejo !== 'Concluído');
  
  const unDespejadas = itensDespejados.reduce((acc, i) => acc + (i.quantidadeUnidades || 0), 0);
  const unPendentes = itensPendentes.reduce((acc, i) => acc + (i.quantidadeUnidades || 0), 0);
  const hlDespejados = Number(itensDespejados.reduce((acc, i) => acc + (i.hectolitros || 0), 0).toFixed(4));
  const hlPendentes = Number(itensPendentes.reduce((acc, i) => acc + (i.hectolitros || 0), 0).toFixed(4));
  const valorDespejado = Number(itensDespejados.reduce((acc, i) => acc + (i.valorTotal || 0), 0).toFixed(2));
  const valorPendente = Number(itensPendentes.reduce((acc, i) => acc + (i.valorTotal || 0), 0).toFixed(2));
  
  const taxaDespejoUn = totalUnidades > 0 ? Math.round((unDespejadas / totalUnidades) * 100) : 0;

  // 2. Agrupamento por Produto / SKU
  const productMap: Record<string, { codigo: string; descricao: string; valorTotal: number; hectolitros: number; unidades: number; status: string }> = {};
  items.forEach(item => {
    const key = `${item.codigo} - ${item.descricao}`;
    if (!productMap[key]) {
      productMap[key] = {
        codigo: item.codigo,
        descricao: item.descricao,
        valorTotal: 0,
        hectolitros: 0,
        unidades: 0,
        status: item.statusDespejo
      };
    }
    productMap[key].valorTotal += item.valorTotal || 0;
    productMap[key].hectolitros += item.hectolitros || 0;
    productMap[key].unidades += item.quantidadeUnidades || 0;
  });

  const chartDataByProduct = Object.values(productMap).map(p => ({
    name: p.descricao.length > 20 ? `${p.descricao.substring(0, 18)}...` : p.descricao,
    fullName: p.descricao,
    codigo: p.codigo,
    valor: Number(p.valorTotal.toFixed(2)),
    hectolitros: Number(p.hectolitros.toFixed(4)),
    unidades: p.unidades
  })).sort((a, b) => b.valor - a.valor);

  // 3. Agrupamento por Status de Despejo
  const statusPieData = [
    { name: 'Despejado (Concluído)', value: unDespejadas, valor: valorDespejado, hl: hlDespejados, count: itensDespejados.length, color: '#10b981' },
    { name: 'Pendente (Na Baia)', value: unPendentes, valor: valorPendente, hl: hlPendentes, count: itensPendentes.length, color: '#ef4444' }
  ].filter(d => d.value > 0 || d.count > 0);

  // 4. Agrupamento por Mês de Vencimento
  const monthMap: Record<string, { mes: string; valor: number; hectolitros: number; unidades: number }> = {};
  items.forEach(item => {
    const d = item.data || item.validade || '2026-02-01';
    const monthKey = d.substring(0, 7); // YYYY-MM
    const monthLabel = monthKey === '2026-01' ? 'Jan/2026' : monthKey === '2026-02' ? 'Fev/2026' : monthKey;
    
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { mes: monthLabel, valor: 0, hectolitros: 0, unidades: 0 };
    }
    monthMap[monthKey].valor += item.valorTotal || 0;
    monthMap[monthKey].hectolitros += item.hectolitros || 0;
    monthMap[monthKey].unidades += item.quantidadeUnidades || 0;
  });

  const chartDataByMonth = Object.values(monthMap).sort((a, b) => a.mes.localeCompare(b.mes));

  return (
    <div className="flex flex-col gap-5">
      {/* KPI CARDS RESUMO EXECUTIVO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Valor */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151b23] border border-red-200 dark:border-red-950/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Perda Financeira Total
            </span>
            <span className="text-lg font-black text-red-600 dark:text-red-400">
              {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <div className="text-[10px] text-slate-400 font-medium">
              Centro 533 (Armazém)
            </div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Volume Desperdiçado
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              {totalHectolitros} <span className="text-xs text-slate-500 font-bold">hL</span>
            </span>
            <div className="text-[10px] text-slate-400 font-medium">
              {totalUnidades} unidades individuais
            </div>
          </div>
        </div>

        {/* Status Despejo Taxa */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151b23] border border-emerald-200 dark:border-emerald-950/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Executado / Despejado
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {taxaDespejoUn}% <span className="text-xs font-bold">({unDespejadas} un)</span>
            </span>
            <div className="text-[10px] text-emerald-600/80 font-medium">
              {hlDespejados} hL descartados
            </div>
          </div>
        </div>

        {/* Pendente Despejo */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#151b23] border border-amber-200 dark:border-amber-950/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Pendente na Baia
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {unPendentes} <span className="text-xs font-bold">unidades</span>
            </span>
            <div className="text-[10px] text-amber-600/80 font-medium">
              {valorPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ({hlPendentes} hL)
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRÁFICO 1: PERDA FINANCEIRA POR SKU (R$) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Perda Financeira por Produto (R$)
              </h4>
              <p className="text-[11px] text-slate-400">
                Valor monetário total acumulado por SKU em Shelf
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
              Total: {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByProduct} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Perda Financeira']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.codigo} - ${item.fullName}` : label;
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="valor" fill="#ef4444" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 2: VOLUME POR SKU (HL E UNIDADES) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Box className="w-4 h-4 text-blue-500" />
                Volume Físico em Hectolitros (hL)
              </h4>
              <p className="text-[11px] text-slate-400">
                Hectolitros calculados automaticamente por unidade de cada SKU
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Total: {totalHectolitros} hL
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByProduct} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <XAxis dataKey="codigo" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(v) => `${v} hL`} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    name === 'hectolitros' ? `${Number(value).toFixed(4)} hL` : `${value} un`, 
                    name === 'hectolitros' ? 'Hectolitros' : 'Unidades'
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.codigo} - ${item.fullName}` : label;
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="hectolitros" name="Volume (hL)" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 3: STATUS DE DESPEJO (DONUT) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Status Operacional de Despejo
              </h4>
              <p className="text-[11px] text-slate-400">
                Proporção de unidades já descartadas vs aguardando descarte
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {totalUnidades} Unidades
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    `${value} un (${item?.payload?.hl} hL | R$ ${Number(item?.payload?.valor).toFixed(2)})`, 
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRÁFICO 4: VENCIMENTO POR MÊS (EVOLUÇÃO) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Vencimentos por Mês (Jan x Fev 2026)
              </h4>
              <p className="text-[11px] text-slate-400">
                Valores e volumes segregados pelas datas de vencimento no armazém
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              Ano 2026
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataByMonth} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 10 }} />
                <Tooltip 
                  formatter={(value: any, name: any, item: any) => [
                    name === 'valor' ? `R$ ${Number(value).toFixed(2)}` : `${value} un`,
                    name === 'valor' ? 'Perda Financeira' : 'Unidades'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="valor" name="Perda (R$)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
