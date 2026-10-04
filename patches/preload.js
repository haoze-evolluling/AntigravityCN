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

    // @ 提及白名单分类（特权放行汉化）
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
    // strict = true 时进入保守模式（上下文判定为未知区域）：仅词典精确匹配与强锚定系统规则生效，
    // 分词降级、模糊匹配与宽松正则全部禁用，确保未知容器中的 AI 原文/技术术语保持原样
    function translateString(text, strict) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (!trimmed) return text;

        // 性能短路：纯中文、数字、标点瞬间 0 开销原样返回
        if (!/[a-zA-Z]/.test(trimmed)) {
            return text;
        }

        // 0. 极速缓存查询 (O(1))：缓存键携带上下文级别，STRICT 与 TRUSTED 结果互不污染
        const cacheKey = (strict ? '\u0001S\u0001' : '\u0001T\u0001') + trimmed;
        if (stringCache.has(cacheKey)) {
            return text.replace(trimmed, stringCache.get(cacheKey));
        }

        // 宽松规则门禁词数（严格模式下仅短句允许命中部分系统错误模板）
        const trimmedWordCount = trimmed.split(/\s+/).filter(Boolean).length;

        // 1. 特殊长句与 UI 界面前置拦截
        if (trimmed.includes('could not be opened') && (!strict || trimmedWordCount <= 10)) {
            const replacedCouldNot = trimmed.replace(/could not be opened/gi, '无法打开');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, replacedCouldNot);
            return text.replace(trimmed, replacedCouldNot);
        }

        if (/Scan the code to/i.test(trimmed)) {
            if (/Scan the code to.*,\s*or\s*$/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备，或';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
                return text.replace(trimmed, fixed);
            }
            if (/Scan the code to.*(?:copy link|复制链接)/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备，或复制链接。';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
                return text.replace(trimmed, fixed);
            }
            if (/Scan the code to.*(?:Remote Control|远程\s*控制)/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
                return text.replace(trimmed, fixed);
            }
        }

        if (/Continue your work from another device/i.test(trimmed)) {
            let fixed = '借助远程控制从另一台设备继续工作。请扫描下方二维码或打开下方链接。';
            if (!/Scan the QR code/i.test(trimmed)) {
                fixed = '借助远程控制从另一台设备继续工作。';
            }
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/Scan the QR code or open the link below/i.test(trimmed)) {
            const fixed = '扫描下方二维码或打开下方链接。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Invalid tool call$/i.test(trimmed)) {
            const fixed = '无效的工具调用';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^No Project$/i.test(trimmed)) {
            const fixed = '无项目';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^See all\s*\(([^)]+)\)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^See all\s*\(([^)]+)\)$/i, '查看全部 ($1)');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Ran\s+(\d+)\s*(?:commands|命令)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Ran\s+(\d+)\s*(?:commands|命令)$/i, '已运行 $1 条命令');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Load older messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Load older messages,\s*showing\s+(\d+)\s+of\s+(\d+)$/i, '加载历史消息，正在显示 $1 / $2 条');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Fold lines\s+([0-9-]+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Fold lines\s+([0-9-]+)$/i, '折叠第 $1 行');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Advanced\s*Settings|Advanced\s*设置|advanced\s*settings)$/i.test(trimmed)) {
            const fixed = '高级设置';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Collapse\s*All|Collapse\s*all|collapse\s*all)$/i.test(trimmed)) {
            const fixed = '全部折叠';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Expand\s*All|Expand\s*all|expand\s*all)$/i.test(trimmed)) {
            const fixed = '全部展开';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Inherit\s*Global|Inherits\s*Global|继承\s*Global)$/i.test(trimmed)) {
            const fixed = '继承全局';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Inherits\s+your\s+Global\s+Permissions\s+when\s+working\s+in\s+this\s+project\.?$/i.test(trimmed)) {
            const fixed = '在此项目中工作时继承您的全局权限。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Also\s+includes.*(?:Global\s+Permissions|全局权限).*when\s+working\s+in\s+this\s+project/i.test(trimmed)) {
            const fixed = '在当前项目中工作时，亦继承全局权限配置。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Modify permissions for/i.test(trimmed)) {
            const fixed = '修改针对文件系统、终端命令以及 MCP 工具的安全权限。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Tool[\s ]+Permissions|工具[\s ]*Permissions)$/i.test(trimmed)) {
            const fixed = '工具权限';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        // WSL 环境提示动态正则
        if (/^Setting up WSL:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Setting up WSL:\s*(.+)$/i, '正在配置 WSL: $1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Installing into\s*(.+?)[…\.]*$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Installing into\s*(.+?)[…\.]*$/i, '正在安装到 $1…');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^This folder belongs to the WSL distro "([^"]+)", but this window is connected to "([^"]+)"\.?$/i, '此文件夹属于 WSL 发行版“$1”，但当前窗口连接到“$2”。');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^This location cannot be opened in WSL:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^This location cannot be opened in WSL:\s*(.+)$/i, '无法在 WSL 中打开此位置: $1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^The WSL distro "([^"]+)" is no longer installed\.?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^The WSL distro "([^"]+)" is no longer installed\.?$/i, 'WSL 发行版“$1”已不再安装。');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Antigravity opened on Windows instead\.?$/i.test(trimmed)) {
            const fixed = 'Antigravity 已改为在 Windows 本地打开。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Connected to WSL:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Connected to WSL:\s*(.+)$/i, '已连接到 WSL: $1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Plugins are packaged collections of skills and MCPs to help the Agent in$/i.test(trimmed)) {
            const fixed = '插件是技能和 MCP 的打包集合，用于协助智能体在';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Antigravity work with Google developer products/i.test(trimmed)) {
            let fixed = 'Antigravity 中协同 Google 开发者产品工作。';
            if (/change your choices in Settings/i.test(trimmed)) {
                fixed = 'Antigravity 中协同 Google 开发者产品工作。你可以随时在设置中更改你的选择。';
            }
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
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

        // 数量与时间碎片（如 "5 minutes"、"3 hours ago"）：仅受信任 UI 上下文翻译，
        // 避免未知区域中 AI 输出的独立数量词被误改写
        if (!strict) {
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
        }

        // 系统错误模板：仅匹配短主题（路径/标识符），长句（如 AI 输出的完整描述）保持原样
        if (/^[A-Za-z0-9_\-\/\\.]+(?: [A-Za-z0-9_\-\/\\.]+)? does not exist\.?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^([A-Za-z0-9_\-\/\\.]+(?: [A-Za-z0-9_\-\/\\.]+)?) does not exist\.?$/i, '$1 不存在');
            isDynamic = true;
        }
        if (/^[A-Za-z0-9_\-\/\\.]+(?: [A-Za-z0-9_\-\/\\.]+)? was not found\.?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^([A-Za-z0-9_\-\/\\.]+(?: [A-Za-z0-9_\-\/\\.]+)?) was not found\.?$/i, '$1 未找到');
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

        // Version / Updated 词头过于通用（AI 输出常以二者开头），仅在受信任 UI 上下文翻译
        if (!strict && /^Version\s+(\d+.*)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Version\s+(\d+.*)$/i, '版本 $1');
            isDynamic = true;
        }
        if (!strict && /^Updated\s+(.+)$/i.test(trimmed)) {
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
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, dynamicMatch);
            return text.replace(trimmed, dynamicMatch);
        }

        // 3. 字典全词匹配 (精准匹配或大小写不敏感 O(1) 匹配)
        if (dictionary[trimmed]) {
            return text.replace(trimmed, dictionary[trimmed]);
        }
        const lowerMatch = lowerDictionary.get(trimmed.toLowerCase());
        if (lowerMatch) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, lowerMatch);
            return text.replace(trimmed, lowerMatch);
        }

        // 空格规范化匹配
        const normalizedSpace = trimmed.replace(/\s+/g, ' ');
        if (dictionary[normalizedSpace]) {
            return text.replace(trimmed, dictionary[normalizedSpace]);
        }
        const lowerNormMatch = lowerDictionary.get(normalizedSpace.toLowerCase());
        if (lowerNormMatch) {
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, lowerNormMatch);
            return text.replace(trimmed, lowerNormMatch);
        }

        // 4. 剥离末尾标点模糊匹配：仅在受信任 UI 上下文执行
        if (!strict) {
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
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, res);
                return text.replace(trimmed, res);
            }
        }

        // 终点：未命中词典或动态系统规则，保持原样（杜绝拆词污染与中英夹杂）
        return text;
    }

    // ---------------------------------------------------------------------------
    // 3. 物理安全免疫沙盒与上下文分级 (DOM Safety Sandbox & Context Verdicts)
    // ---------------------------------------------------------------------------
    // 上下文判定三级模型：决定文本节点进入哪种翻译强度，从源头避免 AI 输出被误翻译
    //   VERDICT_TRUSTED 明确 UI 控件上下文（按钮/链接/系统菜单/对话框等）：完整翻译管线
    //   VERDICT_STRICT  未知区域（保守模式）：仅允许词典精确匹配与强锚定系统规则，严禁分词与模糊匹配
    //   VERDICT_SKIP    绝对跳过：AI 模型输出 / 思考链正文 / 代码与终端 / 用户输入 / 脚本样式
    const VERDICT_TRUSTED = 0;
    const VERDICT_STRICT = 1;
    const VERDICT_SKIP = 2;

    const skipCache = new WeakMap();

    // UI 控件信任特征：结构标签与 ARIA 角色（命中即视为明确的界面控件上下文）
    const TRUST_TAGS = new Set(['BUTTON', 'A', 'NAV', 'HEADER', 'FOOTER', 'DIALOG', 'MENU', 'MENUBAR', 'OPTION', 'LABEL', 'SUMMARY', 'LEGEND', 'CAPTION', 'TH']);
    const TRUST_ROLES = new Set([
        'button', 'link', 'tab', 'tablist', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
        'dialog', 'alertdialog', 'tooltip', 'switch', 'checkbox', 'radio', 'option', 'combobox', 'listbox',
        'treeitem', 'columnheader', 'gridcell'
    ]);

    function getNodeVerdict(node) {
        if (!node) return VERDICT_SKIP;

        const element = node.nodeType === 3 ? node.parentElement : node; // 3 === Node.TEXT_NODE
        if (!element) return VERDICT_TRUSTED;

        // 1. 记忆化缓存查询：O(1) 瞬间返回，消除万次重复树遍历
        if (skipCache.has(element)) {
            return skipCache.get(element);
        }

        // 2. 绝对不能翻译的脚本/样式/按键标签
        if (skipTags.includes(element.tagName)) {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }

        // 核心保护：斜杠命令与提及建议菜单的触发词标签（保持 /boost, /schedule 等原生命令不变）
        // 针对提及菜单 (@) 中的分类标签（如 Rules -> 规则, Conversation -> 对话 等）特权放行汉化
        const isMenuOptionLabel = element.closest && element.closest('[data-testid="menu-option-label"]');
        if (isMenuOptionLabel) {
            const labelText = (isMenuOptionLabel.innerText || isMenuOptionLabel.textContent || '').trim();
            const verdict = MENTION_CATEGORIES.has(labelText) ? VERDICT_TRUSTED : VERDICT_SKIP;
            skipCache.set(element, verdict);
            return verdict;
        }

        // 思考过程触发药丸按钮（如 "Thought for 4.2s" 折叠栏标题）：系统 UI，放行汉化为 "思考了 4.2 秒"
        const isThinkingTrigger = element.closest && element.closest('button[data-testid="thinking-collapsible-trigger"]');
        if (isThinkingTrigger) {
            skipCache.set(element, VERDICT_TRUSTED);
            return VERDICT_TRUSTED;
        }

        // 智能体折叠操作条触发按钮（如 "Worked for 4m"、"Exploring 19 files, running 50 commands"）：系统 UI，放行汉化
        const isStepCollapsible = element.closest && (
            element.closest('button[data-testid="worked-for-collapsible"]') ||
            element.closest('button[data-testid="tool-group-collapsible"]')
        );
        if (isStepCollapsible) {
            skipCache.set(element, VERDICT_TRUSTED);
            return VERDICT_TRUSTED;
        }

        // 3. 特殊特权放行：针对执行步骤的药丸标签（如 Ran, Explored, Edited, Viewed, Thought, Thinking, Working, Analyzed 等）
        const textContent = (element.innerText || element.textContent || '').trim();
        const isActionPill = textContent.length <= 25 && /^(Explored|Ran|Viewed|Edited|Thought|Thinking|Working|Analyzed)$/i.test(textContent);

        // 4. 输入框/文本域/富文本编辑器绝对跳过
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }
        if (element.getAttribute && (
            element.getAttribute('contenteditable') === 'true' ||
            element.getAttribute('role') === 'textbox'
        )) {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }

        // 5. 代码块与终端容器绝对跳过
        if (element.tagName === 'PRE') {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }
        if (element.tagName === 'CODE') {
            if (!isActionPill) {
                skipCache.set(element, VERDICT_SKIP);
                return VERDICT_SKIP;
            }
        }
        if (element.getAttribute && (
            element.getAttribute('data-language') ||
            element.getAttribute('data-code') ||
            element.getAttribute('data-line') ||
            element.getAttribute('data-line-number')
        )) {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }

        // 6. 向上递归检查祖先节点（Antigravity 2.0 专属现代特征匹配）
        let cur = element;
        let skipSeen = false;
        let trustSeen = false;
        while (cur && cur !== document.body) {
            if (skipCache.has(cur)) {
                const cached = skipCache.get(cur);
                if (cached === VERDICT_SKIP) skipSeen = true;
                else if (cached === VERDICT_TRUSTED) trustSeen = true;
                break;
            }

            // === Antigravity 2.0 核心安全沙盒 ===
            // 6.1 模型最终回复与计划推理流容器（最高优先级跳过）：
            //     彻底解决英文环境下最终回复中英混杂问题，确保模型生成的自由文本原汁原味
            if (cur.getAttribute) {
                const testId = cur.getAttribute('data-testid');
                if (testId === 'planner-response-text' || testId === 'artifact-view') {
                    skipSeen = true;
                    break;
                }
            }

            // 6.2 思考链展开正文容器：位于 thinking-collapsible 或 .cursor-edit 内部
            if (cur.classList && cur.classList.contains('cursor-edit')) {
                skipSeen = true;
                break;
            }
            if (cur.getAttribute && cur.getAttribute('data-testid') === 'thinking-collapsible') {
                skipSeen = true;
                break;
            }
            if (cur.parentElement && cur.parentElement.querySelector) {
                const trigger = cur.parentElement.querySelector('button[data-testid="thinking-collapsible-trigger"]');
                if (trigger && cur !== trigger && !trigger.contains(cur)) {
                    skipSeen = true;
                    break;
                }
            }

            // 6.3 用户提问输入区与消息气泡
            if (cur.getAttribute && (
                cur.getAttribute('data-testid') === 'user-input-step' ||
                cur.getAttribute('data-testid') === 'agent-input-box' ||
                cur.getAttribute('contenteditable') === 'true' ||
                cur.getAttribute('role') === 'textbox'
            )) {
                skipSeen = true;
                break;
            }
            if (cur.classList && (
                cur.classList.contains('group/user-input-step') ||
                cur.classList.contains('notebook-markdown-cell')
            )) {
                skipSeen = true;
                break;
            }

            // 6.4 代码编辑器与终端字体特征
            if (cur.classList && cur.classList.contains('font-mono') && !isActionPill) {
                skipSeen = true;
                break;
            }
            if (cur.tagName === 'PRE') {
                skipSeen = true;
                break;
            }

            // 6.5 UI 控件信任标记：按钮、导航、菜单、对话框等
            if (TRUST_TAGS.has(cur.tagName)) {
                trustSeen = true;
            } else if (cur.getAttribute) {
                const role = cur.getAttribute('role');
                if ((role && TRUST_ROLES.has(role)) || cur.hasAttribute('aria-haspopup')) {
                    trustSeen = true;
                }
            }

            cur = cur.parentElement;
        }

        // 步骤药丸在非思考正文与非用户输入上下文中的特权放行
        if (isActionPill && !skipSeen) {
            skipCache.set(element, VERDICT_TRUSTED);
            return VERDICT_TRUSTED;
        }

        const verdict = skipSeen ? VERDICT_SKIP : (trustSeen ? VERDICT_TRUSTED : VERDICT_STRICT);
        skipCache.set(element, verdict);
        return verdict;
    }

    function shouldSkipNode(node) {
        return getNodeVerdict(node) === VERDICT_SKIP;
    }

    // 窗口标题原生拦截（严格模式：会话名等 AI/用户内容不得被分词误译，仅词典与强锚定规则生效）
    try {
        const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
        if (titleDesc && titleDesc.set) {
            const origSet = titleDesc.set;
            Object.defineProperty(document, 'title', {
                configurable: true,
                enumerable: true,
                get() { return titleDesc.get.call(document); },
                set(val) { origSet.call(document, translateString(val, true)); }
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
            const translated = translateString(original, getNodeVerdict(node) === VERDICT_STRICT);
            if (original !== translated) {
                node.nodeValue = translated;
                translatedNodes.add(node);
            } else if (!/[a-zA-Z]/.test(original)) {
                translatedNodes.add(node);
            }
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
            const nodeVerdict = getNodeVerdict(node);
            const nodeStrict = nodeVerdict === VERDICT_STRICT;
            ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder', 'value'].forEach(attr => {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    // 双重锁死：绝对不翻译任何输入框或编辑区的用户输入 value
                    if (attr === 'value' && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
                        return;
                    }
                    const original = node.getAttribute(attr);
                    if (original && (node.tagName !== 'INPUT' || node.type === 'button' || node.type === 'submit' || attr !== 'value')) {
                        const translated = translateString(original, nodeStrict);
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
                        const attrStrict = getNodeVerdict(target) === VERDICT_STRICT;
                        for (const attrName of attrs) {
                            if (attrName === 'value' && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                                continue;
                            }
                            const original = target.getAttribute(attrName);
                            if (original) {
                                const translated = translateString(original, attrStrict);
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
                            const translated = translateString(original, getNodeVerdict(node) === VERDICT_STRICT);
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
