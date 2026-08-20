/**
 * AntigravityCN Windows 高清多分辨率应用图标生成器
 * 
 * 核心技术说明:
 * 1. Windows 资源管理器与 Win32 Shell 在读取 RT_ICON 图标资源时，对于低于 256x256 的分辨率
 *    (如 16x16, 20x20, 24x24, 32x32, 40x40, 48x48, 64x64, 96x96, 128x128)，
 *    必须使用未压缩的 32 位 DIB/BMP 格式 (BITMAPINFOHEADER + BGRA 像素 + 1 位透明掩码)。
 *    若写入 PNG 格式，Windows Shell 无法直接解析小图标，会导致其强制从 256x256 进行低质量双线性缩放，
 *    从而在文件资源管理器的列表/平铺/中图标等视图下产生严重发虚模糊。
 * 2. 256x256 分辨率遵循 Windows Vista+ 官方标准，使用压缩 PNG 格式以控制体积并获得最高清晰度。
 * 3. 生成完整的 Windows 高 DPI 缩放规格 (100%, 125%, 150%, 175%, 200%, 250%)，确保在各种显示缩放下皆清晰锐利。
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const svgPath = path.join(rootDir, 'logo.svg');
const buildDir = path.join(rootDir, 'build');
const windowsBuildDir = path.join(buildDir, 'windows');
const tempDir = path.join(process.env.TEMP || '.', 'antigravity_icon_build');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(windowsBuildDir)) {
    fs.mkdirSync(windowsBuildDir, { recursive: true });
}

console.log('[*] 正在从 logo.svg 渲染各分辨率高质量 PNG 图像...');

// 覆盖 Windows 所有标准 DPI 缩放分辨率
const allSizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256, 512];
const rendered = [];

for (const size of allSizes) {
    const pngFile = path.join(tempDir, `icon_${size}.png`);
    execSync(`npx --yes @resvg/resvg-js-cli --fit-width ${size} --fit-height ${size} "${svgPath}" "${pngFile}"`, { stdio: 'ignore' });
    const buffer = fs.readFileSync(pngFile);
    rendered.push({ size, path: pngFile, buffer });
}

// 1. 保存 512x512 渲染图为 build/appicon.png
const png512 = rendered.find(r => r.size === 512);
fs.writeFileSync(path.join(buildDir, 'appicon.png'), png512.buffer);
console.log('[OK] 已生成 build/appicon.png (512x512)');

/**
 * 纯 JS PNG 8-bit RGBA 解码器 (无需额外原生依赖)
 */
function decodePngRgba(buffer) {
    let offset = 8;
    let width = 0, height = 0;
    const idatChunks = [];

    while (offset < buffer.length) {
        const length = buffer.readUInt32BE(offset);
        const type = buffer.toString('ascii', offset + 4, offset + 8);
        const data = buffer.slice(offset + 8, offset + 8 + length);
        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            const bitDepth = data.readUInt8(8);
            const colorType = data.readUInt8(9);
            if (bitDepth !== 8 || colorType !== 6) {
                throw new Error(`仅支持 8-bit RGBA PNG 格式，当前 bitDepth=${bitDepth}, colorType=${colorType}`);
            }
        } else if (type === 'IDAT') {
            idatChunks.push(data);
        } else if (type === 'IEND') {
            break;
        }
        offset += 12 + length;
    }

    const compressed = Buffer.concat(idatChunks);
    const uncompressed = zlib.inflateSync(compressed);
    const stride = width * 4;
    const rawRgba = Buffer.alloc(width * height * 4);
    const prevRow = Buffer.alloc(stride);

    let srcOffset = 0;
    for (let y = 0; y < height; y++) {
        const filter = uncompressed.readUInt8(srcOffset++);
        const row = uncompressed.slice(srcOffset, srcOffset + stride);
        srcOffset += stride;
        const outRow = rawRgba.slice(y * stride, (y + 1) * stride);

        for (let x = 0; x < stride; x++) {
            const a = x >= 4 ? outRow[x - 4] : 0;
            const b = prevRow[x];
            const c = x >= 4 ? prevRow[x - 4] : 0;
            let val = row[x];
            if (filter === 0) {
                // None
            } else if (filter === 1) {
                val = (val + a) & 0xff;
            } else if (filter === 2) {
                val = (val + b) & 0xff;
            } else if (filter === 3) {
                val = (val + Math.floor((a + b) / 2)) & 0xff;
            } else if (filter === 4) {
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                let pr = c;
                if (pa <= pb && pa <= pc) pr = a;
                else if (pb <= pc) pr = b;
                val = (val + pr) & 0xff;
            }
            outRow[x] = val;
            prevRow[x] = val;
        }
    }
    return { width, height, data: rawRgba };
}

/**
 * 将 RGBA 像素转换为 Windows ICO 标准 32 位 DIB 格式
 */
function rgbaToDib(decoded) {
    const { width, height, data } = decoded;
    const bihSize = 40;
    const pixelBytes = width * height * 4;
    const maskRowBytes = Math.ceil(width / 32) * 4; // 对齐到 4 字节边界
    const maskBytes = maskRowBytes * height;
    const totalSize = bihSize + pixelBytes + maskBytes;

    const buffer = Buffer.alloc(totalSize);

    // 1. BITMAPINFOHEADER (40 字节)
    buffer.writeUInt32LE(40, 0); // biSize
    buffer.writeInt32LE(width, 4); // biWidth
    buffer.writeInt32LE(height * 2, 8); // biHeight (ICO 规范: 包含 XOR + AND 双倍高度)
    buffer.writeUInt16LE(1, 12); // biPlanes
    buffer.writeUInt16LE(32, 14); // biBitCount (32-bit BGRA)
    buffer.writeUInt32LE(0, 16); // biCompression (BI_RGB)
    buffer.writeUInt32LE(pixelBytes + maskBytes, 20); // biSizeImage
    buffer.writeInt32LE(0, 24); // biXPelsPerMeter
    buffer.writeInt32LE(0, 28); // biYPelsPerMeter
    buffer.writeUInt32LE(0, 32); // biClrUsed
    buffer.writeUInt32LE(0, 36); // biClrImportant

    // 2. XOR Pixels (BGRA 顺序, 从底向上存储)
    let destOffset = 40;
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const srcIdx = (y * width + x) * 4;
            const r = data[srcIdx];
            const g = data[srcIdx + 1];
            const b = data[srcIdx + 2];
            const a = data[srcIdx + 3];

            buffer[destOffset++] = b;
            buffer[destOffset++] = g;
            buffer[destOffset++] = r;
            buffer[destOffset++] = a;
        }
    }

    // 3. AND Mask (1 位透明掩码, 从底向上存储)
    for (let y = height - 1; y >= 0; y--) {
        for (let byteIdx = 0; byteIdx < maskRowBytes; byteIdx++) {
            let maskByte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = byteIdx * 8 + bit;
                if (x < width) {
                    const srcIdx = (y * width + x) * 4;
                    const a = data[srcIdx + 3];
                    if (a === 0) {
                        maskByte |= (1 << (7 - bit));
                    }
                }
            }
            buffer[destOffset++] = maskByte;
        }
    }

    return buffer;
}

// 2. 组装多分辨率 Windows ICO 图标文件
const icoSizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256];
const iconEntries = [];

for (const size of icoSizes) {
    const item = rendered.find(r => r.size === size);
    let payload;
    let isDib = false;

    if (size === 256) {
        payload = item.buffer; // 256x256 使用压缩 PNG 格式
    } else {
        const decoded = decodePngRgba(item.buffer);
        payload = rgbaToDib(decoded); // < 256 使用 32 位 DIB/BMP 格式
        isDib = true;
    }
    iconEntries.push({ size, payload, isDib });
}

const headerSize = 6;
const dirEntrySize = 16;
const entriesSize = dirEntrySize * iconEntries.length;
let currentOffset = headerSize + entriesSize;

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = ICO
header.writeUInt16LE(iconEntries.length, 4); // Count

const entryBuffers = [];
const imageBuffers = [];

for (const entry of iconEntries) {
    const dirEntry = Buffer.alloc(dirEntrySize);
    const w = entry.size >= 256 ? 0 : entry.size;
    const h = entry.size >= 256 ? 0 : entry.size;

    dirEntry.writeUInt8(w, 0); // Width
    dirEntry.writeUInt8(h, 1); // Height
    dirEntry.writeUInt8(0, 2); // Color palette
    dirEntry.writeUInt8(0, 3); // Reserved
    dirEntry.writeUInt16LE(1, 4); // Color planes
    dirEntry.writeUInt16LE(32, 6); // Bits per pixel
    dirEntry.writeUInt32LE(entry.payload.length, 8); // Data size
    dirEntry.writeUInt32LE(currentOffset, 12); // Data offset

    entryBuffers.push(dirEntry);
    imageBuffers.push(entry.payload);
    currentOffset += entry.payload.length;
}

const icoBuffer = Buffer.concat([header, ...entryBuffers, ...imageBuffers]);
const icoDest = path.join(windowsBuildDir, 'icon.ico');
fs.writeFileSync(icoDest, icoBuffer);

console.log(`[OK] 已成功生成 Windows 高清多规格图标: ${icoDest}`);
console.log(`     包含 ${iconEntries.length} 种分辨率规格: ${icoSizes.join(', ')} px`);
