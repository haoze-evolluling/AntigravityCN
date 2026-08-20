const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');

// Canonical conflict resolvers when values differ only slightly
const CONFLICT_RESOLUTIONS = {
    'email': { preferKey: 'Email', preferVal: '电子邮箱' },
    'run in background': { preferKey: 'Run in background', preferVal: '在后台保持运行' }
};

/**
 * Calculates priority score for key style (higher score = more preferred as canonical key).
 * Preference order: Title Case / Capitalized > sentence case > lowercase
 */
function getKeyScore(k) {
    if (!k || k.length === 0) return 0;
    let score = 0;
    // First letter uppercase
    if (k[0] >= 'A' && k[0] <= 'Z') score += 10;
    // Multiple capitalized words (Title Case)
    const words = k.split(/\s+/);
    const capitalizedWords = words.filter(w => w.length > 0 && w[0] >= 'A' && w[0] <= 'Z').length;
    score += capitalizedWords;
    return score;
}

function processLocales({ dryRun = true } = {}) {
    if (!fs.existsSync(localesDir)) {
        console.error(`Locales directory not found: ${localesDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));
    let totalOriginalEntries = 0;
    let totalRemovedEntries = 0;
    let totalConflictsResolved = 0;

    console.log(`=======================================================`);
    console.log(` AntigravityCN Locale Case-Deduplication Tool`);
    console.log(` Directory: ${localesDir}`);
    console.log(` Mode: ${dryRun ? 'DRY-RUN (No changes applied)' : 'APPLY (Modifying files)'}`);
    console.log(`=======================================================\n`);

    for (const file of files) {
        const filePath = path.join(localesDir, file);
        const raw = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(raw);
        const originalKeys = Object.keys(json);
        totalOriginalEntries += originalKeys.length;

        // Group entries by their lowercased key
        const lowerGroups = new Map(); // lowerKey -> Array<{ key, val, originalIndex }>
        
        originalKeys.forEach((key, index) => {
            const lower = key.toLowerCase();
            if (!lowerGroups.has(lower)) {
                lowerGroups.set(lower, []);
            }
            lowerGroups.get(lower).push({ key, val: json[key], originalIndex: index });
        });

        const cleanedJson = {};
        let fileRemoved = 0;

        for (const [lowerKey, group] of lowerGroups.entries()) {
            if (group.length === 1) {
                // Unique entry, no duplicates
                cleanedJson[group[0].key] = group[0].val;
                continue;
            }

            // Multiple entries with the same lowercased key
            // Check if there is a known conflict resolution
            if (CONFLICT_RESOLUTIONS[lowerKey]) {
                const res = CONFLICT_RESOLUTIONS[lowerKey];
                cleanedJson[res.preferKey] = res.preferVal;
                fileRemoved += (group.length - 1);
                totalRemovedEntries += (group.length - 1);
                totalConflictsResolved++;
                console.log(`[Conflict Resolved in ${file}]`);
                console.log(`  Merged [${group.map(g => `"${g.key}": "${g.val}"`).join(', ')}]`);
                console.log(`  -> Selected: "${res.preferKey}": "${res.preferVal}"\n`);
                continue;
            }

            // Check if all values are identical
            const firstVal = group[0].val;
            const allSameVal = group.every(g => g.val === firstVal);

            if (allSameVal) {
                // Select the best formatted key (Title Case / Capitalized preferred)
                group.sort((a, b) => {
                    const scoreDiff = getKeyScore(b.key) - getKeyScore(a.key);
                    if (scoreDiff !== 0) return scoreDiff;
                    return a.originalIndex - b.originalIndex;
                });
                const best = group[0];
                cleanedJson[best.key] = best.val;
                fileRemoved += (group.length - 1);
                totalRemovedEntries += (group.length - 1);

                const removedItems = group.slice(1).map(g => `"${g.key}"`).join(', ');
                console.log(`[Deduplicated in ${file}]`);
                console.log(`  Kept   : "${best.key}": "${best.val}"`);
                console.log(`  Removed: ${removedItems}\n`);
            } else {
                // Values differ but no explicit resolution rule
                console.warn(`[WARNING] Unresolved conflict in ${file} for key "${lowerKey}":`);
                group.forEach(g => console.warn(`    - "${g.key}": "${g.val}"`));
                // Retain all to avoid losing translations
                group.forEach(g => { cleanedJson[g.key] = g.val; });
            }
        }

        if (!dryRun && fileRemoved > 0) {
            fs.writeFileSync(filePath, JSON.stringify(cleanedJson, null, 2) + '\n', 'utf8');
            console.log(`-> [Saved] ${file}: removed ${fileRemoved} redundant case-duplicate entries.\n`);
        }
    }

    console.log('=======================================================');
    console.log(` Summary:`);
    console.log(`   Total Original Entries: ${totalOriginalEntries}`);
    console.log(`   Case Duplicates Removed: ${totalRemovedEntries}`);
    console.log(`   Conflicts Resolved: ${totalConflictsResolved}`);
    console.log(`   Final Total Entries: ${totalOriginalEntries - totalRemovedEntries}`);
    console.log('=======================================================');
}

const isDryRun = !process.argv.includes('--apply');
processLocales({ dryRun: isDryRun });
