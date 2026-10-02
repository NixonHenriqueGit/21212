import React, { useState } from 'react';
import { 
  AcaoCorretiva, 
  getAcoesAll, 
  saveAcoes, 
  parseAndImportActionsPayload,
  classifyProcessFromActionFields 
} from '../utils/simulacaoAcoesUtils';
import { 
  X, 
  Upload, 
  Download, 
  PlusCircle, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Calendar, 
  User, 
  Building2, 
  HelpCircle,
  FileCode2,
  Layers,
  Sparkles
} from 'lucide-react';

interface ImportAcoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: string;
  defaultResponsavel?: string; // Optional default responsible collaborator (for individual collaborator view)
}

export const ImportAcoesModal: React.FC<ImportAcoesModalProps> = ({
  isOpen,
  onClose,
  currentUser = 'Administrador',
  defaultResponsavel = ''
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'manual'>('import');
  const [fileText, setFileText] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [processPreview, setProcessPreview] = useState<Record<string, number> | null>(null);

  // Manual Form State matching the 9 columns of Image 2
  const [area, setArea] = useState('Armazém');
  const [reuniao, setReuniao] = useState('RPS ARMAZEM');
  const [responsavel, setResponsavel] = useState(defaultResponsavel || '');
  const [indicador, setIndicador] = useState('');
  const [oqueFazer, setOqueFazer] = useState('');
  const [onde, setOnde] = useState('Guarabira');
  const [inicio, setInicio] = useState(new Date().toLocaleDateString('pt-BR'));
  const [final, setFinal] = useState(new Date(Date.now() + 7 * 86400000).toLocaleDateString('pt-BR'));
  const [obsResponsavel, setObsResponsavel] = useState('');

  if (!isOpen) return null;

  // Convert DD/MM/YYYY or YYYY-MM-DD to ISO YYYY-MM-DD
  const parseDateToISO = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    const clean = dateStr.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${y}-${m}-${d}`;
      }
    }
    if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) return clean;
      if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  const parseDateToDisplay = (dateStr: string): string => {
    if (!dateStr) return new Date().toLocaleDateString('pt-BR');
    const clean = dateStr.trim();
    if (clean.includes('/')) return clean;
    const iso = parseDateToISO(clean);
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return new Date().toLocaleDateString('pt-BR');
  };

  // Download official JSON template
  const handleDownloadJsonTemplate = () => {
    const jsonSample = {
      versao: "2026.08",
      origem: "ACOES_FINAIS_MELHORADAS_DATAS_CALENDARIO_FINAL.xlsx",
      descricao: "Plano de ações DPO / Armazém 2026 para importação em aplicativo.",
      total_acoes: 2,
      data_limite: "2026-08-28",
      acoes: [
        {
          id: 1,
          area: "Armazém",
          reuniao: "RPS Frota",
          responsavel: "Djeanderson Soares",
          indicador: "TMV / TMR",
          tipo_acao: "Rotina",
          o_que_fazer: "Separar tempos do ciclo",
          acao: "Dividir o tempo da carreta entre chegada, descarregamento, atendimento e liberação.",
          onde: "Pulmão / área de descarregamento",
          inicio: "2026-01-02",
          final: "2026-01-03",
          prazo_dias: 2,
          atraso_dias: 0,
          status: "FINALIZADO",
          farol: "Cinza",
          observacao_responsavel: "Feito: O ciclo foi separado por etapa para localizar o maior tempo."
        },
        {
          id: 3,
          area: "Armazém",
          reuniao: "Team Room Armazém",
          responsavel: "Djeanderson Soares",
          indicador: "Repack produtividade",
          tipo_acao: "Ação de melhoria",
          o_que_fazer: "Organizar repack",
          acao: "Retirar filme, cartão e materiais sem uso da bancada de repack.",
          onde: "Repack / bancada de montagem",
          inicio: "2026-01-02",
          final: "2026-01-05",
          prazo_dias: 2,
          atraso_dias: 0,
          status: "FINALIZADO",
          farol: "Cinza",
          observacao_responsavel: "Foi realizada a tratativa de Repack produtividade."
        }
      ]
    };

    const blob = new Blob([JSON.stringify(jsonSample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Modelo_Importacao_Acoes_VPO.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const csvHeader = 'Área;Reunião;Responsável;Indicador;O que fazer;Onde;Início;Final;Obs do Responsável\n';
    const sampleRow = 'Armazém;RPS ARMAZEM;KATHYEL ROCHA;Falta Teórica TOOS;Acompanhar todo dia no sistema o risco de falta e programar os horários das nossas carretas de puxada na fábrica, garantindo o envio do vasilhame vazio certo para trazer a carga no prazo;Guarabira;01/06/2026;05/06/2026;Acompanhamento iniciado na RPS Armazém; viagens das carretas organizadas para evitar gargalo na fábrica.\n';
    
    const blob = new Blob(['\uFEFF' + csvHeader + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Modelo_Importacao_Acoes_VPO.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process text or file upload (JSON or CSV)
  const handleProcessImportText = (text: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setProcessPreview(null);

    const result = parseAndImportActionsPayload(text, currentUser);

    if (!result.success || result.count === 0) {
      setErrorMsg(result.message || 'Nenhuma ação pôde ser processada. Verifique o formato do JSON ou CSV.');
      return;
    }

    // Calcula prévia de distribuição por processo
    const counts: Record<string, number> = {};
    result.actions.forEach(a => {
      counts[a.processo] = (counts[a.processo] || 0) + 1;
    });
    setProcessPreview(counts);

    setSuccessMsg(result.message);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setFileText(content);
        handleProcessImportText(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!responsavel.trim() || !indicador.trim() || !oqueFazer.trim()) {
      setErrorMsg('Preencha os campos obrigatórios: Responsável, Indicador e O que fazer.');
      return;
    }

    const isoInicio = parseDateToISO(inicio);
    const isoFinal = parseDateToISO(final);
    const displayInicio = parseDateToDisplay(inicio);
    const displayFinal = parseDateToDisplay(final);

    const processType = classifyProcessFromActionFields({
      indicador,
      oQueFazer: oqueFazer,
      onde,
      area,
      reuniao
    });

    const newAction: AcaoCorretiva = {
      id: `ACAO_MANUAL_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      data: displayInicio,
      dataISO: isoInicio,
      hora: '08:00',
      processo: processType,
      setor: area,
      colaboradorResponsavel: responsavel,
      indicador: indicador,
      meta: 'Meta Definida',
      resultadoObtido: 'Acompanhamento',
      desvioEncontrado: oqueFazer,
      causaRaiz: 'Método',
      status: 'Em Andamento',
      responsavelTratativa: currentUser,
      prazo: isoFinal,
      comentarioOperador: obsResponsavel,
      simulado: false,
      criadoEm: new Date().toISOString(),
      tipoAcao: 'Corretiva',
      prioridade: 'Alta',
      contramedida: oqueFazer,
      aprovacaoGestor: 'Aprovado',
      aceiteColaborador: true,
      abertoPor: currentUser,
      dataAbertura: `${displayInicio} 08:00`,

      area,
      reuniao,
      onde,
      inicio: displayInicio,
      final: displayFinal,
      obsResponsavel,

      historicoAlteracoes: [{
        dataHora: new Date().toLocaleString('pt-BR'),
        usuario: currentUser,
        alteracao: `Ação cadastrada manualmente para o processo [${processType}] (Início: ${displayInicio}, Final: ${displayFinal}).`
      }]
    };

    const current = getAcoesAll();
    saveAcoes([...current, newAction]);
    setSuccessMsg('✓ Ação cadastrada e salva com sucesso no processo ' + processType + '!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-100 p-6 space-y-5">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                Cadastrar / Importar Ações Retroativas
              </h2>
              <p className="text-xs text-slate-400">
                Modelo estrito de importação de ações (Área, Reunião, Responsável, Indicador, O que fazer, Onde, Início, Final, Obs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex items-center gap-2 bg-[#0b1222] p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'import' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>1. Importar Planilha (CSV / Excel)</span>
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>2. Cadastrar Ação Manualmente</span>
          </button>
        </div>

        {/* NOTIFICATIONS */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: IMPORT VIA PLANILHA / CSV */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#0b1222] border border-indigo-500/20 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase text-indigo-400 flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4" /> Formatos Suportados: JSON (.json) ou Planilha (.csv / .txt)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadJsonTemplate}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Modelo JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Modelo CSV</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-300">
                O importador lê automaticamente o arquivo com a estrutura <code className="text-amber-400 font-mono">{"{ versao, origem, acoes: [ ... ] }"}</code> ou linhas de planilha, identifica cada indicador (ex: <span className="text-emerald-400 font-bold">Repack</span>, <span className="text-emerald-400 font-bold">Despejo</span>, <span className="text-emerald-400 font-bold">Produtividade WLP</span>, <span className="text-emerald-400 font-bold">FEFO</span>, <span className="text-emerald-400 font-bold">Quebras</span>, <span className="text-emerald-400 font-bold">TMR</span>) e distribui de forma inteligente para os respectivos dashboards.
              </p>

              {processPreview && (
                <div className="p-3 bg-[#111a30] border border-emerald-500/30 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-black uppercase text-emerald-300 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" /> Distribuição Automática por Processo:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(processPreview).map(([proc, count]) => (
                      <span key={proc} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-md">
                        {proc}: <strong className="text-emerald-400">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* FILE UPLOAD & TEXT AREA */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-300 block">
                Selecione o arquivo JSON / CSV ou cole o conteúdo abaixo:
              </label>

              <div className="flex items-center gap-3">
                <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center gap-2 transition-all shadow">
                  <Upload className="w-4 h-4" />
                  <span>Escolher Arquivo (.json / .csv / .txt)</span>
                  <input
                    type="file"
                    accept=".json,.csv,.txt,.tsv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-400">ou cole o JSON/CSV diretamente no campo abaixo:</span>
              </div>

              <textarea
                rows={7}
                value={fileText}
                onChange={e => setFileText(e.target.value)}
                placeholder='Cole aqui o JSON {"versao": "2026.08", "acoes": [...]} ou o conteúdo CSV...'
                className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-3 text-xs text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleProcessImportText(fileText)}
                disabled={!fileText.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 shadow"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>Processar e Distribuir Ações</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CADASTRAR AÇÃO MANUALMENTE */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* ÁREA */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Área:</label>
                <input
                  type="text"
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  placeholder="Ex: Armazém"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
                  required
                />
              </div>

              {/* REUNIÃO */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Reunião:</label>
                <input
                  type="text"
                  value={reuniao}
                  onChange={e => setReuniao(e.target.value)}
                  placeholder="Ex: RPS ARMAZEM"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
                  required
                />
              </div>

              {/* RESPONSÁVEL */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Responsável:</label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={e => setResponsavel(e.target.value)}
                  placeholder="Ex: KATHYEL ROCHA"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* INDICADOR */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Indicador:</label>
                <input
                  type="text"
                  value={indicador}
                  onChange={e => setIndicador(e.target.value)}
                  placeholder="Ex: Falta Teórica TOOS"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
                  required
                />
              </div>

              {/* ONDE */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Onde (Local):</label>
                <input
                  type="text"
                  value={onde}
                  onChange={e => setOnde(e.target.value)}
                  placeholder="Ex: Guarabira"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
                  required
                />
              </div>
            </div>

            {/* O QUE FAZER */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">O que fazer (Descrição da Ação):</label>
              <textarea
                rows={3}
                value={oqueFazer}
                onChange={e => setOqueFazer(e.target.value)}
                placeholder="Ex: Acompanhar todo dia no sistema o risco de falta e programar os horários das carretas..."
                className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
                required
              />
            </div>

            {/* DATAS INÍCIO E FINAL (RETROATIVAS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0b1222] p-3 rounded-xl border border-indigo-500/20">
              <div>
                <label className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data Início (Retroativa / DD/MM/YYYY):
                </label>
                <input
                  type="text"
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  placeholder="01/06/2026"
                  className="w-full bg-[#111a30] border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-500 mt-1 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data Final (Prazo / DD/MM/YYYY):
                </label>
                <input
                  type="text"
                  value={final}
                  onChange={e => setFinal(e.target.value)}
                  placeholder="05/06/2026"
                  className="w-full bg-[#111a30] border border-slate-700 rounded-xl p-2 text-xs text-white outline-none focus:border-amber-500 mt-1 font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* OBS DO RESPONSÁVEL */}
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Obs do Responsável:</label>
              <textarea
                rows={2}
                value={obsResponsavel}
                onChange={e => setObsResponsavel(e.target.value)}
                placeholder="Ex: Acompanhamento iniciado na RPS Armazém; viagens das carretas organizadas..."
                className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Ação Retroativa</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
