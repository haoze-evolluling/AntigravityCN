# Antigravity 简体中文本地化词典 (zh-CN)

本目录为 Antigravity 桌面端全功能汉化词典，采用 **Go Patcher 原生动态合并机制**。

在补丁注入时，Patcher 会自动递归扫描 zh-CN/ 目录下的所有 *.json 模块文件，自动合并、校验并装配注入至 preload.js。

## 模块结构与职责划分

| 模块文件 | 包含词条数量 | 职责与归类范围 | 典型词条示例 |
| :--- | :--- | :--- | :--- |
| 通用.json | 281 | 全局通用基础词条、常用动作按钮、通用状态指示、单位与时间、顶部菜单栏、窗口与窗格控制、命令面板 (Command Palette) 操作与快捷键提示 | Save, Delete, Loading..., Success, File, Edit, Open Command Palette, Split Conversation Vertically |
| 对话.json | 236 | 对话管理、输入框交互、Agent 运行状态、Thinking 思考过程展示、Diff 审查与变更审批、浏览器子智能体 (/browser)、终端管理、后台任务、系统日志与诊断工具 | Ask anything..., Agent is thinking..., Thinking process, Review Changes, Browser Settings, Terminal output, Kill Terminal |
| 设置.json | 240 | 外观与颜色主题、通用偏好、安全预设 (Security Preset)、沙箱与网络策略、模型选择与配置、Thinking 档位与推理强度、模型配额与额度计费 | Appearance, Dark Theme, Security Preset, Strict, Standard, Gemini Models, Thinking Tier, Quota Remaining |
| 工作区.json | 186 | 工作区管理、项目设置、CitC 工作区、Git 源代码管理、分支与 Worktree、自定义系统 (Skills, Rules, Hooks, UI Plugins, Token 预算)、MCP 服务器与工具调用 | Workspaces, Projects, Git Status, Skills & Workflows, Built-in Skills, MCP Servers, MCP Tools |

## 维护与新增翻译规范

1. **直接编辑对应模块**：根据功能界面打开对应的 `zh-CN/<模块名>.json`，直接新增或修改 `"English Text": "简体中文翻译"` 键值对。
2. **无需额外编译步骤**：修改后运行测试 `go test ./...` 或执行汉化补丁时，Go Patcher 将在内存中即时合并并注入。
3. **大小写自动兼容（方案1）**：运行时注入引擎已内置 `DICT_LOWER` 小写索引降级查找机制。对于同一英文词条，无需重复配置全小写、全大写或首字母大写变体（例如只需配置 `"Local": "本地"`，即可自动匹配并翻译 `"local"` 和 `"LOCAL"`）。
4. **词典去重与清理脚本**：可通过 `node scripts/batch_clean_locales.js`（预览）或 `node scripts/batch_clean_locales.js --apply`（应用）一键对词典中的大小写冗余项进行自动清洗。

