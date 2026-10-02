import jsPDF from 'jspdf';
import { setMediaItem, getMediaItem, removeMediaItem } from './idbStorage';

export interface PadraoTemperaturaDoc {
  fileName: string;
  fileDataUrl: string;
  dataUpload: string;
  tamanhoKb?: number;
  observacao?: string;
}

const STORAGE_KEY_PADRAO_META = 'af_padrao_temperatura_meta_v1';
const IDB_KEY_PADRAO_FILE = 'af_padrao_temperatura_file_blob';

/**
 * Loads the saved standard temperature document.
 */
export async function getStoredPadraoTemperaturaDoc(): Promise<PadraoTemperaturaDoc | null> {
  try {
    const metaStr = localStorage.getItem(STORAGE_KEY_PADRAO_META);
    const fileDataUrl = await getMediaItem(IDB_KEY_PADRAO_FILE);

    if (metaStr) {
      const meta = JSON.parse(metaStr);
      return {
        ...meta,
        fileDataUrl: fileDataUrl || meta.fileDataUrl || ''
      };
    } else if (fileDataUrl) {
      return {
        fileName: 'Padrao_Recolhimento_Temperatura.pdf',
        fileDataUrl,
        dataUpload: new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('Erro ao carregar padrão de temperatura:', err);
  }
  return null;
}

/**
 * Saves or updates the standard temperature document.
 */
export async function savePadraoTemperaturaDoc(docItem: PadraoTemperaturaDoc): Promise<void> {
  try {
    if (docItem.fileDataUrl) {
      await setMediaItem(IDB_KEY_PADRAO_FILE, docItem.fileDataUrl);
    }
    const meta = {
      fileName: docItem.fileName,
      dataUpload: docItem.dataUpload || new Date().toISOString(),
      tamanhoKb: docItem.tamanhoKb,
      observacao: docItem.observacao || ''
    };
    localStorage.setItem(STORAGE_KEY_PADRAO_META, JSON.stringify(meta));
  } catch (err) {
    console.error('Erro ao salvar padrão de temperatura:', err);
  }
}

/**
 * Deletes the stored standard temperature document.
 */
export async function deletePadraoTemperaturaDoc(): Promise<void> {
  try {
    await removeMediaItem(IDB_KEY_PADRAO_FILE);
    localStorage.removeItem(STORAGE_KEY_PADRAO_META);
  } catch (err) {
    console.error('Erro ao excluir padrão de temperatura:', err);
  }
}

/**
 * Generates an official printable PDF for the Standard Temperature Operating Procedure (POP / LUP).
 */
export function exportarPadraoTemperaturaOficialPdf(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - (margin * 2), 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PADRÃO DE RECOLHIMENTO DE TEMPERATURA', pageWidth / 2, y + 9, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('POP-AMZ-008 | PROCEDIMENTO OPERACIONAL PADRÃO - CONTROLE TÉRMICO DPO', pageWidth / 2, y + 16, { align: 'center' });

  y += 27;

  // Metadata Box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 16, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, pageWidth - (margin * 2), 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('UNIDADE / LOCAL: Armazém Geral (Guarabira - PB)', margin + 4, y + 6);
  doc.text('RESPONSÁVEL: Equipe de Conferência & Líder de Armazém', margin + 4, y + 12);
  doc.text('FAIXA REGULAMENTAR: 18.0°C a 28.0°C', margin + 105, y + 6);
  doc.text('VERSÃO: 2026.1 (Programa DPO Qualidade)', margin + 105, y + 12);

  y += 22;

  // Section 1: Objetivo
  doc.setFillColor(224, 242, 254);
  doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text('1. OBJETIVO DO PADRÃO', margin + 3, y + 4.5);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Padronizar a rotina diária de aferição e registro da temperatura ambiente no Armazém Geral, assegurando que as bebidas e matérias-primas permaneçam dentro da faixa ideal de conservação (18°C a 28°C), evitando degradação precoce e garantindo a conformidade com as diretrizes do pilar de Qualidade DPO.',
    margin + 2,
    y,
    { maxWidth: pageWidth - (margin * 2) - 4 }
  );

  y += 18;

  // Section 2: Horários Obrigatórios
  doc.setFillColor(224, 242, 254);
  doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text('2. HORÁRIOS OBRIGATÓRIOS DE AFERIÇÃO (3x AO DIA)', margin + 3, y + 4.5);
  y += 9;

  const horarios = [
    { hora: '09:00', label: '1ª Medição (Manhã)', resp: 'Conferente Turno Manhã (Ex: Gilson)', desc: 'Aferição do início da operação e registro térmico inicial.' },
    { hora: '16:00', label: '2ª Medição (Tarde)', resp: 'Conferente Turno Tarde (Ex: Gilson / Operação)', desc: 'Pico de temperatura do dia; monitoramento térmico crítico.' },
    { hora: '22:00', label: '3ª Medição (Noite)', resp: 'Conferente Turno Noite (Ex: Cicero)', desc: 'Conferência de fechamento e resfriamento noturno.' }
  ];

  horarios.forEach((h, i) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - (margin * 2), 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - (margin * 2), 12, 'S');

    doc.setFillColor(14, 165, 233);
    doc.rect(margin, y, 22, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(h.hora, margin + 11, y + 7.5, { align: 'center' });

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`${h.label} - ${h.resp}`, margin + 25, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(h.desc, margin + 25, y + 9.5);

    y += 14;
  });

  y += 3;

  // Section 3: Passo a Passo
  doc.setFillColor(224, 242, 254);
  doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text('3. PROCEDIMENTO OPERACIONAL PASSO A PASSO', margin + 3, y + 4.5);
  y += 9;

  const passos = [
    { num: 'Passo 1', titulo: 'Deslocamento ao Ponto de Aferição', desc: 'Dirigir-se ao termohigrômetro digital fixado na coluna central do armazém, a exatamente 1,50 m do solo e longe de fontes diretas de calor ou luz solar.' },
    { num: 'Passo 2', titulo: 'Estabilização e Leitura', desc: 'Aguardar 30 segundos diante do display digital para verificar a estabilização da leitura. Ler a temperatura em graus Celsius (°C) e a umidade relativa (%) correspondente.' },
    { num: 'Passo 3', titulo: 'Registro Digital / Físico Imediato', desc: 'Lançar o valor no sistema digital ou anotar na planilha de controle, preenchendo Data, Horário e Nome legível do Conferente.' },
    { num: 'Passo 4', titulo: 'Ação em Caso de Temperatura Crítica (> 28.0°C)', desc: 'Caso a leitura ultrapasse 28.0°C, avisar imediatamente o Líder de Armazém, ligar os exaustores eólicos, verificar fechamento de docas e acionar o plano térmico.' }
  ];

  passos.forEach((p) => {
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, pageWidth - (margin * 2), 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, pageWidth - (margin * 2), 12, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(2, 132, 199);
    doc.text(`[${p.num}] ${p.titulo}`, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(p.desc, margin + 3, y + 9, { maxWidth: pageWidth - (margin * 2) - 6 });

    y += 14;
  });

  y += 3;

  // Section 4: Assinaturas e Aprovações
  doc.setFillColor(224, 242, 254);
  doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(3, 105, 161);
  doc.text('4. VALIDAÇÃO E APROVAÇÃO DO PADRÃO', margin + 3, y + 4.5);
  y += 10;

  const sigBoxW = (pageWidth - (margin * 2) - 6) / 2;
  
  // Box 1
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, sigBoxW, 20, 'S');
  doc.line(margin + 6, y + 13, margin + sigBoxW - 6, y + 13);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Djeanderson Soares', margin + sigBoxW / 2, y + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Responsável pela Operação & Qualidade', margin + sigBoxW / 2, y + 18.5, { align: 'center' });

  // Box 2
  const x2 = margin + sigBoxW + 6;
  doc.rect(x2, y, sigBoxW, 20, 'S');
  doc.line(x2 + 6, y + 13, x2 + sigBoxW - 6, y + 13);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Pedro Bruno / Coordenação DPO', x2 + sigBoxW / 2, y + 16, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Auditoria de Governança & Frota', x2 + sigBoxW / 2, y + 18.5, { align: 'center' });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}. Padrão Oficial Armazém Geral.`,
    pageWidth / 2,
    287,
    { align: 'center' }
  );

  doc.save('Padrao_Recolhimento_Temperatura_Oficial_DPO.pdf');
}
