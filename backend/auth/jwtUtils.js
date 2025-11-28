const jwt = require('jsonwebtoken');

// JWT密钥（在生产环境中应该使用环境变量）
const JWT_SECRET = 'your_jwt_secret_key_change_in_production';

// token过期时间（24小时）
const JWT_EXPIRES_IN = '24h';

// 生成JWT token
const generateToken = (username) => {
  const payload = {
    username
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// JWT认证中间件
const authMiddleware = (req, res, next) => {
  // 从header中获取token
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  // 检查Bearer前缀
  const [bearer, token] = authHeader.split(' ');
  
  if (bearer !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
  
  try {
    // 验证token
    const decoded = verifyToken(token);
    // 将用户信息存储在request对象中
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware
};