import { PRODUCT_MASTER_MAP, PRODUCT_MASTER_DATA } from '../data/productMasterData';

// Fast In-Memory caches to prevent locking browser event loop (var used to prevent TDZ on circular imports)
var cachedOverrides: Record<number, CustomSkuOverride> | null = null;
var cachedEmpresaProdutos: Map<string, any[]> | null = null;
var metaCache: Map<string, ProductMeta> | null = null;
var rawProductsMap: Map<number, any> | null = null;

import { RAW_PRODUCTS } from '../planosData';

export interface ProductMeta {
  preco: number;
  fator?: number;
  fatorHecto?: number;
  grupo: 'CERVEJA' | 'NAB' | 'MATCH' | 'MARKETPLACE' | string;
  curva: 'A' | 'B' | 'C' | string;
  fatorPallet?: number;
  idade?: number;
  lastro?: number;
  camadas?: number;
  caixasPallet?: number;
  embalagem?: string;
  unidade?: string;
}

// ── CUSTOM PERMANENT SKU OVERRIDES STORE ──
// Used to guarantee that manual adjustments in Gestão de Capacidade (palletização, lastro, camadas, fator hecto, área, grupo)
// are 100% permanent across all page refreshes, remixes, company changes, and file re-imports.
export interface CustomSkuOverride {
  codigo: number;
  produto?: string;
  fatorCx?: number;
  caixasPallet?: number;
  fatorPallet?: number;
  lastro?: number;
  camadas?: number;
  fatorHecto?: number;
  grupo?: string;
  embalagem?: string;
  valorUnitario?: number;
  preco?: number;
  curva?: 'A' | 'B' | 'C';
  areaId?: number;
  areaNome?: string;
  updatedAt?: string;
}

const CUSTOM_SKU_OVERRIDES_KEY = 'af_product_custom_overrides_v1';

function getRawProduct(codeNum: number): any {
  if (!rawProductsMap) rawProductsMap = new Map();
  try {
    const list = typeof RAW_PRODUCTS !== 'undefined' ? RAW_PRODUCTS : null;
    if (rawProductsMap.size === 0 && Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (p && p.codigo) {
          rawProductsMap.set(Number(p.codigo), p);
        }
      }
    }
  } catch (_) {}
  return rawProductsMap.get(codeNum);
}

export function invalidateProductCatalogCaches() {
  cachedOverrides = null;
  if (cachedEmpresaProdutos) cachedEmpresaProdutos.clear();
  if (metaCache) metaCache.clear();
}

if (typeof window !== 'undefined') {
  window.addEventListener('local_data_changed', invalidateProductCatalogCaches);
  window.addEventListener('app_data_updated', invalidateProductCatalogCaches);
  window.addEventListener('storage', invalidateProductCatalogCaches);
}

export function getCustomSkuOverrides(): Record<number, CustomSkuOverride> {
  if (cachedOverrides) return cachedOverrides;
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(CUSTOM_SKU_OVERRIDES_KEY);
    cachedOverrides = raw ? JSON.parse(raw) : {};
    return cachedOverrides;
  } catch (e) {
    return {};
  }
}

export function saveCustomSkuOverride(override: CustomSkuOverride) {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = getCustomSkuOverrides();
    const codeNum = Number(override.codigo);
    if (!codeNum || isNaN(codeNum)) return;

    current[codeNum] = {
      ...current[codeNum],
      ...override,
      codigo: codeNum,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CUSTOM_SKU_OVERRIDES_KEY, JSON.stringify(current));
    invalidateProductCatalogCaches();

    // Also update in-memory catalog details map for instant sync
    if (PRODUCT_CATALOG_DETAILS[codeNum]) {
      if (override.fatorCx !== undefined) PRODUCT_CATALOG_DETAILS[codeNum].fator = override.fatorCx;
      if (override.caixasPallet !== undefined) {
        PRODUCT_CATALOG_DETAILS[codeNum].fatorPallet = override.caixasPallet;
        PRODUCT_CATALOG_DETAILS[codeNum].caixasPallet = override.caixasPallet;
      }
      if (override.lastro !== undefined) PRODUCT_CATALOG_DETAILS[codeNum].lastro = override.lastro;
      if (override.camadas !== undefined) PRODUCT_CATALOG_DETAILS[codeNum].camadas = override.camadas;
      if (override.fatorHecto !== undefined) PRODUCT_CATALOG_DETAILS[codeNum].fatorHecto = override.fatorHecto;
      if (override.grupo !== undefined) PRODUCT_CATALOG_DETAILS[codeNum].grupo = override.grupo;
      if (override.preco !== undefined || override.valorUnitario !== undefined) {
        PRODUCT_CATALOG_DETAILS[codeNum].preco = override.preco ?? override.valorUnitario ?? 0;
      }
    }
  } catch (e) {
    console.error('Error saving custom SKU override:', e);
  }
}

export function deleteCustomSkuOverride(codigo: number | string) {
  try {
    if (typeof localStorage === 'undefined') return;
    const current = getCustomSkuOverrides();
    delete current[Number(codigo)];
    localStorage.setItem(CUSTOM_SKU_OVERRIDES_KEY, JSON.stringify(current));
    invalidateProductCatalogCaches();
  } catch (e) {
    console.error('Error deleting custom SKU override:', e);
  }
}

/**
 * Retrieves the full, complete official product description from the product catalog / cadastros.
 * As required: "a descrição dos produtos têm de ser completa como na guia de cadastros de produtos."
 */
export function getProductOfficialDescription(
  codigo: number | string,
  fallbackDesc: string = '',
  companyId?: string
): string {
  const codeNum = Number(codigo);
  if (isNaN(codeNum) || codeNum <= 0) {
    return fallbackDesc || (codigo ? `SKU ${codigo}` : 'Produto');
  }

  // 1. Check custom user permanent overrides first (highest priority)
  const overrides = getCustomSkuOverrides();
  if (overrides[codeNum]?.produto && overrides[codeNum].produto!.trim()) {
    return overrides[codeNum].produto!.trim();
  }

  // 2. Check custom user cadastros in localStorage for active empresa
  try {
    const cid = companyId || (typeof localStorage !== 'undefined' ? (localStorage.getItem('empresa_ativa_id') || localStorage.getItem('af_empresa_id') || 'demo') : 'demo');
    const saved = typeof localStorage !== 'undefined' ? (localStorage.getItem(`produtos_${cid}`) || localStorage.getItem('produtos_demo')) : null;
    if (saved) {
      const list = JSON.parse(saved);
      const found = list.find((p: any) => Number(p.codigo) === codeNum);
      if (found && found.descricao && found.descricao.trim()) {
        return found.descricao.trim();
      }
    }
  } catch (e) {}

  // 3. Check in PRODUCT_MASTER_MAP (Master catalog of 377+ SKUs)
  const pm = PRODUCT_MASTER_MAP.get(codeNum);
  if (pm && pm.descricao && pm.descricao.trim()) {
    return pm.descricao.trim();
  }

  // 4. Check in RAW_PRODUCTS catalog
  const prod = getRawProduct(codeNum);
  if (prod && prod.descricao && prod.descricao.trim()) {
    return prod.descricao.trim();
  }

  // 5. Fallback: if fallbackDesc is provided and not generic, use it
  if (fallbackDesc && fallbackDesc.trim() && !fallbackDesc.startsWith('SKU ') && !fallbackDesc.startsWith('Produto ')) {
    return fallbackDesc.trim();
  }

  return `SKU ${codeNum}`;
}

const VASILHAMES_E_RETORNAVEIS = new Set([
  198214, // GFA LITRINHO / GARRAFA 300ML
  27983,  // GFA A 635ML / GARRAFA 600 ÂMBAR
  188006, // GFA VIDRO 1L / GARRAFA 1L
  786238, // GARRAFA 600
  188005, // VASILHAME
  863059, // VASILHAME
  899599, // VASILHAME
  198215, // VASILHAME
  188007, // VASILHAME
  786239  // VASILHAME
]);

/**
 * Checks whether a SKU is a registered finished product on the platform (Master Data, Catalog, or Empresa custom products).
 * Excludes raw returnable packaging/vasilhames like empty bottle codes that aren't registered sellable products.
 */
export function isProdutoCadastrado(codigo: number | string, companyId?: string): boolean {
  const codeNum = Number(codigo);
  if (isNaN(codeNum) || codeNum <= 0) return false;

  // Never consider raw returnable glass / vasilhames / bottles as finished products
  if (VASILHAMES_E_RETORNAVEIS.has(codeNum)) {
    return false;
  }

  // 1. Check custom user cadastros in localStorage for active empresa (Guia de Cadastro de Produtos)
  try {
    const cid = companyId || (typeof localStorage !== 'undefined' ? (localStorage.getItem('empresa_ativa_id') || localStorage.getItem('af_empresa_id') || 'demo') : 'demo');
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(`produtos_${cid}`) : null;
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list) && list.length > 0) {
        const found = list.find((p: any) => Number(p.codigo) === codeNum);
        if (found) {
          const desc = String(found.descricao || '').toUpperCase();
          if (!desc.startsWith('GFA ') && !desc.startsWith('GARRAFA ') && !desc.includes('VASILHAME')) {
            return true;
          }
        }
      }
    }
  } catch (e) {}

  // 2. Check in PRODUCT_MASTER_MAP (The 377 Master PA products)
  if (PRODUCT_MASTER_MAP.has(codeNum)) return true;

  // 3. Check in RAW_PRODUCTS catalog (Catalog of registered PA)
  if (getRawProduct(codeNum)) return true;

  // 4. Check in PRODUCT_CATALOG_DETAILS
  if (PRODUCT_CATALOG_DETAILS[codeNum]) return true;

  // 5. Check in RAW_PRODUCTS list from planosData
  try {
    if (typeof RAW_PRODUCTS !== 'undefined' && Array.isArray(RAW_PRODUCTS) && RAW_PRODUCTS.some(p => Number(p.codigo) === codeNum)) return true;
  } catch (_) {}

  // 6. Check across all saved produtos in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('produtos_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list) && list.some((p: any) => Number(p.codigo) === codeNum)) {
              return true;
            }
          }
        }
      }
    }
  } catch (e) {}

  return false;
}

export interface AvailableProductOption {
  codigo: number;
  descricao: string;
  fatorPallet?: number;
  caixasPallet?: number;
  lastro?: number;
  camadas?: number;
  fator?: number;
  fatorHecto?: number;
  grupo?: string;
  curva?: string;
  embalagem?: string;
  isCustom?: boolean;
  idade?: number;
}

/**
 * Retorna a lista unificada de todos os produtos cadastrados e disponíveis na plataforma para o conferente.
 * Inclui os produtos recém-cadastrados na plataforma (Guia de Cadastro de Produtos),
 * produtos do Firestore (empresaProdutos), LocalStorage e a base master oficial.
 */
export function getAvailableProductsForConferente(
  empresaId?: string,
  empresaProdutos?: any[]
): AvailableProductOption[] {
  const cid = empresaId || (typeof localStorage !== 'undefined' ? (localStorage.getItem('empresa_ativa_id') || localStorage.getItem('af_empresa_id') || 'demo') : 'demo');
  const isCleared = typeof localStorage !== 'undefined' && localStorage.getItem(`produtos_cleared_${cid}`) === 'true';

  const map = new Map<number, AvailableProductOption>();

  // 1. Base Master Oficial pré-cadastrada (377 SKUs)
  if (!isCleared) {
    if (Array.isArray(PRODUCT_MASTER_DATA)) {
      PRODUCT_MASTER_DATA.forEach(p => {
        const cod = Number(p.cod);
        if (cod && !isNaN(cod) && !VASILHAMES_E_RETORNAVEIS.has(cod)) {
          const { fatorPallet, lastro, camadas } = resolvePalletAndLastro(
            p.fatorPallet || 60,
            (p as any).lastro,
            (p as any).camadas,
            p.embalagem || '',
            p.descricao || '',
            cod
          );
          map.set(cod, {
            codigo: cod,
            descricao: p.descricao,
            fatorPallet,
            caixasPallet: fatorPallet,
            lastro,
            camadas,
            fator: p.fator,
            fatorHecto: p.fatorHecto,
            grupo: p.grupo || 'CERVEJA',
            curva: p.curva || 'B',
            embalagem: p.embalagem || '',
            idade: typeof p.idade === 'number' ? p.idade : 180,
            isCustom: false
          });
        }
      });
    }

    try {
      if (typeof RAW_PRODUCTS !== 'undefined' && Array.isArray(RAW_PRODUCTS)) {
        RAW_PRODUCTS.forEach(p => {
          const cod = Number(p.codigo);
          if (cod && !isNaN(cod) && !VASILHAMES_E_RETORNAVEIS.has(cod) && !map.has(cod)) {
            const { fatorPallet, lastro, camadas } = resolvePalletAndLastro(
              (p as any).caixasPallet || 60,
              (p as any).lastro,
              (p as any).camadas,
              (p as any).embalagem || '',
              p.descricao || '',
              cod
            );
            map.set(cod, {
              codigo: cod,
              descricao: p.descricao,
              fatorPallet,
              caixasPallet: fatorPallet,
              lastro,
              camadas,
              fator: (p as any).fator,
              fatorHecto: (p as any).fatorHecto,
              grupo: (p as any).grupo || 'CERVEJA',
              curva: (p as any).curva || 'B',
              embalagem: (p as any).embalagem || '',
              idade: typeof (p as any).idade === 'number' ? (p as any).idade : 180,
              isCustom: false
            });
          }
        });
      }
    } catch (_) {}
  }

  // 2. Sobrepõe com os produtos gravados no LocalStorage da Empresa (cadastros recentes e edições)
  try {
    if (typeof localStorage !== 'undefined') {
      const keysToCheck = [`produtos_${cid}`, 'produtos_demo', 'produtos_global'];
      for (const k of keysToCheck) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            list.forEach((p: any) => {
              const cod = Number(p.codigo || p.cod || p.codSKU);
              if (cod && !isNaN(cod) && !VASILHAMES_E_RETORNAVEIS.has(cod)) {
                const { fatorPallet, lastro, camadas } = resolvePalletAndLastro(
                  p.fatorPallet || p.caixasPallet,
                  p.lastro,
                  p.camadas,
                  p.embalagem || '',
                  p.descricao || '',
                  cod
                );
                const isUserCustom = !PRODUCT_MASTER_MAP.has(cod) || !!p._criadoEm || !!p.cadastradoPor || !!p.createdAt;
                map.set(cod, {
                  codigo: cod,
                  descricao: String(p.descricao || `SKU ${cod}`).trim(),
                  fatorPallet,
                  caixasPallet: fatorPallet,
                  lastro,
                  camadas,
                  fator: p.fator !== undefined ? Number(p.fator) : 12,
                  fatorHecto: p.fatorHecto !== undefined ? Number(p.fatorHecto) : 0,
                  grupo: p.grupo || 'CERVEJA',
                  curva: p.curva || 'C',
                  embalagem: p.embalagem || '',
                  idade: typeof p.idade === 'number' ? p.idade : 180,
                  isCustom: isUserCustom
                });
              }
            });
          }
        }
      }
    }
  } catch (e) {}

  // 3. Sobrepõe com os produtos salvos no Firestore / Contexto (empresaProdutos)
  if (Array.isArray(empresaProdutos) && empresaProdutos.length > 0) {
    empresaProdutos.forEach((p: any) => {
      const cod = Number(p.codigo || p.cod || p.codSKU);
      if (cod && !isNaN(cod) && !VASILHAMES_E_RETORNAVEIS.has(cod)) {
        const { fatorPallet, lastro, camadas } = resolvePalletAndLastro(
          p.fatorPallet || p.caixasPallet,
          p.lastro,
          p.camadas,
          p.embalagem || '',
          p.descricao || '',
          cod
        );
        const isUserCustom = !PRODUCT_MASTER_MAP.has(cod) || !!p._criadoEm || !!p.cadastradoPor || !!p.createdAt;
        map.set(cod, {
          codigo: cod,
          descricao: String(p.descricao || `SKU ${cod}`).trim(),
          fatorPallet,
          caixasPallet: fatorPallet,
          lastro,
          camadas,
          fator: p.fator !== undefined ? Number(p.fator) : 12,
          fatorHecto: p.fatorHecto !== undefined ? Number(p.fatorHecto) : 0,
          grupo: p.grupo || 'CERVEJA',
          curva: p.curva || 'C',
          embalagem: p.embalagem || '',
          idade: typeof p.idade === 'number' ? p.idade : 180,
          isCustom: isUserCustom
        });
      }
    });
  }

  // 4. Aplica Custom SKU Overrides permanentes
  try {
    const overrides = getCustomSkuOverrides();
    Object.keys(overrides).forEach(keyStr => {
      const cod = Number(keyStr);
      if (cod && !isNaN(cod) && !VASILHAMES_E_RETORNAVEIS.has(cod)) {
        const ov = overrides[cod];
        const existing = map.get(cod);
        const desc = ov.produto || existing?.descricao || `SKU ${cod}`;
        const { fatorPallet, lastro, camadas } = resolvePalletAndLastro(
          ov.fatorPallet || ov.caixasPallet || existing?.caixasPallet,
          ov.lastro || existing?.lastro,
          ov.camadas || existing?.camadas,
          ov.embalagem || existing?.embalagem || '',
          desc,
          cod
        );
        map.set(cod, {
          codigo: cod,
          descricao: desc,
          fatorPallet,
          caixasPallet: fatorPallet,
          lastro,
          camadas,
          fator: ov.fatorCx || existing?.fator || 12,
          fatorHecto: ov.fatorHecto !== undefined ? ov.fatorHecto : (existing?.fatorHecto || 0),
          grupo: ov.grupo || existing?.grupo || 'CERVEJA',
          curva: ov.curva || existing?.curva || 'C',
          embalagem: ov.embalagem || existing?.embalagem || '',
          idade: existing?.idade || 180,
          isCustom: existing?.isCustom ?? true
        });
      }
    });
  } catch (e) {}

  const result = Array.from(map.values());

  // Ordena com itens customizados / recentes no topo, seguido de ordem alfabética por descrição
  result.sort((a, b) => {
    if (a.isCustom && !b.isCustom) return -1;
    if (!a.isCustom && b.isCustom) return 1;
    return a.descricao.localeCompare(b.descricao);
  });

  return result;
}

export function isBarrilChopp(codigo?: string | number, descricao?: string): boolean {
  if (codigo && (Number(codigo) === 838 || String(codigo).trim() === '838')) return true;
  if (!descricao) return false;
  const upper = String(descricao).toUpperCase();
  return (
    upper.includes('BARRIL') ||
    upper.includes('KEG 50') ||
    upper.includes('KEG 30') ||
    upper.includes('KEG50') ||
    upper.includes('KEG30') ||
    upper.includes('CHOPP BRAHMA CLARO BARRIL') ||
    (upper.includes('KEG') && upper.includes('CHOPP'))
  );
}

export function getProductUnit(meta?: Partial<ProductMeta> | null, defaultUnit: string = 'cx'): string {
  if (!meta) return defaultUnit;
  const rawEmb = (meta.embalagem || meta.unidade || '').trim();
  if (!rawEmb) return defaultUnit;

  const upper = rawEmb.toUpperCase();
  if (upper.includes('UN') && !upper.includes('JUNT')) return 'un';
  if (upper.includes('FDO') || upper.includes('FARDO')) return 'fdo';
  if (upper.includes('CX') || upper.includes('CAIXA')) return 'cx';
  if (upper.includes('LT') || upper.includes('LATA')) return 'cx';
  if (upper.includes('GF') || upper.includes('GARRAFA') || upper.includes('VIDRO')) return 'cx';
  if (upper.includes('PET')) return 'cx';
  if (rawEmb.length <= 4) return rawEmb.toLowerCase();
  return defaultUnit;
}

export const PRODUCT_CATALOG_DETAILS: Record<number, ProductMeta> = {
  9067: { preco: 28.95, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  9068: { preco: 28.52, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  34608: { preco: 39.00, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  33820: { preco: 34.90, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  13205: { preco: 39.14, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  19164: { preco: 3.90, fator: 2, fatorHecto: 0.02, grupo: 'NAB', curva: 'A' },
  21020: { preco: 31.78, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  37450: { preco: 33.50, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  33818: { preco: 36.80, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  20498: { preco: 33.20, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'A' },
  20329: { preco: 55.40, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  21787: { preco: 18.51, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  503: { preco: 19.45, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'B' },
  504: { preco: 26.97, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'A' },
  982: { preco: 53.35, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  988: { preco: 52.23, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  1388: { preco: 51.44, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'A' },
  1743: { preco: 40.76, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'A' },
  2319: { preco: 34.22, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'B' },
  2349: { preco: 28.39, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'A' },
  2353: { preco: 28.09, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'B' },
  2538: { preco: 48.22, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  2546: { preco: 61.02, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  2548: { preco: 53.65, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  9069: { preco: 28.51, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'B' },
  9083: { preco: 37.84, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'B' },
  9084: { preco: 22.12, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'B' },
  9085: { preco: 22.33, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'B' },
  9274: { preco: 21.89, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'B' },
  12948: { preco: 30.89, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'B' },
  13061: { preco: 32.79, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'B' },
  13065: { preco: 27.23, fator: 6, fatorHecto: 0.09, grupo: 'NAB', curva: 'B' },
  13201: { preco: 39.08, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  17808: { preco: 90.67, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'B' },
  18152: { preco: 13.21, fator: 12, fatorHecto: 0.02, grupo: 'NAB', curva: 'B' },
  18266: { preco: 12.08, fator: 12, fatorHecto: 0.02, grupo: 'NAB', curva: 'B' },
  19229: { preco: 37.23, fator: 6, fatorHecto: 0.02, grupo: 'NAB', curva: 'C' },
  19668: { preco: 37.58, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'B' },
  20217: { preco: 45.94, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'B' },
  21526: { preco: 74.00, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22177: { preco: 23.10, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'B' },
  23186: { preco: 60.57, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'A' },
  24409: { preco: 14.24, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  26037: { preco: 22.97, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'B' },
  32500: { preco: 30.30, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'B' },
  32526: { preco: 10.58, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'B' },
  32528: { preco: 12.17, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'B' },
  21658: { preco: 40.16, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'B' },
  34475: { preco: 10.04, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'B' },
  20164: { preco: 37.40, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'A' },
  34027: { preco: 30.48, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'B' },
  35331: { preco: 65.61, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'B' },
  34325: { preco: 17.90, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'B' },
  347: { preco: 30.48, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  620: { preco: 78.20, fator: 24, fatorHecto: 0.09, grupo: 'CERVEJA', curva: 'C' },
  1114: { preco: 27.55, fator: 4, fatorHecto: 0.13, grupo: 'NAB', curva: 'C' },
  1116: { preco: 28.10, fator: 4, fatorHecto: 0.13, grupo: 'NAB', curva: 'C' },
  1166: { preco: 20.09, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  1695: { preco: 59.89, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'C' },
  1699: { preco: 21.95, fator: 8, fatorHecto: 0.02, grupo: 'CERVEJA', curva: 'C' },
  1745: { preco: 30.91, fator: 15, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  1898: { preco: 30.92, fator: 15, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  2006: { preco: 60.00, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  2008: { preco: 27.01, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  2320: { preco: 31.82, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  2350: { preco: 27.02, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  2585: { preco: 27.69, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  3733: { preco: 47.39, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  4141: { preco: 31.95, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  4143: { preco: 28.94, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  4198: { preco: 31.94, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  4262: { preco: 32.83, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  4293: { preco: 12.48, fator: 12, fatorHecto: 0.02, grupo: 'NAB', curva: 'C' },
  4367: { preco: 13.57, fator: 6, fatorHecto: 0.09, grupo: 'MARKETPLACE', curva: 'C' },
  4409: { preco: 32.00, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  7325: { preco: 34.09, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  7945: { preco: 31.34, fator: 6, fatorHecto: 0.15, grupo: 'NAB', curva: 'C' },
  7947: { preco: 32.35, fator: 6, fatorHecto: 0.15, grupo: 'NAB', curva: 'C' },
  7977: { preco: 23.14, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  7979: { preco: 28.68, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  7980: { preco: 23.41, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  7981: { preco: 23.25, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  7982: { preco: 23.40, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  7983: { preco: 23.32, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  7985: { preco: 23.82, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  8791: { preco: 30.08, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  8793: { preco: 28.15, fator: 6, fatorHecto: 0.09, grupo: 'NAB', curva: 'C' },
  8919: { preco: 29.33, fator: 12, fatorHecto: 0.07, grupo: 'NAB', curva: 'C' },
  9072: { preco: 33.26, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  9087: { preco: 19.41, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  9089: { preco: 20.64, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  9091: { preco: 24.92, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  9092: { preco: 23.57, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  9096: { preco: 20.03, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  9276: { preco: 26.13, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  9320: { preco: 35.46, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  9795: { preco: 33.45, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  10175: { preco: 44.85, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  10537: { preco: 51.64, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'C' },
  11593: { preco: 33.90, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  12951: { preco: 77.30, fator: 24, fatorHecto: 0.09, grupo: 'CERVEJA', curva: 'C' },
  13194: { preco: 61.72, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  13196: { preco: 61.72, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  13307: { preco: 56.96, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'C' },
  13486: { preco: 38.58, fator: 6, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  13566: { preco: 29.40, fator: 8, fatorHecto: 0.02, grupo: 'MATCH', curva: 'C' },
  13839: { preco: 18.23, fator: 8, fatorHecto: 0.02, grupo: 'CERVEJA', curva: 'C' },
  14099: { preco: 60.30, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  14135: { preco: 38.78, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  14283: { preco: 188.23, fator: 12, fatorHecto: 0.05, grupo: 'CERVEJA', curva: 'C' },
  14293: { preco: 166.59, fator: 12, fatorHecto: 0.05, grupo: 'CERVEJA', curva: 'C' },
  14550: { preco: 133.46, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  16503: { preco: 38.28, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  17266: { preco: 73.00, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  17268: { preco: 51.57, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  17276: { preco: 51.89, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  17278: { preco: 54.15, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  17757: { preco: 98.82, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  18142: { preco: 81.76, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  18267: { preco: 12.24, fator: 12, fatorHecto: 0.02, grupo: 'NAB', curva: 'C' },
  18268: { preco: 12.47, fator: 12, fatorHecto: 0.02, grupo: 'NAB', curva: 'C' },
  18676: { preco: 24.71, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  18677: { preco: 75.00, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  18780: { preco: 83.63, fator: 24, fatorHecto: 0.05, grupo: 'CERVEJA', curva: 'C' },
  18807: { preco: 101.72, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  18833: { preco: 79.84, fator: 24, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  18836: { preco: 118.01, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  19166: { preco: 112.88, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  19225: { preco: 138.15, fator: 24, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  19227: { preco: 29.08, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  19231: { preco: 24.82, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  19321: { preco: 12.84, fator: 12, fatorHecto: 0.02, grupo: 'NAB', curva: 'C' },
  19644: { preco: 28.51, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  19729: { preco: 28.85, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  19849: { preco: 28.90, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  20530: { preco: 64.71, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  20533: { preco: 55.86, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'C' },
  20535: { preco: 76.89, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  20549: { preco: 44.19, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  20651: { preco: 29.95, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  20853: { preco: 34.58, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  21119: { preco: 31.27, fator: 8, fatorHecto: 0.02, grupo: 'MATCH', curva: 'C' },
  21441: { preco: 19.02, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  21527: { preco: 79.90, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21529: { preco: 77.85, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21530: { preco: 30.28, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21632: { preco: 94.58, fator: 24, fatorHecto: 0.09, grupo: 'CERVEJA', curva: 'C' },
  21666: { preco: 24.82, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  21668: { preco: 70.31, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  21778: { preco: 59.00, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21781: { preco: 154.89, fator: 24, fatorHecto: 0.07, grupo: 'MARKETPLACE', curva: 'C' },
  21789: { preco: 29.97, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21791: { preco: 9.30, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21792: { preco: 62.13, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21955: { preco: 144.81, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  21968: { preco: 34.05, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  21970: { preco: 34.05, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  21973: { preco: 34.04, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  21974: { preco: 34.05, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  22003: { preco: 21.85, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22005: { preco: 21.85, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22007: { preco: 21.85, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22009: { preco: 18.65, fator: 100, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  22027: { preco: 35.00, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  22106: { preco: 18.07, fator: 10, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  22180: { preco: 86.52, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  22200: { preco: 27.31, fator: 6, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  22202: { preco: 25.67, fator: 6, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  22326: { preco: 37.67, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  22330: { preco: 26.53, fator: 60, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  22562: { preco: 42.19, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  23028: { preco: 180.86, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  29926: { preco: 177.42, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  23184: { preco: 48.03, fator: 12, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  23246: { preco: 120.96, fator: 27, fatorHecto: 0.11, grupo: 'MARKETPLACE', curva: 'C' },
  23256: { preco: 72.63, fator: 27, fatorHecto: 0.05, grupo: 'MARKETPLACE', curva: 'C' },
  23269: { preco: 115.95, fator: 24, fatorHecto: 0.06, grupo: 'MATCH', curva: 'C' },
  23271: { preco: 107.11, fator: 24, fatorHecto: 0.06, grupo: 'MATCH', curva: 'C' },
  23443: { preco: 9.50, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  23449: { preco: 40.00, fator: 12, fatorHecto: 0.03, grupo: 'MATCH', curva: 'C' },
  23546: { preco: 16.34, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'C' },
  23552: { preco: 14.21, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'C' },
  23594: { preco: 31.07, fator: 27, fatorHecto: 0.05, grupo: 'MARKETPLACE', curva: 'C' },
  24168: { preco: 130.86, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  24256: { preco: 9.50, fator: 6, fatorHecto: 0.09, grupo: 'MARKETPLACE', curva: 'C' },
  24306: { preco: 23.86, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  24408: { preco: 13.77, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  24410: { preco: 16.00, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  24479: { preco: 78.42, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  25151: { preco: 108.92, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  25160: { preco: 44.51, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  25178: { preco: 100.48, fator: 24, fatorHecto: 0.07, grupo: 'MARKETPLACE', curva: 'C' },
  25194: { preco: 29.82, fator: 12, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  25220: { preco: 12.30, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  25546: { preco: 25.00, fator: 1, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  25700: { preco: 31.02, fator: 6, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  25837: { preco: 85.90, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  26462: { preco: 41.67, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  26607: { preco: 25.01, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  27001: { preco: 54.90, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27177: { preco: 21.85, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27179: { preco: 21.85, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27522: { preco: 64.28, fator: 12, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  27559: { preco: 89.64, fator: 12, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  27686: { preco: 126.46, fator: 24, fatorHecto: 0.07, grupo: 'MATCH', curva: 'C' },
  27866: { preco: 119.80, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  28137: { preco: 32.58, fator: 8, fatorHecto: 0.02, grupo: 'MATCH', curva: 'C' },
  28203: { preco: 11.31, fator: 1, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  28204: { preco: 10.99, fator: 1, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29197: { preco: 13.38, fator: 18, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29199: { preco: 13.37, fator: 18, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29201: { preco: 13.38, fator: 18, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29207: { preco: 13.37, fator: 18, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29209: { preco: 13.37, fator: 18, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29215: { preco: 13.37, fator: 18, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29253: { preco: 62.85, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'C' },
  29485: { preco: 122.65, fator: 24, fatorHecto: 0.06, grupo: 'MATCH', curva: 'C' },
  29504: { preco: 98.90, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  29505: { preco: 162.39, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  29508: { preco: 201.64, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  29518: { preco: 50.61, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  29580: { preco: 106.95, fator: 24, fatorHecto: 0.08, grupo: 'CERVEJA', curva: 'C' },
  29845: { preco: 34.44, fator: 12, fatorHecto: 0.12, grupo: 'NAB', curva: 'C' },
  30045: { preco: 96.18, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  30852: { preco: 14.00, fator: 12, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  30854: { preco: 14.00, fator: 12, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  31064: { preco: 33.68, fator: 15, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  31272: { preco: 45.00, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  32067: { preco: 22.72, fator: 6, fatorHecto: 0.03, grupo: 'NAB', curva: 'C' },
  32126: { preco: 26.53, fator: 60, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  32128: { preco: 10.01, fator: 24, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  32131: { preco: 18.35, fator: 50, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  32155: { preco: 21.25, fator: 24, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  32349: { preco: 32.12, fator: 8, fatorHecto: 0.02, grupo: 'MATCH', curva: 'C' },
  32361: { preco: 123.34, fator: 24, fatorHecto: 0.06, grupo: 'MATCH', curva: 'C' },
  32425: { preco: 51.48, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  32427: { preco: 45.00, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  32644: { preco: 12.44, fator: 60, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  32646: { preco: 12.44, fator: 60, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  32648: { preco: 12.44, fator: 60, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  33109: { preco: 50.02, fator: 12, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  33734: { preco: 35.29, fator: 8, fatorHecto: 0.02, grupo: 'MATCH', curva: 'C' },
  33738: { preco: 67.23, fator: 12, fatorHecto: 0.03, grupo: 'MATCH', curva: 'C' },
  22859: { preco: 140.00, fator: 40, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'C' },
  22860: { preco: 70.00, fator: 40, fatorHecto: 0.1, grupo: 'MARKETPLACE', curva: 'C' },
  22871: { preco: 120.80, fator: 40, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  22876: { preco: 50.00, fator: 20, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  24184: { preco: 120.80, fator: 40, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  30132: { preco: 70.00, fator: 24, fatorHecto: 0.08, grupo: 'MARKETPLACE', curva: 'C' },
  30134: { preco: 70.00, fator: 24, fatorHecto: 0.08, grupo: 'MARKETPLACE', curva: 'C' },
  30136: { preco: 89.75, fator: 24, fatorHecto: 0.08, grupo: 'MARKETPLACE', curva: 'C' },
  30148: { preco: 53.28, fator: 36, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  30151: { preco: 53.28, fator: 36, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  30152: { preco: 53.28, fator: 36, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  30220: { preco: 50.60, fator: 20, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  30440: { preco: 70.00, fator: 24, fatorHecto: 0.08, grupo: 'MARKETPLACE', curva: 'C' },
  32036: { preco: 94.08, fator: 48, fatorHecto: 0.08, grupo: 'MARKETPLACE', curva: 'C' },
  32754: { preco: 159.00, fator: 50, fatorHecto: 0.07, grupo: 'MARKETPLACE', curva: 'C' },
  34681: { preco: 65.00, fator: 40, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  34683: { preco: 90.00, fator: 40, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  34685: { preco: 90.00, fator: 40, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  34687: { preco: 65.00, fator: 40, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  34296: { preco: 31.23, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  34298: { preco: 31.23, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29733: { preco: 19.97, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  10530: { preco: 78.40, fator: 12, fatorHecto: 0.12, grupo: 'CERVEJA', curva: 'C' },
  32175: { preco: 127.38, fator: 36, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22514: { preco: 50.39, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  34410: { preco: 30.90, fator: 21, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  34263: { preco: 28.21, fator: 8, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  9071: { preco: 51.10, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  9081: { preco: 37.90, fator: 12, fatorHecto: 0.04, grupo: 'CERVEJA', curva: 'C' },
  9093: { preco: 28.92, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  24304: { preco: 55.56, fator: 27, fatorHecto: 0.05, grupo: 'MARKETPLACE', curva: 'C' },
  31582: { preco: 46.10, fator: 24, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  31589: { preco: 46.10, fator: 24, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  31667: { preco: 46.10, fator: 24, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  31669: { preco: 46.10, fator: 24, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  33042: { preco: 46.93, fator: 24, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  33046: { preco: 168.40, fator: 20, fatorHecto: 0.16, grupo: 'MARKETPLACE', curva: 'C' },
  33048: { preco: 168.40, fator: 20, fatorHecto: 0.16, grupo: 'MARKETPLACE', curva: 'C' },
  33061: { preco: 90.06, fator: 24, fatorHecto: 0.1, grupo: 'MARKETPLACE', curva: 'C' },
  33066: { preco: 90.06, fator: 24, fatorHecto: 0.1, grupo: 'MARKETPLACE', curva: 'C' },
  34420: { preco: 29.16, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  34429: { preco: 31.96, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  34479: { preco: 13.42, fator: 6, fatorHecto: 0.09, grupo: 'MARKETPLACE', curva: 'C' },
  34770: { preco: 31.96, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  35003: { preco: 34.04, fator: 21, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  25430: { preco: 25.28, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27560: { preco: 51.57, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27562: { preco: 51.57, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27566: { preco: 28.81, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27613: { preco: 51.57, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  27624: { preco: 28.81, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  32538: { preco: 21.50, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  34529: { preco: 120.60, fator: 12, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  31713: { preco: 86.21, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'C' },
  31789: { preco: 47.68, fator: 6, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  34890: { preco: 25.00, fator: 1, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  31805: { preco: 120.60, fator: 12, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  34527: { preco: 62.51, fator: 24, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  31708: { preco: 83.80, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'C' },
  34320: { preco: 35.88, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  34432: { preco: 140.44, fator: 12, fatorHecto: 0.06, grupo: 'NAB', curva: 'C' },
  24411: { preco: 13.77, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  25329: { preco: 40.18, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  25335: { preco: 40.18, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  25347: { preco: 40.18, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22543: { preco: 24.32, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  29891: { preco: 24.32, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  32969: { preco: 31.96, fator: 4, fatorHecto: 0.01, grupo: 'NAB', curva: 'C' },
  25434: { preco: 42.80, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  35617: { preco: 38.71, fator: 8, fatorHecto: 0.02, grupo: 'MATCH', curva: 'C' },
  35136: { preco: 8.95, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  35134: { preco: 8.95, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  36034: { preco: 64.88, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  35620: { preco: 135.00, fator: 24, fatorHecto: 0.06, grupo: 'MATCH', curva: 'C' },
  35108: { preco: 51.77, fator: 3, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  21788: { preco: 83.39, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  22563: { preco: 75.00, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  24161: { preco: 19.30, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  35061: { preco: 83.80, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  30878: { preco: 58.43, fator: 1, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  31674: { preco: 47.68, fator: 6, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  31678: { preco: 166.00, fator: 12, fatorHecto: 0.12, grupo: 'MARKETPLACE', curva: 'C' },
  33854: { preco: 120.60, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  35012: { preco: 13.95, fator: 10, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  34920: { preco: 20.12, fator: 6, fatorHecto: 0.09, grupo: 'MARKETPLACE', curva: 'B' },
  34923: { preco: 19.59, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'B' },
  34918: { preco: 19.54, fator: 12, fatorHecto: 0.06, grupo: 'MARKETPLACE', curva: 'B' },
  35980: { preco: 53.49, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  35992: { preco: 51.00, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  13203: { preco: 53.90, fator: 23, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  9427: { preco: 45.90, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  37576: { preco: 40.91, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  37579: { preco: 51.03, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  37580: { preco: 48.90, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  37581: { preco: 51.03, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  37582: { preco: 48.90, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  37583: { preco: 39.20, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  23671: { preco: 51.77, fator: 3, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  23672: { preco: 51.77, fator: 3, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  29416: { preco: 51.77, fator: 3, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  29418: { preco: 51.77, fator: 3, fatorHecto: 0.03, grupo: 'MARKETPLACE', curva: 'C' },
  24604: { preco: 56.70, fator: 12, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  24609: { preco: 49.00, fator: 12, fatorHecto: 0.04, grupo: 'MARKETPLACE', curva: 'C' },
  37933: { preco: 48.90, fator: 40, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  34454: { preco: 33.60, fator: 12, fatorHecto: 0.04, grupo: 'NAB', curva: 'C' },
  1708: { preco: 48.00, fator: 6, fatorHecto: 0.15, grupo: 'NAB', curva: 'C' },
  25303: { preco: 31.16, fator: 1, fatorHecto: 0.02, grupo: 'MARKETPLACE', curva: 'C' },
  24486: { preco: 29.97, fator: 1, fatorHecto: 0.01, grupo: 'MARKETPLACE', curva: 'C' },
  24488: { preco: 17.21, fator: 1, fatorHecto: 0, grupo: 'MARKETPLACE', curva: 'C' },
  33857: { preco: 108.00, fator: 12, fatorHecto: 0.07, grupo: 'CERVEJA', curva: 'C' },
  31795: { preco: 103.80, fator: 12, fatorHecto: 0.03, grupo: 'CERVEJA', curva: 'C' },
  35338: { preco: 55.90, fator: 12, fatorHecto: 0.06, grupo: 'CERVEJA', curva: 'C' },
  33212: { preco: 75.36, fator: 6, fatorHecto: 0.06, grupo: 'MATCH', curva: 'C' }
};

/**
 * Resolves mathematically and operationally accurate Pallet & Lastro configuration:
 * Follows PBR / Ambev standard layer & palletization geometry.
 * Formula: fatorPallet = lastro * camadas
 */
export function resolvePalletAndLastro(
  inputFatorPallet?: number,
  inputLastro?: number,
  inputCamadas?: number,
  embalagem: string = '',
  descricao: string = '',
  codigo: number = 0
): { fatorPallet: number; lastro: number; camadas: number } {
  let fp = Number(inputFatorPallet) || 0;
  let lst = Number(inputLastro) || 0;
  let cam = Number(inputCamadas) || 0;

  // If user explicitly configured both fatorPallet and lastro
  if (fp > 0 && lst > 0) {
    if (cam <= 0) cam = Math.max(1, Math.round(fp / lst));
    return { fatorPallet: fp, lastro: lst, camadas: cam };
  }

  // If user configured lastro and camadas
  if (lst > 0 && cam > 0 && fp <= 0) {
    fp = lst * cam;
    return { fatorPallet: fp, lastro: lst, camadas: cam };
  }

  // If user configured only lastro
  if (lst > 0 && fp <= 0) {
    cam = 5;
    fp = lst * cam;
    return { fatorPallet: fp, lastro: lst, camadas: cam };
  }

  // If user configured or system has fatorPallet (standard Ambev / PBR packaging lookup)
  if (fp > 0) {
    switch (fp) {
      case 50: // GFA 600ml / 1L caixas de 24/12
        return { fatorPallet: 50, lastro: 10, camadas: 5 };
      case 60: // Cervejas especiais / caixas de 12
        return { fatorPallet: 60, lastro: 12, camadas: 5 };
      case 72: // GFA 300ml c/24
        return { fatorPallet: 72, lastro: 12, camadas: 6 };
      case 80: // PET 3.3L c/4
        return { fatorPallet: 80, lastro: 16, camadas: 5 };
      case 84: // LN 355ml c/24 / PET 1L c/12
        return { fatorPallet: 84, lastro: 14, camadas: 6 };
      case 91: // LN 269ml c/24 / Beats
        return { fatorPallet: 91, lastro: 13, camadas: 7 };
      case 100: // PET 2L c/6
        return { fatorPallet: 100, lastro: 20, camadas: 5 };
      case 112: // PET 1.5L c/6
        return { fatorPallet: 112, lastro: 16, camadas: 7 };
      case 120: // PET 600ml / Sucos c/12
        return { fatorPallet: 120, lastro: 20, camadas: 6 };
      case 144: // PET 600ml c/12
        return { fatorPallet: 144, lastro: 24, camadas: 6 };
      case 150: // Beats PET 1L c/6
        return { fatorPallet: 150, lastro: 25, camadas: 6 };
      case 175: // Água Mineral PET 500ml/510ml c/12
        return { fatorPallet: 175, lastro: 25, camadas: 7 };
      case 176: // Água PET 500ml c/12
        return { fatorPallet: 176, lastro: 22, camadas: 8 };
      case 182: // LN 269ml c/12
        return { fatorPallet: 182, lastro: 26, camadas: 7 };
      case 196: // Sabão Barra / Vinhos c/12
        return { fatorPallet: 196, lastro: 28, camadas: 7 };
      case 216: // Amindus c/60
        return { fatorPallet: 216, lastro: 24, camadas: 9 };
      case 220: // Latas 473ml c/12
        return { fatorPallet: 220, lastro: 22, camadas: 10 };
      case 240: // Latas / Vinhos
        return { fatorPallet: 240, lastro: 24, camadas: 10 };
      case 242: // 51 Ouro Lata 350ml c/12
        return { fatorPallet: 242, lastro: 22, camadas: 11 };
      case 260: // Latas 269ml c/15
        return { fatorPallet: 260, lastro: 26, camadas: 10 };
      case 280: // Latas Sleek 350ml c/12
        return { fatorPallet: 280, lastro: 28, camadas: 10 };
      case 286: // Latas 350ml c/12
        return { fatorPallet: 286, lastro: 22, camadas: 13 };
      case 294: // Gatorade 500ml c/6
        return { fatorPallet: 294, lastro: 42, camadas: 7 };
      case 400: // Stella Sleek c/8
        return { fatorPallet: 400, lastro: 40, camadas: 10 };
      case 520: // Beats 269ml c/8
        return { fatorPallet: 520, lastro: 52, camadas: 10 };
      case 576: // Red Bull 250ml c/4
        return { fatorPallet: 576, lastro: 48, camadas: 12 };
      case 840: // Vinhos garrafa 750ml
        return { fatorPallet: 840, lastro: 84, camadas: 10 };
      case 864: // Red Bull 250ml c/4
        return { fatorPallet: 864, lastro: 72, camadas: 12 };
      case 1650: // Halls envelope c/21
        return { fatorPallet: 1650, lastro: 150, camadas: 11 };
      case 1792: // Bubbaloo c/60
        return { fatorPallet: 1792, lastro: 128, camadas: 14 };
      case 3520: // Trident envelope c/21
        return { fatorPallet: 3520, lastro: 320, camadas: 11 };
      default:
        if (fp <= 20) {
          cam = 1;
          lst = fp;
        } else if (fp <= 80) {
          cam = 5;
          lst = Math.max(1, Math.round(fp / 5));
        } else if (fp <= 150) {
          cam = 6;
          lst = Math.max(1, Math.round(fp / 6));
        } else if (fp <= 300) {
          cam = 10;
          lst = Math.max(1, Math.round(fp / 10));
        } else {
          cam = 11;
          lst = Math.max(1, Math.round(fp / 11));
        }
        return { fatorPallet: fp, lastro: lst, camadas: cam };
    }
  }

  // Fallback by packaging or description
  const upperEmb = (embalagem || '').toUpperCase();
  const upperDesc = (descricao || '').toUpperCase();

  if (upperEmb.includes('600') || upperDesc.includes('600ML') || upperEmb.includes('1L') || upperDesc.includes(' 1L')) {
    return { fatorPallet: 50, lastro: 10, camadas: 5 };
  }
  if (upperEmb.includes('350') || upperDesc.includes('350ML')) {
    return { fatorPallet: 286, lastro: 22, camadas: 13 };
  }
  if (upperEmb.includes('473') || upperDesc.includes('473ML')) {
    return { fatorPallet: 220, lastro: 22, camadas: 10 };
  }
  if (upperEmb.includes('269') || upperDesc.includes('269ML')) {
    return { fatorPallet: 520, lastro: 52, camadas: 10 };
  }
  if (upperEmb.includes('2L') || upperDesc.includes(' 2L')) {
    return { fatorPallet: 100, lastro: 20, camadas: 5 };
  }
  if (upperEmb.includes('1,5L') || upperDesc.includes('1,5L')) {
    return { fatorPallet: 112, lastro: 16, camadas: 7 };
  }
  if (upperEmb.includes('500ML') || upperEmb.includes('510ML') || upperDesc.includes('500ML') || upperDesc.includes('510ML')) {
    return { fatorPallet: 175, lastro: 25, camadas: 7 };
  }
  if (upperEmb.includes('300ML') || upperDesc.includes('300ML')) {
    return { fatorPallet: 72, lastro: 12, camadas: 6 };
  }
  if (upperEmb.includes('355ML') || upperDesc.includes('355ML') || upperEmb.includes('LN') || upperDesc.includes('LONG NECK')) {
    return { fatorPallet: 84, lastro: 14, camadas: 6 };
  }

  return { fatorPallet: 60, lastro: 12, camadas: 5 };
}

export function getProductMeta(codigo: number | string, companyId?: string): ProductMeta {
  const codeNum = Number(codigo);
  const cid = companyId || (typeof localStorage !== 'undefined' ? (localStorage.getItem('empresa_ativa_id') || localStorage.getItem('af_empresa_id') || 'demo') : 'demo');
  const cacheKey = `${codeNum}_${cid}`;

  if (!metaCache) metaCache = new Map();
  const cached = metaCache.get(cacheKey);
  if (cached) return cached;

  // 1. Check custom user permanent overrides first (highest priority)
  const overrides = getCustomSkuOverrides();
  const custom = overrides[codeNum];

  // 2. Try to read from localStorage user saved products (Guia de Cadastros de Produtos)
  let storedProd: any = null;
  try {
    const keysToCheck = [`produtos_${cid}`, 'produtos_demo', 'produtos_global'];
    if (typeof localStorage !== 'undefined') {
      if (!cachedEmpresaProdutos) cachedEmpresaProdutos = new Map();
      for (const k of keysToCheck) {
        let list = cachedEmpresaProdutos.get(k);
        if (!list) {
          const saved = localStorage.getItem(k);
          if (saved) {
            try {
              list = JSON.parse(saved);
              if (Array.isArray(list)) {
                cachedEmpresaProdutos.set(k, list);
              }
            } catch (e) {}
          }
        }
        if (Array.isArray(list)) {
          const found = list.find((p: any) => Number(p.codigo || p.cod || p.codSKU) === codeNum);
          if (found) {
            storedProd = found;
            break;
          }
        }
      }
    }
  } catch (e) {}

  // 3. Check Master Products Database (PRODUCT_MASTER_MAP - 377 SKUs)
  const masterProd = PRODUCT_MASTER_MAP.get(codeNum);

  // 4. Check RAW_PRODUCTS catalog (O(1) Map lookup)
  const rawCatalogProd = getRawProduct(codeNum);

  // 5. Check in-memory PRODUCT_CATALOG_DETAILS
  const details = PRODUCT_CATALOG_DETAILS[codeNum];
  
  const rawFatorPallet = custom?.caixasPallet ?? custom?.fatorPallet ?? storedProd?.fatorPallet ?? storedProd?.caixasPallet ?? masterProd?.fatorPallet ?? (masterProd as any)?.caixasPallet ?? rawCatalogProd?.caixasPallet ?? details?.fatorPallet ?? details?.caixasPallet;
  const rawLastro = custom?.lastro ?? storedProd?.lastro ?? (masterProd as any)?.lastro ?? details?.lastro;
  const rawCamadas = custom?.camadas ?? storedProd?.camadas ?? (masterProd as any)?.camadas ?? details?.camadas;
  
  const embalagem = custom?.embalagem || storedProd?.embalagem || masterProd?.embalagem || details?.embalagem || '';
  const descricao = custom?.produto || storedProd?.descricao || masterProd?.descricao || rawCatalogProd?.descricao || '';

  const { fatorPallet, lastro, camadas } = resolvePalletAndLastro(
    rawFatorPallet,
    rawLastro,
    rawCamadas,
    embalagem,
    descricao,
    codeNum
  );

  const fatorHecto = custom?.fatorHecto !== undefined ? Number(custom.fatorHecto) : (storedProd?.fatorHecto !== undefined ? Number(storedProd.fatorHecto) : (masterProd?.fatorHecto !== undefined ? Number(masterProd.fatorHecto) : (rawCatalogProd?.fatorHecto !== undefined ? Number(rawCatalogProd.fatorHecto) : (details?.fatorHecto !== undefined ? Number(details.fatorHecto) : 0))));

  const preco = Number(custom?.preco || custom?.valorUnitario || storedProd?.valor || storedProd?.preco || masterProd?.valor || details?.preco || 50.0);
  const fator = Number(custom?.fatorCx || storedProd?.fator || masterProd?.fator || rawCatalogProd?.fator || details?.fator || 12);
  const grupo = custom?.grupo || storedProd?.grupo || masterProd?.grupo || details?.grupo || 'CERVEJA';
  const curva = (custom?.curva || storedProd?.curva || masterProd?.curva || details?.curva || 'C') as 'A' | 'B' | 'C';
  const idade = Number(storedProd?.idade || masterProd?.idade || details?.idade || 180);

  const result: ProductMeta = {
    preco,
    fator,
    fatorHecto,
    grupo,
    curva,
    fatorPallet,
    caixasPallet: fatorPallet,
    lastro,
    camadas,
    idade,
    embalagem,
    unidade: storedProd?.unidade || details?.unidade || ''
  };

  metaCache.set(cacheKey, result);
  return result;
}

/**
 * Checks if a product is Água (Water) - Mineral, com gás, sem gás, etc.
 * Waters are standard palletized beverages stored in the central warehouse (Armazém Central),
 * even if their master data category or group mentions MARKETPLACE.
 */
export function isWaterProduct(produtoNome: string = '', grupo: string = ''): boolean {
  const upper = (produtoNome || '').toUpperCase();
  const upperGrupo = (grupo || '').toUpperCase();

  // Excluir produtos que contenham 'agua' mas não sejam água mineral de beber (ex: aguardente, biscoito água e sal, etc.)
  if (
    upper.includes('AGUARDENTE') || 
    upper.includes('CACHAÇA') || 
    upper.includes('CACHACA') || 
    upper.includes('BISC') || 
    upper.includes('BISCOITO') ||
    upper.includes('PIRAQUE')
  ) {
    return false;
  }

  // Identificação de águas minerais / água com e sem gás
  return (
    upper.includes('AGUA') ||
    upper.includes('ÁGUA') ||
    upper.includes('MINERAL') ||
    upper.includes('INDAIA') ||
    upper.includes('INDAIÁ') ||
    upper.includes('DIAS DAVILA') ||
    upper.includes('DIAS D\'AVILA') ||
    upper.includes('AMA') ||
    upper.includes('MINALBA') ||
    upper.includes('PETROPOLIS AGUA') ||
    upper.includes('CRYSTAL') ||
    upper.includes('BONAFONT') ||
    upper.includes('AQUARIUS') ||
    (upper.includes('S/GAS') && (upper.includes('PET') || upper.includes('GFA') || upper.includes('LT'))) ||
    (upper.includes('C/GAS') && (upper.includes('PET') || upper.includes('GFA') || upper.includes('LT')))
  );
}

/**
 * Checks if a product belongs to confectionery, candies, drops, small grocery, powder juices, olive oils, or marketplace
 * (e.g. Doces Vieira, Tang, Trident, Halls, Mentos, Azeite Gallo, Drops, Gomas, etc.)
 */
export function isMarketplaceProduct(
  codigo: number | string,
  produtoNome: string = '',
  grupo: string = '',
  areaId?: number
): boolean {
  if (areaId === 3) return true; // Área 3 = Marketplace

  const upperName = (produtoNome || '').toUpperCase();
  const upperGrupo = (grupo || '').toUpperCase();

  if (
    upperGrupo.includes('MARKETPLACE') || 
    upperGrupo.includes('MKTP') || 
    upperGrupo.includes('MERCEARIA') || 
    upperGrupo.includes('DOCES') || 
    upperGrupo.includes('CONFEIT')
  ) {
    return true;
  }

  const keywords = [
    'DOCES VIEIRA',
    'DOCE VIEIRA',
    'VIEIRA',
    'TANG',
    'CLIGHT',
    'CAMP',
    'MID',
    'TRIDENT',
    'HALLS',
    'AZEITE',
    'GALLO',
    'ANDORINHA',
    'BORGES',
    'CARBONEL',
    'OLIVA',
    'MENTOS',
    'TIC TAC',
    'VALDA',
    'BUBBALOO',
    'DROPS',
    'BALA',
    'BALAS',
    'CHICLETE',
    'CHICL',
    'GOMA',
    'GOMAS',
    'PASTILHA',
    'PIRULITO',
    'CONFEITO',
    'REFRESCO',
    'PÓ PARA',
    'PO PARA',
    'SACHE',
    'SACHET',
    'CHOCOLATE',
    'BOMBOM',
    'BISCOITO',
    'WAFER',
    'SNACK',
    'DOCES',
    'GULOSEIMA',
    'MIUDEZA'
  ];

  return keywords.some(k => upperName.includes(k));
}

/**
 * Checks if a product is classified as Marketplace EXCEPT Waters.
 * Products classified as marketplace (drops, candies, confections, grocery, etc.)
 * stay in a dedicated special location and must NOT enter the Curva ABC adherence analysis
 * of the Central Warehouse (Ruas A1-A6, B1-B3, C1-C3), EXCEPT for waters which remain in the central warehouse.
 */
export function isMarketplaceProductExceptWater(
  codigo: number | string,
  produtoNome: string = '',
  grupo: string = '',
  areaId?: number
): boolean {
  // Águas nunca são excluídas da aderência do Armazém Central
  if (isWaterProduct(produtoNome, grupo)) {
    return false;
  }
  return isMarketplaceProduct(codigo, produtoNome, grupo, areaId);
}

// Alias for backwards compatibility
export const isSmallFractionalOrConfectioneryProduct = isMarketplaceProduct;

/**
 * Identifies the specific family/brand group for Marketplace products:
 * (e.g. all HALLS together, all TRIDENT together, all AZEITE together, DOCES VIEIRA together, TANG together, etc.)
 * As requested: "junte os itens do mesmo grupo e somando todos os halls, todos os trident, halls, azeite, e ocupe apenas 1"
 */
export function getMarketplaceGroup(
  codigo: number | string,
  produtoNome: string = '',
  grupo: string = ''
): string {
  const upperName = (produtoNome || '').toUpperCase();
  const upperGrupo = (grupo || '').toUpperCase();

  // Halls family
  if (upperName.includes('HALLS')) {
    return 'HALLS';
  }

  // Trident family
  if (upperName.includes('TRIDENT')) {
    return 'TRIDENT';
  }

  // Azeites (Gallo, Andorinha, Borges, Carbonel, etc.)
  if (
    upperName.includes('AZEITE') || 
    upperName.includes('GALLO') || 
    upperName.includes('ANDORINHA') || 
    upperName.includes('BORGES') || 
    upperName.includes('CARBONEL') ||
    upperName.includes('OLIVA')
  ) {
    return 'AZEITE';
  }

  // Doces Vieira
  if (
    upperName.includes('DOCES VIEIRA') || 
    upperName.includes('DOCE VIEIRA') || 
    upperName.includes('VIEIRA')
  ) {
    return 'DOCES VIEIRA';
  }

  // Tang refrescos
  if (upperName.includes('TANG')) {
    return 'TANG';
  }

  // Clight refrescos
  if (upperName.includes('CLIGHT')) {
    return 'CLIGHT';
  }

  // Mid / Camp refrescos
  if (upperName.includes('MID') || upperName.includes('CAMP') || upperName.includes('REFRESCO')) {
    return 'REFRESCOS EM PÓ';
  }

  // Bubbaloo
  if (upperName.includes('BUBBALOO')) {
    return 'BUBBALOO';
  }

  // Mentos
  if (upperName.includes('MENTOS')) {
    return 'MENTOS';
  }

  // Tic Tac
  if (upperName.includes('TIC TAC')) {
    return 'TIC TAC';
  }

  // Valda
  if (upperName.includes('VALDA')) {
    return 'VALDA';
  }

  // Outros Doces / Confeitos / Balas
  if (
    upperName.includes('BALA') || 
    upperName.includes('CHICL') || 
    upperName.includes('GOMA') || 
    upperName.includes('PIRULITO') || 
    upperName.includes('PASTILHA') || 
    upperName.includes('CONFEIT') || 
    upperName.includes('BOMBOM') || 
    upperName.includes('CHOCOLATE')
  ) {
    return 'CONFEITOS & BALAS';
  }

  // Snacks & Biscoitos
  if (upperName.includes('BISCOITO') || upperName.includes('WAFER') || upperName.includes('SNACK') || upperName.includes('SALGADINHO')) {
    return 'SNACKS & BISCOITOS';
  }

  if (upperGrupo.includes('MARKETPLACE') || upperGrupo.includes('MKTP') || upperGrupo.includes('MERCEARIA') || upperGrupo.includes('DOCES')) {
    return upperGrupo;
  }

  return 'OUTROS MARKETPLACE';
}

export interface CalculatedPalletPositions {
  totalCaixas: number;
  palletsCompletos: number;
  lastrosCalculados: number;
  posicoesOcupadas: number;
  isFracionadoSemPosicao: boolean;
  sobraCaixas: number;
  marketplaceGrupo?: string;
}

/**
 * Robust logic for pallet position calculation:
 * - Products from MARKETPLACE (Area 3 or classified as Marketplace / Confectionery / Fractional / Drops / Azeite / Doces):
 *   * If total quantity is LESS than 1 full lastro (< lastro), it DOES NOT occupy a pallet position (0 pos) - stored on shelves/flow-racks.
 *   * If total quantity is GREATER OR EQUAL to 1 lastro, it occupies pallet position (1 position if < 1 full pallet, or palletsCompletos + (sobra >= lastro ? 1 : 0)).
 * - Picking Area (Area 2):
 *   * Any physical presence with lastro > 0 occupies 1 position.
 * - Standard Warehouse areas (Area 1 Central, Area 4 Contingência, Area 5 Pulmão, Area 6 PNC, Area 7 Limpeza):
 *   * Full pallets + 1 position if there are remaining boxes.
 */
export function calculateOccupiedPalletPositions(
  totalCaixas: number,
  fatorPallet: number,
  lastro: number,
  codigo: number = 0,
  produtoNome: string = '',
  grupo: string = '',
  areaId?: number
): CalculatedPalletPositions {
  if (totalCaixas <= 0) {
    return {
      totalCaixas: 0,
      palletsCompletos: 0,
      lastrosCalculados: 0,
      posicoesOcupadas: 0,
      isFracionadoSemPosicao: false,
      sobraCaixas: 0
    };
  }

  const safeFatorPallet = fatorPallet > 0 ? fatorPallet : 50;
  const safeLastro = lastro > 0 ? lastro : Math.max(1, Math.round(safeFatorPallet / 5));

  const palletsCompletos = Math.floor(totalCaixas / safeFatorPallet);
  const sobraCaixas = totalCaixas % safeFatorPallet;
  const lastrosCalculados = sobraCaixas > 0 ? Math.ceil(sobraCaixas / safeLastro) : 0;

  const isMktp = isMarketplaceProduct(codigo, produtoNome, grupo, areaId);
  const mktpGrupo = isMktp ? getMarketplaceGroup(codigo, produtoNome, grupo) : undefined;

  let posicoesOcupadas = 0;
  let isFracionadoSemPosicao = false;

  if (isMktp) {
    // Marketplace rule:
    // "PRODUTOS CLASSIFICADOS COMO MARKETPLACE CASO NÃO TENHA UMA QUANTIDADE DE SKU NA COLUNA H SUFICIENTE PARA FORMA UM LASTRO NÃO DEVEM SER CONTABILIZADOS NA POSIÇÃO PALLET"
    if (totalCaixas < safeLastro) {
      posicoesOcupadas = 0;
      isFracionadoSemPosicao = true;
    } else if (palletsCompletos === 0) {
      // Has at least 1 lastro but less than 1 full pallet -> occupies 1 pallet position
      posicoesOcupadas = 1;
      isFracionadoSemPosicao = false;
    } else {
      // 1 or more full pallets
      // Remaining boxes only occupy another pallet position if they form at least 1 full lastro
      posicoesOcupadas = palletsCompletos + (sobraCaixas >= safeLastro ? 1 : 0);
      isFracionadoSemPosicao = sobraCaixas > 0 && sobraCaixas < safeLastro;
    }
  } else if (areaId === 2) {
    // Picking area rule:
    // Full pallets + 1 position if there is any lastro/box
    posicoesOcupadas = palletsCompletos + (sobraCaixas > 0 || lastrosCalculados > 0 || (palletsCompletos === 0 && totalCaixas > 0) ? 1 : 0);
    isFracionadoSemPosicao = false;
  } else {
    // Standard warehouse areas (Central, Contingência, Pulmão, PNC, Limpeza):
    posicoesOcupadas = palletsCompletos + (sobraCaixas > 0 ? 1 : 0);
    isFracionadoSemPosicao = false;
  }

  return {
    totalCaixas,
    palletsCompletos,
    lastrosCalculados,
    posicoesOcupadas,
    isFracionadoSemPosicao,
    sobraCaixas,
    marketplaceGrupo: mktpGrupo
  };
}

export interface MarketplaceGroupSummary {
  grupoNome: string;
  skusCount: number;
  skus: Array<{
    codigo: number;
    produto: string;
    caixas: number;
    pallets: number;
    lastros: number;
    hectolitros: number;
    atingeUmLastro: boolean;
  }>;
  totalCaixas: number;
  totalHectolitros: number;
  groupFatorPallet: number;
  groupLastro: number;
  totalLastros: number;
  atingeUmLastro: boolean;
  posicoesOcupadas: number;
  regraAplicada: string;
}

/**
 * Consolidates Marketplace products by brand/family group (all Halls, all Trident, all Azeites, all Doces Vieira, etc.)
 * Rule: "junte os itens do mesmo grupo e somando todos os halls, todos os trident, halls, azeite, e ocupe apenas 1"
 */
export function calculateMarketplaceConsolidatedPositions(
  items: Array<{
    codigo: number | string;
    produto?: string;
    qtdFisicaCaixas?: number;
    qtdPallet?: number;
    hectolitros?: number;
    areaId?: number;
    areaNome?: string;
  }>,
  companyId?: string
): {
  groups: MarketplaceGroupSummary[];
  totalMarketplacePallets: number;
  totalMarketplaceHl: number;
  totalMarketplaceCaixas: number;
  totalSkusSemPosicaoPorFaltaDeLastro: number;
} {
  const groupMap = new Map<string, MarketplaceGroupSummary>();

  // Filter only Marketplace items
  const mktpItems = items.filter(item => {
    const codeNum = Number(item.codigo);
    const meta = getProductMeta(codeNum, companyId);
    const officialDesc = getProductOfficialDescription(codeNum, item.produto || '', companyId);
    if (item.areaId === 7) return false;
    return isMarketplaceProduct(codeNum, officialDesc, meta.grupo, item.areaId);
  });

  mktpItems.forEach(item => {
    const codeNum = Number(item.codigo);
    const meta = getProductMeta(codeNum, companyId);
    const officialDesc = getProductOfficialDescription(codeNum, item.produto || '', companyId);
    const groupName = getMarketplaceGroup(codeNum, officialDesc, meta.grupo);
    
    const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : (meta.caixasPallet || 50);
    const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / (meta.camadas || 5)));
    
    let totalCaixas = Number(item.qtdFisicaCaixas || 0);
    if (totalCaixas === 0 && item.qtdPallet && item.qtdPallet > 0) {
      totalCaixas = item.qtdPallet * fatorPallet;
    }

    const temFatorHecto = meta.fatorHecto !== undefined && meta.fatorHecto > 0;
    const fatorHecto = temFatorHecto ? meta.fatorHecto! : 0;
    const itemHl = item.hectolitros !== undefined ? Number(item.hectolitros) : (temFatorHecto ? Math.round(totalCaixas * fatorHecto * 1000) / 1000 : 0);

    const atingeUmLastroSku = totalCaixas >= lastro;
    const palletsSku = Math.floor(totalCaixas / fatorPallet);
    const lastrosSku = (totalCaixas % fatorPallet) > 0 ? Math.ceil((totalCaixas % fatorPallet) / lastro) : 0;

    if (!groupMap.has(groupName)) {
      groupMap.set(groupName, {
        grupoNome: groupName,
        skusCount: 0,
        skus: [],
        totalCaixas: 0,
        totalHectolitros: 0,
        groupFatorPallet: fatorPallet,
        groupLastro: lastro,
        totalLastros: 0,
        atingeUmLastro: false,
        posicoesOcupadas: 0,
        regraAplicada: ''
      });
    }

    const grp = groupMap.get(groupName)!;
    grp.skusCount += 1;
    grp.skus.push({
      codigo: codeNum,
      produto: officialDesc,
      caixas: totalCaixas,
      pallets: palletsSku,
      lastros: lastrosSku,
      hectolitros: itemHl,
      atingeUmLastro: atingeUmLastroSku
    });
    grp.totalCaixas += totalCaixas;
    grp.totalHectolitros = Math.round((grp.totalHectolitros + itemHl) * 1000) / 1000;
    grp.groupFatorPallet = Math.max(grp.groupFatorPallet, fatorPallet);
    grp.groupLastro = Math.min(grp.groupLastro, lastro);
  });

  let totalMarketplacePallets = 0;
  let totalMarketplaceHl = 0;
  let totalMarketplaceCaixas = 0;
  let totalSkusSemPosicaoPorFaltaDeLastro = 0;

  const groupsList: MarketplaceGroupSummary[] = [];

  groupMap.forEach(grp => {
    const totalCaixas = grp.totalCaixas;
    const lastro = grp.groupLastro;
    const fatorPallet = grp.groupFatorPallet;

    grp.totalLastros = lastro > 0 ? Math.ceil(totalCaixas / lastro) : 0;
    grp.atingeUmLastro = totalCaixas >= lastro;

    if (totalCaixas <= 0) {
      grp.posicoesOcupadas = 0;
      grp.regraAplicada = 'Sem estoque físico';
    } else if (totalCaixas < lastro) {
      // Rule: Não tem quantidade para formar 1 lastro -> 0 posições
      grp.posicoesOcupadas = 0;
      grp.regraAplicada = `Soma (${totalCaixas} cx) < 1 Lastro (${lastro} cx) → Não ocupa posição pallet (0 pos)`;
      totalSkusSemPosicaoPorFaltaDeLastro += grp.skusCount;
    } else {
      // Rule: "junte os itens do mesmo grupo e somando todos os halls, todos os trident, halls, azeite, e ocupe apenas 1"
      // If sum of boxes is >= 1 lastro:
      const fullPallets = Math.floor(totalCaixas / fatorPallet);
      const remainingBoxes = totalCaixas % fatorPallet;
      
      if (fullPallets === 0) {
        grp.posicoesOcupadas = 1;
        grp.regraAplicada = `Itens agrupados (${totalCaixas} cx >= 1 lastro) → Ocupam 1 Posição Pallet compartilhada`;
      } else {
        const extraPos = remainingBoxes >= lastro ? 1 : 0;
        grp.posicoesOcupadas = fullPallets + extraPos;
        grp.regraAplicada = `${fullPallets} pallet(s) completo(s) + ${extraPos} sobra (>= 1 lastro) = ${grp.posicoesOcupadas} pos`;
      }
    }

    totalMarketplacePallets += grp.posicoesOcupadas;
    totalMarketplaceHl += grp.totalHectolitros;
    totalMarketplaceCaixas += grp.totalCaixas;

    groupsList.push(grp);
  });

  return {
    groups: groupsList.sort((a, b) => b.totalCaixas - a.totalCaixas),
    totalMarketplacePallets,
    totalMarketplaceHl: Math.round(totalMarketplaceHl * 1000) / 1000,
    totalMarketplaceCaixas,
    totalSkusSemPosicaoPorFaltaDeLastro
  };
}

/**
 * Recalculates 02.11.01 quantities based on total items count divided by Fator Pallet and Fator Lastro
 */
export function recalculatePosicaoPalletItem(item: any, companyId?: string): any {
  const codeNum = Number(item.codigo);
  const meta = getProductMeta(codeNum, companyId);
  const officialDesc = getProductOfficialDescription(codeNum, item.produto || '', companyId);
  
  const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : (meta.caixasPallet && meta.caixasPallet > 0 ? meta.caixasPallet : 50);
  const lastro = meta.lastro && meta.lastro > 0 ? meta.lastro : Math.max(1, Math.round(fatorPallet / (meta.camadas || 5)));
  
  // Total physical boxes from 02.11.01
  let totalCaixas = Number(item.qtdFisicaCaixas || 0);
  if (totalCaixas === 0 && item.qtdPallet > 0) {
    totalCaixas = item.qtdPallet * fatorPallet;
  }
  
  const calc = calculateOccupiedPalletPositions(
    totalCaixas,
    fatorPallet,
    lastro,
    codeNum,
    officialDesc,
    meta.grupo || '',
    item.areaId
  );
  
  const temFatorHecto = meta.fatorHecto !== undefined && meta.fatorHecto > 0;
  const fatorHecto = temFatorHecto ? meta.fatorHecto! : 0;
  const hectolitros = temFatorHecto ? Math.round((totalCaixas * fatorHecto) * 1000) / 1000 : 0;
  
  return {
    ...item,
    produto: officialDesc,
    qtdFisicaCaixas: totalCaixas,
    qtdPallet: calc.palletsCompletos,
    qtdLastro: calc.lastrosCalculados,
    posicoesPalletOcupadas: calc.posicoesOcupadas,
    isFracionadoSemPosicao: calc.isFracionadoSemPosicao,
    marketplaceGrupo: calc.marketplaceGrupo,
    fatorHecto,
    temFatorHecto,
    hectolitros,
    fatorPallet,
    lastro,
    camadas: meta.camadas
  };
}

