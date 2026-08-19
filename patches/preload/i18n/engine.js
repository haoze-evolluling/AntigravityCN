"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectedMainWorldScript = injectedMainWorldScript;

/**
 * Main World 注入函数（运行在页面 JS 主上下文中，深度挂钩 React.createElement 与 DOM）
 * 
 * 1. 在 Main World (World 0) 中深度拦截 React.createElement、DOM 属性与 document.title，
 *    实现 Virtual DOM 级别的原生汉化（零闪烁、零延迟、防 React 重渲染回退）。
 * 2. 动态正则支持：相对时间、配额重置倒计时、Token 百分比、智能体活跃状态等动态字符串匹配。
 */
function injectedMainWorldScript(DICT) {
    if (window.__AGY_CN_INITIALIZED__) return;
    window.__AGY_CN_INITIALIZED__ = true;

    // 构建小写快速索引表以支持不区分大小写匹配
    const DICT_LOWER = {};
    for (const k of Object.keys(DICT)) {
        DICT_LOWER[k.toLowerCase()] = DICT[k];
    }

    function translateText(str) {
        if (typeof str !== 'string') return str;
        const trimmed = str.trim();
        if (!trimmed || trimmed.length < 1) return str;

        // 1. 精确词典匹配
        if (DICT[trimmed]) {
            return str.replace(trimmed, DICT[trimmed]);
        }

        // 1.1 不区分大小写词典匹配
        const trimmedLower = trimmed.toLowerCase();
        if (DICT_LOWER[trimmedLower]) {
            return str.replace(trimmed, DICT_LOWER[trimmedLower]);
        }

        // 1.2 "Learn more about ..." 动态匹配
        if (/^Learn more about\s+(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^Learn more about\s+(.*)$/i);
            const target = translateText(m[1]);
            return str.replace(trimmed, '了解更多关于 ' + target);
        }
        if (/^Learn more about$/i.test(trimmed)) {
            return str.replace(trimmed, '了解更多关于');
        }

        // 1.3 输入框与操作提示动态匹配
        if (/^Ask anything,\s*@\s*to mention,\s*\/\s*for actions$/i.test(trimmed)) {
            return str.replace(trimmed, '任意提问，输入 @ 提及，输入 / 执行操作');
        }
        if (/^Ask anything,\s*@\s*to mention,\s*\/\s*for commands$/i.test(trimmed)) {
            return str.replace(trimmed, '任意提问，输入 @ 提及，输入 / 调用命令');
        }
        if (/^Ask anything,\s*@\s*to mention$/i.test(trimmed)) {
            return str.replace(trimmed, '任意提问，输入 @ 提及');
        }

        // 1.4 套餐名称动态匹配 (Your Plan: ...)
        if (/^Your Plan:\s*(.*)$/i.test(trimmed)) {
            const m = trimmed.match(/^Your Plan:\s*(.*)$/i);
            return str.replace(trimmed, '当前方案：' + m[1]);
        }

        // 1.5 自定义配置 Token 预算可用百分比 (X% of the customization budget is available.)
        if (/^([\d\.]+)%\s+of\s+(?:the\s+)?customization\s+budget\s+is\s+available\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^([\d\.]+)%\s+of\s+(?:the\s+)?customization\s+budget\s+is\s+available\.?$/i);
            return str.replace(trimmed, m[1] + '% 的自定义配置预算可用。');
        }

        // 1.6 明细折叠/展开动态匹配 (Show N breakdowns / Hide N breakdowns)
        if (/^Show\s+(\d+)\s+breakdowns?$/i.test(trimmed)) {
            const m = trimmed.match(/^Show\s+(\d+)\s+breakdowns?$/i);
            return str.replace(trimmed, '显示 ' + m[1] + ' 项明细');
        }
        if (/^Hide\s+(\d+)\s+breakdowns?$/i.test(trimmed)) {
            const m = trimmed.match(/^Hide\s+(\d+)\s+breakdowns?$/i);
            return str.replace(trimmed, '隐藏 ' + m[1] + ' 项明细');
        }

        // 1.7 模型配额使用与刷新时间动态匹配
        if (/^You have used (some|all) of your ([\w\-]+) limit,\s*it will fully refresh in (.*?)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^You have used (some|all) of your ([\w\-]+) limit,\s*it will fully refresh in (.*?)\.?$/i);
            const usageType = m[1].toLowerCase() === 'all' ? '已用尽' : '已使用部分';
            let limitType = m[2].toLowerCase();
            if (limitType === 'weekly') limitType = '每周';
            else if (limitType === '5-hour' || limitType === 'five-hour' || limitType === '5hour' || limitType === 'fivehour') limitType = '5 小时';
            else if (limitType === 'daily') limitType = '每日';
            else if (limitType === 'monthly') limitType = '每月';
            else if (limitType === 'hourly') limitType = '每小时';
            
            const timeStr = m[3]
                .replace(/(\d+)\s*days?/gi, '$1 天')
                .replace(/(\d+)\s*hours?/gi, '$1 小时')
                .replace(/(\d+)\s*minutes?/gi, '$1 分钟')
                .replace(/(\d+)\s*seconds?/gi, '$1 秒')
                .replace(/,\s*/g, ' ')
                .trim();
                
            return str.replace(trimmed, '您' + usageType + limitType + '限额，将在 ' + timeStr + ' 后完全重置。');
        }
        if (/^it will fully refresh in (.*?)\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^it will fully refresh in (.*?)\.?$/i);
            const timeStr = m[1]
                .replace(/(\d+)\s*days?/gi, '$1 天')
                .replace(/(\d+)\s*hours?/gi, '$1 小时')
                .replace(/(\d+)\s*minutes?/gi, '$1 分钟')
                .replace(/(\d+)\s*seconds?/gi, '$1 秒')
                .replace(/,\s*/g, ' ')
                .trim();
            return str.replace(trimmed, '将在 ' + timeStr + ' 后完全重置。');
        }
        if (/^You (?:have not|haven't) used any of your ([\w\-]+) limit\.?$/i.test(trimmed)) {
            const m = trimmed.match(/^You (?:have not|haven't) used any of your ([\w\-]+) limit\.?$/i);
            let limitType = m[1].toLowerCase();
            if (limitType === 'weekly') limitType = '每周';
            else if (limitType === '5-hour' || limitType === 'five-hour' || limitType === '5hour' || limitType === 'fivehour') limitType = '5 小时';
            else if (limitType === 'daily') limitType = '每日';
            else if (limitType === 'monthly') limitType = '每月';
            return str.replace(trimmed, '您尚未消耗' + limitType + '限额。');
        }

        // 2. 智能体与任务运行数量
        if (/^(\d+)\s+agents?\s+running$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个智能体正在运行');
        }
        if (/^No\s+agents?\s+running$/i.test(trimmed)) {
            return str.replace(trimmed, '无智能体正在运行');
        }
        if (/^(\d+)\s+subagents?\s+running$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个子智能体正在运行');
        }
        if (/^(\d+)\s+background\s+tasks?\s+running$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个后台任务正在运行');
        }
        if (/^(\d+)\s+active\s+tasks?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个活跃任务');
        }

        // 3. 选择与数量计数 (N of M selected / N files changed)
        if (/^(\d+)\s+of\s+(\d+)\s+selected$/i.test(trimmed)) {
            const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
            return str.replace(trimmed, '已选择 ' + m[1] + ' / ' + m[2]);
        }
        if (/^(\d+)\s+of\s+(\d+)\s+files?$/i.test(trimmed)) {
            const m = trimmed.match(/^(\d+)\s+of\s+(\d+)/);
            return str.replace(trimmed, '第 ' + m[1] + ' / ' + m[2] + ' 个文件');
        }
        if (/^(\d+)\s+files?\s+changed$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 个文件已修改');
        }
        if (/^(\d+)\s+lines?\s+added$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '添加了 ' + num + ' 行');
        }
        if (/^(\d+)\s+lines?\s+removed$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '删除了 ' + num + ' 行');
        }
        if (/^(\d+)\s+matches?\s+found$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '找到 ' + num + ' 个匹配项');
        }
        if (/^(\d+)\s+results?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 条结果');
        }

        // 4. 思考时间动态匹配 (Thought for X seconds)
        if (/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
            const m = trimmed.match(/^Thought for\s+([\d\.]+\s*s(?:econds?)?)/i);
            return str.replace(trimmed, '思考耗时 ' + m[1].replace(/seconds?/i, '秒').replace(/s/i, ' 秒'));
        }
        if (/^Thinking for\s+([\d\.]+\s*s(?:econds?)?)/i.test(trimmed)) {
            const m = trimmed.match(/^Thinking for\s+([\d\.]+\s*s(?:econds?)?)/i);
            return str.replace(trimmed, '已思考 ' + m[1].replace(/seconds?/i, '秒').replace(/s/i, ' 秒'));
        }

        // 5. 步骤与轮次动态匹配 (Step N of M)
        if (/^Step\s+(\d+)\s+of\s+(\d+)$/i.test(trimmed)) {
            const m = trimmed.match(/^Step\s+(\d+)\s+of\s+(\d+)$/i);
            return str.replace(trimmed, '步骤 ' + m[1] + ' / ' + m[2]);
        }

        // 6. 相对时间动态匹配
        if (/^(\d+)\s+seconds?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 秒前');
        }
        if (/^(\d+)\s+minutes?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 分钟前');
        }
        if (/^(\d+)\s+hours?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 小时前');
        }
        if (/^(\d+)\s+days?\s+ago$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, num + ' 天前');
        }
        if (/^in\s+(\d+)\s+minutes?$/i.test(trimmed)) {
            const num = trimmed.match(/^in\s+(\d+)/i)[1];
            return str.replace(trimmed, num + ' 分钟后');
        }

        // 7. Token 与百分比
        if (/^(\d[\d,]*)\s+tokens?$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d[\d,]*)/)[1];
            return str.replace(trimmed, num + ' 个 Token');
        }
        if (/^(\d+)%\s+used$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '已使用 ' + num + '%');
        }
        if (/^(\d+)%\s+of\s+context\s+window$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+)/)[1];
            return str.replace(trimmed, '占上下文窗口 ' + num + '%');
        }
        if (/^(\d+(?:\.\d+)?)%\s+available$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+(?:\.\d+)?)%/)[1];
            return str.replace(trimmed, '剩余 ' + num + '% 可用');
        }
        if (/^(\d+(?:\.\d+)?)%\s+remaining$/i.test(trimmed)) {
            const num = trimmed.match(/^(\d+(?:\.\d+)?)%/)[1];
            return str.replace(trimmed, '剩余 ' + num + '%');
        }

        return str;
    }

    // 检查是否应跳过代码高亮与终端等节点
    function isCodeElement(type, props) {
        if (type === 'code' || type === 'pre') return true;
        if (props && typeof props === 'object') {
            const cls = props.className || '';
            if (typeof cls === 'string' && (
                cls.includes('monaco') ||
                cls.includes('prism') ||
                cls.includes('xterm') ||
                cls.includes('cm-editor') ||
                cls.includes('hljs') ||
                cls.includes('diff-line-content')
            )) {
                return true;
            }
        }
        return false;
    }

    function translateProps(props) {
        if (!props || typeof props !== 'object') return;
        const keys = [
            'placeholder', 'title', 'aria-label', 'aria-placeholder', 'aria-description',
            'label', 'description', 'tooltip', 'data-tooltip', 'data-title', 'data-placeholder',
            'alt', 'header', 'helperText', 'sublabel', 'subtitle', 'caption', 'text', 'value',
            'placeholderText', 'emptyText', 'badge', 'hint', 'prompt', 'summary', 'secondaryText',
            'helper', 'secondaryLabel'
        ];
        for (const k of keys) {
            if (typeof props[k] === 'string') {
                props[k] = translateText(props[k]);
            }
        }
        // 处理 props.children（当 JSX 运行时直接将 children 放入 props）
        if (props.children !== undefined) {
            props.children = translateChild(props.children);
        }
        // 处理 options 数组（用于下拉列表、单选/复选选项等）
        if (Array.isArray(props.options)) {
            for (const opt of props.options) {
                if (opt && typeof opt === 'object') {
                    if (typeof opt.label === 'string') opt.label = translateText(opt.label);
                    if (typeof opt.description === 'string') opt.description = translateText(opt.description);
                    if (typeof opt.title === 'string') opt.title = translateText(opt.title);
                }
            }
        }
        if (Array.isArray(props.items)) {
            for (const item of props.items) {
                if (item && typeof item === 'object') {
                    if (typeof item.label === 'string') item.label = translateText(item.label);
                    if (typeof item.description === 'string') item.description = translateText(item.description);
                    if (typeof item.title === 'string') item.title = translateText(item.title);
                }
            }
        }
    }

    function translateChild(child) {
        if (typeof child === 'string') {
            return translateText(child);
        }
        if (Array.isArray(child)) {
            return child.map(translateChild);
        }
        return child;
    }

    function wrapCreateElement(orig) {
        return function(type, props, ...children) {
            if (!isCodeElement(type, props)) {
                translateProps(props);
                for (let i = 0; i < children.length; i++) {
                    children[i] = translateChild(children[i]);
                }
            }
            return orig.call(this, type, props, ...children);
        };
    }

    function hookReact(obj) {
        if (!obj || typeof obj !== 'object') return;
        let _ce = obj.createElement ? wrapCreateElement(obj.createElement) : undefined;
        Object.defineProperty(obj, 'createElement', {
            configurable: true,
            enumerable: true,
            get() { return _ce; },
            set(fn) {
                _ce = typeof fn === 'function' ? wrapCreateElement(fn) : fn;
            }
        });
    }

    // 拦截全局 React 对象加载
    let _react = window.React || self.React;
    if (_react) {
        hookReact(_react);
    } else {
        Object.defineProperty(window, 'React', {
            configurable: true,
            enumerable: true,
            get() { return _react; },
            set(val) {
                _react = val;
                if (val && typeof val === 'object') {
                    hookReact(val);
                }
            }
        });
    }

    // 拦截 document.title 以自动汉化窗口标题
    try {
        const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
        if (titleDesc && titleDesc.set) {
            const origSet = titleDesc.set;
            Object.defineProperty(document, 'title', {
                configurable: true,
                enumerable: true,
                get() {
                    return titleDesc.get.call(document);
                },
                set(val) {
                    origSet.call(document, translateText(val));
                }
            });
        }
    } catch (_) {}

    // DOM 辅助观察器：捕获非 React 虚拟 DOM 渲染的原生节点、编辑器占位符与动态 Tooltip
    function walkAndTranslate(node) {
        if (!node) return;
        if (node.nodeType === 3) { // Text node
            const val = node.nodeValue;
            if (val && val.trim()) {
                const trans = translateText(val);
                if (trans !== val) {
                    node.nodeValue = trans;
                }
            }
            return;
        }
        if (node.nodeType === 1) { // Element node
            const tag = node.tagName ? node.tagName.toLowerCase() : '';
            if (isCodeElement(tag, { className: node.className })) {
                return;
            }
            const attrs = ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'];
            for (const attr of attrs) {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    const v = node.getAttribute(attr);
                    if (v) {
                        const trans = translateText(v);
                        if (trans !== v) node.setAttribute(attr, trans);
                    }
                }
            }
            let child = node.firstChild;
            while (child) {
                walkAndTranslate(child);
                child = child.nextSibling;
            }
        }
    }

    try {
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.type === 'childList') {
                    for (let i = 0; i < m.addedNodes.length; i++) {
                        walkAndTranslate(m.addedNodes[i]);
                    }
                } else if (m.type === 'characterData') {
                    const val = m.target.nodeValue;
                    if (val && val.trim()) {
                        const trans = translateText(val);
                        if (trans !== val) {
                            m.target.nodeValue = trans;
                        }
                    }
                } else if (m.type === 'attributes') {
                    const attr = m.attributeName;
                    if (['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'].includes(attr)) {
                        const v = m.target.getAttribute(attr);
                        if (v) {
                            const trans = translateText(v);
                            if (trans !== v) m.target.setAttribute(attr, trans);
                        }
                    }
                }
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'] });
            walkAndTranslate(document.body);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) {
                    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder'] });
                    walkAndTranslate(document.body);
                }
            });
        }
    } catch (_) {}
}
