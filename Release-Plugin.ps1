#Requires -Version 5.1
<#
.SYNOPSIS
  Incrémente la version semver, synchronise manifest/versions.json, build, commit, tag et push pour déclencher la release GitHub Actions (Obsidian / BRAT).

.PARAMETER BumpKind
  Patch (défaut), Minor ou Major.

.PARAMETER SkipBuild
  Ne pas exécuter npm ci / npm run build (déconseillé pour une vraie release).
#>
param(
    [ValidateSet('Patch', 'Minor', 'Major')]
    [string] $BumpKind = 'Patch',

    [switch] $SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-CommandExists {
    param([Parameter(Mandatory)][string] $Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Set-Utf8NoBomFile {
    param(
        [Parameter(Mandatory)][string] $Path,
        [Parameter(Mandatory)][string] $Content
    )
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

function Get-NextSemVer {
    param(
        [Parameter(Mandatory)][string] $Version,
        [Parameter(Mandatory)][ValidateSet('Patch', 'Minor', 'Major')][string] $Kind
    )
    if ($Version -notmatch '^(\d+)\.(\d+)\.(\d+)$') {
        throw "Version non semver à trois segments: $Version"
    }
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    $patch = [int]$Matches[3]
    switch ($Kind) {
        'Major' { return "$($major + 1).0.0" }
        'Minor' { return "$major.$($minor + 1).0" }
        'Patch' { return "$major.$minor.$($patch + 1)" }
    }
}

$repoRoot = $PSScriptRoot
Set-Location -LiteralPath $repoRoot

foreach ($cmd in @('git', 'node', 'npm')) {
    if (-not (Test-CommandExists $cmd)) {
        throw "Commande introuvable dans le PATH: $cmd"
    }
}

foreach ($rel in @('package.json', 'manifest.json', 'versions.json', 'version-bump.mjs')) {
    if (-not (Test-Path -LiteralPath (Join-Path $repoRoot $rel))) {
        throw "Fichier requis absent: $rel"
    }
}

$dirty = (& git status --porcelain 2>&1 | Out-String).Trim()
if ($dirty) {
    throw "Arbre Git non propre. Committez ou stash vos changements avant une release.`n$dirty"
}

$packagePath = Join-Path $repoRoot 'package.json'
$packageRaw = Get-Content -LiteralPath $packagePath -Raw -Encoding UTF8
$packageJson = $packageRaw | ConvertFrom-Json
$currentVersion = [string] $packageJson.version
if ([string]::IsNullOrWhiteSpace($currentVersion)) {
    throw "package.json: champ version vide ou absent."
}

$newVersion = Get-NextSemVer -Version $currentVersion -Kind $BumpKind

$escapedCurrent = [regex]::Escape($currentVersion)
$updatedPackage = [regex]::Replace(
    $packageRaw,
    '("version"\s*:\s*")' + $escapedCurrent + '(")',
    '${1}' + $newVersion + '$2',
    1
)
if ($updatedPackage -eq $packageRaw) {
    throw "Impossible de mettre à jour la version dans package.json (motif version introuvable ou déjà modifié)."
}
Set-Utf8NoBomFile -Path $packagePath -Content $updatedPackage

$env:npm_package_version = $newVersion
try {
    & node (Join-Path $repoRoot 'version-bump.mjs')
    if ($LASTEXITCODE -ne 0) { throw "version-bump.mjs a échoué (code $LASTEXITCODE)." }
}
finally {
    Remove-Item Env:\npm_package_version -ErrorAction SilentlyContinue
}

$notesPath = Join-Path $repoRoot 'release-notes.md'
$lastTag = $null
$describeResult = & git describe --tags --abbrev=0 2>&1
if ($LASTEXITCODE -eq 0) {
    $lastTag = ($describeResult | Out-String).Trim()
}
$logLines = if ($lastTag) {
    & git log "$lastTag..HEAD" --oneline 2>&1
} else {
    & git log --oneline -n 30 2>&1
}
if ($LASTEXITCODE -ne 0) {
    throw "git log a échoué (code $LASTEXITCODE)."
}
$notesBody = ($logLines | Out-String).Trim() + "`n"
Set-Utf8NoBomFile -Path $notesPath -Content $notesBody

if (-not $SkipBuild) {
    # --ignore-scripts : évite le script prepare de @codemirror/language (git).
    & npm ci --ignore-scripts
    if ($LASTEXITCODE -ne 0) { throw "npm ci a échoué (code $LASTEXITCODE)." }
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build a échoué (code $LASTEXITCODE)." }
}

if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'main.js'))) {
    throw "main.js absent après build. Relancez sans -SkipBuild ou exécutez npm run build."
}
if (-not (Test-Path -LiteralPath (Join-Path $repoRoot 'styles.css'))) {
    throw "styles.css absent. Requis pour la release Obsidian."
}

& git rev-parse --verify --quiet "refs/tags/$newVersion" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    throw "Le tag Git '$newVersion' existe déjà."
}

# main.js : .gitignore — produit par npm run build en CI.
$pathsToAdd = @(
    'package.json',
    'manifest.json',
    'versions.json',
    'release-notes.md',
    'styles.css'
)
& git add -- $pathsToAdd
if ($LASTEXITCODE -ne 0) { throw "git add a échoué (code $LASTEXITCODE)." }

& git commit -m $newVersion
if ($LASTEXITCODE -ne 0) { throw "git commit a échoué (code $LASTEXITCODE)." }

& git tag $newVersion
if ($LASTEXITCODE -ne 0) { throw "git tag a échoué (code $LASTEXITCODE)." }

& git push origin HEAD
if ($LASTEXITCODE -ne 0) { throw "git push a échoué (code $LASTEXITCODE)." }

& git push origin "refs/tags/$newVersion"
if ($LASTEXITCODE -ne 0) { throw "git push --tags a échoué (code $LASTEXITCODE)." }

Write-Host "Release $newVersion poussée."
Write-Host "La GitHub Action build et publie main.js, manifest.json et styles.css (catalogue Obsidian)."
Write-Host "Déploiement local : .\Deploy-LocalPlugin.ps1"
