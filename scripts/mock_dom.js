// 模拟 DOM 节点树：供 test_engine.js 在 Node VM 沙盒中驱动汉化引擎使用

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

module.exports = { MockNode, MockElement, MockTextNode };
