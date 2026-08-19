# AntigravityCN

> **Google Antigravity 桌面端简体中文汉化工具**

将 Antigravity 桌面客户端（Windows）的原生 Shell 界面完整汉化为简体中文，包括系统菜单、托盘菜单、对话框、加载动画和欢迎向导。

---

## 汉化覆盖范围

| 界面元素 | 英文原文 | 汉化后 |
|---------|---------|--------|
| 文件菜单 | New Window | 新建窗口 |
| 帮助菜单 | Docs | 文档 |
| 更新菜单 | Check for Updates | 检查更新 |
| 更新菜单 | Checking for Updates... | 正在检查更新... |
| 更新菜单 | Downloading Update... | 正在下载更新... |
| 更新菜单 | Restart to Update | 重启以更新 |
| 更新对话框 | No updates available | 当前已是最新版本 |
| 托盘菜单 | No agents running | 无智能体正在运行 |
| 托盘菜单 | N agents running | N 个智能体正在运行 |
| 托盘菜单 | Open Antigravity | 打开 Antigravity |
| 托盘菜单 | Quit | 退出 |
| 退出确认 | Confirm Quit | 确认退出 |
| 退出确认 | Are you sure you want to quit? | 您确定要退出吗？ |
| 退出确认 | Cancel / Quit | 取消 / 退出 |
| 文件夹选择 | Open workspace | 打开工作区 |
| 加载动画 | Loading Antigravity | 正在加载 Antigravity |
| 欢迎向导 | Welcome to the new Antigravity! | 欢迎使用全新 Antigravity！ |
| 欢迎向导 | Download the Antigravity IDE | 下载 Antigravity IDE |
| 欢迎向导 | Explore the new Antigravity | 探索全新 Antigravity |

> **注意**：主界面（对话、设置页）由 Language Server 二进制渲染，暂无法汉化。

---

## 使用方法

### 环境要求

- Windows 10/11
- [Node.js](https://nodejs.org/) v16+（用于 `npx asar`）
- Antigravity 已安装

### 一键汉化

以**管理员身份**打开 PowerShell，进入本项目目录后运行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\apply-cn-patch.ps1
```

脚本执行完毕后，**重启 Antigravity** 即可看到中文界面。

### 还原英文版

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\restore-original.ps1
```

---

## 注意事项

- **应用更新后**需重新运行 `apply-cn-patch.ps1`，因为更新会覆盖 `app.asar`。
- 脚本会在首次运行时自动备份原始 `app.asar`（存为 `app.asar.backup`），后续运行跳过备份。
- 脚本通过 `npx` 自动下载 `asar` 工具，无需手动安装。

---

## 项目结构

```
AntigravityCN/
├── apply-cn-patch.ps1          # 一键汉化脚本
├── restore-original.ps1        # 还原原版脚本
├── README.md                   # 本文档
└── patches/                    # 汉化补丁文件
    ├── menu.js
    ├── updater.js
    ├── tray.js
    ├── main.js
    ├── ipcHandlers.js
    ├── loadingOverlay.js
    └── ideInstall/
        └── wizardHtml.js
```
