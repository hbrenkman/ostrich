# Get Supabase credentials from environment variables
$SUPABASE_URL = $env:NEXT_PUBLIC_SUPABASE_URL
$SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Error "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
}

# Read the SQL file
$sqlContent = Get-Content -Path ".\scripts\create_projects_tables.sql" -Raw

# Create the request body
$body = @{
    query = $sqlContent
} | ConvertTo-Json

# Make the request to Supabase
$headers = @{
    "apikey" = $SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    Write-Host "Successfully applied database changes"
} catch {
    Write-Error "Failed to apply database changes: $_"
    exit 1
} 