const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const projectRoutes = require('./routes/projectRoutes');
const appRoutes = require('./routes/appRoutes');
const authRoutes = require('./routes/authRoutes');
const { initializeAdminUser } = require('./auth/userManager');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/apps', appRoutes);

// 启动服务器
async function startServer() {
  try {
    // 初始化admin用户
    await initializeAdminUser();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

// 启动服务器
startServer();