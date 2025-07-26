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
│   ├── HtmlTableEditor.ts    # 核心表格编辑器
│   └── HtmlTableModal.ts     # 表格编辑模态框
├── main.ts                   # 插件主文件
├── manifest.json            # 插件清单
├── package.json             # 项目配置
├── styles.css               # 样式文件
├── tsconfig.json            # TypeScript 配置
└── README.md                # 项目说明

## 开发计划

- [ ] 表格模板系统
- [ ] 导入/导出功能（CSV, Excel）
- [ ] 表格数据排序
- [ ] 条件格式化
- [ ] 表格公式支持
- [ ] 协作编辑功能

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
**版本**: 1.0.0  
**更新时间**: 2025年7月26日