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
	path := patcher.FindAppAsar()
	status := patcher.CheckStatus(path)
	return AppState{
		AsarPath:     path,
		AsarExists:   status.AsarExists,
		BackupExists: status.BackupExists,
		IsRunning:    status.IsRunning,
	}
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

// ApplyPatch applies Chinese localization patch
func (a *App) ApplyPatch(asarPath string, autoClose bool) ActionResult {
	opts := &patcher.PatchOptions{
		AutoCloseProcess: autoClose,
	}

	logFn := func(msg string) {
		wailsRuntime.EventsEmit(a.ctx, "log", msg)
	}

	logFn("================================================")
	logFn("开始执行【一键安装简体中文汉化】...")

	err := patcher.ApplyPatch(asarPath, a.patchesFS, logFn, opts)
	if err != nil {
		logFn(fmt.Sprintf("[错误] 汉化失败: %v", err))
		return ActionResult{
			Success: false,
			Message: err.Error(),
		}
	}

	logFn("================================================")
	logFn("🎉 汉化完成！您可以点击【启动 Antigravity】立即体验。")
	return ActionResult{
		Success: true,
		Message: "汉化补丁应用成功！",
	}
}

// RestoreOriginal restores original app.asar from backup
func (a *App) RestoreOriginal(asarPath string, autoClose bool) ActionResult {
	opts := &patcher.PatchOptions{
		AutoCloseProcess: autoClose,
	}

	logFn := func(msg string) {
		wailsRuntime.EventsEmit(a.ctx, "log", msg)
	}

	logFn("================================================")
	logFn("开始执行【还原官方英文原版】...")

	err := patcher.RestoreOriginal(asarPath, logFn, opts)
	if err != nil {
		logFn(fmt.Sprintf("[错误] 还原失败: %v", err))
		return ActionResult{
			Success: false,
			Message: err.Error(),
		}
	}

	logFn("================================================")
	logFn("✅ 还原成功！已恢复为官方英文原版。")
	return ActionResult{
		Success: true,
		Message: "已成功还原官方英文原版！",
	}
}

// LaunchAntigravity launches the main Antigravity executable
func (a *App) LaunchAntigravity(asarPath string) ActionResult {
	logFn := func(msg string) {
		wailsRuntime.EventsEmit(a.ctx, "log", msg)
	}

	logFn("[*] 正在启动 Antigravity...")
	err := patcher.LaunchAntigravity(asarPath)
	if err != nil {
		logFn(fmt.Sprintf("[错误] 启动失败: %v", err))
		return ActionResult{
			Success: false,
			Message: err.Error(),
		}
	}

	logFn("[OK] Antigravity 启动命令已发送。")
	return ActionResult{
		Success: true,
		Message: "Antigravity 启动成功！",
	}
}
