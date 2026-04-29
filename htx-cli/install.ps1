#Requires -Version 5.1
<#
.SYNOPSIS
    htx-cli installer / updater for Windows (PowerShell).

.DESCRIPTION
    Downloads the latest htx-cli release from GitHub, verifies its SHA256
    checksum, installs to %LOCALAPPDATA%\Programs\htx-cli, and adds that
    directory to the user PATH.

.PARAMETER Beta
    Install the latest tag (including pre-releases) instead of the latest
    stable release.

.PARAMETER LocalDist
    Install from a local dist directory (produced by build.sh) instead
    of downloading.

.EXAMPLE
    irm https://raw.githubusercontent.com/flamez-hue/htx-skills-hub/main/htx-cli/install.ps1 | iex

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\install.ps1 -LocalDist .\dist

.LINK
    https://github.com/flamez-hue/htx-skills-hub/releases/tag/v1.0.0
#>

param(
    [switch]$Beta,
    [string]$LocalDist
)

$ErrorActionPreference = 'Stop'

$Repo       = if ($env:HTX_REPO) { $env:HTX_REPO } else { 'flamez-hue/htx-skills-hub' }
$Binary     = 'htx-cli'
$InstallDir = Join-Path $env:LOCALAPPDATA "Programs\htx-cli"
$ExePath    = Join-Path $InstallDir "$Binary.exe"

# ── Target detection ─────────────────────────────────────────
function Get-Target {
    $arch = $env:PROCESSOR_ARCHITECTURE
    switch ($arch) {
        'AMD64' { return 'x86_64-pc-windows-msvc' }
        'ARM64' { return 'aarch64-pc-windows-msvc' }
        default { throw "Unsupported architecture: $arch" }
    }
}

# ── Semver compare (returns $true if a > b) ─────────────────
function Test-SemverGt($a, $b) {
    $baseA, $preA = $a -split '-', 2
    $baseB, $preB = $b -split '-', 2
    $pa = ($baseA -split '\.') + @('0','0','0') | Select-Object -First 3
    $pb = ($baseB -split '\.') + @('0','0','0') | Select-Object -First 3
    for ($i = 0; $i -lt 3; $i++) {
        $na = [int]$pa[$i]; $nb = [int]$pb[$i]
        if ($na -gt $nb) { return $true }
        if ($na -lt $nb) { return $false }
    }
    if (-not $preA -and -not $preB) { return $false }
    if (-not $preA) { return $true  }
    if (-not $preB) { return $false }
    $numA = [int](($preA -replace '[^0-9]','') -as [string]); if (-not $numA) { $numA = 0 }
    $numB = [int](($preB -replace '[^0-9]','') -as [string]); if (-not $numB) { $numB = 0 }
    return $numA -gt $numB
}

# ── Version helpers ─────────────────────────────────────────
function Get-LocalVersion {
    if (Test-Path $ExePath) {
        try {
            $out = & $ExePath --version 2>$null
            if ($out) { return ($out -split '\s+')[-1].TrimStart('v') }
        } catch { }
    }
    return $null
}

function Get-LatestStable {
    $r = Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest" -TimeoutSec 10
    return $r.tag_name.TrimStart('v')
}

function Get-LatestWithBeta {
    $tags = Invoke-RestMethod "https://api.github.com/repos/$Repo/tags?per_page=100" -TimeoutSec 10
    $best = $null
    foreach ($t in $tags) {
        $v = $t.name.TrimStart('v')
        if (-not $best -or (Test-SemverGt $v $best)) { $best = $v }
    }
    if (-not $best) { throw "No valid versions found in tags." }
    return $best
}

# ── SHA256 helper ───────────────────────────────────────────
function Get-Sha256($path) {
    return (Get-FileHash -Path $path -Algorithm SHA256).Hash.ToLower()
}

# ── Remote install ──────────────────────────────────────────
function Install-Remote($tag) {
    $target = Get-Target
    $binaryName = "$Binary-$target.exe"
    $base       = "https://github.com/$Repo/releases/download/$tag"
    $url        = "$base/$binaryName"
    $checksums  = "$base/checksums.txt"

    Write-Host "Installing $Binary $tag ($target)..."

    $tmp = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("htxcli-" + [guid]::NewGuid()))
    try {
        $exe    = Join-Path $tmp $binaryName
        $sumTxt = Join-Path $tmp "checksums.txt"
        Invoke-WebRequest -Uri $url       -OutFile $exe    -UseBasicParsing
        Invoke-WebRequest -Uri $checksums -OutFile $sumTxt -UseBasicParsing

        $line = Select-String -Path $sumTxt -Pattern ([regex]::Escape($binaryName)) | Select-Object -First 1
        if (-not $line) { throw "No checksum found for $binaryName" }
        $expected = ($line.Line -split '\s+')[0].ToLower()
        $actual   = Get-Sha256 $exe
        if ($expected -ne $actual) {
            throw "Checksum mismatch!`n  Expected: $expected`n  Got:      $actual"
        }
        Write-Host "Checksum verified."

        New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
        Move-Item -Force $exe $ExePath
        Write-Host "Installed $Binary $tag to $ExePath"
    } finally {
        Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
    }
}

# ── Local install ───────────────────────────────────────────
function Install-Local($distDir) {
    $target = Get-Target
    $binaryName = "$Binary-$target.exe"
    $src = Join-Path $distDir $binaryName
    if (-not (Test-Path $src)) { throw "$src not found. Run ./build.sh first." }

    $sumTxt = Join-Path $distDir "checksums.txt"
    if (Test-Path $sumTxt) {
        $line = Select-String -Path $sumTxt -Pattern ([regex]::Escape($binaryName)) | Select-Object -First 1
        if ($line) {
            $expected = ($line.Line -split '\s+')[0].ToLower()
            $actual   = Get-Sha256 $src
            if ($expected -ne $actual) { throw "Checksum mismatch for $binaryName" }
            Write-Host "Checksum verified."
        }
    }

    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Copy-Item -Force $src $ExePath
    Write-Host "Installed $Binary to $ExePath"
}

# ── PATH setup ──────────────────────────────────────────────
function Add-ToUserPath {
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($userPath -and ($userPath -split ';' | Where-Object { $_ -eq $InstallDir })) {
        return
    }
    $newPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    $env:Path = "$env:Path;$InstallDir"
    Write-Host ""
    Write-Host "Added $InstallDir to your user PATH."
    Write-Host "Open a new terminal for the change to take effect in new shells."
}

# ── Main ────────────────────────────────────────────────────
if ($LocalDist) {
    Install-Local (Resolve-Path $LocalDist).Path
    Add-ToUserPath
    return
}

$local = Get-LocalVersion
if ($Beta) {
    $target = Get-LatestWithBeta
    if ($local -eq $target) { return }
} else {
    $target = Get-LatestStable
    if ($local -eq $target) { return }
    if ($local -and -not (Test-SemverGt $target $local)) { return }
}

if ($local) { Write-Host "Updating $Binary from $local to $target..." }

Install-Remote "v$target"
Add-ToUserPath
