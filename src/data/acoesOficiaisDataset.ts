import { convertRawItemToAcaoCorretiva, RawAcaoItem } from './acoesTransformer';
import { AcaoCorretiva } from '../utils/simulacaoAcoesUtils';
import acoesJson from './acoesOficiais2026.json';

export const ACOES_OFICIAIS_METADATA = {
  versao: acoesJson.versao,
  origem: acoesJson.origem,
  descricao: acoesJson.descricao,
  total_acoes: acoesJson.total_acoes,
  data_limite: acoesJson.data_limite
};

let cachedAcoes: AcaoCorretiva[] | null = null;

export function getOfficialSeededAcoes(): AcaoCorretiva[] {
  if (cachedAcoes) return cachedAcoes;
  
  const rawList = (acoesJson.acoes || []) as RawAcaoItem[];
  cachedAcoes = rawList.map(convertRawItemToAcaoCorretiva);
  return cachedAcoes;
}
