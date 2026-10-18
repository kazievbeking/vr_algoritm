param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) {
    $questNode = $nodeCommand.Source
} else {
    $questNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
    if (-not (Test-Path -LiteralPath $questNode)) {
        throw 'Node.js 22+ is required. Install Node.js, reopen PowerShell, and run this script again.'
    }
}
$env:PORT = $Port
& $questNode (Join-Path $PSScriptRoot 'tools\serve.js')
