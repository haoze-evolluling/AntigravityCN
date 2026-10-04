package patcher

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"antigravity-cn/internal/asar"
)

func TestLoadLocalesDictWithChineseFilenames(t *testing.T) {
	patchesDir, err := filepath.Abs("../../patches")
	if err != nil {
		t.Fatalf("Failed to get abs path for patches: %v", err)
	}

	patchesFS := os.DirFS(patchesDir)
	var logs []string
	logFn := func(msg string) {
		logs = append(logs, msg)
	}

	dictData, totalKeys, fileCount, err := loadLocalesDict(patchesFS, logFn)
	if err != nil {
		t.Fatalf("loadLocalesDict failed: %v", err)
	}

	if fileCount != 4 {
		t.Errorf("Expected 4 locale module files, got %d", fileCount)
	}

	if totalKeys < 1500 {
		t.Errorf("Expected >= 1500 keys after expansion, got %d", totalKeys)
	}

	var parsed map[string]string
	if err := json.Unmarshal(dictData, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal merged dictionary: %v", err)
	}

	if len(parsed) != totalKeys {
		t.Errorf("Mismatch in parsed keys: %d vs %d", len(parsed), totalKeys)
	}

	sampleKeys := map[string]string{
		"Save":               "保存",
		"Skills & Workflows": "技能与工作流",
		"MCP Servers":        "MCP 服务器",
		"Appearance":         "外观",
		"Connect to WSL":     "连接到 WSL",
		"Reopen Locally":     "本地重新打开",
		"Plan Review":        "计划审核",
	}

	for k, expectedVal := range sampleKeys {
		actualVal, exists := parsed[k]
		if !exists {
			t.Errorf("Expected key %q to exist in merged dictionary", k)
		} else if actualVal != expectedVal {
			t.Errorf("Key %q: expected value %q, got %q", k, expectedVal, actualVal)
		}
	}
}

func TestGetMergedPreloadData(t *testing.T) {
	patchesDir, err := filepath.Abs("../../patches")
	if err != nil {
		t.Fatalf("Failed to get abs path for patches: %v", err)
	}

	patchesFS := os.DirFS(patchesDir)
	rawPreload, err := os.ReadFile(filepath.Join(patchesDir, "preload.js"))
	if err != nil {
		t.Fatalf("Failed to read preload.js: %v", err)
	}

	var logs []string
	logFn := func(msg string) {
		logs = append(logs, msg)
	}

	merged := getMergedPreloadData(patchesFS, rawPreload, logFn)
	mergedStr := string(merged)

	if strings.Contains(mergedStr, "/*__I18N_DICT_PLACEHOLDER__*/{}") {
		t.Errorf("Placeholder was not replaced in preload.js")
	}

	if !strings.Contains(mergedStr, "连接到 WSL") {
		t.Errorf("Merged preload.js does not contain expected Chinese translation")
	}
}

func TestApplySurgicalPatches(t *testing.T) {
	tempExtract, err := os.MkdirTemp("", "surgical_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempExtract)

	distDir := filepath.Join(tempExtract, "dist")
	_ = os.MkdirAll(distDir, 0755)

	// Mock dist/menu.js
	menuPath := filepath.Join(distDir, "menu.js")
	origMenuContent := `
const submenuItem = appMenu.items.find((item) => item.label === submenuLabel);
electron_1.Menu.setApplicationMenu(menu);
`
	_ = os.WriteFile(menuPath, []byte(origMenuContent), 0644)

	// Mock dist/preload.js
	preloadPath := filepath.Join(distDir, "preload.js")
	origPreloadContent := `
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('wsl', {});
`
	_ = os.WriteFile(preloadPath, []byte(origPreloadContent), 0644)

	mergedMock := []byte("const I18N_DICT = {'File':'文件'};\nconsole.log('inject');")
	count, err := applySurgicalPatches(tempExtract, mergedMock, func(string) {})
	if err != nil {
		t.Fatalf("applySurgicalPatches failed: %v", err)
	}

	if count < 2 {
		t.Errorf("Expected at least 2 files patched, got %d", count)
	}

	// Verify menu.js
	menuPatched, _ := os.ReadFile(menuPath)
	if !strings.Contains(string(menuPatched), "translateMenu") {
		t.Errorf("menu.js missing translateMenu")
	}

	// Verify preload.js
	preloadPatched, _ := os.ReadFile(preloadPath)
	if !strings.Contains(string(preloadPatched), "const I18N_DICT =") {
		t.Errorf("preload.js missing injection")
	}
}

func TestCleanAppCache(t *testing.T) {
	// Should run safely without error
	_, err := CleanAppCache(func(string) {})
	if err != nil {
		t.Errorf("CleanAppCache returned error: %v", err)
	}
}

func TestAsarPackAndExtractRoundtrip(t *testing.T) {
	tempSrc, err := os.MkdirTemp("", "asar_test_src_*")
	if err != nil {
		t.Fatalf("Failed to create temp src dir: %v", err)
	}
	defer os.RemoveAll(tempSrc)

	// Populate test source files
	testFiles := map[string]string{
		"index.js":                  "console.log('hello asar');",
		"package.json":              `{"name": "test-asar", "version": "1.0.0"}`,
		"sub/nested/file.txt":       "nested content text",
		"sub/deep/empty.txt":        "",
		"sub/deep/chinese_中文.txt": "测试中文字符与内容写入",
	}

	for relPath, content := range testFiles {
		fullPath := filepath.Join(tempSrc, relPath)
		if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
			t.Fatalf("Failed to create dir for %s: %v", relPath, err)
		}
		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			t.Fatalf("Failed to write file %s: %v", relPath, err)
		}
	}

	tempAsar := filepath.Join(os.TempDir(), "test_roundtrip.asar")
	defer os.Remove(tempAsar)

	if err := asar.Pack(tempSrc, tempAsar); err != nil {
		t.Fatalf("asar.Pack failed: %v", err)
	}

	tempDst, err := os.MkdirTemp("", "asar_test_dst_*")
	if err != nil {
		t.Fatalf("Failed to create temp dst dir: %v", err)
	}
	defer os.RemoveAll(tempDst)

	if err := asar.Extract(tempAsar, tempDst); err != nil {
		t.Fatalf("asar.Extract failed: %v", err)
	}

	for relPath, expectedContent := range testFiles {
		extractedPath := filepath.Join(tempDst, relPath)
		data, err := os.ReadFile(extractedPath)
		if err != nil {
			t.Errorf("Failed to read extracted file %s: %v", relPath, err)
			continue
		}
		if string(data) != expectedContent {
			t.Errorf("Content mismatch in %s: expected %q, got %q", relPath, expectedContent, string(data))
		}
	}
}
