const { findUser, verifyPassword } = require('../auth/userManager');
const { generateToken } = require('../auth/jwtUtils');

// 处理登录请求
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // 查找用户
    const user = findUser(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(user, password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // 生成JWT token
    const token = generateToken(username);
    
    // 返回token
    res.status(200).json({
      message: 'Login successful',
      token,
      username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 验证token有效性（可选的健康检查端点）
const validateToken = (req, res) => {
  res.status(200).json({
    valid: true,
    user: req.user
  });
};

module.exports = {
  login,
  validateToken
};