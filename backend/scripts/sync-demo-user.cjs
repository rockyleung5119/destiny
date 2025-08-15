
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '..', 'database', 'destiny.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    return;
  }
  console.log('Connected to the local SQLite database.');
});

const emailToFind = 'demo@example.com';

db.get('SELECT * FROM users WHERE email = ?', [emailToFind], (err, row) => {
  if (err) {
    console.error('Error querying the database', err.message);
    db.close();
    return;
  }

  if (row) {
    console.log('Found user:', row.email);
    const columns = Object.keys(row).join(', ');
    const values = Object.values(row).map(val => {
      if (val === null) return 'NULL';
      // Escape single quotes by doubling them up for SQL
      return typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val;
    }).join(', ');

    const insertStatement = `INSERT INTO users (${columns}) VALUES (${values});`;
    console.log('\n--- SQL INSERT Statement ---');
    console.log(insertStatement);
    console.log('\n--- Copy the statement above and run it with Wrangler D1 ---');

  } else {
    console.log(`User with email ${emailToFind} not found.`);
  }

  db.close();
});
