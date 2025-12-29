$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$dest = "c:\Users\Puca\Desktop\Antigravity\SmartDrill\backups\backup_" + $timestamp
Write-Host "Backing up to $dest"
robocopy "c:\Users\Puca\Desktop\Antigravity\SmartDrill" $dest /E /XD node_modules .next .git backups .vscode
if ($LASTEXITCODE -lt 8) { exit 0 } else { exit $LASTEXITCODE }
