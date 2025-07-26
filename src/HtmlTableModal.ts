import { App, Modal, Setting } from 'obsidian';
import { HtmlTableEditor } from './HtmlTableEditor';

export class HtmlTableModal extends Modal {
  private settings: any;
  private onSubmit: (htmlTable: string) => void;
  private existingTable?: string;
  private tableEditor: HtmlTableEditor;

  constructor(app: App, settings: any, onSubmit: (htmlTable: string) => void, existingTable?: string) {
    super(app);
    this.settings = settings;
    this.onSubmit = onSubmit;
    this.existingTable = existingTable;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: this.existingTable ? 'Edit HTML Table' : 'Create HTML Table' });

    // 创建表格编辑器容器
    const editorContainer = contentEl.createDiv({ cls: 'html-table-editor-container' });
    
    this.tableEditor = new HtmlTableEditor(
      editorContainer,
      this.settings,
      this.existingTable
    );

    // 添加按钮
    const buttonContainer = contentEl.createDiv({ cls: 'modal-button-container' });
    
    const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
    cancelButton.addEventListener('click', () => this.close());

    const submitButton = buttonContainer.createEl('button', { 
      text: this.existingTable ? 'Update Table' : 'Insert Table',
      cls: 'mod-cta'
    });
    submitButton.addEventListener('click', () => {
      const htmlTable = this.tableEditor.getHtmlTable();
      this.onSubmit(htmlTable);
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}