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
// 2. 全量汉化字典占位符 (由 Patcher 注入时自动扫描并合并 patches/locales/zh-CN/ 模块化词典)
// ---------------------------------------------------------------------------
const I18N_DICT = /*__I18N_DICT_PLACEHOLDER__*/{};

// ---------------------------------------------------------------------------
// 3. Main World 注入函数（运行在页面 JS 主上下文中，深度挂钩 React.createElement 与 DOM）
// ---------------------------------------------------------------------------
function injectedMainWorldScript(DICT) {
    if (window.__AGY_CN_INITIALIZED__) return;
    window.__AGY_CN_INITIALIZED__ = true;

    // 构建小写快速索引表以支持不区分大小写匹配
    const DICT_LOWER = {};
    for (const k of Object.keys(DICT)) {
        DICT_LOWER[k.toLowerCase()] = DICT[k];
    }

    function translateText(str) {
        if (typeof str !== 'string') return str;
        const trimmed = str.trim();
        if (!trimmed || trimmed.length < 1) return str;

        // 1. 精确词典匹配
        if (DICT[trimmed]) {
            return str.replace(trimmed, DICT[trimmed]);
        }

        // 1.1 不区分大小写词典匹配
        const trimmedLower = trimmed.toLowerCase();
        if (DICT_LOWER[trimmedLower]) {
            return str.replace(trimmed, DICT_LOWER[trimmedLower]);
        }

        // 1.1.5 空白规范化词典匹配（支持多行/换行/多空格文本与提示）
        const normalized = trimmed.replace(/\s+/g, ' ');
        if (DICT[normalized]) {
            return str.replace(trimmed, DICT[normalized]);
        }
        const normalizedLower = normalized.toLowerCase();
        if (DICT_LOWER[normalizedLower]) {
            return str.replace(trimmed, DICT_LOWER[normalizedLower]);
        }

        // 1.1.5.5 末尾标点智能降级匹配（句号 . / 冒号 :）
        if (trimmed.endsWith('.') && !trimmed.endsWith('..')) {
            const noDot = trimmed.slice(0, -1).trim();
            const trans = DICT[noDot] || DICT_LOWER[noDot.toLowerCase()];
            if (trans) {
                const transClean = trans.replace(/[.。]+$/, '');
                return str.replace(trimmed, transClean + '。');
            }
        } else {
            const withDot = trimmed + '.';
            const trans = DICT[withDot] || DICT_LOWER[withDot.toLowerCase()];
            if (trans) {
                const transClean = trans.replace(/[.。]+$/, '');
                return str.replace(trimmed, transClean);
            }
        }

        if (trimmed.endsWith(':')) {
            const noColon = trimmed.slice(0, -1).trim();
            const trans = DICT[noColon] || DICT_LOWER[noColon.toLowerCase()];
            if (trans) {
                const transClean = trans.replace(/[:：]+$/, '');
                return str.replace(trimmed, transClean + '：');
            }
        }

        // 1.1.6 快捷键排队/发送提示动态匹配
        if (/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)\s+Queues after the turn$/i.test(trimmed)) {
            const m = trimmed.match(/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)/i);
            return str.replace(trimmed, m[1] + ' 本轮结束后排队');
        }
        if (/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)\s+Sends immediately$/i.test(trimmed)) {
            const m = trimmed.match(/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)/i);
            return str.replace(trimmed, m[1] + ' 立即发送');
        }
        if (/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)\s+On empty prompt,\s*sends next in queue$/i.test(trimmed)) {
            const m = trimmed.match(/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)/i);
            return str.replace(trimmed, m[1] + ' 输入为空时，发送队列中的下一条消息');
        }

        // 1.1.7 模型档位动态匹配 (Model Selection Tiers & Parentheses)
        // 例如 "Gemini 3.7 Flash (High)" -> "Gemini 3.7 Flash (高)"
        // 例如 "Gemini 3.7 Flash Thinking (High)" -> "Gemini 3.7 Flash 思考 (高)"
        // 例如 "Claude 3.7 Sonnet (Thinking High)" -> "Claude 3.7 Sonnet (高思考)"
        if (/^(.*?)\s*\(\s*(?:Thinking\s+)?(High|Medium|Low)\s*(?:Thinking)?\s*\)$/i.test(trimmed)) {
            const m = trimmed.match(/^(.*?)\s*\(\s*(?:(Thinking)\s+)?(High|Medium|Low)(?:\s+(Thinking))?\s*\)$/i);
            if (m) {
                let modelPrefix = m[1];
                const hasThinking = Boolean(m[2] || m[4]);
                const tierRaw = m[3].toLowerCase();
                let tierCn = '高';
                if (tierRaw === 'medium') tierCn = '中';
                else if (tierRaw === 'low') tierCn = '低';

                const suffix = hasThinking ? (tierCn + '思考') : tierCn;
                if (modelPrefix.endsWith(' Thinking')) {
                    modelPrefix = modelPrefix.slice(0, -9) + ' 思考';
                }
                return str.replace(trimmed, modelPrefix + ' (' + suffix + ')');
            }
        }
        if (/^(High|Medium|Low)\s+(Thinking|Reasoning)(?:\s+Budget)?$/i.test(trimmed)) {
            const m = trimmed.match(/^(High|Medium|Low)\s+(Thinking|Reasoning)(?:\s+Budget)?$/i);
            const tierRaw = m[1].toLowerCase();
            let tierCn = '高';
            if (tierRaw === 'medium') tierCn = '中';
            else if (tierRaw === 'low') tierCn = '低';
            return str.replace(trimmed, tierCn + '思考预算');
        }
        if (/^(?:Thinking|Reasoning)(?:\s+(?:Budget|Effort|Level|Tier))?\s*:\s*(High|Medium|Low)$/i.test(trimmed)) {
            const m = trimmed.match(/^(?:Thinking|Reasoning)(?:\s+(?:Budget|Effort|Level|Tier))?\s*:\s*(High|Medium|Low)$/i);
            const tierRaw = m[1].toLowerCase();
            let tierCn = '高';
            if (tierRaw === 'medium') tierCn = '中';
            else if (tierRaw === 'low') tierCn = '低';
            return str.replace(trimmed, '思考强度：' + tierCn);
        }

        // 1.2 "Learn more about ..." 动态匹配
        if (/^Learn more about\s+(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^Learn more about\s+(.*)$/i);
            const target = translateText(m[1]);
            return str.replace(trimmed, '了解更多关于 ' + target);
        }
        if (/^Learn more about$/i.test(trimmed)) {
            return str.replace(trimmed, '了解更多关于');
        }

        // 1.3 输入框与操作提示动态匹配
        if (/^Ask anything,\s*@\s*to mention,\s*\/\s*for actions$/i.test(trimmed)) {
            return str.replace(trimmed, '任意提问，输入 @ 提及，输入 / 执行操作');
        }
        if (/^Ask anything,\s*@\s*to mention,\s*\/\s*for commands$/i.test(trimmed)) {
            return str.replace(trimmed, '任意提问，输入 @ 提及，输入 / 调用命令');
        }
        if (/^Ask anything,\s*@\s*to mention$/i.test(trimmed)) {
            return str.replace(trimmed, '任意提问，输入 @ 提及');
        }

        // 1.4 套餐名称动态匹配 (Your Plan: ...)
        if (/^Your Plan:\s*(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^Your Plan:\s*(.*)$/i);
            return str.replace(trimmed, '当前方案：' + m[1]);
        }

        // 1.5 自定义配置 Token 预算可用百分比 (X% of the customization budget is available.)
        if (/^([\d\.]+)%\s+of\s+(?:the\s+)?customization\s+budget\s+is\s+available\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^([\d\.]+)%\s+of\s+(?:the\s+)?customization\s+budget\s+is\s+available\.?$/i);
            return str.replace(trimmed, m[1] + '% 的自定义配置预算可用。');
        }

        // 1.6 明细折叠/展开动态匹配 (Show N breakdowns / Hide N breakdowns)
        if (/^Show\s+(\d+)\s+breakdowns?$/i.test(trimmed)) {
            const m = trimmed.match(/^Show\s+(\d+)\s+breakdowns?$/i);
            return str.replace(trimmed, '显示 ' + m[1] + ' 项明细');
        }
        if (/^Hide\s+(\d+)\s+breakdowns?$/i.test(trimmed)) {
            const m = trimmed.match(/^Hide\s+(\d+)\s+breakdowns?$/i);
            return str.replace(trimmed, '隐藏 ' + m[1] + ' 项明细');
        }

        // 1.7 模型配额使用与刷新时间动态匹配
        // "You have used some of your weekly limit, it will fully refresh in 6 days, 21 hours."
        // "You have used some of your 5-hour limit, it will fully refresh in 2 hours, 44 minutes."
        if (/^You have used (some|all) of your ([\w\-]+) limit,\s*it will fully refresh in (.*?)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^You have used (some|all) of your ([\w\-]+) limit,\s*it will fully refresh in (.*?)\.?$/i);
            const usageType = m[1].toLowerCase() === 'all' ? '已用尽' : '已使用部分';
            let limitType = m[2].toLowerCase();
            if (limitType === 'weekly') limitType = '每周';
            else if (limitType === '5-hour' || limitType === 'five-hour' || limitType === '5hour' || limitType === 'fivehour') limitType = '5 小时';
            else if (limitType === 'daily') limitType = '每日';
            else if (limitType === 'monthly') limitType = '每月';
            else if (limitType === 'hourly') limitType = '每小时';
            
            const timeStr = m[3]
                .replace(/(\d+)\s*days?/gi, '$1 天')
                .replace(/(\d+)\s*hours?/gi, '$1 小时')
                .replace(/(\d+)\s*minutes?/gi, '$1 分钟')
                .replace(/(\d+)\s*seconds?/gi, '$1 秒')
                .replace(/,\s*/g, ' ')
                .trim();
                
            return str.replace(trimmed, '您' + usageType + limitType + '限额，将在 ' + timeStr + ' 后完全重置。');
        }
        if (/^it will fully refresh in (.*?)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^it will fully refresh in (.*?)\.?$/i);
            const timeStr = m[1]
                .replace(/(\d+)\s*days?/gi, '$1 天')
                .replace(/(\d+)\s*hours?/gi, '$1 小时')
                .replace(/(\d+)\s*minutes?/gi, '$1 分钟')
                .replace(/(\d+)\s*seconds?/gi, '$1 秒')
                .replace(/,\s*/g, ' ')
                .trim();
            return str.replace(trimmed, '将在 ' + timeStr + ' 后完全重置。');
        }
        if (/^You (?:have not|haven't) used any of your ([\w\-]+) limit\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^You (?:have not|haven't) used any of your ([\w\-]+) limit\.?$/i);
            let limitType = m[1].toLowerCase();
            if (limitType === 'weekly') limitType = '每周';
            else if (limitType === '5-hour' || limitType === 'five-hour' || limitType === '5hour' || limitType === 'fivehour') limitType = '5 小时';
            else if (limitType === 'daily') limitType = '每日';
            else if (limitType === 'monthly') limitType = '每月';
            return str.replace(trimmed, '您尚未消耗' + limitType + '限额。');
        }

        // 1.8 协议条款与使用须知动态匹配
        if (/^By using this app,\s*you agree to its\s*(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^By using this app,\s*you agree to its\s*(.*)$/i);
            const rest = m[1] ? translateText(m[1]) : '';
            return str.replace(trimmed, '使用此应用即表示您同意其 ' + rest).trim();
        }
        if (/^By using this application,\s*you agree to its\s*(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^By using this application,\s*you agree to its\s*(.*)$/i);
            const rest = m[1] ? translateText(m[1]) : '';
            return str.replace(trimmed, '使用此应用程序即表示您同意其 ' + rest).trim();
        }
        if (/^By signing in,\s*you agree to (?:our|its)\s*(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^By signing in,\s*you agree to (?:our|its)\s*(.*)$/i);
            const rest = m[1] ? translateText(m[1]) : '';
            return str.replace(trimmed, '登录即表示您同意其 ' + rest).trim();
        }
        if (/^By continuing,\s*you agree to (?:our|its)\s*(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^By continuing,\s*you agree to (?:our|its)\s*(.*)$/i);
            const rest = m[1] ? translateText(m[1]) : '';
            return str.replace(trimmed, '继续操作即表示您同意其 ' + rest).trim();
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
        if (/^(\d+(?:\.\d+)?)%\s+available$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+(?:\.\d+)?)%/)[1];
            return str.replace(trimmed, '剩余 ' + num + '% 可用');
        }
        if (/^(\d+(?:\.\d+)?)%\s+remaining$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+(?:\.\d+)?)%/)[1];
            return str.replace(trimmed, '剩余 ' + num + '%');
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
        const keys = [
            'placeholder', 'title', 'aria-label', 'aria-placeholder', 'aria-description',
            'label', 'description', 'tooltip', 'data-tooltip', 'data-title', 'data-placeholder',
            'alt', 'header', 'heading', 'subheading', 'subHeading', 'helperText', 'sublabel', 'subtitle',
            'caption', 'text', 'placeholderText', 'emptyText', 'badge', 'hint', 'prompt',
            'summary', 'secondaryText', 'supportingText', 'headline', 'primaryText', 'primaryLabel',
            'helper', 'secondaryLabel', 'sectionTitle', 'cardTitle', 'statusText', 'message',
            'content', 'tip', 'popover', 'overlayText', 'info', 'helpText', 'explanation', 'details'
        ];
        for (const k of keys) {
            if (typeof props[k] === 'string') {
                props[k] = translateText(props[k]);
            }
        }
        // 处理 props.children（当 JSX 运行时直接将 children 放入 props）
        if (props.children !== undefined) {
            props.children = translateChild(props.children);
        }
        // 处理 options 数组（用于下拉列表、单选/复选选项等）
        if (Array.isArray(props.options)) {
            for (const opt of props.options) {
                if (opt && typeof opt === 'object') {
                    if (typeof opt.label === 'string') opt.label = translateText(opt.label);
                    if (typeof opt.description === 'string') opt.description = translateText(opt.description);
                    if (typeof opt.title === 'string') opt.title = translateText(opt.title);
                }
            }
        }
        if (Array.isArray(props.items)) {
            for (const item of props.items) {
                if (item && typeof item === 'object') {
                    if (typeof item.label === 'string') item.label = translateText(item.label);
                    if (typeof item.description === 'string') item.description = translateText(item.description);
                    if (typeof item.title === 'string') item.title = translateText(item.title);
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
    let _react = (typeof window !== 'undefined' ? window.React : undefined) || 
                 (typeof globalThis !== 'undefined' ? globalThis.React : undefined);
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

    // DOM 辅助观察器：捕获非 React 虚拟 DOM 渲染的原生节点、编辑器占位符与动态 Tooltip
    function walkAndTranslate(node) {
        if (!node) return;
        if (node.nodeType === 3) { // Text node
            const val = node.nodeValue;
            if (val && val.trim()) {
                const trans = translateText(val);
                if (trans !== val) {
                    node.nodeValue = trans;
                }
            }
            return;
        }
        if (node.nodeType === 1) { // Element node
            const tag = node.tagName ? node.tagName.toLowerCase() : '';
            if (isCodeElement(tag, { className: node.className })) {
                return;
            }
            const attrs = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'];
            for (const attr of attrs) {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    const v = node.getAttribute(attr);
                    if (v) {
                        const trans = translateText(v);
                        if (trans !== v) node.setAttribute(attr, trans);
                    }
                }
            }
            let child = node.firstChild;
            while (child) {
                walkAndTranslate(child);
                child = child.nextSibling;
            }
        }
    }

    try {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'childList') {
                    for (let i = 0; i < m.addedNodes.length; i++) {
                        walkAndTranslate(m.addedNodes[i]);
                    }
                } else if (m.type === 'characterData') {
                    const val = m.target.nodeValue;
                    if (val && val.trim()) {
                        const trans = translateText(val);
                        if (trans !== val) {
                            m.target.nodeValue = trans;
                        }
                    }
                } else if (m.type === 'attributes') {
                    const attr = m.attributeName;
                    if (['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'].includes(attr)) {
                        const v = m.target.getAttribute(attr);
                        if (v) {
                            const trans = translateText(v);
                            if (trans !== v) m.target.setAttribute(attr, trans);
                        }
                    }
                }
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'] });
            walkAndTranslate(document.body);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'] });
                    walkAndTranslate(document.body);
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
