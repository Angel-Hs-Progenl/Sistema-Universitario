param([ValidateSet('Auto','Docker','Local')][string]$Mode='Auto')
$ErrorActionPreference='Stop'
$workspacePath=(Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $workspacePath
$pythonPath=Join-Path $workspacePath '.venv/Scripts/python.exe'
if (!(Test-Path -LiteralPath $pythonPath)) { throw 'Crea .venv e instala las dependencias del backend.' }
& $pythonPath scripts/database.py ping 2>$null
if ($LASTEXITCODE -eq 0) { Write-Host 'La base configurada ya está disponible.'; exit 0 }
$connection = (& $pythonPath scripts/database.py connection) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) { throw 'Revisa DATABASE_URL en .env.' }
if ($connection.host -notin @('127.0.0.1','localhost')) { throw 'Este script solo arranca bases locales. Administra el servidor remoto por su procedimiento autorizado.' }
$pgData=Join-Path $workspacePath 'data/postgres'
$pgControl=Join-Path $env:ProgramFiles 'PostgreSQL/16/bin/pg_ctl.exe'
if ($Mode -eq 'Docker' -or ($Mode -eq 'Auto' -and !(Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION')))) {
  if (!(Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Instala Docker Desktop o configura PostgreSQL local. El script no crea ni reemplaza clústeres existentes.' }
  docker compose up -d --wait db
  if ($LASTEXITCODE -ne 0) { throw 'Docker no pudo iniciar PostgreSQL. Revisa Docker Desktop y POSTGRES_PASSWORD/POSTGRES_PORT.' }
} else {
  if (!(Test-Path -LiteralPath $pgControl) -or !(Test-Path -LiteralPath (Join-Path $pgData 'PG_VERSION'))) { throw 'No existe un clúster PostgreSQL 16 local del proyecto. Configura una instalación local o utiliza Docker.' }
  if ((Get-Content -LiteralPath (Join-Path $pgData 'PG_VERSION')).Trim() -ne '16') { throw 'El clúster requiere binarios de su misma versión. No se ha modificado.' }
  $startArguments=@('-D', ('"'+$pgData+'"'), '-l', 'data/postgres.log', '-o', ('"-h 127.0.0.1 -p '+$connection.port+' -c shared_buffers=32MB -c max_connections=40"'), '-w', 'start')
  $taskProcess=Start-Process -FilePath $pgControl -ArgumentList $startArguments -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput 'data/postgres-start.log' -RedirectStandardError 'data/postgres-start-error.log' -PassThru
  # pg_ctl puede conservar handles del proceso hijo; esperar la conexión, no el árbol.
  $ready=$false
  for ($attempt=0; $attempt -lt 15; $attempt++) {
    Start-Sleep -Milliseconds 300
    & $pythonPath scripts/database.py ping 2>$null
    if ($LASTEXITCODE -eq 0) { $ready=$true; break }
    if ($taskProcess.HasExited -and $taskProcess.ExitCode -ne 0) { break }
  }
  if (!$ready) { throw 'PostgreSQL no está disponible. Revisa data/postgres-start-error.log; no se borró el clúster.' }
}
& $pythonPath scripts/database.py ping
if ($LASTEXITCODE -ne 0) { throw 'La base inició, pero DATABASE_URL no coincide con sus credenciales o puerto.' }
