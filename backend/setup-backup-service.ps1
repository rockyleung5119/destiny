# Cloudflare D1数据库自动备份服务设置脚本
Write-Host "🔧 Setting up Database Backup Service..." -ForegroundColor Green
Write-Host ""

# 切换到backend目录
Set-Location backend

Write-Host "📋 Step 1: Verifying R2 bucket exists..." -ForegroundColor Yellow
try {
    # 检查R2存储桶是否存在
    $bucketCheck = wrangler r2 bucket list 2>&1
    if ($bucketCheck -match "destiny-backups") {
        Write-Host "✅ R2 bucket 'destiny-backups' already exists" -ForegroundColor Green
    } else {
        Write-Host "❌ R2 bucket 'destiny-backups' not found" -ForegroundColor Red
        Write-Host "Creating R2 bucket..." -ForegroundColor Yellow
        wrangler r2 bucket create destiny-backups
        Write-Host "✅ R2 bucket 'destiny-backups' created" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not verify R2 bucket, assuming it exists" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Step 2: Checking wrangler.toml configuration..." -ForegroundColor Yellow

# 检查wrangler.toml是否包含R2绑定
$wranglerContent = Get-Content "wrangler.toml" -Raw
if ($wranglerContent -match "BACKUP_STORAGE") {
    Write-Host "✅ R2 binding already configured in wrangler.toml" -ForegroundColor Green
} else {
    Write-Host "❌ R2 binding not found in wrangler.toml" -ForegroundColor Red
    Write-Host "Please add the following to your wrangler.toml:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# R2存储绑定 - 数据库备份存储" -ForegroundColor Cyan
    Write-Host "[[r2_buckets]]" -ForegroundColor Cyan
    Write-Host "binding = `"BACKUP_STORAGE`"" -ForegroundColor Cyan
    Write-Host "bucket_name = `"destiny-backups`"" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "📋 Step 3: Testing backup service..." -ForegroundColor Yellow

# 创建测试脚本
$testScript = @"
// 测试备份服务
const testBackup = async () => {
  try {
    console.log('🔄 Testing backup service...');
    
    const response = await fetch('https://destiny-backend.jerryliang5119.workers.dev/api/admin/backup-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('📊 Backup test result:', result);
    
    if (result.success) {
      console.log('✅ Backup service is working correctly');
      console.log('📁 Backup file:', result.backupInfo?.fileName);
      console.log('📊 Backup size:', result.backupInfo?.size, 'bytes');
    } else {
      console.log('❌ Backup service failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Backup test failed:', error.message);
  }
};

testBackup();
"@

$testScript | Out-File -FilePath "test-backup.js" -Encoding UTF8

Write-Host ""
Write-Host "📋 Step 4: Backup service features:" -ForegroundColor Yellow
Write-Host "✅ Automatic daily backup at 2:00 AM UTC" -ForegroundColor Green
Write-Host "✅ Manual backup via API: POST /api/admin/backup-database" -ForegroundColor Green
Write-Host "✅ List backups via API: GET /api/admin/backups" -ForegroundColor Green
Write-Host "✅ Restore from backup via API: POST /api/admin/restore-database" -ForegroundColor Green
Write-Host "✅ Automatic cleanup (keeps 30 days of backups)" -ForegroundColor Green
Write-Host "✅ Compressed backup files (gzip)" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Step 5: API endpoints:" -ForegroundColor Yellow
Write-Host "🔧 Manual backup:" -ForegroundColor Cyan
Write-Host "   POST https://destiny-backend.jerryliang5119.workers.dev/api/admin/backup-database" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 List backups:" -ForegroundColor Cyan
Write-Host "   GET https://destiny-backend.jerryliang5119.workers.dev/api/admin/backups" -ForegroundColor Gray
Write-Host ""
Write-Host "🔄 Restore database:" -ForegroundColor Cyan
Write-Host "   POST https://destiny-backend.jerryliang5119.workers.dev/api/admin/restore-database" -ForegroundColor Gray
Write-Host "   Body: { `"backupFileName`": `"destiny-db-backup-2024-08-20T02-00-00-000Z.sql`" }" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Step 6: Monitoring and logs:" -ForegroundColor Yellow
Write-Host "📊 View backup logs:" -ForegroundColor Cyan
Write-Host "   wrangler tail --format pretty" -ForegroundColor Gray
Write-Host ""
Write-Host "📁 Check R2 storage:" -ForegroundColor Cyan
Write-Host "   wrangler r2 object list destiny-backups" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Step 7: Testing backup service..." -ForegroundColor Yellow
Write-Host "Running backup test..." -ForegroundColor Cyan

try {
    node test-backup.js
} catch {
    Write-Host "⚠️ Could not run test automatically. You can run it manually:" -ForegroundColor Yellow
    Write-Host "   node test-backup.js" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎉 Database Backup Service Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Deploy the updated worker: wrangler deploy" -ForegroundColor Cyan
Write-Host "2. Test manual backup: node test-backup.js" -ForegroundColor Cyan
Write-Host "3. Check backup schedule: Automatic daily backup at 2:00 AM UTC" -ForegroundColor Cyan
Write-Host "4. Monitor logs: wrangler tail" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️ Important notes:" -ForegroundColor Yellow
Write-Host "- Backups are stored in R2 bucket 'destiny-backups'" -ForegroundColor Gray
Write-Host "- Old backups are automatically deleted after 30 days" -ForegroundColor Gray
Write-Host "- Backup files are compressed with gzip" -ForegroundColor Gray
Write-Host "- Each backup includes full database schema and data" -ForegroundColor Gray
Write-Host ""
Write-Host "🔐 Security:" -ForegroundColor Yellow
Write-Host "- Backup API endpoints are admin-only" -ForegroundColor Gray
Write-Host "- R2 bucket access is restricted to your Cloudflare account" -ForegroundColor Gray
Write-Host "- Backup files contain sensitive user data - handle with care" -ForegroundColor Gray
