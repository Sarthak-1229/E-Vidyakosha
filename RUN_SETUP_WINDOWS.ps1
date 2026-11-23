$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -3 scripts/auto_setup.py @args
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    & python scripts/auto_setup.py @args
} else {
    Write-Host 'Python 3.10+ and Git are required to automate the setup.' -ForegroundColor Red
    exit 1
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
