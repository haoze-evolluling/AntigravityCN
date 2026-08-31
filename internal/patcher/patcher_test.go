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

	if totalKeys < 900 {
		t.Errorf("Expected >= 900 keys, got %d", totalKeys)
	}

	var parsed map[string]string
	if err := json.Unmarshal(dictData, &parsed); err != nil {
		t.Fatalf("Failed to unmarshal merged dictionary: %v", err)
	}

	if len(parsed) != totalKeys {
		t.Errorf("Mismatch in parsed keys: %d vs %d", len(parsed), totalKeys)
	}

	sampleKeys := map[string]string{
		"Ask a quick question without interrupting the main conversation.": "快速提问且不打断主对话。",
		"Save":               "保存",
		"Skills & Workflows": "技能与工作流",
		"MCP Servers":        "MCP 服务器",
		"Gemini Models":      "Gemini 模型",
		"Appearance":         "外观",
		"Workspaces":         "工作区列表",
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

	if !strings.Contains(mergedStr, "快速提问且不打断主对话。") {
		t.Errorf("Merged preload.js does not contain expected Chinese translation")
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
