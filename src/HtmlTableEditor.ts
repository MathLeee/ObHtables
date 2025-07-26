interface CellData {
  content: string;
  colspan: number;
  rowspan: number;
  merged: boolean; // 是否被合并到其他单元格
}

interface SelectedCell {
  row: number;
  col: number;
}

export class HtmlTableEditor {
  private container: HTMLElement;
  private settings: any;
  private tableData: CellData[][];
  private hasHeader: boolean;
  private selectedCells: SelectedCell[] = [];
  private contextMenu: HTMLElement | null = null;
  private isSelecting: boolean = false;
  private clipboardData: CellData[][] | null = null;

  constructor(container: HTMLElement, settings: any, existingTable?: string) {
    this.container = container;
    this.settings = settings;
    this.hasHeader = true;

    if (existingTable) {
      this.parseExistingTable(existingTable);
    } else {
      this.initializeEmptyTable();
    }

    this.render();
    this.setupEventListeners();
  }

  private initializeEmptyTable() {
    const rows = this.settings.defaultTableRows;
    const cols = this.settings.defaultTableCols;
    
    this.tableData = [];
    for (let i = 0; i < rows; i++) {
      const row: CellData[] = [];
      for (let j = 0; j < cols; j++) {
        row.push({
          content: i === 0 ? `Header ${j + 1}` : `Cell ${i}-${j + 1}`,
          colspan: 1,
          rowspan: 1,
          merged: false
        });
      }
      this.tableData.push(row);
    }
  }

  private parseExistingTable(tableHtml: string) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = tableHtml;
    const table = tempDiv.querySelector('table');
    
    if (!table) {
      this.initializeEmptyTable();
      return;
    }

    const rows = table.querySelectorAll('tr');
    
    // 首先计算表格的实际尺寸
    let maxCols = 0;
    const rowSpanTracker: number[][] = []; // 跟踪每个位置的rowspan占用情况
    
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td, th');
      let colIndex = 0;
      
      // 初始化当前行的跟踪器
      if (!rowSpanTracker[rowIndex]) {
        rowSpanTracker[rowIndex] = [];
      }
      
      cells.forEach(cell => {
        // 跳过被上方rowspan占用的位置
        while (rowSpanTracker[rowIndex][colIndex] > 0) {
          colIndex++;
        }
        
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        
        // 标记被当前单元格占用的位置
        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            const targetRow = rowIndex + r;
            const targetCol = colIndex + c;
            
            if (!rowSpanTracker[targetRow]) {
              rowSpanTracker[targetRow] = [];
            }
            
            if (r === 0 && c === 0) {
              // 主单元格位置
              rowSpanTracker[targetRow][targetCol] = 0;
            } else {
              // 被合并的位置，标记剩余的rowspan
              rowSpanTracker[targetRow][targetCol] = rowspan - r;
            }
          }
        }
        
        colIndex += colspan;
      });
      
      maxCols = Math.max(maxCols, colIndex);
      
      // 减少所有位置的rowspan计数
      if (rowIndex > 0) {
        for (let c = 0; c < rowSpanTracker[rowIndex].length; c++) {
          if (rowSpanTracker[rowIndex][c] > 0) {
            rowSpanTracker[rowIndex][c]--;
          }
        }
      }
    });
    
    // 重新解析表格数据
    this.tableData = [];
    const processedCells = new Set<string>();
    
    rows.forEach((row, rowIndex) => {
      if (!this.tableData[rowIndex]) {
        this.tableData[rowIndex] = [];
      }
      
      const cells = row.querySelectorAll('td, th');
      let colIndex = 0;
      
      cells.forEach(cell => {
        // 跳过已处理的位置
        while (processedCells.has(`${rowIndex}-${colIndex}`)) {
          colIndex++;
        }
        
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        const content = cell.textContent || '';
        
        // 设置主单元格
        this.tableData[rowIndex][colIndex] = {
          content,
          colspan,
          rowspan,
          merged: false
        };
        
        // 标记所有被占用的位置
        for (let r = 0; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            const targetRow = rowIndex + r;
            const targetCol = colIndex + c;
            
            processedCells.add(`${targetRow}-${targetCol}`);
            
            if (r === 0 && c === 0) continue; // 跳过主单元格
            
            // 确保目标行存在
            if (!this.tableData[targetRow]) {
              this.tableData[targetRow] = [];
            }
            
            // 设置被合并的单元格
            this.tableData[targetRow][targetCol] = {
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
    for (let r = 0; r < this.tableData.length; r++) {
      for (let c = 0; c < maxCols; c++) {
        if (!this.tableData[r][c]) {
          this.tableData[r][c] = {
            content: '',
            colspan: 1,
            rowspan: 1,
            merged: false
          };
        }
      }
    }

    this.hasHeader = table.querySelector('th') !== null;
  }

  private setupEventListeners() {
    // 点击空白处取消选择
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.clearSelection();
        this.hideContextMenu();
      }
    });

    // 右键菜单
    document.addEventListener('contextmenu', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.hideContextMenu();
      }
    });
  }

  private render() {
    this.container.empty();
    this.createControlPanel();
    this.createTableEditor();
  }

  private createControlPanel() {
    const controlPanel = this.container.createDiv({ cls: 'table-control-panel' });
    
    // 基础操作按钮
    const basicOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    basicOpsDiv.createEl('span', { text: '基础操作:', cls: 'control-label' });
    
    const addRowBtn = basicOpsDiv.createEl('button', { text: '添加行' });
    addRowBtn.addEventListener('click', () => this.addRow());

    const addColBtn = basicOpsDiv.createEl('button', { text: '添加列' });
    addColBtn.addEventListener('click', () => this.addColumn());

    const delRowBtn = basicOpsDiv.createEl('button', { text: '删除行' });
    delRowBtn.addEventListener('click', () => this.deleteSelectedRows());

    const delColBtn = basicOpsDiv.createEl('button', { text: '删除列' });
    delColBtn.addEventListener('click', () => this.deleteSelectedColumns());

    // 插入操作按钮
    const insertOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    insertOpsDiv.createEl('span', { text: '插入操作:', cls: 'control-label' });
    
    const insertRowAboveBtn = insertOpsDiv.createEl('button', { text: '上方插入行' });
    insertRowAboveBtn.addEventListener('click', () => this.insertRowAbove());

    const insertRowBelowBtn = insertOpsDiv.createEl('button', { text: '下方插入行' });
    insertRowBelowBtn.addEventListener('click', () => this.insertRowBelow());

    const insertColLeftBtn = insertOpsDiv.createEl('button', { text: '左侧插入列' });
    insertColLeftBtn.addEventListener('click', () => this.insertColumnLeft());

    const insertColRightBtn = insertOpsDiv.createEl('button', { text: '右侧插入列' });
    insertColRightBtn.addEventListener('click', () => this.insertColumnRight());

    // 合并操作按钮
    const mergeOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    mergeOpsDiv.createEl('span', { text: '合并操作:', cls: 'control-label' });
    
    const mergeCellsBtn = mergeOpsDiv.createEl('button', { text: '合并单元格' });
    mergeCellsBtn.addEventListener('click', () => this.mergeCells());

    const splitCellBtn = mergeOpsDiv.createEl('button', { text: '拆分单元格' });
    splitCellBtn.addEventListener('click', () => this.splitCells());

    const clearSelectionBtn = mergeOpsDiv.createEl('button', { text: '清除选择' });
    clearSelectionBtn.addEventListener('click', () => this.clearSelection());

    // 表头切换
    const headerDiv = controlPanel.createDiv({ cls: 'control-group' });
    const headerToggle = headerDiv.createEl('label');
    headerToggle.createSpan({ text: '包含表头: ' });
    const headerCheckbox = headerToggle.createEl('input', { type: 'checkbox' });
    headerCheckbox.checked = this.hasHeader;
    headerCheckbox.addEventListener('change', (e) => {
      this.hasHeader = (e.target as HTMLInputElement).checked;
      this.updateTableEditor();
    });
  }

  private createTableEditor() {
    const editorDiv = this.container.createDiv({ cls: 'table-editor' });
    const table = editorDiv.createEl('table', { cls: 'html-table-preview' });
    
    console.log('渲染表格，当前数据:', this.tableData);
    
    this.tableData.forEach((rowData, rowIndex) => {
      const row = table.createEl('tr');
      
      rowData.forEach((cellData, colIndex) => {
        // 跳过被合并的单元格
        if (cellData.merged) {
          console.log(`跳过被合并的单元格: (${rowIndex},${colIndex})`);
          return;
        }
        
        const cellType = (this.hasHeader && rowIndex === 0) ? 'th' : 'td';
        const cell = row.createEl(cellType);
        
        // 设置合并属性
        if (cellData.colspan > 1) {
          cell.setAttribute('colspan', cellData.colspan.toString());
          console.log(`设置colspan: (${rowIndex},${colIndex}) = ${cellData.colspan}`);
        }
        if (cellData.rowspan > 1) {
          cell.setAttribute('rowspan', cellData.rowspan.toString());
          console.log(`设置rowspan: (${rowIndex},${colIndex}) = ${cellData.rowspan}`);
        }
        
        // 添加数据属性用于定位
        cell.setAttribute('data-row', rowIndex.toString());
        cell.setAttribute('data-col', colIndex.toString());
        
        const input = cell.createEl('input', {
          type: 'text',
          value: cellData.content
        });
        
        input.addEventListener('input', (e) => {
          this.tableData[rowIndex][colIndex].content = (e.target as HTMLInputElement).value;
        });
        
        // 单元格选择事件
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          this.handleCellClick(rowIndex, colIndex, e.ctrlKey || e.metaKey);
        });
        
        // 右键菜单
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.showContextMenu(e, rowIndex, colIndex);
        });
      });
    });
  }

  private handleCellClick(row: number, col: number, multiSelect: boolean) {
    if (!multiSelect) {
      this.clearSelection();
    }
    
    const cellIndex = this.selectedCells.findIndex(cell => cell.row === row && cell.col === col);
    
    if (cellIndex >= 0) {
      // 取消选择
      this.selectedCells.splice(cellIndex, 1);
    } else {
      // 添加选择
      this.selectedCells.push({ row, col });
    }
    
    this.updateCellSelection();
  }

  private updateCellSelection() {
    // 清除所有选择样式
    const cells = this.container.querySelectorAll('.html-table-preview td, .html-table-preview th');
    cells.forEach(cell => cell.classList.remove('selected'));
    
    // 添加选择样式
    this.selectedCells.forEach(({ row, col }) => {
      const cell = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cell) {
        cell.classList.add('selected');
      }
    });
  }

  private clearSelection() {
    this.selectedCells = [];
    this.updateCellSelection();
  }

  private showContextMenu(e: MouseEvent, row: number, col: number) {
    this.hideContextMenu();
    
    // 如果右键的单元格没有被选中，则选中它
    if (!this.selectedCells.some(cell => cell.row === row && cell.col === col)) {
      this.clearSelection();
      this.selectedCells.push({ row, col });
      this.updateCellSelection();
    }
    
    const menu = document.createElement('div');
    menu.className = 'table-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.zIndex = '1000';
    
    // 根据右键位置智能显示插入选项
    const menuItems = [
      // 插入行选项
      { 
        text: `在第${row + 1}行上方插入行`, 
        action: () => this.insertRowAt(row),
        icon: '⬆️'
      },
      { 
        text: `在第${row + 1}行下方插入行`, 
        action: () => this.insertRowAt(row + 1),
        icon: '⬇️'
      },
      { text: '---', action: null },
      
      // 插入列选项
      { 
        text: `在第${col + 1}列左侧插入列`, 
        action: () => this.insertColumnAt(col),
        icon: '⬅️'
      },
      { 
        text: `在第${col + 1}列右侧插入列`, 
        action: () => this.insertColumnAt(col + 1),
        icon: '➡️'
      },
      { text: '---', action: null },
      
      // 批量插入选项
      { 
        text: '批量插入行...', 
        action: () => this.showBatchInsertDialog('row', row),
        icon: '📋'
      },
      { 
        text: '批量插入列...', 
        action: () => this.showBatchInsertDialog('column', col),
        icon: '📋'
      },
      { text: '---', action: null },
      
      // 删除选项
      { 
        text: `删除第${row + 1}行`, 
        action: () => this.deleteRowAt(row),
        icon: '🗑️',
        className: 'danger'
      },
      { 
        text: `删除第${col + 1}列`, 
        action: () => this.deleteColumnAt(col),
        icon: '🗑️',
        className: 'danger'
      },
      { text: '---', action: null },
      
      // 合并拆分选项
      { 
        text: '合并选中单元格', 
        action: () => this.mergeCells(),
        icon: '🔗',
        disabled: this.selectedCells.length < 2
      },
      { 
        text: '拆分单元格', 
        action: () => this.splitCells(),
        icon: '✂️',
        disabled: this.selectedCells.length !== 1 || 
                  (this.tableData[row][col].colspan === 1 && this.tableData[row][col].rowspan === 1)
      },
      { text: '---', action: null },
      
      // 复制粘贴选项
      { 
        text: '复制单元格', 
        action: () => this.copyCells(),
        icon: '📋'
      },
      { 
        text: '粘贴', 
        action: () => this.pasteCells(row, col),
        icon: '📋',
        disabled: !this.clipboardData
      },
      { text: '---', action: null },
      
      // 格式选项
      { 
        text: '清空内容', 
        action: () => this.clearCellContent(),
        icon: '🧹'
      },
      { 
        text: '设为表头', 
        action: () => this.toggleCellHeader(row),
        icon: '📌',
        disabled: row !== 0
      }
    ];
    
    menuItems.forEach(item => {
      if (item.text === '---') {
        menu.createEl('hr');
      } else {
        const menuItem = menu.createEl('div', { 
          text: item.text, 
          cls: `menu-item ${item.className || ''} ${item.disabled ? 'disabled' : ''}` 
        });
        
        // 添加图标
        if (item.icon) {
          const icon = menuItem.createSpan({ text: item.icon, cls: 'menu-icon' });
          menuItem.insertBefore(icon, menuItem.firstChild);
        }
        
        if (item.action && !item.disabled) {
          menuItem.addEventListener('click', () => {
            item.action!();
            this.hideContextMenu();
          });
        }
      }
    });
    
    document.body.appendChild(menu);
    this.contextMenu = menu;
    
    // 调整菜单位置，确保不超出屏幕
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (e.clientX - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (e.clientY - rect.height) + 'px';
    }
    
    // 点击其他地方隐藏菜单
    setTimeout(() => {
      document.addEventListener('click', () => this.hideContextMenu(), { once: true });
    }, 0);
  }

  private hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  }

  private mergeCells() {
    if (this.selectedCells.length < 2) {
      alert('请选择至少两个单元格进行合并');
      return;
    }
    
    // 计算合并区域
    const minRow = Math.min(...this.selectedCells.map(cell => cell.row));
    const maxRow = Math.max(...this.selectedCells.map(cell => cell.row));
    const minCol = Math.min(...this.selectedCells.map(cell => cell.col));
    const maxCol = Math.max(...this.selectedCells.map(cell => cell.col));
    
    console.log(`合并区域: (${minRow},${minCol}) 到 (${maxRow},${maxCol})`);
    
    // 检查选择区域是否为矩形且连续
    const selectedPositions = new Set(this.selectedCells.map(cell => `${cell.row}-${cell.col}`));
    let isValidSelection = true;
    
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (!selectedPositions.has(`${r}-${c}`)) {
          isValidSelection = false;
          break;
        }
      }
      if (!isValidSelection) break;
    }
    
    if (!isValidSelection) {
      alert('只能合并矩形区域的连续单元格');
      return;
    }
    
    // 检查是否有已合并的单元格
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const currentCell = this.tableData[r][c];
        if (currentCell.merged || currentCell.colspan > 1 || currentCell.rowspan > 1) {
          alert('选择区域包含已合并的单元格，请先拆分后再合并');
          return;
        }
      }
    }
    
    // 收集所有单元格的内容
    const contentParts: string[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const content = this.tableData[r][c].content.trim();
        if (content) {
          contentParts.push(content);
        }
      }
    }
    const mergedContent = contentParts.join(' ');
    
    // 设置主单元格（左上角）
    const mainCell = this.tableData[minRow][minCol];
    mainCell.content = mergedContent;
    mainCell.colspan = maxCol - minCol + 1;
    mainCell.rowspan = maxRow - minRow + 1;
    mainCell.merged = false;
    
    console.log(`主单元格设置: colspan=${mainCell.colspan}, rowspan=${mainCell.rowspan}`);
    
    // 标记其他单元格为已合并
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r === minRow && c === minCol) continue; // 跳过主单元格
        
        this.tableData[r][c] = {
          content: '',
          colspan: 1,
          rowspan: 1,
          merged: true
        };
        
        console.log(`标记为已合并: 位置(${r},${c})`);
      }
    }
    
    this.clearSelection();
    this.updateTableEditor();
  }

  private splitCells() {
    if (this.selectedCells.length !== 1) {
      alert('请选择一个合并的单元格进行拆分');
      return;
    }
    
    const { row, col } = this.selectedCells[0];
    const cell = this.tableData[row][col];
    
    if (cell.colspan === 1 && cell.rowspan === 1) {
      alert('该单元格未被合并');
      return;
    }
    
    // 保存原始内容
    const originalContent = cell.content;
    const originalColspan = cell.colspan;
    const originalRowspan = cell.rowspan;
    
    console.log(`拆分单元格: 位置(${row},${col}), colspan=${originalColspan}, rowspan=${originalRowspan}`);
    
    // 第一步：重置主单元格
    cell.content = originalContent;
    cell.colspan = 1;
    cell.rowspan = 1;
    cell.merged = false;
    
    // 第二步：为拆分区域创建新的独立单元格
    for (let r = row; r < row + originalRowspan; r++) {
      for (let c = col; c < col + originalColspan; c++) {
        // 跳过主单元格（左上角）
        if (r === row && c === col) {
          continue;
        }
        
        // 确保行存在
        while (this.tableData.length <= r) {
          const newRow: CellData[] = [];
          // 新行的长度应该与现有行保持一致
          const targetLength = this.tableData.length > 0 ? this.tableData[0].length : col + originalColspan;
          for (let i = 0; i < targetLength; i++) {
            newRow.push({
              content: '',
              colspan: 1,
              rowspan: 1,
              merged: false
            });
          }
          this.tableData.push(newRow);
        }
        
        // 确保列存在
        while (this.tableData[r].length <= c) {
          this.tableData[r].push({
            content: '',
            colspan: 1,
            rowspan: 1,
            merged: false
          });
        }
        
        // 创建新的独立单元格
        this.tableData[r][c] = {
          content: '',
          colspan: 1,
          rowspan: 1,
          merged: false
        };
        
        console.log(`创建新单元格: 位置(${r},${c})`);
      }
    }
    
    // 第三步：确保所有行的长度一致
    const maxCols = Math.max(...this.tableData.map(row => row.length));
    this.tableData.forEach((row, rowIndex) => {
      while (row.length < maxCols) {
        row.push({
          content: '',
          colspan: 1,
          rowspan: 1,
          merged: false
        });
      }
    });
    
    console.log('拆分完成，当前表格数据:', this.tableData);
    
    this.clearSelection();
    this.updateTableEditor();
  }

  private insertRowAbove() {
    const targetRow = this.selectedCells.length > 0 ? 
      Math.min(...this.selectedCells.map(cell => cell.row)) : 0;
    
    const newRow: CellData[] = [];
    for (let i = 0; i < this.tableData[0].length; i++) {
      newRow.push({
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    }
    
    this.tableData.splice(targetRow, 0, newRow);
    this.clearSelection();
    this.updateTableEditor();
  }

  private insertRowBelow() {
    const targetRow = this.selectedCells.length > 0 ? 
      Math.max(...this.selectedCells.map(cell => cell.row)) + 1 : this.tableData.length;
    
    const newRow: CellData[] = [];
    for (let i = 0; i < this.tableData[0].length; i++) {
      newRow.push({
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    }
    
    this.tableData.splice(targetRow, 0, newRow);
    this.clearSelection();
    this.updateTableEditor();
  }

  private insertColumnLeft() {
    const targetCol = this.selectedCells.length > 0 ? 
      Math.min(...this.selectedCells.map(cell => cell.col)) : 0;
    
    this.tableData.forEach(row => {
      row.splice(targetCol, 0, {
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    });
    
    this.clearSelection();
    this.updateTableEditor();
  }

  private insertColumnRight() {
    const targetCol = this.selectedCells.length > 0 ? 
      Math.max(...this.selectedCells.map(cell => cell.col)) + 1 : this.tableData[0].length;
    
    this.tableData.forEach(row => {
      row.splice(targetCol, 0, {
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    });
    
    this.clearSelection();
    this.updateTableEditor();
  }

  private deleteSelectedRows() {
    if (this.selectedCells.length === 0) {
      alert('请先选择要删除的行');
      return;
    }
    
    const rowsToDelete = [...new Set(this.selectedCells.map(cell => cell.row))].sort((a, b) => b - a);
    
    if (rowsToDelete.length >= this.tableData.length) {
      alert('不能删除所有行');
      return;
    }
    
    rowsToDelete.forEach(row => {
      this.tableData.splice(row, 1);
    });
    
    this.clearSelection();
    this.updateTableEditor();
  }

  private deleteSelectedColumns() {
    if (this.selectedCells.length === 0) {
      alert('请先选择要删除的列');
      return;
    }
    
    const colsToDelete = [...new Set(this.selectedCells.map(cell => cell.col))].sort((a, b) => b - a);
    
    if (colsToDelete.length >= this.tableData[0].length) {
      alert('不能删除所有列');
      return;
    }
    
    colsToDelete.forEach(col => {
      this.tableData.forEach(row => {
        row.splice(col, 1);
      });
    });
    
    this.clearSelection();
    this.updateTableEditor();
  }

  private addRow() {
    const newRow: CellData[] = [];
    for (let i = 0; i < this.tableData[0].length; i++) {
      newRow.push({
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    }
    this.tableData.push(newRow);
    this.updateTableEditor();
  }

  private addColumn() {
    this.tableData.forEach(row => {
      row.push({
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    });
    this.updateTableEditor();
  }

  private updateTableEditor() {
    const editorDiv = this.container.querySelector('.table-editor');
    if (editorDiv) {
      editorDiv.remove();
    }
    this.createTableEditor();
  }

  public getHtmlTable(): string {
    let html = '<table>\n';
    
    console.log('生成HTML，当前数据:', this.tableData);
    
    this.tableData.forEach((rowData, rowIndex) => {
      html += '  <tr>\n';
      
      rowData.forEach((cellData, colIndex) => {
        // 跳过被合并的单元格
        if (cellData.merged) {
          console.log(`HTML生成时跳过被合并的单元格: (${rowIndex},${colIndex})`);
          return;
        }
        
        const cellType = (this.hasHeader && rowIndex === 0) ? 'th' : 'td';
        let cellTag = `<${cellType}`;
        
        if (cellData.colspan > 1) {
          cellTag += ` colspan="${cellData.colspan}"`;
        }
        if (cellData.rowspan > 1) {
          cellTag += ` rowspan="${cellData.rowspan}"`;
        }
        
        cellTag += `>${cellData.content}</${cellType}>`;
        html += `    ${cellTag}\n`;
      });
      
      html += '  </tr>\n';
    });
    
    html += '</table>';
    
    console.log('生成的HTML:', html);
    return html;
  }

  // 在指定位置插入行
  private insertRowAt(targetRow: number) {
    const newRow: CellData[] = [];
    const colCount = this.tableData[0]?.length || 1;
    
    for (let i = 0; i < colCount; i++) {
      newRow.push({
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    }
    
    this.tableData.splice(targetRow, 0, newRow);
    this.clearSelection();
    this.updateTableEditor();
  }

  // 在指定位置插入列
  private insertColumnAt(targetCol: number) {
    this.tableData.forEach(row => {
      row.splice(targetCol, 0, {
        content: '',
        colspan: 1,
        rowspan: 1,
        merged: false
      });
    });
    
    this.clearSelection();
    this.updateTableEditor();
  }

  // 删除指定行
  private deleteRowAt(targetRow: number) {
    if (this.tableData.length <= 1) {
      alert('不能删除最后一行');
      return;
    }
    
    if (confirm(`确定要删除第${targetRow + 1}行吗？`)) {
      this.tableData.splice(targetRow, 1);
      this.clearSelection();
      this.updateTableEditor();
    }
  }

  // 删除指定列
  private deleteColumnAt(targetCol: number) {
    if (this.tableData[0]?.length <= 1) {
      alert('不能删除最后一列');
      return;
    }
    
    if (confirm(`确定要删除第${targetCol + 1}列吗？`)) {
      this.tableData.forEach(row => {
        row.splice(targetCol, 1);
      });
      this.clearSelection();
      this.updateTableEditor();
    }
  }

  // 显示批量插入对话框
  private showBatchInsertDialog(type: 'row' | 'column', position: number) {
    const count = prompt(`请输入要插入的${type === 'row' ? '行' : '列'}数：`, '1');
    if (count && !isNaN(parseInt(count))) {
      const num = parseInt(count);
      if (num > 0 && num <= 20) {
        for (let i = 0; i < num; i++) {
          if (type === 'row') {
            this.insertRowAt(position + i);
          } else {
            this.insertColumnAt(position + i);
          }
        }
      } else {
        alert('请输入1-20之间的数字');
      }
    }
  }

  // 复制选中的单元格
  private copyCells() {
    if (this.selectedCells.length === 0) {
      alert('请先选择要复制的单元格');
      return;
    }
    
    this.clipboardData = [];
    this.selectedCells.forEach(({ row, col }) => {
      if (!this.clipboardData![0]) {
        this.clipboardData![0] = [];
      }
      this.clipboardData![0].push({
        ...this.tableData[row][col]
      });
    });
    
    alert(`已复制 ${this.selectedCells.length} 个单元格`);
  }

  // 粘贴到指定位置
  private pasteCells(startRow: number, startCol: number) {
    if (!this.clipboardData) {
      alert('剪贴板为空');
      return;
    }
    
    this.clipboardData.forEach((rowData, rowOffset) => {
      rowData.forEach((cellData, colOffset) => {
        const targetRow = startRow + rowOffset;
        const targetCol = startCol + colOffset;
        
        // 确保目标位置存在
        while (this.tableData.length <= targetRow) {
          this.insertRowAt(this.tableData.length);
        }
        while (this.tableData[targetRow].length <= targetCol) {
          this.insertColumnAt(this.tableData[targetRow].length);
        }
        
        // 只复制内容，不复制合并信息
        this.tableData[targetRow][targetCol].content = cellData.content;
      });
    });
    
    this.updateTableEditor();
    alert('粘贴完成');
  }

  // 清空选中单元格的内容
  private clearCellContent() {
    if (this.selectedCells.length === 0) {
      alert('请先选择要清空的单元格');
      return;
    }
    
    this.selectedCells.forEach(({ row, col }) => {
      this.tableData[row][col].content = '';
    });
    
    this.updateTableEditor();
  }

  // 切换表头状态
  private toggleCellHeader(row: number) {
    if (row === 0) {
      this.hasHeader = !this.hasHeader;
      this.updateTableEditor();
    }
  }
}