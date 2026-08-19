"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Preload script — runs in every BrowserWindow before the page loads.
 * Exposes a minimal, secure API via contextBridge so the renderer can
 * communicate with the main-process auto-updater without nodeIntegration.
 * 
 * 同时也内置 Antigravity 界面动态汉化引擎，全面本地化应用内 Web 界面。
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
// 2. Web UI In-App Dynamic Localization Engine
// ---------------------------------------------------------------------------
const I18N_DICT = {
  "Conversations": "对话列表",
  "Conversation": "对话",
  "Conversation History": "对话历史",
  "New Conversation": "新建对话",
  "New conversation": "新建对话",
  "Untitled Conversation": "未命名对话",
  "Pinned Conversations": "置顶对话",
  "Workspaces": "工作区列表",
  "Workspace": "工作区",
  "New Workspace": "新建工作区",
  "Add Workspace": "添加工作区",
  "Archive Workspace": "归档工作区",
  "Projects": "项目列表",
  "Project": "项目",
  "New Project": "新建项目",
  "Select Project": "选择项目",
  "Project Settings": "项目设置",
  "Project General": "项目通用设置",
  "Project Agent": "项目智能体",
  "Project Folders": "项目文件夹",
  "New Worktree": "新建工作树",
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
  "Account": "账号",
  "General": "通用",
  "Inherit General": "继承通用设置",
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
  "Request Review": "请求审核",
  "Require Review": "需要审核",
  "Deny": "拒绝",
  "Proceed in Sandbox": "在沙箱中继续",
  "Terminal Commands": "终端命令",
  "Commands Outside Sandbox": "沙箱外部命令",
  "Read URLs": "读取 URL",
  "Execute URLs": "执行 URL",
  "Read URL": "读取 URL",
  "Enable Sandbox Mode": "启用沙箱模式",
  "Enable Sandbox Mode (Preview)": "启用沙箱模式（预览）",
  "Sandbox Allow Network": "沙箱允许联网",
  "Disabled by organization policy": "已被组织策略禁用",
  "Thinking": "思考中",
  "Thought": "思考过程",
  "System Message": "系统消息",
  "System Prompt": "系统提示词",
  "Prompt": "提示词",
  "Custom Agents": "自定义智能体",
  "Subagent": "子智能体",
  "Stop Subagent": "停止子智能体",
  "No subagents": "无子智能体",
  "Queued Messages": "排队中的消息",
  "Accept Step": "接受步骤",
  "Cancel step": "取消步骤",
  "Review Changes": "审查更改",
  "View Diff": "查看差异",
  "View Stacked Diff": "查看堆叠差异",
  "View Split Diff": "查看分屏差异",
  "Files Changed": "已修改文件",
  "Agent Edits": "智能体编辑",
  "Explain and Fix in Current Conversation": "在当前对话中解释并修复",
  "Fork Conversation": "派生对话",
  "Fork in current workspace": "在当前工作区派生",
  "Archive this conversation": "归档此对话",
  "Delete Conversation": "删除对话",
  "Find in conversation": "在对话中查找",
  "Copy conversation markdown": "复制对话 Markdown",
  "Start Voice Recording": "开始语音录音",
  "Stop Voice Recording": "停止语音录音",
  "Toggle Voice Recording": "切换语音录音",
  "Add to Chat": "添加到对话",
  "Terminal: Add to Chat": "终端: 添加到对话",
  "Add Context": "添加上下文",
  "Add Handler": "添加处理器",
  "My Stuff": "我的内容",
  "Theme": "主题",
  "Dark": "深色",
  "Light": "浅色",
  "Default Dark": "默认深色",
  "Default Light": "默认浅色",
  "System": "跟随系统",
  "Zoom In": "放大",
  "Zoom Out": "缩小",
  "Reset Zoom": "重置缩放",
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
  "Retry": "重试",
  "Try again": "重试",
  "Submit": "提交",
  "Proceed": "继续",
  "Dismiss": "忽略",
  "Close": "关闭",
  "Close Tab": "关闭标签页",
  "Open": "打开",
  "Open in new tab": "在新标签页中打开",
  "Open IDE": "打开 IDE",
  "Show in File Explorer": "在文件资源管理器中显示",
  "Download Diagnostics": "下载诊断信息",
  "Mark as Read": "标记为已读",
  "More actions": "更多操作",
  "Remove From Split": "从分屏中移除",
  "Split Conversation Vertically": "垂直分屏对话",
  "Split Conversation Horizontally": "水平分屏对话",
  "New Terminal Tab": "新建终端标签页",
  "New Editor Window": "新建编辑器窗口",
  "File Picker": "文件选择器",
  "Focus Input": "聚焦输入框",
  "Find in Pane": "在窗格中查找",
  "Select Next Conversation": "选择下一个对话",
  "Select Previous Conversation": "选择上一个对话",
  "Next match (Enter)": "下一个匹配项 (Enter)",
  "Got it": "知道了",
  "See more": "展开更多",
  "See less": "收起",
  "Good response": "满意",
  "Bad response": "不满意",
  "Provide Feedback": "提供反馈",
  "Provide feedback": "提供反馈",
  "Submit Appeal": "提交申诉",
  "Having trouble? Let us know": "遇到问题？向我们反馈",
  "In Progress": "进行中",
  "Running": "正在运行",
  "Success, Continuing...": "成功，继续执行...",
  "Awaiting Authentication...": "等待授权认证...",
  "Update Available": "有可用更新",
  "Quick Start": "快速入门",
  "Learn more": "了解更多",
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
  "Notifications": "通知",
  "Search": "搜索",
  "Clear": "清空",
  "Filter": "筛选",
  "Files": "文件",
  "Terminal": "终端",
  "Editor": "编辑器",
  "Browser": "浏览器",
  "Code Search": "代码搜索",
  "Background Task": "后台任务",
  "Background Task Output": "后台任务输出",
  "Scheduled Tasks": "计划任务",
  "Needs attention": "需要处理",
  "Continue with Google": "使用 Google 账号继续",
  "Continue with different account": "使用其他账号继续",
  "Terms of Service": "服务条款",
  "Privacy Policy": "隐私政策",
  "Auto (detected)": "自动（已检测）",
  "Full machine": "全功能模式",
  "Turbo mode": "极速模式",
  "Inherits your General settings when working in this project.": "在此项目中工作时继承您的通用设置。",
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
  "Include Jetski Default Customizations": "包含默认自定义配置",
  "Enable Personal Customizations": "启用个人自定义配置",
  "Enable Remote Control": "启用远程控制",
  "Enable Demo Mode (Beta)": "启用演示模式（测试版）",
  "Enter file or directory path...": "输入文件或目录路径...",
  "Enter URL pattern...": "输入 URL 匹配规则...",
  "Enter tool name or server...": "输入工具名称或服务器...",
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
  "Help": "帮助",
  "Documentation": "官方文档",
  "Feedback": "反馈",
  "Send Feedback": "发送反馈",
  "Report an Issue": "报告问题",
  "Keyboard Shortcuts": "快捷键",
  "Command Palette": "命令面板",
  "File Explorer": "文件资源管理器",
  "Source Control": "源代码管理",
  "Branches": "分支",
  "Commits": "提交记录",
  "Diff": "差异",
  "New Terminal": "新建终端",
  "Clear Terminal": "清空终端",
  "Kill Terminal": "终止终端",
  "Run Command": "运行命令",
  "Execute": "执行",
  "Output": "输出",
  "Console": "控制台",
  "Problems": "问题",
  "Diagnostics": "诊断",
  "Search everywhere": "全局搜索",
  "Type to search...": "输入以搜索...",
  "Search files...": "搜索文件...",
  "Search commands...": "搜索命令...",
  "Ask a question or enter a task...": "输入您的问题或任务指令...",
  "Type a message...": "输入消息...",
  "Type / for commands...": "输入 / 查看可用命令...",
  "No results found": "未找到匹配结果",
  "No items found": "暂无内容",
  "No data available": "无可用数据",
  "Nothing to show": "暂无内容显示",
  "Select a model": "选择模型",
  "Select an agent": "选择智能体",
  "Select workspace": "选择工作区",
  "Select file": "选择文件",
  "Select folder": "选择文件夹",
  "Browse...": "浏览...",
  "Choose folder": "选择文件夹",
  "Open Folder": "打开文件夹",
  "Open File": "打开文件",
  "Recent Workspaces": "最近工作区",
  "Recent Conversations": "最近对话",
  "Clear History": "清空历史",
  "Clear All": "清空全部",
  "Remove Workspace": "移除工作区",
  "Rename Conversation": "重命名对话",
  "Export Conversation": "导出对话",
  "Share Conversation": "分享对话",
  "Copy Link": "复制链接",
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
  "minutes ago": "分钟前",
  "hours ago": "小时前",
  "days ago": "天前",
  "seconds ago": "秒前",
  "Version": "版本",
  "Current Version": "当前版本",
  "Latest Version": "最新版本",
  "Up to date": "已是最新版本",
  "Checking for updates...": "正在检查更新...",
  "Downloading update...": "正在下载更新...",
  "Restart to update": "重启以更新",
  "Preferences": "偏好设置",
  "User Settings": "用户设置",
  "Workspace Settings": "工作区设置",
  "Default Settings": "默认设置",
  "Reset to Default": "恢复默认值",
  "Save Changes": "保存更改",
  "Discard Changes": "放弃更改",
  "Unsaved Changes": "未保存的更改",
  "Are you sure?": "您确定吗？",
  "This action cannot be undone.": "此操作无法撤销。"
};

// 辅助函数：根据词典翻译字符串
function getTranslatedText(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) return null;
    if (I18N_DICT[trimmed]) {
        return raw.replace(trimmed, I18N_DICT[trimmed]);
    }
    // 动态正则匹配处理（如 "N agents running" 等）
    if (/^(\d+)\s+agents?\s+running$/i.test(trimmed)) {
        const num = trimmed.match(/^(\d+)/)[1];
        return raw.replace(trimmed, `${num} 个智能体正在运行`);
    }
    if (/^(\d+)\s+of\s+(\d+)\s+selected$/i.test(trimmed)) {
        const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
        return raw.replace(trimmed, `已选择 ${m[1]} / ${m[2]}`);
    }
    if (/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
        const m = trimmed.match(/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i);
        return raw.replace(trimmed, `思考耗时 ${m[1]}`);
    }
    return null;
}

// 检查节点是否应被跳过（如代码块、编辑器、输入框用户内容等）
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
        node.classList.contains('cm-editor')
    )) {
        return true;
    }
    if (node.closest && (
        node.closest('.monaco-editor') ||
        node.closest('.prism-code') ||
        node.closest('pre') ||
        node.closest('code') ||
        node.closest('.xterm') ||
        node.closest('[contenteditable="true"]')
    )) {
        return true;
    }
    return false;
}

// 递归翻译单个元素及其子节点
function translateDOMNode(node) {
    if (!node || shouldSkipNode(node)) return;

    // 1. 处理元素自身属性 (placeholder, title, aria-label, tooltip)
    if (node.nodeType === 1) { // ELEMENT_NODE
        const attrs = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-title'];
        for (const attr of attrs) {
            if (node.hasAttribute && node.hasAttribute(attr)) {
                const val = node.getAttribute(attr);
                const translated = getTranslatedText(val);
                if (translated && translated !== val) {
                    node.setAttribute(attr, translated);
                }
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

// 启动 DOM 监听与翻译引擎
function initLocalizationEngine() {
    // 初始全量翻译
    if (document.body) {
        translateDOMNode(document.body);
    }

    // 防抖批量处理
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

    // 监听 DOM 变动
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
            attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-title'],
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
