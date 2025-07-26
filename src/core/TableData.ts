import { CellData, TableSettings } from '../types';
import { TableParser } from '../utils/TableParser';

export class TableData {
  private data: CellData[][];
  private hasHeader: boolean;
  
  constructor(settings: TableSettings, existingTable?: string) {
    this.hasHeader = true;
    
    if (existingTable) {
      this.data = TableParser.parseExistingTable(existingTable);
      this.hasHeader = TableParser.hasTableHeader(existingTable);
    } else {
      this.data = this.initializeEmptyTable(settings);
    }
  }
  
  private initializeEmptyTable(settings: TableSettings): CellData[][] {
    const { defaultTableRows, defaultTableCols } = settings;
    const data: CellData[][] = [];
    
    for (let i = 0; i < defaultTableRows; i++) {
      const row: CellData[] = [];
      for (let j = 0; j < defaultTableCols; j++) {
        row.push({
          content: i === 0 ? `Header ${j + 1}` : `Cell ${i}-${j + 1}`,
          colspan: 1,
          rowspan: 1,
          merged: false
        });
      }
      data.push(row);
    }
    
    return data;
  }
  
  public getData(): CellData[][] {
    return this.data;
  }
  
  public setData(data: CellData[][]): void {
    this.data = data;
  }
  
  public getCell(row: number, col: number): CellData {
    return this.data[row]?.[col];
  }
  
  public setCell(row: number, col: number, cellData: CellData): void {
    if (this.data[row]) {
      this.data[row][col] = cellData;
    }
  }
  
  public getRowCount(): number {
    return this.data.length;
  }
  
  public getColCount(): number {
    return this.data[0]?.length || 0;
  }
  
  public getHasHeader(): boolean {
    return this.hasHeader;
  }
  
  public setHasHeader(hasHeader: boolean): void {
    this.hasHeader = hasHeader;
  }
}