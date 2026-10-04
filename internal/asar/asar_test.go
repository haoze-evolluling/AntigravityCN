package asar

import (
	"os"
	"path/filepath"
	"testing"
)

func TestAsarUnpackedHandling(t *testing.T) {
	tempSrc, err := os.MkdirTemp("", "asar_unpacked_src_*")
	if err != nil {
		t.Fatalf("Failed to create temp src dir: %v", err)
	}
	defer os.RemoveAll(tempSrc)

	// Create a regular file and a file in chrome-devtools-mcp
	normalFile := filepath.Join(tempSrc, "dist", "main.js")
	unpackedFile := filepath.Join(tempSrc, "node_modules", "chrome-devtools-mcp", "index.js")

	_ = os.MkdirAll(filepath.Dir(normalFile), 0755)
	_ = os.MkdirAll(filepath.Dir(unpackedFile), 0755)

	_ = os.WriteFile(normalFile, []byte("console.log('normal');"), 0644)
	_ = os.WriteFile(unpackedFile, []byte("console.log('unpacked mcp module');"), 0644)

	tempAsar := filepath.Join(os.TempDir(), "test_unpacked.asar")
	defer os.Remove(tempAsar)

	if err := Pack(tempSrc, tempAsar); err != nil {
		t.Fatalf("Pack failed: %v", err)
	}

	header, _, err := ReadHeader(tempAsar)
	if err != nil {
		t.Fatalf("ReadHeader failed: %v", err)
	}

	// Verify header metadata
	distEntry := header.Files["dist"].Files["main.js"]
	if distEntry.Unpacked {
		t.Errorf("Expected normal file to not be unpacked")
	}
	if distEntry.Offset == "" {
		t.Errorf("Expected normal file to have an offset")
	}

	mcpEntry := header.Files["node_modules"].Files["chrome-devtools-mcp"].Files["index.js"]
	if !mcpEntry.Unpacked {
		t.Errorf("Expected chrome-devtools-mcp file to be marked as unpacked")
	}
	if mcpEntry.Offset != "" {
		t.Errorf("Expected unpacked file to have empty offset, got %q", mcpEntry.Offset)
	}
}
