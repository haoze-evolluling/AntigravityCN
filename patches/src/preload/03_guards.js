
    // ---------------------------------------------------------------------------
    // 3. 物理安全免疫沙盒与上下文分级 (DOM Safety Sandbox & Context Verdicts)
    // ---------------------------------------------------------------------------
    // 上下文判定三级模型：决定文本节点进入哪种翻译强度，从源头避免 AI 输出被误翻译
    //   VERDICT_TRUSTED 明确 UI 控件上下文（按钮/链接/系统菜单/对话框等）：完整翻译管线
    //   VERDICT_STRICT  未知区域（保守模式）：仅允许词典精确匹配与强锚定系统规则，严禁分词与模糊匹配
    //   VERDICT_SKIP    绝对跳过：AI 模型输出 / 思考链正文 / 代码与终端 / 用户输入 / 脚本样式
    const VERDICT_TRUSTED = 0;
    const VERDICT_STRICT = 1;
    const VERDICT_SKIP = 2;

    const skipCache = new WeakMap();

    // UI 控件信任特征：结构标签与 ARIA 角色（命中即视为明确的界面控件上下文）
    const TRUST_TAGS = new Set(['BUTTON', 'A', 'NAV', 'HEADER', 'FOOTER', 'DIALOG', 'MENU', 'MENUBAR', 'OPTION', 'LABEL', 'SUMMARY', 'LEGEND', 'CAPTION', 'TH']);
    const TRUST_ROLES = new Set([
        'button', 'link', 'tab', 'tablist', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
        'dialog', 'alertdialog', 'tooltip', 'switch', 'checkbox', 'radio', 'option', 'combobox', 'listbox',
        'treeitem', 'columnheader', 'gridcell'
    ]);

    function getNodeVerdict(node) {
        if (!node) return VERDICT_SKIP;

        const element = node.nodeType === 3 ? node.parentElement : node; // 3 === Node.TEXT_NODE
        if (!element) return VERDICT_TRUSTED;

        // 1. 记忆化缓存查询：O(1) 瞬间返回，消除万次重复树遍历
        if (skipCache.has(element)) {
            return skipCache.get(element);
        }

        // 2. 绝对不能翻译的脚本/样式/按键标签
        if (skipTags.includes(element.tagName)) {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }

        // 核心保护：斜杠命令与提及建议菜单的触发词标签（保持 /boost, /schedule 等原生命令不变）
        // 针对提及菜单 (@) 中的分类标签（如 Rules -> 规则, Conversation -> 对话 等）特权放行汉化
        const isMenuOptionLabel = element.closest && element.closest('[data-testid="menu-option-label"]');
        if (isMenuOptionLabel) {
            const labelText = (isMenuOptionLabel.innerText || isMenuOptionLabel.textContent || '').trim();
            const verdict = MENTION_CATEGORIES.has(labelText) ? VERDICT_TRUSTED : VERDICT_SKIP;
            skipCache.set(element, verdict);
            return verdict;
        }

        // 思考过程触发药丸按钮（如 "Thought for 4.2s" 折叠栏标题）：系统 UI，放行汉化为 "思考了 4.2 秒"
        const isThinkingTrigger = element.closest && element.closest('button[data-testid="thinking-collapsible-trigger"]');
        if (isThinkingTrigger) {
            skipCache.set(element, VERDICT_TRUSTED);
            return VERDICT_TRUSTED;
        }

        // 智能体折叠操作条触发按钮（如 "Worked for 4m"、"Exploring 19 files, running 50 commands"）：系统 UI，放行汉化
        const isStepCollapsible = element.closest && (
            element.closest('button[data-testid="worked-for-collapsible"]') ||
            element.closest('button[data-testid="tool-group-collapsible"]')
        );
        if (isStepCollapsible) {
            skipCache.set(element, VERDICT_TRUSTED);
            return VERDICT_TRUSTED;
        }

        // 3. 特殊特权放行：针对执行步骤的药丸标签（如 Ran, Explored, Edited, Viewed, Thought, Thinking, Working, Analyzed 等）
        const textContent = (element.innerText || element.textContent || '').trim();
        const isActionPill = textContent.length <= 25 && /^(Explored|Ran|Viewed|Edited|Thought|Thinking|Working|Analyzed)$/i.test(textContent);

        // 4. 输入框/文本域/富文本编辑器绝对跳过
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }
        if (element.getAttribute && (
            element.getAttribute('contenteditable') === 'true' ||
            element.getAttribute('role') === 'textbox'
        )) {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }

        // 5. 代码块与终端容器绝对跳过
        if (element.tagName === 'PRE') {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }
        if (element.tagName === 'CODE') {
            if (!isActionPill) {
                skipCache.set(element, VERDICT_SKIP);
                return VERDICT_SKIP;
            }
        }
        if (element.getAttribute && (
            element.getAttribute('data-language') ||
            element.getAttribute('data-code') ||
            element.getAttribute('data-line') ||
            element.getAttribute('data-line-number')
        )) {
            skipCache.set(element, VERDICT_SKIP);
            return VERDICT_SKIP;
        }

        // 6. 向上递归检查祖先节点（Antigravity 2.0 专属现代特征匹配）
        let cur = element;
        let skipSeen = false;
        let trustSeen = false;
        while (cur && cur !== document.body) {
            if (skipCache.has(cur)) {
                const cached = skipCache.get(cur);
                if (cached === VERDICT_SKIP) skipSeen = true;
                else if (cached === VERDICT_TRUSTED) trustSeen = true;
                break;
            }

            // === Antigravity 2.0 核心安全沙盒 ===
            // 6.1 模型最终回复与计划推理流容器（最高优先级跳过）：
            //     彻底解决英文环境下最终回复中英混杂问题，确保模型生成的自由文本原汁原味
            if (cur.getAttribute) {
                const testId = cur.getAttribute('data-testid');
                if (testId === 'planner-response-text' || testId === 'artifact-view') {
                    skipSeen = true;
                    break;
                }
            }

            // 6.2 思考链展开正文容器：位于 thinking-collapsible 或 .cursor-edit 内部
            if (cur.classList && cur.classList.contains('cursor-edit')) {
                skipSeen = true;
                break;
            }
            if (cur.getAttribute && cur.getAttribute('data-testid') === 'thinking-collapsible') {
                skipSeen = true;
                break;
            }
            if (cur.parentElement && cur.parentElement.querySelector) {
                const trigger = cur.parentElement.querySelector('button[data-testid="thinking-collapsible-trigger"]');
                if (trigger && cur !== trigger && !trigger.contains(cur)) {
                    skipSeen = true;
                    break;
                }
            }

            // 6.3 用户提问输入区与消息气泡
            if (cur.getAttribute && (
                cur.getAttribute('data-testid') === 'user-input-step' ||
                cur.getAttribute('data-testid') === 'agent-input-box' ||
                cur.getAttribute('contenteditable') === 'true' ||
                cur.getAttribute('role') === 'textbox'
            )) {
                skipSeen = true;
                break;
            }
            if (cur.classList && (
                cur.classList.contains('group/user-input-step') ||
                cur.classList.contains('notebook-markdown-cell')
            )) {
                skipSeen = true;
                break;
            }

            // 6.4 代码编辑器与终端字体特征
            if (cur.classList && cur.classList.contains('font-mono') && !isActionPill) {
                skipSeen = true;
                break;
            }
            if (cur.tagName === 'PRE') {
                skipSeen = true;
                break;
            }

            // 6.5 UI 控件信任标记：按钮、导航、菜单、对话框等
            if (TRUST_TAGS.has(cur.tagName)) {
                trustSeen = true;
            } else if (cur.getAttribute) {
                const role = cur.getAttribute('role');
                if ((role && TRUST_ROLES.has(role)) || cur.hasAttribute('aria-haspopup')) {
                    trustSeen = true;
                }
            }

            cur = cur.parentElement;
        }

        // 步骤药丸在非思考正文与非用户输入上下文中的特权放行
        if (isActionPill && !skipSeen) {
            skipCache.set(element, VERDICT_TRUSTED);
            return VERDICT_TRUSTED;
        }

        const verdict = skipSeen ? VERDICT_SKIP : (trustSeen ? VERDICT_TRUSTED : VERDICT_STRICT);
        skipCache.set(element, verdict);
        return verdict;
    }

    function shouldSkipNode(node) {
        return getNodeVerdict(node) === VERDICT_SKIP;
    }

    // 窗口标题原生拦截（严格模式：会话名等 AI/用户内容不得被分词误译，仅词典与强锚定规则生效）
    try {
        const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'title') ||
                          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'title');
        if (titleDesc && titleDesc.set) {
            const origSet = titleDesc.set;
            Object.defineProperty(document, 'title', {
                configurable: true,
                enumerable: true,
                get() { return titleDesc.get.call(document); },
                set(val) { origSet.call(document, translateString(val, true)); }
            });
        }
    } catch (_) {}
