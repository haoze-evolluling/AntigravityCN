const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');

// Priority order for module files when resolving cross-file duplicates:
// Global common module has highest priority for general terms.
const MODULE_PRIORITY = [
    'common.json',
    'chat.json',
    'settings.json',
    'workspace.json',
    'subagents.json',
    'models.json',
    'navigation.json',
    'customizations.json',
    'mcp.json'
];

const CONFLICT_RESOLUTIONS = {
    'email': { preferKey: 'Email', preferVal: '电子邮箱' },
    'run in background': { preferKey: 'Run in background', preferVal: '在后台保持运行' }
};

function getKeyScore(k) {
    if (!k || k.length === 0) return 0;
    let score = 0;
    if (k[0] >= 'A' && k[0] <= 'Z') score += 10;
    const words = k.split(/\s+/);
    const capitalizedWords = words.filter(w => w.length > 0 && w[0] >= 'A' && w[0] <= 'Z').length;
    score += capitalizedWords;
    // Prefer version without trailing dot for concise keys
    if (!k.endsWith('.')) score += 2;
    return score;
}

function processLocales({ dryRun = true, deduplicatePunctuation = true, deduplicateCrossFile = true } = {}) {
    if (!fs.existsSync(localesDir)) {
        console.error(`Locales directory not found: ${localesDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
    // Sort files by priority
    files.sort((a, b) => {
        const idxA = MODULE_PRIORITY.indexOf(a);
        const idxB = MODULE_PRIORITY.indexOf(b);
        return (idxA >= 0 ? idxA : 999) - (idxB >= 0 ? idxB : 999);
    });

    let totalOriginalEntries = 0;
    let totalCaseTrimRemoved = 0;
    let totalPunctRemoved = 0;
    let totalCrossFileRemoved = 0;
    let totalHyphenRemoved = 0;

    console.log(`=======================================================`);
    console.log(` AntigravityCN Comprehensive Locale Deduplication Tool`);
    console.log(` Directory: ${localesDir}`);
    console.log(` Mode: ${dryRun ? 'DRY-RUN (No changes applied)' : 'APPLY (Modifying files)'}`);
    console.log(` Features: Case/Trim Dedup | Punctuation Dedup | Cross-File Dedup`);
    console.log(`=======================================================\n`);

    const fileContents = {};
    for (const file of files) {
        const filePath = path.join(localesDir, file);
        const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        totalOriginalEntries += Object.keys(json).length;
        fileContents[file] = json;
    }

    // Step 1: Intra-file Normalization (Trim + Case + Hyphen + Punctuation)
    for (const file of files) {
        const json = fileContents[file];
        const originalKeys = Object.keys(json);

        // Group by base stem: lowercased, trimmed, without trailing dot/colon
        const stemGroups = new Map();

        originalKeys.forEach((rawKey, index) => {
            const rawVal = json[rawKey];
            const trimmedKey = rawKey.trim();
            const trimmedVal = typeof rawVal === 'string' ? rawVal.trim() : rawVal;
            const normLower = trimmedKey.toLowerCase();
            const stem = deduplicatePunctuation 
                ? normLower.replace(/[\.\:\…\s]+$/g, '').replace(/[-\s]+/g, ' ')
                : normLower;

            if (!stemGroups.has(stem)) {
                stemGroups.set(stem, []);
            }
            stemGroups.get(stem).push({
                key: trimmedKey,
                rawKey: rawKey,
                val: trimmedVal,
                rawVal: rawVal,
                originalIndex: index,
                hasTrailingDot: trimmedKey.endsWith('.'),
                hasHyphen: trimmedKey.includes('-')
            });
        });

        const cleanedJson = {};
        let fileCaseTrimRemoved = 0;
        let filePunctRemoved = 0;
        let fileHyphenRemoved = 0;

        for (const [stem, group] of stemGroups.entries()) {
            if (group.length === 1) {
                cleanedJson[group[0].key] = group[0].val;
                continue;
            }

            // Check known conflict
            const lowerKey = group[0].key.toLowerCase();
            if (CONFLICT_RESOLUTIONS[lowerKey]) {
                const res = CONFLICT_RESOLUTIONS[lowerKey];
                cleanedJson[res.preferKey] = res.preferVal;
                fileCaseTrimRemoved += (group.length - 1);
                totalCaseTrimRemoved += (group.length - 1);
                continue;
            }

            // Determine what kind of duplicate this is
            const uniqueKeys = new Set(group.map(g => g.key.toLowerCase()));
            const uniquePunct = new Set(group.map(g => g.key.replace(/[\.\:\…\s]+$/g, '').toLowerCase()));

            // Sort to find the best representative key:
            // Prefer: with trailing dot if all values have Chinese dot, or standard capitalization
            group.sort((a, b) => {
                const scoreDiff = getKeyScore(b.key) - getKeyScore(a.key);
                if (scoreDiff !== 0) return scoreDiff;
                return a.originalIndex - b.originalIndex;
            });
            const best = group[0];

            // If it's a punctuation duplicate (e.g. "Sentence." vs "Sentence"), sync punctuation on value
            let finalVal = best.val;
            if (best.hasTrailingDot && typeof finalVal === 'string' && !finalVal.endsWith('。') && !finalVal.endsWith('.')) {
                finalVal = finalVal + '。';
            }

            cleanedJson[best.key] = finalVal;

            const removedCount = group.length - 1;
            if (uniquePunct.size < group.length) {
                filePunctRemoved += removedCount;
                totalPunctRemoved += removedCount;
            } else {
                fileCaseTrimRemoved += removedCount;
                totalCaseTrimRemoved += removedCount;
            }

            console.log(`[Deduplicated in ${file}]`);
            console.log(`  Kept   : ${JSON.stringify(best.key)}: ${JSON.stringify(finalVal)}`);
            console.log(`  Removed: ${group.slice(1).map(g => JSON.stringify(g.rawKey)).join(', ')}\n`);
        }

        fileContents[file] = cleanedJson;
    }

    // Step 2: Cross-File Deduplication (Optional based on priority)
    if (deduplicateCrossFile) {
        const seenGlobalKeys = new Map(); // stem -> { file, key, val }

        for (const file of files) {
            const json = fileContents[file];
            const cleanedJson = {};
            let crossRemovedInFile = 0;

            for (const [key, val] of Object.entries(json)) {
                const stem = key.trim().toLowerCase();
                if (seenGlobalKeys.has(stem)) {
                    const prev = seenGlobalKeys.get(stem);
                    // If previously defined in a higher-priority module with same translation
                    if (prev.val === val || prev.val.replace(/[.。]+$/, '') === val.replace(/[.。]+$/, '')) {
                        crossRemovedInFile++;
                        totalCrossFileRemoved++;
                        console.log(`[Cross-File Deduplicated in ${file}]`);
                        console.log(`  Existing in ${prev.file}: "${prev.key}": "${prev.val}"`);
                        console.log(`  Removed from ${file} : "${key}": "${val}"\n`);
                        continue;
                    }
                }
                seenGlobalKeys.set(stem, { file, key, val });
                cleanedJson[key] = val;
            }
            fileContents[file] = cleanedJson;
        }
    }

    // Save if not dry run
    if (!dryRun) {
        for (const file of files) {
            const filePath = path.join(localesDir, file);
            fs.writeFileSync(filePath, JSON.stringify(fileContents[file], null, 2) + '\n', 'utf8');
        }
    }

    let finalTotal = 0;
    for (const file of files) {
        finalTotal += Object.keys(fileContents[file]).length;
    }

    console.log('=======================================================');
    console.log(` Final Comprehensive Summary:`);
    console.log(`   Total Original Entries: ${totalOriginalEntries}`);
    console.log(`   Case & Trim Duplicates Removed: ${totalCaseTrimRemoved}`);
    console.log(`   Punctuation (. / :) Duplicates Removed: ${totalPunctRemoved}`);
    console.log(`   Cross-File Overlaps Removed: ${totalCrossFileRemoved}`);
    console.log(`   Total Redundant Entries Eliminated: ${totalOriginalEntries - finalTotal}`);
    console.log(`   Remaining Unique Entries: ${finalTotal}`);
    console.log('=======================================================');
}

const isDryRun = !process.argv.includes('--apply');
processLocales({ dryRun: isDryRun });
