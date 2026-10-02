import React, { useState, useEffect } from 'react';
import { ShelfItem, PncItem, getProductConversionData, saveShelfItem, savePncItem, enrichPncItem } from '../utils/pncManager';
import { PRODUCTS } from '../planosData';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { 
  X, 
  Plus, 
  Upload, 
  Check, 
  AlertTriangle, 
  Layers, 
  DollarSign, 
  Box, 
  Calendar, 
  FileSpreadsheet, 
  Trash2, 
  Info 
} from 'lucide-react';

// =========================================================================
// MODAL 1: NOVO ITEM SHELF LIFE (MANUAL COM CÁLCULOS AUTOMÁTICOS)
// =========================================================================
interface NewShelfItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: ShelfItem) => void;
  empresaId: string;
}

export const NewShelfItemModal: React.FC<NewShelfItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  empresaId
}) => {
  const todayISO = new Date().toISOString().substring(0, 10);
  
  const [data, setData] = useState<string>(todayISO);
  const [codigo, setCodigo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [quantidadeUnidades, setQuantidadeUnidades] = useState<number | ''>('');
  const [lote, setLote] = useState<string>('');
  const [validade, setValidade] = useState<string>(todayISO);
  const [codigoMotivo, setCodigoMotivo] = useState<string>('533');
  const [departamento, setDepartamento] = useState<string>('ARMAZEM');
  const [motivoDescricao, setMotivoDescricao] = useState<string>('PRODUTO VENCIDO - ARMAZEM');
  const [localizacao, setLocalizacao] = useState<string>('Armazém Central');
  const [bloco, setBloco] = useState<string>('Bloco B');
  const [statusDespejo, setStatusDespejo] = useState<'Pendente' | 'Concluído' | 'Em Andamento'>('Pendente');
  const [observacoes, setObservacoes] = useState<string>('');

  // Auto-calculated fields
  const [fatorHectoPorUnidade, setFatorHectoPorUnidade] = useState<number>(0.0035);
  const [precoUnitario, setPrecoUnitario] = useState<number>(2.50);

  // Recalcular dados quando o SKU muda
  useEffect(() => {
    if (codigo) {
      const conv = getProductConversionData(codigo, descricao);
      setDescricao(conv.descricao);
      setFatorHectoPorUnidade(conv.fatorHectoPorUnidade);
      setPrecoUnitario(conv.precoUnitario);
    }
  }, [codigo]);

  if (!isOpen) return null;

  const qtdNum = Number(quantidadeUnidades) || 0;
  const calculatedHectolitros = Number((qtdNum * fatorHectoPorUnidade).toFixed(4));
  const calculatedValorTotal = Number((qtdNum * precoUnitario).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || qtdNum <= 0) {
      alert('Por favor, informe o SKU e a quantidade em unidades.');
      return;
    }

    const saved = saveShelfItem({
      data,
      codigo,
      descricao: descricao || `Produto ${codigo}`,
      quantidadeUnidades: qtdNum,
      codigoMotivo,
      departamento,
      motivoDescricao,
      precoUnitario,
      valorTotal: calculatedValorTotal,
      hectolitros: calculatedHectolitros,
      fatorHectoPorUnidade,
      lote: lote || `LOTE-${Date.now().toString().substring(8)}`,
      validade: validade || data,
      localizacao,
      bloco,
      statusDespejo,
      dataDespejo: statusDespejo === 'Concluído' ? todayISO : undefined,
      executadoPor: statusDespejo === 'Concluído' ? 'Ajudante de Armazém' : undefined,
      observacoes
    }, empresaId);

    onSuccess(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 dark:border-[#222d3a] flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                Novo Item em Shelf Life (Produto Vencido)
              </h3>
              <p className="text-[11px] text-slate-400">
                Cadastro manual com conversão automática de Unidades para Hectolitros e Valor Financeiro
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU / Código */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Código SKU *
              </label>
              <input
                type="text"
                list="shelf-products-list"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ex: 4293, 19321, 29580, 2008..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
              />
              <datalist id="shelf-products-list">
                {PRODUCTS.map((p, idx) => (
                  <option key={`shelf-opt-${p.codigo}-${idx}`} value={p.codigo}>{p.descricao}</option>
                ))}
              </datalist>
            </div>

            {/* Data do Registro / Vencimento */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Data de Vencimento / Registro *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  setValidade(e.target.value);
                }}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>

            {/* Descrição do Produto */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Descrição do Produto
              </label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição completa do produto"
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>

            {/* Quantidade em UNIDADES */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Quantidade em UNIDADES *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantidadeUnidades}
                onChange={(e) => setQuantidadeUnidades(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 144, 14, 12, 4..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>

            {/* Lote */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Número do Lote
              </label>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ex: L25350P, L25380G..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>

            {/* Preço Unitário Manual / Fator Hecto Manual */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={precoUnitario}
                onChange={(e) => setPrecoUnitario(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Fator Hectolitro/Unidade (hL)
              </label>
              <input
                type="number"
                step="0.0001"
                value={fatorHectoPorUnidade}
                onChange={(e) => setFatorHectoPorUnidade(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
              />
            </div>

            {/* Motivo & Centro */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Código & Motivo
              </label>
              <input
                type="text"
                value={`${codigoMotivo} - ${departamento} - ${motivoDescricao}`}
                readOnly
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-100 dark:bg-[#0d1117]/50 border border-slate-200 dark:border-[#222d3a] text-slate-600 dark:text-slate-400 font-medium outline-hidden"
              />
            </div>

            {/* Status de Despejo */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Status de Despejo Operacional *
              </label>
              <select
                value={statusDespejo}
                onChange={(e) => setStatusDespejo(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-red-500 outline-hidden"
              >
                <option value="Pendente">🚨 Pendente (Aguardando Despejo na Baia)</option>
                <option value="Concluído">✅ Despejado (Concluído pelo Ajudante)</option>
                <option value="Em Andamento">⏳ Em Andamento</option>
              </select>
            </div>
          </div>

          {/* CARD DE CÁLCULO DINÂMICO EM TEMPO REAL */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-blue-500/10 border border-red-200 dark:border-red-900/40 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-red-500" />
              <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                Cálculos de Engenharia do Armazém:
              </span>
            </div>
            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Volume Calculado:</span>
                <strong className="text-blue-600 dark:text-blue-400 text-sm">{calculatedHectolitros} hL</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-sans">Perda Financeira:</span>
                <strong className="text-red-600 dark:text-red-400 text-sm">
                  {calculatedValorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </strong>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
              Observações / Laudo
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Produto vencido segregado na baia de descarte..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#222d3a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Item em Shelf</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 2: IMPORTAÇÃO EM MASSA DE SHELF LIFE (CSV, EXCEL, TABELA COLADA)
// =========================================================================
interface ImportShelfBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  empresaId: string;
}

export const ImportShelfBulkModal: React.FC<ImportShelfBulkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  empresaId
}) => {
  const [pasteText, setPasteText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<Partial<ShelfItem>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const sampleFormat = `18/01/2026\t4293\tPEPSI BLACK PET 200ML SH C/12\t144\t533 ARMAZEM PRODUTO VENCIDO - ARMAZEM\t1.04\t149.74\t0.2880\n11/02/2026\t19321\tGUARANA ANTARCTICA ZERO PET 200ML SH C/12\t144\t533 ARMAZEM PRODUTO VENCIDO - ARMAZEM\t1.07\t154.14\t0.2880\n17/02/2026\t29580\tSTELLA ARTOIS PURE GOLD LONG NECK 330ML SP SH C/4\t14\t533 ARMAZEM PRODUTO VENCIDO - ARMAZEM\t4.46\t62.39\t0.0462\n21/02/2026\t2008\tANTARCTICA SUBZERO LATA 350ML SH C/12 NPAL\t12\t533 ARMAZEM PRODUTO VENCIDO - ARMAZEM\t2.25\t27.01\t0.0420\n22/02/2026\t2008\tANTARCTICA SUBZERO LATA 350ML SH C/12 NPAL\t4\t533 ARMAZEM PRODUTO VENCIDO - ARMAZEM\t2.25\t9.00\t0.0140`;

  const handleParse = () => {
    if (!pasteText.trim()) {
      setErrorMsg('Por favor, cole as linhas da tabela antes de processar.');
      return;
    }

    try {
      const lines = pasteText.trim().split(/\r?\n/);
      const items: Partial<ShelfItem>[] = [];

      lines.forEach((line, idx) => {
        if (!line.trim()) return;
        // Separator: tab, semicolon, comma or pipe
        let cols = line.split('\t');
        if (cols.length < 2) cols = line.split(';');
        if (cols.length < 2) cols = line.split('|');
        if (cols.length < 2) cols = line.split(',');

        const rawData = cols[0]?.trim() || '';
        const rawCod = cols[1]?.trim() || '';
        const rawDesc = cols[2]?.trim() || '';
        const rawQtd = cols[3]?.trim() || '';
        const rawMotivo = cols[4]?.trim() || '533 ARMAZEM PRODUTO VENCIDO - ARMAZEM';
        const rawPreco = cols[5]?.trim() || '';
        const rawValor = cols[6]?.trim() || '';
        const rawHecto = cols[7]?.trim() || '';

        if (!rawCod && !rawQtd) return;

        // Formatar data para YYYY-MM-DD
        let dataISO = new Date().toISOString().substring(0, 10);
        if (rawData.includes('/')) {
          const parts = rawData.split('/');
          if (parts.length === 3) {
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            dataISO = `${y}-${m}-${d}`;
          }
        } else if (rawData.includes('-')) {
          dataISO = rawData;
        }

        // Limpar números
        const qtdUn = Number(rawQtd.replace(/[^0-9]/g, '')) || 0;
        const conv = getProductConversionData(rawCod, rawDesc);
        
        const cleanPrice = rawPreco ? Number(rawPreco.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) : conv.precoUnitario;
        const cleanValor = rawValor ? Number(rawValor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) : Number((qtdUn * cleanPrice).toFixed(2));
        const cleanHecto = rawHecto ? Number(rawHecto.replace('hL', '').replace(/\./g, '').replace(',', '.').trim()) : Number((qtdUn * conv.fatorHectoPorUnidade).toFixed(4));

        items.push({
          data: dataISO,
          codigo: rawCod,
          descricao: rawDesc || conv.descricao,
          quantidadeUnidades: qtdUn,
          codigoMotivo: '533',
          departamento: 'ARMAZEM',
          motivoDescricao: 'PRODUTO VENCIDO - ARMAZEM',
          precoUnitario: cleanPrice,
          valorTotal: cleanValor,
          hectolitros: cleanHecto,
          fatorHectoPorUnidade: conv.fatorHectoPorUnidade,
          statusDespejo: 'Pendente',
          validade: dataISO
        });
      });

      if (items.length === 0) {
        setErrorMsg('Nenhuma linha válida foi identificada. Verifique o formato colado.');
      } else {
        setErrorMsg('');
        setParsedItems(items);
      }
    } catch (e: any) {
      setErrorMsg(`Erro ao processar texto: ${e.message}`);
    }
  };

  const handleImportAll = () => {
    if (parsedItems.length === 0) return;
    
    parsedItems.forEach(item => {
      saveShelfItem(item, empresaId);
    });

    onSuccess(parsedItems.length);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 dark:border-[#222d3a] flex items-center justify-between bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                Importação em Massa - Shelf Life (Itens Vencidos)
              </h3>
              <p className="text-[11px] text-slate-400">
                Cole dados de planilhas Excel, CSV ou tabelas com cálculo automático de Hectolitros e Valores
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
              Cole as linhas da planilha / tabela abaixo:
            </label>
            <button
              type="button"
              onClick={() => setPasteText(sampleFormat)}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              Inserir Exemplo dos 5 Itens Oficiais
            </button>
          </div>

          <textarea
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Data | SKU | Descrição | Quantidade (un) | Motivo | Preço | Valor | Hectolitros..."
            className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-red-500 outline-hidden"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParse}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Processar & Validar Linhas</span>
            </button>

            {parsedItems.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✅ {parsedItems.length} itens identificados e calculados
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TABELA PRÉ-VISUALIZAÇÃO */}
          {parsedItems.length > 0 && (
            <div className="border border-slate-200 dark:border-[#222d3a] rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#0d1117] text-[10px] font-black uppercase text-slate-500">
                    <th className="p-2.5">Data</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-right">Qtd (Un)</th>
                    <th className="p-2.5 text-right">Preço</th>
                    <th className="p-2.5 text-right">Valor Total</th>
                    <th className="p-2.5 text-right">Hectolitros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a] font-mono">
                  {parsedItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#161b22]">
                      <td className="p-2.5 text-slate-500">{item.data}</td>
                      <td className="p-2.5 font-bold text-red-600">{item.codigo}</td>
                      <td className="p-2.5 truncate max-w-[200px] font-sans">{item.descricao}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{item.quantidadeUnidades} un</td>
                      <td className="p-2.5 text-right">R$ {Number(item.precoUnitario).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-red-500">R$ {Number(item.valorTotal).toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-blue-500">{Number(item.hectolitros).toFixed(4)} hL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-[#222d3a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedItems.length === 0}
              onClick={handleImportAll}
              className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Importar {parsedItems.length} Itens para Shelf</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MODAL 3: IMPORTAÇÃO EM MASSA DE PNC (CSV, EXCEL, TABELA COLADA)
// =========================================================================
interface ImportPncBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
  empresaId: string;
}

export const ImportPncBulkModal: React.FC<ImportPncBulkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  empresaId
}) => {
  const todayISO = new Date().toISOString().substring(0, 10);
  const [pasteText, setPasteText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<Partial<PncItem>[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleParse = () => {
    if (!pasteText.trim()) {
      setErrorMsg('Por favor, cole as linhas da tabela antes de processar.');
      return;
    }

    try {
      const lines = pasteText.trim().split(/\r?\n/);
      const items: Partial<PncItem>[] = [];

      lines.forEach((line) => {
        if (!line.trim()) return;
        let cols = line.split('\t');
        if (cols.length < 2) cols = line.split(';');
        if (cols.length < 2) cols = line.split('|');
        if (cols.length < 2) cols = line.split(',');

        const rawCod = cols[0]?.trim() || '';
        const rawDesc = cols[1]?.trim() || '';
        const rawLote = cols[2]?.trim() || `LOTE-${Date.now().toString().substring(8)}`;
        const rawVal = cols[3]?.trim() || todayISO;
        const rawQtd = cols[4]?.trim() || '';
        const rawMotivo = cols[5]?.trim() || 'Validade Crítica (≤ 30d)';

        if (!rawCod || !rawQtd) return;

        let validadeISO = todayISO;
        if (rawVal.includes('/')) {
          const parts = rawVal.split('/');
          if (parts.length === 3) {
            const d = parts[0].padStart(2, '0');
            const m = parts[1].padStart(2, '0');
            const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            validadeISO = `${y}-${m}-${d}`;
          }
        } else if (rawVal.includes('-')) {
          validadeISO = rawVal;
        }

        const qtdNum = Number(rawQtd.replace(/[^0-9]/g, '')) || 0;

        items.push({
          codigo: rawCod,
          descricao: rawDesc,
          lote: rawLote,
          validade: validadeISO,
          quantidade: qtdNum,
          motivo: rawMotivo,
          dataEntradaPnc: todayISO,
          status: 'Em Quarentena / PNC',
          tratativaEscoamento: 'Venda Acelerada',
          statusEscoamento: 'Em Quarentena'
        });
      });

      if (items.length === 0) {
        setErrorMsg('Nenhuma linha válida foi identificada.');
      } else {
        setErrorMsg('');
        setParsedItems(items);
      }
    } catch (e: any) {
      setErrorMsg(`Erro ao processar: ${e.message}`);
    }
  };

  const handleImportAll = () => {
    if (parsedItems.length === 0) return;
    
    parsedItems.forEach(item => {
      savePncItem(item, empresaId);
    });

    onSuccess(parsedItems.length);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 dark:border-[#222d3a] flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                Importação em Massa - Área de PNC (Quarentena)
              </h3>
              <p className="text-[11px] text-slate-400">
                Cole itens para a quarentena do PNC com controle do limite de 30 dias
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            Cole as linhas da planilha (SKU | Descrição | Lote | Validade | Quantidade cx | Motivo):
          </label>

          <textarea
            rows={6}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="20815	BRAHMA CHOPP LT 350ML 12UN	L24110A	2026-08-30	144	Validade Crítica"
            className="w-full p-3.5 rounded-2xl text-xs bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden"
          />

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleParse}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Processar & Validar Linhas</span>
            </button>

            {parsedItems.length > 0 && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ✅ {parsedItems.length} itens identificados
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TABELA PRÉ-VISUALIZAÇÃO */}
          {parsedItems.length > 0 && (
            <div className="border border-slate-200 dark:border-[#222d3a] rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#0d1117] text-[10px] font-black uppercase text-slate-500">
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5">Lote</th>
                    <th className="p-2.5">Validade</th>
                    <th className="p-2.5 text-right">Qtd (CX)</th>
                    <th className="p-2.5">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a] font-mono">
                  {parsedItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#161b22]">
                      <td className="p-2.5 font-bold text-blue-600">{item.codigo}</td>
                      <td className="p-2.5 truncate max-w-[200px] font-sans">{item.descricao}</td>
                      <td className="p-2.5 text-slate-500">{item.lote}</td>
                      <td className="p-2.5 text-slate-500">{item.validade}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">{item.quantidade} cx</td>
                      <td className="p-2.5 text-slate-400 font-sans truncate max-w-[150px]">{item.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 dark:border-[#222d3a] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedItems.length === 0}
              onClick={handleImportAll}
              className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Importar {parsedItems.length} Itens para PNC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
