# AntigravityCN — Google Antigravity 桌面端一键汉化脚本
# 使用方法：在 PowerShell 中运行 .apply-cn-patch.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$ASAR_PATH    = "$env:LOCALAPPDATA\Programs\antigravity\resources\app.asar"
$BACKUP_PATH  = "$env:LOCALAPPDATA\Programs\antigravity\resources\app.asar.backup"
$EXTRACT_DIR  = "$env:TEMP\antigravity_cn_patch"
$PATCHES_DIR  = "$PSScriptRoot\patches"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   AntigravityCN — Antigravity 简体中文汉化工具" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 app.asar 是否存在
if (-not (Test-Path $ASAR_PATH)) {
    Write-Host "[错误] 未找到 app.asar，请确认 Antigravity 已正确安装。" -ForegroundColor Red
    Write-Host "       预期路径：$ASAR_PATH"
    exit 1
}

# 2. 检查 patches 目录是否存在
if (-not (Test-Path $PATCHES_DIR)) {
    Write-Host "[错误] 未找到 patches 目录：$PATCHES_DIR" -ForegroundColor Red
    exit 1
}

# 3. 检查 Node.js 是否可用
try {
    $nodeVersion = node --version 2>&1
    Write-Host "[OK] Node.js 版本：$nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js。" -ForegroundColor Red
    exit 1
}

# 4. 备份原始 app.asar（已存在则跳过）
if (-not (Test-Path $BACKUP_PATH)) {
    Write-Host "[*] 正在备份原始 app.asar..." -ForegroundColor Yellow
    Copy-Item -Path $ASAR_PATH -Destination $BACKUP_PATH
    Write-Host "[OK] 备份完成：$BACKUP_PATH" -ForegroundColor Green
} else {
    Write-Host "[OK] 已存在备份文件，跳过备份。" -ForegroundColor Green
    Write-Host "     备份路径：$BACKUP_PATH"
}

# 5. 清理并重新创建临时解压目录
Write-Host ""
Write-Host "[*] 正在解压 app.asar..." -ForegroundColor Yellow
if (Test-Path $EXTRACT_DIR) {
    Remove-Item -Recurse -Force $EXTRACT_DIR
}
New-Item -ItemType Directory -Force -Path $EXTRACT_DIR | Out-Null

npx --yes asar extract $ASAR_PATH $EXTRACT_DIR 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 解压 app.asar 失败。" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] 解压完成。" -ForegroundColor Green

# 6. 复制补丁文件
Write-Host ""
Write-Host "[*] 正在应用汉化补丁..." -ForegroundColor Yellow

Get-ChildItem -Path $PATCHES_DIR -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($PATCHES_DIR.Length).TrimStart('\', '/')
    $dstPath = Join-Path (Join-Path $EXTRACT_DIR "dist") $rel
    $dstDir = Split-Path -Parent $dstPath
    if (-not (Test-Path $dstDir)) {
        New-Item -ItemType Directory -Force -Path $dstDir | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $dstPath -Force
    Write-Host "    [OK] $rel" -ForegroundColor Green
}

# 7. 重新打包为 app.asar
Write-Host ""
Write-Host "[*] 正在重新打包 app.asar..." -ForegroundColor Yellow
$newAsarPath = "$env:TEMP\app_cn.asar"
if (Test-Path $newAsarPath) { Remove-Item -Force $newAsarPath }

npx --yes asar pack $EXTRACT_DIR $newAsarPath 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] 打包 app.asar 失败。" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] 打包完成。" -ForegroundColor Green

# 8. 覆盖原始 app.asar
Write-Host ""
Write-Host "[*] 正在写入汉化版 app.asar..." -ForegroundColor Yellow
Copy-Item -Path $newAsarPath -Destination $ASAR_PATH -Force
Remove-Item -Force $newAsarPath
Write-Host "[OK] 写入完成。" -ForegroundColor Green

# 9. 清理临时目录
Remove-Item -Recurse -Force $EXTRACT_DIR

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   汉化完成！请重启 Antigravity 以查看效果。" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示：" -ForegroundColor White
Write-Host "  - 如需还原英文版，请运行：.\restore-original.ps1" -ForegroundColor Gray
Write-Host "  - 应用更新后需重新运行此脚本" -ForegroundColor Gray
Write-Host ""
