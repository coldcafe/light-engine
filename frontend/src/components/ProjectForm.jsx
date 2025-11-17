import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ProjectForm = () => {
  const navigate = useNavigate();
  // 表单状态
  const [formData, setFormData] = useState({
    projectName: '',
    envName: '',
    k8sType: 'standard',
    k8sConf: '',
    clusterName: '',
    awsConfig: {
      region: 'us-east-1',
      accessKey: '',
      secretKey: ''
    },
    namespace: '',
    dockerRepositoryType: 'standard',
    dockerRepositoryUrl: '',
    dockerRepositoryUsername: '',
    dockerRepositoryPassword: ''
  })

  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // 处理表单输入变化
  const handleChange = (e) => {
    const { name, value } = e.target
    
    // 处理嵌套对象属性
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // 清除对应的错误信息
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // 验证表单
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = '请输入项目名称'
    }
    
    if (!formData.envName.trim()) {
      newErrors.envName = '请输入环境名称'
    }
    
    if (formData.k8sType === 'standard' && !formData.k8sConf.trim()) {
      newErrors.k8sConf = '请输入K8S配置内容'
    }
    
    if (formData.k8sType === 'aws') {
      if (!formData.awsConfig.accessKey.trim()) {
        newErrors.awsAccessKey = '请输入AWS访问密钥'
      }
      if (!formData.awsConfig.secretKey.trim()) {
        newErrors.awsSecretKey = '请输入AWS密钥'
      }
      if (!formData.clusterName.trim()) {
        newErrors.awsClusterName = '请输入EKS集群名称'
      }
    }
    
    if (!formData.namespace.trim()) {
      newErrors.namespace = '请输入K8S命名空间'
    }
    
    if (!formData.dockerRepositoryUrl.trim()) {
      newErrors.dockerRepositoryUrl = '请输入Docker仓库URL'
    }
    
    if (formData.dockerRepositoryType === 'standard') {
      if (!formData.dockerRepositoryUsername.trim()) {
        newErrors.dockerRepositoryUsername = '请输入Docker仓库用户名'
      }
      if (!formData.dockerRepositoryPassword.trim()) {
        newErrors.dockerRepositoryPassword = '请输入Docker仓库密码'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isValid = validateForm();
    if (!isValid) {
      setError('请检查表单填写');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok) {
          setSuccess(`项目创建成功！配置保存在：${result.projectPath}`);
          setTimeout(() => {
            navigate('/');
          }, 1500);
      } else {
        throw new Error(result.error || '创建项目失败');
      }
    } catch (err) {
      setError(err.message);
      setSuccess('');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleCancel = () => {
    navigate('/');
  }

  return (
    <div className="container">
      <div className="header">
        <h1>创建新项目配置</h1>
        <p>填写以下信息创建新的项目配置</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <h2>项目基本信息</h2>
          <div className="form-group">
            <label>项目名称</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              placeholder="请输入项目名称"
            />
            {errors.projectName && <div className="error">{errors.projectName}</div>}
          </div>
          <div className="form-group">
            <label>环境名称</label>
            <input
              type="text"
              name="envName"
              value={formData.envName}
              onChange={handleChange}
              placeholder="默认: prod"
            />
            {errors.envName && <div className="error">{errors.envName}</div>}
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
              placeholder="请输入K8S命名空间"
            />
            {errors.namespace && <div className="error">{errors.namespace}</div>}
          </div>
          <div className="form-group">
            <label>K8S类型</label>
            <select
              name="k8sType"
              value={formData.k8sType}
              onChange={handleChange}
            >
              <option value="standard">标准K8S</option>
              <option value="aws">AWS EKS</option>
            </select>
          </div>
          
          {formData.k8sType === 'standard' && (
            <div className="form-group">
              <label>K8S配置内容</label>
              <textarea
                name="k8sConf"
                value={formData.k8sConf}
                onChange={handleChange}
                placeholder="请粘贴kubeconfig内容"
                rows="10"
              />
              {errors.k8sConf && <div className="error">{errors.k8sConf}</div>}
            </div>
          )}
          
          {formData.k8sType === 'aws' && (
            <div className="form-group">
              <label>EKS集群名称</label>
              <input
                type="text"
                name="clusterName"
                value={formData.clusterName}
                onChange={handleChange}
                placeholder="请输入EKS集群名称"
              />
              {errors.awsClusterName && <div className="error">{errors.awsClusterName}</div>}
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
                onChange={(e) => handleChange({ target: { name: 'awsConfig.region', value: e.target.value } })}
                placeholder="例如: us-west-2"
              />
            </div>
            <div className="form-group">
              <label>AWS Access Key</label>
              <input
                type="text"
                value={formData.awsConfig.accessKey}
                onChange={(e) => handleChange({ target: { name: 'awsConfig.accessKey', value: e.target.value } })}
                placeholder="输入AWS Access Key"
              />
              {errors.awsAccessKey && <div className="error">{errors.awsAccessKey}</div>}
            </div>
            <div className="form-group">
              <label>AWS Secret Key</label>
              <input
                type="password"
                value={formData.awsConfig.secretKey}
                onChange={(e) => handleChange({ target: { name: 'awsConfig.secretKey', value: e.target.value } })}
                placeholder="输入AWS Secret Key"
              />
              {errors.awsSecretKey && <div className="error">{errors.awsSecretKey}</div>}
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
          
          <div className="form-group">
            <label>Docker仓库URL</label>
            <input
              type="text"
              name="dockerRepositoryUrl"
              value={formData.dockerRepositoryUrl}
              onChange={handleChange}
              placeholder="例如: registry.example.com"
            />
            {errors.dockerRepositoryUrl && <div className="error">{errors.dockerRepositoryUrl}</div>}
          </div>
          
          {formData.dockerRepositoryType === 'standard' && (
            <>
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  name="dockerRepositoryUsername"
                  value={formData.dockerRepositoryUsername}
                  onChange={handleChange}
                  placeholder="输入用户名"
                />
                {errors.dockerRepositoryUsername && <div className="error">{errors.dockerRepositoryUsername}</div>}
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
                {errors.dockerRepositoryPassword && <div className="error">{errors.dockerRepositoryPassword}</div>}
              </div>
            </>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={handleCancel}>
            取消
          </button>
          <button type="submit" className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? '创建中...' : '创建项目'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm