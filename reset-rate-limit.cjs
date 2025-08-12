// 重置限流缓存
console.log('🔄 重置限流缓存...');

// 由于使用的是内存限流器，重启后端服务即可重置
console.log('💡 内存限流器会在后端服务重启后自动重置');
console.log('🚀 建议重启后端服务来清除限流状态');

// 或者等待1小时让限流窗口自然过期
const now = new Date();
const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
console.log('⏰ 或者等待到', nextHour.toLocaleString(), '限流窗口自然过期');

console.log('\n📊 当前限流设置:');
console.log('- 付费用户: 10次/小时');
console.log('- 免费用户: 1次/小时');
console.log('- 窗口时间: 1小时');

console.log('\n✅ 测试用户是年度会员，应该有10次/小时的限额');
