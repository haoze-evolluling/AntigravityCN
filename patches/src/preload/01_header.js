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

    // 动态正则与字符串缓存 (有界 LRU Map)
    const stringCache = new Map();
    const MAX_STRING_CACHE = 5000;

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

