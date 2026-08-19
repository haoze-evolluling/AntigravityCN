"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectI18n = injectI18n;

const electron_1 = require("electron");
const { I18N_DICT } = require("./dict");
const { injectedMainWorldScript } = require("./engine");

/**
 * 执行 Main World (World 0) 汉化引擎双层注入
 * 1. 通过 webFrame.executeJavaScriptInIsolatedWorld(0, ...) 注入主世界环境，深度挂钩 React 与 DOM
 * 2. 在 document 加载就绪时通过 script 标签追加兜底注入
 */
function injectI18n() {
    const injectionCode = "(" + injectedMainWorldScript.toString() + ")(" + JSON.stringify(I18N_DICT) + ");";

    try {
        electron_1.webFrame.executeJavaScriptInIsolatedWorld(0, [
            { code: injectionCode }
        ]);
    } catch (e) {
        console.error('[AntigravityCN] webFrame injection error:', e);
    }

    // DOM 加载就绪时再次确保注入
    if (typeof document !== 'undefined') {
        const doDomInjection = () => {
            try {
                const script = document.createElement('script');
                script.textContent = injectionCode;
                (document.head || document.documentElement).appendChild(script);
                script.remove();
            } catch (_) {}
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', doDomInjection);
        } else {
            doDomInjection();
        }
    }
}
