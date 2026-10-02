import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle2, 
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  BlitzEstoqueRegistro, 
  MotivoDivergenciaItem, 
  MOTIVOS_PADRAO_BLITZ,
  calcularSaudeEstoque,
  getBlitzEstoqueRecords,
  saveBlitzEstoqueRecords,
  upsertBlitzEstoqueRecord,
  deleteBlitzEstoqueRecord
} from '../utils/blitzEstoqueUtils';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';

interface BlitzEstoqueSectionProps {
  empresaId: string;
  metaSaude?: number; // padrão 80%
  onRecalcular?: () => void;
}

export function BlitzEstoqueSection({
  empresaId = 'demo',
  metaSaude = 80,
  onRecalcular
}: BlitzEstoqueSectionProps) {
  const [records, setRecords] = useState<BlitzEstoqueRegistro[]>(() => 
    getBlitzEstoqueRecords(empresaId, metaSaude)
  );

  // Form states for creating / editing monthly record
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formMesAno, setFormMesAno] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [formTotalItens, setFormTotalItens] = useState<number>(100);
  const [formDivNaoJust, setFormDivNaoJust] = useState<number>(0);
  const [formDivJust, setFormDivJust] = useState<number>(0);
  const [formResponsavel, setFormResponsavel] = useState<string>(LISTA_COLABORADORES_OFICIAIS[0]?.nome || '');
  const [formMotivos, setFormMotivos] = useState<MotivoDivergenciaItem[]>([]);

  // States for adding an individual divergence reason
  const [newMotivoText, setNewMotivoText] = useState(MOTIVOS_PADRAO_BLITZ[0]);
  const [newMotivoQtd, setNewMotivoQtd] = useState(1);
  const [newMotivoColab, setNewMotivoColab] = useState(LISTA_COLABORADORES_OFICIAIS[0]?.nome || '');
  const [newMotivoSku, setNewMotivoSku] = useState('');
  const [newMotivoObs, setNewMotivoObs] = useState('');

  const [savedFeedback, setSavedFeedback] = useState(false);

  // Sync records on meta change or external updates
  useEffect(() => {
    const handleUpdate = () => {
      setRecords(getBlitzEstoqueRecords(empresaId, metaSaude));
    };
    window.addEventListener('blitz_estoque_updated', handleUpdate);
    window.addEventListener('dpo_targets_updated', handleUpdate);
    return () => {
      window.removeEventListener('blitz_estoque_updated', handleUpdate);
      window.removeEventListener('dpo_targets_updated', handleUpdate);
    };
  }, [empresaId, metaSaude]);

  // Real-time calculated health for the active form
  const formCalculatedHealth = useMemo(() => {
    return calcularSaudeEstoque(formTotalItens, formDivNaoJust);
  }, [formTotalItens, formDivNaoJust]);

  const handleStartEdit = (rec: BlitzEstoqueRegistro) => {
    setEditingId(rec.id);
    setFormMesAno(rec.mesAno);
    setFormTotalItens(rec.totalItensAvaliados);
    setFormDivNaoJust(rec.divergentesNaoJustificados);
    setFormDivJust(rec.divergentesJustificados || 0);
    setFormResponsavel(rec.responsavelAuditoria);
    setFormMotivos(rec.motivosDivergencias || []);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const resetForm = () => {
    const d = new Date();
    setFormMesAno(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setFormTotalItens(100);
    setFormDivNaoJust(0);
    setFormDivJust(0);
    setFormResponsavel(LISTA_COLABORADORES_OFICIAIS[0]?.nome || '');
    setFormMotivos([]);
  };

  const handleAddMotivo = () => {
    if (!newMotivoText || newMotivoQtd <= 0) return;
    const item: MotivoDivergenciaItem = {
      id: `mot-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      motivo: newMotivoText,
      quantidade: Number(newMotivoQtd),
      colaborador: newMotivoColab,
      sku: newMotivoSku.trim() || undefined,
      observacao: newMotivoObs.trim() || undefined
    };
    setFormMotivos(prev => [...prev, item]);
    setNewMotivoQtd(1);
    setNewMotivoSku('');
    setNewMotivoObs('');
  };

  const handleRemoveMotivo = (id: string) => {
    setFormMotivos(prev => prev.filter(m => m.id !== id));
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMesAno || formTotalItens <= 0) return;

    const [ano, mes] = formMesAno.split('-');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesNum = parseInt(mes, 10);
    const mesLabel = `${monthNames[mesNum - 1] || mes} / ${ano}`;

    const saude = calcularSaudeEstoque(formTotalItens, formDivNaoJust);

    const record: BlitzEstoqueRegistro = {
      id: editingId || `blitz-${formMesAno}`,
      mesAno: formMesAno,
      mesLabel,
      totalItensAvaliados: Number(formTotalItens),
      divergentesNaoJustificados: Number(formDivNaoJust),
      divergentesJustificados: Number(formDivJust),
      saudeEstoquePct: saude,
      meta: metaSaude,
      status: saude >= metaSaude ? 'DENTRO DA META' : 'FORA DA META',
      responsavelAuditoria: formResponsavel,
      dataFechamento: new Date().toISOString().split('T')[0],
      motivosDivergencias: formMotivos
    };

    const updated = upsertBlitzEstoqueRecord(empresaId, record);
    setRecords(updated);
    setEditingId(null);
    resetForm();

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);

    if (onRecalcular) onRecalcular();
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este fechamento mensal de Blitz de Estoque?')) {
      const updated = deleteBlitzEstoqueRecord(empresaId, id);
      setRecords(updated);
      if (onRecalcular) onRecalcular();
    }
  };

  // Aggregated stats
  const stats = useMemo(() => {
    if (records.length === 0) {
      return { avgSaude: 0, conformesCount: 0, totalAvaliado: 0, totalDivNaoJust: 0, desviosCount: 0 };
    }
    const sumSaude = records.reduce((acc, r) => acc + r.saudeEstoquePct, 0);
    const avgSaude = Math.round((sumSaude / records.length) * 10) / 10;
    const conformesCount = records.filter(r => r.saudeEstoquePct >= metaSaude).length;
    const desviosCount = records.length - conformesCount;
    const totalAvaliado = records.reduce((acc, r) => acc + r.totalItensAvaliados, 0);
    const totalDivNaoJust = records.reduce((acc, r) => acc + r.divergentesNaoJustificados, 0);

    return {
      avgSaude,
      conformesCount,
      desviosCount,
      totalAvaliado,
      totalDivNaoJust
    };
  }, [records, metaSaude]);

  return (
    <div className="space-y-6">
      {/* BANNER PRINCIPAL DO INDICADOR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 rounded-2xl text-white shadow-md border border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                GOVERNANÇA DE INVENTÁRIO & CONTROLE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-400/30">
                META: ≥ {metaSaude}% SAÚDE
              </span>
            </div>
            <h2 className="text-xl font-black mt-1.5 flex items-center gap-2 text-white">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Blitz de Estoque & Indicador de Saúde do Estoque (Físico vs Fiscal)
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-3xl leading-relaxed">
              Mensuração contínua de divergências entre saldo físico e saldo fiscal não justificadas.
              A meta estabelecida é manter a <strong>Saúde do Estoque acima de {metaSaude}%</strong>.
            </p>
          </div>

          <div className="bg-white/10 border border-white/20 p-3.5 rounded-xl flex items-center gap-4 shrink-0">
            <div>
              <span className="text-[10px] text-blue-200 uppercase font-black block">Saúde Média Anual</span>
              <strong className="text-2xl font-mono font-black text-emerald-400">{stats.avgSaude}%</strong>
            </div>
            <div className="text-right pl-4 border-l border-white/20">
              <span className="text-[10px] text-blue-200 uppercase font-black block">Meses Conformes</span>
              <span className="text-sm font-black text-white">{stats.conformesCount} / {records.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Meta Vigente</span>
          <strong className="text-2xl font-black text-blue-600 dark:text-indigo-400">≥ {metaSaude}.0%</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">Saúde de Estoque mínima</span>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total de Itens Auditados</span>
          <strong className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalAvaliado}</strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">itens em contagens cegas</span>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Divergências Não Justificadas</span>
          <strong className={`text-2xl font-black ${stats.totalDivNaoJust === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
            {stats.totalDivNaoJust}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">impactam a saúde do estoque</span>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Status dos Fechamentos</span>
          <strong className={`text-2xl font-black ${stats.desviosCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
            {stats.desviosCount === 0 ? '100% OK' : `${stats.desviosCount} Desvio(s)`}
          </strong>
          <span className="text-[10px] text-slate-400 block mt-0.5">{stats.conformesCount} dentro da meta</span>
        </div>
      </div>

      {/* FORMULÁRIO DE LANÇAMENTO / EDIÇÃO MÊS A MÊS */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {editingId ? 'Editar Fechamento Mensal de Blitz' : 'Registrar / Atualizar Fechamento Mensal (Real Manual)'}
            </h3>
          </div>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSaveRecord} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Mês / Ano</label>
              <input
                type="month"
                value={formMesAno}
                onChange={e => setFormMesAno(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Total de Itens Avaliados</label>
              <input
                type="number"
                min="1"
                value={formTotalItens}
                onChange={e => setFormTotalItens(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400 block mb-1">Divergências Não Justificadas</label>
              <input
                type="number"
                min="0"
                max={formTotalItens}
                value={formDivNaoJust}
                onChange={e => setFormDivNaoJust(Math.max(0, Number(e.target.value)))}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-[#0b1222] border border-rose-300 dark:border-rose-700/60 rounded-xl text-rose-600 dark:text-rose-400 outline-none focus:border-rose-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">Responsável pela Auditoria</label>
              <select
                value={formResponsavel}
                onChange={e => setFormResponsavel(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-blue-500"
              >
                {LISTA_COLABORADORES_OFICIAIS.map(c => (
                  <option key={c.matricula} value={c.nome}>
                    {c.nome} ({c.cargo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIMULAÇÃO EM TEMPO REAL DA FÓRMULA */}
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-indigo-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300">
                <strong>Fórmula de Saúde:</strong> (({formTotalItens} total - {formDivNaoJust} divergentes) ÷ {formTotalItens}) × 100 = 
                <strong className={`ml-1 font-mono text-sm ${formCalculatedHealth >= metaSaude ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                  {formCalculatedHealth}%
                </strong>
              </span>
            </div>
            <div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                formCalculatedHealth >= metaSaude 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
              }`}>
                {formCalculatedHealth >= metaSaude ? '🟢 DENTRO DA META (≥ 80%)' : '🔴 FORA DA META / DESVIO'}
              </span>
            </div>
          </div>

          {/* ESTRATIFICAÇÃO DE MOTIVOS DAS DIVERGÊNCIAS */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-[#0b1222]/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
                Ramificação de Motivos das Divergências ({formMotivos.length} lançados)
              </span>
              <span className="text-[10px] text-slate-500">Opcional para análise de causa raiz</span>
            </div>

            {/* Inserção de novo motivo */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-4">
                <select
                  value={newMotivoText}
                  onChange={e => setNewMotivoText(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  {MOTIVOS_PADRAO_BLITZ.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  value={newMotivoQtd}
                  onChange={e => setNewMotivoQtd(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={newMotivoColab}
                  onChange={e => setNewMotivoColab(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                >
                  {LISTA_COLABORADORES_OFICIAIS.map(c => (
                    <option key={c.matricula} value={c.nome}>{c.nome.split(' ').slice(0, 2).join(' ')}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="SKU / Ref"
                  value={newMotivoSku}
                  onChange={e => setNewMotivoSku(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-1">
                <button
                  type="button"
                  onClick={handleAddMotivo}
                  className="w-full h-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center cursor-pointer shadow-xs"
                  title="Adicionar motivo"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de motivos cadastrados no formulário */}
            {formMotivos.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {formMotivos.map(m => (
                  <div key={m.id} className="p-2 bg-white dark:bg-[#111a30] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300">
                        {m.quantidade} un
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">{m.motivo}</strong>
                      {m.sku && <span className="text-slate-500 font-mono text-[10px]">({m.sku})</span>}
                      <span className="text-[10px] text-blue-600 dark:text-indigo-400 font-semibold">• Resp: {m.colaborador}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMotivo(m.id)}
                      className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-transform hover:scale-[1.02] active:scale-95"
            >
              <Save className="w-4 h-4" /> {editingId ? 'Salvar Alterações do Mês' : 'Salvar Fechamento Mensal'}
            </button>
          </div>
        </form>
      </div>

      {/* TABELA DE REGISTROS MENSAIS REAIS */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-indigo-400" />
            Histórico Mensal de Saúde do Estoque ({records.length} meses registrados)
          </h3>
          <span className="text-[10px] text-slate-500">Dados reais persistidos</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#0b1222] text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="p-3">Mês / Ano</th>
                <th className="p-3 text-center">Itens Auditados</th>
                <th className="p-3 text-center">Divergências Não Justificadas</th>
                <th className="p-3 text-center">Saúde Real vs Meta</th>
                <th className="p-3">Responsável</th>
                <th className="p-3">Ramificação de Motivos</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              {records.map(rec => {
                const isConforme = rec.saudeEstoquePct >= metaSaude;
                return (
                  <tr key={rec.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <strong className="text-slate-900 dark:text-white font-bold block">{rec.mesLabel}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">{rec.mesAno}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold">{rec.totalItensAvaliados} un</td>
                    <td className="p-3 text-center font-mono font-bold">
                      <span className={rec.divergentesNaoJustificados === 0 ? 'text-emerald-600' : 'text-rose-600 dark:text-rose-400'}>
                        {rec.divergentesNaoJustificados} un
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono">
                      <strong className={`text-sm ${isConforme ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500 font-black'}`}>
                        {rec.saudeEstoquePct}%
                      </strong>
                      <span className="text-[9px] text-slate-400 block">Meta: ≥{metaSaude}%</span>
                    </td>
                    <td className="p-3 text-xs text-slate-800 dark:text-slate-200">{rec.responsavelAuditoria}</td>
                    <td className="p-3 text-xs max-w-xs">
                      {rec.motivosDivergencias && rec.motivosDivergencias.length > 0 ? (
                        <div className="space-y-0.5">
                          {rec.motivosDivergencias.slice(0, 2).map((m, idx) => (
                            <span key={idx} className="block text-[11px] text-slate-600 dark:text-slate-400 truncate">
                              • {m.quantidade}x {m.motivo} ({m.colaborador.split(' ')[0]})
                            </span>
                          ))}
                          {rec.motivosDivergencias.length > 2 && (
                            <span className="text-[10px] text-blue-600 dark:text-indigo-400 font-bold">
                              +{rec.motivosDivergencias.length - 2} outros motivos
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 italic">Sem divergências</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        isConforme
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
                      }`}>
                        {isConforme ? '🟢 DENTRO DA META' : '🔴 FORA DA META'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEdit(rec)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer"
                          title="Editar mês"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 cursor-pointer"
                          title="Excluir mês"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 dark:text-slate-500 italic">
                    Nenhum fechamento de Blitz de Estoque registrado. Preencha o formulário acima para registrar.
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
