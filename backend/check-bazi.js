const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.all(`SELECT 
  id, 
  user_id, 
  analysis_type, 
  LENGTH(analysis_result) as len, 
  substr(analysis_result, -300) as ending 
FROM fortune_analyses 
WHERE analysis_type = 'bazi' 
ORDER BY created_at DESC 
LIMIT 2`, [], (err, rows) => {
  if (err) {
    console.error('错误:', err);
  } else {
    console.log('八字分析记录:');
    rows.forEach((row, i) => {
      console.log(`记录${i+1}: ID=${row.id}, 长度=${row.len}字符`);
      console.log('结尾内容:');
      console.log(row.ending);
      console.log('---');
    });
  }
  db.close();
});
