const express = require('express');
const router = express.Router();
const { login, validateToken } = require('../controllers/authController');
const { authMiddleware } = require('../auth/jwtUtils');

// 登录接口（不需要认证）
router.post('/login', login);

// Token验证接口（需要认证，用于前端检查token是否有效）
router.get('/validate', authMiddleware, validateToken);

module.exports = router;