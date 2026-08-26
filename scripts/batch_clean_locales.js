const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');
const preloadFile = path.resolve(__dirname, '../patches/preload.js');

// 模块优先级（跨文件去重时，通用/核心模块优先保留）
const MODULE_PRIORITY = [
    '通用.json',
    '对话.json',
    '设置.json',
    '工作区.json'
];

// 已知微小语义冲突的标准决策表
const CONFLICT_RESOLUTIONS = {
    'email': { preferKey: 'Email', preferVal: '电子邮箱' },
    'run in background': { preferKey: 'Run in background', preferVal: '在后台保持运行' }
};

/**
 * 评估 Key 的排版质量分（得分高者作为主键保留）
 * 规则：Title Case > 句首大写 > 全小写；简洁无末尾标点优先
 */
function getKeyScore(k) {
    if (!k || k.length === 0) return 0;
    let score = 0;
    if (k[0] >= 'A' && k[0] <= 'Z') score += 10;
    const words = k.split(/\s+/);
    const capitalizedWords = words.filter(w => w.length > 0 && w[0] >= 'A' && w[0] <= 'Z').length;
    score += capitalizedWords;
    if (!k.endsWith('.') && !k.endsWith(':')) score += 3;
    return score;
}

/**
 * 核心批量清洗主函数
 */
function batchCleanLocales({ dryRun = true, backup = false } = {}) {
    if (!fs.existsSync(localesDir)) {
        console.error(`[Error] 词典目录不存在: ${localesDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
    // 按模块优先级排序
    files.sort((a, b) => {
        const idxA = MODULE_PRIORITY.indexOf(a);
        const idxB = MODULE_PRIORITY.indexOf(b);
        return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
    });

    console.log(`================================================================`);
    console.log(` AntigravityCN 词典全自动批量清洗与去重工具`);
    console.log(` 词典路径 : ${localesDir}`);
    console.log(` 扫描文件 : ${files.length} 个 JSON 模块`);
    console.log(` 执行模式 : ${dryRun ? 'DRY-RUN (仅预览分析，不修改文件)' : 'APPLY (批量覆写并优化文件)'}`);
    console.log(`================================================================\n`);

    // 备份原文件
    if (backup && !dryRun) {
        const backupDir = path.resolve(__dirname, '../patches/locales/backup_' + Date.now());
        fs.mkdirSync(backupDir, { recursive: true });
        for (const file of files) {
            fs.copyFileSync(path.join(localesDir, file), path.join(backupDir, file));
        }
        console.log(`[+] 已备份原始词典至: ${backupDir}\n`);
    }

    let totalOriginalEntries = 0;
    let totalWhitespaceCleaned = 0;
    let totalCaseDuplicatesRemoved = 0;
    let totalPunctuationVariantsRemoved = 0;
    let totalCrossFileDuplicatesRemoved = 0;

    const processedFiles = {};

    // -------------------------------------------------------------
    // 第一阶段：单文件内部深度清洗 (Trim + Case + Punctuation + Hyphen)
    // -------------------------------------------------------------
    for (const file of files) {
        const filePath = path.join(localesDir, file);
        const raw = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(raw);
        const originalKeys = Object.keys(json);
        totalOriginalEntries += originalKeys.length;

        // 分组桶：以标准化词干（去掉首尾空格、末尾句号/冒号、连字符转空格、全小写）为唯一标识
        const stemGroups = new Map();

        originalKeys.forEach((rawKey, index) => {
            const rawVal = json[rawKey];
            const trimmedKey = rawKey.trim();
            const trimmedVal = typeof rawVal === 'string' ? rawVal.trim() : rawVal;

            if (rawKey !== trimmedKey || (typeof rawVal === 'string' && rawVal !== trimmedVal)) {
                totalWhitespaceCleaned++;
            }

            // 词干归一化: 去除末尾 ./:/… 以及统一连字符
            const stem = trimmedKey
                .toLowerCase()
                .replace(/[\.\:\…\s]+$/g, '')
                .replace(/[-\s]+/g, ' ');

            if (!stemGroups.has(stem)) {
                stemGroups.set(stem, []);
            }
            stemGroups.get(stem).push({
                rawKey,
                rawVal,
                key: trimmedKey,
                val: trimmedVal,
                originalIndex: index,
                hasDot: trimmedKey.endsWith('.'),
                hasColon: trimmedKey.endsWith(':')
            });
        });

        const cleanedModule = {};

        for (const [stem, group] of stemGroups.entries()) {
            if (group.length === 1) {
                cleanedModule[group[0].key] = group[0].val;
                continue;
            }

            // 冲突判定与解决
            const lowerKey = group[0].key.toLowerCase();
            if (CONFLICT_RESOLUTIONS[lowerKey]) {
                const res = CONFLICT_RESOLUTIONS[lowerKey];
                cleanedModule[res.preferKey] = res.preferVal;
                totalCaseDuplicatesRemoved += (group.length - 1);
                continue;
            }

            // 优先选择最佳 Key 格式
            group.sort((a, b) => {
                const scoreDiff = getKeyScore(b.key) - getKeyScore(a.key);
                if (scoreDiff !== 0) return scoreDiff;
                return a.originalIndex - b.originalIndex;
            });
            const best = group[0];

            // 统计重复类型
            const isPunctuationDup = group.some(g => g.key.replace(/[\.\:\…\s]+$/g, '') === best.key.replace(/[\.\:\…\s]+$/g, '') && g.key !== best.key);
            if (isPunctuationDup) {
                totalPunctuationVariantsRemoved += (group.length - 1);
            } else {
                totalCaseDuplicatesRemoved += (group.length - 1);
            }

            // 标点对齐：若主键有句号且翻译未带句号，自动补齐；若主键无句号，保证翻译干净
            let finalVal = best.val;
            if (best.hasDot && typeof finalVal === 'string' && !finalVal.endsWith('。') && !finalVal.endsWith('.')) {
                finalVal = finalVal + '。';
            } else if (!best.hasDot && typeof finalVal === 'string') {
                // 如果其他条目存在干净的无句号翻译，优先使用
                const cleanValItem = group.find(g => !g.hasDot);
                if (cleanValItem) {
                    finalVal = cleanValItem.val.replace(/[.。]+$/, '');
                }
            }

            cleanedModule[best.key] = finalVal;
            console.log(`[单文件去重 - ${file}]`);
            console.log(`   保留主项 : ${JSON.stringify(best.key)} -> ${JSON.stringify(finalVal)}`);
            console.log(`   剔除冗余 : ${group.slice(1).map(g => JSON.stringify(g.rawKey)).join(', ')}\n`);
        }

        processedFiles[file] = cleanedModule;
    }

    // -------------------------------------------------------------
    // 第二阶段：跨模块重叠词条批量去重 (Cross-Module Deduplication)
    // -------------------------------------------------------------
    const globalSeen = new Map(); // stem -> { file, key, val }

    for (const file of files) {
        const moduleJson = processedFiles[file];
        const finalModule = {};

        for (const [key, val] of Object.entries(moduleJson)) {
            const stem = key.toLowerCase().replace(/[\.\:\…\s]+$/g, '').replace(/[-\s]+/g, ' ');

            if (globalSeen.has(stem)) {
                const prev = globalSeen.get(stem);
                // 如果高优先级模块已有相同或等价翻译，则当前模块安全剔除
                const valClean = typeof val === 'string' ? val.replace(/[.。:：]+$/, '') : val;
                const prevValClean = typeof prev.val === 'string' ? prev.val.replace(/[.。:：]+$/, '') : prev.val;

                if (valClean === prevValClean) {
                    totalCrossFileDuplicatesRemoved++;
                    console.log(`[跨模块去重 - ${file}]`);
                    console.log(`   已存在于 [${prev.file}] : "${prev.key}": "${prev.val}"`);
                    console.log(`   从当前 [${file}] 剔除   : "${key}": "${val}"\n`);
                    continue;
                }
            }

            globalSeen.set(stem, { file, key, val });
            finalModule[key] = val;
        }

        processedFiles[file] = finalModule;
    }

    // -------------------------------------------------------------
    // 第三阶段：批量写入文件
    // -------------------------------------------------------------
    let finalTotalEntries = 0;
    for (const file of files) {
        const count = Object.keys(processedFiles[file]).length;
        finalTotalEntries += count;
        if (!dryRun) {
            const filePath = path.join(localesDir, file);
            fs.writeFileSync(filePath, JSON.stringify(processedFiles[file], null, 2) + '\n', 'utf8');
        }
    }

    // -------------------------------------------------------------
    // 第四阶段：同步检查/增强 preload.js 运行时的降级兼容引擎
    // -------------------------------------------------------------
    enhancePreloadEngine({ dryRun });

    console.log(`================================================================`);
    console.log(` 批量清洗与去重完成汇总报告:`);
    console.log(`   - 原始词条总数           : ${totalOriginalEntries}`);
    console.log(`   - 规范化空格清洗项       : ${totalWhitespaceCleaned}`);
    console.log(`   - 大小写重复剔除项       : ${totalCaseDuplicatesRemoved}`);
    console.log(`   - 标点符号变体剔除项     : ${totalPunctuationVariantsRemoved}`);
    console.log(`   - 跨模块重叠词条剔除项   : ${totalCrossFileDuplicatesRemoved}`);
    console.log(`   - 累计消除冗余配置项     : ${totalOriginalEntries - finalTotalEntries}`);
    console.log(`   - 最终保留高质词条总数   : ${finalTotalEntries}`);
    console.log(`================================================================`);
}

/**
 * 自动校验并注入 preload.js 中的智能降级匹配逻辑
 */
function enhancePreloadEngine({ dryRun = true } = {}) {
    if (!fs.existsSync(preloadFile)) return;
    let content = fs.readFileSync(preloadFile, 'utf8');

    // 检查是否已有末尾标点降级逻辑
    if (!content.includes('1.1.5.5 末尾标点智能降级匹配')) {
        const regex = /(const normalizedLower = normalized\.toLowerCase\(\);\s+if \(DICT_LOWER\[normalizedLower\]\) \{\s+return str\.replace\(trimmed, DICT_LOWER\[normalizedLower\]\);\s+\})/;
        
        const fallbackSnippet = `$1\n\n        // 1.1.5.5 末尾标点智能降级匹配（句号 . / 冒号 :）\n        if (trimmed.endsWith('.') && !trimmed.endsWith('..')) {\n            const noDot = trimmed.slice(0, -1).trim();\n            const trans = DICT[noDot] || DICT_LOWER[noDot.toLowerCase()];\n            if (trans) {\n                const transClean = trans.replace(/[.。]+$/, '');\n                return str.replace(trimmed, transClean + '。');\n            }\n        } else {\n            const withDot = trimmed + '.';\n            const trans = DICT[withDot] || DICT_LOWER[withDot.toLowerCase()];\n            if (trans) {\n                const transClean = trans.replace(/[.。]+$/, '');\n                return str.replace(trimmed, transClean);\n            }\n        }\n\n        if (trimmed.endsWith(':')) {\n            const noColon = trimmed.slice(0, -1).trim();\n            const trans = DICT[noColon] || DICT_LOWER[noColon.toLowerCase()];\n            if (trans) {\n                const transClean = trans.replace(/[:：]+$/, '');\n                return str.replace(trimmed, transClean + '：');\n            }\n        }`;

        if (regex.test(content)) {
            content = content.replace(regex, fallbackSnippet);
            if (!dryRun) {
                fs.writeFileSync(preloadFile, content, 'utf8');
                console.log(`[+] 已自动为 patches/preload.js 注入标点与大小写智能降级匹配引擎。`);
            } else {
                console.log(`[DryRun] preload.js 匹配引擎待注入智能降级逻辑。`);
            }
        }
    }
}

const isApply = process.argv.includes('--apply');
const isBackup = process.argv.includes('--backup') || isApply;
batchCleanLocales({ dryRun: !isApply, backup: isBackup });
