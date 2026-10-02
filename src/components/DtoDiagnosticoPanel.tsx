import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa } from '../types';
import { 
  DtoOperacaoId, 
  DtoRegistro, 
  DtoItemResposta, 
  DtoPlanoAcao,
  DtoOperacaoConfig 
} from '../types/dto';
import { DTO_OPERACOES_CONFIG, INITIAL_DTO_HISTORICO_MOCK } from '../data/dtoOperacoesData';
import { DtoService } from '../services/dtoService';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  Search, 
  Filter, 
  PlusCircle, 
  Calendar, 
  History, 
  Award, 
  BarChart3, 
  Printer, 
  Download, 
  Upload, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Droplets, 
  Truck, 
  Container, 
  Layers, 
  CalendarCheck, 
  ShieldCheck, 
  Trash, 
  Check, 
  X, 
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  Zap,
  Eye,
  Sliders,
  Sparkles,
  Info,
  FileCode,
  FileUp
} from 'lucide-react';

import { firestoreDb } from '../database/firestoreDatabase';

interface DtoDiagnosticoPanelProps {
  user: Usuario | null;
  empresa?: Empresa | null;
  theme?: 'light' | 'dark';
  initialOperacaoId?: DtoOperacaoId;
  onNavigate?: (panel: string) => void;
}

export default function DtoDiagnosticoPanel({
  user,
  empresa,
  theme = 'light',
  initialOperacaoId = 'repack',
  onNavigate
}: DtoDiagnosticoPanelProps) {
  const [activeTab, setActiveTab] = useState<'formulario' | 'historico' | 'estatisticas'>('formulario');
  const [selectedOperacaoId, setSelectedOperacaoId] = useState<DtoOperacaoId>(initialOperacaoId);

  // Sincroniza quando initialOperacaoId mudar
  useEffect(() => {
    if (initialOperacaoId) {
      setSelectedOperacaoId(initialOperacaoId);
      setActiveTab('formulario');
    }
  }, [initialOperacaoId]);

  // Listener para eventos customizados de troca de operação
  useEffect(() => {
    const handleOpenDto = (e: any) => {
      const op = e.detail?.operacao || e.detail;
      if (op && DTO_OPERACOES_CONFIG.some(o => o.id === op)) {
        setSelectedOperacaoId(op as DtoOperacaoId);
        setActiveTab('formulario');
      }
    };
    window.addEventListener('open_dto_operacao', handleOpenDto);
    return () => window.removeEventListener('open_dto_operacao', handleOpenDto);
  }, []);
  
  // Storage state
  const [historico, setHistorico] = useState<DtoRegistro[]>([]);
  const [selectedRegistroVisualizar, setSelectedRegistroVisualizar] = useState<DtoRegistro | null>(null);

  // Form State
  const [dataDto, setDataDto] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [horaDto, setHoraDto] = useState<string>(() => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  const [tipoDtoCategoria, setTipoDtoCategoria] = useState<DtoRegistro['tipoDtoCategoria']>('dto_padrao');
  const [tipoPacote, setTipoPacote] = useState<DtoRegistro['tipoPacote']>('Geral');
  const [metaBatida, setMetaBatida] = useState<boolean>(true);
  const [origemMovimentacao, setOrigemMovimentacao] = useState<string>('Armazém (Movimentação Interna)');
  const [motivoDto, setMotivoDto] = useState<DtoRegistro['motivoDto']>('auditoria_rotina');
  const [metaEsperada, setMetaEsperada] = useState<string>('Procedimento padrão e metas de movimentação 100% cumpridos');
  const [resultadoRealizado, setResultadoRealizado] = useState<string>('🟢 TUDO BATENDO (100% Conforme)');
  const [indicadorOfensor, setIndicadorOfensor] = useState<string>('');
  const [avaliadorNome, setAvaliadorNome] = useState<string>(user?.nome || 'Supervisor Marcelo Dantas');
  const [avaliadorCargo, setAvaliadorCargo] = useState<string>(user?.cargo || 'Supervisor DPO Armazém');
  const [colaboradorNome, setColaboradorNome] = useState<string>('Gladson Barbosa (G1145)');
  const [turno, setTurno] = useState<DtoRegistro['turno']>('1º Turno');
  const [linhaOuBox, setLinhaOuBox] = useState<string>('Rua 04 - Armazém / Bloco Pulmão');
  const [observacaoGeral, setObservacaoGeral] = useState<string>('DTO realizado dentro das normas DPO de movimentação interna no armazém.');
  
  // Respostas do formulário
  const [respostas, setRespostas] = useState<Record<string, DtoItemResposta>>({});
  
  // Plano de Ação
  const [planoAcao, setPlanoAcao] = useState<DtoPlanoAcao>({
    oQueFazer: '',
    responsavel: '',
    prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    comoFazer: '',
    status: 'pendente'
  });

  // Filtros do Histórico
  const [filtroOperacao, setFiltroOperacao] = useState<string>('todos');
  const [filtroTipoDto, setFiltroTipoDto] = useState<string>('todos');
  const [filtroTipoPacote, setFiltroTipoPacote] = useState<string>('todos');
  const [filtroMetaBatida, setFiltroMetaBatida] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroMotivo, setFiltroMotivo] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('');
  const [filtroDataFim, setFiltroDataFim] = useState<string>('');

  // Modal de Importação JSON
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Exemplo de template DTO padrão solicitado pelo usuário
  const DTO_SAMPLE_JSON = JSON.stringify({
    "id": "DTO-REPACK-202601-001",
    "modulo": "Repack (Reembalagem de Avarias)",
    "dataAplicacao": "2026-01-04",
    "gatilho": "Meta Não Batida (Gatilho DPO)",
    "colaboradorAvaliado": "Antônio Marcos Lima",
    "avaliador": "Supervisor Marcelo Dantas",
    "turno": "1º Turno (Manhã)",
    "posto": "Box de Repack 02",
    "checklist": [
      {
        "itemId": "01",
        "titulo": "Uso integral de EPIs obrigatórios",
        "categoria": "Segurança & EPI",
        "resposta": "SIM"
      },
      {
        "itemId": "02",
        "titulo": "Organização e 5S da bancada de repack",
        "categoria": "Registro & 5S",
        "resposta": "SIM"
      },
      {
        "itemId": "03",
        "titulo": "Triagem e segregação prévia por SKU e Lote",
        "categoria": "Qualidade & FEFO",
        "resposta": "SIM"
      },
      {
        "itemId": "04",
        "titulo": "Inspeção visual contra microfissuras e vazamentos",
        "categoria": "Qualidade & FEFO",
        "resposta": "SIM"
      },
      {
        "itemId": "05",
        "titulo": "Padrão de fitamento / fechamento do fardo",
        "categoria": "Procedimento & Padrão",
        "resposta": "SIM"
      },
      {
        "itemId": "06",
        "titulo": "Apontamento de caixas e perdas em tempo real",
        "categoria": "Registro & 5S",
        "resposta": "SIM"
      },
      {
        "itemId": "07",
        "titulo": "Cadência e ritmo de produção (Meta cx/h)",
        "categoria": "Produtividade & Tempo",
        "resposta": "SIM"
      },
      {
        "itemId": "08",
        "titulo": "Identificação e endereçamento de produto liberado",
        "categoria": "Procedimento & Padrão",
        "resposta": "SIM"
      }
    ],
    "resumo": {
      "conformes": 8,
      "naoConformes": 0,
      "percentualAderencia": 100,
      "classificacao": "Bom"
    },
    "parecerFinal": "Time engajado e com bom controle de FEFO na triagem. Parabenizar colaboradores no DDS.",
    "registradoEm": "2026-01-04T17:44:00-03:00"
  }, null, 2);

  // Manipulador de upload de arquivo .json
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
        setImportError(null);
      } catch (err: any) {
        setImportError('Erro ao ler o arquivo JSON: ' + err.message);
      }
    };
    reader.onerror = () => {
      setImportError('Falha na leitura do arquivo local.');
    };
    reader.readAsText(file);
    // Limpa o input para permitir selecionar o mesmo arquivo novamente se quiser
    e.target.value = '';
  };

  // Executa a importação
  const handleExecuteImport = () => {
    if (!importJsonText.trim()) {
      setImportError('Por favor, cole o código JSON ou selecione um arquivo para importar.');
      return;
    }

    try {
      const parsed = JSON.parse(importJsonText);
      const companyId = empresa?.id || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
      const result = DtoService.importFromJson(parsed, companyId);
      
      if (result.success) {
        const updatedList = DtoService.getHistorico(companyId);
        setHistorico(updatedList);
        setIsImportModalOpen(false);
        setImportJsonText('');
        setImportError(null);
        showToast(`Sucesso: ${result.count} registro(s) de DTO importado(s) e sincronizados!`, 'success');
      } else {
        setImportError(result.error || 'Não foi possível processar os registros de DTO.');
      }
    } catch (err: any) {
      setImportError('JSON inválido ou corrompido: ' + err.message);
    }
  };

  // Carrega histórico e sincroniza com Firestore
  useEffect(() => {
    const companyId = empresa?.id || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
    
    // Initial local load (always contains 16 monthly DTOs + any custom records)
    const localData = DtoService.getHistorico(companyId);
    setHistorico(localData);

    // Subscribe to Firestore for real-time changes
    const unsubscribe = firestoreDb.subscribe<DtoRegistro>('dto_diagnosticos', companyId, (remoteDtos) => {
      // Build map starting with official 16 monthly DTOs
      const map = new Map<string, DtoRegistro>();
      INITIAL_DTO_HISTORICO_MOCK.forEach(r => {
        map.set(r.id, { ...r, empresaId: companyId });
      });

      // Overlay remote DTOs from Firestore if any exist
      if (remoteDtos && remoteDtos.length > 0) {
        remoteDtos.forEach(r => {
          if (r && r.id && !['dto-reg-101', 'dto-reg-102', 'dto-reg-103'].includes(r.id)) {
            map.set(r.id, { ...r, empresaId: companyId });
          }
        });
      } else {
        // Automatically sync initial DTOs to Firestore if empty
        firestoreDb.batchUpsert('dto_diagnosticos', INITIAL_DTO_HISTORICO_MOCK.map(r => ({ ...r, empresaId: companyId })), companyId).catch(() => {});
      }

      // Also overlay local custom items
      const local = DtoService.getHistorico(companyId);
      local.forEach(r => {
        if (r && r.id) {
          map.set(r.id, r);
        }
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.dataHoraISO || b.criadoEm || b.data || 0).getTime() - new Date(a.dataHoraISO || a.criadoEm || a.data || 0).getTime()
      );

      setHistorico(merged);
      try {
        const key = companyId ? `armazem_dto_historico_registros_v1_${companyId}` : 'armazem_dto_historico_registros_v1';
        localStorage.setItem(key, JSON.stringify(merged));
        localStorage.setItem('armazem_dto_historico_registros_v1', JSON.stringify(merged));
      } catch {}
    });

    const handleUpdate = () => {
      const data = DtoService.getHistorico(companyId);
      setHistorico(data);
    };
    window.addEventListener('dto_historico_updated', handleUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('dto_historico_updated', handleUpdate);
    };
  }, [empresa?.id]);

  // Configuração da operação ativa
  const operacaoConfig = useMemo(() => {
    return DTO_OPERACOES_CONFIG.find(op => op.id === selectedOperacaoId) || DTO_OPERACOES_CONFIG[0];
  }, [selectedOperacaoId]);

  // Limpa/inicializa respostas ao trocar de operação
  const handleSelectOperacao = (opId: DtoOperacaoId) => {
    setSelectedOperacaoId(opId);
    setRespostas({});
  };

  // Responde item
  const handleRespostaChange = (itemId: string, conforme: boolean) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        conforme,
        observacao: prev[itemId]?.observacao || ''
      }
    }));
  };

  const handleObservacaoItemChange = (itemId: string, obs: string) => {
    setRespostas(prev => ({
      ...prev,
      [itemId]: {
        itemId,
        conforme: prev[itemId]?.conforme ?? false,
        observacao: obs
      }
    }));
  };

  // Preencher DTO Padrão (Tudo Batendo 100%)
  const handlePreencherDtoPadrao = () => {
    setTipoDtoCategoria('dto_padrao');
    setMetaBatida(true);
    setMotivoDto('auditoria_rotina');
    setMetaEsperada('Padrão DPO de movimentação interna no armazém 100% cumprido, 5S e liberação < 15 min');
    setResultadoRealizado('🟢 TUDO BATENDO (100% Conforme) - Procedimento cumprido com excelência no armazém');
    setIndicadorOfensor('Nenhum desvio operacional');
    setOrigemMovimentacao('Armazém (Movimentação Interna)');

    const newRespostas: Record<string, DtoItemResposta> = {};
    operacaoConfig.itens.forEach(item => {
      newRespostas[item.id] = {
        itemId: item.id,
        conforme: true,
        observacao: 'Padrão operacional rigorosamente atendido.'
      };
    });
    setRespostas(newRespostas);
    showToast('DTO Padrão configurado: 100% dos itens conformes (Tudo Batendo).', 'success');
  };

  // Preencher DTO Indicador de Metas de Pacote (90% Batendo / 10% Desvio)
  const handlePreencherDtoIndicadorMeta = (baterMeta: boolean = true) => {
    setTipoDtoCategoria('dto_indicador_metas');
    setMetaBatida(baterMeta);
    setOrigemMovimentacao('Armazém (Movimentação Interna)');

    const pacoteSelecionado = tipoPacote && tipoPacote !== 'Geral' ? tipoPacote : 'Lata';
    if (baterMeta) {
      setMotivoDto('auditoria_rotina');
      setMetaEsperada(`Meta de quebra no armazém para pacote ${pacoteSelecionado}: Índice < 0,08%`);
      setResultadoRealizado(`🟢 META BATIDA (90% Meta) - Realizado: 0,04% para ${pacoteSelecionado}`);
      setIndicadorOfensor(`Nenhum ofensor crítico no pacote ${pacoteSelecionado}`);
      
      const newRespostas: Record<string, DtoItemResposta> = {};
      operacaoConfig.itens.forEach(item => {
        newRespostas[item.id] = {
          itemId: item.id,
          conforme: true,
          observacao: `Verificação de conformidade do pacote ${pacoteSelecionado} no padrão DPO.`
        };
      });
      setRespostas(newRespostas);
      showToast(`DTO Indicador de Metas configurado: Meta do pacote ${pacoteSelecionado} 100% batida!`, 'success');
    } else {
      setMotivoDto('meta_nao_batida');
      setMetaEsperada(`Meta de quebra no armazém para pacote ${pacoteSelecionado}: Índice < 0,08%`);
      setResultadoRealizado(`🔴 META NÃO BATIDA (10% Desvio) - Realizado: 0,16% para ${pacoteSelecionado}`);
      setIndicadorOfensor(`Paletização instável ou filme stretch frouxo gerou quebra na curva de manobra`);
      
      const newRespostas: Record<string, DtoItemResposta> = {};
      operacaoConfig.itens.forEach((item, idx) => {
        const isDesvio = idx === 2 || idx === 7; // Itens de causa raiz e meta
        newRespostas[item.id] = {
          itemId: item.id,
          conforme: !isDesvio,
          observacao: isDesvio ? `Desvio de ${pacoteSelecionado} identificado no armazém exigindo plano de ação.` : 'Conforme padrão.'
        };
      });
      setRespostas(newRespostas);
      setPlanoAcao({
        oQueFazer: `Ajustar amarração do filme stretch e treinar manobras de transporte de ${pacoteSelecionado} no armazém`,
        responsavel: colaboradorNome || 'Gladson Barbosa (G1145)',
        prazo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        comoFazer: `Aumentar número de voltas de stretch na base e reforçar inspeção visual antes da movimentação`,
        status: 'pendente'
      });
      showToast(`DTO Indicador de Metas configurado: Desvio de 10% registrado para abertura de plano de ação.`, 'info');
    }
  };

  // Marcar todos como SIM
  const handleMarcarTodosSim = () => {
    const newRespostas: Record<string, DtoItemResposta> = {};
    operacaoConfig.itens.forEach(item => {
      newRespostas[item.id] = {
        itemId: item.id,
        conforme: true,
        observacao: respostas[item.id]?.observacao || 'Conforme padrão DPO.'
      };
    });
    setRespostas(newRespostas);
    showToast('Todos os itens foram marcados como CONFORME (SIM).', 'info');
  };

  // Limpar formulário
  const handleLimparFormulario = () => {
    setRespostas({});
    setColaboradorNome('');
    setMetaEsperada('');
    setResultadoRealizado('');
    setIndicadorOfensor('');
    setLinhaOuBox('');
    setObservacaoGeral('');
    setPlanoAcao({
      oQueFazer: '',
      responsavel: '',
      prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      comoFazer: '',
      status: 'pendente'
    });
    showToast('Formulário redefinido com sucesso.', 'info');
  };

  // Estatísticas do formulário atual
  const formStats = useMemo(() => {
    const totalItens = operacaoConfig.itens.length;
    let conformes = 0;
    let naoConformes = 0;
    let respondidos = 0;

    operacaoConfig.itens.forEach(item => {
      const resp = respostas[item.id];
      if (resp && resp.conforme !== null && resp.conforme !== undefined) {
        respondidos++;
        if (resp.conforme === true) {
          conformes++;
        } else {
          naoConformes++;
        }
      }
    });

    const percentual = respondidos > 0 ? Number(((conformes / totalItens) * 100).toFixed(1)) : 0;
    
    let classificacao: 'conforme' | 'atencao' | 'critico' = 'critico';
    if (percentual >= 90) {
      classificacao = 'conforme';
    } else if (percentual >= 75) {
      classificacao = 'atencao';
    } else {
      classificacao = 'critico';
    }

    return {
      totalItens,
      respondidos,
      conformes,
      naoConformes,
      percentual,
      classificacao,
      pendentes: totalItens - respondidos
    };
  }, [operacaoConfig, respostas]);

  // Salvar Registro de DTO
  const handleSalvarDto = (e: React.FormEvent) => {
    e.preventDefault();

    if (!colaboradorNome.trim()) {
      showToast('Por favor, informe o nome do colaborador ou equipe avaliada.', 'error');
      return;
    }

    if (formStats.respondidos === 0) {
      showToast('Preencha ao menos um item de checklist do DTO antes de salvar.', 'error');
      return;
    }

    const novoRegistro: DtoRegistro = {
      id: `dto-reg-${Date.now()}`,
      empresaId: empresa?.id,
      data: dataDto,
      hora: horaDto,
      dataHoraISO: new Date(`${dataDto}T${horaDto}:00`).toISOString(),
      operacaoId: selectedOperacaoId,
      operacaoNome: operacaoConfig.nome,
      tipoDtoCategoria: tipoDtoCategoria || 'dto_padrao',
      tipoPacote: tipoPacote || 'Geral',
      metaBatida: metaBatida ?? (formStats.percentual >= 90),
      origemMovimentacao: 'Armazém (Movimentação Interna)',
      motivoDto,
      metaEsperada: metaEsperada || undefined,
      resultadoRealizado: resultadoRealizado || undefined,
      indicadorOfensor: indicadorOfensor || undefined,
      avaliadorNome: avaliadorNome || user?.nome || 'Supervisor Marcelo Dantas',
      avaliadorCargo: avaliadorCargo || undefined,
      colaboradorNome,
      turno,
      linhaOuBox: linhaOuBox || undefined,
      respostas,
      totalItens: formStats.totalItens,
      itensConformes: formStats.conformes,
      itensNaoConformes: formStats.naoConformes,
      percentualConformidade: formStats.percentual,
      classificacao: formStats.classificacao,
      observacaoGeral: observacaoGeral || undefined,
      planoAcao: formStats.naoConformes > 0 && planoAcao.oQueFazer.trim() ? planoAcao : undefined,
      criadoEm: new Date().toISOString()
    };

    const sucesso = DtoService.saveRegistro(novoRegistro, empresa?.id);
    if (sucesso) {
      showToast(`DTO de ${operacaoConfig.tituloCurto} registrado com sucesso! (${formStats.percentual}% de aderência)`, 'success');
      // Redefine campos parciais
      setRespostas({});
      setColaboradorNome('Gladson Barbosa (G1145)');
      setObservacaoGeral('DTO realizado dentro das normas DPO de movimentação interna no armazém.');
      setPlanoAcao({
        oQueFazer: '',
        responsavel: '',
        prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        comoFazer: '',
        status: 'pendente'
      });
      // Abre histórico
      setActiveTab('historico');
    } else {
      showToast('Erro ao gravar DTO. Tente novamente.', 'error');
    }
  };

  // Excluir DTO do histórico
  const handleExcluirRegistro = (id: string, operacao: string) => {
    if (window.confirm(`Deseja realmente excluir o registro de DTO da operação ${operacao}?`)) {
      DtoService.deleteRegistro(id, empresa?.id);
      showToast('Registro excluído com sucesso.', 'info');
      if (selectedRegistroVisualizar?.id === id) {
        setSelectedRegistroVisualizar(null);
      }
    }
  };

  // Alternar status de plano de ação
  const handleToggleStatusPlano = (registro: DtoRegistro) => {
    if (!registro.planoAcao) return;
    const nextStatus = registro.planoAcao.status === 'concluido' ? 'em_andamento' : 'concluido';
    const updated: DtoRegistro = {
      ...registro,
      planoAcao: {
        ...registro.planoAcao,
        status: nextStatus
      }
    };
    DtoService.saveRegistro(updated, empresa?.id);
    showToast(`Status do plano de ação alterado para ${nextStatus.toUpperCase()}.`, 'info');
  };

  // Histórico filtrado
  const historicoFiltrado = useMemo(() => {
    return historico.filter(reg => {
      // Filtro Operacao
      if (filtroOperacao !== 'todos' && reg.operacaoId !== filtroOperacao) {
        return false;
      }
      // Filtro Tipo DTO
      if (filtroTipoDto !== 'todos') {
        const cat = reg.tipoDtoCategoria || (reg.classificacao === 'conforme' && reg.motivoDto !== 'meta_nao_batida' ? 'dto_padrao' : 'dto_indicador_metas');
        if (cat !== filtroTipoDto) return false;
      }
      // Filtro Pacote
      if (filtroTipoPacote !== 'todos') {
        if (reg.tipoPacote !== filtroTipoPacote) return false;
      }
      // Filtro Meta Batida
      if (filtroMetaBatida !== 'todos') {
        const isBatida = reg.metaBatida !== undefined ? reg.metaBatida : (reg.classificacao === 'conforme');
        if (filtroMetaBatida === 'sim' && !isBatida) return false;
        if (filtroMetaBatida === 'nao' && isBatida) return false;
      }
      // Filtro Status / Classificacao
      if (filtroStatus !== 'todos' && reg.classificacao !== filtroStatus) {
        return false;
      }
      // Filtro Motivo
      if (filtroMotivo !== 'todos' && reg.motivoDto !== filtroMotivo) {
        return false;
      }
      // Filtro Data Inicio
      if (filtroDataInicio && reg.data < filtroDataInicio) {
        return false;
      }
      // Filtro Data Fim
      if (filtroDataFim && reg.data > filtroDataFim) {
        return false;
      }
      // Busca texto
      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase();
        const matchColab = reg.colaboradorNome.toLowerCase().includes(q);
        const matchAvaliador = reg.avaliadorNome.toLowerCase().includes(q);
        const matchOp = reg.operacaoNome.toLowerCase().includes(q);
        const matchPacote = reg.tipoPacote?.toLowerCase().includes(q);
        const matchObs = reg.observacaoGeral?.toLowerCase().includes(q);
        const matchPlano = reg.planoAcao?.oQueFazer.toLowerCase().includes(q);
        return matchColab || matchAvaliador || matchOp || matchPacote || matchObs || matchPlano;
      }
      return true;
    });
  }, [historico, filtroOperacao, filtroTipoDto, filtroTipoPacote, filtroMetaBatida, filtroStatus, filtroMotivo, filtroDataInicio, filtroDataFim, buscaTexto]);

  // Estatísticas gerais
  const estatisticasGerais = useMemo(() => {
    return DtoService.getEstatisticas(empresa?.id);
  }, [historico, empresa?.id]);

  // Ícone por operação
  const getOpIcon = (opId: DtoOperacaoId) => {
    switch (opId) {
      case 'repack': return <Package className="w-4 h-4" />;
      case 'despejo': return <Droplets className="w-4 h-4" />;
      case 'quebras': return <AlertTriangle className="w-4 h-4" />;
      case 'efc': return <Truck className="w-4 h-4" />;
      case 'efd': return <Container className="w-4 h-4" />;
      case 'montagem': return <Layers className="w-4 h-4" />;
      case 'validades': return <CalendarCheck className="w-4 h-4" />;
      case 'blitz-puxada': return <ShieldCheck className="w-4 h-4" />;
      case 'blitz-refugo': return <Trash className="w-4 h-4" />;
      default: return <ClipboardCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 pb-12 transition-colors duration-200 ${
      theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
    }`}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-semibold transition-all animate-bounce ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 text-emerald-100 border-emerald-500/50'
            : toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-100 border-rose-500/50'
            : 'bg-blue-950 text-blue-100 border-blue-500/50'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className={`rounded-2xl p-4 sm:p-6 mb-6 border shadow-sm relative overflow-hidden backdrop-blur-md ${
        theme === 'dark'
          ? 'bg-[#11151c]/90 border-[#1c2530] text-slate-100'
          : 'bg-white/90 border-blue-200/80 shadow-[0_4px_25px_rgba(30,86,240,0.05)]'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                DPO • Ferramentas de Gestão
              </span>
              <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Padrão Ambev / DPO Armazém
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <ClipboardCheck className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              DTO - Diagnóstico do Trabalho Operacional
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-3xl ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Instrumento técnico aplicado prioritariamente <strong className="text-rose-500">quando a operação não bate a meta</strong> ou para auditoria de rotina, abrangendo as 9 frentes operacionais do armazém com cálculo automático de aderência e registro de auditoria permanente.
            </p>
          </div>

          {/* Quick Tabs */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={() => setActiveTab('formulario')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'formulario'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : theme === 'dark'
                  ? 'bg-[#151b23] text-slate-300 hover:bg-[#1c2530]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Aplicar Novo DTO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all relative ${
                activeTab === 'historico'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : theme === 'dark'
                  ? 'bg-[#151b23] text-slate-300 hover:bg-[#1c2530]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico Registrado</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-500 text-white">
                {historico.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('estatisticas')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'estatisticas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : theme === 'dark'
                  ? 'bg-[#151b23] text-slate-300 hover:bg-[#1c2530]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Indicadores & BI</span>
            </button>
          </div>
        </div>

        {/* Mini KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">DTOs Realizados</span>
              <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                {estatisticasGerais.total}
              </span>
            </div>
            <ClipboardCheck className="w-5 h-5 text-blue-500 opacity-60" />
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Média de Aderência</span>
              <span className={`text-base sm:text-lg font-black ${
                estatisticasGerais.mediaConformidade >= 90
                  ? 'text-emerald-500'
                  : estatisticasGerais.mediaConformidade >= 75
                  ? 'text-amber-500'
                  : 'text-rose-500'
              }`}>
                {estatisticasGerais.mediaConformidade}%
              </span>
            </div>
            <Award className="w-5 h-5 text-emerald-500 opacity-60" />
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gatilhos (Meta Não Batida)</span>
              <span className="text-base sm:text-lg font-black text-rose-500">
                {estatisticasGerais.metaNaoBatidaCount}
              </span>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-500 opacity-60" />
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between backdrop-blur-xs ${
            theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/70 border-slate-200/90 shadow-2xs'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Planos de Ação Pendentes</span>
              <span className="text-base sm:text-lg font-black text-amber-500">
                {estatisticasGerais.planosAcaoAbertos}
              </span>
            </div>
            <Sliders className="w-5 h-5 text-amber-500 opacity-60" />
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════
          ABA 1: FORMULÁRIO DE APLICAÇÃO DE DTO
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'formulario' && (
        <div className="space-y-6">
          
          {/* SELETOR DAS 9 OPERAÇÕES (CARD BRANCO) */}
          <div className={`rounded-2xl p-4 sm:p-5 border shadow-sm relative overflow-hidden backdrop-blur-md space-y-3 ${
            theme === 'dark'
              ? 'bg-[#11151c]/90 border-[#1c2530] text-slate-100'
              : 'bg-white/90 border-blue-200/80 shadow-[0_4px_25px_rgba(30,86,240,0.05)]'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>1. Selecione a Operação para o DTO:</span>
                <span className="text-blue-600 dark:text-blue-400 font-black">({DTO_OPERACOES_CONFIG.length} Operações Mapeadas)</span>
              </label>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Operação selecionada: <strong className="text-blue-600 dark:text-blue-400">{operacaoConfig.nome}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
              {DTO_OPERACOES_CONFIG.map(op => {
                const isSelected = op.id === selectedOperacaoId;
                const opCount = historico.filter(h => h.operacaoId === op.id).length;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => handleSelectOperacao(op.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 ring-2 ring-blue-400/50'
                        : theme === 'dark'
                        ? 'bg-[#151b23] border-[#222d3a] text-slate-300 hover:border-blue-500/40 hover:bg-[#1c2530]'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {getOpIcon(op.id)}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {op.sigla}
                      </span>
                    </div>
                    <div className="font-extrabold text-xs leading-tight line-clamp-1">
                      {op.tituloCurto}
                    </div>
                    <div className={`text-[10px] mt-1 flex items-center justify-between ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      <span>{op.itens.length} itens</span>
                      <span>{opCount} DTOs</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CARD DO FORMULÁRIO */}
          <form onSubmit={handleSalvarDto} className={`rounded-2xl border p-4 sm:p-6 space-y-6 backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            
            {/* CABEÇALHO DO DIAGNÓSTICO */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Cabeçalho da Auditoria • {operacaoConfig.badge}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Origem: Armazém (Movimentação Interna)
                    </span>
                  </div>
                  <h2 className="text-lg font-black">
                    Formulário de Diagnóstico Operacional: {operacaoConfig.nome}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {operacaoConfig.descricao}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePreencherDtoPadrao}
                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
                    title="Preenche como DTO Padrão: 100% Batendo no armazém"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    DTO Padrão (Tudo Batendo)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreencherDtoIndicadorMeta(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                    title="Preenche como Indicador de Metas de Pacote (90% Batendo Meta)"
                  >
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    Meta de Pacote (90% Batendo)
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePreencherDtoIndicadorMeta(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 cursor-pointer flex items-center gap-1.5 transition-all"
                    title="Preenche como Indicador de Metas com Desvio de 10% e Plano de Ação"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Meta de Pacote (10% Desvio)
                  </button>

                  <button
                    type="button"
                    onClick={handleLimparFormulario}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                </div>
              </div>

              {/* AVISO DE ESCOPO DPO E DIRETRIZ MENSAL */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Diretriz DPO:</strong> Por mês são gerados <strong>2 DTOs</strong> (1 Padrão 100% batendo + 1 Indicador de Metas de Pacote com taxa 90/10).
                    {selectedOperacaoId === 'quebras' && (
                      <span className="ml-1 text-amber-700 dark:text-amber-300 font-bold">
                        Exclusivo movimentação no armazém (qualquer movimentação externa não entra no DTO).
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* CAMPOS DO CABEÇALHO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
                {/* Tipo de Categoria do DTO */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Tipo de DTO *
                  </label>
                  <select
                    value={tipoDtoCategoria}
                    onChange={e => setTipoDtoCategoria(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      tipoDtoCategoria === 'dto_padrao'
                        ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-blue-500/60 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    <option value="dto_padrao">🟢 DTO Padrão (Tudo Batendo 100%)</option>
                    <option value="dto_indicador_metas">🎯 DTO Indicador de Metas de Pacote</option>
                  </select>
                </div>

                {/* Tipo de Pacote */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Tipo de Pacote / Embalagem *
                  </label>
                  <select
                    value={tipoPacote}
                    onChange={e => setTipoPacote(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Lata">Lata (350ml / 269ml Sleek)</option>
                    <option value="PET">PET (2L / 1L / 500ml)</option>
                    <option value="Garrafa 600ml">Garrafa 600ml (Retornável)</option>
                    <option value="Long Neck">Long Neck (330ml / 355ml)</option>
                    <option value="Litrinho">Litrinho (300ml Retornável)</option>
                    <option value="Geral">Geral / Multicategoria</option>
                  </select>
                </div>

                {/* Data e Hora */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Data e Hora da Aplicação *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={dataDto}
                      onChange={e => setDataDto(e.target.value)}
                      required
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                    <input
                      type="time"
                      value={horaDto}
                      onChange={e => setHoraDto(e.target.value)}
                      required
                      className={`w-24 px-2 py-2 rounded-xl border text-xs font-bold outline-none text-center ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Motivo do DTO */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Gatilho / Motivo do DTO *
                  </label>
                  <select
                    value={motivoDto}
                    onChange={e => setMotivoDto(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      motivoDto === 'meta_nao_batida'
                        ? 'border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : theme === 'dark'
                        ? 'bg-[#151b23] border-[#222d3a] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="auditoria_rotina">🔵 Auditoria de Rotina DPO</option>
                    <option value="meta_nao_batida">🔴 Meta Não Batida (Gatilho DPO)</option>
                    <option value="aumento_perdas">🟡 Aumento de Avarias / Perdas</option>
                    <option value="reciclagem_treinamento">🟣 Treinamento / Reciclagem</option>
                    <option value="solicitacao_gestao">⚪ Solicitação da Gestão</option>
                  </select>
                </div>
              </div>

              {/* SEGUNDA LINHA: Colaborador, Avaliador, Turno, Origem */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
                {/* Colaborador / Equipe */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Colaborador / Operador Avaliado *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Gladson Barbosa (G1145)"
                    value={colaboradorNome}
                    onChange={e => setColaboradorNome(e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Avaliador / Responsável */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Avaliador (Supervisor DPO)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Marcelo Dantas (Supervisor)"
                    value={avaliadorNome}
                    onChange={e => setAvaliadorNome(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Turno */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Turno
                  </label>
                  <select
                    value={turno}
                    onChange={e => setTurno(e.target.value as any)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="1º Turno">1º Turno (Manhã)</option>
                    <option value="2º Turno">2º Turno (Tarde/Noite)</option>
                    <option value="3º Turno">3º Turno (Madrugada)</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Geral">Geral / Misto</option>
                  </select>
                </div>

                {/* Local da Operação (Exclusivo Armazém) */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Localização no Armazém
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Rua 04 - Armazém / Bloco Pulmão"
                    value={linhaOuBox}
                    onChange={e => setLinhaOuBox(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* CAMPOS DE METAS: Meta Esperada e Realizado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Meta Operacional Esperada
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tempo de ciclo < 00:05:00 ou Índice de perda < 0,08%"
                    value={metaEsperada}
                    onChange={e => setMetaEsperada(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                    Resultado Realizado / Status da Meta
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 🟢 META BATIDA (Realizado 0,04%) ou 🔴 Desvio de 0,16%"
                    value={resultadoRealizado}
                    onChange={e => setResultadoRealizado(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* CHECKLIST DE ITENS DA OPERAÇÃO */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-black flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    Checklist de Verificação Operacional ({operacaoConfig.itens.length} Itens Técnicos)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Avalie cada critério marcando <strong className="text-emerald-500">SIM</strong> (Conforme) ou <strong className="text-rose-500">NÃO</strong> (Não Conforme).
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 block">Progresso da Avaliação</span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                    {formStats.respondidos} de {formStats.totalItens} respondidos ({Math.round((formStats.respondidos / formStats.totalItens) * 100)}%)
                  </span>
                </div>
              </div>

              {/* LISTA DOS ITENS */}
              <div className="space-y-3">
                {operacaoConfig.itens.map((item, index) => {
                  const resposta = respostas[item.id];
                  const isSim = resposta?.conforme === true;
                  const isNao = resposta?.conforme === false;
                  const isUnset = resposta?.conforme === null || resposta?.conforme === undefined;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isSim
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : isNao
                          ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/20'
                          : theme === 'dark'
                          ? 'bg-[#151b23]/50 border-[#222d3a]'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-xs shrink-0 mt-0.5 ${
                            isSim
                              ? 'bg-emerald-500 text-white'
                              : isNao
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.numero}
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold">
                                {item.pergunta}
                              </span>
                              <span className="text-[9px] px-2 py-0.2 rounded-full font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.categoria}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {item.descricaoTecnica}
                            </p>
                          </div>
                        </div>

                        {/* BOTÕES SIM / NÃO */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRespostaChange(item.id, true)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                              isSim
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>SIM</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRespostaChange(item.id, false)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                              isNao
                                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>NÃO</span>
                          </button>
                        </div>
                      </div>

                      {/* CAMPO DE OBSERVAÇÃO QUANDO NÃO CONFORME */}
                      {isNao && (
                        <div className="mt-3 pt-2.5 border-t border-rose-200/60 dark:border-rose-900/40">
                          <label className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3" />
                            Evidência / Motivo da Não Conformidade:
                          </label>
                          <input
                            type="text"
                            placeholder="Descreva o que foi observado fora do padrão técnico..."
                            value={resposta.observacao || ''}
                            onChange={e => handleObservacaoItemChange(item.id, e.target.value)}
                            className={`w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-xs font-medium outline-none ${
                              theme === 'dark' ? 'bg-[#151b23] text-white' : 'bg-white text-slate-800'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEÇÃO DO SCORE & ADERÊNCIA EM TEMPO REAL */}
            <div className={`p-4 sm:p-5 rounded-2xl border ${
              formStats.classificacao === 'conforme'
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : formStats.classificacao === 'atencao'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                    Resultado da Auditoria
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-3xl sm:text-4xl font-black ${
                      formStats.classificacao === 'conforme'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : formStats.classificacao === 'atencao'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formStats.percentual}%
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      formStats.classificacao === 'conforme'
                        ? 'bg-emerald-500 text-white'
                        : formStats.classificacao === 'atencao'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {formStats.classificacao === 'conforme'
                        ? '🟢 Conforme (≥ 90%)'
                        : formStats.classificacao === 'atencao'
                        ? '🟡 Atenção (75% a 89%)'
                        : '🔴 Crítico (< 75%)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formStats.conformes} conformes • {formStats.naoConformes} não conformes • {formStats.pendentes} pendentes de preenchimento.
                  </p>
                </div>

                {/* Barra de Progresso Visual */}
                <div className="w-full sm:w-64 space-y-1.5">
                  <div className="flex justify-between text-[11px] font-bold text-slate-400">
                    <span>Aderência DTO</span>
                    <span>{formStats.percentual}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        formStats.classificacao === 'conforme'
                          ? 'bg-emerald-500'
                          : formStats.classificacao === 'atencao'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${formStats.percentual}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO DO PLANO DE AÇÃO IMEDIATO (Quando houver Não Conformes) */}
            {formStats.naoConformes > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400">
                    Plano de Ação Corretivo 5W2H (Obrigatório devido a {formStats.naoConformes} item(ns) Não Conforme(s))
                  </h4>
                </div>
                <p className="text-xs text-slate-500">
                  Registre a ação imediata combinada com o colaborador para sanar o desvio e evitar nova quebra de meta.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      O que fazer? (Ação Corretiva Imediata) *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Reciclagem técnica no POP e conferência prévia da bancada..."
                      value={planoAcao.oQueFazer}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, oQueFazer: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Quem é o Responsável?
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos (Supervisor) / João (Operador)"
                      value={planoAcao.responsavel}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, responsavel: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Prazo Limite
                    </label>
                    <input
                      type="date"
                      value={planoAcao.prazo}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, prazo: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                      Como fazer? (Método)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Checklist diário de 5S e abastecimento de fitas antes de iniciar o turno..."
                      value={planoAcao.comoFazer}
                      onChange={e => setPlanoAcao(prev => ({ ...prev, comoFazer: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                        theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OBSERVAÇÃO GERAL */}
            <div>
              <label className="text-[11px] font-bold uppercase text-slate-400 block mb-1">
                Parecer Final / Observação do Avaliador
              </label>
              <textarea
                rows={2}
                placeholder="Observações complementares, elogios ou fatores externos que impactaram a operação..."
                value={observacaoGeral}
                onChange={e => setObservacaoGeral(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                  theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            {/* BOTÃO DE SALVAR & REGISTRAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="text-xs text-slate-400">
                Ao clicar em salvar, o DTO será gravado no histórico oficial com carimbo de data, hora e responsável.
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleLimparFormulario}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                >
                  Cancelar / Limpar
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Gravar e Registrar DTO ({formStats.percentual}%)</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          ABA 2: HISTÓRICO DE DTOS REGISTRADOS
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'historico' && (
        <div className="space-y-5">
          
          {/* BARRA DE FILTROS & BUSCA */}
          <div className={`p-4 rounded-2xl border space-y-3 backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por colaborador, avaliador, posto ou palavra-chave..."
                  value={buscaTexto}
                  onChange={e => setBuscaTexto(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium outline-none ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Botões de Ação Rápida */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => {
                    const res = DtoService.seedMonthlyRepackAndDespejoDtos(empresa?.id);
                    if (res.success) {
                      const updated = DtoService.getHistorico(empresa?.id);
                      setHistorico(updated);
                      showToast('16 DTOs mensais (Repack & Despejo - Jan a Ago/2026) sincronizados com sucesso!', 'success');
                    }
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/80 cursor-pointer transition-all shadow-xs"
                  title="Carregar DTOs mensais de 2026 para Repack e Despejo baseados nos dados reais da plataforma"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Carregar DTOs Mensais (2026)</span>
                </button>

                <button
                  type="button"
                  onClick={() => DtoService.exportToJson(empresa?.id)}
                  className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all"
                  title="Exportar todos os DTOs em formato JSON"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Exportar JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportError(null);
                    setIsImportModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/80 cursor-pointer transition-all shadow-xs"
                  title="Importar diagnósticos DTO em formato JSON"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Importar DTO</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Atenção: Deseja realmente zerar todos os registros de DTO para iniciar os diagnósticos verídicos? Esta ação limpará os dados locais e na nuvem.')) {
                      DtoService.clearAll(empresa?.id);
                      setHistorico([]);
                      setSelectedRegistroVisualizar(null);
                      showToast('Histórico de DTO zerado com sucesso. Pronto para iniciar os registros verídicos!', 'success');
                    }
                  }}
                  className="px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-rose-50 text-rose-600 border-rose-200 dark:hover:bg-rose-950/30 dark:border-rose-900/40 cursor-pointer transition-all"
                  title="Zerar todos os registros de DTO"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar DTOs</span>
                </button>
              </div>
            </div>

            {/* Linha de Filtros Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Operação</label>
                <select
                  value={filtroOperacao}
                  onChange={e => setFiltroOperacao(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todas as Operações</option>
                  {DTO_OPERACOES_CONFIG.map(op => (
                    <option key={op.id} value={op.id}>{op.tituloCurto} ({op.sigla})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tipo de DTO</label>
                <select
                  value={filtroTipoDto}
                  onChange={e => setFiltroTipoDto(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="dto_padrao">🟢 DTO Padrão (Tudo Batendo)</option>
                  <option value="dto_indicador_metas">🎯 DTO Indicador de Metas</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tipo de Pacote</label>
                <select
                  value={filtroTipoPacote}
                  onChange={e => setFiltroTipoPacote(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todos os Pacotes</option>
                  <option value="Lata">Lata</option>
                  <option value="PET">PET</option>
                  <option value="Garrafa 600ml">Garrafa 600ml</option>
                  <option value="Long Neck">Long Neck</option>
                  <option value="Litrinho">Litrinho</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status da Meta (90/10)</label>
                <select
                  value={filtroMetaBatida}
                  onChange={e => setFiltroMetaBatida(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todas as Metas</option>
                  <option value="sim">🟢 Meta Batida (90%)</option>
                  <option value="nao">🔴 Meta Não Batida (10%)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Classificação (%)</label>
                <select
                  value={filtroStatus}
                  onChange={e => setFiltroStatus(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none cursor-pointer ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="todos">Todas as Faixas</option>
                  <option value="conforme">🟢 Conforme (≥ 90%)</option>
                  <option value="atencao">🟡 Atenção (75% a 89%)</option>
                  <option value="critico">🔴 Crítico (&lt; 75%)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Data Específica</label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={e => setFiltroDataInicio(e.target.value)}
                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold outline-none ${
                    theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-white' : 'bg-white/80 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* LISTA DOS DTOS REGISTRADOS */}
          {historicoFiltrado.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 backdrop-blur-md ${
              theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200'
            }`}>
              <ClipboardCheck className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
              <h3 className="text-base font-bold text-slate-400">Nenhum DTO encontrado com os filtros selecionados</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Aplique um novo diagnóstico na aba "Aplicar Novo DTO" ou limpe os filtros para visualizar os registros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {historicoFiltrado.map(reg => {
                const isCritico = reg.classificacao === 'critico';
                const isAtencao = reg.classificacao === 'atencao';
                const isConforme = reg.classificacao === 'conforme';
                const isDtoPadrao = reg.tipoDtoCategoria === 'dto_padrao' || (!reg.tipoDtoCategoria && isConforme);
                const isMetaBatida = reg.metaBatida !== undefined ? reg.metaBatida : isConforme;

                return (
                  <div
                    key={reg.id}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all relative overflow-hidden group backdrop-blur-md ${
                      theme === 'dark'
                        ? 'bg-[#11151c]/90 border-[#1c2530] hover:border-blue-500/40'
                        : 'bg-white/90 border-slate-200/90 hover:border-blue-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Lado Esquerdo: Identificação & Operação */}
                      <div className="flex items-start gap-3.5">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                          isConforme
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : isAtencao
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}>
                          {getOpIcon(reg.operacaoId)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-black tracking-tight">
                              {reg.operacaoNome}
                            </span>

                            {/* Badge Tipo de DTO */}
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              isDtoPadrao
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                            }`}>
                              {isDtoPadrao ? '✓ DTO Padrão (100%)' : '🎯 Indicador de Metas'}
                            </span>

                            {/* Badge Tipo de Pacote */}
                            {reg.tipoPacote && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                Pacote: {reg.tipoPacote}
                              </span>
                            )}

                            {/* Badge Origem Armazém */}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              Armazém
                            </span>

                            {/* Status da Meta */}
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              isMetaBatida
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}>
                              {isMetaBatida ? '🟢 Meta Batida' : '🔴 Meta Não Batida'}
                            </span>

                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {reg.turno}
                            </span>
                            {reg.linhaOuBox && (
                              <span className="text-[10px] font-bold text-slate-400">
                                • {reg.linhaOuBox}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <strong>{new Date(reg.data + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> às {reg.hora}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Colaborador: <strong className="text-slate-700 dark:text-slate-300">{reg.colaboradorNome}</strong>
                            </span>
                            <span className="text-slate-400">
                              Avaliador: {reg.avaliadorNome}
                            </span>
                          </div>

                          {/* Motivo do DTO / Resultado Realizado */}
                          <div className="pt-1 flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              reg.motivoDto === 'meta_nao_batida'
                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {reg.motivoDto === 'meta_nao_batida' ? '🔴 Meta Não Batida' : '🔵 Auditoria DPO'}
                            </span>
                            {reg.metaEsperada && (
                              <span className="text-[11px] text-slate-500">
                                Meta: <strong className="text-slate-700 dark:text-slate-300">{reg.metaEsperada}</strong>
                              </span>
                            )}
                            {reg.resultadoRealizado && (
                              <span className={`text-[11px] font-bold ${isMetaBatida ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                • {reg.resultadoRealizado}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Score e Ações */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Aderência</span>
                          <span className={`text-2xl font-black ${
                            isConforme ? 'text-emerald-500' : isAtencao ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {reg.percentualConformidade}%
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {reg.itensConformes} de {reg.totalItens} SIM
                          </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRegistroVisualizar(reg)}
                            className="p-2 rounded-xl border text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 cursor-pointer transition-all"
                            title="Visualizar Espelho Completo do DTO"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExcluirRegistro(reg.id, reg.operacaoNome)}
                            className="p-2 rounded-xl border text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-all"
                            title="Excluir Registro de DTO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Resumo do Plano de Ação se Houver */}
                    {reg.planoAcao && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-500 shrink-0">Plano de Ação:</span>
                          <span className="text-slate-600 dark:text-slate-400 truncate max-w-xl">
                            {reg.planoAcao.oQueFazer}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleStatusPlano(reg)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider self-start sm:self-center cursor-pointer transition-all ${
                            reg.planoAcao.status === 'concluido'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}
                        >
                          {reg.planoAcao.status === 'concluido' ? '✓ Concluído' : '⏳ Em Andamento'}
                        </button>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          ABA 3: ESTATÍSTICAS & INDICADORES BI DO DTO
          ═════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'estatisticas' && (
        <div className="space-y-6">
          <div className={`p-4 sm:p-6 rounded-2xl border backdrop-blur-md ${
            theme === 'dark' ? 'bg-[#11151c]/90 border-[#1c2530]' : 'bg-white/90 border-slate-200/90 shadow-sm'
          }`}>
            <h3 className="text-base font-black flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Painel de Aderência DPO por Operação
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Média consolidada da % de conformidade calculada em cada um dos 9 postos de trabalho do armazém.
            </p>

            {/* Gráfico / Barras por Operação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DTO_OPERACOES_CONFIG.map(op => {
                const opStats = estatisticasGerais.porOperacao[op.id] || { count: 0, media: 0 };
                const temDados = opStats.count > 0;

                return (
                  <div
                    key={op.id}
                    className={`p-4 rounded-xl border space-y-3 backdrop-blur-xs ${
                      theme === 'dark' ? 'bg-[#151b23]/80 border-[#222d3a]' : 'bg-white/75 border-slate-200/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          {getOpIcon(op.id)}
                        </span>
                        <div>
                          <span className="text-xs font-bold block">{op.nome}</span>
                          <span className="text-[10px] text-slate-400">{opStats.count} DTOs aplicados</span>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${
                        !temDados
                          ? 'text-slate-400'
                          : opStats.media >= 90
                          ? 'text-emerald-500'
                          : opStats.media >= 75
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}>
                        {temDados ? `${opStats.media}%` : 'S/ DADOS'}
                      </span>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          !temDados
                            ? 'bg-slate-300'
                            : opStats.media >= 90
                            ? 'bg-emerald-500'
                            : opStats.media >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${temDados ? opStats.media : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL DE VISUALIZAÇÃO DETALHADA / ESPELHO DO DTO
          ═════════════════════════════════════════════════════════════════════ */}
      {selectedRegistroVisualizar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-5 my-8 relative max-h-[90vh] overflow-y-auto ${
            theme === 'dark' ? 'bg-[#11151c] border-[#1c2530] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setSelectedRegistroVisualizar(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho do Modal */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Registro Oficial de DTO • ID: {selectedRegistroVisualizar.id}
              </span>
              <h2 className="text-xl font-black mt-0.5">
                Espelho da Auditoria: {selectedRegistroVisualizar.operacaoNome}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                <span>Data: <strong>{new Date(selectedRegistroVisualizar.data + 'T12:00:00').toLocaleDateString('pt-BR')}</strong> às {selectedRegistroVisualizar.hora}</span>
                <span>Colaborador: <strong>{selectedRegistroVisualizar.colaboradorNome}</strong></span>
                <span>Avaliador: <strong>{selectedRegistroVisualizar.avaliadorNome}</strong></span>
              </div>
            </div>

            {/* Placar de Aderência */}
            <div className={`p-4 rounded-xl flex items-center justify-between border ${
              selectedRegistroVisualizar.classificacao === 'conforme'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : selectedRegistroVisualizar.classificacao === 'atencao'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider block">Percentual de Conformidade</span>
                <span className="text-3xl font-black">{selectedRegistroVisualizar.percentualConformidade}%</span>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold block">{selectedRegistroVisualizar.itensConformes} Conformes</span>
                <span>{selectedRegistroVisualizar.itensNaoConformes} Não Conformes</span>
              </div>
            </div>

            {/* Detalhes dos Itens Avaliados */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Itens Verificados na Operação:
              </h4>
              <div className="space-y-2">
                {Object.entries(selectedRegistroVisualizar.respostas).map(([itemId, resp], idx) => {
                  return (
                    <div
                      key={itemId}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-3 text-xs ${
                        resp.conforme
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-rose-500/30 bg-rose-500/5'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold block text-slate-700 dark:text-slate-300">
                          Item #{idx + 1}
                        </span>
                        {resp.observacao && (
                          <p className="text-[11px] text-rose-500 font-medium">
                            Obs: {resp.observacao}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded font-black text-[10px] uppercase ${
                        resp.conforme ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'
                      }`}>
                        {resp.conforme ? 'SIM' : 'NÃO'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plano de Ação */}
            {selectedRegistroVisualizar.planoAcao && (
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 block">
                  Plano de Ação 5W2H Registrado:
                </span>
                <p className="text-xs font-semibold">
                  {selectedRegistroVisualizar.planoAcao.oQueFazer}
                </p>
                <div className="flex gap-4 text-[11px] text-slate-500 pt-1">
                  <span>Responsável: {selectedRegistroVisualizar.planoAcao.responsavel}</span>
                  <span>Prazo: {selectedRegistroVisualizar.planoAcao.prazo}</span>
                  <span>Status: <strong className="uppercase text-blue-600">{selectedRegistroVisualizar.planoAcao.status}</strong></span>
                </div>
              </div>
            )}

            {/* Botões do Modal */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Relatório
              </button>
              <button
                type="button"
                onClick={() => setSelectedRegistroVisualizar(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL DE IMPORTAÇÃO DE DTO (JSON)
          ═════════════════════════════════════════════════════════════════════ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl p-5 sm:p-6 space-y-4 my-8 relative max-h-[90vh] flex flex-col ${
            theme === 'dark' ? 'bg-[#11151c] border-[#1c2530] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportError(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black">Importar Diagnósticos DTO (JSON)</h2>
                  <p className="text-xs text-slate-500">
                    Importe arquivos .json ou cole diretamente os registros no padrão oficial de DTO.
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Ação Rápida no Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
                >
                  <FileUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>Selecionar Arquivo .JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportJsonText(DTO_SAMPLE_JSON);
                    setImportError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/60 cursor-pointer transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Carregar Modelo Exemplo (Repack)</span>
                </button>
              </div>

              {importJsonText && (
                <button
                  type="button"
                  onClick={() => {
                    setImportJsonText('');
                    setImportError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-rose-500 font-semibold cursor-pointer"
                >
                  Limpar código
                </button>
              )}
            </div>

            {/* Editor Textarea JSON */}
            <div className="flex-1 flex flex-col space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">
                Conteúdo JSON (Objeto único ou Lista de DTOs):
              </label>
              <textarea
                value={importJsonText}
                onChange={e => {
                  setImportJsonText(e.target.value);
                  if (importError) setImportError(null);
                }}
                placeholder='{\n  "id": "DTO-REPACK-202601-001",\n  "modulo": "Repack (Reembalagem de Avarias)",\n  "dataAplicacao": "2026-01-04",\n  "gatilho": "Meta Não Batida (Gatilho DPO)",\n  "colaboradorAvaliado": "Antônio Marcos Lima",\n  "avaliador": "Supervisor Marcelo Dantas",\n  "turno": "1º Turno (Manhã)",\n  "posto": "Box de Repack 02",\n  "checklist": [...],\n  "resumo": { "conformes": 8, "naoConformes": 0, "percentualAderencia": 100, "classificacao": "Bom" },\n  "parecerFinal": "...",\n  "registradoEm": "2026-01-04T17:44:00-03:00"\n}'
                className={`w-full h-56 p-3 rounded-xl border font-mono text-xs outline-none resize-none leading-relaxed ${
                  theme === 'dark' 
                    ? 'bg-[#0d1117] border-[#21262d] text-emerald-400 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500'
                }`}
                spellCheck={false}
              />
            </div>

            {/* Mensagem de Erro se houver */}
            {importError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            {/* Informações de Compatibilidade */}
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Padrão 100% Compatível com DPO / DTO Armazém
              </p>
              <p>
                O importador aceita automaticamente objetos individuais ou arrays com campos como <code className="font-mono text-blue-600 dark:text-blue-300">modulo</code>, <code className="font-mono text-blue-600 dark:text-blue-300">colaboradorAvaliado</code>, <code className="font-mono text-blue-600 dark:text-blue-300">checklist</code>, <code className="font-mono text-blue-600 dark:text-blue-300">resumo</code> e <code className="font-mono text-blue-600 dark:text-blue-300">parecerFinal</code>.
              </p>
            </div>

            {/* Rodapé / Botões */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-4 py-2 rounded-xl border text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!importJsonText.trim()}
                className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-sm ${
                  !importJsonText.trim()
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-98'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Importar</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
