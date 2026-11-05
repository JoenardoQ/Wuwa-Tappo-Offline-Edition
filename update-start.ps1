param([Parameter(Mandatory=$true)][string]$Helper,[Parameter(Mandatory=$true)][string]$Plan)
$ErrorActionPreference='Stop'
if($Helper.Contains('"') -or $Plan.Contains('"')) { throw 'Invalid helper path' }
$arguments=@('-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',('"'+$Helper+'"'),'-Plan',('"'+$Plan+'"'))
$child=Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -WorkingDirectory ([IO.Path]::GetDirectoryName($Plan)) -WindowStyle Hidden -PassThru
$child.Id
