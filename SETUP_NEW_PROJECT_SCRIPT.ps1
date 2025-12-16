# PowerShell script to set up new Supabase project
# Usage: .\SETUP_NEW_PROJECT_SCRIPT.ps1 -ProjectUrl "https://xxxxx.supabase.co" -AnonKey "eyJ..." -ServiceRoleKey "eyJ..." -DbPassword "password"

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$AnonKey,
    
    [Parameter(Mandatory=$true)]
    [string]$ServiceRoleKey,
    
    [Parameter(Mandatory=$false)]
    [string]$DbPassword = ""
)

# Extract project ID from URL
$projectId = ($ProjectUrl -replace 'https://', '' -replace '\.supabase\.co', '')

Write-Host "🚀 Setting up new Supabase project: $projectId" -ForegroundColor Green
Write-Host ""

# Step 1: Create .env file
Write-Host "📝 Step 1: Creating .env file..." -ForegroundColor Cyan
$envContent = @"
REACT_APP_SUPABASE_URL=$ProjectUrl
REACT_APP_SUPABASE_ANON_KEY=$AnonKey
HOST=0.0.0.0
PORT=3000
"@

$envContent | Out-File -FilePath "my-app\.env" -Encoding utf8 -Force
Write-Host "✅ .env file created!" -ForegroundColor Green
Write-Host ""

# Step 2: Update MCP configuration
Write-Host "📝 Step 2: Updating MCP configuration..." -ForegroundColor Cyan
$mcpConfig = @{
    mcpServers = @{
        supabase = @{
            url = "https://mcp.supabase.com/mcp?project_ref=$projectId"
            headers = @{
                Authorization = "Bearer $ServiceRoleKey"
            }
        }
    }
}

$mcpJson = $mcpConfig | ConvertTo-Json -Depth 10
$mcpJson | Out-File -FilePath "$env:USERPROFILE\.cursor\mcp.json" -Encoding utf8 -Force
Write-Host "✅ MCP configuration updated!" -ForegroundColor Green
Write-Host "   ⚠️  RESTART CURSOR for MCP changes to take effect" -ForegroundColor Yellow
Write-Host ""

# Step 3: Execute SQL setup
if ($DbPassword) {
    Write-Host "📝 Step 3: Executing SQL setup..." -ForegroundColor Cyan
    
    $connectionString = "postgresql://postgres:$DbPassword@db.$projectId.supabase.co:5432/postgres?sslmode=require"
    
    docker run --rm --network host -i -v "${PWD}/FINAL_COMPLETE_SETUP.sql:/tmp/setup.sql:ro" postgres:15 psql "$connectionString" -f /tmp/setup.sql
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SQL setup executed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ SQL setup failed. Check the error above." -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Step 3: Skipping SQL setup (no database password provided)" -ForegroundColor Yellow
    Write-Host "   To run SQL setup, provide -DbPassword parameter" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart Cursor for MCP changes" -ForegroundColor White
Write-Host "  2. Run SQL setup if not done automatically" -ForegroundColor White
Write-Host "  3. Restart your React app" -ForegroundColor White
Write-Host "  4. Test login" -ForegroundColor White






