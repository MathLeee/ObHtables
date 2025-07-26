import { TableData } from './TableData';
import { TableRenderer } from './TableRenderer';
import { CellSelection } from '../features/CellSelection';
import { CellMerging } from '../features/CellMerging';
import { TableSorting } from '../features/TableSorting';
import { RowColumnOperations } from '../features/RowColumnOperations';
import { ClipboardOperations } from '../features/ClipboardOperations';
import { ControlPanel } from '../ui/ControlPanel';
import { ContextMenu } from '../ui/ContextMenu';
import { TableSettings } from '../types';

export class HtmlTableEditor {
  private container: HTMLElement;
  private settings: TableSettings;
  private tableData: TableData;
  private renderer: TableRenderer;
  private cellSelection: CellSelection;
  private cellMerging: CellMerging;
  private tableSorting: TableSorting;
  private rowColumnOps: RowColumnOperations;
  private clipboardOps: ClipboardOperations;
  private controlPanel: ControlPanel;
  private contextMenu: ContextMenu;
  
  constructor(container: HTMLElement, settings: TableSettings, existingTable?: string) {
    this.container = container;
    this.settings = settings;
    this.tableData = new TableData(settings, existingTable);
    
    this.initializeComponents();
    this.render();
    this.setupEventListeners();
  }
  
  private initializeComponents(): void {
    this.renderer = new TableRenderer(this.container, this.tableData);
    this.cellSelection = new CellSelection(this.container);
    this.cellMerging = new CellMerging(this.tableData, this.cellSelection);
    this.tableSorting = new TableSorting(this.tableData);
    this.rowColumnOps = new RowColumnOperations(this.tableData);
    this.clipboardOps = new ClipboardOperations(this.tableData, this.cellSelection);
    this.controlPanel = new ControlPanel(this.container, this);
    this.contextMenu = new ContextMenu();
  }
  
  private setupEventListeners(): void {
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.cellSelection.clearSelection();
        this.contextMenu.hide();
      }
    });
    
    document.addEventListener('contextmenu', (e) => {
      if (!this.container.contains(e.target as Node)) {
        this.contextMenu.hide();
      }
    });
  }
  
  public render(): void {
    this.container.empty();
    this.controlPanel.render();
    this.renderer.render();
  }
  
  public getHtmlTable(): string {
    return this.renderer.getHtmlTable();
  }
  
  // 公开必要的方法供其他组件调用
  public getCellSelection(): CellSelection {
    return this.cellSelection;
  }
  
  public getCellMerging(): CellMerging {
    return this.cellMerging;
  }
  
  public getTableSorting(): TableSorting {
    return this.tableSorting;
  }
  
  public getRowColumnOps(): RowColumnOperations {
    return this.rowColumnOps;
  }
  
  public getClipboardOps(): ClipboardOperations {
    return this.clipboardOps;
  }
  
  public getContextMenu(): ContextMenu {
    return this.contextMenu;
  }
  
  public updateTable(): void {
    this.renderer.render();
  }
}