import { TableTemplates, TableTemplate } from './features/TableTemplates';
import { TemplateSelector } from './ui/TemplateSelector';

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

// 排序类型枚举
enum SortType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date'
}

// 排序方向枚举
enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
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
  private templateSelector: TemplateSelector | null = null;
  private activeSubmenus: HTMLElement[] = [];

  constructor(container: HTMLElement, settings: any, existingTable?: string) {
    this.container = container;
    this.settings = settings;
    this.hasHeader = true;

    // 初始化模板选择器
    this.templateSelector = new TemplateSelector(this.container, (template) => {
      this.loadTemplate(template);
    });

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
    
    // 添加标题
    const title = controlPanel.createEl('h3', { 
      text: '🛠️ 表格编辑器',
      cls: 'control-panel-title'
    });
    title.style.cssText = `
      margin: 0 0 20px 0;
      color: var(--text-normal);
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // 模板操作组
    const templateOpsDiv = controlPanel.createDiv({ cls: 'control-group template-group' });
    const templateLabel = templateOpsDiv.createEl('span', { 
      text: '📋 模板操作', 
      cls: 'control-label' 
    });
    
    const selectTemplateBtn = templateOpsDiv.createEl('button', { 
      text: '✨ 选择模板', 
      cls: 'template-btn primary-btn' 
    });
    selectTemplateBtn.addEventListener('click', () => this.showTemplateSelector());

    const saveTemplateBtn = templateOpsDiv.createEl('button', { 
      text: '💾 保存模板', 
      cls: 'template-btn secondary-btn' 
    });
    saveTemplateBtn.addEventListener('click', () => this.showSaveTemplateDialog());
    
    // 新增：模板管理按钮
    const manageTemplateBtn = templateOpsDiv.createEl('button', { 
      text: '管理模板', 
      cls: 'template-btn secondary-btn' 
    });
    manageTemplateBtn.addEventListener('click', () => this.showTemplateManager());
    
    // 基础操作组
    const basicOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    basicOpsDiv.createEl('span', { text: '⚡ 基础操作', cls: 'control-label' });
    
    const addRowBtn = basicOpsDiv.createEl('button', { text: '➕ 添加行' });
    addRowBtn.addEventListener('click', () => this.addRow());

    const addColBtn = basicOpsDiv.createEl('button', { text: '➕ 添加列' });
    addColBtn.addEventListener('click', () => this.addColumn());

    const delRowBtn = basicOpsDiv.createEl('button', { text: '🗑️ 删除行' });
    delRowBtn.addEventListener('click', () => this.deleteSelectedRows());

    const delColBtn = basicOpsDiv.createEl('button', { text: '🗑️ 删除列' });
    delColBtn.addEventListener('click', () => this.deleteSelectedColumns());

    // 插入操作组
    const insertOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    insertOpsDiv.createEl('span', { text: '📍 插入操作', cls: 'control-label' });
    
    const insertRowAboveBtn = insertOpsDiv.createEl('button', { text: '⬆️ 上方插入行' });
    insertRowAboveBtn.addEventListener('click', () => this.insertRowAbove());

    const insertRowBelowBtn = insertOpsDiv.createEl('button', { text: '⬇️ 下方插入行' });
    insertRowBelowBtn.addEventListener('click', () => this.insertRowBelow());

    const insertColLeftBtn = insertOpsDiv.createEl('button', { text: '⬅️ 左侧插入列' });
    insertColLeftBtn.addEventListener('click', () => this.insertColumnLeft());

    const insertColRightBtn = insertOpsDiv.createEl('button', { text: '➡️ 右侧插入列' });
    insertColRightBtn.addEventListener('click', () => this.insertColumnRight());

    // 合并操作组
    const mergeOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    mergeOpsDiv.createEl('span', { text: '🔗 合并操作', cls: 'control-label' });
    
    const mergeCellsBtn = mergeOpsDiv.createEl('button', { text: '🔗 合并单元格' });
    mergeCellsBtn.addEventListener('click', () => this.mergeCells());

    const splitCellBtn = mergeOpsDiv.createEl('button', { text: '✂️ 拆分单元格' });
    splitCellBtn.addEventListener('click', () => this.splitCells());

    const clearSelectionBtn = mergeOpsDiv.createEl('button', { text: '🧹 清除选择' });
    clearSelectionBtn.addEventListener('click', () => this.clearSelection());

    // 排序操作组
    const sortOpsDiv = controlPanel.createDiv({ cls: 'control-group' });
    sortOpsDiv.createEl('span', { text: '🔄 排序操作', cls: 'control-label' });
    
    const sortAscBtn = sortOpsDiv.createEl('button', { text: '📈 升序排序' });
    sortAscBtn.addEventListener('click', () => this.showSortDialog(SortDirection.ASC));

    const sortDescBtn = sortOpsDiv.createEl('button', { text: '📉 降序排序' });
    sortDescBtn.addEventListener('click', () => this.showSortDialog(SortDirection.DESC));

    const resetSortBtn = sortOpsDiv.createEl('button', { text: '🔄 重置排序' });
    resetSortBtn.addEventListener('click', () => this.resetSort());

    // 表头切换
    const headerDiv = controlPanel.createDiv({ cls: 'control-group' });
    headerDiv.createEl('span', { text: '🏷️ 表头设置', cls: 'control-label' });
    
    const headerToggle = headerDiv.createEl('label');
    headerToggle.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      background: var(--background-primary);
      border: 1px solid var(--background-modifier-border);
      border-radius: var(--ob-htables-radius-sm);
      transition: var(--ob-htables-transition-fast);
    `;
    
    const headerCheckbox = headerToggle.createEl('input', { type: 'checkbox' });
    headerCheckbox.checked = this.hasHeader;
    headerCheckbox.style.cssText = `
      width: 18px;
      height: 18px;
      accent-color: var(--ob-htables-primary);
    `;
    
    headerToggle.createSpan({ text: '包含表头' });
    
    headerCheckbox.addEventListener('change', (e) => {
      this.hasHeader = (e.target as HTMLInputElement).checked;
      this.updateTableEditor();
      
      // 添加反馈动画
      headerToggle.style.animation = 'ob-htables-bounce 0.6s ease';
      setTimeout(() => {
        headerToggle.style.animation = '';
      }, 600);
    });
    
    headerToggle.addEventListener('mouseenter', () => {
      headerToggle.style.borderColor = 'var(--ob-htables-primary)';
      headerToggle.style.transform = 'translateY(-1px)';
    });
    
    headerToggle.addEventListener('mouseleave', () => {
      headerToggle.style.borderColor = 'var(--background-modifier-border)';
      headerToggle.style.transform = 'translateY(0)';
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
    
    // 优化后的菜单结构 - 分组显示
    const menuItems = [
      // 基础编辑操作
      { 
        text: '复制', 
        action: () => this.copyCells(),
        icon: '📋'
      },
      { 
        text: '粘贴', 
        action: () => this.pasteCells(row, col),
        icon: '📋',
        disabled: !this.clipboardData
      },
      { 
        text: '清空内容', 
        action: () => this.clearCellContent(),
        icon: '🧹'
      },
      { text: '---', action: null },
      
      // 插入操作 - 子菜单
      {
        text: '插入...',
        icon: '➕',
        submenu: [
          { 
            text: `在上方插入行`, 
            action: () => this.insertRowAt(row),
            icon: '⬆️'
          },
          { 
            text: `在下方插入行`, 
            action: () => this.insertRowAt(row + 1),
            icon: '⬇️'
          },
          { 
            text: `在左侧插入列`, 
            action: () => this.insertColumnAt(col),
            icon: '⬅️'
          },
          { 
            text: `在右侧插入列`, 
            action: () => this.insertColumnAt(col + 1),
            icon: '➡️'
          },
          { text: '---', action: null },
          { 
            text: '批量插入行...', 
            action: () => this.showBatchInsertDialog('row', row),
            icon: '📋'
          },
          { 
            text: '批量插入列...', 
            action: () => this.showBatchInsertDialog('column', col),
            icon: '📋'
          }
        ]
      },
      
      // 排序操作 - 子菜单
      {
        text: '排序...',
        icon: '🔄',
        submenu: [
          { 
            text: `文本升序`, 
            action: () => this.sortByColumn(col, SortDirection.ASC, SortType.TEXT),
            icon: '🔼'
          },
          { 
            text: `文本降序`, 
            action: () => this.sortByColumn(col, SortDirection.DESC, SortType.TEXT),
            icon: '🔽'
          },
          { text: '---', action: null },
          { 
            text: `数字升序`, 
            action: () => this.sortByColumn(col, SortDirection.ASC, SortType.NUMBER),
            icon: '🔢'
          },
          { 
            text: `数字降序`, 
            action: () => this.sortByColumn(col, SortDirection.DESC, SortType.NUMBER),
            icon: '🔢'
          },
          { text: '---', action: null },
          { 
            text: `日期升序`, 
            action: () => this.sortByColumn(col, SortDirection.ASC, SortType.DATE),
            icon: '📅'
          },
          { 
            text: `日期降序`, 
            action: () => this.sortByColumn(col, SortDirection.DESC, SortType.DATE),
            icon: '📅'
          }
        ]
      },
      
      // 合并拆分操作
      { 
        text: '合并单元格', 
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
      
      // 删除操作
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
      
      // 格式选项
      { 
        text: '设为表头', 
        action: () => this.toggleCellHeader(row),
        icon: '📌',
        disabled: row !== 0
      }
    ];
    
    this.createMenuItems(menu, menuItems, e);
    
    document.body.appendChild(menu);
    this.contextMenu = menu;
    
    // 调整菜单位置，确保不超出屏幕
    this.adjustMenuPosition(menu, e);
    
    // 点击其他地方隐藏菜单
    setTimeout(() => {
      document.addEventListener('click', () => this.hideContextMenu(), { once: true });
    }, 0);
  }

  // 新增：创建菜单项的辅助方法
  private createMenuItems(container: HTMLElement, items: any[], event: MouseEvent) {
    items.forEach(item => {
      if (item.text === '---') {
        container.createEl('hr');
      } else if (item.submenu) {
        // 创建带子菜单的项
        const menuItem = container.createEl('div', { 
          text: item.text, 
          cls: `menu-item submenu-item ${item.className || ''}` 
        });
        
        // 添加图标
        if (item.icon) {
          const icon = menuItem.createSpan({ text: item.icon, cls: 'menu-icon' });
          menuItem.insertBefore(icon, menuItem.firstChild);
        }
        
        // 添加箭头指示器
        const arrow = menuItem.createSpan({ text: '▶', cls: 'submenu-arrow' });
        
        // 子菜单容器 - 关键修改：直接添加到 document.body
        const submenu = document.createElement('div');
        submenu.className = 'table-submenu';
        submenu.style.position = 'fixed';
        submenu.style.display = 'none';
        submenu.style.zIndex = '1002'; // 比父菜单更高的层级
        
        this.createMenuItems(submenu, item.submenu, event);
        
        // 将子菜单添加到 document.body 而不是父菜单项
        document.body.appendChild(submenu);
        
        // 存储子菜单引用以便后续清理
        if (!this.activeSubmenus) {
          this.activeSubmenus = [];
        }
        this.activeSubmenus.push(submenu);
        
        // 修复的鼠标事件处理
        let showTimeout: NodeJS.Timeout;
        let hideTimeout: NodeJS.Timeout;
        
        const showSubmenu = () => {
          clearTimeout(hideTimeout);
          showTimeout = setTimeout(() => {
            // 隐藏其他子菜单
            this.hideAllSubmenus();
            
            // 显示当前子菜单
            submenu.style.display = 'block';
            this.adjustSubmenuPosition(submenu, menuItem);
            
            // 添加淡入动画
            submenu.style.opacity = '0';
            submenu.style.transform = 'translateX(-8px) scale(0.95)';
            requestAnimationFrame(() => {
              submenu.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
              submenu.style.opacity = '1';
              submenu.style.transform = 'translateX(0) scale(1)';
            });
          }, 150);
        };
        
        const hideSubmenu = () => {
          clearTimeout(showTimeout);
          hideTimeout = setTimeout(() => {
            submenu.style.opacity = '0';
            submenu.style.transform = 'translateX(-8px) scale(0.95)';
            setTimeout(() => {
              submenu.style.display = 'none';
            }, 200);
          }, 300);
        };
        
        const keepSubmenu = () => {
          clearTimeout(hideTimeout);
        };
        
        // 父菜单项事件
        menuItem.addEventListener('mouseenter', showSubmenu);
        menuItem.addEventListener('mouseleave', hideSubmenu);
        
        // 子菜单事件
        submenu.addEventListener('mouseenter', keepSubmenu);
        submenu.addEventListener('mouseleave', hideSubmenu);
        
        // 防止子菜单区域的点击事件冒泡
        submenu.addEventListener('click', (e) => {
          e.stopPropagation();
        });
        
      } else {
        // 普通菜单项
        const menuItem = container.createEl('div', { 
          text: item.text, 
          cls: `menu-item ${item.className || ''} ${item.disabled ? 'disabled' : ''}` 
        });
        
        // 添加图标
        if (item.icon) {
          const icon = menuItem.createSpan({ text: item.icon, cls: 'menu-icon' });
          menuItem.insertBefore(icon, menuItem.firstChild);
        }
        
        if (item.action && !item.disabled) {
          menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            item.action!();
            this.hideContextMenu();
          });
        }
      }
    });
  }

  // 新增：调整菜单位置的方法
  private adjustMenuPosition(menu: HTMLElement, event: MouseEvent) {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 水平位置调整
    if (rect.right > viewportWidth) {
      menu.style.left = Math.max(0, event.clientX - rect.width) + 'px';
    }
    
    // 垂直位置调整
    if (rect.bottom > viewportHeight) {
      menu.style.top = Math.max(0, event.clientY - rect.height) + 'px';
    }
    
    // 如果菜单仍然太高，启用滚动
    const finalRect = menu.getBoundingClientRect();
    if (finalRect.height > viewportHeight - 20) {
      menu.style.maxHeight = (viewportHeight - 40) + 'px';
      menu.style.overflowY = 'auto';
      menu.style.top = '20px';
    }
  }

  // 新增：隐藏所有子菜单的方法
  private hideAllSubmenus() {
    if (this.activeSubmenus) {
      this.activeSubmenus.forEach(submenu => {
        submenu.style.display = 'none';
      });
    }
  }

  // 改进的子菜单定位方法
  private adjustSubmenuPosition(submenu: HTMLElement, parentItem: HTMLElement) {
    const parentRect = parentItem.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // 默认在右侧显示
    let left = parentRect.right + 5;
    let top = parentRect.top;
    
    // 强制重新计算布局
    submenu.style.left = left + 'px';
    submenu.style.top = top + 'px';
    submenu.offsetHeight;
    
    const submenuRect = submenu.getBoundingClientRect();
    
    // 检查是否超出右边界，如果是则在左侧显示
    if (submenuRect.right > viewportWidth - 10) {
      left = parentRect.left - submenuRect.width - 5;
      submenu.style.left = Math.max(5, left) + 'px';
    }
    
    // 检查是否超出下边界
    if (submenuRect.bottom > viewportHeight - 10) {
      top = Math.max(10, viewportHeight - submenuRect.height - 10);
      submenu.style.top = top + 'px';
    }
    
    // 检查是否超出上边界
    if (top < 10) {
      submenu.style.top = '10px';
    }
  }

  private hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
    
    // 清理所有子菜单
    if (this.activeSubmenus) {
      this.activeSubmenus.forEach(submenu => {
        submenu.remove();
      });
      this.activeSubmenus = [];
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

  // 新增：显示排序对话框
  private showSortDialog(direction: SortDirection) {
    if (this.selectedCells.length === 0) {
      alert('请先选择要排序的列');
      return;
    }
    
    // 获取选中的列
    const selectedCols = [...new Set(this.selectedCells.map(cell => cell.col))];
    
    if (selectedCols.length !== 1) {
      alert('请选择单一列进行排序');
      return;
    }
    
    const col = selectedCols[0];
    
    // 创建排序类型选择对话框
    const sortTypes = [
      { value: SortType.TEXT, label: '文本排序' },
      { value: SortType.NUMBER, label: '数字排序' },
      { value: SortType.DATE, label: '日期排序' }
    ];
    
    const selectedType = prompt(
      `选择排序类型：\n${sortTypes.map((type, index) => `${index + 1}. ${type.label}`).join('\n')}\n\n请输入数字 (1-3):`,
      '1'
    );
    
    if (selectedType) {
      const typeIndex = parseInt(selectedType) - 1;
      if (typeIndex >= 0 && typeIndex < sortTypes.length) {
        this.sortByColumn(col, direction, sortTypes[typeIndex].value);
      } else {
        alert('无效的选择');
      }
    }
  }

  // 新增：按列排序
  private sortByColumn(col: number, direction: SortDirection, type: SortType) {
    if (this.tableData.length <= (this.hasHeader ? 1 : 0)) {
      alert('没有足够的数据进行排序');
      return;
    }
    
    // 确定排序范围（如果有表头，跳过第一行）
    const startRow = this.hasHeader ? 1 : 0;
    const dataRows = this.tableData.slice(startRow);
    
    // 检查是否有合并单元格影响排序
    const hasComplexMerge = dataRows.some(row => 
      row[col] && (row[col].merged || row[col].colspan > 1 || row[col].rowspan > 1)
    );
    
    if (hasComplexMerge) {
      if (!confirm('检测到合并单元格，排序可能会影响表格结构。是否继续？')) {
        return;
      }
    }
    
    // 创建排序索引数组
    const sortIndices = dataRows.map((row, index) => ({
      index,
      value: row[col] ? row[col].content : '',
      originalRow: row
    }));
    
    // 根据类型进行排序
    sortIndices.sort((a, b) => {
      let comparison = 0;
      
      switch (type) {
        case SortType.NUMBER:
          const numA = parseFloat(a.value) || 0;
          const numB = parseFloat(b.value) || 0;
          comparison = numA - numB;
          break;
          
        case SortType.DATE:
          const dateA = new Date(a.value).getTime() || 0;
          const dateB = new Date(b.value).getTime() || 0;
          comparison = dateA - dateB;
          break;
          
        case SortType.TEXT:
        default:
          comparison = a.value.localeCompare(b.value, 'zh-CN', { 
            numeric: true, 
            sensitivity: 'base' 
          });
          break;
      }
      
      return direction === SortDirection.ASC ? comparison : -comparison;
    });
    
    // 重新排列数据
    const sortedRows = sortIndices.map(item => item.originalRow);
    
    // 更新表格数据
    if (this.hasHeader) {
      this.tableData = [this.tableData[0], ...sortedRows];
    } else {
      this.tableData = sortedRows;
    }
    
    this.clearSelection();
    this.updateTableEditor();
    
    const typeLabel = type === SortType.NUMBER ? '数字' : type === SortType.DATE ? '日期' : '文本';
    const directionLabel = direction === SortDirection.ASC ? '升序' : '降序';
    alert(`已按第${col + 1}列进行${typeLabel}${directionLabel}排序`);
  }

  // 新增：重置排序（恢复原始顺序）
  private resetSort() {
    if (!confirm('确定要重置表格排序吗？这将无法撤销。')) {
      return;
    }
    
    // 这里可以实现更复杂的原始顺序恢复逻辑
    // 目前简单地提示用户
    alert('排序重置功能需要在编辑过程中记录原始顺序。当前版本暂不支持，请使用撤销功能或重新加载表格。');
  }

  // 新增方法：显示模板选择器
  private showTemplateSelector(): void {
    if (this.templateSelector) {
      this.templateSelector.show();
    }
  }

  // 新增方法：加载模板
  private loadTemplate(template: TableTemplate): void {
    // 清除当前选择
    this.clearSelection();
    
    // 加载模板数据
    this.tableData = JSON.parse(JSON.stringify(template.data)); // 深拷贝
    this.hasHeader = template.hasHeader;
    
    // 重新渲染表格
    this.updateTableEditor();
  }

  // 新增方法：显示保存模板对话框
  private showSaveTemplateDialog(): void {
    const modal = document.createElement('div');
    modal.className = 'save-template-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--background-primary);
      border-radius: 8px;
      padding: 20px;
      min-width: 400px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h3');
    title.textContent = '保存为模板';
    title.style.marginBottom = '15px';
    modalContent.appendChild(title);

    // 模板名称输入
    const nameLabel = document.createElement('label');
    nameLabel.textContent = '模板名称:';
    nameLabel.style.display = 'block';
    nameLabel.style.marginBottom = '5px';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = '请输入模板名称';
    nameInput.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px;';

    // 模板描述输入
    const descLabel = document.createElement('label');
    descLabel.textContent = '模板描述:';
    descLabel.style.display = 'block';
    descLabel.style.marginBottom = '5px';
    const descInput = document.createElement('textarea');
    descInput.placeholder = '请输入模板描述';
    descInput.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px; height: 60px; resize: vertical;';

    // 分类选择
    const categoryLabel = document.createElement('label');
    categoryLabel.textContent = '分类:';
    categoryLabel.style.display = 'block';
    categoryLabel.style.marginBottom = '5px';
    const categorySelect = document.createElement('select');
    categorySelect.style.cssText = 'width: 100%; padding: 8px; margin-bottom: 15px; border: 1px solid var(--background-modifier-border); border-radius: 4px;';
    
    const categories = ['基础', '商务', '学术', '个人', '自定义'];
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
    categorySelect.value = '自定义';

    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = 'padding: 8px 16px; border: 1px solid var(--background-modifier-border); background: transparent; border-radius: 4px; cursor: pointer;';
    cancelBtn.addEventListener('click', () => modal.remove());

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '保存';
    saveBtn.style.cssText = 'padding: 8px 16px; border: none; background: var(--interactive-accent); color: white; border-radius: 4px; cursor: pointer;';
    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const description = descInput.value.trim();
      const category = categorySelect.value;
      
      if (!name) {
        alert('请输入模板名称');
        return;
      }
      
      this.saveAsTemplate(name, description, category);
      modal.remove();
      alert('模板保存成功！');
    });

    modalContent.appendChild(nameLabel);
    modalContent.appendChild(nameInput);
    modalContent.appendChild(descLabel);
    modalContent.appendChild(descInput);
    modalContent.appendChild(categoryLabel);
    modalContent.appendChild(categorySelect);
    modalContent.appendChild(buttonContainer);
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    modal.appendChild(modalContent);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.body.appendChild(modal);
    nameInput.focus();
  }

  // 新增方法：保存为模板
  private saveAsTemplate(name: string, description: string, category: string): void {
    const template: TableTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category,
      data: JSON.parse(JSON.stringify(this.tableData)), // 深拷贝
      hasHeader: this.hasHeader,
      isCustom: true,
      createdAt: new Date()
    };
    
    TableTemplates.addCustomTemplate(template);
  }

  // 新增：模板管理器
  private showTemplateManager(): void {
    const modal = document.createElement('div');
    modal.className = 'template-manager-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: var(--background-primary);
      border-radius: 8px;
      padding: 20px;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    const title = document.createElement('h2');
    title.textContent = '模板管理';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);

    // 导入导出按钮
    const actionBar = document.createElement('div');
    actionBar.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px;';
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '导入模板';
    importBtn.style.cssText = 'padding: 8px 16px; border: 1px solid var(--interactive-accent); background: transparent; color: var(--interactive-accent); border-radius: 4px; cursor: pointer;';
    
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '导出自定义模板';
    exportBtn.style.cssText = 'padding: 8px 16px; border: none; background: var(--interactive-accent); color: white; border-radius: 4px; cursor: pointer;';
    
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清空自定义模板';
    clearBtn.style.cssText = 'padding: 8px 16px; border: 1px solid var(--text-error); background: transparent; color: var(--text-error); border-radius: 4px; cursor: pointer;';
    
    actionBar.appendChild(importBtn);
    actionBar.appendChild(exportBtn);
    actionBar.appendChild(clearBtn);
    modalContent.appendChild(actionBar);

    // 自定义模板列表
    const customTemplates = TableTemplates.getCustomTemplates();
    
    if (customTemplates.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.textContent = '暂无自定义模板';
      emptyState.style.cssText = 'text-align: center; padding: 40px; color: var(--text-muted); font-style: italic;';
      modalContent.appendChild(emptyState);
    } else {
      const templateList = document.createElement('div');
      templateList.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
      
      customTemplates.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--background-modifier-border);
          border-radius: 6px;
          background: var(--background-secondary);
        `;
        
        const info = document.createElement('div');
        info.innerHTML = `
          <div style="font-weight: 500; color: var(--text-normal);">${template.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${template.description}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            ${template.category} • ${template.data.length}行×${template.data[0]?.length || 0}列
          </div>
        `;
        
        const actions = document.createElement('div');
        actions.style.cssText = 'display: flex; gap: 8px;';
        
        const useBtn = document.createElement('button');
        useBtn.textContent = '使用';
        useBtn.style.cssText = 'padding: 4px 8px; border: none; background: var(--interactive-accent); color: white; border-radius: 3px; cursor: pointer; font-size: 12px;';
        useBtn.addEventListener('click', () => {
          this.loadTemplate(template);
          modal.remove();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '删除';
        deleteBtn.style.cssText = 'padding: 4px 8px; border: 1px solid var(--text-error); background: transparent; color: var(--text-error); border-radius: 3px; cursor: pointer; font-size: 12px;';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`确定要删除模板 "${template.name}" 吗？`)) {
            TableTemplates.removeTemplate(template.id);
            modal.remove();
            this.showTemplateManager(); // 重新打开管理器
          }
        });
        
        actions.appendChild(useBtn);
        actions.appendChild(deleteBtn);
        
        templateItem.appendChild(info);
        templateItem.appendChild(actions);
        templateList.appendChild(templateItem);
      });
      
      modalContent.appendChild(templateList);
    }

    // 事件处理
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const result = await TableTemplates.importTemplates(file);
          alert(`导入完成！成功: ${result.success}个，失败: ${result.errors.length}个`);
          if (result.errors.length > 0) {
            console.warn('导入错误:', result.errors);
          }
          modal.remove();
          this.showTemplateManager();
        }
      });
      input.click();
    });
    
    exportBtn.addEventListener('click', () => {
      TableTemplates.exportTemplates();
    });
    
    clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空所有自定义模板吗？此操作不可撤销！')) {
        TableTemplates.clearCustomTemplates();
        modal.remove();
        this.showTemplateManager();
      }
    });

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'width: 100%; padding: 10px; margin-top: 20px; border: 1px solid var(--background-modifier-border); background: transparent; border-radius: 4px; cursor: pointer;';
    closeBtn.addEventListener('click', () => modal.remove());
    modalContent.appendChild(closeBtn);

    modal.appendChild(modalContent);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }
}