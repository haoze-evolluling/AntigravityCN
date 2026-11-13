# 开发与维护工具脚本 (Scripts)

本目录包含 AntigravityCN 项目开发、构建、词典维护与静态资源生成所需的辅助工具脚本。

---

## 脚本清单与功能说明

| 脚本文件 | 运行时环境 | 主要功能描述 | 常用执行命令 |
| :--- | :--- | :--- | :--- |
| **`generate_icon.js`** | Node.js | 从 `build/logo.svg` 高清矢量源文件渲染并生成 Windows 多分辨率 ICO 图标（32-bit DIB + 256x256 PNG）及 Wails 512x512 应用图标 | `node scripts/generate_icon.js` 或 `--force` |
| **`audit_locales.js`** | Node.js | 审查本地化词典中的潜在问题：检测跨文件词条重叠、末尾标点变体（句号/冒号）及连字符与空格变体 | `node scripts/audit_locales.js` |
| **`prune_locales.js`** | Node.js | 对照当前运行版本的 UI 前端包审计词典，删除当前版本不存在、自映射及旧版中英混排词条；服务端下发或运行时拼接的词条通过 `locale_allowlist.json` 保留 | `node scripts/prune_locales.js`（预览）<br>`node scripts/prune_locales.js --write`（写回） |

---

## 维护规范

1. **增量优先**：`generate_icon.js` 具备文件修改时间（mtime）智能比对机制，未修改 SVG 源文件时会自动跳过重新渲染以加速日常构建。
2. **版本跟随**：Antigravity 升级后先运行 `prune_locales.js` 预览审计结果，确认无误后再加 `--write` 精简词典。
