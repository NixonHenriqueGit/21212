import { LISTA_COLABORADORES_OFICIAIS } from '../components/RankingModule';
import { ColaboradorMaster } from '../types';

// Fast in-memory memoization caches
const _normCache = new Map<string, string>();
const _sameColabCache = new Map<string, boolean>();
let _cachedMasterNames: string[] | null = null;
let _lastMasterNamesCheck = 0;

export function clearCollaboratorNormalizeCache(): void {
  _normCache.clear();
  _sameColabCache.clear();
  _cachedMasterNames = null;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('colaboradores_')) {
      clearCollaboratorNormalizeCache();
    }
  });
  window.addEventListener('colaboradores-updated', clearCollaboratorNormalizeCache);
}

function getMasterNames(customColabs?: ColaboradorMaster[]): string[] {
  const now = Date.now();
  if (_cachedMasterNames && now - _lastMasterNamesCheck < 15000) {
    return _cachedMasterNames;
  }

  const masterNames: string[] = [];
  const seen = new Set<string>();

  LISTA_COLABORADORES_OFICIAIS.forEach(c => {
    if (c.nome) {
      const u = c.nome.toUpperCase().trim();
      if (!seen.has(u)) {
        seen.add(u);
        masterNames.push(u);
      }
    }
  });

  if (customColabs && Array.isArray(customColabs)) {
    customColabs.forEach(c => {
      if (c.nome) {
        const u = c.nome.toUpperCase().trim();
        if (!seen.has(u)) {
          seen.add(u);
          masterNames.push(u);
        }
      }
    });
  }

  try {
    const savedKeys = Object.keys(localStorage).filter(k => k.startsWith('colaboradores_'));
    for (const key of savedKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          list.forEach((c: any) => {
            if (c.nome) {
              const u = String(c.nome).toUpperCase().trim();
              if (!seen.has(u)) {
                seen.add(u);
                masterNames.push(u);
              }
            }
          });
        }
      }
    }
  } catch (e) {}

  _cachedMasterNames = masterNames;
  _lastMasterNamesCheck = now;

  return masterNames;
}

/**
 * Normalizes a raw collaborator name string by matching against the master registered list of collaborators.
 * Example: "mARIVALDO mARIVALDO" -> "MARIVALDO ARTUR ALVES"
 * Example: "Nixon Arruda" -> "NIXON HENRIQUE PEREIRA DE ARRUDA"
 * Example: "Paulo Pereira" -> "PAULO PEREIRA DA SILVA"
 * If no registered collaborator matches, retains the cleaned original name.
 */
export function normalizeCollaboratorName(rawName: string, customColabs?: ColaboradorMaster[]): string {
  if (!rawName || !rawName.trim()) return '';

  const cacheKey = rawName.toUpperCase().trim();
  if (_normCache.has(cacheKey)) {
    return _normCache.get(cacheKey)!;
  }

  let cleaned = rawName.trim().replace(/\s+/g, ' ');

  // Remove duplicated consecutive words (e.g., "MARIVALDO MARIVALDO" -> "MARIVALDO")
  const tokens = cleaned.split(' ');
  const uniqueTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const currentUpper = tokens[i].toUpperCase();
    const prevUpper = i > 0 ? tokens[i - 1].toUpperCase() : '';
    if (currentUpper !== prevUpper) {
      uniqueTokens.push(tokens[i]);
    }
  }
  cleaned = uniqueTokens.join(' ').toUpperCase();

  // Explicit Alias Mappings
  if (cleaned === 'ROMILDO' || cleaned === 'RONILDO' || cleaned === 'JOSE RONILDO' || cleaned === 'JOSÉ RONILDO' || cleaned.includes('ROMILDO') || cleaned.includes('RONILDO')) {
    cleaned = 'JOSE RONILDO DA SILVA';
  } else if (cleaned === 'GLADSOON' || cleaned === 'GLADSON' || cleaned === 'GLADSON LISBOA' || cleaned.includes('GLADSOON') || cleaned.includes('GLADSON')) {
    cleaned = 'GLADSON LISBOA DOS SANTOS';
  } else if (cleaned === 'OZENILDO' || cleaned === 'OZENILDO SOUSA' || cleaned.includes('OZENILDO')) {
    cleaned = 'OZENILDO SOUSA SILVA';
  } else if (cleaned === 'DEJEAN' || cleaned === 'DEJEAN SILVA' || cleaned.includes('DEJEAN')) {
    cleaned = 'DEJEAN SILVA DE OLIVEIRA';
  } else if (cleaned === 'GILSON' || cleaned === 'GILSON ROSA' || cleaned.includes('GILSON ROSA')) {
    cleaned = 'GILSON ROSA DA SILVA';
  } else if (cleaned === 'CICERO' || cleaned === 'CÍCERO' || cleaned === 'CICERO MATHEU' || cleaned === 'CÍCERO MATEU' || cleaned.includes('CICERO') || cleaned.includes('CÍCERO')) {
    cleaned = 'CICERO MATHEU DE OLIVEIRA SILVA';
  } else if (cleaned === 'ELDENKLEBER' || cleaned === 'ELDENKLEBER MAURICIO' || cleaned.includes('ELDENKLEBER')) {
    cleaned = 'ELDENKLEBER MAURICIO DA SILVA';
  } else if (cleaned === 'ADMILTON' || cleaned === 'ADMILTON HERMINIO' || cleaned.includes('ADMILTON')) {
    cleaned = 'ADMILTON HERMINIO DOS SANTOS MARCELINO';
  } else if (cleaned === 'DIMAS' || cleaned === 'DIMAS EMANUEL' || cleaned.includes('DIMAS')) {
    cleaned = 'DIMAS EMANUEL MISSIAS DA SILVA';
  } else if (cleaned === 'EDILSON' || cleaned === 'EDILSON VIEIRA' || cleaned.includes('EDILSON')) {
    cleaned = 'EDILSON VIEIRA DA SILVA';
  } else if (cleaned === 'NATANAEL' || cleaned === 'NATANAEL LUIZ' || cleaned.includes('NATANAEL')) {
    cleaned = 'NATANAEL LUIZ DA SILVA';
  } else if (cleaned === 'DIOGENES' || cleaned === 'DIÓGENES' || cleaned === 'DIOGENES PEREIRA' || cleaned.includes('DIOGENES') || cleaned.includes('DIÓGENES')) {
    cleaned = 'DIOGENES PEREIRA DA SILVA';
  } else if (cleaned === 'PAULO PEREIRA' || (cleaned.includes('PAULO') && cleaned.includes('PEREIRA'))) {
    cleaned = 'PAULO PEREIRA DA SILVA';
  } else if (cleaned === 'LUIS' || cleaned === 'LUIZ' || cleaned === 'LUIS ANTONIO' || cleaned.includes('LUIS ANTONIO')) {
    cleaned = 'LUIS ANTONIO FREIRE MOREIRA';
  } else if (cleaned === 'MARIVALDO' || cleaned === 'MARIVALDO ARTUR' || cleaned.includes('MARIVALDO')) {
    cleaned = 'MARIVALDO ARTUR ALVES';
  }

  const masterNames = getMasterNames(customColabs);

  // 1. Direct exact match
  const exactMatch = masterNames.find(n => n === cleaned);
  if (exactMatch) {
    _normCache.set(cacheKey, exactMatch);
    return exactMatch;
  }

  // 2. Token / Similarity match
  const cleanedTokens = cleaned.split(' ').filter(t => t.length > 2);
  let bestMatch: string | null = null;
  let highestScore = 0;

  for (const officialName of masterNames) {
    const officialTokens = officialName.split(' ');

    // Calculate token match ratio
    let matchedTokenCount = 0;
    cleanedTokens.forEach(ct => {
      if (officialTokens.some(ot => ot === ct || ot.startsWith(ct) || ct.startsWith(ot))) {
        matchedTokenCount++;
      }
    });

    if (cleanedTokens.length > 0) {
      const score = matchedTokenCount / Math.max(cleanedTokens.length, 1);
      // If all tokens in the input match the official name, or score >= 0.6
      if (score > highestScore && (score >= 0.6 || matchedTokenCount >= 2)) {
        highestScore = score;
        bestMatch = officialName;
      }
    }
  }

  // Fallback: If input starts with a first name (e.g. "MARIVALDO") and there's only one collaborator with that first name
  if (!bestMatch && cleanedTokens.length >= 1) {
    const firstName = cleanedTokens[0];
    const matchesWithFirstName = masterNames.filter(n => n.startsWith(firstName));
    if (matchesWithFirstName.length === 1) {
      bestMatch = matchesWithFirstName[0];
    }
  }

  const finalResult = bestMatch || cleaned;
  _normCache.set(cacheKey, finalResult);
  return finalResult;
}

/**
 * Checks if two collaborator name references refer to the same person,
 * supporting nicknames, first names, and full registered names.
 * (e.g. "MARIVALDO" matches "MARIVALDO ARTUR ALVES")
 */
export function isSameCollaborator(
  raw1?: string | null,
  raw2?: string | null,
  customColabs?: ColaboradorMaster[]
): boolean {
  if (!raw1 || !raw2) return false;
  const clean1 = String(raw1).toUpperCase().trim();
  const clean2 = String(raw2).toUpperCase().trim();
  if (!clean1 || !clean2) return false;
  if (clean1 === 'TODOS' || clean2 === 'TODOS') return true;
  if (clean1 === clean2) return true;
  if (clean1.includes(clean2) || clean2.includes(clean1)) return true;

  const pairKey = clean1 < clean2 ? `${clean1}|${clean2}` : `${clean2}|${clean1}`;
  if (_sameColabCache.has(pairKey)) {
    return _sameColabCache.get(pairKey)!;
  }

  let result = false;
  const norm1 = normalizeCollaboratorName(clean1, customColabs).toUpperCase().trim();
  const norm2 = normalizeCollaboratorName(clean2, customColabs).toUpperCase().trim();
  if (norm1 && norm2) {
    if (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1)) {
      result = true;
    }
  }

  if (!result) {
    const first1 = clean1.split(' ')[0];
    const first2 = clean2.split(' ')[0];
    if (first1.length >= 3 && first2.length >= 3 && first1 === first2) {
      result = true;
    }
  }

  _sameColabCache.set(pairKey, result);
  return result;
}

/**
 * Normalizes all collaborator name fields inside a dataset of records.
 */
export function normalizeCollaboratorNamesInRecords<T extends Record<string, any>>(
  records: T[],
  nameFields: string[],
  customColabs?: ColaboradorMaster[]
): T[] {
  if (!Array.isArray(records) || records.length === 0) return records;

  return records.map(record => {
    const updated = { ...record };
    let hasChanges = false;

    nameFields.forEach(field => {
      if (typeof updated[field] === 'string' && updated[field].trim()) {
        const original = updated[field];
        const normalized = normalizeCollaboratorName(original, customColabs);
        if (normalized && normalized !== original) {
          (updated as any)[field] = normalized;
          hasChanges = true;
        }
      }
    });

    return updated;
  });
}

/**
 * Checks if a collaborator exists in the official list or stored custom list, returning official cargo, name, and turno
 */
export function getCollaboratorOfficialInfo(rawOrNormName: string, empresaId: string = 'demo'): { isRegistered: boolean; cargo: string; nomeOficial: string; turno: string } {
  const norm = normalizeCollaboratorName(rawOrNormName);
  if (!norm) return { isRegistered: false, cargo: '', nomeOficial: rawOrNormName, turno: 'MANHÃ' };

  // 1. Check official static list (Master source of truth for shifts and official positions)
  const official = LISTA_COLABORADORES_OFICIAIS.find(c => c.nome.toUpperCase().trim() === norm.toUpperCase().trim());

  // 2. Check custom colaboradores saved in localStorage
  try {
    const saved = localStorage.getItem(`colaboradores_${empresaId}`);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        const match = list.find((c: any) => c.nome && String(c.nome).toUpperCase().trim() === norm.toUpperCase().trim());
        if (match) {
          let cUpper = String(match.cargo || '').toUpperCase();
          let cForm = match.cargo || (official?.cargo || 'Ajudante');
          if (cUpper.includes('EMPILHA')) cForm = 'Empilhador';
          else if (cUpper.includes('CONFEREN')) cForm = 'Conferente';
          else if (cUpper.includes('AJUDAN') || cUpper.includes('AUXILIAR')) cForm = 'Ajudante';
          
          const effTurno = match.turno || official?.turno || 'MANHÃ';
          return { isRegistered: true, cargo: cForm, nomeOficial: match.nome || norm, turno: effTurno };
        }
      }
    }
  } catch (e) {}

  if (official) {
    return { isRegistered: true, cargo: official.cargo, nomeOficial: official.nome, turno: official.turno };
  }

  return { isRegistered: false, cargo: '', nomeOficial: norm, turno: 'MANHÃ' };
}

/**
 * Performs a quick registration or cargo update for a collaborator
 */
export function registerQuickCollaborator(nome: string, cargo: string, empresaId: string = 'demo'): void {
  const cleanName = nome.toUpperCase().trim();
  let cleanCargo = (cargo || 'Ajudante').trim();
  const upperC = cleanCargo.toUpperCase();
  if (upperC.includes('EMPILHA')) cleanCargo = 'Empilhador';
  else if (upperC.includes('CONFEREN')) cleanCargo = 'Conferente';
  else if (upperC.includes('AJUDAN') || upperC.includes('AUXILIAR')) cleanCargo = 'Ajudante';

  if (!cleanName) return;

  const key = `colaboradores_${empresaId}`;
  let list: any[] = [];
  try {
    const saved = localStorage.getItem(key);
    if (saved) list = JSON.parse(saved);
  } catch (e) {}

  if (!Array.isArray(list)) list = [];

  const existingIdx = list.findIndex(c => String(c.nome).toUpperCase().trim() === cleanName);
  const funcaoGrp = cleanCargo === 'Empilhador' ? 'Empilhador' : (cleanCargo === 'Conferente' ? 'Operador' : 'Ajudante');

  if (existingIdx >= 0) {
    list[existingIdx] = { 
      ...list[existingIdx], 
      cargo: cleanCargo,
      funcaoGroup: funcaoGrp,
      atualizadoEm: new Date().toISOString()
    };
  } else {
    list.push({
      matricula: `G${1100 + list.length + Math.floor(Math.random() * 800)}`,
      nome: cleanName,
      cargo: cleanCargo,
      turno: 'MANHÃ',
      funcaoGroup: funcaoGrp,
      criadoEm: new Date().toISOString()
    });
  }

  localStorage.setItem(key, JSON.stringify(list));
  window.dispatchEvent(new Event('colaboradores_updated'));
  window.dispatchEvent(new Event('storage'));
}

