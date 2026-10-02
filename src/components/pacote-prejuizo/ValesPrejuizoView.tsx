import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Calendar, 
  ExternalLink, 
  Search, 
  Download, 
  RefreshCw, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  User,
  Truck,
  ArrowRight
} from 'lucide-react';
import { ValePrejuizoItem } from '../../utils/pacotePrejuizoManager';
import { 
  VALES_PLATAFORMA_EXTERNA_URL, 
  VALES_OFICIAL_CONSOLIDADO,
  buildOfficialValesDataset
} from '../../data/valesOfficialDataset';
import { JsonImportZone } from './JsonImportZone';

interface ValesPrejuizoViewProps {
  items: ValePrejuizoItem[];
  companyId: string;
  theme?: 'light' | 'dark';
  unitMode?: 'reais' | 'hl';
  onImportJson: (jsonContent: string) => { success: boolean; count: number; error?: string };
  onClearData: () => void;
  onRestoreOfficial: () => void;
  sampleJsonGenerator: () => string;
}

export const ValesPrejuizoView: React.FC<ValesPrejuizoViewProps> = ({
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
  const [activeSubTab, setActiveSubTab] = useState<'acumulado' | 'mes_a_mes' | 'registros'>('acumulado');
  const [selectedMes, setSelectedMes] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = VALES_OFICIAL_CONSOLIDADO;

  // Totais reais calculados
  const totalCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.valorTotal || 0), 0);
  }, [items]);

  const totalHlCalculado = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.hlTotal || 0), 0);
  }, [items]);

  const totalValesCount = items.length;

  const mediaPorValeCalculada = totalValesCount > 0 ? totalCalculado / totalValesCount : 0;

  // Filtragem analítica
  const filteredList = useMemo(() => {
    return items.filter(it => {
      if (selectedMes !== 'todos') {
        const itemMes = (it.data || '').substring(0, 7);
        if (itemMes !== selectedMes) return false;
      }

      if (selectedStatus !== 'todos') {
        if (it.status !== selectedStatus) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mColab = (it.colaborador || '').toLowerCase().includes(q);
        const mNum = (it.numeroVale || '').toLowerCase().includes(q);
        const mMotivo = (it.motivo || '').toLowerCase().includes(q);
        const mDesc = (it.descricao || '').toLowerCase().includes(q);
        const mPlaca = (it.placa || '').toLowerCase().includes(q);
        if (!mColab && !mNum && !mMotivo && !mDesc && !mPlaca) return false;
      }

      return true;
    });
  }, [items, selectedMes, selectedStatus, searchTerm]);

  // Exportação CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Data', 'Nº Vale', 'Colaborador', 'Função', 'Valor Total (R$)', 'HL', 'Status', 'Motivo', 'Placa', 'Observação'];
    const rows = items.map(it => [
      it.id,
      it.data,
      `"${it.numeroVale || ''}"`,
      `"${(it.colaborador || '').replace(/"/g, '""')}"`,
      `"${(it.funcao || '').replace(/"/g, '""')}"`,
      (it.valorTotal || 0).toFixed(2),
      (it.hlTotal || 0).toFixed(4),
      `"${it.status || ''}"`,
      `"${(it.motivo || '').replace(/"/g, '""')}"`,
      `"${it.placa || ''}"`,
      `"${(it.observacao || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `base_oficial_vales_rateio_2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Estilo Painel Vales & Rateio Operacional */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-[#0f172a] border-slate-800 shadow-2xl' 
          : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Award className="w-8 h-8" />
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                  PAINEL DE VALES & RATEIO OPERACIONAL
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SSTR 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Controle de vias de cobrança, desconto por condutor/ajudante e fechamento acumulado
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Toggle de Guias Estilo Imagem */}
            <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveSubTab('acumulado')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'acumulado'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Guia Principal (Acumulado)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('mes_a_mes')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'mes_a_mes'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Guia Mês a Mês</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab('registros')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'registros'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Registros ({items.length})</span>
              </button>
            </div>

            {/* Link Direto para a Plataforma Externa Solicitado pelo Usuário */}
            <a
              href={VALES_PLATAFORMA_EXTERNA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all transform hover:scale-[1.02] cursor-pointer"
              title="Abrir a visão detalhada na plataforma externa"
            >
              <span>Acessar Painel Detalhado</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

          </div>
        </div>
      </div>

      {/* 4 Cards Principais Idênticos à Imagem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: VALES ACUMULADOS NO ANO */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#111827] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              VALES ACUMULADOS NO ANO
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-mono">
                {stats.valesAcumulados}
              </span>
              <span className="text-xs font-bold text-slate-400">unidades</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Consolidado geral de todas as emissões
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: VOLUME TOTAL (ANO) */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#111827] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
              VOLUME TOTAL (ANO)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {stats.volumeTotalHl.toFixed(4)}
              </span>
              <span className="text-xs font-bold text-amber-400">HL</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Hectolitros totais para acerto com condutores
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: MONTANTE DE COBRANÇAS (ACUMULADO) */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#111827] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              MONTANTE DE COBRANÇAS (ACUMULADO)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono">
                R$ {stats.montanteCobrancas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Valor financeiro dos termos emitidos
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: MÉDIA POR VALE FATURADO */}
        <div className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
          isDark ? 'bg-[#111827] border-slate-800/80 shadow-md' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              MÉDIA POR VALE FATURADO
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-purple-300 font-mono">
                R$ {stats.mediaPorVale.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Ticket médio por ocorrência registrada
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* SEÇÃO PRINCIPAL: MATRIZ COMPARATIVA MÊS A MÊS (JANEIRO A DEZEMBRO DE 2026) */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-[#0b1120] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider">
                MATRIZ COMPARATIVA MÊS A MÊS (JANEIRO A DEZEMBRO DE 2026)
              </h3>
              <p className="text-xs text-slate-400">
                Clique em qualquer mês para abrir a visão analítica isolada daquele período
              </p>
            </div>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Total Geral: </span>
            <span className="font-black text-emerald-400">
              R$ {stats.montanteCobrancas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400"> ({stats.valesAcumulados} vales)</span>
          </div>
        </div>

        {/* Grid dos 12 Meses Exatamente como na Imagem */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {stats.matrizMensal.map((m) => {
            const hasData = m.vales > 0;
            const isSelected = selectedMes === m.mes;

            return (
              <div
                key={m.mes}
                onClick={() => {
                  if (isSelected) {
                    setSelectedMes('todos');
                  } else {
                    setSelectedMes(m.mes);
                    setActiveSubTab('registros');
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/50'
                    : isDark 
                    ? 'bg-[#111827]/90 border-slate-800/80 hover:border-slate-700 hover:bg-[#1f2937]/70' 
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {/* Linha Top: Nome do Mês + Badge de Quantidade de Vales */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white tracking-wider">
                    {m.mesNome}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${
                    hasData 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {m.vales} v.
                  </span>
                </div>

                {/* Valores em R$ e HL */}
                <div className="my-3 space-y-1">
                  <div className="text-sm md:text-base font-black text-emerald-400 font-mono">
                    R$ {m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs font-bold text-sky-400 font-mono">
                    {m.hl.toFixed(3)} HL
                  </div>
                </div>

                {/* Link de Rodapé do Card */}
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-blue-400 transition-colors">
                  <span>Ver Mês</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* GUIA MÊS A MÊS OU REGISTROS ANALÍTICOS */}
      {activeSubTab === 'registros' && (
        <div className="space-y-6">
          
          {/* Zona de Importação JSON de Vales */}
          <JsonImportZone
            titulo="Importar Arquivo JSON de Vales Emitidos & Cobranças SSTR"
            descricao="Carregue novas vias de cobrança operacional, descontos em folha e termos de acerto de rota."
            sampleFileName="modelo_vales_emitidos_2026.json"
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
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar colaborador, vale, motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={selectedMes}
                onChange={(e) => setSelectedMes(e.target.value)}
                className="py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="todos">Todos os Meses (2026)</option>
                {stats.matrizMensal.map(m => (
                  <option key={m.mes} value={m.mes}>{m.mesNome} ({m.vales} vales - R$ {m.valor.toFixed(2)})</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="todos">Todos os Status</option>
                <option value="Liquidado / Descontado">Liquidado / Descontado</option>
                <option value="Pendente de Acerto">Pendente de Acerto</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Exportar CSV</span>
              </button>

              <button
                type="button"
                onClick={onRestoreOfficial}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                title="Recarrega a base oficial de 51 vales"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar Oficial (51 Vales)</span>
              </button>
            </div>
          </div>

          {/* Tabela de Vales */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Registros de Vales ({filteredList.length} de {items.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Nº Vale</th>
                    <th className="py-2.5 px-3">Colaborador / Condutor</th>
                    <th className="py-2.5 px-3">Função</th>
                    <th className="py-2.5 px-3 text-right">R$ Cobrança</th>
                    <th className="py-2.5 px-3 text-right">HL</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Motivo / Causa</th>
                    <th className="py-2.5 px-3">Placa / Rota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-sans">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{item.data}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{item.numeroVale || item.id}</td>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.colaborador}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{item.funcao}</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400 font-mono">
                        R$ {(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-400">
                        {(item.hlTotal || 0).toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'Liquidado / Descontado'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{item.motivo}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{item.placa || item.observacao || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredList.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum registro de vale encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
