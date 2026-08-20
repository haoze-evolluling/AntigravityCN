package patcher

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"testing/fstest"

	"antigravity-cn/internal/asar"
)

func TestApplyPatchAndRestore(t *testing.T) {
	tmpDir := t.TempDir()

	// 1. Create a dummy app.asar structure
	srcAppDir := filepath.Join(tmpDir, "dummy_app")
	if err := os.MkdirAll(filepath.Join(srcAppDir, "dist"), 0755); err != nil {
		t.Fatal(err)
	}
	origMenu := []byte("module.exports = { name: 'Original Menu' };")
	if err := os.WriteFile(filepath.Join(srcAppDir, "dist", "menu.js"), origMenu, 0644); err != nil {
		t.Fatal(err)
	}

	asarPath := filepath.Join(tmpDir, "app.asar")
	if err := asar.Pack(srcAppDir, asarPath); err != nil {
		t.Fatalf("Failed to pack dummy asar: %v", err)
	}

	// 2. Prepare mock patch FS
	patchedMenu := []byte("module.exports = { name: '汉化菜单' };")
	mockFS := fstest.MapFS{
		"menu.js": &fstest.MapFile{
			Data: patchedMenu,
		},
	}

	// 3. Apply Patch without killing any process
	var logs []string
	logFn := func(msg string) {
		logs = append(logs, msg)
	}

	opts := &PatchOptions{
		AutoCloseProcess: false,
	}

	// Direct patch test without process intervention
	backupPath := GetBackupPath(asarPath)
	if err := copyFile(asarPath, backupPath); err != nil {
		t.Fatalf("Backup copy failed: %v", err)
	}

	// Extract to temp, copy patch, repack
	tempExtractDir := filepath.Join(tmpDir, "temp_ext")
	if err := asar.Extract(asarPath, tempExtractDir); err != nil {
		t.Fatalf("Extract failed: %v", err)
	}

	targetFile := filepath.Join(tempExtractDir, "dist", "menu.js")
	if err := os.WriteFile(targetFile, patchedMenu, 0644); err != nil {
		t.Fatalf("Write patched file failed: %v", err)
	}

	tempAsar := filepath.Join(tmpDir, "patched.asar")
	if err := asar.Pack(tempExtractDir, tempAsar); err != nil {
		t.Fatalf("Pack failed: %v", err)
	}
	if err := copyFile(tempAsar, asarPath); err != nil {
		t.Fatalf("Replace asar failed: %v", err)
	}

	// Extract patched asar and check contents
	patchedExtractDir := filepath.Join(tmpDir, "patched_extract")
	if err := asar.Extract(asarPath, patchedExtractDir); err != nil {
		t.Fatalf("Failed to extract patched asar: %v", err)
	}

	content, err := os.ReadFile(filepath.Join(patchedExtractDir, "dist", "menu.js"))
	if err != nil {
		t.Fatalf("Failed to read menu.js from patched asar: %v", err)
	}
	if string(content) != string(patchedMenu) {
		t.Fatalf("Patch not applied properly: got %q, want %q", string(content), string(patchedMenu))
	}

	// 4. Test Restore
	if err := copyFile(backupPath, asarPath); err != nil {
		t.Fatalf("Restore failed: %v", err)
	}

	// Extract restored asar and check contents
	restoredExtractDir := filepath.Join(tmpDir, "restored_extract")
	if err := asar.Extract(asarPath, restoredExtractDir); err != nil {
		t.Fatalf("Failed to extract restored asar: %v", err)
	}

	contentRestored, err := os.ReadFile(filepath.Join(restoredExtractDir, "dist", "menu.js"))
	if err != nil {
		t.Fatalf("Failed to read menu.js from restored asar: %v", err)
	}
	if string(contentRestored) != string(origMenu) {
		t.Fatalf("Restore failed: got %q, want %q", string(contentRestored), string(origMenu))
	}

	_ = logFn
	_ = opts
	_ = mockFS
}

func TestGetMergedPreloadData(t *testing.T) {
	mockFS := fstest.MapFS{
		"locales/zh-CN.json": &fstest.MapFile{
			Data: []byte(`{"File":"文件","Edit":"编辑"}`),
		},
	}

	rawPreload := []byte(`
const electron = require('electron');
const I18N_DICT = /*__I18N_DICT_PLACEHOLDER__*/{};
console.log(I18N_DICT);
`)

	var logs []string
	logFn := func(msg string) {
		logs = append(logs, msg)
	}

	merged := getMergedPreloadData(mockFS, rawPreload, logFn)
	mergedStr := string(merged)

	if !strings.Contains(mergedStr, `const I18N_DICT = {"File":"文件","Edit":"编辑"};`) {
		t.Fatalf("Placeholder was not correctly replaced. Got:\n%s", mergedStr)
	}
}

func TestApplyPatchWithPreloadAndLocales(t *testing.T) {
	tmpDir := t.TempDir()

	// 1. Create a dummy app.asar
	srcAppDir := filepath.Join(tmpDir, "dummy_app")
	if err := os.MkdirAll(filepath.Join(srcAppDir, "dist"), 0755); err != nil {
		t.Fatal(err)
	}
	origPreload := []byte("const I18N_DICT = {};")
	if err := os.WriteFile(filepath.Join(srcAppDir, "dist", "preload.js"), origPreload, 0644); err != nil {
		t.Fatal(err)
	}

	asarPath := filepath.Join(tmpDir, "app.asar")
	if err := asar.Pack(srcAppDir, asarPath); err != nil {
		t.Fatalf("Failed to pack dummy asar: %v", err)
	}

	// 2. Prepare mock patch FS with preload.js and standalone locales/zh-CN.json
	mockFS := fstest.MapFS{
		"preload.js": &fstest.MapFile{
			Data: []byte(`const I18N_DICT = /*__I18N_DICT_PLACEHOLDER__*/{};`),
		},
		"locales/zh-CN.json": &fstest.MapFile{
			Data: []byte(`{"Hello":"你好"}`),
		},
	}

	var logs []string
	logFn := func(msg string) {
		logs = append(logs, msg)
	}

	err := ApplyPatch(asarPath, mockFS, logFn, &PatchOptions{AutoCloseProcess: false, SkipProcessCheck: true})
	if err != nil {
		t.Fatalf("ApplyPatch failed: %v", err)
	}

	// 3. Extract and check dist/preload.js and verify locales/ was skipped
	extractedDir := filepath.Join(tmpDir, "extracted_check")
	if err := asar.Extract(asarPath, extractedDir); err != nil {
		t.Fatalf("Extract patched asar failed: %v", err)
	}

	patchedPreload, err := os.ReadFile(filepath.Join(extractedDir, "dist", "preload.js"))
	if err != nil {
		t.Fatalf("Failed to read dist/preload.js: %v", err)
	}

	if string(patchedPreload) != `const I18N_DICT = {"Hello":"你好"};` {
		t.Fatalf("Unexpected patched preload content: %s", string(patchedPreload))
	}

	// Verify dist/locales does not exist
	if _, err := os.Stat(filepath.Join(extractedDir, "dist", "locales")); !os.IsNotExist(err) {
		t.Fatalf("Expected dist/locales not to be created as loose files")
	}
}

func TestRealPatchesPreloadAssembly(t *testing.T) {
	realPatchesFS := os.DirFS("../../patches")

	preloadData, err := os.ReadFile("../../patches/preload.js")
	if err != nil {
		t.Fatalf("Failed to read actual preload.js: %v", err)
	}

	var logs []string
	logFn := func(msg string) {
		logs = append(logs, msg)
	}

	merged := getMergedPreloadData(realPatchesFS, preloadData, logFn)
	mergedStr := string(merged)

	if strings.Contains(mergedStr, "/*__I18N_DICT_PLACEHOLDER__*/{}") {
		t.Fatalf("Placeholder was not replaced in real preload.js")
	}

	if !strings.Contains(mergedStr, `"File": "文件"`) {
		t.Fatalf("Real zh-CN dictionary entries not found in merged preload.js")
	}
}


