const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const USER_FILE_PATH = path.join(__dirname, 'users.json');

// 读取用户文件
const readUsers = () => {
  try {
    const data = fs.readFileSync(USER_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return { users: [] };
  }
};

// 写入用户文件
const writeUsers = (usersData) => {
  try {
    fs.writeFileSync(USER_FILE_PATH, JSON.stringify(usersData, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
    throw error;
  }
};

// 初始化默认管理员用户
const initializeAdminUser = async () => {
  const usersData = readUsers();
  
  // 检查是否已有admin用户
  const adminExists = usersData.users.some(user => user.username === 'admin');
  
  if (!adminExists) {
    // 生成密码哈希
    const hashedPassword = await bcrypt.hash('admin', 10);
    
    // 添加admin用户
    usersData.users.push({
      username: 'admin',
      password: hashedPassword
    });
    
    writeUsers(usersData);
    console.log('Admin user initialized successfully');
  }
};

// 查找用户
const findUser = (username) => {
  const usersData = readUsers();
  return usersData.users.find(user => user.username === username);
};

// 验证密码
const verifyPassword = async (user, password) => {
  return await bcrypt.compare(password, user.password);
};

// 添加新用户（预留功能）
const addUser = async (username, password) => {
  const usersData = readUsers();
  
  // 检查用户是否已存在
  if (usersData.users.some(user => user.username === username)) {
    throw new Error('User already exists');
  }
  
  // 生成密码哈希
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 添加新用户
  usersData.users.push({
    username,
    password: hashedPassword
  });
  
  writeUsers(usersData);
};

module.exports = {
  initializeAdminUser,
  findUser,
  verifyPassword,
  addUser
};