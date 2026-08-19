# AntigravityCN Wails v2 现代化便携版编译构建脚本
# 编译生成集成高颜值 Web 前端的 Windows 单文件可执行程序 (EXE)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   正在构建 AntigravityCN (Wails v2 现代化便携版)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Wails CLI
try {
    $wailsVersion = wails version
    Write-Host "[OK] Wails CLI 编译环境：$wailsVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Wails CLI，请先安装 Wails (go install github.com/wailsapp/wails/v2/cmd/wails@latest)。" -ForegroundColor Red
    exit 1
}

# 编译
Write-Host "[*] 正在执行 Wails 构建打包..." -ForegroundColor Yellow

wails build -clean -trimpath -o AntigravityCN.exe

$binPath = "build\bin\AntigravityCN.exe"
if (Test-Path $binPath) {
    Copy-Item $binPath "AntigravityCN.exe" -Force
    $fileSize = (Get-Item "AntigravityCN.exe").Length / 1MB
    Write-Host ""
    Write-Host "[OK] 编译成功！" -ForegroundColor Green
    Write-Host ("     输出位置: {0}\AntigravityCN.exe" -f (Get-Location)) -ForegroundColor Green
    Write-Host ("     文件大小: {0:N2} MB (便携单文件，零依赖，高颜值 Wails UI)" -f $fileSize) -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   您可以直接双击根目录下的 AntigravityCN.exe 运行！" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
} else {
    Write-Host "[错误] 未能找到编译输出文件：$binPath" -ForegroundColor Red
    exit 1
}
