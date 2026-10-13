param([Parameter(Mandatory=$true)][string]$DatabaseUrl,[string]$PgDump='pg_dump')
$ErrorActionPreference='Stop'
$workspacePath=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$timestamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath=Join-Path $workspacePath "backups/$timestamp"
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
# Use a URL without password; pg_dump prompts or reads a local protected pgpass file.
if ($DatabaseUrl -match '://[^/]*:[^/@]+@') { throw 'No incluyas contraseñas en la URL de argumentos; usa pgpass.' }
$dumpPath = Join-Path $backupPath 'database.dump'
$dumpArguments = @("--dbname=$DatabaseUrl", '--format=custom', "--file=$dumpPath")
& $PgDump @dumpArguments
if ($LASTEXITCODE -ne 0) { throw 'Falló pg_dump. No se completó la copia.' }
$uploadsPath = Join-Path $workspacePath 'data/uploads'
if (Test-Path -LiteralPath $uploadsPath) {
  Copy-Item -LiteralPath $uploadsPath -Destination (Join-Path $backupPath 'uploads') -Recurse
} else {
  New-Item -ItemType Directory -Path (Join-Path $backupPath 'uploads') | Out-Null
}
Write-Host "Copia creada: $backupPath. Verifica la restauración en un entorno separado."
