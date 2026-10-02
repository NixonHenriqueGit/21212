import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPosicaoPallet021101Itens, getCapacityAreaMetas, calcularPoliticaEstoque } from './estoqueStorage';
import { calcularMatrizAbcLogistica, getMatrizAbcKPIs, getShelfLifeRisco45Dias, ShelfLifeRiscoItem } from './matrizAbcUtils';
import { isProdutoCadastrado } from './productCatalogData';

export interface CapacidadeAreaResumo {
  areaId: number;
  nome: string;
  capacidadeTotal: number;
  ocupadas: number;
  livres: number;
  taxaOcupacao: number;
  hectolitros: number;
  fatorMedioHlPallet: number;
}

export interface CapacidadeExportData {
  empresaNome?: string;
  dataEmissao: string;
  totalPosicoesArmazem: number;
  totalPosicoesOcupadas: number;
  taxaOcupacaoGeral: number;
  totalHectolitros: number;
  fatorMedioGeralHlPallet: number;
  areasResumo: CapacidadeAreaResumo[];
  itemsDetalhados: Array<{
    codigo: number;
    produto: string;
    areaNome: string;
    qtdFisicaCaixas: number;
    unidade?: string;
    fatorPallet: number;
    lastro: number;
    posicoesOcupadas: number;
    isFracionadoSemPos?: boolean;
    hectolitros: number;
  }>;
}

/**
 * Generates and downloads an executive PDF Report for Warehouse Capacity Management (Gestão de Capacidade)
 */
export function exportGestaoCapacidadePDF(data: CapacidadeExportData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = [3, 43, 94]; // Deep Ambev Blue
  const darkText = [30, 41, 59];
  const lightBg = [248, 250, 252];

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO EXECUTIVO - GESTÃO DE CAPACIDADE DE ARMAZÉM', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Emissão: ${data.dataEmissao} | Empresa: ${data.empresaNome || 'CDD Padrão'} | Base Oficial 02.11.01`, 14, 18);

  // Executive Summary Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 28, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, pageWidth - 28, 22, 2, 2, 'S');

  // Summary Metrics
  const colW = (pageWidth - 28) / 5;
  const metrics = [
    { label: 'Capacidade Total', val: `${data.totalPosicoesArmazem.toLocaleString('pt-BR')} pos` },
    { label: 'Posições Ocupadas', val: `${data.totalPosicoesOcupadas.toLocaleString('pt-BR')} pos` },
    { label: 'Ocupação Geral', val: `${data.taxaOcupacaoGeral.toFixed(1)}%` },
    { label: 'Volume Físico Total', val: `${data.totalHectolitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} HL` },
    { label: 'Fator Médio Geral', val: `${data.fatorMedioGeralHlPallet.toFixed(2)} HL/Pallet` }
  ];

  metrics.forEach((m, idx) => {
    const x = 18 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x, 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(m.val, x, 43);
  });

  // Table 1: Summary by Area
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. Consolidado por Área Operacional de Armazenagem', 14, 56);

  const areasTableBody = data.areasResumo.map(a => [
    a.nome,
    a.capacidadeTotal.toLocaleString('pt-BR'),
    a.ocupadas.toLocaleString('pt-BR'),
    a.livres.toLocaleString('pt-BR'),
    `${a.taxaOcupacao.toFixed(1)}%`,
    `${a.hectolitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} HL`,
    `${a.fatorMedioHlPallet.toFixed(2)} HL/Pallet`
  ]);

  autoTable(doc, {
    startY: 59,
    head: [['Área de Armazenagem', 'Capacidade (Pos)', 'Ocupadas (Pos)', 'Livres (Pos)', '% Ocupação', 'Volume (HL)', 'Fator Médio (HL/Pal)']],
    body: areasTableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [3, 43, 94],
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    },
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    margin: { left: 14, right: 14 }
  });

  // Table 2: Detailed SKU Inventory & Pallet Allocations
  const finalY = (doc as any).lastAutoTable?.finalY || 100;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. Detalhamento de SKUs em Estoque e Ocupação de Posições Pallet', 14, finalY + 8);

  const detailTableBody = data.itemsDetalhados.map(item => [
    String(item.codigo),
    item.produto,
    item.areaNome,
    `${item.qtdFisicaCaixas.toLocaleString('pt-BR')} ${item.unidade || 'cx'}`,
    String(item.fatorPallet || 50),
    String(item.lastro || 10),
    item.isFracionadoSemPos && item.posicoesOcupadas === 0 
      ? '0 pos (Prateleira)' 
      : `${item.posicoesOcupadas} pos`,
    `${item.hectolitros.toFixed(2)} HL`
  ]);

  autoTable(doc, {
    startY: finalY + 11,
    head: [['Código', 'Descrição do Produto', 'Área', 'Qtd Física', 'Fator Pal', 'Lastro', 'Posições Pallet', 'Volume (HL)']],
    body: detailTableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [11, 60, 125],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'center', fontStyle: 'bold', cellWidth: 32 },
      7: { halign: 'right', cellWidth: 25 }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      // Footer page numbering
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Sistema de Gestão Logística Ambev - Página ${hookData.pageNumber} de ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  });

  // Save PDF
  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio_capacidade_armazem_${safeDate}.pdf`);
}

export interface PoliticaEstoqueExportData {
  empresaNome?: string;
  dataEmissao: string;
  totalSkus: number;
  valorTotalEstoqueRS: number;
  giroMedioEstoque: number;
  coberturaMediaDias: number;
  skusPorStatus: {
    ruptura: number;
    critico: number;
    atencao: number;
    normal: number;
    excesso: number;
  };
  items: Array<{
    codigo: number;
    produto: string;
    grupo: string;
    estoqueAtualCx: number;
    estoqueMinimoCx: number;
    estoqueIdealCx: number;
    estoqueMaximoCx: number;
    vendaMediaDiaria: number;
    giroEstoque: number;
    coberturaDias: number;
    status: string;
    valorEstoqueRS: number;
  }>;
}

/**
 * Generates and downloads an executive PDF Report for Inventory Policy (Política de Estoque)
 */
export function exportPoliticaEstoquePDF(data: PoliticaEstoqueExportData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor = [3, 43, 94]; // Deep Ambev Blue
  const darkText = [30, 41, 59];
  const lightBg = [248, 250, 252];

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RELATÓRIO EXECUTIVO - POLÍTICA DE ESTOQUE & NÍVEIS DE SERVIÇO', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Emissão: ${data.dataEmissao} | Empresa: ${data.empresaNome || 'CDD Padrão'} | Gestão de Ressuprimento & Cobertura`, 14, 18);

  // Executive Summary Box
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 28, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, pageWidth - 28, 22, 2, 2, 'S');

  // Summary Metrics
  const colW = (pageWidth - 28) / 5;
  const metrics = [
    { label: 'Total de SKUs', val: `${data.totalSkus}` },
    { label: 'Valor Total Estoque', val: `R$ ${data.valorTotalEstoqueRS.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
    { label: 'Giro Médio Estoque', val: `${data.giroMedioEstoque.toFixed(2)}x/mês` },
    { label: 'Cobertura Média', val: `${data.coberturaMediaDias.toFixed(1)} dias` },
    { label: 'Em Ruptura / Crítico', val: `${data.skusPorStatus.ruptura + data.skusPorStatus.critico} SKUs` }
  ];

  metrics.forEach((m, idx) => {
    const x = 18 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x, 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(m.val, x, 43);
  });

  // Table: SKUs Policy Table
  const tableBody = data.items.map(item => [
    String(item.codigo),
    item.produto,
    item.grupo,
    item.estoqueAtualCx.toLocaleString('pt-BR'),
    item.estoqueMinimoCx.toLocaleString('pt-BR'),
    item.estoqueIdealCx.toLocaleString('pt-BR'),
    item.estoqueMaximoCx.toLocaleString('pt-BR'),
    item.vendaMediaDiaria.toFixed(1),
    `${item.coberturaDias.toFixed(1)}d`,
    item.status,
    `R$ ${item.valorEstoqueRS.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [[
      'Código', 
      'Descrição do SKU', 
      'Grupo', 
      'Estoque Atual', 
      'Est. Mínimo', 
      'Est. Ideal', 
      'Est. Máximo', 
      'Venda/Dia', 
      'Cobertura', 
      'Status Operacional', 
      'Valor Estoque'
    ]],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [3, 43, 94],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: 26 },
      10: { halign: 'right', fontStyle: 'bold', cellWidth: 26 }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      // Footer page numbering
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Sistema de Gestão Logística Ambev - Página ${hookData.pageNumber} de ${doc.getNumberOfPages()}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }
  });

  // Save PDF
  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio_politica_estoque_${safeDate}.pdf`);
}

export interface RelatorioCompletoData {
  empresaNome?: string;
  dataEmissao: string;
  usuarioNome?: string;
  // Capacidade
  capacidade: {
    totalPosicoesArmazem: number;
    totalPosicoesOcupadas: number;
    taxaOcupacaoGeral: number;
    totalHectolitros: number;
    fatorMedioGeralHlPallet: number;
    areasResumo: CapacidadeAreaResumo[];
    itemsDetalhados: Array<{
      codigo: number;
      produto: string;
      areaNome: string;
      qtdFisicaCaixas: number;
      unidade?: string;
      posicoesOcupadas: number;
      hectolitros: number;
    }>;
  };
  // Política de Estoque
  politicaEstoque: {
    totalSkus: number;
    valorTotalEstoqueRS: number;
    giroMedioEstoque: number;
    coberturaMediaDias: number;
    skusPorStatus: {
      ruptura: number;
      critico: number;
      atencao: number;
      normal: number;
      excesso: number;
    };
    items: Array<{
      codigo: number;
      produto: string;
      grupo: string;
      estoqueAtualCx: number;
      estoqueMinimoCx: number;
      estoqueIdealCx: number;
      estoqueMaximoCx: number;
      vendaMediaDiaria: number;
      coberturaDias: number;
      status: string;
      valorEstoqueRS: number;
    }>;
  };
  // Matriz Logística
  matrizLogistica: {
    totalFaturamentoRS: number;
    totalVolumeHL: number;
    totalEstoqueRS: number;
    totalPalletsMovimentados: number;
    totalQuebrasRS: number;
    skusCurvaAValor: number;
    skusCurvaAVolume: number;
    itensShelfLifeRisco: ShelfLifeRiscoItem[];
    valorTotalRiscoValidadeRS: number;
    topFaturamento: Array<{
      codigo: number;
      descricao: string;
      vendaValorRS: number;
      vendaVolumeHl: number;
      curvaAbcValor: string;
      curvaAbcVolume: string;
      participacaoValor: number;
    }>;
    topEsforcoOperacional: Array<{
      codigo: number;
      descricao: string;
      totalPalletsMovimentados: number;
      palletsRessuprimento: number;
      palletsReabastecimento: number;
      curvaOperacional: string;
    }>;
  };
}

/**
 * Generates and downloads a complete, multi-module executive PDF report containing:
 * 1. Gestão de Capacidade de Armazenagem
 * 2. Política de Estoque (6 Dias DPO)
 * 3. Matriz ABC Logística & Shelf-Life (< 45 dias)
 */
export function exportRelatorioCompletoLogisticaPDF(data: RelatorioCompletoData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryColor = [3, 43, 94]; // Deep Ambev Blue
  const accentBlue = [14, 116, 144]; // Cyan / Slate
  const darkText = [30, 41, 59];
  const lightBg = [248, 250, 252];

  // ==========================================
  // PAGE 1: HEADER & GESTÃO DE CAPACIDADE
  // ==========================================
  
  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('RELATÓRIO INTEGRADO: CAPACIDADE, POLÍTICA DE ESTOQUE & MATRIZ LOGÍSTICA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Emissão: ${data.dataEmissao} | Unidade: ${data.empresaNome || 'CDD Guarabira'} | Responsável: ${data.usuarioNome || 'Gestão Logística DPO'}`,
    14,
    18
  );

  // Global Executive Summary Grid
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 28, pageWidth - 28, 20, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 28, pageWidth - 28, 20, 2, 2, 'S');

  const colW = (pageWidth - 28) / 6;
  const globalMetrics = [
    { label: 'Ocupação Armazém', val: `${data.capacidade.taxaOcupacaoGeral.toFixed(1)}% (${data.capacidade.totalPosicoesOcupadas}/${data.capacidade.totalPosicoesArmazem} pos)` },
    { label: 'Volume Físico Total', val: `${data.capacidade.totalHectolitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} HL` },
    { label: 'Valor Total Estoque', val: `R$ ${data.politicaEstoque.valorTotalEstoqueRS.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` },
    { label: 'Cobertura Média', val: `${data.politicaEstoque.coberturaMediaDias.toFixed(1)} dias` },
    { label: 'Risco Shelf-Life < 45d', val: `R$ ${data.matrizLogistica.valorTotalRiscoValidadeRS.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (${data.matrizLogistica.itensShelfLifeRisco.length} SKUs)` },
    { label: 'Rupturas / Críticos', val: `${data.politicaEstoque.skusPorStatus.ruptura + data.politicaEstoque.skusPorStatus.critico} SKUs` }
  ];

  globalMetrics.forEach((m, idx) => {
    const x = 17 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x, 33);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(m.val, x, 42);
  });

  // Section 1: Gestão de Capacidade Instalada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. Gestão de Capacidade Instalada e Ocupação por Área Operacional (02.11.01)', 14, 53);

  const areasBody = data.capacidade.areasResumo.map(a => [
    a.nome,
    a.capacidadeTotal.toLocaleString('pt-BR'),
    a.ocupadas.toLocaleString('pt-BR'),
    a.livres.toLocaleString('pt-BR'),
    `${a.taxaOcupacao.toFixed(1)}%`,
    `${a.hectolitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} HL`,
    `${a.fatorMedioHlPallet.toFixed(2)} HL/Pallet`
  ]);

  autoTable(doc, {
    startY: 56,
    head: [['Área de Armazenagem', 'Capacidade (Pos)', 'Ocupadas (Pos)', 'Livres (Pos)', '% Ocupação', 'Volume (HL)', 'Fator Médio (HL/Pal)']],
    body: areasBody,
    theme: 'grid',
    headStyles: {
      fillColor: [3, 43, 94],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8
    },
    margin: { left: 14, right: 14 }
  });

  // Section 1.2: Top SKUs por Ocupação de Posições Pallet
  const yAfterAreas = (doc as any).lastAutoTable?.finalY || 105;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1.1. Principais SKUs Ocupantes de Posições Pallet no Armazém', 14, yAfterAreas + 6);

  const topCapacidadeItems = [...data.capacidade.itemsDetalhados]
    .sort((a, b) => b.posicoesOcupadas - a.posicoesOcupadas)
    .slice(0, 10)
    .map(i => [
      String(i.codigo),
      i.produto,
      i.areaNome,
      `${i.qtdFisicaCaixas.toLocaleString('pt-BR')} ${i.unidade || 'cx'}`,
      `${i.posicoesOcupadas} pos`,
      `${i.hectolitros.toFixed(1)} HL`
    ]);

  autoTable(doc, {
    startY: yAfterAreas + 9,
    head: [['Código', 'Descrição do SKU', 'Área Alocada', 'Estoque Físico', 'Posições Pallet', 'Volume (HL)']],
    body: topCapacidadeItems,
    theme: 'striped',
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 30 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
      5: { halign: 'right', cellWidth: 30 }
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.6
    },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PAGE 2: POLÍTICA DE ESTOQUE (6 DIAS DPO)
  // ==========================================
  doc.addPage('a4', 'landscape');

  // Sub-Header Banner Page 2
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. POLÍTICA DE ESTOQUE & NÍVEIS DE SERVIÇO (DIRETRIZ 6 DIAS DPO)', 14, 11);

  // Status distribution strip
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 19, pageWidth - 28, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 19, pageWidth - 28, 14, 1.5, 1.5, 'S');

  const pMetrics = [
    { label: 'Total SKUs Analisados', val: `${data.politicaEstoque.totalSkus}` },
    { label: 'Estoque Normal (4 a 8d)', val: `${data.politicaEstoque.skusPorStatus.normal} SKUs` },
    { label: 'Atenção (3 a 4d / 8 a 10d)', val: `${data.politicaEstoque.skusPorStatus.atencao} SKUs` },
    { label: 'Crítico (1 a 3d)', val: `${data.politicaEstoque.skusPorStatus.critico} SKUs` },
    { label: 'Ruptura (< 1d)', val: `${data.politicaEstoque.skusPorStatus.ruptura} SKUs` },
    { label: 'Excesso (> 10d)', val: `${data.politicaEstoque.skusPorStatus.excesso} SKUs` }
  ];

  pMetrics.forEach((m, idx) => {
    const x = 16 + idx * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x, 24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(darkText[0], darkText[1], darkText[2]);
    doc.text(m.val, x, 30);
  });

  const politicaTableBody = data.politicaEstoque.items.map(i => [
    String(i.codigo),
    i.produto,
    i.grupo,
    i.estoqueAtualCx.toLocaleString('pt-BR'),
    i.estoqueMinimoCx.toLocaleString('pt-BR'),
    i.estoqueIdealCx.toLocaleString('pt-BR'),
    i.estoqueMaximoCx.toLocaleString('pt-BR'),
    i.vendaMediaDiaria.toFixed(1),
    `${i.coberturaDias.toFixed(1)}d`,
    i.status,
    `R$ ${i.valorEstoqueRS.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
  ]);

  autoTable(doc, {
    startY: 36,
    head: [[
      'Código',
      'Descrição do SKU',
      'Família/Grupo',
      'Estoque Físico',
      'Est. Mínimo',
      'Est. Ideal (6d)',
      'Est. Máximo',
      'Venda/Dia',
      'Cobertura',
      'Status Operacional',
      'Valor Estoque'
    ]],
    body: politicaTableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [3, 43, 94],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 24 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 16 },
      8: { halign: 'center', cellWidth: 18 },
      9: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      10: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.5
    },
    margin: { left: 14, right: 14 }
  });

  // ==========================================
  // PAGE 3: MATRIZ ABC LOGÍSTICA & SHELF-LIFE
  // ==========================================
  doc.addPage('a4', 'landscape');

  // Sub-Header Banner Page 3
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. MATRIZ ABC LOGÍSTICA, GESTÃO DE SHELF-LIFE & ESFORÇO OPERACIONAL', 14, 11);

  // Table 3.1: Shelf Life Risco (< 45 dias) com Valoração R$
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(
    `3.1. Itens com Risco de Shelf-Life (< 45 Dias) — Valoração Financeira Total: R$ ${data.matrizLogistica.valorTotalRiscoValidadeRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    14,
    22
  );

  const shelfLifeBody = data.matrizLogistica.itensShelfLifeRisco.length > 0
    ? data.matrizLogistica.itensShelfLifeRisco.map(s => [
        String(s.codigo),
        s.descricao,
        s.lote || 'Geral',
        s.validade || '-',
        `${s.diasParaVencer} dias`,
        `${s.quantidadeCx.toLocaleString('pt-BR')} cx`,
        `R$ ${s.valorTotalRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        s.status === 'Vencido' ? 'VENCIDO' : s.status === 'Critico' ? 'CRÍTICO (<15d)' : 'ATENÇÃO (<45d)'
      ])
    : [['-', 'Nenhum SKU com prazo de validade inferior a 45 dias registrado no estoque físico.', '-', '-', '-', '-', 'R$ 0,00', 'SEGURO']];

  autoTable(doc, {
    startY: 25,
    head: [['Código', 'Descrição do SKU', 'Lote', 'Data Validade', 'Prazo Restante', 'Volume em Caixas', 'Valoração em Risco (R$)', 'Criticidade FEFO']],
    body: shelfLifeBody,
    theme: 'grid',
    headStyles: {
      fillColor: [194, 65, 12], // Amber/Orange
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
      1: { halign: 'left', cellWidth: 'auto' },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
      5: { halign: 'right', cellWidth: 26 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 28 }
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.5
    },
    margin: { left: 14, right: 14 }
  });

  const yAfterShelfLife = (doc as any).lastAutoTable?.finalY || 70;

  // Table 3.2: Top 10 SKUs Faturamento 03.05.19 (Curva ABC Valor e Volume)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3.2. Top 10 SKUs por Faturamento (03.05.19) e Classificação Curva ABC', 14, yAfterShelfLife + 6);

  const topFatBody = data.matrizLogistica.topFaturamento.map((f, idx) => [
    `${idx + 1}º`,
    String(f.codigo),
    f.descricao,
    `R$ ${f.vendaValorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `${f.vendaVolumeHl.toFixed(1)} HL`,
    `Curva ${f.curvaAbcValor}`,
    `Curva ${f.curvaAbcVolume}`,
    `${f.participacaoValor.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: yAfterShelfLife + 9,
    head: [['Pos', 'Código', 'Descrição do SKU', 'Faturamento (R$)', 'Volume (HL)', 'Curva Valor', 'Curva Volume', 'Part. Faturamento']],
    body: topFatBody,
    theme: 'striped',
    headStyles: {
      fillColor: [3, 43, 94],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold', cellWidth: 12 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'left', cellWidth: 'auto' },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 32 },
      4: { halign: 'right', cellWidth: 24 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 25 }
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.5
    },
    margin: { left: 14, right: 14 }
  });

  const yAfterFat = (doc as any).lastAutoTable?.finalY || 135;

  // Table 3.3: Top Esforço Operacional (Pallets Movimentados Pulmão -> Picking)
  if (yAfterFat < 155) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('3.3. Top 5 SKUs de Maior Esforço Operacional (Movimentação de Pallets Pulmão & Picking)', 14, yAfterFat + 6);

    const topOpBody = data.matrizLogistica.topEsforcoOperacional.slice(0, 5).map(o => [
      String(o.codigo),
      o.descricao,
      `${o.totalPalletsMovimentados} pal`,
      `${o.palletsRessuprimento} pal`,
      `${o.palletsReabastecimento} pal`,
      `Curva ${o.curvaOperacional}`
    ]);

    autoTable(doc, {
      startY: yAfterFat + 9,
      head: [['Código', 'Descrição do SKU', 'Total Pallets Movimentados', 'Ressuprimento Pulmão', 'Reabastecimento Picking', 'Curva Operacional']],
      body: topOpBody,
      theme: 'grid',
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: 255,
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', fontStyle: 'bold', cellWidth: 20 },
        1: { halign: 'left', cellWidth: 'auto' },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 35 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 30 }
      },
      styles: {
        fontSize: 7.2,
        cellPadding: 1.5
      },
      margin: { left: 14, right: 14 }
    });
  }

  // Common footer page numbers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sistema de Gestão Logística Ambev DPO - Página ${i} de ${totalPages} | Relatório Oficial Consolidado`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Trigger download
  const safeDate = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio_integrado_capacidade_politica_matriz_${safeDate}.pdf`);
}

/**
 * Collects all current operational data from storage and generates the unified PDF report in a single step.
 */
export function gerarRelatorioCompletoLogisticaPDF(empresaId: string = 'demo', empresaNome: string = 'CDD Guarabira', usuarioNome: string = 'Operador'): void {
  // 1. Collect Capacidade Data
  const raw021101 = getPosicaoPallet021101Itens();
  const metas = getCapacityAreaMetas();

  const areaNames: Record<number, string> = {
    1: 'Central',
    2: 'Picking',
    3: 'Marketplace',
    4: 'Contingência',
    5: 'Pulmão',
    6: 'PNC',
    7: 'Limpeza'
  };

  const areasResumo: CapacidadeAreaResumo[] = (Object.keys(metas) as unknown as (1 | 2 | 3 | 4 | 5 | 6 | 7)[]).map(k => {
    const id = Number(k) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
    const meta = metas[id] || { palletsMeta: 100, hectolitrosMeta: 800 };
    const areaItems = raw021101.filter(i => Number(i.areaId) === id);
    const ocupadas = areaItems.reduce((acc, i) => acc + (Number(i.posicoesPalletOcupadas) || 0), 0);
    const hl = areaItems.reduce((acc, i) => acc + (Number(i.hectolitros) || 0), 0);
    const livres = Math.max(0, meta.palletsMeta - ocupadas);
    const taxa = meta.palletsMeta > 0 ? Math.min(100, (ocupadas / meta.palletsMeta) * 100) : 0;
    const fatorMedio = ocupadas > 0 ? hl / ocupadas : 0;

    return {
      areaId: id,
      nome: areaNames[id] || `Área ${id}`,
      capacidadeTotal: meta.palletsMeta,
      ocupadas,
      livres,
      taxaOcupacao: taxa,
      hectolitros: hl,
      fatorMedioHlPallet: fatorMedio
    };
  });

  const totalPosicoesArmazem = areasResumo.reduce((acc, a) => acc + a.capacidadeTotal, 0);
  const totalPosicoesOcupadas = areasResumo.reduce((acc, a) => acc + a.ocupadas, 0);
  const taxaOcupacaoGeral = totalPosicoesArmazem > 0 ? (totalPosicoesOcupadas / totalPosicoesArmazem) * 100 : 0;
  const totalHectolitros = areasResumo.reduce((acc, a) => acc + a.hectolitros, 0);
  const fatorMedioGeralHlPallet = totalPosicoesOcupadas > 0 ? totalHectolitros / totalPosicoesOcupadas : 0;

  const itemsDetalhadosCapacidade = raw021101
    .filter(i => isProdutoCadastrado(i.codigo, empresaId))
    .map(i => ({
      codigo: i.codigo,
      produto: i.produto,
      areaNome: areaNames[i.areaId] || `Área ${i.areaId}`,
      qtdFisicaCaixas: i.qtdFisicaCaixas,
      unidade: 'cx',
      posicoesOcupadas: i.posicoesPalletOcupadas,
      hectolitros: i.hectolitros
    }));

  // 2. Collect Política de Estoque Data
  const politicaEstoqueRaw = calcularPoliticaEstoque();
  const politicaItems = politicaEstoqueRaw
    .filter(p => isProdutoCadastrado(p.codigo, empresaId))
    .map(p => {
      const statusMap: Record<string, string> = {
        'ruptura': 'Ruptura (<1d)',
        'critico': 'Crítico (1 a 3d)',
        'atencao': 'Atenção (3 a 4d)',
        'adequado': 'Normal (4 a 8d)',
        'sobre_estoque': 'Excesso (>8d)',
        'abaixo_politica': 'Abaixo da Política (<4d)'
      };
      const estoqueAtualCx = p.estoqueAtualTotal || p.qtdSkuFechado || 0;
      const estoqueMinimoCx = Math.round(p.vendaMediaDiaria * 4);
      const estoqueMaximoCx = Math.round(p.vendaMediaDiaria * 8);
      const giroEstoque = p.coberturaDias > 0 ? parseFloat((30 / p.coberturaDias).toFixed(2)) : 0;
      const valorEstoqueRS = p.valorTotalComAvulso || (estoqueAtualCx * (p.precoUnitario || 45));

      return {
        codigo: p.codigo,
        produto: p.produto,
        grupo: p.familia || p.grupo || 'Cerveja',
        estoqueAtualCx,
        estoqueMinimoCx,
        estoqueIdealCx: p.estoqueIdeal,
        estoqueMaximoCx,
        vendaMediaDiaria: p.vendaMediaDiaria,
        giroEstoque,
        coberturaDias: p.coberturaDias,
        status: statusMap[p.status] || p.criticidade || p.status,
        valorEstoqueRS
      };
    });

  const totalSkusPolitica = politicaItems.length;
  const valorTotalEstoqueRS = politicaItems.reduce((acc, i) => acc + i.valorEstoqueRS, 0);
  const coberturaMediaDias = totalSkusPolitica > 0 ? parseFloat((politicaItems.reduce((acc, i) => acc + i.coberturaDias, 0) / totalSkusPolitica).toFixed(1)) : 0;
  const giroMedioEstoque = totalSkusPolitica > 0 ? parseFloat((politicaItems.reduce((acc, i) => acc + i.giroEstoque, 0) / totalSkusPolitica).toFixed(2)) : 0;

  const skusPorStatus = {
    ruptura: politicaItems.filter(i => i.status.includes('Ruptura') || i.status.includes('ruptura')).length,
    critico: politicaItems.filter(i => i.status.includes('Crítico') || i.status.includes('critico')).length,
    atencao: politicaItems.filter(i => i.status.includes('Atenção') || i.status.includes('atencao')).length,
    normal: politicaItems.filter(i => i.status.includes('Normal') || i.status.includes('adequado')).length,
    excesso: politicaItems.filter(i => i.status.includes('Excesso') || i.status.includes('sobre_estoque')).length
  };

  // 3. Collect Matriz ABC Logística & Shelf Life
  const matrizItems = calcularMatrizAbcLogistica(empresaId).filter(m => isProdutoCadastrado(m.codigo, empresaId));
  const matrizKPIs = getMatrizAbcKPIs(matrizItems);
  const shelfLifeItens = getShelfLifeRisco45Dias(empresaId).filter(s => isProdutoCadastrado(s.codigo, empresaId));
  const valorTotalRiscoValidadeRS = shelfLifeItens.reduce((acc, s) => acc + s.valorTotalRS, 0);

  const totalFaturamentoRS = matrizItems.reduce((acc, m) => acc + m.vendaValorRS, 0);
  const totalVolumeHL = matrizItems.reduce((acc, m) => acc + m.vendaVolumeHl, 0);
  const skusCurvaAVolume = matrizItems.filter(m => m.curvaAbcVolume === 'A').length;

  const topFaturamento = [...matrizItems]
    .sort((a, b) => b.vendaValorRS - a.vendaValorRS)
    .slice(0, 10)
    .map(m => ({
      codigo: m.codigo,
      descricao: m.descricao,
      vendaValorRS: m.vendaValorRS,
      vendaVolumeHl: m.vendaVolumeHl,
      curvaAbcValor: m.curvaAbcValor,
      curvaAbcVolume: m.curvaAbcVolume,
      participacaoValor: m.percentVendaValor
    }));

  const topEsforcoOperacional = [...matrizItems]
    .sort((a, b) => b.totalPalletsMovimentados - a.totalPalletsMovimentados)
    .slice(0, 10)
    .map(m => ({
      codigo: m.codigo,
      descricao: m.descricao,
      totalPalletsMovimentados: m.totalPalletsMovimentados,
      palletsRessuprimento: m.palletsRessuprimento,
      palletsReabastecimento: m.palletsReabastecimento,
      curvaOperacional: m.curvaAbcOperacional
    }));

  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  exportRelatorioCompletoLogisticaPDF({
    empresaNome,
    dataEmissao,
    usuarioNome,
    capacidade: {
      totalPosicoesArmazem,
      totalPosicoesOcupadas,
      taxaOcupacaoGeral,
      totalHectolitros,
      fatorMedioGeralHlPallet,
      areasResumo,
      itemsDetalhados: itemsDetalhadosCapacidade
    },
    politicaEstoque: {
      totalSkus: totalSkusPolitica,
      valorTotalEstoqueRS,
      giroMedioEstoque,
      coberturaMediaDias,
      skusPorStatus,
      items: politicaItems
    },
    matrizLogistica: {
      totalFaturamentoRS,
      totalVolumeHL,
      totalEstoqueRS: matrizKPIs.valorTotalEstoque,
      totalPalletsMovimentados: matrizKPIs.totalPalletsMovimentados,
      totalQuebrasRS: matrizKPIs.valorTotalQuebras,
      skusCurvaAValor: matrizKPIs.skusClasseA,
      skusCurvaAVolume,
      itensShelfLifeRisco: shelfLifeItens,
      valorTotalRiscoValidadeRS,
      topFaturamento,
      topEsforcoOperacional
    }
  });
}

