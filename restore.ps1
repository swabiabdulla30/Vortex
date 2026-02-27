# Checkpoint Restoration Script
# Usage: .\restore.ps1

if (!(Test-Path .git)) {
    Write-Host "Error: Not a git repository." -ForegroundColor Red
    exit
}

$confirm = Read-Host "Are you sure you want to RESTORE to the GOLDEN checkpoint? All unsaved changes will be LOST (y/n)"
if ($confirm -ne 'y') {
    Write-Host "Restoration cancelled."
    exit
}

Write-Host "Initiating Vortex Restoration Protocol..." -ForegroundColor Cyan
git reset --hard GOLDEN
git clean -fd
Write-Host "SUCCESS: Vortex System Restored to GOLDEN Checkpoint." -ForegroundColor Green
