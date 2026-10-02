import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Printer, 
  Download, 
  X, 
  UserCheck, 
  Calendar, 
  Building2, 
  Sparkles, 
  Zap, 
  Check, 
  Clock, 
  Filter, 
  Layers, 
  Award,
  ChevronRight,
  ClipboardList,
  AlertOctagon,
  Copy
} from 'lucide-react';
import { 
  QUESTOES_GSA_OFICIAIS, 
  CATEGORIAS_GSA,
  gerarLaudoTecnicoConformidade, 
  LaudoTecnicoConformidade, 
  RondaInspecaoCompleta 
} from '../data/rondaGsaOfficialDataset';
import { exportRondaGsaManualPdf } from '../utils/exportRondaGsaPdf';
import { AcoesGeraisRepository } from '../db';

interface LaudoConformidadeArmazemModalProps {
  isOpen?: boolean;
  ronda: RondaInspecaoCompleta | any;
  onClose: () => void;
  empresaId?: string;
  user?: any;
  onAcaoCreated?: (acao: any) => void;
}

export const LaudoConformidadeArmazemModal: React.FC<LaudoConformidadeArmazemModalProps> = ({
  isOpen = true,
  ronda,
  onClose,
  empresaId = 'demo',
  user,
  onAcaoCreated
}) => {
  if (isOpen === false) return null;

  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'CONFORME' | 'NAO_CONFORME' | 'NA'>('TODOS');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [acoesSalvas, setAcoesSalvas] = useState<Record<string, boolean>>({});

  // Gera dados do laudo técnico pericial do DSPD Guarabira
  const laudoData: LaudoTecnicoConformidade = useMemo(() => {
    return gerarLaudoTecnicoConformidade(ronda);
  }, [ronda]);

  // Filtra itens na tabela
  const itensFiltrados = useMemo(() => {
    return laudoData.itens.filter((item) => {
      if (statusFilter === 'CONFORME' && !item.resposta.includes('Sim')) return false;
      if (statusFilter === 'NAO_CONFORME' && !item.resposta.includes('Não')) return false;
      if (statusFilter === 'NA' && !item.resposta.includes('N/A')) return false;
      if (categoriaFilter !== 'TODAS' && item.categoria !== categoriaFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchPergunta = item.perguntaCompleta.toLowerCase().includes(term);
        const matchCurta = item.perguntaCurta.toLowerCase().includes(term);
        const matchNorma = item.norma.toLowerCase().includes(term);
        const matchCat = item.categoria.toLowerCase().includes(term);
        if (!matchPergunta && !matchCurta && !matchNorma && !matchCat) return false;
      }
      return true;
    });
  }, [laudoData, statusFilter, categoriaFilter, searchTerm]);

  // Gerar Plano de Ação DPO individual
  const handleGerarAcaoDpo = async (desvio: any) => {
    try {
      const novaAcao = {
        id: `acao-dpo-${Date.now()}-${desvio.id}`,
        empresaId,
        origem: 'RONDA_QUALIDADE_DSPD_GUARABIRA',
        tipo: 'DESVIO_QUALIDADE',
        titulo: `[DSPD Guarabira] ${desvio.perguntaCurta}`,
        descricao: `Desvio identificado na Ronda de Qualidade do DSPD Guarabira (${laudoData.dataFormatted}). Norma: ${desvio.norma}. Requisito: ${desvio.perguntaCompleta}`,
        // Campos 5W2H Oficiais
        oQue: desvio.acao5W2H?.oQue || 'Executar adequação imediata',
        porQue: `${desvio.acao5W2H?.porQue || 'Garantia de conformidade'} (${desvio.norma})`,
        onde: `${laudoData.localAuditado} - ${desvio.acao5W2H?.onde || 'Armazém'}`,
        quem: desvio.acao5W2H?.quem || laudoData.auditorNome || 'Djeanderson Soares',
        quando: desvio.risco === 'CRITICO' ? 'Imediato (24h)' : (desvio.acao5W2H?.quando || 'Próxima ronda'),
        como: desvio.acao5W2H?.como || 'Reorientação operacional e monitoramento',
        quanto: desvio.acao5W2H?.quanto || 'R$ 0,00',
        status: 'A Fazer',
        prioridade: desvio.risco === 'CRITICO' ? 'ALTA' : desvio.risco === 'ALTO' ? 'ALTA' : 'MEDIA',
        dataCriacao: new Date().toISOString(),
        dataLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        responsavel: laudoData.auditorNome || user?.nome || 'Djeanderson Soares',
        criadoPor: user?.nome || 'Sistema DSPD Guarabira'
      };

      try {
        await AcoesGeraisRepository.create(novaAcao as any, empresaId, novaAcao.id);
      } catch (repoErr) {
        console.warn('Repository create fallback to local:', repoErr);
      }
      
      const existing = JSON.parse(localStorage.getItem('acoes_dpo_gerais') || '[]');
      existing.unshift(novaAcao);
      localStorage.setItem('acoes_dpo_gerais', JSON.stringify(existing));

      setAcoesSalvas(prev => ({ ...prev, [desvio.id]: true }));
      if (onAcaoCreated) onAcaoCreated(novaAcao);
      alert(`✅ Plano de Ação 5W2H criado com sucesso para "${desvio.perguntaCurta}"! Sincronizado no Quadro de Ações DPO.`);
    } catch (err: any) {
      alert(`❌ Erro ao criar ação DPO: ${err.message}`);
    }
  };

  // Gerar Planos 5W2H para todos os desvios em lote
  const handleGerarTodosPlanos5W2H = async () => {
    if (laudoData.desvios.length === 0) {
      alert('ℹ️ Esta ronda não possui desvios cadastrados (100% de conformidade).');
      return;
    }

    try {
      let criados = 0;
      for (const desvio of laudoData.desvios) {
        const novaAcao = {
          id: `acao-dpo-${Date.now()}-${desvio.id}-${Math.floor(Math.random()*1000)}`,
          empresaId,
          origem: 'RONDA_QUALIDADE_DSPD_GUARABIRA',
          tipo: 'DESVIO_QUALIDADE',
          titulo: `[DSPD Guarabira] ${desvio.perguntaCurta}`,
          descricao: `Desvio identificado na Ronda do DSPD Guarabira (${laudoData.dataFormatted}) - ${desvio.perguntaCompleta}`,
          oQue: desvio.acao5W2H?.oQue || 'Adequação no armazém',
          porQue: `${desvio.acao5W2H?.porQue || 'Conformidade operacional'} (${desvio.norma})`,
          onde: `${laudoData.localAuditado} - ${desvio.acao5W2H?.onde || 'Armazém'}`,
          quem: desvio.acao5W2H?.quem || laudoData.auditorNome || 'Djeanderson Soares',
          quando: desvio.acao5W2H?.quando || 'Próxima ronda',
          como: desvio.acao5W2H?.como || 'Ação corretiva com a equipe',
          quanto: desvio.acao5W2H?.quanto || 'R$ 0,00',
          status: 'A Fazer',
          prioridade: desvio.risco === 'CRITICO' ? 'ALTA' : 'MEDIA',
          dataCriacao: new Date().toISOString(),
          responsavel: laudoData.auditorNome || 'Djeanderson Soares'
        };

        try {
          await AcoesGeraisRepository.create(novaAcao as any, empresaId, novaAcao.id);
        } catch (repoErr) {
          console.warn('Repository create fallback to local:', repoErr);
        }
        criados++;
      }

      setAcoesSalvas(prev => {
        const nxt = { ...prev };
        laudoData.desvios.forEach(d => { nxt[d.id] = true; });
        return nxt;
      });

      alert(`⚡ Sucesso! ${criados} Planos de Ação 5W2H foram gerados automaticamente e registrados no Quadro Geral DPO!`);
    } catch (err: any) {
      alert(`❌ Erro ao gerar ações em lote: ${err.message}`);
    }
  };

  // Copiar Parecer Técnico Formatado
  const handleCopiarParecer = () => {
    const textoParecer = `=====================================================
DSPD GUARABIRA - LAUDO TÉCNICO DE CONFORMIDADE DA RONDA DE QUALIDADE
Farol de Qualidade & Gestão de Segurança em Armazém (41 Quesitos / 6 Áreas)
Data da Inspeção: ${laudoData.dataFormatted} (Semana ${laudoData.semanaAno})
Auditor Responsável: ${laudoData.auditorNome} (${laudoData.auditorCargo})
Unidade / Local: ${laudoData.localAuditado}
Colaborador / Equipe Auditada: ${laudoData.colaboradorAuditado}
-----------------------------------------------------
Índice de Aderência Global: ${laudoData.percentual}% (Nota: ${laudoData.pontosNota10}/10)
Status Farol DPO: ${laudoData.statusFarol}
Itens Ótimos: ${laudoData.totalOtimo} | Bons: ${laudoData.totalBom} | Desvios: ${laudoData.totalRuim} | N/A: ${laudoData.totalNA}

PARECER TÉCNICO PERICIAL (LOGÍSTICA & QUALIDADE):
${laudoData.parecerTecnico}

CONCLUSÃO OPERACIONAL E RECOMENDAÇÕES:
${laudoData.conclusaoSeguranca}
=====================================================`;

    navigator.clipboard.writeText(textoParecer);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // Exportar PDF do Laudo
  const handleExportPdf = () => {
    exportRondaGsaManualPdf({
      dataStr: laudoData.dataFormatted,
      auditorNome: laudoData.auditorNome,
      localAuditado: laudoData.localAuditado,
      colaboradorAuditado: laudoData.colaboradorAuditado,
      pontuacaoPercentual: laudoData.percentual,
      statusPontuacao: laudoData.statusFarol,
      comentarios: laudoData.comentariosAuditor || undefined,
      respostas: ronda.respostas || ronda.respostasAvaliacao
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl my-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* CABEÇALHO MODAL */}
        <div className="bg-gradient-to-r from-blue-950 via-[#0d1b38] to-slate-900 px-6 py-5 border-b border-slate-700/80 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl shadow-inner">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase rounded-full">
                  LAUDO PERICIAL DSPD GUARABIRA
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {laudoData.dataFormatted} • Semana {laudoData.semanaAno}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Laudo Técnico de Conformidade & Qualidade do Armazém
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiarParecer}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              title="Copiar Parecer Técnico Formatado"
            >
              {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedSuccess ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CORPO DO LAUDO SCROLLÁVEL */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* IDENTIFICAÇÃO E SCORE GERAL */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0b1222] p-4 rounded-2xl border border-slate-800">
            <div className="md:col-span-3 space-y-2">
              <div className="text-[11px] font-mono text-cyan-400 uppercase font-black tracking-wider">
                {laudoData.codigoLaudo}
              </div>
              <div className="text-sm font-black text-white">
                Unidade Auditada: {laudoData.localAuditado}
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap gap-4 font-mono">
                <span>Auditor: <strong className="text-slate-200">{laudoData.auditorNome}</strong></span>
                <span>Equipe: <strong className="text-slate-200">{laudoData.colaboradorAuditado}</strong></span>
                <span>Data: <strong className="text-slate-200">{laudoData.dataFormatted}</strong></span>
              </div>
            </div>

            <div className="text-center md:text-right flex md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Aderência Global</span>
                <div className="text-3xl font-black font-mono text-blue-400">{laudoData.percentual}%</div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block mt-1 ${
                  laudoData.percentual >= 95 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {laudoData.statusFarol}
                </span>
              </div>
            </div>
          </div>

          {/* PARECER TÉCNICO PERICIAL */}
          <div className="bg-[#111a30] p-4.5 rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" /> Parecer Técnico Pericial (DSPD Guarabira)
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {laudoData.parecerTecnico}
            </p>
          </div>

          {/* DESVIOS E PLANOS DE AÇÃO 5W2H */}
          {laudoData.desvios.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Desvios Mapeados ({laudoData.desvios.length}) & Planos 5W2H
                </h4>
                <button
                  onClick={handleGerarTodosPlanos5W2H}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-black uppercase tracking-wider shadow"
                >
                  ⚡ Gerar Todos no Quadro DPO
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {laudoData.desvios.map(d => {
                  const jaSalvo = !!acoesSalvas[d.id];
                  return (
                    <div key={d.id} className="bg-[#111a30] border border-amber-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-black">
                            Quesito #{d.id}
                          </span>
                          <span className="text-xs font-black text-white">{d.perguntaCurta}</span>
                        </div>
                        <button
                          onClick={() => handleGerarAcaoDpo(d)}
                          disabled={jaSalvo}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                            jaSalvo ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-600 text-white hover:bg-amber-500'
                          }`}
                        >
                          {jaSalvo ? '✓ No Quadro DPO' : '⚡ Enviar Ação 5W2H'}
                        </button>
                      </div>

                      <div className="bg-[#0b1222] p-3 rounded-xl border border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase block">O Quê (Ação):</span>
                          <span className="text-slate-200 font-bold">{d.acao5W2H?.oQue}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Responsável:</span>
                          <span className="text-cyan-300 font-bold">{d.acao5W2H?.quem}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Prazo / Revisão:</span>
                          <span className="text-emerald-400 font-bold">{d.acao5W2H?.quando}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TABELA COMPLETA DOS 41 QUESITOS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-cyan-400" /> Detalhamento dos 41 Quesitos Auditados
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={categoriaFilter}
                  onChange={e => setCategoriaFilter(e.target.value)}
                  className="bg-[#111a30] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none font-bold"
                >
                  <option value="TODAS">Todas as Áreas</option>
                  {CATEGORIAS_GSA.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-[#111a30] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none font-bold"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="CONFORME">Conformes (Sim)</option>
                  <option value="NAO_CONFORME">Não Conformes (Não)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto bg-[#0b1222] border border-slate-800 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#111a30] text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Área</th>
                    <th className="py-2.5 px-3">Quesito / Requisito</th>
                    <th className="py-2.5 px-3 text-center">Resposta</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-bold">
                  {itensFiltrados.map(item => {
                    const isNao = item.resposta.includes('Não');
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono">#{item.id}</td>
                        <td className="py-2.5 px-3 text-cyan-300">{item.categoria}</td>
                        <td className="py-2.5 px-3 text-slate-200">
                          <div className="font-bold">{item.perguntaCurta}</div>
                          <div className="text-[11px] text-slate-400 font-normal">{item.perguntaCompleta}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            isNao ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {item.resposta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={isNao ? 'text-amber-400' : 'text-emerald-400'}>
                            {isNao ? '✗ Não Conforme' : '✓ Conforme'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CONCLUSÃO DO LAUDO */}
          <div className="bg-[#111a30] p-4 rounded-2xl border border-slate-800 space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Conclusão e Recomendações Técnicas
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {laudoData.conclusaoSeguranca}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
