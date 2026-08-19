package patcher

import (
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
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
	programFiles := os.Getenv("ProgramFiles")
	programFilesX86 := os.Getenv("ProgramFiles(x86)")

	candidates := []string{
		filepath.Join(localAppData, "Programs", "antigravity", "resources", "app.asar"),
		filepath.Join(programFiles, "Antigravity", "resources", "app.asar"),
		filepath.Join(programFilesX86, "Antigravity", "resources", "app.asar"),
		filepath.Join(localAppData, "Programs", "Antigravity", "resources", "app.asar"),
	}

	for _, p := range candidates {
		if fi, err := os.Stat(p); err == nil && !fi.IsDir() {
			return p
		}
	}

	// Default fallback path for display
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
	resourcesDir := filepath.Dir(asarPath)
	appDir := filepath.Dir(resourcesDir)

	exe1 := filepath.Join(appDir, "Antigravity.exe")
	if fi, err := os.Stat(exe1); err == nil && !fi.IsDir() {
		return exe1
	}

	exe2 := filepath.Join(appDir, "antigravity.exe")
	if fi, err := os.Stat(exe2); err == nil && !fi.IsDir() {
		return exe2
	}

	return exe1
}

// IsProcessRunning checks if any process matching the given exe name is currently running
func IsProcessRunning(exeName string) (bool, error) {
	snapshot, _, err := procCreateToolhelp32Snapshot.Call(uintptr(TH32CS_SNAPPROCESS), 0)
	if snapshot == uintptr(syscall.InvalidHandle) {
		return false, err
	}
	defer procCloseHandle.Call(snapshot)

	var entry PROCESSENTRY32W
	entry.Size = uint32(unsafe.Sizeof(entry))

	ret, _, _ := procProcess32FirstW.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return false, nil
	}

	exeLower := strings.ToLower(exeName)
	for {
		name := syscall.UTF16ToString(entry.ExeFile[:])
		if strings.ToLower(name) == exeLower {
			return true, nil
		}
		ret, _, _ = procProcess32NextW.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	return false, nil
}

// CloseAntigravityProcess closes running Antigravity processes (only called on explicit user request)
func CloseAntigravityProcess() error {
	for _, name := range []string{"antigravity.exe", "Antigravity.exe"} {
		snapshot, _, err := procCreateToolhelp32Snapshot.Call(uintptr(TH32CS_SNAPPROCESS), 0)
		if snapshot == uintptr(syscall.InvalidHandle) {
			return err
		}

		var entry PROCESSENTRY32W
		entry.Size = uint32(unsafe.Sizeof(entry))

		ret, _, _ := procProcess32FirstW.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
		if ret != 0 {
			exeLower := strings.ToLower(name)
			for {
				pName := syscall.UTF16ToString(entry.ExeFile[:])
				if strings.ToLower(pName) == exeLower {
					hProcess, _, _ := procOpenProcess.Call(uintptr(PROCESS_TERMINATE), 0, uintptr(entry.ProcessID))
					if hProcess != 0 {
						procTerminateProcess.Call(hProcess, 1)
						procCloseHandle.Call(hProcess)
					}
				}
				ret, _, _ = procProcess32NextW.Call(snapshot, uintptr(unsafe.Pointer(&entry)))
				if ret == 0 {
					break
				}
			}
		}
		procCloseHandle.Call(snapshot)
	}
	return nil
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

	backupPath := GetBackupPath(asarPath)
	if fi, err := os.Stat(backupPath); err == nil && !fi.IsDir() {
		status.BackupExists = true
	}

	running, _ := IsProcessRunning("antigravity.exe")
	if !running {
		running, _ = IsProcessRunning("Antigravity.exe")
	}
	status.IsRunning = running

	return status
}

// Options for applying patch
type PatchOptions struct {
	AutoCloseProcess bool
}

// ApplyPatch applies the Chinese localization patch to app.asar
func ApplyPatch(asarPath string, patchesFS fs.FS, logFn func(string), opts *PatchOptions) error {
	if logFn == nil {
		logFn = func(string) {}
	}

	if fi, err := os.Stat(asarPath); err != nil || fi.IsDir() {
		return fmt.Errorf("未找到 app.asar 文件：%s", asarPath)
	}

	// 1. Check if process is running
	running, _ := IsProcessRunning("antigravity.exe")
	if !running {
		running, _ = IsProcessRunning("Antigravity.exe")
	}
	if running {
		if opts != nil && opts.AutoCloseProcess {
			logFn("[*] 检测到 Antigravity 正在运行，正在关闭进程以防文件被占用...")
			_ = CloseAntigravityProcess()
			logFn("[OK] 进程已关闭。")
		} else {
			return fmt.Errorf("检测到 Antigravity 正在运行中！\n请先保存工作并退出 Antigravity，再执行汉化或还原操作（避免文件锁定冲突）。")
		}
	}

	// 2. Backup original app.asar
	backupPath := GetBackupPath(asarPath)
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		logFn("[*] 正在备份原始 app.asar...")
		if err := copyFile(asarPath, backupPath); err != nil {
			return fmt.Errorf("备份 app.asar 失败: %w", err)
		}
		logFn(fmt.Sprintf("[OK] 备份已保存至：%s", backupPath))
	} else {
		logFn("[OK] 已检测到原始备份文件，跳过备份。")
	}

	// 3. Extract app.asar to temporary directory
	tempExtractDir, err := os.MkdirTemp("", "antigravity_cn_ext_*")
	if err != nil {
		return fmt.Errorf("创建临时目录失败: %w", err)
	}
	defer os.RemoveAll(tempExtractDir)

	logFn("[*] 正在解析并解包 app.asar...")
	if err := asar.Extract(asarPath, tempExtractDir); err != nil {
		return fmt.Errorf("解包 app.asar 失败: %w", err)
	}
	logFn("[OK] app.asar 解包完成。")

	// 4. Copy patch files into extracted directory
	logFn("[*] 正在注入简体中文汉化补丁...")

	patchMapping := map[string]string{
		"menu.js":                  "dist/menu.js",
		"updater.js":               "dist/updater.js",
		"tray.js":                  "dist/tray.js",
		"main.js":                  "dist/main.js",
		"ipcHandlers.js":           "dist/ipcHandlers.js",
		"loadingOverlay.js":        "dist/loadingOverlay.js",
		"preload.js":               "dist/preload.js",
		"ideInstall/wizardHtml.js": "dist/ideInstall/wizardHtml.js",
	}

	appliedCount := 0
	for srcRel, dstRel := range patchMapping {
		patchData, err := fs.ReadFile(patchesFS, srcRel)
		if err != nil {
			patchData, err = fs.ReadFile(patchesFS, "patches/"+srcRel)
		}
		if err != nil {
			logFn(fmt.Sprintf("    [!] 补丁文件缺失，跳过: %s", srcRel))
			continue
		}

		targetFile := filepath.Join(tempExtractDir, filepath.FromSlash(dstRel))
		if err := os.MkdirAll(filepath.Dir(targetFile), 0755); err != nil {
			return fmt.Errorf("创建目标目录失败 %s: %w", targetFile, err)
		}

		if err := os.WriteFile(targetFile, patchData, 0644); err != nil {
			return fmt.Errorf("写入补丁文件失败 %s: %w", dstRel, err)
		}
		logFn(fmt.Sprintf("    [+] 已应用补丁: %s", dstRel))
		appliedCount++
	}

	if appliedCount == 0 {
		return fmt.Errorf("未成功应用任何补丁，请检查补丁文件")
	}

	// 5. Repack ASAR
	logFn("[*] 正在重新封装 app.asar...")
	tempAsarFile := filepath.Join(os.TempDir(), fmt.Sprintf("app_cn_%d.asar", os.Getpid()))
	defer os.Remove(tempAsarFile)

	if err := asar.Pack(tempExtractDir, tempAsarFile); err != nil {
		return fmt.Errorf("重新封装 app.asar 失败: %w", err)
	}
	logFn("[OK] app.asar 封装完成。")

	// 6. Overwrite target app.asar
	logFn("[*] 正在写入汉化版文件...")
	if err := copyFile(tempAsarFile, asarPath); err != nil {
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

	// Check process
	running, _ := IsProcessRunning("antigravity.exe")
	if !running {
		running, _ = IsProcessRunning("Antigravity.exe")
	}
	if running {
		if opts != nil && opts.AutoCloseProcess {
			logFn("[*] 检测到 Antigravity 正在运行，正在关闭进程以防文件被占用...")
			_ = CloseAntigravityProcess()
			logFn("[OK] 进程已关闭。")
		} else {
			return fmt.Errorf("检测到 Antigravity 正在运行中！\n请先保存工作并退出 Antigravity，再执行汉化或还原操作（避免文件锁定冲突）。")
		}
	}

	logFn("[*] 正在从备份还原原始 app.asar...")
	if err := copyFile(backupPath, asarPath); err != nil {
		return fmt.Errorf("还原文件失败: %w", err)
	}

	logFn("[OK] 还原成功！已恢复为英文官方原版。")
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
