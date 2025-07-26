# ObHtables - Obsidian HTML Table Editor Plugin

一个强大的 Obsidian 插件，用于直接编辑和管理 HTML 表格。

## 功能特性

### 🚀 核心功能
- **直接编辑 HTML 表格** - 在 Obsidian 中无缝编辑 HTML 表格
- **右键快速插入** - 在编辑器中右键即可快速插入表格
- **可视化编辑器** - 直观的表格编辑界面
- **实时预览** - 编辑时实时查看表格效果

### 📊 高级表格操作
- **单元格合并/拆分** - 支持 colspan 和 rowspan
- **智能行列操作** - 精确的行列插入、删除
- **批量操作** - 支持批量插入行列
- **单元格选择** - 多选单元格进行批量操作
- **表格数据排序** - 支持文本、数字、日期多种排序方式 ✅

### 🎨 用户体验
- **右键菜单** - 丰富的上下文菜单选项
- **快捷键支持** - 高效的键盘操作
- **复制粘贴** - 单元格内容的复制粘贴
- **主题支持** - 多种表格主题可选

## 安装方法

### 手动安装
1. 下载最新版本的插件文件
2. 将文件解压到 Obsidian vault 的 `.obsidian/plugins/ob-htables/` 目录
3. 在 Obsidian 设置中启用插件

### 开发者安装
```bash
# 克隆仓库
git clone https://github.com/MathLeee/ObHtables.git
cd ObHtables

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 使用方法

### 快速开始
1. **插入新表格**：在编辑器中右键 → 选择"插入 HTML 表格"
2. **快速插入**：右键选择预设尺寸（2x2, 3x3, 4x4, 5x5）
3. **编辑现有表格**：选中 HTML 表格 → 右键 → "编辑 HTML 表格"

### 表格编辑功能
- **添加行列**：点击表格边缘的 + 按钮
- **删除行列**：右键选择删除选项
- **合并单元格**：选择多个单元格后右键合并
- **拆分单元格**：右键选择拆分选项
- **复制粘贴**：选择单元格后使用 Ctrl+C/Ctrl+V
- **数据排序**：选择列后使用排序按钮或右键菜单进行排序

### 排序功能详解

#### 排序类型
- **文本排序**：按字母顺序排序，支持中文
- **数字排序**：按数值大小排序，自动识别数字
- **日期排序**：按日期时间排序，支持多种日期格式

#### 排序方式
1. **控制面板排序**：
   - 选择要排序的列
   - 点击"升序排序"或"降序排序"按钮
   - 选择排序类型（文本/数字/日期）

2. **右键菜单排序**：
   - 右键点击要排序的列
   - 选择相应的排序选项
   - 支持快速文本排序和专门的数字/日期排序

#### 排序注意事项
- 如果表格包含表头，排序时会自动跳过第一行
- 包含合并单元格的列排序时会有提示确认
- 排序操作不可撤销，建议排序前备份重要数据

## 配置选项

在 Obsidian 设置 → 插件选项 → ObHtables 中可以配置：

- **默认表格行数**：新建表格的默认行数
- **默认表格列数**：新建表格的默认列数
- **启用表格样式**：是否应用自定义样式
- **表格主题**：选择表格外观主题
  - Default（默认）
  - Minimal（简约）
  - Bordered（边框）
  - Striped（条纹）

## 技术栈

- **TypeScript** - 主要开发语言
- **Obsidian API** - 插件开发框架
- **ESBuild** - 构建工具
- **CSS3** - 样式设计

## 项目结构
ObHtables/
├── src/
│   ├── core/
│   │   ├── HtmlTableEditor.ts          # 主编辑器类（简化）
│   │   ├── TableData.ts                # 表格数据管理
│   │   └── TableRenderer.ts            # 表格渲染逻辑
│   ├── features/
│   │   ├── CellSelection.ts            # 单元格选择功能
│   │   ├── CellMerging.ts              # 单元格合并/拆分
│   │   ├── TableSorting.ts             # 表格排序功能
│   │   ├── RowColumnOperations.ts      # 行列操作（增删改）
│   │   └── ClipboardOperations.ts      # 复制粘贴功能
│   ├── ui/
│   │   ├── ControlPanel.ts             # 控制面板
│   │   ├── ContextMenu.ts              # 右键菜单
│   │   └── SortDialog.ts               # 排序对话框
│   ├── utils/
│   │   ├── TableParser.ts              # HTML表格解析
│   │   ├── TableValidator.ts           # 表格数据验证
│   │   └── EventHandlers.ts            # 事件处理工具
│   ├── types/
│   │   └── index.ts                    # 类型定义
│   ├── HtmlTableModal.ts               # 保持不变
│   └── index.ts                        # 导出入口
├── styles.css
└── main.ts


## 开发计划

- [ ] 表格模板系统
- [ ] 导入/导出功能（CSV, Excel）
- [x] 表格数据排序
- [ ] 条件格式化
- [ ] 表格公式支持
- [ ] 协作编辑功能

## 更新日志

### v1.1.0 (2025-07-27)
- ✅ 新增表格数据排序功能
- ✅ 支持文本、数字、日期三种排序类型
- ✅ 支持升序和降序排序
- ✅ 在控制面板和右键菜单中添加排序选项
- ✅ 优化合并单元格的排序处理
- ✅ 改进用户界面和交互体验

### v1.0.0 (2025-07-26)
- 🎉 初始版本发布
- ✅ 基础表格编辑功能
- ✅ 单元格合并/拆分
- ✅ 行列操作
- ✅ 右键菜单
- ✅ 复制粘贴功能

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 支持

如果您觉得这个插件有用，请给个 ⭐️！

如有问题或建议，请在 [Issues](https://github.com/MathLeee/ObHtables/issues) 中提出。

---

**作者**: [MathLeee](https://github.com/MathLeee)  
**版本**: 1.1.0  
**更新时间**: 2025年7月27日