"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Preload script — runs in every BrowserWindow before the page loads.
 * Exposes a minimal, secure API via contextBridge so the renderer can
 * communicate with the main-process auto-updater without nodeIntegration.
 * 
 * 同时内置 Antigravity 全方位简体中文深度汉化引擎，全面本地化应用内 Web 界面。
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
// 2. Web UI 全方位本地化词典 (Antigravity In-App Web UI I18N Dict)
// ---------------------------------------------------------------------------
const I18N_DICT = {
  // === 导航与主要视图 ===
  "Home": "主页",
  "History": "历史记录",
  "Settings": "设置",
  "Open Settings": "打开设置",
  "Open Conversation Picker": "打开对话选择器",
  "Open Workspace Selector": "打开工作区选择器",
  "Open Command Palette": "打开命令面板",
  "Open Keyboard Shortcuts": "打开快捷键设置",
  "Toggle Sidebar": "切换侧边栏",
  "Toggle Auxiliary Pane": "切换辅助窗格",
  "Auxiliary Pane": "辅助窗格",
  "Toggle Terminal": "切换终端",
  "Toggle Editor": "切换编辑器",
  "Toggle Project Selector": "切换项目选择器",
  "Toggle Environment Selector": "切换环境选择器",
  "Toggle Model Selector": "切换模型选择器",

  // === 对话与会话管理 ===
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
  "Select Next Conversation": "选择下一个对话",
  "Select Previous Conversation": "选择上一个对话",

  // === 工作区与项目 ===
  "Workspaces": "工作区列表",
  "Workspace": "工作区",
  "New Workspace": "新建工作区",
  "Add Workspace": "添加工作区",
  "Archive Workspace": "归档工作区",
  "Remove Workspace": "移除工作区",
  "Select Workspace": "选择工作区",
  "Recent Workspaces": "最近工作区",
  "Open Workspace": "打开工作区",
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

  // === 对话输入框与控制 ===
  "Ask a question or enter a task...": "输入您的问题或任务指令...",
  "Type a message...": "输入消息...",
  "Type / for commands, @ for context...": "输入 / 调用命令，输入 @ 添加上下文...",
  "Type / for commands...": "输入 / 查看可用命令...",
  "Type to search...": "输入以搜索...",
  "Search files...": "搜索文件...",
  "Search commands...": "搜索命令...",
  "Search everywhere": "全局搜索",
  "Focus Input": "聚焦输入框",
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

  // === 斜杠命令 (Slash Commands) ===
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

  // === @ 上下文引用菜单 ===
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
  "Add to Chat": "添加到对话",
  "Terminal: Add to Chat": "终端: 添加到对话",
  "Add Context": "添加上下文",
  "Add Handler": "添加处理器",

  // === 思考与推理过程 ===
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

  // === 步骤确认、Diff 审查与工具执行 ===
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
  "New Terminal Tab": "新建终端标签页",
  "Copy Output": "复制输出",
  "Copy Command": "复制命令",
  "Copy Error": "复制错误信息",

  // === 子智能体与后台/计划任务 ===
  "Custom Agents": "自定义智能体",
  "Subagents": "子智能体列表",
  "Subagent": "子智能体",
  "Subagents Panel": "子智能体面板",
  "Stop Subagent": "停止子智能体",
  "Stop all subagents": "停止全部子智能体",
  "View Subagent transcript": "查看子智能体运行记录",
  "Subagent Logs": "子智能体日志",
  "No subagents": "暂无子智能体",
  "No subagents running": "无正在运行的子智能体",
  "Subagent active": "子智能体运行中",
  "Subagent completed": "子智能体已完成",
  "Subagent failed": "子智能体失败",
  "Subagent canceled": "子智能体已取消",
  "Background Tasks": "后台任务列表",
  "Background Task": "后台任务",
  "Background Task Output": "后台任务输出",
  "Scheduled Tasks": "计划任务",
  "Cron Jobs": "定时任务 (Cron)",
  "One-shot Timers": "单次计时器",
  "Active Timers": "活跃计时器",
  "Schedule a Task": "新建计划任务",
  "No scheduled tasks": "暂无计划任务",
  "Trigger now": "立即触发",
  "Cancel schedule": "取消计划",
  "Pause schedule": "暂停计划",
  "Resume schedule": "恢复计划",
  "Next run": "下次运行",
  "Last run": "上次运行",
  "Task ID": "任务 ID",
  "Running background task": "正在运行后台任务",
  "Kill Task": "终止任务",
  "Send input": "发送输入",
  "Task completed successfully": "任务已成功完成",
  "Task terminated": "任务已终止",

  // === 设置面板 (Settings) 分类与各项参数 ===
  "Account": "账号",
  "General": "通用",
  "Inherit General": "继承通用设置",
  "Inherits your General settings when working in this project.": "在此项目中工作时继承您的通用设置。",
  "Appearance": "外观",
  "Models": "模型",
  "Model": "模型",
  "Select Model": "选择模型",
  "Edit Model": "编辑模型",
  "No Model Selected": "未选择模型",
  "Model Quota": "模型配额",
  "Customizations": "自定义配置",
  "Default Customizations": "默认自定义配置",
  "Personal Customizations": "个人自定义配置",
  "Customize Global Skills": "自定义全局技能",
  "Recommended Skills": "推荐技能",
  "Rules": "规则",
  "Skills": "技能",
  "Plugins": "插件",
  "UI Plugins": "UI 插件",
  "UI Extensions": "UI 扩展",
  "Hooks": "钩子 (Hooks)",
  "MCP Servers": "MCP 服务器",
  "MCP Tools": "MCP 工具",
  "MCP server": "MCP 服务器",
  "CitC Settings": "CitC 设置",
  "Shortcuts": "快捷键",
  "Display Options": "显示选项",
  "Security Preset": "安全预设",
  "Permission Preset": "权限预设",
  "Permission Settings": "权限设置",
  "File Permissions": "文件权限",
  "Network Permissions": "网络权限",
  "Manage permissions": "管理权限",
  "Always Proceed": "始终允许",
  "Always Ask": "每次询问",
  "Deny": "拒绝",
  "Terminal Commands": "终端命令",
  "Commands Outside Sandbox": "沙箱外部命令",
  "Read URLs": "读取 URL",
  "Execute URLs": "执行 URL",
  "Read URL": "读取 URL",
  "Enable Sandbox Mode": "启用沙箱模式",
  "Enable Sandbox Mode (Preview)": "启用沙箱模式（预览）",
  "Sandbox Allow Network": "沙箱允许联网",
  "Disabled by organization policy": "已被组织策略禁用",
  "Strict (Always Ask)": "严格模式（每次询问）",
  "Balanced (Standard)": "标准模式（平衡安全与速度）",
  "Permissive (Turbo / No Barriers)": "极速模式（无阻碍极速迭代）",
  "Custom Security Preset": "自定义安全预设",
  "Non-Workspace File Access": "非工作区文件访问",
  "Internet Access Policy": "网络访问策略",
  "Allowlist / Denylist": "允许列表 / 拒绝列表",
  "Allowed Commands": "允许的命令",
  "Blocked Commands": "阻止的命令",
  "Allowed Domains": "允许的域名",
  "Allowed URLs": "允许的 URL",
  "Artifact Review Mode": "构件审查模式",
  "Agent decides": "由智能体决定",
  "Always require review": "始终需要人工审核",
  "MCP Server Permissions": "MCP 服务器权限",
  "External tools the agent can call via Model Context Protocol.": "智能体可通过模型上下文协议 (MCP) 调用的外部工具。",
  "Manually customize individual settings.": "手动自定义各项个性化设置。",
  "Display and preserve intermediate thinking steps.": "显示并保留智能体的中间思考步骤。",
  "Agent can scroll on browser pages to access more content.": "允许智能体在浏览器页面中滚动以获取更多内容。",
  "Prompt for approval before running browser scripts.": "在运行浏览器脚本前提示用户进行审批。",
  "Disables all safety barriers for maximal iteration velocity.": "禁用所有安全屏障以获得极致的迭代速度。",
  "Your administrator has disabled MCP servers for this workspace.": "您的管理员已禁用此工作区的 MCP 服务器功能。",
  "Auto-Expand Changes Overview": "自动展开变更概览",
  "Auto-Open Edited Files": "自动打开编辑的文件",
  "Open Agent on Reload": "重载时自动打开智能体",
  "Enable Sounds for Agent": "启用智能体提示音",
  "Enable Shell Integration": "启用 Shell 集成",
  "Agent Auto-Fix Lints": "智能体自动修复 Lint 错误",
  "Include Jetski Default Customizations": "包含默认内置自定义配置",
  "Enable Personal Customizations": "启用个人自定义配置",
  "Enable Remote Control": "启用远程控制",
  "Enable Demo Mode (Beta)": "启用演示模式（测试版）",
  "Open Customizations Folder": "打开自定义配置文件夹",
  "Reload Customizations": "重新加载自定义配置",
  "Enter file or directory path...": "输入文件或目录路径...",
  "Enter URL pattern...": "输入 URL 匹配规则...",
  "Enter tool name or server...": "输入工具名称或服务器...",
  "Add rule": "添加规则",
  "Delete rule": "删除规则",
  "Edit rule": "编辑规则",
  "Add MCP Server": "添加 MCP 服务器",
  "Server Name": "服务器名称",
  "Command": "命令",
  "Environment Variables": "环境变量",
  "Transport Type": "传输类型",
  "Default Model": "默认模型",
  "Active Model": "当前活跃模型",
  "Auto-check for updates": "自动检查更新",
  "Run in background": "在后台保持运行",
  "Keep computer awake while agents are running": "智能体运行时保持电脑唤醒",
  "Run in Background": "后台运行",
  "Keep Computer Awake": "防止休眠",
  "Notifications": "通知",
  "Enable system notifications": "启用系统通知",
  "Notify on task completion": "任务完成时发送通知",
  "Notify on tool approval request": "需要工具审批时发送通知",
  "Google Account": "Google 账号",
  "Signed in as": "当前登录为",
  "Sign out": "退出登录",
  "Switch account": "切换账号",
  "Continue with Google": "使用 Google 账号继续",
  "Continue with different account": "使用其他账号继续",
  "Usage & Billing": "用量与计费",
  "Plan Details": "套餐详情",
  "Pro / Ultra Subscription": "Pro / Ultra 订阅",
  "Upgrade plan": "升级套餐",
  "Terms of Service": "服务条款",
  "Privacy Policy": "隐私政策",
  "Quota exceeded": "配额已超限",
  "Rate limit reached": "达到速率限制",
  "Reset quota on": "配额重置时间",
  "Application Version": "应用版本",
  "Build CL": "构建版本号 (CL)",
  "Storage Path": "数据存储路径",
  "Open Storage Folder": "打开数据存储文件夹",
  "Logs Path": "日志路径",
  "Open Electron Logs": "查看 Electron 日志",
  "Open Language Server Logs": "查看语言服务器日志",
  "Clear Cache": "清除缓存",
  "Reset All Settings": "重置所有设置",
  "Preferences": "偏好设置",
  "User Settings": "用户设置",
  "Workspace Settings": "工作区设置",
  "Default Settings": "默认设置",
  "Reset to Default": "恢复默认值",
  "Save Changes": "保存更改",
  "Discard Changes": "放弃更改",
  "Unsaved Changes": "未保存的更改",
  "Are you sure?": "您确定吗？",
  "This action cannot be undone.": "此操作无法撤销。",

  // === 外观与主题 ===
  "Theme": "主题",
  "Dark": "深色",
  "Light": "浅色",
  "Default Dark": "默认深色",
  "Default Light": "默认浅色",
  "High Contrast Dark": "高对比度深色",
  "High Contrast Light": "高对比度浅色",
  "System": "跟随系统",
  "Conversation Width": "对话窗格宽度",
  "Compact": "紧凑",
  "Comfortable": "适中",
  "Wide": "宽阔",
  "Font Size": "字体大小",
  "Zoom Level": "缩放级别",
  "Zoom In": "放大",
  "Zoom Out": "缩小",
  "Reset Zoom": "重置缩放",
  "Line wrapping": "自动换行",
  "Show line numbers": "显示行号",
  "Render whitespace": "渲染空格符",
  "Code font family": "代码字体",

  // === 模型参数与模式 ===
  "Turbo mode": "极速模式",
  "Full machine": "全功能模式",
  "Auto (detected)": "自动（已检测）",
  "Streaming Responses": "流式响应输出",
  "Thinking Budget": "思考预算",
  "Show intermediate thinking steps": "显示中间思考步骤",
  "Context Window Size": "上下文窗口大小",
  "Temperature": "温度 (Temperature)",
  "Top P": "Top P 采样",

  // === 辅助窗格与工具 ===
  "Terminal": "终端",
  "Editor": "编辑器",
  "Browser": "浏览器",
  "Code Search": "代码搜索",
  "File Explorer": "文件资源管理器",
  "Problems": "问题诊断",
  "Diagnostics": "诊断信息",
  "Console": "控制台",
  "Output": "输出",
  "New Editor Window": "新建编辑器窗口",
  "File Picker": "文件选择器",
  "Find in Pane": "在窗格中查找",
  "Remove From Split": "从分屏中移除",
  "Split Conversation Vertically": "垂直分屏对话",
  "Split Conversation Horizontally": "水平分屏对话",
  "Close Tab": "关闭标签页",
  "Close Others": "关闭其他标签页",
  "Close to the Right": "关闭右侧标签页",
  "Close Saved": "关闭已保存标签页",
  "Close All": "全部关闭",
  "Reopen Closed Tab": "重新打开已关闭标签页",
  "Pin Tab": "固定标签页",
  "Unpin Tab": "取消固定标签页",
  "Next match (Enter)": "下一个匹配项 (Enter)",
  "Next match": "下一个匹配项",
  "Previous match": "上一个匹配项",

  // === 反馈与帮助 ===
  "Good response": "满意",
  "Bad response": "不满意",
  "Provide Feedback": "提供反馈",
  "Provide feedback": "提供反馈",
  "Submit Feedback": "提交反馈",
  "Submit Appeal": "提交申诉",
  "Send Feedback": "发送反馈",
  "Report an Issue": "报告问题",
  "Report issue": "报告问题",
  "Having trouble? Let us know": "遇到问题？向我们反馈",
  "Feedback submitted": "反馈已提交",
  "Thank you for your feedback!": "感谢您的宝贵反馈！",
  "Help": "帮助",
  "Documentation": "官方文档",
  "Quick Start": "快速入门",
  "Learn more": "了解更多",
  "My Stuff": "我的内容",

  // === 常用操作与通用按钮 ===
  "Save": "保存",
  "Cancel": "取消",
  "Delete": "删除",
  "Edit": "编辑",
  "Editing": "正在编辑",
  "Edited": "已编辑",
  "Copy": "复制",
  "Copied": "已复制",
  "Copied to clipboard": "已复制到剪贴板",
  "Copy Path": "复制路径",
  "Copy path": "复制路径",
  "Copy value": "复制值",
  "Copy output": "复制输出",
  "Copy Image": "复制图片",
  "Copy prompt": "复制提示词",
  "Copy Content": "复制内容",
  "Copy Link": "复制链接",
  "Copy code": "复制代码",
  "Copy response": "复制回答",
  "Retry": "重试",
  "Try again": "重试",
  "Submit": "提交",
  "Proceed": "继续",
  "Dismiss": "忽略",
  "Close": "关闭",
  "Open": "打开",
  "Open in new tab": "在新标签页中打开",
  "Open IDE": "打开 IDE",
  "Show in File Explorer": "在文件资源管理器中显示",
  "Download Diagnostics": "下载诊断信息",
  "Mark as Read": "标记为已读",
  "More actions": "更多操作",
  "Got it": "知道了",
  "See more": "展开更多",
  "See less": "收起",
  "Other (write your answer)": "其他（填写回答）",
  "Previous question": "上一个问题",
  "Next question": "下一个问题",
  "Yes, and always allow": "是，并始终允许",
  "Yes, save rule for": "是，保存规则用于",
  "Edit config": "编辑配置",
  "Back": "返回",
  "Go Back": "后退",
  "Go Forward": "前进",
  "Back to": "返回至",
  "Default": "默认",
  "Custom": "自定义",
  "Location": "位置",
  "Search": "搜索",
  "Clear": "清空",
  "Filter": "筛选",
  "Files": "文件",
  "Add": "添加",
  "Remove": "移除",
  "Refresh": "刷新",
  "Loading...": "加载中...",
  "Loading": "加载中",
  "Other": "其他",
  "Error": "错误",
  "Warning": "警告",
  "Info": "提示",
  "Success": "成功",
  "In Progress": "进行中",
  "Running": "正在运行",
  "Success, Continuing...": "成功，继续执行...",
  "Canceled": "已取消",
  "Aborted": "已中止",
  "Skip": "跳过",
  "Confirm": "确认",
  "Apply": "应用",
  "Reset": "重置",
  "Next": "下一步",
  "Previous": "上一步",
  "Done": "完成",
  "Select": "选择",
  "All": "全部",
  "None": "无",
  "Enabled": "已启用",
  "Disabled": "已禁用",
  "Enable": "启用",
  "Disable": "禁用",
  "Installed": "已安装",
  "Not Installed": "未安装",
  "Install": "安装",
  "Uninstall": "卸载",
  "Update": "更新",
  "Active": "运行中",
  "Idle": "空闲",
  "Paused": "已暂停",
  "Offline": "离线",
  "Online": "在线",
  "Connecting...": "连接中...",
  "Connected": "已连接",
  "Disconnected": "已断开",
  "Status": "状态",
  "Details": "详情",
  "Actions": "操作",
  "Options": "选项",
  "Keyboard Shortcuts": "快捷键",
  "Command Palette": "命令面板",
  "Diff": "差异",
  "Execute": "执行",
  "No results found": "未找到匹配结果",
  "No items found": "暂无内容",
  "No data available": "无可用数据",
  "Nothing to show": "暂无内容显示",
  "Select a model": "选择模型",
  "Select an agent": "选择智能体",
  "Select workspace": "选择工作区",
  "Open File": "打开文件",
  "Download": "下载",
  "Upload": "上传",
  "Import": "导入",
  "Export": "导出",
  "Expand All": "全部展开",
  "Collapse All": "全部折叠",
  "Collapse": "折叠",
  "Expand": "展开",
  "Maximize": "最大化",
  "Minimize": "最小化",
  "Restore": "还原",
  "Pin": "置顶",
  "Unpin": "取消置顶",
  "Star": "收藏",
  "Unstar": "取消收藏",
  "Favorite": "收藏",
  "Filter by name...": "按名称筛选...",
  "Filter by type...": "按类型筛选...",
  "Sort by": "排序方式",
  "Sort by Date": "按日期排序",
  "Sort by Name": "按名称排序",
  "Ascending": "升序",
  "Descending": "降序",
  "Today": "今天",
  "Yesterday": "昨天",
  "Last 7 days": "最近 7 天",
  "Last 30 days": "最近 30 天",
  "Older": "更早",
  "Just now": "刚刚",
  "Version": "版本",
  "Current Version": "当前版本",
  "Latest Version": "最新版本",
  "Up to date": "已是最新版本",
  "Update Available": "有可用更新",
  "Checking for updates...": "正在检查更新...",
  "Downloading update...": "正在下载更新...",
  "Restart to update": "重启以更新"
};

// ---------------------------------------------------------------------------
// 3. 动态模式匹配与智能翻译函数
// ---------------------------------------------------------------------------
function getTranslatedText(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) return null;

    // 1. 精确词典匹配
    if (I18N_DICT[trimmed]) {
        return raw.replace(trimmed, I18N_DICT[trimmed]);
    }

    // 2. 智能体与任务数量动态匹配
    if (/^(\d+)\s+agents?\s+running$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个智能体正在运行`);
    }
    if (/^No\s+agents?\s+running$/i.test(trimmed)) {
        return raw.replace(trimmed, '无智能体正在运行');
    }
    if (/^(\d+)\s+subagents?\s+running$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个子智能体正在运行`);
    }
    if (/^(\d+)\s+background\s+tasks?\s+running$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个后台任务正在运行`);
    }
    if (/^(\d+)\s+active\s+tasks?$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个活跃任务`);
    }

    // 3. 选择与数量计数动态匹配 (N of M selected / N files changed 等)
    if (/^(\d+)\s+of\s+(\d+)\s+selected$/i.test(trimmed)) {
        const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
        return raw.replace(trimmed, `已选择 ${m[1]} / ${m[2]}`);
    }
    if (/^(\d+)\s+of\s+(\d+)\s+files?$/i.test(trimmed)) {
        const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
        return raw.replace(trimmed, `第 ${m[1]} / ${m[2]} 个文件`);
    }
    if (/^(\d+)\s+files?\s+changed$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个文件已修改`);
    }
    if (/^(\d+)\s+lines?\s+added$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `添加了 ${num} 行`);
    }
    if (/^(\d+)\s+lines?\s+removed$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `删除了 ${num} 行`);
    }
    if (/^(\d+)\s+matches?\s+found$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `找到 ${num} 个匹配项`);
    }
    if (/^(\d+)\s+results?$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 条结果`);
    }

    // 4. 思考时间动态匹配 (Thought for X seconds / Thought for Xm Ys)
    if (/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
        const m = trimmed.match(/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i);
        return raw.replace(trimmed, `思考耗时 ${m[1].replace(/seconds?/i, '秒').replace(/s/i, ' 秒')}`);
    }
    if (/^Thinking for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
        const m = trimmed.match(/^Thinking for\s+([\d\.]+\s*s(?:econds?)?)/i);
        return raw.replace(trimmed, `已思考 ${m[1].replace(/seconds?/i, '秒').replace(/s/i, ' 秒')}`);
    }
    if (/^Thought for\s+(\d+m\s*\d+s)/i.test(trimmed)) {
        const m = trimmed.match(/^Thought for\s+(\d+m\s*\d+s)/i);
        return raw.replace(trimmed, `思考耗时 ${m[1].replace('m', ' 分 ').replace('s', ' 秒')}`);
    }

    // 5. 步骤与轮次动态匹配 (Step N of M / Round N of M)
    if (/^Step\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
        const m = trimmed.match(/^Step\s+(\d+)\s+of\s+(\d+)$/i);
        return raw.replace(trimmed, `步骤 ${m[1]} / ${m[2]}`);
    }
    if (/^Round\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
        const m = trimmed.match(/^Round\s+(\d+)\s+of\s+(\d+)$/i);
        return raw.replace(trimmed, `轮次 ${m[1]} / ${m[2]}`);
    }

    // 6. 相对时间动态匹配 (X seconds/minutes/hours/days ago)
    if (/^(\d+)\s+seconds?\s+ago$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 秒前`);
    }
    if (/^(\d+)\s+minutes?\s+ago$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 分钟前`);
    }
    if (/^(\d+)\s+hours?\s+ago$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 小时前`);
    }
    if (/^(\d+)\s+days?\s+ago$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 天前`);
    }
    if (/^(\d+)\s+weeks?\s+ago$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 周前`);
    }
    if (/^(\d+)\s+months?\s+ago$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个月前`);
    }
    if (/^in\s+(\d+)\s+seconds?$/i.test(trimmed)) {
        const num = trimmed.match(/^in\s+(\d+)/i)[1];
        return raw.replace(trimmed, `${num} 秒后`);
    }
    if (/^in\s+(\d+)\s+minutes?$/i.test(trimmed)) {
        const num = trimmed.match(/^in\s+(\d+)/i)[1];
        return raw.replace(trimmed, `${num} 分钟后`);
    }
    if (/^in\s+(\d+)\s+hours?$/i.test(trimmed)) {
        const num = trimmed.match(/^in\s+(\d+)/i)[1];
        return raw.replace(trimmed, `${num} 小时后`);
    }

    // 7. Token 用量与百分比动态匹配
    if (/^(\d[\d,]*)\s+tokens?$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d[\d,]*)/)[1];
        return raw.replace(trimmed, `${num} 个 Token`);
    }
    if (/^(\d+)%\s+used$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `已使用 ${num}%`);
    }
    if (/^(\d+)%\s+of\s+context\s+window$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `占上下文窗口 ${num}%`);
    }

    return null;
}

// ---------------------------------------------------------------------------
// 4. 节点安全性过滤（严格保护代码编辑器、终端输出与用户数据）
// ---------------------------------------------------------------------------
function shouldSkipNode(node) {
    if (!node) return true;
    const tag = node.tagName ? node.tagName.toUpperCase() : '';
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE') {
        return true;
    }
    if (node.isContentEditable) {
        return true;
    }
    if (node.classList && (
        node.classList.contains('monaco-editor') ||
        node.classList.contains('prism-code') ||
        node.classList.contains('hljs') ||
        node.classList.contains('xterm') ||
        node.classList.contains('cm-editor') ||
        node.classList.contains('code-block') ||
        node.classList.contains('terminal') ||
        node.classList.contains('diff-line-content')
    )) {
        return true;
    }
    if (node.closest && (
        node.closest('.monaco-editor') ||
        node.closest('.prism-code') ||
        node.closest('pre') ||
        node.closest('code') ||
        node.closest('.xterm') ||
        node.closest('[contenteditable="true"]') ||
        node.closest('.diff-line-content')
    )) {
        return true;
    }
    return false;
}

// ---------------------------------------------------------------------------
// 5. 递归遍历并翻译 DOM 节点与属性
// ---------------------------------------------------------------------------
function translateDOMNode(node) {
    if (!node || shouldSkipNode(node)) return;

    // 1. 处理元素自身属性 (placeholder, title, aria-label, tooltip, value 等)
    if (node.nodeType === 1) { // ELEMENT_NODE
        const attrs = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-title', 'data-placeholder'];
        for (const attr of attrs) {
            if (node.hasAttribute && node.hasAttribute(attr)) {
                const val = node.getAttribute(attr);
                const translated = getTranslatedText(val);
                if (translated && translated !== val) {
                    node.setAttribute(attr, translated);
                }
            }
        }
        // 针对 button / input[type=button|submit|reset] 的 value 属性
        const tag = node.tagName ? node.tagName.toUpperCase() : '';
        if (tag === 'INPUT' && (node.type === 'button' || node.type === 'submit' || node.type === 'reset')) {
            const val = node.value;
            const translated = getTranslatedText(val);
            if (translated && translated !== val) {
                node.value = translated;
            }
        }
    }

    // 2. 处理文本子节点
    if (node.nodeType === 3) { // TEXT_NODE
        const val = node.nodeValue;
        const translated = getTranslatedText(val);
        if (translated && translated !== val) {
            node.nodeValue = translated;
        }
        return;
    }

    // 3. 递归遍历子节点
    if (node.childNodes && node.childNodes.length > 0) {
        const children = Array.from(node.childNodes);
        for (let i = 0; i < children.length; i++) {
            translateDOMNode(children[i]);
        }
    }
}

// ---------------------------------------------------------------------------
// 6. 启动 DOM 监听与高效防抖动态汉化引擎
// ---------------------------------------------------------------------------
function initLocalizationEngine() {
    // 初始全量翻译
    if (document.body) {
        translateDOMNode(document.body);
    }

    // 防抖批量处理队列
    let pendingNodes = new Set();
    let scheduled = false;

    const flushQueue = () => {
        scheduled = false;
        const nodes = Array.from(pendingNodes);
        pendingNodes.clear();
        for (const node of nodes) {
            if (document.contains(node)) {
                translateDOMNode(node);
            }
        }
    };

    const scheduleTranslation = (node) => {
        pendingNodes.add(node);
        if (!scheduled) {
            scheduled = true;
            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(flushQueue);
            } else {
                setTimeout(flushQueue, 16);
            }
        }
    };

    // 监听 DOM 变动 (childList, characterData, attributes)
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const addedNode of mutation.addedNodes) {
                    if (!shouldSkipNode(addedNode)) {
                        scheduleTranslation(addedNode);
                    }
                }
            } else if (mutation.type === 'characterData') {
                const parent = mutation.target.parentNode;
                if (parent && !shouldSkipNode(parent)) {
                    scheduleTranslation(mutation.target);
                }
            } else if (mutation.type === 'attributes') {
                if (!shouldSkipNode(mutation.target)) {
                    scheduleTranslation(mutation.target);
                }
            }
        }
    });

    const rootTarget = document.documentElement || document.body;
    if (rootTarget) {
        observer.observe(rootTarget, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-title', 'data-placeholder', 'value'],
        });
    }
}

// DOM 加载就绪时自动启动
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLocalizationEngine);
    } else {
        initLocalizationEngine();
    }
    window.addEventListener('load', initLocalizationEngine);
}
