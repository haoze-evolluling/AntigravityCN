"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Antigravity 桌面端全方位双层深度汉化引擎 (Main-World Bridge)
 * 融合工业级高吞吐算力、微任务调度、React Virtual DOM 深度挂钩与绝对物理免疫沙盒
 */
const electron_1 = require("electron");

// ---------------------------------------------------------------------------
// 1. 全量汉化字典占位符 (由 Patcher 注入时自动扫描并合并 patches/locales/zh-CN/ 模块化词典)
// ---------------------------------------------------------------------------
const I18N_DICT = /*__I18N_DICT_PLACEHOLDER__*/{};

// ---------------------------------------------------------------------------
// 2. Main World 注入函数（运行在页面 JS 主上下文中，深度挂钩 React 与 DOM）
// ---------------------------------------------------------------------------
function injectedMainWorldScript(DICT) {
    if (window.__AGY_CN_INITIALIZED__) return;
    window.__AGY_CN_INITIALIZED__ = true;

    // -----------------------------------------------------------------------
    // [模块 1] 词典索引与缓存系统 (Dictionaries & Caches)
    // -----------------------------------------------------------------------
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

    // 预编译全小写 Map 索引表，确保 O(1) 访问
    const lowerDictionary = new Map();
    for (const [k, v] of Object.entries(DICT)) {
        lowerDictionary.set(k.toLowerCase(), v);
    }
    for (const [k, v] of Object.entries(coreWords)) {
        const lk = k.toLowerCase();
        if (!lowerDictionary.has(lk)) lowerDictionary.set(lk, v);
    }

    // 动态正则与字符串缓存 (有界 LRU Map)
    const stringCache = new Map();
    const MAX_STRING_CACHE = 5000;

    const escapeRegExp = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // 启动时一次性预编译高频短词联合词边界流式正则
    const sortedCoreKeys = Object.keys(coreWords)
        .sort((a, b) => b.length - a.length)
        .filter(w => w.length > 2 || /^[a-zA-Z0-9]+$/.test(w));
    const escapedCoreUnion = sortedCoreKeys.map(w => escapeRegExp(w)).join('|');
    const CORE_WORDS_UNION_REGEX = new RegExp('\\b(' + escapedCoreUnion + ')\\b', 'gi');

    // 提及菜单 (@ Mentions) 白名单与代码编辑器类名模式
    const MENTION_CATEGORIES = new Set([
        'Rules', '规则', 'Conversation', '对话',
        'PDF Document', 'PDF 文档', 'MCP Resource', 'MCP 资源',
        'Browser Page', '浏览器页面', 'Browser Text', '浏览器文本',
        'Directory', '目录', 'Git Commit', 'Git 提交', 'Git Diff', 'Git 差异'
    ]);
    const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'KBD', 'SAMP', 'VAR']);
    const codeClassPattern = /(?:^|[\s_-])(monaco-editor|editor-instance|hljs|shiki|prism|codemirror|line-content|gutter|codeblock|code-block|code-line|view-line)(?:$|[\s_-])/i;

    // -----------------------------------------------------------------------
    // [模块 2] 表驱动动态匹配规则系统 (Declarative Dynamic Rules Engine)
    // -----------------------------------------------------------------------
    const DYNAMIC_RULES = [
        // 1. WSL 环境与部署弹窗
        [/^Setting up WSL:\s*(.+)$/i, '正在配置 WSL: $1'],
        [/^Installing into\s*(.+?)[…\.]*$/i, '正在安装到 $1…'],
        [/^Connected to WSL:\s*(.+)$/i, '已连接到 WSL: $1'],
        [/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i, '此文件夹属于 WSL 发行版“$1”，但当前窗口连接到“$2”。'],
        [/^This location cannot be opened in WSL:\s*(.+)$/i, '无法在 WSL 中打开此位置: $1'],
        [/^The WSL distro "([^"]+)" is no longer installed\.?$/i, 'WSL 发行版“$1”已不再安装。'],
        [/^Antigravity opened on Windows instead\.?$/i, 'Antigravity 已改为在 Windows 本地打开。'],

        // 2. 计划模式与引导提示
        [/(?:Type|输入)\s*\/\s*(?:and|并|和)?\s*(?:select|选择)?\s*['"]?plan['"]?\s*to\s+have\s+the\s+agent\s+generate\s+a\s+plan[。.]?/i,
            (trimmed) => /[。.]\s*$/.test(trimmed) ? '输入 / 并选择 plan 来让智能体生成计划。' : '输入 / 并选择 plan 来让智能体生成计划'],
        [/^(?:to\s+)?have\s+the\s+agent\s+generate\s+a\s+plan[。.]?$/i,
            (trimmed) => /[。.]\s*$/.test(trimmed) ? '来让智能体生成计划。' : '来让智能体生成计划'],
        [/^plan\s+to\s+have\s+the\s+agent\s+generate\s+a\s+plan[。.]?$/i,
            (trimmed) => /[。.]\s*$/.test(trimmed) ? 'plan 来让智能体生成计划。' : 'plan 来让智能体生成计划'],
        [/^(?:Type|输入)\s*\/\s*(?:and|并|和)\s*$/i, '输入 / 并'],

        // 3. 思考耗时与总时间
        [/^(?:Thought|Thinking)\s+(?:for|持续)\s*(.+)$/i,
            (_m, dur) => '思考了 ' + dur.replace(/seconds?/i, '秒').replace(/s\b/i, ' 秒')],
        [/^Worked\s+(?:for|持续)\s*(.+)$/i, '总耗时 $1'],
        [/^Thinking\s*\((.+)\)$/i, '正在思考 ($1)'],

        // 4. 步骤与回合
        [/^Step\s+(\d+)\s+of\s+(\d+)$/i, '步骤 $1 / $2'],
        [/^Step\s+(\d+)\s*\(([^)]+)\):?$/i, '步骤 $1 ($2)：'],
        [/^(\d+)\s+turns?$/i, '$1 回合'],
        [/^Turn\s+(\d+)$/i, '第 $1 回合'],

        // 5. 文件与改动计数
        [/^(\d+)\s+files?\s+changed(.*)$/i, '$1 个文件已更改$2'],
        [/^(\d+)\s+searches?$/i, '$1 次搜索'],
        [/^Edited\s+(.*)\s+\+(\d+)\s+-(\d+)$/i, '编辑 $1 (+$2 -$3)'],
        [/^(\d+)\s+(lines?\s+added|lines?\s+removed|matches?\s+found|results?)$/i,
            (_m, num, type) => {
                const t = type.toLowerCase();
                if (t.includes('added')) return '添加了 ' + num + ' 行';
                if (t.includes('removed')) return '删除了 ' + num + ' 行';
                if (t.includes('matches')) return '找到 ' + num + ' 个匹配项';
                return num + ' 条结果';
            }],

        // 6. 额度与刷新倒计时
        [/^(Weekly|Five[- ]Hour|5[- ]Hour|Hourly|Daily)\s+Limit\s+Remaining$/i,
            (trimmed) => {
                const lower = trimmed.toLowerCase();
                if (lower.includes('weekly')) return '每周限额剩余';
                if (lower.includes('five') || lower.includes('5')) return '5 小时限额剩余';
                if (lower.includes('hourly')) return '每小时限额剩余';
                if (lower.includes('daily')) return '每日限额剩余';
                return trimmed;
            }],
        [/(?:You have used some of your|您已使用了部分).*(?:limit|限额)/i,
            (trimmed) => trimmed
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:weekly|每周)\s*(?:limit|限额)?/i, '您已使用了部分每周限额')
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:5[- ]hour|five[- ]hour|5 小时|五小时)\s*(?:limit|限额)?/i, '您已使用了部分 5 小时限额')
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:hourly|每小时)\s*(?:limit|限额)?/i, '您已使用了部分每小时限额')
                .replace(/^(?:You have used some of your|您已使用了部分)\s*(?:daily|每日)\s*(?:limit|限额)?/i, '您已使用了部分每日限额')
                .replace(/(?:it will fully refresh in|它将在以下时间后完全刷新[：:]?)\s*/i, ' 它将在以下时间后完全刷新：')
                .replace(/(\d+)\s*days?/gi, ' $1 天')
                .replace(/(\d+)\s*hours?/gi, ' $1 小时')
                .replace(/(\d+)\s*minutes?\.?$/gi, ' $1 分钟')
                .replace(/\s+/g, ' ')
                .trim()],
        [/^(\d+(?:\.\d+)?%?)\s+remaining$/i, '$1 剩余'],

        // 7. 自定义额度与百分比
        [/% of the (?:customization )?budget is (?:available|used)/i,
            (trimmed) => {
                if (/available/i.test(trimmed)) {
                    return trimmed.replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is available[.。]?/i, '自定义额度尚有 $1% 可用。');
                }
                return trimmed.replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is used[.。]?/i, '已使用 $1% 的自定义额度。');
            }],

        // 8. 历史与相对时间
        [/^(\d+)\s+(seconds?|minutes?|hours?|days?)\s+ago$/i,
            (_m, num, unit) => {
                const units = { s: '秒前', m: '分钟前', h: '小时前', d: '天前' };
                return num + ' ' + (units[unit[0].toLowerCase()] || '');
            }],
        [/^Updated\s+(.+)$/i,
            (trimmed) => trimmed.replace(/^Updated\s+(.+)$/i, '更新于 $1')
                .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/gi, (_m, mon, day) => {
                    const monMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
                    return monMap[mon.toLowerCase()] + '月' + day + '日';
                })],

        // 9. 快捷键提示
        [/^(Enter|Alt\+Enter|Ctrl\+Enter|Cmd\+Enter|Option\+Enter|Shift\+Enter)\s+(Queues after the turn|Sends immediately|On empty prompt,\s*sends next in queue)$/i,
            (_m, key, act) => {
                const a = act.toLowerCase();
                const actCn = a.startsWith('queues') ? ' 本轮结束后排队' : (a.startsWith('sends') ? ' 立即发送' : ' 输入为空时，发送队列中的下一条消息');
                return key + actCn;
            }]
    ];

    function matchDynamicRule(trimmed) {
        for (let i = 0; i < DYNAMIC_RULES.length; i++) {
            const [pattern, handler] = DYNAMIC_RULES[i];
            const match = trimmed.match(pattern);
            if (match) {
                return typeof handler === 'function' ? handler(...match) : trimmed.replace(pattern, handler);
            }
        }
        return null;
    }

    // -----------------------------------------------------------------------
    // [模块 3] 核心文本翻译分发管道 (Translation Pipeline)
    // -----------------------------------------------------------------------
    function translateText(text) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (!trimmed) return text;

        // 性能短路：纯中文、数字、标点瞬间 0 开销返回
        if (!/[a-zA-Z]/.test(trimmed)) {
            return text;
        }

        // 极速缓存查询 (O(1))
        if (stringCache.has(trimmed)) {
            return text.replace(trimmed, stringCache.get(trimmed));
        }

        // 1. 动态语法与状态流匹配
        const dynamicTrans = matchDynamicRule(trimmed);
        if (dynamicTrans !== null) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, dynamicTrans);
            return text.replace(trimmed, dynamicTrans);
        }

        // 2. 词典精确匹配与大小写折叠
        if (DICT[trimmed]) {
            return text.replace(trimmed, DICT[trimmed]);
        }
        const trimmedLower = trimmed.toLowerCase();
        if (lowerDictionary.has(trimmedLower)) {
            const res = lowerDictionary.get(trimmedLower);
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, res);
            return text.replace(trimmed, res);
        }

        // 3. 空格规范化匹配（处理折行与多空格卡片）
        const normalizedSpace = trimmed.replace(/\s+/g, ' ');
        if (DICT[normalizedSpace]) {
            return text.replace(trimmed, DICT[normalizedSpace]);
        }
        if (lowerDictionary.has(normalizedSpace.toLowerCase())) {
            const res = lowerDictionary.get(normalizedSpace.toLowerCase());
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, res);
            return text.replace(trimmed, res);
        }

        // 4. 标点符号智能剥离与组装
        let core = trimmed;
        let trailPunc = '';
        const puncMatch = core.match(/(\.\.\.|…|\.|\?|!|:|：|？|！|。)$/);
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

        // 5. 短词流式联合分词 (<= 3 words，严禁污染已汉化或混合长句)
        if (/[\u4e00-\u9fa5]/.test(core)) {
            return text;
        }
        const wordsCount = core.split(/\s+/).filter(Boolean).length;
        if (wordsCount > 3) {
            return text;
        }

        let replaced = false;
        const temp = core.replace(CORE_WORDS_UNION_REGEX, (matched) => {
            const lk = matched.toLowerCase();
            if (coreWords[lk]) {
                replaced = true;
                return coreWords[lk];
            }
            return matched;
        });

        if (replaced) {
            const finalTranslated = temp.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2') + trailPunc;
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, finalTranslated);
            return text.replace(trimmed, finalTranslated);
        }

        return text;
    }

    // -----------------------------------------------------------------------
    // [模块 4] 物理安全免疫沙盒与单次祖先检查 (DOM Safety Sandbox)
    // -----------------------------------------------------------------------
    const skipCache = new WeakMap();

    function shouldSkipNode(node) {
        if (!node) return true;
        const element = node.nodeType === 3 ? node.parentElement : node;
        if (!element) return false;

        if (skipCache.has(element)) {
            return skipCache.get(element);
        }

        // 1. 绝对不能翻译的原生标签
        if (skipTags.has(element.tagName)) {
            skipCache.set(element, true);
            return true;
        }

        // 2. 斜杠命令原生触发词保护 (保持 /boost, /goal 等，放行 @ 提及分类)
        const isMenuOptionLabel = element.closest && element.closest('[data-testid="menu-option-label"]');
        if (isMenuOptionLabel) {
            const labelText = (isMenuOptionLabel.innerText || isMenuOptionLabel.textContent || '').trim();
            const allowed = MENTION_CATEGORIES.has(labelText);
            skipCache.set(element, !allowed);
            return !allowed;
        }

        // 3. 思考过程展开触发药丸放行
        const isThinkingTrigger = element.closest && element.closest('button[data-testid="thinking-collapsible-trigger"]');
        if (isThinkingTrigger) {
            skipCache.set(element, false);
            return false;
        }

        // 4. 输入框/文本域/富文本编辑器绝对跳过
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' ||
            (element.getAttribute && (
                element.getAttribute('contenteditable') === 'true' ||
                element.getAttribute('role') === 'textbox' ||
                element.getAttribute('data-lexical-editor') === 'true'
            ))) {
            skipCache.set(element, true);
            return true;
        }

        // 5. 检查是否为系统执行动作药丸 (Ran, Explored, Edited, Viewed, Thought, Thinking, Working)
        const textContent = (element.innerText || element.textContent || '').trim();
        const isActionPill = textContent.length <= 25 && /^(Explored|Ran|Viewed|Edited|Thought|Thinking|Working)$/i.test(textContent);

        // 6. 统一祖先遍历：整合思考链正文、用户输入区、代码块检查
        let inUserInput = false;
        let inThinkingContent = false;
        let inCodeOrPre = element.tagName === 'CODE' || element.tagName === 'PRE';

        let cur = element;
        while (cur && cur !== document.body) {
            if (skipCache.has(cur)) {
                if (skipCache.get(cur) && !isActionPill) {
                    skipCache.set(element, true);
                    return true;
                }
            }

            if (cur.tagName === 'PRE' || cur.tagName === 'CODE') {
                inCodeOrPre = true;
            }

            if (cur.classList) {
                if (cur.classList.contains('group/user-input-step') ||
                    cur.classList.contains('user-message') ||
                    cur.classList.contains('chat-input') ||
                    cur.classList.contains('cursor-edit')) {
                    inUserInput = true;
                }
                if (cur.classList.contains('thought-content') ||
                    cur.classList.contains('thinking-content') ||
                    cur.classList.contains('thought-box')) {
                    inThinkingContent = true;
                }
            }

            if (cur.parentElement && cur.parentElement.querySelector) {
                const trigger = cur.parentElement.querySelector(':scope > button[data-testid="thinking-collapsible-trigger"]');
                if (trigger && cur !== trigger && !trigger.contains(cur)) {
                    inThinkingContent = true;
                }
            }

            if (cur.className && typeof cur.className === 'string' && codeClassPattern.test(cur.className)) {
                inCodeOrPre = true;
            }

            cur = cur.parentElement;
        }

        // 特殊特权放行：针对执行动作药丸，只要不在用户提问气泡和思考链正文内，一律无条件放行
        if (isActionPill && !inUserInput && !inThinkingContent) {
            skipCache.set(element, false);
            return false;
        }

        const shouldSkip = inUserInput || inThinkingContent || inCodeOrPre;
        skipCache.set(element, shouldSkip);
        return shouldSkip;
    }

    // 窗口标题原生拦截
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
    // [模块 5] DOM 变动监听与微任务批处理引擎 (DOM Observer & Scheduler)
    // -----------------------------------------------------------------------
    const translatedNodes = new WeakSet();
    const observedRoots = new WeakSet();
    const pendingAddedNodes = new Set();
    const pendingTextNodes = new Set();
    const pendingAttrNodes = new Map();
    let isBatchScheduled = false;

    function translateNode(node) {
        if (!node || shouldSkipNode(node)) return;

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
            for (let i = 0; i < attrs.length; i++) {
                const attr = attrs[i];
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

        // 2. 文本节点批量刷新
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
    const _electron = typeof electron_1 !== 'undefined' ? electron_1 : require('electron');
    if (_electron && _electron.webFrame) {
        _electron.webFrame.executeJavaScriptInIsolatedWorld(0, [
            { code: injectionCode }
        ]);
    }
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
