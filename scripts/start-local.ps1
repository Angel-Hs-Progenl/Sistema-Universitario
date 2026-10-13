param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$workspacePath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $workspacePath
$statePath = Join-Path $workspacePath 'data/local-processes.json'
if ($Stop) {
  if (Test-Path -LiteralPath $statePath) {
    $state = Get-Content -LiteralPath $statePath | ConvertFrom-Json
    foreach ($entry in $state.processes) {
      $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
      if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.start) { Stop-Process -Id $entry.id }
    }
    Remove-Item -LiteralPath $statePath
  }
  Write-Host 'Servidores locales detenidos. La base de datos se administra por separado.'
  exit
}
if (Test-Path -LiteralPath $statePath) { throw 'Ya existe un registro local. Usa -Stop antes de reiniciar.' }
if (!(Test-Path '.venv/Scripts/python.exe')) { throw 'Crea .venv e instala backend/requirements.txt.' }
if (!(Test-Path 'node_modules/vite/bin/vite.js')) { throw 'Ejecuta npm ci.' }
if (!(Test-Path '.env')) { throw 'Configura .env desde .env.example.' }
New-Item -ItemType Directory -Force data | Out-Null
$pythonPath = Join-Path $workspacePath '.venv/Scripts/python.exe'
$apiProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','app.main:app','--app-dir','backend','--host','127.0.0.1','--port','8000') -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput 'data/api.log' -RedirectStandardError 'data/api-error.log' -PassThru
$webProcess = Start-Process -FilePath 'node' -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1') -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput 'data/web.log' -RedirectStandardError 'data/web-error.log' -PassThru
@{ processes = @(@{id=$apiProcess.Id;start=$apiProcess.StartTime.ToUniversalTime().ToString('o')},@{id=$webProcess.Id;start=$webProcess.StartTime.ToUniversalTime().ToString('o')}) } | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $statePath
Write-Host 'Frontend: http://127.0.0.1:5173 · API: http://127.0.0.1:8000/api/docs'
