import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../api/apiService';

const ProjectForm = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { t } = useTranslation();
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
      secretKey: '',
      albs: [
        {
          name: '',
          certificateARNs: [''],
          subnets: {
            ids: ['']
          }
        }
      ]
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
  
  // ALBs相关处理函数
  const updateAlb = (index, updatedAlb) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[index] = updatedAlb;
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: newAlbs
      }
    }));
  };
  
  const addAlb = () => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: [...prev.awsConfig.albs, {
          name: '',
          certificateARNs: [''],
          subnets: {
            ids: ['']
          }
        }]
      }
    }));
  };
  
  const removeAlb = (index) => {
    setFormData(prev => ({
      ...prev,
      awsConfig: {
        ...prev.awsConfig,
        albs: prev.awsConfig.albs.filter((_, i) => i !== index)
      }
    }));
  };
  
  const addCertificate = (albIndex) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[albIndex].certificateARNs.push('');
    updateAlb(albIndex, newAlbs[albIndex]);
  };
  
  const removeCertificate = (albIndex, certIndex) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[albIndex].certificateARNs = newAlbs[albIndex].certificateARNs.filter((_, i) => i !== certIndex);
    updateAlb(albIndex, newAlbs[albIndex]);
  };
  
  const addSubnet = (albIndex) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[albIndex].subnets.ids.push('');
    updateAlb(albIndex, newAlbs[albIndex]);
  };
  
  const removeSubnet = (albIndex, subnetIndex) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[albIndex].subnets.ids = newAlbs[albIndex].subnets.ids.filter((_, i) => i !== subnetIndex);
    updateAlb(albIndex, newAlbs[albIndex]);
  };
  
  const updateCertificate = (albIndex, certIndex, value) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[albIndex].certificateARNs[certIndex] = value;
    updateAlb(albIndex, newAlbs[albIndex]);
  };
  
  const updateSubnet = (albIndex, subnetIndex, value) => {
    const newAlbs = [...formData.awsConfig.albs];
    newAlbs[albIndex].subnets.ids[subnetIndex] = value;
    updateAlb(albIndex, newAlbs[albIndex]);
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.projectName.trim()) {
      newErrors.projectName = t('errors.requiredProjectName')
    }
    
    if (!formData.envName.trim()) {
      newErrors.envName = t('errors.requiredEnvName')
    }
    
    if (formData.k8sType === 'standard' && !formData.k8sConf.trim()) {
      newErrors.k8sConf = t('errors.requiredK8sConfig')
    }
    
    if (formData.k8sType === 'aws') {
      if (!formData.awsConfig.accessKey.trim()) {
        newErrors.awsAccessKey = t('errors.requiredAwsAccessKey')
      }
      if (!formData.awsConfig.secretKey.trim()) {
        newErrors.awsSecretKey = t('errors.requiredAwsSecretKey')
      }
      if (!formData.clusterName.trim()) {
        newErrors.awsClusterName = t('errors.requiredClusterName')
      }
      
      // 验证ALBs配置
      for (let i = 0; i < formData.awsConfig.albs.length; i++) {
        const alb = formData.awsConfig.albs[i];
        
        if (!alb.name.trim()) {
          newErrors[`albName_${i}`] = t('errors.albNameRequired');
        }
        
        const hasValidCert = alb.certificateARNs.some(cert => cert.trim());
        if (!hasValidCert) {
          newErrors[`certificateARNs_${i}`] = t('errors.certificateARNsRequired');
        }
        
        const hasValidSubnet = alb.subnets.ids.some(subnet => subnet.trim());
        if (!hasValidSubnet) {
          newErrors[`subnetIds_${i}`] = t('errors.subnetIdsRequired');
        }
      }
    }
    
    if (!formData.namespace.trim()) {
      newErrors.namespace = t('errors.requiredNamespace')
    }
    
    if (!formData.dockerRepositoryUrl.trim()) {
      newErrors.dockerRepositoryUrl = t('errors.requiredDockerRepoUrl')
    }
    
    if (formData.dockerRepositoryType === 'standard') {
      if (!formData.dockerRepositoryUsername.trim()) {
        newErrors.dockerRepositoryUsername = t('errors.requiredDockerUsername')
      }
      if (!formData.dockerRepositoryPassword.trim()) {
        newErrors.dockerRepositoryPassword = t('errors.requiredDockerPassword')
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 加载项目数据
  const loadProjectData = async () => {
    if (!projectId) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      const response = await api.get(`/projects/${projectId}`);
      
      // 确保albs数组存在且格式正确
      const albs = response.data.awsConfig?.albs && Array.isArray(response.data.awsConfig.albs) 
        ? response.data.awsConfig.albs 
        : [{ name: '', certificateARNs: [''], subnets: { ids: [''] } }];
      
      setFormData({
        ...response.data,
        awsConfig: {
          ...response.data.awsConfig,
          albs: albs
        }
      });
    } catch (err) {
      setError(err.message || t('errors.loadProjectFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 组件挂载时加载项目数据（编辑模式）
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);
  
  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const isValid = validateForm();
    if (!isValid) {
      setError(t('errors.checkForm'));
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const endpoint = projectId ? `/projects/${projectId}/edit` : '/projects/create';
      const method = projectId ? 'put' : 'post';
      const successMessage = projectId 
        ? `${t('projectForm.updateSuccess')}：${formData.projectName}`
        : `${t('projectForm.createSuccess')}：${formData.projectName}`;
      
      const response = await api[method](endpoint, formData);
      
      if (response.status >= 200 && response.status < 300) {
          setSuccess(successMessage);
          setTimeout(() => {
            navigate('/');
          }, 1500);
      } else {
        throw new Error(result.error || (projectId ? t('errors.updateProjectFailed') : t('errors.createProjectFailed')));
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
        <h1>{projectId ? t('projectForm.editTitle') : t('projectForm.title')}</h1>
        <p>{projectId ? t('projectForm.editDescription') : t('projectForm.description')}</p>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-section">
          <h2>{t('projectForm.basicInfo')}</h2>
          <div className="form-group">
            <label>{t('projectForm.projectName')}</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder={t('projectForm.placeholderProjectName')}
              />
            {errors.projectName && <div className="error">{errors.projectName}</div>}
          </div>
          <div className="form-group">
            <label>{t('projectForm.envName')}</label>
              <input
                type="text"
                name="envName"
                value={formData.envName}
                onChange={handleChange}
                placeholder={t('projectForm.placeholderEnvName')}
              />
            {errors.envName && <div className="error">{errors.envName}</div>}
          </div>
         
        </div>
        
        <div className="form-section">
          <h2>{t('projectForm.k8sConfig')}</h2>
           <div className="form-group">
            <label>{t('projectForm.namespace')}</label>
            <input
              type="text"
              name="namespace"
              value={formData.namespace}
              onChange={handleChange}
              placeholder={t('projectForm.placeholderNamespace')}
            />
            {errors.namespace && <div className="error">{errors.namespace}</div>}
          </div>
          <div className="form-group">
            <label>{t('projectForm.k8sType')}</label>
            <select
              name="k8sType"
              value={formData.k8sType}
              onChange={handleChange}
            >
              <option value="standard">{t('projectList.k8sTypes.standard')}</option>
              <option value="aws">{t('projectList.k8sTypes.aws')}</option>
            </select>
          </div>
          
          {formData.k8sType === 'standard' && (
            <div className="form-group">
              <label>{t('projectForm.k8sConfigContent')}</label>
              <textarea
                name="k8sConf"
                value={formData.k8sConf}
                onChange={handleChange}
                placeholder={t('projectForm.placeholderK8sConfig')}
                rows="10"
              />
              {errors.k8sConf && <div className="error">{errors.k8sConf}</div>}
            </div>
          )}
          
          {formData.k8sType === 'aws' && (
            <div className="form-group">
              <label>{t('projectForm.clusterName')}</label>
              <input
                type="text"
                name="clusterName"
                value={formData.clusterName}
                onChange={handleChange}
                placeholder={t('projectForm.placeholderClusterName')}
              />
              {errors.awsClusterName && <div className="error">{errors.awsClusterName}</div>}
            </div>
          )}
        </div>
        
        {/* AWS配置：与Docker仓库配置同级 */}
        {(formData.k8sType === 'aws' || formData.dockerRepositoryType === 'aws') && (
          <div className="form-section">
            <h2>{t('projectForm.awsConfig')}</h2>
            <div className="form-group">
              <label>{t('projectForm.awsRegion')}</label>
              <input
                type="text"
                value={formData.awsConfig.region}
                onChange={(e) => handleChange({ target: { name: 'awsConfig.region', value: e.target.value } })}
                placeholder={t('projectForm.placeholderAwsRegion')}
              />
            </div>
            <div className="form-group">
              <label>{t('projectForm.awsAccessKey')}</label>
              <input
                type="text"
                value={formData.awsConfig.accessKey}
                onChange={(e) => handleChange({ target: { name: 'awsConfig.accessKey', value: e.target.value } })}
                placeholder={t('projectForm.placeholderAwsAccessKey')}
              />
              {errors.awsAccessKey && <div className="error">{errors.awsAccessKey}</div>}
            </div>
            <div className="form-group">
              <label>{t('projectForm.awsSecretKey')}</label>
              <input
                type="password"
                value={formData.awsConfig.secretKey}
                onChange={(e) => handleChange({ target: { name: 'awsConfig.secretKey', value: e.target.value } })}
                placeholder={t('projectForm.placeholderAwsSecretKey')}
              />
              {errors.awsSecretKey && <div className="error">{errors.awsSecretKey}</div>}
            </div>
            
            {/* ALBs配置 */}
            {formData.k8sType === 'aws' && (
              <div className="form-group albs-config">
                <h3>{t('projectForm.albs')}</h3>
                {formData.awsConfig.albs.map((alb, albIndex) => (
                  <div key={albIndex} className="alb-item">
                    <div className="alb-header">
                      <label>{t('projectForm.albName')} {albIndex + 1}</label>
                      {formData.awsConfig.albs.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeAlb(albIndex)}
                        >
                          {t('common.remove')}
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      value={alb.name}
                      onChange={(e) => updateAlb(albIndex, { ...alb, name: e.target.value })}
                      placeholder={t('projectForm.albNamePlaceholder')}
                      className="form-control"
                    />
                    {errors[`albName_${albIndex}`] && (
                      <div className="error">{errors[`albName_${albIndex}`]}</div>
                    )}
                    
                    {/* Certificate ARNs */}
                    <div className="nested-group">
                      <div className="nested-header">
                        <label>{t('projectForm.certificateARNs')}</label>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => addCertificate(albIndex)}
                        >
                          {t('projectForm.addCertificate')}
                        </button>
                      </div>
                      {alb.certificateARNs.map((cert, certIndex) => (
                        <div key={certIndex} className="nested-item">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => updateCertificate(albIndex, certIndex, e.target.value)}
                            placeholder={t('projectForm.certificateARNsPlaceholder')}
                            className="form-control"
                          />
                          {alb.certificateARNs.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => removeCertificate(albIndex, certIndex)}
                            >
                              {t('common.remove')}
                            </button>
                          )}
                        </div>
                      ))}
                      {errors[`certificateARNs_${albIndex}`] && (
                        <div className="error">{errors[`certificateARNs_${albIndex}`]}</div>
                      )}
                    </div>
                    
                    {/* Subnet IDs */}
                    <div className="nested-group">
                      <div className="nested-header">
                        <label>{t('projectForm.subnetIds')}</label>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => addSubnet(albIndex)}
                        >
                          {t('projectForm.addSubnet')}
                        </button>
                      </div>
                      {alb.subnets.ids.map((subnet, subnetIndex) => (
                        <div key={subnetIndex} className="nested-item">
                          <input
                            type="text"
                            value={subnet}
                            onChange={(e) => updateSubnet(albIndex, subnetIndex, e.target.value)}
                            placeholder={t('projectForm.subnetIdsPlaceholder')}
                            className="form-control"
                          />
                          {alb.subnets.ids.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => removeSubnet(albIndex, subnetIndex)}
                            >
                              {t('common.remove')}
                            </button>
                          )}
                        </div>
                      ))}
                      {errors[`subnetIds_${albIndex}`] && (
                        <div className="error">{errors[`subnetIds_${albIndex}`]}</div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addAlb}
                >
                  {t('projectForm.addAlb')}
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="form-section">
          <h2>{t('projectForm.dockerRepoConfig')}</h2>
          <div className="form-group">
            <label>{t('projectForm.dockerRepoType')}</label>
            <select
              name="dockerRepositoryType"
              value={formData.dockerRepositoryType}
              onChange={handleChange}
            >
              <option value="standard">{t('projectList.dockerRepoTypes.standard')}</option>
              <option value="aws">{t('projectList.dockerRepoTypes.aws')}</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>{t('projectForm.dockerRepoUrl')}</label>
            <input
              type="text"
              name="dockerRepositoryUrl"
              value={formData.dockerRepositoryUrl}
              onChange={handleChange}
              placeholder={t('projectForm.placeholderDockerRepoUrl')}
            />
            {errors.dockerRepositoryUrl && <div className="error">{errors.dockerRepositoryUrl}</div>}
          </div>
          
          {formData.dockerRepositoryType === 'standard' && (
            <>
              <div className="form-group">
                <label>{t('projectForm.username')}</label>
              <input
                type="text"
                name="dockerRepositoryUsername"
                value={formData.dockerRepositoryUsername}
                onChange={handleChange}
                placeholder={t('projectForm.placeholderUsername')}
              />
                {errors.dockerRepositoryUsername && <div className="error">{errors.dockerRepositoryUsername}</div>}
              </div>
              <div className="form-group">
                <label>{t('projectForm.password')}</label>
              <input
                type="password"
                name="dockerRepositoryPassword"
                value={formData.dockerRepositoryPassword}
                onChange={handleChange}
                placeholder={t('projectForm.placeholderPassword')}
              />
                {errors.dockerRepositoryPassword && <div className="error">{errors.dockerRepositoryPassword}</div>}
              </div>
            </>
          )}
        </div>
        
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={handleCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn primary" disabled={isSubmitting}>
            {isSubmitting ? (projectId ? t('common.updating') + '...' : t('common.creating') + '...') : 
             (projectId ? t('projectForm.updateProject') : t('projectForm.createProject'))}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ProjectForm