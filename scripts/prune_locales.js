const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');

const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');
const allowlistPath = path.resolve(__dirname, 'locale_allowlist.json');
const DEFAULT_LOG = path.join(process.env.APPDATA || '', 'Antigravity', 'logs', 'main.log');
const OPTIONAL_BUNDLES = ['page_agent_bundle.js', 'page_facade_bundle.js', 'overlay_bundle.js'];

function parseArgs(argv) {
    const args = { write: false, bundle: '', log: DEFAULT_LOG };
    for (let i = 2; i < argv.length; i++) {
        if (argv[i] === '--write') args.write = true;
        else if (argv[i] === '--bundle') args.bundle = argv[++i] || '';
        else if (argv[i] === '--log') args.log = argv[++i] || '';
    }
    return args;
}

function request(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { rejectUnauthorized: false, timeout: 30000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                request(new URL(res.headers.location, url).toString()).then(resolve, reject);
                return;
            }
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`HTTP ${res.statusCode}: ${url}`));
                return;
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        }).on('error', reject);
    });
}

function findLocalBaseUrl(logPath) {
    if (!fs.existsSync(logPath)) return '';
    const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
    for (let i = lines.length - 1; i >= 0; i--) {
        const match = lines[i].match(/Local:\s+(https:\/\/127\.0\.0\.1:\d+)\//);
        if (match) return match[1];
    }
    return '';
}

async function downloadBundles(baseUrl) {
    const targetDir = path.join(os.tmpdir(), 'antigravitycn-ui-audit');
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(targetDir, { recursive: true });

    const index = await request(`${baseUrl}/`);
    const scripts = [...index.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]);
    const names = new Set([...scripts.map((src) => path.basename(src)), ...OPTIONAL_BUNDLES]);

    for (const name of names) {
        try {
            const source = await request(`${baseUrl}/${name}`);
            fs.writeFileSync(path.join(targetDir, name), source, 'utf8');
        } catch (err) {
            console.warn(`[!] 跳过 ${name}: ${err.message}`);
        }
    }
    return targetDir;
}

function loadCorpus(bundlePath) {
    const stat = fs.statSync(bundlePath);
    const files = stat.isDirectory()
        ? fs.readdirSync(bundlePath).filter((f) => f.endsWith('.js')).map((f) => path.join(bundlePath, f))
        : [bundlePath];
    let corpus = '';
    for (const file of files) corpus += fs.readFileSync(file, 'utf8') + '\n';
    return { corpus, fileCount: files.length };
}

function hasCjk(text) {
    return /[\u3400-\u9fff]/.test(text);
}

function isUsed(key, lowerCorpus, compactCorpus) {
    const lower = key.trim().toLowerCase();
    const variants = [
        lower,
        lower.replace(/'/g, "\\'"),
        lower.replace(/"/g, '\\"'),
        lower.replace(/&/g, '&amp;')
    ];
    if (variants.some((v) => lowerCorpus.includes(v))) return true;
    return compactCorpus.includes(lower.replace(/\s+/g, ' '));
}

function sortObject(entries) {
    return Object.fromEntries([...entries].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function loadAllowlist() {
    if (!fs.existsSync(allowlistPath)) return new Set();
    const keys = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));
    return new Set(Array.isArray(keys) ? keys : []);
}

async function main() {
    const args = parseArgs(process.argv);
    const allowlist = loadAllowlist();
    let bundlePath = args.bundle;

    if (!bundlePath) {
        const baseUrl = findLocalBaseUrl(args.log);
        if (!baseUrl) {
            console.error('[错误] 未找到运行中的 Antigravity 本地服务地址，请使用 --bundle 指定前端包目录。');
            process.exit(1);
        }
        console.log(`[*] 正在从 ${baseUrl} 下载当前版本前端包...`);
        bundlePath = await downloadBundles(baseUrl);
    }

    const { corpus, fileCount } = loadCorpus(bundlePath);
    const lowerCorpus = corpus.toLowerCase();
    const compactCorpus = lowerCorpus.replace(/\s+/g, ' ');
    console.log(`[*] 已加载 ${fileCount} 个前端包文件，共 ${corpus.length} 字符。`);

    const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
    const report = [];
    let total = 0;
    let removed = 0;

    for (const file of files) {
        const filePath = path.join(localesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const kept = [];
        const dropped = [];

        for (const [key, value] of Object.entries(data)) {
            total++;
            let reason = '';
            if (key === value) reason = '自映射';
            else if (hasCjk(key)) reason = '旧版混排键';
            else if (allowlist.has(key)) reason = '';
            else if (/\$\{|%s|%d/.test(key)) reason = '';
            else if (!isUsed(key, lowerCorpus, compactCorpus)) reason = '当前版本不存在';

            if (reason) {
                dropped.push({ key, value, reason });
                removed++;
            } else {
                kept.push([key, value]);
            }
        }

        report.push({ file, before: Object.keys(data).length, after: kept.length, dropped });
        if (args.write) {
            fs.writeFileSync(filePath, JSON.stringify(sortObject(kept), null, 2) + '\n', 'utf8');
        }
    }

    console.log('\n模块                 保留 / 原有    删除');
    for (const item of report) {
        console.log(`${item.file.padEnd(20)} ${String(item.after).padStart(5)} / ${String(item.before).padEnd(6)} ${String(item.dropped.length).padStart(5)}`);
    }
    console.log(`\n合计: ${total - removed} / ${total}，删除 ${removed} 条。`);

    const samples = report.flatMap((item) => item.dropped.slice(0, 3).map((d) => `${item.file} :: ${d.key} (${d.reason})`));
    if (samples.length) {
        console.log('\n删除示例:');
        for (const line of samples.slice(0, 12)) console.log('  - ' + line);
    }
    console.log(args.write ? '\n[OK] 已写回词典文件。' : '\n[i] 预览模式，未修改文件；添加 --write 执行删除。');
}

main().catch((err) => {
    console.error('[错误]', err.message);
    process.exit(1);
});
