param([Parameter(Mandatory=$true)][string]$Archive,[Parameter(Mandatory=$true)][string]$Destination,[Parameter(Mandatory=$true)][string]$RootName)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$base=[IO.Path]::GetFullPath($Destination)
if (Test-Path -LiteralPath $base) { throw 'Extraction directory already exists' }
$zip=[IO.Compression.ZipFile]::OpenRead($Archive)
try {
 foreach($entry in $zip.Entries) {
  $name=$entry.FullName.Replace('\','/')
  if ($name -notmatch ('^'+[regex]::Escape($RootName)+'/') -or $name.Split('/') -contains '..' -or $name.Contains(':') -or $name.StartsWith('/')) { throw 'Unsafe archive entry' }
  $dest=[IO.Path]::GetFullPath([IO.Path]::Combine($base,$name))
  if (!$dest.StartsWith($base+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe extraction path' }
 }
 [IO.Directory]::CreateDirectory($base) | Out-Null
 foreach($entry in $zip.Entries) {
  $dest=[IO.Path]::GetFullPath([IO.Path]::Combine($base,$entry.FullName))
  if ($entry.FullName.EndsWith('/')) { [IO.Directory]::CreateDirectory($dest) | Out-Null; continue }
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($dest)) | Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$dest,$false)
 }
} finally { $zip.Dispose() }
