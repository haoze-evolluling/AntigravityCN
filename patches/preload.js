"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Antigravity 桌面端全方位双层深度汉化引擎 (Preload & Main-World Bridge)
 * 
 * 1. 在 Main World (World 0) 中深度拦截 React.createElement、DOM 属性与 document.title，
 *    实现 Virtual DOM 级别的原生汉化（零闪烁、零延迟、防 React 重渲染回退）。
 * 2. 在 Isolated World 中维护标准 ContextBridge API 与系统级通信。
 */
const electron_1 = require("electron");

// ---------------------------------------------------------------------------
// 1. ContextBridge APIs (保持与原版完全一致)
// ---------------------------------------------------------------------------
const updaterAPI = {
    onStateChanged: (callback) => {
        const handler = (_event, state) => {
            callback(state);
        };
        electron_1.ipcRenderer.on('updater:state-changed', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('updater:state-changed', handler);
        };
    },
    applyUpdate: () => electron_1.ipcRenderer.invoke('updater:apply'),
    quitAndInstall: () => electron_1.ipcRenderer.invoke('updater:quit-and-install'),
    checkForUpdates: () => electron_1.ipcRenderer.invoke('updater:check-for-updates'),
    getState: () => electron_1.ipcRenderer.invoke('updater:get-state'),
};

const dialogAPI = {
    showOpenDialog: () => electron_1.ipcRenderer.invoke('dialog:open-workspace'),
    showOpenMultipleFolderDialog: () => electron_1.ipcRenderer.invoke('dialog:open-workspaces'),
};

const notificationAPI = {
    send: (options) => electron_1.ipcRenderer.invoke('notification:send', options),
    openSystemPreferences: () => electron_1.ipcRenderer.invoke('notification:open-system-preferences'),
    onClicked: (callback) => {
        const handler = (_event, payload) => {
            callback(payload);
        };
        electron_1.ipcRenderer.on('notification:clicked', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('notification:clicked', handler);
        };
    },
};

const storageAPI = {
    getItems: () => electron_1.ipcRenderer.invoke('storage:get-items'),
    updateItems: (changes) => electron_1.ipcRenderer.invoke('storage:update-items', changes),
    onChanged: (callback) => {
        const handler = (_event, changes) => {
            callback(changes);
        };
        electron_1.ipcRenderer.on('storage:changed', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('storage:changed', handler);
        };
    },
};

const logsAPI = {
    getElectronLogs: () => electron_1.ipcRenderer.invoke('logs:electron'),
};

const extensionsAPI = {
    sendAuthorities: (authoritiesMap) => electron_1.ipcRenderer.invoke('extensions:send-authorities', authoritiesMap),
};

const deepLinkAPI = {
    onDeepLink: (callback) => {
        const handler = (_event, url) => {
            callback(url);
        };
        electron_1.ipcRenderer.on('deep-link', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('deep-link', handler);
        };
    },
    getStoredDeepLink: () => electron_1.ipcRenderer.invoke('deep-link:get-stored'),
};

const agentAPI = {
    updateActiveAgentCount: (count) => electron_1.ipcRenderer.invoke('agent:update-active-count', count),
};

const electronNativeAPI = {
    getZoomLevel: () => electron_1.webFrame.getZoomFactor(),
    setTitleBarOverlay: (options) => electron_1.ipcRenderer.invoke('window:set-title-bar-overlay', options),
    minimize: () => electron_1.ipcRenderer.invoke('window:minimize'),
    maximize: () => electron_1.ipcRenderer.invoke('window:maximize'),
    unmaximize: () => electron_1.ipcRenderer.invoke('window:unmaximize'),
    isMaximized: () => electron_1.ipcRenderer.invoke('window:is-maximized'),
    close: () => electron_1.ipcRenderer.invoke('window:close'),
    toggleDevTools: () => electron_1.ipcRenderer.invoke('window:toggle-devtools'),
    zoomIn: () => {
        const current = electron_1.webFrame.getZoomLevel();
        electron_1.webFrame.setZoomLevel(current + 0.5);
    },
    zoomOut: () => {
        const current = electron_1.webFrame.getZoomLevel();
        electron_1.webFrame.setZoomLevel(current - 0.5);
    },
    resetZoom: () => {
        electron_1.webFrame.setZoomLevel(0);
    },
    openExternal: (url) => electron_1.ipcRenderer.invoke('shell:open-external', url),
    revealInFilePicker: (path) => electron_1.ipcRenderer.invoke('shell:reveal-in-file-picker', path),
};

const ideAPI = {
    isInstalled: () => electron_1.ipcRenderer.invoke('ide:is-installed'),
};

electron_1.contextBridge.exposeInMainWorld('electronUpdater', updaterAPI);
electron_1.contextBridge.exposeInMainWorld('dialog', dialogAPI);
electron_1.contextBridge.exposeInMainWorld('nativeNotifications', notificationAPI);
electron_1.contextBridge.exposeInMainWorld('nativeStorage', storageAPI);
electron_1.contextBridge.exposeInMainWorld('logs', logsAPI);
electron_1.contextBridge.exposeInMainWorld('extensions', extensionsAPI);
electron_1.contextBridge.exposeInMainWorld('deepLink', deepLinkAPI);
electron_1.contextBridge.exposeInMainWorld('agent', agentAPI);
electron_1.contextBridge.exposeInMainWorld('electronNative', electronNativeAPI);
electron_1.contextBridge.exposeInMainWorld('ide', ideAPI);

// ---------------------------------------------------------------------------
// 2. 全量汉化字典
// ---------------------------------------------------------------------------
const I18N_DICT = {
  "File": "文件",
  "Edit": "编辑",
  "View": "视图",
  "Window": "窗口",
  "Help": "帮助",
  "Install IDE": "安装 IDE",
  "Install Antigravity IDE to run and edit your workspace scripts.": "安装 Antigravity IDE 以运行和编辑您的工作区脚本。",
  "Create Project": "创建项目",
  "Toggle Fullscreen": "切换全屏",
  "Minimize": "最小化",
  "Maximize": "最大化",
  "Close": "关闭",
  "Check for Updates": "检查更新",
  "Ask a quick question without interrupting the main conversation.": "快速提问且不打断主对话。",
  "Run until the specified goal is completely finished.": "持续运行直到指定目标完全达成。",
  "Run an instruction on a recurring schedule or as a one-time timer.": "按循环计划或单次计时器运行指令。",
  "Invoke a browser agent for web tasks.": "调用浏览器智能体执行网页任务。",
  "Interview me to align on a plan.": "通过问答对齐方案与需求。",
  "Invoke a team of agents to autonomously tackle large projects.": "调用智能体团队自主协作处理大型项目。",
  "Reflect on recent successes or corrections to capture reusable skills or rules.": "反思近期的成功或纠正，以沉淀可复用的技能或规则。",
  "Comprehensive guide and reference for the Antigravity Customization System. Use to explain how customizations work, their loading priority, discovery mechanisms, and to guide the creation of skills, rules, plugins, hooks, and MCP servers.": "Antigravity 自定义配置系统完整指南与参考。",
  "Provides a comprehensive guide, quick reference, and sitemap for Google Antigravity (AGY), including the Antigravity CLI (agy), Antigravity 2.0, Antigravity IDE, Python SDK, slash commands, keybindings, and customizations (skills, rules, MCP, sidecars). Activate this skill when the user asks questions about how to use, configure, or customize Antigravity, AGY, the agy CLI, the Antigravity IDE, or Antigravity 2.0.": "Google Antigravity 完整指南、快速参考与索引导航。",
  "Run a long-running autonomous task until complete": "运行长期自主任务直到完成",
  "Schedule a recurring cron job or one-time timer": "设置周期性定时任务或单次提醒",
  "Perform web browsing, scraping and web testing": "进行网页浏览、抓取与自动化测试",
  "Perform web browsing and web testing": "进行网页浏览与自动化测试",
  "Interactive interview to align on design and plan": "通过交互式问答对齐方案与设计",
  "Coordinate multiple agents working together": "多智能体团队协同协作预览",
  "Coordinate a team of autonomous agents": "协调自主智能体团队协作",
  "Persist learnings, preferences, and custom setup": "记录并持久化偏好与配置经验",
  "Persist learnings and custom setups": "记录并持久化学习与配置",
  "Switch agent interaction mode": "切换智能体交互模式",
  "Review code differences and changes": "审查代码变更与差异",
  "Review code differences": "审查代码差异",
  "Clear current conversation context": "清空当前对话上下文",
  "Compact conversation history": "压缩对话历史记录",
  "Show help and available slash commands": "查看帮助与可用斜杠命令",
  "Show help and documentation": "查看帮助与官方文档",
  "Switch to fast model mode": "切换为极速模型模式",
  "Fast response mode": "极速响应模式",
  "Open Command Palette": "打开命令面板",
  "Open Conversation Picker": "打开对话选择器",
  "Open Workspace Selector": "打开工作区选择器",
  "Open Conversation History": "打开对话历史",
  "File Picker": "文件选择器",
  "New Editor Window": "新建编辑器窗口",
  "Close Tab": "关闭标签页",
  "Open Workspace": "打开工作区",
  "Split Conversation Vertically": "垂直分屏对话",
  "Split Conversation Horizontally": "水平分屏对话",
  "New Terminal Tab": "新建终端标签页",
  "Add to Chat": "添加到对话",
  "Focus Input": "聚焦输入框",
  "Zoom In": "放大",
  "Zoom Out": "缩小",
  "Reset Zoom": "重置缩放",
  "Find in Pane": "在窗格中查找",
  "Go Back": "后退",
  "Go Forward": "前进",
  "Code Search": "代码搜索",
  "Open in Code Search": "在代码搜索中打开",
  "Scheduled Tasks": "计划任务",
  "Previous Aux Pane Tab": "上一个辅助窗格标签页",
  "Next Aux Pane Tab": "下一个辅助窗格标签页",
  "Open Keyboard Shortcuts": "打开快捷键设置",
  "Terminal: Add to Chat": "终端: 添加到对话",
  "Refresh gcert credentials": "刷新 gcert 授权凭据",
  "Download Diagnostics": "下载诊断信息",
  "Collapse All Folders": "折叠所有文件夹",
  "Expand All Folders": "展开所有文件夹",
  "Select Next Conversation": "选择下一个对话",
  "Select Previous Conversation": "选择上一个对话",
  "Home": "主页",
  "History": "历史记录",
  "Settings": "设置",
  "Open Settings": "打开设置",
  "Toggle Sidebar": "切换侧边栏",
  "Toggle Auxiliary Pane": "切换辅助窗格",
  "Auxiliary Pane": "辅助窗格",
  "Toggle Terminal": "切换终端",
  "Toggle Editor": "切换编辑器",
  "Toggle Project Selector": "切换项目选择器",
  "Toggle Environment Selector": "切换环境选择器",
  "Toggle Model Selector": "切换模型选择器",
  "Conversations": "对话列表",
  "Conversation": "对话",
  "Conversation History": "对话历史",
  "New Conversation": "新建对话",
  "New conversation": "新建对话",
  "Untitled Conversation": "未命名对话",
  "Pinned Conversations": "置顶对话",
  "Pinned": "已置顶",
  "Recent Conversations": "最近对话",
  "Delete Conversation": "删除对话",
  "Archive Conversation": "归档对话",
  "Archive this conversation": "归档此对话",
  "Share Conversation": "分享对话",
  "Export Conversation": "导出对话",
  "Fork Conversation": "派生对话",
  "Fork in current workspace": "在当前工作区派生",
  "Fork in new workspace": "在新工作区派生",
  "Fork to new workspace": "派生至新工作区",
  "Rename Conversation": "重命名对话",
  "Copy Conversation Link": "复制对话链接",
  "Copy conversation markdown": "复制对话 Markdown",
  "Find in conversation": "在对话中查找",
  "Clear History": "清空历史",
  "Clear All": "清空全部",
  "Workspaces": "工作区列表",
  "Workspace": "工作区",
  "New Workspace": "新建工作区",
  "Add Workspace": "添加工作区",
  "Archive Workspace": "归档工作区",
  "Remove Workspace": "移除工作区",
  "Select Workspace": "选择工作区",
  "Recent Workspaces": "最近工作区",
  "Open Folder": "打开文件夹",
  "Choose folder": "选择文件夹",
  "Browse...": "浏览...",
  "Select folder": "选择文件夹",
  "Select file": "选择文件",
  "Current Workspace": "当前工作区",
  "Projects": "项目列表",
  "Project": "项目",
  "New Project": "新建项目",
  "Select Project": "选择项目",
  "Project Settings": "项目设置",
  "Project General": "项目通用设置",
  "Project Agent": "项目智能体",
  "Project Folders": "项目文件夹",
  "Project Customizations": "项目自定义配置",
  "Worktrees": "工作树列表",
  "Worktree": "工作树",
  "New Worktree": "新建工作树",
  "Branch": "分支",
  "Branches": "分支列表",
  "Commits": "提交记录",
  "Changes": "变更",
  "Source Control": "源代码管理",
  "Git Status": "Git 状态",
  "Staged Changes": "暂存的更改",
  "Unstaged Changes": "未暂存的更改",
  "Commit Changes": "提交更改",
  "Push": "推送",
  "Pull": "拉取",
  "Fetch": "获取",
  "Sync": "同步",
  "Switch Branch": "切换分支",
  "Create Branch": "创建分支",
  "Merge Branch": "合并分支",
  "Ask a question or enter a task...": "输入您的问题或任务指令...",
  "Type a message...": "输入消息...",
  "Type / for commands, @ for context...": "输入 / 调用命令，输入 @ 添加上下文...",
  "Type / for commands...": "输入 / 查看可用命令...",
  "Type to search...": "输入以搜索...",
  "Search files...": "搜索文件...",
  "Search commands...": "搜索命令...",
  "Search everywhere": "全局搜索",
  "Attach file or image": "添加文件或图片",
  "Send": "发送",
  "Send Message": "发送消息",
  "Stop Generation": "停止生成",
  "Cancel Generation": "取消生成",
  "Regenerate response": "重新生成回答",
  "Regenerate": "重新生成",
  "Clear Input": "清空输入",
  "Queued Messages": "排队中的消息",
  "Waiting for turn...": "等待轮次...",
  "Awaiting response...": "等待响应...",
  "Processing...": "处理中...",
  "Agent is thinking...": "智能体正在思考...",
  "Agent is working...": "智能体正在执行...",
  "Agent is typing...": "智能体正在输入...",
  "Agent completed task": "智能体已完成任务",
  "Agent paused": "智能体已暂停",
  "Task completed": "任务已完成",
  "Task canceled": "任务已取消",
  "Task failed": "任务失败",
  "Need attention": "需要处理",
  "Needs attention": "需要处理",
  "Needs your input": "等待您的输入",
  "Awaiting Authentication...": "等待授权认证...",
  "Authentication Required": "需要身份验证",
  "Files & Folders": "文件与文件夹",
  "Terminal Sessions": "终端会话",
  "Rules & Guidelines": "规则与准则",
  "MCP Tools & Servers": "MCP 工具与服务器",
  "Skills & Workflows": "技能与工作流",
  "Recent Files": "最近打开的文件",
  "Open Editors": "已打开的编辑器",
  "Search files by name...": "按文件名搜索...",
  "Search context...": "搜索上下文...",
  "Add file as context": "添加文件为上下文",
  "Add folder as context": "添加文件夹为上下文",
  "Add terminal as context": "添加终端为上下文",
  "Add conversation as context": "添加对话为上下文",
  "Add Context": "添加上下文",
  "Add Handler": "添加处理器",
  "Thinking": "思考中",
  "Thought": "思考过程",
  "Thinking process": "推理过程",
  "Thought process": "思考过程",
  "Show thinking": "展开思考过程",
  "Hide thinking": "折叠思考过程",
  "Collapse thinking": "折叠思考",
  "Expand thinking": "展开思考",
  "Reasoning steps": "推理步骤",
  "Intermediate thoughts": "中间思考",
  "System Message": "系统消息",
  "System Prompt": "系统提示词",
  "Prompt": "提示词",
  "Model reasoning": "模型推理",
  "Accept Step": "接受步骤",
  "Cancel step": "取消步骤",
  "Proceed in Sandbox": "在沙箱中继续",
  "Always allow": "始终允许",
  "Always allow this command": "始终允许此命令",
  "Always allow this tool": "始终允许此工具",
  "Require review": "需要审核",
  "Request Review": "请求审核",
  "Review Changes": "审查更改",
  "View Diff": "查看差异",
  "View Stacked Diff": "查看堆叠差异",
  "View Split Diff": "查看分屏差异",
  "Inline Diff": "行内差异",
  "Side-by-Side Diff": "分屏差异",
  "Stacked Diff": "堆叠差异",
  "Files Changed": "已修改文件",
  "Agent Edits": "智能体编辑",
  "Explain and Fix in Current Conversation": "在当前对话中解释并修复",
  "Changes Overview": "变更概览",
  "Files Modified": "已修改文件数",
  "Lines Added": "添加行数",
  "Lines Removed": "删除行数",
  "Accept All Changes": "接受全部更改",
  "Reject All Changes": "拒绝全部更改",
  "Accept File": "接受此文件更改",
  "Reject File": "拒绝此文件更改",
  "Copy Diff": "复制差异",
  "Open in Editor": "在编辑器中打开",
  "Run Command": "运行命令",
  "Terminal output": "终端输出",
  "Running command in background...": "正在后台运行命令...",
  "Command executed successfully": "命令执行成功",
  "Command failed with exit code": "命令执行失败，退出代码",
  "Show output": "显示输出",
  "Hide output": "隐藏输出",
  "Truncated output": "输出已截断",
  "Expand full output": "展开完整输出",
  "Collapse output": "折叠输出",
  "Kill Terminal": "终止终端",
  "Clear Terminal": "清空终端",
  "New Terminal": "新建终端",
  "Copy Output": "复制输出",
  "Copy Command": "复制命令",
  "Copy Error": "复制错误信息",
  "Account": "账号",
  "General": "通用",
  "Appearance": "外观",
  "Notifications": "通知",
  "Models": "模型",
  "Customizations": "自定义配置",
  "Google Drive": "Google 云端硬盘",
  "Browser": "浏览器",
  "Developer": "开发者设置",
  "App": "应用设置",
  "CitC Settings": "CitC 设置",
  "Jetski": "Jetski 设置",
  "Quota": "模型配额",
  "Advanced Settings": "高级设置",
  "Advanced": "高级设置",
  "Show all": "显示全部",
  "Not in Project": "未加入项目",
  "Provide Feedback": "提供反馈",
  "Shortcuts": "快捷键",
  "Back": "返回",
  "Access": "访问权限",
  "Access grants": "访问授权",
  "Action required": "需要操作",
  "Actions": "操作",
  "Active Skills": "活跃技能",
  "Actuation Permissions": "操作执行权限",
  "Add Hook Card": "添加钩子卡片",
  "Add inline comment": "添加行内评论",
  "Agent Auto-Fix Lints": "智能体自动修复 Lint 错误",
  "Agent Behavior": "智能体行为",
  "Agent Non-Workspace File Access": "智能体非工作区文件访问",
  "Agent Script": "智能体脚本",
  "Agent Settings": "智能体设置",
  "Agent Settings (For Project)": "智能体设置（项目级）",
  "Agent always asks for review.": "智能体始终请求人工审核。",
  "Agents": "智能体",
  "All tools (*)": "所有工具 (*)",
  "Allow": "允许",
  "Allow List Terminal Commands": "允许运行的终端命令列表",
  "Allow Once": "仅允许一次",
  "Allow once": "仅允许一次",
  "Allow sandboxed commands to make network requests.": "允许沙箱内的命令发起网络请求。",
  "Allows the agent to access files outside of your current workspace.": "允许智能体访问当前工作区以外的文件。",
  "Always Allow": "始终允许",
  "Always Ask": "每次询问",
  "Always Proceed": "始终允许",
  "Always allow commands and file access (unrestricted).": "始终允许命令执行与文件访问（不受限制）。",
  "Always run": "始终运行",
  "Artifact Review Policy": "构件审查策略",
  "Artifacts": "构件列表",
  "Ask every time": "每次询问",
  "Ask first": "先询问",
  "Ask for permission for sensitive operations.": "执行敏感操作前请求权限。",
  "Attach Antigravity server logs": "附加 Antigravity 服务器日志",
  "Auto (detected)": "自动（已检测）",
  "Auto-Expand Changes Overview": "自动展开变更概览",
  "Auto-Open Edited Files": "自动打开编辑的文件",
  "Automatic Check for Updates": "自动检查更新",
  "Automatically expand the Changes Overview toolbar when the agent finishes generating a response.": "智能体完成回答生成后自动展开变更概览工具栏。",
  "Automations": "自动化",
  "Autonomous": "自主模式",
  "Background Tasks": "后台任务列表",
  "Background Task Output": "后台任务输出",
  "Baseline model quota reached": "已达到基础模型配额上限",
  "Block": "阻止",
  "Blocked": "已阻止",
  "Blocked on Your Input": "等待您的输入",
  "Bot Name": "机器人名称",
  "Branch Changes": "分支变更",
  "Browser Actuation Permissions": "浏览器操作权限",
  "Browser Actuation Rules": "浏览器操作规则",
  "Browser CDP Port": "浏览器 CDP 端口",
  "Browser Javascript Execution Policy": "浏览器 JavaScript 执行策略",
  "Browser Settings": "浏览器设置",
  "Browser User Profile Path": "浏览器用户配置文件路径",
  "Browser tools (browser_.*)": "浏览器工具 (browser_.*)",
  "Build With Google Plugins": "Google 插件生态",
  "Capture console logs": "捕获控制台日志",
  "Capture screenshot": "捕获屏幕截图",
  "Cascade Config": "Cascade 配置",
  "Cascade ID": "Cascade ID",
  "Chat Settings": "对话设置",
  "Chrome Binary Path": "Chrome 可执行文件路径",
  "Chromium": "Chromium 浏览器",
  "CitC Clone": "CitC 克隆",
  "CitC Workspace": "CitC 工作区",
  "CitC Workspace Type": "CitC 工作区类型",
  "Clear search (Esc)": "清除搜索 (Esc)",
  "Click to copy URL": "点击复制 URL",
  "Click to copy full command": "点击复制完整命令",
  "Clone current workspace into a new independent workspace": "将当前工作区克隆到新的独立工作区",
  "Close Settings": "关闭设置",
  "Close Terminal Tab": "关闭终端标签页",
  "Command Palette": "命令面板",
  "Command Setup Script": "命令初始化脚本",
  "Command and file access granted to the automation agents.": "授予自动化智能体的命令与文件访问权限。",
  "Command picker": "命令选择器",
  "Commands Outside Sandbox": "沙箱外部命令",
  "Commands the agent can run outside the sandbox in this workspace.": "智能体在此工作区中可在沙箱外运行的命令。",
  "Commands the agent can run outside the sandbox.": "智能体可在沙箱外运行的命令。",
  "Complete verification": "完成验证",
  "Completed": "已完成",
  "Configure Branches": "配置分支",
  "Configure GitHub access policies.": "配置 GitHub 访问策略。",
  "Configure Google Drive access permissions.": "配置 Google 云端硬盘访问权限。",
  "Configure agent execution, queued message delivery, and permissions.": "配置智能体执行、排队消息发送以及权限策略。",
  "Configure agent hooks": "配置智能体生命周期钩子",
  "Configure allowed and denied URLs for browser actuation.": "配置浏览器操作允许和拒绝的 URL 规则。",
  "Configure allowed and denied URLs for reading.": "配置读取允许和拒绝的 URL 规则。",
  "Configure allowed and denied paths for file reads and writes.": "配置允许和拒绝读写的文件路径规则。",
  "Configure allowed commands outside the sandbox.": "配置沙箱外允许运行的命令。",
  "Configure allowed terminal commands.": "配置允许运行的终端命令。",
  "Configure editor-specific behaviors and shortcuts.": "配置编辑器专属行为与快捷键。",
  "Configure external tools via Model Context Protocol.": "通过模型上下文协议 (MCP) 配置外部工具。",
  "Configure tab completion, suggestions, and navigation behavior.": "配置 Tab 自动补全、建议与导航行为。",
  "Configure the agent's visual theme and display preferences.": "配置智能体的视觉主题与显示偏好。",
  "Configure the maximum width of the conversation panel.": "配置对话面板的最大显示宽度。",
  "Configure when follow-up messages are sent.": "配置何时发送后续跟进消息。",
  "Configure workspace-specific permissions, resources, and customizations.": "配置工作区专属权限、资源与自定义设置。",
  "Configures how the agent tries to access files outside of its working folders.": "配置智能体如何访问其工作文件夹以外的文件。",
  "Confirm Undo": "确认撤销",
  "Confirm Window Reload": "确认重新加载窗口",
  "Console logs": "控制台日志",
  "Context": "上下文",
  "Continue Response": "继续生成回答",
  "Controls whether terminal commands require your approval before running.": "控制终端命令在运行前是否需要您的批准。",
  "Controls whether the agent can run custom JavaScript to automate complex browser actions.": "控制智能体是否可以运行自定义 JavaScript 来实现复杂的浏览器自动化操作。",
  "Conversation Width": "对话窗格宽度",
  "Conversation copied as Markdown to clipboard": "对话已复制为 Markdown 到剪贴板",
  "Conversations reorganized": "对话已重新归纳",
  "Copy Content": "复制内容",
  "Copy File Name": "复制文件名",
  "Copy File Path": "复制文件路径",
  "Copy Image": "复制图片",
  "Copy config file path": "复制配置文件路径",
  "Copy debug info": "复制调试信息",
  "Copy description": "复制描述",
  "Copy email address": "复制邮箱地址",
  "Copy full URL to clipboard": "复制完整 URL 到剪贴板",
  "Copy output": "复制输出",
  "Copy path": "复制路径",
  "Copy raw string value": "复制原始字符串值",
  "Copy schema JSON": "复制 Schema JSON",
  "Copy section content": "复制章节内容",
  "Copy thinking": "复制思考过程",
  "Copy trajectory ID": "复制 Trajectory ID",
  "Copy value": "复制值",
  "Create Documents": "创建文档",
  "Create or select a CitC workspace to use in this conversation": "创建或选择要在本对话中使用的 CitC 工作区",
  "Creating Chat Bot": "正在创建聊天机器人",
  "Creating Cloud Project": "正在创建云端项目",
  "Creating Sidecar": "正在创建 Sidecar",
  "Current workspace": "当前工作区",
  "Custom": "自定义",
  "Custom Agents": "自定义智能体",
  "Custom View": "自定义视图",
  "Custom path navigation": "自定义路径导航",
  "Customize Global Skills": "自定义全局技能",
  "Daily": "每天",
  "Danger Zone": "危险操作区",
  "Dark Theme": "深色主题",
  "Default": "默认",
  "Default Customizations": "默认自定义配置",
  "Delete": "删除",
  "Delete project": "删除项目",
  "Delete this rule": "删除此规则",
  "Delete workspace": "删除工作区",
  "Deleting Workspace": "正在删除工作区",
  "Deny": "拒绝",
  "Diagnostics": "诊断信息",
  "Disabled": "已禁用",
  "Discard Changes": "放弃更改",
  "Display Options": "显示选项",
  "Display and preserve intermediate thinking steps.": "显示并保留智能体的中间思考步骤。",
  "Done": "完成",
  "Download": "下载",
  "Edit Model": "编辑模型",
  "Enable": "启用",
  "Enabled": "已启用",
  "Error": "错误",
  "Execute": "执行",
  "Expand All": "全部展开",
  "Export": "导出",
  "External tools the agent can call via Model Context Protocol.": "智能体可通过模型上下文协议 (MCP) 调用的外部工具。",
  "Feedback": "反馈",
  "File Permissions": "文件权限",
  "Files": "文件",
  "Full machine": "全功能模式",
  "Good response": "满意",
  "Google Account": "Google 账号",
  "High Contrast Dark": "高对比度深色",
  "High Contrast Light": "高对比度浅色",
  "Hooks": "钩子 (Hooks)",
  "Idle": "空闲",
  "Import": "导入",
  "In Progress": "进行中",
  "Include Jetski Default Customizations": "包含默认内置自定义配置",
  "Info": "提示",
  "Inherit General": "继承通用设置",
  "Inherits your General settings when working in this project.": "在此项目中工作时继承您的通用设置。",
  "Install": "安装",
  "Installed": "已安装",
  "Internet Access Policy": "网络访问策略",
  "Just now": "刚刚",
  "Keep Computer Awake": "防止休眠",
  "Keep computer awake while agents are running": "智能体运行时保持电脑唤醒",
  "Keyboard Shortcuts": "快捷键",
  "Last 30 days": "最近 30 天",
  "Last 7 days": "最近 7 天",
  "Latest Version": "最新版本",
  "Learn more": "了解更多",
  "Light": "浅色",
  "Loading": "加载中",
  "Loading...": "加载中...",
  "Logs Path": "日志路径",
  "MCP Servers": "MCP 服务器",
  "MCP Tools": "MCP 工具",
  "Manage permissions": "管理权限",
  "Manually customize individual settings.": "手动自定义各项个性化设置。",
  "Mark as Read": "标记为已读",
  "Model": "模型",
  "Model Quota": "模型配额",
  "Model Selection": "模型选择",
  "Network Permissions": "网络权限",
  "No Model Selected": "未选择模型",
  "No items found": "暂无内容",
  "No results found": "未找到匹配结果",
  "Non-Workspace File Access": "非工作区文件访问",
  "None": "无",
  "Not Installed": "未安装",
  "Offline": "离线",
  "Older": "更早",
  "Online": "在线",
  "Open Agent on Reload": "重载时自动打开智能体",
  "Open Electron Logs": "查看 Electron 日志",
  "Open File": "打开文件",
  "Open IDE": "打开 IDE",
  "Open Language Server Logs": "查看语言服务器日志",
  "Open Storage Folder": "打开数据存储文件夹",
  "Options": "选项",
  "Paused": "已暂停",
  "Permission Preset": "权限预设",
  "Permission Settings": "权限设置",
  "Permissions": "权限与安全",
  "Personal Customizations": "个人自定义配置",
  "Pin": "置顶",
  "Plan Details": "套餐详情",
  "Plugins": "插件",
  "Preferences": "偏好设置",
  "Previous": "上一步",
  "Privacy Policy": "隐私政策",
  "Problems": "问题诊断",
  "Proceed": "继续",
  "Prompt for approval before running browser scripts.": "在运行浏览器脚本前提示用户进行审批。",
  "Quick Start": "快速入门",
  "Quota exceeded": "配额已超限",
  "Read URL": "读取 URL",
  "Read URLs": "读取 URL",
  "Recent": "最近",
  "Recommended Skills": "推荐技能",
  "Refresh": "刷新",
  "Reload Customizations": "重新加载自定义配置",
  "Remove": "移除",
  "Report an Issue": "报告问题",
  "Reset All Settings": "重置所有设置",
  "Reset to Default": "恢复默认值",
  "Restore": "还原",
  "Retry": "重试",
  "Rules": "规则",
  "Run in background": "在后台保持运行",
  "Run in Background": "后台运行",
  "Running": "正在运行",
  "Sandbox Allow Network": "沙箱允许联网",
  "Sandbox Mode": "沙箱模式",
  "Save": "保存",
  "Save Changes": "保存更改",
  "Search": "搜索",
  "Security Preset": "安全预设",
  "Select": "选择",
  "Select a model": "选择模型",
  "Select an agent": "选择智能体",
  "Send Feedback": "发送反馈",
  "Show line numbers": "显示行号",
  "Show intermediate thinking steps": "显示中间思考步骤",
  "Sign out": "退出登录",
  "Skills": "技能",
  "Sort by": "排序方式",
  "Sort by Date": "按日期排序",
  "Sort by Name": "按名称排序",
  "Status": "状态",
  "Streaming Responses": "流式响应输出",
  "Strict (Always Ask)": "严格模式（每次询问）",
  "Subagent": "子智能体",
  "Subagents": "子智能体列表",
  "Submit": "提交",
  "Submit Appeal": "提交申诉",
  "Submit Feedback": "提交反馈",
  "Success": "成功",
  "System": "跟随系统",
  "Temperature": "温度 (Temperature)",
  "Terminal": "终端",
  "Terminal Commands": "终端命令",
  "Terms of Service": "服务条款",
  "Theme": "主题",
  "Thinking Budget": "思考预算",
  "This action cannot be undone.": "此操作无法撤销。",
  "Today": "今天",
  "Top P": "Top P 采样",
  "Try again": "重试",
  "Turbo mode": "极速模式",
  "UI Extensions": "UI 扩展",
  "UI Plugins": "UI 插件",
  "Uninstall": "卸载",
  "Unpin": "取消置顶",
  "Unsaved Changes": "未保存的更改",
  "Up to date": "已是最新版本",
  "Update": "更新",
  "Update Available": "有可用更新",
  "Upgrade plan": "升级套餐",
  "Usage & Billing": "用量与计费",
  "User Settings": "用户设置",
  "Version": "版本",
  "Warning": "警告",
  "Workspace Settings": "工作区设置",
  "Yesterday": "昨天",
  "Your administrator has disabled MCP servers for this workspace.": "您的管理员已禁用此工作区的 MCP 服务器功能。"
};

// ---------------------------------------------------------------------------
// 3. Main World 注入函数（运行在页面 JS 主上下文中，深度挂钩 React.createElement 与 DOM）
// ---------------------------------------------------------------------------
function injectedMainWorldScript(DICT) {
    if (window.__AGY_CN_INITIALIZED__) return;
    window.__AGY_CN_INITIALIZED__ = true;

    function translateText(str) {
        if (typeof str !== 'string') return str;
        const trimmed = str.trim();
        if (!trimmed || trimmed.length < 1) return str;

        // 1. 精确词典匹配
        if (DICT[trimmed]) {
            return str.replace(trimmed, DICT[trimmed]);
        }

        // 2. 智能体与任务运行数量
        if (/^(\d+)\s+agents?\s+running$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个智能体正在运行');
        }
        if (/^No\s+agents?\s+running$/i.test(trimmed)) {
            return str.replace(trimmed, '无智能体正在运行');
        }
        if (/^(\d+)\s+subagents?\s+running$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个子智能体正在运行');
        }
        if (/^(\d+)\s+background\s+tasks?\s+running$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个后台任务正在运行');
        }
        if (/^(\d+)\s+active\s+tasks?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个活跃任务');
        }

        // 3. 选择与数量计数 (N of M selected / N files changed)
        if (/^(\d+)\s+of\s+(\d+)\s+selected$/i.test(trimmed)) {
            const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
            return str.replace(trimmed, '已选择 ' + m[1] + ' / ' + m[2]);
        }
        if (/^(\d+)\s+of\s+(\d+)\s+files?$/i.test(trimmed)) {
            const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
            return str.replace(trimmed, '第 ' + m[1] + ' / ' + m[2] + ' 个文件');
        }
        if (/^(\d+)\s+files?\s+changed$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个文件已修改');
        }
        if (/^(\d+)\s+lines?\s+added$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '添加了 ' + num + ' 行');
        }
        if (/^(\d+)\s+lines?\s+removed$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '删除了 ' + num + ' 行');
        }
        if (/^(\d+)\s+matches?\s+found$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '找到 ' + num + ' 个匹配项');
        }
        if (/^(\d+)\s+results?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 条结果');
        }

        // 4. 思考时间动态匹配 (Thought for X seconds)
        if (/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
            const m = trimmed.match(/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i);
            return str.replace(trimmed, '思考耗时 ' + m[1].replace(/seconds?/i, '秒').replace(/s/i, ' 秒'));
        }
        if (/^Thinking for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
            const m = trimmed.match(/^Thinking for\s+([\d\.]+\s*s(?:econds?)?)/i);
            return str.replace(trimmed, '已思考 ' + m[1].replace(/seconds?/i, '秒').replace(/s/i, ' 秒'));
        }

        // 5. 步骤与轮次动态匹配 (Step N of M)
        if (/^Step\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Step\s+(\d+)\s+of\s+(\d+)$/i);
            return str.replace(trimmed, '步骤 ' + m[1] + ' / ' + m[2]);
        }

        // 6. 相对时间动态匹配
        if (/^(\d+)\s+seconds?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 秒前');
        }
        if (/^(\d+)\s+minutes?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 分钟前');
        }
        if (/^(\d+)\s+hours?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 小时前');
        }
        if (/^(\d+)\s+days?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 天前');
        }
        if (/^in\s+(\d+)\s+minutes?$/i.test(trimmed)) {
            const num = trimmed.match(/^in\s+(\d+)/i)[1];
            return str.replace(trimmed, num + ' 分钟后');
        }

        // 7. Token 与百分比
        if (/^(\d[\d,]*)\s+tokens?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d[\d,]*)/)[1];
            return str.replace(trimmed, num + ' 个 Token');
        }
        if (/^(\d+)%\s+used$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '已使用 ' + num + '%');
        }
        if (/^(\d+)%\s+of\s+context\s+window$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '占上下文窗口 ' + num + '%');
        }

        return str;
    }

    // 检查是否应跳过代码高亮与终端等节点
    function isCodeElement(type, props) {
        if (type === 'code' || type === 'pre') return true;
        if (props && typeof props === 'object') {
            const cls = props.className || '';
            if (typeof cls === 'string' && (
                cls.includes('monaco') ||
                cls.includes('prism') ||
                cls.includes('xterm') ||
                cls.includes('cm-editor') ||
                cls.includes('hljs') ||
                cls.includes('diff-line-content')
            )) {
                return true;
            }
        }
        return false;
    }

    function translateProps(props) {
        if (!props || typeof props !== 'object') return;
        const keys = ['placeholder', 'title', 'aria-label', 'label', 'description', 'tooltip', 'data-tooltip', 'data-title', 'alt', 'header', 'helperText'];
        for (const k of keys) {
            if (typeof props[k] === 'string') {
                props[k] = translateText(props[k]);
            }
        }
        // 处理 options 数组（用于 HTML 顶部菜单项如 options: [{label: '...'}]）
        if (Array.isArray(props.options)) {
            for (const opt of props.options) {
                if (opt && typeof opt === 'object' && typeof opt.label === 'string') {
                    opt.label = translateText(opt.label);
                }
            }
        }
    }

    function translateChild(child) {
        if (typeof child === 'string') {
            return translateText(child);
        }
        if (Array.isArray(child)) {
            return child.map(translateChild);
        }
        return child;
    }

    function wrapCreateElement(orig) {
        return function(type, props, ...children) {
            if (!isCodeElement(type, props)) {
                translateProps(props);
                for (let i = 0; i < children.length; i++) {
                    children[i] = translateChild(children[i]);
                }
            }
            return orig.call(this, type, props, ...children);
        };
    }

    function hookReact(obj) {
        if (!obj || typeof obj !== 'object') return;
        let _ce = obj.createElement ? wrapCreateElement(obj.createElement) : undefined;
        Object.defineProperty(obj, 'createElement', {
            configurable: true,
            enumerable: true,
            get() { return _ce; },
            set(fn) {
                _ce = typeof fn === 'function' ? wrapCreateElement(fn) : fn;
            }
        });
    }

    // 拦截全局 React 对象加载
    let _react = window.React || self.React;
    if (_react) {
        hookReact(_react);
    } else {
        Object.defineProperty(window, 'React', {
            configurable: true,
            enumerable: true,
            get() { return _react; },
            set(val) {
                _react = val;
                if (val && typeof val === 'object') {
                    hookReact(val);
                }
            }
        });
    }

    // 拦截 document.title 以自动汉化窗口标题
    try {
        const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
        if (titleDesc && titleDesc.set) {
            const origSet = titleDesc.set;
            Object.defineProperty(document, 'title', {
                configurable: true,
                enumerable: true,
                get() {
                    return titleDesc.get.call(document);
                },
                set(val) {
                    origSet.call(document, translateText(val));
                }
            });
        }
    } catch (_) {}
}

// ---------------------------------------------------------------------------
// 4. 执行 Main World 注入与 DOM 双重保障
// ---------------------------------------------------------------------------
const injectionCode = "(" + injectedMainWorldScript.toString() + ")(" + JSON.stringify(I18N_DICT) + ");";

try {
    electron_1.webFrame.executeJavaScriptInIsolatedWorld(0, [
        { code: injectionCode }
    ]);
} catch (e) {
    console.error('[AntigravityCN] webFrame injection error:', e);
}

// DOM 加载就绪时再次确保注入
if (typeof document !== 'undefined') {
    const doDomInjection = () => {
        try {
            const script = document.createElement('script');
            script.textContent = injectionCode;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } catch (_) {}
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', doDomInjection);
    } else {
        doDomInjection();
    }
}
