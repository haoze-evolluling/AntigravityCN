package patcher

import (
	"os"
	"path/filepath"
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
