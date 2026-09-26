# AntigravityCN

> **Google Antigravity 桌面端全方位简体中文汉化工具（Windows 便携单文件版）**

基于 **Wails v2** 与 **纯 Go 语言 ASAR 解析引擎** 构建，无需安装 Node.js、npm 或 Python 等外部运行时，一键实现 Google Antigravity 客户端的深度全量简体中文本地化。

---

## 核心特性

- **深度全量汉化（2,070+ 精选词条）**：全面覆盖原生顶部菜单栏、系统托盘与右键菜单、系统原生对话框、初始化向导、WSL 远程桥接，以及应用内 Web 界面（智能体对话、Thinking 思考过程展示、代码 Diff 审查、安全预设、MCP 管理、自定义规则与技能、模型配额等）。
- **版本自适应外科手术式微创注入 (Surgical Patcher)**：杜绝过时的整文件暴力覆盖方案，采用高鲁棒性 AST/正则特征注入技术，完美兼容 Antigravity 2.17.0+（包括 `wsl.js`、`provisionSplash.js`、`loadingOverlay.js` 等新模块），杜绝客户端版本更新引起的白屏与启动崩溃。
- **纯 Go 极速 ASAR 引擎与体积优化**：内置自主实现的轻量级 ASAR 读写重封引擎。智能解耦 `chrome-devtools-mcp` 等外部解包模块（保持 `Unpacked: true` 软链接机制），重封装后完美维持官方标准 **4.53 MB** 轻量体积（而非粗暴重打包膨胀至 21+ MB），秒级完成解包与原子回写。
- **高性能无感 DOM 翻译引擎**：
  - **极速短路过滤**：首字符快速 ASCII / 纯中文正则预判，毫秒级跳过无需翻译的静态内容与中文文本；
  - **单遍正则联合匹配**：核心高频词汇采用单流 Union Regex 合并扫描，配合 O(1) 小写哈希表与 LRU 翻译缓存；
  - **微任务祖先剪枝**：基于 WeakSet 节点记忆与微任务队列去重调度，彻底杜绝界面加载闪烁与 React 重新渲染回退。
- **全方位物理安全沙箱**：
  - **模型思考过程免疫**：对 `.thought-content`、`[data-thought]` 等元素施行强免疫，杜绝智能体思维链被误翻译变形；
  - **Slash 命令与 `@` 引用保护**：严格保护 `/boost`、`/plan`、`/browser` 等斜杠命令 trigger 以及 `@` 文件引用，防止上下文损坏；
  - **代码与终端严格隔离**：Monaco Editor、Prism、CodeMirror、Highlight.js、xterm 终端、代码块（`pre` / `code`）及用户输入框享有最高安全隔离。
- **一键清理应用缓存**：提供 Chromium / V8 视图层缓存安全清理机制（支持清理 `Cache`、`Code Cache`、`GPUCache`、`DawnGraphiteCache`、`blob_storage` 等），有效解决更新汉化后界面残留旧内容或白屏问题。
- **一键安全备份与还原**：首次应用自动生成官方原版 `app.asar.backup` 备份文件，支持随时一键无损还原英文官方版本；自动检测并安全接管运行中的进程占用。
- **便携与双模式支持**：提供现代化暗黑磨砂玻璃（Mica）图形界面（双击即用），同时提供完整灵活的 CLI 命令行静默调用能力。

---

## 使用方法

### 1. 便携图形界面（推荐）

1. 下载或编译生成的 **`AntigravityCN.exe`**。
2. 直接**双击运行** `AntigravityCN.exe`。
3. 程序将自动检测 Antigravity 的安装路径与运行状态。
4. 点击 **【🚀 一键安装汉化】**，即可完成自动备份与汉化注入。
5. （可选）点击 **【🧹 清理应用缓存】**，可清除 Chromium 网页缓存残留，确保最新汉化立即生效。
6. 点击 **【✨ 启动 Antigravity】** 即可开启简体中文体验。
7. 如需恢复原版，点击 **【🔄 还原英文原版】** 即可。

### 2. 命令行静默调用 (CLI)

支持无缝嵌入自动化运维与静默脚本：

```powershell
# 基础用法
.\AntigravityCN.exe -apply                # 一键安装简体中文汉化
.\AntigravityCN.exe -restore              # 还原官方英文原版
.\AntigravityCN.exe -clean-cache          # 一键清理 Chromium 应用缓存
.\AntigravityCN.exe -launch               # 启动 Antigravity
.\AntigravityCN.exe -help                 # 查看帮助信息

# 高级参数
.\AntigravityCN.exe -path "<asar_path>"   # 指定自定义 app.asar 路径
.\AntigravityCN.exe -force-close          # 若检测到程序运行中，自动安全关闭进程

# 组合示例：静默安装汉化并在冲突时自动关闭进程
.\AntigravityCN.exe -apply -clean-cache -force-close
```

---

## 词典维护与扩展

本地化词典位于 `patches/locales/zh-CN/` 目录，按 4 大业务核心模块解耦管理（当前已精选纳入 **2,070+** 条词条）：

| 模块文件 | 词条数量 | 覆盖功能范围 |
| :--- | :---: | :--- |
| **`通用.json`** | 760 | 全局基础词条、常用操作按钮、通用状态指示、单位与时间、顶部菜单栏、窗口与窗格控制、命令面板 (Command Palette) 与快捷键提示 |
| **`对话.json`** | 409 | 对话交互、输入框、智能体状态、Thinking 思考过程展示、Diff 代码审查与变更审批、浏览器子智能体 (`/browser`)、终端管理、后台任务与诊断 |
| **`设置.json`** | 711 | 外观主题、通用偏好、安全预设 (Security Preset)、沙箱与网络策略、模型选择与配置、Thinking 档位与推理强度、模型配额与额度计费 |
| **`工作区.json`** | 295 | 工作区管理、项目设置、CitC 工作区、Git 源代码管理、分支与 Worktree、自定义系统 (Skills, Rules, Hooks, UI Plugins, Token 预算)、MCP 服务器与工具调用 |

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

构建完成后，程序将输出至 `build/bin/AntigravityCN.exe`（亦支持通过 `.\build.ps1 -CopyToRoot` 将其同步复制至根目录）。

---

## 项目结构

```
AntigravityCN/
├── build/                      # 构建配置、资源与产物输出
│   ├── bin/                    # 编译产物目录 (AntigravityCN.exe)
│   ├── windows/                # Windows 平台图标与清单元数据
│   ├── appicon.png             # Wails 512x512 应用图标
│   └── logo.svg                # 高清矢量源图标
├── frontend/                   # 现代化前端界面 (Vue 3 + Vite + TypeScript)
│   ├── public/                 # 前端公共静态资源
│   ├── src/                    # 前端源码 (组件、状态管理、样式、类型定义)
│   ├── wailsjs/                # Go 与 Web 前端通信桥接定义
│   ├── package.json            # 前端依赖声明
│   ├── tsconfig.json           # TypeScript 编译配置
│   └── vite.config.ts          # Vite 构建配置
├── internal/                   # 核心后端逻辑库 (纯 Go 实现，无外部运行时依赖)
│   ├── asar/                   # ASAR 归档读取、解析与原子写入引擎
│   └── patcher/                # 汉化补丁注入、备份还原与进程接管
├── patches/                    # 汉化补丁源文件 (编译时自动内嵌至二进制程序)
│   ├── ideInstall/             # 欢迎向导与安装器本地化
│   ├── locales/zh-CN/          # 模块化简体中文本地化词典
│   └── *.js                    # 动态注入引擎与各系统级拦截脚本
├── scripts/                    # 开发与维护工具脚本
│   ├── audit_locales.js        # 词典冗余与冲突检测
│   ├── batch_clean_locales.js  # 词典自动清洗与归一化
│   ├── generate_icon.js        # 高清多分辨率 Windows 图标生成
│   ├── sort_locales.py         # 词典字母序规范化排序
│   └── README.md               # 脚本说明与使用文档
├── app.go                      # Wails 后端应用控制器与 Bridge API
├── main.go                     # 程序主入口、CLI 参数解析与嵌入式文件系统挂载
├── wails.json                  # Wails v2 工程元数据与构建配置
├── go.mod / go.sum             # Go 模块依赖与校验文件
├── build.bat / build.ps1       # 一键跨环境自动化构建脚本
└── README.md                   # 项目工程说明文档
```

---

## 注意事项

- **官方更新处理**：当 Google Antigravity 客户端自动升级后，官方更新会覆盖 `app.asar`。此时只需重新打开本工具并点击 **【🚀 一键安装汉化】** 即可。
- **备份与还原**：程序在首次执行汉化时会自动在同目录创建 `app.asar.backup` 备份文件，点击 **【🔄 还原英文原版】** 可随时无损恢复。
- **文件占用提示**：执行汉化或还原前请先退出 Antigravity，或在命令行模式中使用 `-force-close` 参数自动安全结束进程，避免 Windows 文件锁定导致写入失败。

---

## 免责声明

本项目为第三方开源本地化工具，仅供个人学习与交流使用。项目涉及的 Google Antigravity 软件著作权归 Google 及其关联公司所有。

