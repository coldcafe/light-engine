const fs = require('fs');
const path = require('path');

// 创建项目配置的控制器
const createProject = (req, res) => {
  try {
    const {
      projectName,
      envName = 'prod',
      k8sType,
      k8sConf,
      awsConfig,
      namespace,
      clusterName,
      dockerRepositoryType,
      dockerRepositoryUrl,
      dockerRepositoryUsername,
      dockerRepositoryPassword
    } = req.body;

    // 创建目录
    const dirPath = path.join(__dirname, '../../projects', projectName, envName);
    fs.mkdirSync(dirPath, { recursive: true });

    const config = {
      name: projectName,
      env: envName,
      k8sType  // 保存k8sType到配置文件
    };

    // 处理K8S配置
    if (k8sType === 'standard') {
      fs.writeFileSync(path.join(dirPath, "kube_conf.yml"), k8sConf);
    } else if (k8sType === 'aws') {
      if (!awsConfig) {
        return res.status(400).json({ error: 'AWS configuration is required for Amazon EKS' });
      }
      
      const { region, accessKey, secretKey } = awsConfig;
      
      // 仅在k8sType为aws时，将clusterName保存到config最外层
      if (clusterName) {
        config.clusterName = clusterName;
      }
      
      // AWS配置中不再包含clusterName
      config["aws"] = { 
        region, 
        accessKey, 
        secretKey,
        albs: awsConfig.albs || []
      };
      
    }

    // 创建命名空间
    config['namespace'] = namespace;

    // 处理Docker仓库配置
    config['docker_repository'] = {
      type: dockerRepositoryType,
      url: dockerRepositoryUrl
    };

    if (dockerRepositoryType === 'standard') {
      config['docker_repository']['username'] = dockerRepositoryUsername;
      config['docker_repository']['password'] = dockerRepositoryPassword;
    } else if (dockerRepositoryType === 'aws') {
      if (!config.aws && !awsConfig) {
        return res.status(400).json({ error: 'AWS configuration is required for Amazon ECR' });
      }
      // 如果是AWS ECR但还没有AWS配置，则创建AWS配置
      if (!config.aws) {
        config["aws"] = awsConfig;
      }
    }

    // 保存配置文件
    fs.writeFileSync(path.join(dirPath, "config.json"), JSON.stringify(config, null, 2));

    res.status(200).json({ 
      message: 'Project created successfully',
      projectPath: dirPath 
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project', details: error.message });
  }
};

// 列出所有项目配置的控制器
const listProjects = (req, res) => {
  try {
    const baseDir = path.join(__dirname, '../../projects');
    
    // 检查目录是否存在
    if (!fs.existsSync(baseDir)) {
      return res.status(200).json({ projects: [] });
    }
    
    const projects = [];
    
    // 读取项目目录
    const projectDirs = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    // 遍历每个项目
    for (const projectName of projectDirs) {
      const projectPath = path.join(baseDir, projectName);
      const envDirs = fs.readdirSync(projectPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      // 遍历每个环境
      for (const envName of envDirs) {
        const envPath = path.join(projectPath, envName);
        const configPath = path.join(envPath, 'config.json');
        
        let config = {};
        if (fs.existsSync(configPath)) {
          try {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          } catch (error) {
            console.error(`Error parsing config for ${projectName}/${envName}:`, error);
          }
        }
        
        projects.push({
          projectName,
          envName,
          namespace: config.namespace,
          k8sType: config.k8sType,
          dockerRepositoryType: config.docker_repository?.type,
          createdAt: fs.statSync(envPath).birthtime
        });
      }
    }
    
    res.status(200).json({ projects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to list projects', details: error.message });
  }
};

// 获取单个项目详情的控制器
const getProjectDetail = (req, res) => {
  try {
    const { projectName, envName } = req.params;
    
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    const configPath = path.join(projectPath, 'config.json');
    const kubeConfigPath = path.join(projectPath, 'kube_conf.yml');
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取配置文件
    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      catch (error) {
        console.error(`Error parsing config for ${projectName}/${envName}:`, error);
        return res.status(400).json({ error: 'Invalid project configuration' });
      }
    }
    
    // 构建详细配置响应（移除敏感信息）
    const detailedConfig = {
      namespace: config.namespace || '',
      k8sType: config.k8sType,
      k8sConf: '', // 不再返回kube_conf.yml内容
      // 从config最外层获取clusterName，只有k8sType为aws时才显示
      clusterName: config.k8sType === 'aws' ? config.clusterName || '' : '',
      awsConfig: config.aws ? {
        region: config.aws.region || '',
        accessKey: config.aws.accessKey || '',
        // 不返回secretKey
        secretKey: '',
        // 返回albs配置
        albs: config.aws.albs || []
      } : {
        region: '',
        accessKey: '',
        secretKey: '',
        albs: []
      },
      dockerRepositoryType: config.docker_repository?.type || 'standard',
      dockerRepositoryUrl: config.docker_repository?.url || '',
      dockerRepositoryUsername: config.docker_repository?.username || '',
      dockerRepositoryPassword: config.docker_repository?.password || ''
    };
    
    // 不再读取和返回kubeconfig文件内容，保持k8sConf为空字符串
    
    res.status(200).json(detailedConfig);
  }
  catch (error) {
    console.error('Get project detail error:', error);
    res.status(500).json({ error: 'Failed to get project detail', details: error.message });
  }
};

// 编辑项目配置的控制器
const editProject = (req, res) => {
  try {
    const { projectName, envName } = req.params;
    const updates = req.body;
    
    const projectPath = path.join(__dirname, '../../projects', projectName, envName);
    const configPath = path.join(projectPath, 'config.json');
    const kubeConfigPath = path.join(projectPath, 'kube_conf.yml');
    
    // 检查项目是否存在
    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // 读取现有配置
    let config = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (error) {
        console.error(`Error parsing config for ${projectName}/${envName}:`, error);
        return res.status(400).json({ error: 'Invalid project configuration' });
      }
    }
    
    // 更新配置
    if (updates.namespace && updates.namespace !== config.namespace) {
      config['namespace'] = updates.namespace;
    }
    
    // 更新Docker仓库配置
    if (updates.dockerRepositoryType || updates.dockerRepositoryUrl || 
        updates.dockerRepositoryUsername || updates.dockerRepositoryPassword) {
      if (!config['docker_repository']) {
        config['docker_repository'] = {};
      }
      
      if (updates.dockerRepositoryType) {
        config['docker_repository']['type'] = updates.dockerRepositoryType;
      }
      if (updates.dockerRepositoryUrl) {
        config['docker_repository']['url'] = updates.dockerRepositoryUrl;
      }
      if (updates.dockerRepositoryUsername) {
        config['docker_repository']['username'] = updates.dockerRepositoryUsername;
      }
      if (updates.dockerRepositoryPassword) {
        config['docker_repository']['password'] = updates.dockerRepositoryPassword;
      }
    }
    
    // 更新AWS配置（如果需要）- 注意：不更新clusterName
    let awsConfigChanged = false;
    if (updates.awsConfig) {
      if (!config.aws) {
        config.aws = {};
      }
      
      const { region, accessKey, secretKey } = updates.awsConfig;
      
      // 只有当提供了新值时才更新
      if (region && region !== config.aws.region) {
        config.aws.region = region;
        awsConfigChanged = true;
      }
      if (accessKey && accessKey !== config.aws.accessKey) {
        config.aws.accessKey = accessKey;
        awsConfigChanged = true;
      }
      if (secretKey && secretKey !== config.aws.secretKey) {
        config.aws.secretKey = secretKey;
        awsConfigChanged = true;
      }
      // 更新ALBs配置
      if (updates.awsConfig.albs !== undefined) {
        config.aws.albs = updates.awsConfig.albs;
        awsConfigChanged = true;
      }
    }
    
    // 更新标准K8S配置 - 只有提供了非空的新值时才更新
    if (updates.k8sConf && updates.k8sConf.trim() && config.k8sType === 'standard') {
      fs.writeFileSync(kubeConfigPath, updates.k8sConf);
    }
    
    // 保存更新后的配置
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    res.status(200).json({
      message: 'Project updated successfully',
      projectName,
      envName
    });
  } catch (error) {
    console.error('Edit project error:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
};

module.exports = {
  createProject,
  listProjects,
  editProject,
  getProjectDetail
};