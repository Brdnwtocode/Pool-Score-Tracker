# Vendor Google Fonts locally so the scoreboard works with zero internet access.
# Run from the project root:  powershell -ExecutionPolicy Bypass -File tools\vendor-fonts.ps1
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$UA   = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
$ROOT = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FONT = Join-Path $ROOT 'fonts'
New-Item -ItemType Directory -Force -Path $FONT | Out-Null

$sheets = [ordered]@{
    # Icon font: the entire UI is icon-driven, so this one is critical.
    'icons.css'     = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block'
    # Text fonts (Latin + Vietnamese subsets are included automatically).
    'app-fonts.css' = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap'
}

foreach ($sheet in $sheets.Keys) {
    $url  = $sheets[$sheet]
    $css  = (Invoke-WebRequest -Uri $url -UserAgent $UA -UseBasicParsing -TimeoutSec 60).Content
    $slug = $sheet -replace '\.css$', ''
    $map  = @{}   # remote url -> local file name (dedupes repeated subsets)

    $found = [regex]::Matches($css, 'url\((https://fonts\.gstatic\.com/[^)]+)\)')
    foreach ($m in $found) {
        $remote = $m.Groups[1].Value
        if (-not $map.ContainsKey($remote)) {
            $idx  = $map.Count + 1
            $ext  = [IO.Path]::GetExtension($remote)
            if ([string]::IsNullOrWhiteSpace($ext)) { $ext = '.woff2' }
            $file = '{0}-{1:d2}{2}' -f $slug, $idx, $ext
            Invoke-WebRequest -Uri $remote -OutFile (Join-Path $FONT $file) -UserAgent $UA -UseBasicParsing -TimeoutSec 60
            $map[$remote] = $file
        }
        # Point the stylesheet at the vendored copy (css/ -> ../fonts/).
        $css = $css.Replace($remote, '../fonts/' + $map[$remote])
    }

    $out = Join-Path $ROOT ('css\' + $sheet)
    [IO.File]::WriteAllText($out, $css, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host ("{0,-14} -> {1} file(s), {2} bytes of CSS" -f $sheet, $map.Count, $css.Length)
}

$stats = Get-ChildItem $FONT | Measure-Object -Property Length -Sum
Write-Host ("fonts/         -> {0} file(s), {1:N0} KB total" -f $stats.Count, ($stats.Sum / 1KB))
