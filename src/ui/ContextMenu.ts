import { MenuItemConfig } from '../types';

export class ContextMenu {
  private contextMenu: HTMLElement | null = null;
  
  public show(e: MouseEvent, menuItems: MenuItemConfig[]): void {
    this.hide();
    
    const menu = document.createElement('div');
    menu.className = 'table-context-menu';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.zIndex = '1000';
    
    this.createMenuItems(menu, menuItems);
    
    document.body.appendChild(menu);
    this.contextMenu = menu;
    
    this.adjustMenuPosition(menu, e);
    
    setTimeout(() => {
      document.addEventListener('click', () => this.hide(), { once: true });
    }, 0);
  }
  
  public hide(): void {
    if (this.contextMenu) {
      this.contextMenu.remove();
      this.contextMenu = null;
    }
  }
  
  private createMenuItems(container: HTMLElement, items: MenuItemConfig[]): void {
    items.forEach(item => {
      if (item.text === '---') {
        container.createEl('hr');
      } else if (item.submenu) {
        this.createSubmenuItem(container, item);
      } else {
        this.createMenuItem(container, item);
      }
    });
  }
  
  private createMenuItem(container: HTMLElement, item: MenuItemConfig): void {
    const menuItem = container.createEl('div', {
      text: item.text,
      cls: `menu-item ${item.className || ''} ${item.disabled ? 'disabled' : ''}`
    });
    
    if (item.icon) {
      const icon = menuItem.createSpan({ text: item.icon, cls: 'menu-icon' });
      menuItem.insertBefore(icon, menuItem.firstChild);
    }
    
    if (item.action && !item.disabled) {
      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        item.action!();
        this.hide();
      });
    }
  }
  
  private createSubmenuItem(container: HTMLElement, item: MenuItemConfig): void {
    const menuItem = container.createEl('div', {
      text: item.text,
      cls: `menu-item submenu-item ${item.className || ''}`
    });
    
    if (item.icon) {
      const icon = menuItem.createSpan({ text: item.icon, cls: 'menu-icon' });
      menuItem.insertBefore(icon, menuItem.firstChild);
    }
    
    const arrow = menuItem.createSpan({ text: '▶', cls: 'submenu-arrow' });
    
    const submenu = document.createElement('div');
    submenu.className = 'table-submenu';
    submenu.style.display = 'none';
    
    this.createMenuItems(submenu, item.submenu!);
    menuItem.appendChild(submenu);
    
    this.setupSubmenuEvents(menuItem, submenu, container);
  }
  
  private setupSubmenuEvents(menuItem: HTMLElement, submenu: HTMLElement, container: HTMLElement): void {
    let hideTimeout: NodeJS.Timeout;
    
    const showSubmenu = () => {
      clearTimeout(hideTimeout);
      container.querySelectorAll('.table-submenu').forEach(sub => {
        if (sub !== submenu) {
          (sub as HTMLElement).style.display = 'none';
        }
      });
      submenu.style.display = 'block';
      this.adjustSubmenuPosition(submenu, menuItem);
    };
    
    const hideSubmenu = () => {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        submenu.style.display = 'none';
      }, 150);
    };
    
    menuItem.addEventListener('mouseenter', showSubmenu);
    menuItem.addEventListener('mouseleave', hideSubmenu);
    submenu.addEventListener('mouseenter', () => clearTimeout(hideTimeout));
    submenu.addEventListener('mouseleave', hideSubmenu);
    submenu.addEventListener('click', (e) => e.stopPropagation());
  }
  
  private adjustMenuPosition(menu: HTMLElement, event: MouseEvent): void {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (rect.right > viewportWidth) {
      menu.style.left = Math.max(0, event.clientX - rect.width) + 'px';
    }
    
    if (rect.bottom > viewportHeight) {
      menu.style.top = Math.max(0, event.clientY - rect.height) + 'px';
    }
    
    const finalRect = menu.getBoundingClientRect();
    if (finalRect.height > viewportHeight - 20) {
      menu.style.maxHeight = (viewportHeight - 40) + 'px';
      menu.style.overflowY = 'auto';
      menu.style.top = '20px';
    }
  }
  
  private adjustSubmenuPosition(submenu: HTMLElement, parentItem: HTMLElement): void {
    const parentRect = parentItem.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    submenu.style.left = '100%';
    submenu.style.top = '0px';
    
    submenu.offsetHeight;
    
    const submenuRect = submenu.getBoundingClientRect();
    
    if (submenuRect.right > viewportWidth - 10) {
      submenu.style.left = '';
      submenu.style.right = '100%';
    }
    
    if (submenuRect.bottom > viewportHeight - 10) {
      const offset = Math.min(0, viewportHeight - submenuRect.bottom - 20);
      submenu.style.top = offset + 'px';
    }
    
    const finalRect = submenu.getBoundingClientRect();
    if (finalRect.top < 10) {
      submenu.style.top = (10 - parentRect.top) + 'px';
    }
  }
}