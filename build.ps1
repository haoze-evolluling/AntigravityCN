<#
.SYNOPSIS
    AntigravityCN Wails v2 现代化便携版编译构建脚本
.DESCRIPTION
    编译生成集成高颜值 Web 前端的 Windows 单文件可执行程序 (AntigravityCN.exe)
#>

[CmdletBinding()]
param(
    [switch]$NoPause,
    [switch]$ForceIcon
)

# 确保控制台输出使用 UTF-8 编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"

function Pause-Exit {
    param([int]$ExitCode = 0)
    if (-not $NoPause) {
        Write-Host ""
        Write-Host "按 Enter 键退出..." -ForegroundColor Gray
        try {
            [void][System.Console]::ReadLine()
        } catch {
            Read-Host
        }
    }
    exit $ExitCode
}

try {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "   正在构建 AntigravityCN (Wails v2 现代化便携版)" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""

    # 1. 检查 Go 编译环境
    $goCmd = Get-Command go -ErrorAction SilentlyContinue
    if (-not $goCmd) {
        Write-Host "[错误] 未检测到 Go 编译环境，请先安装 Go 1.22+:" -ForegroundColor Red
        Write-Host "       下载地址: https://go.dev/dl/" -ForegroundColor Yellow
        Pause-Exit 1
    }
    $goVer = go version
    Write-Host "[OK] Go 编译环境: $goVer" -ForegroundColor Green

    # 2. 检查 Wails CLI
    $wailsCmd = Get-Command wails -ErrorAction SilentlyContinue
    if (-not $wailsCmd) {
        Write-Host "[错误] 未检测到 Wails CLI，请先安装 Wails:" -ForegroundColor Red
        Write-Host "       运行命令: go install github.com/wailsapp/wails/v2/cmd/wails@latest" -ForegroundColor Yellow
        Write-Host "       并确保 %GOPATH%\bin 或 `$HOME\go\bin 已添加到系统 PATH 环境变量中。" -ForegroundColor Yellow
        Pause-Exit 1
    }
    Write-Host "[OK] Wails CLI 编译环境可用" -ForegroundColor Green

    # 3. 检查是否有运行中的 AntigravityCN 占用目标文件
    $runningProc = Get-Process -Name "AntigravityCN" -ErrorAction SilentlyContinue
    if ($runningProc) {
        Write-Host "[*] 检测到 AntigravityCN 正在运行，正在关闭旧进程以释放文件占用..." -ForegroundColor Yellow
        Stop-Process -Name "AntigravityCN" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 600
        Write-Host "[OK] 已关闭运行中的进程。" -ForegroundColor Green
    }

    # 4. 检查并生成高清图标 (智能增量跳过，极大加快构建速度)
    $iconFile = "build\windows\icon.ico"
    $appIconFile = "build\appicon.png"
    $svgFile = "logo.svg"
    $scriptFile = "scripts\generate_icon.js"

    $needRegenIcon = $false
    if ($ForceIcon) {
        $needRegenIcon = $true
    } elseif (-not (Test-Path $iconFile) -or -not (Test-Path $appIconFile)) {
        $needRegenIcon = $true
    } elseif (Test-Path $svgFile) {
        $svgMtime = (Get-Item $svgFile).LastWriteTime
        $icoMtime = (Get-Item $iconFile).LastWriteTime
        $appMtime = (Get-Item $appIconFile).LastWriteTime
        $scriptMtime = if (Test-Path $scriptFile) { (Get-Item $scriptFile).LastWriteTime } else { [DateTime]::MinValue }

        if ($svgMtime -gt $icoMtime -or $svgMtime -gt $appMtime -or $scriptMtime -gt $icoMtime) {
            $needRegenIcon = $true
        }
    }

    if ($needRegenIcon) {
        if (Test-Path $scriptFile) {
            $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
            if ($nodeCmd) {
                Write-Host "[*] 检测到源文件变更或指定了强制生成，正在从 logo.svg 生成 Windows 高清多分辨率应用图标..." -ForegroundColor Yellow
                try {
                    & node scripts/generate_icon.js --force
                } catch {
                    Write-Host "[!] 图标生成脚本执行异常，将使用现有预置图标继续构建。" -ForegroundColor DarkYellow
                }
            } else {
                Write-Host "[*] 未检测到 Node.js，跳过图标重新生成，使用现有预置图标构建。" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "[OK] 应用图标已是最新，跳过重新生成 (使用 .\build.ps1 -ForceIcon 可强制重新生成)。" -ForegroundColor Green
    }

    # 5. 执行编译构建
    Write-Host "[*] 正在执行 Wails 构建打包..." -ForegroundColor Yellow

    & wails build -clean -trimpath -o AntigravityCN.exe
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[错误] Wails 编译失败，退出代码: $LASTEXITCODE" -ForegroundColor Red
        Pause-Exit $LASTEXITCODE
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
        Write-Host ("[错误] 未能找到编译输出文件: {0}" -f $binPath) -ForegroundColor Red
        Pause-Exit 1
    }

    Pause-Exit 0
}
catch {
    Write-Host ""
    Write-Host "[异常] 构建过程中发生错误:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Pause-Exit 1
}