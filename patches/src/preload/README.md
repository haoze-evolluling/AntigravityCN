# Preload.js 模块化源码目录 (`patches/src/preload`)

本目录存放用于修改/注入 Electron 应用的 Web UI 汉化与原型拦截引擎源码。
为遵守单文件代码行数规范（< 600行）并保持清晰的代码组织结构，引擎按职责解耦为以下 5 个模块：

| 文件名 | 职责说明 | 行数 |
| :--- | :--- | :--- |
| `01_header.js` | IIFE 包装层头部、词典占位符 `/*__I18N_DICT_PLACEHOLDER__*/{}`、核心词汇表、缓存池及高频分词正则 | ~80 行 |
| `02_pipeline.js` | 核心文本翻译分发管道 (`translateString`，支持 STRICT/TRUSTED 上下文分级)、长句/特定界面前置拦截、动态智能体日志正则与智能降级匹配 | ~500 行 |
| `03_guards.js` | 物理安全免疫沙盒与上下文三级判定 (SKIP/STRICT/TRUSTED)、模型思考链隔离、代码块过滤、窗口标题拦截 | ~290 行 |
| `04_dom.js` | DOM 调度层 (`translateNode`)、微任务聚合帧调度、WeakSet 记忆化、属性与文本批量翻译、MutationObserver | ~210 行 |
| `05_hooks.js` | Shadow DOM 穿透挂钩 (`attachShadow`)、多阶挂载兜底、窗口焦点恢复监听、SPA 路由监听与启动入口 | ~65 行 |

## 编译与组装机制

在 Electron 沙箱（`sandbox: true`）与上下文隔离（`contextIsolation: true`）环境下，Preload 必须作为独立同步的单脚本执行。

项目采用**“源码期模块化拆分，编译/注入期自动装配”**机制：
1. **自动组装**：每次运行 `node scripts/test_engine.js` 测试或通过 `.\build.ps1` 打包时，会自动调用 `scripts/build_preload.js` 将上述模块拼装至 `patches/preload.js`。
2. **手工构建**：
   ```bash
   node scripts/build_preload.js
   ```
3. **测试验证**：
   ```bash
   node scripts/test_engine.js
   ```
4. **Patcher 无感知**：Go 语言端注入逻辑（`internal/patcher/patcher.go`）与 `embed.FS` 保持 100% 兼容。
