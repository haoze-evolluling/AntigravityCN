package patcher

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
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

	if fileCount != 9 {
		t.Errorf("Expected 9 locale module files, got %d", fileCount)
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
