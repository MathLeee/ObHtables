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
  enableTemplates?: boolean;
  customTemplates?: TableTemplate[];
}

export interface MenuItemConfig {
  text: string;
  action?: () => void;
  icon?: string;
  className?: string;
  disabled?: boolean;
  submenu?: MenuItemConfig[];
}

// 新增模板相关类型
export interface TableTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  data: CellData[][];
  hasHeader: boolean;
  preview?: string;
  isCustom?: boolean;
  createdAt?: Date;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}