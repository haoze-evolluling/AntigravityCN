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

# 1. 检查 Wails CLI
$wailsCmd = Get-Command wails -ErrorAction SilentlyContinue
if (-not $wailsCmd) {
    Write-Host "[错误] 未检测到 Wails CLI，请先安装 Wails:" -ForegroundColor Red
    Write-Host "       go install github.com/wailsapp/wails/v2/cmd/wails@latest" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Wails CLI 编译环境可用" -ForegroundColor Green

# 2. 检查是否有运行中的 AntigravityCN 占用目标文件
$runningProc = Get-Process -Name "AntigravityCN" -ErrorAction SilentlyContinue
if ($runningProc) {
    Write-Host "[*] 检测到 AntigravityCN 正在运行，正在关闭旧进程以释放文件占用..." -ForegroundColor Yellow
    Stop-Process -Name "AntigravityCN" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    Write-Host "[OK] 已关闭运行中的进程。" -ForegroundColor Green
}

# 3. 执行编译构建
Write-Host "[*] 正在执行 Wails 构建打包..." -ForegroundColor Yellow

wails build -clean -trimpath -o AntigravityCN.exe
if ($LASTEXITCODE -ne 0) {
    Write-Host "[错误] Wails 编译失败，退出代码: $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}

$binPath = "build\bin\AntigravityCN.exe"
if (Test-Path $binPath) {
    Copy-Item $binPath "AntigravityCN.exe" -Force
    $fileSize = (Get-Item "AntigravityCN.exe").Length / 1MB
    Write-Host ""
    Write-Host "[OK] 编译成功！" -ForegroundColor Green
    Write-Host ("     输出位置: {0}\AntigravityCN.exe" -f (Get-Location)) -ForegroundColor Green
    Write-Host ("     文件大小: {0:N2} MB" -f $fileSize) -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   您可以直接双击根目录下的 AntigravityCN.exe 运行！" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
} else {
    Write-Host "[错误] 未能找到编译输出文件：$binPath" -ForegroundColor Red
    exit 1
}
