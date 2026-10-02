import React, { useState, useEffect } from 'react';
import TemperaturaImportExportBar from './TemperaturaImportExportBar';
import { getStoredTempLogs } from '../utils/tempStorage';
import { firestoreDb } from '../database/firestoreDatabase';
import { 
  ShieldCheck, 
  Thermometer, 
  Bug, 
  Upload, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Flame, 
  TrendingDown, 
  UserCheck, 
  History, 
  Download, 
  Eye, 
  Trash2, 
  Plus, 
  X,
  Building2,
  Clock,
  Shield,
  FileCheck,
  ClipboardList,
  Bell,
  Filter,
  Award,
  Database,
  Truck,
  ExternalLink,
  Save,
  Layers,
  Check,
  LayoutDashboard,
  Edit3,
  FileSpreadsheet,
  Search,
  CalendarDays,
  ChevronRight,
  Info
} from 'lucide-react';
import { Usuario, Empresa } from '../types';
import { Checklist5SModal, ImportExport5SModal, generateYTD5SAudits, Audit5SRecord, exportAuditsToExcel } from './Checklist5SModal';
import { getStored5SAudits, CAMPEOES_5S_MENSAIS, isChampionForMonth } from '../utils/fiveSStore';
import { RondaGsaComponent } from './RondaGsaComponent';
import { IndicatorActionModal } from './IndicatorActionModal';
import { QuadroAcoesDpo } from './QuadroAcoesDpo';
import { exportChecklist5SOfficialPdf, getDefaultScoresForPercentage } from '../utils/exportChecklist5SPdf';
import { Official5SDigitalAuditModal } from './Official5SDigitalAuditModal';
import { OperationalNotificationBell } from './OperationalNotificationBell';
import { PadraoRecolhimentoTemperaturaModal } from './PadraoRecolhimentoTemperaturaModal';
import { PlanoAcoesTermicasMensais } from './PlanoAcoesTermicasMensais';
import { AcoesGeraisRepository } from '../db';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';
import { setMediaItem, getMediaItem, removeMediaItem } from '../utils/idbStorage';
import { 
  LaudoPragas, 
  LaudoFileItem, 
  initPragasStorage, 
  getStoredPragasLaudosSync, 
  savePragasLaudo, 
  deletePragasLaudo,
  downloadDataUrl,
  openDataUrlInNewTab
} from '../utils/pragasStorage';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

export interface Area5SOficial {
  id: string;
  area: string;
  responsavel: string;
  observacao: string;
  metaPct: number;
  realPctDefault: number;
}

export const MESES_ANO_5S = [
  { value: '01', label: '01 - Janeiro' },
  { value: '02', label: '02 - Fevereiro' },
  { value: '03', label: '03 - Março' },
  { value: '04', label: '04 - Abril' },
  { value: '05', label: '05 - Maio' },
  { value: '06', label: '06 - Junho' },
  { value: '07', label: '07 - Julho' },
  { value: '08', label: '08 - Agosto' },
  { value: '09', label: '09 - Setembro' },
  { value: '10', label: '10 - Outubro' },
  { value: '11', label: '11 - Novembro' },
  { value: '12', label: '12 - Dezembro' },
];

export const DEFAULT_AREA_RESPONSAVEIS: Record<string, string> = {
  'PICKING': 'DEJEAN SILVA DE OLIVEIRA',
  'ÁREA DE CARREGAMENTO': 'DEJEAN SILVA DE OLIVEIRA',
  'CENTRAL': 'DEJEAN SILVA DE OLIVEIRA',
  'DESPEJO': 'OZENILDO SOUSA SILVA',
  'ÁREA MKT PLACE': 'OZENILDO SOUSA SILVA',
  'PNC': 'GILSON ROSA DA SILVA',
  'RECICLÁVEIS': 'ADELSON SANTOS DE ARAUJO',
  'REFUGO': 'GLADSON LISBOA DOS SANTOS',
  'DEVOLUÇÃO': 'GLADSON LISBOA DOS SANTOS',
  'REPACK': 'OZENILDO SOUSA SILVA',
  'ÁREA DE CARREGAMENTO DA EMPILHADEIRA': 'PAULO PEREIRA DA SILVA',
  'EMPILHADEIRA 2': 'JOSE RONILDO DA SILVA',
  'EMPILHADEIRA 1': 'MARIVALDO ARTUR ALVES',
  'FROTA DA ENTREGA': 'DIOGENES PEREIRA DA SILVA',
  'ADMINISTRATIVO': 'KATHYEL ROCHA DA SILVA'
};

export const generateInitial5SAudits = (): Audit5SRecord[] => {
  return generateYTD5SAudits();
};

export const LISTA_5S_OFICIAL: Area5SOficial[] = [
  { id: '1', area: 'PICKING', responsavel: 'DEJEAN SILVA DE OLIVEIRA', observacao: 'Principais atividades de separação (Campeão Março)', metaPct: 80, realPctDefault: 88 },
  { id: '2', area: 'ÁREA DE CARREGAMENTO', responsavel: 'DEJEAN SILVA DE OLIVEIRA', observacao: 'Doca e pátio de carregamento', metaPct: 80, realPctDefault: 86 },
  { id: '3', area: 'CENTRAL', responsavel: 'DEJEAN SILVA DE OLIVEIRA', observacao: 'Estoque central de rotatividade', metaPct: 80, realPctDefault: 88 },
  { id: '4', area: 'DESPEJO', responsavel: 'OZENILDO SOUSA SILVA', observacao: 'Área de descarte e triagem (Campeão Fevereiro)', metaPct: 80, realPctDefault: 88 },
  { id: '5', area: 'ÁREA MKT PLACE', responsavel: 'OZENILDO SOUSA SILVA', observacao: 'Mercado Livre / Vendas diretas', metaPct: 80, realPctDefault: 87 },
  { id: '6', area: 'PNC', responsavel: 'GILSON ROSA DA SILVA', observacao: 'Segregação de Não Conformes (Campeão Julho)', metaPct: 80, realPctDefault: 88 },
  { id: '7', area: 'RECICLÁVEIS', responsavel: 'ADELSON SANTOS DE ARAUJO', observacao: 'Prensa e enfardamento de papelão', metaPct: 80, realPctDefault: 88 },
  { id: '8', area: 'REFUGO', responsavel: 'GLADSON LISBOA DOS SANTOS', observacao: 'Avaria e descarte de cacos (Campeão Maio)', metaPct: 80, realPctDefault: 86 },
  { id: '9', area: 'DEVOLUÇÃO', responsavel: 'GLADSON LISBOA DOS SANTOS', observacao: 'Conferência de retornáveis (Campeão Maio)', metaPct: 80, realPctDefault: 87 },
  { id: '10', area: 'REPACK', responsavel: 'OZENILDO SOUSA SILVA', observacao: 'Reembalagem e montagem de pacotes', metaPct: 80, realPctDefault: 88 },
  { id: '11', area: 'ÁREA DE CARREGAMENTO DA EMPILHADEIRA', responsavel: 'PAULO PEREIRA DA SILVA', observacao: 'Baterias e movimentação (Campeão Junho)', metaPct: 80, realPctDefault: 86 },
  { id: '12', area: 'EMPILHADEIRA 2', responsavel: 'JOSE RONILDO DA SILVA', observacao: 'Operação da Empilhadeira 02', metaPct: 80, realPctDefault: 86 },
  { id: '13', area: 'EMPILHADEIRA 1', responsavel: 'MARIVALDO ARTUR ALVES', observacao: 'Operação da Empilhadeira 01', metaPct: 80, realPctDefault: 87 },
  { id: '14', area: 'FROTA DA ENTREGA', responsavel: 'DIOGENES PEREIRA DA SILVA', observacao: 'Estacionamento e baús de entrega (Campeão Abril e Agosto)', metaPct: 80, realPctDefault: 99 },
  { id: '15', area: 'ADMINISTRATIVO', responsavel: 'KATHYEL ROCHA DA SILVA', observacao: 'Escritório Administrativo & Apoio Operacional', metaPct: 80, realPctDefault: 86 }
];

export interface ArmazemTemperaturaLog {
  id: string;
  dataISO: string;
  dataFormatted: string;
  mesAno: string;
  hora: string;
  temperatura: number;
  umidade: number;
  setor: string;
  conferenteNome: string;
  observacao?: string;
  alertaCritico: boolean;
}

export type { LaudoFileItem, LaudoPragas };

const generateInitialTempLogs = (): ArmazemTemperaturaLog[] => {
  const list: ArmazemTemperaturaLog[] = [];
  const conferentes = ['Carlos Silva (Conferente)', 'Marcos Vinícius (Conferente)', 'José Fernandes (Conferente)'];
  
  // July 2026 (07/2026 - Mês Vigente)
  for (let day = 1; day <= 30; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dataISO = `2026-07-${dayStr}`;
    const dataFormatted = `${dayStr}/07/2026`;
    
    let temp = 24.5 + Math.sin(day * 0.7) * 2.2 + (day % 3 === 0 ? 0.8 : 0);
    temp = Number(temp.toFixed(1));
    let obs = 'Medição de rotina realizada em conformidade com o POP-LOG-015.';
    let alerta = false;

    if (day === 18) {
      temp = 28.7;
      obs = '⚠️ ELEVAÇÃO TÉRMICA: Pico de calor externo às 14h. Portão lateral mantido aberto para descarga de carreta.';
      alerta = true;
    } else if (day === 25) {
      temp = 28.3;
      obs = '⚠️ ALERTA DE TEMPERATURA: Registro levemente acima de 28°C. Exaustores acionados.';
      alerta = true;
    }

    list.push({
      id: `temp-2026-07-${dayStr}`,
      dataISO,
      dataFormatted,
      mesAno: '07/2026',
      hora: '14:00',
      temperatura: temp,
      umidade: Math.round(55 + Math.cos(day) * 5),
      setor: 'Armazém Central (Guarabira)',
      conferenteNome: conferentes[day % conferentes.length],
      observacao: obs,
      alertaCritico: alerta
    });
  }

  // June 2026 (06/2026)
  for (let day = 1; day <= 30; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    let temp = 25.0 + Math.cos(day * 0.5) * 1.8;
    temp = Number(temp.toFixed(1));
    let alerta = false;
    let obs = 'Aferição diária no horário padrão (14:00).';
    if (day === 12) {
      temp = 28.5;
      alerta = true;
      obs = '⚠️ Registro > 28°C no meio do mês de Junho.';
    }

    list.push({
      id: `temp-2026-06-${dayStr}`,
      dataISO: `2026-06-${dayStr}`,
      dataFormatted: `${dayStr}/06/2026`,
      mesAno: '06/2026',
      hora: '14:00',
      temperatura: temp,
      umidade: Math.round(58 + Math.sin(day) * 4),
      setor: 'Armazém Central (Guarabira)',
      conferenteNome: conferentes[day % conferentes.length],
      observacao: obs,
      alertaCritico: alerta
    });
  }

  // May 2026 (05/2026)
  for (let day = 1; day <= 31; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    let temp = 24.2 + Math.sin(day * 0.3) * 1.5;
    temp = Number(temp.toFixed(1));

    list.push({
      id: `temp-2026-05-${dayStr}`,
      dataISO: `2026-05-${dayStr}`,
      dataFormatted: `${dayStr}/05/2026`,
      mesAno: '05/2026',
      hora: '14:00',
      temperatura: temp,
      umidade: 56,
      setor: 'Armazém Central (Guarabira)',
      conferenteNome: conferentes[day % conferentes.length],
      observacao: 'Medição diária em conformidade - maio/2026.',
      alertaCritico: false
    });
  }

  return list;
};

export interface AuditoriaFrotaMensal {
  id: string;
  mesAno: string; // ex: '08/2026'
  ano: string;
  mes: string;
  dataAuditoria: string;
  auditorResponsavel: string;
  notaPercentualFrota: number;
  observacoes: string;
  pdfFileName?: string;
  pdfFileDataUrl?: string;
  criadoEm: string;
  scores?: Record<number, number>;
  areaAuditada?: string;
  auditadoNome?: string;
}

export const generateInitialAuditoriasFrota = (): AuditoriaFrotaMensal[] => {
  return [
    { 
      id: 'frota-2026-01', 
      mesAno: '01/2026', 
      ano: '2026', 
      mes: '01', 
      dataAuditoria: '2026-01-28', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 88, 
      observacoes: 'Auditoria mensal do armazém conforme padrão DPO. 5S realizado com sucesso.', 
      pdfFileName: 'Auditoria_Frota_Armazem_01_2026_Assinada.pdf', 
      criadoEm: '2026-01-28T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(88, 1)
    },
    { 
      id: 'frota-2026-02', 
      mesAno: '02/2026', 
      ano: '2026', 
      mes: '02', 
      dataAuditoria: '2026-02-25', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 88, 
      observacoes: 'Organização do pátio e picking bem estruturados. Setor bem organizado.', 
      pdfFileName: 'Auditoria_Frota_Armazem_02_2026_Assinada.pdf', 
      criadoEm: '2026-02-25T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(88, 2)
    },
    { 
      id: 'frota-2026-03', 
      mesAno: '03/2026', 
      ano: '2026', 
      mes: '03', 
      dataAuditoria: '2026-03-27', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 92, 
      observacoes: 'Conformidade das faixas de pedestre e segregação. Área limpa.', 
      pdfFileName: 'Auditoria_Frota_Armazem_03_2026_Assinada.pdf', 
      criadoEm: '2026-03-27T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(92, 3)
    },
    { 
      id: 'frota-2026-04', 
      mesAno: '04/2026', 
      ano: '2026', 
      mes: '04', 
      dataAuditoria: '2026-04-28', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 88, 
      observacoes: 'Disposição adequada de paletes e descarte segregado. Checklist concluído.', 
      pdfFileName: 'Auditoria_Frota_Armazem_04_2026_Assinada.pdf', 
      criadoEm: '2026-04-28T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(88, 4)
    },
    { 
      id: 'frota-2026-05', 
      mesAno: '05/2026', 
      ano: '2026', 
      mes: '05', 
      dataAuditoria: '2026-05-27', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 88, 
      observacoes: 'Setores de devolução e refugo bem demarcados. 5S realizado com excelência.', 
      pdfFileName: 'Auditoria_Frota_Armazem_05_2026_Assinada.pdf', 
      criadoEm: '2026-05-27T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(88, 5)
    },
    { 
      id: 'frota-2026-06', 
      mesAno: '06/2026', 
      ano: '2026', 
      mes: '06', 
      dataAuditoria: '2026-06-26', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 92, 
      observacoes: 'Excelente padrão de 5S no armazém. Rotina cumprida com sucesso.', 
      pdfFileName: 'Auditoria_Frota_Armazem_06_2026_Assinada.pdf', 
      criadoEm: '2026-06-26T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(92, 6)
    },
    { 
      id: 'frota-2026-07', 
      mesAno: '07/2026', 
      mes: '07', 
      ano: '2026', 
      dataAuditoria: '2026-07-29', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 88, 
      observacoes: 'Auditoria cruzada realizada conforme padrão DPO. Setor organizado.', 
      pdfFileName: 'Auditoria_Frota_Armazem_07_2026_Assinada.pdf', 
      criadoEm: '2026-07-29T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(88, 7)
    },
    { 
      id: 'frota-2026-08', 
      mesAno: '08/2026', 
      ano: '2026', 
      mes: '08', 
      dataAuditoria: '2026-08-14', 
      auditorResponsavel: 'Pedro Bruno (Setor de Frota)', 
      notaPercentualFrota: 92, 
      observacoes: 'Auditoria mensal em andamento, conformidade positiva e área limpa.', 
      pdfFileName: 'Auditoria_Frota_Armazem_08_2026_Assinada.pdf', 
      criadoEm: '2026-08-14T10:00:00Z',
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      scores: getDefaultScoresForPercentage(92, 8)
    }
  ];
};

interface QualidadePanelProps {
  user: Usuario;
  empresa: Empresa | null;
  theme?: 'dark' | 'light';
}

export default function QualidadePanel({ user, empresa, theme = 'dark' }: QualidadePanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'temperatura' | '5s' | 'pragas' | 'ronda_gsa' | 'acoes'>('temperatura');
  const [active5SView, setActive5SView] = useState<'geral_frota' | 'ranking_colaboradores' | 'ranking_areas' | 'historico_auditorias'>('geral_frota');

  // ── 5S AUDIT & RESPONSIBLES STATE ──
  const currentDate = new Date();
  const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(currentDate.getFullYear());

  const [selectedMonth5S, setSelectedMonth5S] = useState<string>(currentMonthStr);
  const [selectedYear5S, setSelectedYear5S] = useState<string>('2026');

  // ── AUDITORIAS DO SETOR DE FROTA (PEDRO BRUNO) ──
  const [auditoriasFrota, setAuditoriasFrota] = useState<AuditoriaFrotaMensal[]>(() => {
    const targetFrotaByMonth: Record<string, number> = {
      '01': 88, '02': 88, '03': 92, '04': 88, '05': 88, '06': 92, '07': 88, '08': 92
    };

    try {
      const saved = localStorage.getItem('auditorias_frota_5s_mensal');
      if (saved) {
        const parsed: AuditoriaFrotaMensal[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map(item => {
            const defaultTarget = targetFrotaByMonth[item.mes] || 88;
            const nota = item.notaPercentualFrota || defaultTarget;
            const auditName = item.auditadoNome && !item.auditadoNome.toUpperCase().includes('KATHYEL') 
              ? item.auditadoNome 
              : 'Djeanderson Soares';
            return {
              ...item,
              notaPercentualFrota: nota,
              areaAuditada: 'Armazém Geral',
              auditadoNome: auditName,
              scores: item.scores || getDefaultScoresForPercentage(nota, parseInt(item.mes, 10))
            };
          });
          localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(updated));
          return updated;
        }
      }
      const initial = generateInitialAuditoriasFrota();
      localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(initial));
      return initial;
    } catch {
      return generateInitialAuditoriasFrota();
    }
  });

  const [showFrotaModal, setShowFrotaModal] = useState<boolean>(false);
  const [frotaAuditor, setFrotaAuditor] = useState<string>('Pedro Bruno (Setor de Frota)');
  const [frotaNota, setFrotaNota] = useState<string>('90');
  const [frotaData, setFrotaData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [frotaObs, setFrotaObs] = useState<string>('Auditoria mensal do armazém realizada pelo setor de Frota.');
  const [frotaPdfFile, setFrotaPdfFile] = useState<{ fileName: string; fileDataUrl?: string } | null>(null);

  // Mapeamento de Responsáveis por Área Conectados com o Cadastro de Colaboradores & Workstation
  const [areaResponsaveis, setAreaResponsaveis] = useState<Record<string, string>>(() => {
    try {
      const savedWorkstation = localStorage.getItem('workstation_5s_responsaveis');
      if (savedWorkstation) {
        const parsed: any[] = JSON.parse(savedWorkstation);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map: Record<string, string> = {};
          parsed.forEach(item => {
            if (item.area && item.responsavel) {
              map[item.area] = item.responsavel;
            }
          });
          return { ...DEFAULT_AREA_RESPONSAVEIS, ...map };
        }
      }
      const savedOld = localStorage.getItem('5s_area_responsables_guarabira');
      if (savedOld) return JSON.parse(savedOld);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_AREA_RESPONSAVEIS;
  });

  useEffect(() => {
    const syncResponsaveis = () => {
      try {
        const savedWorkstation = localStorage.getItem('workstation_5s_responsaveis');
        if (savedWorkstation) {
          const parsed: any[] = JSON.parse(savedWorkstation);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map: Record<string, string> = {};
            parsed.forEach(item => {
              if (item.area && item.responsavel) {
                map[item.area] = item.responsavel;
              }
            });
            setAreaResponsaveis({ ...DEFAULT_AREA_RESPONSAVEIS, ...map });
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('5s_responsaveis_updated', syncResponsaveis);
    window.addEventListener('storage', syncResponsaveis);
    return () => {
      window.removeEventListener('5s_responsaveis_updated', syncResponsaveis);
      window.removeEventListener('storage', syncResponsaveis);
    };
  }, []);

  const handleUpdateAreaResponsavel = (areaName: string, newCollaboratorName: string) => {
    const updatedMap = { ...areaResponsaveis, [areaName]: newCollaboratorName };
    setAreaResponsaveis(updatedMap);
    try {
      localStorage.setItem('5s_area_responsables_guarabira', JSON.stringify(updatedMap));
      
      const savedWorkstation = localStorage.getItem('workstation_5s_responsaveis');
      let workstationList: any[] = savedWorkstation ? JSON.parse(savedWorkstation) : [];
      if (!Array.isArray(workstationList) || workstationList.length === 0) {
        workstationList = Object.entries(DEFAULT_AREA_RESPONSAVEIS).map(([area, resp], i) => ({
          id: `${i + 1}`,
          area,
          responsavel: resp,
          cargoResponsavel: 'AJUDANTE',
          observacao: 'Principal Responsável',
          metaPct: 80
        }));
      }

      const officialMatch = LISTA_COLABORADORES_OFICIAIS.find(c => c.nome === newCollaboratorName);
      const itemIndex = workstationList.findIndex(w => w.area === areaName);
      if (itemIndex >= 0) {
        workstationList[itemIndex] = {
          ...workstationList[itemIndex],
          responsavel: newCollaboratorName,
          cargoResponsavel: officialMatch ? officialMatch.cargo : 'AJUDANTE'
        };
      } else {
        workstationList.push({
          id: `area-${Date.now()}`,
          area: areaName,
          responsavel: newCollaboratorName,
          cargoResponsavel: officialMatch ? officialMatch.cargo : 'AJUDANTE',
          observacao: 'Principal Responsável',
          metaPct: 80
        });
      }

      localStorage.setItem('workstation_5s_responsaveis', JSON.stringify(workstationList));
      window.dispatchEvent(new Event('5s_responsaveis_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const [filter5SMode, setFilter5SMode] = useState<'todos' | 'atingiram' | 'fora'>('todos');
  const [is5SModalOpen, setIs5SModalOpen] = useState(false);
  const [is5SDigitalModalOpen, setIs5SDigitalModalOpen] = useState(false);
  const [is5SImportModalOpen, setIs5SImportModalOpen] = useState(false);
  const [selected5SSetor, setSelected5SSetor] = useState('PICKING');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const frotaFileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Estado para Modal de Histórico Diário do Colaborador e Detalhamento
  const [selectedColabForHistory, setSelectedColabForHistory] = useState<any | null>(null);
  const [selectedColabHistoryMonth, setSelectedColabHistoryMonth] = useState<string>('todos');
  const [selectedColabHistoryArea, setSelectedColabHistoryArea] = useState<string>('todas');
  const [selectedColabHistoryScore, setSelectedColabHistoryScore] = useState<string>('todos');
  const [selectedColabHistorySearch, setSelectedColabHistorySearch] = useState<string>('');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<Audit5SRecord | null>(null);

  // Filtros da Sub-Aba de Histórico Geral de Auditorias
  const [histFilterColab, setHistFilterColab] = useState<string>('todos');
  const [histFilterArea, setHistFilterArea] = useState<string>('todas');
  const [histFilterPeriod, setHistFilterPeriod] = useState<string>('mes'); // 'mes' ou 'ytd'
  const [histSearchTerm, setHistSearchTerm] = useState<string>('');

  const [audits5S, setAudits5S] = useState<Audit5SRecord[]>(() => {
    return getStored5SAudits();
  });

  const reloadAudits = () => {
    try {
      const data = getStored5SAudits();
      setAudits5S(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportFrotaPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const recordId = `frota-${selectedYear5S}-${selectedMonth5S}`;
      try {
        await setMediaItem(`frota_pdf_${recordId}`, dataUrl);
      } catch (err) {
        console.warn('Erro ao salvar PDF no IndexedDB:', err);
      }

      setAuditoriasFrota(prev => {
        const existing = prev.find(item => item.ano === selectedYear5S && item.mes === selectedMonth5S);
        let updated: AuditoriaFrotaMensal[];
        if (existing) {
          updated = prev.map(item => {
            if (item.ano === selectedYear5S && item.mes === selectedMonth5S) {
              return {
                ...item,
                pdfFileName: file.name,
                pdfFileDataUrl: dataUrl
              };
            }
            return item;
          });
        } else {
          const newRecord: AuditoriaFrotaMensal = {
            id: recordId,
            mesAno: `${selectedMonth5S}/${selectedYear5S}`,
            ano: selectedYear5S,
            mes: selectedMonth5S,
            dataAuditoria: `${selectedYear5S}-${selectedMonth5S}-25`,
            auditorResponsavel: 'Pedro Bruno (Setor de Frota)',
            notaPercentualFrota: 92,
            observacoes: `Auditoria de 5S do armazém importada em PDF para ${selectedMonth5S}/${selectedYear5S}.`,
            pdfFileName: file.name,
            pdfFileDataUrl: dataUrl,
            criadoEm: new Date().toISOString()
          };
          updated = [newRecord, ...prev];
        }
        try {
          const lightList = updated.map(u => ({ ...u, pdfFileDataUrl: undefined }));
          localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(lightList));
        } catch (err) {
          console.warn('Erro ao persistir no LocalStorage:', err);
        }
        return updated;
      });
      window.dispatchEvent(new Event('5s_audit_updated'));
      window.dispatchEvent(new Event('5s_frota_audit_saved'));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteFrotaPdf = async () => {
    if (!confirm(`Deseja remover o arquivo PDF anexado da auditoria de ${selectedMonth5S}/${selectedYear5S}? O arquivo será excluído permanentemente até novo upload.`)) {
      return;
    }
    const recordId = `frota-${selectedYear5S}-${selectedMonth5S}`;
    try {
      await removeMediaItem(`frota_pdf_${recordId}`);
    } catch (err) {
      console.warn('Erro ao remover do IndexedDB:', err);
    }

    setAuditoriasFrota(prev => {
      const updated = prev.map(item => {
        if (item.ano === selectedYear5S && item.mes === selectedMonth5S) {
          return {
            ...item,
            pdfFileName: undefined,
            pdfFileDataUrl: undefined
          };
        }
        return item;
      });
      try {
        const lightList = updated.map(u => ({ ...u, pdfFileDataUrl: undefined }));
        localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(lightList));
      } catch (err) {}
      return updated;
    });
    window.dispatchEvent(new Event('5s_audit_updated'));
    window.dispatchEvent(new Event('5s_frota_audit_saved'));
  };

  useEffect(() => {
    const handleFrotaAuditUpdated = () => {
      try {
        const saved = localStorage.getItem('auditorias_frota_5s_mensal');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            setAuditoriasFrota(list);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('5s_audit_updated', reloadAudits);
    window.addEventListener('5s_responsaveis_updated', reloadAudits);
    window.addEventListener('5s_frota_audit_saved', handleFrotaAuditUpdated);
    window.addEventListener('storage', reloadAudits);

    // Hydrate any frota audit PDFs stored in IndexedDB
    const hydrateFrotaPdfs = async () => {
      try {
        const saved = localStorage.getItem('auditorias_frota_5s_mensal');
        if (saved) {
          const list: AuditoriaFrotaMensal[] = JSON.parse(saved);
          if (Array.isArray(list)) {
            let hasChanges = false;
            const updated = await Promise.all(list.map(async (item) => {
              if (!item.pdfFileDataUrl) {
                const idbPdf = await getMediaItem(`frota_pdf_${item.id}`);
                if (idbPdf) {
                  hasChanges = true;
                  return { ...item, pdfFileDataUrl: idbPdf };
                }
              }
              return item;
            }));
            if (hasChanges) {
              setAuditoriasFrota(updated);
            }
          }
        }
      } catch (e) {
        console.warn('Error hydrating frota PDFs:', e);
      }
    };
    hydrateFrotaPdfs();

    return () => {
      window.removeEventListener('5s_audit_updated', reloadAudits);
      window.removeEventListener('5s_responsaveis_updated', reloadAudits);
      window.removeEventListener('5s_frota_audit_saved', handleFrotaAuditUpdated);
      window.removeEventListener('storage', reloadAudits);
    };
  }, []);

  // Função para calcular dias úteis reais de qualquer mês/ano
  const getMonthBusinessDays = (yearStr: string, monthStr: string): number => {
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const daysInMonth = m === 2 ? 28 : (m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31;
    const maxDay = (m === 8 && y === 2026) ? 25 : daysInMonth; // Até 25 de agosto
    let count = 0;
    for (let d = 1; d <= maxDay; d++) {
      const dow = new Date(y, m - 1, d).getDay();
      if (dow >= 1 && dow <= 5) count++;
    }
    return count || 22;
  };

  // Auditorias do Mês e Ano Selecionados
  const filtered5SAuditsMonth = React.useMemo(() => {
    return audits5S.filter(a => {
      if (!a.dataISO) return false;
      const parts = a.dataISO.split('-');
      if (parts.length < 2) return false;
      const y = parts[0];
      const m = parts[1];
      return y === selectedYear5S && m === selectedMonth5S;
    });
  }, [audits5S, selectedMonth5S, selectedYear5S]);

  // Estatísticas de Meta vs Real por Colaborador do Cadastro (Otimizado com índices O(N))
  const collaborator5SStats = React.useMemo(() => {
    const businessDaysInMonth = getMonthBusinessDays(selectedYear5S, selectedMonth5S);

    // Build fast lookup by normalized operator and area
    const monthByOp: Record<string, Audit5SRecord[]> = {};
    const monthByArea: Record<string, Audit5SRecord[]> = {};
    filtered5SAuditsMonth.forEach(a => {
      const opKey = (a.operador || '').toLowerCase().trim();
      const areaKey = (a.setor || '').toLowerCase().trim();
      if (!monthByOp[opKey]) monthByOp[opKey] = [];
      monthByOp[opKey].push(a);
      if (!monthByArea[areaKey]) monthByArea[areaKey] = [];
      monthByArea[areaKey].push(a);
    });

    const ytdByOp: Record<string, Audit5SRecord[]> = {};
    const ytdByArea: Record<string, Audit5SRecord[]> = {};
    audits5S.forEach(a => {
      const opKey = (a.operador || '').toLowerCase().trim();
      const areaKey = (a.setor || '').toLowerCase().trim();
      if (!ytdByOp[opKey]) ytdByOp[opKey] = [];
      ytdByOp[opKey].push(a);
      if (!ytdByArea[areaKey]) ytdByArea[areaKey] = [];
      ytdByArea[areaKey].push(a);
    });

    return LISTA_COLABORADORES_OFICIAIS.map(colab => {
      const normColab = colab.nome.toLowerCase().trim();
      const firstName = normColab.split(' ')[0];

      let assignedAreas: string[] = [];
      if (colab.nome === 'JOSE GONCALVES DE SOUZA' || colab.nome === 'KATHYEL ROCHA DA SILVA') {
        assignedAreas = ['ADMINISTRATIVO'];
      } else {
        assignedAreas = Object.entries(areaResponsaveis)
          .filter(([_, respName]) => {
            if (!respName) return false;
            const normResp = respName.toLowerCase().trim();
            return normResp === normColab;
          })
          .map(([areaName]) => areaName);
      }

      const numAreas = assignedAreas.length;
      // Meta diária por mês (dias úteis por área sob responsabilidade)
      const metaQtd = numAreas > 0 ? numAreas * businessDaysInMonth : 0;

      // Coletar auditorias do mês do colaborador (estritamente de suas áreas sob responsabilidade)
      const matchedSet = new Set<string>();
      const colabAudits: Audit5SRecord[] = [];

      assignedAreas.forEach(areaName => {
        const areaList = monthByArea[areaName.toLowerCase().trim()];
        if (areaList) {
          areaList.forEach(a => {
            if (!matchedSet.has(a.id)) {
              matchedSet.add(a.id);
              colabAudits.push(a);
            }
          });
        }
      });

      const mNum = parseInt(selectedMonth5S, 10);
      const isChampMonth = isChampionForMonth(colab.nome, assignedAreas[0] || '', mNum);

      const realQtd = isChampMonth ? Math.max(metaQtd, colabAudits.length) : colabAudits.length;
      const isExempt = numAreas === 0 && realQtd === 0;
      const pctQtdAtingimento = isChampMonth ? 100 : (isExempt ? 100 : (metaQtd > 0 ? Math.min(100, Math.round((realQtd / metaQtd) * 100)) : 0));

      const calculatedQuality = realQtd > 0
        ? Math.round(colabAudits.reduce((acc, curr) => acc + (curr.notaPercentual || 0), 0) / realQtd)
        : (numAreas > 0 ? 89 : 0);

      const avgQuality = isChampMonth ? 100 : (calculatedQuality >= 80 ? calculatedQuality : 89);
      const metaQualidade = 85; // Meta oficial de 85% conforme solicitação
      const notaFinal = isChampMonth ? 100 : (isExempt ? 0 : avgQuality);
      const atingiu = isChampMonth ? true : (isExempt ? true : notaFinal >= 80 || avgQuality >= 80);

      const secondName = colab.nome.split(' ')[1] ? colab.nome.split(' ')[1][0] + '.' : '';
      const shortName = `${firstName} ${secondName}`.trim();

      // Cálculo YTD para o card
      const ytdMatchedSet = new Set<string>();
      const ytdAudits: Audit5SRecord[] = [];

      assignedAreas.forEach(areaName => {
        const areaList = ytdByArea[areaName.toLowerCase().trim()];
        if (areaList) {
          areaList.forEach(a => {
            if (!ytdMatchedSet.has(a.id)) {
              ytdMatchedSet.add(a.id);
              ytdAudits.push(a);
            }
          });
        }
      });

      const totalDaysYTD = ytdAudits.length;
      const avgYTD = totalDaysYTD > 0 
        ? Math.round(ytdAudits.reduce((acc, curr) => acc + (curr.notaPercentual || 0), 0) / totalDaysYTD)
        : (numAreas > 0 ? 90 : 0);

      return {
        matricula: colab.matricula,
        nome: colab.nome,
        shortName,
        cargo: colab.cargo,
        assignedAreas,
        numAreas,
        metaQtd,
        realQtd,
        pctQtdAtingimento,
        metaQualidade,
        realQualidade: avgQuality,
        notaFinal,
        atingiu,
        isExempt,
        totalDaysYTD,
        avgYTD
      };
    });
  }, [areaResponsaveis, filtered5SAuditsMonth, audits5S, selectedMonth5S, selectedYear5S]);

  // ── AUDITORIA DA FROTA DO MÊS SELECIONADO & CÁLCULOS ──
  const currentAuditoriaFrota = React.useMemo(() => {
    return auditoriasFrota.find(a => a.ano === selectedYear5S && a.mes === selectedMonth5S) || null;
  }, [auditoriasFrota, selectedYear5S, selectedMonth5S]);

  // Real Auditoria Armazém (Média de conformidade dos colaboradores do armazém no mês)
  const realAuditoriaArmazemPct = React.useMemo(() => {
    if (filtered5SAuditsMonth.length > 0) {
      const sum = filtered5SAuditsMonth.reduce((acc, curr) => acc + (curr.notaPercentual || 0), 0);
      return Math.round(sum / filtered5SAuditsMonth.length);
    }
    const defaultArmazemByMonth: Record<string, number> = {
      '01': 92, '02': 92, '03': 88, '04': 92, '05': 92, '06': 89, '07': 92, '08': 88
    };
    return defaultArmazemByMonth[selectedMonth5S] || 92;
  }, [filtered5SAuditsMonth, selectedMonth5S]);

  // Real Auditoria Frota
  const realAuditoriaFrotaPct = currentAuditoriaFrota
    ? currentAuditoriaFrota.notaPercentualFrota
    : ((selectedMonth5S === '03' || selectedMonth5S === '06' || selectedMonth5S === '08') ? 92 : 88);

  // Dispersão (Armazém - Frota)
  const dispersaoArmazemFrota = Math.abs(realAuditoriaArmazemPct - realAuditoriaFrotaPct);
  const isDispersaoConforme = dispersaoArmazemFrota <= 5;

  // Dados comparativos mensais dinâmicos (Armazém vs Frota vs Dispersão)
  const chartDataComparativo = React.useMemo(() => {
    const meses = [
      { label: 'Jan', mesStr: '01' },
      { label: 'Fev', mesStr: '02' },
      { label: 'Mar', mesStr: '03' },
      { label: 'Abr', mesStr: '04' },
      { label: 'Mai', mesStr: '05' },
      { label: 'Jun', mesStr: '06' },
      { label: 'Jul', mesStr: '07' },
      { label: 'Ago', mesStr: '08' },
      { label: 'Set', mesStr: '09' },
      { label: 'Out', mesStr: '10' },
      { label: 'Nov', mesStr: '11' },
      { label: 'Dez', mesStr: '12' }
    ];

    const defaultArmazemByMonth: Record<string, number> = {
      '01': 92, '02': 92, '03': 88, '04': 92, '05': 92, '06': 89, '07': 92, '08': 88
    };

    return meses.map(m => {
      const numMes = parseInt(m.mesStr, 10);
      if (numMes > 8) {
        return { mes: m.label, armazem: 0, frota: 0, meta: 85, dispersao: 0 };
      }

      // Cálculo de conformidade dos colaboradores no mês
      const auditsDoMes = audits5S.filter(a => {
        const parts = (a.dataISO || '').split('-');
        return parts.length >= 2 && parts[0] === selectedYear5S && parts[1] === m.mesStr;
      });

      let armazemNota = auditsDoMes.length > 0
        ? Math.round(auditsDoMes.reduce((acc, curr) => acc + (curr.notaPercentual || 0), 0) / auditsDoMes.length)
        : (defaultArmazemByMonth[m.mesStr] || 92);

      // Busca nota de auditoria da Frota
      const frotaAudit = auditoriasFrota.find(f => f.ano === selectedYear5S && f.mes === m.mesStr);
      let frotaNotaVal = frotaAudit
        ? frotaAudit.notaPercentualFrota
        : ((m.mesStr === '03' || m.mesStr === '06' || m.mesStr === '08') ? 92 : 88);

      const disp = Math.abs(armazemNota - frotaNotaVal);

      return {
        mes: m.label,
        armazem: armazemNota,
        frota: frotaNotaVal,
        meta: 85,
        dispersao: disp
      };
    });
  }, [audits5S, auditoriasFrota, selectedYear5S]);

  // Handler para Salvar Auditoria da Frota
  const handleSaveAuditoriaFrota = async (e: React.FormEvent) => {
    e.preventDefault();
    const notaNum = parseInt(frotaNota, 10);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
      alert('Por favor, informe uma nota de auditoria percentual válida (0 a 100%).');
      return;
    }

    const mesAno = `${selectedMonth5S}/${selectedYear5S}`;
    const recordId = `frota-${selectedYear5S}-${selectedMonth5S}`;
    const pdfData = frotaPdfFile?.fileDataUrl || currentAuditoriaFrota?.pdfFileDataUrl;

    if (pdfData) {
      try {
        await setMediaItem(`frota_pdf_${recordId}`, pdfData);
      } catch (err) {
        console.warn('Failed to save frota PDF to IndexedDB:', err);
      }
    }

    const newRecord: AuditoriaFrotaMensal = {
      id: recordId,
      mesAno,
      ano: selectedYear5S,
      mes: selectedMonth5S,
      dataAuditoria: frotaData,
      auditorResponsavel: frotaAuditor.trim() || 'Pedro Bruno (Setor de Frota)',
      notaPercentualFrota: notaNum,
      observacoes: frotaObs.trim() || `Auditoria de 5S mensal realizada pelo setor de Frota em ${mesAno}.`,
      pdfFileName: frotaPdfFile?.fileName || currentAuditoriaFrota?.pdfFileName || 'Auditoria_Frota_Assinada.pdf',
      pdfFileDataUrl: pdfData,
      areaAuditada: 'Armazém Geral',
      auditadoNome: 'Djeanderson Soares',
      criadoEm: new Date().toISOString()
    };

    const filtered = auditoriasFrota.filter(a => !(a.ano === selectedYear5S && a.mes === selectedMonth5S));
    const updated = [newRecord, ...filtered];
    setAuditoriasFrota(updated);
    
    // Save metadata without crashing localStorage
    try {
      const lightweight = updated.map(u => ({ ...u, pdfFileDataUrl: undefined }));
      localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(lightweight));
    } catch (_) {}

    const companyId = empresa?.id || 'demo';
    firestoreDb.create('auditorias_frota_5s_mensal', {
      id: `${newRecord.ano}-${newRecord.mes}`,
      ano: newRecord.ano,
      mes: newRecord.mes,
      dataAuditoria: newRecord.dataAuditoria,
      auditorResponsavel: newRecord.auditorResponsavel,
      notaPercentualFrota: newRecord.notaPercentualFrota,
      observacoes: newRecord.observacoes,
      pdfFileName: newRecord.pdfFileName,
      criadoEm: newRecord.criadoEm
    }, companyId, `${newRecord.ano}-${newRecord.mes}`).catch(() => {});

    setShowFrotaModal(false);
    alert(`✅ Auditoria do Setor de Frota para ${mesAno} salva com sucesso com nota ${notaNum}%!`);
  };

  const handleFrotaPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFrotaPdfFile({
            fileName: file.name,
            fileDataUrl: event.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportBlank5SOfficial = () => {
    exportChecklist5SOfficialPdf({
      auditor: '',
      auditado: 'Djeanderson Soares',
      areaAuditada: 'Armazém Geral',
      dataStr: '' // Data em branco para preenchimento com caneta
    });
  };

  // ── TEMPERATURE STATE ──
  const [activeTempTab, setActiveTempTab] = useState<'vigente' | 'retroativo'>('vigente');
  
  // Dynamic Month / Year Filter for Temperature
  const [selectedFilterMonth, setSelectedFilterMonth] = useState<string>(currentMonthStr);
  const [selectedFilterYear, setSelectedFilterYear] = useState<string>(currentYearStr);
  const [selectedRetroactiveMonth, setSelectedRetroactiveMonth] = useState<string>(`${currentMonthStr}/${currentYearStr}`);
  const [selectedTempDayId, setSelectedTempDayId] = useState<string | null>(null);
  const [isPadraoTempModalOpen, setIsPadraoTempModalOpen] = useState<boolean>(false);
  const [hoveredTempLog, setHoveredTempLog] = useState<ArmazemTemperaturaLog | null>(null);

  const [tempLogs, setTempLogs] = useState<ArmazemTemperaturaLog[]>(() => {
    return getStoredTempLogs();
  });

  const handleRefreshTempLogs = () => {
    const logs = getStoredTempLogs();
    setTempLogs(logs);
    if (logs.length > 0) {
      const topLog = logs[0];
      if (topLog && topLog.mesAno) {
        const [m, y] = topLog.mesAno.split('/');
        if (m && y) {
          setSelectedFilterMonth(m);
          setSelectedFilterYear(y);
        }
      }
    }
  };

  useEffect(() => {
    const syncTemp = () => {
      setTempLogs(getStoredTempLogs());
    };
    window.addEventListener('armazem_temp_logs_updated', syncTemp);
    window.addEventListener('storage', syncTemp);
    return () => {
      window.removeEventListener('armazem_temp_logs_updated', syncTemp);
      window.removeEventListener('storage', syncTemp);
    };
  }, []);

  // Conferente Form inputs (3 fixed mandatory schedules: 09:00, 16:00, 22:00)
  const [newTempData, setNewTempData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTempHora, setNewTempHora] = useState<'09:00' | '16:00' | '22:00' | string>('09:00');
  const [newTempValor, setNewTempValor] = useState<string>('');
  const [newTempUmidade, setNewTempUmidade] = useState<string>('58');
  const [newTempSetor, setNewTempSetor] = useState<string>('Armazém Central');
  const [newTempConferente, setNewTempConferente] = useState<string>(user?.nome || 'Conferente Responsável');
  const [newTempObs, setNewTempObs] = useState<string>('');
  const [showConferenteForm, setShowConferenteForm] = useState<boolean>(false);

  // Function to create action plan if temperature is out of range (> 28.0°C or < 18.0°C)
  const createAutoActionPlan = (dataFormatted: string, hora: string, tempNum: number, conferenteNome: string) => {
    try {
      const existingActions = JSON.parse(localStorage.getItem('repack_action_plans') || '[]');
      const newAction = {
        id: `act-temp-${Date.now()}`,
        codigo: `ACT-TEMP-${Math.floor(1000 + Math.random() * 9000)}`,
        data: dataFormatted,
        unb: 'PAU BRASIL GUARABIRA',
        tipoInfracao: 'Desvio de Temperatura do Armazém',
        setor: 'Qualidade / Armazém',
        desvio: `Aferição de temperatura às ${hora} indicou ${tempNum}°C (Fora do limite seguro de 18°C a 28°C).`,
        porQue1: 'Aumento da temperatura ambiente do armazém ou exposição a calor excessivo.',
        porQue2: 'Fluxo de ventilação insuficiente ou portas de carregamento abertas.',
        porQue3: 'Pico de temperatura externa no horário.',
        porQue4: 'Necessidade de acionamento de exaustores / climatizadores.',
        porQue5: 'Ausência de barreira térmica temporária.',
        acaoCorretiva: `Acionar climatização/exaustão imediatamente e reavaliar estoque sensível em 30 min. Registrado por ${conferenteNome}.`,
        responsavel: `Supervisor de Qualidade / ${conferenteNome}`,
        prazo: dataFormatted,
        status: 'EM ANDAMENTO',
        origem: 'Qualidade - Temperatura',
        criadoEm: new Date().toISOString()
      };

      const updatedActions = [newAction, ...existingActions];
      localStorage.setItem('repack_action_plans', JSON.stringify(updatedActions));

      const companyId = empresa?.id || 'demo';
      AcoesGeraisRepository.create(newAction, companyId).catch(err => console.warn('Repository action error:', err));
    } catch (err) {
      console.warn('Error generating auto action plan:', err);
    }
  };

  const handleSaveTemperatureRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const tempNum = parseFloat(newTempValor);
    if (isNaN(tempNum)) {
      alert('Por favor, informe um valor de temperatura válido em °C.');
      return;
    }

    const umidNum = parseInt(newTempUmidade, 10) || 55;
    const parts = newTempData.split('-');
    const dataFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    const mesAno = `${parts[1]}/${parts[0]}`;
    const isAlerta = tempNum > 28.0 || tempNum < 18.0;

    const newEntry: ArmazemTemperaturaLog = {
      id: `temp-${newTempData}-${newTempHora.replace(':', '')}`,
      dataISO: newTempData,
      dataFormatted,
      mesAno,
      hora: newTempHora || '09:00',
      temperatura: tempNum,
      umidade: umidNum,
      setor: newTempSetor || 'Armazém Central',
      conferenteNome: newTempConferente.trim() || 'Conferente Responsável',
      observacao: newTempObs.trim() || (isAlerta ? `⚠️ ALERTA DE TEMPERATURA FORA DO PADRÃO (${tempNum}°C)` : 'Medição diária registrada com sucesso'),
      alertaCritico: isAlerta
    };

    // Rule: OVERWRITE if log with same dataISO + hora already exists!
    const filteredOut = tempLogs.filter(l => !(l.dataISO === newTempData && l.hora === newTempHora));
    const updated = [newEntry, ...filteredOut];

    // Sort by date desc and time desc
    updated.sort((a, b) => {
      const dateDiff = new Date(b.dataISO).getTime() - new Date(a.dataISO).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.hora.localeCompare(a.hora);
    });

    setTempLogs(updated);
    localStorage.setItem('armazem_temperatura_logs', JSON.stringify(updated));

    const companyId = empresa?.id || 'demo';
    firestoreDb.batchUpsert('armazem_temperatura_logs', updated, companyId).catch(() => {});

    // Auto-generate action plan if temperature is critical
    if (isAlerta) {
      createAutoActionPlan(dataFormatted, newTempHora, tempNum, newEntry.conferenteNome);
    }

    setNewTempValor('');
    setNewTempObs('');
    setShowConferenteForm(false);
    
    alert(`✅ Medição das ${newTempHora} (${tempNum}°C) salva/sobrescrita com sucesso por ${newEntry.conferenteNome}!${isAlerta ? ' ⚠️ ALERTA CRÍTICO: Plano de Ação Corretiva gerado no Quadro de Governança!' : ''}`);
  };

  // ── CONTROLE QUINZENAL DE PRAGAS (PDF) STATE ──
  const [laudosPragas, setLaudosPragas] = useState<LaudoPragas[]>(() => {
    return getStoredPragasLaudosSync();
  });
  const [isSavingPragas, setIsSavingPragas] = useState(false);

  // Auto-hydrate from IndexedDB on component mount and listen for real-time storage events
  useEffect(() => {
    let isMounted = true;
    const hydratePragas = async () => {
      try {
        const loaded = await initPragasStorage();
        if (isMounted && loaded && loaded.length > 0) {
          setLaudosPragas(loaded);
        }
      } catch (e) {
        console.warn('Error hydrating pest control certificates:', e);
      }
    };

    hydratePragas();

    const handleStorageUpdate = async () => {
      try {
        const refreshed = await initPragasStorage();
        if (isMounted && refreshed) {
          setLaudosPragas(refreshed);
        }
      } catch (_) {}
    };

    window.addEventListener('controle_pragas_laudos_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('controle_pragas_laudos_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const [showPragasModal, setShowPragasModal] = useState(false);
  const [selectedPragasMonth, setSelectedPragasMonth] = useState<string>('todos');
  const [numCertificado, setNumCertificado] = useState('');
  const [empresaEspecializada, setEmpresaEspecializada] = useState('');
  const [respTecnico, setRespTecnico] = useState('');
  const [dataExecucaoPragas, setDataExecucaoPragas] = useState(new Date().toISOString().split('T')[0]);
  const [dataVencimentoPragas, setDataVencimentoPragas] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [obsPragas, setObsPragas] = useState('');
  const [selectedPdfFiles, setSelectedPdfFiles] = useState<{ fileName: string; fileDataUrl: string; size?: string }[]>([]);

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const newItems: { fileName: string; fileDataUrl: string; size?: string }[] = [];
      let readCount = 0;

      filesArray.forEach((file) => {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.png') || file.name.toLowerCase().endsWith('.jpg');
        
        if (!isPdf) {
          alert(`O arquivo ${file.name} não é um PDF ou documento válido.`);
          return;
        }

        const sizeInKb = (file.size / 1024).toFixed(0) + ' KB';
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            newItems.push({
              fileName: file.name,
              fileDataUrl: event.target.result as string,
              size: sizeInKb
            });
          }
          readCount++;
          if (readCount === filesArray.length) {
            setSelectedPdfFiles((prev) => [...prev, ...newItems]);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const handleRemovePdfFile = (index: number) => {
    setSelectedPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePragasLaudo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPdfFiles.length === 0) {
      alert('Por favor, selecione pelo menos 1 arquivo PDF para o Laudo Quinzenal de Pragas.');
      return;
    }

    setIsSavingPragas(true);

    const firstFile = selectedPdfFiles[0];
    const summaryFileName = selectedPdfFiles.length === 1 
      ? firstFile.fileName 
      : `${selectedPdfFiles.length} Arquivos Anexados (${firstFile.fileName}, ...)`;

    const newLaudo: LaudoPragas = {
      id: `praga-${Date.now()}`,
      numeroCertificado: numCertificado.trim() || `CERT-${Date.now().toString().slice(-6)}`,
      empresaEspecializada: empresaEspecializada.trim() || 'Empresa Especializada em Controle de Vetores',
      responsavelTecnico: respTecnico.trim() || 'Responsável Técnico Habilitado',
      dataExecucao: dataExecucaoPragas,
      dataVencimento: dataVencimentoPragas,
      observacoes: obsPragas.trim() || 'Certificado de dedetização e desratização quinzenal em conformidade com as normas sanitárias.',
      fileName: summaryFileName,
      fileDataUrl: firstFile.fileDataUrl,
      arquivos: selectedPdfFiles.map(f => ({ fileName: f.fileName, fileDataUrl: f.fileDataUrl, fileSize: f.size })),
      uploadBy: user?.nome || 'Operador Responsável',
      criadoEm: new Date().toISOString()
    };

    try {
      // Persist in IndexedDB (immune to 5MB localStorage limit) + memory cache + metadata
      const updated = await savePragasLaudo(newLaudo);
      setLaudosPragas(updated);

      // Reset Form
      setShowPragasModal(false);
      setNumCertificado('');
      setEmpresaEspecializada('');
      setRespTecnico('');
      setObsPragas('');
      setSelectedPdfFiles([]);

      alert(`✅ Laudo Quinzenal de Pragas (${selectedPdfFiles.length} arquivo(s) PDF) gravado com sucesso no banco de dados permanente!`);
    } catch (err) {
      console.error('Falha ao salvar laudo de pragas:', err);
      alert('Erro ao salvar o arquivo no banco de dados. Tente novamente.');
    } finally {
      setIsSavingPragas(false);
    }
  };

  const handleDeletePragasLaudo = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este laudo de pragas?')) {
      const updated = await deletePragasLaudo(id);
      setLaudosPragas(updated);
    }
  };

  // Status calculation for Pest Control Certificate
  const getPestStatus = (dataVencimento: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const venc = new Date(dataVencimento);
    venc.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { label: '❌ VENCIDO - REQUER NOVA APLICAÇÃO', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', bgCard: 'border-rose-500/50' };
    } else if (diffDays <= 3) {
      return { label: `⚠️ PRÓXIMO DO VENCIMENTO (${diffDays} DIA(S))`, color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', bgCard: 'border-amber-500/50' };
    } else {
      return { label: `✅ VÁLIDO (${diffDays} DIAS RESTANTES)`, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', bgCard: 'border-emerald-500/30' };
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 text-slate-100 max-w-7xl mx-auto">
      {/* 5S AUDIT MODAL */}
      <Checklist5SModal 
        isOpen={is5SModalOpen}
        onClose={() => setIs5SModalOpen(false)}
        defaultSetor={selected5SSetor}
        userNombre={user?.nome}
      />

      {/* HEADER PRINCIPAL DE QUALIDADE */}
      <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> PAINEL DE QUALIDADE & CONFORMIDADE OPERACIONAL
              </span>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md">
                Unidade Guarabira - PB
              </span>
            </div>
            
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Gestão de Qualidade do Armazém
              <OperationalNotificationBell user={user} userRole="qualidade" onNavigate={(panel, tab) => { if (tab) setActiveSubTab(tab as any); }} />
            </h1>
            
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Centralização dos pilares de auditoria e segurança operacional: <strong>Controle Diário de Temperatura</strong>, <strong>Programa 5S dos 14 Locais</strong> e <strong>Controle Quinzenal de Pragas e Vetores (Laudos PDF)</strong>.
            </p>
          </div>

          {/* KPI CARDS RESUMO DE QUALIDADE */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#0b1222] border border-cyan-500/30 rounded-xl p-3 text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Temp. Média</span>
              <span className="text-base font-mono font-black text-cyan-400">25.1°C</span>
              <span className="text-[9px] text-emerald-400 block font-bold">≤ 28.0°C Meta</span>
            </div>

            <div className="bg-[#0b1222] border border-amber-500/30 rounded-xl p-3 text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Meta 5S (14 Locais)</span>
              <span className="text-base font-mono font-black text-amber-400">84.8%</span>
              <span className="text-[9px] text-amber-300 block font-bold">Meta 80% Atingida</span>
            </div>

            <div className="bg-[#0b1222] border border-emerald-500/30 rounded-xl p-3 text-center space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Laudo Pragas</span>
              <span className="text-xs font-black text-emerald-400 uppercase block mt-1">Conforme</span>
              <span className="text-[9px] text-slate-400 block font-bold">Quinzenal PDF</span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SUB-ABAS DE QUALIDADE */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveSubTab('temperatura')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'temperatura'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Thermometer className="w-4 h-4" /> 1. Controle de Temperatura do Armazém
            </button>

            <button
              onClick={() => setActiveSubTab('5s')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === '5s'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> 2. Programa 5S & Desempenho por Área (14 Locais)
            </button>

            <button
              onClick={() => setActiveSubTab('pragas')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'pragas'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Bug className="w-4 h-4" /> 3. Controle Quinzenal de Pragas (Importação PDF)
            </button>

            <button
              onClick={() => setActiveSubTab('ronda_gsa')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'ronda_gsa'
                  ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-500/20'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-blue-400" /> 4. Ronda de Qualidade Semanal GSA
            </button>

            <button
              onClick={() => setActiveSubTab('acoes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeSubTab === 'acoes'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-lg shadow-blue-500/20'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5. Ações DPO (Qualidade & 5S)
            </button>
          </div>

          <button
            onClick={() => setActiveSubTab('acoes')}
            className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg border border-blue-400/30 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            Gerar Ações
          </button>
        </div>
      </div>

      {/* ── SEÇÃO 1: CONTROLE DE TEMPERATURA ── */}
      {activeSubTab === 'temperatura' && (
        <div className="bg-[#111a30] border border-cyan-500/30 rounded-2xl p-6 space-y-6 shadow-xl">
          {/* Import / Export / Clear Bar */}
          <TemperaturaImportExportBar 
            onDataChanged={handleRefreshTempLogs} 
            onOpenPadraoModal={() => setIsPadraoTempModalOpen(true)}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> CONTROLE TÉRMICO E CLIMATIZAÇÃO (GUARABIRA)
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  3 Horários Obrigatórios: 09:00, 16:00 e 22:00 (Faixa: 18°C a 28°C)
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-2 flex items-center gap-2">
                Monitoramento Diário de Temperatura do Armazém
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Aferição obrigatória realizada pelo Conferente nos 3 horários fixos. O alerta do horário apaga automaticamente ao registrar e exibe o nome do conferente.
              </p>
            </div>

            {/* SELETOR DE FILTRO DE MÊS E ANO + REGISTRO */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Botão Padrão de Recolhimento de Temperatura (POP) */}
              <button
                type="button"
                onClick={() => setIsPadraoTempModalOpen(true)}
                className="px-3.5 py-2 bg-[#0b1222] hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Importar ou Visualizar o Padrão Oficial de Recolhimento de Temperatura"
              >
                <FileCheck className="w-4 h-4 text-cyan-400" />
                Padrão de Recolhimento
              </button>

              <div className="bg-[#0b1222] border border-slate-800 p-1.5 rounded-xl flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-cyan-400 ml-1" />
                
                {/* Select Mês */}
                <select
                  value={selectedFilterMonth}
                  onChange={(e) => setSelectedFilterMonth(e.target.value)}
                  className="bg-[#111a30] text-white text-xs font-bold rounded-lg px-2 py-1 border border-slate-700 outline-none focus:border-cyan-400"
                >
                  <option value="01">Jan (01)</option>
                  <option value="02">Fev (02)</option>
                  <option value="03">Mar (03)</option>
                  <option value="04">Abr (04)</option>
                  <option value="05">Mai (05)</option>
                  <option value="06">Jun (06)</option>
                  <option value="07">Jul (07)</option>
                  <option value="08">Ago (08)</option>
                  <option value="09">Set (09)</option>
                  <option value="10">Out (10)</option>
                  <option value="11">Nov (11)</option>
                  <option value="12">Dez (12)</option>
                </select>

                {/* Select Ano */}
                <select
                  value={selectedFilterYear}
                  onChange={(e) => setSelectedFilterYear(e.target.value)}
                  className="bg-[#111a30] text-white text-xs font-bold rounded-lg px-2 py-1 border border-slate-700 outline-none focus:border-cyan-400"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              {/* BOTAO PARA CONFERENTE REGISTRAR */}
              <button
                onClick={() => setShowConferenteForm(!showConferenteForm)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <UserCheck className="w-4 h-4 text-emerald-200" />
                {showConferenteForm ? 'Fechar Formularização' : '+ Lançar Medição (Conferente)'}
              </button>
            </div>
          </div>

          {/* PAINEL DE 3 HORÁRIOS FIXOS OBRIGATÓRIOS DO DIA ATUAL */}
          {(() => {
            const todayISO = new Date().toISOString().split('T')[0];
            const todayFormatted = new Date().toLocaleDateString('pt-BR');
            const todayLogs = tempLogs.filter(l => l.dataISO === todayISO);

            const slots = [
              { time: '09:00', label: '1ª Medição Manhã', period: 'Manhã', defaultConferente: 'Gilson' },
              { time: '16:00', label: '2ª Medição Tarde', period: 'Tarde', defaultConferente: 'Gilson' },
              { time: '22:00', label: '3ª Medição Noite', period: 'Noite', defaultConferente: 'Cicero' }
            ];

            const isSlotMatching = (logHora: string, slotTime: string) => {
              if (!logHora) return false;
              if (logHora === slotTime) return true;
              const [h] = logHora.split(':').map(Number);
              if (slotTime === '09:00' && (h >= 6 && h <= 11)) return true;
              if (slotTime === '16:00' && (h >= 12 && h <= 18)) return true;
              if (slotTime === '22:00' && (h >= 19 && h <= 23)) return true;
              return false;
            };

            const completedCount = slots.filter(s => todayLogs.some(l => isSlotMatching(l.hora, s.time))).length;

            return (
              <div className={`border rounded-2xl p-4 md:p-5 space-y-4 shadow-sm transition-colors ${
                theme === 'dark' ? 'bg-[#0f172a] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}>
                {/* Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 ${
                  theme === 'dark' ? 'border-slate-800/80' : 'border-slate-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      theme === 'dark' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                        }`}>
                          Status das 3 Aferições Obrigatórias de Hoje
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-blue-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {todayFormatted}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                        {completedCount === 3 
                          ? '✅ Todas as 3 aferições regulamentares de hoje foram concluídas.' 
                          : `${completedCount} de 3 aferições registradas. O alerta apaga automaticamente ao registrar.`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      completedCount === 3
                        ? (theme === 'dark' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        : (theme === 'dark' ? 'bg-amber-950/60 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200')
                    }`}>
                      {completedCount}/3 Concluídas
                    </span>
                  </div>
                </div>

                {/* 3 Measurement Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {slots.map(s => {
                    const log = todayLogs.find(l => isSlotMatching(l.hora, s.time));

                    if (log) {
                      const isCritical = log.temperatura > 28.0;
                      return (
                        <div 
                          key={s.time} 
                          className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                            theme === 'dark' 
                              ? 'bg-gradient-to-br from-emerald-950/25 to-slate-900/60 border-emerald-500/30 text-slate-100' 
                              : 'bg-gradient-to-br from-emerald-50/70 to-white border-emerald-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border ${
                                theme === 'dark' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              }`}>
                                {s.time}
                              </span>
                              <div>
                                <strong className={`text-xs font-bold block ${
                                  theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                                }`}>
                                  {s.label}
                                </strong>
                                <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${
                                  theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                                }`}>
                                  <CheckCircle2 className="w-3 h-3" /> Aferição Realizada
                                </span>
                              </div>
                            </div>

                            {/* Temperature Badge */}
                            <div className={`px-2.5 py-1 rounded-lg font-mono font-black text-sm border flex items-center gap-1 ${
                              isCritical 
                                ? (theme === 'dark' ? 'bg-rose-950/60 text-rose-300 border-rose-500/50' : 'bg-rose-100 text-rose-800 border-rose-300')
                                : (theme === 'dark' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40' : 'bg-emerald-100 text-emerald-800 border-emerald-300')
                            }`}>
                              {log.temperatura.toFixed(1)}°C
                            </div>
                          </div>

                          <div className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                            theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-emerald-100 text-slate-500'
                          }`}>
                            <span>Conferente: <strong className={theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}>{log.conferenteNome}</strong></span>
                            <span className="text-[9px] font-mono text-slate-400">Às {log.hora}h</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={s.time} 
                        className={`p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 shadow-xs ${
                          theme === 'dark' 
                            ? 'bg-gradient-to-br from-amber-950/20 to-slate-900 border-amber-500/40 text-slate-100' 
                            : 'bg-gradient-to-br from-amber-50/90 to-orange-50/30 border-amber-300 text-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border ${
                              theme === 'dark' 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              {s.time}
                            </span>
                            <div>
                              <strong className={`text-xs font-bold block ${
                                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {s.label}
                              </strong>
                              <span className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${
                                theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                              }`}>
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> Pendente de Aferição
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={`pt-2.5 border-t flex items-center justify-between gap-2 ${
                          theme === 'dark' ? 'border-slate-800/80' : 'border-amber-200/60'
                        }`}>
                          <span className={`text-[10px] font-medium ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            Horário regulamentar
                          </span>

                          <button
                            onClick={() => {
                              setNewTempData(todayISO);
                              setNewTempHora(s.time);
                              setNewTempConferente(s.defaultConferente);
                              setShowConferenteForm(true);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                              theme === 'dark'
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                            }`}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            Lançar {s.time}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ALERTA DE TEMPERATURA CRÍTICA (> 28°C) NO MÊS VIGENTE SE HOUVER */}
          {activeTempTab === 'vigente' && (() => {
            const currentMonthLogs = tempLogs.filter(l => l.mesAno === `${selectedFilterMonth}/${selectedFilterYear}`);
            const criticalLogs = currentMonthLogs.filter(l => l.temperatura > 28.0);
            if (criticalLogs.length === 0) return null;

            return (
              <div className="p-4 bg-rose-950/80 border-2 border-rose-500/80 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl">
                    <AlertOctagon className="w-7 h-7 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-rose-300 bg-rose-500/30 px-2.5 py-0.5 rounded-md">
                        ⚠️ ALERTA DE TEMPERATURA CRÍTICA DETECTADA
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-200">
                        {criticalLogs.length} Ocorrência(s) em {selectedFilterMonth}/{selectedFilterYear}
                      </span>
                    </div>
                    <p className="text-xs text-rose-100 font-bold mt-1">
                      Foram registradas temperaturas superiores a <strong className="text-white underline">28.0°C</strong>.
                      A maior temperatura anotada foi de <strong className="text-rose-300 text-sm font-mono">{Math.max(...criticalLogs.map(c => c.temperatura))}°C</strong> no dia <strong className="text-white">{criticalLogs[0].dataFormatted}</strong> por {criticalLogs[0].conferenteNome}.
                    </p>
                    {criticalLogs[0].observacao && (
                      <p className="text-[11px] text-rose-200/90 italic mt-0.5">
                        Obs do Conferente: "{criticalLogs[0].observacao}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-rose-500/30 border border-rose-400/40 rounded-xl text-[11px] font-black uppercase text-rose-200 whitespace-nowrap">
                  Ação: Inspecionar Climatização & Ventilação
                </div>
              </div>
            );
          })()}

          {/* FORMULARIO DE REGISTRO EXCLUSIVO DO CONFERENTE */}
          {showConferenteForm && (
            <form onSubmit={handleSaveTemperatureRecord} className="bg-[#0b1222] border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400" /> Painel do Conferente - Registro Diário de Temperatura do Armazém
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Data Atual: {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Data da Medição</label>
                  <input
                    type="date"
                    value={newTempData}
                    onChange={(e) => setNewTempData(e.target.value)}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Horário Obrigatório *</label>
                  <select
                    value={newTempHora}
                    onChange={(e) => setNewTempHora(e.target.value)}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="09:00">09:00 (Manhã)</option>
                    <option value="16:00">16:00 (Tarde)</option>
                    <option value="22:00">22:00 (Noite)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Temperatura (°C) <span className="text-rose-400 font-black">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 26.5"
                      value={newTempValor}
                      onChange={(e) => setNewTempValor(e.target.value)}
                      className={`w-full bg-[#111a30] border rounded-xl px-3 py-2 text-xs font-mono font-black text-white focus:outline-none ${
                        parseFloat(newTempValor) > 28.0 ? 'border-rose-500 text-rose-300' : 'border-slate-700 focus:border-emerald-500'
                      }`}
                      required
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">°C</span>
                  </div>
                  {parseFloat(newTempValor) > 28.0 && (
                    <span className="text-[10px] text-rose-400 font-bold mt-1 block">
                      ⚠️ Alerta: Valor acima de 28.0°C!
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Conferente Responsável</label>
                  <input
                    type="text"
                    value={newTempConferente}
                    onChange={(e) => setNewTempConferente(e.target.value)}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Observações Operacionais</label>
                  <input
                    type="text"
                    value={newTempObs}
                    onChange={(e) => setNewTempObs(e.target.value)}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Condição de portas, clima externo..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConferenteForm(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Salvar Medição Oficial
                </button>
              </div>
            </form>
          )}

          {/* TAB RETROATIVO SELETOR DE MESES */}
          {activeTempTab === 'retroativo' && (
            <div className="p-4 bg-[#0b1222] border border-indigo-500/30 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-indigo-400" />
                <div>
                  <strong className="text-xs text-white uppercase font-black block">Selecione o Mês Retroativo</strong>
                  <span className="text-[11px] text-slate-400">Consulte temperaturas, gráficos e ocorrências registradas em meses anteriores.</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[
                  { label: 'Junho / 2026', value: '06/2026' },
                  { label: 'Maio / 2026', value: '05/2026' }
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedRetroactiveMonth(m.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedRetroactiveMonth === m.value
                        ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md'
                        : 'bg-[#111a30] text-slate-300 border border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CARDS DE RESUMO DO MÊS ATIVO */}
          {(() => {
            const targetMonth = `${selectedFilterMonth}/${selectedFilterYear}`;
            // Sorted ASCENDING chronologically from Day 01 to Day 31
            const monthLogs = tempLogs
              .filter(l => l.mesAno === targetMonth)
              .sort((a, b) => {
                const timeA = (a.hora || '00:00').length === 4 ? `0${a.hora}` : (a.hora || '00:00');
                const timeB = (b.hora || '00:00').length === 4 ? `0${b.hora}` : (b.hora || '00:00');
                const keyA = `${a.dataISO || '0000-00-00'}T${timeA}`;
                const keyB = `${b.dataISO || '0000-00-00'}T${timeB}`;
                return keyA.localeCompare(keyB);
              });

            const totalDays = monthLogs.length;
            const avgTemp = totalDays > 0 ? (monthLogs.reduce((acc, curr) => acc + curr.temperatura, 0) / totalDays).toFixed(1) : '0.0';
            const maxTemp = totalDays > 0 ? Math.max(...monthLogs.map(l => l.temperatura)).toFixed(1) : '0.0';
            const minTemp = totalDays > 0 ? Math.min(...monthLogs.map(l => l.temperatura)).toFixed(1) : '0.0';
            const alertsCount = monthLogs.filter(l => l.temperatura > 28.0).length;

            // Active log to display on HUD (hovered log takes precedence, then selected log, then latest recorded log)
            const activeLog = hoveredTempLog 
              || (selectedTempDayId ? monthLogs.find(l => l.id === selectedTempDayId) : null) 
              || (monthLogs.length > 0 ? monthLogs[monthLogs.length - 1] : null);

            return (
              <div className="space-y-6">
                {/* METRIC KPI CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Média Térmica ({targetMonth})</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-black text-cyan-400">{avgTemp}°C</span>
                      <Thermometer className="w-5 h-5 text-cyan-500/60" />
                    </div>
                  </div>

                  <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Pico Máximo Registrado</span>
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-mono font-black ${parseFloat(maxTemp) > 28.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {maxTemp}°C
                      </span>
                      <Flame className={`w-5 h-5 ${parseFloat(maxTemp) > 28.0 ? 'text-rose-400' : 'text-emerald-500/60'}`} />
                    </div>
                  </div>

                  <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Mínima Aferida</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-black text-indigo-400">{minTemp}°C</span>
                      <TrendingDown className="w-5 h-5 text-indigo-400/60" />
                    </div>
                  </div>

                  <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-3.5 space-y-1 shadow-sm">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Alertas Críticos (&gt; 28°C)</span>
                    <div className="flex items-center justify-between">
                      <span className={`text-xl font-mono font-black ${alertsCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {alertsCount}
                      </span>
                      <AlertOctagon className={`w-5 h-5 ${alertsCount > 0 ? 'text-rose-400' : 'text-emerald-400/60'}`} />
                    </div>
                  </div>
                </div>

                {/* HUD EM DESTAQUE / CURSOR INTERATIVO - NUNCA FICA OCULTO */}
                {activeLog && (
                  <div className="bg-gradient-to-r from-[#0b1426] via-[#0f1d38] to-[#0b1426] border-2 border-cyan-500/50 rounded-2xl p-4 shadow-xl transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`p-3 rounded-xl border flex items-center justify-center ${activeLog.temperatura > 28.0 ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-lg shadow-rose-500/20 animate-pulse' : 'bg-cyan-500/20 border-cyan-500 text-cyan-400'}`}>
                          <Thermometer className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              Aferição em Foco {hoveredTempLog ? '(Passagem do Cursor)' : '(Última / Selecionada)'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${activeLog.temperatura > 28.0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                              {activeLog.temperatura > 28.0 ? '🚨 ALERTA TÉRMICO (> 28°C)' : '✅ DENTRO DA FAIXA SEGURA (18°C a 28°C)'}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-3 mt-1">
                            <span className={`text-3xl font-mono font-black ${activeLog.temperatura > 28.0 ? 'text-rose-400' : 'text-cyan-300'}`}>
                              {activeLog.temperatura.toFixed(1)}°C
                            </span>
                            <span className="text-xs text-slate-300 font-bold">
                              📅 {activeLog.dataFormatted} às {activeLog.hora}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#080d1a] border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs space-y-1 min-w-[280px]">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 text-[11px]">Conferente:</span>
                          <strong className="text-white font-sans">{activeLog.conferenteNome}</strong>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 text-[11px]">Umidade Relativa:</span>
                          <span className="text-cyan-400 font-mono font-bold">{activeLog.umidade || '58'}%</span>
                        </div>
                        {activeLog.observacao && (
                          <div className="text-[10px] text-slate-300 italic pt-1 border-t border-slate-800">
                            "{activeLog.observacao}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* GRAFICO INTERATIVO DE VARIACAO DIARIA DE TEMPERATURA */}
                <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-5 space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <strong className="text-xs font-black text-white uppercase flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-cyan-400" />
                        Gráfico de Variação Diária da Temperatura ({targetMonth})
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Passe o cursor sobre os pontos para visualizar a medição detalhada no topo ou clique para fixar.
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] flex-wrap">
                      <span className="flex items-center gap-1 text-cyan-400 font-bold">
                        <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full inline-block"></span> Medição Conforme
                      </span>
                      <span className="flex items-center gap-1 text-rose-400 font-bold">
                        <span className="w-2.5 h-2.5 bg-rose-500 rounded-full inline-block animate-pulse"></span> Alerta (&gt; 28.0°C)
                      </span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <span className="w-3 h-0.5 bg-rose-500 rounded-full inline-block"></span> Limite Máximo 28°C
                      </span>
                    </div>
                  </div>

                  {monthLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">
                      Nenhuma medição registrada para {targetMonth}. Utilize a barra acima para importar dados ou clique em <strong>+ Lançar Medição</strong>.
                    </div>
                  ) : (
                    /* VISUAL SVG LINE & POINTS CHART */
                    <div className="w-full overflow-x-auto pt-4 pb-2">
                      <div className="min-w-[700px] h-56 relative flex items-end justify-between px-6 pb-8 pt-8 border-b border-slate-800 bg-[#080e1b]/40 rounded-xl">
                        {/* Threshold 28°C line */}
                        <div 
                          className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500/80 z-10 flex items-center justify-end pr-3 pointer-events-none"
                          style={{ bottom: `${Math.max(5, Math.min(95, ((28.0 - 18) / 14) * 100))}%` }}
                        >
                          <span className="text-[9px] font-black text-rose-300 bg-rose-950/90 px-2 py-0.5 rounded border border-rose-500/50 shadow-md">
                            LIMITE MÁXIMO 28.0°C
                          </span>
                        </div>

                        {/* Threshold 18°C line */}
                        <div 
                          className="absolute left-0 right-0 border-b border-dashed border-indigo-500/40 z-10 flex items-center justify-end pr-3 pointer-events-none"
                          style={{ bottom: '0%' }}
                        >
                          <span className="text-[8px] font-bold text-indigo-300 bg-indigo-950/70 px-1.5 py-0.5 rounded">
                            MÍNIMA 18.0°C
                          </span>
                        </div>

                        {monthLogs.map((log, idx) => {
                          // Scale 18°C to 32°C (span of 14 degrees)
                          const heightPct = Math.max(5, Math.min(95, ((log.temperatura - 18) / 14) * 100));
                          const isSelected = selectedTempDayId === log.id;
                          const isHovered = hoveredTempLog?.id === log.id;
                          const isCritical = log.temperatura > 28.0;

                          return (
                            <div
                              key={log.id || idx}
                              onMouseEnter={() => setHoveredTempLog(log)}
                              onMouseLeave={() => setHoveredTempLog(null)}
                              onClick={() => setSelectedTempDayId(isSelected ? null : log.id)}
                              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative z-20"
                            >
                              {/* High-visibility Floating Tooltip */}
                              {(isHovered || isSelected) && (
                                <div 
                                  className={`absolute z-40 bg-slate-900 border-2 ${isCritical ? 'border-rose-500 text-rose-200' : 'border-cyan-400 text-cyan-100'} px-2.5 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap shadow-2xl pointer-events-none transition-transform transform -translate-y-2`}
                                  style={{ bottom: `${heightPct + 12}%` }}
                                >
                                  <div className="font-bold flex items-center gap-1">
                                    <span>{log.dataFormatted.substring(0, 5)} ({log.hora})</span>
                                    <span className={`px-1.5 py-0.2 rounded font-black ${isCritical ? 'bg-rose-600 text-white' : 'bg-cyan-500 text-slate-950'}`}>
                                      {log.temperatura.toFixed(1)}°C
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-300 font-sans mt-0.5 font-semibold truncate max-w-[140px]">
                                    {log.conferenteNome}
                                  </div>
                                </div>
                              )}

                              {/* Vertical Guide Line on Hover */}
                              {(isHovered || isSelected) && (
                                <div 
                                  className={`absolute top-0 bottom-6 w-[2px] pointer-events-none z-10 ${isCritical ? 'bg-rose-500/60' : 'bg-cyan-400/60'}`}
                                />
                              )}

                              {/* Node Point with Pulse and Highlight */}
                              <div
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                                  isCritical
                                    ? 'bg-rose-500 border-white shadow-lg shadow-rose-500/80 scale-125 ring-2 ring-rose-400/50'
                                    : isSelected || isHovered
                                    ? 'bg-cyan-400 border-white scale-140 shadow-lg shadow-cyan-500/80 ring-2 ring-cyan-300'
                                    : 'bg-[#111a30] border-cyan-400 group-hover:bg-cyan-400 group-hover:scale-125'
                                }`}
                                style={{ marginBottom: `${heightPct}%` }}
                              />

                              {/* Day and Time Label */}
                              <div className="absolute -bottom-6 flex flex-col items-center pointer-events-none">
                                <span className={`text-[9px] font-mono ${isCritical ? 'text-rose-400 font-bold' : isHovered || isSelected ? 'text-cyan-300 font-bold' : 'text-slate-400'}`}>
                                  {log.dataFormatted.substring(0, 2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* DETALHES DO DIA SELECIONADO NO GRÁFICO */}
                  {selectedTempDayId && (() => {
                    const detailLog = monthLogs.find(l => l.id === selectedTempDayId);
                    if (!detailLog) return null;

                    return (
                      <div className="p-4 bg-[#111a30] border border-cyan-500/40 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <strong className="text-white font-mono flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-cyan-400" /> Detalhes Fixados da Aferição de {detailLog.dataFormatted} às {detailLog.hora}
                          </strong>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-mono font-black ${detailLog.temperatura > 28 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                              {detailLog.temperatura.toFixed(1)}°C
                            </span>
                            <button
                              onClick={() => setSelectedTempDayId(null)}
                              className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
                            >
                              ✕ Fechar
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                          <div><span className="text-slate-500">Conferente:</span> <strong>{detailLog.conferenteNome}</strong></div>
                          <div><span className="text-slate-500">Horário Oficial:</span> <strong>{detailLog.hora}</strong></div>
                        </div>
                        {detailLog.observacao && (
                          <p className="text-[11px] text-slate-300 italic bg-[#0b1222] p-2.5 rounded-lg border border-slate-800">
                            "{detailLog.observacao}"
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* TABELA REGISTRO COMPLETO DO MÊS */}
                <div className="bg-[#0b1222] border border-slate-800 rounded-xl overflow-hidden shadow-md">
                  <div className="px-4 py-3 bg-[#131d38] border-b border-slate-800 flex items-center justify-between">
                    <strong className="text-xs text-white uppercase tracking-wider font-black flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" /> Registros Aferidos do Mês ({targetMonth})
                    </strong>
                    <span className="text-[10px] text-slate-400 font-bold">Total: {monthLogs.length} Aferições</span>
                  </div>

                  <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-[#0b1222] z-10">
                        <tr className="text-slate-400 text-[10px] uppercase border-b border-slate-800 font-black">
                          <th className="p-3">Data / Hora</th>
                          <th className="p-3">Temperatura (°C)</th>
                          <th className="p-3">Conferente</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Observação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                        {monthLogs.map((log) => {
                          const isCrit = log.temperatura > 28.0;
                          return (
                            <tr 
                              key={log.id} 
                              onClick={() => {
                                setSelectedTempDayId(log.id);
                                setHoveredTempLog(log);
                              }}
                              className={`hover:bg-slate-800/60 cursor-pointer transition-colors ${isCrit ? 'bg-rose-950/20' : ''}`}
                            >
                              <td className="p-3 font-bold text-white whitespace-nowrap">
                                {log.dataFormatted} <span className="text-slate-500 text-[10px]">({log.hora})</span>
                              </td>
                              <td className="p-3 font-black text-sm">
                                <span className={`px-2 py-0.5 rounded ${isCrit ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono' : 'text-cyan-300'}`}>
                                  {log.temperatura.toFixed(1)}°C
                                </span>
                              </td>
                              <td className="p-3 text-slate-200 font-sans font-bold">{log.conferenteNome}</td>
                              <td className="p-3">
                                {isCrit ? (
                                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase rounded border border-rose-500/40">
                                    ⚠️ ALERTA &gt; 28°C
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase rounded border border-emerald-500/40">
                                    ✅ CONFORME
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-[10px] text-slate-400 font-sans truncate max-w-[220px]">
                                {log.observacao || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PLANO DE AÇÕES TÉRMICAS MENSAIS (DIRETO DA TEMPERATURA) */}
                <PlanoAcoesTermicasMensais
                  user={user}
                  selectedMonth={selectedFilterMonth}
                  selectedYear={selectedFilterYear}
                  onActionCreated={handleRefreshTempLogs}
                />
              </div>
            );
          })()}
        </div>
      )}

      {/* ── SEÇÃO 2: PROGRAMA 5S & DESEMPENHO POR ÁREA ── */}
      {activeSubTab === '5s' && (
        <div className="bg-[#111a30] border border-amber-500/30 rounded-2xl p-6 space-y-6 shadow-xl">
          {/* HEADER PRINCIPAL DE 5S */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> PROGRAMA 5S & GOVERNANÇA DE QUALIDADE
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md">
                  14 Áreas Oficiais & Auditoria Cruzada Frota
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-2 flex items-center gap-2">
                Painel 5S Integrado - Armazém & Auditoria de Frota
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Acompanhamento consolidado mês a mês das rotinas de 5S dos colaboradores, auditoria mensal cruzada pelo setor de Frota, dispersão e documentos assinados.
              </p>
            </div>

            {/* AÇÕES GLOBAIS DE 5S */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportBlank5SOfficial}
                className="px-3.5 py-2 bg-[#0b1222] hover:bg-slate-800 text-amber-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Exportar formulário oficial de 5S em PDF para impressão e preenchimento manual em situações sem conexão de internet"
              >
                <Download className="w-4 h-4 text-amber-400" /> Exportar Formulário PDF
              </button>

              <button
                onClick={() => setIs5SDigitalModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4 text-slate-950" /> Nova Auditoria 5S
              </button>
            </div>
          </div>

          {/* BARRA DE NAVEGAÇÃO MÊS A MÊS ESTILO WLP */}
          <div className="bg-[#0b1222] border border-amber-500/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Visão Mês a Mês ({selectedYear5S}):
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Ano:</span>
                <select
                  value={selectedYear5S}
                  onChange={(e) => setSelectedYear5S(e.target.value)}
                  className="bg-[#111a30] text-amber-300 text-xs font-black px-2.5 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
              {[
                { value: '01', short: 'Jan' },
                { value: '02', short: 'Fev' },
                { value: '03', short: 'Mar' },
                { value: '04', short: 'Abr' },
                { value: '05', short: 'Mai' },
                { value: '06', short: 'Jun' },
                { value: '07', short: 'Jul' },
                { value: '08', short: 'Ago' },
                { value: '09', short: 'Set' },
                { value: '10', short: 'Out' },
                { value: '11', short: 'Nov' },
                { value: '12', short: 'Dez' }
              ].map(m => {
                const isSelected = selectedMonth5S === m.value;
                const frotaAudit = auditoriasFrota.find(a => a.ano === selectedYear5S && a.mes === m.value);
                const hasFrota = !!frotaAudit;

                return (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMonth5S(m.value)}
                    className={`px-2 py-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20 ring-2 ring-amber-300'
                        : 'bg-[#111a30] text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black uppercase">{m.short}</span>
                    <span className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-slate-950 font-bold' : hasFrota ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {hasFrota ? `${frotaAudit.notaPercentualFrota}%` : 'Pendente'}
                    </span>
                    {hasFrota && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-1 right-1" title="Auditoria da Frota Realizada"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUB-ABAS INTERNAS DO 5S */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
            <button
              onClick={() => setActive5SView('geral_frota')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                active5SView === 'geral_frota'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> 1. Visão Geral & Auditoria da Frota
            </button>

            <button
              onClick={() => setActive5SView('ranking_colaboradores')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                active5SView === 'ranking_colaboradores'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" /> 2. Ranking por Colaborador ({collaborator5SStats.filter(c => c.numAreas > 0).length} Responsáveis)
            </button>

            <button
              onClick={() => setActive5SView('ranking_areas')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                active5SView === 'ranking_areas'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" /> 3. Desempenho por Áreas (14 Setores)
            </button>

            <button
              onClick={() => setActive5SView('historico_auditorias')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                active5SView === 'historico_auditorias'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-[#0b1222] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <History className="w-4 h-4" /> 4. Histórico de Auditorias ({filtered5SAuditsMonth.length})
            </button>
          </div>

          {/* ── SUB-ABA 1: VISÃO GERAL & AUDITORIA DA FROTA ── */}
          {active5SView === 'geral_frota' && (
            <div className="space-y-6">
              {/* 5 CARDS DE INDICADORES PRINCIPAIS DO MÊS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Auditorias no Mês
                  </span>
                  <div className="text-2xl font-black text-white mt-1 font-mono">
                    {filtered5SAuditsMonth.length}
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold block mt-1">
                    {selectedMonth5S}/{selectedYear5S} (Armazém)
                  </span>
                </div>

                <div className="bg-[#0b1222] border border-blue-500/30 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">
                    Real Auditoria Armazém
                  </span>
                  <div className="text-2xl font-black text-blue-300 mt-1 font-mono">
                    {realAuditoriaArmazemPct}%
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                    Média Colaboradores
                  </span>
                </div>

                <div className="bg-[#0b1222] border border-indigo-500/30 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                    Real Auditoria Frota
                  </span>
                  <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">
                    {currentAuditoriaFrota ? `${currentAuditoriaFrota.notaPercentualFrota}%` : 'Pendente'}
                  </div>
                  <span className="text-[10px] text-indigo-400 font-semibold block mt-1">
                    Auditor: Pedro Bruno
                  </span>
                </div>

                <div className={`bg-[#0b1222] border p-4 rounded-xl ${isDispersaoConforme ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest block text-slate-400">
                    Dispersão (Armazém - Frota)
                  </span>
                  <div className={`text-2xl font-black mt-1 font-mono ${isDispersaoConforme ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {dispersaoArmazemFrota}%
                  </div>
                  <span className={`text-[10px] font-black block mt-1 uppercase ${isDispersaoConforme ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isDispersaoConforme ? '✅ Conforme (≤ 5%)' : '⚠️ Dispersão Alta'}
                  </span>
                </div>

                <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Documento Assinado
                  </span>
                  <div className="mt-1">
                    {currentAuditoriaFrota?.pdfFileDataUrl ? (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider border border-emerald-500/30 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> PDF Anexado
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-black uppercase tracking-wider border border-amber-500/30 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Pendente PDF
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-1 truncate max-w-[160px]">
                    {currentAuditoriaFrota?.pdfFileName || 'Sem arquivo anexado'}
                  </span>
                </div>
              </div>

              {/* CARD DE DETALHE DA AUDITORIA MENSAL DA FROTA (PEDRO BRUNO) */}
              <div className="bg-[#0b1222] border-2 border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-4">
                {/* Input oculto para importação direta de PDF assinado/preenchido */}
                <input
                  type="file"
                  ref={frotaFileInputRef}
                  accept="application/pdf,image/*"
                  onChange={handleImportFrotaPdf}
                  className="hidden"
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl shrink-0">
                      <Truck className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md">
                          AUDITORIA MENSAL DA FROTA (AUDITORIA CRUZADA DPO)
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          Mês: {MESES_ANO_5S.find(m => m.value === selectedMonth5S)?.label} / {selectedYear5S}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">
                        Auditoria de 5S do Armazém realizada pelo Setor de Frota
                      </h4>
                      <p className="text-xs text-slate-300">
                        Auditor Oficial: <strong className="text-white">{currentAuditoriaFrota?.auditorResponsavel || 'Pedro Bruno (Setor de Frota)'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* AÇÕES DA AUDITORIA DA FROTA: VISUALIZAR AUDITORIA (COM IMPORTAÇÃO INTERNA DE PDF) */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botão de Visualizar Auditoria com informações preenchidas pelo auditor */}
                    <button
                      onClick={() => setIs5SDigitalModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer"
                      title="Visualizar formulário preenchido pelo auditor, imprimir laudo e importar PDF assinado"
                    >
                      <Eye className="w-4 h-4" /> Visualizar Auditoria
                    </button>

                    {/* Visualizar e Baixar PDF quando houver documento anexado */}
                    {currentAuditoriaFrota?.pdfFileDataUrl && (
                      <>
                        <button
                          onClick={() => openDataUrlInNewTab(currentAuditoriaFrota.pdfFileDataUrl, currentAuditoriaFrota.pdfFileName || `Auditoria_Frota_${selectedMonth5S}_${selectedYear5S}.pdf`)}
                          className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                          title="Visualizar formulário PDF assinado em uma nova guia"
                        >
                          <ExternalLink className="w-4 h-4" /> Visualizar em Outra Guia
                        </button>
                        <button
                          onClick={() => downloadDataUrl(currentAuditoriaFrota.pdfFileDataUrl, currentAuditoriaFrota.pdfFileName || `Auditoria_Frota_${selectedMonth5S}_${selectedYear5S}.pdf`)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                          title="Baixar formulário PDF assinado pelo auditor"
                        >
                          <Download className="w-4 h-4" /> Baixar PDF
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-[#111a30] border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Data da Auditoria Frota</span>
                    <div className="text-sm font-mono font-bold text-white">
                      {currentAuditoriaFrota ? new Date(currentAuditoriaFrota.dataAuditoria + 'T00:00:00').toLocaleDateString('pt-BR') : 'Pendente de Realização'}
                    </div>
                  </div>

                  <div className="p-3 bg-[#111a30] border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Nota Percentual da Frota</span>
                    <div className="text-sm font-mono font-black text-indigo-400">
                      {currentAuditoriaFrota ? `${currentAuditoriaFrota.notaPercentualFrota}% (Meta: 85%)` : 'Não informada'}
                    </div>
                  </div>

                  <div className="p-3 bg-[#111a30] border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Dispersão Calculada</span>
                    <div className={`text-sm font-mono font-black ${isDispersaoConforme ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {dispersaoArmazemFrota}% {isDispersaoConforme ? '(Dentro do Limite ≤ 5%)' : '(Alerta > 5%)'}
                    </div>
                  </div>

                  <div className="p-3 bg-[#111a30] border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Arquivo Assinado</span>
                    <div className="text-xs font-mono text-cyan-300 truncate" title={currentAuditoriaFrota?.pdfFileName}>
                      {currentAuditoriaFrota?.pdfFileName || 'Pendente de Upload'}
                    </div>
                  </div>
                </div>

                {currentAuditoriaFrota?.observacoes && (
                  <div className="p-3 bg-[#111a30] border border-slate-800 rounded-xl text-xs text-slate-300">
                    <strong className="text-slate-400 uppercase text-[10px] block mb-1">Observações do Auditor Pedro Bruno:</strong>
                    <p className="italic">"{currentAuditoriaFrota.observacoes}"</p>
                  </div>
                )}
              </div>

              {/* GRÁFICO COMPARATIVO ANUAL MÊS A MÊS: ARMAZÉM VS FROTA VS DISPERSÃO */}
              <div className="bg-[#0b1222] border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-amber-400" /> Comparativo Anual Mês a Mês: Real Armazém vs Real Frota vs Meta (2026)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Evolução das notas de 5S consolidadas do armazém e das auditorias cruzadas da Frota ao longo do ano.
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></span> Real Armazém (%)
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400">
                      <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span> Real Frota (%)
                    </span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-2.5 h-0.5 bg-amber-400 rounded-sm"></span> Meta (85%)
                    </span>
                  </div>
                </div>

                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartDataComparativo}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                      <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="armazem" name="Real Armazém (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="frota" name="Real Frota (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ── TABELA OFICIAL FAROL DOS ITENS DE CONTROLE E DE VERIFICAÇÃO - ARMAZÉM ── */}
              <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* CABEÇALHO AZUL MARINHO OFICIAL DPO */}
                <div className="bg-[#002060] p-3 text-center border-b border-blue-900">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    FAROL DOS ITENS DE CONTROLE E DE VERIFICAÇÃO - ARMAZÉM
                  </h3>
                </div>

                {/* TABELA RESPONSIVA FORMATO PLANILHA */}
                <div className="overflow-x-auto">
                  <table className="w-full text-center border-collapse text-[11px] font-sans">
                    <thead>
                      <tr className="bg-[#0f172a] text-white font-bold border-b border-slate-700">
                        <th rowSpan={2} className="p-2.5 px-3 border-r border-slate-700 text-left min-w-[130px] font-black uppercase text-[10px] text-slate-300">
                          Indicador
                        </th>
                        {MESES_ANO_5S.map((m) => (
                          <th key={m.value} colSpan={2} className="p-2 border-r border-slate-700 text-center font-bold text-xs bg-[#131d38]">
                            {m.label}
                          </th>
                        ))}
                      </tr>
                      <tr className="bg-[#1e293b] text-slate-300 text-[10px] font-bold border-b border-slate-700">
                        {MESES_ANO_5S.map((m) => (
                          <React.Fragment key={m.value}>
                            <th className="py-1 px-2 border-r border-slate-700 text-slate-400 bg-[#0f172a]">
                              Meta
                            </th>
                            <th className="py-1 px-2 border-r border-slate-700 text-indigo-300 bg-[#16203c]">
                              Real
                            </th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {/* LINHA DO 5S */}
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-2.5 px-3 text-left font-black text-white border-r border-slate-700 bg-[#0f172a] text-xs">
                          5S
                        </td>
                        {MESES_ANO_5S.map((m) => {
                          const numMes = parseInt(m.value, 10);
                          const monthChart = chartDataComparativo.find(c => c.mes === m.label);
                          const frotaData = auditoriasFrota.find(f => f.ano === selectedYear5S && f.mes === m.value);
                          const realVal = monthChart ? monthChart.frota : (frotaData ? frotaData.notaPercentualFrota : ((m.value === '03' || m.value === '06' || m.value === '08') ? 92 : 88));

                          if (numMes > 8) {
                            return (
                              <React.Fragment key={m.value}>
                                <td className="py-2 px-2 border-r border-slate-800 font-mono text-slate-400 text-xs">
                                  85,00%
                                </td>
                                <td className="py-2 px-2 border-r border-slate-800 font-mono text-slate-500 text-xs bg-slate-800/20">
                                  -
                                </td>
                              </React.Fragment>
                            );
                          }

                          return (
                            <React.Fragment key={m.value}>
                              <td className="py-2 px-2 border-r border-slate-800 font-mono text-slate-300 text-xs">
                                85,00%
                              </td>
                              <td className="py-2 px-2 border-r border-slate-800 font-mono font-black text-emerald-400 text-xs bg-emerald-500/5">
                                {realVal},00%
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>

                      {/* LINHA DA DISPERSÃO */}
                      <tr className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-2.5 px-3 text-left font-black text-amber-300 border-r border-slate-700 bg-[#0f172a] text-xs">
                          DISPERSÃO 5%
                        </td>
                        {MESES_ANO_5S.map((m) => {
                          const numMes = parseInt(m.value, 10);
                          const monthChart = chartDataComparativo.find(c => c.mes === m.label);
                          const isJun = m.value === '06';
                          const dispVal = monthChart ? monthChart.dispersao : (isJun ? 3 : 4);

                          if (numMes > 8) {
                            return (
                              <React.Fragment key={m.value}>
                                <td className="py-2 px-2 border-r border-slate-800 font-mono text-slate-400 text-xs">
                                  5,00%
                                </td>
                                <td className="py-2 px-2 border-r border-slate-800 font-mono text-slate-500 text-xs bg-slate-800/20">
                                  -
                                </td>
                              </React.Fragment>
                            );
                          }

                          return (
                            <React.Fragment key={m.value}>
                              <td className="py-2 px-2 border-r border-slate-800 font-mono text-slate-300 text-xs">
                                5,00%
                              </td>
                              <td className="py-2 px-2 border-r border-slate-800 font-mono font-black text-cyan-300 text-xs bg-cyan-500/5">
                                {dispVal},00%
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── SUB-ABA 2: RANKING POR COLABORADOR (APENAS RESPONSÁVEIS POR ÁREAS) ── */}
          {active5SView === 'ranking_colaboradores' && (
            <div className="space-y-6">
              {/* 👑 QUADRO HISTÓRICO DE CAMPEÕES MENSAIS 5S */}
              <div className="bg-[#0b1222] border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        Campeões Mensais de 5S <span className="text-amber-400 font-mono text-xs">(Ano 2026)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Galeria oficial dos colaboradores destaque com meta atingida de Janeiro a Agosto
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700 w-fit">
                    Clique no mês para filtrar o ranking e auditorias
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {Object.values(CAMPEOES_5S_MENSAIS).map(champ => {
                    const isSelected = selectedMonth5S === champ.mesStr;
                    return (
                      <button
                        key={champ.mesNum}
                        onClick={() => setSelectedMonth5S(champ.mesStr)}
                        className={`flex flex-col p-3 rounded-xl border transition-all text-left relative cursor-pointer group ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/50'
                            : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                            {champ.mesNome.substring(0, 3)}
                          </span>
                          <span className="text-xs">👑</span>
                        </div>
                        <span className="text-xs font-black text-white truncate w-full group-hover:text-amber-300 transition-colors">
                          {champ.apelido}
                        </span>
                        <span className="text-[9px] text-slate-400 truncate w-full font-mono mt-0.5">
                          {champ.cargo}
                        </span>
                        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
                          <span className="text-[9px] text-emerald-400 font-bold">100% Meta</span>
                          <span className="text-[10px] font-mono font-black text-amber-400">1º Lugar</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS DO 5S */}
              {(() => {
                const rankingList = [...collaborator5SStats.filter(c => c.numAreas > 0)].sort((a, b) => b.notaFinal - a.notaFinal || b.realQtd - a.realQtd);
                if (rankingList.length === 0) return null;

                const top1 = rankingList[0];
                const top2 = rankingList[1];
                const top3 = rankingList[2];

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {top2 && (
                      <div className="bg-[#0b1222] border-2 border-slate-400/40 rounded-2xl p-4 flex items-center gap-3 relative order-2 md:order-1">
                        <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-900 font-black flex items-center justify-center text-lg shrink-0 shadow-lg">
                          2º
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-black uppercase text-slate-400">🥈 2º Lugar 5S</span>
                          <h4 className="text-sm font-black text-white truncate">{top2.nome}</h4>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            Nota: {top2.notaFinal}% | {top2.realQtd} auditorias
                          </span>
                        </div>
                      </div>
                    )}

                    {top1 && (
                      <div className="bg-[#0b1222] border-2 border-amber-400 rounded-2xl p-4 flex items-center gap-3 relative order-1 md:order-2 shadow-lg shadow-amber-500/10">
                        <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xl shrink-0 shadow-lg">
                          👑
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-black uppercase text-amber-400">🥇 1º Lugar (Melhor Colaborador 5S)</span>
                          <h4 className="text-sm font-black text-white truncate">{top1.nome}</h4>
                          <span className="text-xs font-mono text-amber-300 font-bold">
                            Nota: {top1.notaFinal}% | {top1.realQtd} auditorias
                          </span>
                        </div>
                      </div>
                    )}

                    {top3 && (
                      <div className="bg-[#0b1222] border-2 border-amber-700/60 rounded-2xl p-4 flex items-center gap-3 relative order-3 md:order-3">
                        <div className="w-10 h-10 rounded-full bg-amber-700 text-amber-100 font-black flex items-center justify-center text-lg shrink-0 shadow-lg">
                          3º
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-black uppercase text-amber-600">🥉 3º Lugar 5S</span>
                          <h4 className="text-sm font-black text-white truncate">{top3.nome}</h4>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            Nota: {top3.notaFinal}% | {top3.realQtd} auditorias
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* GRÁFICOS DE META VS REAL: QUANTIDADE E QUALIDADE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-emerald-400" /> Quantidade de 5S Realizadas (Meta vs Real)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Mês {selectedMonth5S}/{selectedYear5S}</span>
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collaborator5SStats.filter(c => c.numAreas > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                        <XAxis dataKey="shortName" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="metaQtd" name="Meta Qtd Audits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="realQtd" name="Real Qtd Realizadas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" /> Qualidade do 5S (% Conforme por Respostas)
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Meta: 80%</span>
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collaborator5SStats.filter(c => c.numAreas > 0)} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                        <XAxis dataKey="shortName" stroke="#94a3b8" tick={{ fontSize: 9 }} interval={0} angle={-25} textAnchor="end" />
                        <YAxis stroke="#94a3b8" domain={[0, 100]} unit="%" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="metaQualidade" name="Meta Qualidade (80%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="realQualidade" name="Qualidade Real (%)" radius={[4, 4, 0, 0]}>
                          {collaborator5SStats.filter(c => c.numAreas > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.realQualidade >= 80 ? '#10b981' : '#f43f5e'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* TABELA DE META E REAL DO MÊS - SOMENTE COLABORADORES COM ÁREAS RESPONSÁVEIS */}
              <div className="bg-[#0b1222] border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3.5 bg-[#131d38] border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-400" /> Colaboradores Responsáveis por Áreas de 5S (Meta vs Real)
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Mês: {MESES_ANO_5S.find(m => m.value === selectedMonth5S)?.label} / {selectedYear5S}
                    </span>
                    <button
                      onClick={() => setIs5SImportModalOpen(true)}
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Database className="w-3 h-3 text-white" /> Base / Importar 5S
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-500/10 text-amber-300 text-[10px] uppercase border-b border-amber-500/20 font-black">
                        <th className="p-3 text-center">POS</th>
                        <th className="p-3 whitespace-nowrap">MATRÍCULA</th>
                        <th className="p-3 whitespace-nowrap">COLABORADOR</th>
                        <th className="p-3 whitespace-nowrap">CARGO</th>
                        <th className="p-3 whitespace-nowrap">ÁREAS SOB RESPONSABILIDADE</th>
                        <th className="p-3 text-center whitespace-nowrap">META QTD</th>
                        <th className="p-3 text-center whitespace-nowrap">REAL QTD</th>
                        <th className="p-3 text-center whitespace-nowrap">% ATING. FREQUÊNCIA</th>
                        <th className="p-3 text-center whitespace-nowrap">META QUALIDADE</th>
                        <th className="p-3 text-center whitespace-nowrap">REAL QUALIDADE (%)</th>
                        <th className="p-3 text-center whitespace-nowrap">NOTA FINAL 5S</th>
                        <th className="p-3 text-center whitespace-nowrap">HISTÓRICO DIÁRIO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {[...collaborator5SStats.filter(c => c.numAreas > 0)]
                        .sort((a, b) => b.notaFinal - a.notaFinal || b.realQtd - a.realQtd)
                        .map((item, idx) => (
                          <tr key={item.matricula} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 text-center font-mono font-black">
                              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                                idx === 0 ? 'bg-amber-400 text-slate-950 font-black' :
                                idx === 1 ? 'bg-slate-300 text-slate-950 font-black' :
                                idx === 2 ? 'bg-amber-700 text-white font-black' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {idx + 1}º
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-400 text-[11px] whitespace-nowrap">{item.matricula}</td>
                            <td className="p-3 font-black text-white font-sans whitespace-nowrap cursor-pointer hover:text-amber-400" onClick={() => setSelectedColabForHistory(item)}>
                              {item.nome}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">{item.cargo}</td>
                            <td className="p-3 font-sans text-[11px]">
                              <div className="flex flex-wrap gap-1">
                                {item.assignedAreas.map(a => (
                                  <span key={a} className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300 whitespace-nowrap">{item.metaQtd}</td>
                            <td className="p-3 text-center font-mono font-black text-emerald-400 whitespace-nowrap">{item.realQtd}</td>
                            <td className="p-3 text-center font-mono font-bold whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap ${item.pctQtdAtingimento >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                {item.pctQtdAtingimento}%
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300 whitespace-nowrap">85%</td>
                            <td className="p-3 text-center font-mono font-black text-sky-400 whitespace-nowrap">
                              {item.realQualidade}%
                            </td>
                            <td className="p-3 text-center font-mono font-black whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase whitespace-nowrap ${item.atingiu ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                {item.notaFinal}% ({item.atingiu ? 'ATINGIDO' : 'FORA DA META'})
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedColabForHistory(item)}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <CalendarDays className="w-3.5 h-3.5 text-amber-400" /> Ver Dias ({item.realQtd})
                              </button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* VISÃO RÁPIDA DE DIAS REALIZADOS POR COLABORADOR */}
              <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-400" /> Histórico Detalhado de Dias Realizados (Auditorias Diárias)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Auditorias registradas em todos os dias úteis da semana (Segunda a Sexta) de 01/01/2026 até 25/08/2026.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Meta 85% Batida por Todos
                    </span>
                    <button
                      onClick={() => exportAuditsToExcel(audits5S)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3 h-3" /> Exportar Base Completa (.xlsx)
                    </button>
                  </div>
                </div>

                {/* CARDS COM RESUMO DOS PRINCIPAIS RESPONSÁVEIS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {collaborator5SStats.filter(c => c.numAreas > 0).map(colab => {
                    return (
                      <div 
                        key={colab.matricula}
                        onClick={() => setSelectedColabForHistory(colab)}
                        className="bg-[#111a30] hover:bg-[#142140] border border-slate-700/60 hover:border-amber-500/60 rounded-xl p-3 cursor-pointer transition-all space-y-2 group shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="overflow-hidden">
                            <h5 className="text-xs font-black text-white truncate group-hover:text-amber-400 transition-colors">
                              {colab.nome}
                            </h5>
                            <span className="text-[10px] font-mono text-slate-400">{colab.cargo} ({colab.matricula})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {colab.avgYTD}%
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Áreas ({colab.numAreas}):</span>
                            <span className="font-bold text-amber-300 truncate max-w-[140px] text-right">
                              {colab.assignedAreas.join(', ')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Auditorias YTD (Até 25/08):</span>
                            <span className="font-mono font-black text-white">{colab.totalDaysYTD} dias úteis</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-amber-400 font-bold">
                          <span>Abrir Histórico Completo</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── SUB-ABA 3: DESEMPENHO POR ÁREAS (14 SETORES) ── */}
          {active5SView === 'ranking_areas' && (
            <div className="space-y-4">
              <div className="bg-[#0b1222] border border-slate-800 rounded-xl overflow-hidden space-y-2">
                <div className="p-3.5 bg-[#131d38] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" /> Tabela de Áreas do Armazém (14 Locais) e Vínculo ao Cadastro
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFilter5SMode('todos')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${filter5SMode === 'todos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Todas (14)
                    </button>
                    <button
                      onClick={() => setFilter5SMode('atingiram')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${filter5SMode === 'atingiram' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      ✅ Atingiram
                    </button>
                    <button
                      onClick={() => setFilter5SMode('fora')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${filter5SMode === 'fora' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      ⚠️ Fora Meta
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-500/10 text-amber-300 text-[10px] uppercase border-b border-amber-500/20 font-black">
                        <th className="p-3">ÁREA</th>
                        <th className="p-3">RESPONSÁVEL (VÍNCULO CADASTRO MESTRE)</th>
                        <th className="p-3 text-center">META QTD (MÊS)</th>
                        <th className="p-3 text-center">REAL QTD</th>
                        <th className="p-3 text-center">META QUALIDADE</th>
                        <th className="p-3 text-center">REAL QUALIDADE (%)</th>
                        <th className="p-3 text-center">NOTA FINAL 5S</th>
                        <th className="p-3 text-center">STATUS</th>
                        <th className="p-3 text-right">AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {LISTA_5S_OFICIAL.map((row) => {
                        const currentRespName = areaResponsaveis[row.area] || DEFAULT_AREA_RESPONSAVEIS[row.area] || 'DEJEAN SILVA DE OLIVEIRA';
                        
                        const sectorAudits = filtered5SAuditsMonth.filter(a => 
                          (a.setor || '').toLowerCase().trim() === row.area.toLowerCase().trim()
                        );
                        const realQtd = sectorAudits.length;
                        const metaQtd = 22;
                        const pctQtd = Math.min(100, Math.round((realQtd / metaQtd) * 100));

                        const realQualidade = sectorAudits.length > 0
                          ? Math.round(sectorAudits.reduce((acc, curr) => acc + (curr.notaPercentual || 0), 0) / sectorAudits.length)
                          : row.realPctDefault;

                        const notaFinal5S = realQualidade;
                        const atingiuMeta = notaFinal5S >= row.metaPct;

                        if (filter5SMode === 'atingiram' && !atingiuMeta) return null;
                        if (filter5SMode === 'fora' && atingiuMeta) return null;

                        return (
                          <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-black text-white font-sans flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                              {row.area}
                            </td>
                            <td className="p-3">
                              <select
                                value={currentRespName}
                                onChange={(e) => handleUpdateAreaResponsavel(row.area, e.target.value)}
                                className="bg-[#111a30] text-amber-300 text-xs font-black uppercase px-2.5 py-1 rounded-lg border border-slate-700 outline-none w-full max-w-[280px] cursor-pointer hover:border-amber-500/50"
                              >
                                {LISTA_COLABORADORES_OFICIAIS.map(c => (
                                  <option key={c.matricula} value={c.nome}>
                                    {c.nome} ({c.cargo})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300">22</td>
                            <td className="p-3 text-center font-mono font-black text-emerald-400">{realQtd}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300">{row.metaPct}%</td>
                            <td className="p-3 text-center font-mono font-black text-sky-400">{realQualidade}%</td>
                            <td className="p-3 text-center font-mono font-black text-sm">
                              <span className={`px-2 py-0.5 rounded ${atingiuMeta ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                                {notaFinal5S}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {atingiuMeta ? (
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ATINGIDO
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-500/30 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400" /> FORA DA META
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setSelected5SSetor(row.area);
                                  setIs5SModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Auditar
                              </button>
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

          {/* ── SUB-ABA 4: HISTÓRICO DE AUDITORIAS DE 5S ── */}
          {active5SView === 'historico_auditorias' && (() => {
            let list = histFilterPeriod === 'mes' ? filtered5SAuditsMonth : audits5S;
            if (histFilterColab !== 'todos') {
              list = list.filter(a => {
                const op = (a.operador || '').toLowerCase().trim();
                const target = histFilterColab.toLowerCase().trim();
                return op === target || op.includes(target) || target.includes(op);
              });
            }
            if (histFilterArea !== 'todas') {
              list = list.filter(a => (a.setor || '').toLowerCase().trim() === histFilterArea.toLowerCase().trim());
            }
            if (histSearchTerm.trim()) {
              const term = histSearchTerm.toLowerCase().trim();
              list = list.filter(a => 
                (a.dataFormatted || '').toLowerCase().includes(term) ||
                (a.dataISO || '').toLowerCase().includes(term) ||
                (a.setor || '').toLowerCase().includes(term) ||
                (a.operador || '').toLowerCase().includes(term) ||
                (a.liderAuditor || '').toLowerCase().includes(term) ||
                (a.observacoesNaoConforme || '').toLowerCase().includes(term)
              );
            }

            return (
              <div className="bg-[#0b1222] border border-slate-800 rounded-xl overflow-hidden space-y-3">
                <div className="p-3.5 bg-[#131d38] border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Histórico Geral de Checklists de 5S ({list.length} Registros)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportAuditsToExcel(list)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Exportar Filtrados (.xlsx)
                    </button>
                    <button
                      onClick={() => setIs5SImportModalOpen(true)}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Database className="w-3.5 h-3.5" /> Base / Importar
                    </button>
                  </div>
                </div>

                {/* BARRA DE FILTROS DO HISTÓRICO */}
                <div className="p-3 bg-[#0f172a] border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Período</label>
                    <select
                      value={histFilterPeriod}
                      onChange={(e) => setHistFilterPeriod(e.target.value)}
                      className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="mes">Mês Selecionado ({selectedMonth5S}/{selectedYear5S})</option>
                      <option value="ytd">Ano Todo YTD (01/01 a 25/08/2026)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Colaborador</label>
                    <select
                      value={histFilterColab}
                      onChange={(e) => setHistFilterColab(e.target.value)}
                      className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="todos">Todos os Colaboradores</option>
                      {LISTA_COLABORADORES_OFICIAIS.map(c => (
                        <option key={c.matricula} value={c.nome}>{c.nome} ({c.cargo})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Área / Setor</label>
                    <select
                      value={histFilterArea}
                      onChange={(e) => setHistFilterArea(e.target.value)}
                      className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="todas">Todas as 14 Áreas</option>
                      {LISTA_5S_OFICIAL.map(a => (
                        <option key={a.id} value={a.area}>{a.area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Busca por Data ou Palavra</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: 25/08, picking, Pedro..."
                        value={histSearchTerm}
                        onChange={(e) => setHistSearchTerm(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-amber-500/10 text-amber-300 text-[10px] uppercase border-b border-amber-500/20 font-black">
                        <th className="p-3">Data</th>
                        <th className="p-3">Área / Setor</th>
                        <th className="p-3">Operador Responsável</th>
                        <th className="p-3 text-center">Pontuação</th>
                        <th className="p-3 text-center">Nota %</th>
                        <th className="p-3">Observação / Não Conformidades</th>
                        <th className="p-3 text-center">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-sans text-xs">
                      {list.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                            Nenhuma auditoria encontrada com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        list.slice(0, 150).map((audit) => (
                          <tr key={audit.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-white whitespace-nowrap">{audit.dataFormatted || audit.dataISO}</td>
                            <td className="p-3 font-bold text-amber-300">{audit.setor}</td>
                            <td className="p-3 font-bold text-slate-200">{audit.operador}</td>
                            <td className="p-3 text-center font-mono font-bold text-slate-300">{audit.pontos || 10}/10</td>
                            <td className="p-3 text-center font-mono font-black">
                              <span className={`px-2 py-0.5 rounded ${audit.notaPercentual >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                                {audit.notaPercentual || 100}%
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 font-medium text-[11px] max-w-xs truncate">
                              {audit.observacoesNaoConforme || '5s realizado com sucesso'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => setSelectedAuditDetail(audit)}
                                className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded text-[10px] font-bold flex items-center gap-1 mx-auto transition-all cursor-pointer"
                              >
                                <Eye className="w-3 h-3" /> Ver 10 Itens
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  {list.length > 150 && (
                    <div className="p-2.5 bg-slate-900/60 border-t border-slate-800 text-center text-[11px] text-slate-400">
                      Exibindo as primeiras 150 auditorias de um total de <strong className="text-amber-300">{list.length}</strong>. Use o botão <strong>Exportar Filtrados (.xlsx)</strong> para extrair a base completa.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* MODAL DE AUDITORIA DO SETOR DE FROTA (PEDRO BRUNO) */}
          {showFrotaModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#0b1222] border-2 border-indigo-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-white">
                        Auditoria do Setor de Frota (5S Armazém)
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Mês Referência: {selectedMonth5S}/{selectedYear5S}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFrotaModal(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAuditoriaFrota} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Auditor Responsável da Frota *</label>
                    <input
                      type="text"
                      value={frotaAuditor}
                      onChange={(e) => setFrotaAuditor(e.target.value)}
                      placeholder="Ex: Pedro Bruno (Setor de Frota)"
                      className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Data da Auditoria *</label>
                      <input
                        type="date"
                        value={frotaData}
                        onChange={(e) => setFrotaData(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nota % de Conformidade (Frota) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={frotaNota}
                        onChange={(e) => setFrotaNota(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-indigo-300 font-mono font-black focus:outline-none focus:border-indigo-500 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Observações da Auditoria</label>
                    <textarea
                      value={frotaObs}
                      onChange={(e) => setFrotaObs(e.target.value)}
                      placeholder="Descreva as constatações de 5S no armazém pelo auditor da frota..."
                      className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                      Anexo do Laudo/Documento Assinado (PDF)
                    </label>
                    <div className="border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 bg-[#111a30] text-center cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFrotaPdfChange}
                        className="hidden"
                        id="frota-pdf-upload"
                      />
                      <label htmlFor="frota-pdf-upload" className="cursor-pointer flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5 text-indigo-400" />
                        <span className="text-[11px] font-bold text-slate-300">
                          {frotaPdfFile ? `Arquivo: ${frotaPdfFile.fileName}` : 'Clique para selecionar o PDF Assinado'}
                        </span>
                        <span className="text-[9px] text-slate-500">Formato aceito: .pdf assinado</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowFrotaModal(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase text-[11px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[11px] shadow-lg flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-indigo-200" /> Salvar Auditoria Frota
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL DE HISTÓRICO DE DIAS DO COLABORADOR */}
          {selectedColabForHistory && (() => {
            const colab = selectedColabForHistory;
            const assigned = colab.assignedAreas || [];
            
            // Todas as auditorias do colaborador (desde 01/01/2026 até 25/08/2026)
            let colabAudits = audits5S.filter(a => {
              const isOperator = a.operador && (
                a.operador.toLowerCase().trim() === colab.nome.toLowerCase().trim() ||
                colab.nome.toLowerCase().includes(a.operador.toLowerCase().trim())
              );
              const isArea = assigned.some((area: string) => (a.setor || '').toLowerCase().trim() === area.toLowerCase().trim());
              return isOperator || isArea;
            });

            // Filtros internos do modal
            if (selectedColabHistoryMonth !== 'todos') {
              colabAudits = colabAudits.filter(a => {
                const parts = (a.dataISO || '').split('-');
                return parts.length >= 2 && parts[1] === selectedColabHistoryMonth;
              });
            }

            if (selectedColabHistoryArea !== 'todas') {
              colabAudits = colabAudits.filter(a => (a.setor || '').toLowerCase().trim() === selectedColabHistoryArea.toLowerCase().trim());
            }

            if (selectedColabHistoryScore !== 'todos') {
              const targetScore = parseInt(selectedColabHistoryScore, 10);
              colabAudits = colabAudits.filter(a => (a.notaPercentual || 0) === targetScore);
            }

            if (selectedColabHistorySearch.trim()) {
              const term = selectedColabHistorySearch.toLowerCase().trim();
              colabAudits = colabAudits.filter(a => 
                (a.dataFormatted || '').toLowerCase().includes(term) ||
                (a.dataISO || '').toLowerCase().includes(term) ||
                (a.setor || '').toLowerCase().includes(term) ||
                (a.observacoesNaoConforme || '').toLowerCase().includes(term) ||
                (a.liderAuditor || '').toLowerCase().includes(term)
              );
            }

            const totalFilteredDays = colabAudits.length;
            const avgFilteredQuality = totalFilteredDays > 0
              ? Math.round(colabAudits.reduce((acc, curr) => acc + (curr.notaPercentual || 0), 0) / totalFilteredDays)
              : 0;

            const days100 = colabAudits.filter(a => (a.notaPercentual || 0) === 100).length;
            const days90 = colabAudits.filter(a => (a.notaPercentual || 0) === 90).length;
            const days80 = colabAudits.filter(a => (a.notaPercentual || 0) === 80).length;

            return (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0b1222] border-2 border-amber-500/50 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                  {/* CABEÇALHO DO MODAL */}
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{colab.nome}</h4>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Matrícula: {colab.matricula}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {colab.cargo} • Áreas sob responsabilidade: <strong className="text-amber-300">{assigned.join(', ')}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedColabForHistory(null);
                        setSelectedColabHistoryMonth('todos');
                        setSelectedColabHistoryArea('todas');
                        setSelectedColabHistoryScore('todos');
                        setSelectedColabHistorySearch('');
                      }}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* CARDS DE RESUMO KPI */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
                    <div className="bg-[#111a30] border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Total Dias Úteis</span>
                      <p className="text-base font-black text-white font-mono mt-0.5">{totalFilteredDays} Auditorias</p>
                    </div>
                    <div className="bg-[#111a30] border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Média Qualidade</span>
                      <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{avgFilteredQuality}%</p>
                    </div>
                    <div className="bg-[#111a30] border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Meta de 85%</span>
                      <p className="text-xs font-black text-emerald-400 font-mono mt-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ATINGINDO META
                      </p>
                    </div>
                    <div className="bg-[#111a30] border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Distribuição de Notas</span>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                        <span className="text-emerald-400">100%: {days100}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-sky-400">90%: {days90}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-amber-400">80%: {days80}</span>
                      </div>
                    </div>
                  </div>

                  {/* BARRA DE FILTROS DO MODAL */}
                  <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2 shrink-0">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Filtrar Mês</label>
                      <select
                        value={selectedColabHistoryMonth}
                        onChange={(e) => setSelectedColabHistoryMonth(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="todos">Todos (01/01 a 25/08/2026)</option>
                        {MESES_ANO_5S.slice(0, 8).map(m => (
                          <option key={m.value} value={m.value}>{m.label} {m.value === '08' ? '(até 25/08)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Filtrar Área</label>
                      <select
                        value={selectedColabHistoryArea}
                        onChange={(e) => setSelectedColabHistoryArea(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="todas">Todas as Áreas ({assigned.length})</option>
                        {assigned.map((a: string) => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Filtrar Nota %</label>
                      <select
                        value={selectedColabHistoryScore}
                        onChange={(e) => setSelectedColabHistoryScore(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="todos">Todas as Notas</option>
                        <option value="100">100% (10/10 Pontos)</option>
                        <option value="90">90% (9/10 Pontos)</option>
                        <option value="80">80% (8/10 Pontos)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Buscar Data/Obs</label>
                      <input
                        type="text"
                        placeholder="Ex: 25/08, 14/07..."
                        value={selectedColabHistorySearch}
                        onChange={(e) => setSelectedColabHistorySearch(e.target.value)}
                        className="w-full bg-[#111a30] border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* TABELA COM ROLAGEM DOS DIAS REALIZADOS */}
                  <div className="overflow-y-auto border border-slate-800 rounded-xl flex-1 min-h-[220px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-[#131d38] z-10">
                        <tr className="text-amber-300 text-[10px] uppercase border-b border-slate-800 font-black">
                          <th className="p-2.5">Data (Dia Útil)</th>
                          <th className="p-2.5">Área / Setor</th>
                          <th className="p-2.5 text-center">Pontos</th>
                          <th className="p-2.5 text-center">Nota %</th>
                          <th className="p-2.5">Observações da Rotina</th>
                          <th className="p-2.5 text-center">Checklist</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300 text-xs">
                        {colabAudits.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-500 italic">
                              Nenhuma auditoria encontrada com os filtros selecionados.
                            </td>
                          </tr>
                        ) : (
                          colabAudits.map((audit) => {
                            const dateObj = new Date(audit.dataISO + 'T12:00:00');
                            const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                            const weekDayName = weekDays[dateObj.getDay()] || '';

                            return (
                              <tr key={audit.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-2.5 font-mono font-bold text-white whitespace-nowrap">
                                  {audit.dataFormatted || audit.dataISO} <span className="text-[10px] text-amber-400 font-bold">({weekDayName})</span>
                                </td>
                                <td className="p-2.5 font-bold text-amber-300">{audit.setor}</td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-300">{audit.pontos || 10}/10</td>
                                <td className="p-2.5 text-center font-mono font-black">
                                  <span className={`px-2 py-0.5 rounded text-[11px] ${
                                    (audit.notaPercentual || 100) === 100 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    (audit.notaPercentual || 100) === 90 ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  }`}>
                                    {audit.notaPercentual || 100}%
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-300 font-medium text-[11px] max-w-xs truncate">
                                  {audit.observacoesNaoConforme || '5s realisado'}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    onClick={() => setSelectedAuditDetail(audit)}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 mx-auto transition-all cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" /> 10 Itens
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* RODAPÉ DO MODAL */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
                    <span className="text-[11px] text-slate-400">
                      Mostrando <strong className="text-white">{colabAudits.length}</strong> auditorias em dias úteis (Seg a Sex).
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportAuditsToExcel(colabAudits)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase text-[11px] shadow-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" /> Exportar Este Histórico (.xlsx)
                      </button>
                      <button
                        onClick={() => setSelectedColabForHistory(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase text-[11px] cursor-pointer"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* MODAL DE DETALHAMENTO DAS 10 PERGUNTAS DE UMA AUDITORIA */}
          {selectedAuditDetail && (() => {
            const audit = selectedAuditDetail;
            const PERGUNTAS_5S_PADRAO = [
              { senso: 'SEIRI (Utilização)', pergunta: 'Apenas itens e materiais necessários estão presentes na área? Itens em desuso foram separados/descartados?' },
              { senso: 'SEITON (Organização)', pergunta: 'Os materiais, ferramentas e caixas estão dispostos de forma organizada e demarcada?' },
              { senso: 'SEITON (Identificação)', pergunta: 'Existe identificação visual clara para pallets, caixas e locais de armazenagem?' },
              { senso: 'SEISO (Limpeza)', pergunta: 'O piso, prateleiras e estruturas estão limpos e isentos de poeira, lixo ou resíduos?' },
              { senso: 'SEISO (Manutenção)', pergunta: 'As lixeiras e coletores de resíduos estão limpos, identificados e não transbordando?' },
              { senso: 'SEIKETSU (Padronização)', pergunta: 'Os padrões visuais, demarcações de piso e rotinas de organização estão sendo cumpridos?' },
              { senso: 'SEIKETSU (Segurança & EPI)', pergunta: 'O ambiente oferece condições seguras de trabalho e uso correto de EPIs?' },
              { senso: 'SHITSUKE (Disciplina)', pergunta: 'O operador demonstra compromisso e disciplina na manutenção diária do padrão 5S?' },
              { senso: 'SHITSUKE (Conservação)', pergunta: 'Os equipamentos, paleteiras ou empilhadeiras da área estão conservados e limpos?' },
              { senso: 'SHITSUKE (Melhoria)', pergunta: 'A área apresenta padrão exemplar de qualidade e organização contínua?' }
            ];

            return (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0b1222] border-2 border-sky-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-black">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-white">
                          Detalhamento do Checklist 5S • {audit.setor}
                        </h4>
                        <p className="text-xs text-slate-400">
                          Data: <strong className="text-white">{audit.dataFormatted || audit.dataISO}</strong> • Responsável: <strong className="text-amber-300">{audit.operador}</strong> • Setor: <strong className="text-sky-300">{audit.setor}</strong>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedAuditDetail(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* NOTA E PONTUAÇÃO */}
                  <div className="bg-[#111a30] border border-slate-800 p-3 rounded-xl flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <span className="text-xs font-bold text-slate-300">Resultado da Avaliação:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">{audit.pontos || 10} de 10 Itens Conformes</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                        (audit.notaPercentual || 100) >= 85 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {audit.notaPercentual || 100}% Conforme
                      </span>
                    </div>
                  </div>

                  {/* LISTA DAS 10 PERGUNTAS */}
                  <div className="overflow-y-auto border border-slate-800 rounded-xl flex-1 space-y-2 p-3 bg-[#0c1322]">
                    {PERGUNTAS_5S_PADRAO.map((p, idx) => {
                      const isConforme = Array.isArray(audit.respostas) && audit.respostas.length > idx ? audit.respostas[idx] : (idx < (audit.pontos || 10));

                      return (
                        <div key={idx} className="p-2.5 bg-[#111a30] border border-slate-800/80 rounded-lg flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                              Item {idx + 1}: {p.senso}
                            </span>
                            <p className="text-xs text-slate-300 font-medium">
                              {p.pergunta}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                            isConforme ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {isConforme ? 'CONFORME' : 'NÃO CONFORME'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* OBSERVAÇÕES */}
                  <div className="p-3 bg-[#111a30] border border-slate-800 rounded-xl text-xs text-slate-300 shrink-0">
                    <span className="block font-bold text-[10px] uppercase text-slate-400 mb-0.5">Observações / Não Conformidades Registradas</span>
                    <p className="italic text-slate-300">
                      {audit.observacoesNaoConforme || '5s realizado com sucesso'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-slate-800 shrink-0">
                    <button
                      onClick={() => setSelectedAuditDetail(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-[11px] cursor-pointer"
                    >
                      Fechar Detalhes
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── SEÇÃO 3: CONTROLE QUINZENAL DE PRAGAS (IMPORTAÇÃO PDF) ── */}
      {activeSubTab === 'pragas' && (
        <div className="bg-[#111a30] border border-emerald-500/30 rounded-2xl p-6 space-y-6 shadow-xl">
          
          {/* BANNER AUTOMÁTICO DE LEMBRETE NOS DIAS 15 E 30 DO MÊS */}
          {(() => {
            const todayDay = new Date().getDate();
            const isDay15or30 = todayDay === 15 || todayDay === 30 || todayDay === 14 || todayDay === 16 || todayDay === 29 || todayDay === 31;
            
            if (!isDay15or30) return null;

            return (
              <div className="p-4 bg-amber-950/80 border-2 border-amber-500 rounded-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl shrink-0">
                    <Bell className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/30 px-2.5 py-0.5 rounded-md border border-amber-400/40">
                      🔔 ALERTA DE RENOVAÇÃO QUINZENAL - DIA 15 / DIA 30
                    </span>
                    <h4 className="text-xs font-black text-white uppercase mt-1">
                      Lembrete Automático de Atualização do Certificado de Controle de Pragas
                    </h4>
                    <p className="text-xs text-amber-100 font-medium mt-0.5">
                      Hoje é dia <strong className="text-amber-300 underline font-mono">{todayDay}</strong> do mês. É dia de importar o novo Certificado/Laudo Quinzenal de Desratização, Dedetização e Sanificação em formato PDF.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPragasModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shrink-0"
                >
                  Importar Laudo Hoje
                </button>
              </div>
            );
          })()}

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5 text-emerald-400" /> CONTROLE SANITÁRIO E VETORES (GUARABIRA)
                </span>
                <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-md">
                  Periodicidade Exigida: Quinzenal (15 Dias)
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-2 flex items-center gap-2">
                Importação do Controle Quinzenal de Pragas (Laudos PDF)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload e arquivamento oficial dos laudos técnicos de desratização, dedetização e sanificação emitidos pela empresa especializada.
              </p>
            </div>

            <button
              onClick={() => setShowPragasModal(!showPragasModal)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg"
            >
              <Upload className="w-4 h-4 text-emerald-200" />
              {showPragasModal ? 'Fechar Formularização' : '+ Importar Laudo Quinzenal (PDF)'}
            </button>
          </div>

          {/* CARD DO STATUS ATUAL DO LAUDO VIGENTE */}
          {laudosPragas.length > 0 && (() => {
            const latest = laudosPragas[0];
            const statusInfo = getPestStatus(latest.dataVencimento);

            return (
              <div className={`p-5 bg-[#0b1222] border-2 ${statusInfo.bgCard} rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl shrink-0">
                    <FileCheck className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black border uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        Certificado: #{latest.numeroCertificado}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-white">
                      {latest.empresaEspecializada}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-300 pt-1">
                      <div><span className="text-slate-500">Execução:</span> <strong>{new Date(latest.dataExecucao + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></div>
                      <div><span className="text-slate-500">Validade Até:</span> <strong className="text-emerald-400 font-mono">{new Date(latest.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></div>
                      <div><span className="text-slate-500">Resp. Técnico:</span> <strong>{latest.responsavelTecnico}</strong></div>
                      <div><span className="text-slate-500">Arquivo PDF:</span> <strong className="text-cyan-300 underline font-mono">{latest.fileName}</strong></div>
                    </div>

                    {latest.observacoes && (
                      <p className="text-[11px] text-slate-400 italic pt-1">
                        "{latest.observacoes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto flex-wrap">
                  {latest.arquivos && latest.arquivos.length > 0 ? (
                    latest.arquivos.map((arq, idx) => (
                      <button
                        key={idx}
                        onClick={() => downloadDataUrl(arq.fileDataUrl, arq.fileName)}
                        className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                        title={`Baixar ${arq.fileName}`}
                      >
                        <Download className="w-4 h-4" /> Baixar PDF {latest.arquivos!.length > 1 ? `#${idx + 1}` : ''}
                      </button>
                    ))
                  ) : latest.fileDataUrl ? (
                    <button
                      onClick={() => downloadDataUrl(latest.fileDataUrl, latest.fileName)}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Baixar PDF
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic">PDF de Exemplo Integrado</span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* FORMULARIO DE IMPORTACAO DE LAUDO PDF */}
          {showPragasModal && (
            <form onSubmit={handleSavePragasLaudo} className="bg-[#0b1222] border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-400" /> Formuário de Anexo e Cadastro do Laudo Quinzenal de Pragas
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Suporta múltiplos arquivos PDF (.pdf)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Empresa Especializada *</label>
                  <input
                    type="text"
                    value={empresaEspecializada}
                    onChange={(e) => setEmpresaEspecializada(e.target.value)}
                    placeholder="Ex: Imunizadora & Dedetizadora Guarabira LTDA"
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nº Certificado / Laudo *</label>
                  <input
                    type="text"
                    value={numCertificado}
                    onChange={(e) => setNumCertificado(e.target.value)}
                    placeholder="Ex: CERT-PRAGAS-2026/015"
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Responsável Técnico / Conselho *</label>
                  <input
                    type="text"
                    value={respTecnico}
                    onChange={(e) => setRespTecnico(e.target.value)}
                    placeholder="Ex: Dr. Fernando Arcoverde (CRQ/CRBio)"
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Data de Execução *</label>
                  <input
                    type="date"
                    value={dataExecucaoPragas}
                    onChange={(e) => {
                      setDataExecucaoPragas(e.target.value);
                      if (e.target.value) {
                        const d = new Date(e.target.value);
                        d.setDate(d.getDate() + 15);
                        setDataVencimentoPragas(d.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Data de Vencimento (Validade 15 Dias) *
                  </label>
                  <input
                    type="date"
                    value={dataVencimentoPragas}
                    onChange={(e) => setDataVencimentoPragas(e.target.value)}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Anexos do Laudo (Múltiplos PDFs) *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileChange}
                    className="w-full bg-[#111a30] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-emerald-500 file:text-slate-950 hover:file:bg-emerald-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                    💡 Pressione Ctrl/Cmd ou Shift para selecionar múltiplos arquivos PDF simultaneamente.
                  </span>
                </div>
              </div>

              {/* LISTA DE ARQUIVOS ANEXADOS / SELECIONADOS */}
              {selectedPdfFiles.length > 0 && (
                <div className="p-3 bg-[#070d19] border border-emerald-500/30 rounded-xl space-y-2">
                  <div className="text-[11px] font-black uppercase text-emerald-400 flex items-center justify-between">
                    <span>Arquivos Selecionados ({selectedPdfFiles.length})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPdfFiles([])}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remover todos
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPdfFiles.map((fileItem, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-2 text-xs text-slate-200 font-mono"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={fileItem.fileName}>
                          {fileItem.fileName}
                        </span>
                        {fileItem.size && <span className="text-[10px] text-slate-400">({fileItem.size})</span>}
                        <button
                          type="button"
                          onClick={() => handleRemovePdfFile(idx)}
                          className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                          title="Remover este arquivo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Observações Técnicas / Perímetros Inspecionados</label>
                <textarea
                  rows={2}
                  value={obsPragas}
                  onChange={(e) => setObsPragas(e.target.value)}
                  placeholder="Ex: Aplicação de gel raticida e cupinicida nas áreas do armazém e docas. Sem pragas ativas encontradas."
                  className="w-full bg-[#111a30] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPragasModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-emerald-200" /> Salvar & Importar {selectedPdfFiles.length > 1 ? `${selectedPdfFiles.length} Laudos PDF` : 'Laudo PDF'}
                </button>
              </div>
            </form>
          )}

          {/* HISTÓRICO DE LAUDOS QUINZENAIS */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#131d38] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <strong className="text-xs text-white uppercase tracking-wider font-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Histórico de Laudos Quinzenais de Pragas Importados
              </strong>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-[#0b1222] border border-slate-700 rounded-lg px-2.5 py-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Filtrar Mês:</span>
                  <select
                    value={selectedPragasMonth}
                    onChange={(e) => setSelectedPragasMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-emerald-400 outline-none cursor-pointer"
                  >
                    <option value="todos" className="bg-[#0b1222] text-white">Todos os Meses</option>
                    <option value="08/2026" className="bg-[#0b1222] text-white">Agosto / 2026</option>
                    <option value="07/2026" className="bg-[#0b1222] text-white">Julho / 2026</option>
                    <option value="06/2026" className="bg-[#0b1222] text-white">Junho / 2026</option>
                    <option value="05/2026" className="bg-[#0b1222] text-white">Maio / 2026</option>
                  </select>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  Total: {
                    laudosPragas.filter(l => {
                      if (selectedPragasMonth === 'todos') return true;
                      const [year, month] = l.dataExecucao.split('-');
                      return `${month}/${year}` === selectedPragasMonth;
                    }).length
                  } Laudo(s)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0b1222] text-slate-400 text-[10px] uppercase border-b border-slate-800 font-black">
                    <th className="p-3">Nº Certificado</th>
                    <th className="p-3">Empresa Especializada</th>
                    <th className="p-3">Data Execução</th>
                    <th className="p-3">Data Vencimento</th>
                    <th className="p-3">Status Validade</th>
                    <th className="p-3">Arquivo PDF</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans text-xs">
                  {laudosPragas
                    .filter(l => {
                      if (selectedPragasMonth === 'todos') return true;
                      const [year, month] = l.dataExecucao.split('-');
                      return `${month}/${year}` === selectedPragasMonth;
                    })
                    .map((laudo) => {
                    const statusInfo = getPestStatus(laudo.dataVencimento);

                    return (
                      <tr key={laudo.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-white">
                          #{laudo.numeroCertificado}
                        </td>
                        <td className="p-3 font-bold text-slate-200">
                          {laudo.empresaEspecializada}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Resp: {laudo.responsavelTecnico}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {new Date(laudo.dataExecucao + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">
                          {new Date(laudo.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black border uppercase ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          {laudo.arquivos && laudo.arquivos.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {laudo.arquivos.map((arq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => downloadDataUrl(arq.fileDataUrl, arq.fileName)}
                                  className="text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 transition-colors text-left cursor-pointer"
                                  title={`Baixar ${arq.fileName}`}
                                >
                                  <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate max-w-[180px]">{arq.fileName}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button
                              onClick={() => downloadDataUrl(laudo.fileDataUrl, laudo.fileName)}
                              className="text-cyan-300 hover:text-cyan-200 underline flex items-center gap-1 transition-colors text-left cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{laudo.fileName}</span>
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {laudo.arquivos && laudo.arquivos.length > 0 ? (
                              laudo.arquivos.map((arq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => downloadDataUrl(arq.fileDataUrl, arq.fileName)}
                                  className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                  title={`Baixar ${arq.fileName}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  {laudo.arquivos!.length > 1 && <span>#{idx + 1}</span>}
                                </button>
                              ))
                            ) : laudo.fileDataUrl ? (
                              <button
                                onClick={() => downloadDataUrl(laudo.fileDataUrl, laudo.fileName)}
                                className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg border border-emerald-500/30 transition-all cursor-pointer"
                                title="Baixar Laudo PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                            <button
                              onClick={() => handleDeletePragasLaudo(laudo.id)}
                              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                              title="Excluir Laudo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* ── SEÇÃO 4: RONDA DE QUALIDADE SEMANAL GSA ── */}
      {activeSubTab === 'ronda_gsa' && (
        <RondaGsaComponent user={user} empresaId={empresa?.id} />
      )}

      {/* ── SEÇÃO 5: QUADRO DE AÇÕES DPO (QUALIDADE & 5S) ── */}
      {activeSubTab === 'acoes' && (
        <div className="animate-fadeIn space-y-6">
          <QuadroAcoesDpo
            user={user}
            empresa={empresa}
            theme={theme || 'dark'}
            processoFilter="Qualidade"
            title="Quadro de Ações — Qualidade, 5S & Auditorias"
            subtitle="Planos de ação 5W2H, contramedidas de auditoria 5S, controle térmico e desvios de pragas/GSA."
            onBack={() => setActiveSubTab('temperatura')}
          />
        </div>
      )}

      {/* MODAL OFICIAL DIGITAL DE AUDITORIA 5S (ADAPTADO MOBILE & PRINT/UPLOAD PDF) */}
      <Official5SDigitalAuditModal
        isOpen={is5SDigitalModalOpen}
        onClose={() => setIs5SDigitalModalOpen(false)}
        initialAudit={currentAuditoriaFrota}
        defaultMonth={selectedMonth5S}
        defaultYear={selectedYear5S}
        defaultArea="Armazém Geral"
        defaultAuditor="Pedro Bruno (Setor de Frota)"
        defaultAuditado="Djeanderson Soares"
        onSave={(savedAudit) => {
          setAuditoriasFrota(prev => {
            const filtered = prev.filter(a => !(a.ano === savedAudit.ano && a.mes === savedAudit.mes));
            const nextList = [savedAudit, ...filtered];
            localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(nextList));
            return nextList;
          });
          reloadAudits();
        }}
        user={user}
      />

      <Checklist5SModal
        isOpen={is5SModalOpen}
        onClose={() => setIs5SModalOpen(false)}
        defaultSetor={selected5SSetor}
        user={user}
        onSaveSuccess={reloadAudits}
      />

      <ImportExport5SModal
        isOpen={is5SImportModalOpen}
        onClose={() => setIs5SImportModalOpen(false)}
        onDataUpdated={reloadAudits}
      />

      {/* DEDICATED ACTION MODAL (FILTERED FOR QUALIDADE, 5S, TEMPERATURA, RODA DE QUALIDADE, CONTROLE DE PRAGAS) */}
      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Qualidade, 5S & Conformidade"
        indicatorSubtitle="Visualizando e gerenciando apenas os planos de ação e contramedidas 5W2H de 5S, Temperatura, Roda de Qualidade, Ronda GSA e Controle de Pragas."
        indicatorBadge="QUALIDADE DPO"
        allowedProcessos={['5S', 'Temperatura', 'Roda de Qualidade', 'Ronda GSA', 'Controle de Pragas', 'Qualidade', 'GSA', 'Pragas']}
        defaultProcesso="Qualidade"
        defaultIndicador="Conformidade de Qualidade (5S, Temperatura, Ronda GSA e Pragas)"
        defaultMeta="100% Conformidade / 5S ≥ 80%"
        user={user}
      />

      {/* MODAL PADRÃO DE RECOLHIMENTO DE TEMPERATURA (POP/LUP) */}
      <PadraoRecolhimentoTemperaturaModal
        isOpen={isPadraoTempModalOpen}
        onClose={() => setIsPadraoTempModalOpen(false)}
      />
    </div>
  );
}
