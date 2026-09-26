"use strict";
// Antigravity 2.0 Chinese Localization Engine Enhanced
(function() {
    // ---------------------------------------------------------------------------
    // 1. 全量汉化字典占位符 (由 Patcher 注入时自动扫描并合并 patches/locales/zh-CN/ 模块化词典)
    // ---------------------------------------------------------------------------
    const dictionary = /*__I18N_DICT_PLACEHOLDER__*/{};

    // 性能优化 1：预先构建全小写字典 Map，将未命中小写查找由 O(N) 降低为 O(1)
    const lowerDictionary = new Map();
    for (const [k, v] of Object.entries(dictionary)) {
        lowerDictionary.set(k.toLowerCase(), v);
    }

    // 核心词汇表：仅保留高频通用动词与界面基础词，严禁包含 thought, thinking, worked, code, diff 等
    // 杜绝 AI 模型流式生成思考链/代码块短语时被联合词边界正则误伤污染
    const coreWords = {
        "create": "创建", "delete": "删除", "new": "新建", "edit": "编辑", "save": "保存", "cancel": "取消", "confirm": "确认", "copy": "复制",
        "close": "关闭", "open": "打开", "stop": "停止", "start": "启动", "run": "运行", "add": "添加", "remove": "移除",
        "update": "更新", "select": "选择", "clear": "清除", "search": "搜索", "find": "查找", "view": "查看", "show": "显示", "hide": "隐藏",
        "agent": "智能体", "agents": "智能体", "subagent": "子智能体", "subagents": "子智能体", "task": "任务", "tasks": "任务",
        "workspace": "工作区", "workspaces": "工作区", "project": "项目", "projects": "项目", "directory": "目录", "folder": "文件夹", "file": "文件", "files": "文件",
        "command": "命令", "commands": "命令", "palette": "面板", "terminal": "终端", "console": "控制台", "output": "输出", "input": "输入", "remote": "远程", "control": "控制", "device": "设备", "devices": "设备", "link": "链接",
        "log": "日志", "logs": "日志", "setting": "设置", "settings": "设置", "preference": "偏好", "preferences": "偏好", "permission": "权限", "permissions": "权限",
        "theme": "主题", "themes": "主题", "model": "模型", "models": "模型", "capability": "能力", "capabilities": "能力",
        "running": "运行中", "completed": "已完成", "failed": "已失败", "pending": "等待中", "success": "成功", "error": "错误",
        "system": "系统", "prompt": "提示词", "instructions": "指令", "description": "描述", "name": "名称", "version": "版本",
        "active": "活跃", "background": "后台", "parent": "父级", "child": "子级", "branch": "分支", "share": "共享", "inherit": "继承",
        "original": "原始", "backup": "备份", "duration": "持续时间", "seconds": "秒", "timer": "定时器", "timers": "定时器",
        "schedule": "调度", "cron": "定时任务", "tools": "工具", "tool": "工具", "execute": "执行", "execution": "执行", "plan": "计划",
        "policy": "策略", "policies": "策略", "never": "从不", "always": "总是",
        "changed": "已更改", "review": "审核", "reviewing": "审核中", "reviewed": "已审核",
        "canceled": "已取消", "js": "Js",
        "explore": "探索", "search": "搜索", "change": "更改", "changes": "更改",
        "turn": "回合", "turns": "回合",
        "analyzed": "分析", "analyzing": "分析",
        "advanced": "高级", "collapse": "折叠", "expand": "展开",
        "global": "全局", "inherits": "继承",
        "wsl": "WSL", "distro": "发行版", "distros": "发行版"
    };

    for (const [k, v] of Object.entries(coreWords)) {
        const lk = k.toLowerCase();
        if (!lowerDictionary.has(lk)) {
            lowerDictionary.set(lk, v);
        }
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

    // 代码编辑器类名模式与提及白名单
    const codeClassPattern = /(?:^|[\s_-])(monaco-editor|editor-instance|hljs|shiki|prism|codemirror|line-content|gutter|codeblock|code-block|code-line|view-line)(?:$|[\s_-])/i;

    const MENTION_CATEGORIES = new Set([
        'Rules', '规则',
        'Conversation', '对话',
        'PDF Document', 'PDF 文档',
        'MCP Resource', 'MCP 资源',
        'Browser Page', '浏览器页面',
        'Browser Text', '浏览器文本',
        'Directory', '目录',
        'Git Commit', 'Git 提交',
        'Git Diff', 'Git 差异'
    ]);

    const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'KBD', 'SAMP', 'VAR'];

    // ---------------------------------------------------------------------------
    // 2. 核心文本翻译分发管道 (Translation Pipeline)
    // ---------------------------------------------------------------------------
    function translateString(text) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (!trimmed) return text;

        // 性能短路：纯中文、数字、标点瞬间 0 开销原样返回
        if (!/[a-zA-Z]/.test(trimmed)) {
            return text;
        }

        // 0. 极速缓存查询 (O(1))
        if (stringCache.has(trimmed)) {
            return text.replace(trimmed, stringCache.get(trimmed));
        }

        // 1. 特殊长句与 UI 界面前置拦截
        if (trimmed.includes('could not be opened')) {
            const replacedCouldNot = trimmed.replace(/could not be opened/gi, '无法打开');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, replacedCouldNot);
            return text.replace(trimmed, replacedCouldNot);
        }

        if (/Scan the code to/i.test(trimmed)) {
            if (/Scan the code to.*,\s*or\s*$/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备，或';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
                return text.replace(trimmed, fixed);
            }
            if (/Scan the code to.*(?:copy link|复制链接)/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备，或复制链接。';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
                return text.replace(trimmed, fixed);
            }
            if (/Scan the code to.*(?:Remote Control|远程\s*控制)/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
                return text.replace(trimmed, fixed);
            }
        }

        if (/Continue your work from another device/i.test(trimmed)) {
            let fixed = '借助远程控制从另一台设备继续工作。请扫描下方二维码或打开下方链接。';
            if (!/Scan the QR code/i.test(trimmed)) {
                fixed = '借助远程控制从另一台设备继续工作。';
            }
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/Scan the QR code or open the link below/i.test(trimmed)) {
            const fixed = '扫描下方二维码或打开下方链接。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Invalid tool call$/i.test(trimmed)) {
            const fixed = '无效的工具调用';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^No Project$/i.test(trimmed)) {
            const fixed = '无项目';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^See all\s*\(([^)]+)\)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^See all\s*\(([^)]+)\)$/i, '查看全部 ($1)');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Ran\s+(\d+)\s*(?:commands|命令)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Ran\s+(\d+)\s*(?:commands|命令)$/i, '已运行 $1 条命令');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Load older messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Load older messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i, '加载历史消息，正在显示 $1 / $2 条');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Fold lines\s+([0-9-]+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Fold lines\s+([0-9-]+)$/i, '折叠第 $1 行');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Advanced\s*Settings|Advanced\s*设置|advanced\s*settings)$/i.test(trimmed)) {
            const fixed = '高级设置';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Collapse\s*All|Collapse\s*all|collapse\s*all)$/i.test(trimmed)) {
            const fixed = '全部折叠';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Expand\s*All|Expand\s*all|expand\s*all)$/i.test(trimmed)) {
            const fixed = '全部展开';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Inherit\s*Global|Inherits\s*Global|继承\s*Global)$/i.test(trimmed)) {
            const fixed = '继承全局';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Inherits\s+your\s+Global\s+Permissions\s+when\s+working\s+in\s+this\s+project\.?$/i.test(trimmed)) {
            const fixed = '在此项目中工作时继承您的全局权限。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Also\s+includes.*(?:Global\s+Permissions|全局权限).*when\s+working\s+in\s+this\s+project/i.test(trimmed)) {
            const fixed = '在当前项目中工作时，亦继承全局权限配置。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Modify permissions for/i.test(trimmed)) {
            const fixed = '修改针对文件系统、终端命令以及 MCP 工具的安全权限。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Tool[\s ]+Permissions|工具[\s ]*Permissions)$/i.test(trimmed)) {
            const fixed = '工具权限';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        // WSL 环境提示动态正则
        if (/^Setting up WSL:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Setting up WSL:\s*(.+)$/i, '正在配置 WSL: $1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Installing into\s*(.+?)[…\.]*$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Installing into\s*(.+?)[…\.]*$/i, '正在安装到 $1…');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i, '此文件夹属于 WSL 发行版“$1”，但当前窗口连接到“$2”。');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^This location cannot be opened in WSL:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^This location cannot be opened in WSL:\s*(.+)$/i, '无法在 WSL 中打开此位置: $1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^The WSL distro "([^"]+)" is no longer installed\.?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^The WSL distro "([^"]+)" is no longer installed\.?$/i, 'WSL 发行版“$1”已不再安装。');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Antigravity opened on Windows instead\.?$/i.test(trimmed)) {
            const fixed = 'Antigravity 已改为在 Windows 本地打开。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Connected to WSL:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Connected to WSL:\s*(.+)$/i, '已连接到 WSL: $1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Plugins are packaged collections of skills and MCPs to help the Agent in$/i.test(trimmed)) {
            const fixed = '插件是技能和 MCP 的打包集合，用于协助智能体在';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Antigravity work with Google developer products/i.test(trimmed)) {
            let fixed = 'Antigravity 中协同 Google 开发者产品工作。';
            if (/change your choices in Settings/i.test(trimmed)) {
                fixed = 'Antigravity 中协同 Google 开发者产品工作。你可以随时在设置中更改你的选择。';
            }
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, fixed);
            return text.replace(trimmed, fixed);
        }

        // 2. 动态智能体运行日志与统计正则
        let dynamicMatch = trimmed;
        let isDynamic = false;

        // 思考外部折叠药丸时间与总耗时汉化
        if (/^Thought (?:for|持续) (.+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Thought (?:for|持续) (.+)$/i);
            const timeSec = m[1].replace(/seconds?/i, '秒').replace(/s\b/i, ' 秒');
            dynamicMatch = '思考了 ' + timeSec;
            isDynamic = true;
        } else if (/^Thinking (?:for|持续) (.+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Thinking (?:for|持续) (.+)$/i);
            const timeSec = m[1].replace(/seconds?/i, '秒').replace(/s\b/i, ' 秒');
            dynamicMatch = '思考了 ' + timeSec;
            isDynamic = true;
        } else if (/^Thinking \((.+)\)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Thinking \((.+)\)$/i, '正在思考 ($1)');
            isDynamic = true;
        }

        if (/^Worked (?:for|持续) (.+)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Worked (?:for|持续) (.+)$/i, '总耗时 $1');
            isDynamic = true;
        }
        if (/^\d+ files? changed(.*)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+) files? changed(.*)/i, '$1 个文件已更改$2');
            isDynamic = true;
        }
        if (/^(\d+)\s+searches?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+)\s+searches?/i, '$1 次搜索');
            isDynamic = true;
        }
        if (/^Edited (.*) \+(\d+) -(\d+)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Edited (.*) \+(\d+) -(\d+)/i, '编辑 $1 (+$2 -$3)');
            isDynamic = true;
        }
        if (/^Canceled taskkill/.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Canceled (.*)/, '已取消 $1');
            isDynamic = true;
        }
        if (/^\d+(?:\.\d+)?% of the (?:customization )?budget is (?:available|used)[.。]?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch
                .replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is available[.。]?/i, '自定义额度尚有 $1% 可用。')
                .replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is used[.。]?/i, '已使用 $1% 的自定义额度。');
            isDynamic = true;
        }

        // 限额剩余动态匹配
        if (/^(Weekly|Five[- ]Hour|5[- ]Hour|Hourly|Daily)\s+Limit\s+Remaining$/i.test(trimmed)) {
            const lower = trimmed.toLowerCase();
            if (lower.includes('weekly')) dynamicMatch = '每周限额剩余';
            else if (lower.includes('five') || lower.includes('5')) dynamicMatch = '5 小时限额剩余';
            else if (lower.includes('hourly')) dynamicMatch = '每小时限额剩余';
            else if (lower.includes('daily')) dynamicMatch = '每日限额剩余';
            isDynamic = true;
        }

        // 配额刷新提示句
        if (/(?:You have used some of your|您已使用了部分).*(?:limit|限额)/i.test(trimmed)) {
            dynamicMatch = dynamicMatch
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
        }

        if (/^Within each group, models share/.test(trimmed)) {
            dynamicMatch = '在每个分组中，模型共享每周限额和 5 小时限额。配额按 token 成本比例消耗。因此，较短的任务或使用更具性价比的模型时，限额可持续更长时间。5 小时限额用于平滑总需求，以便在所有用户间公平分配全球容量，而每周限额则与您的个人等级直接挂钩。';
            isDynamic = true;
        }

        if (/^(\d+(?:\.\d+)?%?)\s+remaining$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+(?:\.\d+)?%?)\s+remaining$/i, '$1 剩余');
            isDynamic = true;
        }
        if (/^(\d+)\s+hours?\s+(\d+)\s+minutes?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+)\s+hours?\s+(\d+)\s+minutes?$/i, '$1 小时 $2 分钟');
            isDynamic = true;
        }
        if (/^(\d+)\s+minutes?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+)\s+minutes?$/i, '$1 分钟');
            isDynamic = true;
        }
        if (/^(\d+)\s+hours?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+)\s+hours?$/i, '$1 小时');
            isDynamic = true;
        }
        if (/^(\d+)\s+days?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+)\s+days?$/i, '$1 天');
            isDynamic = true;
        }
        if (/^(\d+)\s+(seconds?|minutes?|hours?|days?)\s+ago$/i.test(trimmed)) {
            const units = { s: '秒前', m: '分钟前', h: '小时前', d: '天前' };
            dynamicMatch = trimmed.replace(/^(\d+)\s+(seconds?|minutes?|hours?|days?)\s+ago$/i, (_m, num, u) => num + ' ' + (units[u[0].toLowerCase()] || ''));
            isDynamic = true;
        }

        if (/^.+ does not exist\.?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(.+) does not exist\.?$/i, '$1 不存在');
            isDynamic = true;
        }
        if (/^.+ was not found\.?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(.+) was not found\.?$/i, '$1 未找到');
            isDynamic = true;
        }

        // 步骤与回合
        if (/^Step \d+ of \d+$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Step (\d+) of (\d+)$/i, '步骤 $1 / $2');
            isDynamic = true;
        }
        if (/^Step \d+ \([^\)]+\):?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Step (\d+) \(([^)]+)\):?/i, '步骤 $1 ($2)：');
            isDynamic = true;
        }
        if (/^\d+ turns?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+) turns?$/i, '$1 回合');
            isDynamic = true;
        }
        if (/^Turn \d+$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Turn (\d+)$/i, '第 $1 回合');
            isDynamic = true;
        }
        if (/^Task id "[^"]+" finished with result:$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Task id "([^"]+)" finished with result:$/i, '任务 "$1" 执行完成：');
            isDynamic = true;
        }
        if (/^Tool is running as a background task with task id: (.+)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Tool is running as a background task with task id: (.+)$/i, '工具正在后台运行 (任务ID: $1)');
            isDynamic = true;
        }

        if (/^Version\s+(\d+.*)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Version\s+(\d+.*)$/i, '版本 $1');
            isDynamic = true;
        }
        if (/^Updated\s+(.+)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Updated\s+(.+)$/i, '更新于 $1')
                .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})\b/gi, (_m, mon, day) => {
                    const monMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
                    return monMap[mon.toLowerCase()] + '月' + day + '日';
                });
            isDynamic = true;
        }

        // 计划审核策略提示
        if (/(?:Type|输入)\s*\/\s*(?:and|并|和)?\s*(?:select|选择)?\s*['"]?plan['"]?\s*to\s+have\s+the\s+agent\s+generate\s+a\s+plan[。.]?/i.test(trimmed)) {
            dynamicMatch = /[。.]\s*$/.test(trimmed) ? '输入 / 并选择 plan 来让智能体生成计划。' : '输入 / 并选择 plan 来让智能体生成计划';
            isDynamic = true;
        }
        if (/^(?:to\s+)?have\s+the\s+agent\s+generate\s+a\s+plan[。.]?$/i.test(trimmed)) {
            dynamicMatch = /[。.]\s*$/.test(trimmed) ? '来让智能体生成计划。' : '来让智能体生成计划';
            isDynamic = true;
        }
        if (/^plan\s+to\s+have\s+the\s+agent\s+generate\s+a\s+plan[。.]?$/i.test(trimmed)) {
            dynamicMatch = /[。.]\s*$/.test(trimmed) ? 'plan 来让智能体生成计划。' : 'plan 来让智能体生成计划';
            isDynamic = true;
        }
        if (/^(?:Type|输入)\s*\/\s*(?:and|并|和)\s*$/i.test(trimmed)) {
            dynamicMatch = '输入 / 并';
            isDynamic = true;
        }

        if (isDynamic) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, dynamicMatch);
            return text.replace(trimmed, dynamicMatch);
        }

        // 3. 字典全词匹配 (精准匹配或大小写不敏感 O(1) 匹配)
        if (dictionary[trimmed]) {
            return text.replace(trimmed, dictionary[trimmed]);
        }
        const lowerMatch = lowerDictionary.get(trimmed.toLowerCase());
        if (lowerMatch) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, lowerMatch);
            return text.replace(trimmed, lowerMatch);
        }

        // 空格规范化匹配
        const normalizedSpace = trimmed.replace(/\s+/g, ' ');
        if (dictionary[normalizedSpace]) {
            return text.replace(trimmed, dictionary[normalizedSpace]);
        }
        const lowerNormMatch = lowerDictionary.get(normalizedSpace.toLowerCase());
        if (lowerNormMatch) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, lowerNormMatch);
            return text.replace(trimmed, lowerNormMatch);
        }

        // 4. 剥离并智能映射末尾标点符号
        let core = trimmed;
        let matchPunc = '';
        let trailPunc = '';

        const puncRegex = /(\.\.\.|…|\.|\?|!|:|：|？|！|。)$/;
        const match = core.match(puncRegex);
        if (match) {
            matchPunc = match[0];
            core = core.slice(0, -matchPunc.length).trim();
            if (matchPunc === '.') trailPunc = '。';
            else if (matchPunc === '?') trailPunc = '？';
            else if (matchPunc === '!') trailPunc = '！';
            else if (matchPunc === ':') trailPunc = '：';
            else if (matchPunc === '：') trailPunc = '：';
            else if (matchPunc === '？') trailPunc = '？';
            else if (matchPunc === '！') trailPunc = '！';
            else if (matchPunc === '。') trailPunc = '。';
            else trailPunc = matchPunc;
        }

        const coreTranslated = dictionary[core] || lowerDictionary.get(core.toLowerCase()) || '';
        if (coreTranslated) {
            const res = coreTranslated + trailPunc;
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(trimmed, res);
            return text.replace(trimmed, res);
        }

        // 5. 短词流式联合分词降级 (仅限 <= 3 词的超短词组)
        // 关键防御：如果短语中已包含中文，严禁进入英文分词，杜绝二次翻译污染
        if (/[\u4e00-\u9fa5]/.test(core)) {
            return text;
        }
        // 关键防御：超过 3 词的长句绝对不进行分词替换，保持英文原汁原味
        const wordsCount = core.split(/\s+/).filter(Boolean).length;
        if (wordsCount > 3) {
            return text;
        }

        let replaced = false;
        let temp = core.replace(CORE_WORDS_UNION_REGEX, (matched) => {
            const lower = matched.toLowerCase();
            if (coreWords[lower]) {
                replaced = true;
                return coreWords[lower];
            }
            return matched;
        });

        let finalTranslated = replaced ? temp : core;
        // 消除中文字符之间可能由分词替换残留的空格
        finalTranslated = finalTranslated.replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, '$1$2');

        // 特殊去重与边界清洗
        finalTranslated = finalTranslated.replace(/使用使用 Google 插件构建/g, '使用 Google 插件构建');
        finalTranslated = finalTranslated.replace(/Advanced\s*设置/gi, '高级设置');
        finalTranslated = finalTranslated.replace(/Collapse\s*All/gi, '全部折叠');
        finalTranslated = finalTranslated.replace(/Expand\s*All/gi, '全部展开');
        finalTranslated = finalTranslated.replace(/了解更多关于\s*继承\s*Global/gi, '了解更多关于 继承全局');
        finalTranslated = finalTranslated.replace(/继承\s*Global/gi, '继承全局');
        finalTranslated = finalTranslated.replace(/Also\s+includes\s*(?:Global\s*Permissions|全局权限)\s*when\s+working\s+in\s+this\s+project\.?[。.]?/gi, '在当前项目中工作时，亦继承全局权限配置。');
        finalTranslated = finalTranslated.replace(/Configure 智能体 执行[,\s]+queued 消息 delivery[,\s]+and 权限[。.]?/g, '配置智能体执行策略、消息队列发送机制以及安全权限。');
        finalTranslated = finalTranslated.replace(/Automatic 检查更新/g, '自动检查更新');
        finalTranslated = finalTranslated.replace(/每周限额\s*Remaining/gi, '每周限额剩余');
        finalTranslated = finalTranslated.replace(/五小时限额\s*Remaining/gi, '5 小时限额剩余');
        finalTranslated = finalTranslated.replace(/Claude and GPT 模型/g, 'Claude 与 GPT 模型');
        finalTranslated = finalTranslated.replace(/命令\s*palette/gi, '命令面板');
        finalTranslated = finalTranslated.replace(/(?:工作了\s*持续|总耗时\s*持续|Worked for)\s*(.+)/gi, '总耗时 $1');
        finalTranslated = finalTranslated.replace(/(?:Thought\s*持续|思考了\s*持续)\s*(.+)/gi, '思考了 $1');
        finalTranslated = finalTranslated.replace(/查看\s*could not be opened/gi, '查看文件无法打开');
        finalTranslated = finalTranslated.replace(/could not be opened/gi, '无法打开');
        finalTranslated = finalTranslated.replace(/(\d+)\s+searches?/gi, '$1 次搜索');

        if (matchPunc) {
            finalTranslated += trailPunc;
        }

        if (stringCache.size < MAX_STRING_CACHE) {
            stringCache.set(trimmed, finalTranslated);
        }
        return text.replace(trimmed, finalTranslated);
    }

    // ---------------------------------------------------------------------------
    // 3. 物理安全免疫沙盒与单次祖先检查 (DOM Safety Sandbox)
    // ---------------------------------------------------------------------------
    const skipCache = new WeakMap();

    function shouldSkipNode(node) {
        if (!node) return true;

        const element = node.nodeType === 3 ? node.parentElement : node; // 3 === Node.TEXT_NODE
        if (!element) return false;

        // 1. 记忆化缓存查询：O(1) 瞬间返回，消除万次重复树遍历
        if (skipCache.has(element)) {
            return skipCache.get(element);
        }

        // 2. 绝对不能翻译的脚本/样式/按键标签
        if (skipTags.includes(element.tagName)) {
            skipCache.set(element, true);
            return true;
        }

        // 核心保护：斜杠命令与提及建议菜单的触发词标签（保持 /boost, /schedule 等原生命令不变）
        // 针对提及菜单 (@) 中的分类标签（如 Rules -> 规则, Conversation -> 对话 等）特权放行汉化
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

        // 思考过程触发药丸按钮（如 "Thought for 4.2s" 折叠栏标题）：必须放行汉化为 "思考了 4.2 秒"
        const isThinkingTrigger = element.closest && element.closest('button[data-testid="thinking-collapsible-trigger"]');
        if (isThinkingTrigger) {
            skipCache.set(element, false);
            return false;
        }

        // 3. 特殊特权放行：针对执行步骤的药丸标签（如 Ran, Explored, Edited, Viewed, Thought, Thinking, Working 等）
        // 无论其父级为 SPAN、CODE 还是 BUTTON，只要是系统执行药丸且不在用户提问气泡内，一律无条件放行汉化
        const textContent = (element.innerText || element.textContent || '').trim();
        const isActionPill = textContent.length <= 25 && /^(Explored|Ran|Viewed|Edited|Thought|Thinking|Working)$/i.test(textContent);
        if (isActionPill) {
            let inUserInput = false;
            let inThinkingContent = false;
            let checkCur = element;
            while (checkCur && checkCur !== document.body) {
                if (checkCur.classList) {
                    if (checkCur.classList.contains('group/user-input-step') ||
                        checkCur.classList.contains('cursor-edit') ||
                        checkCur.classList.contains('thought-content') ||
                        checkCur.classList.contains('thinking-content') ||
                        checkCur.classList.contains('thought-box') ||
                        checkCur.classList.contains('thought-container') ||
                        checkCur.classList.contains('conversation-container') ||
                        checkCur.classList.contains('chat-message-view') ||
                        checkCur.classList.contains('prose') ||
                        checkCur.classList.contains('stream-markdown-body') ||
                        checkCur.classList.contains('stream-markdown') ||
                        checkCur.classList.contains('path-label') ||
                        checkCur.classList.contains('breadcrumb') ||
                        checkCur.classList.contains('workspace-dropdown-item') ||
                        checkCur.classList.contains('folder-item')) {
                        inThinkingContent = true;
                        break;
                    }
                }
                if (checkCur.getAttribute && checkCur.getAttribute('data-message-id')) {
                    inThinkingContent = true;
                    break;
                }
                if (checkCur.parentElement && checkCur.parentElement.querySelector) {
                    const trigger = checkCur.parentElement.querySelector('button[data-testid="thinking-collapsible-trigger"]');
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

        // 4. 输入框/文本域/富文本编辑器绝对跳过
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

        // 5. 检查元素自身是否带有代码语言标记属性
        if (element.getAttribute) {
            if (element.getAttribute('data-language') ||
                element.getAttribute('data-code') ||
                element.getAttribute('data-line') ||
                element.getAttribute('data-line-number')) {
                skipCache.set(element, true);
                return true;
            }
        }

        // 6. 向上递归检查祖先节点（带路径记忆化剪枝）
        let cur = element;
        let shouldSkip = false;
        while (cur && cur !== document.body) {
            if (skipCache.has(cur)) {
                shouldSkip = skipCache.get(cur);
                break;
            }

            // 核心防御：模型思考链正文容器、对话容器、Markdown正文与路径特征绝对跳过
            // 思考链为 AI 运行时生成的自由英文/动态推理流，切勿进行逐词或断句翻译，杜绝中英夹杂混乱
            if (cur.classList && (
                cur.classList.contains('cursor-edit') ||
                cur.classList.contains('thought-content') ||
                cur.classList.contains('thinking-content') ||
                cur.classList.contains('thought-box') ||
                cur.classList.contains('thought-container') ||
                cur.classList.contains('conversation-container') ||
                cur.classList.contains('chat-message-view') ||
                cur.classList.contains('prose') ||
                cur.classList.contains('stream-markdown-body') ||
                cur.classList.contains('stream-markdown') ||
                cur.classList.contains('path-label') ||
                cur.classList.contains('breadcrumb') ||
                cur.classList.contains('workspace-dropdown-item') ||
                cur.classList.contains('folder-item')
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.getAttribute) {
                if (cur.getAttribute('data-message-id')) {
                    shouldSkip = true;
                    break;
                }
                const testId = cur.getAttribute('data-testid');
                if (testId && (
                    testId === 'thinking-collapsible-content' ||
                    testId === 'thought-content' ||
                    testId === 'thinking-content' ||
                    testId === 'thought-box'
                )) {
                    shouldSkip = true;
                    break;
                }
            }

            // 思考折叠栏内容区域：位于 thinking-collapsible-trigger 旁的展开正文容器
            if (cur.parentElement && cur.parentElement.querySelector) {
                const trigger = cur.parentElement.querySelector('button[data-testid="thinking-collapsible-trigger"]');
                if (trigger && cur !== trigger && !trigger.contains(cur)) {
                    shouldSkip = true;
                    break;
                }
            }

            // 用户输入框与富文本编辑器
            if (cur.getAttribute && (
                cur.getAttribute('contenteditable') === 'true' ||
                cur.getAttribute('role') === 'textbox' ||
                cur.getAttribute('data-lexical-editor') === 'true'
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.getAttribute && (
                cur.getAttribute('data-language') ||
                cur.getAttribute('data-code') ||
                cur.getAttribute('data-line') ||
                cur.getAttribute('data-line-number') ||
                cur.getAttribute('role') === 'code'
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.classList && (
                cur.classList.contains('group/user-input-step') ||
                cur.classList.contains('user-message') ||
                cur.classList.contains('cursor-text') ||
                cur.classList.contains('monaco-editor') ||
                cur.classList.contains('editor-instance') ||
                cur.classList.contains('input-area') ||
                cur.classList.contains('chat-input')
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.className && typeof cur.className === 'string') {
                const lowerClass = cur.className.toLowerCase();
                if (
                    lowerClass.includes('code-line') ||
                    lowerClass.includes('view-line') ||
                    codeClassPattern.test(cur.className)
                ) {
                    shouldSkip = true;
                    break;
                }
            }

            if (cur.tagName === 'PRE') {
                shouldSkip = true;
                break;
            }

            cur = cur.parentElement;
        }

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
                set(val) { origSet.call(document, translateString(val)); }
            });
        }
    } catch (_) {}

    // ---------------------------------------------------------------------------
    // 4. DOM 调度层 (微任务聚合、WeakSet 记忆化与祖先剪枝)
    // ---------------------------------------------------------------------------
    const translatedNodes = new WeakSet();

    function translateNode(node) {
        if (!node) return;
        if (shouldSkipNode(node)) return;

        if (node.nodeType === 3) { // Node.TEXT_NODE
            if (translatedNodes.has(node)) return;
            const original = node.nodeValue;
            if (!original || !original.trim()) return;
            const translated = translateString(original);
            if (original !== translated) {
                node.nodeValue = translated;
                translatedNodes.add(node);
            } else if (!/[a-zA-Z]/.test(original)) {
                translatedNodes.add(node);
            }
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
            ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder', 'value'].forEach(attr => {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    // 双重锁死：绝对不翻译任何输入框或编辑区的用户输入 value
                    if (attr === 'value' && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
                        return;
                    }
                    const original = node.getAttribute(attr);
                    if (original && (node.tagName !== 'INPUT' || node.type === 'button' || node.type === 'submit' || attr !== 'value')) {
                        const translated = translateString(original);
                        if (original !== translated) {
                            node.setAttribute(attr, translated);
                        }
                    }
                }
            });
            if (node.shadowRoot) {
                observeRoot(node.shadowRoot);
                translateNode(node.shadowRoot);
            }
            for (let i = 0; i < node.childNodes.length; i++) {
                translateNode(node.childNodes[i]);
            }
        } else if (node.nodeType === 11) { // Node.DOCUMENT_FRAGMENT_NODE
            for (let i = 0; i < node.childNodes.length; i++) {
                translateNode(node.childNodes[i]);
            }
        }
    }

    const observerConfig = {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder', 'value']
    };

    const observedRoots = new WeakSet();
    let isTranslating = false;
    let batchRafHandle = null;
    const pendingAddedNodes = new Set();
    const pendingTextNodes = new Set();
    const pendingAttrNodes = new Map();

    const scheduleBatchFrame = (fn) => {
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(fn);
        } else if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(fn);
        } else {
            setTimeout(fn, 0);
        }
    };

    function scheduleBatchTranslation() {
        if (batchRafHandle !== null) return;
        batchRafHandle = true;
        scheduleBatchFrame(processBatchTranslation);
    }

    function processBatchTranslation() {
        batchRafHandle = null;
        if (isTranslating) return;
        isTranslating = true;

        try {
            // 1. 批量处理属性变更
            if (pendingAttrNodes.size > 0) {
                for (const [target, attrs] of pendingAttrNodes) {
                    if (!shouldSkipNode(target)) {
                        for (const attrName of attrs) {
                            if (attrName === 'value' && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                                continue;
                            }
                            const original = target.getAttribute(attrName);
                            if (original) {
                                const translated = translateString(original);
                                if (original !== translated) {
                                    target.setAttribute(attrName, translated);
                                }
                            }
                        }
                    }
                }
                pendingAttrNodes.clear();
            }

            // 2. 批量处理文本变更 (characterData)
            if (pendingTextNodes.size > 0) {
                for (const node of pendingTextNodes) {
                    if (!shouldSkipNode(node)) {
                        const original = node.nodeValue;
                        if (original && original.trim()) {
                            const translated = translateString(original);
                            if (original !== translated) {
                                node.nodeValue = translated;
                                translatedNodes.add(node);
                            } else if (!/[a-zA-Z]/.test(original)) {
                                translatedNodes.add(node);
                            }
                        }
                    }
                }
                pendingTextNodes.clear();
            }

            // 3. 批量处理新增节点（性能优化：祖先包含剪枝，彻底消灭 O(N^2) 嵌套递归）
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
                    if (!hasAncestor) {
                        rootNodes.push(node);
                    }
                }
                pendingAddedNodes.clear();

                for (let i = 0; i < rootNodes.length; i++) {
                    const node = rootNodes[i];
                    if (node.shadowRoot) {
                        observeRoot(node.shadowRoot);
                    }
                    if (!shouldSkipNode(node)) {
                        translateNode(node);
                    }
                }
            }
        } catch (e) {
            console.error('[AntigravityCN] Batch translation error:', e);
        } finally {
            isTranslating = false;
        }
    }

    function observeRoot(root) {
        if (!root || observedRoots.has(root)) return;
        observedRoots.add(root);

        const observer = new MutationObserver((mutations) => {
            let needsSchedule = false;
            for (let i = 0; i < mutations.length; i++) {
                const mutation = mutations[i];
                if (mutation.type === 'childList') {
                    const added = mutation.addedNodes;
                    for (let j = 0; j < added.length; j++) {
                        const node = added[j];
                        if (node.shadowRoot) {
                            observeRoot(node.shadowRoot);
                        }
                        pendingAddedNodes.add(node);
                        needsSchedule = true;
                    }
                } else if (mutation.type === 'characterData') {
                    translatedNodes.delete(mutation.target);
                    pendingTextNodes.add(mutation.target);
                    needsSchedule = true;
                } else if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    let attrSet = pendingAttrNodes.get(target);
                    if (!attrSet) {
                        attrSet = new Set();
                        pendingAttrNodes.set(target, attrSet);
                    }
                    attrSet.add(mutation.attributeName);
                    needsSchedule = true;
                }
            }

            if (needsSchedule) {
                scheduleBatchTranslation();
            }
        });

        observer.observe(root, observerConfig);
    }

    // Shadow DOM 穿透挂钩
    const originalAttachShadow = Element.prototype.attachShadow;
    if (originalAttachShadow) {
        Element.prototype.attachShadow = function() {
            const shadowRoot = originalAttachShadow.apply(this, arguments);
            observeRoot(shadowRoot);
            return shadowRoot;
        };
    }

    function safeScan() {
        if (document.body) {
            try {
                translateNode(document.body);
            } catch (e) {
                console.error('[AntigravityCN] Translation scan error:', e);
            }
            observeRoot(document.body);
        }
    }

    function startObserver() {
        safeScan();

        // 1. 渐进式多阶挂载兜底 (Progressive Mounting Backstop)
        [50, 150, 400, 1000, 2500].forEach(delay => {
            setTimeout(safeScan, delay);
        });

        // 2. 窗口激活 (Focus) 与可见性恢复 (VisibilityChange) 兜底
        window.addEventListener('focus', safeScan);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                safeScan();
            }
        });

        // 3. SPA 路由切换监听 (History API Hook)
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
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
})();
