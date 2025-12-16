# Simple script to execute SQL via Docker
# Usage: .\run_sql_docker.ps1 -Password "your_password"

param(
    [Parameter(Mandatory=$true)]
    [string]$Password
)

$PROJECT_REF = "vlxkhqvsvfjjhathgakp"
$SQL_FILE = "CREATE_EMAIL_VALIDATION_TRIGGER.sql"

Write-Host "🚀 Connecting to Supabase database..." -ForegroundColor Green
Write-Host ""

# Build connection string
$CONNECTION_STRING = "postgresql://postgres:$Password@db.$PROJECT_REF.supabase.co:5432/postgres"

# Execute SQL using Docker
Write-Host "📝 Executing SQL script: $SQL_FILE" -ForegroundColor Cyan
Write-Host ""

docker run --rm -i -v "${PWD}/${SQL_FILE}:/tmp/script.sql:ro" postgres:15 psql "$CONNECTION_STRING" -f /tmp/script.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SUCCESS! SQL executed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Verification Steps:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/database/functions" -ForegroundColor White
    Write-Host "      Should see: validate_email_domain()" -ForegroundColor Gray
    Write-Host "   2. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/database/triggers" -ForegroundColor White
    Write-Host "      Should see: validate_email_domain_trigger on auth.users" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Error executing SQL. Check the error message above." -ForegroundColor Red
    exit 1
}
