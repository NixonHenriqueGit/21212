import { useState, useEffect, useCallback } from 'react';

export interface SystemTargets {
  efc: number; // 96%
  efd: number; // 90%
  refugo: number; // 1.0%
  fefo: number; // 98%
  stock_age_meta: number; // 80% (Saúde do Stock Age Index >= 80%)
  wqi: number; // 95%
  repack_produtividade: number; // 30 cx/h (ou unid/h)
  repack_tempo_segundos: number; // 50s por embalagem
  picking_produtividade: number; // 130 cx/h
  despejo_produtividade: number; // 30 cx/h (igual ao repack)
  despejo_tempo_segundos: number; // 50s por embalagem (igual ao repack)
  pnp_conferente: number; // 6.23 HL/HH (Produtividade Hectolitro Homem Hora igual a empilhadores e ajudantes)
  quebras_limite: number; // 0.15%
  saude_estoque: number; // 80% (Saúde do estoque >= 80% considerando divergências físicas vs fiscais)
  acuracidade_inventario: number; // 99.5%
  capacidade_ocupacao: number; // 85%
  montagem_produtividade: number; // 100 cx/h
  tmr_carreta: number; // 150 min (2h30)
  tmr_recarga: number; // 50 min
  tmr_terceiros: number; // 150 min (2h30)
  wlp: number; // 6.23 HL/HH
  [key: string]: number;
}

export const DEFAULT_TARGETS: SystemTargets = {
  efc: 96,
  efd: 90,
  refugo: 1.0,
  fefo: 98,
  stock_age_meta: 80,
  wqi: 95,
  repack_produtividade: 30,
  repack_tempo_segundos: 50,
  picking_produtividade: 130,
  despejo_produtividade: 30,
  despejo_tempo_segundos: 50,
  pnp_conferente: 6.23,
  quebras_limite: 0.15,
  saude_estoque: 80,
  acuracidade_inventario: 99.5,
  capacidade_ocupacao: 85,
  montagem_produtividade: 100,
  tmr_carreta: 150,
  tmr_recarga: 50,
  tmr_terceiros: 150,
  wlp: 6.23
};

const TARGETS_STORAGE_KEY = 'dpo_system_targets_v1';

export function getSystemTargets(companyId?: string): SystemTargets {
  try {
    // 1. Tentar ler da chave específica da empresa se fornecida
    if (companyId) {
      const savedCompany = localStorage.getItem(`${TARGETS_STORAGE_KEY}_${companyId}`);
      if (savedCompany) {
        return { ...DEFAULT_TARGETS, ...JSON.parse(savedCompany) };
      }
    }

    // 2. Tentar ler da chave global persistida
    const saved = localStorage.getItem(TARGETS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_TARGETS, ...JSON.parse(saved) };
    }

    // 3. Tentar recuperar de empresa_data se existir
    if (companyId) {
      const empresaDataRaw = localStorage.getItem(`empresa_data_${companyId}`);
      if (empresaDataRaw) {
        const parsed = JSON.parse(empresaDataRaw);
        if (parsed.targets) {
          return { ...DEFAULT_TARGETS, ...parsed.targets };
        }
      }
    }
  } catch (e) {
    console.error('Error loading targets:', e);
  }
  return { ...DEFAULT_TARGETS };
}

export function setSystemTarget(key: string, value: number, companyId?: string) {
  try {
    const current = getSystemTargets(companyId);
    current[key] = value;
    
    // Salvar na chave global
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(current));
    
    // Salvar na chave da empresa se disponível
    if (companyId) {
      localStorage.setItem(`${TARGETS_STORAGE_KEY}_${companyId}`, JSON.stringify(current));
      
      // Sincronizar com empresa_data
      try {
        const empresaDataRaw = localStorage.getItem(`empresa_data_${companyId}`);
        if (empresaDataRaw) {
          const parsed = JSON.parse(empresaDataRaw);
          parsed.targets = { ...(parsed.targets || {}), [key]: value };
          localStorage.setItem(`empresa_data_${companyId}`, JSON.stringify(parsed));
        }
      } catch (err) {}
    }

    // Disparar eventos para todos os componentes reagirem imediatamente
    window.dispatchEvent(new CustomEvent('dpo_targets_updated', { detail: { key, value, targets: current, companyId } }));
    window.dispatchEvent(new CustomEvent('dpo_recalcular_atingimento', { detail: { targets: current, companyId } }));
  } catch (e) {
    console.error('Error saving target:', e);
  }
}

export function setSystemTargetsBatch(batch: Partial<SystemTargets>, companyId?: string) {
  try {
    const current = getSystemTargets(companyId);
    const updated = { ...current, ...batch };
    
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(updated));
    if (companyId) {
      localStorage.setItem(`${TARGETS_STORAGE_KEY}_${companyId}`, JSON.stringify(updated));
      try {
        const empresaDataRaw = localStorage.getItem(`empresa_data_${companyId}`);
        if (empresaDataRaw) {
          const parsed = JSON.parse(empresaDataRaw);
          parsed.targets = { ...(parsed.targets || {}), ...batch };
          localStorage.setItem(`empresa_data_${companyId}`, JSON.stringify(parsed));
        }
      } catch (err) {}
    }

    window.dispatchEvent(new CustomEvent('dpo_targets_updated', { detail: { targets: updated, companyId } }));
    window.dispatchEvent(new CustomEvent('dpo_recalcular_atingimento', { detail: { targets: updated, companyId } }));
  } catch (e) {
    console.error('Error saving targets batch:', e);
  }
}

export function resetToAchievableTargets(companyId?: string): SystemTargets {
  try {
    localStorage.setItem(TARGETS_STORAGE_KEY, JSON.stringify(DEFAULT_TARGETS));
    if (companyId) {
      localStorage.setItem(`${TARGETS_STORAGE_KEY}_${companyId}`, JSON.stringify(DEFAULT_TARGETS));
    }
    window.dispatchEvent(new CustomEvent('dpo_targets_updated', { detail: { targets: DEFAULT_TARGETS, companyId } }));
    window.dispatchEvent(new CustomEvent('dpo_recalcular_atingimento', { detail: { targets: DEFAULT_TARGETS, companyId } }));
  } catch (e) {
    console.error('Error resetting targets:', e);
  }
  return { ...DEFAULT_TARGETS };
}

export function useSystemTargets(companyId?: string) {
  const [targets, setTargets] = useState<SystemTargets>(() => getSystemTargets(companyId));

  useEffect(() => {
    const handleUpdate = () => {
      setTargets(getSystemTargets(companyId));
    };
    window.addEventListener('dpo_targets_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('dpo_targets_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [companyId]);

  const updateTarget = useCallback((key: string, val: number) => {
    setSystemTarget(key, val, companyId);
  }, [companyId]);

  const updateTargetsBatch = useCallback((batch: Partial<SystemTargets>) => {
    setSystemTargetsBatch(batch, companyId);
  }, [companyId]);

  const resetTargets = useCallback(() => {
    setTargets(resetToAchievableTargets(companyId));
  }, [companyId]);

  const recalcularAtingimento = useCallback((processo: string = 'all') => {
    window.dispatchEvent(new CustomEvent('dpo_recalcular_atingimento', { detail: { processo, targets, companyId } }));
  }, [targets, companyId]);

  return { targets, updateTarget, updateTargetsBatch, resetTargets, recalcularAtingimento };
}

