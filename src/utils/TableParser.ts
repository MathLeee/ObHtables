import { CellData } from '../types';

export class TableParser {
  static parseExistingTable(tableHtml: string): CellData[][] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHtml;
    const table = tempDiv.querySelector('table');
    
    if (!table) {
      return [];
    }

    const rows = table.querySelectorAll('tr');
    const data: CellData[][] = [];
    const processedCells = new Set<string>();
    
    // 计算表格的实际尺寸
    let maxCols = 0;
    const rowSpanTracker: number[][] = [];
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td, th');
      let colIndex = 0;
      
      if (!rowSpanTracker[rowIndex]) {
        rowSpanTracker[rowIndex] = [];
      }
      
      cells.forEach(cell => {
        while (rowSpanTracker[rowIndex][colIndex] > 0) {
          colIndex++;
        }
        
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        
        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            const targetRow = rowIndex + r;
            const targetCol = colIndex + c;
            
            if (!rowSpanTracker[targetRow]) {
              rowSpanTracker[targetRow] = [];
            }
            
            if (r === 0 && c === 0) {
              rowSpanTracker[targetRow][targetCol] = 0;
            } else {
              rowSpanTracker[targetRow][targetCol] = rowspan - r;
            }
          }
        }
        
        colIndex += colspan;
      });
      
      maxCols = Math.max(maxCols, colIndex);
      
      if (rowIndex > 0) {
        for (let c = 0; c < rowSpanTracker[rowIndex].length; c++) {
          if (rowSpanTracker[rowIndex][c] > 0) {
            rowSpanTracker[rowIndex][c]--;
          }
        }
      }
    });
    
    // 解析表格数据
    rows.forEach((row, rowIndex) => {
      if (!data[rowIndex]) {
        data[rowIndex] = [];
      }
      
      const cells = row.querySelectorAll('td, th');
      let colIndex = 0;
      
      cells.forEach(cell => {
        while (processedCells.has(`${rowIndex}-${colIndex}`)) {
          colIndex++;
        }
        
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        const content = cell.textContent || '';
        
        data[rowIndex][colIndex] = {
          content,
          colspan,
          rowspan,
          merged: false
        };
        
        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            const targetRow = rowIndex + r;
            const targetCol = colIndex + c;
            
            processedCells.add(`${targetRow}-${targetCol}`);
            
            if (r === 0 && c === 0) continue;
            
            if (!data[targetRow]) {
              data[targetRow] = [];
            }
            
            data[targetRow][targetCol] = {
              content: '',
              colspan: 1,
              rowspan: 1,
              merged: true
            };
          }
        }
        
        colIndex += colspan;
      });
    });
    
    // 填充空白单元格
    for (let r = 0; r < data.length; r++) {
      for (let c = 0; c < maxCols; c++) {
        if (!data[r][c]) {
          data[r][c] = {
            content: '',
            colspan: 1,
            rowspan: 1,
            merged: false
          };
        }
      }
    }

    return data;
  }
  
  static hasTableHeader(tableHtml: string): boolean {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHtml;
    const table = tempDiv.querySelector('table');
    return table ? table.querySelector('th') !== null : false;
  }
  
  static generateTableHtml(data: CellData[][], hasHeader: boolean = true): string {
    let html = '<table>\n';
    
    data.forEach((rowData, rowIndex) => {
      html += '  <tr>\n';
      
      rowData.forEach((cellData, colIndex) => {
        if (cellData.merged) return;
        
        const cellType = (hasHeader && rowIndex === 0) ? 'th' : 'td';
        let cellHtml = `    <${cellType}`;
        
        if (cellData.colspan > 1) {
          cellHtml += ` colspan="${cellData.colspan}"`;
        }
        if (cellData.rowspan > 1) {
          cellHtml += ` rowspan="${cellData.rowspan}"`;
        }
        
        cellHtml += `>${cellData.content}</${cellType}>\n`;
        html += cellHtml;
      });
      
      html += '  </tr>\n';
    });
    
    html += '</table>';
    return html;
  }
}