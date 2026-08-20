# Antigravity 简体中文本地化词典 (zh-CN)

本目录为 Antigravity 桌面端全功能汉化词典，采用 **Go Patcher 原生动态合并机制**。

在补丁注入时，Patcher 会自动递归扫描 zh-CN/ 目录下的所有 *.json 模块文件，自动合并、校验并装配注入至 preload.js。

## 模块结构与职责划分

| 模块文件 | 包含词条数量 | 职责与归类范围 | 典型词条示例 |
| :--- | :--- | :--- | :--- |
| chat.json | 176 | 对话管理、输入框交互、Agent 运行状态、Thinking 思考过程展示、Diff 审查与变更审批 | Ask anything..., Agent is thinking..., Thinking process, Review Changes |
| common.json | 258 | 全局通用基础词条、常用动作按钮、通用状态指示、通用单位与时间 | Save, Delete, Loading..., Success, Error, Enabled, Today |
| customizations.json | 71 | 自定义系统：Skills 技能、Rules 规则、Hooks 钩子、UI Plugins 插件、Token 预算及官方技能说明 | Skills & Workflows, Built-in Skills, Workspace Rules, Global Rules |
| mcp.json | 32 | MCP (Model Context Protocol) 模块：MCP 服务器连接、配置、状态管理与工具调用 | MCP Servers, MCP Tools, Installed MCP Servers, Add MCP + |
| models.json | 90 | 模型选择、Thinking 档位与推理强度配置、模型配额与额度计费 | Gemini Models, Claude and GPT models, Thinking Tier, Quota Remaining |
| navigation.json | 67 | 顶部菜单栏、窗口与窗格控制、快捷键设置与提示、命令面板 (Command Palette) 操作 | File, Edit, Open Command Palette, Split Conversation Vertically |
| settings.json | 227 | 外观与颜色主题、通用偏好、安全预设 (Security Preset)、沙箱与网络策略、遥测与账号偏好 | Appearance, Dark Theme, Security Preset, Strict, Standard, Autonomous |
| subagents.json | 108 | 浏览器子智能体 (/browser)、终端管理、后台任务、系统日志与诊断工具 | Browser Settings, Terminal output, Kill Terminal, Download Diagnostics |
| workspace.json | 93 | 工作区管理、项目设置、CitC 工作区、Git 源代码管理、分支与 Worktree | Workspaces, Projects, CitC Workspace, Source Control, Git Status |

## 维护与新增翻译规范

1. **直接编辑对应模块**：根据功能界面打开对应的 zh-CN/<module>.json，直接新增或修改 "English Text": "简体中文翻译" 键值对。
2. **无需额外编译步骤**：修改后运行测试 go test ./... 或执行汉化补丁时，Go Patcher 将在内存中即时合并并注入。
3. **大小写自动兼容（方案1）**：运行时注入引擎已内置 `DICT_LOWER` 小写索引降级查找机制。对于同一英文词条，无需重复配置全小写、全大写或首字母大写变体（例如只需配置 `"Local": "本地"`，即可自动匹配并翻译 `"local"` 和 `"LOCAL"`）。
4. **词典去重与清理脚本**：可通过 `node scripts/deduplicate_locales.js`（预览）或 `node scripts/deduplicate_locales.js --apply`（应用）一键对词典中的大小写冗余项进行自动清洗。

