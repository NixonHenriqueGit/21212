import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Calendar, 
  UserCheck, 
  FileText, 
  Save, 
  X, 
  Plus, 
  Search, 
  Award,
  Building2,
  HelpCircle,
  MessageSquare,
  History,
  Eye,
  Check,
  ClipboardList,
  BarChart2,
  PieChart,
  Filter,
  Download,
  Upload,
  FolderOpen,
  FileSpreadsheet,
  ExternalLink,
  Trash2,
  TrendingUp,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  User,
  Zap,
  Target,
  Layers,
  ArrowUpRight,
  Clock,
  Printer,
  ChevronRight,
  SlidersHorizontal,
  Truck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import * as XLSX from 'xlsx';
import { RondaGsaRepository, AcoesGeraisRepository } from '../db';
import { firestoreDb } from '../database/firestoreDatabase';
import { 
  QUESTOES_GSA_OFICIAIS, 
  RONDA_GSA_HISTORICO_OFICIAL, 
  CATEGORIAS_GSA,
  DOCUMENTO_DSPD_GUARABIRA,
  PLANO_DE_ACAO_PRIORITARIO_GSA,
  ItemVerificacaoGSA, 
  RondaInspecaoCompleta,
  ItemPlanoAcaoPrioritario,
  gerarLaudoTecnicoConformidade,
  LaudoTecnicoConformidade
} from '../data/rondaGsaOfficialDataset';
import { LaudoConformidadeArmazemModal } from './LaudoConformidadeArmazemModal';
import { LicencasDescarteSection } from './LicencasDescarteSection';
import { LicencasDescarteModal } from './LicencasDescarteModal';

export type NivelAvaliacao = 'excelente' | 'bom' | 'ruim' | 'na';

export interface RondaGSARecord extends RondaInspecaoCompleta {
  // Extensão compatível com a interface
}

interface RondaGsaComponentProps {
  user: any;
  empresaId?: string;
  theme?: 'light' | 'dark';
}

const RESOLUCOES_GSA_CONCLUIDAS: Record<number, string> = {
  3: 'Realizada limpeza geral e varrição pesada com equipe de apoio, recolhidos resíduos de paletes e reforçada vedação de telas perimetrais.',
  6: 'Estabelecido cronograma diário de varrição pré-turno às 06h e 14h nas docas e pátio de manobra, com registro em checklist 5S.',
  9: 'Instaladas cortinas retráteis de proteção UV nas aberturas das docas laterais e reposicionadas as pilhas a 2 metros das entradas.',
  4: 'Aplicada resina epóxi de cura rápida para nivelamento de juntas e eliminadas imperfeições no piso dos corredores 01 e 03.',
  15: 'Criada baia exclusiva identificada para triagem de paletes danificados e retirados 18 paletes avariados para manutenção externa.',
  32: 'Instalada estante metálica de 3 níveis com identificação por SKU e suporte suspenso para bobinas de filme stretch.',
  10: 'Ativados exaustores eólicos automatizados nos horários de maior calor (13h-16h) e padronizada aferição às 09h, 16h e 22h.',
  12: 'Disponibilizada tabela de lastro e altura máxima (PTL) afixada em todas as ruas e orientada equipe sobre limite de empilhamento.',
  18: 'Instalados protetores de poliuretano nos garfos das empilhadeiras 01 e 02 e realizada revisão de faróis e alarmes sonoros.'
};

export const RondaGsaComponent: React.FC<RondaGsaComponentProps> = ({
  user,
  empresaId = 'demo',
  theme = 'dark'
}) => {
  // Estado principal de rondas (35 rondas oficiais de Jan a Ago / 2026)
  const [records, setRecords] = useState<RondaGSARecord[]>(() => {
    try {
      const saved = localStorage.getItem('ronda_dspd_guarabira_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= RONDA_GSA_HISTORICO_OFICIAL.length) return parsed;
      }
    } catch (_) {}
    return RONDA_GSA_HISTORICO_OFICIAL as RondaGSARecord[];
  });

  // UI Control states
  const [activeTabVisual, setActiveTabVisual] = useState<'visao_geral' | 'graficos' | 'planos_acao' | 'desvios' | 'historico' | 'laudos' | 'licencas_descarte'>('visao_geral');
  const [showForm, setShowForm] = useState(false);
  const [isLicencasModalOpen, setIsLicencasModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RondaGSARecord | null>(null);
  const [isFullLaudoModalOpen, setIsFullLaudoModalOpen] = useState(false);
  const [laudoRondaSelecionada, setLaudoRondaSelecionada] = useState<any>(null);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('todos');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados específicos de Planos de Ação 5W2H e Desvios
  const [planoAcaoAreaFilter, setPlanoAcaoAreaFilter] = useState<string>('todas');
  const [planoAcaoSearchTerm, setPlanoAcaoSearchTerm] = useState<string>('');
  const [desviosSalvosDPO, setDesviosSalvosDPO] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dspd_planos_salvos_dpo');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });

  // Estados específicos da Aba de Laudos
  const [laudoTabSelectedId, setLaudoTabSelectedId] = useState<string>('');
  const [laudoTabAreaFilter, setLaudoTabAreaFilter] = useState<string>('TODAS');
  const [laudoTabSearchTerm, setLaudoTabSearchTerm] = useState<string>('');

  // Form states para Nova Ronda (DSPD Guarabira)
  const [dataISO, setDataISO] = useState<string>(new Date().toISOString().split('T')[0]);
  const [localAuditado, setLocalAuditado] = useState<string>('Armazém Geral - DSPD Guarabira');
  const [colaboradorAuditado, setColaboradorAuditado] = useState<string>('Equipe Operacional');
  const [auditorNome, setAuditorNome] = useState<string>(user?.nome || 'Djeanderson Soares');
  const [formComentarios, setFormComentarios] = useState<string>('');
  const [formAreaTab, setFormAreaTab] = useState<string>(CATEGORIAS_GSA[0]);

  // Respostas dos 41 quesitos no formulário
  const [respostasAvaliacao, setRespostasAvaliacao] = useState<Record<number, 'Sim' | 'Não' | 'N/A'>>(() => {
    const initial: Record<number, 'Sim' | 'Não' | 'N/A'> = {};
    QUESTOES_GSA_OFICIAIS.forEach(q => {
      initial[q.id] = 'Sim';
    });
    return initial;
  });
  const [observacoesItem, setObservacoesItem] = useState<Record<number, string>>({});

  // Sync com Repositório / LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('ronda_dspd_guarabira_history', JSON.stringify(records));
    } catch (_) {}
  }, [records]);

  // Cálculo de estatísticas globais
  const totalAudits = records.length; // 35
  const avgQuality = useMemo(() => {
    if (records.length === 0) return 96.5;
    const sum = records.reduce((acc, r) => acc + r.percentual, 0);
    return Number((sum / records.length).toFixed(1));
  }, [records]);

  const totalDesvios = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.totalNaoConformes || 0), 0);
  }, [records]);

  // Filtragem de registros históricos
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedMonthFilter !== 'todos' && r.mesAbrev !== selectedMonthFilter && r.mesAno !== selectedMonthFilter) return false;
      if (selectedStatusFilter !== 'todos') {
        if (selectedStatusFilter === 'DESVIOS' && r.totalNaoConformes === 0) return false;
        if (selectedStatusFilter !== 'DESVIOS' && r.status !== selectedStatusFilter) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchColab = (r.colaboradorAuditado || '').toLowerCase().includes(term);
        const matchLocal = (r.localAuditado || '').toLowerCase().includes(term);
        const matchAuditor = (r.auditorNome || '').toLowerCase().includes(term);
        const matchObs = (r.comentarios || '').toLowerCase().includes(term);
        const matchData = (r.dataFormatted || '').includes(term);
        if (!matchColab && !matchLocal && !matchAuditor && !matchObs && !matchData) return false;
      }
      return true;
    });
  }, [records, selectedMonthFilter, selectedStatusFilter, searchTerm]);

  // Registro Selecionado para o Laudo de Conformidade
  const currentLaudoRecord = useMemo(() => {
    if (laudoTabSelectedId) {
      const found = records.find(r => r.id === laudoTabSelectedId);
      if (found) return found;
    }
    return filteredRecords[0] || records[0];
  }, [records, filteredRecords, laudoTabSelectedId]);

  // Laudo Técnico Estruturado
  const currentLaudoData: LaudoTecnicoConformidade | null = useMemo(() => {
    if (!currentLaudoRecord) return null;
    return gerarLaudoTecnicoConformidade(currentLaudoRecord);
  }, [currentLaudoRecord]);

  // Dados para Gráficos
  const chartDataEvolution = useMemo(() => {
    return [...records].reverse().map((r, i) => ({
      name: `Ronda ${i + 1}`,
      data: r.dataFormatted,
      semana: `Sem ${r.semanaMes || ((i % 4) + 1)} (${r.mesAbrev || 'Mês'})`,
      aderencia: r.percentual,
      meta: 95.0,
      desvios: r.totalNaoConformes || 0
    }));
  }, [records]);

  const chartDataMensal = useMemo(() => {
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO'];
    return meses.map(m => {
      const info = (DOCUMENTO_DSPD_GUARABIRA.resumo_mensal as any)[m];
      return {
        mes: m,
        aderencia: info ? Number(info.aderencia_percentual.toFixed(1)) : 96.5,
        sim: info ? info.sim : 0,
        nao: info ? info.nao : 0,
        meta: 95.0
      };
    });
  }, []);

  const chartDataAreas = useMemo(() => {
    return CATEGORIAS_GSA.map(cat => {
      const info = (DOCUMENTO_DSPD_GUARABIRA.resumo_por_area as any)[cat];
      return {
        area: cat,
        aderencia: info ? Number(info.aderencia_percentual.toFixed(1)) : 100,
        sim: info ? info.sim : 0,
        nao: info ? info.nao : 0,
        meta: 95.0
      };
    });
  }, []);

  // Lista de Planos de Ação 5W2H Prioritários Filtrados
  const filteredPlanosAcao = useMemo(() => {
    return PLANO_DE_ACAO_PRIORITARIO_GSA.filter(item => {
      if (planoAcaoAreaFilter !== 'todas' && item.area !== planoAcaoAreaFilter) return false;
      if (planoAcaoSearchTerm.trim()) {
        const t = planoAcaoSearchTerm.toLowerCase();
        const matchQuesito = item.quesito.toLowerCase().includes(t);
        const matchArea = item.area.toLowerCase().includes(t);
        const matchAcao = item.acaoPadrao.toLowerCase().includes(t);
        if (!matchQuesito && !matchArea && !matchAcao) return false;
      }
      return true;
    });
  }, [planoAcaoAreaFilter, planoAcaoSearchTerm]);

  // Lista de Desvios Específicos das Rondas
  const allDetailedDesvios = useMemo(() => {
    const list: Array<{
      id: string;
      rondaId: string;
      dataFormatted: string;
      dataISO: string;
      mesAno: string;
      auditorNome: string;
      colaboradorAuditado: string;
      localAuditado: string;
      itemNumero: number;
      pergunta: string;
      perguntaCurta: string;
      categoria: string;
      norma: string;
      risco: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAIXO';
      impactoOperacional: 'BAIXO' | 'MEDIO' | 'ALTO';
      avaliacao: string;
      comentario: string;
      acao5W2H: any;
    }> = [];

    records.forEach(r => {
      QUESTOES_GSA_OFICIAIS.forEach(q => {
        const resp = (r.respostas as any)?.[q.pergunta] || (r.respostas as any)?.[q.perguntaCurta] || (r.itensMarcados && r.itensMarcados[q.pergunta]);
        if (resp === 'Não' || String(resp).toLowerCase().includes('ruim')) {
          list.push({
            id: `${r.id}-${q.id}`,
            rondaId: r.id,
            dataFormatted: r.dataFormatted,
            dataISO: r.dataISO,
            mesAno: r.mesAno,
            auditorNome: r.auditorNome,
            colaboradorAuditado: r.colaboradorAuditado,
            localAuditado: r.localAuditado,
            itemNumero: q.id,
            pergunta: q.pergunta,
            perguntaCurta: q.perguntaCurta,
            categoria: q.categoria,
            norma: q.norma,
            risco: q.riscoSeDesvio,
            impactoOperacional: q.impactoOperacional || 'BAIXO',
            avaliacao: 'Não Conforme (Não)',
            comentario: r.observacoesItem?.[q.id] || r.comentarios || `Desvio identificado no quesito '${q.perguntaCurta}'.`,
            acao5W2H: q.acaoPadrao5W2H
          });
        }
      });
    });

    return list;
  }, [records]);

  // Ação para enviar plano 5W2H ao Quadro Geral DPO
  const handleEnviarPlanoParaQuadroDPO = async (plano: any, idKey: string) => {
    try {
      const payload = {
        id: `dspd-acao-${Date.now()}-${idKey}`,
        empresaId,
        origem: 'Ronda de Qualidade DSPD Guarabira',
        titulo: `[DSPD Guarabira] ${plano.perguntaCurta || plano.quesito || 'Plano de Ação 5W2H'}`,
        oque: plano.acao5W2H?.oQue || plano.acaoPadrao || 'Executar tratativa corretiva no armazém',
        porque: plano.acao5W2H?.porQue || 'Garantir conformidade com os padrões de qualidade DPO',
        onde: plano.acao5W2H?.onde || 'Armazém Geral - DSPD Guarabira',
        quem: plano.acao5W2H?.quem || plano.responsavelPadrao || 'Djeanderson Soares',
        quando: plano.acao5W2H?.quando || new Date().toISOString().split('T')[0],
        como: plano.acao5W2H?.como || 'Ação imediata com equipe e validação na próxima ronda semanal',
        quanto: plano.acao5W2H?.quanto || 'R$ 0,00',
        status: 'EM_ANDAMENTO',
        prioridade: 'ALTA',
        setor: plano.categoria || plano.area || 'Armazém',
        categoria: 'Qualidade / DPO',
        dataCriacao: new Date().toISOString(),
        responsavel: plano.responsavelPadrao || 'Djeanderson Soares'
      };

      await AcoesGeraisRepository.create(payload);
      const updated = { ...desviosSalvosDPO, [idKey]: true };
      setDesviosSalvosDPO(updated);
      localStorage.setItem('dspd_planos_salvos_dpo', JSON.stringify(updated));
      alert(`✅ Plano 5W2H enviado com sucesso para o Quadro DPO de Ações!`);
    } catch (e: any) {
      alert(`❌ Erro ao salvar ação no DPO: ${e.message}`);
    }
  };

  // Salvar Nova Ronda
  const handleSalvarNovaRonda = (e: React.FormEvent) => {
    e.preventDefault();

    let countSim = 0;
    let countNao = 0;
    let countNA = 0;

    const respostasObj: Record<string, string> = {};
    const itensMarcadosObj: Record<string, string> = {};

    QUESTOES_GSA_OFICIAIS.forEach(q => {
      const valor = respostasAvaliacao[q.id] || 'Sim';
      respostasObj[q.pergunta] = valor;
      respostasObj[q.perguntaCurta] = valor;
      itensMarcadosObj[q.pergunta] = valor;

      if (valor === 'Sim') countSim++;
      else if (valor === 'Não') countNao++;
      else countNA++;
    });

    const avaliados = countSim + countNao;
    const aderencia = avaliados > 0 ? Number(((countSim / avaliados) * 100).toFixed(2)) : 100;
    const pontos10 = Number((aderencia / 10).toFixed(1));

    let status: 'EXCELENTE' | 'BOM' | 'RAZOÁVEL' | 'RUIM' = 'EXCELENTE';
    if (aderencia >= 95) status = 'EXCELENTE';
    else if (aderencia >= 90) status = 'BOM';
    else if (aderencia >= 80) status = 'RAZOÁVEL';
    else status = 'RUIM';

    const dataParts = dataISO.split('-');
    const dataFormatted = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
    const mesAno = `${dataParts[1]}/${dataParts[0]}`;

    const novaRonda: RondaGSARecord = {
      id: `dspd-ronda-${Date.now()}`,
      dataISO,
      dataFormatted,
      mesAno,
      mesNumero: dataParts[1],
      semanaAno: records.length + 1,
      semanaMes: Math.min(5, Math.ceil(parseInt(dataParts[2], 10) / 7)),
      mesAbrev: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'][parseInt(dataParts[1], 10) - 1],
      origem: 'registro_plataforma',
      auditorNome: auditorNome || 'Djeanderson Soares',
      colaboradorAuditado: colaboradorAuditado || 'Equipe Operacional',
      localAuditado: localAuditado || 'Armazém Geral - DSPD Guarabira',
      percentual: aderencia,
      pontosNota10: pontos10,
      status,
      comentarios: formComentarios || 'Ronda de qualidade e segurança operacional realizada no DSPD Guarabira.',
      desvioIdentificado: countNao > 0,
      coachingAplicado: countNao > 0,
      acaoCorretiva: countNao > 0 ? 'Planos 5W2H gerados para tratativa dos itens não conformes.' : undefined,
      totalConformes: countSim,
      totalNaoConformes: countNao,
      totalNaoAplica: countNA,
      criadoEm: new Date().toISOString(),
      respostas: respostasObj,
      itensMarcados: itensMarcadosObj,
      observacoesItem: { ...observacoesItem }
    };

    const updated = [novaRonda, ...records];
    setRecords(updated);
    setShowForm(false);
    alert(`✅ Nova Ronda do DSPD Guarabira cadastrada com sucesso! Aderência: ${aderencia}%`);
  };

  // Exportar Excel Oficial do DSPD Guarabira
  const handleExportExcelDSPD = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Aba 1: Histórico das Rondas
      const rondasSheetData = records.map(r => ({
        'ID': r.id,
        'Data': r.dataFormatted,
        'Mês': r.mesAbrev || r.mesAno,
        'Semana': r.semanaAno,
        'Unidade': r.localAuditado,
        'Auditor': r.auditorNome,
        'Colaborador / Turno': r.colaboradorAuditado,
        'Aderência (%)': r.percentual,
        'Nota (0-10)': r.pontosNota10,
        'Status DPO': r.status,
        'Conformes (Sim)': r.totalConformes,
        'Não Conformes (Não)': r.totalNaoConformes,
        'Comentários': r.comentarios || ''
      }));
      const wsRondas = XLSX.utils.json_to_sheet(rondasSheetData);
      XLSX.utils.book_append_sheet(wb, wsRondas, 'Rondas DSPD Guarabira');

      // Aba 2: Resumo por Área
      const areasSheetData = CATEGORIAS_GSA.map(cat => {
        const info = (DOCUMENTO_DSPD_GUARABIRA.resumo_por_area as any)[cat];
        return {
          'Área Operacional': cat,
          'Total Respostas': info ? info.respostas : 0,
          'Conformes (Sim)': info ? info.sim : 0,
          'Não Conformes (Não)': info ? info.nao : 0,
          'Aderência (%)': info ? info.aderencia_percentual : 100,
          'Meta DPO (%)': 95.0,
          'Status': (info?.aderencia_percentual || 100) >= 95 ? 'CONFORME' : 'ATENÇÃO'
        };
      });
      const wsAreas = XLSX.utils.json_to_sheet(areasSheetData);
      XLSX.utils.book_append_sheet(wb, wsAreas, 'Resumo por Área');

      // Aba 3: Planos de Ação 5W2H
      const planosSheetData = PLANO_DE_ACAO_PRIORITARIO_GSA.map(p => ({
        'Prioridade': p.prioridade,
        'ID Quesito': p.idQuesito,
        'Área': p.area,
        'Quesito / Requisito': p.quesito,
        'Histórico Base': p.indicadorBase,
        'Gatilho de Disparo': p.gatilho,
        'Ação Padrão (O Quê)': p.acaoPadrao,
        'Responsável': p.responsavelPadrao,
        'Observações': p.observacao
      }));
      const wsPlanos = XLSX.utils.json_to_sheet(planosSheetData);
      XLSX.utils.book_append_sheet(wb, wsPlanos, 'Planos de Ação 5W2H');

      XLSX.writeFile(wb, `DSPD_Guarabira_Rondas_Qualidade_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e: any) {
      alert(`❌ Erro ao exportar Excel: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* ── HEADER COMPACTO & HARMONIZADO: DSPD GUARABIRA - RONDAS DE QUALIDADE ── */}
      <div className="bg-gradient-to-br from-[#081226] via-[#0d1f42] to-[#0a152d] border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute right-0 top-0 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 relative z-10">
          
          {/* Lado Esquerdo: Identificação Corporativa & Título em Linha Direta */}
          <div className="space-y-2 flex-1 min-w-0">
            {/* Linha 1: Badges de Identificação e Conformidade */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" /> DSPD QUALIDADE & SEGURANÇA
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> FAROL CONFORME (≥ 95%)
              </span>
              <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 text-[10px] font-mono font-bold rounded-md">
                🏢 Guarabira - PB
              </span>
              <span className="px-2 py-0.5 bg-slate-800/90 text-slate-300 border border-slate-700 text-[10px] font-mono rounded-md">
                👤 Djeanderson Soares
              </span>
              <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold rounded-md">
                ✓ 8 Planos 5W2H Concluídos
              </span>
            </div>

            {/* Linha 2: Título e Resumo Operacional */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                DSPD Guarabira — Ronda de Qualidade Semanal (DPO)
              </h1>
              <p className="text-xs text-slate-300 font-normal leading-relaxed mt-0.5">
                Auditoria de <strong>41 Quesitos em 6 Áreas DPO</strong> • Frequência Semanal (Jan a Ago/2026) • <strong>Licença SUDEMA: LO 599/2020</strong>
              </p>
            </div>
          </div>

          {/* Lado Direito: Grid Compacto de 4 KPIs Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full lg:w-auto lg:min-w-[500px] shrink-0">
            <div className="bg-[#071124]/95 border border-blue-500/30 hover:border-blue-400/60 rounded-xl px-3 py-2 text-center space-y-0.5 shadow-md transition-all flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nota Média YTD</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-blue-400">{avgQuality}%</div>
              <span className="text-[9px] text-emerald-400 font-bold block">Meta: ≥ 95%</span>
            </div>

            <div className="bg-[#071124]/95 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl px-3 py-2 text-center space-y-0.5 shadow-md transition-all flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rondas</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">{totalAudits}</div>
              <span className="text-[9px] text-slate-300 font-bold block">35 Semanas</span>
            </div>

            <div className="bg-[#071124]/95 border border-emerald-500/30 hover:border-emerald-400/60 rounded-xl px-3 py-2 text-center space-y-0.5 shadow-md transition-all flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Planos 5W2H</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">8 OK</div>
              <span className="text-[9px] text-emerald-300 font-bold block">100% Tratados</span>
            </div>

            <div className="bg-[#071124]/95 border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl px-3 py-2 text-center space-y-0.5 shadow-md transition-all flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Quesitos</span>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-400">41</div>
              <span className="text-[9px] text-cyan-300 font-bold block">6 Áreas DPO</span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS DA RONDA DSPD GUARABIRA */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveTabVisual('visao_geral')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'visao_geral'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25'
                  : 'bg-[#071124] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Award className="w-4 h-4 text-blue-400" /> 1. Painel Farol
            </button>

            <button
              onClick={() => setActiveTabVisual('graficos')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'graficos'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25'
                  : 'bg-[#071124] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-cyan-400" /> 2. Gráficos YTD
            </button>

            <button
              onClick={() => setActiveTabVisual('planos_acao')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'planos_acao'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25'
                  : 'bg-[#071124] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Target className="w-4 h-4 text-amber-400" /> 3. Planos 5W2H (8)
            </button>

            <button
              onClick={() => setActiveTabVisual('desvios')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'desvios'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25'
                  : 'bg-[#071124] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" /> 4. Desvios ({allDetailedDesvios.length})
            </button>

            <button
              onClick={() => setActiveTabVisual('historico')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'historico'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25'
                  : 'bg-[#071124] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <History className="w-4 h-4 text-indigo-400" /> 5. Histórico ({records.length})
            </button>

            <button
              onClick={() => setActiveTabVisual('laudos')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'laudos'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/25'
                  : 'bg-[#071124] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" /> 6. Laudos & Parecer
            </button>

            <button
              onClick={() => setActiveTabVisual('licencas_descarte')}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTabVisual === 'licencas_descarte'
                  ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/25'
                  : 'bg-[#071124] text-emerald-400 hover:text-white border border-emerald-800/80'
              }`}
            >
              <Truck className="w-4 h-4 text-emerald-400" /> 7. Licenças & Recibos de Descarte
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsLicencasModalOpen(true)}
              className="px-3 py-2 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300 border border-emerald-600/50 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
              title="Abrir Central de Licenças SUDEMA e Recibos de Descarte Pedro Cidelino"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Licenças & Recibos
            </button>

            <button
              onClick={handleExportExcelDSPD}
              className="px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
              title="Exportar dados completos do DSPD Guarabira em formato Excel"
            >
              <FileSpreadsheet className="w-4 h-4" /> Exportar Excel
            </button>

            <button
              onClick={() => {
                if (currentLaudoRecord) {
                  setLaudoRondaSelecionada(currentLaudoRecord);
                  setIsFullLaudoModalOpen(true);
                }
              }}
              className="px-3 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Laudo PDF
            </button>

            <button
              onClick={() => setShowForm(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + Nova Ronda
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 1: PAINEL FAROL & INDICADORES (DSPD GUARABIRA)            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'visao_geral' && (
        <div className="space-y-6">
          {/* CARDS DAS 6 ÁREAS COM PERCENTUAL DE ADERÊNCIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIAS_GSA.map(cat => {
              const info = (DOCUMENTO_DSPD_GUARABIRA.resumo_por_area as any)[cat];
              const pct = info ? Number(info.aderencia_percentual.toFixed(1)) : 100;
              const sim = info ? info.sim : 0;
              const nao = info ? info.nao : 0;
              const isConforme = pct >= 95.0;

              return (
                <div key={cat} className="bg-[#0b1222] border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4.5 space-y-3 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{cat}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                      isConforme
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {isConforme ? '🟢 Conforme DPO' : '🟡 Atenção'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-black font-mono text-blue-400">{pct}%</div>
                      <span className="text-[10px] text-slate-400">Meta: ≥ 95.0%</span>
                    </div>
                    <div className="text-right text-[11px] font-bold space-y-0.5">
                      <div className="text-emerald-400">✓ {sim} Sim (Conforme)</div>
                      <div className={nao > 0 ? "text-amber-400" : "text-slate-500"}>✗ {nao} Não (Desvio)</div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${pct >= 95 ? 'bg-emerald-500' : pct >= 90 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABELA DE RESUMO MENSAL OFICIAL JAN A AGO */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" /> Aderência Mensal Consolidada (Jan a Ago / 2026)
              </h3>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800 font-bold">
                Fórmula: Sim / (Sim + Não) | Média YTD: 96.5%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#111a30] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Mês</th>
                    <th className="py-2.5 px-3 text-center">Respostas Auditadas</th>
                    <th className="py-2.5 px-3 text-center text-emerald-400">Sim (Conforme)</th>
                    <th className="py-2.5 px-3 text-center text-amber-400">Não (Desvio)</th>
                    <th className="py-2.5 px-3 text-center">Aderência (%)</th>
                    <th className="py-2.5 px-3 text-center">Meta DPO</th>
                    <th className="py-2.5 px-3 text-center">Status Farol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-bold">
                  {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO'].map(m => {
                    const info = (DOCUMENTO_DSPD_GUARABIRA.resumo_mensal as any)[m];
                    const pct = info ? Number(info.aderencia_percentual.toFixed(2)) : 96.5;
                    const isConf = pct >= 95.0;

                    return (
                      <tr key={m} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-white font-black">{m} / 2026</td>
                        <td className="py-3 px-3 text-center text-slate-300 font-mono">{info ? info.respostas_observadas : '-'}</td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-mono font-black">{info ? info.sim : '-'}</td>
                        <td className="py-3 px-3 text-center text-amber-400 font-mono font-black">{info ? info.nao : '-'}</td>
                        <td className="py-3 px-3 text-center font-mono text-base font-black text-blue-400">{pct}%</td>
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">≥ 95.0%</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isConf ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {isConf ? '🟢 Conforme' : '🟡 Atenção'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 2: GRÁFICOS & TENDÊNCIA YTD                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'graficos' && (
        <div className="space-y-6">
          {/* GRÁFICO 1: EVOLUÇÃO SEMANAL DAS RONDAS */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" /> Evolução Semanal de Aderência (Jan a Ago / 2026)
              </h3>
              <span className="text-xs text-emerald-400 font-bold font-mono">Meta Corporativa: 95.0%</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataEvolution} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="semana" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis domain={[85, 102]} stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <ReferenceLine y={95} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Meta DPO 95%', fill: '#10b981', fontSize: 10 }} />
                  <Line type="monotone" dataKey="aderencia" name="Aderência (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: ADERÊNCIA POR ÁREA E MENSAL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyan-400" /> Aderência por Mês (JAN a AGO)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataMensal} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 'bold' }} />
                    <YAxis domain={[85, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Bar dataKey="aderencia" name="Aderência (%)" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {chartDataMensal.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.aderencia >= 95 ? '#10b981' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" /> Aderência por Área Auditada
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={chartDataAreas} margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" domain={[85, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="area" stroke="#94a3b8" tick={{ fontSize: 9, fontWeight: 'bold' }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} />
                    <Bar dataKey="aderencia" name="Aderência (%)" fill="#6366f1" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 3: PLANOS DE AÇÃO 5W2H PRIORITÁRIOS (8 ITENS OFICIAIS)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'planos_acao' && (
        <div className="space-y-6">
          <div className="bg-[#0b1222] p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-amber-400" /> Matriz de Planos de Ação 5W2H Prioritários
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Planos de ação estruturados com base nas recorrências observadas na planilha oficial do <strong>DSPD Guarabira</strong> (Responsável: Djeanderson Soares).
                </p>
              </div>

              {/* Filtros da Matriz 5W2H */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={planoAcaoSearchTerm}
                    onChange={e => setPlanoAcaoSearchTerm(e.target.value)}
                    placeholder="Buscar plano 5W2H..."
                    className="w-full pl-9 pr-3 py-2 bg-[#111a30] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={planoAcaoAreaFilter}
                  onChange={e => setPlanoAcaoAreaFilter(e.target.value)}
                  className="bg-[#111a30] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none font-bold"
                >
                  <option value="todas">Todas as Áreas</option>
                  {CATEGORIAS_GSA.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* LISTAGEM DOS PLANOS DE AÇÃO 5W2H */}
            <div className="grid grid-cols-1 gap-4">
              {filteredPlanosAcao.map(p => {
                const idKey = `plano-dspd-prioritario-${p.idQuesito}`;
                const jaSalvo = !!desviosSalvosDPO[idKey];
                const resolucao = RESOLUCOES_GSA_CONCLUIDAS[p.idQuesito] || 'Ação implementada no local, verificada e validada em rotina operacional.';

                return (
                  <div 
                    key={p.prioridade}
                    className="bg-[#111a30] border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black">
                          Prioridade #{p.prioridade}
                        </span>
                        <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-black">
                          Quesito #{p.idQuesito}
                        </span>
                        <span className="text-xs font-black text-cyan-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                          {p.area}
                        </span>
                        <span className="px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-bold rounded-lg flex items-center gap-1">
                          ✓ Concluído no Quadro DPO
                        </span>
                      </div>

                      <button
                        onClick={() => handleEnviarPlanoParaQuadroDPO(p, idKey)}
                        disabled={jaSalvo}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          jaSalvo
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow hover:shadow-amber-500/25'
                        }`}
                      >
                        {jaSalvo ? '✓ No Quadro DPO' : '⚡ Sincronizar DPO'}
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white leading-relaxed">
                        {p.quesito}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                        {p.indicadorBase} • Gatilho: <span className="text-amber-300">{p.gatilho}</span>
                      </p>
                    </div>

                    {/* COMO FOI RESOLVIDO (RESOLUÇÃO SIMPLES) */}
                    <div className="bg-emerald-950/40 border border-emerald-700/40 p-3 rounded-xl">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider block">Como foi resolvido:</span>
                          <p className="text-xs text-emerald-200 font-medium leading-relaxed">{resolucao}</p>
                        </div>
                      </div>
                    </div>

                    {/* MATRIZ 5W2H COMPACTA */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#0b1222] p-3 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block">O Quê (Ação):</span>
                        <span className="text-slate-200 font-bold leading-tight">{p.acaoPadrao}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Quem (Responsável):</span>
                        <span className="text-cyan-300 font-bold">{p.responsavelPadrao}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Onde (Local):</span>
                        <span className="text-slate-200 font-bold">Armazém Geral (DSPD Guarabira)</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Quando (Revisão):</span>
                        <span className="text-emerald-400 font-bold">Próxima ronda semanal</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 4: DESVIOS IDENTIFICADOS NAS RONDAS                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'desvios' && (
        <div className="space-y-6">
          <div className="bg-[#0b1222] p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" /> Mural de Desvios das Rondas Operacionais
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total de <strong>{allDetailedDesvios.length}</strong> desvios mapeados, tratados com planos corretivos 5W2H e consolidados no <strong>Quadro de Ações DPO</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {allDetailedDesvios.map(d => {
                const idKey = `desvio-dspd-${d.id}`;
                const jaSalvo = !!desviosSalvosDPO[idKey];
                const resolucao = RESOLUCOES_GSA_CONCLUIDAS[d.itemNumero] || d.acao5W2H?.como || 'Ação corretiva realizada em campo com verificação semanal.';

                return (
                  <div key={d.id} className="bg-[#111a30] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-black">
                          Ronda: {d.dataFormatted}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-800 text-cyan-300 rounded text-[10px] font-bold">
                          {d.categoria}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-black">
                          Quesito #{d.itemNumero}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 rounded text-[10px] font-bold">
                          ✓ Concluído DPO
                        </span>
                      </div>

                      <button
                        onClick={() => handleEnviarPlanoParaQuadroDPO(d, idKey)}
                        disabled={jaSalvo}
                        className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                          jaSalvo
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                        }`}
                      >
                        {jaSalvo ? '✓ No Quadro DPO' : '⚡ Sincronizar DPO'}
                      </button>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">{d.perguntaCurta}</h4>
                      <p className="text-xs text-slate-300 mt-1">{d.pergunta}</p>
                      <p className="text-xs text-amber-300 font-mono mt-1">Observação: {d.comentario}</p>
                    </div>

                    {/* RESOLUÇÃO SIMPLES */}
                    <div className="bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl text-xs flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-bold text-emerald-400 uppercase block">Como foi resolvido:</span>
                        <span className="text-emerald-200">{resolucao}</span>
                      </div>
                    </div>

                    <div className="bg-[#0b1222] p-2.5 rounded-xl border border-slate-800/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Tratativa (5W2H):</span>
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
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 5: HISTÓRICO COMPLETO DAS RONDAS (35 RONDAS)              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'historico' && (
        <div className="space-y-6">
          <div className="bg-[#0b1222] p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" /> Histórico de Rondas Semanais (35 Inspeções)
                </h3>
                <p className="text-xs text-slate-400">
                  Unidade DSPD Guarabira - Auditor Responsável: Djeanderson Soares
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedMonthFilter}
                  onChange={e => setSelectedMonthFilter(e.target.value)}
                  className="bg-[#111a30] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none font-bold"
                >
                  <option value="todos">Todos os Meses</option>
                  {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO'].map(m => (
                    <option key={m} value={m}>{m} / 2026</option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar histórico..."
                    className="pl-9 pr-3 py-2 bg-[#111a30] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#111a30] text-slate-400 uppercase text-[10px] font-black tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Semana / Mês</th>
                    <th className="py-3 px-3">Local Auditado</th>
                    <th className="py-3 px-3">Auditor</th>
                    <th className="py-3 px-3 text-center">Conformes (Sim)</th>
                    <th className="py-3 px-3 text-center">Não Conformes (Não)</th>
                    <th className="py-3 px-3 text-center">Aderência (%)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-bold">
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-white font-mono">{r.dataFormatted}</td>
                      <td className="py-3 px-3 text-cyan-300 font-mono">Sem {r.semanaMes || 1} ({r.mesAbrev || 'Mês'})</td>
                      <td className="py-3 px-3 text-slate-300">{r.localAuditado}</td>
                      <td className="py-3 px-3 text-slate-300">{r.auditorNome}</td>
                      <td className="py-3 px-3 text-center text-emerald-400 font-mono font-black">{r.totalConformes}</td>
                      <td className="py-3 px-3 text-center text-amber-400 font-mono font-black">{r.totalNaoConformes}</td>
                      <td className="py-3 px-3 text-center font-mono text-sm font-black text-blue-400">{r.percentual}%</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          r.percentual >= 95 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            setLaudoTabSelectedId(r.id);
                            setActiveTabVisual('laudos');
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          Ver Laudo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 6: LAUDOS TÉCNICOS & PARECER DE CONFORMIDADE              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'laudos' && currentLaudoData && (
        <div className="space-y-6">
          <div className="bg-[#0b1222] p-6 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
            {/* SELETOR DE RONDA PARA O LAUDO */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111a30] p-4 rounded-xl border border-slate-800">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Selecionar Ronda para Visualização do Laudo:</label>
                <select
                  value={laudoTabSelectedId || currentLaudoRecord?.id}
                  onChange={e => setLaudoTabSelectedId(e.target.value)}
                  className="bg-[#0b1222] border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none font-bold"
                >
                  {records.map(r => (
                    <option key={r.id} value={r.id}>
                      Ronda {r.dataFormatted} - Sem {r.semanaMes || 1} ({r.mesAbrev}) - {r.percentual}% ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLaudoRondaSelecionada(currentLaudoRecord);
                    setIsFullLaudoModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Exportar Laudo
                </button>
              </div>
            </div>

            {/* CORPO DO LAUDO TÉCNICO */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="text-[10px] font-black uppercase text-cyan-400 tracking-widest font-mono">
                    {currentLaudoData.codigoLaudo}
                  </div>
                  <h2 className="text-xl font-black text-white mt-1">
                    Laudo Técnico de Conformidade da Ronda de Qualidade
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unidade: <strong>{currentLaudoData.localAuditado}</strong> • Auditor: <strong>{currentLaudoData.auditorNome}</strong> ({currentLaudoData.auditorCargo})
                  </p>
                </div>

                <div className="text-right bg-[#0b1222] p-3 rounded-xl border border-slate-800">
                  <div className="text-3xl font-black font-mono text-blue-400">{currentLaudoData.percentual}%</div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                    currentLaudoData.percentual >= 95 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {currentLaudoData.statusFarol}
                  </span>
                </div>
              </div>

              {/* PARECER TÉCNICO */}
              <div className="bg-[#111a30] p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" /> Parecer Técnico Pericial
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {currentLaudoData.parecerTecnico}
                </p>
              </div>

              {/* TABELA DOS 41 QUESITOS DO LAUDO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-cyan-400" /> Verificação Detalhada dos 41 Quesitos
                  </h4>
                  <div className="flex items-center gap-2">
                    <select
                      value={laudoTabAreaFilter}
                      onChange={e => setLaudoTabAreaFilter(e.target.value)}
                      className="bg-[#111a30] border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none font-bold"
                    >
                      <option value="TODAS">Todas as Áreas</option>
                      {CATEGORIAS_GSA.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#111a30] text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Área</th>
                        <th className="py-2.5 px-3">Quesito / Descrição</th>
                        <th className="py-2.5 px-3 text-center">Resposta</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-bold">
                      {currentLaudoData.itens
                        .filter(item => laudoTabAreaFilter === 'TODAS' || item.categoria === laudoTabAreaFilter)
                        .map(item => {
                          const isNao = item.resposta.includes('Não');
                          return (
                            <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 text-slate-400 font-mono">#{item.id}</td>
                              <td className="py-2.5 px-3 text-cyan-300 font-sans">{item.categoria}</td>
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
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ABA 7: LICENÇAS DE DESPEJO E DESCARTE COM RECIBOS (SUDEMA)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTabVisual === 'licencas_descarte' && (
        <div className="animate-fadeIn">
          <LicencasDescarteSection theme={theme} />
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL: NOVA RONDA DE QUALIDADE DSPD GUARABIRA                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0b1222] border border-slate-800 rounded-3xl w-full max-w-4xl p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[10px] font-black uppercase">
                  Auditoria Operacional
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Nova Ronda de Qualidade - DSPD Guarabira
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarNovaRonda} className="space-y-6">
              {/* CABEÇALHO DA RONDA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#111a30] p-4 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Data da Ronda:</label>
                  <input
                    type="date"
                    value={dataISO}
                    onChange={e => setDataISO(e.target.value)}
                    required
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Unidade / Local:</label>
                  <input
                    type="text"
                    value={localAuditado}
                    onChange={e => setLocalAuditado(e.target.value)}
                    required
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Auditor Responsável:</label>
                  <input
                    type="text"
                    value={auditorNome}
                    onChange={e => setAuditorNome(e.target.value)}
                    required
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                  />
                </div>
              </div>

              {/* SELETOR DE ÁREAS (TABS) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
                {CATEGORIAS_GSA.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormAreaTab(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all cursor-pointer ${
                      formAreaTab === cat
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-[#111a30] text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* LISTA DOS QUESITOS DA ÁREA SELECIONADA */}
              <div className="space-y-4">
                {QUESTOES_GSA_OFICIAIS
                  .filter(q => q.categoria === formAreaTab)
                  .map(q => {
                    const currentVal = respostasAvaliacao[q.id] || 'Sim';
                    return (
                      <div key={q.id} className="bg-[#111a30] border border-slate-800 p-4 rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-cyan-400 font-mono">Quesito #{q.id} • {q.norma}</span>
                            <h4 className="text-sm font-black text-white">{q.perguntaCurta}</h4>
                            <p className="text-xs text-slate-400">{q.pergunta}</p>
                          </div>

                          {/* BOTÕES DE RESPOSTA BINÁRIA (SIM / NÃO / N/A) */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setRespostasAvaliacao(prev => ({ ...prev, [q.id]: 'Sim' }))}
                              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                                currentVal === 'Sim'
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                                  : 'bg-[#0b1222] text-slate-400 hover:text-emerald-400 border border-slate-800'
                              }`}
                            >
                              ✓ Sim
                            </button>

                            <button
                              type="button"
                              onClick={() => setRespostasAvaliacao(prev => ({ ...prev, [q.id]: 'Não' }))}
                              className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                                currentVal === 'Não'
                                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                                  : 'bg-[#0b1222] text-slate-400 hover:text-amber-400 border border-slate-800'
                              }`}
                            >
                              ✗ Não
                            </button>

                            <button
                              type="button"
                              onClick={() => setRespostasAvaliacao(prev => ({ ...prev, [q.id]: 'N/A' }))}
                              className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                                currentVal === 'N/A'
                                  ? 'bg-slate-700 text-white shadow'
                                  : 'bg-[#0b1222] text-slate-500 hover:text-white border border-slate-800'
                              }`}
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        {currentVal === 'Não' && (
                          <div className="pt-2 border-t border-slate-800">
                            <input
                              type="text"
                              value={observacoesItem[q.id] || ''}
                              onChange={e => setObservacoesItem(prev => ({ ...prev, [q.id]: e.target.value }))}
                              placeholder="Observação detalhada do desvio identificado..."
                              className="w-full bg-[#0b1222] border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Comentários Gerais da Ronda:</label>
                <textarea
                  value={formComentarios}
                  onChange={e => setFormComentarios(e.target.value)}
                  rows={2}
                  placeholder="Observações adicionais sobre o estado de conformidade do DSPD Guarabira..."
                  className="w-full bg-[#111a30] border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black uppercase text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/25"
                >
                  Salvar Ronda DSPD Guarabira
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LAUDO EM TELA CHEIA */}
      {isFullLaudoModalOpen && (
        <LaudoConformidadeArmazemModal
          ronda={laudoRondaSelecionada || records[0]}
          onClose={() => setIsFullLaudoModalOpen(false)}
        />
      )}

      {/* MODAL CENTRAL DE LICENÇAS E RECIBOS DE DESPEJO/DESCARTE */}
      <LicencasDescarteModal
        isOpen={isLicencasModalOpen}
        onClose={() => setIsLicencasModalOpen(false)}
        theme={theme}
      />
    </div>
  );
};
