# PowerShell script to execute CREATE_ADMIN_USER_AND_POLICIES.sql via Docker
param(
    [Parameter(Mandatory=$false)]
    [string]$DatabasePassword
)

$PROJECT_REF = "vlxkhqvsvfjjhathgakp"
$SQL_FILE = "CREATE_ADMIN_USER_AND_POLICIES.sql"

if (-not $DatabasePassword) {
    Write-Host "⚠️  Database password required!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To get your database password:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database" -ForegroundColor White
    Write-Host "2. Look for 'Connection string' or 'Database password'" -ForegroundColor White
    Write-Host ""
    $DatabasePassword = Read-Host "Enter your Supabase database password" -AsSecureString
    $DatabasePassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DatabasePassword)
    )
}

$CONNECTION_STRING = "postgresql://postgres:$DatabasePassword@db.$PROJECT_REF.supabase.co:5432/postgres"

Write-Host ""
Write-Host "🚀 Executing SQL via Docker..." -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $SQL_FILE)) {
    Write-Host "❌ Error: $SQL_FILE not found!" -ForegroundColor Red
    exit 1
}

docker run --rm -i `
    -v "${PWD}/${SQL_FILE}:/tmp/script.sql" `
    postgres:15 `
    psql "$CONNECTION_STRING" -f /tmp/script.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ SQL executed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Admin user setup complete!" -ForegroundColor Cyan
    Write-Host "You can now login with:" -ForegroundColor White
    Write-Host "  Email: janmikyllatabamo4165@gmail.com" -ForegroundColor White
    Write-Host "  Password: 123456" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Error executing SQL. Check the error message above." -ForegroundColor Red
    exit 1
}



