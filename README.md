# AntigravityCN

> **Google Antigravity 桌面端全方位简体中文汉化工具（Windows 便携单文件版）**

基于 **Wails v2** 与 **纯 Go 语言 ASAR 解析引擎** 构建，无需安装 Node.js、npm 或 Python 等外部运行时，一键实现 Google Antigravity 客户端的深度全量简体中文本地化。

---

## 核心特性

- **深度全量汉化**：全面覆盖原生顶部菜单栏、系统托盘与右键菜单、系统原生对话框、初始化向导，以及应用内 Web 界面（设置面板、智能体对话、代码 Diff 审查、MCP 管理、自定义规则与技能等）。
- **双层注入与零闪烁**：在 Preload 与 Virtual DOM / 属性拦截层协同工作，实现底层动态无感替换，彻底杜绝界面加载闪烁与 React 重新渲染导致的回退问题。
- **纯 Go 极速 ASAR 引擎**：内置自主实现的轻量级 ASAR 读写与重封引擎，秒级完成应用包解压、补丁装配与原子重打包。
- **模块化词典系统**：内置 9 大业务领域划分的本地化词典，支持 Go Patcher 在内存中即时合并装配，具备大小写智能降级匹配机制。
- **代码与数据安全隔离**：严格保护 Monaco Editor、Prism、CodeMirror、Highlight.js、xterm 终端、代码块（`pre` / `code`）及用户输入框内容，坚决杜绝误翻译污染代码与终端指令。
- **一键安全备份与还原**：首次应用自动生成官方原版 `app.asar.backup` 备份文件，支持随时一键无损还原英文官方版本；自动检测并安全接管运行中的进程占用。
- **便携与双模式支持**：提供现代化暗黑磨砂玻璃（Mica）图形界面（双击即用），同时提供完整灵活的 CLI 命令行静默调用能力。

---

## 使用方法

### 1. 便携图形界面（推荐）

1. 下载或编译生成的 **`AntigravityCN.exe`**。
2. 直接**双击运行** `AntigravityCN.exe`。
3. 程序将自动检测 Antigravity 的安装路径与运行状态。
4. 点击 **【🚀 一键安装汉化】**，即可完成自动备份与汉化注入。
5. 点击 **【✨ 启动 Antigravity】** 即可开启简体中文体验。
6. 如需恢复原版，点击 **【🔄 还原英文原版】** 即可。

### 2. 命令行静默调用 (CLI)

支持无缝嵌入自动化运维与静默脚本：

```powershell
# 基础用法
.\AntigravityCN.exe -apply                # 一键安装简体中文汉化
.\AntigravityCN.exe -restore              # 还原官方英文原版
.\AntigravityCN.exe -launch               # 启动 Antigravity
.\AntigravityCN.exe -help                 # 查看帮助信息

# 高级参数
.\AntigravityCN.exe -path "<asar_path>"   # 指定自定义 app.asar 路径
.\AntigravityCN.exe -force-close          # 若检测到程序运行中，自动安全关闭进程

# 组合示例：静默安装汉化并在冲突时自动关闭进程
.\AntigravityCN.exe -apply -force-close
```

---

## 词典维护与扩展

本地化词典位于 `patches/locales/zh-CN/` 目录，按业务模块解耦管理：

| 模块文件 | 覆盖功能范围 |
| :--- | :--- |
| **`chat.json`** | 对话交互、输入框、智能体状态、Thinking 思考过程展示、Diff 审查与变更审批 |
| **`common.json`** | 全局通用词条、通用操作按钮、状态提示、通用单位与时间表达 |
| **`customizations.json`** | 自定义系统：Skills 技能、Rules 规则、Hooks 钩子、UI Plugins 插件、Token 预算等 |
| **`mcp.json`** | MCP (Model Context Protocol) 服务器连接、配置、状态管理与工具调用 |
| **`models.json`** | 模型选择、Thinking 档位与推理强度配置、模型配额与额度计费 |
| **`navigation.json`** | 顶部导航栏、窗口与窗格控制、快捷键提示、命令面板 (Command Palette) |
| **`settings.json`** | 外观主题、通用偏好、安全预设 (Security Preset)、沙箱与网络策略等 |
| **`subagents.json`** | 浏览器子智能体 (`/browser`)、终端管理、后台任务、系统日志与诊断 |
| **`workspace.json`** | 工作区管理、项目设置、Git 源代码管理、Worktree 与分支切换 |

> **开发说明**：
> 1. **即改即用**：直接修改或新增对应 JSON 文件中的词条，Go Patcher 在应用补丁时会自动即时合并装配，无需单独的词典构建流程。
> 2. **大小写智能降级**：运行时引擎已内置小写索引查找机制，无需重复添加全小写、全大写或首字母大写等变体词条。

---

## 源码编译构建

若希望自行从源码构建便携版 EXE：

### 环境要求
- [Go](https://go.dev/) 1.22+
- [Wails CLI v2](https://wails.io) (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### 构建命令
在项目根目录下执行打包脚本：

```powershell
.\build.ps1
# 或
.\build.bat
```

构建完成后，根目录将自动输出单文件便携可执行程序 `AntigravityCN.exe`。

---

## 项目结构

```
AntigravityCN/
├── AntigravityCN.exe           # 编译生成的 Wails 单文件便携程序 (双击即用)
├── main.go                     # 主入口、CLI 参数解析与资源内嵌 (embed)
├── app.go                      # Wails 后端与前端 Bridge API
├── wails.json                  # Wails v2 项目配置
├── build.ps1 / build.bat       # 一键自动化编译打包脚本
├── frontend/                   # 现代化前端界面 (Glassmorphism / Mica UI)
│   ├── index.html              # 前端无边框窗口布局
│   ├── package.json            # 前端依赖配置
│   └── src/                    # 样式与前端交互逻辑
├── internal/
│   ├── asar/                   # 纯 Go 实现的 ASAR 解包与封包核心库
│   └── patcher/                # 补丁注入、备份、还原与进程管理核心
├── patches/                    # 汉化补丁源文件 (编译时自动内嵌进 EXE)
│   ├── preload.js              # 应用内 Web UI 动态汉化与 DOM 拦截引擎
│   ├── menu.js                 # 原生系统菜单汉化
│   ├── tray.js                 # 系统托盘与上下文菜单汉化
│   ├── updater.js              # 自动更新与提示弹窗汉化
│   ├── ipcHandlers.js          # IPC 通信与原生系统对话框汉化
│   ├── loadingOverlay.js       # 启动加载界面汉化
│   ├── main.js                 # Electron 生命周期与窗口初始化汉化
│   ├── ideInstall/             # 欢迎向导汉化模块
│   └── locales/zh-CN/          # 模块化简体中文本地化词典
└── scripts/                    # 图标生成与词典维护辅助脚本
```

---

## 注意事项

- **官方更新处理**：当 Google Antigravity 客户端自动升级后，官方更新会覆盖 `app.asar`。此时只需重新打开本工具并点击 **【🚀 一键安装汉化】** 即可。
- **备份与还原**：程序在首次执行汉化时会自动在同目录创建 `app.asar.backup` 备份文件，点击 **【🔄 还原英文原版】** 可随时无损恢复。
- **文件占用提示**：执行汉化或还原前请先退出 Antigravity，或在命令行模式中使用 `-force-close` 参数自动安全结束进程，避免 Windows 文件锁定导致写入失败。

---

## 免责声明

本项目为第三方开源本地化工具，仅供个人学习与交流使用。项目涉及的 Google Antigravity 软件著作权归 Google 及其关联公司所有。

