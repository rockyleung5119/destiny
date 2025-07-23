import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// 注册用户
export const registerUser = async (userData) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { name, email, password, gender, birthYear, birthMonth, birthDay, birthHour } = userData;
      
      // 检查邮箱是否已存在
      db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
          reject({ error: 'Database error', details: err.message });
          return;
        }
        
        if (row) {
          reject({ error: 'Email already exists' });
          return;
        }
        
        // 加密密码
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // 插入新用户
        db.run(
          `INSERT INTO users (name, email, password, gender, birth_year, birth_month, birth_day, birth_hour) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, email, hashedPassword, gender, birthYear, birthMonth, birthDay, birthHour],
          function(err) {
            if (err) {
              reject({ error: 'Failed to create user', details: err.message });
              return;
            }
            
            // 生成JWT token
            const token = jwt.sign(
              { userId: this.lastID, email: email },
              JWT_SECRET,
              { expiresIn: '7d' }
            );
            
            resolve({
              success: true,
              message: 'User registered successfully',
              user: {
                id: this.lastID,
                name,
                email,
                gender,
                birthYear,
                birthMonth,
                birthDay,
                birthHour
              },
              token
            });
          }
        );
      });
    } catch (error) {
      reject({ error: 'Registration failed', details: error.message });
    }
  });
};

// 登录用户
export const loginUser = async (email, password) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        reject({ error: 'Database error', details: err.message });
        return;
      }
      
      if (!user) {
        reject({ error: 'Invalid email or password' });
        return;
      }
      
      try {
        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          reject({ error: 'Invalid email or password' });
          return;
        }
        
        // 生成JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        resolve({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            gender: user.gender,
            birthYear: user.birth_year,
            birthMonth: user.birth_month,
            birthDay: user.birth_day,
            birthHour: user.birth_hour
          },
          token
        });
      } catch (error) {
        reject({ error: 'Login failed', details: error.message });
      }
    });
  });
};

// 验证JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// 中间件：验证用户身份
export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// 获取用户信息
export const getUserProfile = async (userId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, email, gender, birth_year, birth_month, birth_day, birth_hour, created_at FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) {
        reject({ error: 'Database error', details: err.message });
        return;
      }

      if (!user) {
        reject({ error: 'User not found' });
        return;
      }

      resolve({
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        birthYear: user.birth_year,
        birthMonth: user.birth_month,
        birthDay: user.birth_day,
        birthHour: user.birth_hour,
        createdAt: user.created_at
      });
    });
  });
};
