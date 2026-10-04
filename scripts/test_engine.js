const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { MockElement, MockTextNode } = require('./mock_dom.js');

console.log('================================================================');
console.log(' AntigravityCN 深度汉化引擎与思考链隔离自动化测试 (Node VM)');
console.log('================================================================\n');

// 1. 自动编译模块化源码并组装 preload.js 运行时
const { buildPreload } = require('./build_preload.js');
buildPreload({ silent: true });
const preloadSource = fs.readFileSync(path.resolve(__dirname, '../patches/preload.js'), 'utf8');

// 读取所有模块化词典并合并
const localesDir = path.resolve(__dirname, '../patches/locales/zh-CN');
const mergedDict = {};
for (const f of fs.readdirSync(localesDir)) {
  if (f.endsWith('.json')) {
    const data = JSON.parse(fs.readFileSync(path.join(localesDir, f), 'utf8'));
    Object.assign(mergedDict, data);
  }
}

// 模拟 DOM 节点树与浏览器沙盒（实现见 mock_dom.js）
// 装配词典并注入测试挂载钩子
let code = preloadSource.replace('/*__I18N_DICT_PLACEHOLDER__*/{}', JSON.stringify(mergedDict));

// 在 IIFE 内部暴露测试钩子，阻断真实 DOM 监听器
code = code.replace(
  /if\s*\(\s*document\.readyState === 'loading'\s*\)[\s\S]*?startObserver\(\);\s*\}/,
  `globalThis.__testTranslate = translateString;
  globalThis.__testSkip = shouldSkipNode;
  globalThis.__testVerdict = getNodeVerdict;
  globalThis.__testVerdicts = { TRUSTED: VERDICT_TRUSTED, STRICT: VERDICT_STRICT, SKIP: VERDICT_SKIP };`
);

const sandbox = {
  window: { addEventListener: () => {} },
  document: { body: new MockElement('body'), readyState: 'complete', addEventListener: () => {} },
  globalThis: {},
  Node: { TEXT_NODE: 3, ELEMENT_NODE: 1, DOCUMENT_FRAGMENT_NODE: 11 },
  Element: { prototype: {} },
  Document: { prototype: {} },
  HTMLDocument: { prototype: {} },
  MutationObserver: class { observe() {} disconnect() {} },
  history: {},
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  requestAnimationFrame: (fn) => fn(),
  console: console
};

vm.createContext(sandbox);
vm.runInContext(code, sandbox);

const testTranslateText = sandbox.globalThis.__testTranslate;
const testShouldSkipNode = sandbox.globalThis.__testSkip;

if (!testTranslateText || !testShouldSkipNode) {
  throw new Error('未能从引擎中提取 translateText / shouldSkipNode 函数');
}

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS ${total}] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL ${total}] ${name}`);
    console.error(`       错误: ${err.message}`);
  }
}

// ===================================================================
// 测试组 1: 斜杠命令原生触发符保护与描述汉化 (Slash Commands)
// ===================================================================
console.log('\n--- 测试组 1: 斜杠命令保护与汉化 ---');
const slashCommands = ['boost', 'goal', 'schedule', 'browser', 'grill-me', 'learn', 'plan'];

for (const cmd of slashCommands) {
  test(`斜杠命令触发符保护: "${cmd}" 必须保持英文原样`, () => {
    const labelSpan = new MockElement('span', { attributes: { 'data-testid': 'menu-option-label' } });
    const inner = new MockElement('span', { parentElement: labelSpan });
    labelSpan.appendChild(inner);
    const textNode = new MockTextNode(cmd, inner);
    inner.appendChild(textNode);
    const skipped = testShouldSkipNode(textNode);
    assert.strictEqual(skipped, true, `触发符 "${cmd}" 必须被 shouldSkipNode 跳过 (true)`);
  });
}

test('斜杠命令描述 [menu-option-description] 必须放行汉化', () => {
  const descSpan = new MockElement('span', { attributes: { 'data-testid': 'menu-option-description' } });
  const textNode = new MockTextNode('Invoke the Boost multi-agent orchestrator for complex tasks.', descSpan);
  descSpan.appendChild(textNode);
  const skipped = testShouldSkipNode(textNode);
  assert.strictEqual(skipped, false, '描述内容绝不应被跳过 (false)');
});

// ===================================================================
// 测试组 2: 上下文提及 (@ Mention) 分类放行与文件名保护
// ===================================================================
console.log('\n--- 测试组 2: @ 提及菜单分类放行与文件名保护 ---');
const mentionCategories = ['Rules', 'Conversation', 'PDF Document', 'Git Commit', 'Directory'];

for (const cat of mentionCategories) {
  test(`提及分类放行 [menu-option-label]: "${cat}"`, () => {
    const labelSpan = new MockElement('span', { attributes: { 'data-testid': 'menu-option-label' } });
    const inner = new MockElement('span', { parentElement: labelSpan });
    labelSpan.appendChild(inner);
    const textNode = new MockTextNode(cat, inner);
    inner.appendChild(textNode);
    const skipped = testShouldSkipNode(textNode);
    assert.strictEqual(skipped, false, `分类 "${cat}" 应当放行 (false)`);
  });
}

const workspaceFiles = ['main.js', 'README.md', 'package.json', 'app.go'];
for (const file of workspaceFiles) {
  test(`文件项保护: "${file}" 必须保持英文`, () => {
    const labelSpan = new MockElement('span', { attributes: { 'data-testid': 'menu-option-label' } });
    const inner = new MockElement('span', { parentElement: labelSpan });
    labelSpan.appendChild(inner);
    const textNode = new MockTextNode(file, inner);
    inner.appendChild(textNode);
    const skipped = testShouldSkipNode(textNode);
    assert.strictEqual(skipped, true, `文件名 "${file}" 必须跳过 (true)`);
  });
}

// ===================================================================
// 测试组 3: 模型思考链 (Thinking Process) 绝对物理隔离
// ===================================================================
console.log('\n--- 测试组 3: 模型思考链物理隔离与药丸放行 ---');
test('思考链正文容器 [data-testid="thinking-collapsible"] 内部节点必须跳过', () => {
  const thoughtBox = new MockElement('div', { attributes: { 'data-testid': 'thinking-collapsible' } });
  const innerSpan = new MockElement('span', { parentElement: thoughtBox });
  thoughtBox.appendChild(innerSpan);
  const textNode = new MockTextNode('Analyzing codebase dependencies and determining next action...', innerSpan);
  innerSpan.appendChild(textNode);
  const skipped = testShouldSkipNode(textNode);
  assert.strictEqual(skipped, true, '思考正文必须跳过 (true)');
});

test('思考折叠触发按钮 button[data-testid="thinking-collapsible-trigger"] 必须放行', () => {
  const triggerBtn = new MockElement('button', { attributes: { 'data-testid': 'thinking-collapsible-trigger' } });
  const textNode = new MockTextNode('Thought for 4.2s', triggerBtn);
  triggerBtn.appendChild(textNode);
  const skipped = testShouldSkipNode(textNode);
  assert.strictEqual(skipped, false, '触发药丸必须放行 (false)');
});

test('思考折叠栏兄弟展开容器内流式正文必须绝对跳过', () => {
  // 模拟 Antigravity 界面结构：外层容器包含 trigger 按钮与兄弟正文容器
  const wrapper = new MockElement('div', { className: 'collapsible-wrapper' });
  const triggerBtn = new MockElement('button', { attributes: { 'data-testid': 'thinking-collapsible-trigger' } });
  wrapper.appendChild(triggerBtn);

  const streamBody = new MockElement('div', { className: 'cursor-edit' });
  wrapper.appendChild(streamBody);

  const innerSpan = new MockElement('span');
  streamBody.appendChild(innerSpan);

  const thoughtText = new MockTextNode('Plan the steps and check the config file.', innerSpan);
  innerSpan.appendChild(thoughtText);

  const skipped = testShouldSkipNode(thoughtText);
  assert.strictEqual(skipped, true, '兄弟正文容器内的所有流式文本必须跳过 (true)');
});

test('思考正文容器 .cursor-edit 内部节点必须绝对跳过', () => {
  const editBox = new MockElement('div', { className: 'cursor-edit' });
  const innerSpan = new MockElement('span', { parentElement: editBox });
  editBox.appendChild(innerSpan);
  const textNode = new MockTextNode('Editing file contents in real-time...', innerSpan);
  innerSpan.appendChild(textNode);
  const skipped = testShouldSkipNode(textNode);
  assert.strictEqual(skipped, true, 'cursor-edit 正文必须跳过 (true)');
});

test('思考正文内的步骤词 (Thought/Ran/Plan/Code) 不得被当作操作药丸误放行', () => {
  const wrapper = new MockElement('div', { attributes: { 'data-testid': 'thinking-collapsible' } });
  const innerSpan = new MockElement('span');
  wrapper.appendChild(innerSpan);

  const actionWord = new MockTextNode('Thought', innerSpan);
  innerSpan.appendChild(actionWord);

  const skipped = testShouldSkipNode(actionWord);
  assert.strictEqual(skipped, true, '思考正文内的单词必须跳过，绝不可误判为 ActionPill (true)');
});

test('正常系统执行药丸 (如单独的 Ran/Viewed/Thought) 在非思考正文中正常放行汉化', () => {
  const pillSpan = new MockElement('span', { className: 'status-pill' });
  const textNode = new MockTextNode('Ran', pillSpan);
  pillSpan.appendChild(textNode);

  const skipped = testShouldSkipNode(textNode);
  assert.strictEqual(skipped, false, '非思考区域的独立执行药丸应当放行 (false)');
});

// ===================================================================
// 测试组 4: Antigravity 2.0 现代架构全套 DOM 门禁测试
// ===================================================================
console.log('\n--- 测试组 4: Antigravity 2.0 现代架构 DOM 门禁测试 ---');
const antigravity20DomCases = [
  {
    name: 'Case 1 (正常 UI 控件): <button class="btn-primary">Settings</button>',
    node: () => {
      const button = new MockElement('button', { className: 'btn-primary' });
      const text = new MockTextNode('Settings', button);
      button.appendChild(text);
      return text;
    },
    expected: false
  },
  {
    name: 'Case 2 (模型推理中间回复): <div data-testid="planner-response-text"><p>I will pause tool calls...</p></div>',
    node: () => {
      const planner = new MockElement('div', { attributes: { 'data-testid': 'planner-response-text' } });
      const p = new MockElement('p', { parentElement: planner });
      planner.appendChild(p);
      const text = new MockTextNode('I will pause tool calls and wait for the Gradle task to complete.', p);
      p.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 3 (模型最终回复全部变更): <div data-testid="planner-response-text"><p>I have launched... verify all changes</p></div>',
    node: () => {
      const planner = new MockElement('div', { attributes: { 'data-testid': 'planner-response-text' } });
      const p = new MockElement('p', { parentElement: planner });
      planner.appendChild(p);
      const text = new MockTextNode('I have launched the test suite to verify all changes and will wait for completion.', p);
      p.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 4 (模型回复内 Markdown 行内代码): <div data-testid="planner-response-text"><code>all changes</code></div>',
    node: () => {
      const planner = new MockElement('div', { attributes: { 'data-testid': 'planner-response-text' } });
      const code = new MockElement('code', { parentElement: planner });
      planner.appendChild(code);
      const text = new MockTextNode('all changes', code);
      code.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 5 (思考过程展开正文容器): <div data-testid="thinking-collapsible"><div class="cursor-edit"><span>Thought stream</span></div></div>',
    node: () => {
      const collapsible = new MockElement('div', { attributes: { 'data-testid': 'thinking-collapsible' } });
      const editBox = new MockElement('div', { className: 'cursor-edit', parentElement: collapsible });
      collapsible.appendChild(editBox);
      const span = new MockElement('span', { parentElement: editBox });
      editBox.appendChild(span);
      const text = new MockTextNode('Analyzing codebase dependencies...', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 6 (用户输入步骤容器): <div data-testid="user-input-step"><div>Prompt text</div></div>',
    node: () => {
      const step = new MockElement('div', { attributes: { 'data-testid': 'user-input-step' } });
      const inner = new MockElement('div', { parentElement: step });
      step.appendChild(inner);
      const text = new MockTextNode('Please optimize build speed', inner);
      inner.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 7 (Tailwind 提问步骤气泡): <div class="group/user-input-step"><span>User text</span></div>',
    node: () => {
      const step = new MockElement('div', { className: 'group/user-input-step' });
      const span = new MockElement('span', { parentElement: step });
      step.appendChild(span);
      const text = new MockTextNode('User prompt message', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 8 (底部输入框容器): <div data-testid="agent-input-box"><textarea></textarea></div>',
    node: () => {
      const box = new MockElement('div', { attributes: { 'data-testid': 'agent-input-box' } });
      const ta = new MockElement('textarea', { parentElement: box });
      box.appendChild(ta);
      const text = new MockTextNode('Draft input', ta);
      ta.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 9 (富文本与输入区): <div contenteditable="true"><span>Typing</span></div>',
    node: () => {
      const edit = new MockElement('div', { attributes: { contenteditable: 'true' } });
      const span = new MockElement('span', { parentElement: edit });
      edit.appendChild(span);
      const text = new MockTextNode('Typing query', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 10 (智能体历史操作总耗时触发按钮): <button data-testid="worked-for-collapsible">Worked for 4m</button>',
    node: () => {
      const btn = new MockElement('button', { attributes: { 'data-testid': 'worked-for-collapsible' } });
      const text = new MockTextNode('Worked for 4m', btn);
      btn.appendChild(text);
      return text;
    },
    expected: false
  },
  {
    name: 'Case 11 (智能体文件操作统计条触发按钮): <button data-testid="tool-group-collapsible">Exploring 19 files</button>',
    node: () => {
      const btn = new MockElement('button', { attributes: { 'data-testid': 'tool-group-collapsible' } });
      const text = new MockTextNode('Exploring 19 files, running 50 commands', btn);
      btn.appendChild(text);
      return text;
    },
    expected: false
  },
  {
    name: 'Case 12 (Notebook Markdown 单元格与工件): <div class="notebook-markdown-cell"><span>Summary</span></div>',
    node: () => {
      const cell = new MockElement('div', { className: 'notebook-markdown-cell' });
      const span = new MockElement('span', { parentElement: cell });
      cell.appendChild(span);
      const text = new MockTextNode('Artifact markdown details', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  }
];

for (const tc of antigravity20DomCases) {
  test(`Antigravity 2.0 门禁: ${tc.name}`, () => {
    const node = tc.node();
    const actual = testShouldSkipNode(node);
    assert.strictEqual(actual, tc.expected);
  });
}

// ===================================================================
// 测试组 5: 思考链词汇分词保护 (消灭中英杂糅核心防线)
// ===================================================================
console.log('\n--- 测试组 5: 思考链高危动词与分词防污染测试 ---');
const thoughtPollutionCases = [
  'Thinking process starts now',
  'I thought about this solution',
  'We worked on this task',
  'Check the code diff carefully',
  'Next step is running unit tests',
  'Analyzing the commit diff for patch',
  'The agent explored the codebase',
  'I will pause tool calls and wait for the Gradle task to complete.',
  'I have launched the test suite to verify all changes and will wait for completion.'
];

for (const sentence of thoughtPollutionCases) {
  test(`分词防污染断言: "${sentence}" 严禁被部分拆词替换为中文`, () => {
    const res = testTranslateText(sentence);
    assert.strictEqual(res, sentence, `句子 "${sentence}" 应当原样保留英文，实际返回: "${res}"`);
  });
}

// ===================================================================
// 测试组 6: 动态正则与核心长句汉化 (Dynamic Rules & Translations)
// ===================================================================
console.log('\n--- 测试组 6: 动态正则与长句汉化 ---');
const translationCases = [
  { in: 'Thought for 4.2s', out: '思考了 4.2 秒' },
  { in: 'Thinking for 1.5s', out: '思考了 1.5 秒' },
  { in: 'Thinking...', out: '思考中...' },
  { in: 'Working...', out: '处理中...' },
  { in: 'Setting up WSL: Ubuntu', out: '正在配置 WSL: Ubuntu' },
  { in: 'Connected to WSL: Debian', out: '已连接到 WSL: Debian' },
  { in: 'Installing into Ubuntu…', out: '正在安装到 Ubuntu…' },
  { in: 'Antigravity opened on Windows instead.', out: 'Antigravity 已改为在 Windows 本地打开。' },
  { in: 'This location cannot be opened in WSL: C:\\foo', out: '无法在 WSL 中打开此位置: C:\\foo' },
  { in: 'Type / and select plan to have the agent generate a plan.', out: '输入 / 并选择 plan 来让智能体生成计划。' },
  { in: 'to have the agent generate a plan.', out: '来让智能体生成计划。' },
  { in: 'plan to have the agent generate a plan.', out: 'plan 来让智能体生成计划。' },
  { in: 'Step 1 of 6', out: '步骤 1 / 6' },
  { in: '3 files changed', out: '3 个文件已更改' },
  { in: '15 searches', out: '15 次搜索' },
  { in: 'Weekly Limit Remaining', out: '每周限额剩余' },
  { in: 'Five-Hour Limit Remaining', out: '5 小时限额剩余' },
  { in: 'Connect to WSL', out: '连接到 WSL' },
  { in: 'Reopen Locally', out: '本地重新打开' },
  { in: 'Split Right', out: '向右分屏' },
  { in: 'Equalize Split Panes', out: '均分分屏窗格' },
  { in: 'Fork Conversation', out: '派生对话' },
  { in: 'Move to Group', out: '移动到分组' }
];

for (const tc of translationCases) {
  test(`翻译断言: "${tc.in}" -> "${tc.out}"`, () => {
    const actual = testTranslateText(tc.in);
    assert.strictEqual(actual, tc.out);
  });
}

// ===================================================================
// 测试组 7: 纯中文/数字 极速短路性能验证 (Fast Short-Circuit)
// ===================================================================
console.log('\n--- 测试组 7: 极速短路断言 ---');
test('纯中文文本瞬间短路原样返回', () => {
  const cn = '这已经是纯简体中文界面内容，不需要任何查表';
  assert.strictEqual(testTranslateText(cn), cn);
});

test('纯数字与常用标点短路原样返回', () => {
  const num = '1234567890 . , : ; ! ?';
  assert.strictEqual(testTranslateText(num), num);
});

// ===================================================================
// 测试组 8: 上下文三级判定 (SKIP / STRICT / TRUSTED)
// ===================================================================
console.log('\n--- 测试组 8: 上下文三级判定 ---');
const V = sandbox.globalThis.__testVerdicts;

test('未知容器（无任何标记）判定为 STRICT 保守模式', () => {
  const panel = new MockElement('div', { className: 'some-unknown-panel-v219' });
  const span = new MockElement('span', { parentElement: panel });
  panel.appendChild(span);
  const textNode = new MockTextNode('Save the file first', span);
  span.appendChild(textNode);
  assert.strictEqual(testShouldSkipNode(textNode), false, '未知容器不跳过（仍允许词典精确匹配）');
  assert.strictEqual(sandbox.globalThis.__testVerdict(textNode), V.STRICT);
});

test('按钮/链接等明确 UI 控件判定为 TRUSTED', () => {
  const btn = new MockElement('button', { className: 'btn-primary' });
  const textNode = new MockTextNode('Save', btn);
  btn.appendChild(textNode);
  assert.strictEqual(sandbox.globalThis.__testVerdict(textNode), V.TRUSTED);
});

test('ARIA role="dialog" 内部后代判定为 TRUSTED', () => {
  const dialog = new MockElement('div', { attributes: { role: 'dialog' } });
  const inner = new MockElement('div', { parentElement: dialog });
  dialog.appendChild(inner);
  const span = new MockElement('span', { parentElement: inner });
  inner.appendChild(span);
  const textNode = new MockTextNode('Settings', span);
  span.appendChild(textNode);
  assert.strictEqual(sandbox.globalThis.__testVerdict(textNode), V.TRUSTED);
});

test('AI 消息容器内部的按钮仍被 SKIP 压制（跳过优先于信任）', () => {
  const message = new MockElement('div', { attributes: { 'data-testid': 'planner-response-text' } });
  const btn = new MockElement('button', { parentElement: message });
  message.appendChild(btn);
  const textNode = new MockTextNode('Copy', btn);
  btn.appendChild(textNode);
  assert.strictEqual(sandbox.globalThis.__testVerdict(textNode), V.SKIP);
});

// ===================================================================
// 测试组 9: 严格模式 AI 输出保护 (STRICT Mode AI Content Protection)
// ===================================================================
console.log('\n--- 测试组 9: 严格模式 AI 输出保护 ---');
const strictUnchangedCases = [
  'Save the file first',
  'Delete the branch',
  'Edit the config',
  'Run the tests now',
  'Updated the schema',
  'Version 2 is out',
  '5 minutes',
  '3 hours ago',
  '2 days',
  'The config file does not exist.',
  'The module was not found in the project.',
  'Fix login bug'
];

for (const sentence of strictUnchangedCases) {
  test(`严格模式保持原样: "${sentence}"`, () => {
    const res = testTranslateText(sentence, true);
    assert.strictEqual(res, sentence, `未知区域文本 "${sentence}" 必须保持原样，实际返回: "${res}"`);
  });
}

test('严格模式仍翻译词典精确匹配的界面词条', () => {
  assert.strictEqual(testTranslateText('Invalid tool call', true), '无效的工具调用');
  assert.strictEqual(testTranslateText('No Project', true), '无项目');
});

test('严格模式仍执行强锚定系统规则（思考药丸/WSL/步骤）', () => {
  assert.strictEqual(testTranslateText('Thought for 4.2s', true), '思考了 4.2 秒');
  assert.strictEqual(testTranslateText('Setting up WSL: Ubuntu', true), '正在配置 WSL: Ubuntu');
  assert.strictEqual(testTranslateText('Step 1 of 6', true), '步骤 1 / 6');
});

test('严格模式放行短主题系统错误模板', () => {
  assert.strictEqual(testTranslateText('config.json does not exist.', true), 'config.json 不存在');
  assert.strictEqual(testTranslateText('File was not found.', true), 'File 未找到');
});

test('受信任上下文仍完整翻译数量与版本碎片', () => {
  assert.strictEqual(testTranslateText('5 minutes', false), '5 分钟');
  assert.strictEqual(testTranslateText('Version 1.2.3', false), '版本 1.2.3');
});

test('缓存按上下文级别隔离：STRICT 与 TRUSTED 结果互不污染', () => {
  assert.strictEqual(testTranslateText('3 days', true), '3 days', '先 STRICT 查询必须原样');
  assert.strictEqual(testTranslateText('3 days', false), '3 天', '再 TRUSTED 查询必须完整翻译');
  assert.strictEqual(testTranslateText('Version 9.9.9', false), '版本 9.9.9', '先 TRUSTED 查询必须完整翻译');
  assert.strictEqual(testTranslateText('Version 9.9.9', true), 'Version 9.9.9', '再 STRICT 查询必须原样（不得命中 TRUSTED 缓存）');
});

console.log('\n================================================================');
console.log(`测试套件执行完成: ${passed}/${total} 全部通过 (100% PASS)`);
console.log('================================================================\n');

if (passed !== total) {
  process.exit(1);
} else {
  process.exit(0);
}
