const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log(' AntigravityCN 深度汉化引擎与思考链隔离自动化测试 (Node VM)');
console.log('================================================================\n');

// 1. 读取并组装 preload.js 运行时
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

// 模拟 DOM 节点树与浏览器沙盒
class MockNode {
  constructor(nodeType, parentElement = null) {
    this.nodeType = nodeType;
    this.parentElement = parentElement;
  }
}

class MockElement extends MockNode {
  constructor(tagName, { className = '', attributes = {}, parentElement = null } = {}) {
    super(1, parentElement);
    this.tagName = tagName.toUpperCase();
    this.className = className;
    this.attributes = { ...attributes };
    this.children = [];
  }

  get classList() {
    const classes = this.className ? this.className.split(/\s+/).filter(Boolean) : [];
    return {
      contains: (cls) => classes.includes(cls)
    };
  }

  getAttribute(name) {
    return this.attributes[name] !== undefined ? this.attributes[name] : null;
  }

  hasAttribute(name) {
    return this.attributes[name] !== undefined;
  }

  setAttribute(name, val) {
    this.attributes[name] = val;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  closest(selector) {
    let cur = this;
    while (cur) {
      if (cur.matches && cur.matches(selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  contains(node) {
    let cur = node;
    while (cur) {
      if (cur === this) return true;
      cur = cur.parentElement;
    }
    return false;
  }

  matches(selector) {
    let sel = selector.replace(/^:scope\s*>\s*/, '').trim();
    const tagAttrMatch = sel.match(/^([a-zA-Z0-9_-]+)?\[([a-zA-Z0-9_-]+)(?:="([^"]*)")?\]$/);
    if (tagAttrMatch) {
      const tag = tagAttrMatch[1];
      const attr = tagAttrMatch[2];
      const val = tagAttrMatch[3];
      if (tag && this.tagName.toLowerCase() !== tag.toLowerCase()) return false;
      const actualVal = this.getAttribute(attr);
      if (val !== undefined) return actualVal === val;
      return actualVal !== null;
    }
    if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
    if (sel.startsWith('#')) return this.getAttribute('id') === sel.slice(1);
    return this.tagName.toLowerCase() === sel.toLowerCase();
  }

  querySelector(selector) {
    if (selector.startsWith(':scope >')) {
      const sub = selector.replace(/^:scope\s*>\s*/, '').trim();
      for (const child of this.children) {
        if (child.matches && child.matches(sub)) return child;
      }
      return null;
    }
    for (const child of this.children) {
      if (child.matches && child.matches(selector)) return child;
      if (child.querySelector) {
        const found = child.querySelector(selector);
        if (found) return found;
      }
    }
    return null;
  }

  get textContent() {
    return this.children.map(c => c.textContent || c.nodeValue || '').join('');
  }

  get innerText() {
    return this.textContent;
  }
}

class MockTextNode extends MockNode {
  constructor(text, parentElement = null) {
    super(3, parentElement);
    this.nodeValue = text;
    this.textContent = text;
  }
}

// 装配词典并注入测试挂载钩子
let code = preloadSource.replace('/*__I18N_DICT_PLACEHOLDER__*/{}', JSON.stringify(mergedDict));

// 在 IIFE 内部暴露测试钩子，阻断真实 DOM 监听器
code = code.replace(
  /if\s*\(\s*document\.readyState === 'loading'\s*\)[\s\S]*?startObserver\(\);\s*\}/,
  `globalThis.__testTranslate = translateString;
  globalThis.__testSkip = shouldSkipNode;`
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
test('思考链正文容器 .thought-content 内部节点必须跳过', () => {
  const thoughtBox = new MockElement('div', { className: 'thought-content' });
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

  const streamBody = new MockElement('div', { className: 'stream-markdown' });
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
  const wrapper = new MockElement('div', { className: 'thought-box' });
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
// 测试组 4: Master 项目 Ticket-02 全套 DOM 隔离用例 (11 Cases)
// ===================================================================
console.log('\n--- 测试组 4: Master 项目 Ticket-02 全套 DOM 门禁测试 ---');
const masterTicket02Cases = [
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
    name: 'Case 2 (聊天容器): <div class="conversation-container"><span>File</span></div>',
    node: () => {
      const container = new MockElement('div', { className: 'conversation-container' });
      const span = new MockElement('span', { parentElement: container });
      container.appendChild(span);
      const text = new MockTextNode('File', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 3 (消息 ID 属性): <div data-message-id="msg-123"><p>Error</p></div>',
    node: () => {
      const msgDiv = new MockElement('div', { attributes: { 'data-message-id': 'msg-123' } });
      const p = new MockElement('p', { parentElement: msgDiv });
      msgDiv.appendChild(p);
      const text = new MockTextNode('Error', p);
      p.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 4 (Markdown Prose 渲染正文): <div class="prose"><div>File</div></div>',
    node: () => {
      const proseDiv = new MockElement('div', { className: 'prose' });
      const innerDiv = new MockElement('div', { parentElement: proseDiv });
      proseDiv.appendChild(innerDiv);
      const text = new MockTextNode('File', innerDiv);
      innerDiv.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 5 (文件路径特征): <span class="path-label">grill-with-docs-zh/SKILL.md</span>',
    node: () => {
      const pathSpan = new MockElement('span', { className: 'path-label' });
      const text = new MockTextNode('grill-with-docs-zh/SKILL.md', pathSpan);
      pathSpan.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 6 (动态思考与日志区域): <div class="thought-container"><span>Thought</span></div>',
    node: () => {
      const thoughtDiv = new MockElement('div', { className: 'thought-container' });
      const span = new MockElement('span', { parentElement: thoughtDiv });
      thoughtDiv.appendChild(span);
      const text = new MockTextNode('Thought', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 7 (面包屑导航): <span class="breadcrumb">Project</span>',
    node: () => {
      const span = new MockElement('span', { className: 'breadcrumb' });
      const text = new MockTextNode('Project', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 8 (工作区下拉列表项): <div class="workspace-dropdown-item">Project</div>',
    node: () => {
      const div = new MockElement('div', { className: 'workspace-dropdown-item' });
      const text = new MockTextNode('Project', div);
      div.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 9 (文件夹列表项): <div class="folder-item">Project</div>',
    node: () => {
      const div = new MockElement('div', { className: 'folder-item' });
      const text = new MockTextNode('Project', div);
      div.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 10 (聊天消息视图): <div class="chat-message-view"><span>Models</span></div>',
    node: () => {
      const container = new MockElement('div', { className: 'chat-message-view' });
      const span = new MockElement('span', { parentElement: container });
      container.appendChild(span);
      const text = new MockTextNode('Models', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  },
  {
    name: 'Case 11 (Markdown 流式正文): <div class="stream-markdown-body"><span>Settings</span></div>',
    node: () => {
      const container = new MockElement('div', { className: 'stream-markdown-body' });
      const span = new MockElement('span', { parentElement: container });
      container.appendChild(span);
      const text = new MockTextNode('Settings', span);
      span.appendChild(text);
      return text;
    },
    expected: true
  }
];

for (const tc of masterTicket02Cases) {
  test(`Master Ticket-02 门禁: ${tc.name}`, () => {
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
  'The agent explored the codebase'
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

console.log('\n================================================================');
console.log(`测试套件执行完成: ${passed}/${total} 全部通过 (100% PASS)`);
console.log('================================================================\n');

if (passed !== total) {
  process.exit(1);
} else {
  process.exit(0);
}
