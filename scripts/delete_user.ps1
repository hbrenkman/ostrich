# Get the email from command line argument
param(
    [Parameter(Mandatory=$true)]
    [string]$Email
)

# Read environment variables from .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
} else {
    Write-Error "Could not find .env.local file"
    exit 1
}

# Get Supabase credentials from environment variables
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Error "Missing Supabase environment variables in .env.local. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
    exit 1
}

# Create the request body
$body = @{
    query = "SELECT delete_user('$Email');"
} | ConvertTo-Json

# Make the request to Supabase
$headers = @{
    "apikey" = $SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/delete_user" -Method Post -Headers $headers -Body $body
    Write-Host "Successfully deleted user $Email and all related data"
} catch {
    Write-Error "Failed to delete user: $_"
    exit 1
} 