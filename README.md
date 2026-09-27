# AntigravityCN

Google Antigravity 桌面客户端的简体中文汉化工具。生成 Windows 单文件便携版可执行程序，无需配置额外环境，开箱即用。

<p align="left">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Wails-v2-DF1B52?logo=wails&logoColor=white" alt="Wails" />
  <img src="https://img.shields.io/badge/Frontend-Vue_3_+_TypeScript-4FC08D?logo=vuedotjs&logoColor=white" alt="Frontend" />
  <img src="https://img.shields.io/badge/Localization-zh--CN-blue" alt="Localization" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

## 功能特点

- **开箱即用**：提供单文件绿色版程序，内置汉化补丁与静态资源，无需安装 Node.js、Python 等外部依赖。
- **自动检测与安全备份**：自动定位本地 Antigravity 安装目录（支持自定义路径）；首次汉化会自动生成官方原版备份（`app.asar.backup`），支持随时一键还原。
- **界面与原生菜单汉化**：涵盖主界面、顶部菜单栏、系统托盘菜单以及工作区选择、WSL 配置等弹窗提示。
- **防干扰内容保护**：在动态翻译界面时，自动跳过代码编辑器（如 Monaco 等）、终端容器、输入框、斜杠命令以及 AI 思考过程（Thinking）正文，避免污染代码与模型推理内容。
- **缓存清理与快捷启动**：内置缓存清理功能，解决客户端更新或汉化后界面残留旧文案的问题，并支持直接启动 Antigravity。
- **进程占用检测**：操作时自动检测客户端运行状态，提示并支持协助关闭相关进程，避免因文件被占用导致写入失败。

## 使用方法

### 图形界面（推荐）

1. 下载或编译生成 `AntigravityCN.exe`，直接双击运行。
2. 程序会自动检测本地安装路径及运行状态（若未找到，可在界面手动选择 `app.asar` 文件）。
3. 点击 **【一键安装汉化】**，等待提示完成。
4. 点击 **【启动 Antigravity】** 即可体验中文界面。
5. 如需恢复官方英文原版，随时点击 **【还原英文原版】**。

> 提示：如果汉化后界面文案未刷新，可点击界面中的 **【清理缓存】** 按钮后再重启客户端。界面右上角支持切换浅色、深色或跟随系统主题。

### 命令行模式

程序支持命令行参数，便于编写脚本或自动化调用：

```powershell
# 一键安装汉化（自动查找安装路径）
.\AntigravityCN.exe -apply

# 还原官方英文原版
.\AntigravityCN.exe -restore

# 清理客户端临时渲染与编译缓存
.\AntigravityCN.exe -clean-cache

# 启动客户端
.\AntigravityCN.exe -launch

# 查看全部命令行参数
.\AntigravityCN.exe -help
```

常用参数说明：

| 参数 | 说明 |
| :--- | :--- |
| `-apply` | 执行简体中文汉化注入 |
| `-restore` | 从备份还原官方英文原版 |
| `-clean-cache` | 清理客户端缓存（不影响用户配置与登录状态） |
| `-launch` | 启动 Antigravity 客户端 |
| `-path <路径>` | 手动指定 `app.asar` 文件的绝对路径 |
| `-force-close` | 若检测到 Antigravity 正在运行，自动关闭进程以释放文件占用 |
| `-help` | 显示命令行参数帮助信息 |

示例：指定路径安装并在程序运行时自动关闭：

```powershell
.\AntigravityCN.exe -apply -force-close -path "D:\Tools\Antigravity\resources\app.asar"
```

## 词典维护

汉化词典存放在 `patches/locales/zh-CN/` 目录下，按功能模块化维护：

- `通用.json`：全局基础操作、按钮、系统菜单、命令面板与常用提示。
- `设置.json`：外观偏好、安全预设、终端沙箱、模型与配额限额等。
- `对话.json`：聊天会话、代码审查 Diff、任务状态提示等。
- `工作区.json`：项目管理、Git 相关功能、扩展系统（Skills、Rules 等）及 MCP 服务。

程序在汉化注入时会自动合并该目录下的所有 JSON 词典。如需补充翻译，直接在对应 JSON 文件中添加键值对即可。

`scripts/` 目录下提供了辅助维护脚本：
- `audit_locales.js`：检查词典冲突与格式变体。
- `batch_clean_locales.js`：词典清洗与去重。
- `sort_locales.py`：按英文字母序重新排序词典。

## 源码构建

如需自行编译二进制文件，请参考以下步骤：

### 环境要求

- [Go](https://go.dev/) 1.22 及以上
- [Node.js](https://nodejs.org/) 18+ 与 npm
- [Wails CLI v2](https://wails.io/)（安装命令：`go install github.com/wailsapp/wails/v2/cmd/wails@latest`）

### 构建步骤

在项目根目录下运行打包脚本：

```powershell
# 使用 PowerShell 构建（推荐）
.\build.ps1

# 或使用批处理脚本
.\build.bat
```

构建成功后，可执行文件位于 `build/bin/AntigravityCN.exe`。

## 常见问题

- **客户端更新后汉化失效？**  
  客户端自动更新会覆盖 `app.asar`。只需重新运行本工具并点击 **【一键安装汉化】**（或执行 `.\AntigravityCN.exe -apply`）即可重新应用。
- **提示文件被占用导致汉化失败？**  
  操作前请先退出 Antigravity 客户端；或者在命令行中加上 `-force-close` 参数让程序自动结束相关进程。
- **汉化后部分界面仍显示英文？**  
  可能是 Chromium 视图缓存未更新，点击界面上的 **【清理缓存】**（或执行 `.\AntigravityCN.exe -clean-cache`）后重新启动客户端即可。

## 说明与协议

- 本项目基于 MIT 协议开源，仅供个人学习与交流使用。
- 项目中涉及的 Google Antigravity 软件著作权及商标归 Google 及其关联公司所有。
