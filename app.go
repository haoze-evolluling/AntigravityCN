package main

import (
	"context"
	"fmt"
	"io/fs"

	"antigravity-cn/internal/patcher"
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// AppState represents the status sent to frontend
type AppState struct {
	AsarPath     string `json:"asarPath"`
	AsarExists   bool   `json:"asarExists"`
	BackupExists bool   `json:"backupExists"`
	IsRunning    bool   `json:"isRunning"`
}

// ActionResult represents response of an operation
type ActionResult struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// App struct
type App struct {
	ctx       context.Context
	patchesFS fs.FS
}

// NewApp creates a new App application struct
func NewApp(patchesFS fs.FS) *App {
	return &App{
		patchesFS: patchesFS,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// GetInitialState returns the default state upon startup
func (a *App) GetInitialState() AppState {
	return a.RefreshStatus(patcher.FindAppAsar())
}

// SelectAsarFile opens native file picker
func (a *App) SelectAsarFile() string {
	selection, err := wailsRuntime.OpenFileDialog(a.ctx, wailsRuntime.OpenDialogOptions{
		Title: "选择 Antigravity 的 app.asar 文件",
		Filters: []wailsRuntime.FileFilter{
			{DisplayName: "Electron Asar Archive (*.asar)", Pattern: "*.asar"},
			{DisplayName: "所有文件 (*.*)", Pattern: "*.*"},
		},
	})
	if err != nil || selection == "" {
		return ""
	}
	return selection
}

// RefreshStatus inspects specified path and returns fresh status
func (a *App) RefreshStatus(asarPath string) AppState {
	status := patcher.CheckStatus(asarPath)
	return AppState{
		AsarPath:     asarPath,
		AsarExists:   status.AsarExists,
		BackupExists: status.BackupExists,
		IsRunning:    status.IsRunning,
	}
}

func (a *App) emitLog(msg string) {
	wailsRuntime.EventsEmit(a.ctx, "log", msg)
}

// ApplyPatch applies Chinese localization patch
func (a *App) ApplyPatch(asarPath string, autoClose bool) ActionResult {
	a.emitLog("================================================")
	a.emitLog("开始安装汉化...")

	err := patcher.ApplyPatch(asarPath, a.patchesFS, a.emitLog, &patcher.PatchOptions{AutoCloseProcess: autoClose})
	if err != nil {
		a.emitLog(fmt.Sprintf("[错误] 汉化失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("================================================")
	a.emitLog("汉化完成，可启动 Antigravity 查看效果。")
	return ActionResult{Success: true, Message: "汉化完成"}
}

// RestoreOriginal restores original app.asar from backup
func (a *App) RestoreOriginal(asarPath string, autoClose bool) ActionResult {
	a.emitLog("================================================")
	a.emitLog("开始还原英文原版...")

	err := patcher.RestoreOriginal(asarPath, a.emitLog, &patcher.PatchOptions{AutoCloseProcess: autoClose})
	if err != nil {
		a.emitLog(fmt.Sprintf("[错误] 还原失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("================================================")
	a.emitLog("已恢复为英文原版。")
	return ActionResult{Success: true, Message: "已还原为英文原版"}
}

// CleanAppCache clears temporary rendering and bytecode caches
func (a *App) CleanAppCache() ActionResult {
	a.emitLog("================================================")
	a.emitLog("开始清理应用缓存...")

	count, err := patcher.CleanAppCache(a.emitLog)
	if err != nil {
		a.emitLog(fmt.Sprintf("[错误] 清理缓存失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("================================================")
	a.emitLog(fmt.Sprintf("缓存清理完成，共清理 %d 处目录（不影响配置和账号）。", count))
	return ActionResult{Success: true, Message: fmt.Sprintf("已清理 %d 处缓存目录", count)}
}

// LaunchAntigravity launches the main Antigravity executable
func (a *App) LaunchAntigravity(asarPath string) ActionResult {
	a.emitLog("[*] 正在启动 Antigravity...")
	if err := patcher.LaunchAntigravity(asarPath); err != nil {
		a.emitLog(fmt.Sprintf("[错误] 启动失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("[OK] Antigravity 已启动。")
	return ActionResult{Success: true, Message: "启动成功"}
}

// OpenURL opens the specified URL in the user's default browser
func (a *App) OpenURL(url string) bool {
	if a.ctx != nil {
		wailsRuntime.BrowserOpenURL(a.ctx, url)
		return true
	}
	return false
}
