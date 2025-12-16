# PowerShell script to execute SQL via Docker PostgreSQL client
# This connects to your remote Supabase database and runs the SQL

param(
    [Parameter(Mandatory=$false)]
    [string]$DatabasePassword
)

# Supabase connection details
$PROJECT_REF = "vlxkhqvsvfjjhathgakp"
$SQL_FILE = "CREATE_EMAIL_VALIDATION_TRIGGER.sql"

# Check if password was provided
if (-not $DatabasePassword) {
    Write-Host "⚠️  Database password required!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your database password:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database" -ForegroundColor White
    Write-Host "2. Look for 'Connection string' or 'Database password'" -ForegroundColor White
    Write-Host "3. Use the password from the connection string" -ForegroundColor White
    Write-Host ""
    $DatabasePassword = Read-Host "Enter your Supabase database password" -AsSecureString
    $DatabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DatabasePassword)
    )
}

# Connection string format for Supabase
# Using direct connection (port 5432) for DDL operations
$CONNECTION_STRING = "postgresql://postgres:$DatabasePassword@db.$PROJECT_REF.supabase.co:5432/postgres"

Write-Host ""
Write-Host "🚀 Executing SQL via Docker..." -ForegroundColor Green
Write-Host ""

# Check if SQL file exists
if (-not (Test-Path $SQL_FILE)) {
    Write-Host "❌ Error: $SQL_FILE not found!" -ForegroundColor Red
    exit 1
}

# Execute SQL using Docker PostgreSQL client
docker run --rm -i `
    -v "${PWD}/${SQL_FILE}:/tmp/script.sql" `
    postgres:15 `
    psql "$CONNECTION_STRING" -f /tmp/script.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SQL executed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verification:" -ForegroundColor Cyan
    Write-Host "1. Go to Supabase Dashboard → Database → Functions" -ForegroundColor White
    Write-Host "   Should see: validate_email_domain()" -ForegroundColor White
    Write-Host "2. Go to Database → Triggers" -ForegroundColor White
    Write-Host "   Should see: validate_email_domain_trigger" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Error executing SQL. Check the error message above." -ForegroundColor Red
    exit 1
}






