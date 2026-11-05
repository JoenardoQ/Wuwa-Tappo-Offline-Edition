param([Parameter(Mandatory=$true)][string]$Plan)
$ErrorActionPreference='Stop'
$p=Get-Content -LiteralPath $Plan -Raw -Encoding UTF8 | ConvertFrom-Json
$target=[IO.Path]::GetFullPath($p.target); $stage=[IO.Path]::GetFullPath($p.stage); $backup=[IO.Path]::GetFullPath($p.backup)
if($p.token -notmatch '^[a-f0-9]{32}$' -or $stage -cne ($target+'.incoming-'+$p.token) -or $backup -cne ($target+'.backup-'+$p.token) -or $target -eq [IO.Path]::GetPathRoot($target)) { throw 'Unsafe update plan' }
if($p.version -notmatch '^\d+\.\d+\.\d+$' -or [int]$p.pid -lt 1) { throw 'Invalid update plan' }
$old=Get-Content -LiteralPath (Join-Path $target 'resources/app/package.json') -Raw | ConvertFrom-Json
$next=Get-Content -LiteralPath (Join-Path $stage 'resources/app/package.json') -Raw | ConvertFrom-Json
if($old.name -ne 'wuwa-offline-companion' -or $next.name -ne $old.name -or $next.version -ne $p.version -or (Test-Path -LiteralPath $backup)) { throw 'Update package mismatch' }
$receipt=Join-Path $p.dataDir ('updates/'+$p.token+'/ready'); $result=Join-Path $p.dataDir 'update-result.json'
[IO.File]::WriteAllText((Join-Path ([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Plan))) 'helper-ready'),'ready')
$moved=$false; $installed=$false; $newProcess=$null
function Move-Checked([string]$from,[string]$to) { if(@($target,$stage,$backup) -cnotcontains $from -or @($target,$stage,$backup) -cnotcontains $to){throw 'Unsafe move'}; for($retry=0;$retry -lt 20;$retry++){try{Move-Item -LiteralPath $from -Destination $to -ErrorAction Stop;return}catch{if($retry -eq 19){throw};Start-Sleep -Milliseconds 500}} }
try {
 $deadline=(Get-Date).AddSeconds(120)
 while(Get-Process -Id ([int]$p.pid) -ErrorAction SilentlyContinue){if((Get-Date) -gt $deadline){throw 'Original program did not exit'};Start-Sleep -Milliseconds 250}
 Move-Checked $target $backup; $moved=$true
 Move-Checked $stage $target; $installed=$true
 $newProcess=Start-Process -FilePath (Join-Path $target 'WuwaTappo-Offline.exe') -ArgumentList ('--update-token='+$p.token) -WorkingDirectory $target -WindowStyle Hidden -PassThru
 $deadline=(Get-Date).AddSeconds(60)
 while(!(Test-Path -LiteralPath $receipt)){if((Get-Date) -gt $deadline -or $newProcess.HasExited){throw 'New version did not become ready'};Start-Sleep -Milliseconds 250;$newProcess.Refresh()}
 if((Get-Content -LiteralPath $receipt -Raw).Trim() -ne $p.version){throw 'New version receipt mismatch'}
 @{ok=$true;version=$p.version;backup=$backup} | ConvertTo-Json | Set-Content -LiteralPath $result -Encoding UTF8
} catch {
 $failure=$_.Exception.Message
 if($newProcess -and !$newProcess.HasExited){ & taskkill.exe /PID $newProcess.Id /T /F 2>$null | Out-Null;Start-Sleep -Milliseconds 800 }
 try {if($installed){Move-Checked $target $stage};if($moved){Move-Checked $backup $target};if(!(Get-Process -Id ([int]$p.pid) -ErrorAction SilentlyContinue) -and (Test-Path -LiteralPath (Join-Path $target 'WuwaTappo-Offline.exe'))){Start-Process -FilePath (Join-Path $target 'WuwaTappo-Offline.exe') -WorkingDirectory $target -WindowStyle Hidden | Out-Null}} catch { $failure+='; recovery: '+$_.Exception.Message }
 @{ok=$false;version=$p.version;error=$failure;backup=$backup} | ConvertTo-Json | Set-Content -LiteralPath $result -Encoding UTF8
}
