import { jsPDF } from 'jspdf';
import { QUESTOES_GSA_OFICIAIS, ItemVerificacaoGSA } from '../data/rondaGsaOfficialDataset';

export interface ExportRondaGsaOptions {
  auditorNome?: string;
  colaboradorAuditado?: string;
  localAuditado?: string;
  dataStr?: string;
  respostas?: Record<string, string> | Record<number, string>;
  observacoes?: Record<number, string> | Record<string, string>;
  pontosPercentual?: number;
  pontuacaoPercentual?: number;
  statusPontuacao?: string;
  comentarios?: string;
  acaoCorretiva?: string;
}

export function exportRondaGsaManualPdf(options?: ExportRondaGsaOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pct = options?.pontuacaoPercentual ?? options?.pontosPercentual;
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2); // 190mm

  // CABEÇALHO INSTITUCIONAL DSPD GUARABIRA
  doc.setFillColor(3, 43, 94); // Azul DPO
  doc.rect(margin, 8, contentWidth, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('DSPD GUARABIRA - LAUDO DE RONDA DE QUALIDADE', margin + 5, 16);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(191, 219, 254);
  doc.text('Gestão de Qualidade e Segurança Operacional (41 Quesitos / 6 Áreas) • DPO Guarabira', margin + 5, 22);

  if (pct !== undefined) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - margin - 48, 11, 44, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(3, 43, 94);
    doc.text(`${pct}%`, pageWidth - margin - 44, 19);
    doc.setFontSize(7.5);
    doc.setTextColor(pct >= 95 ? 30 : 180, pct >= 95 ? 150 : 30, 30);
    doc.text(options?.statusPontuacao || (pct >= 95 ? 'CONFORME DPO' : 'ATENÇÃO'), pageWidth - margin - 44, 24);
  }

  // DADOS DA AUDITORIA
  let currentY = 34;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  doc.text('DATA:', margin + 3, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options?.dataStr || new Date().toLocaleDateString('pt-BR'), margin + 18, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('LOCAL / UNIDADE:', margin + 65, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options?.localAuditado || 'Armazém Geral - DSPD Guarabira', margin + 96, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('AUDITOR RESP.:', margin + 3, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options?.auditorNome || 'Djeanderson Soares', margin + 28, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('EQUIPE / TURNO:', margin + 75, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options?.colaboradorAuditado || 'Equipe Operacional', margin + 105, currentY + 11);

  if (options?.comentarios) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text('OBS / COACHING:', margin + 3, currentY + 16);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(30, 41, 59);
    const splitObs = doc.splitTextToSize(options.comentarios, 145);
    doc.text(splitObs[0], margin + 30, currentY + 16);
  }

  currentY += 22;

  // TABELA DOS 41 QUESITOS OFICIAIS
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 2, currentY + 5);
  doc.text('ÁREA / QUESITO DE VERIFICAÇÃO', margin + 10, currentY + 5);
  doc.text('RESPOSTA', pageWidth - margin - 35, currentY + 5);
  doc.text('STATUS', pageWidth - margin - 18, currentY + 5);

  currentY += 7;

  QUESTOES_GSA_OFICIAIS.forEach((q, idx) => {
    // Quebra de página se necessário
    if (currentY > pageHeight - 20) {
      doc.addPage();
      currentY = 15;

      doc.setFillColor(30, 41, 59);
      doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text('#', margin + 2, currentY + 5);
      doc.text('ÁREA / QUESITO DE VERIFICAÇÃO (CONTINUAÇÃO)', margin + 10, currentY + 5);
      doc.text('RESPOSTA', pageWidth - margin - 35, currentY + 5);
      doc.text('STATUS', pageWidth - margin - 18, currentY + 5);
      currentY += 7;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 248 : 255, isEven ? 250 : 255, isEven ? 252 : 255);
    doc.rect(margin, currentY, contentWidth, 5.2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(String(q.id), margin + 2, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(15, 23, 42);
    const itemText = `[${q.categoria}] ${q.perguntaCurta}`;
    const truncatedText = doc.splitTextToSize(itemText, 130)[0];
    doc.text(truncatedText, margin + 10, currentY + 3.8);

    // Resposta
    const rawResp = options?.respostas?.[q.id] || options?.respostas?.[q.pergunta] || options?.respostas?.[q.perguntaCurta] || 'Sim';
    const isNao = String(rawResp).toLowerCase() === 'não' || String(rawResp).toLowerCase() === 'nao';
    const isNA = String(rawResp).toLowerCase() === 'n/a' || String(rawResp).toLowerCase() === 'na';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (isNao) {
      doc.setTextColor(220, 38, 38);
      doc.text('Não', pageWidth - margin - 35, currentY + 3.8);
      doc.text('DESVIO', pageWidth - margin - 18, currentY + 3.8);
    } else if (isNA) {
      doc.setTextColor(100, 116, 139);
      doc.text('N/A', pageWidth - margin - 35, currentY + 3.8);
      doc.text('N/A', pageWidth - margin - 18, currentY + 3.8);
    } else {
      doc.setTextColor(22, 101, 52);
      doc.text('Sim', pageWidth - margin - 35, currentY + 3.8);
      doc.text('OK', pageWidth - margin - 18, currentY + 3.8);
    }

    currentY += 5.2;
  });

  // ASSINATURAS NO FINAL
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY += 8;
  }

  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 15, currentY + 12, margin + 75, currentY + 12);
  doc.line(margin + 115, currentY + 12, margin + 175, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Djeanderson Soares', margin + 30, currentY + 16);
  doc.text('Supervisor / Gestão DPO', margin + 128, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Auditor da Ronda de Qualidade', margin + 27, currentY + 20);
  doc.text('DSPD Guarabira', margin + 138, currentY + 20);

  doc.save(`Laudo_Ronda_DSPD_Guarabira_${options?.dataStr?.replace(/\//g, '-') || 'Manual'}.pdf`);
}
