import React, { useState, useEffect, useMemo } from 'react';
import { 
  getValidadesRetiradas, 
  reverterRetiradaValidade, 
  ValidadeRetiradaRecord 
} from '../utils/validadesRetiradasManager';
import { 
  PackageMinus, 
  Search, 
  Filter, 
  RotateCcw, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Clock, 
  UserCheck, 
  MapPin,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ValidadesRetiradasTabProps {
  empresaId?: string;
  onRefresh?: () => void;
}

export const ValidadesRetiradasTab: React.FC<ValidadesRetiradasTabProps> = ({
  empresaId = 'demo',
  onRefresh
}) => {
  const [retiradasList, setRetiradasList] = useState<ValidadeRetiradaRecord[]>(() => getValidadesRetiradas(empresaId));
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [destinoFilter, setDestinoFilter] = useState<string>('todos');

  const loadData = () => {
    setRetiradasList(getValidadesRetiradas(empresaId));
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('validades_retiradas_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('validades_retiradas_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [empresaId]);

  const filteredList = useMemo(() => {
    return retiradasList.filter(item => {
      const matchSearch = !searchTerm || 
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.validade.includes(searchTerm);
      
      const matchDestino = destinoFilter === 'todos' || item.destino === destinoFilter;
      return matchSearch && matchDestino;
    });
  }, [retiradasList, searchTerm, destinoFilter]);

  const metrics = useMemo(() => {
    const totalLotes = retiradasList.length;
    const totalCaixas = retiradasList.reduce((acc, r) => acc + (r.quantidade || 0), 0);
    const pncCount = retiradasList.filter(r => r.destino === 'PNC / Quarentena').length;
    const despejoCount = retiradasList.filter(r => r.destino === 'Despejo').length;
    return { totalLotes, totalCaixas, pncCount, despejoCount };
  }, [retiradasList]);

  const handleReverter = (id: string, descricao: string) => {
    if (!window.confirm(`Deseja reverter a baixa do item "${descricao}"?\n\nEle voltará para a lista de estoque ativo de validades.`)) {
      return;
    }
    const success = reverterRetiradaValidade(id, empresaId);
    if (success) {
      loadData();
      if (onRefresh) onRefresh();
    }
  };

  const handleExportExcel = () => {
    if (filteredList.length === 0) return;
    const rows = filteredList.map(r => ({
      'Código SKU': r.codigo,
      'Descrição': r.descricao,
      'Validade Retirada': r.validade,
      'Lote': r.lote,
      'Quantidade (cx)': r.quantidade,
      'Bloco': r.bloco || 'C1',
      'Localização': r.localizacao,
      'Destino': r.destino,
      'Motivo': r.motivo,
      'Conferente': r.retiradoPor,
      'Data da Retirada': new Date(r.dataRetirada).toLocaleString('pt-BR'),
      'Observações': r.observacoes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Validades_Retiradas');
    XLSX.writeFile(wb, `Validades_Retiradas_CCO_Guarabira_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-5 text-left font-sans">
      {/* Header Banner */}
      <div className="bg-[#151b23] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
              Auditoria de Baixas
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono font-bold">
              Histórico Conferente
            </span>
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider mt-1.5 flex items-center gap-2">
            <PackageMinus className="w-5 h-5 text-red-400" />
            Validades Retiradas do Armazém (Baixas de Estoque)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Registro de auditoria de todos os lotes com prazo vencido ou críticos que foram retirados fisicamente das posições do armazém pelos conferentes.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={filteredList.length === 0}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0 shadow-xs"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Planilha Excel</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#11151c] border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lotes Retirados</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {metrics.totalLotes}
          </span>
        </div>

        <div className="p-3.5 bg-[#11151c] border border-red-500/30 rounded-xl">
          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Total Caixas Retiradas</span>
          <span className="text-2xl font-black text-red-400 font-mono mt-1 block">
            {metrics.totalCaixas.toLocaleString('pt-BR')} cx
          </span>
        </div>

        <div className="p-3.5 bg-[#11151c] border border-amber-500/30 rounded-xl">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Encaminhados PNC / Quarentena</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            {metrics.pncCount}
          </span>
        </div>

        <div className="p-3.5 bg-[#11151c] border border-purple-500/30 rounded-xl">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Encaminhados Despejo</span>
          <span className="text-2xl font-black text-purple-400 font-mono mt-1 block">
            {metrics.despejoCount}
          </span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-[#151b23] border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por SKU, descrição, lote ou validade..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#0c1015] border border-slate-700 text-white text-xs rounded-lg pl-9 pr-3 py-2 outline-hidden focus:border-red-500"
            />
          </div>

          <select
            value={destinoFilter}
            onChange={e => setDestinoFilter(e.target.value)}
            className="bg-[#0c1015] border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-hidden focus:border-red-500 cursor-pointer"
          >
            <option value="todos">Todos os Destinos</option>
            <option value="PNC / Quarentena">PNC / Quarentena</option>
            <option value="Despejo">Despejo</option>
            <option value="Devolução Fábrica">Devolução Fábrica</option>
            <option value="Baixa Operacional">Baixa Operacional</option>
          </select>
        </div>

        <span className="text-xs text-slate-400 font-mono self-end sm:self-auto shrink-0">
          Exibindo <strong>{filteredList.length}</strong> de <strong>{retiradasList.length}</strong> baixas
        </span>
      </div>

      {/* Tabela de Retiradas */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-[#151b23] border border-slate-800 rounded-2xl">
          <PackageMinus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-white font-bold text-sm">Nenhuma validade retirada encontrada</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Quando um conferente registrar a baixa física de um lote retirado do armazém, o registro de auditoria e destinação aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-[#11151c] shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#151b23] text-slate-300 border-b border-slate-800 uppercase text-[10px] font-black tracking-wider">
                <th className="py-3 px-3.5">SKU & Produto</th>
                <th className="py-3 px-3">Validade Retirada</th>
                <th className="py-3 px-3">Lote / Bloco</th>
                <th className="py-3 px-3 text-center">Quantidade Baixada</th>
                <th className="py-3 px-3">Destino</th>
                <th className="py-3 px-3">Conferente & Data</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredList.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                          {r.codigo}
                        </span>
                        <div>
                          <span className="font-bold text-white block">{r.descricao}</span>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">{r.motivo}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-slate-300">
                          {r.validade}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-mono text-slate-300 text-[11px] block">{r.lote}</span>
                      <span className="text-[10px] text-slate-400 block">Bloco {r.bloco || 'C1'}</span>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-black font-mono bg-red-950/60 text-red-300 border border-red-500/40">
                        {r.quantidade} cx
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        r.destino === 'PNC / Quarentena' 
                          ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                          : r.destino === 'Despejo'
                          ? 'bg-purple-950/60 text-purple-300 border-purple-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {r.destino}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold">{r.retiradoPor}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                        {new Date(r.dataRetirada).toLocaleString('pt-BR')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleReverter(r.id, r.descricao)}
                        title="Reverter baixa e devolver ao estoque ativo"
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto border border-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                        <span>Reverter</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default ValidadesRetiradasTab;
