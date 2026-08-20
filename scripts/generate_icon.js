const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const svgPath = path.join(rootDir, 'logo.svg');
const buildDir = path.join(rootDir, 'build');
const windowsBuildDir = path.join(buildDir, 'windows');
const tempDir = path.join(process.env.TEMP || '.', 'antigravity_icon_build');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

console.log('[*] 正在从 logo.svg 渲染各分辨率 PNG 图像...');

const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
const pngPaths = [];

for (const size of sizes) {
    const pngFile = path.join(tempDir, `icon_${size}.png`);
    execSync(`npx --yes @resvg/resvg-js-cli --fit-width ${size} --fit-height ${size} "${svgPath}" "${pngFile}"`, { stdio: 'inherit' });
    pngPaths.push({ size, path: pngFile, buffer: fs.readFileSync(pngFile) });
}

// 1. Save 512x512 to build/appicon.png
const png512 = pngPaths.find(p => p.size === 512);
fs.writeFileSync(path.join(buildDir, 'appicon.png'), png512.buffer);
console.log('[OK] 已生成 build/appicon.png (512x512)');

// 2. Build multi-resolution ICO file
// ICO specification:
// ICONDIR: 6 bytes (Reserved: 2, Type: 2 (1 = ICO), Count: 2)
// ICONDIRENTRY: 16 bytes each
// Image Data: raw PNG buffers
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const icoImages = pngPaths.filter(p => icoSizes.includes(p.size));

const headerSize = 6;
const dirEntrySize = 16;
const entriesSize = dirEntrySize * icoImages.length;
let currentOffset = headerSize + entriesSize;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = ICO
header.writeUInt16LE(icoImages.length, 4); // Count

const entryBuffers = [];
const imageBuffers = [];

for (const img of icoImages) {
    const entry = Buffer.alloc(dirEntrySize);
    const w = img.size >= 256 ? 0 : img.size;
    const h = img.size >= 256 ? 0 : img.size;

    entry.writeUInt8(w, 0); // Width
    entry.writeUInt8(h, 1); // Height
    entry.writeUInt8(0, 2); // Color palette (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image data size
    entry.writeUInt32LE(currentOffset, 12); // Image data offset

    entryBuffers.push(entry);
    imageBuffers.push(img.buffer);
    currentOffset += img.buffer.length;
}

const icoBuffer = Buffer.concat([header, ...entryBuffers, ...imageBuffers]);
const icoDest = path.join(windowsBuildDir, 'icon.ico');
fs.writeFileSync(icoDest, icoBuffer);
console.log(`[OK] 已生成 ${icoDest} (包含 ${icoImages.length} 种分辨率规格: ${icoSizes.join(', ')})`);
