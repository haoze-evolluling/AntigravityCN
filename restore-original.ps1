# AntigravityCN — 还原原始英文版脚本
# 使用方法：在 PowerShell 中运行 .estore-original.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$ASAR_PATH   = "$env:LOCALAPPDATA\Programs\antigravity\resources\app.asar"
$BACKUP_PATH = "$env:LOCALAPPDATA\Programs\antigravity\resources\app.asar.backup"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   AntigravityCN — 还原原始英文版" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $BACKUP_PATH)) {
    Write-Host "[错误] 未找到备份文件，无法还原。" -ForegroundColor Red
    Write-Host "       预期路径：$BACKUP_PATH"
    exit 1
}

Write-Host "[*] 正在还原原始 app.asar..." -ForegroundColor Yellow
Copy-Item -Path $BACKUP_PATH -Destination $ASAR_PATH -Force
Write-Host "[OK] 还原完成。" -ForegroundColor Green
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   已还原英文版！请重启 Antigravity。" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
