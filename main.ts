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

  async onload() {
    await this.loadSettings();

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

    // 注册HTML表格的后处理器
    this.registerMarkdownPostProcessor((element, context) => {
      const tables = element.querySelectorAll('table');
      tables.forEach(table => {
        this.enhanceHtmlTable(table as HTMLTableElement);
      });
    });
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