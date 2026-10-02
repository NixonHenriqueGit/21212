import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Database,
  HelpCircle,
  Sparkles,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Item030519Data, parse030519Text, normalizeText, save030519Quarter, parseSapNumber } from '../utils/vendaMedia030519';
import { saveVendaMediaItens } from '../utils/estoqueStorage';

interface Import030519ModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  onSuccess?: (message: string) => void;
  onImportSuccess?: () => void;
}

export default function Import030519Modal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
  onImportSuccess
}: Import030519ModalProps) {
  const [inputText, setInputText] = useState('');
  const [diasUteis, setDiasUteis] = useState<number>(30);
  const [dragOver, setDragOver] = useState(false);
  const [parsedItems, setParsedItems] = useState<Item030519Data[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMsg(null);
    setFeedback(null);

    if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
        const parsed = parse030519Text(text, diasUteis);
        if (parsed.length === 0) {
          setErrorMsg('Nenhum produto válido foi identificado no arquivo de texto. Certifique-se que o SKU está na Coluna G e a Quantidade na Coluna AC.');
          return;
        }
        setParsedItems(parsed);
        setFeedback(`Arquivo texto processado: ${parsed.length} produtos identificados do 03.05.19!`);
      };
      reader.readAsText(file, 'ISO-8859-1');
      return;
    }

    // Excel files (.xlsx, .xls)
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rows || rows.length === 0) {
          setErrorMsg('A planilha selecionada está vazia.');
          return;
        }

        interface SkuAccumulator {
          codigo: number;
          produto: string;
          unidade: string;
          totalVolume: number;
        }

        const skuMap = new Map<number, SkuAccumulator>();

        rows.forEach((row, idx) => {
          if (!Array.isArray(row) || row.length === 0) return;

          let codeRaw = '';
          let descRaw = '';
          let unitRaw = 'cx';
          let qty = 0;

          // Standard SAP 03.05.19 (Column G = index 6, Column AC = index 28)
          if (row.length >= 29) {
            codeRaw = String(row[6] || '').trim();
            descRaw = String(row[7] || '').trim();
            unitRaw = String(row[8] || 'cx').trim();
            qty = parseSapNumber(row[28]);
            if (qty === 0 && row[9] !== undefined) {
              const vQty = parseSapNumber(row[9]);
              if (vQty > 0) qty = vQty;
            }
          } else if (row.length >= 7) {
            codeRaw = String(row[6] || row[0] || '').trim();
            descRaw = String(row[7] || row[1] || '').trim();
            unitRaw = String(row[8] || 'cx').trim();
            qty = parseSapNumber(row[row.length - 1]);
          } else if (row.length >= 2) {
            codeRaw = String(row[0] || '').trim();
            descRaw = row.length >= 3 ? String(row[1] || '').trim() : `Produto ${codeRaw}`;
            qty = parseSapNumber(row[row.length - 1]);
          }

          if (idx === 0 && (codeRaw.toLowerCase().includes('produto') || codeRaw.toLowerCase().includes('código') || codeRaw.toLowerCase().includes('unb'))) {
            return;
          }

          const cleanDigits = codeRaw.replace(/\D/g, '');
          const codeNum = parseInt(cleanDigits, 10);
          if (isNaN(codeNum) || codeNum <= 0) return;

          const cleanDesc = descRaw || `Produto ${codeNum}`;

          if (skuMap.has(codeNum)) {
            const existing = skuMap.get(codeNum)!;
            existing.totalVolume += qty;
            if (cleanDesc && cleanDesc.length > existing.produto.length) {
              existing.produto = cleanDesc;
            }
          } else {
            skuMap.set(codeNum, {
              codigo: codeNum,
              produto: cleanDesc,
              unidade: unitRaw || 'cx',
              totalVolume: qty
            });
          }
        });

        const rawList = Array.from(skuMap.values());
        if (rawList.length === 0) {
          // Fallback to text lines
          const textLines = rows.map(r => Array.isArray(r) ? r.join(';') : String(r)).join('\n');
          const parsed = parse030519Text(textLines, diasUteis);
          if (parsed.length > 0) {
            setParsedItems(parsed);
            setFeedback(`Arquivo processado com sucesso: ${parsed.length} produtos identificados!`);
            return;
          }
          setErrorMsg('Não foi possível identificar os produtos na planilha. Verifique se o Código do SKU está na Coluna G e a Quantidade na Coluna AC.');
          return;
        }

        const sorted = [...rawList].sort((a, b) => b.totalVolume - a.totalVolume);
        const totalVolumeGeral = sorted.reduce((sum, item) => sum + Math.max(0, item.totalVolume), 0);

        let accVol = 0;
        const mapped: Item030519Data[] = [];

        sorted.forEach((item, idx) => {
          const vol = Math.max(0, Math.round(item.totalVolume * 100) / 100);
          accVol += vol;
          const pctAcc = totalVolumeGeral > 0 ? (accVol / totalVolumeGeral) * 100 : 0;
          const classeABC: 'A' | 'B' | 'C' = (pctAcc <= 70.01 || idx === 0) ? 'A' : (pctAcc <= 90.01) ? 'B' : 'C';

          const vendaMediaDiaria = diasUteis > 0 ? Math.round((vol / diasUteis) * 100) / 100 : vol;
          const precoUnitario = 50.0;

          mapped.push({
            codigo: item.codigo,
            produto: item.produto,
            unidade: item.unidade,
            volumeTotalTrimestre: vol,
            vendaMediaDiaria: vendaMediaDiaria > 0 ? vendaMediaDiaria : 0.1,
            fatorHecto: 0.1,
            precoUnitario,
            vendaMediaReais: Math.round(vendaMediaDiaria * precoUnitario * 100) / 100,
            vendaMediaHectolitro: Math.round(vendaMediaDiaria * 0.1 * 100) / 100,
            faturamentoTotal: Math.round(vol * precoUnitario * 100) / 100,
            volumeTotalHectolitros: Math.round(vol * 0.1 * 100) / 100,
            categoria: 'Geral',
            classeABC,
            curvaAbc: classeABC,
            rank: idx + 1,
            source: '030519'
          });
        });

        setParsedItems(mapped);
        setFeedback(`Planilha processada com sucesso: ${mapped.length} produtos com Venda Média calculada (Coluna G: SKU, Coluna AC: Total)!`);
      } catch (err: any) {
        setErrorMsg(`Erro ao ler arquivo Excel: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    setErrorMsg(null);
    setFeedback(null);

    if (text.trim().length > 10) {
      const parsed = parse030519Text(text, diasUteis);
      setParsedItems(parsed);
      if (parsed.length > 0) {
        setFeedback(`${parsed.length} produtos reconhecidos pelo parser do 03.05.19!`);
      }
    } else {
      setParsedItems([]);
    }
  };

  const handleSalvar = () => {
    if (parsedItems.length === 0) {
      setErrorMsg('Nenhum item válido para importar.');
      return;
    }

    try {
      const currentMonth = new Date().getMonth() + 1;
      const qKey = currentMonth <= 3 ? 'Q1' : currentMonth <= 6 ? 'Q2' : currentMonth <= 9 ? 'Q3' : 'Q4';

      save030519Quarter(qKey, diasUteis, parsedItems, `03.05.19_${qKey}_manual.xlsx`);
      
      const estoqueFormatted = parsedItems.map(p => ({
        codigo: Number(p.codigo),
        produto: p.produto,
        vendaMediaDiaria: p.vendaMediaDiaria,
        precoUnitario: p.precoUnitario,
        familia: p.categoria || 'Cervejas',
        marca: 'Ambev',
        setor: 'Central',
        atualizadoEm: new Date().toISOString()
      }));
      saveVendaMediaItens(estoqueFormatted);

      window.dispatchEvent(new Event('vendaMedia030519Updated'));
      window.dispatchEvent(new Event('stock_age_monthly_updated'));

      onSuccess?.(`Relatório 03.05.19 atualizado com sucesso! ${parsedItems.length} produtos com Venda Média Diária salvos.`);
      onImportSuccess?.();
      onClose();
    } catch (e: any) {
      setErrorMsg(`Erro ao salvar dados de Venda Média: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#032b5e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider">Importar Relatório 03.05.19 (30 Dias)</h2>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Venda Média Diária (30 Dias)
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Atualize a venda média dos últimos 30 dias para cálculo de dias de cobertura em estoque e Stock Age Index
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Configuração de Dias de Faturamento (Padrão 30 Dias) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#032b5e] tracking-wider block">
                Período de Faturamento do Relatório 03.05.19 (30 Dias)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Divisor para converter o volume de vendas da rotina 03.05.19 em Venda Média Diária (cx/dia).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="120"
                value={diasUteis}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 30;
                  setDiasUteis(val);
                  if (inputText) handleTextChange(inputText);
                }}
                className="w-20 p-2 border border-slate-300 rounded-lg text-xs font-black text-center font-mono bg-white"
              />
              <span className="text-slate-600 font-bold">dias</span>
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver 
                ? 'border-blue-500 bg-blue-50/80' 
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <p className="font-bold text-slate-800 text-xs">
              Arraste a planilha <span className="font-mono text-emerald-700">03.05.19 (.xlsx, .csv)</span> ou clique para carregar
            </p>
          </div>

          {/* Área para colar texto */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider block mb-1">
              Ou copie e cole as linhas do relatório 03.05.19 aqui:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Cole aqui o relatório copiado da tela ou planilha (Ex: Código | Descrição | Volume Trimestre | Venda Média Diária...)"
              className="w-full h-32 p-3 border border-slate-300 rounded-xl font-mono text-[11px] bg-slate-50 focus:bg-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Mensagens e Feedback */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Preview de Itens */}
          {parsedItems.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 flex justify-between items-center text-[10px] font-black text-slate-700 uppercase">
                <span>Pré-visualização dos Produtos ({parsedItems.length})</span>
                <span>Venda Média Diária (Cx/Dia)</span>
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                {parsedItems.slice(0, 10).map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-500 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                        {it.codigo}
                      </span>
                      <span className="font-semibold text-slate-800">{it.produto || (it as any).descricao}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Curva {it.curvaAbc || 'A'}
                      </span>
                    </div>
                    <div className="font-mono font-black text-blue-700">
                      {it.vendaMediaDiaria.toFixed(1)} cx/dia
                    </div>
                  </div>
                ))}
                {parsedItems.length > 10 && (
                  <div className="p-2 text-center text-[10px] font-bold text-slate-500 bg-slate-50">
                    + {parsedItems.length - 10} outros produtos identificados
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-all border-none bg-transparent cursor-pointer text-xs"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSalvar}
            disabled={parsedItems.length === 0}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-none ${
              parsedItems.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#032b5e] hover:bg-[#021f44] text-white shadow-md cursor-pointer'
            }`}
          >
            <Database className="w-4 h-4" />
            Salvar Venda Média ({parsedItems.length} Itens)
          </button>
        </div>

      </div>
    </div>
  );
}
