    // ---------------------------------------------------------------------------
    // 2. 核心文本翻译分发管道 (Translation Pipeline)
    // ---------------------------------------------------------------------------
    // strict = true 时进入保守模式（上下文判定为未知区域）：仅词典精确匹配与强锚定系统规则生效，
    // 分词降级、模糊匹配与宽松正则全部禁用，确保未知容器中的 AI 原文/技术术语保持原样
    function translateString(text, strict) {
        if (!text || typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (!trimmed) return text;

        // 被空白或 <code> 标签拆分的界面碎片：React 会将空格拆为独立文本节点
        if (/^Type$/.test(text)) return '输入';
        if (/^and select$/.test(text)) return '并选择';
        if (/^Modified in$/.test(text)) return '修改于';

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
            if (/Scan the code to.*copy link/i.test(trimmed)) {
                const fixed = '扫描二维码以在远程控制中打开此设备，或复制链接。';
                if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
                return text.replace(trimmed, fixed);
            }
            if (/Scan the code to.*Remote Control/i.test(trimmed)) {
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

        if (/^See\s+(\d+)\s+more$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^See\s+(\d+)\s+more$/i, '查看更多（$1）');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Card\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Card\s+(\d+)\s+of\s+(\d+)$/i, '第 $1 张，共 $2 张');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        // 首页问候语（Antigravity 2.31+ 动态插入用户名）
        if (/^Welcome back,\s*(.+?)\.\s*Where should we pick up\?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Welcome back,\s*(.+?)\.\s*Where should we pick up\?$/i, '欢迎回来，$1。我们从哪里继续？');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Welcome back\.\s*Where should we pick up\?$/i.test(trimmed)) {
            const fixed = '欢迎回来。我们从哪里继续？';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Hey\s+(.+?),\s*what should we build today\?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Hey\s+(.+?),\s*what should we build today\?$/i, '你好，$1。今天想构建什么？');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Hey there,\s*what should we build today\?$/i.test(trimmed)) {
            const fixed = '你好，今天想构建什么？';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Good to see you,\s*(.+?)\.\s*What's next\?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Good to see you,\s*(.+?)\.\s*What's next\?$/i, '很高兴见到你，$1。接下来做什么？');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Good to see you\.\s*What's next\?$/i.test(trimmed)) {
            const fixed = '很高兴见到你。接下来做什么？';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        // 输入区无障碍标签（动态携带当前值）
        if (/^Select project, current:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Select project, current:\s*(.+)$/i, '选择项目，当前：$1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Branch, current:\s*(.+?)\s+Description:\s*(.*)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Branch, current:\s*(.+?)\s+Description:\s*(.*)$/i, '分支，当前：$1 描述：$2');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Branch, current:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Branch, current:\s*(.+)$/i, '分支，当前：$1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Select model, current:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Select model, current:\s*(.+)$/i, '选择模型，当前：$1');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Send feedback as\s+(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Send feedback as\s+(.+)$/i, '以 $1 身份发送反馈');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Agent permissions preset selector, current:\s*(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Agent permissions preset selector, current:\s*(.+)$/i, (_m, preset) => {
                const localized = dictionary[preset] || lowerDictionary.get(preset.toLowerCase()) || preset;
                return '智能体权限预设选择器，当前：' + localized;
            });
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Permanently delete\s+(.+?)\s+including\s+(\d+)\s+active conversations?\.?$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Permanently delete\s+(.+?)\s+including\s+(\d+)\s+active conversations?\.?$/i, '永久删除 $1 及其 $2 个活跃对话。');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Whether the agent asks you to review its documents\.\s*Modified in\s+(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Whether the agent asks you to review its documents\.\s*Modified in\s+(.+)$/i, '智能体是否会要求你审阅其文档。已在 $1 中修改');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Modified in\s+(.+)$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Modified in\s+(.+)$/i, '已在 $1 中修改');
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(\d+)(s|m|h|d|w|mo|y)\s+ago$/i.test(trimmed)) {
            const unitMap = { s: '秒', m: '分钟', h: '小时', d: '天', w: '周', mo: '个月', y: '年' };
            const match = trimmed.match(/^(\d+)(s|m|h|d|w|mo|y)\s+ago$/i);
            const fixed = match[1] + ' ' + unitMap[match[2].toLowerCase()] + '前';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^just now$/i.test(trimmed)) {
            const fixed = '刚刚';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Ran\s+(\d+)\s+commands$/i.test(trimmed)) {
            const fixed = trimmed.replace(/^Ran\s+(\d+)\s+commands$/i, '已运行 $1 条命令');
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

        if (/^Advanced\s*Settings$/i.test(trimmed)) {
            const fixed = '高级设置';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Collapse\s+All$/i.test(trimmed)) {
            const fixed = '全部折叠';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Expand\s+All$/i.test(trimmed)) {
            const fixed = '全部展开';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^(?:Inherit|Inherits)\s+Global$/i.test(trimmed)) {
            const fixed = '继承全局';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Inherits\s+your\s+Global\s+Permissions\s+when\s+working\s+in\s+this\s+project\.?$/i.test(trimmed)) {
            const fixed = '在此项目中工作时继承您的全局权限。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Also\s+includes.*Global\s+Permissions.*when\s+working\s+in\s+this\s+project/i.test(trimmed)) {
            const fixed = '在当前项目中工作时，亦继承全局权限配置。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Modify permissions for/i.test(trimmed)) {
            const fixed = '修改针对文件系统、终端命令以及 MCP 工具的安全权限。';
            if (stringCache.size < MAX_STRING_CACHE) stringCache.set(cacheKey, fixed);
            return text.replace(trimmed, fixed);
        }

        if (/^Tool[\s ]+Permissions$/i.test(trimmed)) {
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
        if (/^Thought for (.+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Thought for (.+)$/i);
            const timeSec = m[1].replace(/seconds?/i, '秒').replace(/s\b/i, ' 秒');
            dynamicMatch = '思考了 ' + timeSec;
            isDynamic = true;
        } else if (/^Thinking for (.+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Thinking for (.+)$/i);
            const timeSec = m[1].replace(/seconds?/i, '秒').replace(/s\b/i, ' 秒');
            dynamicMatch = '思考了 ' + timeSec;
            isDynamic = true;
        } else if (/^Thinking \((.+)\)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Thinking \((.+)\)$/i, '正在思考 ($1)');
            isDynamic = true;
        }

        if (/^Worked for (.+)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Worked for (.+)$/i, '总耗时 $1');
            isDynamic = true;
        }
        if (/^\d+ files? changed(.*)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^(\d+) files? changed(.*)/i, '$1 个文件已更改$2');
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
        if (/^\d+(?:\.\d+)?% of the (?:customization )?budget is (?:available|used)\.?$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch
                .replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is available\.?/i, '自定义额度尚有 $1% 可用。')
                .replace(/(\d+(?:\.\d+)?)% of the (?:customization )?budget is used\.?/i, '已使用 $1% 的自定义额度。');
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

        // 带模型名的限额标签（如 "Gemini 4 Argon Weekly Limit"），保留模型英文名
        if (/^(.+?)\s+(Weekly|Five[- ]Hour|5[- ]Hour|Hourly|Daily|Monthly)\s+Limit$/i.test(trimmed)) {
            const m = trimmed.match(/^(.+?)\s+(Weekly|Five[- ]Hour|5[- ]Hour|Hourly|Daily|Monthly)\s+Limit$/i);
            const unit = m[2].toLowerCase();
            const label = unit === 'weekly' ? '每周限额'
                : (unit === 'five-hour' || unit === 'five hour' || unit === '5-hour' || unit === '5 hour') ? '5 小时限额'
                : unit === 'hourly' ? '每小时限额'
                : unit === 'daily' ? '每日限额' : '每月限额';
            dynamicMatch = m[1] + ' ' + label;
            isDynamic = true;
        }

        // 配额刷新提示句
        if (/You have used some of your.*limit/i.test(trimmed)) {
            dynamicMatch = dynamicMatch
                .replace(/^You have used some of your\s*weekly\s*limit/i, '您已使用了部分每周限额')
                .replace(/^You have used some of your\s*(?:5[- ]hour|five[- ]hour)\s*limit/i, '您已使用了部分 5 小时限额')
                .replace(/^You have used some of your\s*hourly\s*limit/i, '您已使用了部分每小时限额')
                .replace(/^You have used some of your\s*daily\s*limit/i, '您已使用了部分每日限额')
                .replace(/it will fully refresh in\s*/i, ' 它将在以下时间后完全刷新：')
                .replace(/(\d+)\s*days?/gi, ' $1 天')
                .replace(/(\d+)\s*hours?/gi, ' $1 小时')
                .replace(/(\d+)\s*minutes?\.?$/gi, ' $1 分钟')
                .replace(/,\s*/g, '，')
                .replace(/\.\s*$/, '。')
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

        // Version / Updated 词头过于通用（AI 输出常以二者开头），仅在受信任 UI 上下文翻译
        if (!strict && /^Version\s+(\d+.*)$/i.test(trimmed)) {
            dynamicMatch = dynamicMatch.replace(/^Version\s+(\d+.*)$/i, '版本 $1');
            isDynamic = true;
        }
        // 侧边栏时间戳（如 "Updated 8:10"）：仅为时间格式，严格模式下也可安全翻译
        if (/^Updated\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)$/i.test(trimmed)) {
            dynamicMatch = trimmed.replace(/^Updated\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)$/i, '更新于 $1');
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
        if (/Type\s*\/\s*(?:and\s+)?(?:select\s+)?['"]?plan['"]?\s+to\s+have\s+the\s+agent\s+generate\s+a\s+plan\.?/i.test(trimmed)) {
            dynamicMatch = /\.\s*$/.test(trimmed) ? '输入 / 并选择 plan 来让智能体生成计划。' : '输入 / 并选择 plan 来让智能体生成计划';
            isDynamic = true;
        }
        if (/^(?:to\s+)?have\s+the\s+agent\s+generate\s+a\s+plan\.?$/i.test(trimmed)) {
            dynamicMatch = /\.\s*$/.test(trimmed) ? '来让智能体生成计划。' : '来让智能体生成计划';
            isDynamic = true;
        }
        if (/^plan\s+to\s+have\s+the\s+agent\s+generate\s+a\s+plan\.?$/i.test(trimmed)) {
            dynamicMatch = /\.\s*$/.test(trimmed) ? 'plan 来让智能体生成计划。' : 'plan 来让智能体生成计划';
            isDynamic = true;
        }
        if (/^Type\s*\/\s*(?:and)?\s*$/i.test(trimmed)) {
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
