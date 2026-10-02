import { PRODUCTS } from '../planosData';
import { 
  getProductMeta, 
  PRODUCT_CATALOG_DETAILS, 
  calculateOccupiedPalletPositions,
  getProductOfficialDescription,
  getMarketplaceGroup,
  isBarrilChopp,
  getCustomSkuOverrides
} from './productCatalogData';
import { 
  EstoqueDisponivel0205Item, 
  ImportEstoqueDisponivelLog, 
  VendaMediaItem, 
  ImportVendaMediaLog,
  PosicaoPallet021101Item,
  ImportPosicaoPalletLog
} from '../types/estoque';
import { 
  getVendaMediaItens, 
  saveVendaMediaItens, 
  getVendaMediaLogs, 
  saveVendaMediaLogs,
  getEstoqueDisponivel0205Logs,
  saveEstoqueDisponivel0205Itens,
  saveEstoqueDisponivel0205Logs,
  getPosicaoPallet021101Itens,
  savePosicaoPallet021101Itens,
  getPosicaoPallet021101Logs,
  savePosicaoPallet021101Logs,
  getCapacityAreaMetas,
  saveCapacityAreaMetas,
  DEFAULT_AREA_FACTORS,
  DEFAULT_AREA_METAS
} from './estoqueStorage';


export function parsePtBrNumber(valStr: string): number {
  if (!valStr) return 0;
  let s = valStr.replace(/"/g, '').trim();
  if (!s) return 0;

  // Handle trailing/leading minus sign
  const isNegative = s.endsWith('-') || s.startsWith('-');
  s = s.replace(/-/g, '').trim();

  if (s.includes(',') && s.includes('.')) {
    // Standard PT-BR currency/number: "2.782,50" -> dot is thousands, comma is decimal
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    // "2782,50" or "2782,5"
    s = s.replace(',', '.');
  } else if (s.includes('.')) {
    // E.g. "2.782" or "14.838" or "16.276" (thousands separator with 3 digits following)
    // Or "2856.05" (standard decimal dot)
    const parts = s.split('.');
    if (parts.length > 2) {
      s = s.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3) {
      s = s.replace(/\./g, '');
    }
  }

  const parsed = parseFloat(s);
  if (isNaN(parsed)) return 0;
  return isNegative ? -parsed : parsed;
}

/**
 * Categorizes a product into one of the 4 required families:
 * Cerveja, NAB, Match, Marketplace
 */
export function categorizeFamilia(item: { codigo?: number; familia?: string; produto: string; setor?: string }): 'Cerveja' | 'NAB' | 'Match' | 'Marketplace' {
  const f = (item.familia || '').toUpperCase();
  const p = (item.produto || '').toUpperCase();
  const s = (item.setor || '').toUpperCase();

  // Check catalog match if codigo is available
  if (item.codigo) {
    const catalogItem = PRODUCTS.find(prod => prod.codigo === item.codigo);
    if (catalogItem) {
      const cDesc = catalogItem.descricao.toUpperCase();
      if (cDesc.includes('BEATS') || cDesc.includes('RED BULL') || cDesc.includes('FUSION') || cDesc.includes('BRUTAL FRUIT')) {
        return 'Match';
      }
      if (
        cDesc.includes('YPE') || cDesc.includes('TRIDENT') || cDesc.includes('HALLS') || cDesc.includes('TODDY') ||
        cDesc.includes('DOCES') || cDesc.includes('VIEIRA') || cDesc.includes('MENDORATO') || cDesc.includes('AMINDUS') ||
        cDesc.includes('BUBBALOO') || cDesc.includes('GALLO') || cDesc.includes('VINHO') || cDesc.includes('WHISKY') ||
        cDesc.includes('VODKA') || cDesc.includes('GIN') || cDesc.includes('CACHACA') || cDesc.includes('DREHER') ||
        cDesc.includes('MONTILLA') || cDesc.includes('PIRASSUNUNGA') || cDesc.includes('CASILLERO') || cDesc.includes('PERGOLA') ||
        cDesc.includes('SALTON') || cDesc.includes('JOHNNIE') || cDesc.includes('TANQUERAY') || cDesc.includes('SMIRNOFF') ||
        cDesc.includes('BUCHANAN') || cDesc.includes('PITU') || cDesc.includes('MATUTA') || cDesc.includes('DOMECQ') ||
        cDesc.includes('CERVEGELA') || cDesc.includes('GARRAFEIRA') || cDesc.includes('LAVA LOUCAS') || cDesc.includes('AMACIANTE') ||
        cDesc.includes('TIXAN') || cDesc.includes('PASSPORT') || cDesc.includes('WHITE HORSE') || cDesc.includes('CHIVAS') ||
        cDesc.includes('CIROC') || cDesc.includes('BLACK & WHITE') || cDesc.includes('OLD PARR') || cDesc.includes('QUINTA DO MORGADO') ||
        cDesc.includes('CASAL GARCIA') || cDesc.includes('51 ICE') || cDesc.includes('BALLANTINES') || cDesc.includes('SABAO')
      ) {
        return 'Marketplace';
      }
      if (
        cDesc.includes('REFRIGERANTE') || cDesc.includes('NAB') || cDesc.includes('AGUA') || cDesc.includes('SUCO') ||
        cDesc.includes('SUKITA') || cDesc.includes('PEPSI') || cDesc.includes('GUARANA') || cDesc.includes('GATORADE') ||
        cDesc.includes('H2OH') || cDesc.includes('INDAIA') || cDesc.includes('ELEVE') || cDesc.includes('DIAS DAVILA') ||
        cDesc.includes('SODA') || cDesc.includes('TONICA') || cDesc.includes('TANG') || cDesc.includes('PETROPOLIS AGUA') ||
        cDesc.includes('MINALBA')
      ) {
        return 'NAB';
      }
    }
  }

  // 1. Match
  if (p.includes('BEATS') || p.includes('RED BULL') || p.includes('FUSION') || p.includes('BRUTAL FRUIT') || f.includes('MATCH')) {
    return 'Match';
  }
  // 2. Marketplace
  if (
    s.includes('MARKETPLACE') || 
    f.includes('MARKETPLACE') || 
    p.includes('YPE') || 
    p.includes('TRIDENT') || 
    p.includes('HALLS') || 
    p.includes('TODDY') || 
    p.includes('DOCES') || 
    p.includes('VIEIRA') || 
    p.includes('MENDORATO') || 
    p.includes('AMINDUS') || 
    p.includes('BUBBALOO') || 
    p.includes('GALLO') || 
    p.includes('VINHO') || 
    p.includes('WHISKY') || 
    p.includes('VODKA') || 
    p.includes('GIN') || 
    p.includes('CACHACA') || 
    p.includes('DREHER') || 
    p.includes('MONTILLA') || 
    p.includes('PIRASSUNUNGA') || 
    p.includes('CASILLERO') || 
    p.includes('PERGOLA') || 
    p.includes('SALTON') || 
    p.includes('JOHNNIE') || 
    p.includes('TANQUERAY') || 
    p.includes('SMIRNOFF') || 
    p.includes('BUCHANAN') || 
    p.includes('PITU') || 
    p.includes('MATUTA') || 
    p.includes('DOMECQ') || 
    p.includes('CERVEGELA') || 
    p.includes('GARRAFEIRA') || 
    p.includes('LAVA LOUCAS') || 
    p.includes('AMACIANTE') || 
    p.includes('TIXAN') ||
    p.includes('PASSPORT') ||
    p.includes('WHITE HORSE') ||
    p.includes('CHIVAS') ||
    p.includes('CIROC') ||
    p.includes('BLACK & WHITE') ||
    p.includes('OLD PARR') ||
    p.includes('QUINTA DO MORGADO') ||
    p.includes('CASAL GARCIA') ||
    p.includes('51 ICE') ||
    p.includes('BALLANTINES') ||
    p.includes('SABAO')
  ) {
    return 'Marketplace';
  }
  // 3. NAB (Non-Alcoholic Beverages)
  if (
    f.includes('REFRIGERANTE') || 
    f.includes('NAB') || 
    f.includes('AGUA') || 
    f.includes('SUCO') || 
    p.includes('SUKITA') || 
    p.includes('PEPSI') || 
    p.includes('GUARANA') || 
    p.includes('GATORADE') || 
    p.includes('H2OH') || 
    p.includes('AGUA') || 
    p.includes('INDAIA') || 
    p.includes('ELEVE') || 
    p.includes('DIAS DAVILA') || 
    p.includes('SODA') || 
    p.includes('TONICA') || 
    p.includes('TANG') || 
    p.includes('PETROPOLIS AGUA') || 
    p.includes('MINALBA')
  ) {
    return 'NAB';
  }
  // 4. Cerveja (Default for beers, kegs, draft, etc.)
  return 'Cerveja';
}

/**
 * PARSER 02.05.02 (Posição de Estoque)
 * Column D (index 3) = Código
 * Column L (index 11) = Disponível ("X/Y" or "X/Y-")
 */
export function processEstoqueDisponivel0205File(text: string, fileName: string, usuarioName: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, message: 'O arquivo enviado está vazio.' };
  }

  const rawLinesCount = lines.length;
  let aceitosCount = 0;
  let rejeitadosCount = 0;
  const errorDetails: string[] = [];

  // Aggregation map by product code: code -> { qtdSkuFechado, qtdUnidadeAvulsa, fileDesc }
  const aggregationMap = new Map<number, { qtdSkuFechado: number; qtdUnidadeAvulsa: number; fileDesc: string }>();

  // Determine delimiter from first few lines (default ';')
  let delim = ';';
  const sampleLine = lines[0] || '';
  if (sampleLine.includes('\t') && sampleLine.split('\t').length > sampleLine.split(';').length) {
    delim = '\t';
  } else if (sampleLine.includes(';') && sampleLine.split(';').length >= 2) {
    delim = ';';
  } else if (sampleLine.includes(',') && sampleLine.split(',').length >= 2) {
    delim = ',';
  } else if (sampleLine.includes('|') && sampleLine.split('|').length >= 2) {
    delim = '|';
  }

  // Auto-detect header column indices if header exists
  let codeColIdx = -1;
  let descColIdx = -1;
  let qtyColIdx = -1;

  const headerParts = lines[0].split(delim).map(p => p.trim());
  const headerStr = lines[0].toLowerCase();
  const isHeaderPresent = headerStr.includes('produto') || headerStr.includes('descricao') || headerStr.includes('código') || headerStr.includes('codigo') || headerStr.includes('disponivel') || headerStr.includes('disponível') || headerStr.includes('saldo');

  if (isHeaderPresent) {
    headerParts.forEach((col, idx) => {
      const c = col.toLowerCase();
      if (codeColIdx === -1 && (c.includes('produto') || c.includes('código') || c.includes('codigo') || c.includes('cod.prod') || c.includes('cd.prod'))) {
        codeColIdx = idx;
      }
      if (descColIdx === -1 && (c.includes('descri') || c.includes('nome'))) {
        descColIdx = idx;
      }
      if (qtyColIdx === -1 && (c.includes('dispon') || c.includes('disp'))) {
        qtyColIdx = idx;
      }
    });
  }

  lines.forEach((line, idx) => {
    // Skip header line
    if (idx === 0 && isHeaderPresent) {
      return;
    }

    const parts = line.split(delim).map(p => p.trim());
    if (parts.length < 2) {
      rejeitadosCount++;
      if (errorDetails.length < 10) {
        errorDetails.push(`Linha ${idx + 1}: Colunas insuficientes.`);
      }
      return;
    }

    // Determine product code: prioritize codeColIdx if detected from header
    let codeNum = 0;
    let codeRaw = '';

    if (codeColIdx >= 0 && parts[codeColIdx]) {
      codeRaw = parts[codeColIdx].replace(/"/g, '').trim();
      const clean = codeRaw.replace(/\D/g, '');
      const num = parseInt(clean, 10);
      if (num > 0 && num <= 999999) {
        codeNum = num;
      }
    }

    if (!codeNum || codeNum <= 0) {
      if (parts.length >= 12 && parts[3]) {
        const clean3 = parts[3].replace(/"/g, '').replace(/\D/g, '');
        const n3 = parseInt(clean3, 10);
        if (n3 > 0 && n3 <= 999999) {
          codeNum = n3;
          codeRaw = parts[3];
        }
      }
    }

    if (!codeNum || codeNum <= 0) {
      // Strategy 2: check Coluna A (index 0) (9-cols layout)
      if (parts[0]) {
        const clean0 = parts[0].replace(/"/g, '').replace(/\D/g, '');
        const n0 = parseInt(clean0, 10);
        if (n0 > 0 && n0 <= 999999) {
          codeNum = n0;
          codeRaw = parts[0];
        }
      }
      // Strategy 3: search first 5 columns for a valid numeric code
      if (!codeNum) {
        for (let i = 0; i < Math.min(parts.length, 5); i++) {
          const cleanVal = parts[i].replace(/"/g, '').replace(/\D/g, '');
          const n = parseInt(cleanVal, 10);
          if (n > 0 && n <= 999999) {
            codeNum = n;
            codeRaw = parts[i];
            break;
          }
        }
      }
    }

    if (isNaN(codeNum) || codeNum <= 0) {
      rejeitadosCount++;
      if (errorDetails.length < 10) {
        errorDetails.push(`Linha ${idx + 1}: Código de produto inválido ("${codeRaw || parts[0]}").`);
      }
      return;
    }

    // Determine quantity string ("Disponível"): prioritize qtyColIdx if detected
    let qtyRaw = '';
    if (qtyColIdx >= 0 && parts[qtyColIdx] !== undefined) {
      qtyRaw = parts[qtyColIdx].replace(/"/g, '').trim();
    } else if (parts.length >= 12 && parts[11] !== undefined) {
      qtyRaw = parts[11].replace(/"/g, '').trim();
    } else {
      // Look for column with '/' pattern, forward from left to right, avoiding index 13 ("Diferença")
      for (let i = 0; i < parts.length; i++) {
        if (i === 13) continue; // Skip column N ("Diferença")
        const pStr = parts[i].replace(/"/g, '').trim();
        if (pStr.includes('/')) {
          qtyRaw = pStr;
          break;
        }
      }
      if (!qtyRaw) {
        if (parts.length >= 9 && parts[8]) qtyRaw = parts[8].replace(/"/g, '').trim();
        else qtyRaw = (parts[parts.length - 1] || '').replace(/"/g, '').trim();
      }
    }

    // Process Qty "X/Y" or "X/Y-" or float
    let cleanQtyStr = qtyRaw.replace(/-$/, '').trim();
    if (!cleanQtyStr.includes('/')) {
      cleanQtyStr = `${cleanQtyStr}/0`;
    }

    const [rawX, rawY] = cleanQtyStr.split('/');

    const X = Math.round(parsePtBrNumber(rawX));
    const Y = Math.round(parsePtBrNumber(rawY));

    let fileDesc = '';
    if (descColIdx >= 0 && parts[descColIdx]) {
      fileDesc = parts[descColIdx];
    } else if (parts[1] && isNaN(Number(parts[1]))) {
      fileDesc = parts[1];
    } else if (parts[4] && isNaN(Number(parts[4]))) {
      fileDesc = parts[4];
    }

    const existing = aggregationMap.get(codeNum) || { qtdSkuFechado: 0, qtdUnidadeAvulsa: 0, fileDesc };
    existing.qtdSkuFechado += X;
    existing.qtdUnidadeAvulsa += Y;
    if (fileDesc && !existing.fileDesc) existing.fileDesc = fileDesc;

    aggregationMap.set(codeNum, existing);
    aceitosCount++;
  });

  if (aggregationMap.size === 0) {
    return { success: false, message: `Nenhum registro válido processado. Total rejeitados: ${rejeitadosCount}` };
  }

  const vmItens = getVendaMediaItens();
  const vmMap = new Map<number, VendaMediaItem>();
  vmItens.forEach(v => vmMap.set(v.codigo, v));

  const nowISO = new Date().toISOString();
  const resultItems: EstoqueDisponivel0205Item[] = [];

  aggregationMap.forEach((data, code) => {
    const catalogItem = PRODUCTS.find(p => p.codigo === code);
    const meta = getProductMeta(code);

    const fator = catalogItem?.fator || meta.fator || 12;
    const fatorHecto = catalogItem?.fatorHecto || meta.fatorHecto || 0.05;
    const precoCx = meta.preco;

    // Total cases calculation: X closed cases + Y loose units / fator
    const qtdTotalCx = data.qtdSkuFechado + (data.qtdUnidadeAvulsa / fator);

    // Value calculation:
    // Left side of '/': X * price_per_case
    // Right side of '/': (price_per_case / fator) * Y
    const valorFechado = data.qtdSkuFechado * precoCx;
    const valorAvulso = (precoCx / fator) * data.qtdUnidadeAvulsa;
    const valorTotal = valorFechado + valorAvulso;

    const hectoTotal = qtdTotalCx * fatorHecto;

    // Description ALWAYS comes from official PRODUCTS catalog if available
    const produto = catalogItem?.descricao || data.fileDesc || `Produto ${code}`;

    resultItems.push({
      codigo: code,
      produto,
      qtdSkuFechado: data.qtdSkuFechado,
      qtdUnidadeAvulsa: data.qtdUnidadeAvulsa,
      qtdTotalCx: Math.round(qtdTotalCx * 100) / 100,
      valorTotal: Math.round(valorTotal * 100) / 100,
      hectoTotal: Math.round(hectoTotal * 1000) / 1000,
      atualizadoEm: nowISO
    });
  });

  // Re-importing 02.05.02 ALWAYS overwrites previous 02.05.02 base
  saveEstoqueDisponivel0205Itens(resultItems);

  // Log audit record
  const now = new Date();
  const dStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour12: false });
  const logId = `est0205-log-${Date.now()}`;

  const newLog: ImportEstoqueDisponivelLog = {
    id: logId,
    dataHora: dStr,
    nomeArquivo: fileName,
    totalLinhas: rawLinesCount,
    aceitos: aceitosCount,
    rejeitados: rejeitadosCount,
    usuario: usuarioName,
    erros: errorDetails
  };

  const existingLogs = getEstoqueDisponivel0205Logs();
  saveEstoqueDisponivel0205Logs([newLog, ...existingLogs]);

  return {
    success: true,
    log: newLog,
    totalSkus: resultItems.length,
    message: `${resultItems.length} SKUs importados com sucesso na Posição de Estoque.`
  };
}

/**
 * PARSER 03.05.19 (Venda do Mês / Venda Média)
 * Coluna G (index 6) = Código
 * Coluna AC (index 28) = Quantidade Vendida
 */
export function processVendaMediaFile(text: string, fileName: string, diasUteisMes: number = 22, usuarioName: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, message: 'O arquivo enviado está vazio.' };
  }

  const currentCatalogMap = new Map<number, typeof PRODUCTS[0]>();
  PRODUCTS.forEach(p => currentCatalogMap.set(p.codigo, p));

  const currentVmMap = new Map<number, VendaMediaItem>();
  getVendaMediaItens().forEach(item => currentVmMap.set(item.codigo, item));

  const totalVendidoMap = new Map<number, number>();
  const fileDescMap = new Map<number, string>();
  const rawLinesCount = lines.length;

  let aceitosCount = 0;
  let rejeitadosCount = 0;
  const errorDetails: string[] = [];

  lines.forEach((line, idx) => {
    const parts = line.split(';').map(p => p.trim());

    let codeRaw = '';
    let qtyRaw = '';
    let fileDesc = '';
    let unitRaw = '';

    if (parts.length >= 29) {
      codeRaw = parts[6];  // Coluna G (index 6)
      fileDesc = parts[7] || ''; // Nome Produto (index 7)
      unitRaw = parts[8] || '';  // Coluna I (index 8) - Unidade de medida (cx, cx12, Dz, un, etc)
      
      // Coluna AC is index 28. If index 29 has decimals (e.g. 2856;05), combine them
      if (parts[29] && /^\d+$/.test(parts[29])) {
        qtyRaw = `${parts[28]}.${parts[29]}`;
      } else {
        qtyRaw = parts[28];
      }
    } else if (parts.length >= 7) {
      codeRaw = parts[6];
      fileDesc = parts[7] || '';
      unitRaw = parts[8] || '';
      qtyRaw = parts[parts.length - 1];
    } else {
      codeRaw = parts[0];
      qtyRaw = parts[1] || '0';
    }

    if (idx === 0 && (codeRaw.toLowerCase().includes('produto') || codeRaw.toLowerCase().includes('código') || codeRaw.toLowerCase().includes('unb'))) {
      return;
    }

    const cleanCodeStr = codeRaw.replace(/\D/g, '');
    const codeNum = parseInt(cleanCodeStr, 10);

    if (isNaN(codeNum) || codeNum <= 0) {
      rejeitadosCount++;
      if (errorDetails.length < 10) {
        errorDetails.push(`Linha ${idx + 1}: Código de produto inválido ("${codeRaw}").`);
      }
      return;
    }

    let qtyNum = parsePtBrNumber(qtyRaw);

    // Convert quantity to standard Caixas (cx) based on Unit of Measure (Coluna I)
    const unitUpper = unitRaw.toUpperCase().trim();
    const catalogItem = currentCatalogMap.get(codeNum);
    const factor = catalogItem?.fator || 12;

    if (unitUpper === 'UN' || unitUpper === 'UNIDADE' || unitUpper === 'PC' || unitUpper === 'PECAS') {
      qtyNum = factor > 0 ? qtyNum / factor : qtyNum;
    } else if (unitUpper === 'DZ' || unitUpper === 'DUZIA') {
      qtyNum = factor > 0 ? (qtyNum * 12) / factor : qtyNum;
    }

    // Aggregate (Sum) items with repeated codes!
    const prevTotal = totalVendidoMap.get(codeNum) || 0;
    totalVendidoMap.set(codeNum, prevTotal + qtyNum);
    if (fileDesc && !fileDescMap.has(codeNum)) {
      fileDescMap.set(codeNum, fileDesc);
    }

    aceitosCount++;
  });

  if (totalVendidoMap.size === 0) {
    return { success: false, message: `Nenhum produto válido encontrado no arquivo. Rejeitados: ${rejeitadosCount}` };
  }

  const nowISO = new Date().toISOString();
  const updatedVmList: VendaMediaItem[] = [];

  totalVendidoMap.forEach((totalVendido, codeNum) => {
    const catalogItem = currentCatalogMap.get(codeNum);
    const existingItem = currentVmMap.get(codeNum);

    // Calculate Daily Average Sales: Sum of sales / working days of current month
    const vendaMediaDiaria = Math.max(0, Math.round((totalVendido / diasUteisMes) * 10) / 10);

    // Product description ALWAYS comes from official PRODUCTS catalog if available
    const prodName = catalogItem?.descricao || fileDescMap.get(codeNum) || existingItem?.produto || `Produto ${codeNum}`;
    
    const familia = categorizeFamilia({ produto: prodName });
    const marca = existingItem?.marca || 'AMBEV';
    const setor = existingItem?.setor || 'Armazém Central';
    const unitPrice = catalogItem?.preco ?? (existingItem?.precoUnitario && existingItem.precoUnitario !== 50 ? existingItem.precoUnitario : 50.0);

    updatedVmList.push({
      codigo: codeNum,
      produto: prodName,
      vendaMediaDiaria,
      precoUnitario: unitPrice,
      familia,
      marca,
      setor,
      atualizadoEm: nowISO
    });
  });

  currentVmMap.forEach((vmItem, codeNum) => {
    if (!totalVendidoMap.has(codeNum)) {
      updatedVmList.push(vmItem);
    }
  });

  saveVendaMediaItens(updatedVmList);

  const now = new Date();
  const dStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour12: false });
  const logId = `vm-log-${Date.now()}`;

  const newLog: ImportVendaMediaLog = {
    id: logId,
    dataHora: dStr,
    nomeArquivo: fileName,
    totalLinhas: rawLinesCount,
    aceitos: aceitosCount,
    rejeitados: rejeitadosCount,
    usuario: usuarioName,
    erros: errorDetails
  };

  const existingLogs = getVendaMediaLogs();
  saveVendaMediaLogs([newLog, ...existingLogs]);

  return {
    success: true,
    log: newLog,
    totalSkus: totalVendidoMap.size,
    message: `${totalVendidoMap.size} SKUs atualizados na Venda do Mês (${diasUteisMes} dias úteis).`
  };
}

export function parsePtBrFloat(valStr: string): number {
  if (!valStr) return 0;
  let s = valStr.trim();
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes('.')) {
    if (/\.\d{3}$/.test(s)) {
      s = s.replace(/\./g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  return parseFloat(s) || 0;
}

export function isCleaningProduct(code: number | string, description: string = '', grupo: string = ''): boolean {
  const g = String(grupo || '').toUpperCase();
  if (g.includes('LIMPEZA') || g.includes('HIGIENE') || g.includes('QUIMICO') || g.includes('QUÍMICO')) {
    return true;
  }
  const text = (String(description || '') + ' ' + String(code || '')).toUpperCase();
  const cleaningKeywords = [
    'CERVEGELA', 'TIXAN', 'ASSOLAN', 'YPE', 'YPÊ', 'LIMPEZA', 'DETERGENTE', 'DESINFETANTE',
    'SABAO', 'SABÃO', 'AMACIANTE', 'LAVA ROUPA', 'LAVA-ROUPA', 'LAVA ROUPAS',
    'LAVA LOUCA', 'LAVA-LOUCA', 'LAVA LOUÇAS', 'CLORO', 'AGUA SANITARIA', 'ÁGUA SANITÁRIA',
    'ESPONJA', 'BOMBRIL', 'MULTIUSO', 'MULTI USO', 'SAPOLIO', 'SAPÓLIO', 'LUSTRA MOVEIS',
    'LUSTRA MÓVEIS', 'ALVEJANTE', 'SANITIZANTE', 'VEJA', 'AJAX', 'PINHO', 'OMO',
    'BRILHANTE', 'DOWNY', 'COMFORT', 'URCA', 'MINUANO', 'PALHA DE ACO', 'PALHA DE AÇO',
    'DESENGORDURANTE', 'AGUA RAZ', 'QUEROSENE', 'LIMPADOR', 'ACIDO MURIATICO', 'SODA CAUSTICA',
    'INSETICIDA', 'BAYGON', 'SBP', 'RAID', 'RODO', 'VASSOURA', 'SACO DE LIXO', 'SACO LIXO'
  ];
  return cleaningKeywords.some(kw => text.includes(kw));
}

/**
 * Parser for report 02.11.01 (Posição Pallet)
 * Coluna B: Número da Área (1 = Armazém Central, 2 = Picking, 3 = Marketplace, 4 = Contingência, 5 = Pulmão, 6 = PNC, 7 = Limpeza)
 * Coluna C: Código do SKU
 * Coluna J: Quantidade física (caixas no local) -> multiplicada pelo Fator Hectolitro
 * Coluna K: Quantidade de Pallets
 * Coluna L / Ç: Quantidade de Lastro (no picking, qualquer lastro > 0 ocupa 1 posição de pallet)
 */
export function processPosicaoPallet021101Import(
  text: string, 
  fileName: string = 'posicao_pallet_021101.csv', 
  usuarioName: string = 'Sistema',
  companyId?: string,
  isMerge: boolean = false
) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { success: false, message: 'O arquivo enviado está vazio.' };
  }

  const customOverrides = getCustomSkuOverrides();

  let aceitosCount = 0;
  let rejeitadosCount = 0;
  const errorDetails: string[] = [];
  const parsedItems: PosicaoPallet021101Item[] = [];
  const nowISO = new Date().toISOString();

  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('area') || firstLine.includes('área') || firstLine.includes('codigo') || firstLine.includes('código') || firstLine.includes('pallet');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  let totalPalletsSum = 0;
  let totalHectolitrosSum = 0;
  let semFatorCount = 0;

  dataLines.forEach((line, idx) => {
    const lineNum = hasHeader ? idx + 2 : idx + 1;
    const cols = line.split(/[;,|\t]/).map(c => c.trim().replace(/^"|"$/g, ''));
    if (cols.length < 3) {
      rejeitadosCount++;
      errorDetails.push(`Linha ${lineNum}: Formato inválido ou colunas insuficientes.`);
      return;
    }

    // Coluna B (Index 1 or 0)
    let rawArea = cols.length > 1 ? cols[1] : cols[0];
    let areaId: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 1;
    let areaNome: 'Armazém Central' | 'Picking' | 'Marketplace' | 'Contingência' | 'Pulmão' | 'PNC' | 'Produtos de Limpeza' | 'Limpeza' = 'Armazém Central';

    const rawAreaClean = rawArea.toLowerCase().trim();
    // Extrai número da área mesmo com zeros à esquerda (ex: '01', '04', '4', 'área 05', 'area 6')
    const areaDigitsMatch = rawAreaClean.match(/\b(0?[1-7])\b/) || rawAreaClean.match(/^(0?[1-7])$/);
    const parsedAreaNum = areaDigitsMatch ? parseInt(areaDigitsMatch[1], 10) : NaN;

    if (parsedAreaNum === 1 || rawAreaClean === '1' || rawAreaClean === '01' || rawAreaClean.includes('central') || rawAreaClean.includes('armazem') || rawAreaClean.includes('armazém')) {
      areaId = 1;
      areaNome = 'Armazém Central';
    } else if (parsedAreaNum === 2 || rawAreaClean === '2' || rawAreaClean === '02' || rawAreaClean.includes('picking') || rawAreaClean.includes('pick')) {
      areaId = 2;
      areaNome = 'Picking';
    } else if (parsedAreaNum === 3 || rawAreaClean === '3' || rawAreaClean === '03' || rawAreaClean.includes('marketplace') || rawAreaClean.includes('market') || rawAreaClean.includes('mkt')) {
      areaId = 3;
      areaNome = 'Marketplace';
    } else if (parsedAreaNum === 4 || rawAreaClean === '4' || rawAreaClean === '04' || rawAreaClean.includes('contingencia') || rawAreaClean.includes('contingência') || rawAreaClean.includes('reserva')) {
      areaId = 4;
      areaNome = 'Contingência';
    } else if (parsedAreaNum === 5 || rawAreaClean === '5' || rawAreaClean === '05' || rawAreaClean.includes('pulmão') || rawAreaClean.includes('pulmao') || rawAreaClean.includes('pulm')) {
      areaId = 5;
      areaNome = 'Pulmão';
    } else if (parsedAreaNum === 6 || rawAreaClean === '6' || rawAreaClean === '06' || rawAreaClean.includes('pnc') || rawAreaClean.includes('nao conforme') || rawAreaClean.includes('não conforme') || rawAreaClean.includes('avaria') || rawAreaClean.includes('bloqueado')) {
      areaId = 6;
      areaNome = 'PNC';
    } else if (parsedAreaNum === 7 || rawAreaClean === '7' || rawAreaClean === '07' || rawAreaClean.includes('limpeza') || rawAreaClean.includes('limp')) {
      areaId = 7;
      areaNome = 'Produtos de Limpeza';
    } else if (!isNaN(parsedAreaNum) && parsedAreaNum >= 1 && parsedAreaNum <= 7) {
      areaId = parsedAreaNum as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      areaNome = areaId === 1 ? 'Armazém Central' :
                 areaId === 2 ? 'Picking' :
                 areaId === 3 ? 'Marketplace' :
                 areaId === 4 ? 'Contingência' :
                 areaId === 5 ? 'Pulmão' :
                 areaId === 6 ? 'PNC' : 'Produtos de Limpeza';
    } else {
      areaId = 1;
      areaNome = 'Armazém Central';
    }

    // Coluna C (SKU Code, Index 2 or find numeric)
    let rawCodeStr = cols.length > 2 ? cols[2] : cols[0];
    let rawCode = rawCodeStr.replace(/\D/g, '');
    let code = parseInt(rawCode, 10);
    if (isNaN(code) || code <= 0) {
      for (let i = 0; i < cols.length; i++) {
        const num = parseInt(cols[i].replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > 10) {
          code = num;
          break;
        }
      }
    }

    if (isNaN(code) || code <= 0) {
      rejeitadosCount++;
      errorDetails.push(`Linha ${lineNum}: Código de SKU não encontrado.`);
      return;
    }

    const codeNum = Number(code);
    const meta = getProductMeta(codeNum, companyId);
    const catalogItem = PRODUCTS.find(p => Number(p.codigo) === codeNum);

    // Ensure full official description from Cadastros / Master Catalog / Custom Overrides
    const rawDescInFile = cols.length > 3 && isNaN(parseFloat(cols[3])) ? cols[3] : '';
    const produtoDesc = getProductOfficialDescription(codeNum, rawDescInFile, companyId);

    const grupoProd = meta.grupo || catalogItem?.grupo;

    // Se for barril de chopp / keg, descarta conforme diretriz
    if (isBarrilChopp(codeNum, produtoDesc)) {
      return;
    }

    // A área da contagem física da 02.11.01 é prioritária!
    // Apenas se a área for 7 ou se for explicitamente material de limpeza E não tiver vindo de área específica (como PNC 6 ou Contingência 4)
    if (areaId === 7 || (isCleaningProduct(codeNum, produtoDesc, grupoProd) && areaId !== 4 && areaId !== 5 && areaId !== 6)) {
      areaId = 7;
      areaNome = 'Produtos de Limpeza';
    }

    // Check if product is in catalog with explicit Fator Hecto
    const temFatorHecto = meta.fatorHecto !== undefined && meta.fatorHecto > 0;
    const fatorHecto = temFatorHecto ? meta.fatorHecto : 0;
    const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : (meta.caixasPallet || 50);
    const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / (meta.camadas || 5)));

    // Coluna H (Index 7) or Coluna J (Index 9): physical boxes count / SKU
    let qtdHOrJ = 0;
    if (cols.length > 9 && !isNaN(parsePtBrFloat(cols[9])) && parsePtBrFloat(cols[9]) > 0) {
      qtdHOrJ = parsePtBrFloat(cols[9]);
    } else if (cols.length > 7 && !isNaN(parsePtBrFloat(cols[7])) && parsePtBrFloat(cols[7]) > 0) {
      qtdHOrJ = parsePtBrFloat(cols[7]);
    } else if (cols.length > 3 && !isNaN(parsePtBrFloat(cols[3])) && parsePtBrFloat(cols[3]) > 0) {
      qtdHOrJ = parsePtBrFloat(cols[3]);
    }

    // Coluna K (Index 10): pallets
    let qtdPalletK = 0;
    if (cols.length > 10) {
      qtdPalletK = parsePtBrFloat(cols[10]);
    }

    // Coluna L / Ç (Index 11): lastro
    let qtdLastroL = 0;
    if (cols.length > 11) {
      qtdLastroL = parsePtBrFloat(cols[11]);
    }

    let totalCaixas = qtdHOrJ;
    if (totalCaixas === 0 && (qtdPalletK > 0 || qtdLastroL > 0)) {
      totalCaixas = (qtdPalletK * fatorPallet) + (qtdLastroL * lastro);
    }

    // Calculate pallets, lastros and occupied pallet positions
    const posCalc = calculateOccupiedPalletPositions(
      totalCaixas,
      fatorPallet,
      lastro,
      codeNum,
      produtoDesc,
      meta.grupo || '',
      areaId
    );

    const palletsCompletos = qtdPalletK > 0 ? qtdPalletK : posCalc.palletsCompletos;
    const lastrosCalculados = qtdLastroL > 0 ? qtdLastroL : posCalc.lastrosCalculados;
    const posicoesPallet = posCalc.posicoesOcupadas;

    // HL is 0 if product is not in catalog / has no Fator Hecto
    const hl = temFatorHecto ? Math.round((totalCaixas * fatorHecto) * 1000) / 1000 : 0;

    if (!temFatorHecto) {
      semFatorCount++;
    }

    aceitosCount++;
    totalPalletsSum += posicoesPallet;
    totalHectolitrosSum += hl;

    parsedItems.push({
      id: `pos-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      areaId,
      areaNome,
      codigo: codeNum,
      produto: produtoDesc,
      qtdFisicaCaixas: totalCaixas,
      qtdPallet: palletsCompletos,
      qtdLastro: lastrosCalculados,
      posicoesPalletOcupadas: posicoesPallet,
      isFracionadoSemPosicao: posCalc.isFracionadoSemPosicao,
      marketplaceGrupo: posCalc.marketplaceGrupo,
      hectolitros: hl,
      fatorHecto: fatorHecto,
      temFatorHecto: temFatorHecto,
      fatorPallet,
      lastro,
      importadoEm: nowISO
    });
  });

  if (parsedItems.length === 0) {
    return {
      success: false,
      message: 'Nenhum registro válido de Posição Pallet foi encontrado no arquivo 02.11.01.',
      erros: errorDetails
    };
  }

  // Handle Merging vs Full Overwrite
  let finalItems: PosicaoPallet021101Item[] = parsedItems;
  let itensCorrigidosCount = 0;
  let itensAdicionadosCount = 0;

  if (isMerge) {
    const existingItems = getPosicaoPallet021101Itens();
    if (existingItems.length > 0) {
      const itemsMap = new Map<string, PosicaoPallet021101Item>();
      existingItems.forEach(item => {
        const key = `${item.areaId}_${item.codigo}`;
        itemsMap.set(key, item);
      });

      parsedItems.forEach(newItem => {
        const key = `${newItem.areaId}_${newItem.codigo}`;
        if (itemsMap.has(key)) {
          itensCorrigidosCount++;
        } else {
          itensAdicionadosCount++;
        }
        // Patch / overwrite with new recount data
        itemsMap.set(key, newItem);
      });

      finalItems = Array.from(itemsMap.values());
    } else {
      finalItems = parsedItems;
      itensAdicionadosCount = parsedItems.length;
    }
  }

  savePosicaoPallet021101Itens(finalItems);

  // Auto-sync Metas HL with real mix of finalItems immediately!
  try {
    const currentMetas = getCapacityAreaMetas();
    const areaHlMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    const areaPalletMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

    finalItems.forEach(item => {
      const aId = item.areaId || 1;
      areaHlMap[aId] = (areaHlMap[aId] || 0) + (item.hectolitros || 0);
      areaPalletMap[aId] = (areaPalletMap[aId] || 0) + (item.posicoesPalletOcupadas || 0);
    });

    const updatedMetas: typeof currentMetas = { ...currentMetas };
    ([1, 2, 3, 4, 5, 6, 7] as const).forEach(aId => {
      const palReal = areaPalletMap[aId] || 0;
      const hlReal = areaHlMap[aId] || 0;
      const currentMetaPallets = currentMetas[aId]?.palletsMeta || DEFAULT_AREA_METAS[aId].palletsMeta;
      let factor = DEFAULT_AREA_FACTORS[aId] || 7.5;
      if (palReal > 0 && hlReal > 0) {
        factor = hlReal / palReal;
      }
      updatedMetas[aId] = {
        palletsMeta: currentMetaPallets,
        hectolitrosMeta: Math.round(currentMetaPallets * factor * 10) / 10
      };
    });
    saveCapacityAreaMetas(updatedMetas);
  } catch (e) {
    console.error('Erro ao sincronizar metas HL com mix real na importação:', e);
  }

  // Calculate final total pallets and HL
  const finalTotalPallets = finalItems.reduce((acc, item) => acc + (item.posicoesPalletOcupadas || 0), 0);
  const finalTotalHl = finalItems.reduce((acc, item) => acc + (item.hectolitros || 0), 0);

  const now = new Date();
  const dStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour12: false });
  const log: ImportPosicaoPalletLog = {
    id: `log-pos-${Date.now()}`,
    dataHora: dStr,
    nomeArquivo: isMerge ? `[MESCLAGEM / RECONTAGEM] ${fileName}` : fileName,
    totalLinhas: dataLines.length,
    aceitos: aceitosCount,
    rejeitados: rejeitadosCount,
    usuario: usuarioName,
    totalPalletsCalculado: Math.round(finalTotalPallets),
    totalHectolitrosCalculado: Math.round(finalTotalHl * 100) / 100,
    produtosSemFatorCount: semFatorCount,
    erros: errorDetails
  };

  const existingLogs = getPosicaoPallet021101Logs();
  savePosicaoPallet021101Logs([log, ...existingLogs]);

  const successMessage = isMerge
    ? `✅ Recontagem 02.11.01 mesclada com sucesso! ${itensCorrigidosCount} itens existentes foram corrigidos/atualizados e ${itensAdicionadosCount} novos itens foram adicionados. Total atual no armazém: ${finalItems.length} registros (${Math.round(finalTotalPallets)} pallets / ${finalTotalHl.toFixed(2)} HL).`
    : `✅ Relatório 02.11.01 importado e sincronizado com sucesso! ${aceitosCount} itens processados (${Math.round(finalTotalPallets)} pallets / ${finalTotalHl.toFixed(2)} HL). Metas HL atualizadas conforme mix real.`;

  return {
    success: true,
    log,
    parsedItems: finalItems,
    itensCorrigidosCount,
    itensAdicionadosCount,
    totalItensAposMesclagem: finalItems.length,
    message: successMessage
  };
}

