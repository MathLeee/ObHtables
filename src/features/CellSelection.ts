import { SelectedCell } from '../types';

export class CellSelection {
  private selectedCells: SelectedCell[] = [];
  private container: HTMLElement;
  
  constructor(container: HTMLElement) {
    this.container = container;
  }
  
  public handleCellClick(row: number, col: number, multiSelect: boolean): void {
    if (!multiSelect) {
      this.clearSelection();
    }
    
    const cellIndex = this.selectedCells.findIndex(cell => cell.row === row && cell.col === col);
    
    if (cellIndex >= 0) {
      this.selectedCells.splice(cellIndex, 1);
    } else {
      this.selectedCells.push({ row, col });
    }
    
    this.updateCellSelection();
  }
  
  public updateCellSelection(): void {
    const cells = this.container.querySelectorAll('.html-table-preview td, .html-table-preview th');
    cells.forEach(cell => cell.classList.remove('selected'));
    
    this.selectedCells.forEach(({ row, col }) => {
      const cell = this.container.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cell) {
        cell.classList.add('selected');
      }
    });
  }
  
  public clearSelection(): void {
    this.selectedCells = [];
    this.updateCellSelection();
  }
  
  public getSelectedCells(): SelectedCell[] {
    return [...this.selectedCells];
  }
  
  public setSelectedCells(cells: SelectedCell[]): void {
    this.selectedCells = [...cells];
    this.updateCellSelection();
  }
}