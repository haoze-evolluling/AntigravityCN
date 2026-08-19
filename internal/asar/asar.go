package asar

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

const (
	BlockSize = 4 * 1024 * 1024 // 4MB default block size for Electron integrity
)

// IntegrityInfo holds SHA-256 integrity block hashes for Electron ASAR
type IntegrityInfo struct {
	Algorithm string   `json:"algorithm"`
	Hash      string   `json:"hash"`
	BlockSize int      `json:"blockSize"`
	Blocks    []string `json:"blocks"`
}

// Entry represents a file or directory inside ASAR JSON header
type Entry struct {
	Size       int64             `json:"size,omitempty"`
	Offset     string            `json:"offset,omitempty"`
	Executable bool              `json:"executable,omitempty"`
	Unpacked   bool              `json:"unpacked,omitempty"`
	Integrity  *IntegrityInfo    `json:"integrity,omitempty"`
	Files      map[string]*Entry `json:"files,omitempty"`
}

// Header is the top-level structure of ASAR JSON header
type Header struct {
	Files map[string]*Entry `json:"files"`
}

// CalculateIntegrity computes standard Electron integrity info for a byte slice
func CalculateIntegrity(data []byte) *IntegrityInfo {
	totalHash := sha256.Sum256(data)
	var blocks []string

	if len(data) == 0 {
		blocks = append(blocks, hex.EncodeToString(totalHash[:]))
	} else {
		for i := 0; i < len(data); i += BlockSize {
			end := i + BlockSize
			if end > len(data) {
				end = len(data)
			}
			blockHash := sha256.Sum256(data[i:end])
			blocks = append(blocks, hex.EncodeToString(blockHash[:]))
		}
	}

	return &IntegrityInfo{
		Algorithm: "SHA256",
		Hash:      hex.EncodeToString(totalHash[:]),
		BlockSize: BlockSize,
		Blocks:    blocks,
	}
}

// ReadHeader parses the JSON header from an ASAR file
func ReadHeader(asarPath string) (*Header, uint32, error) {
	f, err := os.Open(asarPath)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to open asar file: %w", err)
	}
	defer f.Close()

	var prefix [16]byte
	if _, err := io.ReadFull(f, prefix[:]); err != nil {
		return nil, 0, fmt.Errorf("failed to read asar prefix: %w", err)
	}

	magic := binary.LittleEndian.Uint32(prefix[0:4])
	headerSize := binary.LittleEndian.Uint32(prefix[4:8])
	headerPayloadSize := binary.LittleEndian.Uint32(prefix[8:12])
	jsonLength := binary.LittleEndian.Uint32(prefix[12:16])

	if magic != 4 {
		return nil, 0, fmt.Errorf("invalid asar format: magic is %d (expected 4)", magic)
	}
	if headerSize < jsonLength+8 || headerPayloadSize < jsonLength+4 {
		return nil, 0, fmt.Errorf("corrupt asar header size: headerSize=%d, jsonLength=%d", headerSize, jsonLength)
	}

	jsonBytes := make([]byte, jsonLength)
	if _, err := io.ReadFull(f, jsonBytes); err != nil {
		return nil, 0, fmt.Errorf("failed to read asar json header: %w", err)
	}

	var header Header
	if err := json.Unmarshal(jsonBytes, &header); err != nil {
		return nil, 0, fmt.Errorf("failed to unmarshal asar json: %w", err)
	}

	// Payload data offset from start of file is 8 + headerSize
	payloadOffset := 8 + headerSize
	return &header, payloadOffset, nil
}

// Extract extracts all files from an ASAR archive into the specified destination directory
func Extract(asarPath, destDir string) error {
	header, payloadOffset, err := ReadHeader(asarPath)
	if err != nil {
		return err
	}

	f, err := os.Open(asarPath)
	if err != nil {
		return err
	}
	defer f.Close()

	var extractEntry func(currentPath string, entry *Entry) error
	extractEntry = func(currentPath string, entry *Entry) error {
		if entry.Files != nil {
			// Directory
			if err := os.MkdirAll(currentPath, 0755); err != nil {
				return err
			}
			for name, child := range entry.Files {
				childPath := filepath.Join(currentPath, name)
				if err := extractEntry(childPath, child); err != nil {
					return err
				}
			}
			return nil
		}

		// File
		offset, err := strconv.ParseInt(entry.Offset, 10, 64)
		if err != nil {
			return fmt.Errorf("invalid file offset %q for %s: %w", entry.Offset, currentPath, err)
		}

		if err := os.MkdirAll(filepath.Dir(currentPath), 0755); err != nil {
			return err
		}

		out, err := os.Create(currentPath)
		if err != nil {
			return err
		}
		defer out.Close()

		absOffset := int64(payloadOffset) + offset
		if _, err := f.Seek(absOffset, io.SeekStart); err != nil {
			return fmt.Errorf("seek failed for %s: %w", currentPath, err)
		}

		if _, err := io.CopyN(out, f, entry.Size); err != nil {
			return fmt.Errorf("copy failed for %s: %w", currentPath, err)
		}

		return nil
	}

	if err := os.MkdirAll(destDir, 0755); err != nil {
		return err
	}

	for name, entry := range header.Files {
		targetPath := filepath.Join(destDir, name)
		if err := extractEntry(targetPath, entry); err != nil {
			return err
		}
	}

	return nil
}

type fileInfo struct {
	relPath  string // Forward-slash normalized path relative to root
	fullPath string
	size     int64
	data     []byte // If loaded in memory or nil if streaming
}

// Pack packs a source directory into an ASAR file
func Pack(srcDir, asarPath string) error {
	var files []fileInfo

	err := filepath.WalkDir(srcDir, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}

		rel, err := filepath.Rel(srcDir, p)
		if err != nil {
			return err
		}
		relNorm := filepath.ToSlash(rel)

		info, err := d.Info()
		if err != nil {
			return err
		}

		files = append(files, fileInfo{
			relPath:  relNorm,
			fullPath: p,
			size:     info.Size(),
		})
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to walk source directory: %w", err)
	}

	// Sort files deterministically
	sort.Slice(files, func(i, j int) bool {
		return files[i].relPath < files[j].relPath
	})

	root := &Entry{
		Files: make(map[string]*Entry),
	}

	var currentOffset int64 = 0

	for _, fi := range files {
		data, err := os.ReadFile(fi.fullPath)
		if err != nil {
			return fmt.Errorf("failed to read %s: %w", fi.fullPath, err)
		}

		integrity := CalculateIntegrity(data)

		parts := strings.Split(fi.relPath, "/")
		curr := root
		for i, part := range parts {
			if i == len(parts)-1 {
				// Leaf file
				curr.Files[part] = &Entry{
					Size:      int64(len(data)),
					Offset:    strconv.FormatInt(currentOffset, 10),
					Integrity: integrity,
				}
				currentOffset += int64(len(data))
			} else {
				// Intermediate directory
				if curr.Files[part] == nil {
					curr.Files[part] = &Entry{
						Files: make(map[string]*Entry),
					}
				}
				curr = curr.Files[part]
			}
		}
	}

	jsonBytes, err := json.Marshal(root)
	if err != nil {
		return fmt.Errorf("failed to marshal asar json header: %w", err)
	}

	jsonLength := uint32(len(jsonBytes))
	alignedJsonLength := (jsonLength + 3) & ^uint32(3) // 4-byte align
	headerPayloadSize := alignedJsonLength + 4
	headerSize := headerPayloadSize + 4

	padding := make([]byte, alignedJsonLength-jsonLength)

	// Create destination directory if needed
	if err := os.MkdirAll(filepath.Dir(asarPath), 0755); err != nil {
		return err
	}

	out, err := os.Create(asarPath)
	if err != nil {
		return fmt.Errorf("failed to create target asar file: %w", err)
	}
	defer out.Close()

	// Write 16-byte header
	var prefix [16]byte
	binary.LittleEndian.PutUint32(prefix[0:4], 4)
	binary.LittleEndian.PutUint32(prefix[4:8], headerSize)
	binary.LittleEndian.PutUint32(prefix[8:12], headerPayloadSize)
	binary.LittleEndian.PutUint32(prefix[12:16], jsonLength)

	if _, err := out.Write(prefix[:]); err != nil {
		return err
	}
	if _, err := out.Write(jsonBytes); err != nil {
		return err
	}
	if len(padding) > 0 {
		if _, err := out.Write(padding); err != nil {
			return err
		}
	}

	// Write all file payloads in order
	for _, fi := range files {
		f, err := os.Open(fi.fullPath)
		if err != nil {
			return fmt.Errorf("failed to read payload file %s: %w", fi.fullPath, err)
		}
		if _, err := io.Copy(out, f); err != nil {
			f.Close()
			return fmt.Errorf("failed to write payload for %s: %w", fi.fullPath, err)
		}
		f.Close()
	}

	return nil
}
