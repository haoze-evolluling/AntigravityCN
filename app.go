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
	a.emitLog("开始执行【一键安装简体中文汉化】...")

	err := patcher.ApplyPatch(asarPath, a.patchesFS, a.emitLog, &patcher.PatchOptions{AutoCloseProcess: autoClose})
	if err != nil {
		a.emitLog(fmt.Sprintf("[错误] 汉化失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("================================================")
	a.emitLog("🎉 汉化完成！您可以点击【启动 Antigravity】立即体验。")
	return ActionResult{Success: true, Message: "汉化补丁应用成功！"}
}

// RestoreOriginal restores original app.asar from backup
func (a *App) RestoreOriginal(asarPath string, autoClose bool) ActionResult {
	a.emitLog("================================================")
	a.emitLog("开始执行【还原官方英文原版】...")

	err := patcher.RestoreOriginal(asarPath, a.emitLog, &patcher.PatchOptions{AutoCloseProcess: autoClose})
	if err != nil {
		a.emitLog(fmt.Sprintf("[错误] 还原失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("================================================")
	a.emitLog("✅ 还原成功！已恢复为官方英文原版。")
	return ActionResult{Success: true, Message: "已成功还原官方英文原版！"}
}

// LaunchAntigravity launches the main Antigravity executable
func (a *App) LaunchAntigravity(asarPath string) ActionResult {
	a.emitLog("[*] 正在启动 Antigravity...")
	if err := patcher.LaunchAntigravity(asarPath); err != nil {
		a.emitLog(fmt.Sprintf("[错误] 启动失败: %v", err))
		return ActionResult{Success: false, Message: err.Error()}
	}

	a.emitLog("[OK] Antigravity 启动命令已发送。")
	return ActionResult{Success: true, Message: "Antigravity 启动成功！"}
}

// OpenURL opens the specified URL in the user's default browser
func (a *App) OpenURL(url string) bool {
	if a.ctx != nil {
		wailsRuntime.BrowserOpenURL(a.ctx, url)
		return true
	}
	return false
}
