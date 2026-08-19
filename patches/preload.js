"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 * Antigravity 桌面端全方位双层深度汉化引擎 (Preload & Main-World Bridge)
 * 
 * 1. 在 Main World (World 0) 中深度拦截 React.createElement、DOM 属性与 document.title，
 *    实现 Virtual DOM 级别的原生汉化（零闪烁、零延迟、防 React 重渲染回退）。
 * 2. 在 Isolated World 中维护标准 ContextBridge API 与系统级通信。
 */

const { registerContextBridge } = require("./preload/bridges");
const { injectI18n } = require("./preload/i18n");

// 1. ContextBridge APIs (保持与原版完全一致)
registerContextBridge();

// 2. 注入深度汉化引擎
injectI18n();
