const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const allData = {};
files.forEach(f => {
    allData[f] = JSON.parse(fs.readFileSync(path.join(localesDir, f), 'utf8'));
});

console.log('================================================================');
console.log(' 1. 跨文件重复词条 (Cross-File Overlaps)');
console.log('================================================================');
const globalLower = new Map();
const crossFile = [];
for (const [file, json] of Object.entries(allData)) {
    for (const [k, v] of Object.entries(json)) {
        const lower = k.toLowerCase();
        if (globalLower.has(lower)) {
            const prev = globalLower.get(lower);
            if (prev.file !== file) {
                crossFile.push({ f1: prev.file, f2: file, k1: prev.k, k2: k, v1: prev.v, v2: v });
            }
        } else {
            globalLower.set(lower, { file, k, v });
        }
    }
}
console.log(`跨文件重复总数: ${crossFile.length} 处`);
crossFile.forEach(c => {
    const isSameVal = c.v1 === c.v2;
    console.log(`  - [${c.f1} vs ${c.f2}] "${c.k1}" (${c.v1}) ${isSameVal ? '==' : '!='} "${c.k2}" (${c.v2})`);
});

console.log('\n================================================================');
console.log(' 2. 末尾标点重复（句号 . / 冒号 : 等）(Trailing Punctuation Duplicates)');
console.log('================================================================');
const punctDups = [];
for (const [file, json] of Object.entries(allData)) {
    const stripped = new Map();
    for (const [k, v] of Object.entries(json)) {
        const norm = k.replace(/[\.\:\…\s]+$/g, '').toLowerCase();
        if (stripped.has(norm)) {
            const prev = stripped.get(norm);
            punctDups.push({ file, k1: prev.k, k2: k, v1: prev.v, v2: v });
        } else {
            stripped.set(norm, { k, v });
        }
    }
}
console.log(`末尾标点变体总数: ${punctDups.length} 处`);
punctDups.forEach(p => {
    console.log(`  - [${p.file}] \n      有标点: "${p.k1}" => "${p.v1}"\n      无标点: "${p.k2}" => "${p.v2}"`);
});

console.log('\n================================================================');
console.log(' 3. 连字符与空格变体 (Hyphen vs Space Variants)');
console.log('================================================================');
const hyphenDups = [];
for (const [file, json] of Object.entries(allData)) {
    const stripped = new Map();
    for (const [k, v] of Object.entries(json)) {
        const norm = k.replace(/[-\s]+/g, ' ').toLowerCase();
        if (stripped.has(norm)) {
            const prev = stripped.get(norm);
            if (prev.k !== k) {
                hyphenDups.push({ file, k1: prev.k, k2: k, v1: prev.v, v2: v });
            }
        } else {
            stripped.set(norm, { k, v });
        }
    }
}
console.log(`连字符/空格变体总数: ${hyphenDups.length} 处`);
hyphenDups.forEach(h => {
    console.log(`  - [${h.file}] "${h.k1}" vs "${h.k2}"`);
});
