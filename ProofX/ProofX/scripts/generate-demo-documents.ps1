$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$demoDataRoot = Join-Path $root 'demo-data'

function Get-Field {
  param(
    [pscustomobject]$Data,
    [string]$Name
  )

  return [string]($Data.$Name)
}

function New-SvgDocument {
  param(
    [string]$Title,
    [string]$Subtitle,
    [string[]]$Lines,
    [string]$Accent = '#1f6f68'
  )

  $escapedTitle = [System.Security.SecurityElement]::Escape($Title)
  $escapedSubtitle = [System.Security.SecurityElement]::Escape($Subtitle)

  $lineMarkup = New-Object System.Collections.Generic.List[string]
  $y = 255
  foreach ($line in $Lines) {
    $escapedLine = [System.Security.SecurityElement]::Escape($line)
    $lineMarkup.Add("<text x=`"110`" y=`"$y`" font-family=`"Arial`" font-size=`"26`" fill=`"#243b53`">$escapedLine</text>")
    $y += 52
  }

  return @"
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700" viewBox="0 0 1000 700">
  <rect width="1000" height="700" fill="#f8fafc"/>
  <rect x="70" y="70" width="860" height="560" rx="24" fill="#fff" stroke="$Accent" stroke-width="4"/>
  <rect x="70" y="70" width="860" height="110" rx="24" fill="$Accent"/>
  <text x="110" y="128" font-family="Arial" font-size="34" font-weight="700" fill="#fff">$escapedTitle</text>
  <text x="110" y="160" font-family="Arial" font-size="18" fill="#d8f3ef">$escapedSubtitle</text>
  $($lineMarkup -join "`n  ")
</svg>
"@
}

Get-ChildItem $demoDataRoot -Directory | ForEach-Object {
  $folder = $_.FullName
  $slug = $_.Name
  $dataPath = Join-Path $folder 'data.json'
  if (-not (Test-Path $dataPath)) {
    return
  }

  $data = Get-Content $dataPath -Raw | ConvertFrom-Json
  $name = Get-Field $data 'name'
  $dob = Get-Field $data 'dob'
  $degree = Get-Field $data 'degree'
  $state = Get-Field $data 'state'
  $income = Get-Field $data 'income'
  $issuer = Get-Field $data 'issuer'
  $expected = Get-Field $data 'expected'

  $bundle = @{
    photo = 'photo.svg'
    documents = @(
      'aadhaar.svg',
      'degree-certificate.svg',
      'income-certificate.svg',
      'address-proof.svg',
      'supporting-document.svg'
    )
    expected = $expected
  } | ConvertTo-Json -Depth 4

  Set-Content -LiteralPath (Join-Path $folder 'bundle.json') -Value $bundle -Encoding utf8

  $aadhaarSvg = New-SvgDocument `
    -Title 'UIDAI / DigiLocker Demo Aadhaar' `
    -Subtitle 'Synthetic identity source for presentation only' `
    -Accent '#0f766e' `
    -Lines @(
      "Name: $name",
      "DOB: $dob",
      "State: $state",
      "Issuer: $issuer",
      "Document Type: Aadhaar-linked identity source"
    )
  Set-Content -LiteralPath (Join-Path $folder 'aadhaar.svg') -Value $aadhaarSvg -Encoding utf8

  $degreeSvg = New-SvgDocument `
    -Title 'Academic Credential Demo Certificate' `
    -Subtitle 'Synthetic degree certificate for ProofX demo' `
    -Accent '#1d4ed8' `
    -Lines @(
      "Candidate Name: $name",
      "Degree: $degree",
      "Issuing Source: $issuer",
      "Credential Status: Active",
      "Use Case: Employment / education verification"
    )
  Set-Content -LiteralPath (Join-Path $folder 'degree-certificate.svg') -Value $degreeSvg -Encoding utf8

  $incomeSvg = New-SvgDocument `
    -Title 'Income Verification Demo Certificate' `
    -Subtitle 'Synthetic salary or income proof for presentation only' `
    -Accent '#7c3aed' `
    -Lines @(
      "Account Holder: $name",
      "Annual Income: $income",
      "State: $state",
      "Issuer: $issuer",
      "Verification Note: Supports loan and subsidy checks"
    )
  Set-Content -LiteralPath (Join-Path $folder 'income-certificate.svg') -Value $incomeSvg -Encoding utf8

  $addressSvg = New-SvgDocument `
    -Title 'Address Proof Demo Record' `
    -Subtitle 'Synthetic address proof for ProofX demo' `
    -Accent '#c2410c' `
    -Lines @(
      "Resident Name: $name",
      "State: $state",
      "Issuer: $issuer",
      "Document Note: Address-linked state proof",
      "Demo Only: Not a real civic record"
    )
  Set-Content -LiteralPath (Join-Path $folder 'address-proof.svg') -Value $addressSvg -Encoding utf8

  $supportSvg = New-SvgDocument `
    -Title 'Supporting Verification Note' `
    -Subtitle 'Synthetic summary document for the live demo flow' `
    -Accent '#be123c' `
    -Lines @(
      "Identity: $name",
      "DOB: $dob",
      "Degree: $degree",
      "Income: $income",
      "Expected Outcome: $expected"
    )
  Set-Content -LiteralPath (Join-Path $folder 'supporting-document.svg') -Value $supportSvg -Encoding utf8
}
