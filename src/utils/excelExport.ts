import ExcelJS from 'exceljs';
import { formatDateToBR } from './fefoDefaultData';

export interface ValidadeExcelRow {
  rank: number;
  codigo: string;
  descricao: string;
  quantidade: number;
  validade: string;
  stockAgeIndex: number;
  diasParaVencer: number;
  vendaMedia: number;
  diasEstoque: number;
  previsaoEscoamento: string;
  valorTotal: number;
  hlTotal?: number;
  faixa: 'critico' | 'atencao' | 'ok';
}

export async function exportValidadesToStyledExcel(
  rows: ValidadeExcelRow[],
  filenamePrefix = 'Validades_Recolhidas_FEFO'
) {
  if (!rows || rows.length === 0) {
    alert('Nenhum dado de validade disponível para exportar.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema FEFO & Armazém';
  workbook.lastModifiedBy = 'Sistema FEFO & Armazém';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Validades FEFO', {
    views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
    properties: { defaultRowHeight: 22 }
  });

  // Define columns
  worksheet.columns = [
    { header: 'Rank', key: 'rank', width: 8 },
    { header: 'Cod SKU', key: 'codigo', width: 14 },
    { header: 'Descrição do Produto', key: 'descricao', width: 44 },
    { header: 'Qnd. SKU (cx)', key: 'quantidade', width: 15 },
    { header: 'Vencimento', key: 'validade', width: 14 },
    { header: 'Stock Age Index (%)', key: 'stockAgeIndex', width: 20 },
    { header: 'Dias p/ Venc.', key: 'diasParaVencer', width: 15 },
    { header: 'Venda Média', key: 'vendaMedia', width: 15 },
    { header: 'Dias Estoque', key: 'diasEstoque', width: 15 },
    { header: 'Previsão Escoamento', key: 'previsaoEscoamento', width: 22 },
    { header: 'Valor (R$)', key: 'valorTotal', width: 18 },
    { header: 'Faixa de Risco', key: 'faixaRisco', width: 18 },
  ];

  // Style Header Row (Row 1) - Orange/Amber matching UI (#f59e0b)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF59E0B' } // Tailwind amber-500
    };
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF000000' }
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FFD97706' } },
      bottom: { style: 'medium', color: { argb: 'FFD97706' } },
      left: { style: 'thin', color: { argb: 'FFD97706' } },
      right: { style: 'thin', color: { argb: 'FFD97706' } }
    };
  });

  // Colors per status/faixa matching the UI:
  // Vermelho: APENAS se tiver 30 dias ou menos de validade (#fecdd3, texto #9f1239)
  // Amarelo: produtos de 45 a 60 dias ou venda media baixa/zero (#fef08a, texto #854d0e)
  // Verde: todo o restante (#bbf7d0, texto #14532d)
  const colorsByFaixa = {
    critico: {
      bg: 'FFFECDD3', // #fecdd3
      font: 'FF9F1239' // #9f1239
    },
    atencao: {
      bg: 'FFFEF08A', // #fef08a
      font: 'FF854D0E' // #854d0e
    },
    ok: {
      bg: 'FFBBF7D0', // #bbf7d0
      font: 'FF14532D' // #14532d
    }
  };

  // Add Data Rows (apenas quantidades > 0 e com cores estritas: <=30d vermelho, 31-60d amarelo, >60d verde)
  const validRows = rows.filter(r => Number(r.quantidade) > 0);
  validRows.forEach((r, idx) => {
    const diasVencNum = Number(r.diasParaVencer) || 0;
    const isCritico = diasVencNum <= 30;
    const isAtencao = diasVencNum >= 31 && diasVencNum <= 60;
    const faixaKey = isCritico ? 'critico' : (isAtencao ? 'atencao' : 'ok');
    const faixaLabel = isCritico ? 'CRÍTICO (≤30d)' : (isAtencao ? 'ATENÇÃO (31-60d)' : 'OK (>60d)');

    // Pure numbers
    const vendaMediaNum = typeof r.vendaMedia === 'number' && !isNaN(r.vendaMedia) ? Number(r.vendaMedia.toFixed(2)) : 0;
    const diasEstoqueNum = r.quantidade <= 0 ? 0 : (r.vendaMedia <= 0 || r.diasEstoque >= 999 ? 999 : Number(r.diasEstoque) || 0);
    const qtdNum = Number(r.quantidade) || 0;
    const stockAgeNum = Number(r.stockAgeIndex) || 0;
    const valorNum = typeof r.valorTotal === 'number' && !isNaN(r.valorTotal) ? Number(r.valorTotal.toFixed(2)) : 0;

    const row = worksheet.addRow({
      rank: idx + 1,
      codigo: String(r.codigo || ''),
      descricao: String(r.descricao || ''),
      quantidade: qtdNum,
      validade: formatDateToBR(r.validade),
      stockAgeIndex: stockAgeNum,
      diasParaVencer: diasVencNum,
      vendaMedia: vendaMediaNum,
      diasEstoque: diasEstoqueNum,
      previsaoEscoamento: String(r.previsaoEscoamento || ''),
      valorTotal: valorNum,
      faixaRisco: faixaLabel
    });

    row.height = 22;

    const rowColors = colorsByFaixa[faixaKey];

    // Format & style each cell in row
    row.eachCell((cell, colNumber) => {
      // Cell background fill
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowColors.bg }
      };

      // Cell font
      cell.font = {
        name: 'Calibri',
        size: 10.5,
        bold: true,
        color: { argb: rowColors.font }
      };

      // Border matching table
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };

      // Alignments & Number Formats
      switch (colNumber) {
        case 1: // Rank
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '0';
          break;
        case 2: // Cod SKU
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '@';
          break;
        case 3: // Descrição
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          break;
        case 4: // Qnd. SKU (cx)
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
          break;
        case 5: // Vencimento
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '@';
          break;
        case 6: // Stock Age Index (%)
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '0"%"';
          break;
        case 7: // Dias p/ Venc. - APENAS NÚMERO
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '0';
          break;
        case 8: // Venda Média - APENAS NÚMERO
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0.00';
          break;
        case 9: // Dias Estoque - APENAS NÚMERO
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.numFmt = '0';
          break;
        case 10: // Previsão Escoamento
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          break;
        case 11: // Valor (R$)
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = 'R$ #,##0.00';
          break;
        case 12: // Faixa de Risco
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          break;
      }
    });
  });

  // Enable AutoFilter on header row
  worksheet.autoFilter = {
    from: 'A1',
    to: 'L1'
  };

  // Write and trigger download
  const dateStr = new Date().toISOString().substring(0, 10);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filenamePrefix}_${dateStr}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
