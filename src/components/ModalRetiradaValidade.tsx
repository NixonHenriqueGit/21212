import React, { useState, useEffect } from 'react';
import { ValidadeRow, Usuario } from '../types';
import { formatDateToBR, normalizeDateString } from '../utils/fefoDefaultData';
import { registrarRetiradaValidade, ValidadeRetiradaRecord } from '../utils/validadesRetiradasManager';
import { AlertTriangle, CheckCircle2, X, PackageMinus, ArrowRight, PlusCircle } from 'lucide-react';

interface ModalRetiradaValidadeProps {
  isOpen: boolean;
  onClose: () => void;
  item: ValidadeRow | null;
  user?: Usuario | null;
  empresaId?: string;
  onSuccess?: (record: ValidadeRetiradaRecord) => void;
}

export const ModalRetiradaValidade: React.FC<ModalRetiradaValidadeProps> = ({
  isOpen,
  onClose,
  item,
  user,
  empresaId = 'demo',
  onSuccess
}) => {
  if (!isOpen || !item) return null;

  const initialQty = Number(item.quantidade || (item as any).caixa || item.totalUnities || 11);
  const [quantidade, setQuantidade] = useState<number>(initialQty);
  const [destino, setDestino] = useState<'PNC / Quarentena' | 'Despejo' | 'Devolução Fábrica' | 'Baixa Operacional'>('PNC / Quarentena');
  const [motivo, setMotivo] = useState<string>('Vencimento atingido — recolhimento físico obrigatório DPO');
  const [conferenteNome, setConferenteNome] = useState<string>(user?.nome || 'Conferente CCO');
  const [observacoes, setObservacoes] = useState<string>('Lote vencido retirado para quarentena/baixa operacional.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Opção para cadastrar a nova validade ("e já tem uma aqui")
  const [cadastrarNovoLote, setCadastrarNovoLote] = useState<boolean>(false);
  const [novaValidadeStr, setNovaValidadeStr] = useState<string>('');
  const [novaQuantidade, setNovaQuantidade] = useState<number>(initialQty);
  const [novoLoteStr, setNovoLoteStr] = useState<string>('');

  useEffect(() => {
    setQuantidade(initialQty);
  }, [initialQty]);

  const handleConfirm = () => {
    if (quantidade <= 0) {
      alert('Por favor, informe uma quantidade válida para a retirada.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Registra a retirada oficial
      const record = registrarRetiradaValidade({
        codigo: item.codigo,
        descricao: item.descricao,
        validade: item.validade,
        lote: item.lote,
        quantidade,
        bloco: item.bloco || 'C1',
        localizacao: item.localizacao || 'central',
        motivo,
        destino,
        retiradoPor: conferenteNome,
        cargo: 'Conferente',
        observacoes
      }, empresaId);

      // 2. Se o conferente marcou para lançar a nova validade que "já tem aqui"
      if (cadastrarNovoLote && novaValidadeStr) {
        try {
          const valStorageKey = `validades_${empresaId}`;
          const currentRaw = localStorage.getItem(valStorageKey);
          let currentList: ValidadeRow[] = currentRaw ? JSON.parse(currentRaw) : [];
          if (!Array.isArray(currentList)) currentList = [];

          const formattedNovaValidade = formatDateToBR(novaValidadeStr);
          const newRow: ValidadeRow = {
            id: `val_novo_${item.codigo}_${Date.now()}`,
            codigo: String(item.codigo),
            descricao: item.descricao,
            palhete: 0,
            lastro: 0,
            caixa: novaQuantidade > 0 ? novaQuantidade : quantidade,
            quantidade: novaQuantidade > 0 ? novaQuantidade : quantidade,
            validade: formattedNovaValidade,
            lote: novoLoteStr || `LOT-${item.codigo}-${formattedNovaValidade.replace(/\//g, '')}`,
            localizacao: item.localizacao || 'central',
            bloco: item.bloco || 'C1',
            dataColeta: new Date().toLocaleDateString('pt-BR'),
            semanaNumero: 4,
            empresaId
          };

          currentList.push(newRow);
          localStorage.setItem(valStorageKey, JSON.stringify(currentList));
          window.dispatchEvent(new Event('validades_updated'));
          window.dispatchEvent(new Event('app_data_updated'));
        } catch (e) {
          console.error('Erro ao registrar novo lote substituto:', e);
        }
      }

      if (onSuccess) onSuccess(record);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao processar retirada de validade: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedVal = formatDateToBR(item.validade);
  const isVencendoHoje = (() => {
    const todayBR = formatDateToBR(new Date().toISOString());
    return formattedVal === todayBR;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#151b23] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <PackageMinus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                Retirar Validade do Armazém
              </h3>
              <p className="text-xs text-slate-400">
                Registro operacional de baixa física realizado pelo Conferente
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Item */}
        <div className="my-4 p-3.5 bg-[#0e1217] border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700">
              SKU: {item.codigo}
            </span>
            {isVencendoHoje && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                🚨 Vencimento Atingido (Hoje)
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Bloco: <strong>{item.bloco || 'C1'}</strong>
            </span>
          </div>

          <h4 className="text-sm font-bold text-white">{item.descricao}</h4>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Validade Atual:</span>
              <span className="font-mono font-bold text-red-400 text-sm">{formattedVal}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Lote:</span>
              <span className="font-mono text-slate-200">{item.lote || `LOT-${item.codigo}-20261002`}</span>
            </div>
          </div>
        </div>

        {/* Formulário de Retirada */}
        <div className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Quantidade Retirada (cx) *
              </label>
              <input
                type="number"
                min="1"
                value={quantidade}
                onChange={e => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#0c1015] border border-slate-700 text-white rounded-lg px-3 py-2 font-mono font-bold focus:border-red-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Destino Operacional *
              </label>
              <select
                value={destino}
                onChange={e => setDestino(e.target.value as any)}
                className="w-full bg-[#0c1015] border border-slate-700 text-white rounded-lg px-3 py-2 font-semibold focus:border-red-500 outline-hidden cursor-pointer"
              >
                <option value="PNC / Quarentena">🚨 PNC / Quarentena (Devolução)</option>
                <option value="Despejo">🗑 Despejo (Descarte Autorizado)</option>
                <option value="Devolução Fábrica">🏭 Devolução Direta à Fábrica</option>
                <option value="Baixa Operacional">📦 Baixa Operacional / Estoque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Motivo do Recolhimento / Retirada
            </label>
            <input
              type="text"
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full bg-[#0c1015] border border-slate-700 text-white rounded-lg px-3 py-2 focus:border-red-500 outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Conferente Responsável
              </label>
              <input
                type="text"
                value={conferenteNome}
                onChange={e => setConferenteNome(e.target.value)}
                className="w-full bg-[#0c1015] border border-slate-700 text-white rounded-lg px-3 py-2 focus:border-red-500 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Data do Recolhimento
              </label>
              <input
                type="text"
                disabled
                value={new Date().toLocaleDateString('pt-BR')}
                className="w-full bg-[#0c1015]/60 border border-slate-800 text-slate-400 rounded-lg px-3 py-2 font-mono"
              />
            </div>
          </div>

          {/* Opção para cadastrar novo lote ("e já tem uma aqui") */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-300 text-xs select-none">
              <input
                type="checkbox"
                checked={cadastrarNovoLote}
                onChange={e => setCadastrarNovoLote(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer"
              />
              <span>➕ Já chegou nova validade deste produto no armazém? Cadastrar agora!</span>
            </label>

            {cadastrarNovoLote && (
              <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Nova Validade (DD/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 15/12/2026"
                    value={novaValidadeStr}
                    onChange={e => setNovaValidadeStr(e.target.value)}
                    className="w-full bg-[#0c1015] border border-amber-500/50 text-white rounded-lg px-2.5 py-1.5 font-mono text-xs focus:border-amber-400 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Quantidade (cx)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={novaQuantidade}
                    onChange={e => setNovaQuantidade(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#0c1015] border border-amber-500/50 text-white rounded-lg px-2.5 py-1.5 font-mono text-xs focus:border-amber-400 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Novo Lote
                  </label>
                  <input
                    type="text"
                    placeholder={`LOT-${item.codigo}-NOVO`}
                    value={novoLoteStr}
                    onChange={e => setNovoLoteStr(e.target.value)}
                    className="w-full bg-[#0c1015] border border-amber-500/50 text-white rounded-lg px-2.5 py-1.5 font-mono text-xs focus:border-amber-400 outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-900/40 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Registrando...' : 'Confirmar Retirada do Armazém'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default ModalRetiradaValidade;
