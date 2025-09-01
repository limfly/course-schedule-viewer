# course-schedule-viewer
# 📚 在线课表查看器

一个完全在浏览器端运行的智能课表管理系统，无需任何后端服务器或本地环境配置。支持Excel文件导入、智能格式识别、多视图展示等功能。

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://你的用户名.github.io/course-schedule-viewer/)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

## ✨ 特性

### 🎯 核心功能
- 📊 **智能Excel导入** - 自动识别各种格式的课表文件
- 💾 **本地数据存储** - 使用localStorage保存数据，刷新不丢失
- 🔍 **课程搜索** - 快速查找特定课程
- 📅 **多视图模式** - 支持日视图和周视图
- 📤 **数据导出** - 支持导出为Excel或JSON格式
- 🎨 **响应式设计** - 完美适配PC、平板和手机

### 🚀 在线使用
- 无需安装任何软件
- 无需配置环境
- 打开网页即可使用
- 数据安全存储在本地浏览器

## 🖥️ 在线访问

访问地址：[https://limfly.github.io/course-schedule-viewer/](https://你的用户名.github.io/course-schedule-viewer/)

## 📖 使用指南

### 1. 导入课表
点击"导入课表"按钮，选择或拖拽Excel文件到上传区域。系统会自动识别文件格式并解析课程数据。

### 2. 支持的Excel格式

系统支持智能识别以下列名（中英文均可）：

| 必需列 | 可选列名变体 |
|--------|-------------|
| 课程名称 | 课程、科目、课程名、course、subject |
| 上课时间 | 时间、上课时刻、time、schedule |
| 上课地点 | 地点、教室、location、room |
| 上课教师 | 教师、老师、teacher、instructor |
| 教学班号 | 班号、班级、class、class_id |

时间格式示例：
- `1-16周星期一3-4节`
- `1-4,6-17周星期三8-9节`
- `12-15周星期五8-9节`

### 3. 查看课表
- **周次切换**：使用周次选择器或左右箭头键
- **视图切换**：日视图查看单天详情，周视图查看整周概览
- **快速定位**：点击"本周"按钮快速跳转到当前周

### 4. 搜索课程
在搜索框输入课程名称，系统会显示所有匹配的课程及其上课周次。

### 5. 导出数据
- **Excel格式**：完整导出所有课程数据
- **JSON格式**：适合程序处理和备份

### 6. 键盘快捷键
- `←/→` - 切换周次
- `Ctrl+F` - 聚焦搜索框
- `Ctrl+I` - 打开导入对话框
- `Ctrl+E` - 导出Excel文件

## 🛠️ 技术架构

### 前端技术栈
- **HTML5** - 语义化标签结构
- **CSS3** - 响应式布局、动画效果
- **JavaScript (ES6+)** - 核心逻辑处理
- **SheetJS** - Excel文件解析和生成
- **LocalStorage API** - 本地数据持久化

### 特色实现
- 🧠 **智能格式检测算法** - 自动识别各种课表格式
- 📱 **PWA支持** - 可安装为桌面应用
- 🎨 **主题色彩系统** - 美观的渐变配色
- ⚡ **性能优化** - 虚拟滚动、懒加载

## 📦 本地部署

如果需要在本地运行或二次开发：

1. 克隆仓库
```bash
git clone https://github.com/你的用户名/course-schedule-viewer.git
cd course-schedule-viewer
```

2. 启动本地服务器（以下方式任选其一）
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx http-server

# 或使用VSCode的Live Server插件
```

3. 打开浏览器访问
```
http://localhost:8000
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发建议
1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📋 更新日志

### v2.0.0 (2025-01)
- ✅ 完全重构为纯前端应用
- ✅ 新增智能Excel格式识别
- ✅ 添加数据导入/导出功能
- ✅ 支持多视图模式
- ✅ 响应式设计优化
- ✅ 新增键盘快捷键

### v1.0.0
- ✅ 基础课表查看功能
- ✅ 周次切换
- ✅ 课程搜索

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [SheetJS](https://sheetjs.com/) - 强大的Excel处理库
- [GitHub Pages](https://pages.github.com/) - 免费的静态网站托管服务

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 [Issue](https://github.com/limfly/course-schedule-viewer/issues)
- 发送邮件至：1612128007@qq.com

---

⭐ 如果这个项目对你有帮助，请给一个星标支持！
