#Requires -Version 5.1
<#
.SYNOPSIS
  Build le plugin puis déploie un package minimal dans un dossier Obsidian local.

.DESCRIPTION
  - Exécute `npm run build` à la racine du repo.
  - Copie uniquement les artefacts nécessaires dans le dossier plugin cible.
  - Préserve les préférences plugin (data.json).

.PARAMETER TargetPluginDir
  Dossier plugin Obsidian de destination.
  Défaut: D:\Notes\.obsidian\plugins\preprint

.PARAMETER SkipBuild
  Copie les fichiers sans relancer `npm run build`.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Deploy-LocalPlugin.ps1

.EXAMPLE
  .\Deploy-LocalPlugin.ps1 -SkipBuild
#>

param(
  [string]$TargetPluginDir = 'D:\Notes\.obsidian\plugins\preprint',
  [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Require-Command {
  param([Parameter(Mandatory = $true)][string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Commande introuvable: $Name"
  }
}

function Ensure-File {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Fichier requis absent: $Path"
  }
}

$repoRoot = $PSScriptRoot
Set-Location -LiteralPath $repoRoot

Require-Command -Name 'npm'

if (-not $SkipBuild) {
  Write-Host '==> Build production (npm run build)...'
  & npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "npm run build a échoué (code $LASTEXITCODE)."
  }
}

$requiredFiles = @(
  'main.js',
  'manifest.json',
  'styles.css'
)

foreach ($file in $requiredFiles) {
  Ensure-File -Path (Join-Path $repoRoot $file)
}

if (-not (Test-Path -LiteralPath $TargetPluginDir)) {
  New-Item -ItemType Directory -Path $TargetPluginDir -Force | Out-Null
}

Write-Host "==> Nettoyage contrôlé destination: $TargetPluginDir"
$preserve = @('data.json')
Get-ChildItem -LiteralPath $TargetPluginDir -Force | ForEach-Object {
  if ($preserve -contains $_.Name) {
    Write-Host "    (préservé) $($_.Name)"
    return
  }
  Remove-Item -LiteralPath $_.FullName -Recurse -Force
}

Write-Host '==> Copie des artefacts plugin...'
foreach ($file in $requiredFiles) {
  Copy-Item -LiteralPath (Join-Path $repoRoot $file) -Destination (Join-Path $TargetPluginDir $file) -Force
}

Write-Host '==> Déploiement terminé.'
Write-Host 'Fichiers copiés:'
Get-ChildItem -LiteralPath $TargetPluginDir | Select-Object Name, Length | Format-Table -AutoSize
