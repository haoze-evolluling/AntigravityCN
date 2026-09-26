const fs = require('fs');
const path = require('path');

const localizePath = path.resolve(__dirname, '../LearningObjects/Antigravity-Chinese-Localization-master/localize.js');
const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');

const localizeContent = fs.readFileSync(localizePath, 'utf8');

// Load current 4 files
const files = ['通用.json', '对话.json', '设置.json', '工作区.json'];
const data = {};
const existingLowerMap = new Map();

for (const f of files) {
  const p = path.join(localesDir, f);
  data[f] = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [k, v] of Object.entries(data[f])) {
    existingLowerMap.set(k.toLowerCase(), { file: f, key: k, val: v });
  }
}

// Extract coreWords
const coreMatch = localizeContent.match(/const coreWords = (\{[\s\S]*?\n  \});/);
const coreWords = coreMatch ? eval('(' + coreMatch[1] + ')') : {};

// Extract dictionary line by line to keep section context
const dictLines = localizeContent.split('\n');
let inDict = false;
let currentSection = '通用';

function sectionToCategory(comment) {
  const c = comment.toLowerCase();
  if (c.includes('top bar') || c.includes('window') || c.includes('窗口') || c.includes('菜单') || c.includes('feedback') || c.includes('反馈') || c.includes('notification') || c.includes('通知') || c.includes('command palette') || c.includes('单数形式') || c.includes('快捷键') || c.includes('通用偏好') || c.includes('通用界面') || c.includes('高频交互')) {
    return '通用.json';
  }
  if (c.includes('planning') || c.includes('规划') || c.includes('question') || c.includes('问答') || c.includes('conversation') || c.includes('会话') || c.includes('split') || c.includes('分屏') || c.includes('fork') || c.includes('派生') || c.includes('分组') || c.includes('slash') || c.includes('斜杠') || c.includes('mention') || c.includes('提及') || c.includes('对话') || c.includes('步骤标签') || c.includes('diff review') || c.includes('差异视图')) {
    return '对话.json';
  }
  if (c.includes('setting') || c.includes('设置') || c.includes('appearance') || c.includes('外观') || c.includes('account') || c.includes('账号') || c.includes('mcp') || c.includes('theme') || c.includes('主题') || c.includes('model') || c.includes('模型') || c.includes('preset') || c.includes('预设') || c.includes('security') || c.includes('安全') || c.includes('sandbox') || c.includes('沙盒') || c.includes('permission') || c.includes('权限') || c.includes('network') || c.includes('网络') || c.includes('terminal') || c.includes('终端') || c.includes('plugin') || c.includes('插件') || c.includes('storage') || c.includes('存储') || c.includes('缓存') || c.includes('browser') || c.includes('浏览器') || c.includes('approval') || c.includes('审批') || c.includes('credits') || c.includes('点数') || c.includes('labs') || c.includes('实验')) {
    return '设置.json';
  }
  if (c.includes('workspace') || c.includes('工作区') || c.includes('git') || c.includes('amend') || c.includes('commit') || c.includes('wsl') || c.includes('project') || c.includes('项目') || c.includes('subagent') || c.includes('子智能体') || c.includes('teamwork') || c.includes('customization') || c.includes('自定义') || c.includes('skill') || c.includes('技能') || c.includes('rule') || c.includes('规则') || c.includes('schedule') || c.includes('调度') || c.includes('cron') || c.includes('暂存文件') || c.includes('scratch') || c.includes('比对器')) {
    return '工作区.json';
  }
  return '通用.json';
}

let addedCount = 0;

for (let i = 0; i < dictLines.length; i++) {
  const line = dictLines[i];
  if (line.includes('const dictionary = {')) {
    inDict = true;
    continue;
  }
  if (inDict && line.trim() === '};') {
    inDict = false;
    break;
  }
  if (!inDict) continue;

  const commentMatch = line.match(/^\s*\/\/\s*(.*)/);
  if (commentMatch) {
    const raw = commentMatch[1].trim();
    if (raw) {
      currentSection = sectionToCategory(raw);
    }
    continue;
  }

  // Parse key-value: "Key": "Val", or 'Key': 'Val'
  const kvMatch = line.match(/^\s*(["'])(.+?)\1\s*:\s*(["'])(.+?)\3\s*,?\s*$/);
  if (kvMatch) {
    const key = kvMatch[2];
    const val = kvMatch[4];
    const lowerKey = key.toLowerCase();

    if (!existingLowerMap.has(lowerKey)) {
      data[currentSection][key] = val;
      existingLowerMap.set(lowerKey, { file: currentSection, key, val });
      addedCount++;
    }
  }
}

// Also process coreWords (place in 通用.json if not present)
for (const [k, v] of Object.entries(coreWords)) {
  const lowerKey = k.toLowerCase();
  if (!existingLowerMap.has(lowerKey)) {
    data['通用.json'][k] = v;
    existingLowerMap.set(lowerKey, { file: '通用.json', key: k, val: v });
    addedCount++;
  }
}

console.log(`Successfully merged ${addedCount} new terms into locales!`);

// Sort keys alphabetically (case-insensitive) and write back
for (const f of files) {
  const p = path.join(localesDir, f);
  const sorted = {};
  const sortedKeys = Object.keys(data[f]).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  for (const k of sortedKeys) {
    sorted[k] = data[f][k];
  }
  fs.writeFileSync(p, JSON.stringify(sorted, null, 4) + '\n', 'utf8');
  console.log(`${f}: now has ${Object.keys(sorted).length} keys.`);
}
