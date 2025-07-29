import { CellData } from '../types';

export interface TableTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  data: CellData[][];
  hasHeader: boolean;
  preview?: string;
}

export class TableTemplates {
  private static templates: TableTemplate[] = [
    // 基础模板
    {
      id: 'basic-2x2',
      name: '基础表格 (2x2)',
      description: '简单的2行2列表格',
      category: '基础',
      hasHeader: true,
      data: [
        [
          { content: '标题1', colspan: 1, rowspan: 1, merged: false },
          { content: '标题2', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '内容1', colspan: 1, rowspan: 1, merged: false },
          { content: '内容2', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    {
      id: 'basic-3x3',
      name: '基础表格 (3x3)',
      description: '标准的3行3列表格',
      category: '基础',
      hasHeader: true,
      data: [
        [
          { content: '列1', colspan: 1, rowspan: 1, merged: false },
          { content: '列2', colspan: 1, rowspan: 1, merged: false },
          { content: '列3', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '行1数据1', colspan: 1, rowspan: 1, merged: false },
          { content: '行1数据2', colspan: 1, rowspan: 1, merged: false },
          { content: '行1数据3', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '行2数据1', colspan: 1, rowspan: 1, merged: false },
          { content: '行2数据2', colspan: 1, rowspan: 1, merged: false },
          { content: '行2数据3', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    
    // 商务模板
    {
      id: 'financial-report',
      name: '财务报表',
      description: '适用于财务数据展示的表格',
      category: '商务',
      hasHeader: true,
      data: [
        [
          { content: '项目', colspan: 1, rowspan: 1, merged: false },
          { content: '本月', colspan: 1, rowspan: 1, merged: false },
          { content: '上月', colspan: 1, rowspan: 1, merged: false },
          { content: '同比', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '收入', colspan: 1, rowspan: 1, merged: false },
          { content: '¥0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '¥0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '0%', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '支出', colspan: 1, rowspan: 1, merged: false },
          { content: '¥0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '¥0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '0%', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '净利润', colspan: 1, rowspan: 1, merged: false },
          { content: '¥0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '¥0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '0%', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    {
      id: 'project-timeline',
      name: '项目时间线',
      description: '项目进度跟踪表格',
      category: '商务',
      hasHeader: true,
      data: [
        [
          { content: '任务', colspan: 1, rowspan: 1, merged: false },
          { content: '负责人', colspan: 1, rowspan: 1, merged: false },
          { content: '开始日期', colspan: 1, rowspan: 1, merged: false },
          { content: '结束日期', colspan: 1, rowspan: 1, merged: false },
          { content: '状态', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '需求分析', colspan: 1, rowspan: 1, merged: false },
          { content: '张三', colspan: 1, rowspan: 1, merged: false },
          { content: '2025-01-01', colspan: 1, rowspan: 1, merged: false },
          { content: '2025-01-07', colspan: 1, rowspan: 1, merged: false },
          { content: '进行中', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '系统设计', colspan: 1, rowspan: 1, merged: false },
          { content: '李四', colspan: 1, rowspan: 1, merged: false },
          { content: '2025-01-08', colspan: 1, rowspan: 1, merged: false },
          { content: '2025-01-15', colspan: 1, rowspan: 1, merged: false },
          { content: '待开始', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    
    // 学术模板
    {
      id: 'comparison-table',
      name: '对比分析表',
      description: '用于对比不同方案或产品',
      category: '学术',
      hasHeader: true,
      data: [
        [
          { content: '特性', colspan: 1, rowspan: 1, merged: false },
          { content: '方案A', colspan: 1, rowspan: 1, merged: false },
          { content: '方案B', colspan: 1, rowspan: 1, merged: false },
          { content: '方案C', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '成本', colspan: 1, rowspan: 1, merged: false },
          { content: '低', colspan: 1, rowspan: 1, merged: false },
          { content: '中', colspan: 1, rowspan: 1, merged: false },
          { content: '高', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '性能', colspan: 1, rowspan: 1, merged: false },
          { content: '中', colspan: 1, rowspan: 1, merged: false },
          { content: '高', colspan: 1, rowspan: 1, merged: false },
          { content: '高', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '维护性', colspan: 1, rowspan: 1, merged: false },
          { content: '高', colspan: 1, rowspan: 1, merged: false },
          { content: '中', colspan: 1, rowspan: 1, merged: false },
          { content: '低', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    {
      id: 'research-data',
      name: '研究数据表',
      description: '科研数据记录表格',
      category: '学术',
      hasHeader: true,
      data: [
        [
          { content: '实验组', colspan: 1, rowspan: 1, merged: false },
          { content: '样本数', colspan: 1, rowspan: 1, merged: false },
          { content: '平均值', colspan: 1, rowspan: 1, merged: false },
          { content: '标准差', colspan: 1, rowspan: 1, merged: false },
          { content: 'P值', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '对照组', colspan: 1, rowspan: 1, merged: false },
          { content: '30', colspan: 1, rowspan: 1, merged: false },
          { content: '0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '-', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '实验组1', colspan: 1, rowspan: 1, merged: false },
          { content: '30', colspan: 1, rowspan: 1, merged: false },
          { content: '0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '0.00', colspan: 1, rowspan: 1, merged: false },
          { content: '0.05', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    
    // 个人模板
    {
      id: 'schedule-table',
      name: '日程安排表',
      description: '个人或团队日程管理',
      category: '个人',
      hasHeader: true,
      data: [
        [
          { content: '时间', colspan: 1, rowspan: 1, merged: false },
          { content: '周一', colspan: 1, rowspan: 1, merged: false },
          { content: '周二', colspan: 1, rowspan: 1, merged: false },
          { content: '周三', colspan: 1, rowspan: 1, merged: false },
          { content: '周四', colspan: 1, rowspan: 1, merged: false },
          { content: '周五', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '9:00-10:00', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '10:00-11:00', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false },
          { content: '', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    },
    {
      id: 'expense-tracker',
      name: '支出记录表',
      description: '个人支出跟踪管理',
      category: '个人',
      hasHeader: true,
      data: [
        [
          { content: '日期', colspan: 1, rowspan: 1, merged: false },
          { content: '类别', colspan: 1, rowspan: 1, merged: false },
          { content: '描述', colspan: 1, rowspan: 1, merged: false },
          { content: '金额', colspan: 1, rowspan: 1, merged: false },
          { content: '支付方式', colspan: 1, rowspan: 1, merged: false }
        ],
        [
          { content: '2025-01-01', colspan: 1, rowspan: 1, merged: false },
          { content: '餐饮', colspan: 1, rowspan: 1, merged: false },
          { content: '午餐', colspan: 1, rowspan: 1, merged: false },
          { content: '¥25.00', colspan: 1, rowspan: 1, merged: false },
          { content: '微信支付', colspan: 1, rowspan: 1, merged: false }
        ]
      ]
    }
  ];
  
  static getAllTemplates(): TableTemplate[] {
    return this.templates;
  }
  
  static getTemplatesByCategory(category: string): TableTemplate[] {
    return this.templates.filter(template => template.category === category);
  }
  
  static getTemplateById(id: string): TableTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }
  
  static getCategories(): string[] {
    const categories = new Set(this.templates.map(template => template.category));
    return Array.from(categories);
  }
  
  static addCustomTemplate(template: TableTemplate): void {
    this.templates.push(template);
  }
  
  static removeTemplate(id: string): boolean {
    const index = this.templates.findIndex(template => template.id === id);
    if (index !== -1) {
      this.templates.splice(index, 1);
      return true;
    }
    return false;
  }
  
  // 导出模板到JSON文件
  static exportTemplates(templateIds?: string[]): void {
    const templatesToExport = templateIds 
      ? this.templates.filter(t => templateIds.includes(t.id))
      : this.templates.filter(t => t.isCustom);
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates: templatesToExport
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  // 从JSON文件导入模板
  static async importTemplates(file: File): Promise<{ success: number; errors: string[] }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (!data.templates || !Array.isArray(data.templates)) {
            resolve({ success: 0, errors: ['无效的模板文件格式'] });
            return;
          }
          
          let successCount = 0;
          const errors: string[] = [];
          
          data.templates.forEach((template: any, index: number) => {
            try {
              // 验证模板格式
              if (!this.validateTemplate(template)) {
                errors.push(`模板 ${index + 1}: 格式无效`);
                return;
              }
              
              // 检查ID冲突
              if (this.getTemplateById(template.id)) {
                template.id = `imported-${Date.now()}-${index}`;
              }
              
              // 标记为自定义模板
              template.isCustom = true;
              template.importedAt = new Date();
              
              this.addCustomTemplate(template);
              successCount++;
            } catch (error) {
              errors.push(`模板 ${index + 1}: ${error}`);
            }
          });
          
          resolve({ success: successCount, errors });
        } catch (error) {
          resolve({ success: 0, errors: ['文件解析失败'] });
        }
      };
      
      reader.onerror = () => {
        resolve({ success: 0, errors: ['文件读取失败'] });
      };
      
      reader.readAsText(file);
    });
  }
  
  // 验证模板格式
  private static validateTemplate(template: any): boolean {
    return (
      typeof template.id === 'string' &&
      typeof template.name === 'string' &&
      typeof template.description === 'string' &&
      typeof template.category === 'string' &&
      Array.isArray(template.data) &&
      typeof template.hasHeader === 'boolean' &&
      template.data.every((row: any) => 
        Array.isArray(row) &&
        row.every((cell: any) => 
          typeof cell.content === 'string' &&
          typeof cell.colspan === 'number' &&
          typeof cell.rowspan === 'number' &&
          typeof cell.merged === 'boolean'
        )
      )
    );
  }
  
  // 获取自定义模板
  static getCustomTemplates(): TableTemplate[] {
    return this.templates.filter(t => t.isCustom);
  }
  
  // 清空自定义模板
  static clearCustomTemplates(): void {
    this.templates = this.templates.filter(t => !t.isCustom);
  }
}