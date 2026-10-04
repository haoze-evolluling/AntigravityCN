package patcher

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// 本文件存放对解包后 Electron dist 文件的外科手术式汉化补丁：
// 原生菜单映射、原生右键上下文菜单映射以及按版本特征精准替换的注入逻辑。

// replaceInFile replaces targeted content in a file cleanly and idempotently
func replaceInFile(filePath, target, replacement string) (bool, error) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return false, nil
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return false, err
	}
	content := string(data)
	if strings.Contains(content, replacement) {
		return false, nil // Already patched
	}
	if !strings.Contains(content, target) {
		return false, nil // Target not found (different version or layout)
	}

	newContent := strings.Replace(content, target, replacement, -1)
	return true, os.WriteFile(filePath, []byte(newContent), 0644)
}

// injectOrUpdate appends or replaces an injected script segment delimited by startMarker
func injectOrUpdate(filePath, content, startMarker string) error {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return fmt.Errorf("目标文件不存在: %s", filePath)
	}
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	existing := string(data)
	markerIndex := strings.Index(existing, startMarker)
	if markerIndex != -1 {
		existing = strings.TrimRight(existing[:markerIndex], " \t\r\n") + "\n\n" + content
	} else {
		existing = strings.TrimRight(existing, " \t\r\n") + "\n\n" + content
	}
	return os.WriteFile(filePath, []byte(existing), 0644)
}

const menuInjectCode = `
// Antigravity 2.0 Chinese Localization Engine Enhanced - Native Menu Map
const menuTranslationMap = {
  'File': '文件',
  'Edit': '编辑',
  'View': '视图',
  'Window': '窗口',
  'Help': '帮助',
  'New Window': '新建窗口',
  'Docs': '使用文档',
  'Docs & API Reference': '文档与 API 参考',
  'Toggle Developer Tools': '开发者工具',
  'Check for Updates': '检查更新',
  'Checking for Updates...': '正在检查更新...',
  'Downloading Update...': '正在下载更新...',
  'Restart to Update': '重启以应用更新',
  'Undo': '撤销',
  'Redo': '重做',
  'Cut': '剪切',
  'Copy': '复制',
  'Paste': '粘贴',
  'Paste and Match Style': '粘贴并匹配格式',
  'Select All': '全选',
  'Minimize': '最小化',
  'Close': '关闭',
  'Close Window': '关闭窗口',
  'Quit': '退出',
  'Quit Antigravity': '退出 Antigravity',
  'About Antigravity': '关于 Antigravity',
  'Services': '服务',
  'Hide Antigravity': '隐藏 Antigravity',
  'Hide Others': '隐藏其他',
  'Show All': '显示全部',
  'Force Reload': '强制重新加载',
  'Reload': '重新加载',
  'Actual Size': '实际大小',
  'Zoom In': '放大',
  'Zoom Out': '缩小',
  'Toggle Full Screen': '切换全屏',
  'Toggle Fullscreen': '切换全屏',
  'Reset Zoom': '重置缩放',
  'New Conversation': '新建对话',
  'Create Project': '创建项目',
  'New Project': '新建项目',
  'Create New Project': '创建新项目',
  'Open Project': '打开项目',
  'Command Palette': '命令面板',
  'Split': '分屏',
  'Split Right': '向右分屏',
  'Split Down': '向下分屏',
  'Replace With New': '替换为新建',
  'Remove From Split': '从分屏中移除',
  'Split Terminal': '拆分终端',
  'Split Conversation Vertically': '垂直分屏对话',
  'Split Conversation Horizontally': '水平分屏对话',
  'Equalize Split Panes': '均分分屏窗格',
  'Fork': '派生',
  'Fork Conversation': '派生对话',
  'Connect to WSL': '连接到 WSL',
  'Reopen Locally': '本地重新打开'
};
function translateMenu(menuItem) {
  if (menuItem.label && menuTranslationMap[menuItem.label]) {
    menuItem.label = menuTranslationMap[menuItem.label];
  }
  if (menuItem.submenu) {
    if (menuItem.submenu.items) {
      menuItem.submenu.items.forEach(translateMenu);
    } else if (Array.isArray(menuItem.submenu)) {
      menuItem.submenu.forEach(translateMenu);
    }
  }
}
`

// contextMenuInjectCode translates the native right-click context menu (Antigravity 2.19.1+ ipcHandlers.js)
const contextMenuInjectCode = `
// Antigravity 2.0 Chinese Localization Engine Enhanced - Native Context Menu Map
const contextMenuTranslationMap = {
  'Cut': '剪切',
  'Copy': '复制',
  'Paste': '粘贴',
  'Select All': '全选',
  'Undo': '撤销',
  'Redo': '重做',
  'Delete': '删除',
  'New Conversation': '新建对话',
  'Fork Conversation': '派生对话',
  'Rename': '重命名',
  'Pin': '置顶',
  'Unpin': '取消置顶',
  'Close': '关闭',
  'Close Others': '关闭其他',
  'Close All': '全部关闭',
  'Copy Path': '复制路径',
  'Copy Relative Path': '复制相对路径',
  'Reveal in File Explorer': '在文件资源管理器中显示',
  'Reveal in Finder': '在访达中显示',
  'Open in Terminal': '在终端中打开'
};
function translateContextLabel(lbl) {
  if (!lbl) return '';
  return contextMenuTranslationMap[lbl] || lbl;
}
`

// applySurgicalPatches performs targeted, version-resilient modifications to extracted files
func applySurgicalPatches(extractDir string, mergedPreloadData []byte, logFn func(string)) (int, error) {
	patchedCount := 0

	// 1. Injected DOM Localization in dist/preload.js
	preloadPath := filepath.Join(extractDir, "dist", "preload.js")
	if _, err := os.Stat(preloadPath); err == nil {
		marker := "// Antigravity 2.0 Chinese Localization Engine"
		preloadStr := string(mergedPreloadData)
		enginePayload := preloadStr
		if !strings.Contains(preloadStr, marker) {
			enginePayload = marker + " Enhanced\n" + preloadStr
		}
		if err := injectOrUpdate(preloadPath, enginePayload, marker); err != nil {
			return 0, fmt.Errorf("注入 preload.js 失败: %w", err)
		}
		logFn("    [+] 已更新 dist/preload.js (Web UI 双层汉化引擎)")
		patchedCount++

		// Also inject into wizardPreload.js if exists (Antigravity IDE Onboarding Wizard)
		wizardPreloadPath := filepath.Join(extractDir, "dist", "ideInstall", "wizardPreload.js")
		if _, err := os.Stat(wizardPreloadPath); err == nil {
			if err := injectOrUpdate(wizardPreloadPath, enginePayload, marker); err == nil {
				logFn("    [+] 已更新 dist/ideInstall/wizardPreload.js (新版向导汉化引擎)")
				patchedCount++
			}
		}
	}

	// 2. Localize dist/menu.js (Native Application Menu)
	menuPath := filepath.Join(extractDir, "dist", "menu.js")
	if _, err := os.Stat(menuPath); err == nil {
		_ = injectOrUpdate(menuPath, menuInjectCode, "const menuTranslationMap =")
		_, _ = replaceInFile(
			menuPath,
			"const submenuItem = appMenu.items.find((item) => item.label === submenuLabel);",
			`const submenuItem = appMenu.items.find((item) => item.label === submenuLabel || (typeof menuTranslationMap !== "undefined" && item.label === menuTranslationMap[submenuLabel]));`,
		)
		_, _ = replaceInFile(
			menuPath,
			"electron_1.Menu.setApplicationMenu(menu);",
			`if (typeof translateMenu === 'function') { menu.items.forEach(translateMenu); } electron_1.Menu.setApplicationMenu(menu);`,
		)
		logFn("    [+] 已修补 dist/menu.js (原生菜单栏汉化与级联中英匹配回退)")
		patchedCount++
	}

	// 3. Localize dist/tray.js (Native System Tray)
	trayPath := filepath.Join(extractDir, "dist", "tray.js")
	if _, err := os.Stat(trayPath); err == nil {
		_, _ = replaceInFile(
			trayPath,
			"countItem.label =\n                (count > 0 ? `${count}` : 'No') +\n                    ' agent' +\n                    (count === 1 ? '' : 's') +\n                    ' running';",
			"countItem.label = count > 0 ? `${count} 个智能体运行中` : '没有智能体在运行';",
		)
		_, _ = replaceInFile(
			trayPath,
			"contextMenu = electron_1.Menu.buildFromTemplate(actions);",
			`const translatedActions = actions.map(action => {
        if (action.label === 'No agents running') action.label = '没有智能体在运行';
        if (action.label && action.label.startsWith('Open ')) action.label = '打开 Antigravity';
        if (action.label === 'Quit') action.label = '退出';
        return action;
    });
    contextMenu = electron_1.Menu.buildFromTemplate(translatedActions);`,
		)
		logFn("    [+] 已修补 dist/tray.js (系统托盘菜单与智能体运行计数)")
		patchedCount++
	}

	// 4. Localize dist/loadingOverlay.js (Starting loading screen)
	loadingOverlayPath := filepath.Join(extractDir, "dist", "loadingOverlay.js")
	if _, err := os.Stat(loadingOverlayPath); err == nil {
		_, _ = replaceInFile(
			loadingOverlayPath,
			`<div class="text">Loading Antigravity</div>`,
			`<div class="text">正在加载 Antigravity...</div>`,
		)
		logFn("    [+] 已修补 dist/loadingOverlay.js (启动加载遮罩界面)")
		patchedCount++
	}

	// 5. Localize dist/provisionSplash.js (WSL Provision Splash Screen)
	splashPath := filepath.Join(extractDir, "dist", "provisionSplash.js")
	if _, err := os.Stat(splashPath); err == nil {
		_, _ = replaceInFile(
			splashPath,
			`<div>Setting up WSL: ${escapeHtml(distro)}</div>`,
			`<div>正在配置 WSL: ${escapeHtml(distro)}</div>`,
		)
		_, _ = replaceInFile(
			splashPath,
			"document.getElementById('status').textContent = ${JSON.stringify(text)}",
			"document.getElementById('status').textContent = ${JSON.stringify(typeof text === 'string' ? (text.includes('Downloading the Antigravity binary') ? '正在下载 Antigravity 二进制组件…' : (text.startsWith('Installing into ') ? text.replace('Installing into ', '正在安装到 ') : text)) : text)}",
		)
		logFn("    [+] 已修补 dist/provisionSplash.js (WSL 部署与下载弹窗)")
		patchedCount++
	}

	// 6. Localize dist/ipcHandlers.js (Workspace Dialogs, WSL Alerts & Native Context Menu)
	ipcPath := filepath.Join(extractDir, "dist", "ipcHandlers.js")
	if _, err := os.Stat(ipcPath); err == nil {
		_, _ = replaceInFile(ipcPath, "title: 'Open workspace',", "title: '打开工作区',")
		_, _ = replaceInFile(ipcPath, "title: 'Open workspaces',", "title: '打开工作区',")
		_, _ = replaceInFile(ipcPath, "electron_1.dialog.showErrorBox('Cannot open folder', t.error);", "electron_1.dialog.showErrorBox('无法打开文件夹', t.error);")
		_, _ = replaceInFile(ipcPath, "message: 'Folder is on the Windows filesystem',", "message: '文件夹位于 Windows 文件系统中',")
		// 2.19.1+ 原生右键上下文菜单动态翻译（buildContextMenuTemplate 拦截 label）
		if err := injectOrUpdate(ipcPath, contextMenuInjectCode, "const contextMenuTranslationMap = {"); err == nil {
			_, _ = replaceInFile(ipcPath, "label: item.label ?? '',", "label: (typeof translateContextLabel === 'function' ? translateContextLabel(item.label) : item.label) ?? '',")
		}
		logFn("    [+] 已修补 dist/ipcHandlers.js (工作区对话框与原生右键上下文菜单)")
		patchedCount++
	}

	// 7. Localize dist/wsl.js (WSL Path Mappings & Status Messages)
	wslPath := filepath.Join(extractDir, "dist", "wsl.js")
	if _, err := os.Stat(wslPath); err == nil {
		_, _ = replaceInFile(
			wslPath,
			"warning: 'This folder is on the Windows filesystem. Accessing it from WSL (via /mnt) can be slow — for best performance keep projects inside the WSL filesystem.',",
			"warning: '此文件夹位于 Windows 文件系统。从 WSL 访问（通过 /mnt）可能较慢 — 为获得最佳性能，建议将项目保留在 WSL 文件系统中。',",
		)
		_, _ = replaceInFile(
			wslPath,
			"error: `This folder belongs to the WSL distro \"${unc[1]}\", but this window is connected to \"${distro}\".`,",
			"error: `此文件夹属于 WSL 发行版 \"${unc[1]}\"，但当前窗口连接到 \"${distro}\"。`,",
		)
		_, _ = replaceInFile(
			wslPath,
			"error: `This location cannot be opened in WSL: ${winPath}`",
			"error: `无法在 WSL 中打开此位置: ${winPath}`",
		)
		_, _ = replaceInFile(
			wslPath,
			"onStatus?.('Downloading the Antigravity binary\\u2026');",
			"onStatus?.('正在下载 Antigravity 二进制组件\\u2026');",
		)
		_, _ = replaceInFile(
			wslPath,
			"onStatus?.(`Installing into ${distro}\\u2026`);",
			"onStatus?.(`正在安装到 ${distro}\\u2026`);",
		)
		logFn("    [+] 已修补 dist/wsl.js (WSL 环境路径校验与状态通知)")
		patchedCount++
	}

	// 8. Localize dist/main.js (Startup & WSL Warnings)
	mainPath := filepath.Join(extractDir, "dist", "main.js")
	if _, err := os.Stat(mainPath); err == nil {
		_, _ = replaceInFile(mainPath, "title: 'WSL distro not found',", "title: '未找到 WSL 发行版',")
		_, _ = replaceInFile(
			mainPath,
			"message: `The WSL distro \"${WSL_DISTRO}\" is no longer installed.`,",
			"message: `WSL 发行版 \"${WSL_DISTRO}\" 已不再安装。`,",
		)
		_, _ = replaceInFile(
			mainPath,
			"detail: 'Antigravity opened on Windows instead.',",
			"detail: 'Antigravity 已改为在 Windows 本地打开。',",
		)
		_, _ = replaceInFile(
			mainPath,
			"await electron_1.dialog.showErrorBox('WSL setup failed', msg);",
			"await electron_1.dialog.showErrorBox('WSL 配置失败', msg);",
		)
		_, _ = replaceInFile(
			mainPath,
			"await electron_1.dialog.showErrorBox('Startup failed', msg);",
			"await electron_1.dialog.showErrorBox('启动失败', msg);",
		)
		_, _ = replaceInFile(
			mainPath,
			"await electron_1.dialog.showErrorBox('Binary not found', msg);",
			"await electron_1.dialog.showErrorBox('未找到核心二进制组件', msg);",
		)
		_, _ = replaceInFile(mainPath, "title: 'Confirm Quit',", "title: '确认退出',")
		_, _ = replaceInFile(mainPath, "message: 'Are you sure you want to quit?',", "message: '您确定要退出吗？',")
		_, _ = replaceInFile(mainPath, "detail: 'There may be agents or background tasks running.',", "detail: '可能还有智能体或后台任务正在运行。',")
		_, _ = replaceInFile(mainPath, "buttons: ['Cancel', 'Quit'],", "buttons: ['取消', '退出'],")
		_, _ = replaceInFile(mainPath, "label: 'New Window',", "label: '新建窗口',")
		logFn("    [+] 已修补 dist/main.js (主进程异常弹窗、退出确认与 WSL 回退通知)")
		patchedCount++
	}

	// 9. Localize dist/updater.js (Update Notifications & Dialogs)
	updaterPath := filepath.Join(extractDir, "dist", "updater.js")
	if _, err := os.Stat(updaterPath); err == nil {
		_, _ = replaceInFile(updaterPath, "title: 'Check for Updates',", "title: '检查更新',")
		_, _ = replaceInFile(updaterPath, "message: 'No updates available',", "message: '当前已是最新版本，暂无可用更新。',")
		_, _ = replaceInFile(updaterPath, "buttons: ['OK'],", "buttons: ['确定'],")
		logFn("    [+] 已修补 dist/updater.js (更新检查与无更新提示弹窗)")
		patchedCount++
	}

	// 10. Localize dist/ideInstall/wizardHtml.js (IDE Install Wizard Static Template)
	wizardHtmlPath := filepath.Join(extractDir, "dist", "ideInstall", "wizardHtml.js")
	if _, err := os.Stat(wizardHtmlPath); err == nil {
		_, _ = replaceInFile(wizardHtmlPath, "<title>Welcome to Antigravity</title>", "<title>欢迎使用 Antigravity</title>")
		_, _ = replaceInFile(wizardHtmlPath, "Setting up…", "正在配置…")
		_, _ = replaceInFile(wizardHtmlPath, "<h1>Welcome to the new Antigravity!</h1>", "<h1>欢迎使用全新 Antigravity！</h1>")
		_, _ = replaceInFile(
			wizardHtmlPath,
			"<p>Antigravity has been redesigned to put agents first with new capabilities. If you'd still like a code editor, you can download it as a separate app named <b>Antigravity IDE</b>.</p>",
			"<p>Antigravity 经过全面重构，赋予智能体更强大的原生能力。如果您仍需要代码编辑器，可单独下载独立应用 <b>Antigravity IDE</b>。</p>",
		)
		_, _ = replaceInFile(wizardHtmlPath, "<span>Download the Antigravity IDE</span>", "<span>下载 Antigravity IDE</span>")
		_, _ = replaceInFile(wizardHtmlPath, "<button class=\"btn-primary\" id=\"btn-skip\">Explore the new Antigravity</button>", "<button class=\"btn-primary\" id=\"btn-skip\">探索全新 Antigravity</button>")
		logFn("    [+] 已修补 dist/ideInstall/wizardHtml.js (IDE 安装向导静态模板)")
		patchedCount++
	}

	return patchedCount, nil
}
