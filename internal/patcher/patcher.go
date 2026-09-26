package patcher

import (
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	"antigravity-cn/internal/asar"
)

var (
	modkernel32                  = syscall.NewLazyDLL("kernel32.dll")
	procCreateToolhelp32Snapshot = modkernel32.NewProc("CreateToolhelp32Snapshot")
	procProcess32FirstW          = modkernel32.NewProc("Process32FirstW")
	procProcess32NextW           = modkernel32.NewProc("Process32NextW")
	procCloseHandle              = modkernel32.NewProc("CloseHandle")
	procOpenProcess              = modkernel32.NewProc("OpenProcess")
	procTerminateProcess         = modkernel32.NewProc("TerminateProcess")
)

const (
	TH32CS_SNAPPROCESS = 0x00000002
	PROCESS_TERMINATE  = 0x0001
)

type PROCESSENTRY32W struct {
	Size              uint32
	Usage             uint32
	ProcessID         uint32
	DefaultHeapID     uintptr
	ModuleID          uint32
	Threads           uint32
	ParentProcessID   uint32
	PriClassBase      int32
	Flags             uint32
	ExeFile           [260]uint16
}

// FindAppAsar attempts to find the default app.asar installation path
func FindAppAsar() string {
	localAppData := os.Getenv("LOCALAPPDATA")
	candidates := []string{
		filepath.Join(localAppData, "Programs", "antigravity", "resources", "app.asar"),
		filepath.Join(os.Getenv("ProgramFiles"), "Antigravity", "resources", "app.asar"),
		filepath.Join(os.Getenv("ProgramFiles(x86)"), "Antigravity", "resources", "app.asar"),
		filepath.Join(localAppData, "Programs", "Antigravity", "resources", "app.asar"),
	}

	for _, p := range candidates {
		if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
			return p
		}
	}

	if localAppData != "" {
		return filepath.Join(localAppData, "Programs", "antigravity", "resources", "app.asar")
	}
	return ""
}

// GetBackupPath returns the corresponding backup path for app.asar
func GetBackupPath(asarPath string) string {
	return asarPath + ".backup"
}

// GetExecutablePath returns the path to Antigravity.exe based on app.asar path
func GetExecutablePath(asarPath string) string {
	appDir := filepath.Dir(filepath.Dir(asarPath))
	for _, name := range []string{"Antigravity.exe", "antigravity.exe"} {
		exe := filepath.Join(appDir, name)
		if fi, err := os.Stat(exe); err == nil && !fi.IsDir() {
			return exe
		}
	}
	return filepath.Join(appDir, "Antigravity.exe")
}

// enumProcesses iterates over running Win32 processes and calls visitor for each.
func enumProcesses(visitor func(pid uint32, exeName string) bool) error {
	snapshot, _, err := procCreateToolhelp32Snapshot.Call(uintptr(TH32CS_SNAPPROCESS), 0)
	if snapshot == uintptr(syscall.InvalidHandle) {
		return err
	}
	defer procCloseHandle.Call(snapshot)

	var entry PROCESSENTRY32W
	entry.Size = uint32(unsafe.Sizeof(entry))

	ret, _, _ := procProcess32FirstW.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return nil
	}

	for {
		name := syscall.UTF16ToString(entry.ExeFile[:])
		if !visitor(entry.ProcessID, name) {
			break
		}
		ret, _, _ = procProcess32NextW.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	return nil
}

// IsProcessRunning checks if any process matching the given exe name (case-insensitive) is currently running
func IsProcessRunning(exeName string) (bool, error) {
	found := false
	err := enumProcesses(func(_ uint32, name string) bool {
		if strings.EqualFold(name, exeName) {
			found = true
			return false
		}
		return true
	})
	return found, err
}

// CloseAntigravityProcess closes running Antigravity and language_server processes
func CloseAntigravityProcess() error {
	return enumProcesses(func(pid uint32, name string) bool {
		lower := strings.ToLower(name)
		if lower == "antigravity.exe" || lower == "language_server.exe" {
			hProcess, _, _ := procOpenProcess.Call(uintptr(PROCESS_TERMINATE), 0, uintptr(pid))
			if hProcess != 0 {
				procTerminateProcess.Call(hProcess, 1)
				procCloseHandle.Call(hProcess)
			}
		}
		return true
	})
}

// AppStatus holds status information about the current installation
type AppStatus struct {
	AsarExists   bool
	BackupExists bool
	IsRunning    bool
}

// CheckStatus inspects the target asar path and returns current state
func CheckStatus(asarPath string) AppStatus {
	status := AppStatus{}
	if fi, err := os.Stat(asarPath); err == nil && !fi.IsDir() {
		status.AsarExists = true
	}
	if fi, err := os.Stat(GetBackupPath(asarPath)); err == nil && !fi.IsDir() {
		status.BackupExists = true
	}
	status.IsRunning, _ = IsProcessRunning("antigravity.exe")
	return status
}

// PatchOptions for applying patch
type PatchOptions struct {
	AutoCloseProcess bool
	SkipProcessCheck bool
}

// ensureProcessClosed checks if Antigravity is running and closes it if permitted
func ensureProcessClosed(logFn func(string), opts *PatchOptions) error {
	if opts != nil && opts.SkipProcessCheck {
		return nil
	}

	running, _ := IsProcessRunning("antigravity.exe")
	if !running {
		return nil
	}

	if opts != nil && opts.AutoCloseProcess {
		logFn("[*] 检测到 Antigravity 正在运行，正在关闭进程以防文件被占用...")
		_ = CloseAntigravityProcess()
		logFn("[OK] 进程已关闭。")
		return nil
	}

	return fmt.Errorf("检测到 Antigravity 正在运行中！\n请先保存工作并退出 Antigravity，再执行汉化或还原操作（避免文件锁定冲突）。")
}

// isLocalizedAsar checks whether a given asar file already contains localization markers
func isLocalizedAsar(filePath string) bool {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return false
	}
	content := string(data)
	return strings.Contains(content, "// Antigravity 2.0 Chinese Localization Engine") ||
		strings.Contains(content, "menuTranslationMap") ||
		strings.Contains(content, "injectedMainWorldScript")
}

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

	// 6. Localize dist/ipcHandlers.js (Workspace Dialogs & WSL Alerts)
	ipcPath := filepath.Join(extractDir, "dist", "ipcHandlers.js")
	if _, err := os.Stat(ipcPath); err == nil {
		_, _ = replaceInFile(ipcPath, "title: 'Open workspace',", "title: '打开工作区',")
		_, _ = replaceInFile(ipcPath, "title: 'Open workspaces',", "title: '打开工作区',")
		_, _ = replaceInFile(ipcPath, "electron_1.dialog.showErrorBox('Cannot open folder', t.error);", "electron_1.dialog.showErrorBox('无法打开文件夹', t.error);")
		_, _ = replaceInFile(ipcPath, "message: 'Folder is on the Windows filesystem',", "message: '文件夹位于 Windows 文件系统中',")
		logFn("    [+] 已修补 dist/ipcHandlers.js (工作区选择与系统级对话框)")
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
		logFn("    [+] 已修补 dist/main.js (主进程异常弹窗与 WSL 回退通知)")
		patchedCount++
	}

	return patchedCount, nil
}

// CleanAppCache safely clears temporary rendering and bytecode caches
func CleanAppCache(logFn func(string)) (int, error) {
	if logFn == nil {
		logFn = func(string) {}
	}
	logFn("[*] 正在扫描并安全清理 Antigravity 临时渲染与编译缓存...")

	localAppData := os.Getenv("LOCALAPPDATA")
	appData := os.Getenv("APPDATA")

	cacheRoots := []string{
		filepath.Join(appData, "Antigravity"),
		filepath.Join(appData, "antigravity"),
		filepath.Join(localAppData, "antigravity"),
	}

	targetSubDirs := []string{
		"Cache",
		"Code Cache",
		"GPUCache",
		"DawnGraphiteCache",
		"DawnWebGPUCache",
		"blob_storage",
	}

	cleanedCount := 0
	for _, root := range cacheRoots {
		if fi, err := os.Stat(root); err != nil || !fi.IsDir() {
			continue
		}
		for _, sub := range targetSubDirs {
			targetPath := filepath.Join(root, sub)
			if fi, err := os.Stat(targetPath); err == nil && fi.IsDir() {
				if err := os.RemoveAll(targetPath); err == nil {
					logFn(fmt.Sprintf("    [+] 已清理临时缓存: %s (%s)", sub, root))
					cleanedCount++
				} else {
					logFn(fmt.Sprintf("    [!] 缓存可能被占用，已跳过: %s", sub))
				}
			}
		}
	}

	logFn(fmt.Sprintf("[OK] 缓存清理完成，共安全清理 %d 处临时目录（用户配置与账号不受影响）。", cleanedCount))
	return cleanedCount, nil
}

// ApplyPatch applies the Chinese localization patch to app.asar
func ApplyPatch(asarPath string, patchesFS fs.FS, logFn func(string), opts *PatchOptions) error {
	if logFn == nil {
		logFn = func(string) {}
	}

	if fi, err := os.Stat(asarPath); err != nil || fi.IsDir() {
		return fmt.Errorf("未找到 app.asar 文件：%s", asarPath)
	}

	if err := ensureProcessClosed(logFn, opts); err != nil {
		return err
	}

	// 1. Backup original app.asar
	backupPath := GetBackupPath(asarPath)
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		if isLocalizedAsar(asarPath) {
			logFn("[!] 警告：当前 app.asar 已包含汉化标记，跳过备份以避免污染英文原版。")
		} else {
			logFn("[*] 正在备份原始 app.asar...")
			if err := copyFile(asarPath, backupPath); err != nil {
				return fmt.Errorf("备份 app.asar 失败: %w", err)
			}
			logFn(fmt.Sprintf("[OK] 原始官方备份已创建：%s", backupPath))
		}
	} else {
		logFn("[OK] 已检测到原始备份文件，跳过备份。")
	}

	// 2. Extract app.asar to temporary directory
	tempExtractDir, err := os.MkdirTemp("", "antigravity_cn_ext_*")
	if err != nil {
		return fmt.Errorf("创建临时解包目录失败: %w", err)
	}
	defer os.RemoveAll(tempExtractDir)

	logFn("[*] 正在解析并解包 app.asar...")
	if err := asar.Extract(asarPath, tempExtractDir); err != nil {
		return fmt.Errorf("解包 app.asar 失败: %w", err)
	}
	logFn("[OK] app.asar 解包完成。")

	// 3. Assemble modular dictionary and prepare preload.js
	preloadData, err := fs.ReadFile(patchesFS, "preload.js")
	if err != nil {
		// Fallback if inside patches subdirectory
		preloadData, err = fs.ReadFile(patchesFS, "patches/preload.js")
		if err != nil {
			return fmt.Errorf("读取 patches/preload.js 失败: %w", err)
		}
	}

	mergedPreloadData := getMergedPreloadData(patchesFS, preloadData, logFn)

	// 4. Apply surgical patches to extracted code
	logFn("[*] 正在执行外科手术式精准注入与汉化修补...")
	patchedCount, err := applySurgicalPatches(tempExtractDir, mergedPreloadData, logFn)
	if err != nil {
		return fmt.Errorf("应用汉化补丁失败: %w", err)
	}
	logFn(fmt.Sprintf("[OK] 针对性修补已完成，共更新 %d 个核心原生与预加载模块。", patchedCount))

	// 5. Repack ASAR with unpacked native module decoupling (maintains 4.53 MB)
	logFn("[*] 正在重新封装 app.asar (对齐 4.53 MB 官方标准)...")
	tempAsarFile, err := os.CreateTemp("", "app_cn_*.asar")
	if err != nil {
		return fmt.Errorf("创建临时 asar 失败: %w", err)
	}
	tempAsarPath := tempAsarFile.Name()
	_ = tempAsarFile.Close()
	defer os.Remove(tempAsarPath)

	if err := asar.Pack(tempExtractDir, tempAsarPath); err != nil {
		return fmt.Errorf("重新封装 app.asar 失败: %w", err)
	}
	logFn("[OK] app.asar 封装完成。")

	// 6. Overwrite target app.asar
	logFn("[*] 正在部署汉化版文件...")
	if err := copyFile(tempAsarPath, asarPath); err != nil {
		return fmt.Errorf("覆盖写入 app.asar 失败: %w", err)
	}
	logFn("[OK] 汉化补丁写入成功！")

	return nil
}

// RestoreOriginal restores the original app.asar from backup
func RestoreOriginal(asarPath string, logFn func(string), opts *PatchOptions) error {
	if logFn == nil {
		logFn = func(string) {}
	}

	backupPath := GetBackupPath(asarPath)
	if fi, err := os.Stat(backupPath); err != nil || fi.IsDir() {
		return fmt.Errorf("未找到备份文件：%s\n无法进行还原。", backupPath)
	}

	if isLocalizedAsar(backupPath) {
		return fmt.Errorf("检测到备份文件 %s 本身包含汉化代码，无法直接还原！", backupPath)
	}

	if err := ensureProcessClosed(logFn, opts); err != nil {
		return err
	}

	logFn("[*] 正在从安全备份还原原始官方 app.asar...")
	if err := copyFile(backupPath, asarPath); err != nil {
		return fmt.Errorf("还原文件失败: %w", err)
	}

	logFn("[OK] 还原成功！已恢复为官方英文原版。")
	return nil
}

// LaunchAntigravity starts the Antigravity application
func LaunchAntigravity(asarPath string) error {
	exePath := GetExecutablePath(asarPath)
	if fi, err := os.Stat(exePath); err != nil || fi.IsDir() {
		return fmt.Errorf("未找到 Antigravity 可执行文件：%s", exePath)
	}

	cmd := exec.Command(exePath)
	cmd.Dir = filepath.Dir(exePath)
	return cmd.Start()
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	if _, err = io.Copy(out, in); err != nil {
		return err
	}
	return out.Sync()
}

// loadLocalesDict loads i18n dictionary from either a modular directory or a single standalone file
func loadLocalesDict(patchesFS fs.FS, logFn func(string)) ([]byte, int, int, error) {
	for _, dir := range []string{"locales/zh-CN", "patches/locales/zh-CN"} {
		entries, err := fs.ReadDir(patchesFS, dir)
		if err == nil && len(entries) > 0 {
			mergedMap := make(map[string]string)
			fileCount := 0
			for _, entry := range entries {
				if entry.IsDir() || !strings.HasSuffix(strings.ToLower(entry.Name()), ".json") {
					continue
				}
				filePath := path.Join(dir, entry.Name())
				fileData, readErr := fs.ReadFile(patchesFS, filePath)
				if readErr != nil {
					logFn(fmt.Sprintf("    [!] 读取词典模块 %s 失败: %v", entry.Name(), readErr))
					continue
				}
				var fileMap map[string]string
				if unmarshalErr := json.Unmarshal(fileData, &fileMap); unmarshalErr != nil {
					logFn(fmt.Sprintf("    [!] 词典模块 %s JSON 格式有误: %v", entry.Name(), unmarshalErr))
					continue
				}
				for k, v := range fileMap {
					mergedMap[k] = v
				}
				fileCount++
			}
			if fileCount > 0 {
				dictJSON, marshalErr := json.Marshal(mergedMap)
				if marshalErr != nil {
					return nil, 0, 0, marshalErr
				}
				return dictJSON, len(mergedMap), fileCount, nil
			}
		}
	}

	for _, file := range []string{"locales/zh-CN.json", "patches/locales/zh-CN.json"} {
		if data, err := fs.ReadFile(patchesFS, file); err == nil {
			var singleMap map[string]string
			if unmarshalErr := json.Unmarshal(data, &singleMap); unmarshalErr != nil {
				return nil, 0, 0, fmt.Errorf("%s JSON 格式有误: %w", file, unmarshalErr)
			}
			return data, len(singleMap), 1, nil
		}
	}

	return nil, 0, 0, fmt.Errorf("未找到 locales/zh-CN/ 目录或 locales/zh-CN.json 词典文件")
}

// getMergedPreloadData bundles the locales dictionary into preload.js at patch time
func getMergedPreloadData(patchesFS fs.FS, preloadData []byte, logFn func(string)) []byte {
	dictData, totalKeys, fileCount, err := loadLocalesDict(patchesFS, logFn)
	if err != nil {
		logFn(fmt.Sprintf("    [!] 词典装配跳过: %v，将保持 preload.js 原样", err))
		return preloadData
	}

	placeholder := "/*__I18N_DICT_PLACEHOLDER__*/{}"
	merged := strings.Replace(string(preloadData), placeholder, string(dictData), 1)
	if merged == string(preloadData) {
		logFn("    [!] preload.js 中未找到 /*__I18N_DICT_PLACEHOLDER__*/{} 占位符")
	} else if fileCount > 1 {
		logFn(fmt.Sprintf("    [+] 已成功从 zh-CN/ 模块化词典 (%d 个模块文件，%d 条词条) 动态装配至 preload.js", fileCount, totalKeys))
	} else {
		logFn(fmt.Sprintf("    [+] 已成功将 zh-CN 词典 (%d 条词条) 动态装配至 preload.js", totalKeys))
	}
	return []byte(merged)
}
