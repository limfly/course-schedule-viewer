# 🚀 GitHub Pages 部署指南

本指南将帮助你将课表查看器部署到GitHub Pages，获得专属的在线访问地址。

## 📋 准备工作

### 1. 创建GitHub账号
如果还没有GitHub账号，请前往 [GitHub.com](https://github.com) 注册。

### 2. 安装Git
- Windows: 下载 [Git for Windows](https://gitforwindows.org/)
- macOS: 通过Homebrew安装 `brew install git`
- Linux: 使用包管理器安装，如 `apt install git`

## 🛠️ 部署步骤

### 步骤1: 创建GitHub仓库

1. 登录GitHub，点击右上角的"+"号，选择"New repository"
2. 仓库名称建议使用：`course-schedule-viewer`
3. 设置为Public（公开仓库）
4. 勾选"Add a README file"
5. 点击"Create repository"

### 步骤2: 初始化本地Git仓库

在项目文件夹中打开终端（命令提示符），依次执行：

```bash
# 初始化Git仓库
git init

# 添加远程仓库地址（替换为你的GitHub用户名）
git remote add origin https://github.com/你的用户名/course-schedule-viewer.git

# 添加所有文件到Git
git add .

# 提交代码
git commit -m "初始化课表查看器项目"

# 推送到GitHub
git push -u origin main
```

如果遇到认证问题，可能需要：
1. 配置Git用户信息
```bash
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```

2. 使用GitHub的Personal Access Token进行认证

### 步骤3: 启用GitHub Pages

1. 在GitHub仓库页面，点击"Settings"选项卡
2. 在左侧导航栏找到"Pages"
3. 在"Source"下拉菜单中选择"Deploy from a branch"
4. 选择"main"分支和"/ (root)"文件夹
5. 点击"Save"

等待几分钟，GitHub会自动构建并部署你的网站。

### 步骤4: 访问你的网站

部署完成后，你的网站将在以下地址可用：
```
https://你的用户名.github.io/course-schedule-viewer/
```

## 🔄 更新网站

当你需要更新网站内容时：

```bash
# 添加更改的文件
git add .

# 提交更改
git commit -m "更新课表功能"

# 推送到GitHub
git push origin main
```

推送后，GitHub Pages会自动更新网站内容。

## 📝 自定义域名（可选）

如果你有自己的域名，可以设置自定义域名：

1. 在仓库根目录创建文件`CNAME`
2. 在文件中填入你的域名，如：`schedule.yourdomain.com`
3. 在域名DNS设置中添加CNAME记录指向：`你的用户名.github.io`

## ⚠️ 常见问题

### 问题1: 页面显示404
- 确保仓库是public的
- 检查GitHub Pages设置是否正确
- 等待几分钟让部署完成

### 问题2: 样式或功能不正常
- 检查浏览器控制台是否有JavaScript错误
- 确保所有文件路径正确（区分大小写）

### 问题3: Git推送失败
- 检查远程仓库地址是否正确
- 确保有仓库的写权限
- 可能需要使用Personal Access Token

## 🎉 完成！

恭喜！你的课表查看器现在已经在线可用了。你可以：
- 分享链接给朋友使用
- 在README中更新实际的访问地址
- 继续开发更多功能

## 📞 获取帮助

如果遇到问题，可以：
1. 查看GitHub Pages官方文档
2. 在项目仓库中创建Issue
3. 搜索相关的Stack Overflow问题

---

祝你部署顺利！🎊
