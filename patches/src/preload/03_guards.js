
    // ---------------------------------------------------------------------------
    // 3. 物理安全免疫沙盒与单次祖先检查 (DOM Safety Sandbox)
    // ---------------------------------------------------------------------------
    const skipCache = new WeakMap();

    function shouldSkipNode(node) {
        if (!node) return true;

        const element = node.nodeType === 3 ? node.parentElement : node; // 3 === Node.TEXT_NODE
        if (!element) return false;

        // 1. 记忆化缓存查询：O(1) 瞬间返回，消除万次重复树遍历
        if (skipCache.has(element)) {
            return skipCache.get(element);
        }

        // 2. 绝对不能翻译的脚本/样式/按键标签
        if (skipTags.includes(element.tagName)) {
            skipCache.set(element, true);
            return true;
        }

        // 核心保护：斜杠命令与提及建议菜单的触发词标签（保持 /boost, /schedule 等原生命令不变）
        // 针对提及菜单 (@) 中的分类标签（如 Rules -> 规则, Conversation -> 对话 等）特权放行汉化
        const isMenuOptionLabel = element.closest && element.closest('[data-testid="menu-option-label"]');
        if (isMenuOptionLabel) {
            const labelText = (isMenuOptionLabel.innerText || isMenuOptionLabel.textContent || '').trim();
            if (MENTION_CATEGORIES.has(labelText)) {
                skipCache.set(element, false);
                return false;
            }
            skipCache.set(element, true);
            return true;
        }

        // 思考过程触发药丸按钮（如 "Thought for 4.2s" 折叠栏标题）：必须放行汉化为 "思考了 4.2 秒"
        const isThinkingTrigger = element.closest && element.closest('button[data-testid="thinking-collapsible-trigger"]');
        if (isThinkingTrigger) {
            skipCache.set(element, false);
            return false;
        }

        // 3. 特殊特权放行：针对执行步骤的药丸标签（如 Ran, Explored, Edited, Viewed, Thought, Thinking, Working 等）
        // 无论其父级为 SPAN、CODE 还是 BUTTON，只要是系统执行药丸且不在用户提问气泡内，一律无条件放行汉化
        const textContent = (element.innerText || element.textContent || '').trim();
        const isActionPill = textContent.length <= 25 && /^(Explored|Ran|Viewed|Edited|Thought|Thinking|Working)$/i.test(textContent);
        if (isActionPill) {
            let inUserInput = false;
            let inThinkingContent = false;
            let checkCur = element;
            while (checkCur && checkCur !== document.body) {
                if (checkCur.classList) {
                    if (checkCur.classList.contains('group/user-input-step') ||
                        checkCur.classList.contains('cursor-edit') ||
                        checkCur.classList.contains('thought-content') ||
                        checkCur.classList.contains('thinking-content') ||
                        checkCur.classList.contains('thought-box') ||
                        checkCur.classList.contains('thought-container') ||
                        checkCur.classList.contains('conversation-container') ||
                        checkCur.classList.contains('chat-message-view') ||
                        checkCur.classList.contains('prose') ||
                        checkCur.classList.contains('stream-markdown-body') ||
                        checkCur.classList.contains('stream-markdown') ||
                        checkCur.classList.contains('path-label') ||
                        checkCur.classList.contains('breadcrumb') ||
                        checkCur.classList.contains('workspace-dropdown-item') ||
                        checkCur.classList.contains('folder-item')) {
                        inThinkingContent = true;
                        break;
                    }
                }
                if (checkCur.getAttribute && checkCur.getAttribute('data-message-id')) {
                    inThinkingContent = true;
                    break;
                }
                if (checkCur.parentElement && checkCur.parentElement.querySelector) {
                    const trigger = checkCur.parentElement.querySelector('button[data-testid="thinking-collapsible-trigger"]');
                    if (trigger && checkCur !== trigger && !trigger.contains(checkCur)) {
                        inThinkingContent = true;
                        break;
                    }
                }
                checkCur = checkCur.parentElement;
            }
            if (!inUserInput && !inThinkingContent) {
                skipCache.set(element, false);
                return false;
            }
        }

        if (element.tagName === 'CODE') {
            if (!isActionPill) {
                skipCache.set(element, true);
                return true;
            }
        }
        if (element.tagName === 'PRE') {
            skipCache.set(element, true);
            return true;
        }

        // 4. 输入框/文本域/富文本编辑器绝对跳过
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            skipCache.set(element, true);
            return true;
        }
        if (element.getAttribute && (
            element.getAttribute('contenteditable') === 'true' ||
            element.getAttribute('role') === 'textbox' ||
            element.getAttribute('data-lexical-editor') === 'true'
        )) {
            skipCache.set(element, true);
            return true;
        }

        // 5. 检查元素自身是否带有代码语言标记属性
        if (element.getAttribute) {
            if (element.getAttribute('data-language') ||
                element.getAttribute('data-code') ||
                element.getAttribute('data-line') ||
                element.getAttribute('data-line-number')) {
                skipCache.set(element, true);
                return true;
            }
        }

        // 6. 向上递归检查祖先节点（带路径记忆化剪枝）
        let cur = element;
        let shouldSkip = false;
        while (cur && cur !== document.body) {
            if (skipCache.has(cur)) {
                shouldSkip = skipCache.get(cur);
                break;
            }

            // 核心防御：模型思考链正文容器、对话容器、Markdown正文与路径特征绝对跳过
            // 思考链为 AI 运行时生成的自由英文/动态推理流，切勿进行逐词或断句翻译，杜绝中英夹杂混乱
            if (cur.classList && (
                cur.classList.contains('cursor-edit') ||
                cur.classList.contains('thought-content') ||
                cur.classList.contains('thinking-content') ||
                cur.classList.contains('thought-box') ||
                cur.classList.contains('thought-container') ||
                cur.classList.contains('conversation-container') ||
                cur.classList.contains('chat-message-view') ||
                cur.classList.contains('prose') ||
                cur.classList.contains('stream-markdown-body') ||
                cur.classList.contains('stream-markdown') ||
                cur.classList.contains('path-label') ||
                cur.classList.contains('breadcrumb') ||
                cur.classList.contains('workspace-dropdown-item') ||
                cur.classList.contains('folder-item')
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.getAttribute) {
                if (cur.getAttribute('data-message-id')) {
                    shouldSkip = true;
                    break;
                }
                const testId = cur.getAttribute('data-testid');
                if (testId && (
                    testId === 'thinking-collapsible-content' ||
                    testId === 'thought-content' ||
                    testId === 'thinking-content' ||
                    testId === 'thought-box'
                )) {
                    shouldSkip = true;
                    break;
                }
            }

            // 思考折叠栏内容区域：位于 thinking-collapsible-trigger 旁的展开正文容器
            if (cur.parentElement && cur.parentElement.querySelector) {
                const trigger = cur.parentElement.querySelector('button[data-testid="thinking-collapsible-trigger"]');
                if (trigger && cur !== trigger && !trigger.contains(cur)) {
                    shouldSkip = true;
                    break;
                }
            }

            // 用户输入框与富文本编辑器
            if (cur.getAttribute && (
                cur.getAttribute('contenteditable') === 'true' ||
                cur.getAttribute('role') === 'textbox' ||
                cur.getAttribute('data-lexical-editor') === 'true'
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.getAttribute && (
                cur.getAttribute('data-language') ||
                cur.getAttribute('data-code') ||
                cur.getAttribute('data-line') ||
                cur.getAttribute('data-line-number') ||
                cur.getAttribute('role') === 'code'
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.classList && (
                cur.classList.contains('group/user-input-step') ||
                cur.classList.contains('user-message') ||
                cur.classList.contains('cursor-text') ||
                cur.classList.contains('monaco-editor') ||
                cur.classList.contains('editor-instance') ||
                cur.classList.contains('input-area') ||
                cur.classList.contains('chat-input')
            )) {
                shouldSkip = true;
                break;
            }

            if (cur.className && typeof cur.className === 'string') {
                const lowerClass = cur.className.toLowerCase();
                if (
                    lowerClass.includes('code-line') ||
                    lowerClass.includes('view-line') ||
                    codeClassPattern.test(cur.className)
                ) {
                    shouldSkip = true;
                    break;
                }
            }

            if (cur.tagName === 'PRE') {
                shouldSkip = true;
                break;
            }

            cur = cur.parentElement;
        }

        skipCache.set(element, shouldSkip);
        return shouldSkip;
    }

    // 窗口标题原生拦截
    try {
        const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
        if (titleDesc && titleDesc.set) {
            const origSet = titleDesc.set;
            Object.defineProperty(document, 'title', {
                configurable: true,
                enumerable: true,
                get() { return titleDesc.get.call(document); },
                set(val) { origSet.call(document, translateString(val)); }
            });
        }
    } catch (_) {}

