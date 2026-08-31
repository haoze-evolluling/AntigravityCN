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
// If visitor returns false, iteration stops early.
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

// CloseAntigravityProcess closes running Antigravity processes in a single snapshot traversal
func CloseAntigravityProcess() error {
	return enumProcesses(func(pid uint32, name string) bool {
		if strings.EqualFold(name, "antigravity.exe") {
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

	// Backup original app.asar
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

	// Extract app.asar to temporary directory
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

	// Inject patch files into extracted directory
	logFn("[*] 正在注入简体中文汉化补丁...")
	appliedCount := 0
	err = fs.WalkDir(patchesFS, ".", func(p string, d fs.DirEntry, walkErr error) error {
		if walkErr != nil || d.IsDir() {
			return walkErr
		}

		rel := strings.TrimPrefix(filepath.ToSlash(p), "patches/")
		rel = strings.TrimPrefix(rel, "./")
		if rel == "" || rel == "." || strings.HasPrefix(rel, "locales/") || rel == "locales" {
			return nil
		}

		patchData, err := fs.ReadFile(patchesFS, p)
		if err != nil {
			logFn(fmt.Sprintf("    [!] 读取补丁文件失败，跳过: %s (%v)", rel, err))
			return nil
		}

		if filepath.Base(rel) == "preload.js" {
			patchData = getMergedPreloadData(patchesFS, patchData, logFn)
		}

		dstRel := filepath.Join("dist", filepath.FromSlash(rel))
		targetFile := filepath.Join(tempExtractDir, dstRel)
		if err := os.MkdirAll(filepath.Dir(targetFile), 0755); err != nil {
			return fmt.Errorf("创建目标目录失败 %s: %w", targetFile, err)
		}

		if err := os.WriteFile(targetFile, patchData, 0644); err != nil {
			return fmt.Errorf("写入补丁文件失败 %s: %w", dstRel, err)
		}
		logFn(fmt.Sprintf("    [+] 已应用补丁: %s", filepath.ToSlash(dstRel)))
		appliedCount++
		return nil
	})
	if err != nil {
		return fmt.Errorf("遍历并应用补丁文件失败: %w", err)
	}
	if appliedCount == 0 {
		return fmt.Errorf("未成功应用任何补丁，请检查补丁文件")
	}

	// Repack ASAR
	logFn("[*] 正在重新封装 app.asar...")
	tempAsarFile, err := os.CreateTemp("", "app_cn_*.asar")
	if err != nil {
		return fmt.Errorf("创建临时 asar 文件失败: %w", err)
	}
	tempAsarPath := tempAsarFile.Name()
	_ = tempAsarFile.Close()
	defer os.Remove(tempAsarPath)

	if err := asar.Pack(tempExtractDir, tempAsarPath); err != nil {
		return fmt.Errorf("重新封装 app.asar 失败: %w", err)
	}
	logFn("[OK] app.asar 封装完成。")

	// Overwrite target app.asar
	logFn("[*] 正在写入汉化版文件...")
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

	if err := ensureProcessClosed(logFn, opts); err != nil {
		return err
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


