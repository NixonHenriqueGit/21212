import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  FileText, 
  Database,
  Layers,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { ValidadeRow } from '../types';
import { saveMonthlyColetas, getStoredMonthlyColetas, ColetaItemRaw } from '../utils/stockAgeMonthlyManager';
import { saveVendaMediaItens } from '../utils/estoqueStorage';
import { saveAderenciaHistorico } from '../utils/fefoAderenciaHistorico';

interface ImportJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess?: (message: string) => void;
  onImportValidades?: (rows: ValidadeRow[]) => void;
}

export default function ImportJsonModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
  onImportValidades
}: ImportJsonModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [detectedType, setDetectedType] = useState<'validades' | 'coletas_mensais' | '030519' | 'aderencia' | 'desconhecido' | null>(null);
  const [statsSummary, setStatsSummary] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const analyzeJson = (rawContent: string) => {
    setErrorMsg(null);
    setParsedData(null);
    setDetectedType(null);
    setStatsSummary(null);

    if (!rawContent.trim()) return;

    try {
      const parsed = JSON.parse(rawContent);
      setParsedData(parsed);

      // 1. Detectar coletas mensais: formato { "01": [...], "02": [...] }
      if (typeof parsed === 'object' && !Array.isArray(parsed) && (parsed['01'] || parsed['02'] || parsed['03'] || parsed['07'])) {
        setDetectedType('coletas_mensais');
        let totalItems = 0;
        const monthsFound: string[] = [];
        Object.keys(parsed).forEach(k => {
          if (Array.isArray(parsed[k])) {
            totalItems += parsed[k].length;
            monthsFound.push(`Mês ${k} (${parsed[k].length})`);
          }
        });
        setStatsSummary(`📦 Coletas Mensais Stock Age: ${totalItems} itens distribuídos em: ${monthsFound.slice(0, 4).join(', ')}${monthsFound.length > 4 ? '...' : ''}`);
        return;
      }

      // 2. Detectar relatório 03.05.19
      if (Array.isArray(parsed) && parsed.length > 0 && ('vendaMedia' in parsed[0] || 'vendaMediaDiaria' in parsed[0] || 'giroDiario' in parsed[0])) {
        setDetectedType('030519');
        setStatsSummary(`📊 Relatório 03.05.19: ${parsed.length} produtos com Venda Média Diária identificados.`);
        return;
      }

      // 3. Detectar Base de Validades / Coleta de Armazém
      if (Array.isArray(parsed) && parsed.length > 0 && ('validade' in parsed[0] || 'dataVencimento' in parsed[0] || 'descricao' in parsed[0])) {
        // Verificar se tem dataColeta ou dataVencimento
        if ('dataColeta' in parsed[0] || 'validadeDias' in parsed[0]) {
          setDetectedType('coletas_mensais');
          setStatsSummary(`📅 Lista de Coletas: ${parsed.length} registros com datas de coleta e vencimento.`);
        } else {
          setDetectedType('validades');
          setStatsSummary(`📋 Base de Validades: ${parsed.length} registros de estoque/picking identificados.`);
        }
        return;
      }

      // 4. Objeto envelope { validades: [...] } ou { coletas: [...] }
      if (typeof parsed === 'object' && parsed.validades && Array.isArray(parsed.validades)) {
        setDetectedType('validades');
        setStatsSummary(`📋 Base de Validades: ${parsed.validades.length} registros no envelope.`);
        return;
      }

      // 5. Histórico de Aderência
      if (Array.isArray(parsed) && parsed.length > 0 && ('aderenciaPct' in parsed[0] || 'conformeFefoCx' in parsed[0])) {
        setDetectedType('aderencia');
        setStatsSummary(`🏆 Histórico de Aderência FEFO: ${parsed.length} períodos mensais identificados.`);
        return;
      }

      setDetectedType('desconhecido');
      setStatsSummary(`Formato genérico identificado (${Array.isArray(parsed) ? `${parsed.length} registros` : 'Objeto'}).`);
    } catch (e: any) {
      setErrorMsg(`Erro de sintaxe JSON: ${e.message}`);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setErrorMsg('Por favor, selecione um arquivo com extensão .json');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      analyzeJson(content);
    };
    reader.onerror = () => {
      setErrorMsg('Falha ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonText(val);
    analyzeJson(val);
  };

  const handleImport = () => {
    if (!parsedData) {
      setErrorMsg('Nenhum dado JSON válido para importar.');
      return;
    }

    setIsProcessing(true);
    try {
      if (detectedType === 'coletas_mensais') {
        const stored = getStoredMonthlyColetas();
        if (typeof parsedData === 'object' && !Array.isArray(parsedData)) {
          // Merge por mês
          Object.keys(parsedData).forEach(mKey => {
            if (Array.isArray(parsedData[mKey])) {
              stored[mKey] = parsedData[mKey];
            }
          });
          saveMonthlyColetas(stored);
        } else if (Array.isArray(parsedData)) {
          // Agrupar por mês da dataColeta
          parsedData.forEach((item: any) => {
            let mKey = '01';
            const dataStr = item.dataColeta || item.data || '';
            if (dataStr.includes('/')) {
              const parts = dataStr.split('/');
              if (parts.length >= 2) mKey = parts[1].padStart(2, '0');
            } else if (dataStr.includes('-')) {
              const parts = dataStr.split('-');
              if (parts.length >= 2) mKey = parts[1].padStart(2, '0');
            }
            if (!stored[mKey]) stored[mKey] = [];
            stored[mKey].push(item);
          });
          saveMonthlyColetas(stored);
        }
        window.dispatchEvent(new Event('stock_age_monthly_updated'));
        onSuccess?.('Coletas mensais de Stock Age importadas com sucesso!');
      } else if (detectedType === '030519') {
        const list = Array.isArray(parsedData) ? parsedData : (parsedData.itens || []);
        saveVendaMediaItens(list);
        window.dispatchEvent(new Event('vendaMedia030519Updated'));
        onSuccess?.(`Relatório 03.05.19 com ${list.length} itens importado com sucesso!`);
      } else if (detectedType === 'validades') {
        const list = Array.isArray(parsedData) ? parsedData : (parsedData.validades || []);
        if (onImportValidades) {
          onImportValidades(list);
        }
        onSuccess?.(`Base de ${list.length} validades importada com sucesso!`);
      } else if (detectedType === 'aderencia') {
        saveAderenciaHistorico(companyId, parsedData);
        window.dispatchEvent(new Event('fefo_aderencia_updated'));
        onSuccess?.('Histórico de aderência FEFO atualizado com sucesso!');
      } else {
        // Tentar inferir validades
        if (Array.isArray(parsedData) && onImportValidades) {
          onImportValidades(parsedData);
          onSuccess?.(`Importados ${parsedData.length} registros JSON com sucesso!`);
        } else {
          setErrorMsg('Não foi possível determinar a estrutura correta para aplicação destes dados.');
          setIsProcessing(false);
          return;
        }
      }

      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 500);
    } catch (e: any) {
      setErrorMsg(`Erro ao processar importação: ${e.message}`);
      setIsProcessing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      tipo: "coletas_mensais_stock_age",
      empresa: companyId,
      meses: {
        "01": [
          {
            "dataColeta": "15/01/2026",
            "codigo": "001",
            "descricao": "SKOL 600ML GF RETORNAVEL CX 24",
            "qtdeCaixas": 120,
            "dataVencimento": "15/05/2026",
            "validadeDias": 120,
            "fabricacao": "15/01/2026",
            "curva": "A",
            "blocoPrincipal": "A",
            "subBloco": "A1",
            "destino": "PICKING",
            "pallettesFechados": 1,
            "sobraCaixas": 20,
            "caixasNoBloco": 100,
            "vaiParaPicking": "SIM",
            "caixasNoPicking": 20
          }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modelo_Importacao_JSON_FEFO_${companyId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#032b5e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
              <FileCode className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider">Importador de Arquivo JSON</h2>
              <p className="text-xs text-sky-200/80 mt-0.5">
                Carregue dados de Validades, Relatório 03.05.19 ou Coletas Mensais de Stock Age
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver 
                ? 'border-blue-500 bg-blue-50/80 scale-[0.99]' 
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/80 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm">
              Arraste seu arquivo <span className="font-mono text-blue-700">.json</span> aqui ou clique para selecionar
            </p>
            <p className="text-[11px] text-slate-500">
              Formatos suportados: Coletas Mensais Jan–Dez, Relatório 03.05.19 e Base de Validades
            </p>
          </div>

          {/* Area para colar texto JSON */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-black uppercase text-slate-600 tracking-wider">
                Ou cole o conteúdo JSON diretamente:
              </label>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-blue-600 hover:text-blue-800 font-bold text-[10px] flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <Download className="w-3 h-3" /> Baixar Modelo JSON
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={handleTextChange}
              placeholder='{\n  "01": [\n    { "codigo": "001", "descricao": "SKOL 600ML", "qtdeCaixas": 120, "dataVencimento": "15/05/2026", "validadeDias": 120 }\n  ]\n}'
              className="w-full h-36 p-3 border border-slate-300 rounded-xl font-mono text-[11px] bg-slate-900 text-emerald-400 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Alertas e Detecção */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statsSummary && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <span className="font-black uppercase text-[10px] tracking-wider block">Estrutura Reconhecida com Sucesso!</span>
                <p className="font-medium text-xs mt-0.5">{statsSummary}</p>
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
            onClick={handleImport}
            disabled={!parsedData || !!errorMsg || isProcessing}
            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-none ${
              !parsedData || !!errorMsg || isProcessing
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-[#032b5e] hover:bg-[#021f44] text-white shadow-md cursor-pointer'
            }`}
          >
            <Database className="w-4 h-4" />
            {isProcessing ? 'Processando...' : 'Aplicar e Salvar Dados JSON'}
          </button>
        </div>

      </div>
    </div>
  );
}
