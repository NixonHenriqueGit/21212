export interface ExternalDashboardConfig {
  id: string;
  name: string;
  url: string;
  badge?: string;
  description: string;
}

export const EXTERNAL_DASHBOARDS: Record<string, ExternalDashboardConfig> = {
  'retorno-de-rota': {
    id: 'retorno-de-rota',
    name: 'Retorno de Rota',
    url: 'https://armazemguarabira-del.github.io/RETORNO-DE-ROTA-PRINCIPAL-/',
    badge: 'Retorno de Rota',
    description: 'Acesso direto ao aplicativo oficial de Retorno de Rota.'
  },
  'retorno-rota': {
    id: 'retorno-rota',
    name: 'Retorno de Rota',
    url: 'https://armazemguarabira-del.github.io/RETORNO-DE-ROTA-PRINCIPAL-/',
    badge: 'Retorno de Rota',
    description: 'Acesso direto ao aplicativo oficial de Retorno de Rota.'
  },
  'trocas-reposicoes': {
    id: 'trocas-reposicoes',
    name: 'Trocas e Reposições',
    url: 'https://djeanderson1105-code.github.io/ARMAZ-M-/',
    badge: 'Trocas & Reposições',
    description: 'Acesso direto ao portal oficial de Trocas e Reposições de Armazém.'
  },
  'blitz-de-puxada': {
    id: 'blitz-de-puxada',
    name: 'Blitz de Puxada',
    url: 'https://sofrimento001-sudo.github.io/Blitz/',
    badge: 'Blitz & Transferência',
    description: 'Acesso direto à ferramenta oficial da Blitz de Puxada.'
  },
  'blitz-puxada': {
    id: 'blitz-puxada',
    name: 'Blitz de Puxada',
    url: 'https://sofrimento001-sudo.github.io/Blitz/',
    badge: 'Blitz & Transferência',
    description: 'Acesso direto à ferramenta oficial da Blitz de Puxada.'
  },
  'gestao-puxadas-nri': {
    id: 'gestao-puxadas-nri',
    name: 'Gestão de Puxadas e NRI',
    url: 'https://aistudio.google.com/apps/584e1d8a-7eb8-4f7e-bec2-c69b4ef6323a?showAssistant=true&project=gen-lang-client-0624437496&showPreview=true',
    badge: 'Puxadas & NRI',
    description: 'Controle, agendamento de carretas, monitoramento de transferências e gestão de Notas de Recebimento Inbound (NRI).'
  },
  'puxadas-nri': {
    id: 'puxadas-nri',
    name: 'Gestão de Puxadas e NRI',
    url: 'https://aistudio.google.com/apps/584e1d8a-7eb8-4f7e-bec2-c69b4ef6323a?showAssistant=true&project=gen-lang-client-0624437496&showPreview=true',
    badge: 'Puxadas & NRI',
    description: 'Controle, agendamento de carretas, monitoramento de transferências e gestão de Notas de Recebimento Inbound (NRI).'
  },
  'gestao-conciliacao-grade': {
    id: 'gestao-conciliacao-grade',
    name: 'Gestão de Conciliação e Grade',
    url: 'https://aistudio.google.com/apps/cbe7b184-3aab-404c-8f9a-fa89782f39fa?showPreview=true&showAssistant=true&fullscreenApplet=true',
    badge: 'Conciliação & Grade',
    description: 'Auditoria de conciliação de estoque, grade de carregamento/recebimento e alinhamento fiscal e físico.'
  },
  'conciliacao-grade': {
    id: 'conciliacao-grade',
    name: 'Gestão de Conciliação e Grade',
    url: 'https://aistudio.google.com/apps/cbe7b184-3aab-404c-8f9a-fa89782f39fa?showPreview=true&showAssistant=true&fullscreenApplet=true',
    badge: 'Conciliação & Grade',
    description: 'Auditoria de conciliação de estoque, grade de carregamento/recebimento e alinhamento fiscal e físico.'
  }
};

export function isExternalDashboard(panelId: string): boolean {
  return panelId in EXTERNAL_DASHBOARDS;
}

export function openExternalDashboard(panelId: string): boolean {
  const item = EXTERNAL_DASHBOARDS[panelId];
  if (item && typeof window !== 'undefined') {
    try {
      const a = document.createElement('a');
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (e) {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return true;
    }
  }
  return false;
}
