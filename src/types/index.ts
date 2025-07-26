export interface CellData {
  content: string;
  colspan: number;
  rowspan: number;
  merged: boolean;
}

export interface SelectedCell {
  row: number;
  col: number;
}

export enum SortType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

export interface TableSettings {
  defaultTableRows: number;
  defaultTableCols: number;
}

export interface MenuItemConfig {
  text: string;
  action?: () => void;
  icon?: string;
  className?: string;
  disabled?: boolean;
  submenu?: MenuItemConfig[];
}