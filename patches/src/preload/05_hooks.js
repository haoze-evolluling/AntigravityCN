
    // Shadow DOM 穿透挂钩
    const originalAttachShadow = Element.prototype.attachShadow;
    if (originalAttachShadow) {
        Element.prototype.attachShadow = function() {
            const shadowRoot = originalAttachShadow.apply(this, arguments);
            observeRoot(shadowRoot);
            return shadowRoot;
        };
    }

    function safeScan() {
        if (document.body) {
            try {
                translateNode(document.body);
            } catch (e) {
                console.error('[AntigravityCN] Translation scan error:', e);
            }
            observeRoot(document.body);
        }
    }

    function startObserver() {
        safeScan();

        // 1. 渐进式多阶挂载兜底 (Progressive Mounting Backstop)
        [50, 150, 400, 1000, 2500].forEach(delay => {
            setTimeout(safeScan, delay);
        });

        // 2. 窗口激活 (Focus) 与可见性恢复 (VisibilityChange) 兜底
        window.addEventListener('focus', safeScan);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                safeScan();
            }
        });

        // 3. SPA 路由切换监听 (History API Hook)
        try {
            const origPushState = history.pushState;
            history.pushState = function() {
                const ret = origPushState.apply(this, arguments);
                setTimeout(safeScan, 50);
                return ret;
            };
            const origReplaceState = history.replaceState;
            history.replaceState = function() {
                const ret = origReplaceState.apply(this, arguments);
                setTimeout(safeScan, 50);
                return ret;
            };
            window.addEventListener('popstate', () => setTimeout(safeScan, 50));
        } catch (_) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
})();
