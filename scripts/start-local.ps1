param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$workspacePath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $workspacePath
$statePath = Join-Path $workspacePath 'data/local-processes.json'
function Get-ProjectProcessTree($roots) {
  $found = @{}
  $pending = [System.Collections.Generic.Queue[System.Diagnostics.Process]]::new()
  foreach ($root in $roots) { if ($root) { $pending.Enqueue($root) } }
  while ($pending.Count) {
    $current = $pending.Dequeue()
    if ($found.ContainsKey($current.Id)) { continue }
    $found[$current.Id] = $current
    foreach ($child in @(Get-CimInstance Win32_Process -Filter "ParentProcessId = $($current.Id)" -ErrorAction SilentlyContinue)) {
      $process = Get-Process -Id $child.ProcessId -ErrorAction SilentlyContinue
      if ($process) { $pending.Enqueue($process) }
    }
  }
  return @($found.Values)
}
if ($Stop) {
  if (Test-Path -LiteralPath $statePath) {
    $state = Get-Content -LiteralPath $statePath | ConvertFrom-Json
    $roots = @()
    foreach ($entry in $state.processes) {
      $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
      # PowerShell 7 puede convertir automáticamente el ISO de JSON a DateTime.
      if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq ([datetime]$entry.start).ToUniversalTime().Ticks) { $roots += $process }
    }
    foreach ($process in (Get-ProjectProcessTree $roots | Sort-Object StartTime -Descending)) {
      Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
    }
    Remove-Item -LiteralPath $statePath
  }
  Write-Host 'Servidores locales detenidos. La base de datos se administra por separado.'
  exit
}
if (Test-Path -LiteralPath $statePath) {
  $state = Get-Content -LiteralPath $statePath | ConvertFrom-Json
  $active = @($state.processes | Where-Object {
    $process = Get-Process -Id $_.id -ErrorAction SilentlyContinue
    $process -and $process.StartTime.ToUniversalTime().Ticks -eq ([datetime]$_.start).ToUniversalTime().Ticks
  })
  if ($active.Count) { throw 'Ya hay servidores registrados. Usa -Stop antes de reiniciar.' }
  Remove-Item -LiteralPath $statePath
}
if (!(Test-Path '.venv/Scripts/python.exe')) { throw 'Crea .venv e instala backend/requirements.txt.' }
if (!(Test-Path 'node_modules/vite/bin/vite.js')) { throw 'Ejecuta npm ci.' }
if (!(Test-Path '.env')) { throw 'Configura .env desde .env.example.' }
& '.venv/Scripts/python.exe' scripts/database.py check
if ($LASTEXITCODE -ne 0) { throw 'Inicia PostgreSQL con scripts/start-db.ps1 y aplica las migraciones pendientes. No se iniciaron servidores.' }
$busyPorts = [System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object { $_.Port -in @(8000, 5173) }
if ($busyPorts) { throw 'Los puertos 8000 o 5173 ya están ocupados. Detén la instancia anterior antes de iniciar otra.' }
New-Item -ItemType Directory -Force data | Out-Null
$pythonPath = Join-Path $workspacePath '.venv/Scripts/python.exe'
$apiProcess = Start-Process -FilePath $pythonPath -ArgumentList @('-m','uvicorn','app.main:app','--app-dir','backend','--host','127.0.0.1','--port','8000','--no-access-log') -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput 'data/api.log' -RedirectStandardError 'data/api-error.log' -PassThru
$webProcess = Start-Process -FilePath 'node' -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1') -WorkingDirectory $workspacePath -WindowStyle Hidden -RedirectStandardOutput 'data/web.log' -RedirectStandardError 'data/web-error.log' -PassThru
# El launcher de un venv de Windows puede crear otro python.exe. Guardar ambos
# evita dejar un backend antiguo ocupando el puerto al reiniciar.
$tracked = @($apiProcess, $webProcess)
for ($attempt = 0; $attempt -lt 3; $attempt++) {
  Start-Sleep -Milliseconds 100
  $tracked = @(Get-ProjectProcessTree $tracked)
}
$entries = @($tracked | ForEach-Object { @{id=$_.Id;start=$_.StartTime.ToUniversalTime().ToString('o')} })
@{ processes = $entries } | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $statePath
$ready=$false
for ($attempt=0; $attempt -lt 20; $attempt++) {
  try {
    $health=Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 2
    $web=Invoke-WebRequest -Uri 'http://127.0.0.1:5173/' -TimeoutSec 2
    if ($health.status -eq 'ok' -and $web.StatusCode -eq 200) { $ready=$true; break }
  } catch { Start-Sleep -Milliseconds 300 }
}
if (!$ready) { throw 'No se confirmó el inicio de ambos servidores. Revisa data/api-error.log y data/web-error.log; usa -Stop antes de reintentar.' }
Write-Host 'Frontend: http://127.0.0.1:5173 · API: http://127.0.0.1:8000/api/docs'
