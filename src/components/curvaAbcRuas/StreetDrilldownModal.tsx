import React, { useState, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowRight, 
  Boxes, 
  Package, 
  ArrowUpDown,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { DesvioAderenciaRow } from '../CurvaAbcAderenciaRuasTab';

interface StreetDrilldownModalProps {
  rua: string;
  allItemsInStreet: DesvioAderenciaRow[];
  onClose: () => void;
  onFilterMainTableByStreet: (rua: string) => void;
}

export const StreetDrilldownModal: React.FC<StreetDrilldownModalProps> = ({
  rua,
  allItemsInStreet,
  onClose,
  onFilterMainTableByStreet
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'NOK' | 'OK'>('NOK');
  const [sortField, setSortField] = useState<keyof DesvioAderenciaRow>('quantidadePallets');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const bloco = rua.charAt(0);

  // Totais da rua
  const stats = useMemo(() => {
    let totalPl = 0;
    let okPl = 0;
    let nokPl = 0;
    let criticoPl = 0;
    let alertaPl = 0;

    allItemsInStreet.forEach(item => {
      totalPl += item.quantidadePallets;
      if (item.statusOkNok === 'OK') {
        okPl += item.quantidadePallets;
      } else {
        nokPl += item.quantidadePallets;
        if (item.severidade === 'CRITICO') criticoPl += item.quantidadePallets;
        else alertaPl += item.quantidadePallets;
      }
    });

    const pctQuebra = totalPl > 0 ? (nokPl / totalPl) * 100 : 0;
    const pctAderencia = totalPl > 0 ? (okPl / totalPl) * 100 : 100;

    return {
      totalPl: Math.round(totalPl),
      okPl: Math.round(okPl),
      nokPl: Math.round(nokPl),
      criticoPl: Math.round(criticoPl),
      alertaPl: Math.round(alertaPl),
      pctQuebra,
      pctAderencia,
      totalLotes: allItemsInStreet.length,
      lotesQuebra: allItemsInStreet.filter(i => i.statusOkNok === 'NOK').length
    };
  }, [allItemsInStreet]);

  const filteredItems = useMemo(() => {
    let list = [...allItemsInStreet];
    if (filterType === 'NOK') {
      list = list.filter(i => i.statusOkNok === 'NOK');
    } else if (filterType === 'OK') {
      list = list.filter(i => i.statusOkNok === 'OK');
    }

    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [allItemsInStreet, filterType, sortField, sortAsc]);

  const handleSort = (field: keyof DesvioAderenciaRow) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#11192e] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* HEADER MODAL */}
        <div className="p-5 bg-gradient-to-r from-[#032147] to-[#121c38] text-white flex items-center justify-between border-b border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">
                  Detalhamento de Quebras e Itens na Rua {rua} (Bloco {bloco})
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {stats.pctQuebra.toFixed(1)}% de Quebra
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Lista de SKUs identificados pelo recolhimento de validade que estavam fora da sua rua ideal no Armazém Central.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* METRICS SUMMARY BAR */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total na Rua {rua}</span>
            <div className="text-lg font-black text-slate-900 dark:text-white">{stats.totalPl} <span className="text-xs font-normal text-slate-400">PL</span></div>
            <span className="text-[10px] text-slate-400">{stats.totalLotes} lotes coletados</span>
          </div>

          <div className="bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/5">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Pallets em Quebra (NOK)</span>
            <div className="text-lg font-black text-rose-500">{stats.nokPl} <span className="text-xs font-normal text-rose-300">PL</span></div>
            <span className="text-[10px] text-rose-400 font-bold">{stats.lotesQuebra} itens na rua errada</span>
          </div>

          <div className="bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Pallets Conformes (OK)</span>
            <div className="text-lg font-black text-emerald-500">{stats.okPl} <span className="text-xs font-normal text-emerald-300">PL</span></div>
            <span className="text-[10px] text-emerald-400">{stats.pctAderencia.toFixed(1)}% aderência</span>
          </div>

          <div className="bg-white dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Severidade dos Desvios</span>
            <div className="flex items-center gap-2 text-xs font-black">
              <span className="text-red-500">{stats.criticoPl} PL Críticos</span>
              <span className="text-slate-400">•</span>
              <span className="text-amber-500">{stats.alertaPl} PL Alerta</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Requer remanejamento</span>
          </div>
        </div>

        {/* FILTERS & ACTIONS BAR */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setFilterType('NOK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'NOK'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Apenas Quebras / NOK ({stats.lotesQuebra})
            </button>

            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Todos os Itens ({stats.totalLotes})
            </button>

            <button
              onClick={() => setFilterType('OK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'OK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Apenas Conformes / OK ({stats.totalLotes - stats.lotesQuebra})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFilterMainTableByStreet(rua);
                onClose();
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtrar Tabela Principal por Rua {rua}</span>
            </button>
          </div>
        </div>

        {/* TABELA DE ITENS DESVIADOS / DETALHADOS */}
        <div className="overflow-y-auto max-h-[450px] p-4">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black sticky top-0 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('codigo')}>
                  <div className="flex items-center gap-1">
                    <span>Código SKU</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 min-w-[200px]">Descrição Oficial</th>
                <th className="py-2.5 px-3 text-center cursor-pointer" onClick={() => handleSort('curvaAbcReal')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Curva Real</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Endereço Ideal</th>
                <th className="py-2.5 px-3 text-right font-black cursor-pointer text-blue-400" onClick={() => handleSort('quantidadePallets')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Pallets Fechados (PL)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Caixas</th>
                <th className="py-2.5 px-3 min-w-[200px]">Ação Recomendada de Remanejamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum item encontrado nesta categoria na Rua {rua}.
                  </td>
                </tr>
              ) : (
                filteredItems.map(row => {
                  const isOk = row.statusOkNok === 'OK';
                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        !isOk ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-400">{row.codigo}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-200">
                        {row.descricao}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          row.curvaAbcReal === 'A' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : row.curvaAbcReal === 'B'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}>
                          Curva {row.curvaAbcReal}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black border ${
                          isOk 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                            : row.severidade === 'CRITICO'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}>
                          {isOk ? 'OK' : 'NOK'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                        {row.ruaIdeal}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-blue-400 text-sm">
                        {row.quantidadePallets} PL
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        {row.quantidadeCaixas.toLocaleString('pt-BR')} cx
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          {!isOk && <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <span>{row.sugestaoAcao}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Exibindo {filteredItems.length} registros na Rua {rua}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            Fechar Detalhamento
          </button>
        </div>
      </div>
    </div>
  );
};
