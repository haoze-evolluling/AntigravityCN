# AntigravityCN

<p align="center">
  <strong>Google Antigravity 桌面端全方位简体中文汉化工具</strong>
  <br />
  <em>基于 Wails v2 与纯 Go 语言 ASAR 引擎构建 · Windows 便携单文件 · 开箱即用</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows&logoColor=white" alt="Platform" />
  <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Wails-v2.14-DF1B52?logo=wails&logoColor=white" alt="Wails" />
  <img src="https://img.shields.io/badge/Frontend-Vue_3_+_TypeScript-4FC08D?logo=vuedotjs&logoColor=white" alt="Frontend" />
  <img src="https://img.shields.io/badge/Localization-zh--CN-blue" alt="Localization" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## 项目简介

**AntigravityCN** 是一套专为 **Google Antigravity** 官方桌面客户端打造的深度简体中文本地化工具。

项目后端采用纯 Go 语言自主实现 Electron ASAR 归档读写引擎与外科手术式补丁注入器，前端基于 Vue 3 + TypeScript 构建水墨意境现代化桌面视窗。程序在编译时将前端静态资源及汉化补丁完整内嵌，输出为无需安装 Node.js、npm 或 Python 等外部运行时的 **Windows 单文件便携版 EXE**。工具同时提供直观优雅的图形界面与灵活完备的命令行（CLI）静默调度能力。

---

## 核心特性与技术实现

### 1. 深度全量汉化（2,495 条精选词条）
全面覆盖 Google Antigravity 各核心功能模块：
- **原生层**：顶部菜单栏、系统托盘右键菜单与智能体运行计数、原生文件/工作区选择对话框、WSL 远程部署引导界面、启动加载遮罩。
- **界面层**：智能体交互对话、执行计划与审批、模型思考过程（Thinking）状态指示、代码 Diff 差异对比审查、浏览器子智能体调度。
- **配置层**：全局偏好设置、外观主题、安全策略预设（Security Presets）、终端沙箱、模型配额与阶梯限额管理、MCP 服务器与工具授权、自定义系统（Skills、Rules、Hooks）。

### 2. 外科手术式微创注入 (Surgical Patcher)
告别粗暴替换整文件的不可靠方案。内置注入器通过特征锚点精准修补 Electron 关键代码：
- `dist/preload.js`：注入双层 DOM 动态翻译引擎与装配后的全量词典；
- `dist/ideInstall/wizardPreload.js`：无缝覆盖新版欢迎向导的汉化预加载；
- `dist/menu.js`：注入原生桌面菜单翻译函数并支持中英双语级联查找回退；
- `dist/tray.js`：本地化托盘菜单及智能体动态运行数量；
- `dist/ipcHandlers.js` / `dist/main.js`：本地化文件对话框、错误弹窗及异常通知；
- `dist/wsl.js` / `dist/provisionSplash.js`：本地化 WSL 环境校验、路径警告与镜像下载进度提示。

### 3. 纯 Go 极速 ASAR 引擎与轻量体积维持
内置基于 Electron ASAR 格式规范自主实现的解析与打包引擎：
- **标准完整性哈希**：基于 4MB 块自动计算 SHA-256 integrity 校验信息；
- **原生外部解包解耦**：自动解析并保留 `_unpacked_manifest.json`，对 `app.asar.unpacked` 及 `chrome-devtools-mcp` 等依赖项保持 `unpacked: true` 外部引用机制；
- **体积保持**：重封后完美对齐官方标准 **4.5 MB** 左右轻量体积，杜绝粗暴重打导致文件膨胀至 20MB+，实现秒级解包与回写。

### 4. 高性能安全 DOM 动态翻译
注入主窗口的运行时翻译调度机制：
- **分层检索管道**：O(1) 小写哈希映射、空格规范化处理与有界 LRU 翻译缓存（容量上限 5,000 条）；
- **动态正则匹配**：精准匹配动态时间（如 `思考了 4.2 秒`、`总耗时 12 分钟`）、回合计数、文件变更数、限额剩余百分比及额度刷新时间等；
- **微任务聚合调度**：基于 `MutationObserver` 监听 DOM 树，通过 `queueMicrotask` 批量合并更新并利用弱引用记忆与祖先包含剪枝，杜绝界面重绘闪烁。

### 5. 严格的物理安全沙箱保护
对代码、AI 推理过程与用户输入实施强隔离保护：
- **模型思考过程免疫**：严格屏蔽 `.thought-content`、`.thinking-content`、`[data-testid="thinking-collapsible-content"]` 等容器，严防智能体思维链正文被翻译污染，仅对外部折叠状态触发栏（如 `Thought for 4.2s`）放行汉化；
- **命令与提及保护**：保护斜杠命令触发词（如 `/boost`、`/plan`、`/schedule` 等）不被翻译，放行提及菜单（`@`）中的分类标签；
- **编辑器与终端隔离**：Monaco Editor、CodeMirror、Prism、Highlight.js、Shiki、代码行（`code-line` / `view-line`）、终端容器及用户输入框（`input`、`textarea`、`contenteditable`）享有最高级别免翻译隔离。

### 6. 安全备份、进程接管与缓存清理
- **无损备份与还原**：首次应用汉化时自动创建官方原版镜像 `app.asar.backup`，且已汉化文件不会覆写备份；支持随时一键完全还原官方英文版本；
- **进程冲突检测与安全关闭**：自动通过 Win32 API 检索 `antigravity.exe` 与 `language_server.exe` 进程状态，支持用户确认后自动关闭以解除文件占用；
- **应用缓存清理**：提供一键清理 Chromium 视图层与字节码缓存（`Cache`、`Code Cache`、`GPUCache`、`DawnGraphiteCache`、`blob_storage` 等）的功能，不影响用户配置与登录凭据，解决界面残留旧内容或白屏问题。

---

## 运行模式与使用指南

### 模式一：现代化桌面图形界面（推荐）

1. 下载或编译生成的 **`AntigravityCN.exe`**；
2. 直接**双击运行**即可打开现代化磨砂玻璃（Mica）主界面；
3. 工具将自动检索本地 Antigravity 的默认安装路径并检测运行状态；
4. 点击 **【一键安装汉化】** 即可自动完成原版备份与补丁注入；
5. 若更新汉化后界面有旧缓存残留，可点击 **【清理缓存】**；
6. 点击 **【启动 Antigravity】** 即可开启简体中文环境；
7. 若需恢复英文原版，随时点击 **【还原英文原版】**。

> 💡 **主题切换**：支持在界面右上角或设置面板中一键切换 **浅色·素宣**、**深色·玄青** 或 **跟随系统** 主题模式。

---

### 模式二：命令行自动化接口 (CLI)

程序原生支持命令行参数，便于编写批处理脚本或集成至自动化流程中：

#### 常用命令

```powershell
# 一键安装简体中文汉化（自动嗅探安装路径）
.\AntigravityCN.exe -apply

# 还原官方英文原版
.\AntigravityCN.exe -restore

# 安全清理临时渲染与编译缓存
.\AntigravityCN.exe -clean-cache

# 启动 Antigravity 客户端
.\AntigravityCN.exe -launch

# 查看命令行帮助说明
.\AntigravityCN.exe -help
```

#### 高级参数与组合调用

| 参数 | 类型 | 说明 |
| :--- | :---: | :--- |
| `-apply` | 开关 | 执行简体中文汉化注入 |
| `-restore` | 开关 | 从备份文件还原官方原版 |
| `-clean-cache` | 开关 | 安全清理 Chromium 渲染与字节码缓存 |
| `-launch` | 开关 | 启动 Antigravity 客户端 |
| `-path <path>` | 字符串 | 指定自定义的 `app.asar` 文件绝对路径 |
| `-force-close` | 开关 | 若检测到 Antigravity 正在运行，自动安全结束进程以释放文件占用 |
| `-help` | 开关 | 输出命令行参数帮助信息 |

```powershell
# 示例 1：指定路径安装汉化，若程序运行中则自动结束进程
.\AntigravityCN.exe -apply -force-close -path "D:\Tools\Antigravity\resources\app.asar"

# 示例 2：一键清理缓存并启动 Antigravity
.\AntigravityCN.exe -clean-cache -launch
```

---

## 本地化词典架构

本地化词典存放在 `patches/locales/zh-CN/` 目录下，按 4 大核心领域进行模块化解耦维护，当前共收录 **2,495** 条去重后的有效词条：

| 模块文件 | 词条数 | 覆盖功能范围 |
| :--- | :---: | :--- |
| **`通用.json`** | 947 | 全局基础词汇、通用按钮与操作、系统菜单、命令面板（Command Palette）、状态指示、快捷键提示、时间与通用单位 |
| **`设置.json`** | 776 | 外观与系统偏好、安全预设（Security Presets）、终端沙箱设置、模型选择与参数、五小时与每周限额策略、计费与配额 |
| **`对话.json`** | 446 | 会话交互面板、智能体任务状态指示、思考过程（Thinking）状态、Diff 代码审查与审批确认、终端命令反馈、历史消息加载 |
| **`工作区.json`** | 326 | 工作区配置、Git 源代码管理、分支与 Worktree、自定义扩展系统（Skills、Rules、Hooks、UI 插件）、MCP 服务与工具授权 |

### 词典开发与维护说明

1. **动态合并装配**：Go 语言 Patcher 在执行补丁应用时会自动扫描并合并 `zh-CN/` 目录下的所有 JSON 词典，无需执行繁琐的静态编译；
2. **大小写自适应**：运行时引擎内置小写哈希索引，不需要为同一词汇重复添加全大写、全小写或首字母大写等变体；
3. **维护脚本**：`scripts/` 目录下提供了完善的工具链支持（词典冲突审查 `audit_locales.js`、批量规范化 `batch_clean_locales.js`、字母序校验排序 `sort_locales.py`）。

---

## 源码编译与构建

若希望自行从源码构建二进制程序，请按以下步骤操作：

### 环境要求

- **Go** 1.22 及以上（推荐 Go 1.24+）
- **Node.js** 18+ 与 npm（用于编译前端界面）
- **Wails CLI v2**（通过 `go install github.com/wailsapp/wails/v2/cmd/wails@latest` 安装）

### 执行构建

在项目根目录下运行一键打包脚本：

```powershell
# PowerShell 环境构建（推荐）
.\build.ps1

# 支持可选参数：
# .\build.ps1 -CopyToRoot    构建完成后自动将可执行文件复制到项目根目录
# .\build.ps1 -ForceIcon     强制从 build/logo.svg 重新渲染多尺寸 Windows 图标
# .\build.ps1 -NoPause       构建完成后不暂停控制台

# 或使用批处理脚本
.\build.bat
```

构建成功后，输出的可执行程序位于 `build/bin/AntigravityCN.exe`。

---

## 项目工程结构

```text
AntigravityCN/
├── build/                      # 构建产物、图标与 Windows 清单配置
│   ├── bin/                    # 编译输出目录 (AntigravityCN.exe)
│   ├── windows/                # Windows 平台资源 (icon.ico, info.manifest 等)
│   ├── appicon.png             # Wails 512x512 应用图标
│   └── logo.svg                # 高清矢量源图标
├── frontend/                   # 现代化前端界面 (Vue 3 + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # 界面组件 (公共组件、仪表盘、偏好设置)
│   │   ├── composables/        # 组合式函数 (业务逻辑、主题管理、终端日志)
│   │   ├── views/              # 视图页面 (主操作界面、设置面板)
│   │   ├── App.vue             # 根组件
│   │   └── main.ts             # 前端入口
│   ├── wailsjs/                # Go 与前端的双向 RPC 绑定定义
│   └── package.json            # 前端依赖配置
├── internal/                   # 核心后端逻辑库 (纯 Go 实现，无外部运行时依赖)
│   ├── asar/                   # ASAR 归档读取、解析、校验与打包引擎
│   └── patcher/                # 补丁注入、备份还原、进程管理与缓存清理
├── patches/                    # 汉化补丁源文件 (编译时自动内嵌)
│   ├── locales/zh-CN/          # 模块化简体中文词典 (通用、设置、对话、工作区)
│   ├── ideInstall/             # 欢迎向导相关补丁
│   └── preload.js              # DOM 双层动态汉化与安全沙箱引擎
├── scripts/                    # 开发与维护脚本 (图标生成、词典审查与清洗排序)
├── app.go                      # Wails 后端业务控制器与前端 Bridge 接口
├── main.go                     # 程序入口、CLI 参数解析与嵌入式 FS 挂载
├── wails.json                  # Wails 工程配置与应用元数据
├── go.mod / go.sum             # Go 模块与依赖定义
├── build.bat / build.ps1       # 跨平台自动化构建脚本
└── README.md                   # 项目工程说明文档
```

---

## 常见问题与注意事项

1. **官方客户端更新后的处理**：
   Google Antigravity 客户端在自动更新后会使用全新的官方包覆盖 `app.asar`。此时只需重新运行本工具并点击 **【一键安装汉化】**（或执行 `.\AntigravityCN.exe -apply`）即可重新完成注入。
2. **文件占用报错**：
   在执行汉化或还原操作前，请确保已退出 Antigravity 客户端；或者在提示进程冲突时允许程序自动关闭进程，避免 Windows 文件锁定引起写入失败。
3. **汉化后部分界面未刷新**：
   若遇 Chromium 视图层缓存残留，可在图形界面点击 **【清理缓存】** 或在命令行运行 `.\AntigravityCN.exe -clean-cache`，随后重新启动客户端即可。

---

## 免责声明与开源协议

- 本项目基于 **[MIT License](LICENSE)** 协议开源。
- 本项目为第三方开源本地化工具，仅供个人学习与交流使用。
- 项目中涉及的 Google Antigravity 软件著作权及商标归 Google 及其关联公司所有。
