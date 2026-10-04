# 开发与维护工具脚本 (Scripts)

本目录包含 AntigravityCN 项目开发、构建、词典维护与静态资源生成所需的辅助工具脚本。

---

## 脚本清单与功能说明

| 脚本文件 | 运行时环境 | 主要功能描述 | 常用执行命令 |
| :--- | :--- | :--- | :--- |
| **`generate_icon.js`** | Node.js | 从 `build/logo.svg` 高清矢量源文件渲染并生成 Windows 多分辨率 ICO 图标（32-bit DIB + 256x256 PNG）及 Wails 512x512 应用图标 | `node scripts/generate_icon.js` 或 `--force` |
| **`audit_locales.js`** | Node.js | 审查本地化词典中的潜在问题：检测跨文件词条重叠、末尾标点变体（句号/冒号）及连字符与空格变体 | `node scripts/audit_locales.js` |
| **`batch_clean_locales.js`** | Node.js | 词典自动化清洗与去重工具：自动修剪首尾空格、解决大小写与标点冲突，并安全剔除跨模块重复项 | `node scripts/batch_clean_locales.js`（分析预览）<br>`node scripts/batch_clean_locales.js --apply`（应用） |
| **`sort_locales.py`** | Python 3 | 词典字母序规范化工具：将 `patches/locales/zh-CN/` 下所有 JSON 词典按英文字符字母序（A 到 Z）重新排序并校验完整性 | `python scripts/sort_locales.py` |

---

## 维护规范

1. **增量优先**：`generate_icon.js` 具备文件修改时间（mtime）智能比对机制，未修改 SVG 源文件时会自动跳过重新渲染以加速日常构建。
2. **安全可逆**：词典批量清洗工具在启用 `--apply` 时会自动在执行前对原文件进行时间戳备份，确保词典修改安全无损。
