import { TableTemplates, TableTemplate } from '../features/TableTemplates';
import { TableParser } from '../utils/TableParser';

export class TemplateSelector {
  private container: HTMLElement;
  private onTemplateSelect: (template: TableTemplate) => void;
  private modal: HTMLElement | null = null;
  
  constructor(container: HTMLElement, onTemplateSelect: (template: TableTemplate) => void) {
    this.container = container;
    this.onTemplateSelect = onTemplateSelect;
  }
  
  public show(): void {
    this.createModal();
  }
  
  public hide(): void {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
  
  private createModal(): void {
    this.hide();
    
    this.modal = document.createElement('div');
    this.modal.className = 'template-selector-modal';
    this.modal.style.cssText = `
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
    modalContent.className = 'template-selector-content';
    modalContent.style.cssText = `
      background: var(--background-primary);
      border-radius: 8px;
      padding: 20px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    // 标题和搜索栏
    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;';
    
    const title = document.createElement('h2');
    title.textContent = '选择表格模板';
    title.style.cssText = 'margin: 0; color: var(--text-normal); font-size: 1.5em;';
    
    // 搜索框
    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'position: relative; width: 250px;';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '搜索模板...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px 8px 36px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 20px;
      background: var(--background-primary);
      color: var(--text-normal);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    `;
    
    const searchIcon = document.createElement('span');
    searchIcon.textContent = '🔍';
    searchIcon.style.cssText = `
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    `;
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    
    header.appendChild(title);
    header.appendChild(searchContainer);
    modalContent.appendChild(header);
    
    // 分类和内容容器
    const bodyContainer = document.createElement('div');
    bodyContainer.style.cssText = 'display: flex; gap: 20px; height: 500px;';
    
    // 左侧分类列表
    const categorySidebar = document.createElement('div');
    categorySidebar.style.cssText = `
      width: 150px;
      border-right: 1px solid var(--background-modifier-border);
      padding-right: 15px;
    `;
    
    const categoryTitle = document.createElement('h4');
    categoryTitle.textContent = '分类';
    categoryTitle.style.cssText = 'margin: 0 0 10px 0; color: var(--text-normal);';
    categorySidebar.appendChild(categoryTitle);
    
    const categories = ['全部', ...TableTemplates.getCategories()];
    let activeCategory = '全部';
    
    const categoryList = document.createElement('div');
    categoryList.style.cssText = 'display: flex; flex-direction: column; gap: 5px;';
    
    // 右侧内容区域
    const contentArea = document.createElement('div');
    contentArea.style.cssText = 'flex: 1; overflow-y: auto;';
    
    const renderContent = (searchTerm = '', category = '全部') => {
      contentArea.innerHTML = '';
      
      let templates = category === '全部' 
        ? TableTemplates.getAllTemplates()
        : TableTemplates.getTemplatesByCategory(category);
      
      if (searchTerm) {
        templates = templates.filter(template => 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (templates.length === 0) {
        const noResults = document.createElement('div');
        noResults.style.cssText = `
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-style: italic;
        `;
        noResults.textContent = searchTerm 
          ? `未找到包含 "${searchTerm}" 的模板`
          : '该分类下暂无模板';
        contentArea.appendChild(noResults);
        return;
      }
      
      const grid = document.createElement('div');
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 15px;
        padding: 10px;
      `;
      
      templates.forEach(template => {
        const templateCard = this.createTemplateCard(template);
        grid.appendChild(templateCard);
      });
      
      contentArea.appendChild(grid);
    };
    
    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.textContent = category;
      categoryItem.style.cssText = `
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        color: ${category === activeCategory ? 'var(--text-on-accent)' : 'var(--text-normal)'};
        background: ${category === activeCategory ? 'var(--interactive-accent)' : 'transparent'};
        font-weight: ${category === activeCategory ? '500' : 'normal'};
      `;
      
      categoryItem.addEventListener('click', () => {
        // 更新活动分类
        categoryList.querySelectorAll('div').forEach(item => {
          item.style.color = 'var(--text-normal)';
          item.style.background = 'transparent';
          item.style.fontWeight = 'normal';
        });
        
        categoryItem.style.color = 'var(--text-on-accent)';
        categoryItem.style.background = 'var(--interactive-accent)';
        categoryItem.style.fontWeight = '500';
        
        activeCategory = category;
        renderContent(searchInput.value, category);
      });
      
      categoryItem.addEventListener('mouseenter', () => {
        if (category !== activeCategory) {
          categoryItem.style.background = 'var(--background-modifier-hover)';
        }
      });
      
      categoryItem.addEventListener('mouseleave', () => {
        if (category !== activeCategory) {
          categoryItem.style.background = 'transparent';
        }
      });
      
      categoryList.appendChild(categoryItem);
    });
    
    categorySidebar.appendChild(categoryList);
    
    // 搜索功能
    let searchTimeout: NodeJS.Timeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        renderContent(searchInput.value, activeCategory);
      }, 300);
    });
    
    searchInput.addEventListener('focus', () => {
      searchInput.style.borderColor = 'var(--interactive-accent)';
    });
    
    searchInput.addEventListener('blur', () => {
      searchInput.style.borderColor = 'var(--background-modifier-border)';
    });
    
    bodyContainer.appendChild(categorySidebar);
    bodyContainer.appendChild(contentArea);
    modalContent.appendChild(bodyContainer);
    
    // 初始渲染
    renderContent();
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '取消';
    closeButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      font-size: 1.5em;
      cursor: pointer;
      color: var(--text-muted);
    `;
    closeButton.addEventListener('click', () => this.hide());
    modalContent.style.position = 'relative';
    modalContent.appendChild(closeButton);
    
    this.modal.appendChild(modalContent);
    
    // 点击背景关闭
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
    
    document.body.appendChild(this.modal);
  }
  
  private renderTemplateGrid(container: HTMLElement, category: string): void {
    container.innerHTML = '';
    
    const templates = TableTemplates.getTemplatesByCategory(category);
    
    const grid = document.createElement('div');
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
    `;
    
    templates.forEach(template => {
      const templateCard = this.createTemplateCard(template);
      grid.appendChild(templateCard);
    });
    
    container.appendChild(grid);
  }
  
  // 在 createTemplateCard 方法中添加现代化设计
  private createTemplateCard(template: TableTemplate): HTMLElement {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.style.cssText = `
      border: 1px solid var(--background-modifier-border);
      border-radius: var(--ob-htables-radius-lg);
      padding: 20px;
      cursor: pointer;
      background: var(--background-primary);
      position: relative;
      overflow: hidden;
      transition: var(--ob-htables-transition);
    `;
  
    // 添加渐变背景
    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--ob-htables-primary), var(--ob-htables-primary-hover));
      transform: scaleX(0);
      transition: transform 0.3s ease;
    `;
    card.appendChild(gradientOverlay);
  
    // 模板信息头部
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;
    
    const name = document.createElement('h4');
    name.textContent = template.name;
    name.style.cssText = `
      margin: 0;
      color: var(--text-normal);
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    // 添加图标
    const icon = document.createElement('span');
    icon.textContent = this.getCategoryIcon(template.category);
    icon.style.fontSize = '18px';
    name.insertBefore(icon, name.firstChild);
    
    // 分类标签
    const categoryTag = document.createElement('span');
    categoryTag.textContent = template.category;
    categoryTag.style.cssText = `
      background: linear-gradient(135deg, var(--ob-htables-primary), var(--ob-htables-primary-hover));
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: var(--ob-htables-shadow-sm);
    `;
    
    header.appendChild(name);
    header.appendChild(categoryTag);
    
    const description = document.createElement('p');
    description.textContent = template.description;
    description.style.cssText = `
      margin: 0 0 16px 0;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.5;
      height: 40px;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    `;
  
    // 增强的预览表格容器
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
      border: 1px solid var(--background-modifier-border);
      border-radius: var(--ob-htables-radius-md);
      overflow: hidden;
      margin-bottom: 16px;
      max-height: 140px;
      overflow-y: auto;
      background: var(--background-secondary);
      position: relative;
    `;
    
    const previewTable = this.createEnhancedPreviewTable(template);
    previewContainer.appendChild(previewTable);
  
    // 模板统计信息
    const stats = document.createElement('div');
    stats.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 16px;
      padding: 8px 12px;
      background: var(--background-secondary);
      border-radius: var(--ob-htables-radius-sm);
    `;
    
    const dimensions = document.createElement('span');
    dimensions.innerHTML = `📊 ${template.data.length}行 × ${template.data[0]?.length || 0}列`;
    
    const hasHeaderText = document.createElement('span');
    hasHeaderText.innerHTML = template.hasHeader ? '✅ 包含表头' : '❌ 无表头';
    
    stats.appendChild(dimensions);
    stats.appendChild(hasHeaderText);
  
    // 使用按钮
    const useButton = document.createElement('button');
    useButton.textContent = '✨ 使用此模板';
    useButton.style.cssText = `
      width: 100%;
      padding: 12px;
      border: none;
      background: linear-gradient(135deg, var(--ob-htables-primary), var(--ob-htables-primary-hover));
      color: white;
      border-radius: var(--ob-htables-radius-sm);
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      transition: var(--ob-htables-transition);
      position: relative;
      overflow: hidden;
    `;
    
    // 按钮悬停效果
    useButton.addEventListener('mouseenter', () => {
      useButton.style.transform = 'translateY(-2px)';
      useButton.style.boxShadow = 'var(--ob-htables-shadow-md)';
      gradientOverlay.style.transform = 'scaleX(1)';
    });
    
    useButton.addEventListener('mouseleave', () => {
      useButton.style.transform = 'translateY(0)';
      useButton.style.boxShadow = 'none';
    });
  
    useButton.addEventListener('click', (e) => {
      e.stopPropagation();
      // 添加点击动画
      card.style.animation = 'ob-htables-bounce 0.6s ease';
      setTimeout(() => {
        this.onTemplateSelect(template);
        this.hide();
      }, 300);
    });
  
    // 卡片悬停效果
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px) scale(1.02)';
      card.style.boxShadow = 'var(--ob-htables-shadow-xl)';
      card.style.borderColor = 'var(--ob-htables-primary)';
      gradientOverlay.style.transform = 'scaleX(1)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = 'var(--ob-htables-shadow-sm)';
      card.style.borderColor = 'var(--background-modifier-border)';
      gradientOverlay.style.transform = 'scaleX(0)';
    });
  
    card.appendChild(header);
    card.appendChild(description);
    card.appendChild(previewContainer);
    card.appendChild(stats);
    card.appendChild(useButton);
  
    return card;
  }
  
  // 获取分类图标
  private getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      '基础': '📋',
      '商务': '💼',
      '学术': '🎓',
      '个人': '👤',
      '自定义': '⚙️'
    };
    return icons[category] || '📄';
  }
  
  private createEnhancedPreviewTable(template: TableTemplate): HTMLElement {
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      background: var(--background-primary);
    `;
  
    template.data.slice(0, 4).forEach((rowData, rowIndex) => { // 只显示前4行
      const row = document.createElement('tr');
      
      rowData.slice(0, 4).forEach((cellData, colIndex) => { // 只显示前4列
        const cellType = (template.hasHeader && rowIndex === 0) ? 'th' : 'td';
        const cell = document.createElement(cellType);
        
        cell.textContent = cellData.content.length > 8 
          ? cellData.content.substring(0, 8) + '...' 
          : cellData.content;
        
        cell.style.cssText = `
          border: 1px solid var(--background-modifier-border);
          padding: 4px 6px;
          text-align: left;
          background: ${cellType === 'th' ? 'var(--background-secondary)' : 'transparent'};
          font-weight: ${cellType === 'th' ? 'bold' : 'normal'};
          color: var(--text-normal);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60px;
        `;
        
        row.appendChild(cell);
      });
      
      // 如果列数超过4，添加省略号
      if (rowData.length > 4) {
        const moreCell = document.createElement(template.hasHeader && rowIndex === 0 ? 'th' : 'td');
        moreCell.textContent = '...';
        moreCell.style.cssText = `
          border: 1px solid var(--background-modifier-border);
          padding: 4px 6px;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        `;
        row.appendChild(moreCell);
      }
      
      table.appendChild(row);
    });
    
    // 如果行数超过4，添加省略行
    if (template.data.length > 4) {
      const moreRow = document.createElement('tr');
      const colCount = Math.min(template.data[0]?.length || 0, 4) + (template.data[0]?.length > 4 ? 1 : 0);
      
      for (let i = 0; i < colCount; i++) {
        const cell = document.createElement('td');
        cell.textContent = '...';
        cell.style.cssText = `
          border: 1px solid var(--background-modifier-border);
          padding: 4px 6px;
          text-align: center;
          color: var(--text-muted);
          font-style: italic;
        `;
        moreRow.appendChild(cell);
      }
      
      table.appendChild(moreRow);
    }
  
    return table;
  }
}