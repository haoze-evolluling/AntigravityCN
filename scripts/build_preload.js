const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../patches/src/preload');
const outputFile = path.resolve(__dirname, '../patches/preload.js');

const MODULE_FILES = [
    '01_header.js',
    '02_pipeline.js',
    '03_guards.js',
    '04_dom.js',
    '05_hooks.js'
];

/**
 * 自动将 patches/src/preload 下的模块拼装为单一独立的 patches/preload.js
 */
function buildPreload({ silent = false } = {}) {
    if (!fs.existsSync(srcDir)) {
        throw new Error(`[build_preload] 源代码目录不存在: ${srcDir}`);
    }

    const chunks = [];
    for (const file of MODULE_FILES) {
        const filePath = path.join(srcDir, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`[build_preload] 子模块文件缺失: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        chunks.push(content);
    }

    const assembled = chunks.join('');
    fs.writeFileSync(outputFile, assembled, 'utf8');

    if (!silent) {
        console.log(`[+] 成功组装 ${MODULE_FILES.length} 个 preload 子模块 -> ${outputFile} (${Buffer.byteLength(assembled, 'utf8')} 字节)`);
    }

    return {
        moduleCount: MODULE_FILES.length,
        outputFile,
        size: Buffer.byteLength(assembled, 'utf8')
    };
}

if (require.main === module) {
    try {
        buildPreload();
    } catch (err) {
        console.error(`[Error] 编译 Preload 失败:`, err.message);
        process.exit(1);
    }
}

module.exports = {
    buildPreload,
    MODULE_FILES
};
