package asar

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestPackAndExtract(t *testing.T) {
	tmpDir := t.TempDir()

	// 1. Create a mock source directory with files & subdirectories
	srcDir := filepath.Join(tmpDir, "src")
	if err := os.MkdirAll(filepath.Join(srcDir, "subdir"), 0755); err != nil {
		t.Fatal(err)
	}

	file1 := filepath.Join(srcDir, "hello.txt")
	file2 := filepath.Join(srcDir, "subdir", "world.js")

	data1 := []byte("Hello, World!")
	data2 := []byte("console.log('AntigravityCN');")

	if err := os.WriteFile(file1, data1, 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(file2, data2, 0644); err != nil {
		t.Fatal(err)
	}

	// 2. Pack to ASAR
	asarPath := filepath.Join(tmpDir, "test.asar")
	if err := Pack(srcDir, asarPath); err != nil {
		t.Fatalf("Pack failed: %v", err)
	}

	// 3. Extract to another directory
	destDir := filepath.Join(tmpDir, "extracted")
	if err := Extract(asarPath, destDir); err != nil {
		t.Fatalf("Extract failed: %v", err)
	}

	// 4. Verify extracted contents match original
	read1, err := os.ReadFile(filepath.Join(destDir, "hello.txt"))
	if err != nil {
		t.Fatalf("Failed to read extracted hello.txt: %v", err)
	}
	if !bytes.Equal(read1, data1) {
		t.Fatalf("Data mismatch in hello.txt: got %q, want %q", string(read1), string(data1))
	}

	read2, err := os.ReadFile(filepath.Join(destDir, "subdir", "world.js"))
	if err != nil {
		t.Fatalf("Failed to read extracted world.js: %v", err)
	}
	if !bytes.Equal(read2, data2) {
		t.Fatalf("Data mismatch in world.js: got %q, want %q", string(read2), string(data2))
	}
}
