    // ---------------------------------------------------------------------------
    // 4. DOM 调度层 (微任务聚合、WeakSet 记忆化与祖先剪枝)
    // ---------------------------------------------------------------------------
    const translatedNodes = new WeakSet();

    function translateNode(node) {
        if (!node) return;
        if (shouldSkipNode(node)) return;

        if (node.nodeType === 3) { // Node.TEXT_NODE
            if (translatedNodes.has(node)) return;
            const original = node.nodeValue;
            if (!original || !original.trim()) return;
            const translated = translateString(original);
            if (original !== translated) {
                node.nodeValue = translated;
                translatedNodes.add(node);
            } else if (!/[a-zA-Z]/.test(original)) {
                translatedNodes.add(node);
            }
        } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
            ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder', 'value'].forEach(attr => {
                if (node.hasAttribute && node.hasAttribute(attr)) {
                    // 双重锁死：绝对不翻译任何输入框或编辑区的用户输入 value
                    if (attr === 'value' && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA')) {
                        return;
                    }
                    const original = node.getAttribute(attr);
                    if (original && (node.tagName !== 'INPUT' || node.type === 'button' || node.type === 'submit' || attr !== 'value')) {
                        const translated = translateString(original);
                        if (original !== translated) {
                            node.setAttribute(attr, translated);
                        }
                    }
                }
            });
            if (node.shadowRoot) {
                observeRoot(node.shadowRoot);
                translateNode(node.shadowRoot);
            }
            for (let i = 0; i < node.childNodes.length; i++) {
                translateNode(node.childNodes[i]);
            }
        } else if (node.nodeType === 11) { // Node.DOCUMENT_FRAGMENT_NODE
            for (let i = 0; i < node.childNodes.length; i++) {
                translateNode(node.childNodes[i]);
            }
        }
    }

    const observerConfig = {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'title', 'aria-label', 'data-tooltip', 'data-placeholder', 'value']
    };

    const observedRoots = new WeakSet();
    let isTranslating = false;
    let batchRafHandle = null;
    const pendingAddedNodes = new Set();
    const pendingTextNodes = new Set();
    const pendingAttrNodes = new Map();

    const scheduleBatchFrame = (fn) => {
        if (typeof queueMicrotask === 'function') {
            queueMicrotask(fn);
        } else if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(fn);
        } else {
            setTimeout(fn, 0);
        }
    };

    function scheduleBatchTranslation() {
        if (batchRafHandle !== null) return;
        batchRafHandle = true;
        scheduleBatchFrame(processBatchTranslation);
    }

    function processBatchTranslation() {
        batchRafHandle = null;
        if (isTranslating) return;
        isTranslating = true;

        try {
            // 1. 批量处理属性变更
            if (pendingAttrNodes.size > 0) {
                for (const [target, attrs] of pendingAttrNodes) {
                    if (!shouldSkipNode(target)) {
                        for (const attrName of attrs) {
                            if (attrName === 'value' && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
                                continue;
                            }
                            const original = target.getAttribute(attrName);
                            if (original) {
                                const translated = translateString(original);
                                if (original !== translated) {
                                    target.setAttribute(attrName, translated);
                                }
                            }
                        }
                    }
                }
                pendingAttrNodes.clear();
            }

            // 2. 批量处理文本变更 (characterData)
            if (pendingTextNodes.size > 0) {
                for (const node of pendingTextNodes) {
                    if (!shouldSkipNode(node)) {
                        const original = node.nodeValue;
                        if (original && original.trim()) {
                            const translated = translateString(original);
                            if (original !== translated) {
                                node.nodeValue = translated;
                                translatedNodes.add(node);
                            } else if (!/[a-zA-Z]/.test(original)) {
                                translatedNodes.add(node);
                            }
                        }
                    }
                }
                pendingTextNodes.clear();
            }

            // 3. 批量处理新增节点（性能优化：祖先包含剪枝，彻底消灭 O(N^2) 嵌套递归）
            if (pendingAddedNodes.size > 0) {
                const rootNodes = [];
                for (const node of pendingAddedNodes) {
                    let hasAncestor = false;
                    let p = node.parentElement;
                    while (p) {
                        if (pendingAddedNodes.has(p)) {
                            hasAncestor = true;
                            break;
                        }
                        p = p.parentElement;
                    }
                    if (!hasAncestor) {
                        rootNodes.push(node);
                    }
                }
                pendingAddedNodes.clear();

                for (let i = 0; i < rootNodes.length; i++) {
                    const node = rootNodes[i];
                    if (node.shadowRoot) {
                        observeRoot(node.shadowRoot);
                    }
                    if (!shouldSkipNode(node)) {
                        translateNode(node);
                    }
                }
            }
        } catch (e) {
            console.error('[AntigravityCN] Batch translation error:', e);
        } finally {
            isTranslating = false;
        }
    }

    function observeRoot(root) {
        if (!root || observedRoots.has(root)) return;
        observedRoots.add(root);

        const observer = new MutationObserver((mutations) => {
            let needsSchedule = false;
            for (let i = 0; i < mutations.length; i++) {
                const mutation = mutations[i];
                if (mutation.type === 'childList') {
                    const added = mutation.addedNodes;
                    for (let j = 0; j < added.length; j++) {
                        const node = added[j];
                        if (node.shadowRoot) {
                            observeRoot(node.shadowRoot);
                        }
                        pendingAddedNodes.add(node);
                        needsSchedule = true;
                    }
                } else if (mutation.type === 'characterData') {
                    translatedNodes.delete(mutation.target);
                    pendingTextNodes.add(mutation.target);
                    needsSchedule = true;
                } else if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    let attrSet = pendingAttrNodes.get(target);
                    if (!attrSet) {
                        attrSet = new Set();
                        pendingAttrNodes.set(target, attrSet);
                    }
                    attrSet.add(mutation.attributeName);
                    needsSchedule = true;
                }
            }

            if (needsSchedule) {
                scheduleBatchTranslation();
            }
        });

        observer.observe(root, observerConfig);
    }
