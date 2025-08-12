const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

console.log('🔄 Starting simple server...');

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/user/profile', (req, res) => {
  console.log('Profile requested');
  res.json({
    success: true,
    user: {
      id: 1,
      name: '梁景乐',
      email: 'test@example.com',
      gender: 'male',
      birthYear: 1992,
      birthMonth: 9,
      birthDay: 15,
      birthHour: 9,
      birthPlace: '广州，中国',
      isEmailVerified: false,
      profileUpdatedCount: 1,
      createdAt: '2025-07-23 14:59:11',
      updatedAt: '2025-07-23 16:57:37',
      membership: null
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
});

console.log('Server script loaded');
