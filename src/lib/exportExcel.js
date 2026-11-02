import ExcelJS from 'exceljs';

/**
 * Exports a beautifully styled Excel spreadsheet with Radhu ERP branding.
 *
 * @param {Object} options
 * @param {string} options.title - Main title (e.g. "RADHU ERP - AUTO TYRE DAILY SUMMARY")
 * @param {string} options.subtitle - Subtitle (Period, Sort order, Generation date)
 * @param {string} options.sheetName - Name of worksheet tab
 * @param {string} options.filename - File name to download (including .xlsx)
 * @param {Array<{header: string, key: string, align?: string, isInt?: boolean, isFloat?: boolean, width?: number}>} options.columns
 * @param {Array<Object>} options.data - Array of row objects
 * @param {Object} options.totals - Object with column keys and totals values
 */
export async function exportStyledExcel({
  title,
  subtitle,
  sheetName = 'Summary',
  filename = 'Summary.xlsx',
  columns,
  data,
  totals,
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Radhu ERP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  const numCols = columns.length;

  // 1. Title Banner (Row 1)
  const titleRow = worksheet.addRow([title.toUpperCase()]);
  worksheet.mergeCells(1, 1, 1, numCols);
  titleRow.height = 32;
  const titleCell = worksheet.getCell(1, 1);
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Slate-900 Dark Navy
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Subtitle / Metadata Row (Row 2)
  const subRow = worksheet.addRow([subtitle]);
  worksheet.mergeCells(2, 1, 2, numCols);
  subRow.height = 20;
  const subCell = worksheet.getCell(2, 1);
  subCell.font = { name: 'Arial', size: 8.5, bold: false, color: { argb: 'FF334155' } };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF1F5F9' }, // Slate-100
  };
  subCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Blank spacing row (Row 3)
  const blankRow = worksheet.addRow([]);
  blankRow.height = 6;

  // 3. Table Headers (Row 4)
  const headerValues = columns.map(c => c.header);
  const headerRow = worksheet.addRow(headerValues);
  headerRow.height = 26;

  const headerBorder = {
    top: { style: 'medium', color: { argb: 'FF0284C7' } },
    left: { style: 'thin', color: { argb: 'FF334155' } },
    bottom: { style: 'medium', color: { argb: 'FF0284C7' } },
    right: { style: 'thin', color: { argb: 'FF334155' } },
  };

  headerRow.eachCell((cell, colNumber) => {
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark slate
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: columns[colNumber - 1]?.align || 'center',
      wrapText: true,
    };
    cell.border = headerBorder;
  });

  // 4. Data Rows
  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  };

  data.forEach((item, index) => {
    const rowValues = columns.map(col => item[col.key] ?? '');
    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 19;

    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Clean white / subtle slate zebra

    dataRow.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      const align = colDef?.align || (colDef?.isInt || colDef?.isFloat ? 'right' : 'center');

      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb },
      };
      cell.alignment = { vertical: 'middle', horizontal: align };
      cell.border = thinBorder;

      if (colDef?.isInt) {
        cell.numFmt = '#,##0';
      } else if (colDef?.isFloat) {
        cell.numFmt = '#,##0.00';
      }
    });
  });

  // 5. Totals / Footer Row
  if (totals) {
    const totalsValues = columns.map(col => totals[col.key] ?? '');
    const totalsRow = worksheet.addRow(totalsValues);
    totalsRow.height = 24;

    const totalsBorder = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'double', color: { argb: 'FF0F172A' } }, // Double underline accounting standard
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };

    totalsRow.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      const align = colDef?.align || (colDef?.isInt || colDef?.isFloat ? 'right' : 'center');

      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FF0F172A' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' }, // Soft Amber highlight
      };
      cell.alignment = { vertical: 'middle', horizontal: align };
      cell.border = totalsBorder;

      if (colDef?.isInt) {
        cell.numFmt = '#,##0';
      } else if (colDef?.isFloat) {
        cell.numFmt = '#,##0.00';
      }
    });
  }

  // 6. Auto Column Widths
  columns.forEach((col, idx) => {
    const colNumber = idx + 1;
    let maxLen = (col.header || '').length;

    data.forEach(item => {
      const val = item[col.key];
      if (val !== undefined && val !== null) {
        const str = String(val);
        if (str.length > maxLen) maxLen = str.length;
      }
    });

    const targetWidth = Math.max(col.width || 12, maxLen + 4);
    worksheet.getColumn(colNumber).width = targetWidth;
  });

  // 7. Write to buffer & trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
