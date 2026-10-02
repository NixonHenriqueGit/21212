import { ProdutoMaster } from '../types';

export interface ProductFieldIssue {
  field: keyof ProdutoMaster;
  label: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ProductValidationSummary {
  isValid: boolean;
  issues: ProductFieldIssue[];
  missingCount: number;
  hasZeroIdade: boolean;
  hasMissingEmbalagem: boolean;
  hasMissingGrupo: boolean;
  hasZeroValor: boolean;
  hasZeroFator: boolean;
  hasZeroFatorPallet: boolean;
  hasZeroFatorHecto: boolean;
}

/**
 * Validates a single product record to detect missing or zeroed-out fields.
 */
export function validateProductRegistration(p: Partial<ProdutoMaster>): ProductValidationSummary {
  const issues: ProductFieldIssue[] = [];

  // 1. Idade (Shelf Life / Validade) - Critical for Stock Age Index!
  const idadeVal = typeof p.idade === 'number' ? p.idade : Number(p.idade);
  const hasZeroIdade = !p.idade || isNaN(idadeVal) || idadeVal <= 0;
  if (hasZeroIdade) {
    issues.push({
      field: 'idade',
      label: 'Idade (Dias)',
      message: 'Idade zerada ou não cadastrada. O Stock Age Index ficará zerado até a correção.',
      severity: 'error'
    });
  }

  // 2. Embalagem
  const embStr = (p.embalagem || '').trim().toUpperCase();
  const hasMissingEmbalagem = !embStr || embStr === '-' || embStr.includes('NÃO IDENTIFICADA') || embStr.includes('NAO IDENTIFICADA');
  if (hasMissingEmbalagem) {
    issues.push({
      field: 'embalagem',
      label: 'Embalagem',
      message: 'Tipo de embalagem não identificada ou não informada.',
      severity: 'warning'
    });
  }

  // 3. Grupo
  const grupoStr = (p.grupo || '').trim().toUpperCase();
  const hasMissingGrupo = !grupoStr || grupoStr === '-' || grupoStr.includes('NÃO IDENTIFICADO') || grupoStr.includes('NAO IDENTIFICADO');
  if (hasMissingGrupo) {
    issues.push({
      field: 'grupo',
      label: 'Grupo',
      message: 'Grupo de produto não categorizado.',
      severity: 'warning'
    });
  }

  // 4. Valor (Preço Unitário)
  const valorVal = typeof p.valor === 'number' ? p.valor : Number(p.valor);
  const hasZeroValor = !p.valor || isNaN(valorVal) || valorVal <= 0;
  if (hasZeroValor) {
    issues.push({
      field: 'valor',
      label: 'Valor Unitário (R$)',
      message: 'Preço/Valor unitário zerado. Afeta a valoração de estoque.',
      severity: 'warning'
    });
  }

  // 5. Fator SKU
  const fatorVal = typeof p.fator === 'number' ? p.fator : Number(p.fator);
  const hasZeroFator = !p.fator || isNaN(fatorVal) || fatorVal <= 0;
  if (hasZeroFator) {
    issues.push({
      field: 'fator',
      label: 'Fator SKU',
      message: 'Fator por SKU zerado ou inválido.',
      severity: 'warning'
    });
  }

  // 6. Fator Pallet
  const palletVal = typeof p.fatorPallet === 'number' ? p.fatorPallet : Number(p.fatorPallet);
  const hasZeroFatorPallet = !p.fatorPallet || isNaN(palletVal) || palletVal <= 0;
  if (hasZeroFatorPallet) {
    issues.push({
      field: 'fatorPallet',
      label: 'Fator Pallet',
      message: 'Fator de paletização zerado ou não cadastrado.',
      severity: 'warning'
    });
  }

  // 7. Fator Hecto (HL)
  const hectoVal = typeof p.fatorHecto === 'number' ? p.fatorHecto : Number(p.fatorHecto);
  const hasZeroFatorHecto = !p.fatorHecto || isNaN(hectoVal) || hectoVal <= 0;
  if (hasZeroFatorHecto) {
    issues.push({
      field: 'fatorHecto',
      label: 'Fator Hecto (HL)',
      message: 'Fator hectolitro zerado ou não cadastrado.',
      severity: 'warning'
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    missingCount: issues.length,
    hasZeroIdade,
    hasMissingEmbalagem,
    hasMissingGrupo,
    hasZeroValor,
    hasZeroFator,
    hasZeroFatorPallet,
    hasZeroFatorHecto
  };
}

/**
 * Validates an entire list of products and produces global statistics.
 */
export function validateProductCatalogList(products: Partial<ProdutoMaster>[]) {
  let completeCount = 0;
  let incompleteCount = 0;
  let totalZeroIdade = 0;
  let totalMissingEmbalagem = 0;
  let totalMissingGrupo = 0;
  let totalZeroValor = 0;

  const incompleteProducts: { product: Partial<ProdutoMaster>; validation: ProductValidationSummary }[] = [];

  products.forEach(p => {
    const val = validateProductRegistration(p);
    if (val.isValid) {
      completeCount++;
    } else {
      incompleteCount++;
      incompleteProducts.push({ product: p, validation: val });
      if (val.hasZeroIdade) totalZeroIdade++;
      if (val.hasMissingEmbalagem) totalMissingEmbalagem++;
      if (val.hasMissingGrupo) totalMissingGrupo++;
      if (val.hasZeroValor) totalZeroValor++;
    }
  });

  return {
    total: products.length,
    completeCount,
    incompleteCount,
    incompletePercentage: products.length > 0 ? Math.round((incompleteCount / products.length) * 100) : 0,
    totalZeroIdade,
    totalMissingEmbalagem,
    totalMissingGrupo,
    totalZeroValor,
    incompleteProducts
  };
}
