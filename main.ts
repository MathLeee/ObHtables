import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Menu } from 'obsidian';
import { HtmlTableEditor } from './src/HtmlTableEditor';
import { HtmlTableModal } from './src/HtmlTableModal';

interface ObHtablesSettings {
  defaultTableRows: number;
  defaultTableCols: number;
  enableTableStyling: boolean;
  tableTheme: string;
}

const DEFAULT_SETTINGS: ObHtablesSettings = {
  defaultTableRows: 3,
  defaultTableCols: 3,
  enableTableStyling: true,
  tableTheme: 'default'
};

export default class ObHtablesPlugin extends Plugin {
  settings: ObHtablesSettings;

  // 在onload方法中添加全局CSS样式
  async onload() {
    await this.loadSettings();
    
    // 添加全局CSS来完全隐藏Obsidian的HTML表格选择效果
    const style = document.createElement('style');
    style.textContent = `
      /* 完全隐藏Obsidian的HTML表格选择框和编辑按钮 */
      .block-language-html:hover {
        outline: none !important;
        border: none !important;
      }
      
      /* 隐藏右上角的编辑按钮 */
      .block-language-html .edit-block-button,
      .block-language-html .cm-embed-block-edit,
      .block-language-html .markdown-embed-edit,
      .block-language-html .inline-title,
      .block-language-html .block-language-html-edit {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }
      
      /* 隐藏所有可能的编辑相关元素 */
      .block-language-html::before,
      .block-language-html::after {
        display: none !important;
      }
      
      /* 确保我们的表格边框完整显示 */
      .ob-htables-enhanced {
        position: relative !important;
        z-index: 10000 !important;
        overflow: visible !important;
      }
      
      /* 修复边框显示问题 - 使用box-shadow而不是outline */
      .ob-htables-enhanced:hover {
        box-shadow: 
          0 0 0 2px var(--interactive-accent),
          0 0 0 4px rgba(99, 102, 241, 0.2),
          0 4px 12px rgba(99, 102, 241, 0.15) !important;
        transform: scale(1.01) !important;
        transition: all 0.2s ease-in-out !important;
        border-radius: 4px !important;
      }
      
      /* 确保表格容器不会裁剪边框 */
      .block-language-html,
      .markdown-rendered,
      .cm-line {
        overflow: visible !important;
      }
      
      /* 为表格添加一些内边距确保边框完整显示 */
      .ob-htables-enhanced {
        margin: 4px !important;
      }
    `;
    document.head.appendChild(style);

    // 添加命令：插入HTML表格
    this.addCommand({
      id: 'insert-html-table',
      name: 'Insert HTML Table',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        new HtmlTableModal(this.app, this.settings, (htmlTable: string) => {
          editor.replaceSelection(htmlTable);
        }).open();
      }
    });

    // 添加命令：编辑现有HTML表格
    this.addCommand({
      id: 'edit-html-table',
      name: 'Edit HTML Table',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (this.isHtmlTable(selection)) {
          new HtmlTableModal(this.app, this.settings, (htmlTable: string) => {
            editor.replaceSelection(htmlTable);
          }, selection).open();
        } else {
          new Notice('Please select an HTML table to edit');
        }
      }
    });

    // 添加快速插入表格命令
    this.addCommand({
      id: 'quick-insert-html-table',
      name: 'Quick Insert HTML Table (3x3)',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.insertQuickTable(editor, 3, 3);
      }
    });

    // 注册编辑器右键菜单
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu: Menu, editor: Editor, view: MarkdownView) => {
        this.addEditorMenuItems(menu, editor, view);
      })
    );

    // 添加设置选项卡
    this.addSettingTab(new ObHtablesSettingTab(this.app, this));

    // 修正后的表格增强逻辑
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        setTimeout(() => this.enhanceTablesInAllViews(), 100);
      })
    );
    
    // 监听活动叶子变化
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        setTimeout(() => this.enhanceTablesInAllViews(), 100);
      })
    );
    
    // 监听文件打开事件
    this.registerEvent(
      this.app.workspace.on('file-open', () => {
        setTimeout(() => this.enhanceTablesInAllViews(), 200);
      })
    );
    
    // 初始化时也检查一次
    setTimeout(() => this.enhanceTablesInAllViews(), 500);
  }

  // 重写表格增强方法 - 支持所有视图模式
  private enhanceTablesInAllViews() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return;
    
    // 获取所有可能的容器元素
    const containers = [
      activeView.contentEl.querySelector('.markdown-preview-view'),
      activeView.contentEl.querySelector('.markdown-source-view'),
      activeView.contentEl.querySelector('.cm-editor'),
      activeView.contentEl.querySelector('.markdown-rendered'),
      activeView.contentEl
    ].filter(Boolean);
    
    containers.forEach(container => {
      if (container) {
        // 增强现有表格
        const tables = container.querySelectorAll('table');
        tables.forEach(table => this.enhanceTable(table as HTMLTableElement));
        
        // 设置MutationObserver监听新表格
        this.setupTableObserver(container);
      }
    });
  }

  private setupTableObserver(container: Element) {
    // 避免重复设置observer
    if (container.hasAttribute('data-htables-observed')) return;
    container.setAttribute('data-htables-observed', 'true');
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const tables = element.querySelectorAll ? 
                element.querySelectorAll('table') : 
                (element.tagName === 'TABLE' ? [element] : []);
              tables.forEach(table => this.enhanceTable(table as HTMLTableElement));
            }
          });
        }
      });
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }

  // 改进的表格增强方法 - 只增强HTML表格
  private enhanceTable(table: HTMLTableElement) {
    // 避免重复增强
    if (table.classList.contains('ob-htables-enhanced')) return;
    
    // 检测表格类型 - 只增强HTML表格
    if (!this.isHtmlTableElement(table)) {
      return; // 跳过Markdown表格
    }
    
    table.classList.add('ob-htables-enhanced');
    
    // 查找并处理所有可能的父容器
    const containers = [
      table.closest('.block-language-html'),
      table.closest('.markdown-rendered'),
      table.closest('.cm-line'),
      table.parentElement
    ].filter(Boolean);
    
    containers.forEach(container => {
      if (container && !container.classList.contains('ob-htables-container-processed')) {
        container.classList.add('ob-htables-container-processed');
        
        // 强制隐藏容器的所有边框和选择效果
        const hideContainerStyles = () => {
          (container as HTMLElement).style.setProperty('outline', 'none', 'important');
          (container as HTMLElement).style.setProperty('border', 'none', 'important');
          (container as HTMLElement).style.setProperty('box-shadow', 'none', 'important');
          (container as HTMLElement).style.setProperty('overflow', 'visible', 'important');
        };
        
        // 立即应用
        hideContainerStyles();
        
        // 隐藏所有编辑按钮
        const hideEditButtons = () => {
          const editButtons = container.querySelectorAll(
            '.edit-block-button, .cm-embed-block-edit, .markdown-embed-edit, .inline-title'
          );
          editButtons.forEach(btn => {
            (btn as HTMLElement).style.setProperty('display', 'none', 'important');
            (btn as HTMLElement).style.setProperty('opacity', '0', 'important');
            (btn as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
          });
        };
        
        hideEditButtons();
        
        // 监听容器的变化
        const observer = new MutationObserver(() => {
          hideContainerStyles();
          hideEditButtons();
        });
        
        observer.observe(container, {
          attributes: true,
          childList: true,
          subtree: true,
          attributeFilter: ['style', 'class']
        });
        
        // 阻止容器的所有鼠标事件
        ['click', 'mousedown', 'mouseup', 'mouseover', 'mouseenter', 'mouseleave'].forEach(eventType => {
          container.addEventListener(eventType, (e) => {
            // 只阻止非表格元素的事件
            if (!e.target || !(e.target as Element).closest('table')) {
              e.preventDefault();
              e.stopImmediatePropagation();
            }
          }, { capture: true, passive: false });
        });
      }
    });
    
    // 为HTML表格添加双击事件
    const doubleClickHandler = (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      this.handleTableDoubleClick(e, table);
    };
    
    table.addEventListener('dblclick', doubleClickHandler, {
      capture: true,
      passive: false
    });
    
    // 阻止表格的默认行为
    ['click', 'mousedown'].forEach(eventType => {
      table.addEventListener(eventType, (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      }, { capture: true });
    });
    
    // 设置基本样式
    table.style.cursor = 'pointer';
    table.title = '双击编辑HTML表格';
    
    // 添加悬停效果 - 只对HTML表格
    const addHoverEffect = () => {
      // 检测表格类型并应用不同的悬停效果
      if (this.isMarkdownTable(table)) {
        // Markdown表格：细边框
        table.style.setProperty('box-shadow', '0 0 0 1px var(--interactive-accent)', 'important');
        table.style.setProperty('border-radius', '4px', 'important');
      } else {
        // HTML表格：粗边框和阴影
        table.style.setProperty('box-shadow', '0 0 0 2px var(--interactive-accent), 0 4px 12px rgba(0,0,0,0.15)', 'important');
        table.style.setProperty('border-radius', '6px', 'important');
      }
      table.style.setProperty('position', 'relative', 'important');
      table.style.setProperty('z-index', '10000', 'important');
      table.style.setProperty('transform', 'scale(1.01)', 'important');
      table.style.setProperty('transition', 'all 0.2s ease-in-out', 'important');
    };
    
    const removeHoverEffect = () => {
      table.style.removeProperty('box-shadow');
      table.style.removeProperty('border-radius');
      table.style.removeProperty('transform');
      table.style.removeProperty('transition');
      // 保持基本的定位样式
      table.style.setProperty('position', 'relative', 'important');
      table.style.setProperty('z-index', '10000', 'important');
      table.style.setProperty('overflow', 'visible', 'important');
      table.style.setProperty('margin', '4px', 'important');
    };
    
    table.addEventListener('mouseenter', addHoverEffect);
    table.addEventListener('mouseleave', removeHoverEffect);
    
    // 确保表格样式正确应用
    const applyStyles = () => {
      table.style.setProperty('position', 'relative', 'important');
      table.style.setProperty('z-index', '10000', 'important');
      table.style.setProperty('overflow', 'visible', 'important');
      table.style.setProperty('margin', '4px', 'important');
    };
    
    applyStyles();
    
    // 定期检查并重新应用样式
    setInterval(applyStyles, 1000);
  }

  // 新增：检测是否为HTML表格元素
  private isHtmlTableElement(table: HTMLTableElement): boolean {
    // 方法1：检查父容器类型
    const htmlContainer = table.closest('.block-language-html');
    if (htmlContainer) {
      return true;
    }
    
    // 方法2：检查表格是否在HTML代码块中
    const codeBlock = table.closest('pre, code');
    if (codeBlock) {
      return false; // 在代码块中的表格不是渲染的HTML表格
    }
    
    // 方法3：检查表格的源码特征
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const content = editor.getValue();
      
      // 获取表格的特征内容
      const tableSignature = this.generateTableSignature(table);
      
      // 检查源码中是否包含HTML表格标签
      const htmlTableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
      let match;
      
      while ((match = htmlTableRegex.exec(content)) !== null) {
        const tableHtml = match[0];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = tableHtml;
        const tempTable = tempDiv.querySelector('table');
        
        if (tempTable) {
          const tempSignature = this.generateTableSignature(tempTable);
          if (tempSignature === tableSignature) {
            return true; // 找到匹配的HTML表格
          }
        }
      }
      
      // 检查是否为Markdown表格
      if (this.isMarkdownTableInSource(content, tableSignature)) {
        return false; // 确认为Markdown表格
      }
    }
    
    // 方法4：检查表格的DOM特征
    // HTML表格通常有更复杂的结构或特定的类名
    const hasComplexStructure = table.querySelector('thead, tbody, tfoot, th[colspan], td[colspan], th[rowspan], td[rowspan]');
    if (hasComplexStructure) {
      return true; // 复杂结构通常是HTML表格
    }
    
    // 默认情况下，假设是HTML表格（保守策略）
    return true;
  }

  // 新增：检测是否为Markdown表格
  private isMarkdownTable(table: HTMLTableElement): boolean {
    return !this.isHtmlTableElement(table);
  }

  // 新增：检查源码中是否为Markdown表格
  private isMarkdownTableInSource(content: string, tableSignature: string): boolean {
    const lines = content.split('\n');
    const signatureLines = tableSignature.split('\n');
    
    if (signatureLines.length === 0) return false;
    
    // 查找包含第一行内容的行
    const firstRowContent = signatureLines[0];
    if (!firstRowContent) return false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否为Markdown表格行（包含|分隔符）
      if (line.includes('|') && !line.includes('<table') && !line.includes('</table>')) {
        // 检查内容是否匹配
        const cellContents = firstRowContent.split('|');
        let matchCount = 0;
        
        for (const cellContent of cellContents) {
          if (cellContent.trim() && line.includes(cellContent.trim())) {
            matchCount++;
          }
        }
        
        // 如果大部分内容都匹配，认为是Markdown表格
        if (matchCount > cellContents.length * 0.6) {
          // 检查下一行是否为分隔符行
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.match(/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/)) {
              return true; // 确认为Markdown表格
            }
          }
        }
      }
    }
    
    return false;
  }

  // 简化的双击处理方法
  private handleTableDoubleClick = (e: Event, table: HTMLTableElement) => {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      new Notice('无法获取当前视图');
      return;
    }
    
    // 获取表格HTML
    const tableHtml = table.outerHTML;
    
    // 打开编辑模态框
    new HtmlTableModal(this.app, this.settings, (newHtml: string) => {
      this.replaceTableInDocument(activeView, table, newHtml);
    }, tableHtml).open();
  };

  // 新增：表格内容替换方法（重写版本）
  private async replaceTableInDocument(view: MarkdownView, originalTable: HTMLTableElement, newHtml: string) {
    try {
      const editor = view.editor;
      const content = editor.getValue();
      
      // 策略1：使用表格内容特征进行精确匹配
      const tableSignature = this.generateTableSignature(originalTable);
      const matchResult = this.findTableBySignature(content, tableSignature);
      
      if (matchResult.found) {
        const updatedContent = content.substring(0, matchResult.start) + 
                              newHtml + 
                              content.substring(matchResult.end);
        editor.setValue(updatedContent);
        new Notice('表格已更新');
        
        // 重新增强新的表格
        setTimeout(() => {
          this.enhanceTablesInAllViews();
        }, 100);
        return;
      }
      
      // 策略2：使用行列数据进行模糊匹配
      const fuzzyMatch = this.findTableByContent(content, originalTable);
      if (fuzzyMatch.found) {
        const updatedContent = content.substring(0, fuzzyMatch.start) + 
                              newHtml + 
                              content.substring(fuzzyMatch.end);
        editor.setValue(updatedContent);
        new Notice('表格已更新（模糊匹配）');
        
        setTimeout(() => {
          this.enhanceTablesInAllViews();
        }, 100);
        return;
      }
      
      // 策略3：使用光标位置进行智能替换
      const cursorMatch = this.findTableByCursor(editor, originalTable);
      if (cursorMatch.found) {
        editor.setSelection(
          { line: cursorMatch.startLine, ch: cursorMatch.startCh },
          { line: cursorMatch.endLine, ch: cursorMatch.endCh }
        );
        editor.replaceSelection(newHtml);
        new Notice('表格已更新（光标定位）');
        
        setTimeout(() => {
          this.enhanceTablesInAllViews();
        }, 100);
        return;
      }
      
      // 所有策略都失败，提供手动替换选项
      this.showManualReplaceDialog(newHtml);
      
    } catch (error) {
      console.error('替换表格时出错:', error);
      new Notice('表格更新失败');
    }
  }

  // 生成表格特征签名
  private generateTableSignature(table: HTMLTableElement): string {
    const rows = table.querySelectorAll('tr');
    const signature = [];
    
    for (let i = 0; i < Math.min(rows.length, 3); i++) {
      const cells = rows[i].querySelectorAll('td, th');
      const rowSignature = [];
      
      for (let j = 0; j < Math.min(cells.length, 3); j++) {
        const cellText = cells[j].textContent?.trim() || '';
        rowSignature.push(cellText.substring(0, 20)); // 取前20个字符
      }
      
      signature.push(rowSignature.join('|'));
    }
    
    return signature.join('\n');
  }

  // 通过特征签名查找表格
  private findTableBySignature(content: string, signature: string): { found: boolean; start: number; end: number } {
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    let match;
    
    while ((match = tableRegex.exec(content)) !== null) {
      const tableHtml = match[0];
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = tableHtml;
      const tempTable = tempDiv.querySelector('table');
      
      if (tempTable) {
        const tempSignature = this.generateTableSignature(tempTable);
        if (tempSignature === signature) {
          return {
            found: true,
            start: match.index,
            end: match.index + match[0].length
          };
        }
      }
    }
    
    return { found: false, start: -1, end: -1 };
  }

  // 通过内容进行模糊匹配
  private findTableByContent(content: string, originalTable: HTMLTableElement): { found: boolean; start: number; end: number } {
    const originalCells = Array.from(originalTable.querySelectorAll('td, th'))
      .map(cell => cell.textContent?.trim() || '')
      .filter(text => text.length > 0)
      .slice(0, 5); // 取前5个非空单元格
    
    if (originalCells.length === 0) {
      return { found: false, start: -1, end: -1 };
    }
    
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    let match;
    
    while ((match = tableRegex.exec(content)) !== null) {
      const tableHtml = match[0];
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = tableHtml;
      const tempTable = tempDiv.querySelector('table');
      
      if (tempTable) {
        const tempCells = Array.from(tempTable.querySelectorAll('td, th'))
          .map(cell => cell.textContent?.trim() || '')
          .filter(text => text.length > 0)
          .slice(0, 5);
        
        // 计算匹配度
        const matchCount = originalCells.filter(cell => 
          tempCells.some(tempCell => tempCell.includes(cell) || cell.includes(tempCell))
        ).length;
        
        // 如果匹配度超过70%，认为是同一个表格
        if (matchCount / originalCells.length > 0.7) {
          return {
            found: true,
            start: match.index,
            end: match.index + match[0].length
          };
        }
      }
    }
    
    return { found: false, start: -1, end: -1 };
  }

  // 通过光标位置查找表格
  private findTableByCursor(editor: any, originalTable: HTMLTableElement): { found: boolean; startLine: number; startCh: number; endLine: number; endCh: number } {
    const cursor = editor.getCursor();
    const content = editor.getValue();
    const lines = content.split('\n');
    
    // 从光标位置向上下搜索表格标签
    let startLine = -1, endLine = -1;
    
    // 向上搜索<table>
    for (let i = cursor.line; i >= 0; i--) {
      if (lines[i].includes('<table')) {
        startLine = i;
        break;
      }
    }
    
    // 向下搜索</table>
    for (let i = cursor.line; i < lines.length; i++) {
      if (lines[i].includes('</table>')) {
        endLine = i;
        break;
      }
    }
    
    if (startLine >= 0 && endLine >= 0) {
      const startCh = lines[startLine].indexOf('<table');
      const endCh = lines[endLine].indexOf('</table>') + '</table>'.length;
      
      return {
        found: true,
        startLine,
        startCh,
        endLine,
        endCh
      };
    }
    
    return { found: false, startLine: -1, startCh: -1, endLine: -1, endCh: -1 };
  }

  // 显示手动替换对话框
  private showManualReplaceDialog(newHtml: string) {
    const modal = new Modal(this.app);
    modal.titleEl.setText('手动替换表格');
    
    const content = modal.contentEl;
    content.createEl('p', { text: '自动定位失败，请手动选择要替换的表格区域，然后点击替换按钮。' });
    
    const textarea = content.createEl('textarea', {
      attr: {
        rows: '10',
        cols: '80',
        readonly: 'true'
      }
    });
    textarea.value = newHtml;
    textarea.style.cssText = `
      width: 100%;
      font-family: monospace;
      font-size: 12px;
      margin: 10px 0;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      padding: 8px;
    `;
    
    const buttonContainer = content.createDiv({ cls: 'modal-button-container' });
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 15px;
    `;
    
    const copyBtn = buttonContainer.createEl('button', { text: '复制到剪贴板' });
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(newHtml);
      new Notice('已复制到剪贴板');
    });
    
    const replaceBtn = buttonContainer.createEl('button', { text: '替换选中内容' });
    replaceBtn.style.cssText = `
      background: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
    `;
    
    replaceBtn.addEventListener('click', () => {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (activeView) {
        const editor = activeView.editor;
        const selection = editor.getSelection();
        
        if (selection.trim()) {
          editor.replaceSelection(newHtml);
          new Notice('表格已替换');
          modal.close();
          
          setTimeout(() => {
            this.enhanceTablesInAllViews();
          }, 100);
        } else {
          new Notice('请先选择要替换的表格内容');
        }
      }
    });
    
    const cancelBtn = buttonContainer.createEl('button', { text: '取消' });
    cancelBtn.addEventListener('click', () => modal.close());
    
    modal.open();
  }

  // 标准化表格HTML格式
  private normalizeTableHtml(html: string): string {
    return html
      .replace(/\s+/g, ' ')  // 合并多个空白字符
      .replace(/> </g, '>\n<')  // 在标签间添加换行
      .replace(/class="[^"]*"/g, '')  // 移除class属性
      .replace(/style="[^"]*"/g, '')  // 移除style属性
      .replace(/title="[^"]*"/g, '')  // 移除title属性
      .replace(/outline="[^"]*"/g, '')  // 移除outline属性
      .trim();
  }

  // 查找表格在页面中的索引
  private findTableIndex(targetTable: HTMLTableElement): number {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) return -1;
    
    const previewElement = activeView.contentEl?.querySelector('.markdown-preview-view');
    if (!previewElement) return -1;
    
    const allTables = previewElement.querySelectorAll('table');
    return Array.from(allTables).indexOf(targetTable);
  }

  // 按索引替换表格
  private async replaceTableByIndex(editor: any, tableIndex: number, newHtml: string) {
    const content = editor.getValue();
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
    const matches = content.match(tableRegex);
    
    if (matches && matches[tableIndex]) {
      const updatedContent = content.replace(matches[tableIndex], newHtml);
      editor.setValue(updatedContent);
    }
  }

  onunload() {
    // 清理工作
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private isHtmlTable(text: string): boolean {
    const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/i;
    return tableRegex.test(text.trim());
  }

  private enhanceHtmlTable(table: HTMLTableElement) {
    // 为HTML表格添加交互功能
    table.classList.add('ob-htables-enhanced');
    
    // 添加双击编辑功能
    table.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const tableHtml = table.outerHTML;
      new HtmlTableModal(this.app, this.settings, (newHtml: string) => {
        // 这里需要更复杂的逻辑来替换原表格
        // 暂时显示通知
        new Notice('Table editing from preview mode coming soon!');
      }, tableHtml).open();
    });
  }

  private addEditorMenuItems(menu: Menu, editor: Editor, view: MarkdownView) {
    const selection = editor.getSelection();
    
    // 如果选中了HTML表格，添加编辑选项
    if (this.isHtmlTable(selection)) {
      menu.addItem((item) => {
        item
          .setTitle('编辑 HTML 表格')
          .setIcon('table')
          .onClick(() => {
            new HtmlTableModal(this.app, this.settings, (htmlTable: string) => {
              editor.replaceSelection(htmlTable);
            }, selection).open();
          });
      });
    } else {
      // 添加插入HTML表格的子菜单
      menu.addItem((item) => {
        item
          .setTitle('插入 HTML 表格')
          .setIcon('table')
          .onClick(() => {
            new HtmlTableModal(this.app, this.settings, (htmlTable: string) => {
              editor.replaceSelection(htmlTable);
            }).open();
          });
      });

      // 添加快速插入选项
      menu.addSeparator();
      
      menu.addItem((item) => {
        item
          .setTitle('快速插入 2x2 表格')
          .setIcon('table')
          .onClick(() => {
            this.insertQuickTable(editor, 2, 2);
          });
      });

      menu.addItem((item) => {
        item
          .setTitle('快速插入 3x3 表格')
          .setIcon('table')
          .onClick(() => {
            this.insertQuickTable(editor, 3, 3);
          });
      });

      menu.addItem((item) => {
        item
          .setTitle('快速插入 4x4 表格')
          .setIcon('table')
          .onClick(() => {
            this.insertQuickTable(editor, 4, 4);
          });
      });

      menu.addItem((item) => {
        item
          .setTitle('快速插入 5x5 表格')
          .setIcon('table')
          .onClick(() => {
            this.insertQuickTable(editor, 5, 5);
          });
      });
    }
  }

  private insertQuickTable(editor: Editor, rows: number, cols: number) {
    const tableHtml = this.generateQuickTable(rows, cols);
    editor.replaceSelection(tableHtml);
    new Notice(`已插入 ${rows}x${cols} HTML 表格`);
  }

  private generateQuickTable(rows: number, cols: number): string {
    let html = '<table>\n';
    
    // 添加表头
    html += '  <thead>\n    <tr>\n';
    for (let j = 0; j < cols; j++) {
      html += `      <th>标题 ${j + 1}</th>\n`;
    }
    html += '    </tr>\n  </thead>\n';
    
    // 添加表体
    html += '  <tbody>\n';
    for (let i = 1; i < rows; i++) {
      html += '    <tr>\n';
      for (let j = 0; j < cols; j++) {
        html += `      <td>单元格 ${i + 1}-${j + 1}</td>\n`;
      }
      html += '    </tr>\n';
    }
    html += '  </tbody>\n';
    html += '</table>\n';
    
    return html;
  }
}

class ObHtablesSettingTab extends PluginSettingTab {
  plugin: ObHtablesPlugin;

  constructor(app: App, plugin: ObHtablesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'ObHtables Settings' });

    new Setting(containerEl)
      .setName('Default table rows')
      .setDesc('Number of rows for new tables')
      .addText(text => text
        .setPlaceholder('3')
        .setValue(this.plugin.settings.defaultTableRows.toString())
        .onChange(async (value) => {
          this.plugin.settings.defaultTableRows = parseInt(value) || 3;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Default table columns')
      .setDesc('Number of columns for new tables')
      .addText(text => text
        .setPlaceholder('3')
        .setValue(this.plugin.settings.defaultTableCols.toString())
        .onChange(async (value) => {
          this.plugin.settings.defaultTableCols = parseInt(value) || 3;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Enable table styling')
      .setDesc('Apply custom styling to HTML tables')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableTableStyling)
        .onChange(async (value) => {
          this.plugin.settings.enableTableStyling = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Table theme')
      .setDesc('Choose a theme for your HTML tables')
      .addDropdown(dropdown => dropdown
        .addOption('default', 'Default')
        .addOption('minimal', 'Minimal')
        .addOption('bordered', 'Bordered')
        .addOption('striped', 'Striped')
        .setValue(this.plugin.settings.tableTheme)
        .onChange(async (value) => {
          this.plugin.settings.tableTheme = value;
          await this.plugin.saveSettings();
        }));
  }
}
