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

