[CmdletBinding()]
param([ValidateSet('Admin','Faculty','Student')][string]$CopyPassword)

$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This credential helper requires Windows DPAPI.' }
$directory = Join-Path $env:LOCALAPPDATA 'E-Vidyakosha'
$vault = Join-Path $directory 'academic-demo-v1.clixml'
$roles = @('Admin','Faculty','Student')

if (-not (Test-Path -LiteralPath $vault)) {
    if ($CopyPassword) { throw 'Run setup once before copying a demo password.' }
    [void][System.IO.Directory]::CreateDirectory($directory)
    $credentials = @{}
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        foreach ($role in $roles) {
            $bytes = New-Object byte[] 32
            $rng.GetBytes($bytes)
            $secure = ConvertTo-SecureString ([Convert]::ToBase64String($bytes)) -AsPlainText -Force
            $credentials[$role] = New-Object System.Management.Automation.PSCredential($role, $secure)
        }
        $tempFile = Join-Path $directory ([guid]::NewGuid().ToString() + '.clixml')
        $credentials | Export-Clixml -LiteralPath $tempFile
        [System.IO.File]::Move($tempFile, $vault)
    } finally {
        $rng.Dispose()
        if ($tempFile -and (Test-Path -LiteralPath $tempFile)) { Remove-Item -LiteralPath $tempFile }
    }
}

$credentials = Import-Clixml -LiteralPath $vault
if ($CopyPassword) {
    Set-Clipboard -Value $credentials[$CopyPassword].GetNetworkCredential().Password
    Write-Output "$CopyPassword demo password copied. Clear the clipboard after pasting."
    return
}

Push-Location (Split-Path -Parent $PSScriptRoot)
$previous = @{}
try {
    foreach ($role in $roles) {
        $key = 'DEMO_' + $role.ToUpperInvariant() + '_PASSWORD'
        $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
        [Environment]::SetEnvironmentVariable($key, $credentials[$role].GetNetworkCredential().Password, 'Process')
    }
    npm.cmd run demo:setup
    if ($LASTEXITCODE -ne 0) { throw "Demo setup failed with exit code $LASTEXITCODE." }
} finally {
    foreach ($key in $previous.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
    Pop-Location
}
