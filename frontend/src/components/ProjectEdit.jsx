import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProjectEdit = () => {
  const { projectName, envName } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
      namespace: '',
      k8sType: 'standard',
      k8sConf: '',
      clusterName: '', // clusterName移至顶层
      awsConfig: {
        region: '',
        accessKey: '',
        secretKey: ''
      },
      dockerRepositoryType: 'standard',
      dockerRepositoryUrl: '',
      dockerRepositoryUsername: '',
      dockerRepositoryPassword: ''
    });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProjectData();
  }, [projectName, envName]);

  const loadProjectData = async () => {
        try {
          setLoading(true);
          // 由于我们没有专门的获取单个项目详情的API，我们需要获取完整配置
          // 从后端获取项目列表
          const response = await fetch('/api/projects/list');
          if (!response.ok) {
            throw new Error('Failed to fetch project data');
          }
          const data = await response.json();
          const project = data.projects.find(
            p => p.projectName === projectName && p.envName === envName
          );
          
          if (project) {
            // 从文件系统获取完整配置
            // 在实际应用中，这里应该通过一个专门的API来获取这些详细配置
            const configResponse = await fetch(`/api/projects/detail/${projectName}/${envName}`);
            let detailedConfig = {};
            
            if (configResponse.ok) {
              detailedConfig = await configResponse.json();
            } else {
              // 如果没有专门的detail API，我们尝试通过一个额外的API请求来获取配置
              console.warn('No detail API available, using basic information');
            }
            
            // 构建表单数据
            const newFormData = {
              namespace: project.namespace || '',
              k8sType: project.k8sType,
              k8sConf: '', // 不显示kube_conf内容
              clusterName: detailedConfig.clusterName || '', // 直接从response顶层获取clusterName
              awsConfig: detailedConfig.awsConfig ? {
                region: detailedConfig.awsConfig.region || '',
                accessKey: detailedConfig.awsConfig.accessKey || '',
                secretKey: '' // 不显示AWS Secret Key
              } : {
                region: '',
                accessKey: '',
                secretKey: ''
              },
              dockerRepositoryType: project.dockerRepositoryType || 'standard',
              dockerRepositoryUrl: detailedConfig.dockerRepositoryUrl || '',
              dockerRepositoryUsername: detailedConfig.dockerRepositoryUsername || '',
              dockerRepositoryPassword: detailedConfig.dockerRepositoryPassword || ''
            };
            
            setFormData(newFormData);
          }
        } catch (err) {
          setError(err.message);
          console.error('Error loading project:', err);
        } finally {
          setLoading(false);
        }
      };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAwsConfigChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.namespace.trim()) {
      errors.namespace = 'K8S命名空间不能为空';
    }
    
    if (formData.k8sType === 'aws') {
      if (!formData.awsConfig.region) errors.awsRegion = 'AWS区域不能为空';
      if (!formData.awsConfig.accessKey) errors.awsAccessKey = 'AWS Access Key不能为空';
      // 不再强制要求Secret Key，因为我们不显示现有值
      // 只有在提供新值时才验证必填性
      if (formData.awsConfig.secretKey && formData.awsConfig.secretKey.trim() === '') {
        errors.awsSecretKey = 'AWS Secret Key不能为空';
      }
      if (!formData.clusterName) errors.awsClusterName = 'EKS集群名称不能为空';
    } else if (formData.k8sType === 'standard') {
      // 不再强制要求k8sConf，因为我们不显示现有值
      // 只有在提供新值时才验证必填性
      if (formData.k8sConf && formData.k8sConf.trim() === '') {
        errors.k8sConf = 'K8S配置不能为空';
      }
    }
    
    if (formData.dockerRepositoryType === 'standard') {
      if (!formData.dockerRepositoryUrl.trim()) errors.dockerRepositoryUrl = 'Docker仓库URL不能为空';
      if (!formData.dockerRepositoryUsername.trim()) errors.dockerRepositoryUsername = '用户名不能为空';
      if (!formData.dockerRepositoryPassword.trim()) errors.dockerRepositoryPassword = '密码不能为空';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setError('请检查表单填写');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(
        `/api/projects/edit/${projectName}/${envName}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新失败');
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return <div className="loading">加载项目配置中...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>编辑项目配置</h1>
        <p>修改 {projectName} ({envName}) 的配置</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">项目更新成功！正在返回列表...</div>}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <h2>项目基本信息</h2>
          <div className="form-group">
            <label>项目名称</label>
            <input type="text" value={projectName} readOnly disabled />
          </div>
          <div className="form-group">
            <label>环境名称</label>
            <input type="text" value={envName} readOnly disabled />
          </div>
          
        </div>
        
        <div className="form-section">
          <h2>Kubernetes配置</h2>
          <div className="form-group">
            <label>K8S命名空间</label>
            <input
              type="text"
              name="namespace"
              value={formData.namespace}
              onChange={handleChange}
              placeholder="输入K8S命名空间"
            />
          </div>
          <div className="form-group">
            <label>K8S类型</label>
            <select
              name="k8sType"
              value={formData.k8sType}
              onChange={handleChange}
              disabled  // 不允许修改k8sType
            >
              <option value="standard">标准K8S</option>
              <option value="aws">AWS EKS</option>
            </select>
          </div>
          
          {formData.k8sType === 'standard' && (
            <div className="form-group">
              <label>K8S配置</label>
              <textarea
                name="k8sConf"
                value={formData.k8sConf}
                onChange={handleChange}
                placeholder="粘贴新的kubeconfig内容（为空时保持现有配置不变）"
                rows="10"
              />
              <small className="hint">注意：为了安全起见，现有配置不显示。只在填写新内容时更新。</small>
            </div>
          )}
          
          {formData.k8sType === 'aws' && (
            <div className="form-group">
              <label>EKS集群名称</label>
              <input
                type="text"
                value={formData.clusterName}
                readOnly  // clusterName设为只读，只能在创建时设置
                disabled
                placeholder="集群名称在创建时设置"
              />
            </div>
          )}
        </div>
        
        {/* AWS配置：与Docker仓库配置同级 */}
        {(formData.k8sType === 'aws' || formData.dockerRepositoryType === 'aws') && (
          <div className="form-section">
            <h2>AWS配置</h2>
            <div className="form-group">
              <label>AWS区域</label>
              <input
                type="text"
                value={formData.awsConfig.region}
                onChange={(e) => handleAwsConfigChange('region', e.target.value)}
                placeholder="例如: us-west-2"
              />
            </div>
            <div className="form-group">
              <label>AWS Access Key</label>
              <input
                type="text"
                value={formData.awsConfig.accessKey}
                onChange={(e) => handleAwsConfigChange('accessKey', e.target.value)}
                placeholder="输入AWS Access Key"
              />
            </div>
            <div className="form-group">
              <label>AWS Secret Key</label>
              <input
                type="password"
                value={formData.awsConfig.secretKey}
                onChange={(e) => handleAwsConfigChange('secretKey', e.target.value)}
                placeholder="输入新的AWS Secret Key（为空时保持现有配置不变）"
              />
              <small className="hint">注意：为了安全起见，现有Secret Key不显示。只在填写新内容时更新。</small>
            </div>

          </div>
        )}
        
        <div className="form-section">
          <h2>Docker仓库配置</h2>
          <div className="form-group">
            <label>Docker仓库类型</label>
            <select
              name="dockerRepositoryType"
              value={formData.dockerRepositoryType}
              onChange={handleChange}
            >
              <option value="standard">标准仓库</option>
              <option value="aws">AWS ECR</option>
            </select>
          </div>
          
          {formData.dockerRepositoryType === 'standard' && (
            <>
              <div className="form-group">
                <label>仓库URL</label>
                <input
                  type="text"
                  name="dockerRepositoryUrl"
                  value={formData.dockerRepositoryUrl}
                  onChange={handleChange}
                  placeholder="例如: registry.example.com"
                />
              </div>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  name="dockerRepositoryUsername"
                  value={formData.dockerRepositoryUsername}
                  onChange={handleChange}
                  placeholder="输入用户名"
                />
              </div>
              <div className="form-group">
                <label>密码</label>
                <input
                  type="password"
                  name="dockerRepositoryPassword"
                  value={formData.dockerRepositoryPassword}
                  onChange={handleChange}
                  placeholder="输入密码"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={handleCancel}>
            取消
          </button>
          <button type="submit" className="btn primary" disabled={submitting}>
            {submitting ? '保存中...' : '保存更改'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEdit;