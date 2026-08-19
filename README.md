# AntigravityCN

> **Google Antigravity 桌面端全方位简体中文深度汉化工具**

将 Antigravity 桌面客户端（Windows / macOS / Linux）完整汉化为简体中文，包括**原生顶部菜单栏（文件/编辑/视图/窗口/帮助）**、**系统托盘与右键菜单**、**系统对话框**、**加载与向导**，以及通过动态本地化引擎深度覆盖**应用内 Web 界面（设置面板、侧边栏、对话控制、权限与安全、工具与快捷键等）**。

---

## 汉化覆盖范围

### 1. 原生菜单栏 (Native Menu Bar)

| 菜单分类 | 英文项 | 汉化后 | 快捷键 |
|---------|--------|--------|--------|
| **文件 (File)** | New Window | 新建窗口 | `Ctrl+Shift+N` |
| | Close Window / Exit | 关闭窗口 / 退出 | `Ctrl+W` / `Ctrl+Q` |
| **编辑 (Edit)** | Undo / Redo | 撤销 / 重做 | `Ctrl+Z` / `Ctrl+Y` |
| | Cut / Copy / Paste | 剪切 / 复制 / 粘贴 | `Ctrl+X` / `Ctrl+C` / `Ctrl+V` |
| | Paste and Match Style | 粘贴并匹配格式 | `Ctrl+Shift+V` |
| | Delete / Select All | 删除 / 全选 | `Delete` / `Ctrl+A` |
| **视图 (View)** | Reload / Force Reload | 重新加载 / 强制重新加载 | `Ctrl+R` / `Ctrl+Shift+R` |
| | Toggle Developer Tools | 切换开发者工具 | `F12` / `Ctrl+Shift+I` |
| | Actual Size / Zoom In / Out | 实际大小 / 放大 / 缩小 | `Ctrl+0` / `Ctrl+=` / `Ctrl+-` |
| | Toggle Full Screen | 切换全屏 | `F11` |
| **窗口 (Window)** | Minimize / Zoom / Close | 最小化 / 缩放 / 关闭 | `Ctrl+M` / `Ctrl+W` |
| | Bring All to Front | 前置全部窗口 | — |
| **帮助 (Help)** | Documentation | 官方文档 | — |
| | Check for Updates | 检查更新 | — |
| | About Antigravity | 关于 Antigravity | — |

### 2. 系统托盘与对话框 (Tray & Dialogs)

| 界面元素 | 英文原文 | 汉化后 |
|---------|---------|--------|
| 托盘状态 | No agents running / N agents running | 无智能体正在运行 / N 个智能体正在运行 |
| 托盘操作 | Open Antigravity / New Window / Docs / Quit | 打开 Antigravity / 新建窗口 / 官方文档 / 退出 |
| 退出确认 | Confirm Quit / Are you sure you want to quit? | 确认退出 / 您确定要退出吗？ |
| 工作区选择 | Open Workspace / Select Folder | 打开工作区 / 选择工作区文件夹 |
| 检查更新 | Check for updates / Up to date / Restart to update | 检查更新 / 当前已是最新版本 / 重启以更新 |
| 加载界面 | Loading Antigravity | 正在加载 Antigravity... |
| 欢迎向导 | Welcome / Download IDE / Explore | 欢迎使用全新 Antigravity / 下载 IDE / 探索 |

### 3. 应用内 Web 界面深度汉化 (In-App Web UI)

- **设置面板 (Settings)**：账号 (Account)、模型 (Models)、外观 (Appearance)、通用 (General)、工作区设置 (Workspace Settings)、自定义配置 (Customizations) 等分类与描述完整汉化。
- **权限与安全 (Permissions)**：沙箱模式 (Sandbox Mode)、权限预设 (Permission Preset)、终端命令 (Terminal Commands)、沙箱外命令、MCP 工具 (MCP Tools)、始终允许 (Always Proceed)、每次询问 (Always Ask)、请求审核 (Request Review)、拒绝 (Deny) 等。
- **对话与智能体 (Chat & Agent)**：新建对话 (New Conversation)、新建工作区 (New Workspace)、对话历史 (Conversation History)、置顶对话 (Pinned Conversations)、派生对话 (Fork Conversation)、思考过程 (Thinking)、接受/取消步骤 (Accept / Cancel Step)、在沙箱中继续 (Proceed in Sandbox)、停止子智能体 (Stop Subagent)、查看差异 (View Diff) 等。
- **安全过滤**：严格保护代码编辑器、终端原始数据输出、用户输入的文本及技术输出，不受翻译规则干扰。

---

## 使用方法

### 环境要求

- Windows 10/11
- [Node.js](https://nodejs.org/) v16+（用于 `npx asar`）
- Antigravity 已安装

### 一键汉化

以**管理员身份**打开 PowerShell，进入本项目目录后运行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\apply-cn-patch.ps1
```

脚本执行完毕后，**重启 Antigravity** 即可看到完整中文界面。

### 还原英文版

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\restore-original.ps1
```

---

## 注意事项

- **应用更新后**需重新运行 `apply-cn-patch.ps1`，因为更新会覆盖 `app.asar`。
- 脚本会在首次运行时自动备份原始 `app.asar`（存为 `app.asar.backup`），后续运行跳过备份。
- 脚本通过 `npx` 自动下载 `asar` 工具，无需手动安装。

---

## 项目结构

```
AntigravityCN/
├── apply-cn-patch.ps1          # 一键汉化脚本
├── restore-original.ps1        # 还原原版脚本
├── README.md                   # 本文档
└── patches/                    # 汉化补丁文件
    ├── menu.js                 # 原生系统菜单全量汉化
    ├── updater.js              # 自动更新与提示弹窗汉化
    ├── tray.js                 # 系统托盘汉化
    ├── main.js                 # 生命周期、弹窗与托盘初始化汉化
    ├── ipcHandlers.js          # IPC 通信与原生对话框汉化
    ├── loadingOverlay.js       # 启动加载动画汉化
    ├── preload.js              # 应用内 Web UI 动态汉化引擎
    └── ideInstall/
        └── wizardHtml.js       # 欢迎与迁移向导汉化
```

