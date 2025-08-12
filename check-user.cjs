const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database', 'destiny.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking test user...');

db.get(`
  SELECT id, email, name, gender, birth_year, birth_month, birth_day, birth_hour, birth_place, 
         is_email_verified, profile_updated_count, created_at, updated_at
  FROM users WHERE email = ?
`, ['test@example.com'], (err, user) => {
  if (err) {
    console.error('Error:', err);
  } else if (user) {
    console.log('Test user found:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log('Test user not found');
  }
  
  db.close();
});
