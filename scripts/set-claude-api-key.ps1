param(
  [Parameter(Mandatory = $false, Position = 0)]
  [string]$ApiKey
)

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  $ApiKey = Read-Host "Enter your Anthropic API key"
}

$ApiKey = $ApiKey.Trim()

if ([string]::IsNullOrWhiteSpace($ApiKey)) {
  throw "API key cannot be empty."
}

$env:ANTHROPIC_API_KEY = $ApiKey
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $ApiKey, "User")

Write-Host "Claude API key configured for your Windows user account."
Write-Host "Open a new terminal and run: claude"
