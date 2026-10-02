import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Flame, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  Sun, 
  Wind, 
  Wrench, 
  Thermometer, 
  Calendar,
  Layers,
  ArrowRight,
  Check
} from 'lucide-react';
import { salvarAcaoMelhoria, AcaoMelhoriaItem } from '../utils/desviosEMelhoriasService';
import { Usuario } from '../types';

export interface AcaoTermicaMensal {
  mesNumero: string; // '01' a '12'
  mesNome: string;
  estacao: 'Verão / Pico de Calor' | 'Transição / Outono' | 'Inverno / Estável' | 'Primavera / Aquecimento';
  tituloAcao: string;
  oQueFazer: string;
  comoFazer: string;
  ganhoEsperado: string;
  responsavel: string;
  prioridade: 'Alta' | 'Média' | 'Normal';
  sincronizada?: boolean;
}

export const ACOES_TERMICAS_MENSAIS_PADRAO: AcaoTermicaMensal[] = [
  {
    mesNumero: '01',
    mesNome: 'Janeiro',
    estacao: 'Verão / Pico de Calor',
    tituloAcao: 'Fechamento de Docas no Pico Solar & Exaustão Contínua',
    oQueFazer: 'Manter os portões das docas fechados nos horários de maior incidência solar (11h às 15h) e ligar exaustores eólicos.',
    comoFazer: 'Orientar conferentes e operadores a fechar as portas basculantes logo após carregamento e manter rotação dos exaustores ativa.',
    ganhoEsperado: 'Redução de até 2.5°C na temperatura interna do armazém durante o horário de pico.',
    responsavel: 'Líder de Armazém & Conferentes',
    prioridade: 'Alta'
  },
  {
    mesNumero: '02',
    mesNome: 'Fevereiro',
    estacao: 'Verão / Pico de Calor',
    tituloAcao: 'Limpeza e Desobstrução dos Exaustores Eólicos',
    oQueFazer: 'Limpar e revisar as palhetas dos exaustores eólicos do telhado para acelerar a renovação contínua de ar.',
    comoFazer: 'Acionar equipe de manutenção predial para inspecionar rolamentos, retirar poeira acumulada e garantir giro livre.',
    ganhoEsperado: 'Aumento de 35% na taxa de troca de ar quente acumulado sob o telhado.',
    responsavel: 'Manutenção Predial & Operações',
    prioridade: 'Alta'
  },
  {
    mesNumero: '03',
    mesNome: 'Março',
    estacao: 'Transição / Outono',
    tituloAcao: 'Ventilação Cruzada e Afastamento de Paletes das Paredes',
    oQueFazer: 'Desobstruir corredores de ventilação e afastar paletes no mínimo 50 cm das paredes externas do galpão.',
    comoFazer: 'Reorganizar os blocos de armazenagem nos corredores laterais garantindo fluxo livre de circulação de ar.',
    ganhoEsperado: 'Eliminação de bolsões de calor nas paredes laterais mais expostas ao sol.',
    responsavel: 'Operadores de Empilhadeira & Conferente',
    prioridade: 'Média'
  },
  {
    mesNumero: '04',
    mesNome: 'Abril',
    estacao: 'Transição / Outono',
    tituloAcao: 'Inspeção de Telhas Translúcidas e Pintura Antitérmica',
    oQueFazer: 'Checar vedação das telhas translúcidas e aplicar película/pintura refletiva nas áreas com radiação direta.',
    comoFazer: 'Mapear pontos onde o sol incide diretamente sobre os pallets e instalar proteção solar ou quebra-sol.',
    ganhoEsperado: 'Evitar radiação solar direta sobre embalagens e bebidas sensíveis.',
    responsavel: 'Manutenção & Líder de Qualidade',
    prioridade: 'Média'
  },
  {
    mesNumero: '05',
    mesNome: 'Maio',
    estacao: 'Transição / Outono',
    tituloAcao: 'Manutenção Preventiva de Ventiladores e Climatizadores',
    oQueFazer: 'Higienizar grades, limpar filtros de poeira e lubrificar motores dos ventiladores industriais.',
    comoFazer: 'Executar checklist de manutenção preventiva em 100% dos ventiladores e climatizadores do armazém.',
    ganhoEsperado: 'Funcionamento com 100% de eficiência e menor ruído operacional.',
    responsavel: 'Equipe de Manutenção Industrial',
    prioridade: 'Média'
  },
  {
    mesNumero: '06',
    mesNome: 'Junho',
    estacao: 'Inverno / Estável',
    tituloAcao: 'Ajuste e Vedação de Cortinas de PVC nas Docas',
    oQueFazer: 'Instalar e alinhar cortinas de tiras de PVC flexível nas aberturas de docas para reter fluxo térmico externo.',
    comoFazer: 'Substituir lâminas de PVC danificadas ou rasgadas nas áreas de recebimento e expedição.',
    ganhoEsperado: 'Barreira física contra entrada de vento quente e poeira externa.',
    responsavel: 'Líder de Armazém & Manutenção',
    prioridade: 'Normal'
  },
  {
    mesNumero: '07',
    mesNome: 'Julho',
    estacao: 'Inverno / Estável',
    tituloAcao: 'Padronização e Calibração dos Termohigrômetros Digitais',
    oQueFazer: 'Aferir e calibrar os termômetros digitais do armazém e garantir cumprimento dos 3 horários regulamentares.',
    comoFazer: 'Comparar termômetro fixo com termômetro padrão calibrado e checar baterias dos sensores.',
    ganhoEsperado: '100% de precisão nos registros de 09h, 16h e 22h sem desvios de leitura.',
    responsavel: 'Auditor DPO / Qualidade & Conferente',
    prioridade: 'Normal'
  },
  {
    mesNumero: '08',
    mesNome: 'Agosto',
    estacao: 'Inverno / Estável',
    tituloAcao: 'Aspersão de Água e Umidificação no Pátio Externo',
    oQueFazer: 'Fazer aspersão controlada de água no piso do pátio externo de manobra nos dias secos e de baixa umidade.',
    comoFazer: 'Umidificar o piso externo antes do meio-dia para resfriar a massa asfáltica próxima às entradas do armazém.',
    ganhoEsperado: 'Redução do ar quente que adentra as portas do armazém durante as manobras.',
    responsavel: 'Apoio Operacional & Limpeza',
    prioridade: 'Média'
  },
  {
    mesNumero: '09',
    mesNome: 'Setembro',
    estacao: 'Primavera / Aquecimento',
    tituloAcao: 'Vedação de Frestas Térmicas e Isolamento do Telhado',
    oQueFazer: 'Vedar frestas no encontro das paredes com o telhado e checar integridade do isolamento térmico.',
    comoFazer: 'Inspecionar com lanterna pontos de entrada de calor ou ar quente na cobertura e aplicar espuma expansiva/vedante.',
    ganhoEsperado: 'Estabilidade da temperatura interna frente às primeiras ondas de calor da primavera.',
    responsavel: 'Manutenção Predial & Operação',
    prioridade: 'Média'
  },
  {
    mesNumero: '10',
    mesNome: 'Outubro',
    estacao: 'Primavera / Aquecimento',
    tituloAcao: 'DDS de Conscientização: Portas Fechadas & Hidratação',
    oQueFazer: 'Realizar DDS rápido com toda a equipe para reforçar o não abandono de portões abertos sem operação ativa.',
    comoFazer: 'Reunir operadores e conferentes no início do turno, apresentar indicadores de temperatura e reforçar o hábito.',
    ganhoEsperado: 'Engajamento de 100% do time na disciplina operacional térmica.',
    responsavel: 'Líder de Armazém & Segurança do Trabalho',
    prioridade: 'Alta'
  },
  {
    mesNumero: '11',
    mesNome: 'Novembro',
    estacao: 'Primavera / Aquecimento',
    tituloAcao: 'Instalação de Pontos Adicionais de Termômetros no Fundo do Armazém',
    oQueFazer: 'Instalar sensores adicionais nos locais com maior acúmulo térmico (fundo e mezanino do armazém).',
    comoFazer: 'Mapear a zona mais quente do galpão e fixar suporte padrão a 1,5m do solo para monitoramento secundário.',
    ganhoEsperado: 'Visão completa dos microclimas internos antes do pico do verão.',
    responsavel: 'Qualidade DPO & Manutenção',
    prioridade: 'Alta'
  },
  {
    mesNumero: '12',
    mesNome: 'Dezembro',
    estacao: 'Verão / Pico de Calor',
    tituloAcao: 'Operação Verão: Prioridade em Cargas Sensíveis & Giro Rápido',
    oQueFazer: 'Ativar protocolo Operação Verão com conferência ágil e realocação de produtos sensíveis para áreas sombreadas.',
    comoFazer: 'Priorizar descarregamento imediato nas primeiras horas da manhã e manter monitoramento contínuo das 16h.',
    ganhoEsperado: 'Zero ocorrências de estresse térmico em produtos e cumprimento integral da meta DPO.',
    responsavel: 'Supervisão de Operações & Conferentes',
    prioridade: 'Alta'
  }
];

interface PlanoAcoesTermicasMensaisProps {
  user?: Usuario | null;
  selectedMonth?: string; // '01' a '12'
  selectedYear?: string;
  onActionCreated?: () => void;
}

const STORAGE_SYNCED_KEY = 'af_acoes_termicas_synced_months_v1';

export const PlanoAcoesTermicasMensais: React.FC<PlanoAcoesTermicasMensaisProps> = ({
  user,
  selectedMonth = '08',
  selectedYear = '2026',
  onActionCreated
}) => {
  const [syncedMonths, setSyncedMonths] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SYNCED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [loadingMonth, setLoadingMonth] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [filtroMes, setFiltroMes] = useState<'todos' | 'selecionado'>('todos');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SYNCED_KEY, JSON.stringify(syncedMonths));
    } catch (e) {
      console.warn('Erro ao salvar meses sincronizados:', e);
    }
  }, [syncedMonths]);

  const handleSyncAction = async (acao: AcaoTermicaMensal) => {
    setLoadingMonth(acao.mesNumero);
    try {
      const mesFormatado = `${acao.mesNumero}/${selectedYear}`;
      const prazoDate = `${selectedYear}-${acao.mesNumero}-28`;

      const novaAcao: AcaoMelhoriaItem = {
        id: `melhoria-temp-${selectedYear}-${acao.mesNumero}-${Date.now()}`,
        data: `01/${acao.mesNumero}/${selectedYear}`,
        dataISO: `${selectedYear}-${acao.mesNumero}-01`,
        hora: '09:00',
        reuniaoTOR: 'Comitê de Qualidade / DPO',
        pilarDPO: 'Qualidade',
        processo: 'Controle Térmico do Armazém',
        setor: 'Armazém Geral (Guarabira - PB)',
        dataProximoAcompanhamento: prazoDate,
        tituloMelhoria: `[Térmica ${acao.mesNome}] ${acao.tituloAcao}`,
        oportunidadeIdentificada: `Otimização térmica e estabilidade do armazém para o mês de ${acao.mesNome}/${selectedYear}.`,
        indicadorBeneficiado: 'Temperatura do Armazém (Limite ≤ 28.0°C)',
        metaMelhoria: 'Manter 100% das aferições na faixa de 18°C a 28°C',
        ganhoEsperado: acao.ganhoEsperado,
        oQueSeraFeito: acao.oQueFazer,
        responsavelPrincipal: acao.responsavel,
        prazoImplantacao: prazoDate,
        comoSeraFeito: acao.comoFazer,
        recursosNecessarios: 'Equipe de Armazém, Manutenção Predial e EPIs',
        statusTOR: 'Planejada',
        percentualConcluido: 0,
        registradoPor: user?.nome || 'Pedro Bruno (Qualidade DPO)',
        criadoEm: new Date().toISOString()
      };

      await salvarAcaoMelhoria(novaAcao, user?.empresaId || 'demo');
      
      setSyncedMonths(prev => Array.from(new Set([...prev, acao.mesNumero])));
      setFeedbackMsg({
        type: 'success',
        text: `✅ Ação de ${acao.mesNome} enviada com sucesso para o Quadro Geral de Ações!`
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
      if (onActionCreated) onActionCreated();
    } catch (err: any) {
      console.error('Erro ao enviar ação térmica:', err);
    } finally {
      setLoadingMonth(null);
    }
  };

  const handleSyncAllActions = async () => {
    setLoadingMonth('ALL');
    try {
      for (const acao of ACOES_TERMICAS_MENSAIS_PADRAO) {
        const prazoDate = `${selectedYear}-${acao.mesNumero}-28`;
        const novaAcao: AcaoMelhoriaItem = {
          id: `melhoria-temp-${selectedYear}-${acao.mesNumero}-${Date.now()}`,
          data: `01/${acao.mesNumero}/${selectedYear}`,
          dataISO: `${selectedYear}-${acao.mesNumero}-01`,
          hora: '09:00',
          reuniaoTOR: 'Comitê de Qualidade / DPO',
          pilarDPO: 'Qualidade',
          processo: 'Controle Térmico do Armazém',
          setor: 'Armazém Geral (Guarabira - PB)',
          dataProximoAcompanhamento: prazoDate,
          tituloMelhoria: `[Térmica ${acao.mesNome}] ${acao.tituloAcao}`,
          oportunidadeIdentificada: `Otimização térmica preventiva para o mês de ${acao.mesNome}/${selectedYear}.`,
          indicadorBeneficiado: 'Temperatura do Armazém (Limite ≤ 28.0°C)',
          metaMelhoria: 'Manter 100% das aferições na faixa de 18°C a 28°C',
          ganhoEsperado: acao.ganhoEsperado,
          oQueSeraFeito: acao.oQueFazer,
          responsavelPrincipal: acao.responsavel,
          prazoImplantacao: prazoDate,
          comoSeraFeito: acao.comoFazer,
          recursosNecessarios: 'Equipe de Armazém, Manutenção Predial e EPIs',
          statusTOR: 'Planejada',
          percentualConcluido: 0,
          registradoPor: user?.nome || 'Pedro Bruno (Qualidade DPO)',
          criadoEm: new Date().toISOString()
        };
        await salvarAcaoMelhoria(novaAcao, user?.empresaId || 'demo');
      }

      setSyncedMonths(ACOES_TERMICAS_MENSAIS_PADRAO.map(a => a.mesNumero));
      setFeedbackMsg({
        type: 'success',
        text: '🎉 Todas as 12 Ações Mensais de Temperatura foram integradas no Quadro de Ações com sucesso!'
      });
      setTimeout(() => setFeedbackMsg(null), 5000);
      if (onActionCreated) onActionCreated();
    } catch (err: any) {
      console.error('Erro ao sincronizar todas as ações:', err);
    } finally {
      setLoadingMonth(null);
    }
  };

  const displayedAcoes = filtroMes === 'selecionado' 
    ? ACOES_TERMICAS_MENSAIS_PADRAO.filter(a => a.mesNumero === selectedMonth)
    : ACOES_TERMICAS_MENSAIS_PADRAO;

  return (
    <div className="bg-[#0b1222] border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> PLANO OPERACIONAL DE MELHORIA TÉRMICA (12 MESES)
            </span>
            <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              Palavras Simples & Ações Práticas do Armazém
            </span>
          </div>
          <h4 className="text-sm font-black text-white mt-1.5 flex items-center gap-2">
            Ações Diretas para Reduzir e Controlar a Temperatura no Galpão
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            1 ação prática por mês focada em exaustão, fechamento de docas, ventilação e disciplina operacional. Clique para enviar direto para o Quadro Geral de Ações.
          </p>
        </div>

        {/* Global Action Sync Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-[#111a30] border border-slate-800 p-1 rounded-xl flex items-center gap-1 text-[11px]">
            <button
              onClick={() => setFiltroMes('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroMes === 'todos' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ver Todos (12 Meses)
            </button>
            <button
              onClick={() => setFiltroMes('selecionado')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filtroMes === 'selecionado' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês Selecionado ({selectedMonth}/{selectedYear})
            </button>
          </div>

          <button
            onClick={handleSyncAllActions}
            disabled={loadingMonth === 'ALL'}
            className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:opacity-50"
            title="Integrar todas as 12 ações do ano no Quadro Geral de Ações em lote"
          >
            <Layers className="w-3.5 h-3.5" />
            {loadingMonth === 'ALL' ? 'Sincronizando...' : 'Sincronizar Todas no Quadro'}
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Grid of Monthly Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedAcoes.map((acao) => {
          const isSynced = syncedMonths.includes(acao.mesNumero);
          const isCurrentFilterMonth = acao.mesNumero === selectedMonth;
          const isLoading = loadingMonth === acao.mesNumero;

          return (
            <div
              key={acao.mesNumero}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 relative ${
                isCurrentFilterMonth
                  ? 'bg-gradient-to-br from-[#111c38] to-[#0c1429] border-cyan-400 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40'
                  : 'bg-[#111a30]/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-black text-xs flex items-center justify-center">
                      {acao.mesNumero}
                    </span>
                    <strong className="text-white text-xs font-black uppercase">
                      {acao.mesNome}
                    </strong>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    acao.prioridade === 'Alta'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}>
                    {acao.estacao}
                  </span>
                </div>

                {/* Action Title */}
                <h5 className="text-xs font-bold text-cyan-300 line-clamp-1">
                  {acao.tituloAcao}
                </h5>

                {/* Direct Action Text */}
                <div className="mt-2 p-2.5 bg-[#0b1222] rounded-lg border border-slate-800/80 space-y-1.5">
                  <p className="text-[11px] text-slate-200 font-medium leading-relaxed">
                    <span className="text-amber-400 font-bold">O que fazer: </span>
                    {acao.oQueFazer}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    <span className="text-slate-300 font-semibold">Como fazer: </span>
                    {acao.comoFazer}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Resp: <strong className="text-slate-200">{acao.responsavel}</strong></span>
                  <span className="text-emerald-400 font-mono font-bold">{acao.ganhoEsperado.split(' ')[0]} {acao.ganhoEsperado.split(' ')[1]}</span>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => handleSyncAction(acao)}
                  disabled={isLoading}
                  className={`w-full py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    isSynced
                      ? 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
                  }`}
                  title="Enviar e salvar esta ação no Quadro Geral de Ações de Qualidade & Melhorias"
                >
                  {isLoading ? (
                    'Enviando...'
                  ) : isSynced ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Sincronizada no Quadro (Reenviar)
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Enviar para o Quadro de Ações
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
