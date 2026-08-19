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

### 3. 应用内 Web 界面深度全量汉化 (In-App Web UI)

- **设置面板 (Settings)**：
  - **通用 (General)**：默认模型、后台保持运行、防止电脑休眠、系统通知、智能体提示音、Shell 集成、自动展开变更概览、自动打开编辑文件、重载自动启动智能体、Lint 自动修复等。
  - **账号 (Account)**：Google 账号登录与切换、用量与计费、模型配额 (Model Quota)、套餐详情、服务条款与隐私政策等。
  - **外观 (Appearance)**：深色 / 浅色 / 跟随系统 / 高对比度主题、对话窗格宽度（紧凑 / 适中 / 宽阔）、字体大小、缩放级别、代码换行与空白符渲染等。
  - **模型 (Models)**：Gemini 各版本模型选择、参数调节（温度、Top P、思考预算、上下文窗口）、流式响应、中间思考步骤等。
  - **权限与安全 (Permissions & Security)**：权限预设（严格 / 标准 / 极速 / 自定义）、沙箱模式（终端命令隔离、沙箱联网控制）、非工作区文件访问策略、网络与 URL 白名单/黑名单、MCP 工具权限、人工审核模式（始终审核 / 智能体决定）等。
  - **自定义配置 (Customizations)**：全局技能、工作区技能、规则 (Rules)、插件 (Plugins)、钩子 (Hooks)、MCP 服务器配置、Jetski 默认配置等。
  - **应用与系统 (App & System)**：版本号 (CL)、数据存储路径、Electron / 语言服务器日志查看、清除缓存、恢复默认值等。

- **对话与智能体交互 (Chat & Agent Interaction)**：
  - **对话管理**：新建对话、置顶对话、最近对话、按日期分组（今天/昨天/最近7天/更早）、派生对话（当前工作区/新工作区）、归档、重命名、导出与分享等。
  - **输入与命令**：智能输入提示、全量斜杠命令 (`/goal`, `/schedule`, `/browser`, `/grill-me`, `/teamwork-preview`, `/learn`, `/diff`, `/clear`, `/compact`, `/mode`, `/help` 等) 及详细中文功能描述。
  - **上下文引用 (@ Mentions)**：文件与文件夹、终端会话、规则准则、MCP 工具与服务器、技能工作流等分类与描述。
  - **思考与推理过程**：思考折叠卡片、推理步骤、思考耗时动态转换（如“思考耗时 5.2 秒”）、中间步骤查看等。
  - **步骤审批与工具执行**：接受/取消步骤、沙箱内继续、始终允许规则、终端实时输出/折叠/截断展开、后台任务状态与控制等。

- **工作区、项目与代码审查 (Workspace, Projects & Diff)**：
  - **工作区与项目**：工作区切换、项目通用与智能体配置、多文件夹支持、工作树 (Worktrees)、Git 分支管理与状态。
  - **代码差异审查 (Diff Viewer)**：行内差异 (Inline Diff)、分屏差异 (Side-by-Side Diff)、堆叠差异 (Stacked Diff)、变更概览、修改文件列表、添加/删除行数统计、单文件/全量接受与拒绝、在编辑器中打开等。

- **子智能体与后台/计划任务 (Subagents & Tasks)**：
  - **子智能体面板**：子智能体状态监控、运行日志/记录查看、单个/全量终止等。
  - **计划与定时任务**：定时任务 (Cron)、单次计时器、下次/上次触发时间、暂停/恢复/立即执行等。

- **动态模式匹配引擎**：
  - 智能动态翻译运行状态（如“N 个智能体正在运行”、“N 个后台任务正在运行”）。
  - 智能动态翻译数量与选中（如“已选择 N / M”、“N 个文件已修改”、“添加了 N 行”、“删除了 N 行”）。
  - 智能动态翻译相对时间（如“刚刚”、“N 秒前”、“N 分钟前”、“N 小时前”、“N 天前”、“N 分钟后”）。
  - 智能动态翻译 Token 用量与百分比（如“N 个 Token”、“占上下文窗口 N%”）。

- **代码与数据安全过滤**：
  - 严格保护 Monaco Editor、Prism、CodeMirror、Highlight.js、xterm 终端、代码块（`pre` / `code`）、用户输入框内容及差异对比源码，杜绝误翻译污染代码与技术输出。

---

---

## 使用方法

### 方式一：便携单文件版 (推荐，双击即用)

> **无需安装 Node.js、npm 或配置 PowerShell，下载即可直接运行！**

1. 下载或编译生成的 **`AntigravityCN.exe`**。
2. 直接**双击运行** `AntigravityCN.exe`。
3. 程序会自动检测 Antigravity 的安装路径与运行状态。
4. 点击 **【🚀 一键安装汉化】** 即可完成自动备份与汉化注入。
5. 点击 **【✨ 启动 Antigravity】** 即可开始使用简体中文版！
6. 如需恢复原版，点击 **【🔄 还原英文原版】** 即可。

#### 命令行调用方式 (可选)

```cmd
AntigravityCN.exe -apply        # 静默执行一键汉化
AntigravityCN.exe -restore      # 还原官方英文原版
AntigravityCN.exe -launch       # 启动 Antigravity
AntigravityCN.exe -path <path>  # 指定自定义 app.asar 路径
```

---

### 方式二：PowerShell 脚本版 (开发者模式)

#### 环境要求

- Windows 10/11
- [Node.js](https://nodejs.org/) v16+（用于 `npx asar`）
- Antigravity 已安装

#### 一键汉化

以**管理员身份**打开 PowerShell，进入本项目目录后运行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\apply-cn-patch.ps1
```

脚本执行完毕后，**重启 Antigravity** 即可看到完整中文界面。

#### 还原英文版

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\restore-original.ps1
```

---

## 编译构建说明

若您克隆了本项目源码并希望自行编译构建便携版 EXE：

1. 确保已安装 [Go](https://go.dev/) 1.22+ 及 [Wails CLI](https://wails.io) (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)。
2. 运行构建脚本：
   ```powershell
   .\build.ps1
   ```
3. 即可在根目录自动生成集成了高颜值 Wails 前端的便携单文件 `AntigravityCN.exe`。

---

## 注意事项

- **应用更新后**需重新运行一键汉化，因为官方更新会覆盖 `app.asar`。
- 程序会在首次运行时自动备份原始 `app.asar`（存为 `app.asar.backup`），后续运行保留此备份。

---

## 项目结构

```
AntigravityCN/
├── AntigravityCN.exe           # Wails 现代化单文件可执行程序 (双击即用)
├── main.go                     # Wails 入口与资源内嵌 (embed)
├── app.go                      # Wails 后端与前端 Bridge API
├── wails.json                  # Wails v2 项目配置
├── build.ps1                   # Wails 一键编译打包发布脚本
├── frontend/                   # 现代化暗黑高颜值前端 (Glassmorphism UI)
│   ├── index.html              # 前端主页面与无边框窗体
│   ├── package.json            # 前端配置
│   └── src/
│       ├── style.css           # 科技感深色磨砂玻璃样式与动画
│       └── main.js             # 前端交互与 Wails 实时流式日志监听
├── internal/
│   ├── asar/                   # 纯 Go ASAR 读写与重封引擎
│   └── patcher/                # 汉化补丁注入、备份与安全还原核心
├── apply-cn-patch.ps1          # 备用 PowerShell 一键汉化脚本
├── restore-original.ps1        # 备用 PowerShell 还原原版脚本
├── README.md                   # 项目文档
└── patches/                    # 汉化补丁源文件 (编译时自动内嵌进 EXE)
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

