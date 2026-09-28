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
