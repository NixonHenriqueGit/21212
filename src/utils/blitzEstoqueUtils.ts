export interface MotivoDivergenciaItem {
  id: string;
  motivo: string; // 'Inversão de SKU / Código' | 'Quebra / Avaria não baixada' | 'Erro de Bipagem Coletor RF' | 'Falha de Transferência Pulmão-Picking' | 'Divergência de Nota Fiscal / Entrada' | 'Outros'
  quantidade: number;
  colaborador: string;
  sku?: string;
  observacao?: string;
}

export interface BlitzEstoqueRegistro {
  id: string;
  mesAno: string; // '2026-01', '2026-02', etc.
  mesLabel: string; // 'Janeiro / 2026'
  totalItensAvaliados: number;
  divergentesNaoJustificados: number;
  divergentesJustificados: number;
  saudeEstoquePct: number; // ((total - divergentesNaoJustificados) / total) * 100
  meta: number; // >= 80.0%
  status: 'DENTRO DA META' | 'FORA DA META';
  responsavelAuditoria: string;
  dataFechamento: string;
  motivosDivergencias: MotivoDivergenciaItem[];
}

export const MOTIVOS_PADRAO_BLITZ = [
  'Inversão de SKU / Código no Picking',
  'Quebra / Avaria física não baixada no sistema',
  'Erro de Bipagem / Leitura com Coletor RF',
  'Falha de Transferência Física Pulmão-Picking',
  'Divergência Fiscal vs Recebimento na Entrada',
  'Palete Alocado em Endereço Incorreto (Pulmão)',
  'Ajuste de Inventário Pendente de Aprovação'
];

export function calcularSaudeEstoque(total: number, divergentesNaoJustificados: number): number {
  if (total <= 0) return 100;
  const validos = Math.max(0, total - divergentesNaoJustificados);
  return Math.round((validos / total) * 1000) / 10;
}

const STORAGE_PREFIX = 'blitz_estoque_mensal_';

export function getBlitzEstoqueRecords(empresaId: string = 'demo', metaSaude: number = 80): BlitzEstoqueRegistro[] {
  try {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${empresaId}`);
    if (saved) {
      const parsed: BlitzEstoqueRegistro[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(r => {
          const saude = calcularSaudeEstoque(r.totalItensAvaliados, r.divergentesNaoJustificados);
          return {
            ...r,
            meta: metaSaude,
            saudeEstoquePct: saude,
            status: saude >= metaSaude ? 'DENTRO DA META' : 'FORA DA META'
          };
        });
      }
    }
  } catch (e) {
    console.error('Erro ao ler blitz de estoque:', e);
  }

  // Base inicial padrão estruturada e limpa (Meses de 2026)
  const mesesIniciais = [
    { mesAno: '2026-01', mesLabel: 'Janeiro / 2026', total: 100, divNaoJust: 2, divJust: 1, resp: 'JOSÉ RONILDO DA SILVA' },
    { mesAno: '2026-02', mesLabel: 'Fevereiro / 2026', total: 100, divNaoJust: 1, divJust: 2, resp: 'MARIVALDO ARTUR ALVES' },
    { mesAno: '2026-03', mesLabel: 'Março / 2026', total: 100, divNaoJust: 3, divJust: 0, resp: 'PAULO PEREIRA DA SILVA' }
  ];

  const defaultRecords: BlitzEstoqueRegistro[] = mesesIniciais.map(m => {
    const saude = calcularSaudeEstoque(m.total, m.divNaoJust);
    return {
      id: `blitz-${m.mesAno}`,
      mesAno: m.mesAno,
      mesLabel: m.mesLabel,
      totalItensAvaliados: m.total,
      divergentesNaoJustificados: m.divNaoJust,
      divergentesJustificados: m.divJust,
      saudeEstoquePct: saude,
      meta: metaSaude,
      status: saude >= metaSaude ? 'DENTRO DA META' : 'FORA DA META',
      responsavelAuditoria: m.resp,
      dataFechamento: `${m.mesAno}-28`,
      motivosDivergencias: m.divNaoJust > 0 ? [
        {
          id: `motivo-1-${m.mesAno}`,
          motivo: 'Inversão de SKU / Código no Picking',
          quantidade: 1,
          colaborador: m.resp,
          sku: 'SKU-001 (Brahma Chopp 350ml)',
          observacao: 'Troca de lote físico na separação'
        },
        ...(m.divNaoJust > 1 ? [{
          id: `motivo-2-${m.mesAno}`,
          motivo: 'Quebra / Avaria física não baixada no sistema',
          quantidade: m.divNaoJust - 1,
          colaborador: m.resp,
          sku: 'SKU-004 (Stella Artois)',
          observacao: 'Garrafa avariada descartada sem lançamento do vale'
        }] : [])
      ] : []
    };
  });

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${empresaId}`, JSON.stringify(defaultRecords));
  } catch (err) {}

  return defaultRecords;
}

export function saveBlitzEstoqueRecords(empresaId: string = 'demo', records: BlitzEstoqueRegistro[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${empresaId}`, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('blitz_estoque_updated', { detail: { empresaId, records } }));
  } catch (e) {
    console.error('Erro ao salvar blitz de estoque:', e);
  }
}

export function upsertBlitzEstoqueRecord(empresaId: string = 'demo', record: BlitzEstoqueRegistro): BlitzEstoqueRegistro[] {
  const current = getBlitzEstoqueRecords(empresaId);
  const idx = current.findIndex(r => r.id === record.id || r.mesAno === record.mesAno);
  let updated: BlitzEstoqueRegistro[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = record;
  } else {
    updated = [...current, record].sort((a, b) => b.mesAno.localeCompare(a.mesAno));
  }
  saveBlitzEstoqueRecords(empresaId, updated);
  return updated;
}

export function deleteBlitzEstoqueRecord(empresaId: string = 'demo', idOrMesAno: string): BlitzEstoqueRegistro[] {
  const current = getBlitzEstoqueRecords(empresaId);
  const updated = current.filter(r => r.id !== idOrMesAno && r.mesAno !== idOrMesAno);
  saveBlitzEstoqueRecords(empresaId, updated);
  return updated;
}
