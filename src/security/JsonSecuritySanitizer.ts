/**
 * JSON SECURITY & SANITIZATION ENGINE (Item 21 - Regras de Segurança)
 * 
 * Garante que:
 * 1. O JSON não contenha informações que o usuário não tenha permissão de acessar.
 * 2. Firestore permissions -> JSON permissions sejam rigorosamente equivalentes.
 * 3. Dados sensíveis NUNCA sejam persistidos ou expostos em /public/banco-dados/ ou no cliente.
 * 4. Dados sejam particionados e isolados por empresaId, unidadeId e perfil de usuário.
 * 5. Campos confidenciais (senhas, hashes, tokens, secrets, credenciais, dados bancários)
 *    sejam automaticamente purgados por sanitização recursiva profunda.
 */

import { Usuario } from '../types';
import { getUserRoleType, isPanelAllowedForUser, RoleType } from '../utils/permissions';

// Lista exaustiva de chaves sensíveis proibidas em JSON e armazenamento público
export const BANNED_SENSITIVE_KEYS = [
  'senha',
  'password',
  'senhacriptografada',
  'hash',
  'salt',
  'pin',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'bearertoken',
  'idtoken',
  'authsecret',
  'secret',
  'secretkey',
  'apikey',
  'privatekey',
  'private_key',
  'certificate',
  'cert',
  'credencial',
  'credenciais',
  'credentials',
  'clientsecret',
  'client_secret',
  'cpf',
  'rg',
  'dadosbancarios',
  'contabancaria',
  'chavepix',
  'salario',
  'remuneracao'
];

export interface SecurityAuditResult {
  passed: boolean;
  totalKeysInspected: number;
  sensitiveKeysFound: string[];
  sanitizedRecordsCount: number;
  timestamp: string;
}

export interface SecurityValidationOptions {
  empresaId?: string;
  unidadeId?: string;
  user?: Usuario | null;
  stripSensitive?: boolean;
}

/**
 * Sanitiza recursivamente qualquer objeto ou array, eliminando campos sensíveis.
 */
export function sanitizeData<T>(input: T, strippedKeysCount = { count: 0 }): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeData(item, strippedKeysCount)) as unknown as T;
  }

  if (typeof input === 'object' && input !== null) {
    const sanitizedObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isSensitive = BANNED_SENSITIVE_KEYS.some(banned => normalizedKey.includes(banned));

      if (isSensitive) {
        strippedKeysCount.count++;
        // Não inclui a chave sensível no objeto final (purge completo)
        continue;
      }

      if (typeof value === 'object' && value !== null) {
        sanitizedObj[key] = sanitizeData(value, strippedKeysCount);
      } else {
        sanitizedObj[key] = value;
      }
    }

    return sanitizedObj as T;
  }

  return input;
}

/**
 * Mapeamento de coleções e os módulos equivalentes para verificação de permissão.
 */
const COLLECTION_TO_MODULE_MAP: Record<string, string> = {
  produtos: 'visao-geral',
  estoque_snapshot: 'armazem',
  quebras: 'quebras',
  despejos: 'despejo',
  divergencias: 'conferente',
  repack: 'repack',
  wlp_montagens: 'empilhador',
  jornadas_colaboradores: 'ajudante',
  af_rotas: 'conferente',
  af_pesagens: 'conferente',
  af_5s_audits: 'qualidade',
  acoes_desvios_gatilhos: 'acoes',
  fechamentos: 'controle',
  usuarios: 'controle',
  colaboradores: 'cadastros',
  configuracoes: 'controle'
};

/**
 * Valida se um usuário possui permissão equivalente no JSON à permissão do Firestore.
 * 
 * Regra:
 * Firestore Permissions ➔ JSON Permissions (100% Equivalentes)
 */
export function validateJsonAccessPermission(
  collectionName: string,
  user: Usuario | null | undefined,
  operation: 'read' | 'write' = 'read'
): boolean {
  // Administradores e bypass têm acesso irrestrito
  if (!user) {
    // Modo anônimo / consulta pública: apenas coleções públicas consolidadas (dashboards agregados)
    return ['produtos', 'dashboard_agregado', 'indices'].includes(collectionName) && operation === 'read';
  }

  const role = getUserRoleType(user);
  if (role === 'admin') {
    return true;
  }

  // Operações de escrita em coleções mestres restritas a admin
  if (operation === 'write' && ['usuarios', 'configuracoes', 'fechamentos', 'colaboradores'].includes(collectionName)) {
    return false;
  }

  const targetModule = COLLECTION_TO_MODULE_MAP[collectionName] || 'visao-geral';
  return isPanelAllowedForUser(targetModule, user);
}

/**
 * Filtra registros por partição de tenant (empresaId, unidadeId) e escopo de usuário.
 */
export function filterRecordsBySecurityScope<T extends { empresaId?: string; unidadeId?: string; userId?: string }>(
  records: T[],
  empresaId: string,
  user: Usuario | null | undefined
): T[] {
  if (!Array.isArray(records)) return [];
  
  // 1. Filtro estrito de empresa (Multi-Tenant Isolation)
  let filtered = records.filter(item => {
    if (!item.empresaId) return true; // registros globais permitidos
    return item.empresaId === empresaId;
  });

  if (!user) return filtered;

  const role = getUserRoleType(user);
  if (role === 'admin') return filtered;

  // 2. Filtro de unidade quando o usuário tem unidade específica
  if (user.unidadeId) {
    filtered = filtered.filter(item => {
      if (!item.unidadeId) return true;
      return item.unidadeId === user.unidadeId;
    });
  }

  return filtered;
}

/**
 * Realiza uma auditoria estrita em qualquer estrutura JSON antes da gravação ou exportação.
 */
export function auditJsonSecurity(data: any): SecurityAuditResult {
  const strippedCounter = { count: 0 };
  let totalKeys = 0;
  const sensitiveKeysFound: string[] = [];

  function inspect(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach(inspect);
      return;
    }

    for (const [k, v] of Object.entries(obj)) {
      totalKeys++;
      const norm = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isBad = BANNED_SENSITIVE_KEYS.some(b => norm.includes(b));
      if (isBad) {
        if (!sensitiveKeysFound.includes(k)) {
          sensitiveKeysFound.push(k);
        }
      }
      if (typeof v === 'object' && v !== null) {
        inspect(v);
      }
    }
  }

  inspect(data);

  return {
    passed: sensitiveKeysFound.length === 0,
    totalKeysInspected: totalKeys,
    sensitiveKeysFound,
    sanitizedRecordsCount: strippedCounter.count,
    timestamp: new Date().toISOString()
  };
}
