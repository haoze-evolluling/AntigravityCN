[CmdletBinding()]
param(
    [switch]$SkipAppBuild,
    [switch]$ForceIcon
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot
$version = "4.0.0"
$sourceExe = Join-Path $repoRoot "build\bin\AntigravityCN.exe"
$installerScript = Join-Path $repoRoot "scripts\installer.nsi"
$installerExe = Join-Path $repoRoot "build\bin\AntigravityCN-Setup-$version.exe"

Push-Location $repoRoot
try {
    if (-not $SkipAppBuild) {
        $buildArgs = @("build", "-clean", "-trimpath", "-o", "AntigravityCN.exe")
        if ($ForceIcon) {
            $buildArgs = @("build", "-clean", "-trimpath", "-forceicon", "-o", "AntigravityCN.exe")
        }

        Write-Host "[*] Compiling AntigravityCN $version..."
        & wails @buildArgs
        if ($LASTEXITCODE -ne 0) {
            throw "wails build failed with exit code $LASTEXITCODE"
        }
    }

    if (-not (Test-Path -LiteralPath $sourceExe)) {
        throw "Application executable not found: $sourceExe"
    }

    $makensis = Join-Path ${env:ProgramFiles(x86)} "NSIS\makensis.exe"
    if (-not (Test-Path -LiteralPath $makensis)) {
        $makensis = (Get-Command makensis.exe -ErrorAction Stop).Source
    }

    Write-Host "[*] Building installer with NSIS..."
    & $makensis /INPUTCHARSET UTF8 $installerScript
    if ($LASTEXITCODE -ne 0) {
        throw "makensis failed with exit code $LASTEXITCODE"
    }

    if (-not (Test-Path -LiteralPath $installerExe)) {
        throw "Installer output not found: $installerExe"
    }

    $file = Get-Item -LiteralPath $installerExe
    Write-Host ("[OK] Installer: {0}" -f $file.FullName)
    Write-Host ("[OK] Size: {0:N2} MB" -f ($file.Length / 1MB))
}
finally {
    Pop-Location
}
