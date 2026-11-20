$ErrorActionPreference = 'Stop'
$workspace = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $workspace 'docs/proof/verification.json'))) { throw 'Run npm run verify first.' }
$output = Join-Path $workspace 'artifacts'
$stage = Join-Path $output ('stage-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item -LiteralPath (Join-Path $workspace 'dist') -Destination (Join-Path $stage 'dist') -Recurse
Copy-Item -LiteralPath (Join-Path $workspace 'scripts/serve.mjs') -Destination (Join-Path $stage 'serve.mjs')
foreach ($name in @('LICENSE','CREDITS.md','game.contract.json')) { Copy-Item -LiteralPath (Join-Path $workspace $name) -Destination $stage }
Copy-Item -LiteralPath (Join-Path $workspace 'docs/proof') -Destination (Join-Path $stage 'proof') -Recurse
Copy-Item -LiteralPath (Join-Path $workspace 'docs/RELEASE.md') -Destination (Join-Path $stage 'README.md')
$archive = Join-Path $output 'dao-den-long-v1.0.0.zip'
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $archive -Force
Write-Output $archive
