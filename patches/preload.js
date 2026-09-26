"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Antigravity 桌面端全方位双层深度汉化引擎 (Preload & Main-World Bridge)
 * 融合工业级高吞吐算力、微任务调度、React Virtual DOM 深度挂钩与绝对物理免疫沙盒
 */
const electron_1 = require("electron");

// ---------------------------------------------------------------------------
// 1. ContextBridge APIs (保持与官方 2.17.0+ 架构完全一致)
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

// Antigravity 2.17.0+ WSL 状态 API
const wslAPI = {
    status: (callback) => {
        const handler = (_event, message) => {
            callback(message);
        };
        electron_1.ipcRenderer.on('wsl:status', handler);
        return () => {
            electron_1.ipcRenderer.removeListener('wsl:status', handler);
        };
    },
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
electron_1.contextBridge.exposeInMainWorld('wsl', wslAPI);

// ---------------------------------------------------------------------------
// 2. 全量汉化字典占位符 (由 Patcher 注入时自动扫描并合并 patches/locales/zh-CN/ 模块化词典)
// ---------------------------------------------------------------------------
const I18N_DICT = /*__I18N_DICT_PLACEHOLDER__*/{};

// ---------------------------------------------------------------------------
// 3. Main World 注入函数（运行在页面 JS 主上下文中，深度挂钩 React.createElement 与 DOM）
// ---------------------------------------------------------------------------
function injectedMainWorldScript(DICT) {
    if (window.__AGY_CN_INITIALIZED__) return;
    window.__AGY_CN_INITIALIZED__ = true;

    // 核心高频词汇表（用于单次流式联合正则扫描）
    const coreWords = {
        "cancel": "取消", "close": "关闭", "open": "打开", "save": "保存",
        "edit": "编辑", "delete": "删除", "remove": "移除", "clear": "清除",
        "copy": "复制", "paste": "粘贴", "cut": "剪切", "select": "选择",
        "all": "全部", "view": "查看", "file": "文件", "folder": "文件夹",
        "path": "路径", "name": "名称", "type": "类型", "size": "大小",
        "status": "状态", "error": "错误", "warning": "警告", "info": "信息",
        "help": "帮助", "about": "关于", "version": "版本", "update": "更新",
        "install": "安装", "uninstall": "卸载", "enable": "启用", "disable": "禁用",
        "active": "活跃", "running": "运行中", "stopped": "已停止", "paused": "已暂停",
        "finished": "已完成", "completed": "已完成", "failed": "已失败", "success": "成功",
        "project": "项目", "workspace": "工作区", "branch": "分支", "commit": "提交",
        "model": "模型", "agent": "智能体", "task": "任务", "step": "步骤",
        "code": "代码", "diff": "差异", "terminal": "终端", "output": "输出",
        "log": "日志", "logs": "日志", "config": "配置", "settings": "设置",
        "tools": "工具", "skills": "技能", "rules": "规则", "hooks": "钩子",
        "run": "运行", "stop": "停止", "retry": "重试", "apply": "应用",
        "ok": "确定", "yes": "是", "no": "否", "back": "返回", "next": "下一步",
        "add": "添加", "create": "创建", "new": "新建", "reset": "重置",
        "refresh": "刷新", "loading": "加载中", "connecting": "连接中",
        "connected": "已连接", "disconnected": "已断开", "tokens": "Tokens",
        "budget": "预算", "usage": "用量", "rate": "速率", "limit": "限额",
        "quota": "配额", "tier": "档位", "preset": "预设", "mode": "模式",
        "preview": "预览", "detail": "详情", "details": "详情", "overview": "概览",
        "summary": "摘要", "history": "历史", "recent": "最近", "starred": "收藏",
        "pinned": "置顶", "custom": "自定义", "default": "默认", "none": "无",
        "auto": "自动", "manual": "手动", "allow": "允许", "deny": "拒绝",
        "ask": "询问", "always": "始终", "never": "从不", "options": "选项",
        "preferences": "偏好设置", "appearance": "外观", "theme": "主题",
        "light": "浅色", "dark": "深色", "system": "跟随系统",
        "send": "发送", "queue": "排队", "undo": "撤销", "redo": "重做",
        "fork": "派生", "split": "分屏", "group": "分组", "amend": "追加提交",
        "thought": "思考", "thinking": "思考中", "worked": "总耗时",
        "searched": "已搜索", "canceled": "已取消", "explore": "探索",
        "search": "搜索", "change": "更改", "changes": "更改",
        "turn": "回合", "turns": "回合", "analyzed": "已分析", "analyzing": "分析中",
        "advanced": "高级", "collapse": "折叠", "expand": "展开",
        "global": "全局", "inherits": "继承", "wsl": "WSL", "distro": "发行版"
    };

    // 性能优化 1：预编译全小写 Map 索引表，强制收敛为 O(1)
    const lowerDictionary = new Map();
    for (const [k, v] of Object.entries(DICT)) {
        lowerDictionary.set(k.toLowerCase(), v);
    }
    for (const [k, v] of Object.entries(coreWords)) {
        const lk = k.toLowerCase();
        if (!lowerDictionary.has(lk)) {
            lowerDictionary.set(lk, v);
        }
    }

    // 性能优化 2：动态正则运算缓存（有界 LRU-like Map，最高 5000 条）
    const stringCache = new Map();
    const MAX_STRING_CACHE = 5000;

    const escapeRegExp = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // 性能优化 3：启动时一次性预编译联合词边界流式正则
    const sortedCoreKeys = Object.keys(coreWords)
        .sort((a, b) => b.length - a.length)
        .filter(w => w.length > 2 || /^[a-zA-Z0-9]+$/.test(w));
    const escapedCoreUnion = sortedCoreKeys.map(w => escapeRegExp(w)).join('|');
    const CORE_WORDS_UNION_REGEX = new RegExp('\\b(' + escapedCoreUnion + ')\\b', 'gi');

    // 提及菜单 (@ Mentions) 分类白名单
    const MENTION_CATEGORIES = new Set([
        'Rules', '规则', 'Conversation', '对话',
        'PDF Document', 'PDF 文档', 'MCP Resource', 'MCP 资源',
        'Browser Page', '浏览器页面', 'Browser Text', '浏览器文本',
        'Directory', '目录', 'Git Commit', 'Git 提交', 'Git Diff', 'Git 差异'
    ]);

    // 类名过滤正则（代码编辑器、终端、语法高亮）
    const codeClassPattern = /(?:^|[\s_-])(monaco-editor|editor-instance|hljs|shiki|prism|codemirror|line-content|gutter|codeblock|code-block|code-line|view-line)(?:$|[\s_-])/i;

    function translateText(text) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (!trimmed) return text;

        // 性能优化 4：极速短路。纯中文/数字/符号内容瞬间 0 开销返回
        if (!/[a-zA-Z]/.test(trimmed)) {
            return text;
        }

        // 极速缓存查询 (O(1))
        if (stringCache.has(trimmed)) {
            return text.replace(trimmed, stringCache.get(trimmed));
        }

        // -------------------------------------------------------------------
        // 动态语法与状态流匹配 (Dynamic Regex Handlers)
        // -------------------------------------------------------------------
        let dynamicMatch = trimmed;
        let isDynamic = false;

        // WSL 环境与部署弹窗
        if (/^Setting up WSL:\s*(.+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Setting up WSL:\s*(.+)$/i, '正在配置 WSL: $1');
            isDynamic = true;
        } else if (/^Installing into\s*(.+?)[…\.]*$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Installing into\s*(.+?)[…\.]*$/i, '正在安装到 $1…');
            isDynamic = true;
        } else if (/^Connected to WSL:\s*(.+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Connected to WSL:\s*(.+)$/i, '已连接到 WSL: $1');
            isDynamic = true;
        } else if (/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i, '此文件夹属于 WSL 发行版“$1”，但当前窗口连接到“$2”。');
            isDynamic = true;
        } else if (/^This location cannot be opened in WSL:\s*(.+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^This location cannot be opened in WSL:\s*(.+)$/i, '无法在 WSL 中打开此位置: $1');
            isDynamic = true;
        } else if (/^The WSL distro "([^"]+)" is no longer installed\.?$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^The WSL distro "([^"]+)" is no longer installed\.?$/i, 'WSL 发行版“$1”已不再安装。');
            isDynamic = true;
        } else if (/^Antigravity opened on Windows instead\.?$/i.test(trimmed)) {
            dynamicMatch = 'Antigravity 已改为在 Windows 本地打开。';
            isDynamic = true;
        }

        // 计划模式与引导提示
        if (!isDynamic && /(?:Type|输入)\s*\/\s*(?:and|并|和)?\s*(?:select|选择)?\s*['"]?plan['"]?\s*to\s+have\s+the\s+agent\s+generate\s+a\s+plan[。.]?/i.test(trimmed)) {
            dynamicMatch = /[。.]\s*$/.test(trimmed) ? '输入 / 并选择 plan 来让智能体生成计划。' : '输入 / 并选择 plan 来让智能体生成计划';
            isDynamic = true;
        } else if (!isDynamic && /^(?:to\s+)?have\s+the\s+agent\s+generate\s+a\s+plan[。.]?$/i.test(trimmed)) {
            dynamicMatch = /[。.]\s*$/.test(trimmed) ? '来让智能体生成计划。' : '来让智能体生成计划';
            isDynamic = true;
        } else if (!isDynamic && /^plan\s+to\s+have\s+the\s+agent\s+generate\s+a\s+plan[。.]?$/i.test(trimmed)) {
            dynamicMatch = /[。.]\s*$/.test(trimmed) ? 'plan 来让智能体生成计划。' : 'plan 来让智能体生成计划';
            isDynamic = true;
        } else if (!isDynamic && /^(?:Type|输入)\s*\/\s*(?:and|并|和)\s*$/i.test(trimmed)) {
            dynamicMatch = '输入 / 并';
            isDynamic = true;
        }

        // 思考耗时与总时间
        if (!isDynamic && /^(?:Thought|Thinking)\s+(?:for|持续)\s*(.+)$/i.test(trimmed)) {
            const m = trimmed.match(/^(?:Thought|Thinking)\s+(?:for|持续)\s*(.+)$/i);
            const timeSec = m[1].replace(/seconds?/i, '秒').replace(/s\b/i, ' 秒');
            dynamicMatch = '思考了 ' + timeSec;
            isDynamic = true;
        } else if (!isDynamic && /^Worked\s+(?:for|持续)\s*(.+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Worked\s+(?:for|持续)\s*(.+)$/i, '总耗时 $1');
            isDynamic = true;
        } else if (!isDynamic && /^Thinking\s*\((.+)\)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Thinking\s*\((.+)\)$/i, '正在思考 ($1)');
            isDynamic = true;
        }

        // 步骤与回合
        if (!isDynamic && /^Step\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Step\s+(\d+)\s+of\s+(\d+)$/i);
            dynamicMatch = '步骤 ' + m[1] + ' / ' + m[2];
            isDynamic = true;
        } else if (!isDynamic && /^Step\s+(\d+)\s*\(([^)]+)\):?$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Step\s+(\d+)\s*\(([^)]+)\):?/i, '步骤 $1 ($2)：');
            isDynamic = true;
        } else if (!isDynamic && /^(\d+)\s+turns?$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^(\d+)\s+turns?$/i, '$1 回合');
            isDynamic = true;
        } else if (!isDynamic && /^Turn\s+(\d+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Turn\s+(\d+)$/i, '第 $1 回合');
            isDynamic = true;
        }

        // 文件与改动计数
        if (!isDynamic && /^(\d+)\s+files?\s+changed(.*)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^(\d+)\s+files?\s+changed(.*)/i, '$1 个文件已更改$2');
            isDynamic = true;
        } else if (!isDynamic && /^(\d+)\s+searches?$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^(\d+)\s+searches?/i, '$1 次搜索');
            isDynamic = true;
        } else if (!isDynamic && /^Edited\s+(.*)\s+\+(\d+)\s+-(\d+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Edited\s+(.*)\s+\+(\d+)\s+-(\d+)/i, '编辑 $1 (+$2 -$3)');
            isDynamic = true;
        } else if (!isDynamic && /^(\d+)\s+(lines?\s+added|lines?\s+removed|matches?\s+found|results?)$/i.test(trimmed)) {
            const m = trimmed.match(/^(\d+)\s+(lines?\s+added|lines?\s+removed|matches?\s+found|results?)$/i);
            const num = m[1];
            const type = m[2].toLowerCase();
            if (type.includes('added')) dynamicMatch = '添加了 ' + num + ' 行';
            else if (type.includes('removed')) dynamicMatch = '删除了 ' + num + ' 行';
            else if (type.includes('matches')) dynamicMatch = '找到 ' + num + ' 个匹配项';
            else dynamicMatch = num + ' 条结果';
            isDynamic = true;
        }

        // 额度与刷新倒计时
        if (!isDynamic && /^(Weekly|Five[- ]Hour|5[- ]Hour|Hourly|Daily)\s+Limit\s+Remaining$/i.test(trimmed)) {
            const lower = trimmed.toLowerCase();
            if (lower.includes('weekly')) dynamicMatch = '每周限额剩余';
            else if (lower.includes('five') || lower.includes('5')) dynamicMatch = '5 小时限额剩余';
            else if (lower.includes('hourly')) dynamicMatch = '每小时限额剩余';
            else if (lower.includes('daily')) dynamicMatch = '每日限额剩余';
            isDynamic = true;
        } else if (!isDynamic && /(?:You have used some of your|您已使用了部分).*(?:limit|限额)/i.test(trimmed)) {
            dynamicMatch = trimmed
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:weekly|每周)\s*(?:limit|限额)?/i, '您已使用了部分每周限额')
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:5[- ]hour|five[- ]hour|5 小时|五小时)\s*(?:limit|限额)?/i, '您已使用了部分 5 小时限额')
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:hourly|每小时)\s*(?:limit|限额)?/i, '您已使用了部分每小时限额')
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:daily|每日)\s*(?:limit|限额)?/i, '您已使用了部分每日限额')
                .replace(/(?:it will fully refresh in|它将在以下时间后完全刷新[：:]?)\s*/i, ' 它将在以下时间后完全刷新：')
                .replace(/(\d+)\s*days?/gi, ' $1 天')
                .replace(/(\d+)\s*hours?/gi, ' $1 小时')
                .replace(/(\d+)\s*minutes?\.?$/gi, ' $1 分钟')
                .replace(/\s+/g, ' ')
                .trim();
            isDynamic = true;
        } else if (!isDynamic && /^(\d+(?:\.\d+)?%?)\s+remaining$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^(\d+(?:\.\d+)?%?)\s+remaining$/i, '$1 剩余');
            isDynamic = true;
        }

        // 自定义额度与百分比
        if (!isDynamic && /% of the (?:customization )?budget is (?:available|used)/i.test(trimmed)) {
            if (/available/i.test(trimmed)) {
                dynamicMatch = trimmed.replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is available[.。]?/i, '自定义额度尚有 $1% 可用。');
            } else if (/used/i.test(trimmed)) {
                dynamicMatch = trimmed.replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is used[.。]?/i, '已使用 $1% 的自定义额度。');
            }
            isDynamic = true;
        }

        // 历史与相对时间
        if (!isDynamic && /^(\d+)\s+(seconds?|minutes?|hours?|days?)\s+ago$/i.test(trimmed)) {
            const m = trimmed.match(/^(\d+)\s+(seconds?|minutes?|hours?|days?)\s+ago$/i);
            const units = { s: '秒前', m: '分钟前', h: '小时前', d: '天前' };
            dynamicMatch = m[1] + ' ' + (units[m[2][0].toLowerCase()] || '');
            isDynamic = true;
        } else if (!isDynamic && /^Updated\s+(.+)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Updated\s+(.+)$/i, '更新于 $1')
                .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/gi, (_m, mon, day) => {
                    const monMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
                    return monMap[mon.toLowerCase()] + '月' + day + '日';
                });
            isDynamic = true;
        }

        // 快捷键提示
        if (!isDynamic) {
            const shortcutMatch = trimmed.match(/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)\s+(Queues after the turn|Sends immediately|On empty prompt,\s*sends next in queue)$/i);
            if (shortcutMatch) {
                const key = shortcutMatch[1];
                const act = shortcutMatch[2].toLowerCase();
                const actCn = act.startsWith('queues') ? ' 本轮结束后排队' : (act.startsWith('sends') ? ' 立即发送' : ' 输入为空时，发送队列中的下一条消息');
                dynamicMatch = key + actCn;
                isDynamic = true;
            }
        }

        if (isDynamic) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, dynamicMatch);
            return text.replace(trimmed, dynamicMatch);
        }

        // -------------------------------------------------------------------
        // 词典精确匹配与大小写降级 (Dictionary Lookup)
        // -------------------------------------------------------------------
        if (DICT[trimmed]) {
            return text.replace(trimmed, DICT[trimmed]);
        }

        const trimmedLower = trimmed.toLowerCase();
        if (lowerDictionary.has(trimmedLower)) {
            const res = lowerDictionary.get(trimmedLower);
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, res);
            return text.replace(trimmed, res);
        }

        // 空格规范化匹配（针对包含换行或多空格的卡片）
        const normalizedSpace = trimmed.replace(/\s+/g, ' ');
        if (DICT[normalizedSpace]) {
            return text.replace(trimmed, DICT[normalizedSpace]);
        }
        if (lowerDictionary.has(normalizedSpace.toLowerCase())) {
            const res = lowerDictionary.get(normalizedSpace.toLowerCase());
            return text.replace(trimmed, res);
        }

        // -------------------------------------------------------------------
        // 标点符号智能剥离与重新组装
        // -------------------------------------------------------------------
        let core = trimmed;
        let trailPunc = '';
        const puncRegex = /(\.\.\.|…|\.|\?|!|:|：|？|！|。)$/;
        const puncMatch = core.match(puncRegex);
        if (puncMatch) {
            const matchPunc = puncMatch[0];
            core = core.slice(0, -matchPunc.length).trim();
            if (matchPunc === '.') trailPunc = '。';
            else if (matchPunc === '?') trailPunc = '？';
            else if (matchPunc === '!') trailPunc = '！';
            else if (matchPunc === ':') trailPunc = '：';
            else trailPunc = matchPunc;
        }

        const coreLower = core.toLowerCase();
        if (DICT[core] || lowerDictionary.has(coreLower)) {
            const trans = DICT[core] || lowerDictionary.get(coreLower);
            const fullTrans = trans + trailPunc;
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fullTrans);
            return text.replace(trimmed, fullTrans);
        }

        // -------------------------------------------------------------------
        // 短词流式联合分词 (<= 3 words, 严禁污染纯长句与已汉化词)
        // -------------------------------------------------------------------
        if (/[\u4e00-\u9fa5]/.test(core)) {
            return text; // 包含中文的混合词条直接保持，杜绝二次破坏
        }
        const wordsCount = core.split(/\s+/).filter(Boolean).length;
        if (wordsCount > 3) {
            return text; // 长句未命中保持原样，杜绝机翻生硬乱码
        }

        let replaced = false;
        let temp = core.replace(CORE_WORDS_UNION_REGEX, (matched) => {
            const lk = matched.toLowerCase();
            if (coreWords[lk]) {
                replaced = true;
                return coreWords[lk];
            }
            return matched;
        });

        if (replaced) {
            let finalTranslated = temp.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2') + trailPunc;
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, finalTranslated);
            return text.replace(trimmed, finalTranslated);
        }

        return text;
    }

    // -----------------------------------------------------------------------
    // 物理安全免疫沙盒 (Skip Rules & Sandbox)
    // -----------------------------------------------------------------------
    const skipCache = new WeakMap();

    function shouldSkipNode(node) {
        if (!node) return true;
        const element = node.nodeType === 3 ? node.parentElement : node; // 3 === Node.TEXT_NODE
        if (!element) return false;

        if (skipCache.has(element)) {
            return skipCache.get(element);
        }

        // 1. 绝对不能翻译的脚本与原样文本标签
        const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'KBD', 'SAMP', 'VAR'];
        if (skipTags.includes(element.tagName)) {
            skipCache.set(element, true);
            return true;
        }

        // 2. 斜杠命令原生触发词保护 (保持 /boost, /goal, /plan 等纯英文字符，放行 @ 提及分类)
        const isMenuOptionLabel = element.closest && element.closest('[data-testid="menu-option-label"]');
        if (isMenuOptionLabel) {
            const labelText = (isMenuOptionLabel.innerText || isMenuOptionLabel.textContent || '').trim();
            if (MENTION_CATEGORIES.has(labelText)) {
                skipCache.set(element, false);
                return false;
            }
            skipCache.set(element, true);
            return true;
        }

        // 3. 思考过程展开触发药丸放行，但正文容器绝对跳过
        const isThinkingTrigger = element.closest && element.closest('button[data-testid="thinking-collapsible-trigger"]');
        if (isThinkingTrigger) {
            skipCache.set(element, false);
            return false;
        }

        // 特殊特权放行：针对执行步骤的药丸标签（如 Ran, Explored, Edited, Viewed, Thought, Thinking, Working 等）
        // 无论其父级为 SPAN、CODE 还是 BUTTON，只要是系统执行药丸且不在用户提问气泡内，一律无条件放行汉化
        const textContent = (element.innerText || element.textContent || '').trim();
        const isActionPill = textContent.length <= 25 && /^(Explored|Ran|Viewed|Edited|Thought|Thinking|Working)$/i.test(textContent);
        if (isActionPill) {
            let inUserInput = false;
            let inThinkingContent = false;
            let checkCur = element;
            while (checkCur && checkCur !== document.body) {
                if (checkCur.classList) {
                    if (checkCur.classList.contains('group/user-input-step') || checkCur.classList.contains('cursor-edit')) {
                        inUserInput = true;
                        break;
                    }
                    if (checkCur.classList.contains('thought-content') ||
                        checkCur.classList.contains('thinking-content') ||
                        checkCur.classList.contains('thought-box')) {
                        inThinkingContent = true;
                        break;
                    }
                }
                if (checkCur.parentElement && checkCur.parentElement.querySelector) {
                    const trigger = checkCur.parentElement.querySelector(':scope > button[data-testid="thinking-collapsible-trigger"]');
                    if (trigger && checkCur !== trigger && !trigger.contains(checkCur)) {
                        inThinkingContent = true;
                        break;
                    }
                }
                checkCur = checkCur.parentElement;
            }
            if (!inUserInput && !inThinkingContent) {
                skipCache.set(element, false);
                return false;
            }
        }

        if (element.tagName === 'CODE') {
            if (!isActionPill) {
                skipCache.set(element, true);
                return true;
            }
        }
        if (element.tagName === 'PRE') {
            skipCache.set(element, true);
            return true;
        }

        // 4. 输入框/文本域/富文本编辑器/用户提问气泡绝对跳过
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            skipCache.set(element, true);
            return true;
        }
        if (element.getAttribute && (
            element.getAttribute('contenteditable') === 'true' ||
            element.getAttribute('role') === 'textbox' ||
            element.getAttribute('data-lexical-editor') === 'true'
        )) {
            skipCache.set(element, true);
            return true;
        }

        // 5. 祖先链路记忆化递归检查
        let cur = element;
        let shouldSkip = false;
        while (cur && cur !== document.body) {
            if (skipCache.has(cur)) {
                shouldSkip = skipCache.get(cur);
                break;
            }

            // 核心防御：模型思考链正文容器绝对免疫（防止流式英文 Token 被逐词误篡改）
            if (cur.classList && (
                cur.classList.contains('cursor-edit') ||
                cur.classList.contains('thought-content') ||
                cur.classList.contains('thinking-content') ||
                cur.classList.contains('thought-box')
            )) {
                shouldSkip = true;
                break;
            }

            // 思考正文折叠区域邻近检查（位于 thinking-collapsible-trigger 旁的展开正文容器）
            if (cur.parentElement && cur.parentElement.querySelector) {
                const trigger = cur.parentElement.querySelector(':scope > button[data-testid="thinking-collapsible-trigger"]');
                if (trigger && cur !== trigger && !trigger.contains(cur)) {
                    shouldSkip = true;
                    break;
                }
            }

            // 用户输入步骤与提问气泡
            if (cur.classList && (
                cur.classList.contains('group/user-input-step') ||
                cur.classList.contains('user-message') ||
                cur.classList.contains('chat-input')
            )) {
                shouldSkip = true;
                break;
            }

            // 编辑器与代码块
            if (cur.tagName === 'PRE' || cur.tagName === 'CODE') {
                shouldSkip = true;
                break;
            }
            if (cur.className && typeof cur.className === 'string') {
                if (codeClassPattern.test(cur.className)) {
                    shouldSkip = true;
                    break;
                }
            }

            cur = cur.parentElement;
        }

        skipCache.set(element, shouldSkip);
        return shouldSkip;
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
                get() { return titleDesc.get.call(document); },
                set(val) { origSet.call(document, translateText(val)); }
            });
        }
    } catch (_) {}

    // -----------------------------------------------------------------------
    // DOM 调度层 (Layer 2: 微任务聚合、WeakSet 记忆化与祖先剪枝)
    // -----------------------------------------------------------------------
    const translatedNodes = new WeakSet();
    const observedRoots = new WeakSet();
    const pendingAddedNodes = new Set();
    const pendingTextNodes = new Set();
    const pendingAttrNodes = new Map();
    let isBatchScheduled = false;

    function translateNode(node) {
        if (!node) return;
        if (shouldSkipNode(node)) return;

        if (node.nodeType === 3) { // Text node
            if (translatedNodes.has(node)) return;
            const original = node.nodeValue;
            if (!original || !original.trim()) return;
            const translated = translateText(original);
            if (original !== translated) {
                node.nodeValue = translated;
                translatedNodes.add(node);
            } else if (!/[a-zA-Z]/.test(original)) {
                translatedNodes.add(node);
            }
        } else if (node.nodeType === 1) { // Element node
            const attrs = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'];
            for (const attr of attrs) {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    const original = node.getAttribute(attr);
                    if (original) {
                        const translated = translateText(original);
                        if (original !== translated) node.setAttribute(attr, translated);
                    }
                }
            }
            if (node.shadowRoot) {
                observeRoot(node.shadowRoot);
                translateNode(node.shadowRoot);
            }
            let child = node.firstChild;
            while (child) {
                translateNode(child);
                child = child.nextSibling;
            }
        }
    }

    function processBatch() {
        isBatchScheduled = false;

        // 1. 属性变更批量刷新
        if (pendingAttrNodes.size > 0) {
            for (const [target, attrs] of pendingAttrNodes) {
                if (!shouldSkipNode(target)) {
                    for (const attr of attrs) {
                        const val = target.getAttribute(attr);
                        if (val) {
                            const trans = translateText(val);
                            if (trans !== val) target.setAttribute(attr, trans);
                        }
                    }
                }
            }
            pendingAttrNodes.clear();
        }

        // 2. 文本变更批量刷新
        if (pendingTextNodes.size > 0) {
            for (const node of pendingTextNodes) {
                if (!shouldSkipNode(node)) {
                    const val = node.nodeValue;
                    if (val && val.trim()) {
                        const trans = translateText(val);
                        if (trans !== val) {
                            node.nodeValue = trans;
                            translatedNodes.add(node);
                        } else if (!/[a-zA-Z]/.test(val)) {
                            translatedNodes.add(node);
                        }
                    }
                }
            }
            pendingTextNodes.clear();
        }

        // 3. 祖先剪枝批量处理新增节点
        if (pendingAddedNodes.size > 0) {
            const rootNodes = [];
            for (const node of pendingAddedNodes) {
                let hasAncestor = false;
                let p = node.parentElement;
                while (p) {
                    if (pendingAddedNodes.has(p)) {
                        hasAncestor = true;
                        break;
                    }
                    p = p.parentElement;
                }
                if (!hasAncestor) rootNodes.push(node);
            }
            pendingAddedNodes.clear();

            for (let i = 0; i < rootNodes.length; i++) {
                const node = rootNodes[i];
                if (node.shadowRoot) observeRoot(node.shadowRoot);
                if (!shouldSkipNode(node)) translateNode(node);
            }
        }
    }

    function scheduleBatch() {
        if (isBatchScheduled) return;
        isBatchScheduled = true;
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(processBatch);
        } else if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(processBatch);
        } else {
            setTimeout(processBatch, 0);
        }
    }

    function observeRoot(root) {
        if (!root || observedRoots.has(root)) return;
        observedRoots.add(root);

        const observer = new MutationObserver((mutations) => {
            let needsSchedule = false;
            for (let i = 0; i < mutations.length; i++) {
                const m = mutations[i];
                if (m.type === 'childList') {
                    for (let j = 0; j < m.addedNodes.length; j++) {
                        const n = m.addedNodes[j];
                        if (n.shadowRoot) observeRoot(n.shadowRoot);
                        pendingAddedNodes.add(n);
                        needsSchedule = true;
                    }
                } else if (m.type === 'characterData') {
                    translatedNodes.delete(m.target);
                    pendingTextNodes.add(m.target);
                    needsSchedule = true;
                } else if (m.type === 'attributes') {
                    const target = m.target;
                    let attrSet = pendingAttrNodes.get(target);
                    if (!attrSet) {
                        attrSet = new Set();
                        pendingAttrNodes.set(target, attrSet);
                    }
                    attrSet.add(m.attributeName);
                    needsSchedule = true;
                }
            }
            if (needsSchedule) scheduleBatch();
        });

        observer.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder']
        });
    }

    // Shadow DOM 穿透挂钩
    const origAttachShadow = Element.prototype.attachShadow;
    if (origAttachShadow) {
        Element.prototype.attachShadow = function() {
            const shadowRoot = origAttachShadow.apply(this, arguments);
            observeRoot(shadowRoot);
            return shadowRoot;
        };
    }

    function safeScan() {
        if (document.body) {
            try {
                translateNode(document.body);
            } catch (_) {}
            observeRoot(document.body);
        }
    }

    function startEngine() {
        safeScan();

        // 渐进式多阶挂载兜底 (保障冷热重载与路由切换)
        [50, 150, 400, 1000, 2500].forEach(delay => setTimeout(safeScan, delay));

        window.addEventListener('focus', safeScan);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') safeScan();
        });

        try {
            const origPushState = history.pushState;
            history.pushState = function() {
                const ret = origPushState.apply(this, arguments);
                setTimeout(safeScan, 50);
                return ret;
            };
            const origReplaceState = history.replaceState;
            history.replaceState = function() {
                const ret = origReplaceState.apply(this, arguments);
                setTimeout(safeScan, 50);
                return ret;
            };
            window.addEventListener('popstate', () => setTimeout(safeScan, 50));
        } catch (_) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startEngine);
    } else {
        startEngine();
    }
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
