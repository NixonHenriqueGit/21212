// Operational Reminders & Scheduled Notifications Manager (Requirement DPO)

import { firestoreDb } from '../database/firestoreDatabase';

export interface OperationalReminderConfig {
  id: string;
  titulo: string;
  paraQuem: 'conferente' | 'empilhador' | 'ajudante' | 'qualidade' | 'todos';
  horario: string; // HH:mm e.g. "09:00", "10:00", "16:00"
  mensagem: string;
  popupOverlay: boolean; // Sim (salta na tela modal) / Não
  actionPanel?: string;
  actionTab?: string;
  actionLabel?: string;
  ativo: boolean;
  prioridade: 'alta' | 'media' | 'baixa';
  criadoEm?: string;
  atualizadoEm?: string;
}

export const DEFAULT_OPERATIONAL_REMINDERS: OperationalReminderConfig[] = [
  {
    id: 'rem_temp_10h',
    titulo: '🌡️ Lembrete 10:00 — Registro Matutino de Temperatura',
    paraQuem: 'qualidade',
    horario: '10:00',
    mensagem: 'Lembrete da Qualidade: Coleta matutina (10:00) de temperatura da câmara fria pendente de registro.',
    popupOverlay: false,
    actionPanel: 'qualidade',
    actionTab: 'temperatura',
    actionLabel: 'Registrar Temperatura',
    ativo: true,
    prioridade: 'media'
  },
  {
    id: 'rem_temp_16h',
    titulo: '🌡️ Lembrete 16:00 — Registro Vespertino de Temperatura',
    paraQuem: 'qualidade',
    horario: '16:00',
    mensagem: 'Lembrete da Qualidade: Coleta vespertina (16:00) de temperatura pendente para conformidade sanitária DPO.',
    popupOverlay: false,
    actionPanel: 'qualidade',
    actionTab: 'temperatura',
    actionLabel: 'Registrar Temperatura',
    ativo: true,
    prioridade: 'media'
  }
];

const STORAGE_KEY_REMINDERS = 'af_operational_reminders_config';

export function getStoredReminders(): OperationalReminderConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (!raw) return [...DEFAULT_OPERATIONAL_REMINDERS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out removed legacy reminders like rem_placas_09h
      const filtered = parsed.filter(r => r.id !== 'rem_placas_09h' && !r.titulo.toLowerCase().includes('03.11.49.02') && !r.titulo.toLowerCase().includes('importação de placas'));
      if (filtered.length !== parsed.length) {
        try {
          localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(filtered));
        } catch {}
      }
      return filtered;
    }
  } catch (e) {
    console.error('Erro ao ler lembretes cadastrados:', e);
  }
  return [...DEFAULT_OPERATIONAL_REMINDERS];
}

export function saveStoredReminders(list: OperationalReminderConfig[], empresaId?: string): void {
  const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(list));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('af_reminders_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.error('Erro ao salvar lembretes:', e);
  }

  // Persist to Firestore
  firestoreDb.batchUpsert('lembretes_config', list, companyId).catch(err => {
    console.warn('Erro ao salvar lembretes no Firestore:', err);
  });
}

export async function hydrateRemindersFromFirestore(empresaId?: string): Promise<OperationalReminderConfig[]> {
  const companyId = empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
  try {
    const docs = await firestoreDb.getList<OperationalReminderConfig>('lembretes_config', companyId);
    if (docs && docs.length > 0) {
      localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(docs));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('af_reminders_updated'));
      }
      return docs;
    }
  } catch (e) {}
  return getStoredReminders();
}

export function resetRemindersToDefault(empresaId?: string): OperationalReminderConfig[] {
  saveStoredReminders(DEFAULT_OPERATIONAL_REMINDERS, empresaId);
  return [...DEFAULT_OPERATIONAL_REMINDERS];
}
