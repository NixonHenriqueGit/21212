import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Building2, 
  Download, 
  Printer, 
  Plus, 
  Eye, 
  Trash2, 
  Truck, 
  Sparkles, 
  ExternalLink,
  DollarSign,
  Layers,
  MapPin,
  Clock,
  Check,
  Search,
  Filter,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { 
  LICENCA_SUDEMA_OFICIAL, 
  RECIBOS_DESCARTE_OFICIAIS, 
  ReciboDescarte, 
  LicencaOperacional 
} from '../data/licencasDescarteData';
import * as XLSX from 'xlsx';

interface LicencasDescarteSectionProps {
  theme?: 'light' | 'dark';
  onClose?: () => void;
  isModal?: boolean;
}

export const LicencasDescarteSection: React.FC<LicencasDescarteSectionProps> = ({
  theme = 'dark',
  onClose,
  isModal = false
}) => {
  const [activeTab, setActiveTab] = useState<'licenca_sudema' | 'recibos' | 'conformidade_dpo' | 'novo_recibo'>('licenca_sudema');
  const [recibos, setRecibos] = useState<ReciboDescarte[]>(() => {
    try {
      const saved = localStorage.getItem('dspd_recibos_descarte_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return RECIBOS_DESCARTE_OFICIAIS;
  });

  const [selectedRecibo, setSelectedRecibo] = useState<ReciboDescarte>(recibos[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Formulário para novo recibo
  const [novoNumero, setNovoNumero] = useState(`REC-2026-03/${recibos.length + 1}`);
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0]);
  const [novoResponsavel, setNovoResponsavel] = useState('Jefferson Cidelino de Souza');
  const [novaObservacao, setNovaObservacao] = useState('Destinação ambiental de materiais e descarte de quebras/repack.');
  const [itensForm, setItensForm] = useState([
    { descricao: 'PALETES', quantidade: 20, valorUnitario: 3.00 },
    { descricao: 'CAIXA', quantidade: 30, valorUnitario: 2.00 },
    { descricao: 'PET', quantidade: 300, valorUnitario: 0.80 },
    { descricao: 'LATINHA', quantidade: 50, valorUnitario: 7.00 },
    { descricao: 'FILME/MELISSA', quantidade: 350, valorUnitario: 2.20 },
    { descricao: 'PAPELAO/CANULA', quantidade: 2000, valorUnitario: 0.25 },
  ]);

  // Cálculos consolidados
  const totalArrecadado = useMemo(() => {
    return recibos.reduce((acc, r) => acc + r.valorTotal, 0);
  }, [recibos]);

  const totalMateriais = useMemo(() => {
    let papelao = 0;
    let filme = 0;
    let pet = 0;
    let lata = 0;
    let outros = 0;

    recibos.forEach(r => {
      r.itens.forEach(it => {
        const d = it.descricao.toUpperCase();
        if (d.includes('PAPELAO')) papelao += it.quantidade;
        else if (d.includes('FILME') || d.includes('MELISSA')) filme += it.quantidade;
        else if (d.includes('PET')) pet += it.quantidade;
        else if (d.includes('LAT')) lata += it.quantidade;
        else outros += it.quantidade;
      });
    });

    return { papelao, filme, pet, lata, outros };
  }, [recibos]);

  const filteredRecibos = useMemo(() => {
    if (!searchTerm.trim()) return recibos;
    const t = searchTerm.toLowerCase();
    return recibos.filter(r => 
      r.numero.toLowerCase().includes(t) ||
      r.dataFormatted.includes(t) ||
      r.empresaCompradora.toLowerCase().includes(t) ||
      r.responsavelRecebimento.toLowerCase().includes(t)
    );
  }, [recibos, searchTerm]);

  const handleSalvarNovoRecibo = (e: React.FormEvent) => {
    e.preventDefault();
    const dataParts = novaData.split('-');
    const dataFormatted = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;

    const itensCalculados = itensForm.map(it => ({
      descricao: it.descricao,
      quantidade: Number(it.quantidade) || 0,
      valorUnitario: Number(it.valorUnitario) || 0,
      total: (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0)
    }));

    const valorTotal = itensCalculados.reduce((acc, it) => acc + it.total, 0);

    const novoReciboObj: ReciboDescarte = {
      id: `recibo-cidelino-${Date.now()}`,
      numero: novoNumero || `REC-2026-${Date.now().toString().slice(-4)}`,
      data: novaData,
      dataFormatted,
      empresaCompradora: 'Pedro Cidelino Recicláveis',
      cnpjCompradora: '06.167.801/0001-22',
      responsavelRecebimento: novoResponsavel,
      tipoOperacao: 'COMPRA DE MATERIAIS RECICLÁVEIS',
      status: 'HOMOLOGADO',
      observacoes: novaObservacao,
      itens: itensCalculados,
      valorTotal
    };

    const updated = [novoReciboObj, ...recibos];
    setRecibos(updated);
    localStorage.setItem('dspd_recibos_descarte_data', JSON.stringify(updated));
    setSelectedRecibo(novoReciboObj);
    setActiveTab('recibos');
    alert('✅ Novo Recibo de Descarte registrado com sucesso!');
  };

  const handleExportExcelRecibos = () => {
    try {
      const wb = XLSX.utils.book_new();

      const recibosSummary = recibos.map(r => ({
        'Nº Recibo': r.numero,
        'Data': r.dataFormatted,
        'Empresa Compradora': r.empresaCompradora,
        'CNPJ': r.cnpjCompradora,
        'Responsável': r.responsavelRecebimento,
        'Valor Total (R$)': r.valorTotal,
        'Status': r.status,
        'Observações': r.observacoes
      }));
      const wsRecibos = XLSX.utils.json_to_sheet(recibosSummary);
      XLSX.utils.book_append_sheet(wb, wsRecibos, 'Recibos Resumo');

      const itensDetailed: any[] = [];
      recibos.forEach(r => {
        r.itens.forEach(it => {
          itensDetailed.push({
            'Nº Recibo': r.numero,
            'Data': r.dataFormatted,
            'Item / Descrição': it.descricao,
            'Quantidade': it.quantidade,
            'Valor Unitário (R$)': it.valorUnitario,
            'Total Item (R$)': it.total
          });
        });
      });
      const wsItens = XLSX.utils.json_to_sheet(itensDetailed);
      XLSX.utils.book_append_sheet(wb, wsItens, 'Itens Detalhados');

      XLSX.writeFile(wb, `Recibos_Descarte_SUDEMA_PedroCidelino_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e: any) {
      alert(`Erro ao exportar: ${e.message}`);
    }
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${isModal ? 'p-2' : ''}`}>
      
      {/* ── BANNER CABEÇALHO DO MÓDULO DE LICENÇAS E RECIBOS ── */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#062419] to-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> CONFORMIDADE AMBIENTAL DPO & ISO 14001
              </span>
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                <Building2 className="w-3 h-3" /> SUDEMA Nº 599/2020 VIGENTE
              </span>
              <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-black uppercase rounded-md flex items-center gap-1 font-mono">
                🏢 Pedro Cidelino Recicláveis (CNPJ 06.167.801/0001-22)
              </span>
            </div>

            <div>
              <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Truck className="w-7 h-7 text-emerald-400" /> Licenças & Recibos de Despejo e Descarte
              </h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mt-1">
                Controle e rastreabilidade integral da <strong>Licença de Operação SUDEMA (LO 599/2020)</strong> e <strong>Recibos Oficiais de Compra de Materiais Recicláveis</strong> gerados nos processos de despejo, quebras, refugo e sucatas metálicas/plásticas do Armazém DSPD Guarabira.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-1 text-[11px] text-slate-300 font-mono">
              <span className="flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Licença Homologada: <strong>SUDEMA Patos/PB</strong>
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Selo de Autenticidade: <strong>045.049</strong>
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Total Descarte Comercializado: <strong>R$ {totalArrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </span>
            </div>
          </div>

          {/* KPI CARDS RESUMO AMBIENTAL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-[#0b1b17]/90 border border-emerald-500/30 rounded-2xl p-3 text-center space-y-0.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status Licença</span>
              <div className="text-xl font-black font-mono text-emerald-400">VIGENTE</div>
              <span className="text-[9px] text-emerald-300 font-bold block">LO 599/2020</span>
            </div>

            <div className="bg-[#0b1b17]/90 border border-blue-500/30 rounded-2xl p-3 text-center space-y-0.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Recibos Emitidos</span>
              <div className="text-xl font-black font-mono text-cyan-400">{recibos.length} Lotes</div>
              <span className="text-[9px] text-slate-300 font-bold block">100% Homologados</span>
            </div>

            <div className="bg-[#0b1b17]/90 border border-amber-500/30 rounded-2xl p-3 text-center space-y-0.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Papelão / Cânula</span>
              <div className="text-xl font-black font-mono text-amber-400">{totalMateriais.papelao.toLocaleString('pt-BR')} un</div>
              <span className="text-[9px] text-amber-300 font-bold block">Coleta Cidelino</span>
            </div>

            <div className="bg-[#0b1b17]/90 border border-purple-500/30 rounded-2xl p-3 text-center space-y-0.5 shadow-md">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Filme / Melissa</span>
              <div className="text-xl font-black font-mono text-purple-400">{totalMateriais.filme.toLocaleString('pt-BR')} kg</div>
              <span className="text-[9px] text-purple-300 font-bold block">Reciclagem DPO</span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS INTERNAS */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-emerald-900/60">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('licenca_sudema')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'licenca_sudema'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-[#061e16] text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              <FileText className="w-4 h-4 text-emerald-400" /> 1. Licença de Operação SUDEMA
            </button>

            <button
              onClick={() => setActiveTab('recibos')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'recibos'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-[#061e16] text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              <Truck className="w-4 h-4 text-cyan-400" /> 2. Recibos de Descarte & Compra ({recibos.length})
            </button>

            <button
              onClick={() => setActiveTab('conformidade_dpo')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'conformidade_dpo'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-[#061e16] text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" /> 3. Matriz de Conformidade & Condicionantes
            </button>

            <button
              onClick={() => setActiveTab('novo_recibo')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'novo_recibo'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-[#061e16] text-slate-400 hover:text-white border border-emerald-950'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-300" /> 4. Lançar Novo Recibo
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcelRecibos}
              className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Exportar Planilha
            </button>

            <button
              onClick={printDocument}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4 text-emerald-400" /> Imprimir Documento
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" /> Fechar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GUIA 1: LICENÇA DE OPERAÇÃO AMBIENTAL SUDEMA (Nº 599/2020)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'licenca_sudema' && (
        <div className="space-y-6">
          {/* Card Resumo do Empreendimento e Condições */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b141e] border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase font-black">Órgão Regulador</span>
              <div className="text-sm font-bold text-white leading-snug">{LICENCA_SUDEMA_OFICIAL.orgaoEmissor}</div>
              <div className="text-xs text-slate-400 font-mono">Processo: {LICENCA_SUDEMA_OFICIAL.processoNumero}</div>
            </div>

            <div className="bg-[#0b141e] border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-mono text-cyan-400 uppercase font-black">Empreendimento Licenciado</span>
              <div className="text-sm font-bold text-white leading-snug">{LICENCA_SUDEMA_OFICIAL.razaoSocial}</div>
              <div className="text-xs text-slate-400 font-mono">CNPJ: {LICENCA_SUDEMA_OFICIAL.cnpj} | {LICENCA_SUDEMA_OFICIAL.municipio}-{LICENCA_SUDEMA_OFICIAL.uf}</div>
            </div>

            <div className="bg-[#0b141e] border border-slate-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-mono text-amber-400 uppercase font-black">Validade & Selo Digital</span>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {LICENCA_SUDEMA_OFICIAL.status} (730 Dias Homologados)
              </div>
              <div className="text-xs text-slate-400 font-mono">Selo Autenticidade: <strong>{LICENCA_SUDEMA_OFICIAL.seloAutenticidade}</strong></div>
            </div>
          </div>

          {/* LAUDO TÉCNICO FORMAL DA SUDEMA (VISUAL FIEL AO PDF DIGITALIZADO) */}
          <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl border-4 border-slate-900 max-w-4xl mx-auto print:m-0 print:p-4 print:border-none print:shadow-none">
            {/* Header SUDEMA / Governo da Paraíba */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center text-white font-black text-xs tracking-tighter">
                  SUDEMA
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider">SUDEMA</h3>
                  <p className="text-[10px] text-slate-600 font-semibold leading-tight max-w-xs">
                    Superintendência de Administração do Meio Ambiente
                  </p>
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-xs font-extrabold uppercase text-slate-900">GOVERNO DO ESTADO DA PARAÍBA</h4>
                <p className="text-[10px] text-slate-700 font-medium leading-tight max-w-xs">
                  SERHMACT - Secretaria de Estado dos Recursos Hídricos, do Meio Ambiente e da Ciência e Tecnologia
                </p>
                <p className="text-[10px] font-bold text-slate-900">
                  SUDEMA - Superintendência de Administração do Meio Ambiente
                </p>
              </div>

              <div className="text-right flex items-center gap-2">
                <div className="w-10 h-10 border border-slate-300 rounded-lg flex items-center justify-center text-slate-800 font-bold text-[9px]">
                  GOVERNO DA PARAÍBA
                </div>
              </div>
            </div>

            {/* Título da Licença */}
            <div className="text-center my-6 space-y-1">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950 border-y-2 border-slate-900 py-2 inline-block px-8">
                LICENÇA DE OPERAÇÃO - {LICENCA_SUDEMA_OFICIAL.numeroLicenca}
              </h2>
            </div>

            {/* Texto Preambular da SUDEMA */}
            <p className="text-xs text-slate-800 text-justify leading-relaxed mb-6 font-serif">
              A SUDEMA, no uso das atribuições que lhe são conferidas pela Lei 6.757/99, de 08/07/99, artigo 2º, inciso VI, e de acordo com o SELAP - Sistema Estadual de Licenciamento de Atividades Poluidoras, instituído através do Decreto Estadual 21.120 de 20 de junho de 2000 e de conformidade com o que estabelece a deliberação do COPAM - Conselho de Proteção Ambiental N.º 3.245 de 27 de fevereiro de 2003, concede a presente Licença acima discriminada, nas condições especificadas.
            </p>

            {/* Seção I: Dados do Empreendimento */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 bg-slate-100 p-2 border-l-4 border-slate-900 mb-3">
                I - DADOS DO EMPREENDIMENTO
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 block">Nome ou Razão Social:</span>
                  <span className="font-extrabold text-slate-950">{LICENCA_SUDEMA_OFICIAL.razaoSocial}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">CNPJ / CPF:</span>
                  <span className="font-mono font-bold text-slate-950">{LICENCA_SUDEMA_OFICIAL.cnpj}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Local Atividade Licenciada:</span>
                  <span className="font-medium text-slate-900">{LICENCA_SUDEMA_OFICIAL.endereco} - Município: {LICENCA_SUDEMA_OFICIAL.municipio} - UF: {LICENCA_SUDEMA_OFICIAL.uf} - CEP: {LICENCA_SUDEMA_OFICIAL.cep}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700 block">Coordenadas Geográficas:</span>
                  <span className="font-mono text-slate-900">{LICENCA_SUDEMA_OFICIAL.coordenadas}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-bold text-slate-700 block">Atividade Licenciada:</span>
                  <span className="font-semibold text-slate-950">{LICENCA_SUDEMA_OFICIAL.atividadeLicenciada}</span>
                </div>
              </div>
            </div>

            {/* Seção II: Condicionantes */}
            <div className="mb-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-950 bg-slate-100 p-2 border-l-4 border-slate-900 mb-3">
                II - CONDICIONANTES
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-800 leading-relaxed text-justify">
                {LICENCA_SUDEMA_OFICIAL.condicionantes.map((c, i) => (
                  <li key={i} className="pl-1"><span className="font-medium">{c}</span></li>
                ))}
              </ol>
            </div>

            {/* Assinaturas dos Diretores */}
            <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="w-36 h-0.5 bg-slate-800 mx-auto mb-1"></div>
                <p className="text-xs font-black text-slate-950 uppercase">ITARAGY MARINHO</p>
                <p className="text-[10px] text-slate-600 font-semibold">Diretor Técnico SUDEMA</p>
              </div>

              <div>
                <div className="w-36 h-0.5 bg-slate-800 mx-auto mb-1"></div>
                <p className="text-xs font-black text-slate-950 uppercase">MARCELO CAVALCANTI DE ALBUQUERQUE</p>
                <p className="text-[10px] text-slate-600 font-semibold">Diretor Superintendente SUDEMA</p>
              </div>
            </div>

            {/* Selo de Autenticidade */}
            <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-400 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-12 bg-emerald-100 border-2 border-emerald-600 rounded flex flex-col items-center justify-center p-1 text-center">
                  <span className="text-[8px] font-black text-emerald-900 uppercase">SELO OFICIAL</span>
                  <span className="text-xs font-mono font-black text-emerald-950">{LICENCA_SUDEMA_OFICIAL.seloAutenticidade}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-800 block">SELO DE AUTENTICIDADE PARA LICENCIAMENTO AMBIENTAL</span>
                  <span className="text-[9px] text-slate-500 font-mono">Governo do Estado da Paraíba - Secretaria de Estado do Meio Ambiente</span>
                </div>
              </div>

              <div className="text-right text-[9px] text-slate-600">
                <p>Av. Monsenhor Walfredo Leal, 181 - Tambiá - CEP: 58020-540 - João Pessoa - PB</p>
                <p>CNPJ: 08.329.849/0001-15 - Telefones: (83) 3218-5606 / 3218-5603</p>
                <p className="font-bold text-blue-900">www.sudema.pb.gov.br</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GUIA 2: RECIBOS DE DESCARTE E COMPRA (PEDRO CIDELINO)        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'recibos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Lista de Recibos */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" /> Recibos ({filteredRecibos.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Jan - Ago / 2026</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por número, data, item..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#0b141e] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredRecibos.map(rec => {
                const isSelected = selectedRecibo.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecibo(rec)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 shadow-md'
                        : 'bg-[#0b141e] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-black text-emerald-400">{rec.numero}</span>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                        {rec.dataFormatted}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white mb-1">{rec.empresaCompradora}</div>
                    <div className="text-[11px] text-slate-400 mb-2 font-mono">
                      Resp: {rec.responsavelRecebimento}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                      <span className="text-slate-400 text-[10px] uppercase font-bold">{rec.itens.length} itens</span>
                      <span className="text-emerald-400 font-mono font-black">
                        R$ {rec.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Visualizador Oficial do Recibo Selecionado */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Visualizando comprovante oficial timbrado
              </span>
              <button
                onClick={printDocument}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" /> Imprimir Recibo
              </button>
            </div>

            {/* Recibo Timbrado (Fiel ao modelo da Pedro Cidelino Recicláveis) */}
            <div className="bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-300">
              {/* Header com Logo Verde do Caminhão */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex flex-col items-center justify-center text-white p-1.5 shadow">
                    <Truck className="w-7 h-7 text-white" />
                    <span className="text-[7px] font-black uppercase tracking-tighter">RECICLÁVEIS</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-950">
                      Pedro Cidelino
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                      RECICLÁVEIS
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">CNPJ: 06.167.801/0001-22</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                    RECIBO DE COMPRA DE MATERIAIS RECICLÁVEIS
                  </span>
                  <span className="text-xs font-mono font-black text-slate-950 block">
                    Nº {selectedRecibo.numero}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    Data: {selectedRecibo.dataFormatted}
                  </span>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-y-2 border-slate-900 bg-slate-100 text-slate-950 font-black uppercase text-left">
                      <th className="py-2.5 px-3">QUANTIDADE</th>
                      <th className="py-2.5 px-3">DESCRIÇÃO</th>
                      <th className="py-2.5 px-3 text-right">VALOR UNT.</th>
                      <th className="py-2.5 px-3 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedRecibo.itens.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-900">
                        <td className="py-2 px-3 font-mono font-bold">{it.quantidade.toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-3 font-bold text-slate-950">{it.descricao}</td>
                        <td className="py-2 px-3 text-right font-mono">
                          R$ {it.valorUnitario.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                          R$ {it.total.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 bg-slate-100">
                      <td colSpan={3} className="py-3 px-3 text-right font-black uppercase text-slate-950 text-sm">
                        TOTAL:
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-950 text-base">
                        R$ {selectedRecibo.valorTotal.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Bloco de Assinatura e Carimbo Oficial */}
              <div className="border-t border-slate-300 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div>
                  <p className="text-[11px] text-slate-700 italic mb-4">
                    Recebemos e conferimos os materiais relacionados neste recibo.
                  </p>
                  <div className="w-56 border-b-2 border-slate-800 mb-1">
                    <span className="font-serif italic text-xs text-slate-900 font-bold block pb-1">
                      {selectedRecibo.responsavelRecebimento}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    Assinatura do responsável
                  </span>
                </div>

                <div className="flex justify-end">
                  <div className="border-2 border-slate-400 rounded-lg p-3 text-center w-48 bg-slate-50">
                    <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">
                      CARIMBO DE HOMOLOGAÇÃO
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block my-1">
                      PEDRO CIDELINO RECICLÁVEIS
                    </span>
                    <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                      ✓ RECEBIDO & CONFERIDO
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                MODELO OFICIAL AUDITADO DPO - ARMAZÉM DSPD GUARABIRA - PAU BRASIL DISTRIBUIDORA
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GUIA 3: MATRIZ DE CONFORMIDADE & CONDICIONANTES DPO           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'conformidade_dpo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b141e] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Checklist de Condicionantes Ambientais
              </h3>

              <div className="space-y-3">
                {LICENCA_SUDEMA_OFICIAL.condicionantes.map((cond, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#070d14] rounded-xl border border-slate-800">
                    <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">{cond}</p>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Status: 100% Atendido no Armazém
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0b141e] border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Rastreabilidade da Destinação dos Resíduos
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#070d14] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resíduo</span>
                    <span className="text-white font-bold">Papelão / Cânula Ondulada</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destinação</span>
                    <span className="text-emerald-400 font-mono font-bold">Prensa e Reciclagem</span>
                  </div>
                </div>

                <div className="p-3 bg-[#070d14] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resíduo</span>
                    <span className="text-white font-bold">Filme Stretch / Melissa</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destinação</span>
                    <span className="text-emerald-400 font-mono font-bold">Aparas Plásticas</span>
                  </div>
                </div>

                <div className="p-3 bg-[#070d14] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resíduo</span>
                    <span className="text-white font-bold">PET Despejado</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destinação</span>
                    <span className="text-emerald-400 font-mono font-bold">Trituração & Grânulos</span>
                  </div>
                </div>

                <div className="p-3 bg-[#070d14] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resíduo</span>
                    <span className="text-white font-bold">Latinhas de Alumínio</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destinação</span>
                    <span className="text-emerald-400 font-mono font-bold">Fundição Industrial</span>
                  </div>
                </div>

                <div className="p-3 bg-[#070d14] rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resíduo</span>
                    <span className="text-white font-bold">Paletes Quebrados / Sucata de Madeira</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Destinação</span>
                    <span className="text-emerald-400 font-mono font-bold">Recuperação & Biomassa</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* GUIA 4: LANÇAR NOVO RECIBO DE DESCARTE                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'novo_recibo' && (
        <form onSubmit={handleSalvarNovoRecibo} className="bg-[#0b141e] border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Registro de Novo Recibo de Descarte / Venda
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Lance os materiais destinados à Pedro Cidelino Recicláveis para atualização do estoque de resíduos e livro ambiental DPO.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold uppercase mb-1.5">Nº do Recibo</label>
              <input
                type="text"
                required
                value={novoNumero}
                onChange={e => setNovoNumero(e.target.value)}
                className="w-full px-3 py-2 bg-[#070d14] border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold uppercase mb-1.5">Data do Recibo</label>
              <input
                type="date"
                required
                value={novaData}
                onChange={e => setNovaData(e.target.value)}
                className="w-full px-3 py-2 bg-[#070d14] border border-slate-700 rounded-xl text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold uppercase mb-1.5">Responsável / Recebedor</label>
              <input
                type="text"
                required
                value={novoResponsavel}
                onChange={e => setNovoResponsavel(e.target.value)}
                className="w-full px-3 py-2 bg-[#070d14] border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tabela de Itens do Formulário */}
          <div>
            <label className="block text-slate-300 font-bold uppercase mb-2 text-xs">Materiais e Quantidades</label>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                    <th className="pb-2">Material</th>
                    <th className="pb-2">Quantidade</th>
                    <th className="pb-2">Valor Unitário (R$)</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {itensForm.map((item, idx) => {
                    const subtotal = (Number(item.quantidade) || 0) * (Number(item.valorUnitario) || 0);
                    return (
                      <tr key={idx}>
                        <td className="py-2 font-bold text-white">{item.descricao}</td>
                        <td className="py-2">
                          <input
                            type="number"
                            min="0"
                            value={item.quantidade}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...itensForm];
                              updated[idx].quantidade = val;
                              setItensForm(updated);
                            }}
                            className="w-28 px-2 py-1 bg-[#070d14] border border-slate-700 rounded-lg text-white font-mono"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.valorUnitario}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...itensForm];
                              updated[idx].valorUnitario = val;
                              setItensForm(updated);
                            }}
                            className="w-28 px-2 py-1 bg-[#070d14] border border-slate-700 rounded-lg text-white font-mono"
                          />
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-emerald-400">
                          R$ {subtotal.toFixed(2).replace('.', ',')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold uppercase mb-1.5 text-xs">Observações do Lote</label>
            <textarea
              rows={2}
              value={novaObservacao}
              onChange={e => setNovaObservacao(e.target.value)}
              className="w-full px-3 py-2 bg-[#070d14] border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('recibos')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Salvar Recibo Homologado
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
export default LicencasDescarteSection;
