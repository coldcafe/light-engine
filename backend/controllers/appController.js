const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 辅助函数：读取项目配置文件
const readProjectConfig = (projectPath) => {
  const configPath = path.join(projectPath, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Project configuration not found');
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
};

// 辅助函数：保存项目配置文件
const saveProjectConfig = (projectPath, config) => {
  const configPath = path.join(projectPath, 'config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};

// 辅助函数：保存TLS证书和密钥文件
const saveTlsFiles = (projectPath, appName, certContent, keyContent) => {
  // 创建TLS目录
  const tlsDir = path.join(projectPath, 'tls', appName);
  if (!fs.existsSync(tlsDir)) {
    fs.mkdirSync(tlsDir, { recursive: true });
  }
  
  // 保存证书和密钥文件
  const certPath = path.join(tlsDir, 'cert.pem');
  const keyPath = path.join(tlsDir, 'key.pem');
  
  if (certContent) {
    fs.writeFileSync(certPath, certContent);
  }
  if (keyContent) {
    fs.writeFileSync(keyPath, keyContent);
  }
  
  // 返回相对路径
  return {
    certPath: `tls/${appName}/cert.pem`,
    keyPath: `tls/${appName}/key.pem`
  };
};

// 辅助函数：保存envs文件
const saveEnvsFile = (projectPath, appName, envsContent) => {
  // 创建envs目录
  const envsDir = path.join(projectPath, 'envs');
  if (!fs.existsSync(envsDir)) {
    fs.mkdirSync(envsDir, { recursive: true });
  }
  
  // 保存envs文件
  const envsPath = path.join(envsDir, appName + '.env');
  if (envsContent) {
    fs.writeFileSync(envsPath, envsContent);
  }
};

// 创建app的控制器
const createApp = (req, res) => {
  try {
    const { projectName, envName } = req.params;
    let appConfig = req.body;
    
    // 获取项目路径
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取项目配置
    let projectConfig = readProjectConfig(projectPath);
    
    // 初始化app对象（如果不存在）
    if (!projectConfig.app) {
      projectConfig.app = {};
    }
    
    // 检查app是否已存在
    if (projectConfig.app[appConfig.appName]) {
      return res.status(400).json({ error: 'App with this name already exists' });
    }
    
    // 处理TLS证书和密钥
    if (appConfig.ingress && appConfig.ingress.tls) {
      const { cert, key } = appConfig.ingress.tls;
      if (cert && key) {
        // 保存证书和密钥到文件
        const tlsPaths = saveTlsFiles(projectPath, appConfig.appName, cert, key);
        // 更新配置为文件路径
        appConfig.ingress.tls.cert = tlsPaths.certPath;
        appConfig.ingress.tls.key = tlsPaths.keyPath;
      }
    }
    
    // 处理envs文件
    if (appConfig.envsContent) {
      saveEnvsFile(projectPath, appConfig.appName, appConfig.envsContent);
      delete appConfig.envsContent;
    }
    
    // 添加新app配置
    const appName = appConfig.appName;
    appConfig.envSecret = appName;
    delete appConfig.appName;
    if (appConfig.useImagePullSecret) {
      appConfig.imagePullSecret = projectName + '-regcred';
    }
    projectConfig.app[appName] = appConfig;
    
    // 保存更新后的项目配置
    saveProjectConfig(projectPath, projectConfig);
    
    res.status(200).json({
      message: 'App created successfully',
      appName: appName
    });
  } catch (error) {
    console.error('Create app error:', error);
    res.status(500).json({ error: 'Failed to create app', details: error.message });
  }
};

// 列出指定项目和环境下的所有app
const listApps = (req, res) => {
  try {
    const { projectName, envName } = req.params;
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取项目配置
    let projectConfig = readProjectConfig(projectPath);
    
    // 获取apps数组（如果不存在则返回空数组）
    const apps =  [];

    if (projectConfig.app) {
      for (const appKey of Object.keys(projectConfig.app)) {
        const app = projectConfig.app[appKey];
        app.appName = appKey;
        apps.push(app);
      }
    }
    
    
    // 格式化响应数据
    const formattedApps = apps.map(app => ({
      appName: app.appName,
      replicas: app.replicas,
      ingress: app.ingress,
    }));
    
    res.status(200).json({ apps: formattedApps });
  } catch (error) {
    console.error('List apps error:', error);
    res.status(500).json({ error: 'Failed to list apps', details: error.message });
  }
};

// 获取单个app详情
const getAppDetail = (req, res) => {
  try {
    const { projectName, envName, appName } = req.params;
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取项目配置
    let projectConfig = readProjectConfig(projectPath);
    
    // 查找指定的app
    const app = projectConfig.app[appName];
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }
    app.appName = appName;
    if (app.ingress && app.ingress.type === 'default') {
      app.ingress.tls.cert = '';
      app.ingress.tls.key = '';
    }
    res.status(200).json(app);
  } catch (error) {
    console.error('Get app detail error:', error);
    res.status(500).json({ error: 'Failed to get app detail', details: error.message });
  }
};

// 编辑app配置
const editApp = (req, res) => {
  try {
    const { projectName, envName, appName } = req.params;
    let updates = req.body;
    
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取项目配置
    let projectConfig = readProjectConfig(projectPath);
    
    // 查找app
    const app = projectConfig.app[appName];
    if (!app) {
      return res.status(404).json({ error: 'App not found' });
    }
    
    // 处理TLS证书和密钥
    if (updates.ingress && updates.ingress.tls) {
      const { cert, key } = updates.ingress.tls;
      if (cert && key && 
          (cert.includes('-----BEGIN CERTIFICATE-----') || 
           cert.includes('-----BEGIN RSA PRIVATE KEY-----'))) {
        // 如果提供的是证书内容而不是路径，保存到文件
        const tlsPaths = saveTlsFiles(projectPath, appName, cert, key);
        // 更新配置为文件路径
        updates.ingress.tls.cert = tlsPaths.certPath;
        updates.ingress.tls.key = tlsPaths.keyPath;
      }
    }
    // 处理envs文件
    if (updates.envsContent) {
      saveEnvsFile(projectPath, appName, updates.envsContent);
      delete updates.envsContent;
    }

    delete updates.appName;
    if (updates.useImagePullSecret) {
      app.imagePullSecret = projectName + '-regcred';
    } else {
      delete app.imagePullSecret;
    }
    
    // 更新app配置
    projectConfig.app[appName] = Object.assign(app, updates);
    
    // 保存更新后的项目配置
    saveProjectConfig(projectPath, projectConfig);
    
    res.status(200).json({
      message: 'App updated successfully',
      appName
    });
  } catch (error) {
    console.error('Edit app error:', error);
    res.status(500).json({ error: 'Failed to update app', details: error.message });
  }
};

// 删除app
const deleteApp = (req, res) => {
  try {
    const { projectName, envName, appName } = req.params;
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取项目配置
    let projectConfig = readProjectConfig(projectPath);
    
    // 检查app是否存在
    if (!projectConfig.app || !projectConfig.app[appName]) {
      return res.status(404).json({ error: 'App not found' });
    }
    
    // 删除TLS相关文件
    const tlsDir = path.join(projectPath, 'tls', appName);
    if (fs.existsSync(tlsDir)) {
      try {
        // 删除证书和密钥文件
        if (fs.existsSync(path.join(tlsDir, 'cert.pem'))) {
          fs.unlinkSync(path.join(tlsDir, 'cert.pem'));
        }
        if (fs.existsSync(path.join(tlsDir, 'key.pem'))) {
          fs.unlinkSync(path.join(tlsDir, 'key.pem'));
        }
        // 删除TLS目录
        fs.rmdirSync(tlsDir);
      } catch (fileError) {
        console.error('Error deleting TLS files:', fileError);
        // 继续执行，不中断删除app的操作
      }
    }
    
    // 删除app
    delete projectConfig.app[appName];
    
    // 保存更新后的项目配置
    saveProjectConfig(projectPath, projectConfig);
    
    res.status(200).json({
      message: 'App deleted successfully',
      appName
    });
  } catch (error) {
    console.error('Delete app error:', error);
    res.status(500).json({ error: 'Failed to delete app', details: error.message });
  }
};

const { deploy } = require('../../scripts/deploy');

const deployApp = (req, res) => {
  try {
    const { projectName, envName, appName } = req.params;
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取项目配置
    let projectConfig = readProjectConfig(projectPath);
    // 检查app是否存在
    if (!projectConfig.app || !projectConfig.app[appName]) {
      return res.status(404).json({ error: 'App not found' });
    }
    if (!projectConfig.app[appName].gitUrl) {
      return res.status(400).json({ error: 'App gitUrl not found' });
    }
    const sourceCodePath = path.join(projectPath, 'apps', appName);
    if (fs.existsSync(sourceCodePath)) {
      fs.rmdirSync(sourceCodePath, { recursive: true });
    }
    execSync(`git clone -b ${projectConfig.app[appName].gitBranch || 'main'} --depth 1 ${projectConfig.app[appName].gitUrl} ${sourceCodePath}`);

    const imageTag = new Date().getTime().toString();
    deploy(projectName, envName, appName, imageTag, sourceCodePath);
    
    res.status(200).json({
      message: 'App deployed successfully',
      appName
    });
  } catch (error) {
    console.error('Deploy app error:', error);
    res.status(500).json({ error: 'Failed to deploy app', details: error.message });
  }
};

module.exports = {
  createApp,
  listApps,
  getAppDetail,
  editApp,
  deleteApp,
  deployApp
};